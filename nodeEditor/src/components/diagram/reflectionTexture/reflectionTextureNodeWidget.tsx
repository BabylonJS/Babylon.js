import * as React from "react";
import { TextureLineComponent } from "../../../sharedComponents/textureLineComponent"
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';
import { ReflectionTextureNodeModel } from './reflectionTextureNodeModel';

/**
 * GenericNodeWidgetProps
 */
export interface IReflectionTextureNodeWidgetProps {
    node: Nullable<ReflectionTextureNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class ReflectionTextureNodeWidget extends React.Component<IReflectionTextureNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: IReflectionTextureNodeWidgetProps) {
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
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node);

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
                    <TextureLineComponent ref="textureView" width={140} height={140} texture={this.props.node.texture} hideChannelSelect={true} />
                }
            </div>
        );
    }
}