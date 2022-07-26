import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { ISelectionChangedOptions } from "shared-ui-components/nodeGraphSystem/interfaces/selectionChangedOptions";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";

export interface IFrameNodePortPropertyTabComponentProps {
    stateManager: StateManager;
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps> {
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;

    constructor(props: IFrameNodePortPropertyTabComponentProps) {
        super(props);
    }

    componentWillUnmount() {
        this.props.stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
    }

    toggleExposeOnFrame(value: boolean) {
        this.props.nodePort.exposedOnFrame = value;
        this.props.stateManager.onExposePortOnFrameObservable.notifyObservers(this.props.nodePort.node);
    }

    render() {
        const info = this.props.nodePort.hasLabel() ? (
            <>
                {this.props.nodePort.hasLabel() && (
                    <TextInputLineComponent lockObject={this.props.stateManager.lockObject} label="Port Label" propertyName="portName" target={this.props.nodePort} />
                )}
                {this.props.nodePort.node.enclosingFrameId !== -1 && (
                    <CheckBoxLineComponent
                        label="Expose Port on Frame"
                        target={this.props.nodePort}
                        isSelected={() => this.props.nodePort.exposedOnFrame}
                        onSelect={(value: boolean) => this.toggleExposeOnFrame(value)}
                        propertyName="exposedOnFrame"
                        disabled={this.props.nodePort.disabled}
                    />
                )}
            </>
        ) : (
            <TextLineComponent label="This node is a constant input node and cannot be exposed to the frame." value=" "></TextLineComponent>
        );

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE MATERIAL EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">{info}</LineContainerComponent>
                </div>
            </div>
        );
    }
}
