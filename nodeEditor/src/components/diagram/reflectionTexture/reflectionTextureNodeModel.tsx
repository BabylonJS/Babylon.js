import * as React from 'react';
import { Nullable } from 'babylonjs/types';
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { NodeCreationOptions, GraphEditor } from '../../../graphEditor';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';
import { ReflectionTextureBlock } from 'babylonjs/Materials/Node/Blocks/Dual/reflectionTextureBlock';
import { TexturePropertyTabComponent } from '../texture/texturePropertyTabComponent';

/**
 * Texture node model which stores information about a node editor block
 */
export class ReflectionTextureNodeModel extends DefaultNodeModel {
    private _block: ReflectionTextureBlock;

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
        super("reflectiontexture");
    }

    renderProperties(globalState: GlobalState) {
        return (
            <TexturePropertyTabComponent globalState={globalState} node={this} />
        );
    }

    prepare(options: NodeCreationOptions, nodes: Array<DefaultNodeModel>, model: DiagramModel, graphEditor: GraphEditor) {
        this._block = options.nodeMaterialBlock as ReflectionTextureBlock;

        super.prepare(options, nodes, model, graphEditor);
    }

}