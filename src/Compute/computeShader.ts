import { UniformBuffer } from "../Materials/uniformBuffer";
import { ThinTexture } from "../Materials/Textures/thinTexture";
import { Buffer } from "../Meshes/buffer";
import { ThinEngine } from "../Engines/thinEngine";
import { Scene } from "../scene";
import { Nullable } from "../types";
import { SerializationHelper, serialize } from "../Misc/decorators";
import { _TypeStore } from '../Misc/typeStore';
import { ComputeEffect, IComputeEffectCreationOptions } from "./computeEffect";

/**
 * Defines the options associated with the creation of a compute shader.
 */
 export interface IComputeShaderOptions {
    /**
     * The list of uniform names used in the shader
     */
    uniforms: string[];

    /**
     * The list of sampler names used in the shader
     */
    samplers: string[];

    /**
     * The list of defines used in the shader
     */
    defines: string[];
}

export class ComputeShader {
    private _scene: Scene;
    private _engine: ThinEngine;
    private _shaderPath: any;
    private _options: IComputeShaderOptions;
    private _effect: ComputeEffect;
    private _cachedDefines: string;

    /**
     * Gets or sets the unique id of the material
     */
    @serialize()
    public uniqueId: number;
 
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
 
    constructor(name: string, scene: Scene, shaderPath: any, options: Partial<IComputeShaderOptions> = {}) {
        this.name = name;
        this._scene = scene;

        this.uniqueId = this._scene.getUniqueId();
        this._engine = scene.getEngine();

        if (!this._engine.getCaps().supportComputeShaders) {
            throw new Error("This engine does not support compute shaders!");
        }

        this._shaderPath = shaderPath;
        this._options = {
            uniforms: [],
            samplers: [],
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

    public setTexture(name: { group: number, binding: number } | string, texture: ThinTexture): void {

    }

    public setStorageTexture(name: { group: number, binding: number } | string, texture: ThinTexture, readOnly: boolean): void {

    }

    public setUniformBuffer(name: { group: number, binding: number } | string, buffer: UniformBuffer): void {

    }

    public setStorageBuffer(name: { group: number, binding: number } | string, buffer: Buffer, readOnly?: boolean): void {

    }

    public isReady(): boolean {
        let effect = this._effect;

        const defines = [];

        const shaderName = this._shaderPath,
              uniforms = this._options.uniforms,
              samplers = this._options.samplers;

        for (let index = 0; index < this._options.defines.length; index++) {
            defines.push(this._options.defines[index]);
        }
    
        const join = defines.join("\n");

        if (this._cachedDefines !== join) {
            this._cachedDefines = join;

            effect = this._engine.createComputeEffect(shaderName, <IComputeEffectCreationOptions>{
                uniformsNames: uniforms,
                samplers: samplers,
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

    public dispatch(x: number, y?: number, z?: number): boolean {
        if (!this.isReady()) {
            return false;
        }

        console.log("dispatched");

        return false;
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
     * Creates a shader material from parsed shader material data
     * @param source defines the JSON representation of the material
     * @param scene defines the hosting scene
     * @param rootUrl defines the root URL to use to load textures and relative dependencies
     * @returns a new material
     */
    public static Parse(source: any, scene: Scene, rootUrl: string): ComputeShader {
        const compute = SerializationHelper.Parse(() => new ComputeShader(source.name, scene, source.shaderPath, source.options), source, scene, rootUrl);

        // @TODO parse textures, buffers, ...

        return compute;
    }

}

_TypeStore.RegisteredTypes["BABYLON.ComputeShader"] = ComputeShader;
