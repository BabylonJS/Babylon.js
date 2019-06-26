import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { InputNodeModel } from './inputNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { DefaultPortModel } from '../defaultPortModel';
import { NodeMaterialWellKnownValues } from 'babylonjs/Materials/Node/nodeMaterialWellKnownValues';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { Color3 } from 'babylonjs/Maths/math';
import { StringTools } from '../../../stringTools';

/**
 * GenericNodeWidgetProps
 */
export interface InputNodeWidgetProps {
    node: Nullable<InputNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class InputNodeWidget extends React.Component<InputNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: InputNodeWidgetProps) {
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
                <div>
                    {value}
                </div>
            )
        }

        let connection = this.props.node!.connection;
        if (!connection || !connection.isUniform) {
            return null;
        }

        switch (connection.type) {
            case NodeMaterialBlockConnectionPointTypes.Color3:
            case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
            case NodeMaterialBlockConnectionPointTypes.Color4: {
                let color = connection.value as Color3;
                return (
                    <div className="fullColor" style={{ background: color.toHexString() }}></div>
                )
            }
        }

        return null;
    }

    render() {
        var outputPorts = new Array<JSX.Element>()
        let port: DefaultPortModel;
        if (this.props.node) {
            for (var key in this.props.node.ports) {
                port = this.props.node.ports[key] as DefaultPortModel;

                outputPorts.push(
                    <div key={key} className="output-port">
                        <div className="output-port-label">
                        </div>
                        <div className="output-port-plug">
                            <PortWidget key={key} name={port.name} node={this.props.node} />
                        </div>
                    </div>
                );
                break;
            }
        }

        let connection = this.props.node!.connection;
        let value = "";
        let name = "";

        if (connection) {
            name = StringTools.GetBaseType(connection.type)

            if (connection.isAttribute) {
                value = "mesh." + connection.name;
            } else if (connection.isWellKnownValue) {
                switch (connection.wellKnownValue) {
                    case NodeMaterialWellKnownValues.World:
                        value = "World";
                        break;
                    case NodeMaterialWellKnownValues.WorldView:
                        value = "World x View";
                        break;
                    case NodeMaterialWellKnownValues.WorldViewProjection:
                        value = "World x View x Projection";
                        break;
                    case NodeMaterialWellKnownValues.View:
                        value = "View";
                        break;
                    case NodeMaterialWellKnownValues.ViewProjection:
                        value = "View x Projection";
                        break;
                    case NodeMaterialWellKnownValues.Projection:
                        value = "Projection";
                        break;
                    case NodeMaterialWellKnownValues.CameraPosition:
                        value = "Camera position";
                        break;
                    case NodeMaterialWellKnownValues.Automatic:
                        value = "Automatic";
                        break;
                }
            }
        } else {
            name = "Not connected input";
        }

        return (
            <div className={"diagramBlock input" + (connection && connection.isAttribute ? " attribute" : "")}>
                <div className="header">
                    {name}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                <div className="value">
                    {
                        this.renderValue(value)
                    }
                </div>
            </div>
        );
    }
}