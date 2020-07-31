import { Mesh } from "../Meshes/mesh";
import { IParticleSystem } from "./IParticleSystem";
import { GPUParticleSystem } from "./gpuParticleSystem";
import { AbstractScene } from "../abstractScene";
import { Effect } from "../Materials/effect";
import { Engine } from "../Engines/engine";
import { ParticleSystem } from "./particleSystem";
import { Scene } from "../scene";
import { SceneComponentConstants } from "../sceneComponent";
import { AssetContainer } from "../assetContainer";

import "../Shaders/particles.vertex";
import { EffectFallbacks } from '../Materials/effectFallbacks';

// Adds the parsers to the scene parsers.
AbstractScene.AddParser(SceneComponentConstants.NAME_PARTICLESYSTEM, (parsedData: any, scene: Scene, container: AssetContainer, rootUrl: string) => {

    let individualParser = AbstractScene.GetIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM);

    if (!individualParser) {
        return;
    }

    // Particles Systems
    if (parsedData.particleSystems !== undefined && parsedData.particleSystems !== null) {
        for (var index = 0, cache = parsedData.particleSystems.length; index < cache; index++) {
            var parsedParticleSystem = parsedData.particleSystems[index];
            container.particleSystems.push(individualParser(parsedParticleSystem, scene, rootUrl));
        }
    }
});

AbstractScene.AddIndividualParser(SceneComponentConstants.NAME_PARTICLESYSTEM, (parsedParticleSystem: any, scene: Scene, rootUrl: string) => {
    if (parsedParticleSystem.activeParticleCount) {
        let ps = GPUParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
        return ps;
    } else {
        let ps = ParticleSystem.Parse(parsedParticleSystem, scene, rootUrl);
        return ps;
    }
});

declare module "../Engines/engine" {
    export interface Engine {
        /**
         * Create an effect to use with particle systems.
         * Please note that some parameters like animation sheets or not being billboard are not supported in this configuration, except if you pass
         * the particle system for which you want to create a custom effect in the last parameter
         * @param fragmentName defines the base name of the effect (The name of file without .fragment.fx)
         * @param uniformsNames defines a list of attribute names
         * @param samplers defines an array of string used to represent textures
         * @param defines defines the string containing the defines to use to compile the shaders
         * @param fallbacks defines the list of potential fallbacks to use if shader conmpilation fails
         * @param onCompiled defines a function to call when the effect creation is successful
         * @param onError defines a function to call when the effect creation has failed
         * @param particleSystem the particle system you want to create the effect for
         * @returns the new Effect
         */
        createEffectForParticles(fragmentName: string, uniformsNames: string[], samplers: string[], defines: string, fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, particleSystem?: IParticleSystem): Effect;
    }
}

Engine.prototype.createEffectForParticles = function(fragmentName: string, uniformsNames: string[] = [], samplers: string[] = [], defines = "", fallbacks?: EffectFallbacks,
    onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void, particleSystem?: IParticleSystem): Effect {

    var attributesNamesOrOptions: Array<string> = [];
    var effectCreationOption: Array<string> = [];
    var allSamplers: Array<string> = [];

    if (particleSystem) {
        particleSystem.fillUniformsAttributesAndSamplerNames(effectCreationOption, attributesNamesOrOptions, allSamplers);
    } else {
        attributesNamesOrOptions = ParticleSystem._GetAttributeNamesOrOptions();
        effectCreationOption = ParticleSystem._GetEffectCreationOptions();
    }

    if (defines.indexOf(" BILLBOARD") === -1) {
        defines += "\n#define BILLBOARD\n";
    }

    if (samplers.indexOf("diffuseSampler") === -1) {
        samplers.push("diffuseSampler");
    }

    return this.createEffect(
        {
            vertex: particleSystem?.vertexShaderName ?? "particles",
            fragmentElement: fragmentName
        },
        attributesNamesOrOptions,
        effectCreationOption.concat(uniformsNames),
        allSamplers.concat(samplers), defines, fallbacks, onCompiled, onError);
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

Mesh.prototype.getEmittedParticleSystems = function(): IParticleSystem[] {
    var results = new Array<IParticleSystem>();
    for (var index = 0; index < this.getScene().particleSystems.length; index++) {
        var particleSystem = this.getScene().particleSystems[index];
        if (particleSystem.emitter === this) {
            results.push(particleSystem);
        }
    }
    return results;
};

Mesh.prototype.getHierarchyEmittedParticleSystems = function(): IParticleSystem[] {
    var results = new Array<IParticleSystem>();
    var descendants = this.getDescendants();
    descendants.push(this);

    for (var index = 0; index < this.getScene().particleSystems.length; index++) {
        var particleSystem = this.getScene().particleSystems[index];
        let emitter: any = particleSystem.emitter;

        if (emitter.position && descendants.indexOf(emitter) !== -1) {
            results.push(particleSystem);
        }
    }

    return results;
};
