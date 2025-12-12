import type { Nullable, FrameGraphContext, IFrameGraphPass, FrameGraphTask } from "core/index";

/**
 * Base class for a frame graph pass.
 */
export class FrameGraphPass<T extends FrameGraphContext> implements IFrameGraphPass {
    private _executeFunc: (context: T) => void;
    private _initFunc?: (context: T) => void;

    /**
     * Whether the pass is disabled. Disabled passes will be skipped during execution.
     */
    public disabled = false;

    /** @internal */
    constructor(
        public name: string,
        protected readonly _parentTask: FrameGraphTask,
        protected readonly _context: T
    ) {}

    /**
     * Initializes the pass.
     * This function is called once after the frame graph has been built
     * @param func The function to initialize the pass.
     */
    public setInitializeFunc(func: (context: T) => void) {
        this._initFunc = func;
    }

    /**
     * Sets the function to execute when the pass is executed
     * @param func The function to execute when the pass is executed
     */
    public setExecuteFunc(func: (context: T) => void) {
        this._executeFunc = func;
    }

    /** @internal */
    public _execute() {
        if (!this.disabled) {
            this._executeFunc(this._context);
        }
    }

    /** @internal */
    public _initialize() {
        this._initFunc?.(this._context);
    }

    /** @internal */
    public _isValid(): Nullable<string> {
        return this._executeFunc !== undefined ? null : "Execute function is not set (call setExecuteFunc to set it)";
    }

    /** @internal */
    public _dispose() {}
}
