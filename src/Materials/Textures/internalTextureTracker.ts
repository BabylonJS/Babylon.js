import { Nullable } from "../../types";
import { _TimeToken } from "../../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../../States/index";
/**
 * Internal interface used to track InternalTexture already bound to the GL context
 */
export interface IInternalTextureTracker {
    /**
     * Gets or set the previous tracker in the list
     */
    previous: Nullable<IInternalTextureTracker>;
    /**
     * Gets or set the next tracker in the list
     */
    next: Nullable<IInternalTextureTracker>;
}

/**
 * Internal class used by the engine to get list of InternalTexture already bound to the GL context
 */
export class DummyInternalTextureTracker {
    /**
     * Gets or set the previous tracker in the list
     */
    public previous: Nullable<IInternalTextureTracker> = null;
    /**
     * Gets or set the next tracker in the list
     */
    public next: Nullable<IInternalTextureTracker> = null;
}
