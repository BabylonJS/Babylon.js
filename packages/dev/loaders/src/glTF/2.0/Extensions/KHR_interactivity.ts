/* eslint-disable @typescript-eslint/naming-convention */

import { ArrayItem, RegisterExtension } from "../BaseLoader";
import { GLEFLoader } from "../glEFLoader";
import { IGLEFLoaderExtension } from "../glEFLoaderExtension";
import { EventTrigger } from "core/Actions/VSM/Triggers/EventTrigger";
import { TapTrigger } from "core/Actions/VSM/Triggers/TapTrigger";
import { SpinAction } from "core/Actions/VSM/Actions/SpinAction";
import { ShowAction } from "core/Actions/VSM/Actions/ShowAction";
import { HideAction } from "core/Actions/VSM/Actions/HideAction";
import { Animation } from "core/Animations/animation";

import { EasingFunction, QuadraticEase } from "core/Animations/easing";
import { Vector3 } from "core/Maths/math.vector";

const NAME = "KHR_interactivity";

interface IKHRInteractivity {
    actions: any[];
    behaviors: any[];
    triggers: any[];
    references: any[];
}

/*
List of TODOs:

1) count on assets should be taken into account
2) What is the default mode for behavior? - "ignore"
3) What is "`animation`", where is it defined?
*/

/**
 * [Specification](NOT_YET_AVAILABLE)
 */
export class KHR_Interactivity implements IGLEFLoaderExtension {
    /**
     * The name of this extension.
     */
    public readonly name = NAME;

    /**
     * Defines whether this extension is enabled.
     */
    public enabled: boolean;

    private _loader: GLEFLoader;
    private _behaviors: any[];
    private _triggers: any[];
    private _actions: any[];
    private _references: any[];

    /**
     * @param loader
     * @hidden
     */
    constructor(loader: GLEFLoader) {
        this._loader = loader;
        this.enabled = this._loader.isExtensionUsed(NAME);
        console.log("KHR_interactivity_behavior: enabled", this.enabled);
    }

    /** @hidden */
    public dispose() {
        (this._loader as any) = null;
    }

    /** @hidden */
    public onLoading(): void {
        const extensions = this._loader.json.extensions;
        if (extensions && extensions[this.name]) {
            const extension = extensions[this.name] as IKHRInteractivity;
            ArrayItem.Assign(extension.actions);
            // TODO - discuss this with gary - is this always needed?
            // ArrayItem.Assign(this._references);
            ArrayItem.Assign(extension.behaviors);
            ArrayItem.Assign(extension.triggers);

            this._actions = extension.actions;
            this._behaviors = extension.behaviors;
            this._triggers = extension.triggers;
            this._references = extension.references;
        }
    }

    /** @hidden */
    public onReady(): void {
        this._loadInteractivityAsync();
    }

    private _loadInteractivityAsync(): void {
        // analyze the behaviors array and process everything there. The rest are all passive until needed.
        console.log("KHR_interactivity_behavior: loadInteractivityAsync");
        // generate all actions
        const actions = this._actions?.map((action) => {
            action._babylonBehavior = this._processAction(action);
            return action._babylonBehavior;
        });
        // generate all triggers
        const triggers = this._triggers?.map((trigger) => {
            trigger._babylonTrigger = this._generateTrigger(trigger);
            return trigger._babylonTrigger;
        });
        // connect all actions to triggers
        this._behaviors?.forEach((behavior) => {
            const trigger = (triggers || [])[behavior.trigger];
            const action = (actions || [])[behavior.action];
            if (trigger && action) {
                behavior._babylonBehavior = this._loader._behaviorManager.addBehavior(trigger, action);
            }
        });
    }

    private _generateTrigger(triggerData: { type: string; index: number; subject?: number }) {
        // optional subject for some triggers
        const subject = this._getSubjectForData(triggerData.subject);
        // TODO handle the other triggers
        switch (triggerData.type) {
            case "sceneStart":
                return new EventTrigger({
                    eventName: "sceneStart",
                });
            case "tap":
                return new TapTrigger({
                    subject,
                });
        }
        return null;
    }

    private _generateAction(actionData: { type: string; parameters?: { subject?: number; [key: string]: any }; next?: number; parallel?: number }) {
        const subject = this._getSubjectForData(actionData.parameters?.subject);
        // TODO handle the other action types
        switch (actionData.type) {
            case "spin":
                return new SpinAction({
                    subject,
                });
            case "hide":
            case "show": {
                // calculate "fps" with duration
                const fps = 100 / (actionData.parameters?.duration || 1);
                // for now, create the animation here until the architecture change
                let animation: Animation | undefined = undefined;
                // no animation when it is 0 or undefined
                if (actionData.parameters?.showHideEffect) {
                    // support scaling/fading
                    // TODO extract this to an external, reusable function

                    // scaling
                    if (actionData.parameters?.showHideEffect === 2) {
                        animation = new Animation(`gltf-${subject.name}-${actionData.type}`, "scaling", fps, Animation.ANIMATIONTYPE_VECTOR3, Animation.ANIMATIONLOOPMODE_CONSTANT);
                        animation.setKeys([
                            {
                                frame: 0,
                                value: actionData.type === "hide" ? subject.scaling.clone() : new Vector3(0, 0, 0),
                            },
                            {
                                frame: 100,
                                value: actionData.type === "show" ? subject.scaling.clone() : new Vector3(0, 0, 0),
                            },
                        ]);
                    } else if (actionData.parameters?.showHideEffect === 1) {
                        animation = new Animation(
                            `gltf-${subject.name}-${actionData.type}`,
                            "visibility",
                            fps,
                            Animation.ANIMATIONTYPE_FLOAT,
                            Animation.ANIMATIONLOOPMODE_CONSTANT
                        );
                        animation.setKeys([
                            {
                                frame: 0,
                                value: actionData.type === "hide" ? 1 : 0,
                            },
                            {
                                frame: 100,
                                value: actionData.type === "show" ? 1 : 0,
                            },
                        ]);
                    } else {
                        throw new Error("unknown animation type");
                    }

                    // Set easing. TODO - move it out to a private function
                    if (actionData.parameters.easing) {
                        const easing = new QuadraticEase();
                        switch (actionData.parameters.easing) {
                            case 3:
                                easing.setEasingMode(EasingFunction.EASINGMODE_EASEIN);
                                break;
                            case 2:
                                easing.setEasingMode(EasingFunction.EASINGMODE_EASEOUT);
                                break;
                            case 1:
                                easing.setEasingMode(EasingFunction.EASINGMODE_EASEINOUT);
                                break;
                        }
                        animation.setEasingFunction(easing);
                    }
                }
                return actionData.type === "hide"
                    ? new HideAction({
                          subject,
                          hideAnimation: animation,
                          applyAnimationToChildren: actionData.parameters?.showHideEffect === 1 ? true : false,
                      })
                    : new ShowAction({
                          subject,
                          animation,
                          applyAnimationToChildren: actionData.parameters?.showHideEffect === 1 ? true : false,
                      });
            }
        }
        return null;
    }

    private _processAction(actionData: { type: string; parameters?: { subject?: number }; next?: number; parallel?: number }) {
        const actionForData = this._generateAction(actionData);
        if (actionForData) {
            if (typeof actionData.next === "number") {
                const nextAction = this._processAction(ArrayItem.Get(`actions/${actionData.next}`, this._actions /* as IAction[]*/, actionData.next));
                if (nextAction) {
                    actionForData.nextActions.push(nextAction);
                }
            }
            if (typeof actionData.parallel === "number") {
                const parallelAction = this._processAction(
                    ArrayItem.Get(`actions/${actionData.parallel}`, this._actions /* as IAction[]*/, actionData.parallel)
                );
                if (parallelAction) {
                    actionForData.parallelActions.push(parallelAction);
                }
            }
        }
        return actionForData;
    }

    private _getSubjectForData(subject?: number) {
        if (typeof subject === "number") {
            const reference = this._references[subject];
            // TODO handle the different types
            switch (reference.type) {
                case "node":
                    return this._loader.json.nodes[reference.index]._babylonTransformNode;
            }
        }
        return null;
    }

    // private _getReference(reference: string): any {

    // }
}

RegisterExtension("glef", NAME, (loader) => new KHR_Interactivity(loader as GLEFLoader));
