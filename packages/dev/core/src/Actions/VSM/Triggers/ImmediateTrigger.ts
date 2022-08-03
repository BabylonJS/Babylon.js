import { BaseTrigger } from "./BaseTrigger";
import type { Scene } from "../../../scene";

export interface IImmediateTriggerOptions {
    runOnNextFrame?: boolean;
}

export class ImmediateTrigger extends BaseTrigger<IImmediateTriggerOptions> {
    constructor(options: IImmediateTriggerOptions) {
        super(options);
        this.removeAfterTrigger = true;
    }

    protected _checkConditions(scene: Scene): boolean {
        return true;
    }
}
