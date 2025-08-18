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
import { TmpVectors, Vector3 } from "core/Maths/math.vector";
import { CreatePlane } from "core/Meshes/Builders/planeBuilder";
import type { Mesh } from "core/Meshes/mesh";
import { _WarnImport } from "core/Misc/devTools";
import { serialize } from "core/Misc/decorators";
import { Logger } from "core/Misc/logger";
import { RegisterClass } from "core/Misc/typeStore";
import { Node } from "core/node";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";

import { Light } from "../light";
import { LightConstants } from "../lightConstants";
import type { PointLight } from "../pointLight";
import type { SpotLight } from "../spotLight";

import "core/Meshes/thinInstanceMesh";

Node.AddNodeConstructor("Light_Type_5", (name, scene) => {
    return () => new ClusteredLightContainer(name, [], scene);
});

/**
 * A special light that renders all its associated spot or point lights using a clustered or forward+ system.
 */
export class ClusteredLightContainer extends Light {
    private static _GetEngineBatchSize(engine: AbstractEngine): number {
        const caps = engine._caps;
        if (!caps.texelFetch) {
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

    /**
     * Checks if the clustered lighting system supports the given light with its current parameters.
     * This will also check if the light's associated engine supports clustered lighting.
     *
     * @param light The light to test
     * @returns true if the light and its engine is supported
     */
    public static IsLightSupported(light: Light): boolean {
        if (ClusteredLightContainer._GetEngineBatchSize(light.getEngine()) === 0) {
            return false;
        } else if (light.shadowEnabled && light._scene.shadowsEnabled && light.getShadowGenerators()) {
            // Shadows are not supported
            return false;
        } else if (light.falloffType !== Light.FALLOFF_DEFAULT) {
            // Only the default falloff is supported
            return false;
        } else if (light.getTypeID() === LightConstants.LIGHTTYPEID_POINTLIGHT) {
            return true;
        } else if (light.getTypeID() === LightConstants.LIGHTTYPEID_SPOTLIGHT) {
            // Extra texture bindings per light are not supported
            return !(<SpotLight>light).projectionTexture && !(<SpotLight>light).iesProfileTexture;
        } else {
            // Currently only point and spot lights are supported
            return false;
        }
    }

    /** @internal */
    public static _SceneComponentInitialization: (scene: Scene) => void = () => {
        throw _WarnImport("ClusteredLightingSceneComponent");
    };

    private readonly _batchSize: number;

    /**
     * True if clustered lighting is supported.
     */
    public get isSupported(): boolean {
        return this._batchSize > 0;
    }

    private readonly _lights: (PointLight | SpotLight)[] = [];
    /**
     * Gets the current list of lights added to this clustering system.
     */
    public get lights(): readonly Light[] {
        return this._lights;
    }

    private _lightDataBuffer: Float32Array;
    private _lightDataTexture: RawTexture;

    private _tileMaskBatches = -1;
    private _tileMaskTexture: RenderTargetTexture;
    private _tileMaskBuffer: Nullable<StorageBuffer>;

    private _horizontalTiles = 64;
    /**
     * The number of tiles in the horizontal direction to cluster lights into.
     * A lower value will reduce memory and make the clustering step faster, while a higher value increases memory and makes the rendering step faster.
     */
    @serialize()
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
    /**
     * The number of tiles in the vertical direction to cluster lights into.
     * A lower value will reduce memory and make the clustering step faster, while a higher value increases memory and makes the rendering step faster.
     */
    @serialize()
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
    private readonly _proxyMesh: Mesh;

    private _maxRange = 16383;
    private _minInverseSquaredRange = 1 / (this._maxRange * this._maxRange);
    /**
     * This limits the range of all the added lights, so even lights with extreme ranges will still have bounds for clustering.
     */
    @serialize()
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

    /**
     * Creates a new clustered light system with an initial set of lights.
     *
     * @param name The name of the clustered light container
     * @param lights The initial set of lights to add
     * @param scene The scene the clustered light container belongs to
     */
    constructor(name: string, lights: Light[] = [], scene?: Scene) {
        super(name, scene);
        const engine = this.getEngine();
        this._batchSize = ClusteredLightContainer._GetEngineBatchSize(engine);

        const proxyShader = { vertex: "lightProxy", fragment: "lightProxy" };
        this._proxyMaterial = new ShaderMaterial("ProxyMaterial", this._scene, proxyShader, {
            attributes: ["position"],
            uniforms: ["view", "projection", "tileMaskResolution"],
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

        this._proxyMesh = CreatePlane("ProxyMesh", { size: 2 });
        // Make sure it doesn't render for the default scene
        this._scene.removeMesh(this._proxyMesh);
        this._proxyMesh.material = this._proxyMaterial;

        this._updateBatches();

        if (this._batchSize > 0) {
            ClusteredLightContainer._SceneComponentInitialization(this._scene);
            for (const light of lights) {
                this.addLight(light);
            }
        }
    }

    public override getClassName(): string {
        return "ClusteredLightContainer";
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    public override getTypeID(): number {
        return LightConstants.LIGHTTYPEID_CLUSTERED_CONTAINER;
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
            if (engine.isWebGPU) {
                // Clear the storage buffer for WebGPU
                this._tileMaskBuffer?.clear();
            } else {
                // Only clear the texture on WebGL
                engine.clear({ r: 0, g: 0, b: 0, a: 1 }, true, false);
            }
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
        const buf = this._lightDataBuffer;
        for (let i = 0; i < this._lights.length; i += 1) {
            const light = this._lights[i];
            const off = i * 20;
            const computed = light.computeTransformedInformation();
            const scaledIntensity = light.getScaledIntensity();

            const position = computed ? light.transformedPosition : light.position;
            const diffuse = light.diffuse.scaleToRef(scaledIntensity, TmpColors.Color3[0]);
            const specular = light.specular.scaleToRef(scaledIntensity, TmpColors.Color3[1]);
            const range = Math.min(light.range, this.maxRange);
            const inverseSquaredRange = Math.max(light._inverseSquaredRange, this._minInverseSquaredRange);

            // vLightData
            buf[off + 0] = position.x;
            buf[off + 1] = position.y;
            buf[off + 2] = position.z;
            buf[off + 3] = 0;
            // vLightDiffuse
            buf[off + 4] = diffuse.r;
            buf[off + 5] = diffuse.g;
            buf[off + 6] = diffuse.b;
            buf[off + 7] = range;
            // vLightSpecular
            buf[off + 8] = specular.r;
            buf[off + 9] = specular.g;
            buf[off + 10] = specular.b;
            buf[off + 11] = light.radius;
            // vLightDirection
            buf[off + 12] = 0;
            buf[off + 13] = 0;
            buf[off + 14] = 0;
            buf[off + 15] = -1;
            // vLightFalloff
            buf[off + 16] = range;
            buf[off + 17] = inverseSquaredRange;
            buf[off + 18] = 0;
            buf[off + 19] = 0;

            if (light.getTypeID() === LightConstants.LIGHTTYPEID_SPOTLIGHT) {
                const spotLight = <SpotLight>light;
                const direction = Vector3.NormalizeToRef(computed ? spotLight.transformedDirection : spotLight.direction, TmpVectors.Vector3[0]);

                // vLightData.a
                buf[off + 3] = spotLight.exponent;
                // vLightDirection
                buf[off + 12] = direction.x;
                buf[off + 13] = direction.y;
                buf[off + 14] = direction.z;
                buf[off + 15] = spotLight._cosHalfAngle;
                // vLightFalloff.zw
                buf[off + 18] = spotLight._lightAngleScale;
                buf[off + 19] = spotLight._lightAngleOffset;
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

    /**
     * Adds a light to the clustering system.
     * @param light The light to add
     */
    public addLight(light: Light): void {
        if (!ClusteredLightContainer.IsLightSupported(light)) {
            Logger.Warn("Attempting to add a light to cluster that does not support clustering");
            return;
        }
        this._scene.removeLight(light);
        this._lights.push(<PointLight | SpotLight>light);

        this._proxyMesh.isVisible = true;
        this._proxyMesh.thinInstanceCount = this._lights.length;
    }

    /**
     * Removes a light from the clustering system.
     * @param light The light to remove
     * @returns the index where the light was in the light list
     */
    public removeLight(light: Light): number {
        const index = this.lights.indexOf(light);
        if (index === -1) {
            return index;
        }
        this._lights.splice(index, 1);
        this._scene.addLight(light);

        this._proxyMesh.thinInstanceCount = this._lights.length;
        if (this._lights.length === 0) {
            this._proxyMesh.isVisible = false;
        }
        return index;
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
        this._uniformBuffer.updateFloat4("vLightData", hscale, vscale, this._verticalTiles, this._tileMaskBatches, lightIndex);
        this._uniformBuffer.updateFloat("vNumLights", this._lights.length, lightIndex);
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

// Register Class Name
RegisterClass("BABYLON.ClusteredLightContainer", ClusteredLightContainer);
