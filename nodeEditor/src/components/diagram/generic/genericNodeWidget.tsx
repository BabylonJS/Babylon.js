import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { GenericNodeModel } from './genericNodeModel';
import { GenericPortModel } from './genericPortModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';

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
        var headers = new Array<JSX.Element>()
        var inputPorts = new Array<JSX.Element>()
        var outputPorts = new Array<JSX.Element>()
        var value = <div></div>
        if (this.props.node) {
            // Header labels
            if (this.props.node.headerLabels.length) {
                this.props.node.headerLabels.forEach((h, i) => {
                    headers.push(<div className="header-labels" key={i}>{h.text}</div>)
                });
            }

            // Input/Output ports
            for (var key in this.props.node.ports) {
                var port = this.props.node.ports[key] as GenericPortModel;
                if (port.position == "input") {
                    var control = <div></div>

                    inputPorts.push(
                        <div key={key} className="input-port">
                            <div className="input-port-plug">
                                <PortWidget key={key} name={port.name} node={this.props.node} />
                            </div>
                            <div className="input-port-label">
                                {port.name}
                            </div>
                            {control}
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

        const isInputBlock = this.props.node && this.props.node.headerLabels.length;
        const isOutputBlock = outputPorts.length === 0;

        return (
            <div className={"diagramBlock" + (isInputBlock ? "" : " input") + (isOutputBlock ? " output" : "")}>
                <div className="header">
                    {headers}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                {value}
            </div>
        );
    }
}