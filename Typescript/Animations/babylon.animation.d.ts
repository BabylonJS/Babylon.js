/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Animation {
        name: string;
        targetProperty: string;
        targetPropertyPath: string[];
        framePerSecond: number;
        dataType: number;
        loopMode: number;
        _keys: number[];
        _offsetCache: Object;
        _highLimitsCache: Object;

        constructor(name: string, targetProperty: string, framePerSecond: number, dataType: number, loopMode: number);

        clone(): Animation;
        setKeys(values: any[]);
        _interpolate(currentFrame: number, repeatCount: number, loopMode: number, offsetValue: number, highLimitValue: number);
        animate(target: Object, delay: number, from: number, to: number, loop: boolean, speedRatio: number): boolean;
        
        static ANIMATIONTYPE_FLOAT: number;
        static ANIMATIONTYPE_VECTOR3: number;
        static ANIMATIONTYPE_QUATERNION: number;
        static ANIMATIONTYPE_MATRIX: number;

        static ANIMATIONLOOPMODE_RELATIVE: number;
        static ANIMATIONLOOPMODE_CYCLE: number;
        static ANIMATIONLOOPMODE_CONSTANT: number;
    }
}   