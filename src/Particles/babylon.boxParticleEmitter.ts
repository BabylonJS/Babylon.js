module BABYLON {
    export class BoxParticleEmitter implements IParticleEmitterType {

        public get direction1(): Vector3 {
            return this._particleSystem.direction1;
        }
        public set direction1(value: Vector3) {
            this._particleSystem.direction1 = value;
        }

        public get direction2(): Vector3 {
            return this._particleSystem.direction2;
        }
        public set direction2(value: Vector3) {
            this._particleSystem.direction2 = value;
        }

        public get minEmitBox(): Vector3 {
            return this._particleSystem.minEmitBox;
        }
        public set minEmitBox(value: Vector3) {
            this._particleSystem.minEmitBox = value;
        }

        public get maxEmitBox(): Vector3 {
            return this._particleSystem.maxEmitBox;
        }
        public set maxEmitBox(value: Vector3) {
            this._particleSystem.maxEmitBox = value;
        }
        
        // to be updated like the rest of emitters when breaking changes.
        // all property should be come public variables and passed through constructor.
        constructor(private _particleSystem: ParticleSystem) {

        }

        startDirectionFunction(emitPower: number, worldMatrix: Matrix, directionToUpdate: Vector3, particle: Particle): void {
            var randX = ParticleSystem.randomNumber(this.direction1.x, this.direction2.x);
            var randY = ParticleSystem.randomNumber(this.direction1.y, this.direction2.y);
            var randZ = ParticleSystem.randomNumber(this.direction1.z, this.direction2.z);

            Vector3.TransformNormalFromFloatsToRef(randX * emitPower, randY * emitPower, randZ * emitPower, worldMatrix, directionToUpdate);
        }

        startPositionFunction(worldMatrix: Matrix, positionToUpdate: Vector3, particle: Particle): void {
            var randX = ParticleSystem.randomNumber(this.minEmitBox.x, this.maxEmitBox.x);
            var randY = ParticleSystem.randomNumber(this.minEmitBox.y, this.maxEmitBox.y);
            var randZ = ParticleSystem.randomNumber(this.minEmitBox.z, this.maxEmitBox.z);

            Vector3.TransformCoordinatesFromFloatsToRef(randX, randY, randZ, worldMatrix, positionToUpdate);
        }
    }
}