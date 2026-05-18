import { type IParticleSystem } from "./IParticleSystem";
import { type Effect } from "../Materials/effect";
import { type EffectFallbacks } from "../Materials/effectFallbacks";
import { type ShaderLanguage } from "core/Materials/shaderLanguage";
declare module "../Engines/abstractEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractEngine {
        /**
         * Create an effect to use with particle systems.
         * Please note that some parameters like animation sheets or not being billboard are not supported in this configuration, except if you pass
         * the particle system for which you want to create a custom effect in the last parameter
         * @param fragmentName defines the base name of the effect (The name of file without .fragment.fx)
         * @param uniformsNames defines a list of attribute names
         * @param samplers defines an array of string used to represent textures
         * @param defines defines the string containing the defines to use to compile the shaders
         * @param fallbacks defines the list of potential fallbacks to use if shader compilation fails
         * @param onCompiled defines a function to call when the effect creation is successful
         * @param onError defines a function to call when the effect creation has failed
         * @param particleSystem the particle system you want to create the effect for
         * @param shaderLanguage defines the shader language to use
         * @param vertexName defines the vertex base name of the effect (The name of file without .vertex.fx)
         * @returns the new Effect
         */
        createEffectForParticles(
            fragmentName: string,
            uniformsNames: string[],
            samplers: string[],
            defines: string,
            fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void,
            onError?: (effect: Effect, errors: string) => void,
            particleSystem?: IParticleSystem,
            shaderLanguage?: ShaderLanguage,
            vertexName?: string
        ): Effect;
    }
}
declare module "../Meshes/mesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Mesh {
        /**
         * Returns an array populated with IParticleSystem objects whose the mesh is the emitter
         * @returns an array of IParticleSystem
         */
        getEmittedParticleSystems(): IParticleSystem[];

        /**
         * Returns an array populated with IParticleSystem objects whose the mesh or its children are the emitter
         * @returns an array of IParticleSystem
         */
        getHierarchyEmittedParticleSystems(): IParticleSystem[];
    }
}
