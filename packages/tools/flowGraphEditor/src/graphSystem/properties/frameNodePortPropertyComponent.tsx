import * as React from "react";
import { type GlobalState } from "../../globalState";
import { type Nullable } from "core/types";
import { type Observer } from "core/Misc/observable";
import { type StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import { type ISelectionChangedOptions } from "shared-ui-components/nodeGraphSystem/interfaces/selectionChangedOptions";
import { type GraphFrame, FramePortPosition } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { IsFramePortData } from "shared-ui-components/nodeGraphSystem/tools";
import { type FrameNodePort } from "shared-ui-components/nodeGraphSystem/frameNodePort";
import { Accordion, AccordionSection } from "shared-ui-components/fluent/primitives/accordion";
import { Button } from "shared-ui-components/fluent/primitives/button";
import { TextInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";

export interface IFrameNodePortPropertyTabComponentProps {
    stateManager: StateManager;
    globalState: GlobalState;
    frameNodePort: FrameNodePort;
    frame: GraphFrame;
}

export class FrameNodePortPropertyTabComponent extends React.Component<IFrameNodePortPropertyTabComponentProps, { port: FrameNodePort }> {
    private _onFramePortPositionChangedObserver: Nullable<Observer<FrameNodePort>>;
    private _onSelectionChangedObserver: Nullable<Observer<Nullable<ISelectionChangedOptions>>>;

    constructor(props: IFrameNodePortPropertyTabComponentProps) {
        super(props);
        this.state = {
            port: this.props.frameNodePort,
        };

        this._onSelectionChangedObserver = this.props.stateManager.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (IsFramePortData(selection)) {
                selection.port.onFramePortPositionChangedObservable.clear();
                this._onFramePortPositionChangedObserver = selection.port.onFramePortPositionChangedObservable.add((port: FrameNodePort) => {
                    this.setState({ port: port });
                });

                this.setState({ port: selection.port });
            }
        });

        this._onFramePortPositionChangedObserver = this.props.frameNodePort.onFramePortPositionChangedObservable.add((port: FrameNodePort) => {
            this.setState({ port: port });
        });
    }

    override componentWillUnmount() {
        this.props.frameNodePort.onFramePortPositionChangedObservable.remove(this._onFramePortPositionChangedObserver);
        this.props.stateManager.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
    }

    override render() {
        return (
            <Accordion uniqueId="FlowGraphFrameNodePortProperties">
                <AccordionSection title="General" collapseByDefault={false}>
                    <TextInputPropertyLine
                        label="Port Name"
                        value={this.props.frameNodePort.portName ?? ""}
                        onChange={(value) => {
                            this.props.frameNodePort.portName = value;
                            this.forceUpdate();
                        }}
                    />
                    {this.props.frameNodePort.framePortPosition !== FramePortPosition.Top && (
                        <Button
                            label="Move Port Up"
                            title="Move port up"
                            onClick={() => {
                                this.props.frame.moveFramePortUp(this.props.frameNodePort);
                            }}
                        />
                    )}

                    {this.props.frameNodePort.framePortPosition !== FramePortPosition.Bottom && (
                        <Button
                            label="Move Port Down"
                            title="Move port down"
                            onClick={() => {
                                this.props.frame.moveFramePortDown(this.props.frameNodePort);
                            }}
                        />
                    )}
                </AccordionSection>
            </Accordion>
        );
    }
}
