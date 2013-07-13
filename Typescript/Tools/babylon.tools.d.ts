/// <reference path="../babylon.d.ts" />

declare module BABYLON.Tools {
    function QueueNewFrame(func: Function): void;
    function RequestFullscreen(element: HTMLElement): void;
    function ExitFullscreen(): void;
    var BaseUrl: string;
    function LoadFile(url: string, callback: Function, progressCallback: Function): void;
    function WithinEpsilon(a: number, b: number);
    function DeepCopy(source: Object, destination: Object, doNotCopyList: string[], mustCopyList: string[]);
    function GetFps(): number;
    function GetDeltaTime(): number;
    function _MeasureFps(): void;
}