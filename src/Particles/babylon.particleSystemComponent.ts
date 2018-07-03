module BABYLON {
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

    export interface Engine {
        /**
         * Create an effect to use with particle systems.
         * Please note that some parameters like animation sheets or not being billboard are not supported in this configuration
         * @param fragmentName defines the base name of the effect (The name of file without .fragment.fx)
         * @param uniformsNames defines a list of attribute names 
         * @param samplers defines an array of string used to represent textures
         * @param defines defines the string containing the defines to use to compile the shaders
         * @param fallbacks defines the list of potential fallbacks to use if shader conmpilation fails
         * @param onCompiled defines a function to call when the effect creation is successful
         * @param onError defines a function to call when the effect creation has failed
         * @returns the new Effect
         */
        createEffectForParticles(fragmentName: string, uniformsNames: string[], samplers: string[], defines: string, fallbacks?: EffectFallbacks,
            onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect
    }

    Engine.prototype.createEffectForParticles = function(fragmentName: string, uniformsNames: string[] = [], samplers: string[] = [], defines = "", fallbacks?: EffectFallbacks,
        onCompiled?: (effect: Effect) => void, onError?: (effect: Effect, errors: string) => void): Effect {

        var attributesNamesOrOptions = ParticleSystem._GetAttributeNamesOrOptions();
        var effectCreationOption = ParticleSystem._GetEffectCreationOptions();

        if (defines.indexOf(" BILLBOARD") === -1) {
            defines += "\n#define BILLBOARD\n";
        }

        if (samplers.indexOf("diffuseSampler") === -1) {
            samplers.push("diffuseSampler");
        }

        return this.createEffect(
            {
                vertex: "particles",
                fragmentElement: fragmentName
            },
            attributesNamesOrOptions,
            effectCreationOption.concat(uniformsNames),
            samplers, defines, fallbacks, onCompiled, onError);
    }
} 