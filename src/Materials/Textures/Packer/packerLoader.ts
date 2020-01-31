import { TexturePacker, ITexturePackerOptions } from "./packer";
import { Scene } from "../../../scene";

/**
 * Defines the basic interface of a TexturePacker JSON File
 */
export interface ITexturePackerJSON{

    /**
	 * The frame ID
	 */
    name: string;

    /**
	 * The base64 channel data
	 */
    sets: any;

    /**
	 * The options of the Packer
	 */
    options: ITexturePackerOptions;

    /**
	 * The frame data of the Packer
	 */
    frames: Array<number>;

}

/**
 * This is a support class to load JSON texture packer data.
 * @see #TODO ADD THIS
 */
export class TexturePackerLoader{
    /**
    * Initializes a XML request for the JSON file.
    * @param jsonURL The URL of the texturePackage.json
    * @param scene that the packer is scoped to.
    * @returns TexturePacker
    */
    constructor(jsonURL: string, scene: Scene) {
        if (!scene || !jsonURL || typeof jsonURL !== 'string') {
            return false;
        }
        try {
            let pack = new TexturePacker('Parsing_TP', [], {}, scene);
            pack.promise = new Promise ((success, error) => {
            try {
                var xml = new XMLHttpRequest();
                xml.onreadystatechange = () => {
                    if (xml.readyState == 4) {
                        if (xml.status == 200) {
                            pack.updateFromJSON(xml.responseText, success, error);
                        }
                    }
                };
                xml.open("GET", jsonURL);
                xml.send();
                }catch (e) {
                    error(e);
                }
            });

            return pack;

            } catch (e) {

            }
    }
}