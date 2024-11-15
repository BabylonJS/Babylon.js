import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";
import { NodeGeometryBlockConnectionPointTypes } from "core/Meshes";
import type { NodeGeometryConnectionPoint } from "core/Meshes";

export interface IFrameNodePortPropertyTabComponentProps {
    stateManager: StateManager;
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps> {
    constructor(props: IFrameNodePortPropertyTabComponentProps) {
        super(props);
    }

    toggleExposeOnFrame(value: boolean) {
        this.props.nodePort.exposedOnFrame = value;
        this.props.stateManager.onExposePortOnFrameObservable.notifyObservers(this.props.nodePort.node);
    }

    override render() {
        const port = this.props.nodePort.portData.data as NodeGeometryConnectionPoint;
        const acceptedConnectionPointTypes: string[] = [];

        for (const type of port.acceptedConnectionPointTypes) {
            const enumValue = NodeGeometryBlockConnectionPointTypes[type];
            if (enumValue) {
                acceptedConnectionPointTypes.push(enumValue);
            }
        }
        const info = this.props.nodePort.hasLabel() ? (
            <>
                {this.props.nodePort.hasLabel() && (
                    <TextInputLineComponent lockObject={this.props.stateManager.lockObject} label="Port Label" propertyName="portName" target={this.props.nodePort} />
                )}
                <TextLineComponent label="Type" value={NodeGeometryBlockConnectionPointTypes[port.type]} />
                {acceptedConnectionPointTypes.length > 0 && acceptedConnectionPointTypes.map((t, i) => <TextLineComponent label={i === 0 ? "Accepted Types" : ""} value={t} />)}
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
            <TextLineComponent label="This node cannot be exposed to the frame." value=" "></TextLineComponent>
        );

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE GEOMETRY EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">{info}</LineContainerComponent>
                </div>
            </div>
        );
    }
}
