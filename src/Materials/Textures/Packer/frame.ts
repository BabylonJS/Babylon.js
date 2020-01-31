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
     * @param id The numerical frame identifier
     * @param scale Scalar Vector2 for UV frame
     * @param offset Vector2 for the frame position in UV units.
     * @returns TexturePackerFrame
     */
    constructor(id: number, scale: Vector2, offset: Vector2) {
        this.id = id;
        this.scale = scale;
        this.offset = offset;
    }
}