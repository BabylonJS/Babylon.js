import type { Nullable, FrameGraphContext, IFrameGraphPass, FrameGraphTask } from "core/index";

/**
 * Base class for a frame graph pass.
 */
export class FrameGraphPass<T extends FrameGraphContext> implements IFrameGraphPass {
    private _executeFunc: (context: T) => void;

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
     * Executes the pass.
     * @param func The function to execute for the pass.
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
    public _isValid(): Nullable<string> {
        return this._executeFunc !== undefined ? null : "Execute function is not set (call setExecuteFunc to set it)";
    }
}
