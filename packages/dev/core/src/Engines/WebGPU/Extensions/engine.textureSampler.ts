import { WebGPUEngine } from "../../webgpuEngine";
import { Nullable } from "../../../types";
import { Effect } from "../../../Materials/effect";

declare type TextureSampler = import("../../../Materials/Textures/textureSampler").TextureSampler;

declare module "../../../Materials/effect" {
    export interface Effect {
        /**
         * Sets a sampler on the engine to be used in the shader.
         * @param name Name of the sampler variable.
         * @param sampler Sampler to set.
         */
        setTextureSampler(name: string, sampler: Nullable<TextureSampler>): void;
    }
}

Effect.prototype.setTextureSampler = function(name: string, sampler: Nullable<TextureSampler>): void {
    this._engine.setTextureSampler(name, sampler);
};

WebGPUEngine.prototype.setTextureSampler = function (name: string, sampler: Nullable<TextureSampler>): void {
    this._currentMaterialContext?.setSampler(name, sampler);
};
