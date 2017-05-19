module BABYLON {
    export class GeometryRenderer {
        private _scene: Scene;
        private _multiRenderTarget: MultiRenderTarget;
        private _effect: Effect;

        private _viewMatrix = Matrix.Zero();
        private _projectionMatrix = Matrix.Zero();
        private _transformMatrix = Matrix.Zero();
        private _worldViewProjection = Matrix.Zero();

        private _cachedDefines: string;

        constructor(scene: Scene, ratio: number = 1) {
            this._scene = scene;
            var engine = scene.getEngine();

            // Render target
            this._multiRenderTarget = new MultiRenderTarget("gBuffer", { width: engine.getRenderWidth() * ratio, height: engine.getRenderHeight() * ratio }, 2, this._scene, { generateMipMaps : false, generateDepthTexture: true });
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

                // Culling
                engine.setState(subMesh.getMaterial().backFaceCulling);

                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);

                if (batch.mustReturn) {
                    return;
                }

                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);

                if (this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(this._effect);
                    mesh._bind(subMesh, this._effect, Material.TriangleFillMode);
                    var material = subMesh.getMaterial();

                    this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
                    this._effect.setMatrix("view", scene.getViewMatrix());

                    this._effect.setFloat("far", scene.activeCamera.maxZ);

                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        this._effect.setTexture("diffuseSampler", alphaTexture);
                        this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }

                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders) {
                        this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }

                    // Draw
                    mesh._processRendering(subMesh, this._effect, Material.TriangleFillMode, batch, hardwareInstancedRendering,
                        (isInstance, world) => this._effect.setMatrix("world", world));
                }
            };

            this._multiRenderTarget.customRenderFunction = (opaqueSubMeshes: SmartArray<SubMesh>, alphaTestSubMeshes: SmartArray<SubMesh>): void => {
                var index;

                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }

                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
            };

            this._multiRenderTarget.renderList = scene.getActiveMeshes().data;
        }

        public isReady(subMesh: SubMesh, useInstances: boolean): boolean {
            var material: any = subMesh.getMaterial();

            if (material && material.disableDepthWrite) {
                return false;
            }

            var defines = [];

            var attribs = [VertexBuffer.PositionKind, VertexBuffer.NormalKind];

            var mesh = subMesh.getMesh();
            var scene = mesh.getScene();

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

            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(VertexBuffer.MatricesIndicesKind);
                attribs.push(VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(VertexBuffer.MatricesWeightsExtraKind);
                }
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
                this._effect = this._scene.getEngine().createEffect("geometry",
                    attribs,
                    ["world", "mBones", "viewProjection", "diffuseMatrix", "view", "far"],
                    ["diffuseSampler"], join);
            }

            return this._effect.isReady();
        }

        public getGBuffer(): MultiRenderTarget {
            return this._multiRenderTarget;
        }

        // Methods
        public dispose(): void {
            this.getGBuffer().dispose();
        }
    }
} 