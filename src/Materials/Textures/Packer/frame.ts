//import { Engine } from "../../../Engines/engine";
//import { Constants } from "../../../Engines/constants";
//import { AbstractMesh } from "../../../Meshes/abstractMesh";
//import { VertexBuffer } from "../../../Meshes/buffer";
//import { Scene } from "../../../scene";
//import { Material } from "../../material";
//import { Texture } from "../texture";
//import { DynamicTexture } from "../dynamicTexture";
//import { Nullable } from "../../../types";
import { Vector2 } from "../../../Maths/math.vector";

/**
 * Defines the basic options interface of a TexturePacker Frame
 */
export interface ITexturePackerFrame{

    /**
	 * The frame ID
	 */
    id: number;

    /**
	 * The frames Scale
	 */
    scale: Vector2;

    /**
	 * The Frames offset
	 */
    offset: Vector2;    

}

/**
 * This is a support class for frame Data on texture packer sets.
 * @see #TODO ADD THIS
 */
export class TexturePackerFrame implements ITexturePackerFrame{
     /**
	 * The frame ID
	 */
    public id: number;

    /**
	 * The frames Scale
	 */
    public scale: Vector2;

    /**
	 * The Frames offset
	 */
    public offset: Vector2;
    
    /**
    * Initializes a texture package frame.
    * @returns TexturePackerFrame
    */
    constructor(id: number, scale: Vector2, offset: Vector2) {
        this.id = id;
        this.scale = scale;
        this.offset = offset;
    }    
}
