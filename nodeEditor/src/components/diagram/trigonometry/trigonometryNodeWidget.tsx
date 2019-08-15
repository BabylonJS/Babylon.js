import * as React from "react";
import { TrigonometryNodeModel } from './trigonometryNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';
import { TrigonometryBlockOperations } from 'babylonjs/Materials/Node/Blocks/trigonometryBlock';

/**
 * GenericNodeWidgetProps
 */
export interface ITrigonometryNodeWidgetProps {
    node: Nullable<TrigonometryNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class TrigonometryNodeWidget extends React.Component<ITrigonometryNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: ITrigonometryNodeWidgetProps) {
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
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, false);        
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node);

        let trigonometryBlock = this.props.node!.trigonometryBlock;

        return (
            <div className={"diagramBlock trigonometry"}>
                <div className="header">
                    {trigonometryBlock.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                <div className="value">
                    <div className="value-text">
                        {TrigonometryBlockOperations[trigonometryBlock.operation]}
                    </div>
                </div>
            </div>
        );
    }
}