import * as React from "react";
import { TextureNodeModel } from './textureNodeModel';
import { TextureLineComponent } from "../../../sharedComponents/textureLineComponent"
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';

/**
 * GenericNodeWidgetProps
 */
export interface ITextureNodeWidgetProps {
    node: Nullable<TextureNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class TextureNodeWidget extends React.Component<ITextureNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: ITextureNodeWidgetProps) {
        super(props);
        this.state = {};

        if (this.props.node) {
            this.props.node.addListener({
                selectionChanged: () => {
                    let selected = (this.props.node as any).selected;
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(selected ? this.props.node : null);
                }
            });
        }
    }

    render() {
        // Input/Output ports
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, false);
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node, ["uv"]);

        return (
            <div className={"diagramBlock texture-block"}>
                <div className="header">
                    {this.props.node!.block!.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                {
                    this.props.node && this.props.node.texture &&
                    <TextureLineComponent ref="textureView" width={136} height={136} texture={this.props.node.texture} hideChannelSelect={true} />
                }
            </div>
        );
    }
}