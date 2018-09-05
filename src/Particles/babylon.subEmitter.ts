module BABYLON {
    /**
     * Type of sub emitter
     */
    export enum SubEmitterType {
        /**
         * Attached to the particle over it's lifetime
         */
        ATTACHED,
        /**
         * Created when the particle dies
         */
        END
    }

    /**
     * Sub emitter class used to emit particles from an existing particle
     */
    export class SubEmitter {
        /**
         * Type of the submitter (Default: END)
         */
        public type = SubEmitterType.END;
        /**
         * If the particle should inherit the direction from the particle it's attached to. (+Y will face the direction the particle is moving) (Default: false)
         * Note: This only is supported when using an emitter of type Mesh
         */
        public inheritDirection = false;
        /**
         * How much of the attached particles speed should be added to the sub emitted particle (default: 0)
         */
        public inheritedVelocityAmount = 0;
        /**
         * Creates a sub emitter
         * @param particleSystem the particle system to be used by the sub emitter
         */
        constructor(public particleSystem:ParticleSystem){
        }
        /**
         * Clones the sub emitter
         */
        clone():SubEmitter{
            // Clone particle system
            var emitter = this.particleSystem.emitter;
            if(!emitter){
                emitter = new Vector3();
            }else if(emitter instanceof Vector3){
                emitter = emitter.clone();
            }else if(emitter instanceof AbstractMesh){
                emitter = new Mesh("", emitter._scene);
            }
            var clone = new SubEmitter(this.particleSystem.clone("",emitter));

            // Clone properties
            clone.type = this.type;
            clone.inheritDirection = this.inheritDirection;
            clone.inheritedVelocityAmount = this.inheritedVelocityAmount;

            clone.particleSystem._disposeEmitterOnDispose = true;
            return clone;
        }
    }
}