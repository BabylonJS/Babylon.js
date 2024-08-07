import type { IFrameGraphPass } from "./IFrameGraphPass";
import type { FrameGraphContext } from "../frameGraphContext";

export class FrameGraphPassBuilder<T extends FrameGraphContext> implements IFrameGraphPass {
    private _executeFunc: (context: T) => void;

    constructor(
        public name: string,
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
    public _isValid(): boolean {
        return this._executeFunc !== undefined;
    }
}
