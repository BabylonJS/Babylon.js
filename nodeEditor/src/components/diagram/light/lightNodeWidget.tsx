import * as React from "react";
import { LightNodeModel } from './lightNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';

/**
 * GenericNodeWidgetProps
 */
export interface ILightNodeWidgetProps {
    node: Nullable<LightNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class LightNodeWidget extends React.Component<ILightNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: ILightNodeWidgetProps) {
        super(props);
        this.state = {};
    }

    render() {
        // Input/Output ports
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, false);
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node);

        return (
            <div className={"diagramBlock"}>
                <div className="header">
                    {this.props.node!.block!.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
            </div>
        );
    }
}