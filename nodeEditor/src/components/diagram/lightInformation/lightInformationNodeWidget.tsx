import * as React from "react";
import { LightInformationNodeModel } from './lightInformationNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';

/**
 * GenericNodeWidgetProps
 */
export interface ILightInformationNodeWidgetProps {
    node: Nullable<LightInformationNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class LightInformationNodeWidget extends React.Component<ILightInformationNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: ILightInformationNodeWidgetProps) {
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
            <div className={"diagramBlock"}>
                <div className="header">
                    {`${this.props.node!.block!.name} (${this.props.node!.light ? this.props.node!.light.name : "No light"})`}
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