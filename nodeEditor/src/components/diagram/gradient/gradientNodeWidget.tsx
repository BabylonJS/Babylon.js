import * as React from "react";
import { GradientNodeModel } from './gradientNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { PortHelper } from '../portHelper';
import { GradientBlock } from 'babylonjs/Materials/Node/Blocks/gradientBlock';

export interface IGradientNodeWidgetProps {
    node: Nullable<GradientNodeModel>;
    globalState: GlobalState;
}

export class GradientNodeWidget extends React.Component<IGradientNodeWidgetProps> {
    constructor(props: IGradientNodeWidgetProps) {
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
        let gradientBlock = this.props.node!.block! as GradientBlock;

        let gradients = gradientBlock.colorSteps.map(c => `rgb(${c.color.r * 255}, ${c.color.g * 255}, ${c.color.b * 255}) ${c.step * 100}%`);

        let style = {
            background: gradients.length ? `linear-gradient(90deg, ${gradients.join(", ")})` : 'black'
        };

        return (
            <div className={"diagramBlock gradient"} style={style}>
                <div className="header">
                    {gradientBlock.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                <div className="value">                
                </div>
            </div>
        );
    }
}