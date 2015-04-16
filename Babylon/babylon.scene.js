var BABYLON;
(function (BABYLON) {
    /**
     * Represents a scene to be rendered by the engine.
     * @see http://doc.babylonjs.com/page.php?p=21911
     */
    var Scene = (function () {
        /**
         * @constructor
         * @param {BABYLON.Engine} engine - the engine to be used to render this scene.
         */
        function Scene(engine) {
            // Members
            this.autoClear = true;
            this.clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
            this.ambientColor = new BABYLON.Color3(0, 0, 0);
            this.forceWireframe = false;
            this.forcePointsCloud = false;
            this.forceShowBoundingBoxes = false;
            this.animationsEnabled = true;
            this.cameraToUseForPointers = null; // Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position
            // Fog
            /**
            * is fog enabled on this scene.
            * @type {boolean}
            */
            this.fogEnabled = true;
            this.fogMode = Scene.FOGMODE_NONE;
            this.fogColor = new BABYLON.Color3(0.2, 0.2, 0.3);
            this.fogDensity = 0.1;
            this.fogStart = 0;
            this.fogEnd = 1000.0;
            // Lights
            /**
            * is shadow enabled on this scene.
            * @type {boolean}
            */
            this.shadowsEnabled = true;
            /**
            * is light enabled on this scene.
            * @type {boolean}
            */
            this.lightsEnabled = true;
            /**
            * All of the lights added to this scene.
            * @see BABYLON.Light
            * @type {BABYLON.Light[]}
            */
            this.lights = new Array();
            // Cameras
            /**
            * All of the cameras added to this scene.
            * @see BABYLON.Camera
            * @type {BABYLON.Camera[]}
            */
            this.cameras = new Array();
            this.activeCameras = new Array();
            // Meshes
            /**
            * All of the (abstract) meshes added to this scene.
            * @see BABYLON.AbstractMesh
            * @type {BABYLON.AbstractMesh[]}
            */
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
            this.spritesEnabled = true;
            this.spriteManagers = new Array();
            // Layers
            this.layers = new Array();
            // Skeletons
            this.skeletonsEnabled = true;
            this.skeletons = new Array();
            // Lens flares
            this.lensFlaresEnabled = true;
            this.lensFlareSystems = new Array();
            // Collisions
            this.collisionsEnabled = true;
            this.gravity = new BABYLON.Vector3(0, -9.0, 0);
            // Postprocesses
            this.postProcessesEnabled = true;
            // Customs render targets
            this.renderTargetsEnabled = true;
            this.dumpNextRenderTargets = false;
            this.customRenderTargets = new Array();
            // Imported meshes
            this.importedMeshesFiles = new Array();
            this._actionManagers = new Array();
            this._meshesForIntersections = new BABYLON.SmartArray(256);
            // Procedural textures
            this.proceduralTexturesEnabled = true;
            this._proceduralTextures = new Array();
            this.soundTracks = new Array();
            this._audioEnabled = true;
            this._headphone = false;
            this._totalVertices = 0;
            this._activeIndices = 0;
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
            this._pendingData = []; //ANY
            this._onBeforeRenderCallbacks = new Array();
            this._onAfterRenderCallbacks = new Array();
            this._activeMeshes = new BABYLON.SmartArray(256);
            this._processedMaterials = new BABYLON.SmartArray(256);
            this._renderTargets = new BABYLON.SmartArray(256);
            this._activeParticleSystems = new BABYLON.SmartArray(256);
            this._activeSkeletons = new BABYLON.SmartArray(32);
            this._activeBones = 0;
            this._activeAnimatables = new Array();
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._scaledPosition = BABYLON.Vector3.Zero();
            this._scaledVelocity = BABYLON.Vector3.Zero();
            this._uniqueIdCounter = 0;
            this._engine = engine;
            engine.scenes.push(this);
            this._renderingManager = new BABYLON.RenderingManager(this);
            this.postProcessManager = new BABYLON.PostProcessManager(this);
            this.postProcessRenderPipelineManager = new BABYLON.PostProcessRenderPipelineManager();
            this._boundingBoxRenderer = new BABYLON.BoundingBoxRenderer(this);
            this._outlineRenderer = new BABYLON.OutlineRenderer(this);
            this.attachControl();
            this._debugLayer = new BABYLON.DebugLayer(this);
            this.mainSoundTrack = new BABYLON.SoundTrack(this, { mainTrack: true });
            //simplification queue
            this.simplificationQueue = new BABYLON.SimplificationQueue();
        }
        Object.defineProperty(Scene, "FOGMODE_NONE", {
            get: function () {
                return Scene._FOGMODE_NONE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene, "FOGMODE_EXP", {
            get: function () {
                return Scene._FOGMODE_EXP;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene, "FOGMODE_EXP2", {
            get: function () {
                return Scene._FOGMODE_EXP2;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene, "FOGMODE_LINEAR", {
            get: function () {
                return Scene._FOGMODE_LINEAR;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "debugLayer", {
            // Properties 
            get: function () {
                return this._debugLayer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "meshUnderPointer", {
            /**
             * The mesh that is currently under the pointer.
             * @return {BABYLON.AbstractMesh} mesh under the pointer/mouse cursor or null if none.
             */
            get: function () {
                return this._meshUnderPointer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "pointerX", {
            /**
             * Current on-screen X position of the pointer
             * @return {number} X position of the pointer
             */
            get: function () {
                return this._pointerX;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "pointerY", {
            /**
             * Current on-screen Y position of the pointer
             * @return {number} Y position of the pointer
             */
            get: function () {
                return this._pointerY;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getCachedMaterial = function () {
            return this._cachedMaterial;
        };
        Scene.prototype.getBoundingBoxRenderer = function () {
            return this._boundingBoxRenderer;
        };
        Scene.prototype.getOutlineRenderer = function () {
            return this._outlineRenderer;
        };
        Scene.prototype.getEngine = function () {
            return this._engine;
        };
        Scene.prototype.getTotalVertices = function () {
            return this._totalVertices;
        };
        Scene.prototype.getActiveIndices = function () {
            return this._activeIndices;
        };
        Scene.prototype.getActiveParticles = function () {
            return this._activeParticles;
        };
        Scene.prototype.getActiveBones = function () {
            return this._activeBones;
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
        Scene.prototype.incrementRenderId = function () {
            this._renderId++;
        };
        Scene.prototype._updatePointerPosition = function (evt) {
            var canvasRect = this._engine.getRenderingCanvasClientRect();
            this._pointerX = evt.clientX - canvasRect.left;
            this._pointerY = evt.clientY - canvasRect.top;
            if (this.cameraToUseForPointers) {
                this._pointerX = this._pointerX - this.cameraToUseForPointers.viewport.x * this._engine.getRenderWidth();
                this._pointerY = this._pointerY - this.cameraToUseForPointers.viewport.y * this._engine.getRenderHeight();
            }
        };
        // Pointers handling
        Scene.prototype.attachControl = function () {
            var _this = this;
            this._onPointerMove = function (evt) {
                var canvas = _this._engine.getRenderingCanvas();
                _this._updatePointerPosition(evt);
                var pickResult = _this.pick(_this._pointerX, _this._pointerY, function (mesh) { return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.actionManager && mesh.actionManager.hasPointerTriggers; }, false, _this.cameraToUseForPointers);
                if (pickResult.hit) {
                    _this._meshUnderPointer = pickResult.pickedMesh;
                    _this.setPointerOverMesh(pickResult.pickedMesh);
                    canvas.style.cursor = "pointer";
                }
                else {
                    _this.setPointerOverMesh(null);
                    canvas.style.cursor = "";
                    _this._meshUnderPointer = null;
                }
            };
            this._onPointerDown = function (evt) {
                var predicate = null;
                if (!_this.onPointerDown) {
                    predicate = function (mesh) {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.actionManager && mesh.actionManager.hasPickTriggers;
                    };
                }
                _this._updatePointerPosition(evt);
                var pickResult = _this.pick(_this._pointerX, _this._pointerY, predicate, false, _this.cameraToUseForPointers);
                if (pickResult.hit) {
                    if (pickResult.pickedMesh.actionManager) {
                        switch (evt.button) {
                            case 0:
                                pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnLeftPickTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                break;
                            case 1:
                                pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnCenterPickTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                break;
                            case 2:
                                pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnRightPickTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                break;
                        }
                        pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                    }
                }
                if (_this.onPointerDown) {
                    _this.onPointerDown(evt, pickResult);
                }
            };
            this._onKeyDown = function (evt) {
                if (_this.actionManager) {
                    _this.actionManager.processTrigger(BABYLON.ActionManager.OnKeyDownTrigger, BABYLON.ActionEvent.CreateNewFromScene(_this, evt));
                }
            };
            this._onKeyUp = function (evt) {
                if (_this.actionManager) {
                    _this.actionManager.processTrigger(BABYLON.ActionManager.OnKeyUpTrigger, BABYLON.ActionEvent.CreateNewFromScene(_this, evt));
                }
            };
            var eventPrefix = BABYLON.Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "move", this._onPointerMove, false);
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "down", this._onPointerDown, false);
            BABYLON.Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp }
            ]);
        };
        Scene.prototype.detachControl = function () {
            var eventPrefix = BABYLON.Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "move", this._onPointerMove);
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "down", this._onPointerDown);
            BABYLON.Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp }
            ]);
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
        Scene.prototype.resetCachedMaterial = function () {
            this._cachedMaterial = null;
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
        Scene.prototype.registerAfterRender = function (func) {
            this._onAfterRenderCallbacks.push(func);
        };
        Scene.prototype.unregisterAfterRender = function (func) {
            var index = this._onAfterRenderCallbacks.indexOf(func);
            if (index > -1) {
                this._onAfterRenderCallbacks.splice(index, 1);
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
        /**
         * Registers a function to be executed when the scene is ready.
         * @param {Function} func - the function to be executed.
         */
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
        /**
         * Will start the animation sequence of a given target
         * @param target - the target
         * @param {number} from - from which frame should animation start
         * @param {number} to - till which frame should animation run.
         * @param {boolean} [loop] - should the animation loop
         * @param {number} [speedRatio] - the speed in which to run the animation
         * @param {Function} [onAnimationEnd] function to be executed when the animation ended.
         * @param {BABYLON.Animatable} [animatable] an animatable object. If not provided a new one will be created from the given params.
         * @return {BABYLON.Animatable} the animatable object created for this animation
         * @see BABYLON.Animatable
         * @see http://doc.babylonjs.com/page.php?p=22081
         */
        Scene.prototype.beginAnimation = function (target, from, to, loop, speedRatio, onAnimationEnd, animatable) {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }
            this.stopAnimation(target);
            if (!animatable) {
                animatable = new BABYLON.Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd);
            }
            // Local animations
            if (target.animations) {
                animatable.appendAnimations(target, target.animations);
            }
            // Children animations
            if (target.getAnimatables) {
                var animatables = target.getAnimatables();
                for (var index = 0; index < animatables.length; index++) {
                    this.beginAnimation(animatables[index], from, to, loop, speedRatio, onAnimationEnd, animatable);
                }
            }
            return animatable;
        };
        Scene.prototype.beginDirectAnimation = function (target, animations, from, to, loop, speedRatio, onAnimationEnd) {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }
            var animatable = new BABYLON.Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, animations);
            return animatable;
        };
        Scene.prototype.getAnimatableByTarget = function (target) {
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    return this._activeAnimatables[index];
                }
            }
            return null;
        };
        /**
         * Will stop the animation of the given target
         * @param target - the target
         * @see beginAnimation
         */
        Scene.prototype.stopAnimation = function (target) {
            var animatable = this.getAnimatableByTarget(target);
            if (animatable) {
                animatable.stop();
            }
        };
        Scene.prototype._animate = function () {
            if (!this.animationsEnabled) {
                return;
            }
            if (!this._animationStartDate) {
                this._animationStartDate = BABYLON.Tools.Now;
            }
            // Getting time
            var now = BABYLON.Tools.Now;
            var delay = now - this._animationStartDate;
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                this._activeAnimatables[index]._animate(delay);
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
        Scene.prototype.addMesh = function (newMesh) {
            newMesh.uniqueId = this._uniqueIdCounter++;
            var position = this.meshes.push(newMesh);
            if (this.onNewMeshAdded) {
                this.onNewMeshAdded(newMesh, position, this);
            }
        };
        Scene.prototype.removeMesh = function (toRemove) {
            var index = this.meshes.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.meshes.splice(index, 1);
            }
            if (this.onMeshRemoved) {
                this.onMeshRemoved(toRemove);
            }
            return index;
        };
        Scene.prototype.removeLight = function (toRemove) {
            var index = this.lights.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.lights.splice(index, 1);
            }
            if (this.onLightRemoved) {
                this.onLightRemoved(toRemove);
            }
            return index;
        };
        Scene.prototype.removeCamera = function (toRemove) {
            var index = this.cameras.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.cameras.splice(index, 1);
            }
            // Remove from activeCameras
            var index2 = this.activeCameras.indexOf(toRemove);
            if (index2 !== -1) {
                // Remove from the scene if mesh found
                this.activeCameras.splice(index2, 1);
            }
            // Reset the activeCamera
            if (this.activeCamera === toRemove) {
                if (this.cameras.length > 0) {
                    this.activeCamera = this.cameras[0];
                }
                else {
                    this.activeCamera = null;
                }
            }
            if (this.onCameraRemoved) {
                this.onCameraRemoved(toRemove);
            }
            return index;
        };
        Scene.prototype.addLight = function (newLight) {
            newLight.uniqueId = this._uniqueIdCounter++;
            var position = this.lights.push(newLight);
            if (this.onNewLightAdded) {
                this.onNewLightAdded(newLight, position, this);
            }
        };
        Scene.prototype.addCamera = function (newCamera) {
            newCamera.uniqueId = this._uniqueIdCounter++;
            var position = this.cameras.push(newCamera);
            if (this.onNewCameraAdded) {
                this.onNewCameraAdded(newCamera, position, this);
            }
        };
        /**
         * sets the active camera of the scene using its ID
         * @param {string} id - the camera's ID
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        Scene.prototype.setActiveCameraByID = function (id) {
            var camera = this.getCameraByID(id);
            if (camera) {
                this.activeCamera = camera;
                return camera;
            }
            return null;
        };
        /**
         * sets the active camera of the scene using its name
         * @param {string} name - the camera's name
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        Scene.prototype.setActiveCameraByName = function (name) {
            var camera = this.getCameraByName(name);
            if (camera) {
                this.activeCamera = camera;
                return camera;
            }
            return null;
        };
        /**
         * get a material using its id
         * @param {string} the material's ID
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        Scene.prototype.getMaterialByID = function (id) {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].id === id) {
                    return this.materials[index];
                }
            }
            return null;
        };
        /**
         * get a material using its name
         * @param {string} the material's name
         * @return {BABYLON.Material|null} the material or null if none found.
         */
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
        Scene.prototype.getCameraByUniqueID = function (uniqueId) {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].uniqueId === uniqueId) {
                    return this.cameras[index];
                }
            }
            return null;
        };
        /**
         * get a camera using its name
         * @param {string} the camera's name
         * @return {BABYLON.Camera|null} the camera or null if none found.
         */
        Scene.prototype.getCameraByName = function (name) {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].name === name) {
                    return this.cameras[index];
                }
            }
            return null;
        };
        /**
         * get a light node using its name
         * @param {string} the light's name
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        Scene.prototype.getLightByName = function (name) {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].name === name) {
                    return this.lights[index];
                }
            }
            return null;
        };
        /**
         * get a light node using its ID
         * @param {string} the light's id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        Scene.prototype.getLightByID = function (id) {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].id === id) {
                    return this.lights[index];
                }
            }
            return null;
        };
        /**
         * get a light node using its scene-generated unique ID
         * @param {number} the light's unique id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        Scene.prototype.getLightByUniqueID = function (uniqueId) {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].uniqueId === uniqueId) {
                    return this.lights[index];
                }
            }
            return null;
        };
        /**
         * get a geometry using its ID
         * @param {string} the geometry's id
         * @return {BABYLON.Geometry|null} the geometry or null if none found.
         */
        Scene.prototype.getGeometryByID = function (id) {
            for (var index = 0; index < this._geometries.length; index++) {
                if (this._geometries[index].id === id) {
                    return this._geometries[index];
                }
            }
            return null;
        };
        /**
         * add a new geometry to this scene.
         * @param {BABYLON.Geometry} geometry - the geometry to be added to the scene.
         * @param {boolean} [force] - force addition, even if a geometry with this ID already exists
         * @return {boolean} was the geometry added or not
         */
        Scene.prototype.pushGeometry = function (geometry, force) {
            if (!force && this.getGeometryByID(geometry.id)) {
                return false;
            }
            this._geometries.push(geometry);
            if (this.onGeometryAdded) {
                this.onGeometryAdded(geometry);
            }
            return true;
        };
        /**
         * Removes an existing geometry
         * @param {BABYLON.Geometry} geometry - the geometry to be removed from the scene.
         * @return {boolean} was the geometry removed or not
         */
        Scene.prototype.removeGeometry = function (geometry) {
            var index = this._geometries.indexOf(geometry);
            if (index > -1) {
                this._geometries.splice(index, 1);
                if (this.onGeometryRemoved) {
                    this.onGeometryRemoved(geometry);
                }
                return true;
            }
            return false;
        };
        Scene.prototype.getGeometries = function () {
            return this._geometries;
        };
        /**
         * Get the first added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        Scene.prototype.getMeshByID = function (id) {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }
            return null;
        };
        /**
         * Get a mesh with its auto-generated unique id
         * @param {number} uniqueId - the unique id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        Scene.prototype.getMeshByUniqueID = function (uniqueId) {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].uniqueId === uniqueId) {
                    return this.meshes[index];
                }
            }
            return null;
        };
        /**
         * Get a the last added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        Scene.prototype.getLastMeshByID = function (id) {
            for (var index = this.meshes.length - 1; index >= 0; index--) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }
            return null;
        };
        /**
         * Get a the last added node (Mesh, Camera, Light) found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.Node|null} the node found or null if not found at all.
         */
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
        Scene.prototype.getNodeByName = function (name) {
            var mesh = this.getMeshByName(name);
            if (mesh) {
                return mesh;
            }
            var light = this.getLightByName(name);
            if (light) {
                return light;
            }
            return this.getCameraByName(name);
        };
        Scene.prototype.getMeshByName = function (name) {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].name === name) {
                    return this.meshes[index];
                }
            }
            return null;
        };
        Scene.prototype.getSoundByName = function (name) {
            for (var index = 0; index < this.mainSoundTrack.soundCollection.length; index++) {
                if (this.mainSoundTrack.soundCollection[index].name === name) {
                    return this.mainSoundTrack.soundCollection[index];
                }
            }
            for (var sdIndex = 0; sdIndex < this.soundTracks.length; sdIndex++) {
                for (index = 0; index < this.soundTracks[sdIndex].soundCollection.length; index++) {
                    if (this.soundTracks[sdIndex].soundCollection[index].name === name) {
                        return this.soundTracks[sdIndex].soundCollection[index];
                    }
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
            if (mesh.subMeshes.length === 1 || subMesh.isInFrustum(this._frustumPlanes)) {
                var material = subMesh.getMaterial();
                if (mesh.showSubMeshesBoundingBox) {
                    this._boundingBoxRenderer.renderList.push(subMesh.getBoundingInfo().boundingBox);
                }
                if (material) {
                    // Render targets
                    if (material.getRenderTargetTextures) {
                        if (this._processedMaterials.indexOf(material) === -1) {
                            this._processedMaterials.push(material);
                            this._renderTargets.concat(material.getRenderTargetTextures());
                        }
                    }
                    // Dispatch
                    this._activeIndices += subMesh.indexCount;
                    this._renderingManager.dispatch(subMesh);
                }
            }
        };
        Scene.prototype._evaluateActiveMeshes = function () {
            this.activeCamera._activeMeshes.reset();
            this._activeMeshes.reset();
            this._renderingManager.reset();
            this._processedMaterials.reset();
            this._activeParticleSystems.reset();
            this._activeSkeletons.reset();
            this._boundingBoxRenderer.reset();
            if (!this._frustumPlanes) {
                this._frustumPlanes = BABYLON.Frustum.GetPlanes(this._transformMatrix);
            }
            else {
                BABYLON.Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }
            // Meshes
            var meshes;
            var len;
            if (this._selectionOctree) {
                var selection = this._selectionOctree.select(this._frustumPlanes);
                meshes = selection.data;
                len = selection.length;
            }
            else {
                len = this.meshes.length;
                meshes = this.meshes;
            }
            for (var meshIndex = 0; meshIndex < len; meshIndex++) {
                var mesh = meshes[meshIndex];
                if (mesh.isBlocked) {
                    continue;
                }
                this._totalVertices += mesh.getTotalVertices();
                if (!mesh.isReady()) {
                    continue;
                }
                mesh.computeWorldMatrix();
                // Intersections
                if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers([BABYLON.ActionManager.OnIntersectionEnterTrigger, BABYLON.ActionManager.OnIntersectionExitTrigger])) {
                    this._meshesForIntersections.pushNoDuplicate(mesh);
                }
                // Switch to current LOD
                var meshLOD = mesh.getLOD(this.activeCamera);
                if (!meshLOD) {
                    continue;
                }
                mesh._preActivate();
                if (mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && ((mesh.layerMask & this.activeCamera.layerMask) !== 0) && mesh.isInFrustum(this._frustumPlanes)) {
                    this._activeMeshes.push(mesh);
                    this.activeCamera._activeMeshes.push(mesh);
                    mesh._activate(this._renderId);
                    this._activeMesh(meshLOD);
                }
            }
            // Particle systems
            var beforeParticlesDate = BABYLON.Tools.Now;
            if (this.particlesEnabled) {
                BABYLON.Tools.StartPerformanceCounter("Particles", this.particleSystems.length > 0);
                for (var particleIndex = 0; particleIndex < this.particleSystems.length; particleIndex++) {
                    var particleSystem = this.particleSystems[particleIndex];
                    if (!particleSystem.isStarted()) {
                        continue;
                    }
                    if (!particleSystem.emitter.position || (particleSystem.emitter && particleSystem.emitter.isEnabled())) {
                        this._activeParticleSystems.push(particleSystem);
                        particleSystem.animate();
                    }
                }
                BABYLON.Tools.EndPerformanceCounter("Particles", this.particleSystems.length > 0);
            }
            this._particlesDuration += BABYLON.Tools.Now - beforeParticlesDate;
        };
        Scene.prototype._activeMesh = function (mesh) {
            if (mesh.skeleton && this.skeletonsEnabled) {
                this._activeSkeletons.pushNoDuplicate(mesh.skeleton);
            }
            if (mesh.showBoundingBox || this.forceShowBoundingBoxes) {
                this._boundingBoxRenderer.renderList.push(mesh.getBoundingInfo().boundingBox);
            }
            if (mesh && mesh.subMeshes) {
                // Submeshes Octrees
                var len;
                var subMeshes;
                if (mesh._submeshesOctree && mesh.useOctreeForRenderingSelection) {
                    var intersections = mesh._submeshesOctree.select(this._frustumPlanes);
                    len = intersections.length;
                    subMeshes = intersections.data;
                }
                else {
                    subMeshes = mesh.subMeshes;
                    len = subMeshes.length;
                }
                for (var subIndex = 0; subIndex < len; subIndex++) {
                    var subMesh = subMeshes[subIndex];
                    this._evaluateSubMesh(subMesh, mesh);
                }
            }
        };
        Scene.prototype.updateTransformMatrix = function (force) {
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(force));
        };
        Scene.prototype._renderForCamera = function (camera) {
            var engine = this._engine;
            this.activeCamera = camera;
            if (!this.activeCamera)
                throw new Error("Active camera not set");
            BABYLON.Tools.StartPerformanceCounter("Rendering camera " + this.activeCamera.name);
            // Viewport
            engine.setViewport(this.activeCamera.viewport);
            // Camera
            this._renderId++;
            this.updateTransformMatrix();
            if (this.beforeCameraRender) {
                this.beforeCameraRender(this.activeCamera);
            }
            // Meshes
            var beforeEvaluateActiveMeshesDate = BABYLON.Tools.Now;
            BABYLON.Tools.StartPerformanceCounter("Active meshes evaluation");
            this._evaluateActiveMeshes();
            this._evaluateActiveMeshesDuration += BABYLON.Tools.Now - beforeEvaluateActiveMeshesDate;
            BABYLON.Tools.EndPerformanceCounter("Active meshes evaluation");
            for (var skeletonIndex = 0; skeletonIndex < this._activeSkeletons.length; skeletonIndex++) {
                var skeleton = this._activeSkeletons.data[skeletonIndex];
                skeleton.prepare();
            }
            // Render targets
            var beforeRenderTargetDate = BABYLON.Tools.Now;
            if (this.renderTargetsEnabled) {
                BABYLON.Tools.StartPerformanceCounter("Render targets", this._renderTargets.length > 0);
                for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    var renderTarget = this._renderTargets.data[renderIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        var hasSpecialRenderTargetCamera = renderTarget.activeCamera && renderTarget.activeCamera !== this.activeCamera;
                        renderTarget.render(hasSpecialRenderTargetCamera, this.dumpNextRenderTargets);
                    }
                }
                BABYLON.Tools.EndPerformanceCounter("Render targets", this._renderTargets.length > 0);
                this._renderId++;
            }
            if (this._renderTargets.length > 0) {
                engine.restoreDefaultFramebuffer();
            }
            this._renderTargetsDuration += BABYLON.Tools.Now - beforeRenderTargetDate;
            // Prepare Frame
            this.postProcessManager._prepareFrame();
            var beforeRenderDate = BABYLON.Tools.Now;
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
            BABYLON.Tools.StartPerformanceCounter("Main render");
            this._renderingManager.render(null, null, true, true);
            BABYLON.Tools.EndPerformanceCounter("Main render");
            // Bounding boxes
            this._boundingBoxRenderer.render();
            // Lens flares
            if (this.lensFlaresEnabled) {
                BABYLON.Tools.StartPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
                for (var lensFlareSystemIndex = 0; lensFlareSystemIndex < this.lensFlareSystems.length; lensFlareSystemIndex++) {
                    this.lensFlareSystems[lensFlareSystemIndex].render();
                }
                BABYLON.Tools.EndPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
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
            this._renderDuration += BABYLON.Tools.Now - beforeRenderDate;
            // Finalize frame
            this.postProcessManager._finalizeFrame(camera.isIntermediate);
            // Update camera
            this.activeCamera._updateFromScene();
            // Reset some special arrays
            this._renderTargets.reset();
            if (this.afterCameraRender) {
                this.afterCameraRender(this.activeCamera);
            }
            BABYLON.Tools.EndPerformanceCounter("Rendering camera " + this.activeCamera.name);
        };
        Scene.prototype._processSubCameras = function (camera) {
            if (camera.subCameras.length === 0) {
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
        Scene.prototype._checkIntersections = function () {
            for (var index = 0; index < this._meshesForIntersections.length; index++) {
                var sourceMesh = this._meshesForIntersections.data[index];
                for (var actionIndex = 0; actionIndex < sourceMesh.actionManager.actions.length; actionIndex++) {
                    var action = sourceMesh.actionManager.actions[actionIndex];
                    if (action.trigger === BABYLON.ActionManager.OnIntersectionEnterTrigger || action.trigger === BABYLON.ActionManager.OnIntersectionExitTrigger) {
                        var parameters = action.getTriggerParameter();
                        var otherMesh = parameters instanceof BABYLON.AbstractMesh ? parameters : parameters.mesh;
                        var areIntersecting = otherMesh.intersectsMesh(sourceMesh, parameters.usePreciseIntersection);
                        var currentIntersectionInProgress = sourceMesh._intersectionsInProgress.indexOf(otherMesh);
                        if (areIntersecting && currentIntersectionInProgress === -1) {
                            if (action.trigger === BABYLON.ActionManager.OnIntersectionEnterTrigger) {
                                action._executeCurrent(BABYLON.ActionEvent.CreateNew(sourceMesh));
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            }
                            else if (action.trigger === BABYLON.ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            }
                        }
                        else if (!areIntersecting && currentIntersectionInProgress > -1 && action.trigger === BABYLON.ActionManager.OnIntersectionExitTrigger) {
                            action._executeCurrent(BABYLON.ActionEvent.CreateNew(sourceMesh));
                            var indexOfOther = sourceMesh._intersectionsInProgress.indexOf(otherMesh);
                            if (indexOfOther > -1) {
                                sourceMesh._intersectionsInProgress.splice(indexOfOther, 1);
                            }
                        }
                    }
                }
            }
        };
        Scene.prototype.render = function () {
            var startDate = BABYLON.Tools.Now;
            this._particlesDuration = 0;
            this._spritesDuration = 0;
            this._activeParticles = 0;
            this._renderDuration = 0;
            this._renderTargetsDuration = 0;
            this._evaluateActiveMeshesDuration = 0;
            this._totalVertices = 0;
            this._activeIndices = 0;
            this._activeBones = 0;
            this.getEngine().resetDrawCalls();
            this._meshesForIntersections.reset();
            this.resetCachedMaterial();
            BABYLON.Tools.StartPerformanceCounter("Scene rendering");
            // Actions
            if (this.actionManager) {
                this.actionManager.processTrigger(BABYLON.ActionManager.OnEveryFrameTrigger, null);
            }
            //Simplification Queue
            if (!this.simplificationQueue.running) {
                this.simplificationQueue.executeNext();
            }
            // Before render
            if (this.beforeRender) {
                this.beforeRender();
            }
            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }
            // Animations
            var deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime));
            this._animationRatio = deltaTime * (60.0 / 1000.0);
            this._animate();
            // Physics
            if (this._physicsEngine) {
                BABYLON.Tools.StartPerformanceCounter("Physics");
                this._physicsEngine._runOneStep(deltaTime / 1000.0);
                BABYLON.Tools.EndPerformanceCounter("Physics");
            }
            // Customs render targets
            var beforeRenderTargetDate = BABYLON.Tools.Now;
            var engine = this.getEngine();
            var currentActiveCamera = this.activeCamera;
            if (this.renderTargetsEnabled) {
                BABYLON.Tools.StartPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
                for (var customIndex = 0; customIndex < this.customRenderTargets.length; customIndex++) {
                    var renderTarget = this.customRenderTargets[customIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        this.activeCamera = renderTarget.activeCamera || this.activeCamera;
                        if (!this.activeCamera)
                            throw new Error("Active camera not set");
                        // Viewport
                        engine.setViewport(this.activeCamera.viewport);
                        // Camera
                        this.updateTransformMatrix();
                        renderTarget.render(currentActiveCamera !== this.activeCamera, this.dumpNextRenderTargets);
                    }
                }
                BABYLON.Tools.EndPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
                this._renderId++;
            }
            if (this.customRenderTargets.length > 0) {
                engine.restoreDefaultFramebuffer();
            }
            this._renderTargetsDuration += BABYLON.Tools.Now - beforeRenderTargetDate;
            this.activeCamera = currentActiveCamera;
            // Procedural textures
            if (this.proceduralTexturesEnabled) {
                BABYLON.Tools.StartPerformanceCounter("Procedural textures", this._proceduralTextures.length > 0);
                for (var proceduralIndex = 0; proceduralIndex < this._proceduralTextures.length; proceduralIndex++) {
                    var proceduralTexture = this._proceduralTextures[proceduralIndex];
                    if (proceduralTexture._shouldRender()) {
                        proceduralTexture.render();
                    }
                }
                BABYLON.Tools.EndPerformanceCounter("Procedural textures", this._proceduralTextures.length > 0);
            }
            // Clear
            this._engine.clear(this.clearColor, this.autoClear || this.forceWireframe || this.forcePointsCloud, true);
            // Shadows
            if (this.shadowsEnabled) {
                for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
                    var light = this.lights[lightIndex];
                    var shadowGenerator = light.getShadowGenerator();
                    if (light.isEnabled() && shadowGenerator && shadowGenerator.getShadowMap().getScene().textures.indexOf(shadowGenerator.getShadowMap()) !== -1) {
                        this._renderTargets.push(shadowGenerator.getShadowMap());
                    }
                }
            }
            // Depth renderer
            if (this._depthRenderer) {
                this._renderTargets.push(this._depthRenderer.getDepthMap());
            }
            // RenderPipeline
            this.postProcessRenderPipelineManager.update();
            // Multi-cameras?
            if (this.activeCameras.length > 0) {
                var currentRenderId = this._renderId;
                for (var cameraIndex = 0; cameraIndex < this.activeCameras.length; cameraIndex++) {
                    this._renderId = currentRenderId;
                    this._processSubCameras(this.activeCameras[cameraIndex]);
                }
            }
            else {
                if (!this.activeCamera) {
                    throw new Error("No camera defined");
                }
                this._processSubCameras(this.activeCamera);
            }
            // Intersection checks
            this._checkIntersections();
            // Update the audio listener attached to the camera
            this._updateAudioParameters();
            // After render
            if (this.afterRender) {
                this.afterRender();
            }
            for (callbackIndex = 0; callbackIndex < this._onAfterRenderCallbacks.length; callbackIndex++) {
                this._onAfterRenderCallbacks[callbackIndex]();
            }
            for (var index = 0; index < this._toBeDisposed.length; index++) {
                this._toBeDisposed.data[index].dispose();
                this._toBeDisposed[index] = null;
            }
            this._toBeDisposed.reset();
            if (this.dumpNextRenderTargets) {
                this.dumpNextRenderTargets = false;
            }
            BABYLON.Tools.EndPerformanceCounter("Scene rendering");
            this._lastFrameDuration = BABYLON.Tools.Now - startDate;
        };
        Scene.prototype._updateAudioParameters = function () {
            if (!this.audioEnabled || (this.mainSoundTrack.soundCollection.length === 0 && this.soundTracks.length === 0)) {
                return;
            }
            var listeningCamera;
            var audioEngine = BABYLON.Engine.audioEngine;
            if (this.activeCameras.length > 0) {
                listeningCamera = this.activeCameras[0];
            }
            else {
                listeningCamera = this.activeCamera;
            }
            if (listeningCamera && audioEngine.canUseWebAudio) {
                audioEngine.audioContext.listener.setPosition(listeningCamera.position.x, listeningCamera.position.y, listeningCamera.position.z);
                var mat = BABYLON.Matrix.Invert(listeningCamera.getViewMatrix());
                var cameraDirection = BABYLON.Vector3.TransformNormal(new BABYLON.Vector3(0, 0, -1), mat);
                cameraDirection.normalize();
                audioEngine.audioContext.listener.setOrientation(cameraDirection.x, cameraDirection.y, cameraDirection.z, 0, 1, 0);
                for (var i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                    var sound = this.mainSoundTrack.soundCollection[i];
                    if (sound.useCustomAttenuation) {
                        sound.updateDistanceFromListener();
                    }
                }
                for (i = 0; i < this.soundTracks.length; i++) {
                    for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                        sound = this.soundTracks[i].soundCollection[j];
                        if (sound.useCustomAttenuation) {
                            sound.updateDistanceFromListener();
                        }
                    }
                }
            }
        };
        Object.defineProperty(Scene.prototype, "audioEnabled", {
            // Audio
            get: function () {
                return this._audioEnabled;
            },
            set: function (value) {
                this._audioEnabled = value;
                if (this._audioEnabled) {
                    this._enableAudio();
                }
                else {
                    this._disableAudio();
                }
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype._disableAudio = function () {
            for (var i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                this.mainSoundTrack.soundCollection[i].pause();
            }
            for (i = 0; i < this.soundTracks.length; i++) {
                for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                    this.soundTracks[i].soundCollection[j].pause();
                }
            }
        };
        Scene.prototype._enableAudio = function () {
            for (var i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                if (this.mainSoundTrack.soundCollection[i].isPaused) {
                    this.mainSoundTrack.soundCollection[i].play();
                }
            }
            for (i = 0; i < this.soundTracks.length; i++) {
                for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                    if (this.soundTracks[i].soundCollection[j].isPaused) {
                        this.soundTracks[i].soundCollection[j].play();
                    }
                }
            }
        };
        Object.defineProperty(Scene.prototype, "headphone", {
            get: function () {
                return this._headphone;
            },
            set: function (value) {
                this._headphone = value;
                if (this._headphone) {
                    this._switchAudioModeForHeadphones();
                }
                else {
                    this._switchAudioModeForNormalSpeakers();
                }
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype._switchAudioModeForHeadphones = function () {
            this.mainSoundTrack.switchPanningModelToHRTF();
            for (var i = 0; i < this.soundTracks.length; i++) {
                this.soundTracks[i].switchPanningModelToHRTF();
            }
        };
        Scene.prototype._switchAudioModeForNormalSpeakers = function () {
            this.mainSoundTrack.switchPanningModelToEqualPower();
            for (var i = 0; i < this.soundTracks.length; i++) {
                this.soundTracks[i].switchPanningModelToEqualPower();
            }
        };
        Scene.prototype.enableDepthRenderer = function () {
            if (this._depthRenderer) {
                return this._depthRenderer;
            }
            this._depthRenderer = new BABYLON.DepthRenderer(this);
            return this._depthRenderer;
        };
        Scene.prototype.disableDepthRenderer = function () {
            if (!this._depthRenderer) {
                return;
            }
            this._depthRenderer.dispose();
            this._depthRenderer = null;
        };
        Scene.prototype.dispose = function () {
            this.beforeRender = null;
            this.afterRender = null;
            this.skeletons = [];
            this._boundingBoxRenderer.dispose();
            if (this._depthRenderer) {
                this._depthRenderer.dispose();
            }
            // Debug layer
            this.debugLayer.hide();
            // Events
            if (this.onDispose) {
                this.onDispose();
            }
            this._onBeforeRenderCallbacks = [];
            this._onAfterRenderCallbacks = [];
            this.detachControl();
            // Release sounds & sounds tracks
            this.disposeSounds();
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
            if (index > -1) {
                this._engine.scenes.splice(index, 1);
            }
            this._engine.wipeCaches();
        };
        // Release sounds & sounds tracks
        Scene.prototype.disposeSounds = function () {
            this.mainSoundTrack.dispose();
            for (var scIndex = 0; scIndex < this.soundTracks.length; scIndex++) {
                this.soundTracks[scIndex].dispose();
            }
        };
        // Collisions
        Scene.prototype._getNewPosition = function (position, velocity, collider, maximumRetry, finalPosition, excludedMesh) {
            if (excludedMesh === void 0) { excludedMesh = null; }
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);
            collider.retry = 0;
            collider.initialVelocity = this._scaledVelocity;
            collider.initialPosition = this._scaledPosition;
            this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, finalPosition, excludedMesh);
            finalPosition.multiplyInPlace(collider.radius);
        };
        Scene.prototype._collideWithWorld = function (position, velocity, collider, maximumRetry, finalPosition, excludedMesh) {
            if (excludedMesh === void 0) { excludedMesh = null; }
            var closeDistance = BABYLON.Engine.CollisionsEpsilon * 10.0;
            if (collider.retry >= maximumRetry) {
                finalPosition.copyFrom(position);
                return;
            }
            collider._initialize(position, velocity, closeDistance);
            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];
                if (mesh.isEnabled() && mesh.checkCollisions && mesh.subMeshes && mesh !== excludedMesh) {
                    mesh._checkCollision(collider);
                }
            }
            if (!collider.collisionFound) {
                position.addToRef(velocity, finalPosition);
                return;
            }
            if (velocity.x !== 0 || velocity.y !== 0 || velocity.z !== 0) {
                collider._getResponse(position, velocity);
            }
            if (velocity.length() <= closeDistance) {
                finalPosition.copyFrom(position);
                return;
            }
            collider.retry++;
            this._collideWithWorld(position, velocity, collider, maximumRetry, finalPosition, excludedMesh);
        };
        // Octrees
        Scene.prototype.getWorldExtends = function () {
            var min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];
                mesh.computeWorldMatrix(true);
                var minBox = mesh.getBoundingInfo().boundingBox.minimumWorld;
                var maxBox = mesh.getBoundingInfo().boundingBox.maximumWorld;
                BABYLON.Tools.CheckExtends(minBox, min, max);
                BABYLON.Tools.CheckExtends(maxBox, min, max);
            }
            return {
                min: min,
                max: max
            };
        };
        Scene.prototype.createOrUpdateSelectionOctree = function (maxCapacity, maxDepth) {
            if (maxCapacity === void 0) { maxCapacity = 64; }
            if (maxDepth === void 0) { maxDepth = 2; }
            if (!this._selectionOctree) {
                this._selectionOctree = new BABYLON.Octree(BABYLON.Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
            }
            var worldExtends = this.getWorldExtends();
            // Update octree
            this._selectionOctree.update(worldExtends.min, worldExtends.max, this.meshes);
            return this._selectionOctree;
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
            //       return BABYLON.Ray.CreateNew(x / window.devicePixelRatio, y / window.devicePixelRatio, viewport.width, viewport.height, world ? world : BABYLON.Matrix.Identity(), camera.getViewMatrix(), camera.getProjectionMatrix());
        };
        Scene.prototype._internalPick = function (rayFunction, predicate, fastCheck) {
            var pickingInfo = null;
            for (var meshIndex = 0; meshIndex < this.meshes.length; meshIndex++) {
                var mesh = this.meshes[meshIndex];
                if (predicate) {
                    if (!predicate(mesh)) {
                        continue;
                    }
                }
                else if (!mesh.isEnabled() || !mesh.isVisible || !mesh.isPickable) {
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
            return this._internalPick(function (world) { return _this.createPickingRay(x, y, world, camera); }, predicate, fastCheck);
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
                this._pointerOverMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOutTrigger, BABYLON.ActionEvent.CreateNew(this._pointerOverMesh));
            }
            this._pointerOverMesh = mesh;
            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOverTrigger, BABYLON.ActionEvent.CreateNew(this._pointerOverMesh));
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
        Scene.prototype.deleteCompoundImpostor = function (compound) {
            for (var index = 0; index < compound.parts.length; index++) {
                var mesh = compound.parts[index].mesh;
                mesh._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
                this._physicsEngine._unregisterMesh(mesh);
            }
        };
        // Misc.
        Scene.prototype.createDefaultCameraOrLight = function () {
            // Light
            if (this.lights.length === 0) {
                new BABYLON.HemisphericLight("default light", BABYLON.Vector3.Up(), this);
            }
            // Camera
            if (!this.activeCamera) {
                var camera = new BABYLON.FreeCamera("default camera", BABYLON.Vector3.Zero(), this);
                // Compute position
                var worldExtends = this.getWorldExtends();
                var worldCenter = worldExtends.min.add(worldExtends.max.subtract(worldExtends.min).scale(0.5));
                camera.position = new BABYLON.Vector3(worldCenter.x, worldCenter.y, worldExtends.min.z - (worldExtends.max.z - worldExtends.min.z));
                camera.setTarget(worldCenter);
                this.activeCamera = camera;
            }
        };
        // Tags
        Scene.prototype._getByTags = function (list, tagsQuery, forEach) {
            if (tagsQuery === undefined) {
                // returns the complete list (could be done with BABYLON.Tags.MatchesQuery but no need to have a for-loop here)
                return list;
            }
            var listByTags = [];
            forEach = forEach || (function (item) {
                return;
            });
            for (var i in list) {
                var item = list[i];
                if (BABYLON.Tags.MatchesQuery(item, tagsQuery)) {
                    listByTags.push(item);
                    forEach(item);
                }
            }
            return listByTags;
        };
        Scene.prototype.getMeshesByTags = function (tagsQuery, forEach) {
            return this._getByTags(this.meshes, tagsQuery, forEach);
        };
        Scene.prototype.getCamerasByTags = function (tagsQuery, forEach) {
            return this._getByTags(this.cameras, tagsQuery, forEach);
        };
        Scene.prototype.getLightsByTags = function (tagsQuery, forEach) {
            return this._getByTags(this.lights, tagsQuery, forEach);
        };
        Scene.prototype.getMaterialByTags = function (tagsQuery, forEach) {
            return this._getByTags(this.materials, tagsQuery, forEach).concat(this._getByTags(this.multiMaterials, tagsQuery, forEach));
        };
        // Statics
        Scene._FOGMODE_NONE = 0;
        Scene._FOGMODE_EXP = 1;
        Scene._FOGMODE_EXP2 = 2;
        Scene._FOGMODE_LINEAR = 3;
        Scene.MinDeltaTime = 1.0;
        Scene.MaxDeltaTime = 1000.0;
        return Scene;
    })();
    BABYLON.Scene = Scene;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.scene.js.map