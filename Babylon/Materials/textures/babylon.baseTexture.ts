module BABYLON {
    export class BaseTexture {
        public delayLoadState = 0; //ANY BABYLON.Engine.DELAYLOADSTATE_NONE;
        public hasAlpha = false;
        public level = 1;
        public isCube = false;
        public _texture = null; //ANY
        public onDispose: () => void;

        private _scene; //ANY

        //ANY
        constructor(scene) {
            this._scene = scene;
            this._scene.textures.push(this);
        }

        //ANY
        public getScene() {
            return this._scene;
        }

        //ANY
        public getInternalTexture() {
            return this._texture;
        }

        public isReady(): boolean {
            if (this.delayLoadState === 4) { //ANY BABYLON.Engine.DELAYLOADSTATE_NOTLOADED) {
                return true;
            }

            if (this._texture) {
                return this._texture.isReady;
            }

            return false;
        }

        public getSize(): ISize  {
            if (this._texture._width) {
                return { width: this._texture._width, height: this._texture._height };
            }

            if (this._texture._size) {
                return { width: this._texture._size, height: this._texture._size };
            }

            return { width: 0, height: 0 };
        }

        public getBaseSize(): ISize {
            if (!this.isReady())
                return { width: 0, height: 0 };

            if (this._texture._size) {
                return { width: this._texture._size, height: this._texture._size };
            }

            return { width: this._texture._baseWidth, height: this._texture._baseHeight };
        }

        //ANY
        public _getFromCache(url: string, noMipmap: boolean) {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];

                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    texturesCacheEntry.references++;
                    return texturesCacheEntry;
                }
            }

            return null;
        }

        public delayLoad(): void {
        }

        public releaseInternalTexture(): void {
            if (!this._texture) {
                return;
            }
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            this._texture.references--;

            // Final reference ?
            if (this._texture.references == 0) {
                var index = texturesCache.indexOf(this._texture);
                texturesCache.splice(index, 1);

                this._scene.getEngine()._releaseTexture(this._texture);

                delete this._texture;
            }
        }

        public dispose(): void {
            // Remove from scene
            var index = this._scene.textures.indexOf(this);

            if (index >= 0) {
                this._scene.textures.splice(index, 1);
            }

            if (this._texture === undefined) {
                return;
            }

            this.releaseInternalTexture();


            // Callback
            if (this.onDispose) {
                this.onDispose();
            }
        }
    }
} 