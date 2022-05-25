import { IDisposable, Scene } from "core/scene";
import { ActionManager } from "../actionManager";
import { ExecuteCodeAction } from "../directActions";
import { BaseAction } from "./Actions/BaseAction";
import { BaseBehavior, IBehaviorOptions } from "./baseBehavior";
import { CustomEventManager, ICustomEvent } from "./customEventManager";
import { BaseTrigger } from "./Triggers/BaseTrigger";

/**
 * Behavior manager is in charge of connecting actions and triggers
 */
export class BehaviorManager implements IDisposable {
    private _triggers: BaseTrigger[] = [];
    private _actions: BaseAction[] = [];
    private _behaviors: BaseBehavior[] = [];
    private _customEventManager: CustomEventManager = new CustomEventManager();
    constructor(private _scene: Scene) {
        if (!this._scene.actionManager) {
            this._scene.actionManager = new ActionManager(this._scene);
        }
        this._scene.actionManager.registerAction(
            new ExecuteCodeAction(ActionManager.OnEveryFrameTrigger, () => {
                this._updateTriggers();
            })
        );
        this._customEventManager.onEventRaisedObservable.add(this._onEventTriggered.bind(this));
        this._scene.onDisposeObservable.add(() => {
            this.dispose();
        });
    }

    public addBehavior(trigger: BaseTrigger, action: BaseAction, options?: IBehaviorOptions): void {
        const behavior = new BaseBehavior(trigger, action, options);
        this._behaviors.push(behavior);
        if (!this._triggers.includes(trigger)) {
            this._triggers.push(trigger);
            trigger.customEventManager = this._customEventManager;
        }
        if (!this._actions.includes(action)) {
            this._actions.push(action);
            action.customEventManager = this._customEventManager;
        }
    }

    private _updateTriggers() {
        this._triggers.forEach((trigger) => {
            trigger.update(this._scene);
        });
    }

    private _onEventTriggered(event: ICustomEvent<any>) {
        this._triggers.forEach((trigger) => {
            if (trigger.isEventListened(event.name)) {
                trigger.eventRaised(event);
            }
        });
    }

    dispose(): void {
        // TODO dispose everything
        throw new Error("Method not implemented.");
    }
}
