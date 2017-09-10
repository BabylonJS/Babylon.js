module BABYLON {

    export class Particle {
        public position = Vector3.Zero();
        public direction = Vector3.Zero();
        public color = new Color4(0, 0, 0, 0);
        public colorStep = new Color4(0, 0, 0, 0);
        public lifeTime = 1.0;
        public age = 0;
        public size = 0;
        public angle = 0;
        public angularSpeed = 0;

        private _currentFrameCounter = 0;

        constructor(private particleSystem: ParticleSystem, public cellIndex: number = 0, private _loopAnimation = false, private _fromIndex = 0, private _toIndex = 0) {
            this.cellIndex = this._fromIndex;

            if (this.particleSystem.spriteCellChangeSpeed == 0) {
                this.updateCellIndex = this.updateCellIndexWithSpeedCalculated;
            }
            else {
                this.updateCellIndex = this.updateCellIndexWithCustomSpeed;
            }
        }

        public updateCellIndex: (scaledUpdateSpeed: number) => void;

        private updateCellIndexWithSpeedCalculated(scaledUpdateSpeed: number): void {
            var ageOffset = this.lifeTime - this.age;
            var numberOfScaledSlots = ageOffset / scaledUpdateSpeed;
            var availableIndexes = this._toIndex +1 - this.cellIndex;
            var incrementAt = numberOfScaledSlots / availableIndexes;

            this._currentFrameCounter += scaledUpdateSpeed;
            if (this._currentFrameCounter >= incrementAt * scaledUpdateSpeed) {
                this._currentFrameCounter = 0;
                this.cellIndex++;
                if (this.cellIndex > this._toIndex) {
                    this.cellIndex = this._toIndex;
                }
            }
        }

        private updateCellIndexWithCustomSpeed(): void {
            if (this._currentFrameCounter >= this.particleSystem.spriteCellChangeSpeed) {
                this.cellIndex++;
                this._currentFrameCounter = 0;
                if (this.cellIndex > this._toIndex) {
                    if (this._loopAnimation) {
                        this.cellIndex = this._fromIndex;
                    }
                    else {
                        this.cellIndex = this._toIndex;
                    }
                }
            }
            else {
                this._currentFrameCounter++;
            }
        }

        public copyTo(other: Particle) {
            other.position.copyFrom(this.position);
            other.direction.copyFrom(this.direction);
            other.color.copyFrom(this.color);
            other.colorStep.copyFrom(this.colorStep);
            other.lifeTime = this.lifeTime;
            other.age = this.age;
            other.size = this.size;
            other.angle = this.angle;
            other.angularSpeed = this.angularSpeed;
            other.particleSystem = this.particleSystem;
            other.cellIndex = this.cellIndex;
            other._loopAnimation = this._loopAnimation;
            other._fromIndex = this._fromIndex;
            other._toIndex = this._toIndex;
        }

        public readyForRecycling() {
            this.age = this.lifeTime;
        }
    }
} 