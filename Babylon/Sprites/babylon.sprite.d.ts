declare module BABYLON {
    class Sprite {
        public name: string;
        public position: Vector3;
        public color: Color4;
        public size: number;
        public angle: number;
        public cellIndex: number;
        public invertU: number;
        public invertV: number;
        public disposeWhenFinishedAnimating: boolean;
        public animations: Animation[];
        private _animationStarted;
        private _loopAnimation;
        private _fromIndex;
        private _toIndex;
        private _delay;
        private _direction;
        private _frameCount;
        private _manager;
        private _time;
        constructor(name: string, manager: SpriteManager);
        public playAnimation(from: number, to: number, loop: boolean, delay: number): void;
        public stopAnimation(): void;
        public _animate(deltaTime: number): void;
        public dispose(): void;
    }
}
