import { BaseTrigger } from "./BaseTrigger";
import { Scene } from "../../../scene";

export interface IImmediateTriggerOptions {
    runOnNextFrame?: boolean;
}

export class ImmediateTrigger extends BaseTrigger {
    constructor(private _options: IImmediateTriggerOptions) {
        super();
        this.removeAfterTrigger = true;
    }

    protected _checkConditions(scene: Scene): boolean {
        return true;
    }
}
