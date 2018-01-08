module BABYLON {
    export interface IParticleEmitterType {
        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void;
        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void;
    }
}