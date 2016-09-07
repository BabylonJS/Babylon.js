var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var BABYLON;
(function (BABYLON) {
    var PointerEventTypes = (function () {
        function PointerEventTypes() {
        }
        Object.defineProperty(PointerEventTypes, "POINTERDOWN", {
            get: function () {
                return PointerEventTypes._POINTERDOWN;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointerEventTypes, "POINTERUP", {
            get: function () {
                return PointerEventTypes._POINTERUP;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointerEventTypes, "POINTERMOVE", {
            get: function () {
                return PointerEventTypes._POINTERMOVE;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointerEventTypes, "POINTERWHEEL", {
            get: function () {
                return PointerEventTypes._POINTERWHEEL;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(PointerEventTypes, "POINTERPICK", {
            get: function () {
                return PointerEventTypes._POINTERPICK;
            },
            enumerable: true,
            configurable: true
        });
        PointerEventTypes._POINTERDOWN = 0x01;
        PointerEventTypes._POINTERUP = 0x02;
        PointerEventTypes._POINTERMOVE = 0x04;
        PointerEventTypes._POINTERWHEEL = 0x08;
        PointerEventTypes._POINTERPICK = 0x10;
        return PointerEventTypes;
    }());
    BABYLON.PointerEventTypes = PointerEventTypes;
    var PointerInfoBase = (function () {
        function PointerInfoBase(type, event) {
            this.type = type;
            this.event = event;
        }
        return PointerInfoBase;
    }());
    BABYLON.PointerInfoBase = PointerInfoBase;
    /**
     * This class is used to store pointer related info for the onPrePointerObservable event.
     * Set the skipOnPointerObservable property to true if you want the engine to stop any process after this event is triggered, even not calling onPointerObservable
     */
    var PointerInfoPre = (function (_super) {
        __extends(PointerInfoPre, _super);
        function PointerInfoPre(type, event, localX, localY) {
            _super.call(this, type, event);
            this.skipOnPointerObservable = false;
            this.localPosition = new BABYLON.Vector2(localX, localY);
        }
        return PointerInfoPre;
    }(PointerInfoBase));
    BABYLON.PointerInfoPre = PointerInfoPre;
    /**
     * This type contains all the data related to a pointer event in Babylon.js.
     * The event member is an instance of PointerEvent for all types except PointerWheel and is of type MouseWheelEvent when type equals PointerWheel. The different event types can be found in the PointerEventTypes class.
     */
    var PointerInfo = (function (_super) {
        __extends(PointerInfo, _super);
        function PointerInfo(type, event, pickInfo) {
            _super.call(this, type, event);
            this.pickInfo = pickInfo;
        }
        return PointerInfo;
    }(PointerInfoBase));
    BABYLON.PointerInfo = PointerInfo;
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
            this.constantlyUpdateMeshUnderPointer = false;
            this.hoverCursor = "pointer";
            // Events
            /**
            * An event triggered when the scene is disposed.
            * @type {BABYLON.Observable}
            */
            this.onDisposeObservable = new BABYLON.Observable();
            /**
            * An event triggered before rendering the scene
            * @type {BABYLON.Observable}
            */
            this.onBeforeRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after rendering the scene
            * @type {BABYLON.Observable}
            */
            this.onAfterRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered when the scene is ready
            * @type {BABYLON.Observable}
            */
            this.onReadyObservable = new BABYLON.Observable();
            /**
            * An event triggered before rendering a camera
            * @type {BABYLON.Observable}
            */
            this.onBeforeCameraRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered after rendering a camera
            * @type {BABYLON.Observable}
            */
            this.onAfterCameraRenderObservable = new BABYLON.Observable();
            /**
            * An event triggered when a camera is created
            * @type {BABYLON.Observable}
            */
            this.onNewCameraAddedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a camera is removed
            * @type {BABYLON.Observable}
            */
            this.onCameraRemovedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a light is created
            * @type {BABYLON.Observable}
            */
            this.onNewLightAddedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a light is removed
            * @type {BABYLON.Observable}
            */
            this.onLightRemovedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a geometry is created
            * @type {BABYLON.Observable}
            */
            this.onNewGeometryAddedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a geometry is removed
            * @type {BABYLON.Observable}
            */
            this.onGeometryRemovedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a mesh is created
            * @type {BABYLON.Observable}
            */
            this.onNewMeshAddedObservable = new BABYLON.Observable();
            /**
            * An event triggered when a mesh is removed
            * @type {BABYLON.Observable}
            */
            this.onMeshRemovedObservable = new BABYLON.Observable();
            // Animations
            this.animations = [];
            /**
             * This observable event is triggered when any mouse event registered during Scene.attach() is called BEFORE the 3D engine to process anything (mesh/sprite picking for instance).
             * You have the possibility to skip the 3D Engine process and the call to onPointerObservable by setting PointerInfoBase.skipOnPointerObservable to true
             */
            this.onPrePointerObservable = new BABYLON.Observable();
            /**
             * Observable event triggered each time an input event is received from the rendering canvas
             */
            this.onPointerObservable = new BABYLON.Observable();
            this.cameraToUseForPointers = null; // Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position
            this._startingPointerPosition = new BABYLON.Vector2(0, 0);
            this._startingPointerTime = 0;
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
            this.gravity = new BABYLON.Vector3(0, -9.807, 0);
            // Postprocesses
            this.postProcessesEnabled = true;
            // Customs render targets
            this.renderTargetsEnabled = true;
            this.dumpNextRenderTargets = false;
            this.customRenderTargets = new Array();
            // Imported meshes
            this.importedMeshesFiles = new Array();
            // Probes
            this.probesEnabled = true;
            this.reflectionProbes = new Array();
            this._actionManagers = new Array();
            this._meshesForIntersections = new BABYLON.SmartArray(256);
            // Procedural textures
            this.proceduralTexturesEnabled = true;
            this._proceduralTextures = new Array();
            this.soundTracks = new Array();
            this._audioEnabled = true;
            this._headphone = false;
            // Performance counters
            this._totalMeshesCounter = new BABYLON.PerfCounter();
            this._totalLightsCounter = new BABYLON.PerfCounter();
            this._totalMaterialsCounter = new BABYLON.PerfCounter();
            this._totalTexturesCounter = new BABYLON.PerfCounter();
            this._totalVertices = new BABYLON.PerfCounter();
            this._activeIndices = new BABYLON.PerfCounter();
            this._activeParticles = new BABYLON.PerfCounter();
            this._lastFrameDuration = new BABYLON.PerfCounter();
            this._evaluateActiveMeshesDuration = new BABYLON.PerfCounter();
            this._renderTargetsDuration = new BABYLON.PerfCounter();
            this._particlesDuration = new BABYLON.PerfCounter();
            this._renderDuration = new BABYLON.PerfCounter();
            this._spritesDuration = new BABYLON.PerfCounter();
            this._activeBones = new BABYLON.PerfCounter();
            this._renderId = 0;
            this._executeWhenReadyTimeoutId = -1;
            this._intermediateRendering = false;
            this._toBeDisposed = new BABYLON.SmartArray(256);
            this._pendingData = []; //ANY
            this._activeMeshes = new BABYLON.SmartArray(256);
            this._processedMaterials = new BABYLON.SmartArray(256);
            this._renderTargets = new BABYLON.SmartArray(256);
            this._activeParticleSystems = new BABYLON.SmartArray(256);
            this._activeSkeletons = new BABYLON.SmartArray(32);
            this._softwareSkinnedMeshes = new BABYLON.SmartArray(32);
            this._activeAnimatables = new Array();
            this._transformMatrix = BABYLON.Matrix.Zero();
            this._edgesRenderers = new BABYLON.SmartArray(16);
            this._uniqueIdCounter = 0;
            this._engine = engine;
            engine.scenes.push(this);
            this._renderingManager = new BABYLON.RenderingManager(this);
            this.postProcessManager = new BABYLON.PostProcessManager(this);
            this.postProcessRenderPipelineManager = new BABYLON.PostProcessRenderPipelineManager();
            this._boundingBoxRenderer = new BABYLON.BoundingBoxRenderer(this);
            if (BABYLON.OutlineRenderer) {
                this._outlineRenderer = new BABYLON.OutlineRenderer(this);
            }
            this.attachControl();
            if (BABYLON.SoundTrack) {
                this.mainSoundTrack = new BABYLON.SoundTrack(this, { mainTrack: true });
            }
            //simplification queue
            if (BABYLON.SimplificationQueue) {
                this.simplificationQueue = new BABYLON.SimplificationQueue();
            }
            //collision coordinator initialization. For now legacy per default.
            this.workerCollisions = false; //(!!Worker && (!!BABYLON.CollisionWorker || BABYLON.WorkerIncluded));
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
        Object.defineProperty(Scene.prototype, "onDispose", {
            set: function (callback) {
                if (this._onDisposeObserver) {
                    this.onDisposeObservable.remove(this._onDisposeObserver);
                }
                this._onDisposeObserver = this.onDisposeObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "beforeRender", {
            set: function (callback) {
                if (this._onBeforeRenderObserver) {
                    this.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
                }
                this._onBeforeRenderObserver = this.onBeforeRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "afterRender", {
            set: function (callback) {
                if (this._onAfterRenderObserver) {
                    this.onAfterRenderObservable.remove(this._onAfterRenderObserver);
                }
                this._onAfterRenderObserver = this.onAfterRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "beforeCameraRender", {
            set: function (callback) {
                if (this._onBeforeCameraRenderObserver) {
                    this.onBeforeCameraRenderObservable.remove(this._onBeforeCameraRenderObserver);
                }
                this._onBeforeCameraRenderObserver = this.onBeforeCameraRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "afterCameraRender", {
            set: function (callback) {
                if (this._onAfterCameraRenderObserver) {
                    this.onAfterCameraRenderObservable.remove(this._onAfterCameraRenderObserver);
                }
                this._onAfterCameraRenderObserver = this.onAfterCameraRenderObservable.add(callback);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "unTranslatedPointer", {
            get: function () {
                return new BABYLON.Vector2(this._unTranslatedPointerX, this._unTranslatedPointerY);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "debugLayer", {
            // Properties
            get: function () {
                if (!this._debugLayer) {
                    this._debugLayer = new BABYLON.DebugLayer(this);
                }
                return this._debugLayer;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "workerCollisions", {
            get: function () {
                return this._workerCollisions;
            },
            set: function (enabled) {
                enabled = (enabled && !!Worker);
                this._workerCollisions = enabled;
                if (this.collisionCoordinator) {
                    this.collisionCoordinator.destroy();
                }
                this.collisionCoordinator = enabled ? new BABYLON.CollisionCoordinatorWorker() : new BABYLON.CollisionCoordinatorLegacy();
                this.collisionCoordinator.init(this);
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Scene.prototype, "SelectionOctree", {
            get: function () {
                return this._selectionOctree;
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
                return this._pointerOverMesh;
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
            return this._totalVertices.current;
        };
        Object.defineProperty(Scene.prototype, "totalVerticesPerfCounter", {
            get: function () {
                return this._totalVertices;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getActiveIndices = function () {
            return this._activeIndices.current;
        };
        Object.defineProperty(Scene.prototype, "totalActiveIndicesPerfCounter", {
            get: function () {
                return this._activeIndices;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getActiveParticles = function () {
            return this._activeParticles.current;
        };
        Object.defineProperty(Scene.prototype, "activeParticlesPerfCounter", {
            get: function () {
                return this._activeParticles;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getActiveBones = function () {
            return this._activeBones.current;
        };
        Object.defineProperty(Scene.prototype, "activeBonesPerfCounter", {
            get: function () {
                return this._activeBones;
            },
            enumerable: true,
            configurable: true
        });
        // Stats
        Scene.prototype.getLastFrameDuration = function () {
            return this._lastFrameDuration.current;
        };
        Object.defineProperty(Scene.prototype, "lastFramePerfCounter", {
            get: function () {
                return this._lastFrameDuration;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getEvaluateActiveMeshesDuration = function () {
            return this._evaluateActiveMeshesDuration.current;
        };
        Object.defineProperty(Scene.prototype, "evaluateActiveMeshesDurationPerfCounter", {
            get: function () {
                return this._evaluateActiveMeshesDuration;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getActiveMeshes = function () {
            return this._activeMeshes;
        };
        Scene.prototype.getRenderTargetsDuration = function () {
            return this._renderTargetsDuration.current;
        };
        Scene.prototype.getRenderDuration = function () {
            return this._renderDuration.current;
        };
        Object.defineProperty(Scene.prototype, "renderDurationPerfCounter", {
            get: function () {
                return this._renderDuration;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getParticlesDuration = function () {
            return this._particlesDuration.current;
        };
        Object.defineProperty(Scene.prototype, "particlesDurationPerfCounter", {
            get: function () {
                return this._particlesDuration;
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype.getSpritesDuration = function () {
            return this._spritesDuration.current;
        };
        Object.defineProperty(Scene.prototype, "spriteDuractionPerfCounter", {
            get: function () {
                return this._spritesDuration;
            },
            enumerable: true,
            configurable: true
        });
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
            this._unTranslatedPointerX = this._pointerX;
            this._unTranslatedPointerY = this._pointerY;
            if (this.cameraToUseForPointers) {
                this._pointerX = this._pointerX - this.cameraToUseForPointers.viewport.x * this._engine.getRenderWidth();
                this._pointerY = this._pointerY - this.cameraToUseForPointers.viewport.y * this._engine.getRenderHeight();
            }
        };
        // Pointers handling
        /**
        * Attach events to the canvas (To handle actionManagers triggers and raise onPointerMove, onPointerDown and onPointerUp
        * @param attachUp defines if you want to attach events to pointerup
        * @param attachDown defines if you want to attach events to pointerdown
        * @param attachMove defines if you want to attach events to pointermove
        */
        Scene.prototype.attachControl = function (attachUp, attachDown, attachMove) {
            var _this = this;
            if (attachUp === void 0) { attachUp = true; }
            if (attachDown === void 0) { attachDown = true; }
            if (attachMove === void 0) { attachMove = true; }
            var spritePredicate = function (sprite) {
                return sprite.isPickable && sprite.actionManager && sprite.actionManager.hasPointerTriggers;
            };
            this._onPointerMove = function (evt) {
                _this._updatePointerPosition(evt);
                // PreObservable support
                if (_this.onPrePointerObservable.hasObservers()) {
                    var type = evt.type === "mousewheel" || evt.type === "DOMMouseScroll" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;
                    var pi = new PointerInfoPre(type, evt, _this._unTranslatedPointerX, _this._unTranslatedPointerY);
                    _this.onPrePointerObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }
                if (!_this.cameraToUseForPointers && !_this.activeCamera) {
                    return;
                }
                var canvas = _this._engine.getRenderingCanvas();
                if (!_this.pointerMovePredicate) {
                    _this.pointerMovePredicate = function (mesh) { return mesh.isPickable && mesh.isVisible && mesh.isReady() && (_this.constantlyUpdateMeshUnderPointer || mesh.actionManager !== null && mesh.actionManager !== undefined); };
                }
                // Meshes
                var pickResult = _this.pick(_this._unTranslatedPointerX, _this._unTranslatedPointerY, _this.pointerMovePredicate, false, _this.cameraToUseForPointers);
                if (pickResult.hit && pickResult.pickedMesh) {
                    _this.setPointerOverSprite(null);
                    _this.setPointerOverMesh(pickResult.pickedMesh);
                    if (_this._pointerOverMesh.actionManager && _this._pointerOverMesh.actionManager.hasPointerTriggers) {
                        canvas.style.cursor = _this.hoverCursor;
                    }
                    else {
                        canvas.style.cursor = "";
                    }
                }
                else {
                    _this.setPointerOverMesh(null);
                    // Sprites
                    pickResult = _this.pickSprite(_this._unTranslatedPointerX, _this._unTranslatedPointerY, spritePredicate, false, _this.cameraToUseForPointers);
                    if (pickResult.hit && pickResult.pickedSprite) {
                        canvas.style.cursor = _this.hoverCursor;
                        _this.setPointerOverSprite(pickResult.pickedSprite);
                    }
                    else {
                        _this.setPointerOverSprite(null);
                        // Restore pointer
                        canvas.style.cursor = "";
                    }
                }
                if (_this.onPointerMove) {
                    _this.onPointerMove(evt, pickResult);
                }
                if (_this.onPointerObservable.hasObservers()) {
                    var type = evt.type === "mousewheel" || evt.type === "DOMMouseScroll" ? PointerEventTypes.POINTERWHEEL : PointerEventTypes.POINTERMOVE;
                    var pi = new PointerInfo(type, evt, pickResult);
                    _this.onPointerObservable.notifyObservers(pi, type);
                }
            };
            this._onPointerDown = function (evt) {
                _this._updatePointerPosition(evt);
                // PreObservable support
                if (_this.onPrePointerObservable.hasObservers()) {
                    var type = PointerEventTypes.POINTERDOWN;
                    var pi = new PointerInfoPre(type, evt, _this._unTranslatedPointerX, _this._unTranslatedPointerY);
                    _this.onPrePointerObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }
                if (!_this.cameraToUseForPointers && !_this.activeCamera) {
                    return;
                }
                _this._startingPointerPosition.x = _this._pointerX;
                _this._startingPointerPosition.y = _this._pointerY;
                _this._startingPointerTime = new Date().getTime();
                if (!_this.pointerDownPredicate) {
                    _this.pointerDownPredicate = function (mesh) {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && (!mesh.actionManager || mesh.actionManager.hasPointerTriggers);
                    };
                }
                // Meshes
                _this._pickedDownMesh = null;
                var pickResult = _this.pick(_this._unTranslatedPointerX, _this._unTranslatedPointerY, _this.pointerDownPredicate, false, _this.cameraToUseForPointers);
                if (pickResult.hit && pickResult.pickedMesh) {
                    if (pickResult.pickedMesh.actionManager) {
                        _this._pickedDownMesh = pickResult.pickedMesh;
                        if (pickResult.pickedMesh.actionManager.hasPickTriggers) {
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
                            pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickDownTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                        }
                        if (pickResult.pickedMesh.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnLongPressTrigger)) {
                            var that = _this;
                            window.setTimeout(function () {
                                var pickResult = that.pick(that._unTranslatedPointerX, that._unTranslatedPointerY, function (mesh) { return mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.actionManager && mesh.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnLongPressTrigger); }, false, that.cameraToUseForPointers);
                                if (pickResult.hit && pickResult.pickedMesh) {
                                    if (pickResult.pickedMesh.actionManager) {
                                        if (that._startingPointerTime !== 0 && ((new Date().getTime() - that._startingPointerTime) > BABYLON.ActionManager.LongPressDelay) && (Math.abs(that._startingPointerPosition.x - that._pointerX) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(that._startingPointerPosition.y - that._pointerY) < BABYLON.ActionManager.DragMovementThreshold)) {
                                            that._startingPointerTime = 0;
                                            pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnLongPressTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                        }
                                    }
                                }
                            }, BABYLON.ActionManager.LongPressDelay);
                        }
                    }
                }
                if (_this.onPointerDown) {
                    _this.onPointerDown(evt, pickResult);
                }
                if (_this.onPointerObservable.hasObservers()) {
                    var type = PointerEventTypes.POINTERDOWN;
                    var pi = new PointerInfo(type, evt, pickResult);
                    _this.onPointerObservable.notifyObservers(pi, type);
                }
                // Sprites
                _this._pickedDownSprite = null;
                if (_this.spriteManagers.length > 0) {
                    pickResult = _this.pickSprite(_this._unTranslatedPointerX, _this._unTranslatedPointerY, spritePredicate, false, _this.cameraToUseForPointers);
                    if (pickResult.hit && pickResult.pickedSprite) {
                        if (pickResult.pickedSprite.actionManager) {
                            _this._pickedDownSprite = pickResult.pickedSprite;
                            switch (evt.button) {
                                case 0:
                                    pickResult.pickedSprite.actionManager.processTrigger(BABYLON.ActionManager.OnLeftPickTrigger, BABYLON.ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, _this, evt));
                                    break;
                                case 1:
                                    pickResult.pickedSprite.actionManager.processTrigger(BABYLON.ActionManager.OnCenterPickTrigger, BABYLON.ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, _this, evt));
                                    break;
                                case 2:
                                    pickResult.pickedSprite.actionManager.processTrigger(BABYLON.ActionManager.OnRightPickTrigger, BABYLON.ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, _this, evt));
                                    break;
                            }
                            pickResult.pickedSprite.actionManager.processTrigger(BABYLON.ActionManager.OnPickDownTrigger, BABYLON.ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, _this, evt));
                        }
                    }
                }
            };
            this._onPointerUp = function (evt) {
                _this._updatePointerPosition(evt);
                // PreObservable support
                if (_this.onPrePointerObservable.hasObservers()) {
                    var type = PointerEventTypes.POINTERUP;
                    var pi = new PointerInfoPre(type, evt, _this._unTranslatedPointerX, _this._unTranslatedPointerY);
                    _this.onPrePointerObservable.notifyObservers(pi, type);
                    if (pi.skipOnPointerObservable) {
                        return;
                    }
                }
                if (!_this.cameraToUseForPointers && !_this.activeCamera) {
                    return;
                }
                if (!_this.pointerUpPredicate) {
                    _this.pointerUpPredicate = function (mesh) {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && (!mesh.actionManager || (mesh.actionManager.hasPickTriggers || mesh.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnLongPressTrigger)));
                    };
                }
                // Meshes
                var pickResult = _this.pick(_this._unTranslatedPointerX, _this._unTranslatedPointerY, _this.pointerUpPredicate, false, _this.cameraToUseForPointers);
                if (pickResult.hit && pickResult.pickedMesh) {
                    if (_this._pickedDownMesh != null && pickResult.pickedMesh == _this._pickedDownMesh) {
                        if (_this.onPointerPick) {
                            _this.onPointerPick(evt, pickResult);
                        }
                        if (_this.onPointerObservable.hasObservers()) {
                            var type = PointerEventTypes.POINTERPICK;
                            var pi = new PointerInfo(type, evt, pickResult);
                            _this.onPointerObservable.notifyObservers(pi, type);
                        }
                    }
                    if (pickResult.pickedMesh.actionManager) {
                        pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickUpTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                        if (Math.abs(_this._startingPointerPosition.x - _this._pointerX) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(_this._startingPointerPosition.y - _this._pointerY) < BABYLON.ActionManager.DragMovementThreshold) {
                            pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, BABYLON.ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                        }
                    }
                }
                if (_this._pickedDownMesh && _this._pickedDownMesh !== pickResult.pickedMesh) {
                    _this._pickedDownMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickOutTrigger, BABYLON.ActionEvent.CreateNew(_this._pickedDownMesh, evt));
                }
                if (_this.onPointerUp) {
                    _this.onPointerUp(evt, pickResult);
                }
                if (_this.onPointerObservable.hasObservers()) {
                    var type = PointerEventTypes.POINTERUP;
                    var pi = new PointerInfo(type, evt, pickResult);
                    _this.onPointerObservable.notifyObservers(pi, type);
                }
                _this._startingPointerTime = 0;
                // Sprites
                if (_this.spriteManagers.length > 0) {
                    pickResult = _this.pickSprite(_this._unTranslatedPointerX, _this._unTranslatedPointerY, spritePredicate, false, _this.cameraToUseForPointers);
                    if (pickResult.hit && pickResult.pickedSprite) {
                        if (pickResult.pickedSprite.actionManager) {
                            pickResult.pickedSprite.actionManager.processTrigger(BABYLON.ActionManager.OnPickUpTrigger, BABYLON.ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, _this, evt));
                            if (Math.abs(_this._startingPointerPosition.x - _this._pointerX) < BABYLON.ActionManager.DragMovementThreshold && Math.abs(_this._startingPointerPosition.y - _this._pointerY) < BABYLON.ActionManager.DragMovementThreshold) {
                                pickResult.pickedSprite.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, BABYLON.ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, _this, evt));
                            }
                        }
                    }
                    if (_this._pickedDownSprite && _this._pickedDownSprite !== pickResult.pickedSprite) {
                        _this._pickedDownSprite.actionManager.processTrigger(BABYLON.ActionManager.OnPickOutTrigger, BABYLON.ActionEvent.CreateNewFromSprite(_this._pickedDownSprite, _this, evt));
                    }
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
            var canvas = this._engine.getRenderingCanvas();
            if (attachMove) {
                canvas.addEventListener(eventPrefix + "move", this._onPointerMove, false);
                // Wheel
                canvas.addEventListener('mousewheel', this._onPointerMove, false);
                canvas.addEventListener('DOMMouseScroll', this._onPointerMove, false);
            }
            if (attachDown) {
                canvas.addEventListener(eventPrefix + "down", this._onPointerDown, false);
            }
            if (attachUp) {
                canvas.addEventListener(eventPrefix + "up", this._onPointerUp, false);
            }
            canvas.tabIndex = 1;
            canvas.addEventListener("keydown", this._onKeyDown, false);
            canvas.addEventListener("keyup", this._onKeyUp, false);
        };
        Scene.prototype.detachControl = function () {
            var eventPrefix = BABYLON.Tools.GetPointerPrefix();
            var canvas = this._engine.getRenderingCanvas();
            canvas.removeEventListener(eventPrefix + "move", this._onPointerMove);
            canvas.removeEventListener(eventPrefix + "down", this._onPointerDown);
            canvas.removeEventListener(eventPrefix + "up", this._onPointerUp);
            // Wheel
            canvas.removeEventListener('mousewheel', this._onPointerMove);
            canvas.removeEventListener('DOMMouseScroll', this._onPointerMove);
            canvas.removeEventListener("keydown", this._onKeyDown);
            canvas.removeEventListener("keyup", this._onKeyUp);
        };
        // Ready
        Scene.prototype.isReady = function () {
            if (this._pendingData.length > 0) {
                return false;
            }
            var index;
            for (index = 0; index < this._geometries.length; index++) {
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
            this.onBeforeRenderObservable.add(func);
        };
        Scene.prototype.unregisterBeforeRender = function (func) {
            this.onBeforeRenderObservable.removeCallback(func);
        };
        Scene.prototype.registerAfterRender = function (func) {
            this.onAfterRenderObservable.add(func);
        };
        Scene.prototype.unregisterAfterRender = function (func) {
            this.onAfterRenderObservable.removeCallback(func);
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
            this.onReadyObservable.add(func);
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
                this.onReadyObservable.notifyObservers(this);
                this.onReadyObservable.clear();
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
            if (speedRatio === void 0) { speedRatio = 1.0; }
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
            animatable.reset();
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
        Object.defineProperty(Scene.prototype, "Animatables", {
            get: function () {
                return this._activeAnimatables;
            },
            enumerable: true,
            configurable: true
        });
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
            if (!this.animationsEnabled || this._activeAnimatables.length === 0) {
                return;
            }
            if (!this._animationStartDate) {
                if (this._pendingData.length > 0) {
                    return;
                }
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
            // Update frustum
            if (!this._frustumPlanes) {
                this._frustumPlanes = BABYLON.Frustum.GetPlanes(this._transformMatrix);
            }
            else {
                BABYLON.Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }
        };
        // Methods
        Scene.prototype.addMesh = function (newMesh) {
            newMesh.uniqueId = this._uniqueIdCounter++;
            var position = this.meshes.push(newMesh);
            //notify the collision coordinator
            this.collisionCoordinator.onMeshAdded(newMesh);
            this.onNewMeshAddedObservable.notifyObservers(newMesh);
        };
        Scene.prototype.removeMesh = function (toRemove) {
            var index = this.meshes.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.meshes.splice(index, 1);
            }
            //notify the collision coordinator
            this.collisionCoordinator.onMeshRemoved(toRemove);
            this.onMeshRemovedObservable.notifyObservers(toRemove);
            return index;
        };
        Scene.prototype.removeSkeleton = function (toRemove) {
            var index = this.skeletons.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.skeletons.splice(index, 1);
            }
            return index;
        };
        Scene.prototype.removeLight = function (toRemove) {
            var index = this.lights.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.lights.splice(index, 1);
            }
            this.onLightRemovedObservable.notifyObservers(toRemove);
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
            this.onCameraRemovedObservable.notifyObservers(toRemove);
            return index;
        };
        Scene.prototype.addLight = function (newLight) {
            newLight.uniqueId = this._uniqueIdCounter++;
            var position = this.lights.push(newLight);
            this.onNewLightAddedObservable.notifyObservers(newLight);
        };
        Scene.prototype.addCamera = function (newCamera) {
            newCamera.uniqueId = this._uniqueIdCounter++;
            var position = this.cameras.push(newCamera);
            this.onNewCameraAddedObservable.notifyObservers(newCamera);
        };
        /**
         * Switch active camera
         * @param {Camera} newCamera - new active camera
         * @param {boolean} attachControl - call attachControl for the new active camera (default: true)
         */
        Scene.prototype.switchActiveCamera = function (newCamera, attachControl) {
            if (attachControl === void 0) { attachControl = true; }
            var canvas = this._engine.getRenderingCanvas();
            this.activeCamera.detachControl(canvas);
            this.activeCamera = newCamera;
            if (attachControl) {
                newCamera.attachControl(canvas);
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
        Scene.prototype.getLensFlareSystemByName = function (name) {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].name === name) {
                    return this.lensFlareSystems[index];
                }
            }
            return null;
        };
        Scene.prototype.getLensFlareSystemByID = function (id) {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].id === id) {
                    return this.lensFlareSystems[index];
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
         * get a bone using its id
         * @param {string} the bone's id
         * @return {BABYLON.Bone|null} the bone or null if not found
         */
        Scene.prototype.getBoneByID = function (id) {
            for (var skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
                var skeleton = this.skeletons[skeletonIndex];
                for (var boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                    if (skeleton.bones[boneIndex].id === id) {
                        return skeleton.bones[boneIndex];
                    }
                }
            }
            return null;
        };
        /**
        * get a bone using its id
        * @param {string} the bone's name
        * @return {BABYLON.Bone|null} the bone or null if not found
        */
        Scene.prototype.getBoneByName = function (name) {
            for (var skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
                var skeleton = this.skeletons[skeletonIndex];
                for (var boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                    if (skeleton.bones[boneIndex].name === name) {
                        return skeleton.bones[boneIndex];
                    }
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
         * get a particle system by id
         * @param id {number} the particle system id
         * @return {BABYLON.ParticleSystem|null} the corresponding system or null if none found.
         */
        Scene.prototype.getParticleSystemByID = function (id) {
            for (var index = 0; index < this.particleSystems.length; index++) {
                if (this.particleSystems[index].id === id) {
                    return this.particleSystems[index];
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
            //notify the collision coordinator
            this.collisionCoordinator.onGeometryAdded(geometry);
            this.onNewGeometryAddedObservable.notifyObservers(geometry);
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
                //notify the collision coordinator
                this.collisionCoordinator.onGeometryDeleted(geometry);
                this.onGeometryRemovedObservable.notifyObservers(geometry);
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
        Scene.prototype.getMeshesByID = function (id) {
            return this.meshes.filter(function (m) {
                return m.id === id;
            });
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
            var index;
            for (index = this.meshes.length - 1; index >= 0; index--) {
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
        Scene.prototype.getNodeByID = function (id) {
            var mesh = this.getMeshByID(id);
            if (mesh) {
                return mesh;
            }
            var light = this.getLightByID(id);
            if (light) {
                return light;
            }
            var camera = this.getCameraByID(id);
            if (camera) {
                return camera;
            }
            var bone = this.getBoneByID(id);
            return bone;
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
            var camera = this.getCameraByName(name);
            if (camera) {
                return camera;
            }
            var bone = this.getBoneByName(name);
            return bone;
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
            var index;
            if (BABYLON.AudioEngine) {
                for (index = 0; index < this.mainSoundTrack.soundCollection.length; index++) {
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
            if (mesh.alwaysSelectAsActiveMesh || mesh.subMeshes.length === 1 || subMesh.isInFrustum(this._frustumPlanes)) {
                var material = subMesh.getMaterial();
                if (mesh.showSubMeshesBoundingBox) {
                    this._boundingBoxRenderer.renderList.push(subMesh.getBoundingInfo().boundingBox);
                }
                if (material) {
                    // Render targets
                    if (material.getRenderTargetTextures) {
                        if (this._processedMaterials.indexOf(material) === -1) {
                            this._processedMaterials.push(material);
                            this._renderTargets.concatWithNoDuplicate(material.getRenderTargetTextures());
                        }
                    }
                    // Dispatch
                    this._activeIndices.addCount(subMesh.indexCount, false);
                    this._renderingManager.dispatch(subMesh);
                }
            }
        };
        Scene.prototype._isInIntermediateRendering = function () {
            return this._intermediateRendering;
        };
        Scene.prototype._evaluateActiveMeshes = function () {
            this.activeCamera._activeMeshes.reset();
            this._activeMeshes.reset();
            this._renderingManager.reset();
            this._processedMaterials.reset();
            this._activeParticleSystems.reset();
            this._activeSkeletons.reset();
            this._softwareSkinnedMeshes.reset();
            this._boundingBoxRenderer.reset();
            this._edgesRenderers.reset();
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
                this._totalVertices.addCount(mesh.getTotalVertices(), false);
                if (!mesh.isReady() || !mesh.isEnabled()) {
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
                if (mesh.alwaysSelectAsActiveMesh || mesh.isVisible && mesh.visibility > 0 && ((mesh.layerMask & this.activeCamera.layerMask) !== 0) && mesh.isInFrustum(this._frustumPlanes)) {
                    this._activeMeshes.push(mesh);
                    this.activeCamera._activeMeshes.push(mesh);
                    mesh._activate(this._renderId);
                    this._activeMesh(mesh, meshLOD);
                }
            }
            // Particle systems
            this._particlesDuration.beginMonitoring();
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
            this._particlesDuration.endMonitoring(false);
        };
        Scene.prototype._activeMesh = function (sourceMesh, mesh) {
            if (mesh.skeleton && this.skeletonsEnabled) {
                if (this._activeSkeletons.pushNoDuplicate(mesh.skeleton)) {
                    mesh.skeleton.prepare();
                }
                if (!mesh.computeBonesUsingShaders) {
                    this._softwareSkinnedMeshes.pushNoDuplicate(mesh);
                }
            }
            if (sourceMesh.showBoundingBox || this.forceShowBoundingBoxes) {
                this._boundingBoxRenderer.renderList.push(sourceMesh.getBoundingInfo().boundingBox);
            }
            if (sourceMesh._edgesRenderer) {
                this._edgesRenderers.push(sourceMesh._edgesRenderer);
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
            var startTime = BABYLON.Tools.Now;
            this.activeCamera = camera;
            if (!this.activeCamera)
                throw new Error("Active camera not set");
            BABYLON.Tools.StartPerformanceCounter("Rendering camera " + this.activeCamera.name);
            // Viewport
            engine.setViewport(this.activeCamera.viewport);
            // Camera
            this.resetCachedMaterial();
            this._renderId++;
            this.updateTransformMatrix();
            this.onBeforeCameraRenderObservable.notifyObservers(this.activeCamera);
            // Meshes
            this._evaluateActiveMeshesDuration.beginMonitoring();
            BABYLON.Tools.StartPerformanceCounter("Active meshes evaluation");
            this._evaluateActiveMeshes();
            this._evaluateActiveMeshesDuration.endMonitoring(false);
            BABYLON.Tools.EndPerformanceCounter("Active meshes evaluation");
            // Software skinning
            for (var softwareSkinnedMeshIndex = 0; softwareSkinnedMeshIndex < this._softwareSkinnedMeshes.length; softwareSkinnedMeshIndex++) {
                var mesh = this._softwareSkinnedMeshes.data[softwareSkinnedMeshIndex];
                mesh.applySkeleton(mesh.skeleton);
            }
            // Render targets
            this._renderTargetsDuration.beginMonitoring();
            var beforeRenderTargetDate = BABYLON.Tools.Now;
            if (this.renderTargetsEnabled && this._renderTargets.length > 0) {
                this._intermediateRendering = true;
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
                this._intermediateRendering = false;
                this._renderId++;
                engine.restoreDefaultFramebuffer(); // Restore back buffer
            }
            this._renderTargetsDuration.endMonitoring(false);
            // Prepare Frame
            this.postProcessManager._prepareFrame();
            this._renderDuration.beginMonitoring();
            // Backgrounds
            var layerIndex;
            var layer;
            if (this.layers.length) {
                engine.setDepthBuffer(false);
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
            // Edges
            for (var edgesRendererIndex = 0; edgesRendererIndex < this._edgesRenderers.length; edgesRendererIndex++) {
                this._edgesRenderers.data[edgesRendererIndex].render();
            }
            // Lens flares
            if (this.lensFlaresEnabled) {
                BABYLON.Tools.StartPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
                for (var lensFlareSystemIndex = 0; lensFlareSystemIndex < this.lensFlareSystems.length; lensFlareSystemIndex++) {
                    var lensFlareSystem = this.lensFlareSystems[lensFlareSystemIndex];
                    if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                        lensFlareSystem.render();
                    }
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
            this._renderDuration.endMonitoring(false);
            // Finalize frame
            this.postProcessManager._finalizeFrame(camera.isIntermediate);
            // Update camera
            this.activeCamera._updateFromScene();
            // Reset some special arrays
            this._renderTargets.reset();
            this.onAfterCameraRenderObservable.notifyObservers(this.activeCamera);
            BABYLON.Tools.EndPerformanceCounter("Rendering camera " + this.activeCamera.name);
        };
        Scene.prototype._processSubCameras = function (camera) {
            if (camera.cameraRigMode === BABYLON.Camera.RIG_MODE_NONE) {
                this._renderForCamera(camera);
                return;
            }
            // rig cameras
            for (var index = 0; index < camera._rigCameras.length; index++) {
                this._renderForCamera(camera._rigCameras[index]);
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
                                action._executeCurrent(BABYLON.ActionEvent.CreateNew(sourceMesh, null, otherMesh));
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            }
                            else if (action.trigger === BABYLON.ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            }
                        }
                        else if (!areIntersecting && currentIntersectionInProgress > -1) {
                            //They intersected, and now they don't.
                            //is this trigger an exit trigger? execute an event.
                            if (action.trigger === BABYLON.ActionManager.OnIntersectionExitTrigger) {
                                action._executeCurrent(BABYLON.ActionEvent.CreateNew(sourceMesh, null, otherMesh));
                            }
                            //if this is an exit trigger, or no exit trigger exists, remove the id from the intersection in progress array.
                            if (!sourceMesh.actionManager.hasSpecificTrigger(BABYLON.ActionManager.OnIntersectionExitTrigger) || action.trigger === BABYLON.ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.splice(currentIntersectionInProgress, 1);
                            }
                        }
                    }
                }
            }
        };
        Scene.prototype.render = function () {
            this._lastFrameDuration.beginMonitoring();
            this._particlesDuration.fetchNewFrame();
            this._spritesDuration.fetchNewFrame();
            this._activeParticles.fetchNewFrame();
            this._renderDuration.fetchNewFrame();
            this._renderTargetsDuration.fetchNewFrame();
            this._evaluateActiveMeshesDuration.fetchNewFrame();
            this._totalVertices.fetchNewFrame();
            this._activeIndices.fetchNewFrame();
            this._activeBones.fetchNewFrame();
            this.getEngine().drawCallsPerfCounter.fetchNewFrame();
            this._meshesForIntersections.reset();
            this.resetCachedMaterial();
            BABYLON.Tools.StartPerformanceCounter("Scene rendering");
            // Actions
            if (this.actionManager) {
                this.actionManager.processTrigger(BABYLON.ActionManager.OnEveryFrameTrigger, null);
            }
            //Simplification Queue
            if (this.simplificationQueue && !this.simplificationQueue.running) {
                this.simplificationQueue.executeNext();
            }
            // Animations
            var deltaTime = Math.max(Scene.MinDeltaTime, Math.min(this._engine.getDeltaTime(), Scene.MaxDeltaTime));
            this._animationRatio = deltaTime * (60.0 / 1000.0);
            this._animate();
            // Physics
            if (this._physicsEngine) {
                BABYLON.Tools.StartPerformanceCounter("Physics");
                this._physicsEngine._step(deltaTime / 1000.0);
                BABYLON.Tools.EndPerformanceCounter("Physics");
            }
            // Before render
            this.onBeforeRenderObservable.notifyObservers(this);
            // Customs render targets
            this._renderTargetsDuration.beginMonitoring();
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
            this._renderTargetsDuration.endMonitoring();
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
            this._engine.clear(this.clearColor, this.autoClear || this.forceWireframe || this.forcePointsCloud, true, true);
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
                    if (cameraIndex > 0) {
                        this._engine.clear(0, false, true, true);
                    }
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
            if (BABYLON.AudioEngine) {
                this._updateAudioParameters();
            }
            // After render
            if (this.afterRender) {
                this.afterRender();
            }
            this.onAfterRenderObservable.notifyObservers(this);
            // Cleaning
            for (var index = 0; index < this._toBeDisposed.length; index++) {
                this._toBeDisposed.data[index].dispose();
                this._toBeDisposed[index] = null;
            }
            this._toBeDisposed.reset();
            if (this.dumpNextRenderTargets) {
                this.dumpNextRenderTargets = false;
            }
            BABYLON.Tools.EndPerformanceCounter("Scene rendering");
            this._lastFrameDuration.endMonitoring();
            this._totalMeshesCounter.addCount(this.meshes.length, true);
            this._totalLightsCounter.addCount(this.lights.length, true);
            this._totalMaterialsCounter.addCount(this.materials.length, true);
            this._totalTexturesCounter.addCount(this.textures.length, true);
            this._activeBones.addCount(0, true);
            this._activeIndices.addCount(0, true);
            this._activeParticles.addCount(0, true);
        };
        Scene.prototype._updateAudioParameters = function () {
            if (!this.audioEnabled || (this.mainSoundTrack.soundCollection.length === 0 && this.soundTracks.length === 1)) {
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
                var i;
                for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
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
                if (BABYLON.AudioEngine) {
                    if (this._audioEnabled) {
                        this._enableAudio();
                    }
                    else {
                        this._disableAudio();
                    }
                }
            },
            enumerable: true,
            configurable: true
        });
        Scene.prototype._disableAudio = function () {
            var i;
            for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                this.mainSoundTrack.soundCollection[i].pause();
            }
            for (i = 0; i < this.soundTracks.length; i++) {
                for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                    this.soundTracks[i].soundCollection[j].pause();
                }
            }
        };
        Scene.prototype._enableAudio = function () {
            var i;
            for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
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
                if (BABYLON.AudioEngine) {
                    if (this._headphone) {
                        this._switchAudioModeForHeadphones();
                    }
                    else {
                        this._switchAudioModeForNormalSpeakers();
                    }
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
        Scene.prototype.freezeMaterials = function () {
            for (var i = 0; i < this.materials.length; i++) {
                this.materials[i].freeze();
            }
        };
        Scene.prototype.unfreezeMaterials = function () {
            for (var i = 0; i < this.materials.length; i++) {
                this.materials[i].unfreeze();
            }
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
            if (this._debugLayer) {
                this._debugLayer.hide();
            }
            // Events
            this.onDisposeObservable.notifyObservers(this);
            this.onDisposeObservable.clear();
            this.onBeforeRenderObservable.clear();
            this.onAfterRenderObservable.clear();
            this.detachControl();
            // Release sounds & sounds tracks
            if (BABYLON.AudioEngine) {
                this.disposeSounds();
            }
            // Detach cameras
            var canvas = this._engine.getRenderingCanvas();
            var index;
            for (index = 0; index < this.cameras.length; index++) {
                this.cameras[index].detachControl(canvas);
            }
            // Release lights
            while (this.lights.length) {
                this.lights[0].dispose();
            }
            // Release meshes
            while (this.meshes.length) {
                this.meshes[0].dispose(true);
            }
            // Release cameras
            while (this.cameras.length) {
                this.cameras[0].dispose();
            }
            // Release materials
            while (this.materials.length) {
                this.materials[0].dispose();
            }
            // Release particles
            while (this.particleSystems.length) {
                this.particleSystems[0].dispose();
            }
            // Release sprites
            while (this.spriteManagers.length) {
                this.spriteManagers[0].dispose();
            }
            // Release layers
            while (this.layers.length) {
                this.layers[0].dispose();
            }
            // Release textures
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
        Scene.prototype.createPickingRay = function (x, y, world, camera, cameraViewSpace) {
            if (cameraViewSpace === void 0) { cameraViewSpace = false; }
            var engine = this._engine;
            if (!camera) {
                if (!this.activeCamera)
                    throw new Error("Active camera not set");
                camera = this.activeCamera;
            }
            var cameraViewport = camera.viewport;
            var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            // Moving coordinates to local viewport world
            x = x / this._engine.getHardwareScalingLevel() - viewport.x;
            y = y / this._engine.getHardwareScalingLevel() - (this._engine.getRenderHeight() - viewport.y - viewport.height);
            return BABYLON.Ray.CreateNew(x, y, viewport.width, viewport.height, world ? world : BABYLON.Matrix.Identity(), cameraViewSpace ? BABYLON.Matrix.Identity() : camera.getViewMatrix(), camera.getProjectionMatrix());
            //       return BABYLON.Ray.CreateNew(x / window.devicePixelRatio, y / window.devicePixelRatio, viewport.width, viewport.height, world ? world : BABYLON.Matrix.Identity(), camera.getViewMatrix(), camera.getProjectionMatrix());
        };
        Scene.prototype.createPickingRayInCameraSpace = function (x, y, camera) {
            var engine = this._engine;
            if (!camera) {
                if (!this.activeCamera)
                    throw new Error("Active camera not set");
                camera = this.activeCamera;
            }
            var cameraViewport = camera.viewport;
            var viewport = cameraViewport.toGlobal(engine.getRenderWidth(), engine.getRenderHeight());
            var identity = BABYLON.Matrix.Identity();
            // Moving coordinates to local viewport world
            x = x / this._engine.getHardwareScalingLevel() - viewport.x;
            y = y / this._engine.getHardwareScalingLevel() - (this._engine.getRenderHeight() - viewport.y - viewport.height);
            return BABYLON.Ray.CreateNew(x, y, viewport.width, viewport.height, identity, identity, camera.getProjectionMatrix());
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
        Scene.prototype._internalPickSprites = function (ray, predicate, fastCheck, camera) {
            var pickingInfo = null;
            camera = camera || this.activeCamera;
            if (this.spriteManagers.length > 0) {
                for (var spriteIndex = 0; spriteIndex < this.spriteManagers.length; spriteIndex++) {
                    var spriteManager = this.spriteManagers[spriteIndex];
                    if (!spriteManager.isPickable) {
                        continue;
                    }
                    var result = spriteManager.intersects(ray, camera, predicate, fastCheck);
                    if (!result || !result.hit)
                        continue;
                    if (!fastCheck && pickingInfo != null && result.distance >= pickingInfo.distance)
                        continue;
                    pickingInfo = result;
                    if (fastCheck) {
                        break;
                    }
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
        Scene.prototype.pickSprite = function (x, y, predicate, fastCheck, camera) {
            /// <summary>Launch a ray to try to pick a mesh in the scene</summary>
            /// <param name="x">X position on screen</param>
            /// <param name="y">Y position on screen</param>
            /// <param name="predicate">Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true</param>
            /// <param name="fastCheck">Launch a fast check only using the bounding boxes. Can be set to null.</param>
            /// <param name="camera">camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used</param>
            return this._internalPickSprites(this.createPickingRayInCameraSpace(x, y, camera), predicate, fastCheck, camera);
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
        Scene.prototype.setPointerOverSprite = function (sprite) {
            if (this._pointerOverSprite === sprite) {
                return;
            }
            if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
                this._pointerOverSprite.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOutTrigger, BABYLON.ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
            }
            this._pointerOverSprite = sprite;
            if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
                this._pointerOverSprite.actionManager.processTrigger(BABYLON.ActionManager.OnPointerOverTrigger, BABYLON.ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
            }
        };
        Scene.prototype.getPointerOverSprite = function () {
            return this._pointerOverSprite;
        };
        // Physics
        Scene.prototype.getPhysicsEngine = function () {
            return this._physicsEngine;
        };
        /**
         * Enables physics to the current scene
         * @param {BABYLON.Vector3} [gravity] - the scene's gravity for the physics engine
         * @param {BABYLON.IPhysicsEnginePlugin} [plugin] - The physics engine to be used. defaults to OimoJS.
         * @return {boolean} was the physics engine initialized
         */
        Scene.prototype.enablePhysics = function (gravity, plugin) {
            if (this._physicsEngine) {
                return true;
            }
            try {
                this._physicsEngine = new BABYLON.PhysicsEngine(gravity, plugin);
                return true;
            }
            catch (e) {
                BABYLON.Tools.Error(e.message);
                return false;
            }
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
        /**
         *
         * Sets the gravity of the physics engine (and NOT of the scene)
         * @param {BABYLON.Vector3} [gravity] - the new gravity to be used
         */
        Scene.prototype.setGravity = function (gravity) {
            BABYLON.Tools.Warn("Deprecated, please use 'scene.getPhysicsEngine().setGravity()'");
            if (!this._physicsEngine) {
                return;
            }
            this._physicsEngine.setGravity(gravity);
        };
        /**
         * Legacy support, using the new API
         * @Deprecated
         */
        Scene.prototype.createCompoundImpostor = function (parts, options) {
            BABYLON.Tools.Warn("Scene.createCompoundImpostor is deprecated. Please use PhysicsImpostor parent/child");
            if (parts.parts) {
                options = parts;
                parts = parts.parts;
            }
            var mainMesh = parts[0].mesh;
            mainMesh.physicsImpostor = new BABYLON.PhysicsImpostor(mainMesh, parts[0].impostor, options, this);
            for (var index = 1; index < parts.length; index++) {
                var mesh = parts[index].mesh;
                if (mesh.parent !== mainMesh) {
                    mesh.position = mesh.position.subtract(mainMesh.position);
                    mesh.parent = mainMesh;
                }
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, parts[index].impostor, options, this);
            }
            mainMesh.physicsImpostor.forceUpdate();
        };
        Scene.prototype.deleteCompoundImpostor = function (compound) {
            var mesh = compound.parts[0].mesh;
            mesh.physicsImpostor.dispose();
            mesh.physicsImpostor = null;
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
            forEach = forEach || (function (item) { return; });
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
        /**
         * Overrides the default sort function applied in the renderging group to prepare the meshes.
         * This allowed control for front to back rendering or reversly depending of the special needs.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param opaqueSortCompareFn The opaque queue comparison function use to sort.
         * @param alphaTestSortCompareFn The alpha test queue comparison function use to sort.
         * @param transparentSortCompareFn The transparent queue comparison function use to sort.
         */
        Scene.prototype.setRenderingOrder = function (renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn) {
            if (opaqueSortCompareFn === void 0) { opaqueSortCompareFn = null; }
            if (alphaTestSortCompareFn === void 0) { alphaTestSortCompareFn = null; }
            if (transparentSortCompareFn === void 0) { transparentSortCompareFn = null; }
            this._renderingManager.setRenderingOrder(renderingGroupId, opaqueSortCompareFn, alphaTestSortCompareFn, transparentSortCompareFn);
        };
        /**
         * Specifies whether or not the stencil and depth buffer are cleared between two rendering groups.
         *
         * @param renderingGroupId The rendering group id corresponding to its index
         * @param autoClearDepthStencil Automatically clears depth and stencil between groups if true.
         */
        Scene.prototype.setRenderingAutoClearDepthStencil = function (renderingGroupId, autoClearDepthStencil) {
            this._renderingManager.setRenderingAutoClearDepthStencil(renderingGroupId, autoClearDepthStencil);
        };
        // Statics
        Scene._FOGMODE_NONE = 0;
        Scene._FOGMODE_EXP = 1;
        Scene._FOGMODE_EXP2 = 2;
        Scene._FOGMODE_LINEAR = 3;
        Scene.MinDeltaTime = 1.0;
        Scene.MaxDeltaTime = 1000.0;
        return Scene;
    }());
    BABYLON.Scene = Scene;
})(BABYLON || (BABYLON = {}));
