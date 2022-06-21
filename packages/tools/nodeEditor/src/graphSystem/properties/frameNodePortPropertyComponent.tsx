import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { GlobalState, ISelectionChangedOptions } from "../../globalState";
import { TextInputLineComponent } from "../../sharedComponents/textInputLineComponent";
import { ButtonLineComponent } from "../../sharedComponents/buttonLineComponent";
import type { GraphFrame } from "../../diagram/graphFrame";
import { FramePortPosition } from "../../diagram/graphFrame";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import type { FrameNodePort } from "../../sharedComponents/nodeGraphSystem/frameNodePort";
import { isFramePortData } from "../../diagram/graphCanvas";

export interface IFrameNodePortPropertyTabComponentProps {
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

        const _this = this;
        this._onSelectionChangedObserver = this.props.globalState.onSelectionChangedObservable.add((options) => {
            const { selection } = options || {};
            if (isFramePortData(selection)) {
                selection.port.onFramePortPositionChangedObservable.clear();
                _this._onFramePortPositionChangedObserver = selection.port.onFramePortPositionChangedObservable.add((port: FrameNodePort) => {
                    _this.setState({ port: port });
                });

                _this.setState({ port: selection.port });
            }
        });

        this._onFramePortPositionChangedObserver = this.props.frameNodePort.onFramePortPositionChangedObservable.add((port: FrameNodePort) => {
            _this.setState({ port: port });
        });
    }

    componentWillUnmount() {
        this.props.frameNodePort.onFramePortPositionChangedObservable.remove(this._onFramePortPositionChangedObserver);
        this.props.globalState.onSelectionChangedObservable.remove(this._onSelectionChangedObserver);
    }

    render() {
        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE MATERIAL EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextInputLineComponent globalState={this.props.globalState} label="Port Name" propertyName="portName" target={this.props.frameNodePort} />
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
