/// <reference path="../babylon.d.ts" />

declare module BABYLON.Tools {
    function ExtractMinAndMax(positions: number[], start: number, count: number): Object;
    function GetPointerPrefix(): string;
    function QueueNewFrame(func: Function): void;
    function RequestFullscreen(element: HTMLElement): void;
    function ExitFullscreen(): void;
    var BaseUrl: string;
    function LoadImage(url: string, onload: Function, onerror: Function, database: Database): HTMLImageElement;
    function LoadFile(url: string, callback: Function, progressCallback: Function): void;
    function isIE(): boolean;
    function WithinEpsilon(a: number, b: number);
    function cloneValue(source: Object, destinationObject: Object): void;
    function DeepCopy(source: Object, destination: Object, doNotCopyList: string[], mustCopyList: string[]);
    var fpsRange: number;
    var previousFramesDuration: number[];
    function GetFps(): number;
    function GetDeltaTime(): number;
    function _MeasureFps(): void;

    class SmartArray {
        data: any[];
        length: number;

        constructor(capacity: number);

        push(value: Object): void;
        pushNoDuplicate(value: Object): void;
        reset(): void;
        concat(array: SmartArray): void;
        concatWithNoDuplicate(array: SmartArray): void;
        indexOf(value: Object): number;
    }
}