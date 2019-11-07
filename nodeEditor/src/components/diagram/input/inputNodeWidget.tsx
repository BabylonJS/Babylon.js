import * as React from "react";
import { InputNodeModel } from './inputNodeModel';
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { NodeMaterialSystemValues } from 'babylonjs/Materials/Node/Enums/nodeMaterialSystemValues';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/Enums/nodeMaterialBlockConnectionPointTypes';
import { Color3, Vector2, Vector3, Vector4 } from 'babylonjs/Maths/math';
import { StringTools } from '../../../stringTools';
import { PortHelper } from '../portHelper';
import { AnimatedInputBlockTypes } from 'babylonjs/Materials/Node/Blocks/Input/animatedInputBlockTypes';

/**
 * GenericNodeWidgetProps
 */
export interface IInputNodeWidgetProps {
    node: Nullable<InputNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class InputNodeWidget extends React.Component<IInputNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: IInputNodeWidgetProps) {
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
        if (value !== "") {
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
        let name = `${inputBlock.name} (${StringTools.GetBaseType(inputBlock.output.type)})`;
        let color = "";

        if (inputBlock) {
            if (inputBlock.isAttribute) {
                value = "mesh." + inputBlock.name;
                name = StringTools.GetBaseType(inputBlock.output.type);
            } else if (inputBlock.isSystemValue) {
                switch (inputBlock.systemValue) {
                    case NodeMaterialSystemValues.World:
                        value = "World";
                        break;
                    case NodeMaterialSystemValues.WorldView:
                        value = "World x View";
                        break;
                    case NodeMaterialSystemValues.WorldViewProjection:
                        value = "World x View x Projection";
                        break;
                    case NodeMaterialSystemValues.View:
                        value = "View";
                        break;
                    case NodeMaterialSystemValues.ViewProjection:
                        value = "View x Projection";
                        break;
                    case NodeMaterialSystemValues.Projection:
                        value = "Projection";
                        break;
                    case NodeMaterialSystemValues.CameraPosition:
                        value = "Camera position";
                        break;
                    case NodeMaterialSystemValues.FogColor:
                        value = "Fog color";
                        break;
                    case NodeMaterialSystemValues.DeltaTime:
                        value = "Delta time";
                        break;
                }
            } else {
                if (!inputBlock || !inputBlock.isUniform) {
                    return null;
                }

                switch (inputBlock.type) {
                    case NodeMaterialBlockConnectionPointTypes.Float:
                        if (inputBlock.animationType !== AnimatedInputBlockTypes.None) {
                            value = AnimatedInputBlockTypes[inputBlock.animationType];
                        } else {
                            value = inputBlock.value.toFixed(2);
                        }
                        break;
                    case NodeMaterialBlockConnectionPointTypes.Vector2:
                        let vec2Value = inputBlock.value as Vector2
                        value = `(${vec2Value.x.toFixed(2)}, ${vec2Value.y.toFixed(2)})`;
                        break;
                    case NodeMaterialBlockConnectionPointTypes.Vector3:
                        let vec3Value = inputBlock.value as Vector3
                        value = `(${vec3Value.x.toFixed(2)}, ${vec3Value.y.toFixed(2)}, ${vec3Value.z.toFixed(2)})`;
                        break;
                    case NodeMaterialBlockConnectionPointTypes.Vector4:
                        let vec4Value = inputBlock.value as Vector4
                        value = `(${vec4Value.x.toFixed(2)}, ${vec4Value.y.toFixed(2)}, ${vec4Value.z.toFixed(2)}, ${vec4Value.w.toFixed(2)})`;
                        break;                        
                    case NodeMaterialBlockConnectionPointTypes.Color3:
                    case NodeMaterialBlockConnectionPointTypes.Color4: {
                        color = (inputBlock.value as Color3).toHexString();
                        break;
                    }
                }
            }
        } else {
            name = "Not connected input";
        }

        return (
            <div className={"diagramBlock input" + (inputBlock ? " " + NodeMaterialBlockConnectionPointTypes[inputBlock.type] : "")} style={{
                background: color
            }}>
                <div className={"header" + (inputBlock && inputBlock.isConstant ? " constant" : "") + (inputBlock && inputBlock.visibleInInspector ? " inspector" : "")}>
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