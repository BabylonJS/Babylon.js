var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var VolumetricLightScatteringPostProcess = (function (_super) {
        __extends(VolumetricLightScatteringPostProcess, _super);
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
        function VolumetricLightScatteringPostProcess(name, ratio, camera, mesh, samplingMode, engine, reusable) {
            var _this = this;
            _super.call(this, name, "volumetricLightScattering", ["lightPositionOnScreen"], ["lightScatteringSampler"], ratio, camera, samplingMode, engine, reusable);
            this._screenCoordinates = BABYLON.Vector2.Zero();
            /**
            * Set if the post-process should use a custom position for the light source (true) or the internal mesh position (false)
            * @type {boolean}
            */
            this.useCustomLightPosition = false;
            /**
            * If the post-process should inverse the light scattering direction
            * @type {boolean}
            */
            this.invert = true;
            var scene = camera.getScene();
            this._viewPort = new BABYLON.Viewport(0, 0, 1, 1).toGlobal(scene.getEngine());
            // Configure mesh
            this.mesh = (mesh !== null) ? mesh : VolumetricLightScatteringPostProcess.CreateDefaultMesh("VolumetricLightScatteringMesh", scene);
            // Configure
            this._createPass(scene);
            this.onApply = function (effect) {
                _this._updateScreenCoordinates(scene);
                effect.setTexture("lightScatteringSampler", _this._godRaysRTT);
                effect.setVector2("lightPositionOnScreen", _this._screenCoordinates);
            };
        }
        VolumetricLightScatteringPostProcess.prototype.isReady = function (subMesh, useInstances) {
            var mesh = subMesh.getMesh();
            var scene = mesh.getScene();
            var defines = [];
            var attribs = [BABYLON.VertexBuffer.PositionKind];
            var material = subMesh.getMaterial();
            // Render this.mesh as default
            if (mesh === this.mesh)
                defines.push("#define BASIC_RENDER");
            // Alpha test
            if (material) {
                if (material.needAlphaTesting() || mesh === this.mesh)
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
                this._godRaysPass = mesh.getScene().getEngine().createEffect({ vertexElement: "depth", fragmentElement: "volumetricLightScatteringPass" }, attribs, ["world", "mBones", "viewProjection", "diffuseMatrix", "far"], ["diffuseSampler"], join);
            }
            return this._godRaysPass.isReady();
        };
        /**
         * Sets the new light position for light scattering effect
         * @param {BABYLON.Vector3} The new custom light position
         */
        VolumetricLightScatteringPostProcess.prototype.setLightPosition = function (position) {
            this._customLightPosition = position;
        };
        /**
         * Returns the light position for light scattering effect
         * @return {BABYLON.Vector3} The custom light position
         */
        VolumetricLightScatteringPostProcess.prototype.getLightPosition = function () {
            return this._customLightPosition;
        };
        /**
         * Disposes the internal assets and detaches the post-process from the camera
         */
        VolumetricLightScatteringPostProcess.prototype.dispose = function (camera) {
            this._godRaysRTT.dispose();
            _super.prototype.dispose.call(this, camera);
        };
        /**
         * Returns the render target texture used by the post-process
         * @return {BABYLON.RenderTargetTexture} The render target texture used by the post-process
         */
        VolumetricLightScatteringPostProcess.prototype.getPass = function () {
            return this._godRaysRTT;
        };
        // Private methods
        VolumetricLightScatteringPostProcess.prototype._createPass = function (scene) {
            var _this = this;
            var engine = scene.getEngine();
            this._godRaysRTT = new BABYLON.RenderTargetTexture("volumetricLightScatteringMap", { width: engine.getRenderWidth(), height: engine.getRenderHeight() }, scene, false, true, BABYLON.Engine.TEXTURETYPE_UNSIGNED_INT);
            this._godRaysRTT.wrapU = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._godRaysRTT.wrapV = BABYLON.Texture.CLAMP_ADDRESSMODE;
            this._godRaysRTT.renderList = null;
            this._godRaysRTT.renderParticles = false;
            scene.customRenderTargets.push(this._godRaysRTT);
            // Custom render function for submeshes
            var renderSubMesh = function (subMesh) {
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
                if (_this.isReady(subMesh, hardwareInstancedRendering)) {
                    engine.enableEffect(_this._godRaysPass);
                    mesh._bind(subMesh, _this._godRaysPass, BABYLON.Material.TriangleFillMode);
                    var material = subMesh.getMaterial();
                    _this._godRaysPass.setMatrix("viewProjection", scene.getTransformMatrix());
                    // Alpha test
                    if (material && (mesh === _this.mesh || material.needAlphaTesting())) {
                        var alphaTexture = material.getAlphaTestTexture();
                        _this._godRaysPass.setTexture("diffuseSampler", alphaTexture);
                        _this._godRaysPass.setMatrix("diffuseMatrix", alphaTexture.getTextureMatrix());
                    }
                    // Bones
                    if (mesh.useBones) {
                        _this._godRaysPass.setMatrices("mBones", mesh.skeleton.getTransformMatrices());
                    }
                    // Draw
                    mesh._processRendering(subMesh, _this._godRaysPass, BABYLON.Material.TriangleFillMode, batch, hardwareInstancedRendering, function (isInstance, world) { return _this._godRaysPass.setMatrix("world", world); });
                }
            };
            // Render target texture callbacks
            var savedSceneClearColor;
            var sceneClearColor = new BABYLON.Color3(0.0, 0.0, 0.0);
            this._godRaysRTT.onBeforeRender = function () {
                savedSceneClearColor = scene.clearColor;
                scene.clearColor = sceneClearColor;
            };
            this._godRaysRTT.onAfterRender = function () {
                scene.clearColor = savedSceneClearColor;
            };
            this._godRaysRTT.customRenderFunction = function (opaqueSubMeshes, alphaTestSubMeshes) {
                var index;
                for (index = 0; index < opaqueSubMeshes.length; index++) {
                    renderSubMesh(opaqueSubMeshes.data[index]);
                }
                for (index = 0; index < alphaTestSubMeshes.length; index++) {
                    renderSubMesh(alphaTestSubMeshes.data[index]);
                }
            };
        };
        VolumetricLightScatteringPostProcess.prototype._updateScreenCoordinates = function (scene) {
            var transform = scene.getTransformMatrix();
            var pos = BABYLON.Vector3.Project(this.useCustomLightPosition ? this._customLightPosition : this.mesh.position, BABYLON.Matrix.Identity(), transform, this._viewPort);
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