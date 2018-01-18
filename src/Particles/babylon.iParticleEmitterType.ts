module BABYLON {
    /**
     * Particle emitter represents a volume emitting particles.
     * This is the responsibility of the implementation to define the volume shape like cone/sphere/box.
     */
    export interface IParticleEmitterType {
        /**
         * Called by the particle System when the direction is computed for the created particle.
         * @param emitPower is the power of the particle (speed)
         * @param worldMatrix is the world matrix of the particle system
         * @param directionToUpdate is the direction vector to update with the result
         * @param particle is the particle we are computed the direction for
         */
        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void;

        /**
         * Called by the particle System when the position is computed for the created particle.
         * @param worldMatrix is the world matrix of the particle system
         * @param positionToUpdate is the position vector to update with the result
         * @param particle is the particle we are computed the position for
         */
        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void;
    }
}