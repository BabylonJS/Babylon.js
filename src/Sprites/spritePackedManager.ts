import { SpriteManager } from "./spriteManager";
import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";

/**
 * Class used to manage multiple sprites of different sizes on the same spritesheet
 * @see https://doc.babylonjs.com/babylon101/sprites
 */

export class SpritePackedManager extends SpriteManager{

    /**
     * Creates a new sprite manager from a packed sprite sheet
     * @param name defines the manager's name
     * @param imgUrl defines the sprite sheet url
     * @param capacity defines the maximum allowed number of sprites
     * @param scene defines the hosting scene
     * @param spriteJSON null otherwise a JSON object defining sprite sheet data
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param samplingMode defines the smapling mode to use with spritesheet
     * @param fromPacked set to true; do not alter
     */

    constructor(
        /** defines the packed manager's name */
        public name: string,
        imgUrl: string, capacity: number, scene: Scene, spriteJSON: string | null = null, epsilon: number = 0.01, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {

        //the cellSize parameter is not used when built from JSON which provides individual cell data, defaults to 64 if JSON load fails
        super(name, imgUrl, capacity, 64, scene, epsilon, samplingMode, true, spriteJSON);

    }
}