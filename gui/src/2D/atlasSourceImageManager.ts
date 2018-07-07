module BABYLON.GUI {
    /**
     * The class storage all atlas sources loaded
     */
    export class AtlasSourceImageManager {
        private _data: any = {};
        private _sourceImage: any = {};

        constructor() {
        }

        /**
         * Parse data from task loaded
         * @param {BABYLON.JSONAssetTask} task
         */
        public parseData(task: JSONAssetTask) {
            let taskName = task.name;
            let data = task.data;
            Object.keys(data._framesData).forEach((key) => {
                let name = key.substring(0, key.lastIndexOf('.'));
                this._sourceImage[name] = new AtlasSourceImage(name, data._sourceImage, data._framesData[key]);
            });
            this._data[taskName] = this._sourceImage;
        }

        /**
         * Get all atlas sources image.
         * @returns {any}
         */
        public getData() {
            return this._data;
        }
    }
}