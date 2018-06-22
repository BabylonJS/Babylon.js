module BABYLON {

    /**
     * Represents a set of particle systems working together to create a specific effect
     */
    export class ParticleSystemSet {
        /**
         * Gets or sets the particle system list
         */
        public systems = new Array<IParticleSystem>();

        /**
         * Starts all particle systems of the set
         * @param emitter defines the mesh to use as emitter for the particle systems
         */
        public start(emitter: AbstractMesh): void {
            for (var system of this.systems) {
                system.emitter = emitter;
                system.start();
            }
        }

        /**
         * Serialize the set into a JSON compatible object
         * @returns a JSON compatible representation of the set
         */
        public serialize(): any {
            var result:any = {};

            result.systems = [];
            for (var system of this.systems) {
                result.systems.push(system.serialize());
            }

            return result;
        }

        /** 
         * Parse a new ParticleSystemSet from a serialized source
         * @param data defines a JSON compatible representation of the set
         * @param scene defines the hosting scene
         * @param gpu defines if we want GPU particles or CPU particles
         * @returns a new ParticleSystemSet
         */
        public static Parse(data: any, scene: Scene, gpu = false): ParticleSystemSet {
            var result = new ParticleSystemSet();
            var rootUrl = ParticleHelper.BaseAssetsUrl + "/textures/";

            for (var system of data.systems) {
                result.systems.push(gpu ? GPUParticleSystem.Parse(system, scene, rootUrl) : ParticleSystem.Parse(system, scene, rootUrl));
            }

            return result;
        }
    }
}