import { LinkModel, PortModel, DefaultLinkModel } from "storm-react-diagrams";
import { Nullable } from 'babylonjs/types';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { GenericNodeModel } from './genericNodeModel';


export class GenericPortModel extends PortModel {
	position: string | "input" | "output";
	connection: Nullable<NodeMaterialConnectionPoint> = null;
	static idCounter = 0;

	constructor(name:string, type: string = "input") {
		//(""+GenericPortModel.idCounter)
		super(name, "generic");
		this.position = type;
		GenericPortModel.idCounter++;
		// this.addListener({
		// 	selectionChanged: ()=>{
		// 		console.log("change")
		// 	},
		// 	lockChanged: ()=>{
		// 		console.log("lock")
		// 	},
		// 	entityRemoved: ()=>{
		// 		console.log("rem")
		// 	}
		// })
	}

	syncWithNodeMaterialConnectionPoint(connection:NodeMaterialConnectionPoint){
		this.connection = connection;
		this.name = connection.name;
	}

	getNodeModel(){
		return this.parent as GenericNodeModel
	}

	// serialize() {
	// 	return _.merge(super.serialize(), {
	// 		position: this.position
	// 	});
	// }

	// deSerialize(data: any, engine: DiagramEngine) {
	// 	super.deSerialize(data, engine);
	// 	this.position = data.position;
	// }

	link(outPort:GenericPortModel){
		var link = this.createLinkModel()
		// link.addListener({
		// 	selectionChanged: ()=>{
		// 		console.log("hit")
		// 	}
		// })
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