var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    // Inspired by http://http.developer.nvidia.com/GPUGems3/gpugems3_ch13.html
    var VolumetricLightScatteringPostProcess = (function (_super) {
        __extends(VolumetricLightScatteringPostProcess, _super);
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
         */
        function VolumetricLightScatteringPostProcess(name, ratio, camera, mesh, samples, samplingMode, engine, reusable) {
            var _this = this;
            if (samples === void 0) { samples = 100; }
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.BILINEAR_SAMPLINGMODE; }
            _super.call(this, name, "volumetricLightScattering", ["decay", "exposure", "weight", "meshPositionOnScreen", "density"], ["lightScatteringSampler"], ratio.postProcessRatio || ratio, camera, samplingMode, engine, reusable, "#define NUM_SAMPLES " + samples);
            this._screenCoordinates = BABYLON.Vector2.Zero();
            /**
            * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
            * @type {boolean}
            */
            this.useCustomMeshPosition = false;
            /**
            * If the post-process should inverse the light scattering direction
            * @type {boolean}
            */
            this.invert = true;
            /**
            * Array containing the excluded meshes not rendered in the internal pass
            */
            this.excludedMeshes = new Array();
            this.exposure = 0.3;
            this.decay = 0.96815;
            this.weight = 0.58767;
            this.density = 0.926;
            var scene = camera.getScene();
            this._viewPort = new BABYLON.Viewport(0, 0, 1, 1).toGlobal(scene.getEngine());
            // Configure mesh
            this.mesh = (mesh !== null) ? mesh : VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene);
            // Configure
            this._createPass(scene, ratio.passRatio || ratio);
            this.onApply = function (effect) {
                _this._updateMeshScreenCoordinates(scene);
                effect.setTexture("lightScatteringSampler", _this._volumetricLightScatteringRTT);
                effect.setFloat("exposure", _this.exposure);
                effect.setFloat("decay", _this.decay);
                effect.setFloat("weight", _this.weight);
                effect.setFloat("density", _this.density);
                effect.setVector2("meshPositionOnScreen", _this._screenCoordinates);
            };
        }
        VolumetricLightScatteringPostProcess.prototype.isReady = function (subMesh, useInstances) {
            var mesh = subMesh.getMesh();
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var material = subMesh.getMaterial();
            var needUV = false;
            // Render this.mesh as default
            if (mesh === this.mesh) {
                defines.push("#define BASIC_RENDER");
                defines.push("#define NEED_UV");
                needUV = true;
            }
            // Alpha test
            if (material) {
                if (material.needAlphaTesting() || mesh === this.mesh)
                    defines.push("#define ALPHATEST");
                if (material.opacityTexture !== undefined) {
                    defines.push("#define OPACITY");
                    if (material.opacityTexture.getAlphaFromRGB)
                        defines.push("#define OPACITYRGB");
                    if (!needUV)
                        defines.push("#define NEED_UV");
                }
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
            if (mesh.useBones) {
                attribs.push(BABYLON.VertexBuffer.MatricesIndicesKind);
                attribs.push(BABYLON.VertexBuffer.MatricesWeightsKind);
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
                this._volumetricLightScatteringPass = mesh.getScene().getEngine().createEffect({ vertexElement: "depth", fragmentElement: "volumetricLightScatteringPass" }, attribs, ["world", "mBones", "viewProjection", "diffuseMatrix", "opacityLevel"], ["diffuseSampler", "opacitySampler"], join);
            }
            return this._volumetricLightScatteringPass.isReady();
        };
        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        VolumetricLightScatteringPostProcess.prototype.setCustomMeshPosition = function (position) {
            this._customMeshPosition = position;
        };
        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        VolumetricLightScatteringPostProcess.prototype.getCustomMeshPosition = function () {
            return this._customMeshPosition;
        };
        /**
         * Disposes the internal assets and detaches the post-process from the camera
         */
        VolumetricLightScatteringPostProcess.prototype.dispose = function (camera) {
            var rttIndex = camera.getScene().customRenderTargets.indexOf(this._volumetricLightScatteringRTT);
            if (rttIndex !== -1) {
                camera.getScene().customRenderTargets.splice(rttIndex, 1);
            }
            this._volumetricLightScatteringRTT.dispose();
            _super.prototype.dispose.call(this, camera);
        };
        /**
         * Returns the render target texture used by the post-process
         * @return {BABYLON.RenderTargetTexture} The render target texture used by the post-process
         */
        VolumetricLightScatteringPostProcess.prototype.getPass = function () {
            return this._volumetricLightScatteringRTT;
        };
        // Private methods
        VolumetricLightScatteringPostProcess.prototype._meshExcluded = function (mesh) {
            if (this.excludedMeshes.length > 0 && this.excludedMeshes.indexOf(mesh) !== -1) {
                return true;
            }
            return false;
        };
        VolumetricLightScatteringPostProcess.prototype._createPass = function (scene, ratio) {
            var _this = this;
            var engine = scene.getEngine();
            this._volumetricLightScatteringRTT = new BABYLON.RenderTargetTexture("volumetricLightScatteringMap", { width: engine.getRenderWidth() * ratio, height: engine.getRenderHeight() * ratio }, scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._volumetricLightScatteringRTT.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._volumetricLightScatteringRTT.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._volumetricLightScatteringRTT.renderList = null;
            this._volumetricLightScatteringRTT.renderParticles = false;
            scene.customRenderTargets.push(this._volumetricLightScatteringRTT);
            // Custom render function for submeshes
            var renderSubMesh = function (subMesh) {
                var mesh = subMesh.getRenderingMesh();
                if (_this._meshExcluded(mesh)) {
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
                if (_this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(_this._volumetricLightScatteringPass);
                    mesh._bind(subMesh, _this._volumetricLightScatteringPass, BABYLON.Material.TriangleFillMode);
                    var material = subMesh.getMaterial();
                    _this._volumetricLightScatteringPass.setMatrix("viewProjection", scene.getTransformMatrix());
                    // Alpha test
                    if (material && (mesh === _this.mesh || material.needAlphaTesting() || material.opacityTexture !== undefined)) {
                        var alphaTexture = material.getAlphaTestTexture();
                        _this._volumetricLightScatteringPass.setTexture("diffuseSampler", alphaTexture);
                        if (alphaTexture) {
                            _this._volumetricLightScatteringPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                        }
                        if (material.opacityTexture !== undefined) {
                            _this._volumetricLightScatteringPass.setTexture("opacitySampler", material.opacityTexture);
                            _this._volumetricLightScatteringPass.setFloat("opacityLevel", material.opacityTexture.level);
                        }
                    }
                    // Bones
                    if (mesh.useBones) {
                        _this._volumetricLightScatteringPass.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._volumetricLightScatteringPass, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return _this._volumetricLightScatteringPass.setMatrix("world", world); });
                }
            };
            // Render target texture callbacks
            var savedSceneClearColor;
            var sceneClearColor = new BABYLON.Color4(0.0, 0.0, 0.0, 1.0);
            this._volumetricLightScatteringRTT.onBeforeRender = function () {
                savedSceneClearColor = scene.clearColor;
                scene.clearColor = sceneClearColor;
            };
            this._volumetricLightScatteringRTT.onAfterRender = function () {
                scene.clearColor = savedSceneClearColor;
            };
            this._volumetricLightScatteringRTT.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes, transparentSubMeshes) {
                var engine = scene.getEngine();
                var index;
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                engine.setAlphaTesting(true);
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
                engine.setAlphaTesting(false);
                if (transparentSubMeshes.length) {
                    for (index = 0; index < transparentSubMeshes.length; index++) {
                        var submesh = transparentSubMeshes.data[index];
                        submesh._alphaIndex = submesh.getMesh().alphaIndex;
                        submesh._distanceToCamera = submesh.getBoundingInfo().boundingSphere.centerWorld.subtract(scene.activeCamera.position).length();
                    }
                    var sortedArray = transparentSubMeshes.data.slice(0, transparentSubMeshes.length);
                    sortedArray.sort(function (a, b) {
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
        };
        VolumetricLightScatteringPostProcess.prototype._updateMeshScreenCoordinates = function (scene) {
            var transform = scene.getTransformMatrix();
            var pos = BABYLON.Vector3.Project(this.useCustomMeshPosition ? this._customMeshPosition : this.mesh.position, BABYLON.Matrix.Identity(), transform, this._viewPort);
            this._screenCoordinates.x = pos.x / this._viewPort.width;
            this._screenCoordinates.y = pos.y / this._viewPort.height;
            if (this.invert)
                this._screenCoordinates.y = 1.0 - this._screenCoordinates.y;
        };
        // Static methods
        /**
        * Creates a default mesh for the Volumeric Light Scattering post-process
        * @param {string} The mesh name
        * @param {BABYLON.Scene} The scene where to create the mesh
        * @return {BABYLON.Mesh} the default mesh
        */
        VolumetricLightScatteringPostProcess.CreateDefaultMesh = function (name, scene) {
            var mesh = BABYLON.Mesh.CreatePlane(name, 1, scene);
            mesh.billboardMode = BABYLON.AbstractMesh.BILLBOARDMODE_ALL;
            mesh.material = new BABYLON.StandardMaterial(name + "Material", scene);
            return mesh;
        };
        return VolumetricLightScatteringPostProcess;
    })(BABYLON.PostProcess);
    BABYLON.VolumetricLightScatteringPostProcess = VolumetricLightScatteringPostProcess;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.volumetricLightScatteringPostProcess.js.map