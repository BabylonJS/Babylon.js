﻿/// <reference path="babylon.renderTargetTexture.ts" />

module BABYLON {
    export class MirrorTexture extends RenderTargetTexture {
        public mirrorPlane = new Plane(0, 1, 0, 1);

        private _transformMatrix = Matrix.Zero();
        private _mirrorMatrix = Matrix.Zero();
        private _savedViewMatrix: Matrix;

        private _blurX: BlurPostProcess;
        private _blurY: BlurPostProcess;
        private _blurKernelX = 0;
        private _blurKernelY = 0;
        private _blurRatio = 1.0;

        public set blurRatio(value: number) {
            if (this._blurRatio === value) {
                return;
            }

            this._blurRatio = value;
            this._preparePostProcesses();
        }

        public get blurRatio(): number {
            return this._blurRatio;
        }

        public set blurKernel(value: number) {
            this.blurKernelX = value;
            this.blurKernelY = value;
        }        

        public set blurKernelX(value: number) {
            if (this._blurKernelX === value) {
                return;
            }

            this._blurKernelX = value;
            this._preparePostProcesses();
        }

        public get blurKernelX(): number {
            return this._blurKernelX;
        }        

        public set blurKernelY(value: number) {
            if (this._blurKernelY === value) {
                return;
            }

            this._blurKernelY = value;
            this._preparePostProcesses();
        }

        public get blurKernelY(): number {
            return this._blurKernelY;
        }             

        constructor(name: string, size: any, scene: Scene, generateMipMaps?: boolean, type: number = Engine.TEXTURETYPE_UNSIGNED_INT, samplingMode = Texture.BILINEAR_SAMPLINGMODE, generateDepthBuffer = true) {
            super(name, size, scene, generateMipMaps, true, type, false, samplingMode, generateDepthBuffer);

            this.ignoreCameraViewport = true;

            this.onBeforeRenderObservable.add(() => {
                Matrix.ReflectionToRef(this.mirrorPlane, this._mirrorMatrix);
                this._savedViewMatrix = scene.getViewMatrix();

                this._mirrorMatrix.multiplyToRef(this._savedViewMatrix, this._transformMatrix);

                scene.setTransformMatrix(this._transformMatrix, scene.getProjectionMatrix());

                scene.clipPlane = this.mirrorPlane;

                scene.getEngine().cullBackFaces = false;

                scene._mirroredCameraPosition = Vector3.TransformCoordinates(scene.activeCamera.globalPosition, this._mirrorMatrix);
            });

            this.onAfterRenderObservable.add(() => {
                scene.setTransformMatrix(this._savedViewMatrix, scene.getProjectionMatrix());
                scene.getEngine().cullBackFaces = true;
                scene._mirroredCameraPosition = null;

                delete scene.clipPlane;
            });
        }     

        private _preparePostProcesses(): void {
            this.clearPostProcesses(true);

            if (this._blurKernelX && this._blurKernelY) {
                var engine = this.getScene().getEngine();

                var textureType = engine.getCaps().textureFloatRender ? Engine.TEXTURETYPE_FLOAT : Engine.TEXTURETYPE_HALF_FLOAT;

                this._blurX = new BABYLON.BlurPostProcess("horizontal blur", new BABYLON.Vector2(1.0, 0), this._blurKernelX, this._blurRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
                this._blurX.autoClear = false;

                if (this._blurRatio === 1 && this.samples < 2) {
                    this._blurX.outputTexture = this._texture;
                } else {
                    this._blurX.alwaysForcePOT = true;
                }

                this._blurY = new BABYLON.BlurPostProcess("vertical blur", new BABYLON.Vector2(0, 1.0), this._blurKernelY, this._blurRatio, null, BABYLON.Texture.BILINEAR_SAMPLINGMODE, engine, false, textureType);
                this._blurY.autoClear = false;
                this._blurY.alwaysForcePOT = this._blurRatio !== 1;

                this.addPostProcess(this._blurX);
                this.addPostProcess(this._blurY);   
            }
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