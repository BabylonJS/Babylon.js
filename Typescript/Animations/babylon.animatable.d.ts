/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class _Animatable {
        target: Object;
        fromFrame: number;
        toFrame: number;
        loopAnimation: boolean;
        animationStartDate: Date;
        speedRatio: number;
        onAnimationEnd: Function;

        constructor(target: Object, from: number, to: number, loop: boolean, speedRatio: number, onAnimationEnd: Function);

        animationStarted: boolean;

        _animate(delay: number): boolean;
    }
}