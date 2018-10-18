module BABYLON {
    /**
     * This renderer is helpfull to fill one of the render target with a geometry buffer.
     */
    export class GeometryBufferRenderer {
        /**
         * Constant used to retrieve the position texture index in the G-Buffer textures array
         * using getIndex(GeometryBufferRenderer.POSITION_TEXTURE_INDEX)
         */
        public static readonly POSITION_TEXTURE_TYPE = 1;
        /**
         * Constant used to retrieve the velocity texture index in the G-Buffer textures array
         * using getIndex(GeometryBufferRenderer.VELOCITY_TEXTURE_INDEX)
         */
        public static readonly VELOCITY_TEXTURE_TYPE = 2;

        /**
         * Dictionary used to store the previous transformation matrices of each rendered mesh
         * in order to compute objects velocities when enableVelocity is set to "true"
         * @hidden
         */
        public _previousTransformationMatrices: { [index: number]: Matrix } = { };

        private _scene: Scene;
        private _multiRenderTarget: MultiRenderTarget;
        private _ratio: number;
        private _enablePosition: boolean = false;
        private _enableVelocity: boolean = false;

        private _positionIndex: number = -1;
        private _velocityIndex: number = -1;

        protected _effect: Effect;
        protected _cachedDefines: string;

        /**
         * Set the render list (meshes to be rendered) used in the G buffer.
         */
        public set renderList(meshes: Mesh[]) {
            this._multiRenderTarget.renderList = meshes;
        }

        /**
         * Gets wether or not G buffer are supported by the running hardware.
         * This requires draw buffer supports
         */
        public get isSupported(): boolean {
            return this._multiRenderTarget.isSupported;
        }

        /**
         * Returns the index of the given texture type in the G-Buffer textures array
         * @param textureType The texture type constant. For example GeometryBufferRenderer.POSITION_TEXTURE_INDEX
         * @returns the index of the given texture type in the G-Buffer textures array
         */
        public getTextureIndex(textureType: number): number {
            switch (textureType) {
                case GeometryBufferRenderer.POSITION_TEXTURE_TYPE: return this._positionIndex;
                case GeometryBufferRenderer.VELOCITY_TEXTURE_TYPE: return this._velocityIndex;
                default: return -1;
            }
        }

        /**
         * Gets a boolean indicating if objects positions are enabled for the G buffer.
         */
        public get enablePosition(): boolean {
            return this._enablePosition;
        }

        /**
         * Sets whether or not objects positions are enabled for the G buffer.
         */
        public set enablePosition(enable: boolean) {
            this._enablePosition = enable;
            this.dispose();
            this._createRenderTargets();
        }

        /**
         * Gets a boolean indicating if objects velocities are enabled for the G buffer.
         */
        public get enableVelocity(): boolean {
            return this._enableVelocity;
        }

        /**
         * Sets wether or not objects velocities are enabled for the G buffer.
         */
        public set enableVelocity(enable: boolean) {
            this._enableVelocity = enable;
            this.dispose();
            this._createRenderTargets();
        }

        /**
         * Gets the scene associated with the buffer.
         */
        public get scene(): Scene {
            return this._scene;
        }

        /**
         * Gets the ratio used by the buffer during its creation.
         * How big is the buffer related to the main canvas.
         */
        public get ratio(): number {
            return this._ratio;
        }

        /**
         * Creates a new G Buffer for the scene
         * @param scene The scene the buffer belongs to
         * @param ratio How big is the buffer related to the main canvas.
         */
        constructor(scene: Scene, ratio: number = 1) {
            this._scene = scene;
            this._ratio = ratio;

            // Register the G Buffer component to the scene.
            let component = scene._getComponent(SceneComponentConstants.NAME_GEOMETRYBUFFERRENDERER) as GeometryBufferRendererSceneComponent;
            if (!component) {
                component = new GeometryBufferRendererSceneComponent(scene);
                scene._addComponent(component);
            }

            // Render target
            this._createRenderTargets();
        }

        /**
         * Checks wether everything is ready to render a submesh to the G buffer.
         * @param subMesh the submesh to check readiness for
         * @param useInstances is the mesh drawn using instance or not
         * @returns true if ready otherwise false
         */
        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var material: any = subMesh.getMaterial();

            if (material && material.disableDepthWrite) {
                return false;
            }

            var defines = [];

            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            var mesh = subMesh.getMesh();

            // Alpha test
            if (material && material.needAlphaTesting()) {
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

            // Buffers
            if (this._enablePosition) {
                defines.push("#define POSITION");
                defines.push("#define POSITION_INDEX " + this._positionIndex);
            }

            if (this._enableVelocity) {
                defines.push("#define VELOCITY");
                defines.push("#define VELOCITY_INDEX " + this._velocityIndex);
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

            // Setup textures count
            defines.push("#define RENDER_TARGET_COUNT " + this._multiRenderTarget.textures.length);

            // Get correct effect
            var join = defines.join("\n");
            if (this._cachedDefines !== join) {
                this._cachedDefines = join;
                this._effect = this._scene.getEngine().createEffect("geometry",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "view", "previousWorldViewProjection"],
                    ["diffuseSampler"], join,
                    undefined, undefined, undefined,
                    { buffersCount: this._enablePosition ? 3 : 2 });
            }

            return this._effect.isReady();
        }

        /**
         * Gets the current underlying G Buffer.
         * @returns the buffer
         */
        public getGBuffer(): MultiRenderTarget {
            return this._multiRenderTarget;
        }

        /**
         * Gets the number of samples used to render the buffer (anti aliasing).
         */
        public get samples(): number {
            return this._multiRenderTarget.samples;
        }

        /**
         * Sets the number of samples used to render the buffer (anti aliasing).
         */
        public set samples(value: number) {
            this._multiRenderTarget.samples = value;
        }

        /**
         * Disposes the renderer and frees up associated resources.
         */
        public dispose(): void {
            this.getGBuffer().dispose();
        }

        protected _createRenderTargets(): void {
            var engine = this._scene.getEngine();
            var count = 2;

            if (this._enablePosition) {
                this._positionIndex = count;
                count++;
            }

            if (this._enableVelocity) {
                this._velocityIndex = count;
                count++;
            }

            this._multiRenderTarget = new MultiRenderTarget("gBuffer",
                { width: engine.getRenderWidth() * this._ratio, height: engine.getRenderHeight() * this._ratio }, count, this._scene,
                { generateMipMaps: false, generateDepthTexture: true, defaultType: Engine.TEXTURETYPE_FLOAT });
            if (!this.isSupported) {
                return;
            }
            this._multiRenderTarget.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._multiRenderTarget.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._multiRenderTarget.refreshRate = 1;
            this._multiRenderTarget.renderParticles = false;
            this._multiRenderTarget.renderList = null;

            // set default depth value to 1.0 (far away)
            this._multiRenderTarget.onClearObservable.add((engine: Engine) => {
                engine.clear(new Color4(0.0, 0.0, 0.0, 1.0), true, true, true);
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

                // Velocity
                if (!this._previousTransformationMatrices[mesh.uniqueId]) {
                    this._previousTransformationMatrices[mesh.uniqueId] = Matrix.Identity();
                }

                // Culling
                engine.setState(material.backFaceCulling, 0, false, scene.useRightHandedSystem);

                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);

                if (batch.mustReturn) {
                    return;
                }

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null);

                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, Material.TriangleFillMode);

                    this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
                    this._effect.setMatrix("view", scene.getViewMatrix());

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

                    // Velocity
                    this._effect.setMatrix("previousWorldViewProjection", this._previousTransformationMatrices[mesh.uniqueId]);

                    // Draw
                    mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._effect.setMatrix("world", world));
                }

                // Velocity
                this._previousTransformationMatrices[mesh.uniqueId] = mesh.getWorldMatrix().multiply(this._scene.getTransformMatrix());
            };

            this._multiRenderTarget.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>, transparentSubMeshes: SmartArray<SubMesh>, depthOnlySubMeshes: SmartArray<SubMesh>): void => {
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
    }
}