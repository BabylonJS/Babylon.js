import { UniformBuffer } from "../Materials/uniformBuffer";
import { Buffer } from "../Meshes/buffer";
import { ThinEngine } from "../Engines/thinEngine";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { SerializationHelper, serialize } from "../Misc/decorators";
import { _TypeStore } from '../Misc/typeStore';
import { ComputeEffect, IComputeEffectCreationOptions } from "./computeEffect";
import { BindingLocationToString, ComputeBindingList, ComputeBindingLocation, ComputeBindingType } from "../Engines/Extensions/engine.computeShader";
import { BaseTexture } from "../Materials/Textures";
import { UniqueIdGenerator } from "../Misc/uniqueIdGenerator";

/**
 * Defines the options associated with the creation of a compute shader.
 */
 export interface IComputeShaderOptions {
    /**
     * The list of defines used in the shader
     */
    defines?: string[];

    /**
     * If provided, will be called with the shader code so that this code can be updated before it is compiled by the GPU
     */
    processFinalCode?: Nullable<(code: string) => string>;
}

/**
 * The ComputeShader object lets you execute a compute shader on your GPU (if supported by the engine)
 */
export class ComputeShader {
    private _engine: ThinEngine;
    private _shaderPath: any;
    private _options: IComputeShaderOptions;
    private _effect: ComputeEffect;
    private _cachedDefines: string;
    private _bindings : ComputeBindingList = {};

    /**
     * Gets the unique id of the compute shader
     */
    public readonly uniqueId: number;
 
     /**
      * The name of the material
      */
    @serialize()
    public name: string;

     /**
     * Callback triggered when the shader is compiled
     */
    public onCompiled: Nullable<(effect: ComputeEffect) => void> = null;

     /**
      * Callback triggered when an error occurs
      */
    public onError: Nullable<(effect: ComputeEffect, errors: string) => void> = null;
 
    /**
     * Instantiates a new compute shader.
     * @param name Defines the name of the compute shader in the scene
     * @param engine Defines the engine the compute shader belongs to
     * @param shaderPath Defines  the route to the shader code in one of three ways:
     *  * object: { compute: "custom" }, used with ShaderStore.ShadersStore["customComputeShader"]
     *  * object: { computeElement: "HTMLElementId" }, used with shader code in script tags
     *  * object: { computeSource: "compute shader code string" using with string containing the shader code
     *  * string: try first to find the code in ShaderStore.ShadersStore[shaderPath + "ComputeShader"]. If not, assumes it is a file with name shaderPath.compute.fx in index.html folder.
     * @param options Define the options used to create the shader
     */
    constructor(name: string, engine: ThinEngine, shaderPath: any, options: Partial<IComputeShaderOptions> = {}) {
        this.name = name;
        this._engine = engine;
        this.uniqueId = UniqueIdGenerator.UniqueId;

        if (!this._engine.getCaps().supportComputeShaders) {
            throw new Error("This engine does not support compute shaders!");
        }

        this._shaderPath = shaderPath;
        this._options = {
            defines: [],
            ...options
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
     */
    public setTexture(name: ComputeBindingLocation, texture: BaseTexture): void {
        this._bindings[BindingLocationToString(name)] = {
            location: name,
            type: ComputeBindingType.Texture,
            object: texture,
        };
    }

    /**
     * Binds a storage texture to the shader
     * @param name Binding name of the texture
     * @param texture Texture to bind
     */
    public setStorageTexture(name: ComputeBindingLocation, texture: BaseTexture): void {
        this._bindings[BindingLocationToString(name)] = {
            location: name,
            type: ComputeBindingType.StorageTexture,
            object: texture,
        };
    }

    /**
     * Binds a uniform buffer to the shader
     * @param name Binding name of the buffer
     * @param texture Buffer to bind
     */
    public setUniformBuffer(name: ComputeBindingLocation, buffer: UniformBuffer): void {
        this._bindings[BindingLocationToString(name)] = {
            location: name,
            type: ComputeBindingType.UniformBuffer,
            object: buffer,
        };
    }

    public setStorageBuffer(name: ComputeBindingLocation, buffer: Buffer): void {

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
                case ComputeBindingType.StorageTexture:
                    const texture = object as BaseTexture;
                    if (!texture.isReady()) {
                        return false;
                    }
                    break;
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
        if (!this.isReady()) {
            return false;
        }

        this._effect.dispatch(this._bindings, x, y, z);

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

        // @TODO serialize textures, buffers, ...

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
        const compute = SerializationHelper.Parse(() => new ComputeShader(source.name, scene.getEngine(), source.shaderPath, source.options), source, scene, rootUrl);

        // @TODO parse textures, buffers, ...

        return compute;
    }

}

_TypeStore.RegisteredTypes["BABYLON.ComputeShader"] = ComputeShader;
