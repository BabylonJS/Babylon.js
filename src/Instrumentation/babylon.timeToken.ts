module BABYLON {
    export class _TimeToken {
        public _startTimeQuery: Nullable<WebGLQuery>;
        public _endTimeQuery: Nullable<WebGLQuery>;
        public _timeElapsedQuery: Nullable<WebGLQuery>;
        public _timeElapsedQueryEnded = false;
    }
}
