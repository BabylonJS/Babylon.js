import * as React from "react";
import { InputNodeModel } from './inputNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { NodeMaterialWellKnownValues } from 'babylonjs/Materials/Node/nodeMaterialWellKnownValues';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { Color3 } from 'babylonjs/Maths/math';
import { StringTools } from '../../../stringTools';
import { PortHelper } from '../portHelper';

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
                <div className="value-text">
                    {value}
                </div>
            )
        }

        return null;
    }

    render() {
        var outputPorts = PortHelper.GenerateOutputPorts(this.props.node, true);

        let inputBlock = this.props.node!.inputBlock;
        let value = "";
        let name = StringTools.GetBaseType(inputBlock.output.type);
        let color = "";

        if (inputBlock) {
            if (inputBlock.isAttribute) {
                value = "mesh." + inputBlock.name;
            } else if (inputBlock.isWellKnownValue) {
                switch (inputBlock.wellKnownValue) {
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
                    case NodeMaterialWellKnownValues.FogColor:
                        value = "Fog color";
                        break;
                }
            } else {
                if (!inputBlock || !inputBlock.isUniform) {
                    return null;
                }

                switch (inputBlock.type) {
                    case NodeMaterialBlockConnectionPointTypes.Color3:
                    case NodeMaterialBlockConnectionPointTypes.Color3OrColor4:
                    case NodeMaterialBlockConnectionPointTypes.Color4: {
                        color = (inputBlock.value as Color3).toHexString();
                    }
                }
            }
        } else {
            name = "Not connected input";
        }

        return (
            <div className={"diagramBlock input" + (inputBlock && inputBlock.isAttribute ? " attribute" : "")} style={{
                background: color
            }}>
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