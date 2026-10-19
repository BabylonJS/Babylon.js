import * as React from "react";
import { type Observer } from "core/Misc/observable";
import { type Nullable } from "core/types";
import { ButtonLineComponent } from "../lines/buttonLineComponent";
import { type IPropertyComponentProps } from "./interfaces/propertyComponentProps";

/**
 * Cycles through a teleport entry's references without changing the selected node.
 */
export class TeleportInPropertyComponent extends React.Component<IPropertyComponentProps> {
    private _lastEndpoint: unknown;
    private _onUpdateRequiredObserver: Nullable<Observer<unknown>> = null;
    private _onRebuildRequiredObserver: Nullable<Observer<void>> = null;

    override componentDidMount() {
        this._onUpdateRequiredObserver = this.props.stateManager.onUpdateRequiredObservable.add(() => this.forceUpdate());
        this._onRebuildRequiredObserver = this.props.stateManager.onRebuildRequiredObservable.add(() => this.forceUpdate());
    }

    override componentDidUpdate(previousProps: IPropertyComponentProps) {
        if (previousProps.nodeData !== this.props.nodeData) {
            this._lastEndpoint = undefined;
        }
    }

    override componentWillUnmount() {
        this.props.stateManager.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this.props.stateManager.onRebuildRequiredObservable.remove(this._onRebuildRequiredObserver);
    }

    private _focusNextReference() {
        const endpoints = this.props.nodeData.invisibleEndpoints;
        if (!endpoints?.length) {
            return;
        }

        const index = (endpoints.indexOf(this._lastEndpoint) + 1) % endpoints.length;
        this._lastEndpoint = endpoints[index];
        this.props.stateManager.onFocusNodeObservable.notifyObservers(this._lastEndpoint);
    }

    override render() {
        return <ButtonLineComponent label="Focus next reference" isDisabled={!this.props.nodeData.invisibleEndpoints?.length} onClick={() => this._focusNextReference()} />;
    }
}
