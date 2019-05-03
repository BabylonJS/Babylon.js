import * as React from "react";
import { PortWidget } from "storm-react-diagrams";

export interface TextureNodeWidgetProps {
	node: any;
	size?: number;
}

export interface TextureNodeWidgetState {}


export class TextureNodeWidget extends React.Component<TextureNodeWidgetProps, TextureNodeWidgetState> {
	public static defaultProps: TextureNodeWidgetProps = {
		size: 150,
		node: null
	};

	constructor(props: TextureNodeWidgetProps) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div style={{background: "white", borderStyle: "solid", padding: "10px"}}>
				<p>Texture Node</p>
				<img src="../Playground/textures/bloc.jpg" width="30px"></img>
				<PortWidget name="right" node={this.props.node} />
			</div>
		);
	}
}