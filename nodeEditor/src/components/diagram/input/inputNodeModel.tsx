import * as React from "react";
import { Nullable } from 'babylonjs/types';
import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
import { DefaultNodeModel } from '../defaultNodeModel';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { Vector2PropertyTabComponent } from '../../propertyTab/properties/vector2PropertyTabComponent';
import { GlobalState } from '../../../globalState';
import { Vector3PropertyTabComponent } from '../../propertyTab/properties/vector3PropertyTabComponent';
import { DefaultPortModel } from '../defaultPortModel';

/**
 * Generic node model which stores information about a node editor block
 */
export class InputNodeModel extends DefaultNodeModel {
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
        super("input");
    }

    prepareConnection(type: string, outPort: DefaultPortModel, connection?: NodeMaterialConnectionPoint) {
        switch (type) {
            case "Vector2":
                this.vector2 = new Vector2()
                break;
            case "Vector3":
                this.vector3 = new Vector3()
                break;
            case "Vector4":
                this.vector4 = new Vector4(0, 0, 0, 1)
                break;
            case "Matrix":
                this.matrix = new Matrix();
                break;
        }
    }

    renderValue(globalState: GlobalState) {
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

    renderProperties(globalState: GlobalState) {
        return (
            <div>
                {this.renderValue(globalState)}
            </div>
        );
    }
}