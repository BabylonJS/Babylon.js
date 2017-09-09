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

        constructor(private particleSystem: ParticleSystem, public cellWidth: number = 0, public cellHeight: number = 0, public cellIndex: number = 0, public invertU: number = 0, public invertV: number = 0, private _loopAnimation = false, private _fromIndex = 0, private _toIndex = 0, private _delay = 0, private _sheetDirection = 1, private _time = 0, private disposeWhenFinishedAnimating = false) {
        }

        public _animate(deltaTime: number): void {
            this._time += deltaTime;
            if (this._time > this._delay) {
                this._time = this._time % this._delay;
                this.cellIndex += this._sheetDirection;
                if (this.cellIndex > this._toIndex) {
                    if (this._loopAnimation) {
                        this.cellIndex = this._fromIndex;
                    }
                    else {
                        this.cellIndex = this._toIndex;
                        if (this.disposeWhenFinishedAnimating) {
                            this.ReadyForRecycling();
                        }
                    }
                }
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
            other.cellWidth = this.cellWidth;
            other.cellHeight = this.cellHeight;
            other.cellIndex = this.cellIndex;
            other.invertU = this.invertU;
            other.invertV = this.invertV;
            other._loopAnimation = this._loopAnimation;
            other._fromIndex = this._fromIndex;
            other._toIndex = this._toIndex;
            other._delay = this._delay;
            other._sheetDirection = this._sheetDirection;
            other._time = this._time;
            other.disposeWhenFinishedAnimating = this.disposeWhenFinishedAnimating;
        }

        public ReadyForRecycling() {
            this.age = this.lifeTime;
        }
    }
} 