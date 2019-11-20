import * as React from "react";
import { ClampNodeModel } from './clampNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';

export interface ClampNodeWidgetProps {
    node: Nullable<ClampNodeModel>;
    globalState: GlobalState;
}

export class ClampNodeWidget extends React.Component<ClampNodeWidgetProps> {
    constructor(props: ClampNodeWidgetProps) {
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
        let clampBlock = this.props.node!.block! as ClampBlock;

        return (
            <div className={"diagramBlock clamp"}>
                <div className="header">
                    {clampBlock.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                <div className="value">  
                {
                    `[${clampBlock.minimum}, ${clampBlock.maximum}]`
                }                 
                </div>
            </div>
        );
    }
}