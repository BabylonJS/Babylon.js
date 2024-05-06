import { WebGPUEngine } from "../../webgpuEngine";
import type { Nullable } from "../../../types";

import type { TextureSampler } from "../../../Materials/Textures/textureSampler";

declare module "../../webgpuEngine" {
    export interface WebGPUEngine {
        /**
         * Sets a texture sampler to the according uniform.
         * @param name The name of the uniform in the effect
         * @param sampler The sampler to apply
         */
        setTextureSampler(name: string, sampler: Nullable<TextureSampler>): void;
    }
}

WebGPUEngine.prototype.setTextureSampler = function (name: string, sampler: Nullable<TextureSampler>): void {
    this._currentMaterialContext?.setSampler(name, sampler);
};
