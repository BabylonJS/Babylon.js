var BABYLON;
(function (BABYLON) {
    var DepthRenderer = (function () {
        function DepthRenderer(scene, type) {
            var _this = this;
            if (type === void 0) { type = BABYLON.Engine.TEXTURETYPE_FLOAT; }
            this._viewMatrix = BABYLON.Matrix.Zero();
            this._projectionMatrix = BABYLON.Matrix.Zero();
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._worldViewProjection = BABYLON.Matrix.Zero();
            this._scene = scene;
            var engine = scene.getEngine();
            // Render target
            this._depthMap = new BABYLON.RenderTargetTexture("depthMap", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, this._scene, false, true, type);
            this._depthMap.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._depthMap.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._depthMap.refreshRate = 1;
            this._depthMap.renderParticles = false;
            this._depthMap.renderList = null;
            // set default depth value to 1.0 (far away)
            this._depthMap.onClearObservable.add(function (engine) {
                engine.clear(new BABYLON.Color4(1.0, 1.0, 1.0, 1.0), true, true);
            });
            // Custom render function
            var renderSubMesh = function (subMesh) {
                var mesh = subMesh.getRenderingMesh();
                var scene = _this._scene;
                var engine = scene.getEngine();
                // Culling
                engine.setState(subMesh.getMaterial().backFaceCulling);
                // Managing instances
                var batch = mesh._getInstancesRenderList(subMesh._id);
                if (batch.mustReturn) {
                    return;
                }
                var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null);
                if (_this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(_this._effect);
                    mesh._bind(subMesh, _this._effect, BABYLON.Material.TriangleFillMode);
                    var material = subMesh.getMaterial();
                    _this._effect.setMatrix("viewProjection", scene.getTransformMatrix());
                    _this._effect.setFloat("far", scene.activeCamera.maxZ);
                    // Alpha test
                    if (material && material.needAlphaTesting()) {
                        var alphaTexture = material.getAlphaTestTexture();
                        _this._effect.setTexture("diffuseSampler", alphaTexture);
                        _this._effect.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                    // Bones
                    if (mesh.useBones && mesh.computeBonesUsingShaders) {
                        _this._effect.setMatrices("mBones", mesh.skeleton.getTransformMatrices(mesh));
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._effect, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return _this._effect.setMatrix("world", world); });
                }
            };
            this._depthMap.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes) {
                var index;
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
            };
        }
        DepthRenderer.prototype.isReady = function (subMesh, useInstances) {
            var material = subMesh.getMaterial();
            if (material.disableDepthWrite) {
                return false;
            }
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var mesh = subMesh.getMesh();
            var scene = mesh.getScene();
            // Alpha test
            if (material && material.needAlphaTesting()) {
                defines.push("#define ALPHATEST");
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UVKind)) {
                    attribs.push(BABYLON.VertexBuffer.UVKind);
                    defines.push("#define UV1");
                }
                if (mesh.isVerticesDataPresent(BABYLON.VertexBuffer.UV2Kind)) {
                    attribs.push(BABYLON.VertexBuffer.UV2Kind);
                    defines.push("#define UV2");
                }
            }
            // Bones
            if (mesh.useBones && mesh.computeBonesUsingShaders) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
                if (mesh.numBoneInfluencers > 4) {
                    attribs.push(BABYLON.VertexBuffer.MatricesIndicesExtraKind);
                    attribs.push(BABYLON.VertexBuffer.MatricesWeightsExtraKind);
                }
                defines.push("#define NUM_BONE_INFLUENCERS " + mesh.numBoneInfluencers);
                defines.push("#define BonesPerMesh " + (mesh.skeleton.bones.length + 1));
            }
            else {
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
                this._effect = this._scene.getEngine().createEffect("depth", attribs, ["world", "mBones", "viewProjection", "diffuseMatrix", "far"], ["diffuseSampler"], join);
            }
            return this._effect.isReady();
        };
        DepthRenderer.prototype.getDepthMap = function () {
            return this._depthMap;
        };
        // Methods
        DepthRenderer.prototype.dispose = function () {
            this._depthMap.dispose();
        };
        return DepthRenderer;
    }());
    BABYLON.DepthRenderer = DepthRenderer;
})(BABYLON || (BABYLON = {}));
