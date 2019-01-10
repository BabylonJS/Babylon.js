import { Nullable } from "../types";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
/**
 * @hidden
 **/
export class _TimeToken {
    public _startTimeQuery: Nullable<WebGLQuery>;
    public _endTimeQuery: Nullable<WebGLQuery>;
    public _timeElapsedQuery: Nullable<WebGLQuery>;
    public _timeElapsedQueryEnded = false;
}
