import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { LightNodeModel } from './lightNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { DefaultPortModel } from '../defaultPortModel';

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
        var inputPorts = new Array<JSX.Element>();
        var outputPorts = new Array<JSX.Element>();
        if (this.props.node) {
            // Input/Output ports
            for (var key in this.props.node.ports) {
                var port = this.props.node.ports[key] as DefaultPortModel;
                if (port.position === "input") {
                    if (port.name !== "light") {
                        inputPorts.push(
                            <div key={key} className="input-port">
                                <div className="input-port-plug">
                                    <PortWidget key={key} name={port.name} node={this.props.node} />
                                </div>
                                <div className="input-port-label">
                                    {port.name}
                                </div>
                            </div>
                        )
                    }
                } else {
                    outputPorts.push(
                        <div key={key} className="output-port">
                            <div className="output-port-label">
                                {port.name}
                            </div>
                            <div className="output-port-plug">
                                <PortWidget key={key} name={port.name} node={this.props.node} />
                            </div>
                        </div>
                    )
                }
            }
        }

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