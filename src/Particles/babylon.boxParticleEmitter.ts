module BABYLON {
    export interface IParticleEmitterType {
        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void;
        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void;
    }

    export class BoxPartcileEmitter implements IParticleEmitterType {
        // to be updated like the rest of emitters when breaking changes.
        constructor(private particleSystem: ParticleSystem) {

        }

        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var randX = ParticleSystem.randomNumber(this.particleSystem.direction1.x, this.particleSystem.direction2.x);
            var randY = ParticleSystem.randomNumber(this.particleSystem.direction1.y, this.particleSystem.direction2.y);
            var randZ = ParticleSystem.randomNumber(this.particleSystem.direction1.z, this.particleSystem.direction2.z);

            Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        }

        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var randX = ParticleSystem.randomNumber(this.particleSystem.minEmitBox.x, this.particleSystem.maxEmitBox.x);
            var randY = ParticleSystem.randomNumber(this.particleSystem.minEmitBox.y, this.particleSystem.maxEmitBox.y);
            var randZ = ParticleSystem.randomNumber(this.particleSystem.minEmitBox.z, this.particleSystem.maxEmitBox.z);

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }
    }
}