﻿module BABYLON {
    export class BaseTexture {
        public name: string;
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;
        public hasAlpha = false;
        public getAlphaFromRGB = false;
        public level = 1;
        public isCube = false;
        public isRenderTarget = false;
        public animations = new Array<Animation>();
        public onDispose: () => void;
        public coordinatesIndex = 0;
        public coordinatesMode = Texture.EXPLICIT_MODE;
        public wrapU = Texture.WRAP_ADDRESSMODE;
        public wrapV = Texture.WRAP_ADDRESSMODE;
        public anisotropicFilteringLevel = 4;
        public _cachedAnisotropicFilteringLevel: number;

        private _scene: Scene;
        public _texture: WebGLTexture;

        constructor(scene: Scene) {
            this._scene = scene;
            this._scene.textures.push(this);
        }

        public getScene(): Scene {
            return this._scene;
        }

        public getTextureMatrix(): Matrix {
            return null;
        }

        public getReflectionTextureMatrix(): Matrix {
            return null;
        }

        public getInternalTexture(): WebGLTexture {
            return this._texture;
        }

        public isReady(): boolean {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) {
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

        public scale(ratio: number): void {
        }

        public get canRescale(): boolean {
            return false;
        }

        public _removeFromCache(url: string, noMipmap: boolean): void {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];

                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    texturesCache.splice(index, 1);
                    return;
                }
            }
        }

        public _getFromCache(url: string, noMipmap: boolean, sampling?: number): WebGLTexture {
            var texturesCache = this._scene.getEngine().getLoadedTexturesCache();
            for (var index = 0; index < texturesCache.length; index++) {
                var texturesCacheEntry = texturesCache[index];

                if (texturesCacheEntry.url === url && texturesCacheEntry.noMipmap === noMipmap) {
                    if (!sampling || sampling === texturesCacheEntry.samplingMode) {
                        texturesCacheEntry.references++;
                        return texturesCacheEntry;
                    }
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
            if (this._texture.references === 0) {
                var index = texturesCache.indexOf(this._texture);
                texturesCache.splice(index, 1);

                this._scene.getEngine()._releaseTexture(this._texture);

                delete this._texture;
            }
        }

        public clone(): BaseTexture {
            return null;
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