/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class _Animatable {
        target: Object;  
        fromFrame: number;
        toFrame: number;
        loopAnimation: bool;
        animationStartDate: Date;
        speedRatio: number;

        constructor(target: Object, from: number, to: number, loop: bool, speedRatio?: number);

        _animate(): bool;
    }

    class Animation {
        name: string;
        targetPropertyPath: string[];
        framePerSecond: number;
        dataType: string;
        loopMode: number;
        _keys: number[];

        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: string, loopMode: number);

        clone(): Animation;
        setKeys(values: number[]);
        _interpolate(currentFrame: number, repeatCount: number, loopMode: number, offsetValue: number, highLimitValue: number);
        animate(target: Object, delay: number, from: number, to: number, loop: bool, speedRatio: number): bool;
        
        static ANIMATIONTYPE_FLOAT: number;
        static ANIMATIONTYPE_VECTOR3: number;
        static ANIMATIONTYPE_QUATERNION: number;

        static ANIMATIONLOOPMODE_RELATIVE: number;
        static ANIMATIONLOOPMODE_CYCLE: number;
        static ANIMATIONLOOPMODE_CONSTANT: number;
    }
}