import { WebGPUEngine } from "../../webgpuEngine";
import { Nullable } from "../../../types";

declare type Sampler = import("../../../Materials/Textures/sampler").Sampler;

WebGPUEngine.prototype.setSampler = function (name: string, sampler: Nullable<Sampler>): void {
    this._currentMaterialContext?.setSampler(name, sampler);
};
