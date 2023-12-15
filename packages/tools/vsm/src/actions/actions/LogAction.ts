import { BaseAction } from "./BaseAction";

/**
 * This actions logs a message when triggered. Useful for debugging.
 */
export class LogAction extends BaseAction {
    private _message;

    public constructor(message: string) {
        super();
        this._message = message;
    }

    public execute(): void {
        // eslint-disable-next-line no-console
        console.log(this._message);
    }
}
