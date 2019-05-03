import {
	DiagramEngine,
	DiagramModel,
	DiagramWidget,
    MoveCanvasAction
} from "storm-react-diagrams";

import * as React from "react";
import { GlobalState } from '../globalState';

import { GenericNodeFactory } from './customDiragramNodes/generic/genericNodeFactory';
import { NodeMaterialBlockConnectionPointTypes } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPointTypes';
import { GenericNodeModel } from './customDiragramNodes/generic/genericNodeModel';
import { GenericPortModel } from './customDiragramNodes/generic/genericPortModel';
import { Engine } from 'babylonjs/Engines/engine';
import { LineContainerComponent } from "../sharedComponents/lineContainerComponent"
import { ButtonLineComponent } from '../sharedComponents/buttonLineComponent';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { NodeMaterialConnectionPoint } from 'babylonjs/Materials/Node/nodeMaterialBlockConnectionPoint';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { Vector2, Vector3, Vector4, Matrix } from 'babylonjs/Maths/math';
import { AlphaTestBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/alphaTestBlock';
import { FragmentOutputBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/fragmentOutputBlock';
import { ImageProcessingBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/imageProcessingBlock';
import { RGBAMergerBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/rgbaMergerBlock';
import { RGBASplitterBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/rgbaSplitterBlock';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/textureBlock';
import { BonesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/bonesBlock';
import { InstancesBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/instancesBlock';
import { MorphTargetsBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/morphTargetsBlock';
import { VertexOutputBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/vertexOutputBlock';
import { FogBlock } from 'babylonjs/Materials/Node/Blocks/Dual/fogBlock';
import { AddBlock } from 'babylonjs/Materials/Node/Blocks/addBlock';
import { ClampBlock } from 'babylonjs/Materials/Node/Blocks/clampBlock';
import { MatrixMultiplicationBlock } from 'babylonjs/Materials/Node/Blocks/matrixMultiplicationBlock';
import { MultiplyBlock } from 'babylonjs/Materials/Node/Blocks/multiplyBlock';
import { Vector2TransformBlock } from 'babylonjs/Materials/Node/Blocks/vector2TransformBlock';
import { Vector3TransformBlock } from 'babylonjs/Materials/Node/Blocks/vector3TransformBlock';
import { Vector4TransformBlock } from 'babylonjs/Materials/Node/Blocks/vector4TransformBlock';
//require("../../../inspector/src/components/actionTabs/actionTabs.scss");
require("storm-react-diagrams/dist/style.min.css");
/*
Data vs View
NodeMaterialBlock = GenericNodeModel
NodeMaterialConnectionPoint = GenericPortModel (Connection is a LinkModel, which is a built in react-storm type)

You can only access data from view, view is not accessible from data

Traversing data to create view is done in createNodeFromObject method
*/





interface IGraphEditorProps {
    globalState: GlobalState;
}

export class GraphEditor extends React.Component<IGraphEditorProps> {
    engine:DiagramEngine;
    model: DiagramModel;

    nodes = new Array<any>();

    rowPos = new Array<number>()
    
    /**
     * Creates a node and recursivly creates its parent nodes from it's input
     * @param nodeMaterialBlock 
     */
    public createNodeFromObject(
        options:{
            column:number,
            nodeMaterialBlock?:NodeMaterialBlock                      
        }
    ){
        // Update rows/columns
        if(this.rowPos[options.column] == undefined){
            this.rowPos[options.column] = 0;
        }else{
            this.rowPos[options.column]++;
        }

        // Create new node in the graph
        var outputNode = new GenericNodeModel();
        this.nodes.push(outputNode)
        outputNode.setPosition(1600-(300*options.column), 200*this.rowPos[options.column])
        this.model.addAll(outputNode);

        if(options.nodeMaterialBlock){
            outputNode.block = options.nodeMaterialBlock
            outputNode.headerLabels.push({text: options.nodeMaterialBlock.getClassName()})

            // Create output ports
            options.nodeMaterialBlock._outputs.forEach((connection:any)=>{
                var outputPort = new GenericPortModel(connection.name, "output");
                outputPort.syncWithNodeMaterialConnectionPoint(connection);
                outputNode.addPort(outputPort)
            })

            // Create input ports and nodes if they exist
            options.nodeMaterialBlock._inputs.forEach((connection)=>{
                var inputPort = new GenericPortModel(connection.name, "input");
                inputPort.connection = connection;
                outputNode.addPort(inputPort)
                
                if(connection._connectedPoint){
                    // Block is not a leaf node, create node for the given block type
                    var connectedNode;
                    var existingNodes = this.nodes.filter((n)=>{return n.block == (connection as any)._connectedPoint._ownerBlock});
                    if(existingNodes.length == 0){
                        connectedNode = this.createNodeFromObject({column: options.column+1, nodeMaterialBlock: connection._connectedPoint._ownerBlock});
                    }else{
                        connectedNode = existingNodes[0];
                    }
           
                    let link = connectedNode.ports[connection._connectedPoint.name].link(inputPort);
                    this.model.addAll(link);
                    
                }else {
                    // Create value node for the connection
                    var type = ""
                    if(connection.type == NodeMaterialBlockConnectionPointTypes.Texture){
                        type = "Texture"
                    } else if(connection.type == NodeMaterialBlockConnectionPointTypes.Matrix){
                        type = "Matrix"
                    } else if(connection.type & NodeMaterialBlockConnectionPointTypes.Vector3OrColor3){
                        type = "Vector3"
                    } else if(connection.type & NodeMaterialBlockConnectionPointTypes.Vector2){
                        type = "Vector2"
                    }else if(connection.type & NodeMaterialBlockConnectionPointTypes.Vector3OrColor3OrVector4OrColor4){
                        type = "Vector4"
                    }
                    
                    // Create links
                    var localNode = this.addValueNode(type, options.column+1, connection);
                    var ports = localNode.getPorts()
                    for(var key in ports){
                        let link = (ports[key] as GenericPortModel).link(inputPort);
                        this.model.addAll(link);
                    }
                }
            })
        }
        
        
    
        return outputNode;
    }

    componentDidMount(){
        if(this.props.globalState.hostDocument){
            var widget = (this.refs["test"] as DiagramWidget);
            widget.setState({document: this.props.globalState.hostDocument})
            this.props.globalState.hostDocument!.addEventListener("keyup", widget.onKeyUpPointer as any, false);
        }
    }

    componentWillUnmount(){
        if(this.props.globalState.hostDocument){
            var widget = (this.refs["test"] as DiagramWidget);
            this.props.globalState.hostDocument!.removeEventListener("keyup", widget.onKeyUpPointer as any, false);
        }
    }

    constructor(props: IGraphEditorProps) {
        super(props);
        

        // setup the diagram engine
        this.engine = new DiagramEngine();
        this.engine.installDefaultFactories()
        this.engine.registerNodeFactory(new GenericNodeFactory());

        // setup the diagram model
        this.model = new DiagramModel();

        // Listen to events to connect/disconnect blocks or
        this.model.addListener({
            linksUpdated: (e)=>{
                if(!e.isCreated){
                    // Link is deleted
                    console.log("link deleted");
                    var link = GenericPortModel.SortInputOutput(e.link.sourcePort as GenericPortModel, e.link.targetPort as GenericPortModel);
                    console.log(link)
                    if(link){
                        if(link.output.connection && link.input.connection){
                            // Disconnect standard nodes
                            console.log("disconnected "+link.output.connection.name+" from "+link.input.connection.name)
                            link.output.connection.disconnectFrom(link.input.connection)
                            link.input.syncWithNodeMaterialConnectionPoint(link.input.connection)
                            link.output.syncWithNodeMaterialConnectionPoint(link.output.connection)
                        }else if(link.input.connection && link.input.connection.value){
                            console.log("value link removed");
                            link.input.connection.value = null;
                        }else{
                            console.log("invalid link error");
                        }   
                    }
                }else{
                    console.log("link created")
                    console.log(e.link.sourcePort)
                }
                e.link.addListener({
                    sourcePortChanged: ()=>{
                        console.log("port change")
                    },
                    targetPortChanged: ()=>{
                        // Link is created with a target port
                        console.log("Link set to target")
                        var link = GenericPortModel.SortInputOutput(e.link.sourcePort as GenericPortModel, e.link.targetPort as GenericPortModel);
                        
                        if(link){
                            if(link.output.connection && link.input.connection){
                               console.log("link standard blocks")
                               link.output.connection.connectTo(link.input.connection)
                            }else if(link.input.connection){
                                console.log("link value to standard block")
                                link.input.connection.value = link.output.getValue();
                                
                            }
                            if(this.props.globalState.nodeMaterial){
                                this.props.globalState.nodeMaterial.build()
                            }
                        }
                    }
                    
                })
                
            },
            nodesUpdated: (e)=>{
                if(e.isCreated){
                    console.log("new node")
                }else{
                    console.log("node deleted")
                }
            }
        })

        // Load graph of nodes from the material
        if(this.props.globalState.nodeMaterial){
            var material:any = this.props.globalState.nodeMaterial;
            material._vertexOutputNodes.forEach((n:any)=>{
                this.createNodeFromObject({column: 0, nodeMaterialBlock: n});
            })
            material._fragmentOutputNodes.forEach((n:any)=>{
                this.createNodeFromObject({column: 0, nodeMaterialBlock: n});
            })
        }

        // Zoom out a bit at the start
        this.model.setZoomLevel(20)

        // load model into engine
        this.engine.setDiagramModel(this.model);
    }

    addNodeFromClass(ObjectClass:typeof NodeMaterialBlock){
        var block = new ObjectClass(ObjectClass.prototype.getClassName()+"sdfsdf")
        var localNode = this.createNodeFromObject({column: 0, nodeMaterialBlock: block})
        var widget = (this.refs["test"] as DiagramWidget);
       
        this.forceUpdate()

        // This is needed to fix link offsets when created, (eg. create a fog block)
        // Todo figure out how to correct this without this
        setTimeout(() => {
            widget.startFiringAction(new MoveCanvasAction(1,0, this.model));
        }, 500);

        return localNode
    }

    addValueNode(type: string, column = 0, connection?: NodeMaterialConnectionPoint){
        var localNode = this.createNodeFromObject({column: column})
        var outPort = new GenericPortModel(type, "output");
        if(type == "Texture"){
            outPort.getValue = ()=>{
                return localNode.texture;
            }
            if(connection && connection.value){
                localNode.texture = connection.value
            }else{
                localNode.texture = new Texture(null, Engine.LastCreatedScene)
            }
        }else if(type == "Vector2"){
            outPort.getValue = ()=>{
                return localNode.vector2;
            }
            if(connection && connection.value){
                localNode.vector2 = connection.value
            }else{
                localNode.vector2 = new Vector2()
            }
        }else if(type == "Vector3"){
            outPort.getValue = ()=>{
                return localNode.vector3;
            }
            if(connection && connection.value){
                localNode.vector3 = connection.value
            }else{
                localNode.vector3 = new Vector3()
            }
        }else if(type == "Vector4"){
            outPort.getValue = ()=>{
                return localNode.vector4;
            }
            if(connection && connection.value){
                localNode.vector4 = connection.value
            }else{
                localNode.vector4 = new Vector4(0,0,0,1)
            }
        }else if(type == "Matrix"){
            outPort.getValue = ()=>{
                return localNode.matrix;
            }
            if(connection && connection.value){
                localNode.matrix = connection.value
            }else{
                localNode.matrix = new Matrix()
            }
        }else{
            console.log("Node type "+type+"is not supported")
        }
        localNode.addPort(outPort)
        this.forceUpdate()

        return localNode;
    }

    

    // Block types used to create the menu from
    allBlocks = {
        Fragment: [AlphaTestBlock, FragmentOutputBlock, ImageProcessingBlock, RGBAMergerBlock, RGBASplitterBlock, TextureBlock],
        Vertex: [BonesBlock, InstancesBlock, MorphTargetsBlock, VertexOutputBlock],
        Dual: [FogBlock],
        Other: [AddBlock, ClampBlock, MatrixMultiplicationBlock, MultiplyBlock, Vector2TransformBlock, Vector3TransformBlock, Vector4TransformBlock],
        Value: ["Texture", "Vector2", "Vector3", "Matrix"],
    }

    render() {
        // Create node menu
        var blockMenu = []
        for(var key in this.allBlocks){
            var blockList = (this.allBlocks as any)[key].map((b:any)=>{
                var label = typeof b === "string" ? b : b.prototype.getClassName()
                var onClick =typeof b === "string" ? () => {this.addValueNode(b)} : () => {this.addNodeFromClass(b)};
                return  <ButtonLineComponent label={label} onClick={onClick} />
            })
            blockMenu.push(
                <LineContainerComponent  title={key+" blocks"}>
                    {blockList}
                </LineContainerComponent>
            )
        }

        return (
            <div style={{
                display: "flex",
                height: "100%",
                background: "#464646",
            }}>
                {/* Node creation menu */}
                <div id="actionTabs" style={{width: "170px", borderRightStyle: "solid", borderColor: "grey", borderWidth: "1px" }} >
                    <div className="tabs" style={{gridTemplateRows: "0px 1fr"}}>
                        <div className="labels"/>
                        <div className="panes">
                            <div className="pane">
                                {blockMenu}
                            </div>
                        </div>
                    </div>
                </div>
                
                {/* The node graph diagram */}
                <DiagramWidget deleteKeys={[46]} ref={"test"} inverseZoom={true} className="srd-demo-canvas" diagramEngine={this.engine} maxNumberPointsPerLink={0} />
            </div>
        );

    }
}