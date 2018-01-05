module BABYLON {
    /**
     * Class for holding and downloading glTF file data
     */
    export class _GLTFData {
        _glTFFiles: { [fileName: string]: string | Blob };

        public constructor() {
            this._glTFFiles = {};
        }
        /**
         * Downloads glTF data.
         */
        public downloadFiles(): void {
            /**
            * Checks for a matching suffix at the end of a string (for ES5 and lower)
            * @param str 
            * @param suffix 
            * 
            * @returns {boolean} indicating whether the suffix matches or not
            */
            function endsWith(str: string, suffix: string): boolean {
                return str.indexOf(suffix, str.length - suffix.length) !== -1;
            }
            for (let key in this._glTFFiles) {
                let link = document.createElement('a');
                document.body.appendChild(link);
                link.setAttribute("type", "hidden");
                link.download = key;
                let blob = this._glTFFiles[key];
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

                link.href = window.URL.createObjectURL(new Blob([blob], mimeType));
                link.click();
            }

        }
    }
}
