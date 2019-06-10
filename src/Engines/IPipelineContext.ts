import { Nullable } from '../types';
import { Effect } from '../Materials/effect';

/**
 * Class used to store and describe the pipeline context associated with an effect
 */
export interface IPipelineContext {
    /**
     * Gets a boolean indicating that this pipeline context is supporting asynchronous creating
     */
    isAsync: boolean;
    /**
     * Gets a boolean indicating that the context is ready to be used (like shaders / pipelines are compiled and ready for instance)
     */
    isReady: boolean;

    /** @hidden */
    _handlesSpectorRebuildCallback(onCompiled: (compiledObject: any) => void): void;

    /** @hidden */
    _fillEffectInformation(effect: Effect, uniformBuffersNames: { [key: string]: number }, uniformsNames: string[], uniforms: { [key: string]: Nullable<WebGLUniformLocation> }, samplerList: string[], samplers: { [key: string]: number }, attributesNames: string[], attributes: number[]): void;
}