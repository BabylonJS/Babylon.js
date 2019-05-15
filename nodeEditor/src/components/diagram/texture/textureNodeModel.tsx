import * as React from 'react';
import { Nullable } from 'babylonjs/types';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { DefaultNodeModel } from '../defaultNodeModel';
import { GlobalState } from '../../../globalState';
import { TexturePropertyTabComponent } from '../../../components/propertyTab/properties/texturePropertyTabComponent';

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

}