import * as React from "react";
import { Nullable } from 'babylonjs/types';
import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
import { DefaultNodeModel } from '../defaultNodeModel';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { GraphEditor, NodeCreationOptions } from '../../../graphEditor';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { Vector2PropertyTabComponent } from '../../../components/propertyTab/properties/vector2PropertyTabComponent';
import { GlobalState } from '../../../globalState';
import { Vector3PropertyTabComponent } from '../../../components/propertyTab/properties/vector3PropertyTabComponent';
import { DefaultPortModel } from '../defaultPortModel';

/**
 * Generic node model which stores information about a node editor block
 */
export class GenericNodeModel extends DefaultNodeModel {
	/**
	 * Labels for the block
	 */
    public header = "";
	/**
	 * Vector2 for the node if it exists
	 */
    public vector2: Nullable<Vector2> = null;
	/**
	 * Vector3 for the node if it exists
	 */
    public vector3: Nullable<Vector3> = null;
	/**
	 * Vector4 for the node if it exists
	 */
    public vector4: Nullable<Vector4> = null;
	/**
	 * Matrix for the node if it exists
	 */
    public matrix: Nullable<Matrix> = null;

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("generic");
    }

    prepareConnection(type: string, outPort: DefaultPortModel, connection?: NodeMaterialConnectionPoint) {
        switch (type) {
            case "Vector2":
                outPort.getValue = () => {
                    return this.vector2;
                }
                if (connection && connection.value) {
                    this.vector2 = connection.value
                } else {
                    this.vector2 = new Vector2()
                }
                break;
            case "Vector3":
                outPort.getValue = () => {
                    return this.vector3;
                }
                if (connection && connection.value) {
                    this.vector3 = connection.value
                } else {
                    this.vector3 = new Vector3()
                }
                break;
            case "Vector4":
                outPort.getValue = () => {
                    return this.vector4;
                }
                if (connection && connection.value) {
                    this.vector4 = connection.value
                } else {
                    this.vector4 = new Vector4(0, 0, 0, 1)
                }
                break;
            case "Matrix":
                outPort.getValue = () => {
                    return this.matrix;
                }
                if (connection && connection.value) {
                    this.matrix = connection.value
                } else {
                    this.matrix = new Matrix();
                }
                break;
        }
    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]) {
        if (options.nodeMaterialBlock) {
            this.header = options.nodeMaterialBlock.name;
        }

        super.prepare(options, nodes, model, graphEditor, filterInputs);
    }

    renderProperties(globalState: GlobalState) {
        if (this.vector2) {
            return (
                <Vector2PropertyTabComponent globalState={globalState} node={this} />
            );
        }
        if (this.vector3) {
            return (
                <Vector3PropertyTabComponent globalState={globalState} node={this} />
            );
        }

        return null;
    }
}