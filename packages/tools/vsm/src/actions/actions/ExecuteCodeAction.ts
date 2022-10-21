import { BaseAction } from "./BaseAction";

export class ExecuteCodeAction extends BaseAction {
    private _code: () => void;

    constructor(code: () => void) {
        super();
        this._code = code;
    }

    public execute(): void {
        this._code();
    }
}
