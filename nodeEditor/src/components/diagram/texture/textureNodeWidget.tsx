import * as React from "react";
import { PortWidget } from "storm-react-diagrams";
import { TextureNodeModel } from './textureNodeModel';
import { TextureLineComponent } from "../../../sharedComponents/textureLineComponent"
import { Nullable } from 'babylonjs/types';
import { GlobalState } from '../../../globalState';
import { DefaultPortModel } from '../defaultPortModel';

/**
 * GenericNodeWidgetProps
 */
export interface ITextureNodeWidgetProps {
    node: Nullable<TextureNodeModel>;
    globalState: GlobalState;
}

/**
 * Used to display a node block for the node editor
 */
export class TextureNodeWidget extends React.Component<ITextureNodeWidgetProps> {
	/**
	 * Creates a GenericNodeWidget
	 * @param props 
	 */
    constructor(props: ITextureNodeWidgetProps) {
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
        var inputPorts = new Array<JSX.Element>();
        var outputPorts = new Array<JSX.Element>();
        if (this.props.node) {
            // Input/Output ports
            for (var key in this.props.node.ports) {
                var port = this.props.node.ports[key] as DefaultPortModel;
                if (port.position === "output") {
                    outputPorts.push(
                        <div key={key} className="output-port">
                            <div className="output-port-label">
                                {port.name}
                            </div>
                            <div className="output-port-plug">
                                <PortWidget key={key} name={port.name} node={this.props.node} />
                            </div>
                        </div>
                    );
                } else if (port.name === "uv") {
                    inputPorts.push(
                        <div key={key} className="input-port">
                            <div className="input-port-plug">
                                <PortWidget key={key} name={port.name} node={this.props.node} />
                            </div>
                            <div className="input-port-label">
                                {port.name}
                            </div>
                        </div>
                    )
                }
            }
        }

        return (
            <div className={"diagramBlock"}>
                <div className="header">
                    {this.props.node!.block!.name}
                </div>
                <div className="inputs">
                    {inputPorts}
                </div>
                <div className="outputs">
                    {outputPorts}
                </div>
                {
                    this.props.node && this.props.node.texture &&
                    <TextureLineComponent ref="textureView" width={200} height={180} texture={this.props.node.texture} hideChannelSelect={true} />
                }
            </div>
        );
    }
}