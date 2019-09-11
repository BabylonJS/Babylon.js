import * as React from "react";
import { RemapNodeModel } from './remapNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';
import { RemapBlock } from 'babylonjs/Materials/Node/Blocks/remapBlock';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { InputBlock } from 'babylonjs/Materials/Node/Blocks/Input/inputBlock';

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

    extractInputValue(connectionPoint: NodeMaterialConnectionPoint) {
        let connectedBlock = connectionPoint.connectedPoint!.ownerBlock;

        if (connectedBlock.isInput) {
            let inputBlock = connectedBlock as InputBlock;

            if (inputBlock.isUniform && !inputBlock.isSystemValue) {
                return inputBlock.value;
            }
        }

        return "?";
    }

    render() {
        var inputPorts = PortHelper.GenerateInputPorts(this.props.node, undefined, false);
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, false);
        let remapBlock = this.props.node!.block! as RemapBlock;

        let sourceRangeX = remapBlock.sourceMin.isConnected ? this.extractInputValue(remapBlock.sourceMin) : remapBlock.sourceRange.x;
        let sourceRangeY = remapBlock.sourceMax.isConnected ? this.extractInputValue(remapBlock.sourceMax) : remapBlock.sourceRange.y;
        let targetRangeX = remapBlock.targetMin.isConnected ? this.extractInputValue(remapBlock.targetMin) : remapBlock.targetRange.x;
        let targetRangeY = remapBlock.targetMax.isConnected ? this.extractInputValue(remapBlock.targetMax) : remapBlock.targetRange.y;

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
                    `[${sourceRangeX}, ${sourceRangeY}] -> [${targetRangeX}, ${targetRangeY}]`
                }                 
                </div>
            </div>
        );
    }
}