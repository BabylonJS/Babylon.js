// eslint-disable-next-line import/no-internal-modules
import type { Nullable, FrameGraphContext, IFrameGraphPass, FrameGraphTask } from "core/index";

/**
 * @internal
 */
export class FrameGraphPass<T extends FrameGraphContext> implements IFrameGraphPass {
    private _executeFunc: (context: T) => void;

    public disabled = false;

    constructor(
        public name: string,
        protected readonly _parentTask: FrameGraphTask,
        protected readonly _context: T
    ) {}

    public setExecuteFunc(func: (context: T) => void) {
        this._executeFunc = func;
    }

    public _execute() {
        if (!this.disabled) {
            this._executeFunc(this._context);
        }
    }

    public _isValid(): Nullable<string> {
        return this._executeFunc !== undefined ? null : "Execute function is not set (call setExecuteFunc to set it)";
    }
}
