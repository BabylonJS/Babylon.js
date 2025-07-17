import { StorageBuffer } from "core/Buffers/storageBuffer";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import type { Effect } from "core/Materials/effect";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { TmpColors } from "core/Maths/math.color";
import { Matrix, TmpVectors, Vector3 } from "core/Maths/math.vector";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "core/Meshes/mesh";
import { _WarnImport } from "core/Misc/devTools";
import { Logger } from "core/Misc/logger";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import { LightProxyMaterial } from "./lightProxyMaterial";
import { Light } from "../light";
import { LightConstants } from "../lightConstants";
import { PointLight } from "../pointLight";
import { SpotLight } from "../spotLight";

import "core/Meshes/thinInstanceMesh";

export class ClusteredLight extends Light {
    private static _GetEngineMaxLights(engine: AbstractEngine): number {
        const caps = engine._caps;
        if (!engine.supportsUniformBuffers || !caps.texelFetch) {
            return 0;
        } else if (engine.isWebGPU) {
            // On WebGPU we use atomic writes to storage textures
            return 32;
        } else if (engine.version > 1) {
            // On WebGL 2 we use additive float blending as the light mask
            if (!caps.colorBufferFloat || !caps.blendFloat) {
                return 0;
            }
            // Due to the use of floats we want to limit lights to the precision of floats
            return caps.shaderFloatPrecision;
        } else {
            // WebGL 1 is not supported due to lack of dynamic for loops
            return 0;
        }
    }

    public static IsLightSupported(light: Light): boolean {
        if (ClusteredLight._GetEngineMaxLights(light.getEngine()) === 0) {
            return false;
        } else if (light.shadowEnabled && light._scene.shadowsEnabled && light.getShadowGenerators()) {
            // Shadows are not supported
            return false;
        } else if (light instanceof PointLight) {
            return true;
        } else if (light instanceof SpotLight) {
            // Extra texture bindings per light are not supported
            return !light.projectionTexture && !light.iesProfileTexture;
        } else {
            // Currently only point and spot lights are supported
            return false;
        }
    }

    /** @internal */
    public static _SceneComponentInitialization: (scene: Scene) => void = () => {
        throw _WarnImport("ClusteredLightSceneComponent");
    };

    public readonly maxLights: number;

    public get isSupported(): boolean {
        return this.maxLights > 0;
    }

    private readonly _lights: (PointLight | SpotLight)[] = [];
    public get lights(): readonly Light[] {
        return this._lights;
    }

    private _tileMaskTexture: Nullable<RenderTargetTexture>;
    private _tileMaskBuffer: Nullable<StorageBuffer>;

    private _horizontalTiles = 64;
    public get horizontalTiles(): number {
        return this._horizontalTiles;
    }

    public set horizontalTiles(horizontal: number) {
        if (this._horizontalTiles === horizontal) {
            return;
        }
        this._horizontalTiles = horizontal;
        this._disposeTileMask();
    }

    private _verticalTiles = 64;
    public get verticalTiles(): number {
        return this._verticalTiles;
    }

    public set verticalTiles(vertical: number) {
        if (this._verticalTiles === vertical) {
            return;
        }
        this._verticalTiles = vertical;
        this._disposeTileMask();
    }

    private _proxyMesh: Mesh;
    private readonly _proxyMatrixBuffer: Float32Array;
    private _proxyRenderId = -1;

    private _proxySegments = 4;
    public get proxySegments(): number {
        return this._proxySegments;
    }

    public set proxySegments(segments: number) {
        if (this._proxySegments === segments) {
            return;
        }
        this._proxyMesh.dispose(false, true);
        this._createProxyMesh();
    }

    private _maxRange = 16383;
    public get maxRange(): number {
        return this._maxRange;
    }

    public set maxRange(range: number) {
        if (this._maxRange === range) {
            return;
        }
        this._maxRange = range;
        // Cause the matrix buffer to update
        this._proxyRenderId = -1;
    }

    constructor(name: string, lights: Light[] = [], scene?: Scene) {
        super(name, scene);
        this.maxLights = ClusteredLight._GetEngineMaxLights(this.getEngine());

        this._proxyMatrixBuffer = new Float32Array(this.maxLights * 16);
        this._createProxyMesh();

        if (this.maxLights > 0) {
            ClusteredLight._SceneComponentInitialization(this._scene);
            for (const light of lights) {
                this.addLight(light);
            }
        }
    }

    public override getClassName(): string {
        return "ClusteredLight";
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public override getTypeID(): number {
        return LightConstants.LIGHTTYPEID_CLUSTERED;
    }

    private _updateMatrixBuffer(): void {
        const renderId = this._scene.getRenderId();
        if (this._proxyRenderId === renderId) {
            // Prevent updates in the same render
            return;
        }
        this._proxyRenderId = renderId;

        const len = Math.min(this._lights.length, this.maxLights);
        if (len === 0) {
            // Nothing to render
            this._proxyMesh.isVisible = false;
            return;
        }

        this._proxyMesh.isVisible = true;
        this._proxyMesh.thinInstanceCount = len;
        for (let i = 0; i < len; i += 1) {
            const light = this._lights[i];
            let matrix = light.getWorldMatrix();

            // Scale by the range of the light
            const range = Math.min(light.range, this.maxRange);
            const scaling = Matrix.ScalingToRef(range, range, range, TmpVectors.Matrix[0]);
            matrix = scaling.multiplyToRef(matrix, TmpVectors.Matrix[1]);

            // TODO: rotate spotlights to face direction
            matrix.copyToArray(this._proxyMatrixBuffer, i * 16);
        }
        this._proxyMesh.thinInstanceBufferUpdated("matrix");
    }

    /** @internal */
    public _createTileMask(): RenderTargetTexture {
        if (this._tileMaskTexture) {
            return this._tileMaskTexture;
        }

        const engine = this.getEngine();
        const textureSize = { width: this._horizontalTiles, height: this._verticalTiles };
        this._tileMaskTexture = new RenderTargetTexture("TileMaskTexture", textureSize, this._scene, {
            // We don't write anything on WebGPU so make it as small as possible
            type: engine.isWebGPU ? Constants.TEXTURETYPE_UNSIGNED_BYTE : Constants.TEXTURETYPE_FLOAT,
            format: Constants.TEXTUREFORMAT_RED,
            generateDepthBuffer: false,
        });

        this._tileMaskTexture.renderParticles = false;
        this._tileMaskTexture.renderSprites = false;
        this._tileMaskTexture.noPrePassRenderer = true;
        this._tileMaskTexture.renderList = [this._proxyMesh];

        this._tileMaskTexture.onBeforeBindObservable.add(() => this._updateMatrixBuffer());

        this._tileMaskTexture.onClearObservable.add(() => {
            // Clear the storage buffer if it exists
            this._tileMaskBuffer?.clear();
            engine.clear({ r: 0, g: 0, b: 0, a: 1 }, true, false);
        });

        if (engine.isWebGPU) {
            // WebGPU also needs a storage buffer to write to
            const bufferSize = this._horizontalTiles * this._verticalTiles * 4;
            this._tileMaskBuffer = new StorageBuffer(<WebGPUEngine>engine, bufferSize);
        }

        return this._tileMaskTexture;
    }

    private _disposeTileMask(): void {
        this._tileMaskTexture?.dispose();
        this._tileMaskTexture = null;
        this._tileMaskBuffer?.dispose();
        this._tileMaskBuffer = null;
    }

    private _createProxyMesh(): void {
        this._proxyMesh = CreateSphere("ProxyMesh", { diameter: 2, segments: this._proxySegments }, this._scene);
        // Make sure it doesn't render for the default scene
        this._scene.removeMesh(this._proxyMesh);
        if (this._tileMaskTexture) {
            this._tileMaskTexture.renderList = [this._proxyMesh];
        }

        this._proxyMesh.material = new LightProxyMaterial("ProxyMeshMaterial", this);
        this._proxyMesh.thinInstanceSetBuffer("matrix", this._proxyMatrixBuffer, 16, false);
    }

    public override dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        for (const light of this._lights) {
            light.dispose(doNotRecurse, disposeMaterialAndTextures);
        }

        this._disposeTileMask();

        this._proxyMesh.dispose(doNotRecurse, disposeMaterialAndTextures);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public addLight(light: Light): void {
        if (!ClusteredLight.IsLightSupported(light)) {
            Logger.Warn("Attempting to add a light to cluster that does not support clustering");
            return;
        } else if (this._lights.length === this.maxLights) {
            // Only log this once (hence equals) but add the light anyway
            Logger.Warn(`Attempting to add more lights to cluster than what is supported (${this.maxLights})`);
        }
        this._scene.removeLight(light);
        this._lights.push(<PointLight | SpotLight>light);
        // Cause the matrix buffer to update
        this._proxyRenderId = -1;
    }

    protected override _buildUniformLayout(): void {
        // We can't use `this.maxLights` since this will get called during construction
        const maxLights = ClusteredLight._GetEngineMaxLights(this.getEngine());

        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        for (let i = 0; i < maxLights; i += 1) {
            // These technically don't have to match the field name but also why not
            const struct = `vLights[${i}].`;
            this._uniformBuffer.addUniform(struct + "position", 4);
            this._uniformBuffer.addUniform(struct + "direction", 4);
            this._uniformBuffer.addUniform(struct + "diffuse", 4);
            this._uniformBuffer.addUniform(struct + "specular", 4);
            this._uniformBuffer.addUniform(struct + "falloff", 4);
        }
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    public override transferToEffect(effect: Effect, lightIndex: string): Light {
        const engine = this.getEngine();
        const hscale = this._horizontalTiles / engine.getRenderWidth();
        const vscale = this._verticalTiles / engine.getRenderHeight();

        const len = Math.min(this._lights.length, this.maxLights);
        this._uniformBuffer.updateFloat4("vLightData", hscale, vscale, this._horizontalTiles, len, lightIndex);

        for (let i = 0; i < len; i += 1) {
            const light = this._lights[i];
            const spotLight = light instanceof SpotLight ? light : null;
            const struct = `vLights[${i}].`;

            let position: Vector3;
            let direction: Vector3;
            if (light.computeTransformedInformation()) {
                position = light.transformedPosition;
                direction = Vector3.Normalize(light.transformedDirection);
            } else {
                position = light.position;
                direction = Vector3.Normalize(light.direction);
            }
            this._uniformBuffer.updateFloat4(struct + "position", position.x, position.y, position.z, spotLight?.exponent ?? 0, lightIndex);
            this._uniformBuffer.updateFloat4(struct + "direction", direction.x, direction.y, direction.z, spotLight?._cosHalfAngle ?? -1, lightIndex);

            const scaledIntensity = light.getScaledIntensity();
            light.diffuse.scaleToRef(scaledIntensity, TmpColors.Color3[0]);
            this._uniformBuffer.updateColor4(struct + "diffuse", TmpColors.Color3[0], light.range, lightIndex);
            light.specular.scaleToRef(scaledIntensity, TmpColors.Color3[1]);
            this._uniformBuffer.updateColor4(struct + "specular", TmpColors.Color3[1], light.radius, lightIndex);

            this._uniformBuffer.updateFloat4(
                struct + "falloff",
                light.range,
                light._inverseSquaredRange,
                spotLight?._lightAngleScale ?? 0,
                spotLight?._lightAngleOffset ?? 0,
                lightIndex
            );
        }
        return this;
    }

    public override transferTexturesToEffect(effect: Effect, lightIndex: string): Light {
        const engine = this.getEngine();
        if (engine.isWebGPU) {
            (<WebGPUEngine>this.getEngine()).setStorageBuffer("tileMaskBuffer" + lightIndex, this._tileMaskBuffer);
        } else {
            effect.setTexture("tileMaskTexture" + lightIndex, this._tileMaskTexture);
        }
        return this;
    }

    public override transferToNodeMaterialEffect(): Light {
        // TODO: ????
        return this;
    }

    public override prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["CLUSTLIGHT" + lightIndex] = true;
        defines["CLUSTLIGHT_MAX"] = this.maxLights;
    }

    public override _isReady(): boolean {
        return this._proxyMesh.isReady(true, true);
    }
}
