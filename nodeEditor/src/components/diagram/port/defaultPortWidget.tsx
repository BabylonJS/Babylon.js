import { BaseWidget, PortState, NodeModel, BaseWidgetProps } from 'storm-react-diagrams';
import * as React from 'react';


export interface IDefaultPortWidgetProps extends BaseWidgetProps {
	name: string;
	node: NodeModel;
    style: any;
}

export class DefaultPortWidget extends BaseWidget<IDefaultPortWidgetProps, PortState> {
    constructor(props: IDefaultPortWidgetProps) {
		super("srd-port", props);
		this.state = {
			selected: false
		};
	}

	getClassName() {
		return "port " + super.getClassName() + (this.state.selected ? this.bem("--selected") : "");
	}

	render() {
		return (
			<div
				style={this.props.style}
				{...this.getProps()}
				onMouseEnter={() => {
					this.setState({ selected: true });
				}}
				onMouseLeave={() => {
					this.setState({ selected: false });
				}}
				data-name={this.props.name}
				data-nodeid={this.props.node.getID()}
			/>
		);
	}
}