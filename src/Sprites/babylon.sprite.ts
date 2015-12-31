module BABYLON {
    export class Sprite {
        public position: Vector3;
        public color = new Color4(1.0, 1.0, 1.0, 1.0);
        public width = 1.0;
        public height = 1.0;
        public angle = 0;
        public cellIndex = 0;
        public invertU = 0;
        public invertV = 0;
        public disposeWhenFinishedAnimating: boolean;
        public animations = new Array<Animation>();
        public isVisible = false;
        public isPickable = false;
        public actionManager: ActionManager;

        private _animationStarted = false;
        private _loopAnimation = false;
        private _fromIndex = 0;
        private _toIndex = 0;
        private _delay = 0;
        private _direction = 1;
        private _frameCount = 0;
        private _manager: SpriteManager;
        private _time = 0;

        public get size(): number {
            return this.width;
        }

        public set size(value: number) {
            this.width = value;
            this.height = value;
        }

        constructor(public name: string, manager: SpriteManager) {
            this._manager = manager;

            this._manager.sprites.push(this);

            this.position = Vector3.Zero();
        }

        public playAnimation(from: number, to: number, loop: boolean, delay: number): void {
            this._fromIndex = from;
            this._toIndex = to;
            this._loopAnimation = loop;
            this._delay = delay;
            this._animationStarted = true;

            this._direction = from < to ? 1 : -1;

            this.cellIndex = from;
            this._time = 0;
        }

        public stopAnimation(): void {
            this._animationStarted = false;
        }

        public _animate(deltaTime: number): void {
            if (!this._animationStarted)
                return;

            this._time += deltaTime;
            if (this._time > this._delay) {
                this._time = this._time % this._delay;
                this.cellIndex += this._direction;
                if (this.cellIndex == this._toIndex) {
                    if (this._loopAnimation) {
                        this.cellIndex = this._fromIndex;
                    } else {
                        this._animationStarted = false;
                        if (this.disposeWhenFinishedAnimating) {
                            this.dispose();
                        }
                    }
                }
            }
        }

        public dispose(): void {
            for (var i = 0; i < this._manager.sprites.length; i++) {
                if (this._manager.sprites[i] == this) {
                    this._manager.sprites.splice(i, 1);
                }
            }
        }
    }
} 