import * as React from "react";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";
import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { GraphFrame } from "shared-ui-components/nodeGraphSystem/graphFrame";
import { Color3LineComponent } from "shared-ui-components/lines/color3LineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import type { NodeRenderGraphInputBlock } from "core/FrameGraph/Node/Blocks/inputBlock";
import type { NodeRenderGraphBlock } from "core/FrameGraph/Node/nodeRenderGraphBlock";

export interface IFramePropertyTabComponentProps {
    globalState: GlobalState;
    frame: GraphFrame;
}

export class FramePropertyTabComponent extends React.Component<IFramePropertyTabComponentProps> {
    private _onFrameExpandStateChangedObserver: Nullable<Observer<GraphFrame>>;

    constructor(props: IFramePropertyTabComponentProps) {
        super(props);
    }

    override componentDidMount() {
        this._onFrameExpandStateChangedObserver = this.props.frame.onExpandStateChanged.add(() => this.forceUpdate());
    }

    override componentWillUnmount() {
        if (this._onFrameExpandStateChangedObserver) {
            this.props.frame.onExpandStateChanged.remove(this._onFrameExpandStateChangedObserver);
            this._onFrameExpandStateChangedObserver = null;
        }
    }

    override render() {
        let configurableInputBlocks: NodeRenderGraphInputBlock[] = [];
        for (const node of this.props.frame.nodes) {
            const block = node.content.data as NodeRenderGraphBlock;
            if (block.isInput && block.visibleOnFrame) {
                configurableInputBlocks.push(block as NodeRenderGraphInputBlock);
            }
        }

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
                        <TextInputLineComponent label="Name" propertyName="name" lockObject={this.props.globalState.lockObject} target={this.props.frame} />
                        <Color3LineComponent lockObject={this.props.globalState.lockObject} label="Color" target={this.props.frame} propertyName="color"></Color3LineComponent>
                        <TextInputLineComponent lockObject={this.props.globalState.lockObject} label="Comments" propertyName="comments" target={this.props.frame} />
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
                </div>
            </div>
        );
    }
}
