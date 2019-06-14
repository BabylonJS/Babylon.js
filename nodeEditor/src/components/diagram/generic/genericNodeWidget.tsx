import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { DefaultPortModel } from '../defaultPortModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { GenericNodeModel } from './genericNodeModel';

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
        var header = "";
        var inputPorts = new Array<JSX.Element>()
        var outputPorts = new Array<JSX.Element>()
        if (this.props.node) {
            // Header label
            if (this.props.node.block) {
                header = this.props.node.block.name;
            }

            // Input/Output ports
            for (var key in this.props.node.ports) {
                var port = this.props.node.ports[key] as DefaultPortModel;
                if (port.position === "input") {
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