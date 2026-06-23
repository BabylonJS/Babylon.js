import { type Observer } from "../../Misc/observable";
import { type AbstractEngine } from "../abstractEngine";
import { type Nullable, type int } from "../../types";
import { type _TimeToken } from "../../Instrumentation/timeToken";
// eslint-disable-next-line import/no-duplicates

// eslint-disable-next-line import/no-duplicates

declare module "../../Engines/thinEngine.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface ThinEngine {
        /**
         * @internal
         */
        _captureGPUFrameTime: boolean;

        /**
         * Starts a time query (used to measure time spent by the GPU on a specific frame)
         * Please note that only one query can be issued at a time
         * @returns a time token used to track the time span
         */
        startTimeQuery(): Nullable<_TimeToken>;

        /**
         * Ends a time query
         * @param token defines the token used to measure the time span
         * @returns the time spent (in ns)
         */
        endTimeQuery(token: _TimeToken): int;

        /** @internal */
        _currentNonTimestampToken: Nullable<_TimeToken>;
        /** @internal */
        _gpuFrameTimeToken: Nullable<_TimeToken>;
        /** @internal */
        _onBeginFrameObserver: Nullable<Observer<AbstractEngine>>;
        /** @internal */
        _onEndFrameObserver: Nullable<Observer<AbstractEngine>>;

        /** @internal */
        _createTimeQuery(): Nullable<WebGLQuery>;

        /** @internal */
        _deleteTimeQuery(query: WebGLQuery): void;

        /** @internal */
        _getGlAlgorithmType(algorithmType: number): number;

        /** @internal */
        _getTimeQueryResult(query: WebGLQuery): any;

        /** @internal */
        _getTimeQueryAvailability(query: WebGLQuery): any;
    }
}
