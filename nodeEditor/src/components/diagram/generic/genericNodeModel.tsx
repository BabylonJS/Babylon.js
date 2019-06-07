import * as React from "react";
import { Nullable } from 'babylonjs/types';
import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
import { DefaultNodeModel } from '../defaultNodeModel';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { GraphEditor, NodeCreationOptions } from '../../../graphEditor';
import { GlobalState } from '../../../globalState';
import { TextLineComponent } from '../../../sharedComponents/textLineComponent';
import { LineContainerComponent } from '../../../sharedComponents/lineContainerComponent';
import { TextInputLineComponent } from '../../../sharedComponents/textInputLineComponent';

/**
 * Generic node model which stores information about a node editor block
 */
export class GenericNodeModel extends DefaultNodeModel {
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

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]) {
        super.prepare(options, nodes, model, graphEditor, filterInputs);
    }

    renderProperties(globalState: GlobalState) {

        return (
            <LineContainerComponent title="GENERAL">
                <TextInputLineComponent label="Name" propertyName="name" target={this.block!} onChange={() => globalState.onUpdateRequiredObservable.notifyObservers()} />
                <TextLineComponent label="Type" value={this.block!.getClassName()} />
            </LineContainerComponent>
        );
    }
}