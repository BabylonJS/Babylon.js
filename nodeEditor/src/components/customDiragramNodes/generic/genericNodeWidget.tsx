import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { GenericNodeModel } from './genericNodeModel';
import { GenericPortModel } from './genericPortModel';
import {TextureLineComponent} from "../../../sharedComponents/textureLineComponent"
import {FileButtonLineComponent} from "../../../sharedComponents/fileButtonLineComponent"
import { Vector2LineComponent } from '../../../sharedComponents/vector2LineComponent';
import { Vector3LineComponent } from '../../../sharedComponents/vector3LineComponent';
import { Nullable } from 'babylonjs/types';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { Engine } from 'babylonjs/Engines/engine';
import { Tools } from 'babylonjs/Misc/tools';

export interface GenericNodeWidgetProps {
	node: Nullable<GenericNodeModel>;
}

export interface GenericNodeWidgetState {}


export class GenericNodeWidget extends React.Component<GenericNodeWidgetProps, GenericNodeWidgetState> {

	constructor(props: GenericNodeWidgetProps) {
		super(props);
		this.state = {}
	}

	// componentDidUpdate() {
	// 	this.updateTexture()
	// }

	// componentDidMount() {
	// 	this.updateTexture()
	// }


	replaceTexture(file: File) {
		if(!this.props.node){
			return;
		}
		let texture = this.props.node.texture as Texture;
		if(!texture){
			this.props.node.texture = new Texture(null, Engine.LastCreatedScene)
			texture = this.props.node.texture;
		}
        Tools.ReadFile(file, (data) => {
            var blob = new Blob([data], { type: "octet/stream" });
            var url = URL.createObjectURL(blob);

            if (texture.isCube) {
                let extension: string | undefined = undefined;
                if (file.name.toLowerCase().indexOf(".dds") > 0) {
                    extension = ".dds";
                } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                    extension = ".env";
                }

                (texture as Texture).updateURL(url, extension, () => this.forceUpdate());
            } else {
                (texture as Texture).updateURL(url, null, () => this.forceUpdate());
            }
			(this.refs.textureView as TextureLineComponent).updatePreview()
        }, undefined, true);
    }

	render() {
		var headers = new Array<JSX.Element>()
		var inputPorts = new Array<JSX.Element>()
		var outputPorts = new Array<JSX.Element>()
		var value = <div></div>
		if(this.props.node){
			// Header labels
			this.props.node.headerLabels.forEach((h, i)=>{
				headers.push(<div style={{fontWeight: "bold", borderBottomStyle: "solid"}} key={i}>{h.text}</div>)
			})

			// Input/Output ports
			for(var key in this.props.node.ports){
				var port = this.props.node.ports[key] as GenericPortModel;
				if(port.position == "input"){
					var control = <div></div>

					var color = "black"
					if(port.connection){
						if(port.connection.isAttribute){
							color = "red"
						}else if(port.connection.isUniform){
							color = "brown"
						}
						else if(port.connection.isVarying){
							color = "purple"
						}
					}

					inputPorts.push(
						<div key={key} style={{paddingBottom: "8px"}}>
							<div style={{display: "inline-block", borderStyle: "solid", marginBottom: "-4px", position: "absolute", left: "-17px", background: "#777777"}}>
								<PortWidget key={key} name={port.name} node={this.props.node} />
							</div>
							<div style={{display: "inline-block", color: color}}>
								{port.name} 
							</div>
							{control}
						</div>
					)
				}else{
					outputPorts.push(
						<div key={key} style={{paddingBottom: "8px"}}>
							<div style={{display: "inline-block"}}>
								{port.name}
							</div>
							<div style={{display: "inline-block", borderStyle: "solid", marginBottom: "-4px", position: "absolute", right: "-17px", background: "#777777"}}>
								<PortWidget key={key} name={port.name} node={this.props.node} />
							</div>
						</div>
					)
				}
				
			}

			if(this.props.node.texture){
				value = (
					<div>
						<TextureLineComponent ref="textureView" width={100} height={100} texture={this.props.node.texture} hideChannelSelect={true}/>
						<FileButtonLineComponent label="" onClick={(file) => this.replaceTexture(file)} accept=".jpg, .png, .tga, .dds, .env" />
					</div>
				)
			} else if(this.props.node.vector3){
				value = (
					<div style={{width: "220px"}}>
						<Vector3LineComponent label="" target={this.props.node} propertyName="vector3"></Vector3LineComponent>
					</div>
				)
			} else if(this.props.node.vector2){
				value = (
					<div style={{width: "220px"}}>
						<Vector2LineComponent label="" target={this.props.node} propertyName="vector2"></Vector2LineComponent>
					</div>
				)
			}
		}

		return (
			<div style={{background: "white", borderStyle: "solid", padding: "10px"}}>
				{headers}
				{inputPorts}
				{outputPorts}
				{value}
			</div>
		);
	}
}