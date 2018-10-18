module BABYLON {
    /**
     * This represents a depth renderer in Babylon.
     * A depth renderer will render to it's depth map every frame which can be displayed or used in post processing
     */
    export class DepthRenderer {
        private _scene: Scene;
        private _depthMap: RenderTargetTexture;
        private _effect: Effect;

        private _cachedDefines: string;
        private _camera: Nullable<Camera>;

        /**
         * Specifiess that the depth renderer will only be used within
         * the camera it is created for.
         * This can help forcing its rendering during the camera processing.
         */
        public useOnlyInActiveCamera: boolean = false;

        /**
         * Instantiates a depth renderer
         * @param scene The scene the renderer belongs to
         * @param type The texture type of the depth map (default: Engine.TEXTURETYPE_FLOAT)
         * @param camera The camera to be used to render the depth map (default: scene's active camera)
         */
        constructor(scene: Scene, type: number = Engine.TEXTURETYPE_FLOAT, camera: Nullable<Camera> = null) {
            this._scene = scene;
            // Register the G Buffer component to the scene.
            let component = scene._getComponent(SceneComponentConstants.NAME_DEPTHRENDERER) as DepthRendererSceneComponent;
            if (!component) {
                component = new DepthRendererSceneComponent(scene);
                scene._addComponent(component);
            }

            this._camera = camera;
            var engine = scene.getEngine();

            // Render target
            this._depthMap = new RenderTargetTexture("depthMap", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, this._scene, false, true, type);
            this._depthMap.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._depthMap.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._depthMap.refreshRate = 1;
            this._depthMap.renderParticles = false;
            this._depthMap.renderList = null;

            // Camera to get depth map from to support multiple concurrent cameras
            this._depthMap.activeCamera = this._camera;
            this._depthMap.ignoreCameraViewport = true;
            this._depthMap.useCameraPostProcesses = false;

            // set default depth value to 1.0 (far away)
            this._depthMap.onClearObservable.add((engine: Engine) => {
                engine.clear(new Color4(1.0, 1.0, 1.0, 1.0), true, true, true);
            });

            // Custom render function
            var renderSubMesh = (subMesh: SubMesh): void => {
                var mesh = subMesh.getRenderingMesh();
                var scene = this._scene;
                var engine = scene.getEngine();
                let material = subMesh.getMaterial();

                if (!material) {
                    return;
                }

                // Culling and reverse (right handed system)
                engine.setState(material.backFaceCulling, 0, false, scene.useRightHandedSystem);

                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);

                if (batch.mustReturn) {
                    return;
                }

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);

                var camera = this._camera || scene.activeCamera;
                if (this.isReady(subMesh, hardwareInstancedRendering) && camera) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

                    this._effect.setMatrix("viewProjection", scene.getTransformMatrix());

                    this._effect.setFloat2("depthValues", camera.minZ, camera.minZ + camera.maxZ);

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();

                        if (alphaTexture) {
                            this._effect.setTexture("diffuseSampler", alphaTexture);
                            this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                    }

                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders && mesh.skeleton) {
                        this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._effect.setMatrix("world", world));
                }
            };

            this._depthMap.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
                var index;

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

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
            };
        }

        /**
         * Creates the depth rendering effect and checks if the effect is ready.
         * @param subMesh The submesh to be used to render the depth map of
         * @param useInstances If multiple world instances should be used
         * @returns if the depth renderer is ready to render the depth map
         */
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var material: any = subMesh.getMaterial();
            if (material.disableDepthWrite) {
                return false;
            }

            var defines = [];

            var attribs = [VertexBuffer.PositionKind];

            var mesh = subMesh.getMesh();

            // Alpha test
            if (material && material.needAlphaTesting() && material.getAlphaTestTexture()) {
                defines.push("#define ALPHATEST");
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
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton ? mesh.skeleton.bones.length + 1 : 0));
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
                this._effect = this._scene.getEngine().createEffect("depth",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "depthValues"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }

        /**
         * Gets the texture which the depth map will be written to.
         * @returns The depth map texture
         */
        public getDepthMap(): RenderTargetTexture {
            return this._depthMap;
        }

        /**
         * Disposes of the depth renderer.
         */
        public dispose(): void {
            this._depthMap.dispose();
        }
    }
}