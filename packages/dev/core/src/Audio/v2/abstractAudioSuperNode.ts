import type { Nullable } from "../../types";
import type { AudioNodeType } from "./abstractAudioNode";
import { AbstractAudioNode } from "./abstractAudioNode";
import type { AbstractAudioSubNode } from "./abstractAudioSubNode";
import type { AudioEngineV2 } from "./audioEngineV2";

/**
 * Abstract class for an audio node containing audio components.
 */
export abstract class AbstractAudioSuperNode extends AbstractAudioNode {
    /**
     * The name of the audio node.
     */
    public name: string;

    private _components = new Map<string, Set<AbstractAudioSubNode>>();

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType) {
        super(engine, nodeType);
        this.name = name;
    }

    protected abstract _onComponentAdded(component: AbstractAudioSubNode): void;
    protected abstract _onComponentRemoved(component: AbstractAudioSubNode): void;

    protected _addComponent(component: AbstractAudioSubNode): void {
        let componentSet = this._components.get(component.name);

        if (!componentSet) {
            componentSet = new Set<AbstractAudioSubNode>();
            this._components.set(component.name, componentSet);
        }

        if (componentSet.has(component)) {
            return;
        }

        componentSet.add(component);
        this._onComponentAdded(component);
    }

    protected _removeComponent(component: AbstractAudioSubNode): void {
        const componentSet = this._components.get(component.name);

        if (!componentSet) {
            return;
        }

        if (!componentSet.has(component)) {
            return;
        }

        componentSet.delete(component);
        this._onComponentRemoved(component);
    }

    protected _getComponent(name: string): Nullable<AbstractAudioSubNode> {
        const componentSet = this._components.get(name);

        if (!componentSet) {
            return null;
        }

        return componentSet.values().next().value;
    }

    protected _getComponents(name: string): Nullable<Array<AbstractAudioSubNode>> {
        const componentSet = this._components.get(name);

        if (!componentSet) {
            return null;
        }

        return Array.from(componentSet);
    }
}
