module BABYLON {
    /**
     * Particle emitter emitting particles from the inside of a box.
     * It emits the particles randomly between 2 given directions. 
     */
    export class BoxParticleEmitter implements IParticleEmitterType {

        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public direction1 = new Vector3(0, 1.0, 0);
        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public direction2 = new Vector3(0, 1.0, 0);

        /**
         * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public minEmitBox = new Vector3(-0.5, -0.5, -0.5);
        /**
         * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public maxEmitBox = new Vector3(0.5, 0.5, 0.5);  
               
        /**
         * Creates a new instance of @see BoxParticleEmitter
         */
        constructor() {

        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        public startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var randX = Scalar.RandomRange(this.direction1.x, this.direction2.x);
            var randY = Scalar.RandomRange(this.direction1.y, this.direction2.y);
            var randZ = Scalar.RandomRange(this.direction1.z, this.direction2.z);

            Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        }

        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        public startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var randX = Scalar.RandomRange(this.minEmitBox.x, this.maxEmitBox.x);
            var randY = Scalar.RandomRange(this.minEmitBox.y, this.maxEmitBox.y);
            var randZ = Scalar.RandomRange(this.minEmitBox.z, this.maxEmitBox.z);

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }

        /**
         * Clones the current emitter and returns a copy of it
         * @returns the new emitter
         */
        public clone(): BoxParticleEmitter
        {
            let newOne = new BoxParticleEmitter();

            Tools.DeepCopy(this, newOne);

            return newOne;
        }

        /**
         * Called by the {BABYLON.GPUParticleSystem} to setup the update shader
         * @param effect defines the update shader
         */        
        public applyToShader(effect: Effect): void {            
            effect.setVector3("direction1", this.direction1);
            effect.setVector3("direction2", this.direction2);
        }

        /**
         * Returns a string to use to update the GPU particles update shader
         */
        public getEffectDefines(): string {
            return "#define BOXEMITTER"
        }
    }
}