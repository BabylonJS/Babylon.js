import { BaseAction } from "./BaseAction";

export class LogAction extends BaseAction {
    private _message;

    public constructor(message: string) {
        super();
        this._message = message;
    }

    public execute(): void {
        console.log(this._message);
    }
}
