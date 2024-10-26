import { Mesh } from "../Meshes/mesh";
import type { IParticleSystem } from "./IParticleSystem";
import { GPUParticleSystem } from "./gpuParticleSystem";
import type { Effect } from "../Materials/effect";
import { ParticleSystem } from "./particleSystem";
import type { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import type { AssetContainer } from "../assetContainer";
import type { EffectFallbacks } from "../Materials/effectFallbacks";
import { AbstractEngine } from "../Engines/abstractEngine";
import { ShaderLanguage } from "core/Materials/shaderLanguage";
import { AddParser, AddIndividualParser, GetIndividualParser } from "core/Loading/Plugins/babylonFileParser.function";

// Adds the parsers to the scene parsers.
AddParser(SceneComponentConstants.NAME_PARTICLESYSTEM, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {
    const individualParser = GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);

    if (!individualParser) {
        return;
    }

    // Particles Systems
    if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
        for (let index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
            const parsedParticleSystem = parsedData.particleSystems[index];
            container.particleSystems.push(individualParser(parsedParticleSystem, scene, rootUrl));
        }
    }
});

AddIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM, (parsedParticleSystem: any, scene: Scene, rootUrl: string) => {
    if (parsedParticleSystem.activeParticleCount) {
        const ps = GPUParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
        return ps;
    } else {
        const ps = ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
        return ps;
    }
});

declare module "../Engines/abstractEngine" {
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
            shaderLanguage?: ShaderLanguage
        ): Effect;
    }
}

AbstractEngine.prototype.createEffectForParticles = function (
    fragmentName: string,
    uniformsNames: string[] = [],
    samplers: string[] = [],
    defines = "",
    fallbacks?: EffectFallbacks,
    onCompiled?: (effect: Effect) => void,
    onError?: (effect: Effect, errors: string) => void,
    particleSystem?: IParticleSystem,
    shaderLanguage = ShaderLanguage.GLSL
): Effect {
    let attributesNamesOrOptions: Array<string> = [];
    let effectCreationOption: Array<string> = [];
    const allSamplers: Array<string> = [];

    if (particleSystem) {
        particleSystem.fillUniformsAttributesAndSamplerNames(effectCreationOption, attributesNamesOrOptions, allSamplers);
    } else {
        attributesNamesOrOptions = ParticleSystem._GetAttributeNamesOrOptions();
        effectCreationOption = ParticleSystem._GetEffectCreationOptions();
    }

    if (defines.indexOf(" BILLBOARD") === -1) {
        defines += "\n#define BILLBOARD\n";
    }

    if (particleSystem?.isAnimationSheetEnabled) {
        if (defines.indexOf(" ANIMATESHEET") === -1) {
            defines += "\n#define ANIMATESHEET\n";
        }
    }

    if (samplers.indexOf("diffuseSampler") === -1) {
        samplers.push("diffuseSampler");
    }

    return this.createEffect(
        {
            vertex: particleSystem?.vertexShaderName ?? "particles",
            fragmentElement: fragmentName,
        },
        attributesNamesOrOptions,
        effectCreationOption.concat(uniformsNames),
        allSamplers.concat(samplers),
        defines,
        fallbacks,
        onCompiled,
        onError,
        undefined,
        shaderLanguage,
        async () => {
            if (shaderLanguage === ShaderLanguage.GLSL) {
                await import("../Shaders/particles.vertex");
            } else {
                await import("../ShadersWGSL/particles.vertex");
            }
        }
    );
};

declare module "../Meshes/mesh" {
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

Mesh.prototype.getEmittedParticleSystems = function (): IParticleSystem[] {
    const results: IParticleSystem[] = [];
    for (let index = 0; index < this.getScene().particleSystems.length; index++) {
        const particleSystem = this.getScene().particleSystems[index];
        if (particleSystem.emitter === this) {
            results.push(particleSystem);
        }
    }
    return results;
};

Mesh.prototype.getHierarchyEmittedParticleSystems = function (): IParticleSystem[] {
    const results: IParticleSystem[] = [];
    const descendants = this.getDescendants();
    descendants.push(this);

    for (let index = 0; index < this.getScene().particleSystems.length; index++) {
        const particleSystem = this.getScene().particleSystems[index];
        const emitter: any = particleSystem.emitter;

        if (emitter.position && descendants.indexOf(emitter) !== -1) {
            results.push(particleSystem);
        }
    }

    return results;
};
