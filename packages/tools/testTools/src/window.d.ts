/* eslint-disable @typescript-eslint/naming-convention */
import type { Engine } from "core/Engines/engine";
import type { Scene } from "core/scene";
import type { WebGPUEngine } from "core/Engines/webgpuEngine";

interface StacktracedObject {
    stackTrace: string;
    id: string;
    disposeCalled?: boolean;
    className?: any;
}

declare global {
    // extend the window interface for the tests
    interface Window {
        BABYLON: typeof import("core/index");
        engine: Engine | WebGPUEngine | null;
        scene: Scene | null;
        canvas: HTMLCanvasElement;
        seed: number;
        forceUseReverseDepthBuffer: boolean;
        forceUseNonCompatibilityMode: boolean;
        eventsRegistered: {
            [eventName: string]: {
                numberAdded: number;
                numberRemoved: number;
                registeredFunctions: [{ eventListener: EventListenerOrEventListenerObject | null; timesAdded: number } | null];
                stackTraces: string[];
            };
        };
        classesConstructed: { [id: string]: StacktracedObject };
        // sourcemapping
        sourceMappedStackTrace: {
            mapStackTrace: (
                stackTrace: string,
                callback: (stacked: string[]) => void,
                opts?: { sync?: boolean; cacheGlobally?: boolean; filter?: (line: string) => boolean }
            ) => string;
        };
        sourcemapPromises: Promise<?StacktracedObject>[];
    }
}
