import { NodeModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
import { GenericPortModel } from './genericPortModel';

/**
 * Generic node model which stores information about a node editor block
 */
export class GenericNodeModel extends NodeModel {
	/**
	 * The babylon block this node represents
	 */
	public block:Nullable<NodeMaterialBlock> = null;
	/**
	 * Labels for the block
	 */
	public headerLabels:Array<{text: string}> = []
	/**
	 * Texture for the node if it exists
	 */
	public texture: Nullable<Texture> = null;
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

	public ports: {[s:string]:GenericPortModel};

	/**
	 * Constructs the node model
	 */
	constructor() {
		super("generic");
	}

}