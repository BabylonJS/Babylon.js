import * as React from 'react';
import { Nullable } from 'babylonjs/types';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { TexturePropertyTabComponent } from './texturePropertyTabComponent';
import { NodeCreationOptions, GraphEditor } from '../../../graphEditor';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/textureBlock';

/**
 * Texture node model which stores information about a node editor block
 */
export class TextureNodeModel extends DefaultNodeModel {
    private _block: TextureBlock;

	/**
	 * Texture for the node if it exists
	 */
    public get texture(): Nullable<BaseTexture> {
        return this._block.texture;
    }

    public set texture(value: Nullable<BaseTexture>) {
        this._block.texture = value;
    }

	/**
	 * Constructs the node model
	 */
    constructor() {
        super("texture");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <TexturePropertyTabComponent globalState={globalState} node={this} />
        );
    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor, filterInputs: string[]) {
        this._block = options.nodeMaterialBlock as TextureBlock;

        super.prepare(options, nodes, model, graphEditor, filterInputs);
    }

}