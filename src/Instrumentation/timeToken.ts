import { Nullable } from "types";
import { _DepthCullingState, _StencilState, _AlphaState } from "States";
    /**
     * @hidden
     **/
    export class _TimeToken {
        public _startTimeQuery: Nullable<WebGLQuery>;
        public _endTimeQuery: Nullable<WebGLQuery>;
        public _timeElapsedQuery: Nullable<WebGLQuery>;
        public _timeElapsedQueryEnded = false;
    }
