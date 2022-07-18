import type { IActionOptions } from "./BaseAction";
import { BaseAction } from "./BaseAction";

export class NullAction extends BaseAction<IActionOptions> {

    protected async _execute(): Promise<void> {
        return;
    }

    protected _stop(): void {
    }

    protected _pause(): void {
    }

    protected _resume(): void {
    }
}
