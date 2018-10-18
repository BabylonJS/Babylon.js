module BABYLON {
    /**
     * This class is made for on one-liner static method to help creating particle system set.
     */
    export class ParticleHelper {
        /**
         * Gets or sets base Assets URL
         */
        public static BaseAssetsUrl = "https://assets.babylonjs.com/particles";

        /**
         * Create a default particle system that you can tweak
         * @param emitter defines the emitter to use
         * @param capacity defines the system capacity (default is 500 particles)
         * @param scene defines the hosting scene
         * @param useGPU defines if a GPUParticleSystem must be created (default is false)
         * @returns the new Particle system
         */
        public static CreateDefault(emitter: Nullable<AbstractMesh | Vector3>, capacity = 500, scene?: Scene, useGPU = false): IParticleSystem {
            var system: IParticleSystem;

            if (useGPU) {
                system = new GPUParticleSystem("default system", {capacity: capacity}, scene!);
            } else {
                system = new ParticleSystem("default system", capacity, scene!);
            }

            system.emitter = emitter;
            system.particleTexture = new Texture("https://www.babylonjs.com/assets/Flare.png", system.getScene());
            system.createConeEmitter(0.1, Math.PI / 4);

            // Particle color
            system.color1 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            system.color2 = new BABYLON.Color4(1.0, 1.0, 1.0, 1.0);
            system.colorDead = new BABYLON.Color4(1.0, 1.0, 1.0, 0.0);

            // Particle Size
            system.minSize = 0.1;
            system.maxSize = 0.1;

            // Emission speed
            system.minEmitPower = 2;
            system.maxEmitPower = 2;

            // Update speed
            system.updateSpeed = 1 / 60;

            system.emitRate = 30;

            return system;
        }

        /**
         * This is the main static method (one-liner) of this helper to create different particle systems
         * @param type This string represents the type to the particle system to create
         * @param scene The scene where the particle system should live
         * @param gpu If the system will use gpu
         * @returns the ParticleSystemSet created
         */
        public static CreateAsync(type: string, scene: Nullable<Scene>, gpu: boolean = false): Promise<ParticleSystemSet> {

            if (!scene) {
                scene = Engine.LastCreatedScene;
            }

            let token = {};

            scene!._addPendingData(token);

            return new Promise((resolve, reject) => {
                if (gpu && !GPUParticleSystem.IsSupported) {
                    scene!._removePendingData(token);
                    return reject("Particle system with GPU is not supported.");
                }

                Tools.LoadFile(`${ParticleHelper.BaseAssetsUrl}/systems/${type}.json`, (data, response) => {
                    scene!._removePendingData(token);
                    const newData = JSON.parse(data.toString());
                    return resolve(ParticleSystemSet.Parse(newData, scene!, gpu));
                }, undefined, undefined, undefined, (req, exception) => {
                    scene!._removePendingData(token);
                    return reject(`An error occured while the creation of your particle system. Check if your type '${type}' exists.`);
                });

            });
        }

        /**
         * Static function used to export a particle system to a ParticleSystemSet variable.
         * Please note that the emitter shape is not exported
         * @param systems defines the particle systems to export
         * @returns the created particle system set
         */
        public static ExportSet(systems: IParticleSystem[]): ParticleSystemSet {
            var set = new ParticleSystemSet();

            for (var system of systems) {
                set.systems.push(system);
            }

            return set;
        }
    }

}