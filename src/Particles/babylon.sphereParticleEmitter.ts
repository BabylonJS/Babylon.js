module BABYLON {
    /**
     * Particle emitter emitting particles from the inside of a sphere.
     * It emits the particles alongside the sphere radius. The emission direction might be randomized.
     */
    export class SphereParticleEmitter implements IParticleEmitterType {

        /**
         * Creates a new instance of @see SphereParticleEmitter
         * @param radius the radius of the emission sphere
         * @param directionRandomizer defines how much to randomize the particle direction [0-1]
         */
        constructor(
            /**
             * The radius of the emission sphere.
             */
            public radius: number, 
            /**
             * How much to randomize the particle direction [0-1].
             */
            public directionRandomizer = 0) {

        }

        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var direction = particle.position.subtract(worldMatrix.getTranslation()).normalize();
            // var randX = Scalar.RandomRange(0, this.directionRandomizer);
            // var randY = Scalar.RandomRange(0, this.directionRandomizer);
            // var randZ = Scalar.RandomRange(0, this.directionRandomizer);
            // direction.x += randX;
            // direction.y += randY;
            // direction.z += randZ;
            // direction.normalize();

            Vector3.TransformNormalFromFloatsToRef(direction.x * emitPower, direction.y * emitPower, direction.z * emitPower, worldMatrix, directionToUpdate);
        }

        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var phi = Scalar.RandomRange(0, 2 * Math.PI);
            var theta = Scalar.RandomRange(0, Math.PI);
            var randX = this.radius * Math.cos(phi) * Math.sin(theta);
            var randY = this.radius * Math.cos(theta);
            var randZ = this.radius * Math.sin(phi) * Math.sin(theta);
            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }
    }

    /**
     * Particle emitter emitting particles from the inside of a sphere.
     * It emits the particles randomly between two vectors.
     */
    export class SphereDirectedParticleEmitter extends SphereParticleEmitter {

        /**
         * Creates a new instance of @see SphereDirectedParticleEmitter
         * @param radius the radius of the emission sphere
         * @param direction1 the min limit of the emission direction
         * @param direction2 the max limit of the emission direction
         */
        constructor(radius: number, 
            /**
             * The min limit of the emission direction.
             */
            public direction1: Vector3, 
            /**
             * The max limit of the emission direction.
             */
            public direction2: Vector3) {
            super(radius);
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
    }
}