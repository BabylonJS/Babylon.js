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
import { CheckBoxLineComponent } from '../../../sharedComponents/checkBoxLineComponent';
import { TransformBlock } from 'babylonjs/Materials/Node/Blocks/transformBlock';

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

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor) {
        super.prepare(options, nodes, model, graphEditor);
    }

    renderProperties(globalState: GlobalState) {

        return (
            <div>
            <LineContainerComponent title="GENERAL">
                <TextInputLineComponent globalState={globalState} label="Name" propertyName="name" target={this.block!} onChange={() => globalState.onUpdateRequiredObservable.notifyObservers()} />
                <TextLineComponent label="Type" value={this.block!.getClassName()} />
            </LineContainerComponent>
            {
                this.block!.getClassName() === "TransformBlock" &&
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Transform as direction" onSelect={value => {
                        let transformBlock = this.block as TransformBlock;
                        if (value) {
                            transformBlock.complementW = 0;
                        } else {
                            transformBlock.complementW = 1;
                        }
                        globalState.onRebuildRequiredObservable.notifyObservers();
                    }} isSelected={() => (this.block as TransformBlock).complementW === 0} />
                </LineContainerComponent>
            }                    
            {
                this.block!.getClassName() === "PerturbNormalBlock" &&
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Invert X axis" target={this.block} propertyName="invertX" onValueChanged={() => globalState.onRebuildRequiredObservable.notifyObservers()} />
                    <CheckBoxLineComponent label="Invert Y axis" target={this.block} propertyName="invertY" onValueChanged={() => globalState.onRebuildRequiredObservable.notifyObservers()}/>                    
                </LineContainerComponent>
            }
            {
                this.block!.getClassName() === "WorleyNoise3DBlock" &&
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent label="Use Manhattan Distance" target={this.block} propertyName="manhattanDistance" onValueChanged={() => globalState.onRebuildRequiredObservable.notifyObservers()} />              
                </LineContainerComponent>
            }
            </div>
        );
    }
}