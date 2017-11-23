﻿module BABYLON {
    export class ReflectionProbe{  
        private _scene: Scene;
        private _renderTargetTexture: RenderTargetTexture;
        private _projectionMatrix: Matrix;
        private _viewMatrix = Matrix.Identity();
        private _target = Vector3.Zero();
        private _add = Vector3.Zero();
        private _attachedMesh: AbstractMesh;

        public invertYAxis = false;
        public position = Vector3.Zero();
          
        constructor(public name: string, size: number, scene: Scene, generateMipMaps = true) {
            this._scene = scene;

            this._scene.reflectionProbes.push(this);

            this._renderTargetTexture = new RenderTargetTexture(name, size, scene, generateMipMaps, true, Engine.TEXTURETYPE_UNSIGNED_INT, true);

            this._renderTargetTexture.onBeforeRenderObservable.add((faceIndex: number) => {
                switch (faceIndex) {
                    case 0:
                        this._add.copyFromFloats(1, 0, 0);
                        break;
                    case 1:
                        this._add.copyFromFloats(-1, 0, 0);
                        break;
                    case 2:
                        this._add.copyFromFloats(0, this.invertYAxis ? 1 : -1, 0);
                        break;
                    case 3:
                        this._add.copyFromFloats(0, this.invertYAxis ? -1 : 1, 0);
                        break;
                    case 4:
                        this._add.copyFromFloats(0, 0, 1);
                        break;
                    case 5:
                        this._add.copyFromFloats(0, 0, -1);
                        break;

                }

                if (this._attachedMesh) {
                    this.position.copyFrom(this._attachedMesh.getAbsolutePosition());
                }

                this.position.addToRef(this._add, this._target);

                Matrix.LookAtLHToRef(this.position, this._target, Vector3.Up(), this._viewMatrix);

                scene.setTransformMatrix(this._viewMatrix, this._projectionMatrix);

                scene._forcedViewPosition = this.position;
            });

            this._renderTargetTexture.onAfterUnbindObservable.add(() => {
                scene._forcedViewPosition = null;
                scene.updateTransformMatrix(true);
            });

            if (scene.activeCamera) {
                this._projectionMatrix = Matrix.PerspectiveFovLH(Math.PI / 2, 1, scene.activeCamera.minZ, scene.activeCamera.maxZ);
            }
        }

        public get samples(): number {
            return this._renderTargetTexture.samples;
        }

        public set samples(value: number) {
            this._renderTargetTexture.samples = value;
        }

        public get refreshRate(): number {
            return this._renderTargetTexture.refreshRate;
        }

        public set refreshRate(value: number) {
            this._renderTargetTexture.refreshRate = value;
        }

        public getScene(): Scene {
            return this._scene;
        }

        public get cubeTexture(): RenderTargetTexture {
            return this._renderTargetTexture;
        }

        public get renderList(): Nullable<AbstractMesh[]> {
            return this._renderTargetTexture.renderList;
        }

        public attachToMesh(mesh: AbstractMesh): void {
            this._attachedMesh = mesh;
        }
        
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         * 
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {
            this._renderTargetTexture.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
        }

        public dispose() {
            var index = this._scene.reflectionProbes.indexOf(this);

            if (index !== -1) {
                // Remove from the scene if found 
                this._scene.reflectionProbes.splice(index, 1);
            }            

            if (this._renderTargetTexture) {
                this._renderTargetTexture.dispose();
                (<any>this._renderTargetTexture) = null;
            }
        }
    }    
}