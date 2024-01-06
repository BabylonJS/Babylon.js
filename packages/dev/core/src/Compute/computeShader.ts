import type { UniformBuffer } from "../Materials/uniformBuffer";
import type { WebGPUEngine } from "../Engines/webgpuEngine";
import type { Scene } from "../scene";
import type { Nullable } from "../types";
import { SerializationHelper, serialize } from "../Misc/decorators";
import { RegisterClass } from "../Misc/typeStore";
import type { ComputeEffect, IComputeEffectCreationOptions } from "./computeEffect";
import type { ComputeBindingMapping } from "../Engines/Extensions/engine.computeShader";
import { ComputeBindingType } from "../Engines/Extensions/engine.computeShader";
import type { BaseTexture } from "../Materials/Textures/baseTexture";
import { Texture } from "../Materials/Textures/texture";
import { UniqueIdGenerator } from "../Misc/uniqueIdGenerator";
import type { IComputeContext } from "./IComputeContext";
import type { StorageBuffer } from "../Buffers/storageBuffer";
import { Logger } from "../Misc/logger";
import { TextureSampler } from "../Materials/Textures/textureSampler";
import type { DataBuffer } from "core/Buffers/dataBuffer";
import type { ExternalTexture } from "core/Materials/Textures/externalTexture";
import type { VideoTexture } from "core/Materials/Textures/videoTexture";
import { WebGPUPerfCounter } from "core/Engines/WebGPU/webgpuPerfCounter";
import type { ThinEngine } from "core/Engines/thinEngine";

/**
 * Defines the options associated with the creation of a compute shader.
 */
export interface IComputeShaderOptions {
    /**
     * list of bindings mapping (key is property name, value is binding location)
     * Must be provided because browsers don't support reflection for wgsl shaders yet (so there's no way to query the binding/group from a variable name)
     * TODO: remove this when browsers support reflection for wgsl shaders
     */
    bindingsMapping: ComputeBindingMapping;

    /**
     * The list of defines used in the shader
     */
    defines?: string[];

    /**
     * The name of the entry point in the shader source (default: "main")
     */
    entryPoint?: string;

    /**
     * If provided, will be called with the shader code so that this code can be updated before it is compiled by the GPU
     */
    processFinalCode?: Nullable<(code: string) => string>;
}

type ComputeBindingListInternal = { [key: string]: { type: ComputeBindingType; object: any; indexInGroupEntries?: number; buffer?: Nullable<DataBuffer> } };

/**
 * The ComputeShader object lets you execute a compute shader on your GPU (if supported by the engine)
 */
export class ComputeShader {
    private _engine: ThinEngine;
    private _shaderPath: any;
    private _options: IComputeShaderOptions;
    private _effect: ComputeEffect;
    private _cachedDefines: string;
    private _bindings: ComputeBindingListInternal = {};
    private _samplers: { [key: string]: TextureSampler } = {};
    private _context: IComputeContext;
    private _contextIsDirty = false;

    /**
     * Gets the unique id of the compute shader
     */
    public readonly uniqueId: number;

    /**
     * The name of the shader
     */
    @serialize()
    public name: string;

    /**
     * The options used to create the shader
     */
    public get options() {
        return this._options;
    }

    /**
     * The shaderPath used to create the shader
     */
    public get shaderPath() {
        return this._shaderPath;
    }

    /**
     * When set to true, dispatch won't call isReady anymore and won't check if the underlying GPU resources should be (re)created because of a change in the inputs (texture, uniform buffer, etc.)
     * If you know that your inputs did not change since last time dispatch was called and that isReady() returns true, set this flag to true to improve performance
     */
    @serialize()
    public fastMode = false;

    /**
     * Callback triggered when the shader is compiled
     */
    public onCompiled: Nullable<(effect: ComputeEffect) => void> = null;

    /**
     * Callback triggered when an error occurs
     */
    public onError: Nullable<(effect: ComputeEffect, errors: string) => void> = null;

    /**
     * Gets the GPU time spent running the compute shader for the last frame rendered (in nanoseconds).
     * You have to enable the "timestamp-query" extension in the engine constructor options and set engine.enableGPUTimingMeasurements = true.
     */
    public readonly gpuTimeInFrame?: WebGPUPerfCounter;

    /**
     * Instantiates a new compute shader.
     * @param name Defines the name of the compute shader in the scene
     * @param engine Defines the engine the compute shader belongs to
     * @param shaderPath Defines  the route to the shader code in one of three ways:
     *  * object: \{ compute: "custom" \}, used with ShaderStore.ShadersStoreWGSL["customComputeShader"]
     *  * object: \{ computeElement: "HTMLElementId" \}, used with shader code in script tags
     *  * object: \{ computeSource: "compute shader code string" \}, where the string contains the shader code
     *  * string: try first to find the code in ShaderStore.ShadersStoreWGSL[shaderPath + "ComputeShader"]. If not, assumes it is a file with name shaderPath.compute.fx in index.html folder.
     * @param options Define the options used to create the shader
     */
    constructor(name: string, engine: ThinEngine, shaderPath: any, options: Partial<IComputeShaderOptions> = {}) {
        this.name = name;
        this._engine = engine;
        this.uniqueId = UniqueIdGenerator.UniqueId;
        if ((engine as WebGPUEngine).enableGPUTimingMeasurements) {
            this.gpuTimeInFrame = new WebGPUPerfCounter();
        }

        if (!this._engine.getCaps().supportComputeShaders) {
            Logger.Error("This engine does not support compute shaders!");
            return;
        }
        if (!options.bindingsMapping) {
            Logger.Error("You must provide the binding mappings as browsers don't support reflection for wgsl shaders yet!");
            return;
        }

        this._context = engine.createComputeContext()!;
        this._shaderPath = shaderPath;
        this._options = {
            bindingsMapping: {},
            defines: [],
            ...options,
        };
    }

    /**
     * Gets the current class name of the material e.g. "ComputeShader"
     * Mainly use in serialization.
     * @returns the class name
     */
    public getClassName(): string {
        return "ComputeShader";
    }

    /**
     * Binds a texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     * @param bindSampler Bind the sampler corresponding to the texture (default: true). The sampler will be bound just before the binding index of the texture
     */
    public setTexture(name: string, texture: BaseTexture, bindSampler = true): void {
        const current = this._bindings[name];

        this._bindings[name] = {
            type: bindSampler ? ComputeBindingType.Texture : ComputeBindingType.TextureWithoutSampler,
            object: texture,
            indexInGroupEntries: current?.indexInGroupEntries,
        };

        this._contextIsDirty ||= !current || current.object !== texture || current.type !== this._bindings[name].type;
    }

    /**
     * Binds a storage texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     */
    public setStorageTexture(name: string, texture: BaseTexture): void {
        const current = this._bindings[name];

        this._contextIsDirty ||= !current || current.object !== texture;

        this._bindings[name] = {
            type: ComputeBindingType.StorageTexture,
            object: texture,
            indexInGroupEntries: current?.indexInGroupEntries,
        };
    }

    /**
     * Binds an external texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     */
    public setExternalTexture(name: string, texture: ExternalTexture): void {
        const current = this._bindings[name];

        this._contextIsDirty ||= !current || current.object !== texture;

        this._bindings[name] = {
            type: ComputeBindingType.ExternalTexture,
            object: texture,
            indexInGroupEntries: current?.indexInGroupEntries,
        };
    }

    /**
     * Binds a video texture to the shader (by binding the external texture attached to this video)
     * @param name Binding name of the texture
     * @param texture Texture to bind
     * @returns true if the video texture was successfully bound, else false. false will be returned if the current engine does not support external textures
     */
    public setVideoTexture(name: string, texture: VideoTexture) {
        if (texture.externalTexture) {
            this.setExternalTexture(name, texture.externalTexture);
            return true;
        }

        return false;
    }

    /**
     * Binds a uniform buffer to the shader
     * @param name Binding name of the buffer
     * @param buffer Buffer to bind
     */
    public setUniformBuffer(name: string, buffer: UniformBuffer): void {
        const current = this._bindings[name];

        this._contextIsDirty ||= !current || current.object !== buffer;

        this._bindings[name] = {
            type: ComputeBindingType.UniformBuffer,
            object: buffer,
            indexInGroupEntries: current?.indexInGroupEntries,
        };
    }

    /**
     * Binds a storage buffer to the shader
     * @param name Binding name of the buffer
     * @param buffer Buffer to bind
     */
    public setStorageBuffer(name: string, buffer: StorageBuffer): void {
        const current = this._bindings[name];

        this._contextIsDirty ||= !current || current.object !== buffer;

        this._bindings[name] = {
            type: ComputeBindingType.StorageBuffer,
            object: buffer,
            indexInGroupEntries: current?.indexInGroupEntries,
        };
    }

    /**
     * Binds a texture sampler to the shader
     * @param name Binding name of the sampler
     * @param sampler Sampler to bind
     */
    public setTextureSampler(name: string, sampler: TextureSampler): void {
        const current = this._bindings[name];

        this._contextIsDirty ||= !current || !sampler.compareSampler(current.object);

        this._bindings[name] = {
            type: ComputeBindingType.Sampler,
            object: sampler,
            indexInGroupEntries: current?.indexInGroupEntries,
        };
    }

    /**
     * Specifies that the compute shader is ready to be executed (the compute effect and all the resources are ready)
     * @returns true if the compute shader is ready to be executed
     */
    public isReady(): boolean {
        let effect = this._effect;

        for (const key in this._bindings) {
            const binding = this._bindings[key],
                type = binding.type,
                object = binding.object;

            switch (type) {
                case ComputeBindingType.Texture:
                case ComputeBindingType.TextureWithoutSampler:
                case ComputeBindingType.StorageTexture: {
                    const texture = object as BaseTexture;
                    if (!texture.isReady()) {
                        return false;
                    }
                    break;
                }
                case ComputeBindingType.ExternalTexture: {
                    const texture = object as ExternalTexture;
                    if (!texture.isReady()) {
                        return false;
                    }
                    break;
                }
            }
        }

        const defines = [];

        const shaderName = this._shaderPath;

        if (this._options.defines) {
            for (let index = 0; index < this._options.defines.length; index++) {
                defines.push(this._options.defines[index]);
            }
        }

        const join = defines.join("\n");

        if (this._cachedDefines !== join) {
            this._cachedDefines = join;

            effect = this._engine.createComputeEffect(shaderName, <IComputeEffectCreationOptions>{
                defines: join,
                entryPoint: this._options.entryPoint,
                onCompiled: this.onCompiled,
                onError: this.onError,
            });

            this._effect = effect;
        }

        if (!effect.isReady()) {
            return false;
        }

        return true;
    }

    /**
     * Dispatches (executes) the compute shader
     * @param x Number of workgroups to execute on the X dimension
     * @param y Number of workgroups to execute on the Y dimension (default: 1)
     * @param z Number of workgroups to execute on the Z dimension (default: 1)
     * @returns True if the dispatch could be done, else false (meaning either the compute effect or at least one of the bound resources was not ready)
     */
    public dispatch(x: number, y?: number, z?: number): boolean {
        if (!this.fastMode) {
            if (!this.isReady()) {
                return false;
            }

            // If the sampling parameters of a texture bound to the shader have changed, we must clear the compute context so that it is recreated with the updated values
            // Also, if the actual (gpu) buffer used by a uniform buffer has changed, we must clear the compute context so that it is recreated with the updated value
            for (const key in this._bindings) {
                const binding = this._bindings[key];

                if (!this._options.bindingsMapping[key]) {
                    throw new Error("ComputeShader ('" + this.name + "'): No binding mapping has been provided for the property '" + key + "'");
                }

                switch (binding.type) {
                    case ComputeBindingType.Texture: {
                        const sampler = this._samplers[key];
                        const texture = binding.object as BaseTexture;

                        if (!sampler || !texture._texture || !sampler.compareSampler(texture._texture)) {
                            this._samplers[key] = new TextureSampler().setParameters(
                                texture.wrapU,
                                texture.wrapV,
                                texture.wrapR,
                                texture.anisotropicFilteringLevel,
                                texture._texture!.samplingMode,
                                texture._texture?._comparisonFunction
                            );
                            this._contextIsDirty = true;
                        }
                        break;
                    }
                    case ComputeBindingType.ExternalTexture: {
                        // we must recreate the bind groups each time if there's an external texture, because device.importExternalTexture must be called each frame
                        this._contextIsDirty = true;
                        break;
                    }
                    case ComputeBindingType.UniformBuffer: {
                        const ubo = binding.object as UniformBuffer;
                        if (ubo.getBuffer() !== binding.buffer) {
                            binding.buffer = ubo.getBuffer();
                            this._contextIsDirty = true;
                        }
                        break;
                    }
                }
            }

            if (this._contextIsDirty) {
                this._contextIsDirty = false;
                this._context.clear();
            }
        }

        this._engine.computeDispatch(this._effect, this._context, this._bindings, x, y, z, this._options.bindingsMapping, this.gpuTimeInFrame);

        return true;
    }

    /**
     * Waits for the compute shader to be ready and executes it
     * @param x Number of workgroups to execute on the X dimension
     * @param y Number of workgroups to execute on the Y dimension (default: 1)
     * @param z Number of workgroups to execute on the Z dimension (default: 1)
     * @param delay Delay between the retries while the shader is not ready (in milliseconds - 10 by default)
     * @returns A promise that is resolved once the shader has been sent to the GPU. Note that it does not mean that the shader execution itself is finished!
     */
    public dispatchWhenReady(x: number, y?: number, z?: number, delay = 10): Promise<void> {
        return new Promise((resolve) => {
            const check = () => {
                if (!this.dispatch(x, y, z)) {
                    setTimeout(check, delay);
                } else {
                    resolve();
                }
            };

            check();
        });
    }

    /**
     * Serializes this compute shader in a JSON representation
     * @returns the serialized compute shader object
     */
    public serialize(): any {
        const serializationObject = SerializationHelper.Serialize(this);

        serializationObject.options = this._options;
        serializationObject.shaderPath = this._shaderPath;
        serializationObject.bindings = {};
        serializationObject.textures = {};

        for (const key in this._bindings) {
            const binding = this._bindings[key];
            const object = binding.object;

            switch (binding.type) {
                case ComputeBindingType.Texture:
                case ComputeBindingType.TextureWithoutSampler:
                case ComputeBindingType.StorageTexture: {
                    const serializedData = (object as BaseTexture).serialize();
                    if (serializedData) {
                        serializationObject.textures[key] = serializedData;
                        serializationObject.bindings[key] = {
                            type: binding.type,
                        };
                    }
                    break;
                }

                case ComputeBindingType.UniformBuffer: {
                    break;
                }
            }
        }

        return serializationObject;
    }

    /**
     * Creates a compute shader from parsed compute shader data
     * @param source defines the JSON representation of the compute shader
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new compute shader
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): ComputeShader {
        const compute = SerializationHelper.Parse(
            () => new ComputeShader(source.name, scene.getEngine() as WebGPUEngine, source.shaderPath, source.options),
            source,
            scene,
            rootUrl
        );

        for (const key in source.textures) {
            const binding = source.bindings[key];
            const texture = <Texture>Texture.Parse(source.textures[key], scene, rootUrl);

            if (binding.type === ComputeBindingType.Texture) {
                compute.setTexture(key, texture);
            } else if (binding.type === ComputeBindingType.TextureWithoutSampler) {
                compute.setTexture(key, texture, false);
            } else {
                compute.setStorageTexture(key, texture);
            }
        }

        return compute;
    }
}

RegisterClass("BABYLON.ComputeShader", ComputeShader);
