module BABYLON {
    export interface Scene {
        /**
         * The list of reflection probes added to the scene
         * @see http://doc.babylonjs.com/how_to/how_to_use_reflection_probes
         */
        reflectionProbes: Array<ReflectionProbe>;
    }

    /**
     * Class used to generate realtime reflection / refraction cube textures
     * @see http://doc.babylonjs.com/how_to/how_to_use_reflection_probes
     */
    export class ReflectionProbe{
        private _scene: Scene;
        private _renderTargetTexture: RenderTargetTexture;
        private _projectionMatrix: Matrix;
        private _viewMatrix = Matrix.Identity();
        private _target = Vector3.Zero();
        private _add = Vector3.Zero();
        private _attachedMesh: AbstractMesh;

        private _invertYAxis = false;

        /** Gets or sets probe position (center of the cube map) */
        public position = Vector3.Zero();

        /**
         * Creates a new reflection probe
         * @param name defines the name of the probe
         * @param size defines the texture resolution (for each face)
         * @param scene defines the hosting scene
         * @param generateMipMaps defines if mip maps should be generated automatically (true by default)
         * @param useFloat defines if HDR data (flaot data) should be used to store colors (false by default)
         */
        constructor(
            /** defines the name of the probe */
            public name: string,
            size: number, scene: Scene, generateMipMaps = true, useFloat = false) {
            this._scene = scene;

            // Create the scene field if not exist.
            if (!this._scene.reflectionProbes) {
                this._scene.reflectionProbes = new Array<ReflectionProbe>();
            }
            this._scene.reflectionProbes.push(this);

            this._renderTargetTexture = new RenderTargetTexture(name, size, scene, generateMipMaps, true, useFloat ? Engine.TEXTURETYPE_FLOAT : Engine.TEXTURETYPE_UNSIGNED_INT, true);

            this._renderTargetTexture.onBeforeRenderObservable.add((faceIndex: number) => {
                switch (faceIndex) {
                    case 0:
                        this._add.copyFromFloats(1, 0, 0);
                        break;
                    case 1:
                        this._add.copyFromFloats(-1, 0, 0);
                        break;
                    case 2:
                        this._add.copyFromFloats(0, this._invertYAxis ? 1 : -1, 0);
                        break;
                    case 3:
                        this._add.copyFromFloats(0, this._invertYAxis ? -1 : 1, 0);
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

        /** Gets or sets the number of samples to use for multi-sampling (0 by default). Required WebGL2 */
        public get samples(): number {
            return this._renderTargetTexture.samples;
        }

        public set samples(value: number) {
            this._renderTargetTexture.samples = value;
        }

        /** Gets or sets the refresh rate to use (on every frame by default) */
        public get refreshRate(): number {
            return this._renderTargetTexture.refreshRate;
        }

        public set refreshRate(value: number) {
            this._renderTargetTexture.refreshRate = value;
        }

        /**
         * Gets the hosting scene
         * @returns a Scene
         */
        public getScene(): Scene {
            return this._scene;
        }

        /** Gets the internal CubeTexture used to render to */
        public get cubeTexture(): RenderTargetTexture {
            return this._renderTargetTexture;
        }

        /** Gets the list of meshes to render */
        public get renderList(): Nullable<AbstractMesh[]> {
            return this._renderTargetTexture.renderList;
        }

        /**
         * Attach the probe to a specific mesh (Rendering will be done from attached mesh's position)
         * @param mesh defines the mesh to attach to
         */
        public attachToMesh(mesh: AbstractMesh): void {
            this._attachedMesh = mesh;
        }

        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        public setRenderingAutoClearDepthStencil(renderingGroupId: number, autoClearDepthStencil: boolean): void {
            this._renderTargetTexture.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
        }

        /**
         * Clean all associated resources
         */
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