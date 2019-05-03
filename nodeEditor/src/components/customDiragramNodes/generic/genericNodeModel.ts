import { NodeModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';

export class GenericNodeModel extends NodeModel {
	public block:Nullable<NodeMaterialBlock> = null;
	public headerLabels:Array<{text: string}> = []
	texture: Nullable<Texture> = null;
	vector2: Nullable<Vector2> = null;
	vector3: Nullable<Vector3> = null;
	vector4: Nullable<Vector4> = null;
	matrix: Nullable<Matrix> = null;
	//public textureInputs:Array<{text: string, initialValue: string}> = []

	constructor() {
		super("generic");
		//this.addPort(new GenericPortModel("right"));
	}

}