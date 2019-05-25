import * as React from 'react';
import { Nullable } from 'babylonjs/types';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { TexturePropertyTabComponent } from '../../../components/propertyTab/properties/texturePropertyTabComponent';
import { NodeCreationOptions, GraphEditor } from '../../../graphEditor';
import { DiagramModel } from 'storm-react-diagrams/dist/@types/src/models/DiagramModel';
import { TextureBlock } from 'babylonjs/Materials/Node/Blocks/Fragment/textureBlock';

/**
 * Texture node model which stores information about a node editor block
 */
export class TextureNodeModel extends DefaultNodeModel {
	/**
	 * Texture for the node if it exists
	 */
    public texture: Nullable<Texture> = null;
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
        let textureBlock = options.nodeMaterialBlock as TextureBlock;

        this.texture = textureBlock.texture.value;

        super.prepare(options, nodes, model, graphEditor, filterInputs);
    }

}