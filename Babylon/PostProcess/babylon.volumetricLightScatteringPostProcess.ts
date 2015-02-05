module BABYLON {
    export class VolumetricLightScatteringPostProcess extends PostProcess {
        // Members
        private _godRaysPass: Effect;
        private _godRaysRTT: RenderTargetTexture;
        private _viewPort: Viewport;
        private _screenCoordinates: Vector2 = Vector2.Zero();
        private _cachedDefines: string;
        private _customLightPosition: Vector3;

        /**
        * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
        * @type {boolean}
        */
        public useCustomLightPosition: boolean = false;
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
         * @constructor
         * @param {string} name - The post-process name
         * @param {number} ratio - The size of the postprocesses (0.5 means that your postprocess will have a width = canvas.width 0.5 and a height = canvas.height 0.5)
         * @param {BABYLON.Camera} camera - The camera that the post-process will be attached to
         * @param {BABYLON.Mesh} mesh - The mesh used to create the light scattering
         * @param {number} samplingMode - The post-process filtering mode
         * @param {BABYLON.Engine} engine - The babylon engine
         * @param {boolean} reusable - If the post-process is reusable
         */
        constructor(name: string, ratio: number, camera: Camera, mesh?: Mesh, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "volumetricLightScattering", ["lightPositionOnScreen"], ["lightScatteringSampler"], ratio, camera, samplingMode, engine, reusable);
            var scene = camera.getScene();

            this._viewPort = new Viewport(0, 0, 1, 1).toGlobal(scene.getEngine());

            // Configure mesh
            this.mesh = (mesh !== null) ? mesh : VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene);

            // Configure
            this._createPass(scene);

            this.onApply = (effect: Effect) => {
                this._updateScreenCoordinates(scene);

                effect.setTexture("lightScatteringSampler", this._godRaysRTT);
                effect.setVector2("lightPositionOnScreen", this._screenCoordinates);
            };
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var mesh = subMesh.getMesh();
            var scene = mesh.getScene();

            var defines = [];
            var attribs = [VertexBuffer.PositionKind];
            var material = subMesh.getMaterial();

            // Render this.mesh as default
            if (mesh === this.mesh)
                defines.push("#define BASIC_RENDER");

            // Alpha test
            if (material) {
                if (material.needAlphaTesting() || mesh === this.mesh)
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
            if (mesh.useBones) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                defines.push("#define BONES");
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
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
                this._godRaysPass = mesh.getScene().getEngine().createEffect(
                    { vertexElement: "depth", fragmentElement: "volumetricLightScatteringPass" },
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "far"],
                    ["diffuseSampler"], join);
            }

            return this._godRaysPass.isReady();
        }

        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        public setLightPosition(position: Vector3): void {
            this._customLightPosition = position;
        }

        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        public getLightPosition(): Vector3 {
            return this._customLightPosition;
        }

        /**
         * Disposes the internal assets and detaches the post-process from the camera
         */
        public dispose(camera: Camera): void {
            this._godRaysRTT.dispose();
            super.dispose(camera);
        }

        /**
         * Returns the render target texture used by the post-process
         * @return {BABYLON.RenderTargetTexture} The render target texture used by the post-process
         */
        public getPass(): RenderTargetTexture {
            return this._godRaysRTT;
        }

        // Private methods
        private _createPass(scene: Scene): void {
            var engine = scene.getEngine();

            this._godRaysRTT = new RenderTargetTexture("volumetricLightScatteringMap", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, scene, false, true, Engine.TEXTURETYPE_UNSIGNED_INT);
            this._godRaysRTT.wrapU = Texture.CLAMP_ADDRESSMODE;
            this._godRaysRTT.wrapV = Texture.CLAMP_ADDRESSMODE;
            this._godRaysRTT.renderList = null;
            this._godRaysRTT.renderParticles = false;
            scene.customRenderTargets.push(this._godRaysRTT);

            // Custom render function for submeshes
            var renderSubMesh = (subMesh: SubMesh): void => {
                var mesh = subMesh.getRenderingMesh();
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
                    engine.enableEffect(this._godRaysPass);
                    mesh._bind(subMesh, this._godRaysPass, Material.TriangleFillMode);
                    var material = subMesh.getMaterial();

                    this._godRaysPass.setMatrix("viewProjection", scene.getTransformMatrix());

                    // Alpha test
                    if (material && (mesh === this.mesh || material.needAlphaTesting())) {
                        var alphaTexture = material.getAlphaTestTexture();
                        this._godRaysPass.setTexture("diffuseSampler", alphaTexture);
                        this._godRaysPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }

                    // Bones
                    if (mesh.useBones) {
                        this._godRaysPass.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._godRaysPass, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._godRaysPass.setMatrix("world", world));
                }
            };

            // Render target texture callbacks
            var savedSceneClearColor: Color3;
            var sceneClearColor = new Color3(0.0, 0.0, 0.0);

            this._godRaysRTT.onBeforeRender = (): void => {
                savedSceneClearColor = scene.clearColor;
                scene.clearColor = sceneClearColor;
            };

            this._godRaysRTT.onAfterRender = (): void => {
                scene.clearColor = savedSceneClearColor;
            };

            this._godRaysRTT.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>): void => {
                var index;

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
            };
        }

        private _updateScreenCoordinates(scene: Scene): void {
            var transform = scene.getTransformMatrix();
            var pos = Vector3.Project(this.useCustomLightPosition ? this._customLightPosition : this.mesh.position, Matrix.Identity(), transform, this._viewPort);

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
            var mesh = BABYLON.Mesh.CreatePlane(name, 1, scene);
            mesh.billboardMode = AbstractMesh.BILLBOARDMODE_ALL;
            mesh.material = new StandardMaterial(name + "Material", scene);

            return mesh;
        }
    }
}  