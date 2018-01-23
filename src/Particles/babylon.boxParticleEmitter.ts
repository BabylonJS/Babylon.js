module BABYLON {
    /**
     * Particle emitter emitting particles from the inside of a box.
     * It emits the particles randomly between 2 given directions. 
     */
    export class BoxParticleEmitter implements IParticleEmitterType {

        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public get direction1(): Vector3 {
            return this._particleSystem.direction1;
        }
        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public set direction1(value: Vector3) {
            this._particleSystem.direction1 = value;
        }

        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public get direction2(): Vector3 {
            return this._particleSystem.direction2;
        }
        /**
         * Random direction of each particle after it has been emitted, between direction1 and direction2 vectors.
         */
        public set direction2(value: Vector3) {
            this._particleSystem.direction2 = value;
        }

        /**
         * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public get minEmitBox(): Vector3 {
            return this._particleSystem.minEmitBox;
        }
        /**
         * Minimum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public set minEmitBox(value: Vector3) {
            this._particleSystem.minEmitBox = value;
        }

        /**
         * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public get maxEmitBox(): Vector3 {
            return this._particleSystem.maxEmitBox;
        }
        /**
         * Maximum box point around our emitter. Our emitter is the center of particles source, but if you want your particles to emit from more than one point, then you can tell it to do so.
         */
        public set maxEmitBox(value: Vector3) {
            this._particleSystem.maxEmitBox = value;
        }
        
        // to be updated like the rest of emitters when breaking changes.
        // all property should be come public variables and passed through constructor.
        /**
         * Creates a new instance of @see BoxParticleEmitter
         * @param _particleSystem the particle system associated with the emitter
         */
        constructor(private _particleSystem: ParticleSystem) {

        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
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
        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var randX = Scalar.RandomRange(this.minEmitBox.x, this.maxEmitBox.x);
            var randY = Scalar.RandomRange(this.minEmitBox.y, this.maxEmitBox.y);
            var randZ = Scalar.RandomRange(this.minEmitBox.z, this.maxEmitBox.z);

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }
    }
}