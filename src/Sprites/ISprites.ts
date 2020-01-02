/**
 * Defines the basic options interface of a Sprite Frame Source Size.
 */
export interface ISpriteJSONSpriteSourceSize{
    /**
	 * number of the original width of the Frame
	 */
    w : number;

    /**
     * number of the original height of the Frame
     */
    h : number;
}

/**
 * Defines the basic options interface of a Sprite Frame Data.
 */
export interface ISpriteJSONSpriteFrameData{
    /**
	 * number of the x offset of the Frame
	 */
    x : number;

    /**
	 * number of the y offset of the Frame
	 */
    y : number;

    /**
	 * number of the width of the Frame
	 */
    w : number;

    /**
     * number of the height of the Frame
     */
    h : number;
}

/**
 * Defines the basic options interface of a JSON Sprite.
 */
export interface ISpriteJSONSprite{
    /**
	 * string name of the Frame
	 */
    filename : string;

    /**
	 * ISpriteJSONSpriteFrame basic object of the frame data
	 */
    frame : ISpriteJSONSpriteFrameData;

    /**
    * boolean to flag is the frame was rotated.
    */
    rotated : boolean;

    /**
    * boolean to flag is the frame was trimmed.
    */
    trimmed : boolean;

    /**
	 * ISpriteJSONSpriteFrame basic object of the source data
	 */
    spriteSourceSize : ISpriteJSONSpriteFrameData;

    /**
	 * ISpriteJSONSpriteFrame basic object of the source data
	 */
    sourceSize : ISpriteJSONSpriteSourceSize;
}

/**
 * Defines the basic options interface of a JSON atlas.
 */
export interface ISpriteJSONAtlas{

    /**
	 * Array of objects that contain the frame data.
	 */
    frames: Array<ISpriteJSONSprite>;

    /**
	 * object basic object containing the sprite meta data.
	 */
    meta?: object;

}