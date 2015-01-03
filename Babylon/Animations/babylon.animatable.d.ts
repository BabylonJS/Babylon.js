declare module BABYLON {
    class Animatable {
        public target: any;
        public fromFrame: number;
        public toFrame: number;
        public loopAnimation: boolean;
        public speedRatio: number;
        public onAnimationEnd: any;
        private _localDelayOffset;
        private _pausedDelay;
        private _animations;
        private _paused;
        private _scene;
        public animationStarted: boolean;
        constructor(scene: Scene, target: any, fromFrame?: number, toFrame?: number, loopAnimation?: boolean, speedRatio?: number, onAnimationEnd?: any, animations?: any);
        public appendAnimations(target: any, animations: Animation[]): void;
        public getAnimationByTargetProperty(property: string): Animation;
        public pause(): void;
        public restart(): void;
        public stop(): void;
        public _animate(delay: number): boolean;
    }
}
