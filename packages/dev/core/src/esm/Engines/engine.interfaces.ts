import type { ShaderLanguage } from "core/Materials/shaderLanguage";
import type { IColor4Like } from "core/Maths/math.like";
import type { Nullable } from "core/types";

export enum EngineType {
    BASE,
    NULL,
    NATIVE,
    WEBGL,
    WEBGPU,
}

export interface IEngineInitOptions {
    type: EngineType;
}

/**
 * An interface for the engine's capabilities. this is the basic functionality existing in the current classes
 */
export interface IEngineModule {
    /**
     * @internal
     */
    _getShaderProcessor(engineState: IEnginePublic, shaderLanguage: ShaderLanguage): Nullable<IShaderProcessor>;

    dispose(engineState: IEnginePublic): void;
    clear(engineState: IEnginePublic, color: Nullable<IColor4Like>, backBuffer: boolean, depth: boolean, stencil: boolean): void
}