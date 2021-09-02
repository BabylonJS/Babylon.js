import { ThinEngine } from "../../Engines/thinEngine";
import { Nullable } from "../../types";

declare type Sampler = import("../../Materials/Textures/sampler").Sampler;

declare module "../../Engines/thinEngine" {
    export interface ThinEngine {
        /**
         * Sets a sampler to the according uniform.
         * @param name The name of the uniform in the effect
         * @param sampler The sampler to apply
         */
        setSampler(name: string, sampler: Nullable<Sampler>): void;
    }
}

ThinEngine.prototype.setSampler = function (name: string, sampler: Nullable<Sampler>): void {
    throw new Error("setSampler: This engine does not support separate sampler objects!");
};
