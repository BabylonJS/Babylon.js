import { StorageBuffer } from "core/Buffers/storageBuffer";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import type { Effect } from "core/Materials/effect";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { TmpColors } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { CreateSphere } from "core/Meshes/Builders/sphereBuilder";
import type { Mesh } from "core/Meshes/mesh";
import { _WarnImport } from "core/Misc/devTools";
import { Logger } from "core/Misc/logger";
import type { Observer } from "core/Misc/observable";
import { CeilingPOT } from "core/Misc/tools.functions";
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

    /** @internal */
    public readonly _tileMaskTarget: RenderTargetTexture;
    private _tileMaskBuffer: Nullable<StorageBuffer>;
    private _tileMaskStride = 0;
    private readonly _resizeObserver: Observer<AbstractEngine>;

    private _tileWidth = 128;
    public get tileWidth(): number {
        return this._tileWidth;
    }

    public set tileWidth(width: number) {
        if (this._tileWidth === width) {
            return;
        }
        this._tileWidth = width;
        this._tileMaskBuffer?.dispose();
        this._tileMaskBuffer = null;
    }

    private _tileHeight = 128;
    public get tileHeight(): number {
        return this._tileHeight;
    }

    public set tileHeight(height: number) {
        if (this._tileHeight === height) {
            return;
        }
        this._tileHeight = height;
        this._tileMaskBuffer?.dispose();
        this._tileMaskBuffer = null;
    }

    private readonly _proxyMesh: Mesh;
    private readonly _proxyMatrixBuffer: Float32Array;

    constructor(name: string, lights: Light[] = [], scene?: Scene) {
        super(name, scene);

        const engine = this.getEngine();
        this.maxLights = ClusteredLight._GetEngineMaxLights(engine);
        const getRenderSize = () => ({
            width: engine.getRenderWidth(true),
            height: engine.getRenderHeight(true),
        });

        this._tileMaskTarget = new RenderTargetTexture("TileMask", getRenderSize(), this._scene, {
            generateDepthBuffer: true,
            generateStencilBuffer: true,
            noColorAttachment: true,
        });
        this._tileMaskTarget.renderList = null;
        this._tileMaskTarget.renderParticles = false;
        this._tileMaskTarget.renderSprites = false;
        this._tileMaskTarget.noPrePassRenderer = true;
        // Use the default render list
        this._tileMaskTarget.renderList = null;
        this._tileMaskTarget.customRenderFunction = this._renderTileMask;

        this._tileMaskTarget.onClearObservable.add(() => {
            // If its already created it should be the correct size
            const buffer = this._tileMaskBuffer ?? this._createTileMaskBuffer();
            buffer.clear();
            engine.clear(null, false, true, true);
        });

        // This forces materials to run as a depth prepass
        this._tileMaskTarget.onBeforeRenderObservable.add(() => engine.setColorWrite(false));
        this._tileMaskTarget.onAfterRenderObservable.add(() => engine.setColorWrite(true));

        this._resizeObserver = engine.onResizeObservable.add(() => {
            this._tileMaskTarget.resize(getRenderSize());
            if (this._tileMaskBuffer) {
                // Update the buffer size
                this._createTileMaskBuffer();
            }
        });

        this._proxyMesh = CreateSphere("LightProxy", { diameter: 2, segments: 8 }, this._scene);
        this._proxyMesh.isVisible = false;
        this._proxyMesh.material = new LightProxyMaterial("ProxyMaterial", this);

        this._proxyMatrixBuffer = new Float32Array(this.maxLights * 16);
        this._proxyMesh.thinInstanceSetBuffer("matrix", this._proxyMatrixBuffer, 16, false);

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

    public override dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        for (const light of this._lights) {
            light.dispose(doNotRecurse, disposeMaterialAndTextures);
        }

        this._tileMaskTarget.dispose();
        this._tileMaskBuffer?.dispose();
        this._resizeObserver.remove();

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
    }

    private _createTileMaskBuffer(): StorageBuffer {
        const engine = this.getEngine();
        this._tileMaskStride = Math.ceil(engine.getRenderWidth(true) / this._tileWidth);
        const tilesY = Math.ceil(engine.getRenderHeight(true) / this._tileHeight);
        const size = this._tileMaskStride * tilesY * 4;
        if (!this._tileMaskBuffer || this._tileMaskBuffer.getBuffer().capacity < size) {
            this._tileMaskBuffer?.dispose();
            this._tileMaskBuffer = new StorageBuffer(<WebGPUEngine>engine, CeilingPOT(size));
        }
        return this._tileMaskBuffer;
    }

    public override _isReady(): boolean {
        return this._proxyMesh.isReady(true, true);
    }

    protected _buildUniformLayout(): void {
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

    public transferToEffect(effect: Effect, lightIndex: string): Light {
        const len = Math.min(this._lights.length, this.maxLights);
        this._uniformBuffer.updateFloat4("vLightData", this._tileWidth, this._tileHeight, this._tileMaskStride, len, lightIndex);

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
        (<WebGPUEngine>this.getEngine()).setStorageBuffer("tileMaskBuffer" + lightIndex, this._tileMaskBuffer);
        return this;
    }

    public transferToNodeMaterialEffect(): Light {
        // TODO: ????
        return this;
    }

    public prepareLightSpecificDefines(defines: any, lightIndex: number): void {
        defines["CLUSTLIGHT" + lightIndex] = true;
        defines["CLUSTLIGHT_MAX"] = this.maxLights;
    }

    private _renderTileMask: RenderTargetTexture["customRenderFunction"] = (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes, depthOnlySubMeshes, beforeTransparents) => {
        const len = Math.min(this._lights.length, this.maxLights);
        if (len === 0) {
            // Theres no lights to render
            return;
        }

        for (let i = 0; i < depthOnlySubMeshes.length; i += 1) {
            depthOnlySubMeshes.data[i].render(false);
        }
        // TODO: skip meshes that were already drawn during `depthOnly`
        for (let i = 0; i < opaqueSubMeshes.length; i += 1) {
            opaqueSubMeshes.data[i].render(false);
        }
        for (let i = 0; i < alphaTestSubMeshes.length; i += 1) {
            alphaTestSubMeshes.data[i].render(false);
        }

        beforeTransparents?.();
        // TODO: draw transparents

        this._proxyMesh.thinInstanceCount = len;
        for (let i = 0; i < len; i += 1) {
            const light = this._lights[i];
            // TODO: cache matrices, somehow detect unchanged?
            // TODO: scale by range of light
            // TODO: rotate spotlights to face direction
            light.getWorldMatrix().copyToArray(this._proxyMatrixBuffer, i * 16);
        }
        this._proxyMesh.thinInstanceBufferUpdated("matrix");
        this._proxyMesh.render(this._proxyMesh.subMeshes[0], false);
    };
}
