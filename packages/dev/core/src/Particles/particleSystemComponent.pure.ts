/** This file must only contain pure code and pure imports */

import { IParticleSystem } from "./IParticleSystem";
import { GPUParticleSystem } from "./gpuParticleSystem.pure";
import { Effect } from "../Materials/effect.pure";
import { ParticleSystem } from "./particleSystem.pure";
import { Scene } from "../scene.pure";
import { SceneComponentConstants } from "../sceneComponent";
import { AssetContainer } from "../assetContainer";
import { EffectFallbacks } from "../Materials/effectFallbacks";
import { AddParser, AddIndividualParser, GetIndividualParser } from "core/Loading/Plugins/babylonFileParser.function";
import { Mesh } from "../Meshes/mesh.pure";
import { AbstractEngine } from "../Engines/abstractEngine.pure";
import { ShaderLanguage } from "core/Materials/shaderLanguage";

let _registered = false;
export function registerParticleSystemComponent(): void {
    if (_registered) {
        return;
    }
    _registered = true;

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

    AbstractEngine.prototype.createEffectForParticles = function (
        fragmentName: string,
        uniformsNames: string[] = [],
        samplers: string[] = [],
        defines = "",
        fallbacks?: EffectFallbacks,
        onCompiled?: (effect: Effect) => void,
        onError?: (effect: Effect, errors: string) => void,
        particleSystem?: IParticleSystem,
        shaderLanguage = ShaderLanguage.GLSL,
        vertexName?: string
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
                vertex: vertexName ?? particleSystem?.vertexShaderName ?? "particles",
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
}
