﻿module BABYLON {
    export class MirrorTexture extends RenderTargetTexture {
        public mirrorPlane = new BABYLON.Plane(0, 1, 0, 1);

        private _transformMatrix = BABYLON.Matrix.Zero();
        private _mirrorMatrix = BABYLON.Matrix.Zero();
        private _savedViewMatrix: Matrix;

        constructor(name: string, size: number, scene: Scene, generateMipMaps?: boolean) {
            super(name, size, scene, generateMipMaps, true);

            this.onBeforeRender = () => {
                BABYLON.Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
                this._savedViewMatrix = scene.getViewMatrix();

                this._mirrorMatrix.multiplyToRef(this._savedViewMatrix, this._transformMatrix);

                scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());

                scene.clipPlane = this.mirrorPlane;

                scene.getEngine().cullBackFaces = false;
            }

            this.onAfterRender = () => {
                scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;

                delete scene.clipPlane;
            }
        }

        public clone(): MirrorTexture {
            var textureSize = this.getSize();
            var newTexture = new BABYLON.MirrorTexture(this.name, textureSize.width, this.getScene(), this._generateMipMaps);

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // Mirror Texture
            newTexture.mirrorPlane = this.mirrorPlane.clone();
            newTexture.renderList = this.renderList.slice(0);

            return newTexture;
        }
    }
} 