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

    private _components: Array<AbstractAudioComponent> = new Array<AbstractAudioComponent>();

    protected constructor(name: string, engine: AudioEngineV2, nodeType: AudioNodeType) {
        super(engine, nodeType);
        this.name = name;
    }

    protected abstract _onComponentAdded(component: AbstractAudioComponent): void;
    protected abstract _onComponentRemoved(component: AbstractAudioComponent): void;

    protected _addComponent(component: AbstractAudioComponent): void {
        if (this._components.includes(component)) {
            return;
        }

        this._components.push(component);
        this._onComponentAdded(component);
    }

    protected _removeComponent(component: AbstractAudioComponent): void {
        if (!this._components.includes(component)) {
            return;
        }

        this._components.splice(this._components.indexOf(component), 1);
        this._onComponentRemoved(component);
    }

    protected _getComponent(componentClassName: string): Nullable<AbstractAudioComponent> {
        for (const component of this._components) {
            if (component._getComponentClassName() === componentClassName) {
                return component;
            }
        }

        return null;
    }

    protected _getComponents(componentClassName: string): Nullable<Array<AbstractAudioComponent>> {
        const components = new Array<AbstractAudioComponent>();

        for (const component of this._components) {
            if (component._getComponentClassName() === componentClassName) {
                components.push(component);
            }
        }

        return components.length > 0 ? components : null;
    }
}
