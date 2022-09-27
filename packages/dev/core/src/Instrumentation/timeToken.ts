import type { Nullable } from "../types";
/**
 * @internal
 **/
// eslint-disable-next-line @typescript-eslint/naming-convention
export class _TimeToken {
    public _startTimeQuery: Nullable<WebGLQuery>;
    public _endTimeQuery: Nullable<WebGLQuery>;
    public _timeElapsedQuery: Nullable<WebGLQuery>;
    public _timeElapsedQueryEnded = false;
}
