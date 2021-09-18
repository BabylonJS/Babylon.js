import { WebGPUEngine } from "../../webgpuEngine";
import { Nullable } from "../../../types";
import { Effect } from "../../../Materials/effect";

declare type Sampler = import("../../../Materials/Textures/textureSampler").TextureSampler;

declare module "../../../Materials/effect" {
    export interface Effect {
        /**
         * Sets a sampler on the engine to be used in the shader.
         * @param name Name of the sampler variable.
         * @param sampler Sampler to set.
         */
        setTextureSampler(name: string, sampler: Nullable<Sampler>): void;
    }
}

Effect.prototype.setTextureSampler = function(name: string, sampler: Nullable<Sampler>): void {
    this._engine.setSampler(name, sampler);
};

WebGPUEngine.prototype.setSampler = function (name: string, sampler: Nullable<Sampler>): void {
    this._currentMaterialContext?.setSampler(name, sampler);
};
