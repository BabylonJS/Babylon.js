import { LinkModel, PortModel, DefaultLinkModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GenericNodeModel } from './genericNodeModel';

/**
 * Port model for the generic node
 */
export class GenericPortModel extends PortModel {
	/**
	 * If the port is input or output
	 */
	public position: string | "input" | "output";
	/**
	 * What the port is connected to
	 */
	public connection: Nullable<NodeMaterialConnectionPoint> = null;

	
	static idCounter = 0;

	constructor(name:string, type: string = "input") {
		super(name, "generic");
		this.position = type;
		GenericPortModel.idCounter++;
	}

	syncWithNodeMaterialConnectionPoint(connection:NodeMaterialConnectionPoint){
		this.connection = connection;
		this.name = connection.name;
	}

	getNodeModel(){
		return this.parent as GenericNodeModel
	}

	link(outPort:GenericPortModel){
		var link = this.createLinkModel()
		link.setSourcePort(this)
		link.setTargetPort(outPort)
		return link;
	}

	getInputFromBlock(){

	}

	createLinkModel(): LinkModel {
		return new DefaultLinkModel();
	}

	getValue:Function = ()=>{
		return null;
	}

	static SortInputOutput(a:Nullable<GenericPortModel>, b:Nullable<GenericPortModel>){
		if(!a || !b){
			return null;
		}else if(a.position == "output" && b.position == "input"){
			return {
				input: b,
				output: a
			}
		}else if(b.position == "output" && a.position == "input"){
			return {
				input: a,
				output: b
			}
		}else{
			return null;
		}
	}
}