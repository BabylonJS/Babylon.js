var BABYLON;
(function (BABYLON) {
    var checkExtends = function (v, min, max) {
        if (v.x < min.x)
            min.x = v.x;
        if (v.y < min.y)
            min.y = v.y;
        if (v.z < min.z)
            min.z = v.z;

        if (v.x > max.x)
            max.x = v.x;
        if (v.y > max.y)
            max.y = v.y;
        if (v.z > max.z)
            max.z = v.z;
    };

    var Scene = (function () {
        // Constructor
        function Scene(engine) {
            // Members
            this.autoClear = true;
            this.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.forceWireframe = false;
            // Fog
            this.fogMode = BABYLON.Scene.FOGMODE_NONE;
            this.fogColor = new BABYLON.Color3(0.2, 0.2, 0.3);
            this.fogDensity = 0.1;
            this.fogStart = 0;
            this.fogEnd = 1000.0;
            // Lights
            this.lightsEnabled = true;
            this.lights = new Array();
            // Cameras
            this.cameras = new Array();
            this.activeCameras = new Array();
            // Meshes
            this.meshes = new Array();
            // Geometries
            this._geometries = new Array();
            this.materials = new Array();
            this.multiMaterials = new Array();
            this.defaultMaterial = new BABYLON.StandardMaterial("default material", this);
            // Textures
            this.texturesEnabled = true;
            this.textures = new Array();
            // Particles
            this.particlesEnabled = true;
            this.particleSystems = new Array();
            // Sprites
            this.spriteManagers = new Array();
            // Layers
            this.layers = new Array();
            // Skeletons
            this.skeletons = new Array();
            // Lens flares
            this.lensFlareSystems = new Array();
            // Collisions
            this.collisionsEnabled = true;
            this.gravity = new BABYLON.Vector3(0, -9.0, 0);
            // Postprocesses
            this.postProcessesEnabled = true;
            // Customs render targets
            this.renderTargetsEnabled = true;
            this.customRenderTargets = new Array();
            // Imported meshes
            this.importedMeshesFiles = new Array();
            this._totalVertices = 0;
            this._activeVertices = 0;
            this._activeParticles = 0;
            this._lastFrameDuration = 0;
            this._evaluateActiveMeshesDuration = 0;
            this._renderTargetsDuration = 0;
            this._particlesDuration = 0;
            this._renderDuration = 0;
            this._spritesDuration = 0;
            this._animationRatio = 0;
            this._renderId = 0;
            this._executeWhenReadyTimeoutId = -1;
            this._toBeDisposed = new BABYLON.SmartArray(256);
            this._onReadyCallbacks = new Array();
            this._pendingData = [];
            this._onBeforeRenderCallbacks = new Array();
            this._activeMeshes = new BABYLON.SmartArray(256);
            this._processedMaterials = new BABYLON.SmartArray(256);
            this._renderTargets = new BABYLON.SmartArray(256);
            this._activeParticleSystems = new BABYLON.SmartArray(256);
            this._activeSkeletons = new BABYLON.SmartArray(32);
            this._activeAnimatables = new Array();
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._scaledPosition = BABYLON.Vector3.Zero();
            this._scaledVelocity = BABYLON.Vector3.Zero();
            this._engine = engine;

            engine.scenes.push(this);

            this._renderingManager = new BABYLON.RenderingManager(this);

            this.postProcessManager = new BABYLON.PostProcessManager(this);

            this._boundingBoxRenderer = new BABYLON.BoundingBoxRenderer(this);

            this.attachControl();
        }
        // Properties
        Scene.prototype.getBoundingBoxRenderer = function () {
            return this._boundingBoxRenderer;
        };

        Scene.prototype.getEngine = function () {
            return this._engine;
        };

        Scene.prototype.getTotalVertices = function () {
            return this._totalVertices;
        };

        Scene.prototype.getActiveVertices = function () {
            return this._activeVertices;
        };

        Scene.prototype.getActiveParticles = function () {
            return this._activeParticles;
        };

        // Stats
        Scene.prototype.getLastFrameDuration = function () {
            return this._lastFrameDuration;
        };

        Scene.prototype.getEvaluateActiveMeshesDuration = function () {
            return this._evaluateActiveMeshesDuration;
        };

        Scene.prototype.getActiveMeshes = function () {
            return this._activeMeshes;
        };

        Scene.prototype.getRenderTargetsDuration = function () {
            return this._renderTargetsDuration;
        };

        Scene.prototype.getRenderDuration = function () {
            return this._renderDuration;
        };

        Scene.prototype.getParticlesDuration = function () {
            return this._particlesDuration;
        };

        Scene.prototype.getSpritesDuration = function () {
            return this._spritesDuration;
        };

        Scene.prototype.getAnimationRatio = function () {
            return this._animationRatio;
        };

        Scene.prototype.getRenderId = function () {
            return this._renderId;
        };

        // Pointers handling
        Scene.prototype.attachControl = function () {
            var _this = this;
            this._onPointerMove = function (evt) {
                var canvas = _this._engine.getRenderingCanvas();
                var pickResult = _this.pick(evt.offsetX || evt.layerX, evt.offsetY || evt.layerY, function (mesh) {
                    return mesh.actionManager && mesh.isPickable;
                });

                if (pickResult.hit) {
                    _this.setPointerOverMesh(pickResult.pickedMesh);
                    canvas.style.cursor = "pointer";
                } else {
                    _this.setPointerOverMesh(null);
                    canvas.style.cursor = "";
                }
            };

            this._onPointerDown = function (evt) {
                var pickResult = _this.pick(evt.offsetX || evt.layerX, evt.offsetY || evt.layerY);

                if (pickResult.hit) {
                    if (pickResult.pickedMesh.actionManager) {
                        pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger);
                    }
                }

                if (_this.onPointerDown) {
                    _this.onPointerDown(evt, pickResult);
                }
            };

            var eventPrefix = BABYLON.Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "move", this._onPointerMove, false);
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "down", this._onPointerDown, false);
        };

        Scene.prototype.detachControl = function () {
            var eventPrefix = BABYLON.Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "move", this._onPointerMove);
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "down", this._onPointerDown);
        };

        // Ready
        Scene.prototype.isReady = function () {
            if (this._pendingData.length > 0) {
                return false;
            }

            for (var index = 0; index < this._geometries.length; index++) {
                var geometry = this._geometries[index];

                if (geometry.delayLoadState === BABYLON.Engine.DELAYLOADSTATE_LOADING) {
                    return false;
                }
            }

            for (index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];

                if (!mesh.isReady()) {
                    return false;
                }

                var mat = mesh.material;
                if (mat) {
                    if (!mat.isReady(mesh)) {
                        return false;
                    }
                }
            }

            return true;
        };

        Scene.prototype.registerBeforeRender = function (func) {
            this._onBeforeRenderCallbacks.push(func);
        };

        Scene.prototype.unregisterBeforeRender = function (func) {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        };

        Scene.prototype._addPendingData = function (data) {
            this._pendingData.push(data);
        };

        Scene.prototype._removePendingData = function (data) {
            var index = this._pendingData.indexOf(data);

            if (index !== -1) {
                this._pendingData.splice(index, 1);
            }
        };

        Scene.prototype.getWaitingItemsCount = function () {
            return this._pendingData.length;
        };

        Scene.prototype.executeWhenReady = function (func) {
            var _this = this;
            this._onReadyCallbacks.push(func);

            if (this._executeWhenReadyTimeoutId !== -1) {
                return;
            }

            this._executeWhenReadyTimeoutId = setTimeout(function () {
                _this._checkIsReady();
            }, 150);
        };

        Scene.prototype._checkIsReady = function () {
            var _this = this;
            if (this.isReady()) {
                this._onReadyCallbacks.forEach(function (func) {
                    func();
                });

                this._onReadyCallbacks = [];
                this._executeWhenReadyTimeoutId = -1;
                return;
            }

            this._executeWhenReadyTimeoutId = setTimeout(function () {
                _this._checkIsReady();
            }, 150);
        };

        // Animations
        Scene.prototype.beginAnimation = function (target, from, to, loop, speedRatio, onAnimationEnd) {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            // Local animations
            if (target.animations) {
                this.stopAnimation(target);

                var animatable = new BABYLON.Internals.Animatable(target, from, to, loop, speedRatio, onAnimationEnd);

                this._activeAnimatables.push(animatable);
            }

            // Children animations
            if (target.getAnimatables) {
                var animatables = target.getAnimatables();
                for (var index = 0; index < animatables.length; index++) {
                    this.beginAnimation(animatables[index], from, to, loop, speedRatio, onAnimationEnd);
                }
            }
        };

        Scene.prototype.beginDirectAnimation = function (target, animations, from, to, loop, speedRatio, onAnimationEnd) {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            var animatable = new BABYLON.Internals.Animatable(target, from, to, loop, speedRatio, onAnimationEnd, animations);

            this._activeAnimatables.push(animatable);
        };

        Scene.prototype.stopAnimation = function (target) {
            // Local animations
            if (target.animations) {
                for (var index = 0; index < this._activeAnimatables.length; index++) {
                    if (this._activeAnimatables[index].target === target) {
                        this._activeAnimatables.splice(index, 1);
                        return;
                    }
                }
            }

            // Children animations
            if (target.getAnimatables) {
                var animatables = target.getAnimatables();
                for (index = 0; index < animatables.length; index++) {
                    this.stopAnimation(animatables[index]);
                }
            }
        };

        Scene.prototype._animate = function () {
            if (!this._animationStartDate) {
                this._animationStartDate = new Date().getTime();
            }

            // Getting time
            var now = new Date().getTime();
            var delay = now - this._animationStartDate;

            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (!this._activeAnimatables[index]._animate(delay)) {
                    this._activeAnimatables.splice(index, 1);
                    index--;
                }
            }
        };

        // Matrix
        Scene.prototype.getViewMatrix = function () {
            return this._viewMatrix;
        };

        Scene.prototype.getProjectionMatrix = function () {
            return this._projectionMatrix;
        };

        Scene.prototype.getTransformMatrix = function () {
            return this._transformMatrix;
        };

        Scene.prototype.setTransformMatrix = function (view, projection) {
            this._viewMatrix = view;
            this._projectionMatrix = projection;

            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        };

        // Methods
        Scene.prototype.setActiveCameraByID = function (id) {
            var camera = this.getCameraByID(id);

            if (camera) {
                this.activeCamera = camera;
                return camera;
            }

            return null;
        };

        Scene.prototype.setActiveCameraByName = function (name) {
            var camera = this.getCameraByName(name);

            if (camera) {
                this.activeCamera = camera;
                return camera;
            }

            return null;
        };

        Scene.prototype.getMaterialByID = function (id) {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].id === id) {
                    return this.materials[index];
                }
            }

            return null;
        };

        Scene.prototype.getMaterialByName = function (name) {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].name === name) {
                    return this.materials[index];
                }
            }

            return null;
        };

        Scene.prototype.getCameraByID = function (id) {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].id === id) {
                    return this.cameras[index];
                }
            }

            return null;
        };

        Scene.prototype.getCameraByName = function (name) {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].name === name) {
                    return this.cameras[index];
                }
            }

            return null;
        };

        Scene.prototype.getLightByName = function (name) {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].name === name) {
                    return this.lights[index];
                }
            }

            return null;
        };

        Scene.prototype.getLightByID = function (id) {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].id === id) {
                    return this.lights[index];
                }
            }

            return null;
        };

        Scene.prototype.getGeometryByID = function (id) {
            for (var index = 0; index < this._geometries.length; index++) {
                if (this._geometries[index].id === id) {
                    return this._geometries[index];
                }
            }

            return null;
        };

        Scene.prototype.pushGeometry = function (geometry, force) {
            if (!force && this.getGeometryByID(geometry.id)) {
                return false;
            }

            this._geometries.push(geometry);

            return true;
        };

        Scene.prototype.getGeometries = function () {
            return this._geometries;
        };

        Scene.prototype.getMeshByID = function (id) {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        };

        Scene.prototype.getLastMeshByID = function (id) {
            for (var index = this.meshes.length - 1; index >= 0; index--) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        };

        Scene.prototype.getLastEntryByID = function (id) {
            for (var index = this.meshes.length - 1; index >= 0; index--) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            for (index = this.cameras.length - 1; index >= 0; index--) {
                if (this.cameras[index].id === id) {
                    return this.cameras[index];
                }
            }

            for (index = this.lights.length - 1; index >= 0; index--) {
                if (this.lights[index].id === id) {
                    return this.lights[index];
                }
            }

            return null;
        };

        Scene.prototype.getMeshByName = function (name) {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].name === name) {
                    return this.meshes[index];
                }
            }

            return null;
        };

        Scene.prototype.getLastSkeletonByID = function (id) {
            for (var index = this.skeletons.length - 1; index >= 0; index--) {
                if (this.skeletons[index].id === id) {
                    return this.skeletons[index];
                }
            }

            return null;
        };

        Scene.prototype.getSkeletonById = function (id) {
            for (var index = 0; index < this.skeletons.length; index++) {
                if (this.skeletons[index].id === id) {
                    return this.skeletons[index];
                }
            }

            return null;
        };

        Scene.prototype.getSkeletonByName = function (name) {
            for (var index = 0; index < this.skeletons.length; index++) {
                if (this.skeletons[index].name === name) {
                    return this.skeletons[index];
                }
            }

            return null;
        };

        Scene.prototype.isActiveMesh = function (mesh) {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        };

        Scene.prototype._evaluateSubMesh = function (subMesh, mesh) {
            if (mesh.subMeshes.length == 1 || subMesh.isInFrustum(this._frustumPlanes)) {
                var material = subMesh.getMaterial();

                if (material) {
                    // Render targets
                    if (material.getRenderTargetTextures) {
                        if (this._processedMaterials.indexOf(material) === -1) {
                            this._processedMaterials.push(material);

                            this._renderTargets.concat(material.getRenderTargetTextures());
                        }
                    }

                    // Dispatch
                    this._activeVertices += subMesh.verticesCount;
                    this._renderingManager.dispatch(subMesh);
                }
            }
        };

        Scene.prototype._evaluateActiveMeshes = function () {
            this._activeMeshes.reset();
            this._renderingManager.reset();
            this._processedMaterials.reset();
            this._activeParticleSystems.reset();
            this._activeSkeletons.reset();
            this._boundingBoxRenderer.reset();

            if (!this._frustumPlanes) {
                this._frustumPlanes = BABYLON.Frustum.GetPlanes(this._transformMatrix);
            } else {
                BABYLON.Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }

            // Meshes
            if (this._selectionOctree) {
                var selection = this._selectionOctree.select(this._frustumPlanes);

                for (var blockIndex = 0; blockIndex < selection.length; blockIndex++) {
                    var block = selection.data[blockIndex];

                    for (var meshIndex = 0; meshIndex < block.meshes.length; meshIndex++) {
                        var mesh = block.meshes[meshIndex];

                        if (Math.abs(mesh._renderId) !== this._renderId) {
                            this._totalVertices += mesh.getTotalVertices();

                            if (!mesh.isReady()) {
                                continue;
                            }

                            mesh.computeWorldMatrix();
                            mesh._renderId = 0;
                            mesh._preActivate();
                        }

                        if (mesh._renderId === this._renderId || (mesh._renderId === 0 && mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && mesh.isInFrustum(this._frustumPlanes))) {
                            if (mesh._renderId === 0) {
                                this._activeMeshes.push(mesh);
                                mesh._activate(this._renderId);
                            }
                            mesh._renderId = this._renderId;

                            if (mesh.showBoundingBox) {
                                this._boundingBoxRenderer.renderList.push(mesh);
                            }

                            if (mesh.skeleton) {
                                this._activeSkeletons.pushNoDuplicate(mesh.skeleton);
                            }

                            var subMeshes = block.subMeshes[meshIndex];
                            for (subIndex = 0; subIndex < subMeshes.length; subIndex++) {
                                subMesh = subMeshes[subIndex];

                                if (subMesh._renderId === this._renderId) {
                                    continue;
                                }
                                subMesh._renderId = this._renderId;

                                this._evaluateSubMesh(subMesh, mesh);
                            }
                        } else {
                            mesh._renderId = -this._renderId;
                        }
                    }
                }
            } else {
                for (meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
                    mesh = this.meshes[meshIndex];

                    this._totalVertices += mesh.getTotalVertices();

                    if (!mesh.isReady()) {
                        continue;
                    }

                    mesh.computeWorldMatrix();
                    mesh._preActivate();

                    if (mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && mesh.isInFrustum(this._frustumPlanes)) {
                        this._activeMeshes.push(mesh);
                        mesh._activate(this._renderId);

                        if (mesh.skeleton) {
                            this._activeSkeletons.pushNoDuplicate(mesh.skeleton);
                        }

                        if (mesh.showBoundingBox) {
                            this._boundingBoxRenderer.renderList.push(mesh);
                        }

                        if (mesh.subMeshes) {
                            for (var subIndex = 0; subIndex < mesh.subMeshes.length; subIndex++) {
                                var subMesh = mesh.subMeshes[subIndex];

                                this._evaluateSubMesh(subMesh, mesh);
                            }
                        }
                    }
                }
            }

            // Particle systems
            var beforeParticlesDate = new Date().getTime();
            if (this.particlesEnabled) {
                for (var particleIndex = 0; particleIndex < this.particleSystems.length; particleIndex++) {
                    var particleSystem = this.particleSystems[particleIndex];

                    if (!particleSystem.emitter.position || (particleSystem.emitter && particleSystem.emitter.isEnabled())) {
                        this._activeParticleSystems.push(particleSystem);
                        particleSystem.animate();
                    }
                }
            }
            this._particlesDuration += new Date().getTime() - beforeParticlesDate;
        };

        Scene.prototype.updateTransformMatrix = function (force) {
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(force));
        };

        Scene.prototype._renderForCamera = function (camera) {
            var engine = this._engine;

            this.activeCamera = camera;

            if (!this.activeCamera)
                throw new Error("Active camera not set");

            // Viewport
            engine.setViewport(this.activeCamera.viewport);

            // Camera
            this._renderId++;
            this.updateTransformMatrix();

            if (this.beforeCameraRender) {
                this.beforeCameraRender(this.activeCamera);
            }

            // Meshes
            var beforeEvaluateActiveMeshesDate = new Date().getTime();
            this._evaluateActiveMeshes();
            this._evaluateActiveMeshesDuration += new Date().getTime() - beforeEvaluateActiveMeshesDate;

            for (var skeletonIndex = 0; skeletonIndex < this._activeSkeletons.length; skeletonIndex++) {
                var skeleton = this._activeSkeletons.data[skeletonIndex];

                skeleton.prepare();
            }

            for (var customIndex = 0; customIndex < this.customRenderTargets.length; customIndex++) {
                this._renderTargets.push(this.customRenderTargets[customIndex]);
            }

            // Render targets
            var beforeRenderTargetDate = new Date().getTime();
            if (this.renderTargetsEnabled) {
                for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    var renderTarget = this._renderTargets.data[renderIndex];
                    this._renderId++;
                    renderTarget.render();
                }
                this._renderId++;
            }

            if (this._renderTargets.length > 0) {
                engine.restoreDefaultFramebuffer();
            }
            this._renderTargetsDuration = new Date().getTime() - beforeRenderTargetDate;

            // Prepare Frame
            this.postProcessManager._prepareFrame();

            var beforeRenderDate = new Date().getTime();

            // Backgrounds
            if (this.layers.length) {
                engine.setDepthBuffer(false);
                var layerIndex;
                var layer;
                for (layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
                    layer = this.layers[layerIndex];
                    if (layer.isBackground) {
                        layer.render();
                    }
                }
                engine.setDepthBuffer(true);
            }

            // Render
            this._renderingManager.render(null, null, true, true);

            // Bounding boxes
            this._boundingBoxRenderer.render();

            for (var lensFlareSystemIndex = 0; lensFlareSystemIndex < this.lensFlareSystems.length; lensFlareSystemIndex++) {
                this.lensFlareSystems[lensFlareSystemIndex].render();
            }

            // Foregrounds
            if (this.layers.length) {
                engine.setDepthBuffer(false);
                for (layerIndex = 0; layerIndex < this.layers.length; layerIndex++) {
                    layer = this.layers[layerIndex];
                    if (!layer.isBackground) {
                        layer.render();
                    }
                }
                engine.setDepthBuffer(true);
            }

            this._renderDuration += new Date().getTime() - beforeRenderDate;

            // Finalize frame
            this.postProcessManager._finalizeFrame(camera.isIntermediate);

            // Update camera
            this.activeCamera._updateFromScene();

            // Reset some special arrays
            this._renderTargets.reset();

            if (this.afterCameraRender) {
                this.afterCameraRender(this.activeCamera);
            }
        };

        Scene.prototype._processSubCameras = function (camera) {
            if (camera.subCameras.length == 0) {
                this._renderForCamera(camera);
                return;
            }

            for (var index = 0; index < camera.subCameras.length; index++) {
                this._renderForCamera(camera.subCameras[index]);
            }

            this.activeCamera = camera;
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());

            // Update camera
            this.activeCamera._updateFromScene();
        };

        Scene.prototype.render = function () {
            var startDate = new Date().getTime();
            this._particlesDuration = 0;
            this._spritesDuration = 0;
            this._activeParticles = 0;
            this._renderDuration = 0;
            this._evaluateActiveMeshesDuration = 0;
            this._totalVertices = 0;
            this._activeVertices = 0;

            // Actions
            if (this.actionManager) {
                this.actionManager.processTrigger(BABYLON.ActionManager.OnEveryFrameTrigger);
            }

            // Before render
            if (this.beforeRender) {
                this.beforeRender();
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // Animations
            var deltaTime = BABYLON.Tools.GetDeltaTime();
            this._animationRatio = deltaTime * (60.0 / 1000.0);
            this._animate();

            // Physics
            if (this._physicsEngine) {
                this._physicsEngine._runOneStep(deltaTime / 1000.0);
            }

            // Clear
            this._engine.clear(this.clearColor, this.autoClear || this.forceWireframe, true);

            for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
                var light = this.lights[lightIndex];
                var shadowGenerator = light.getShadowGenerator();

                if (light.isEnabled() && shadowGenerator && shadowGenerator.getShadowMap().getScene().textures.indexOf(shadowGenerator.getShadowMap()) !== -1) {
                    this._renderTargets.push(shadowGenerator.getShadowMap());
                }
            }

            // Multi-cameras?
            if (this.activeCameras.length > 0) {
                var currentRenderId = this._renderId;
                for (var cameraIndex = 0; cameraIndex < this.activeCameras.length; cameraIndex++) {
                    this._renderId = currentRenderId;
                    this._processSubCameras(this.activeCameras[cameraIndex]);
                }
            } else {
                this._processSubCameras(this.activeCamera);
            }

            // After render
            if (this.afterRender) {
                this.afterRender();
            }

            for (var index = 0; index < this._toBeDisposed.length; index++) {
                this._toBeDisposed.data[index].dispose();
                this._toBeDisposed[index] = null;
            }

            this._toBeDisposed.reset();

            this._lastFrameDuration = new Date().getTime() - startDate;
        };

        Scene.prototype.dispose = function () {
            this.beforeRender = null;
            this.afterRender = null;

            this.skeletons = [];

            this._boundingBoxRenderer.dispose();

            // Events
            this.detachControl();

            // Detach cameras
            var canvas = this._engine.getRenderingCanvas();
            var index;
            for (index = 0; index < this.cameras.length; index++) {
                this.cameras[index].detachControl(canvas);
            }

            while (this.lights.length) {
                this.lights[0].dispose();
            }

            while (this.meshes.length) {
                this.meshes[0].dispose(true);
            }

            while (this.cameras.length) {
                this.cameras[0].dispose();
            }

            while (this.materials.length) {
                this.materials[0].dispose();
            }

            while (this.particleSystems.length) {
                this.particleSystems[0].dispose();
            }

            while (this.spriteManagers.length) {
                this.spriteManagers[0].dispose();
            }

            while (this.layers.length) {
                this.layers[0].dispose();
            }

            while (this.textures.length) {
                this.textures[0].dispose();
            }

            // Post-processes
            this.postProcessManager.dispose();

            // Physics
            if (this._physicsEngine) {
                this.disablePhysicsEngine();
            }

            // Remove from engine
            index = this._engine.scenes.indexOf(this);
            this._engine.scenes.splice(index, 1);

            this._engine.wipeCaches();
        };

        // Collisions
        Scene.prototype._getNewPosition = function (position, velocity, collider, maximumRetry, finalPosition) {
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);

            collider.retry = 0;
            collider.initialVelocity = this._scaledVelocity;
            collider.initialPosition = this._scaledPosition;
            this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, finalPosition);

            finalPosition.multiplyInPlace(collider.radius);
        };

        Scene.prototype._collideWithWorld = function (position, velocity, collider, maximumRetry, finalPosition) {
            var closeDistance = BABYLON.Engine.CollisionsEpsilon * 10.0;

            if (collider.retry >= maximumRetry) {
                finalPosition.copyFrom(position);
                return;
            }

            collider._initialize(position, velocity, closeDistance);

            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];
                if (mesh.isEnabled() && mesh.checkCollisions) {
                    mesh._checkCollision(collider);
                }
            }

            if (!collider.collisionFound) {
                position.addToRef(velocity, finalPosition);
                return;
            }

            if (velocity.x != 0 || velocity.y != 0 || velocity.z != 0) {
                collider._getResponse(position, velocity);
            }

            if (velocity.length() <= closeDistance) {
                finalPosition.copyFrom(position);
                return;
            }

            collider.retry++;
            this._collideWithWorld(position, velocity, collider, maximumRetry, finalPosition);
        };

        // Octrees
        Scene.prototype.createOrUpdateSelectionOctree = function () {
            if (!this._selectionOctree) {
                this._selectionOctree = new BABYLON.Octree();
            }

            var min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];

                mesh.computeWorldMatrix(true);
                var minBox = mesh.getBoundingInfo().boundingBox.minimumWorld;
                var maxBox = mesh.getBoundingInfo().boundingBox.maximumWorld;

                checkExtends(minBox, min, max);
                checkExtends(maxBox, min, max);
            }

            // Update octree
            this._selectionOctree.update(min, max, this.meshes);
        };

        // Picking
        Scene.prototype.createPickingRay = function (x, y, world, camera) {
            var engine = this._engine;

            if (!camera) {
                if (!this.activeCamera)
                    throw new Error("Active camera not set");

                camera = this.activeCamera;
            }

            var cameraViewport = camera.viewport;
            var viewport = cameraViewport.toGlobal(engine);

            // Moving coordinates to local viewport world
            x = x / this._engine.getHardwareScalingLevel() - viewport.x;
            y = y / this._engine.getHardwareScalingLevel() - (this._engine.getRenderHeight() - viewport.y - viewport.height);

            return BABYLON.Ray.CreateNew(x, y, viewport.width, viewport.height, world ? world : BABYLON.Matrix.Identity(), camera.getViewMatrix(), camera.getProjectionMatrix());
        };

        Scene.prototype._internalPick = function (rayFunction, predicate, fastCheck) {
            var pickingInfo = null;

            for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
                var mesh = this.meshes[meshIndex];

                if (predicate) {
                    if (!predicate(mesh)) {
                        continue;
                    }
                } else if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
                    continue;
                }

                var world = mesh.getWorldMatrix();
                var ray = rayFunction(world);

                var result = mesh.intersects(ray, fastCheck);
                if (!result || !result.hit)
                    continue;

                if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance)
                    continue;

                pickingInfo = result;

                if (fastCheck) {
                    break;
                }
            }

            return pickingInfo || new BABYLON.PickingInfo();
        };

        Scene.prototype.pick = function (x, y, predicate, fastCheck, camera) {
            var _this = this;
            /// <summary>Launch a ray to try to pick a mesh in the scene</summary>
            /// <param name="x">X position on screen</param>
            /// <param name="y">Y position on screen</param>
            /// <param name="predicate">Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true</param>
            /// <param name="fastCheck">Launch a fast check only using the bounding boxes. Can be set to null.</param>
            /// <param name="camera">camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used</param>
            return this._internalPick(function (world) {
                return _this.createPickingRay(x, y, world, camera);
            }, predicate, fastCheck);
        };

        Scene.prototype.pickWithRay = function (ray, predicate, fastCheck) {
            var _this = this;
            return this._internalPick(function (world) {
                if (!_this._pickWithRayInverseMatrix) {
                    _this._pickWithRayInverseMatrix = BABYLON.Matrix.Identity();
                }
                world.invertToRef(_this._pickWithRayInverseMatrix);
                return BABYLON.Ray.Transform(ray, _this._pickWithRayInverseMatrix);
            }, predicate, fastCheck);
        };

        Scene.prototype.setPointerOverMesh = function (mesh) {
            if (this._pointerOverMesh === mesh) {
                return;
            }

            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOutTrigger);
            }

            this._pointerOverMesh = mesh;
            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOverTrigger);
            }
        };

        Scene.prototype.getPointerOverMesh = function () {
            return this._pointerOverMesh;
        };

        // Physics
        Scene.prototype.getPhysicsEngine = function () {
            return this._physicsEngine;
        };

        Scene.prototype.enablePhysics = function (gravity, plugin) {
            if (this._physicsEngine) {
                return true;
            }

            this._physicsEngine = new BABYLON.PhysicsEngine(plugin);

            if (!this._physicsEngine.isSupported()) {
                this._physicsEngine = null;
                return false;
            }

            this._physicsEngine._initialize(gravity);

            return true;
        };

        Scene.prototype.disablePhysicsEngine = function () {
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine.dispose();
            this._physicsEngine = undefined;
        };

        Scene.prototype.isPhysicsEnabled = function () {
            return this._physicsEngine !== undefined;
        };

        Scene.prototype.setGravity = function (gravity) {
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine._setGravity(gravity);
        };

        Scene.prototype.createCompoundImpostor = function (parts, options) {
            if (parts.parts) {
                options = parts;
                parts = parts.parts;
            }

            if (!this._physicsEngine) {
                return null;
            }

            for (var index = 0; index < parts.length; index++) {
                var mesh = parts[index].mesh;

                mesh._physicImpostor = parts[index].impostor;
                mesh._physicsMass = options.mass / parts.length;
                mesh._physicsFriction = options.friction;
                mesh._physicRestitution = options.restitution;
            }

            return this._physicsEngine._registerMeshesAsCompound(parts, options);
        };

        //ANY
        Scene.prototype.deleteCompoundImpostor = function (compound) {
            for (var index = 0; index < compound.parts.length; index++) {
                var mesh = compound.parts[index].mesh;
                mesh._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
                this._physicsEngine._unregisterMesh(mesh);
            }
        };

        // Tags
        Scene.prototype._getByTags = function (list, tagsQuery) {
            if (tagsQuery === undefined) {
                // returns the complete list (could be done with BABYLON.Tags.MatchesQuery but no need to have a for-loop here)
                return list;
            }

            var listByTags = [];

            for (var i in list) {
                var item = list[i];
                if (BABYLON.Tags.MatchesQuery(item, tagsQuery)) {
                    listByTags.push(item);
                }
            }

            return listByTags;
        };

        Scene.prototype.getMeshesByTags = function (tagsQuery) {
            return this._getByTags(this.meshes, tagsQuery);
        };

        Scene.prototype.getCamerasByTags = function (tagsQuery) {
            return this._getByTags(this.cameras, tagsQuery);
        };

        Scene.prototype.getLightsByTags = function (tagsQuery) {
            return this._getByTags(this.lights, tagsQuery);
        };

        Scene.prototype.getMaterialByTags = function (tagsQuery) {
            return this._getByTags(this.materials, tagsQuery).concat(this._getByTags(this.multiMaterials, tagsQuery));
        };
        Scene.FOGMODE_NONE = 0;
        Scene.FOGMODE_EXP = 1;
        Scene.FOGMODE_EXP2 = 2;
        Scene.FOGMODE_LINEAR = 3;
        return Scene;
    })();
    BABYLON.Scene = Scene;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.scene.js.map
