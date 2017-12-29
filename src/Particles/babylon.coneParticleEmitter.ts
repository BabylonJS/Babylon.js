module BABYLON {
    export class ConeParticleEmitter implements IParticleEmitterType {
        constructor(private radius: number, private angle: number) {
        }

        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            if (this.angle === 0) {
                Vector3.TransformNormalFromFloatsToRef(0, emitPower, 0, worldMatrix, directionToUpdate);
            }
            else {
                var phi = ParticleSystem.randomNumber(0, 2 * Math.PI);
                var theta = ParticleSystem.randomNumber(0, this.angle);
                var randX = Math.cos(phi) * Math.sin(theta);
                var randY = Math.cos(theta);
                var randZ = Math.sin(phi) * Math.sin(theta);
                Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
            }
        }

        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var s = ParticleSystem.randomNumber(0, Math.PI * 2);
            var radius = ParticleSystem.randomNumber(0, this.radius);
            var randX = radius * Math.sin(s);
            var randZ = radius * Math.cos(s);

            Vector3.TransformCoordinatesFromFloatsToRef(randX, 0, randZ, worldMatrix, positionToUpdate);
        }
    }
}