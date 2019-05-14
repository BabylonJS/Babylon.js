import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { TextureNodeModel } from './textureNodeModel';
import { GenericPortModel } from '../generic/genericPortModel';
import { TextureLineComponent } from "../../../sharedComponents/textureLineComponent"
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';

/**
 * GenericNodeWidgetProps
 */
export interface TextureNodeWidgetProps {
    node: Nullable<TextureNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class TextureNodeWidget extends React.Component<TextureNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: TextureNodeWidgetProps) {
        super(props);
        this.state = {};

        if (this.props.node) {
            this.props.node.addListener({
                selectionChanged: () => {
                    let selected = (this.props.node as any).selected;
                    this.props.globalState.onSelectionChangedObservable.notifyObservers(selected ? this.props.node : null);
                }
            });
        }
    }

    render() {
        var outputPorts = new Array<JSX.Element>();
        var value = <div></div>
        if (this.props.node) {
            // Input/Output ports
            for (var key in this.props.node.ports) {
                var port = this.props.node.ports[key] as GenericPortModel;
                outputPorts.push(
                    <div key={key} className="output-port">
                        <div className="output-port-label">
                            {port.name}
                        </div>
                        <div className="output-port-plug">
                            <PortWidget key={key} name={port.name} node={this.props.node} />
                        </div>
                    </div>
                )
            }

            // Display the view depending on the value type of the node
            if (this.props.node.texture) {
                value = (
                    <TextureLineComponent ref="textureView" width={200} height={180} texture={this.props.node.texture} hideChannelSelect={true} />
                )
            }
        }

        return (
            <div className={"diagramBlock"}>
                <div className="header">
                    Texture
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                {value}
            </div>
        );
    }
}