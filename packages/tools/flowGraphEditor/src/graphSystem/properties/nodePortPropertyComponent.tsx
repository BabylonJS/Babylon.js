import * as React from "react";
import { type StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { type NodePort } from "shared-ui-components/nodeGraphSystem/nodePort";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/textPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import { type ConnectionPointPortData } from "../connectionPointPortData";

export interface INodePortPropertyTabComponentProps {
    stateManager: StateManager;
    nodePort: NodePort;
}

export class NodePortPropertyTabComponent extends React.Component<INodePortPropertyTabComponentProps> {
    constructor(props: INodePortPropertyTabComponentProps) {
        super(props);
    }

    toggleExposeOnFrame(value: boolean) {
        this.props.nodePort.exposedOnFrame = value;
        this.props.stateManager.onExposePortOnFrameObservable.notifyObservers(this.props.nodePort.node);
        this.forceUpdate();
    }

    override render() {
        const portData = this.props.nodePort.portData as ConnectionPointPortData;

        const info = this.props.nodePort.hasLabel() ? (
            <>
                <TextInputPropertyLine
                    label="Port Label"
                    value={this.props.nodePort.portName ?? ""}
                    onChange={(value) => {
                        this.props.nodePort.portName = value;
                        this.forceUpdate();
                    }}
                />
                <TextPropertyLine label="Kind" value={portData.connectionKind} />
                <TextPropertyLine label="Name" value={portData.name} />
                {this.props.nodePort.node.enclosingFrameId !== -1 && (
                    <SwitchPropertyLine
                        label="Expose Port on Frame"
                        value={this.props.nodePort.exposedOnFrame}
                        disabled={this.props.nodePort.disabled}
                        onChange={(value) => this.toggleExposeOnFrame(value)}
                    />
                )}
            </>
        ) : (
            <TextPropertyLine label="" value="This node cannot be exposed to the frame." />
        );

        return (
            <Accordion uniqueId="FlowGraphNodePortProperties">
                <AccordionSection title="General" collapseByDefault={false}>
                    {info}
                </AccordionSection>
            </Accordion>
        );
    }
}
