import * as SRD from "storm-react-diagrams";
import { TextureNodeWidget } from "./textureNodeWidget";
import { TextureNodeModel } from "./textureNodeModel";
import * as React from "react";
import { GlobalState } from '../../../globalState';

/**
 * Node factory which creates editor nodes
 */
export class TextureNodeFactory extends SRD.AbstractNodeFactory {
    private _globalState: GlobalState;

	/**
	 * Constructs a TextureNodeFactory
	 */
    constructor(globalState: GlobalState) {
        super("texture");

        this._globalState = globalState;
    }

	/**
	 * Generates a node widget
	 * @param diagramEngine diagram engine
	 * @param node node to generate
	 * @returns node widget jsx
	 */
    generateReactWidget(diagramEngine: SRD.DiagramEngine, node: TextureNodeModel): JSX.Element {
        return <TextureNodeWidget node={node} globalState={this._globalState} />;
    }

	/**
	 * Gets a new instance of a node model
	 * @returns texture node model
	 */
    getNewInstance() {
        return new TextureNodeModel();
    }
}