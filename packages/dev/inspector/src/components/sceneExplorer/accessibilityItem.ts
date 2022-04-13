import { Node } from "babylonjs";
import { IAction } from "babylonjs/Actions/action";
import { Constants } from "babylonjs/Engines/constants";

export const enum ActionType {
    OnClick,
    OnRightClick
}

/**
 * A abstract layer to store the accessibility tree structure (the collections of nodes who's accessibility tag is marked as salient, and their parent-child relationship). It also stores info to define how to render: the level number to inform heading level; and actions to inform whether it should be a button.
 */
export class AccessibilityItem {
    public node: Node;
    public children: AccessibilityItem[];
    public level: number; // to indicate heading level

    private _isActionable?: boolean;

    constructor(node: Node, children: AccessibilityItem[], level: number) {
        this.node = node;
        this.children = children;
        this.level = level;
    }

    public get isActionable(): boolean {
        if(this._isActionable === undefined) {
            this._isActionable = this.node._getActionManagerForTrigger()?.hasPickTriggers!!;
        }
        return this._isActionable;
    }

    public getActionHandler(type: ActionType): undefined | (() => void)  {
        if(!this.isActionable) {
            return undefined;
        }
        let actions: IAction[] = [];
        switch(type) {
            case ActionType.OnClick:
                actions.push(...this._getTriggerActions(Constants.ACTION_OnLeftPickTrigger));
                actions.push(...this._getTriggerActions(Constants.ACTION_OnPickTrigger));
                break;
            case ActionType.OnRightClick:
                actions.push(...this._getTriggerActions(Constants.ACTION_OnRightPickTrigger));
                actions.push(...this._getTriggerActions(Constants.ACTION_OnPickTrigger));
                break;
        }

        if(actions.length === 0) {
            return undefined;
        }
        return () => {
            actions.forEach((action) => {
                action._executeCurrent();
            });
        }
    }

    // TODO: maybe remove this
    public toString(): string {
        return `{${this.node.name}, [${this.children.map((child) => `${child.toString()}`).join(", ")}]}`;
    }

    private _getTriggerActions(trigger: number): IAction[] {
        const triggerActions = this.node._getActionManagerForTrigger(trigger)?.actions.filter(action => action.trigger == trigger);
        return triggerActions?? [];
    }
}