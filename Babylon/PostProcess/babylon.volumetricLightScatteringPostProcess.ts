module BABYLON {
    export class GodRaysPostProcess extends PostProcess {
        // Members
        private _godRaysPass: Effect;
        private _godRaysRTT: RenderTargetTexture;
        private _viewPort: Viewport;
        private _screenCoordinates: Vector2 = Vector2.Zero();
        private _cachedDefines: string;

        public invert: boolean = true;
        public mesh: Mesh;

        constructor(name: string, ratio: number, camera: Camera, samplingMode?: number, engine?: Engine, reusable?: boolean) {
            super(name, "volumetricLightScattering", ["lightPositionOnScreen"], ["lightScatteringSampler"], ratio, camera, samplingMode, engine, reusable);
            var scene = camera.getScene();

            this._viewPort = new Viewport(0, 0, 1, 1).toGlobal(scene.getEngine());

            // Create billboard
            this.mesh = BABYLON.Mesh.CreatePlane("VolumetricLightScatteringMesh", 2, scene);
            this.mesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            this.mesh.material = new StandardMaterial('VolumetricLightScatteringMaterial', scene);

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

        public dispose(camera: Camera): void {
            this._godRaysRTT.dispose();
            super.dispose(camera);
        }

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
            var savedSceneClearColor: Color4 = null;
            var sceneClearColor = new Color4(0.0, 0.0, 0.0, 1.0);

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
            var pos = Vector3.Project(this.mesh.position, Matrix.Identity(), transform, this._viewPort);

            this._screenCoordinates.x = pos.x / this._viewPort.width;
            this._screenCoordinates.y = pos.y / this._viewPort.height;

            if (this.invert)
                this._screenCoordinates.y = 1.0 - this._screenCoordinates.y;
        }
    }
}  