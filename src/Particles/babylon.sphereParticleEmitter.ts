module BABYLON {
    export class SphereParticleEmitter implements IParticleEmitterType {
        constructor(private redius: number) {

        }

        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            // measure the direction Vector from the emitter to the particle.
            var direction = particle.position.subtract(worldMatrix.getTranslation());
            Vector3.TransformNormalFromFloatsToRef(direction.x * emitPower, direction.y * emitPower, direction.z * emitPower, worldMatrix, directionToUpdate);
        }

        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var phi = ParticleSystem.randomNumber(0, 2 * Math.PI);
            var theta = ParticleSystem.randomNumber(0, Math.PI);
            var randX = this.redius * Math.cos(phi) * Math.sin(theta);
            var randY = this.redius * Math.cos(theta);
            var randZ = this.redius * Math.sin(phi) * Math.sin(theta);
            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }
    }

    export class SphereDirectedParticleEmitter extends SphereParticleEmitter {
        constructor(redius: number, private direction1: Vector3, private direction2: Vector3) {
            super(redius);
        }

        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var randX = ParticleSystem.randomNumber(this.direction1.x, this.direction2.x);
            var randY = ParticleSystem.randomNumber(this.direction1.y, this.direction2.y);
            var randZ = ParticleSystem.randomNumber(this.direction1.z, this.direction2.z);
            Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        }
    }
}