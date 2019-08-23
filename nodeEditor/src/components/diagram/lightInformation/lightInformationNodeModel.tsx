import * as React from 'react';
import { Nullable } from 'babylonjs/types';
import { Light } from 'babylonjs/Lights/light';
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { LightInformationPropertyTabComponent } from './lightInformationPropertyTabComponent';
import { NodeCreationOptions, GraphEditor } from '../../../graphEditor';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { LightInformationBlock } from 'babylonjs/Materials/Node/Blocks/Vertex/lightInformationBlock';

export class LightInformationNodeModel extends DefaultNodeModel {
    private _block: LightInformationBlock;

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
        super("light-information");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <LightInformationPropertyTabComponent globalState={globalState} node={this} />
        );
    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor) {
        this._block = options.nodeMaterialBlock as LightInformationBlock;

        super.prepare(options, nodes, model, graphEditor);
    }

}