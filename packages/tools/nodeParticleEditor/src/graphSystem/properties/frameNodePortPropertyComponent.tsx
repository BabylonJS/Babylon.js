import * as React from "react";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { StateManager } from "shared-ui-components/nodeGraphSystem/stateManager";
import type { ISelectionChangedOptions } from "shared-ui-components/nodeGraphSystem/interfaces/selectionChangedOptions";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { FramePortPosition } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { IsFramePortData } from "shared-ui-components/nodeGraphSystem/tools";
import type { FrameNodePort } from "shared-ui-components/nodeGraphSystem/frameNodePort";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";

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
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE MATERIAL EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextInputLineComponent label="Port Name" lockObject={this.props.stateManager.lockObject} propertyName="portName" target={this.props.frameNodePort} />
                        {this.props.frameNodePort.framePortPosition !== FramePortPosition.Top && (
                            <ButtonLineComponent
                                label="Move Port Up"
                                onClick={() => {
                                    this.props.frame.moveFramePortUp(this.props.frameNodePort);
                                }}
                            />
                        )}

                        {this.props.frameNodePort.framePortPosition !== FramePortPosition.Bottom && (
                            <ButtonLineComponent
                                label="Move Port Down"
                                onClick={() => {
                                    this.props.frame.moveFramePortDown(this.props.frameNodePort);
                                }}
                            />
                        )}
                    </LineContainerComponent>
                </div>
            </div>
        );
    }
}
