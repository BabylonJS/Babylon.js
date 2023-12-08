import type { TextureSampler } from "core/Materials/Textures/textureSampler";
import type { Nullable } from "core/types";
import type { IBaseEnginePublic } from "../../engine.base";

export interface ITextureSamplerEngineExtension {
    /**
     * Sets a texture sampler to the according uniform.
     * @param name The name of the uniform in the effect
     * @param sampler The sampler to apply
     */
    setTextureSampler(engineState: IBaseEnginePublic, name: string, sampler: Nullable<TextureSampler>): void;
}
