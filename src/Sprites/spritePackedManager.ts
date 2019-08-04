import { SpriteManager } from "./spriteManager";
import { AssetsManager } from "../Misc/assetsManager";
import { Scene } from "../scene";
import { Texture } from "../Materials/Textures/texture";
import { Logger } from "../Misc/logger";

export class SpritePackedManager {

    /**
     * Creates a new sprite manager from a packed sprite sheet
     * @param name defines the manager's name
     * @param imgUrl defines the sprite sheet url
     * @param capacity defines the maximum allowed number of sprites
     * @param scene defines the hosting scene
     * @param sspriteJSON, null otherwise a JSON object defining sprite sheet data
     * @param epsilon defines the epsilon value to align texture (0.01 by default)
     * @param samplingMode defines the smapling mode to use with spritesheet
     * @param fromPacked set to true; do not alter
     */
    constructor(public name: string, imgUrl: string, capacity: number, scene: Scene, spriteJSON: string | null = null, epsilon: number = 0.01, samplingMode: number = Texture.TRILINEAR_SAMPLINGMODE) {

        //the cellSize parameter is not used when built from JSON which provides individual cell data
        let spriteManager = new SpriteManager(name, imgUrl, capacity, 0, scene, epsilon, samplingMode, true);

        if (spriteJSON !== null) {
            try {
                let celldata = JSON.parse(spriteJSON);
                let spritemap = (<string[]>(<any>Reflect).ownKeys(celldata.frames));
                spriteManager.spriteMap = spritemap;
                spriteManager.packedAndReady = true;
                spriteManager.cellData = celldata.frames;
                return spriteManager;
            }
            catch (e) {
                throw new Error(`Invalid JSON`);
            }
        }
        else {
            let re = /\./g;
            let li: number;
            do {
                li = re.lastIndex;
                re.test(imgUrl);
            } while (re.lastIndex > 0);
            let jsonUrl = imgUrl.substring(0, li - 1) + ".json";
            let assetsManager = new AssetsManager(scene);
            let task = assetsManager.addTextFileTask("LoadSpriteJSON", jsonUrl);

            task.onSuccess = (task) => {
                try {
                    let celldata  = JSON.parse(task.text);
                    let spritemap = (<string[]>(<any>Reflect).ownKeys(celldata.frames));
                    spriteManager.spriteMap = spritemap;
                    spriteManager.packedAndReady = true;
                    spriteManager.cellData = celldata.frames;
                    return spriteManager;
                }
                catch (e) {
                    throw new Error(`Invalid JSON`);
                }
            };

            assetsManager.onTaskErrorObservable.add((task) => {
                Logger.Error("Unable to Load Sprite JSON Data. Default Spritesheet managed.");
                spriteManager.dispose();
                return new SpriteManager("default", "https://www.babylonjs-playground.com/textures/amiga.jpg", 1, 64, scene);
            });
            assetsManager.load();
        }

    }
}