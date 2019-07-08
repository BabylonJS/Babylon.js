import * as React from 'react';
import { Nullable } from 'babylonjs/types';
import { Light } from 'babylonjs/Lights/light';
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { LightPropertyTabComponent } from './lightPropertyTabComponent';
import { NodeCreationOptions, GraphEditor } from '../../../graphEditor';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { LightBlock } from 'babylonjs/Materials/Node/Blocks/Dual/lightBlock';

/**
 * Light node model which stores information about a node editor block
 */
export class LightNodeModel extends DefaultNodeModel {
    private _block: LightBlock;

	/**
	 * Light for the node if it exists
	 */
    public get light(): Nullable<Light> {
        return this._block.light;
    }

    public set light(value: Nullable<Light>) {
        this._block.light = value;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("light");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <LightPropertyTabComponent globalState={globalState} node={this} />
        );
    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]) {
        this._block = options.nodeMaterialBlock as LightBlock;

        super.prepare(options, nodes, model, graphEditor, filterInputs);
    }

}