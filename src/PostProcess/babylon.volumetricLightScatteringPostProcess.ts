module BABYLON {
    // Inspired by http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
    export class VolumetricLightScatteringPostProcess extends PostProcess {
        // Members
        private _volumetricLightScatteringPass: Effect;
        private _volumetricLightScatteringRTT: RenderTargetTexture;
        private _viewPort: Viewport;
        private _screenCoordinates: Vector2 = Vector2.Zero();
        private _cachedDefines: string;

        /**
        * If not undefined, the mesh position is computed from the attached node position
        * @type {{position: Vector3}}
        */
        public attachedNode: { position: Vector3 };

        /**
        * Custom position of the mesh. Used if "useCustomMeshPosition" is set to "true"
        * @type {Vector3}
        */
        @serializeAsVector3()
        public customMeshPosition: Vector3 = Vector3.Zero();

        /**
        * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
        * @type {boolean}
        */
        @serialize()
        public useCustomMeshPosition: boolean = false;

        /**
        * If the post-process should inverse the light scattering direction
        * @type {boolean}
        */
        @serialize()
        public invert: boolean = true;

        /**
        * The internal mesh used by the post-process
        * @type {boolean}
        */
        @serializeAsMeshReference()
        public mesh: Mesh;

        
        public get useDiffuseColor(): boolean {
            Tools.Warn("VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead");
            return false;
        }

        public set useDiffuseColor(useDiffuseColor: boolean) {
            Tools.Warn("VolumetricLightScatteringPostProcess.useDiffuseColor is no longer used, use the mesh material directly instead");
        }

        /**
        * Array containing the excluded meshes not rendered in the internal pass
        */
        @serialize()
        public excludedMeshes = new Array<AbstractMesh>();

        /**
        * Controls the overall intensity of the post-process
        * @type {number}
        */
        @serialize()
        public exposure = 0.3;

        /**
        * Dissipates each sample's contribution in range [0, 1]
        * @type {number}
        */
        @serialize()
        public decay = 0.96815;

        /**
        * Controls the overall intensity of each sample
        * @type {number}
        */
        @serialize()
        public weight = 0.58767;

        /**
        * Controls the density of each sample
        * @type {number}
        */
        @serialize()
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

            var engine = scene.getEngine();
            this._viewPort = new Viewport(0, 0, 1, 1).toGlobal(engine.getRenderWidth(), engine.getRenderHeight());

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

            this.onApplyObservable.add((effect: Effect) => {
                this._updateMeshScreenCoordinates(scene);

                effect.setTexture("lightScatteringSampler", this._volumetricLightScatteringRTT);
                effect.setFloat("exposure", this.exposure);
                effect.setFloat("decay", this.decay);
                effect.setFloat("weight", this.weight);
                effect.setFloat("density", this.density);
                effect.setVector2("meshPositionOnScreen", this._screenCoordinates);
            });
        }

        public getClassName(): string {
            return "VolumetricLightScatteringPostProcess";
        }          

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var mesh = subMesh.getMesh();

            // Render this.mesh as default
            if (mesh === this.mesh) {
                return mesh.material.isReady(mesh);
            }

            var defines = [];
            var attribs = [VertexBuffer.PositionKind];
            var material: any = subMesh.getMaterial();

            // Alpha test
            if (material) {
                if (material.needAlphaTesting()) {
                    defines.push("#define ALPHATEST");
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
                    ["world", "mBones", "viewProjection", "diffuseMatrix"],
                    ["diffuseSampler"], join);
            }

            return this._volumetricLightScatteringPass.isReady();
        }

        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        public setCustomMeshPosition(position: Vector3): void {
            this.customMeshPosition = position;
        }

        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        public getCustomMeshPosition(): Vector3 {
            return this.customMeshPosition;
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

            var camera = this.getCamera();
            if (camera) {
                camera.customRenderTargets.push(this._volumetricLightScatteringRTT);
            } else {
                scene.customRenderTargets.push(this._volumetricLightScatteringRTT);
            }

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

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);
                
                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    var effect: Effect = this._volumetricLightScatteringPass;
                    if (mesh === this.mesh) {
                        if (subMesh.effect) {
                            effect = subMesh.effect;
                        } else {
                            effect = subMesh.getMaterial().getEffect();
                        }
                    }

                    engine.enableEffect(effect);
                    mesh._bind(subMesh, effect, Material.TriangleFillMode);

                    if (mesh === this.mesh) {
                        subMesh.getMaterial().bind(mesh.getWorldMatrix(), mesh);
                    }
                    else {
                        var material: any = subMesh.getMaterial();

                        this._volumetricLightScatteringPass.setMatrix("viewProjection", scene.getTransformMatrix());

                        // Alpha test
                        if (material && material.needAlphaTesting()) {
                            var alphaTexture = material.getAlphaTestTexture();
                            
                            this._volumetricLightScatteringPass.setTexture("diffuseSampler", alphaTexture);

                            if (alphaTexture) {
                                this._volumetricLightScatteringPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                            }
                        }

                        // Bones
                        if (mesh.useBones && mesh.computeBonesUsingShaders) {
                            this._volumetricLightScatteringPass.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                        }
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._volumetricLightScatteringPass, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => effect.setMatrix("world", world));
                }
            };

            // Render target texture callbacks
            var savedSceneClearColor: Color4;
            var sceneClearColor = new Color4(0.0, 0.0, 0.0, 1.0);

            this._volumetricLightScatteringRTT.onBeforeRenderObservable.add((): void => {
                savedSceneClearColor = scene.clearColor;
                scene.clearColor = sceneClearColor;
            });

            this._volumetricLightScatteringRTT.onAfterRenderObservable.add((): void => {
                scene.clearColor = savedSceneClearColor;
            });
            
            this._volumetricLightScatteringRTT.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
                var engine = scene.getEngine();
                var index: number;
                
                if (depthOnlySubMeshes.length) {
                    engine.setColorWrite(false);            
                    for (index = 0; index < depthOnlySubMeshes.length; index++) {
                        renderSubMesh(depthOnlySubMeshes.data[index]);
                    }
                    engine.setColorWrite(true);
                }                   

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
            var meshPosition: Vector3;

            if (this.useCustomMeshPosition) {
                meshPosition = this.customMeshPosition;
            }
            else if (this.attachedNode) {
                meshPosition = this.attachedNode.position;
            }
            else {
                meshPosition = this.mesh.parent ? this.mesh.getAbsolutePosition() : this.mesh.position;
            }

            var pos = Vector3.Project(meshPosition, Matrix.Identity(), transform, this._viewPort);

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

            var material = new StandardMaterial(name + "Material", scene);
            material.emissiveColor = new Color3(1, 1, 1);

            mesh.material = material;

            return mesh;
        }
    }
}  