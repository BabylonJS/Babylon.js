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
         * This is the main static method (one-liner) of this helper to create different particle systems
         * @param type This string represents the type to the particle system to create
         * @param scene The scene where the particle system should live
         * @param gpu If the system will use gpu
         * @returns the ParticleSystemSet created
         */
        public static CreateAsync(type: string, scene: Nullable<Scene>, gpu: boolean = false): Promise<ParticleSystemSet> {
            
            if (!scene) {
                scene = Engine.LastCreatedScene;;
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
         * @param system defines the particle systems to export
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