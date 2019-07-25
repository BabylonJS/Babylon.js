import * as React from "react";
import { RemapNodeModel } from './remapNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';

/**
 * RemapNodeWidgetProps
 */
export interface RemapNodeWidgetProps {
    node: Nullable<RemapNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class RemapNodeWidget extends React.Component<RemapNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: RemapNodeWidgetProps) {
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

    renderValue(value: string) {
        if (value) {
            return (
                <div className="value-text">
                    {value}
                </div>
            )
        }

        return null;
    }

    render() {
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node, undefined, true);
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, true);
        let remapBlock = this.props.node!.block! as RemapBlock;

        return (
            <div className={"diagramBlock remap"}>
                <div className="header">
                    {remapBlock.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                <div className="value">  
                {
                    `[${remapBlock.sourceRange.x}, ${remapBlock.sourceRange.y}] -> [${remapBlock.targetRange.x}, ${remapBlock.targetRange.y}]`
                }                 
                </div>
            </div>
        );
    }
}