import type { Nullable } from "../../types";
import type { AudioNodeType } from "./abstractAudioNode";
import { AbstractAudioNode } from "./abstractAudioNode";
import type { AudioEngineV2 } from "./audioEngineV2";
import type { AbstractAudioComponent } from "./components/abstractAudioComponent";

/**
 * Abstract class for an audio node containing audio components.
 */
export abstract class AbstractAudioComponentOwner extends AbstractAudioNode {
    /**
     * The name of the audio node.
     */
    public name: string;

    private _components = new Map<string, Set<AbstractAudioComponent>>();

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType) {
        super(engine, nodeType);
        this.name = name;
    }

    protected abstract _onComponentAdded(component: AbstractAudioComponent): void;
    protected abstract _onComponentRemoved(component: AbstractAudioComponent): void;

    protected _addComponent(component: AbstractAudioComponent): void {
        let componentSet = this._components.get(component.name);

        if (!componentSet) {
            componentSet = new Set<AbstractAudioComponent>();
            this._components.set(component.name, componentSet);
        }

        if (componentSet.has(component)) {
            return;
        }

        componentSet.add(component);
        this._onComponentAdded(component);
    }

    protected _removeComponent(component: AbstractAudioComponent): void {
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

    protected _getComponent(name: string): Nullable<AbstractAudioComponent> {
        const componentSet = this._components.get(name);

        if (!componentSet) {
            return null;
        }

        return componentSet.values().next().value;
    }

    protected _getComponents(name: string): Nullable<Array<AbstractAudioComponent>> {
        const componentSet = this._components.get(name);

        if (!componentSet) {
            return null;
        }

        return Array.from(componentSet);
    }
}
