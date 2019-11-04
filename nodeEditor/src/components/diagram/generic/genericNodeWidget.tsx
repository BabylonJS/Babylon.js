import * as React from "react";
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { GenericNodeModel } from './genericNodeModel';
import { PortHelper } from '../portHelper';

/**
 * GenericNodeWidgetProps
 */
export interface GenericNodeWidgetProps {
    node: Nullable<GenericNodeModel>;
    globalState: GlobalState;
}

/**
 * GenericNodeWidgetState
 */
export interface GenericNodeWidgetState {

}

/**
 * Used to display a node block for the node editor
 */
export class GenericNodeWidget extends React.Component<GenericNodeWidgetProps, GenericNodeWidgetState> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: GenericNodeWidgetProps) {
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
        // Header label
        var header = "";
        if (this.props.node && this.props.node.block) {
            header = this.props.node.block.name;
        }

        // Input/Output ports
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, false);
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node);

        return (
            <div className={"diagramBlock" + (outputPorts.length === 0 ? " output" : "")}>
                <div className="header">
                    {header}
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