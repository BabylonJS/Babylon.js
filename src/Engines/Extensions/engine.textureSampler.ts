import { ThinEngine } from "../../Engines/thinEngine";
import { Nullable } from "../../types";

declare type TextureSampler = import("../../Materials/Textures/textureSampler").TextureSampler;

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Sets a texture sampler to the according uniform.
         * @param name The name of the uniform in the effect
         * @param sampler The sampler to apply
         */
        setTextureSampler(name: string, sampler: Nullable<TextureSampler>): void;
    }
}

ThinEngine.prototype.setTextureSampler = function (name: string, sampler: Nullable<TextureSampler>): void {
    throw new Error("setTextureSampler: This engine does not support separate texture sampler objects!");
};
