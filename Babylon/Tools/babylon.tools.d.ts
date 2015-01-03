declare module BABYLON {
    interface IAnimatable {
        animations: Animation[];
    }
    interface ISize {
        width: number;
        height: number;
    }
    class Tools {
        static BaseUrl: string;
        static GetExponantOfTwo: (value: number, max: number) => number;
        static GetFilename(path: string): string;
        static GetDOMTextContent(element: HTMLElement): string;
        static ToDegrees(angle: number): number;
        static ToRadians(angle: number): number;
        static ExtractMinAndMaxIndexed(positions: number[], indices: number[], indexStart: number, indexCount: number): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static ExtractMinAndMax(positions: number[], start: number, count: number): {
            minimum: Vector3;
            maximum: Vector3;
        };
        static MakeArray(obj: any, allowsNullUndefined?: boolean): any[];
        static GetPointerPrefix(): string;
        static QueueNewFrame(func: any): void;
        static RequestFullscreen(element: any): void;
        static ExitFullscreen(): void;
        static CleanUrl(url: string): string;
        static LoadImage(url: string, onload: any, onerror: any, database: any): HTMLImageElement;
        static LoadFile(url: string, callback: (data: any) => void, progressCallBack?: () => void, database?: any, useArrayBuffer?: boolean, onError?: () => void): void;
        static ReadFileAsDataURL(fileToLoad: any, callback: any, progressCallback: any): void;
        static ReadFile(fileToLoad: any, callback: any, progressCallBack: any, useArrayBuffer?: boolean): void;
        static Clamp(value: number, min?: number, max?: number): number;
        static Format(value: number, decimals?: number): string;
        static CheckExtends(v: Vector3, min: Vector3, max: Vector3): void;
        static WithinEpsilon(a: number, b: number): boolean;
        static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[]): void;
        static IsEmpty(obj: any): boolean;
        static RegisterTopRootEvents(events: {
            name: string;
            handler: EventListener;
        }[]): void;
        static UnregisterTopRootEvents(events: {
            name: string;
            handler: EventListener;
        }[]): void;
        static CreateScreenshot(engine: Engine, camera: Camera, size: any): void;
        static ValidateXHRData(xhr: XMLHttpRequest, dataType?: number): boolean;
        private static _NoneLogLevel;
        private static _MessageLogLevel;
        private static _WarningLogLevel;
        private static _ErrorLogLevel;
        private static _LogCache;
        static OnNewCacheEntry: (entry: string) => void;
        static NoneLogLevel : number;
        static MessageLogLevel : number;
        static WarningLogLevel : number;
        static ErrorLogLevel : number;
        static AllLogLevel : number;
        private static _AddLogEntry(entry);
        private static _FormatMessage(message);
        static Log: (message: string) => void;
        private static _LogDisabled(message);
        private static _LogEnabled(message);
        static Warn: (message: string) => void;
        private static _WarnDisabled(message);
        private static _WarnEnabled(message);
        static Error: (message: string) => void;
        private static _ErrorDisabled(message);
        private static _ErrorEnabled(message);
        static LogCache : string;
        static LogLevels : number;
        private static _PerformanceNoneLogLevel;
        private static _PerformanceUserMarkLogLevel;
        private static _PerformanceConsoleLogLevel;
        private static _performance;
        static PerformanceNoneLogLevel : number;
        static PerformanceUserMarkLogLevel : number;
        static PerformanceConsoleLogLevel : number;
        static PerformanceLogLevel : number;
        static _StartPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _EndPerformanceCounterDisabled(counterName: string, condition?: boolean): void;
        static _StartUserMark(counterName: string, condition?: boolean): void;
        static _EndUserMark(counterName: string, condition?: boolean): void;
        static _StartPerformanceConsole(counterName: string, condition?: boolean): void;
        static _EndPerformanceConsole(counterName: string, condition?: boolean): void;
        static StartPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static EndPerformanceCounter: (counterName: string, condition?: boolean) => void;
        static Now : number;
        static GetFps(): number;
    }
}
