import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { GraphFrame } from "../../diagram/graphFrame";
import type { GlobalState } from "../../globalState";
import { Color3LineComponent } from "../../sharedComponents/color3LineComponent";
import { ButtonLineComponent } from "../../sharedComponents/buttonLineComponent";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { InputsPropertyTabComponent } from "../../components/propertyTab/inputsPropertyTabComponent";
import type { InputBlock } from "core/Materials/Node/Blocks/Input/inputBlock";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";

export interface IFramePropertyTabComponentProps {
    globalState: GlobalState;
    frame: GraphFrame;
}

export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
    private _onFrameExpandStateChangedObserver: Nullable<Observer<GraphFrame>>;

    constructor(props: IFramePropertyTabComponentProps) {
        super(props);
    }

    componentDidMount() {
        this._onFrameExpandStateChangedObserver = this.props.frame.onExpandStateChanged.add(() => this.forceUpdate());
    }

    componentWillUnmount() {
        if (this._onFrameExpandStateChangedObserver) {
            this.props.frame.onExpandStateChanged.remove(this._onFrameExpandStateChangedObserver);
            this._onFrameExpandStateChangedObserver = null;
        }
    }

    render() {
        let configurableInputBlocks: InputBlock[] = [];
        this.props.frame.nodes.forEach((node) => {
            if (node.block.isInput && node.block.visibleOnFrame) {
                configurableInputBlocks.push(node.block as InputBlock);
            }
        });

        configurableInputBlocks = configurableInputBlocks.sort((a, b) => {
            return a.name.localeCompare(b.name);
        });

        return (
            <div id="propertyTab">
                <div id="header">
                    <img id="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div id="title">NODE MATERIAL EDITOR</div>
                </div>
                <div>
                    <LineContainerComponent title="GENERAL">
                        <TextInputLineComponent label="Name" propertyName="name" target={this.props.frame} />
                        <Color3LineComponent globalState={this.props.globalState} label="Color" target={this.props.frame} propertyName="color"></Color3LineComponent>
                        <TextInputLineComponent label="Comments" propertyName="comments" target={this.props.frame} />
                        {!this.props.frame.isCollapsed && (
                            <ButtonLineComponent
                                label="Collapse"
                                onClick={() => {
                                    this.props.frame!.isCollapsed = true;
                                }}
                            />
                        )}
                        {this.props.frame.isCollapsed && (
                            <ButtonLineComponent
                                label="Expand"
                                onClick={() => {
                                    this.props.frame!.isCollapsed = false;
                                }}
                            />
                        )}
                        <ButtonLineComponent
                            label="Export"
                            onClick={() => {
                                this.props.frame!.export();
                            }}
                        />
                    </LineContainerComponent>
                    <InputsPropertyTabComponent globalState={this.props.globalState} inputs={configurableInputBlocks}></InputsPropertyTabComponent>
                </div>
            </div>
        );
    }
}
