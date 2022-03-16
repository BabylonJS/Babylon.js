import { ImageMimeType } from "babylonjs-gltf2interface";

/**
 * Class for holding and downloading glTF file data
 */
export class GLTFData {
    /**
     * Object which contains the file name as the key and its data as the value
     */
    glTFFiles: { [fileName: string]: string | Blob };

    /**
     * Initializes the glTF file object
     */
    public constructor() {
        this.glTFFiles = {};
    }

    /**
     * Downloads the glTF data as files based on their names and data
     */
    public downloadFiles(): void {
        /**
        * Checks for a matching suffix at the end of a string (for ES5 and lower)
        * @param str Source string
        * @param suffix Suffix to search for in the source string
        * @returns Boolean indicating whether the suffix was found (true) or not (false)
        */
        function endsWith(str: string, suffix: string): boolean {
            return str.indexOf(suffix, str.length - suffix.length) !== -1;
        }

        for (let key in this.glTFFiles) {
            let link = document.createElement('a');
            document.body.appendChild(link);
            link.setAttribute("type", "hidden");
            link.download = key;
            let blob = this.glTFFiles[key];
            let mimeType;

            if (endsWith(key, ".glb")) {
                mimeType = { type: "model/gltf-binary" };
            }
            else if (endsWith(key, ".bin")) {
                mimeType = { type: "application/octet-stream" };
            }
            else if (endsWith(key, ".gltf")) {
                mimeType = { type: "model/gltf+json" };
            }
            else if (endsWith(key, ".jpeg") || endsWith(key, ".jpg")) {
                mimeType = { type: ImageMimeType.JPEG };
            }
            else if (endsWith(key, ".png")) {
                mimeType = { type: ImageMimeType.PNG };
            }

            link.href = window.URL.createObjectURL(new Blob([blob], mimeType));
            link.click();
        }
    }
}
