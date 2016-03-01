module BABYLON {
    // Inspired by http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
    export class VolumetricLightScatteringPostProcess extends PostProcess {
        // Members
        private _volumetricLightScatteringPass: Effect;
        private _volumetricLightScatteringRTT: RenderTargetTexture;
        private _viewPort: Viewport;
        private _screenCoordinates: Vector2 = Vector2.Zero();
        private _cachedDefines: string;
        private _customMeshPosition: Vector3;

        /**
        * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
        * @type {boolean}
        */
        public useCustomMeshPosition: boolean = false;
        /**
        * If the post-process should inverse the light scattering direction
        * @type {boolean}
        */
        public invert: boolean = true;
        /**
        * The internal mesh used by the post-process
        * @type {boolean}
        */
        public mesh: Mesh;
        /**
        * Set to true to use the diffuseColor instead of the diffuseTexture
        * @type {boolean}
        */
        public useDiffuseColor: boolean = false;

        /**
        * Array containing the excluded meshes not rendered in the internal pass
        */
        public excludedMeshes = new Array<AbstractMesh>();

        /**
        * Controls the overall intensity of the post-process
        * @type {number}
        */
        public exposure = 0.3;
        /**
        * Dissipates each sample's contribution in range [0, 1]
        * @type {number}
        */
        public decay = 0.96815;
        /**
        * Controls the overall intensity of each sample
        * @type {number}
        */
        public weight = 0.58767;
        /**
        * Controls the density of each sample
        * @type {number}
        */
        public density = 0.926;

        /**
         * @constructor
         * @param {string} name - The post-process name
         * @param {any} ratio - The size of the post-process and/or internal pass (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera} camera - The camera that the post-process will be attached to
         * @param {BABYLON.Mesh} mesh - The mesh used to create the light scattering
         * @param {number} samples - The post-process quality, default 100
         * @param {number} samplingMode - The post-process filtering mode
         * @param {BABYLON.Engine} engine - The babylon engine
         * @param {boolean} reusable - If the post-process is reusable
         * @param {BABYLON.Scene} scene - The constructor needs a scene reference to initialize internal components. If "camera" is null (RenderPipelineà, "scene" must be provided
         */
        constructor(name: string, ratio: any, camera: Camera, mesh?: Mesh, samples: number = 100, samplingMode: number = Texture.BILINEAR_SAMPLINGMODE, engine?: Engine, reusable?: boolean, scene?: Scene) {
            super(name, "volumetricLightScattering", ["decay", "exposure", "weight", "meshPositionOnScreen", "density"], ["lightScatteringSampler"], ratio.postProcessRatio || ratio, camera, samplingMode, engine, reusable, "#define NUM_SAMPLES " + samples);
            scene = (camera === null) ? scene : camera.getScene(); // parameter "scene" can be null.

            this._viewPort = new Viewport(0, 0, 1, 1).toGlobal(scene.getEngine());

            // Configure mesh
            this.mesh = (mesh !== null) ? mesh : VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene);

            // Configure
            this._createPass(scene, ratio.passRatio || ratio);

            this.onActivate = (camera: Camera) => {
                if (!this.isSupported) {
                    this.dispose(camera);
                }

                this.onActivate = null;
            };

            this.onApply = (effect: Effect) => {
                this._updateMeshScreenCoordinates(scene);

                effect.setTexture("lightScatteringSampler", this._volumetricLightScatteringRTT);
                effect.setFloat("exposure", this.exposure);
                effect.setFloat("decay", this.decay);
                effect.setFloat("weight", this.weight);
                effect.setFloat("density", this.density);
                effect.setVector2("meshPositionOnScreen", this._screenCoordinates);
            };
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var mesh = subMesh.getMesh();

            var defines = [];
            var attribs = [VertexBuffer.PositionKind];
            var material: any = subMesh.getMaterial();
            var needUV: boolean = false;

            // Render this.mesh as default
            if (mesh === this.mesh) {
                if (this.useDiffuseColor) {
                    defines.push("#define DIFFUSE_COLOR_RENDER");
                }
                else if (material) {
                    if (material.diffuseTexture !== undefined) {
                        defines.push("#define BASIC_RENDER");
                    } else {
                        defines.push("#define DIFFUSE_COLOR_RENDER");
                    }
                }
                defines.push("#define NEED_UV");
                needUV = true;
            }

            // Alpha test
            if (material) {
                if (material.needAlphaTesting()) {
                    defines.push("#define ALPHATEST");
                }

                if (material.opacityTexture !== undefined) {
                    defines.push("#define OPACITY");
                    if (material.opacityTexture.getAlphaFromRGB) {
                        defines.push("#define OPACITYRGB");
                    }
                    if (!needUV) {
                        defines.push("#define NEED_UV");
                    }
                }

                if (mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    attribs.push(VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(VertexBuffer.UV2Kind)) {
                    attribs.push(VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
            } else {
                defines.push("#define NUM_BONE_INFLUENCERS 0"); 
            }
            

            // Instances
            if (useInstances) {
                defines.push("#define INSTANCES");
                attribs.push("world0");
                attribs.push("world1");
                attribs.push("world2");
                attribs.push("world3");
            }

            // Get correct effect      
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._volumetricLightScatteringPass = mesh.getScene().getEngine().createEffect(
                    { vertexElement: "depth", fragmentElement: "volumetricLightScatteringPass" },
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "opacityLevel", "color"],
                    ["diffuseSampler", "opacitySampler"], join);
            }

            return this._volumetricLightScatteringPass.isReady();
        }

        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        public setCustomMeshPosition(position: Vector3): void {
            this._customMeshPosition = position;
        }

        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        public getCustomMeshPosition(): Vector3 {
            return this._customMeshPosition;
        }

        /**
         * Disposes the internal assets and detaches the post-process from the camera
         */
        public dispose(camera: Camera): void {
            var rttIndex = camera.getScene().customRenderTargets.indexOf(this._volumetricLightScatteringRTT);
            if (rttIndex !== -1) {
                camera.getScene().customRenderTargets.splice(rttIndex, 1);
            }
                
            this._volumetricLightScatteringRTT.dispose();
            super.dispose(camera);
        }

        /**
         * Returns the render target texture used by the post-process
         * @return {BABYLON.RenderTargetTexture} The render target texture used by the post-process
         */
        public getPass(): RenderTargetTexture {
            return this._volumetricLightScatteringRTT;
        }

        // Private methods
        private _meshExcluded(mesh: AbstractMesh) {
            if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
                return true;
            }

            return false;
        }

        private _createPass(scene: Scene, ratio: number): void {
            var engine = scene.getEngine();

            this._volumetricLightScatteringRTT = new RenderTargetTexture("volumetricLightScatteringMap", { width: engine.getRenderWidth() * ratio, height: engine.getRenderHeight() * ratio }, scene, false, true, Engine.TEXTURETYPE_UNSIGNED_INT);
            this._volumetricLightScatteringRTT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._volumetricLightScatteringRTT.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._volumetricLightScatteringRTT.renderList = null;
            this._volumetricLightScatteringRTT.renderParticles = false;
            scene.customRenderTargets.push(this._volumetricLightScatteringRTT);

            // Custom render function for submeshes
            var renderSubMesh = (subMesh: SubMesh): void => {
                var mesh = subMesh.getRenderingMesh();
                if (this._meshExcluded(mesh)) {
                    return;
                }

                var scene = mesh.getScene();
                var engine = scene.getEngine();

                // Culling
                engine.setState(subMesh.getMaterial().backFaceCulling);

                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);

                if (batch.mustReturn) {
                    return;
                }

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);

                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._volumetricLightScatteringPass);
                    mesh._bind(subMesh, this._volumetricLightScatteringPass, Material.TriangleFillMode);
                    var material: any = subMesh.getMaterial();

                    this._volumetricLightScatteringPass.setMatrix("viewProjection", scene.getTransformMatrix());

                    // Alpha test
                    if (material && (mesh === this.mesh || material.needAlphaTesting() || material.opacityTexture !== undefined)) {
                        var alphaTexture = material.getAlphaTestTexture();

                        if ((this.useDiffuseColor || alphaTexture === undefined) && mesh === this.mesh) {
                            this._volumetricLightScatteringPass.setColor3("color", material.diffuseColor);
                        }
                        if (material.needAlphaTesting() || (mesh === this.mesh && alphaTexture && !this.useDiffuseColor)) {
                            this._volumetricLightScatteringPass.setTexture("diffuseSampler", alphaTexture);
                            if (alphaTexture) {
                                this._volumetricLightScatteringPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                            }
                        }

                        if (material.opacityTexture !== undefined) {
                            this._volumetricLightScatteringPass.setTexture("opacitySampler", material.opacityTexture);
                            this._volumetricLightScatteringPass.setFloat("opacityLevel", material.opacityTexture.level);
                        }
                    }

                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders) {
                        this._volumetricLightScatteringPass.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._volumetricLightScatteringPass, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._volumetricLightScatteringPass.setMatrix("world", world));
                }
            };

            // Render target texture callbacks
            var savedSceneClearColor: Color4;
            var sceneClearColor = new Color4(0.0, 0.0, 0.0, 1.0);

            this._volumetricLightScatteringRTT.onBeforeRender = (): void => {
                savedSceneClearColor = scene.clearColor;
                scene.clearColor = sceneClearColor;
            };

            this._volumetricLightScatteringRTT.onAfterRender = (): void => {
                scene.clearColor = savedSceneClearColor;
            };
            
            this._volumetricLightScatteringRTT.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>): void => {
                var engine = scene.getEngine();
                var index: number;

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                engine.setAlphaTesting(true);
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
                engine.setAlphaTesting(false);

                if (transparentSubMeshes.length) {
                    // Sort sub meshes
                    for (index = 0; index < transparentSubMeshes.length; index++) {
                        var submesh = transparentSubMeshes.data[index];
                        submesh._alphaIndex = submesh.getMesh().alphaIndex;
                        submesh._distanceToCamera = submesh.getBoundingInfo().boundingSphere.centerWorld.subtract(scene.activeCamera.position).length();
                    }

                    var sortedArray = transparentSubMeshes.data.slice(0, transparentSubMeshes.length);
                    sortedArray.sort((a, b) => {
                        // Alpha index first
                        if (a._alphaIndex > b._alphaIndex) {
                            return 1;
                        }
                        if (a._alphaIndex < b._alphaIndex) {
                            return -1;
                        }

                        // Then distance to camera
                        if (a._distanceToCamera < b._distanceToCamera) {
                            return 1;
                        }
                        if (a._distanceToCamera > b._distanceToCamera) {
                            return -1;
                        }

                        return 0;
                    });

                    // Render sub meshes
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_COMBINE);
                    for (index = 0; index < sortedArray.length; index++) {
                        renderSubMesh(sortedArray[index]);
                    }
                    engine.setAlphaMode(BABYLON.Engine.ALPHA_DISABLE);
                }
            };
        }

        private _updateMeshScreenCoordinates(scene: Scene): void {
            var transform = scene.getTransformMatrix();
            var meshPosition = this.mesh.parent ? this.mesh.getAbsolutePosition() : this.mesh.position;
            var pos = Vector3.Project(this.useCustomMeshPosition ? this._customMeshPosition : meshPosition, Matrix.Identity(), transform, this._viewPort);

            this._screenCoordinates.x = pos.x / this._viewPort.width;
            this._screenCoordinates.y = pos.y / this._viewPort.height;

            if (this.invert)
                this._screenCoordinates.y = 1.0 - this._screenCoordinates.y;
        }

        // Static methods
        /**
        * Creates a default mesh for the Volumeric Light Scattering post-process
        * @param {string} The mesh name
        * @param {BABYLON.Scene} The scene where to create the mesh
        * @return {BABYLON.Mesh} the default mesh
        */
        public static CreateDefaultMesh(name: string, scene: Scene): Mesh {
            var mesh = Mesh.CreatePlane(name, 1, scene);
            mesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
            mesh.material = new StandardMaterial(name + "Material", scene);
            return mesh;
        }
    }
}  