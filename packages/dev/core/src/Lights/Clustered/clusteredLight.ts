import { StorageBuffer } from "core/Buffers/storageBuffer";
import { Constants } from "core/Engines/constants";
import type { AbstractEngine } from "core/Engines/abstractEngine";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";
import type { Effect } from "core/Materials/effect";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { ShaderMaterial } from "core/Materials/shaderMaterial";
import { RawTexture } from "core/Materials/Textures/rawTexture";
import { RenderTargetTexture } from "core/Materials/Textures/renderTargetTexture";
import { TmpColors } from "core/Maths/math.color";
import { Vector3 } from "core/Maths/math.vector";
import { CreateDisc } from "core/Meshes/Builders/discBuilder";
import type { Mesh } from "core/Meshes/mesh";
import { _WarnImport } from "core/Misc/devTools";
import { Logger } from "core/Misc/logger";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import { Light } from "../light";
import { LightConstants } from "../lightConstants";
import { PointLight } from "../pointLight";
import { SpotLight } from "../spotLight";

import "core/Meshes/thinInstanceMesh";

export class ClusteredLight extends Light {
    private static _GetEngineBatchSize(engine: AbstractEngine): number {
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
        if (ClusteredLight._GetEngineBatchSize(light.getEngine()) === 0) {
            return false;
        } else if (light.shadowEnabled && light._scene.shadowsEnabled && light.getShadowGenerators()) {
            // Shadows are not supported
            return false;
        } else if (light.falloffType !== Light.FALLOFF_DEFAULT) {
            // Only the default falloff is supported
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

    private readonly _batchSize: number;

    public get isSupported(): boolean {
        return this._batchSize > 0;
    }

    private readonly _lights: (PointLight | SpotLight)[] = [];
    public get lights(): readonly Light[] {
        return this._lights;
    }

    private _lightDataBuffer: Float32Array;
    private _lightDataTexture: RawTexture;

    private _tileMaskBatches = -1;
    private _tileMaskTexture: RenderTargetTexture;
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
        // Force the batch data to be recreated
        this._tileMaskBatches = -1;
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
        // Force the batch data to be recreated
        this._tileMaskBatches = -1;
    }

    private readonly _proxyMaterial: ShaderMaterial;
    private _proxyMesh: Mesh;

    private _proxyTesselation = 8;
    public get proxyTesselation(): number {
        return this._proxyTesselation;
    }

    public set proxyTesselation(tesselation: number) {
        if (this._proxyTesselation === tesselation) {
            return;
        }
        this._proxyTesselation = tesselation;
        this._proxyMesh.dispose();
        this._createProxyMesh();
    }

    private _maxRange = 16383;
    private _minInverseSquaredRange = 1 / (this._maxRange * this._maxRange);
    public get maxRange(): number {
        return this._maxRange;
    }

    public set maxRange(range: number) {
        if (this._maxRange === range) {
            return;
        }
        this._maxRange = range;
        this._minInverseSquaredRange = 1 / (range * range);
    }

    constructor(name: string, lights: Light[] = [], scene?: Scene) {
        super(name, scene);
        const engine = this.getEngine();
        this._batchSize = ClusteredLight._GetEngineBatchSize(engine);

        const proxyShader = { vertex: "lightProxy", fragment: "lightProxy" };
        this._proxyMaterial = new ShaderMaterial("ProxyMaterial", this._scene, proxyShader, {
            attributes: ["position"],
            uniforms: ["tileMaskResolution"],
            samplers: ["lightDataTexture"],
            uniformBuffers: ["Scene"],
            storageBuffers: ["tileMaskBuffer"],
            defines: [`CLUSTLIGHT_BATCH ${this._batchSize}`],
            shaderLanguage: engine.isWebGPU ? ShaderLanguage.WGSL : ShaderLanguage.GLSL,
            extraInitializationsAsync: async () => {
                if (engine.isWebGPU) {
                    await Promise.all([import("../../ShadersWGSL/lightProxy.vertex"), import("../../ShadersWGSL/lightProxy.fragment")]);
                } else {
                    await Promise.all([import("../../Shaders/lightProxy.vertex"), import("../../Shaders/lightProxy.fragment")]);
                }
            },
        });

        // Additive blending is for merging masks on WebGL
        this._proxyMaterial.transparencyMode = ShaderMaterial.MATERIAL_ALPHABLEND;
        this._proxyMaterial.alphaMode = Constants.ALPHA_ADD;

        this._createProxyMesh();
        this._updateBatches();

        if (this._batchSize > 0) {
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

    private _createProxyMesh(): void {
        // The disc is made of `tesselation` isoceles triangles, and the lowest radius is the height of one of those triangles
        // We can get the height from half the angle of that triangle (assuming a side length of 1)
        const lowRadius = Math.cos(Math.PI / this._proxyTesselation);
        // We scale up the disc so the lowest radius still wraps the light
        this._proxyMesh = CreateDisc("ProxyMesh", { radius: 1 / lowRadius, tessellation: this._proxyTesselation });
        // Make sure it doesn't render for the default scene
        this._scene.removeMesh(this._proxyMesh);
        this._proxyMesh.material = this._proxyMaterial;

        if (this._tileMaskBatches > 0) {
            this._tileMaskTexture.renderList = [this._proxyMesh];

            // We don't actually use the matrix data but we need enough capacity for the lights
            this._proxyMesh.thinInstanceSetBuffer("matrix", new Float32Array(this._tileMaskBatches * this._batchSize * 16));
            this._proxyMesh.thinInstanceCount = this._lights.length;
            this._proxyMesh.isVisible = this._lights.length > 0;
        }
    }

    /** @internal */
    public _updateBatches(): RenderTargetTexture {
        this._proxyMesh.isVisible = this._lights.length > 0;

        // Ensure space for atleast 1 batch
        const batches = Math.max(Math.ceil(this._lights.length / this._batchSize), 1);
        if (this._tileMaskBatches >= batches) {
            this._proxyMesh.thinInstanceCount = this._lights.length;
            return this._tileMaskTexture;
        }
        const engine = this.getEngine();
        // Round up to a batch size so we don't have to reallocate as often
        const maxLights = batches * this._batchSize;

        this._lightDataBuffer = new Float32Array(20 * maxLights);
        this._lightDataTexture?.dispose();
        this._lightDataTexture = new RawTexture(
            this._lightDataBuffer,
            5,
            maxLights,
            Constants.TEXTUREFORMAT_RGBA,
            this._scene,
            false,
            false,
            Constants.TEXTURE_NEAREST_SAMPLINGMODE,
            Constants.TEXTURETYPE_FLOAT
        );
        this._proxyMaterial.setTexture("lightDataTexture", this._lightDataTexture);

        this._tileMaskTexture?.dispose();
        const textureSize = { width: this._horizontalTiles, height: this._verticalTiles };
        if (!engine.isWebGPU) {
            // In WebGL we shift the light proxy by the batch number
            textureSize.height *= batches;
        }
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

        this._tileMaskTexture.onBeforeBindObservable.add(() => {
            this._updateLightData();
        });

        this._tileMaskTexture.onClearObservable.add(() => {
            // Clear the storage buffer if it exists
            this._tileMaskBuffer?.clear();
            engine.clear({ r: 0, g: 0, b: 0, a: 1 }, true, false);
        });

        if (engine.isWebGPU) {
            // WebGPU also needs a storage buffer to write to
            this._tileMaskBuffer?.dispose();
            const bufferSize = this._horizontalTiles * this._verticalTiles * batches * 4;
            this._tileMaskBuffer = new StorageBuffer(<WebGPUEngine>engine, bufferSize);
            this._proxyMaterial.setStorageBuffer("tileMaskBuffer", this._tileMaskBuffer);
        }

        this._proxyMaterial.setVector3("tileMaskResolution", new Vector3(this._horizontalTiles, this.verticalTiles, batches));

        // We don't actually use the matrix data but we need enough capacity for the lights
        this._proxyMesh.thinInstanceSetBuffer("matrix", new Float32Array(maxLights * 16));
        this._proxyMesh.thinInstanceCount = this._lights.length;
        this._tileMaskBatches = batches;
        return this._tileMaskTexture;
    }

    private _updateLightData(): void {
        for (let i = 0; i < this._lights.length; i += 1) {
            const light = this._lights[i];
            const offset = i * 20;
            const computed = light.computeTransformedInformation();
            const scaledIntensity = light.getScaledIntensity();

            const position = computed ? light.transformedPosition : light.position;
            const diffuse = light.diffuse.scaleToRef(scaledIntensity, TmpColors.Color3[0]);
            const specular = light.specular.scaleToRef(scaledIntensity, TmpColors.Color3[1]);
            const range = Math.min(light.range, this.maxRange);
            const inverseSquaredRange = Math.max(light._inverseSquaredRange, this._minInverseSquaredRange);
            this._lightDataBuffer.set(
                [
                    // vLightData
                    position.x,
                    position.y,
                    position.z,
                    0,
                    // vLightDiffuse
                    diffuse.r,
                    diffuse.g,
                    diffuse.b,
                    range,
                    // vLightSpecular
                    specular.r,
                    specular.g,
                    specular.b,
                    light.radius,
                    // vLightDirection
                    0,
                    1,
                    0,
                    -1,
                    // vLightFalloff
                    range,
                    inverseSquaredRange,
                    0.5,
                    0.5,
                ],
                offset
            );

            if (light instanceof SpotLight) {
                const direction = Vector3.Normalize(computed ? light.transformedDirection : light.direction);
                this._lightDataBuffer[offset + 3] = light.exponent; // vLightData.a
                this._lightDataBuffer.set([direction.x, direction.y, direction.z, light._cosHalfAngle], offset + 12); // vLightDirection
                this._lightDataBuffer.set([light._lightAngleScale, light._lightAngleOffset], offset + 18); // vLightFalloff.zw
            }
        }
        this._lightDataTexture.update(this._lightDataBuffer);
    }

    public override dispose(doNotRecurse?: boolean, disposeMaterialAndTextures?: boolean): void {
        for (const light of this._lights) {
            light.dispose(doNotRecurse, disposeMaterialAndTextures);
        }
        this._lightDataTexture.dispose();
        this._tileMaskTexture.dispose();
        this._tileMaskBuffer?.dispose();
        this._proxyMesh.dispose(doNotRecurse, disposeMaterialAndTextures);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    public addLight(light: Light): void {
        if (!ClusteredLight.IsLightSupported(light)) {
            Logger.Warn("Attempting to add a light to cluster that does not support clustering");
            return;
        }
        this._scene.removeLight(light);
        this._lights.push(<PointLight | SpotLight>light);

        this._proxyMesh.isVisible = true;
        this._proxyMesh.thinInstanceCount = this._lights.length;
    }

    protected override _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("vLightData", 4);
        this._uniformBuffer.addUniform("vLightDiffuse", 4);
        this._uniformBuffer.addUniform("vLightSpecular", 4);
        this._uniformBuffer.addUniform("vNumLights", 1);
        this._uniformBuffer.addUniform("shadowsInfo", 3);
        this._uniformBuffer.addUniform("depthValues", 2);
        this._uniformBuffer.create();
    }

    public override transferToEffect(effect: Effect, lightIndex: string): Light {
        const engine = this.getEngine();
        const hscale = this._horizontalTiles / engine.getRenderWidth();
        const vscale = this._verticalTiles / engine.getRenderHeight();
        this._uniformBuffer.updateFloat4("vLightData", this._horizontalTiles, this._verticalTiles, hscale, vscale, lightIndex);
        this._uniformBuffer.updateFloat("vNumLights", this._lights.length);
        return this;
    }

    public override transferTexturesToEffect(effect: Effect, lightIndex: string): Light {
        const engine = this.getEngine();
        effect.setTexture("lightDataTexture" + lightIndex, this._lightDataTexture);
        if (engine.isWebGPU) {
            (<WebGPUEngine>engine).setStorageBuffer("tileMaskBuffer" + lightIndex, this._tileMaskBuffer);
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
        defines["CLUSTLIGHT_BATCH"] = this._batchSize;
    }

    public override _isReady(): boolean {
        this._updateBatches();
        return this._proxyMesh.isReady(true, true);
    }
}
