import type { Nullable } from "../../types";
import type { IFrameGraphPass } from "./IFrameGraphPass";
import type { FrameGraphContext } from "../frameGraphContext";
import type { IFrameGraphTask } from "../Tasks/IFrameGraphTask";

export class FrameGraphPass<T extends FrameGraphContext> implements IFrameGraphPass {
    private _executeFunc: (context: T) => void;

    constructor(
        public name: string,
        protected _parentTask: IFrameGraphTask,
        protected _context: T
    ) {}

    public setExecuteFunc(func: (context: T) => void) {
        this._executeFunc = func;
    }

    /** @internal */
    public _execute() {
        this._executeFunc(this._context);
    }

    /** @internal */
    public _isValid(): Nullable<string> {
        return this._executeFunc !== undefined ? null : "Execute function is not set (call setExecuteFunc to set it)";
    }
}
