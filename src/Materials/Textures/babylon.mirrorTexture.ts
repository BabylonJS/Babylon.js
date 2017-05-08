﻿/// <reference path="babylon.renderTargetTexture.ts" />

module BABYLON {
    export class MirrorTexture extends RenderTargetTexture {
        public mirrorPlane = new Plane(0, 1, 0, 1);

        private _transformMatrix = Matrix.Zero();
        private _mirrorMatrix = Matrix.Zero();
        private _savedViewMatrix: Matrix;

        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, type: number = Engine.TEXTURETYPE_UNSIGNED_INT, samplingMode = Texture.BILINEAR_SAMPLINGMODE, generateDepthBuffer = true) {
            super(name, size, scene, generateMipMaps, true, type, false, samplingMode, generateDepthBuffer);

            this.onBeforeRenderObservable.add(() => {
                Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
                this._savedViewMatrix = scene.getViewMatrix();

                this._mirrorMatrix.multiplyToRef(this._savedViewMatrix, this._transformMatrix);

                scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());

                scene.clipPlane = this.mirrorPlane;

                scene.getEngine().cullBackFaces = false;

                scene._mirroredCameraPosition = Vector3.TransformCoordinates(scene.activeCamera.position, this._mirrorMatrix);
            });

            this.onAfterRenderObservable.add(() => {
                scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;

                delete scene.clipPlane;
            });
        }

        public clone(): MirrorTexture {
            var textureSize = this.getSize();
            var newTexture = new MirrorTexture(
                this.name,
                textureSize.width,
                this.getScene(),
                this._renderTargetOptions.generateMipMaps,
                this._renderTargetOptions.type,
                this._renderTargetOptions.samplingMode,
                this._renderTargetOptions.generateDepthBuffer
            );

            // Base texture
            newTexture.hasAlpha = this.hasAlpha;
            newTexture.level = this.level;

            // Mirror Texture
            newTexture.mirrorPlane = this.mirrorPlane.clone();
            newTexture.renderList = this.renderList.slice(0);

            return newTexture;
        }

        public serialize(): any {
            if (!this.name) {
                return null;
            }

            var serializationObject = super.serialize();

            serializationObject.mirrorPlane = this.mirrorPlane.asArray();

            return serializationObject;
        }
    }
} 