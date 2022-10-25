import type { Scene } from "core/scene";
import type { BaseAction } from "./actions/BaseAction";
import { BaseBehavior } from "./BaseBehavior";
import type { BaseTrigger } from "./triggers/BaseTrigger";

/**
 * This class is responsible for checking the execution state of triggers and enabling actions to run
 */
export class ActionCoordinator {
    private _scene: Scene;
    private _behaviors: BaseBehavior[] = [];
    private _triggers: BaseTrigger[] = [];

    constructor(scene: Scene) {
        this._scene = scene;
    }

    public addBehavior(trigger: BaseTrigger, action: BaseAction) {
        if (this._triggers.indexOf(trigger) === -1) {
            this._triggers.push(trigger);
        }
        const behavior = new BaseBehavior(trigger, action);
        behavior.build();
        this._behaviors.push(behavior);
    }

    public start() {
        this._scene.onBeforeRenderObservable.add(() => {
            this._checkTriggers(this._scene);
        });
    }

    private _checkTriggers(scene: Scene) {
        this._triggers.forEach((trigger) => {
            trigger._check(scene);
        });
    }
}
