module BABYLON {
    export interface IDisposable {
        dispose(): void;
    }

    /**
     * Represents a scene to be rendered by the engine.
     * @see http://doc.babylonjs.com/page.php?p=21911
     */
    export class Scene implements IAnimatable {
        // Statics
        private static _FOGMODE_NONE = 0;
        private static _FOGMODE_EXP = 1;
        private static _FOGMODE_EXP2 = 2;
        private static _FOGMODE_LINEAR = 3;

        public static MinDeltaTime = 1.0;
        public static MaxDeltaTime = 1000.0;

        public static get FOGMODE_NONE(): number {
            return Scene._FOGMODE_NONE;
        }

        public static get FOGMODE_EXP(): number {
            return Scene._FOGMODE_EXP;
        }

        public static get FOGMODE_EXP2(): number {
            return Scene._FOGMODE_EXP2;
        }

        public static get FOGMODE_LINEAR(): number {
            return Scene._FOGMODE_LINEAR;
        }

        // Members
        public autoClear = true;
        public clearColor: any = new Color3(0.2, 0.2, 0.3);
        public ambientColor = new Color3(0, 0, 0);
        /**
        * A function to be executed before rendering this scene
        * @type {Function}
        */
        public beforeRender: () => void;
        /**
        * A function to be executed after rendering this scene
        * @type {Function}
        */
        public afterRender: () => void;
        /**
        * A function to be executed when this scene is disposed.
        * @type {Function}
        */
        public onDispose: () => void;
        public beforeCameraRender: (camera: Camera) => void;
        public afterCameraRender: (camera: Camera) => void;
        public forceWireframe = false;
        public forcePointsCloud = false;
        public forceShowBoundingBoxes = false;
        public clipPlane: Plane;
        public animationsEnabled = true;
        public constantlyUpdateMeshUnderPointer = false;

        // Animations
        public animations: Animation[] = [];

        // Pointers
        public pointerDownPredicate: (Mesh: AbstractMesh) => boolean;
        public pointerUpPredicate: (Mesh: AbstractMesh) => boolean;
        public pointerMovePredicate: (Mesh: AbstractMesh) => boolean;
        private _onPointerMove: (evt: PointerEvent) => void;
        private _onPointerDown: (evt: PointerEvent) => void;
        private _onPointerUp: (evt: PointerEvent) => void;
        public onPointerMove: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        public onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        public onPointerUp: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        public onPointerPick: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        public cameraToUseForPointers: Camera = null; // Define this parameter if you are using multiple cameras and you want to specify which one should be used for pointer position
        private _pointerX: number;
        private _pointerY: number;
        private _unTranslatedPointerX: number;
        private _unTranslatedPointerY: number;
        private _startingPointerPosition = new Vector2(0, 0);
        private _startingPointerTime = 0;
        // Mirror
        public _mirroredCameraPosition: Vector3;

        // Keyboard
        private _onKeyDown: (evt: Event) => void;
        private _onKeyUp: (evt: Event) => void;

        // Fog
        /**
        * is fog enabled on this scene.
        * @type {boolean}
        */
        public fogEnabled = true;
        public fogMode = Scene.FOGMODE_NONE;
        public fogColor = new Color3(0.2, 0.2, 0.3);
        public fogDensity = 0.1;
        public fogStart = 0;
        public fogEnd = 1000.0;

        // Lights
        /**
        * is shadow enabled on this scene.
        * @type {boolean}
        */
        public shadowsEnabled = true;
        /**
        * is light enabled on this scene.
        * @type {boolean}
        */
        public lightsEnabled = true;
        /**
        * All of the lights added to this scene.
        * @see BABYLON.Light
        * @type {BABYLON.Light[]}
        */
        public lights = new Array<Light>();
        public onNewLightAdded: (newLight?: Light, positionInArray?: number, scene?: Scene) => void;
        public onLightRemoved: (removedLight?: Light) => void;

        // Cameras
        /**
        * All of the cameras added to this scene.
        * @see BABYLON.Camera
        * @type {BABYLON.Camera[]}
        */
        public cameras = new Array<Camera>();
        public onNewCameraAdded: (newCamera?: Camera, positionInArray?: number, scene?: Scene) => void;
        public onCameraRemoved: (removedCamera?: Camera) => void;
        public activeCameras = new Array<Camera>();
        public activeCamera: Camera;

        // Meshes
        /**
        * All of the (abstract) meshes added to this scene.
        * @see BABYLON.AbstractMesh
        * @type {BABYLON.AbstractMesh[]}
        */
        public meshes = new Array<AbstractMesh>();
        public onNewMeshAdded: (newMesh?: AbstractMesh, positionInArray?: number, scene?: Scene) => void;
        public onMeshRemoved: (removedMesh?: AbstractMesh) => void;

        // Geometries
        private _geometries = new Array<Geometry>();
        public onGeometryAdded: (newGeometry?: Geometry) => void;
        public onGeometryRemoved: (removedGeometry?: Geometry) => void;

        public materials = new Array<Material>();
        public multiMaterials = new Array<MultiMaterial>();
        public defaultMaterial = new StandardMaterial("default material", this);

        // Textures
        public texturesEnabled = true;
        public textures = new Array<BaseTexture>();

        // Particles
        public particlesEnabled = true;
        public particleSystems = new Array<ParticleSystem>();

        // Sprites
        public spritesEnabled = true;
        public spriteManagers = new Array<SpriteManager>();

        // Layers
        public layers = new Array<Layer>();

        // Skeletons
        public skeletonsEnabled = true;
        public skeletons = new Array<Skeleton>();

        // Lens flares
        public lensFlaresEnabled = true;
        public lensFlareSystems = new Array<LensFlareSystem>();

        // Collisions
        public collisionsEnabled = true;
        private _workerCollisions;
        public collisionCoordinator: ICollisionCoordinator;
        public gravity = new Vector3(0, -9.807, 0);

        // Postprocesses
        public postProcessesEnabled = true;
        public postProcessManager: PostProcessManager;
        public postProcessRenderPipelineManager: PostProcessRenderPipelineManager;

        // Customs render targets
        public renderTargetsEnabled = true;
        public dumpNextRenderTargets = false;
        public customRenderTargets = new Array<RenderTargetTexture>();

        // Delay loading
        public useDelayedTextureLoading: boolean;

        // Imported meshes
        public importedMeshesFiles = new Array<String>();

        // Probes
        public probesEnabled = true;
        public reflectionProbes = new Array<ReflectionProbe>();

        // Database
        public database; //ANY

        // Actions
        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
         */
        public actionManager: ActionManager;
        public _actionManagers = new Array<ActionManager>();
        private _meshesForIntersections = new SmartArray<AbstractMesh>(256);

        // Procedural textures
        public proceduralTexturesEnabled = true;
        public _proceduralTextures = new Array<ProceduralTexture>();

        // Sound Tracks
        public mainSoundTrack: SoundTrack;
        public soundTracks = new Array<SoundTrack>();
        private _audioEnabled = true;
        private _headphone = false;

        //Simplification Queue
        public simplificationQueue: SimplificationQueue;

        // Private
        private _engine: Engine;
        private _totalVertices = 0;
        public _activeIndices = 0;
        public _activeParticles = 0;
        private _lastFrameDuration = 0;
        private _evaluateActiveMeshesDuration = 0;
        private _renderTargetsDuration = 0;
        public _particlesDuration = 0;
        private _renderDuration = 0;
        public _spritesDuration = 0;
        private _animationRatio = 0;
        private _animationStartDate: number;
        public _cachedMaterial: Material;

        private _renderId = 0;
        private _executeWhenReadyTimeoutId = -1;

        public _toBeDisposed = new SmartArray<IDisposable>(256);

        private _onReadyCallbacks = new Array<() => void>();
        private _pendingData = [];//ANY

        private _onBeforeRenderCallbacks = new Array<() => void>();
        private _onAfterRenderCallbacks = new Array<() => void>();

        private _activeMeshes = new SmartArray<Mesh>(256);
        private _processedMaterials = new SmartArray<Material>(256);
        private _renderTargets = new SmartArray<RenderTargetTexture>(256);
        public _activeParticleSystems = new SmartArray<ParticleSystem>(256);
        private _activeSkeletons = new SmartArray<Skeleton>(32);
        private _softwareSkinnedMeshes = new SmartArray<Mesh>(32);
        public _activeBones = 0;

        private _renderingManager: RenderingManager;
        private _physicsEngine: PhysicsEngine;

        public _activeAnimatables = new Array<Animatable>();

        private _transformMatrix = Matrix.Zero();
        private _pickWithRayInverseMatrix: Matrix;

        private _edgesRenderers = new SmartArray<EdgesRenderer>(16);
        private _boundingBoxRenderer: BoundingBoxRenderer;
        private _outlineRenderer: OutlineRenderer;

        private _viewMatrix: Matrix;
        private _projectionMatrix: Matrix;
        private _frustumPlanes: Plane[];

        private _selectionOctree: Octree<AbstractMesh>;

        private _pointerOverMesh: AbstractMesh;
        private _pointerOverSprite: Sprite;

        private _debugLayer: DebugLayer;

        private _depthRenderer: DepthRenderer;

        private _uniqueIdCounter = 0;

        private _pickedDownMesh: AbstractMesh;
        private _pickedDownSprite: Sprite;

        /**
         * @constructor
         * @param {BABYLON.Engine} engine - the engine to be used to render this scene.
         */
        constructor(engine: Engine) {
            this._engine = engine;

            engine.scenes.push(this);

            this._renderingManager = new RenderingManager(this);

            this.postProcessManager = new PostProcessManager(this);

            this.postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();

            this._boundingBoxRenderer = new BoundingBoxRenderer(this);

            if (OutlineRenderer) {
                this._outlineRenderer = new OutlineRenderer(this);
            }

            this.attachControl();

            this._debugLayer = new DebugLayer(this);

            if (SoundTrack) {
                this.mainSoundTrack = new SoundTrack(this, { mainTrack: true });
            }

            //simplification queue
            if (SimplificationQueue) {
                this.simplificationQueue = new SimplificationQueue();
            }

            //collision coordinator initialization. For now legacy per default.
            this.workerCollisions = false;//(!!Worker && (!!BABYLON.CollisionWorker || BABYLON.WorkerIncluded));
        }

        // Properties
        public get debugLayer(): DebugLayer {
            return this._debugLayer;
        }

        public set workerCollisions(enabled: boolean) {

            enabled = (enabled && !!Worker);

            this._workerCollisions = enabled;
            if (this.collisionCoordinator) {
                this.collisionCoordinator.destroy();
            }

            this.collisionCoordinator = enabled ? new CollisionCoordinatorWorker() : new CollisionCoordinatorLegacy();

            this.collisionCoordinator.init(this);
        }

        public get workerCollisions(): boolean {
            return this._workerCollisions;
        }

        public get SelectionOctree(): Octree<AbstractMesh> {
            return this._selectionOctree;
        }

        /**
         * The mesh that is currently under the pointer.
         * @return {BABYLON.AbstractMesh} mesh under the pointer/mouse cursor or null if none.
         */
        public get meshUnderPointer(): AbstractMesh {
            return this._pointerOverMesh;
        }

        /**
         * Current on-screen X position of the pointer
         * @return {number} X position of the pointer
         */
        public get pointerX(): number {
            return this._pointerX;
        }

        /**
         * Current on-screen Y position of the pointer
         * @return {number} Y position of the pointer
         */
        public get pointerY(): number {
            return this._pointerY;
        }

        public getCachedMaterial(): Material {
            return this._cachedMaterial;
        }

        public getBoundingBoxRenderer(): BoundingBoxRenderer {
            return this._boundingBoxRenderer;
        }

        public getOutlineRenderer(): OutlineRenderer {
            return this._outlineRenderer;
        }

        public getEngine(): Engine {
            return this._engine;
        }

        public getTotalVertices(): number {
            return this._totalVertices;
        }

        public getActiveIndices(): number {
            return this._activeIndices;
        }

        public getActiveParticles(): number {
            return this._activeParticles;
        }

        public getActiveBones(): number {
            return this._activeBones;
        }

        // Stats
        public getLastFrameDuration(): number {
            return this._lastFrameDuration;
        }

        public getEvaluateActiveMeshesDuration(): number {
            return this._evaluateActiveMeshesDuration;
        }

        public getActiveMeshes(): SmartArray<Mesh> {
            return this._activeMeshes;
        }

        public getRenderTargetsDuration(): number {
            return this._renderTargetsDuration;
        }

        public getRenderDuration(): number {
            return this._renderDuration;
        }

        public getParticlesDuration(): number {
            return this._particlesDuration;
        }

        public getSpritesDuration(): number {
            return this._spritesDuration;
        }

        public getAnimationRatio(): number {
            return this._animationRatio;
        }

        public getRenderId(): number {
            return this._renderId;
        }

        public incrementRenderId(): void {
            this._renderId++;
        }

        private _updatePointerPosition(evt: PointerEvent): void {
            var canvasRect = this._engine.getRenderingCanvasClientRect();

            this._pointerX = evt.clientX - canvasRect.left;
            this._pointerY = evt.clientY - canvasRect.top;

            this._unTranslatedPointerX = this._pointerX;
            this._unTranslatedPointerY = this._pointerY;

            if (this.cameraToUseForPointers) {
                this._pointerX = this._pointerX - this.cameraToUseForPointers.viewport.x * this._engine.getRenderWidth();
                this._pointerY = this._pointerY - this.cameraToUseForPointers.viewport.y * this._engine.getRenderHeight();
            }
        }

        // Pointers handling
        public attachControl() {
            var spritePredicate = (sprite: Sprite): boolean => {
                return sprite.isPickable && sprite.actionManager && sprite.actionManager.hasPointerTriggers;
            };

            this._onPointerMove = (evt: PointerEvent) => {
                if (!this.cameraToUseForPointers && !this.activeCamera) {
                    return;
                }

                var canvas = this._engine.getRenderingCanvas();

                this._updatePointerPosition(evt);

                if (!this.pointerMovePredicate) {
                    this.pointerMovePredicate = (mesh: AbstractMesh): boolean => mesh.isPickable && mesh.isVisible && mesh.isReady() && (this.constantlyUpdateMeshUnderPointer || mesh.actionManager !== null && mesh.actionManager !== undefined);
                }

                // Meshes
                var pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, this.pointerMovePredicate, false, this.cameraToUseForPointers);
                    
                if (pickResult.hit && pickResult.pickedMesh) {
                    this.setPointerOverSprite(null);

                    this.setPointerOverMesh(pickResult.pickedMesh);

                    if (this._pointerOverMesh.actionManager && this._pointerOverMesh.actionManager.hasPointerTriggers) {
                        canvas.style.cursor = "pointer";
                    } else {
                        canvas.style.cursor = "";
                    }
                } else {
                    this.setPointerOverMesh(null);
                    // Sprites
                    pickResult = this.pickSprite(this._unTranslatedPointerX, this._unTranslatedPointerY, spritePredicate, false, this.cameraToUseForPointers);

                    if (pickResult.hit && pickResult.pickedSprite) {
                        canvas.style.cursor = "pointer";
                        this.setPointerOverSprite(pickResult.pickedSprite);
                    } else {
                        this.setPointerOverSprite(null);
                        // Restore pointer
                        canvas.style.cursor = "";
                    }
                }

                if (this.onPointerMove) {
                    this.onPointerMove(evt, pickResult);
                }
            };

            this._onPointerDown = (evt: PointerEvent) => {
                if (!this.cameraToUseForPointers && !this.activeCamera) {
                    return;
                }

                this._updatePointerPosition(evt);
                this._startingPointerPosition.x = this._pointerX;
                this._startingPointerPosition.y = this._pointerY;
                this._startingPointerTime = new Date().getTime();

                if (!this.pointerDownPredicate) {
                    this.pointerDownPredicate = (mesh: AbstractMesh): boolean => {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && (!mesh.actionManager || mesh.actionManager.hasPointerTriggers);
                    };
                }

                // Meshes
                this._pickedDownMesh = null;
                var pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, this.pointerDownPredicate, false, this.cameraToUseForPointers);

                if (pickResult.hit && pickResult.pickedMesh) {
                    if (pickResult.pickedMesh.actionManager) {
                        this._pickedDownMesh = pickResult.pickedMesh;
                        if (pickResult.pickedMesh.actionManager.hasPickTriggers) {
                            switch (evt.button) {
                                case 0:
                                    pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnLeftPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                    break;
                                case 1:
                                    pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnCenterPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                    break;
                                case 2:
                                    pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnRightPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                    break;
                            }
                            pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnPickDownTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                        }

                        if (pickResult.pickedMesh.actionManager.hasSpecificTrigger(ActionManager.OnLongPressTrigger)) {
                            var that = this;
                            window.setTimeout(function() {
                                var pickResult = that.pick(that._unTranslatedPointerX, that._unTranslatedPointerY,
                                    (mesh: AbstractMesh): boolean => mesh.isPickable && mesh.isVisible && mesh.isReady() && mesh.actionManager && mesh.actionManager.hasSpecificTrigger(ActionManager.OnLongPressTrigger),
                                    false, that.cameraToUseForPointers);

                                if (pickResult.hit && pickResult.pickedMesh) {
                                    if (pickResult.pickedMesh.actionManager) {
                                        if (that._startingPointerTime !== 0 && ((new Date().getTime() - that._startingPointerTime) > ActionManager.LongPressDelay) && (Math.abs(that._startingPointerPosition.x - that._pointerX) < ActionManager.DragMovementThreshold && Math.abs(that._startingPointerPosition.y - that._pointerY) < ActionManager.DragMovementThreshold)) {
                                            that._startingPointerTime = 0;
                                            pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnLongPressTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                                        }
                                    }
                                }
                            }, ActionManager.LongPressDelay);
                        }
                    }
                }

                if (this.onPointerDown) {
                    this.onPointerDown(evt, pickResult);
                }

                // Sprites
                this._pickedDownSprite = null;
                if (this.spriteManagers.length > 0) {
                    pickResult = this.pickSprite(this._unTranslatedPointerX, this._unTranslatedPointerY, spritePredicate, false, this.cameraToUseForPointers);

                    if (pickResult.hit && pickResult.pickedSprite) {
                        if (pickResult.pickedSprite.actionManager) {
                            this._pickedDownSprite = pickResult.pickedSprite;
                            switch (evt.button) {
                                case 0:
                                    pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnLeftPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                                    break;
                                case 1:
                                    pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnCenterPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                                    break;
                                case 2:
                                    pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnRightPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                                    break;
                            }
                            pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnPickDownTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                        }
                    }
                }
            };

            this._onPointerUp = (evt: PointerEvent) => {
                if (!this.cameraToUseForPointers && !this.activeCamera) {
                    return;
                }
                
                this._updatePointerPosition(evt);

                if (!this.pointerUpPredicate) {
                    this.pointerUpPredicate = (mesh: AbstractMesh): boolean => {
                        return mesh.isPickable && mesh.isVisible && mesh.isReady() && (!mesh.actionManager || (mesh.actionManager.hasPickTriggers || mesh.actionManager.hasSpecificTrigger(ActionManager.OnLongPressTrigger)));
                    };
                }

                // Meshes
                var pickResult = this.pick(this._unTranslatedPointerX, this._unTranslatedPointerY, this.pointerUpPredicate, false, this.cameraToUseForPointers);

                if (pickResult.hit && pickResult.pickedMesh) {
                    if (this.onPointerPick && this._pickedDownMesh != null && pickResult.pickedMesh == this._pickedDownMesh) {
                        this.onPointerPick(evt, pickResult);
                    }
                    if (pickResult.pickedMesh.actionManager) {
                        pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnPickUpTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));

                        if (Math.abs(this._startingPointerPosition.x - this._pointerX) < ActionManager.DragMovementThreshold && Math.abs(this._startingPointerPosition.y - this._pointerY) < ActionManager.DragMovementThreshold) {
                            pickResult.pickedMesh.actionManager.processTrigger(ActionManager.OnPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh, evt));
                        }
                    }
                }
                if (this._pickedDownMesh && this._pickedDownMesh !== pickResult.pickedMesh) {
                    this._pickedDownMesh.actionManager.processTrigger(ActionManager.OnPickOutTrigger, ActionEvent.CreateNew(this._pickedDownMesh, evt));
                }

                if (this.onPointerUp) {
                    this.onPointerUp(evt, pickResult);
                }

                this._startingPointerTime = 0;
                
                // Sprites
                if (this.spriteManagers.length > 0) {
                    pickResult = this.pickSprite(this._unTranslatedPointerX, this._unTranslatedPointerY, spritePredicate, false, this.cameraToUseForPointers);

                    if (pickResult.hit && pickResult.pickedSprite) {
                        if (pickResult.pickedSprite.actionManager) {
                            pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnPickUpTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));

                            if (Math.abs(this._startingPointerPosition.x - this._pointerX) < ActionManager.DragMovementThreshold && Math.abs(this._startingPointerPosition.y - this._pointerY) < ActionManager.DragMovementThreshold) {
                                pickResult.pickedSprite.actionManager.processTrigger(ActionManager.OnPickTrigger, ActionEvent.CreateNewFromSprite(pickResult.pickedSprite, this, evt));
                            }
                        }
                    }
                    if (this._pickedDownSprite && this._pickedDownSprite !== pickResult.pickedSprite) {
                        this._pickedDownSprite.actionManager.processTrigger(ActionManager.OnPickOutTrigger, ActionEvent.CreateNewFromSprite(this._pickedDownSprite, this, evt));
                    }

                }
            };

            this._onKeyDown = (evt: Event) => {
                if (this.actionManager) {
                    this.actionManager.processTrigger(ActionManager.OnKeyDownTrigger, ActionEvent.CreateNewFromScene(this, evt));
                }
            };

            this._onKeyUp = (evt: Event) => {
                if (this.actionManager) {
                    this.actionManager.processTrigger(ActionManager.OnKeyUpTrigger, ActionEvent.CreateNewFromScene(this, evt));
                }
            };


            var eventPrefix = Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "move", this._onPointerMove, false);
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "down", this._onPointerDown, false);
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "up", this._onPointerUp, false);

            // Wheel
            this._engine.getRenderingCanvas().addEventListener('mousewheel', this._onPointerMove, false);
            this._engine.getRenderingCanvas().addEventListener('DOMMouseScroll', this._onPointerMove, false);

            Tools.RegisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp }
            ]);
        }

        public detachControl() {
            var eventPrefix = Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "move", this._onPointerMove);
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "down", this._onPointerDown);
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "up", this._onPointerUp);

            // Wheel
            this._engine.getRenderingCanvas().removeEventListener('mousewheel', this._onPointerMove);
            this._engine.getRenderingCanvas().removeEventListener('DOMMouseScroll', this._onPointerMove);

            Tools.UnregisterTopRootEvents([
                { name: "keydown", handler: this._onKeyDown },
                { name: "keyup", handler: this._onKeyUp }
            ]);
        }

        // Ready
        public isReady(): boolean {
            if (this._pendingData.length > 0) {
                return false;
            }
            var index: number;
            for (index = 0; index < this._geometries.length; index++) {
                var geometry = this._geometries[index];

                if (geometry.delayLoadState === Engine.DELAYLOADSTATE_LOADING) {
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
        }

        public resetCachedMaterial(): void {
            this._cachedMaterial = null;
        }

        public registerBeforeRender(func: () => void): void {
            this._onBeforeRenderCallbacks.push(func);
        }

        public unregisterBeforeRender(func: () => void): void {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        }

        public registerAfterRender(func: () => void): void {
            this._onAfterRenderCallbacks.push(func);
        }

        public unregisterAfterRender(func: () => void): void {
            var index = this._onAfterRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onAfterRenderCallbacks.splice(index, 1);
            }
        }

        public _addPendingData(data): void {
            this._pendingData.push(data);
        }

        public _removePendingData(data): void {
            var index = this._pendingData.indexOf(data);

            if (index !== -1) {
                this._pendingData.splice(index, 1);
            }
        }

        public getWaitingItemsCount(): number {
            return this._pendingData.length;
        }

        /**
         * Registers a function to be executed when the scene is ready.
         * @param {Function} func - the function to be executed.
         */
        public executeWhenReady(func: () => void): void {
            this._onReadyCallbacks.push(func);

            if (this._executeWhenReadyTimeoutId !== -1) {
                return;
            }

            this._executeWhenReadyTimeoutId = setTimeout(() => {
                this._checkIsReady();
            }, 150);
        }

        public _checkIsReady() {
            if (this.isReady()) {
                this._onReadyCallbacks.forEach(func => {
                    func();
                });

                this._onReadyCallbacks = [];
                this._executeWhenReadyTimeoutId = -1;
                return;
            }

            this._executeWhenReadyTimeoutId = setTimeout(() => {
                this._checkIsReady();
            }, 150);
        }

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
       
    
   
    ////get all animatables for target reverse order ,,, at[0] is last played animation
   public GetAllAnimatablesByTarget(target: any): Animatable {
            var AT; AT = [];
            
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    AT.push(this._activeAnimatables[index]);
                    
                }
            }
            if(AT.length)  { AT.reverse() };
            return AT;
           
        };
   
   //////get current/last existing paused or playing  animatable for target
   public GetCurrentAnimatableByTarget(target: any): Animatable {
            var AT; AT = [];
            
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    AT.push(this._activeAnimatables[index]);
                    
                }
            }
            
            if(AT.length)
            {
                 AT.reverse();
                 return AT[0]   
            }
            else 
            {
                return null ///we have no animatable for target
            }
        };
   
    public beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio: number = 1.0, onAnimationEnd?: () => void, animatable?: Animatable,transitionSpeed: number = 1.0 ): Animatable {
    
    
     //////use Scene.GetCurrentAnimatableByTarget(target) to get current primary playing animatable for target;
     
     
          //  this.stopAnimation(target);
            var transitionFunction = null;
            if(transitionSpeed < 1)  {
                                       transitionFunction = new BABYLON.LinearFADE(transitionSpeed,this._engine);
                                     }
              
            
            if (!animatable) {
                animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd,animatable,transitionFunction);
                //animatable.transitionFunction = transitionFunction;
            }

            // Local animations
            if (target.animations) {
                animatable.appendAnimations(target, target.animations);
               
                   
                   
                   
            }

            // Children animations
            if (target.getAnimatables) {
                var animatables = target.getAnimatables();
                for (var index = 0; index < animatables.length; index++) {
                    this.beginAnimation(animatables[index], from, to, loop, speedRatio, onAnimationEnd, animatable,transitionSpeed);
                }
            }

            animatable.reset();

               var maxAnimations = 2;
              var animtables; animtables = []; animtables = this.GetAllAnimatablesByTarget(target); 
              
	       if (animtables.length > maxAnimations) {
                for (var i = maxAnimations; i < (animtables.length); i++) {
                    animtables[i].stop();
                }
            }
      



            return animatable;
        }


        public beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            var animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, animations);

            return animatable;
        }

        public getAnimatableByTarget(target: any): Animatable {
            for (var index = 0; index < this._activeAnimatables.length; index++) {
                if (this._activeAnimatables[index].target === target) {
                    return this._activeAnimatables[index];
                }
            }

            return null;
        }

        public get Animatables(): Animatable[] {
            return this._activeAnimatables;
        }

        /**
         * Will stop the animation of the given target
         * @param target - the target 
         * @see beginAnimation 
         */
        public stopAnimation(target: any): void {
            var animatable = this.getAnimatableByTarget(target);

            if (animatable) {
                animatable.stop();
            }
        }

        private _animate(): void {
            if (!this.animationsEnabled || this._activeAnimatables.length === 0) {
                return;
            }

            if (!this._animationStartDate) {
                if (this._pendingData.length > 0) {
                    return;
                }

                this._animationStartDate = Tools.Now;
            }
            // Getting time
            var now = Tools.Now;
            var delay = now - this._animationStartDate;

            for (var index = 0; index < this._activeAnimatables.length; index++) {
                this._activeAnimatables[index]._animate(delay);
            }
        }

        // Matrix
        public getViewMatrix(): Matrix {
            return this._viewMatrix;
        }

        public getProjectionMatrix(): Matrix {
            return this._projectionMatrix;
        }

        public getTransformMatrix(): Matrix {
            return this._transformMatrix;
        }

        public setTransformMatrix(view: Matrix, projection: Matrix): void {
            this._viewMatrix = view;
            this._projectionMatrix = projection;

            this._viewMatrix.multiplyToRef(this._projectionMatrix, this._transformMatrix);
        }

        // Methods

        public addMesh(newMesh: AbstractMesh) {
            newMesh.uniqueId = this._uniqueIdCounter++;
            var position = this.meshes.push(newMesh);

            //notify the collision coordinator
            this.collisionCoordinator.onMeshAdded(newMesh);

            if (this.onNewMeshAdded) {
                this.onNewMeshAdded(newMesh, position, this);
            }
        }

        public removeMesh(toRemove: AbstractMesh): number {
            var index = this.meshes.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.meshes.splice(index, 1);
            }
            //notify the collision coordinator
            this.collisionCoordinator.onMeshRemoved(toRemove);

            if (this.onMeshRemoved) {
                this.onMeshRemoved(toRemove);
            }
            return index;
        }

        public removeSkeleton(toRemove: Skeleton): number {
            var index = this.skeletons.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.skeletons.splice(index, 1);
            }

            return index;
        }

        public removeLight(toRemove: Light): number {
            var index = this.lights.indexOf(toRemove);
            if (index !== -1) {
                // Remove from the scene if mesh found 
                this.lights.splice(index, 1);
            }
            if (this.onLightRemoved) {
                this.onLightRemoved(toRemove);
            }
            return index;
        }

        public removeCamera(toRemove: Camera): number {
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
                } else {
                    this.activeCamera = null;
                }
            }
            if (this.onCameraRemoved) {
                this.onCameraRemoved(toRemove);
            }
            return index;
        }

        public addLight(newLight: Light) {
            newLight.uniqueId = this._uniqueIdCounter++;
            var position = this.lights.push(newLight);
            if (this.onNewLightAdded) {
                this.onNewLightAdded(newLight, position, this);
            }
        }

        public addCamera(newCamera: Camera) {
            newCamera.uniqueId = this._uniqueIdCounter++;
            var position = this.cameras.push(newCamera);
            if (this.onNewCameraAdded) {
                this.onNewCameraAdded(newCamera, position, this);
            }
        }
        
        /**
         * Switch active camera
         * @param {Camera} newCamera - new active camera
		 * @param {boolean} attachControl - call attachControl for the new active camera (default: true)
         */
        public swithActiveCamera(newCamera: Camera, attachControl = true) {
            var canvas = this._engine.getRenderingCanvas();
            this.activeCamera.detachControl(canvas);
            this.activeCamera = newCamera;
            if (attachControl) {
                newCamera.attachControl(canvas);
            }
        }

        /**
         * sets the active camera of the scene using its ID
         * @param {string} id - the camera's ID
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        public setActiveCameraByID(id: string): Camera {
            var camera = this.getCameraByID(id);

            if (camera) {
                this.activeCamera = camera;
                return camera;
            }

            return null;
        }

        /**
         * sets the active camera of the scene using its name
         * @param {string} name - the camera's name
         * @return {BABYLON.Camera|null} the new active camera or null if none found.
         * @see activeCamera
         */
        public setActiveCameraByName(name: string): Camera {
            var camera = this.getCameraByName(name);

            if (camera) {
                this.activeCamera = camera;
                return camera;
            }

            return null;
        }

        /**
         * get a material using its id
         * @param {string} the material's ID
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        public getMaterialByID(id: string): Material {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].id === id) {
                    return this.materials[index];
                }
            }

            return null;
        }

        /**
         * get a material using its name
         * @param {string} the material's name
         * @return {BABYLON.Material|null} the material or null if none found.
         */
        public getMaterialByName(name: string): Material {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].name === name) {
                    return this.materials[index];
                }
            }

            return null;
        }

        public getLensFlareSystemByName(name: string): LensFlareSystem {
            for (var index = 0; index < this.lensFlareSystems.length; index++) {
                if (this.lensFlareSystems[index].name === name) {
                    return this.lensFlareSystems[index];
                }
            }

            return null;
        }

        public getCameraByID(id: string): Camera {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].id === id) {
                    return this.cameras[index];
                }
            }

            return null;
        }

        public getCameraByUniqueID(uniqueId: number): Camera {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].uniqueId === uniqueId) {
                    return this.cameras[index];
                }
            }

            return null;
        }

        /**
         * get a camera using its name
         * @param {string} the camera's name
         * @return {BABYLON.Camera|null} the camera or null if none found.
         */
        public getCameraByName(name: string): Camera {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].name === name) {
                    return this.cameras[index];
                }
            }

            return null;
        }

        /**
         * get a bone using its id
         * @param {string} the bone's id
         * @return {BABYLON.Bone|null} the bone or null if not found
         */
        public getBoneByID(id: string): Bone {
            for (var skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
                var skeleton = this.skeletons[skeletonIndex];
                for (var boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                    if (skeleton.bones[boneIndex].id === id) {
                        return skeleton.bones[boneIndex];
                    }
                }
            }

            return null;
        }

        /**
        * get a bone using its id
        * @param {string} the bone's name
        * @return {BABYLON.Bone|null} the bone or null if not found
        */
        public getBoneByName(name: string): Bone {
            for (var skeletonIndex = 0; skeletonIndex < this.skeletons.length; skeletonIndex++) {
                var skeleton = this.skeletons[skeletonIndex];
                for (var boneIndex = 0; boneIndex < skeleton.bones.length; boneIndex++) {
                    if (skeleton.bones[boneIndex].name === name) {
                        return skeleton.bones[boneIndex];
                    }
                }
            }

            return null;
        }

        /**
         * get a light node using its name
         * @param {string} the light's name
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        public getLightByName(name: string): Light {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].name === name) {
                    return this.lights[index];
                }
            }

            return null;
        }

        /**
         * get a light node using its ID
         * @param {string} the light's id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        public getLightByID(id: string): Light {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].id === id) {
                    return this.lights[index];
                }
            }

            return null;
        }

        /**
         * get a light node using its scene-generated unique ID
         * @param {number} the light's unique id
         * @return {BABYLON.Light|null} the light or null if none found.
         */
        public getLightByUniqueID(uniqueId: number): Light {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].uniqueId === uniqueId) {
                    return this.lights[index];
                }
            }

            return null;
        }


        /**
         * get a particle system by id
         * @param id {number} the particle system id
         * @return {BABYLON.ParticleSystem|null} the corresponding system or null if none found.
         */
        public getParticleSystemByID(id: string): ParticleSystem {
            for (var index = 0; index < this.particleSystems.length; index++) {
                if (this.particleSystems[index].id === id) {
                    return this.particleSystems[index];
                }
            }

            return null;
        }

        /**
         * get a geometry using its ID
         * @param {string} the geometry's id
         * @return {BABYLON.Geometry|null} the geometry or null if none found.
         */
        public getGeometryByID(id: string): Geometry {
            for (var index = 0; index < this._geometries.length; index++) {
                if (this._geometries[index].id === id) {
                    return this._geometries[index];
                }
            }

            return null;
        }

        /**
         * add a new geometry to this scene.
         * @param {BABYLON.Geometry} geometry - the geometry to be added to the scene.
         * @param {boolean} [force] - force addition, even if a geometry with this ID already exists
         * @return {boolean} was the geometry added or not
         */
        public pushGeometry(geometry: Geometry, force?: boolean): boolean {
            if (!force && this.getGeometryByID(geometry.id)) {
                return false;
            }

            this._geometries.push(geometry);

            //notify the collision coordinator
            this.collisionCoordinator.onGeometryAdded(geometry);

            if (this.onGeometryAdded) {
                this.onGeometryAdded(geometry);
            }

            return true;
        }

        /**
         * Removes an existing geometry
         * @param {BABYLON.Geometry} geometry - the geometry to be removed from the scene.
         * @return {boolean} was the geometry removed or not
         */
        public removeGeometry(geometry: Geometry): boolean {
            var index = this._geometries.indexOf(geometry);

            if (index > -1) {
                this._geometries.splice(index, 1);

                //notify the collision coordinator
                this.collisionCoordinator.onGeometryDeleted(geometry);

                if (this.onGeometryRemoved) {
                    this.onGeometryRemoved(geometry);
                }
                return true;
            }
            return false;
        }

        public getGeometries(): Geometry[] {
            return this._geometries;
        }

        /**
         * Get the first added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        public getMeshByID(id: string): AbstractMesh {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        /**
         * Get a mesh with its auto-generated unique id
         * @param {number} uniqueId - the unique id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        public getMeshByUniqueID(uniqueId: number): AbstractMesh {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].uniqueId === uniqueId) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        /**
         * Get a the last added mesh found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.AbstractMesh|null} the mesh found or null if not found at all.
         */
        public getLastMeshByID(id: string): AbstractMesh {
            for (var index = this.meshes.length - 1; index >= 0; index--) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        /**
         * Get a the last added node (Mesh, Camera, Light) found of a given ID
         * @param {string} id - the id to search for
         * @return {BABYLON.Node|null} the node found or null if not found at all.
         */
        public getLastEntryByID(id: string): Node {
            var index: number;
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
        }

        public getNodeByID(id: string): Node {
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
        }

        public getNodeByName(name: string): Node {
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
        }

        public getMeshByName(name: string): AbstractMesh {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].name === name) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        public getSoundByName(name: string): Sound {
            var index: number;
            if (AudioEngine) {
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
        }

        public getLastSkeletonByID(id: string): Skeleton {
            for (var index = this.skeletons.length - 1; index >= 0; index--) {
                if (this.skeletons[index].id === id) {
                    return this.skeletons[index];
                }
            }

            return null;
        }

        public getSkeletonById(id: string): Skeleton {
            for (var index = 0; index < this.skeletons.length; index++) {
                if (this.skeletons[index].id === id) {
                    return this.skeletons[index];
                }
            }

            return null;
        }

        public getSkeletonByName(name: string): Skeleton {
            for (var index = 0; index < this.skeletons.length; index++) {
                if (this.skeletons[index].name === name) {
                    return this.skeletons[index];
                }
            }

            return null;
        }

        public isActiveMesh(mesh: Mesh): boolean {
            return (this._activeMeshes.indexOf(mesh) !== -1);
        }

        private _evaluateSubMesh(subMesh: SubMesh, mesh: AbstractMesh): void {
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
                    this._activeIndices += subMesh.indexCount;
                    this._renderingManager.dispatch(subMesh);
                }
            }
        }

        private _evaluateActiveMeshes(): void {
            this.activeCamera._activeMeshes.reset();
            this._activeMeshes.reset();
            this._renderingManager.reset();
            this._processedMaterials.reset();
            this._activeParticleSystems.reset();
            this._activeSkeletons.reset();
            this._softwareSkinnedMeshes.reset();
            this._boundingBoxRenderer.reset();
            this._edgesRenderers.reset();

            if (!this._frustumPlanes) {
                this._frustumPlanes = Frustum.GetPlanes(this._transformMatrix);
            } else {
                Frustum.GetPlanesToRef(this._transformMatrix, this._frustumPlanes);
            }

            // Meshes
            var meshes: AbstractMesh[];
            var len: number;

            if (this._selectionOctree) { // Octree
                var selection = this._selectionOctree.select(this._frustumPlanes);
                meshes = selection.data;
                len = selection.length;
            } else { // Full scene traversal
                len = this.meshes.length;
                meshes = this.meshes;
            }

            for (var meshIndex = 0; meshIndex < len; meshIndex++) {
                var mesh = meshes[meshIndex];

                if (mesh.isBlocked) {
                    continue;
                }

                this._totalVertices += mesh.getTotalVertices();

                if (!mesh.isReady() || !mesh.isEnabled()) {
                    continue;
                }

                mesh.computeWorldMatrix();

                // Intersections
                if (mesh.actionManager && mesh.actionManager.hasSpecificTriggers([ActionManager.OnIntersectionEnterTrigger, ActionManager.OnIntersectionExitTrigger])) {
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

                    this._activeMesh(meshLOD);
                }
            }

            // Particle systems
            var beforeParticlesDate = Tools.Now;
            if (this.particlesEnabled) {
                Tools.StartPerformanceCounter("Particles", this.particleSystems.length > 0);
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
                Tools.EndPerformanceCounter("Particles", this.particleSystems.length > 0);
            }
            this._particlesDuration += Tools.Now - beforeParticlesDate;
        }

        private _activeMesh(mesh: AbstractMesh): void {
            if (mesh.skeleton && this.skeletonsEnabled) {
                this._activeSkeletons.pushNoDuplicate(mesh.skeleton);

                if (!mesh.computeBonesUsingShaders) {
                    this._softwareSkinnedMeshes.pushNoDuplicate(mesh);
                }
            }

            if (mesh.showBoundingBox || this.forceShowBoundingBoxes) {
                this._boundingBoxRenderer.renderList.push(mesh.getBoundingInfo().boundingBox);
            }

            if (mesh._edgesRenderer) {
                this._edgesRenderers.push(mesh._edgesRenderer);
            }

            if (mesh && mesh.subMeshes) {
                // Submeshes Octrees
                var len: number;
                var subMeshes: SubMesh[];

                if (mesh._submeshesOctree && mesh.useOctreeForRenderingSelection) {
                    var intersections = mesh._submeshesOctree.select(this._frustumPlanes);

                    len = intersections.length;
                    subMeshes = intersections.data;
                } else {
                    subMeshes = mesh.subMeshes;
                    len = subMeshes.length;
                }

                for (var subIndex = 0; subIndex < len; subIndex++) {
                    var subMesh = subMeshes[subIndex];

                    this._evaluateSubMesh(subMesh, mesh);
                }
            }
        }

        public updateTransformMatrix(force?: boolean): void {
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix(force));
        }

        private _renderForCamera(camera: Camera): void {
            var engine = this._engine;

            this.activeCamera = camera;

            if (!this.activeCamera)
                throw new Error("Active camera not set");

            Tools.StartPerformanceCounter("Rendering camera " + this.activeCamera.name);

            // Viewport
            engine.setViewport(this.activeCamera.viewport);

            // Camera
            this.resetCachedMaterial();
            this._renderId++;
            this.updateTransformMatrix();

            if (this.beforeCameraRender) {
                this.beforeCameraRender(this.activeCamera);
            }

            // Meshes
            var beforeEvaluateActiveMeshesDate = Tools.Now;
            Tools.StartPerformanceCounter("Active meshes evaluation");
            this._evaluateActiveMeshes();
            this._evaluateActiveMeshesDuration += Tools.Now - beforeEvaluateActiveMeshesDate;
            Tools.EndPerformanceCounter("Active meshes evaluation");

            // Skeletons
            for (var skeletonIndex = 0; skeletonIndex < this._activeSkeletons.length; skeletonIndex++) {
                var skeleton = this._activeSkeletons.data[skeletonIndex];

                skeleton.prepare();
            }

            // Software skinning
            for (var softwareSkinnedMeshIndex = 0; softwareSkinnedMeshIndex < this._softwareSkinnedMeshes.length; softwareSkinnedMeshIndex++) {
                var mesh = this._softwareSkinnedMeshes.data[softwareSkinnedMeshIndex];

                mesh.applySkeleton(mesh.skeleton);
            }

            // Render targets
            var beforeRenderTargetDate = Tools.Now;
            if (this.renderTargetsEnabled && this._renderTargets.length > 0) {
                Tools.StartPerformanceCounter("Render targets", this._renderTargets.length > 0);
                for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    var renderTarget = this._renderTargets.data[renderIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        var hasSpecialRenderTargetCamera = renderTarget.activeCamera && renderTarget.activeCamera !== this.activeCamera;
                        renderTarget.render(hasSpecialRenderTargetCamera, this.dumpNextRenderTargets);
                    }
                }
                Tools.EndPerformanceCounter("Render targets", this._renderTargets.length > 0);

                this._renderId++;
                engine.restoreDefaultFramebuffer(); // Restore back buffer
            }
            this._renderTargetsDuration += Tools.Now - beforeRenderTargetDate;

            // Prepare Frame
            this.postProcessManager._prepareFrame();

            var beforeRenderDate = Tools.Now;
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
            Tools.StartPerformanceCounter("Main render");
            this._renderingManager.render(null, null, true, true);
            Tools.EndPerformanceCounter("Main render");

            // Bounding boxes
            this._boundingBoxRenderer.render();

            // Edges
            for (var edgesRendererIndex = 0; edgesRendererIndex < this._edgesRenderers.length; edgesRendererIndex++) {
                this._edgesRenderers.data[edgesRendererIndex].render();
            }

            // Lens flares
            if (this.lensFlaresEnabled) {
                Tools.StartPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
                for (var lensFlareSystemIndex = 0; lensFlareSystemIndex < this.lensFlareSystems.length; lensFlareSystemIndex++) {

                    var lensFlareSystem = this.lensFlareSystems[lensFlareSystemIndex];
                    if ((camera.layerMask & lensFlareSystem.layerMask) !== 0) {
                        lensFlareSystem.render();
                    }
                }
                Tools.EndPerformanceCounter("Lens flares", this.lensFlareSystems.length > 0);
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

            this._renderDuration += Tools.Now - beforeRenderDate;

            // Finalize frame
            this.postProcessManager._finalizeFrame(camera.isIntermediate);

            // Update camera
            this.activeCamera._updateFromScene();

            // Reset some special arrays
            this._renderTargets.reset();

            if (this.afterCameraRender) {
                this.afterCameraRender(this.activeCamera);
            }

            Tools.EndPerformanceCounter("Rendering camera " + this.activeCamera.name);
        }

        private _processSubCameras(camera: Camera): void {
            if (camera.cameraRigMode === Camera.RIG_MODE_NONE) {
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
        }

        private _checkIntersections(): void {
            for (var index = 0; index < this._meshesForIntersections.length; index++) {
                var sourceMesh = this._meshesForIntersections.data[index];

                for (var actionIndex = 0; actionIndex < sourceMesh.actionManager.actions.length; actionIndex++) {
                    var action = sourceMesh.actionManager.actions[actionIndex];

                    if (action.trigger === ActionManager.OnIntersectionEnterTrigger || action.trigger === ActionManager.OnIntersectionExitTrigger) {
                        var parameters = action.getTriggerParameter();
                        var otherMesh = parameters instanceof AbstractMesh ? parameters : parameters.mesh;

                        var areIntersecting = otherMesh.intersectsMesh(sourceMesh, parameters.usePreciseIntersection);
                        var currentIntersectionInProgress = sourceMesh._intersectionsInProgress.indexOf(otherMesh);

                        if (areIntersecting && currentIntersectionInProgress === -1) {
                            if (action.trigger === ActionManager.OnIntersectionEnterTrigger) {
                                action._executeCurrent(ActionEvent.CreateNew(sourceMesh, null, otherMesh));
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            } else if (action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.push(otherMesh);
                            }
                        } else if (!areIntersecting && currentIntersectionInProgress > -1) {
                            //They intersected, and now they don't.

                            //is this trigger an exit trigger? execute an event.
                            if (action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                action._executeCurrent(ActionEvent.CreateNew(sourceMesh, null, otherMesh));
                            }

                            //if this is an exit trigger, or no exit trigger exists, remove the id from the intersection in progress array.
                            if (!sourceMesh.actionManager.hasSpecificTrigger(ActionManager.OnIntersectionExitTrigger) || action.trigger === ActionManager.OnIntersectionExitTrigger) {
                                sourceMesh._intersectionsInProgress.splice(currentIntersectionInProgress, 1);
                            }
                        }
                    }
                }
            }
        }

        public render(): void {
            var startDate = Tools.Now;
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

            Tools.StartPerformanceCounter("Scene rendering");

            // Actions
            if (this.actionManager) {
                this.actionManager.processTrigger(ActionManager.OnEveryFrameTrigger, null);
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
                Tools.StartPerformanceCounter("Physics");
                this._physicsEngine._step(deltaTime / 1000.0);
                Tools.EndPerformanceCounter("Physics");
            }

            // Before render
            if (this.beforeRender) {
                this.beforeRender();
            }
            var callbackIndex: number;
            for (callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // Customs render targets
            var beforeRenderTargetDate = Tools.Now;
            var engine = this.getEngine();
            var currentActiveCamera = this.activeCamera;
            if (this.renderTargetsEnabled) {
                Tools.StartPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);
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
                Tools.EndPerformanceCounter("Custom render targets", this.customRenderTargets.length > 0);

                this._renderId++;
            }

            if (this.customRenderTargets.length > 0) { // Restore back buffer
                engine.restoreDefaultFramebuffer();
            }
            this._renderTargetsDuration += Tools.Now - beforeRenderTargetDate;
            this.activeCamera = currentActiveCamera;

            // Procedural textures
            if (this.proceduralTexturesEnabled) {
                Tools.StartPerformanceCounter("Procedural textures", this._proceduralTextures.length > 0);
                for (var proceduralIndex = 0; proceduralIndex < this._proceduralTextures.length; proceduralIndex++) {
                    var proceduralTexture = this._proceduralTextures[proceduralIndex];
                    if (proceduralTexture._shouldRender()) {
                        proceduralTexture.render();
                    }
                }
                Tools.EndPerformanceCounter("Procedural textures", this._proceduralTextures.length > 0);
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
                    if (cameraIndex > 0) {
                        this._engine.clear(0, false, true);
                    }

                    this._processSubCameras(this.activeCameras[cameraIndex]);
                }
            } else {
                if (!this.activeCamera) {
                    throw new Error("No camera defined");
                }

                this._processSubCameras(this.activeCamera);
            }

            // Intersection checks
            this._checkIntersections();

            // Update the audio listener attached to the camera
            if (AudioEngine) {
                this._updateAudioParameters();
            }

            // After render
            if (this.afterRender) {
                this.afterRender();
            }

            for (callbackIndex = 0; callbackIndex < this._onAfterRenderCallbacks.length; callbackIndex++) {
                this._onAfterRenderCallbacks[callbackIndex]();
            }

            // Cleaning
            for (var index = 0; index < this._toBeDisposed.length; index++) {
                this._toBeDisposed.data[index].dispose();
                this._toBeDisposed[index] = null;
            }

            this._toBeDisposed.reset();

            if (this.dumpNextRenderTargets) {
                this.dumpNextRenderTargets = false;
            }

            Tools.EndPerformanceCounter("Scene rendering");
            this._lastFrameDuration = Tools.Now - startDate;
        }

        private _updateAudioParameters() {
            if (!this.audioEnabled || (this.mainSoundTrack.soundCollection.length === 0 && this.soundTracks.length === 1)) {
                return;
            }

            var listeningCamera: Camera;
            var audioEngine = Engine.audioEngine;

            if (this.activeCameras.length > 0) {
                listeningCamera = this.activeCameras[0];
            } else {
                listeningCamera = this.activeCamera;
            }

            if (listeningCamera && audioEngine.canUseWebAudio) {
                audioEngine.audioContext.listener.setPosition(listeningCamera.position.x, listeningCamera.position.y, listeningCamera.position.z);
                var mat = Matrix.Invert(listeningCamera.getViewMatrix());
                var cameraDirection = Vector3.TransformNormal(new Vector3(0, 0, -1), mat);
                cameraDirection.normalize();
                audioEngine.audioContext.listener.setOrientation(cameraDirection.x, cameraDirection.y, cameraDirection.z, 0, 1, 0);
                var i: number;
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
        }

        // Audio
        public get audioEnabled(): boolean {
            return this._audioEnabled;
        }

        public set audioEnabled(value: boolean) {
            this._audioEnabled = value;
            if (AudioEngine) {
                if (this._audioEnabled) {
                    this._enableAudio();
                }
                else {
                    this._disableAudio();
                }
            }
        }

        private _disableAudio() {
            var i: number;
            for (i = 0; i < this.mainSoundTrack.soundCollection.length; i++) {
                this.mainSoundTrack.soundCollection[i].pause();
            }
            for (i = 0; i < this.soundTracks.length; i++) {
                for (var j = 0; j < this.soundTracks[i].soundCollection.length; j++) {
                    this.soundTracks[i].soundCollection[j].pause();
                }
            }
        }

        private _enableAudio() {
            var i: number;
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
        }

        public get headphone(): boolean {
            return this._headphone;
        }

        public set headphone(value: boolean) {
            this._headphone = value;
            if (AudioEngine) {
                if (this._headphone) {
                    this._switchAudioModeForHeadphones();
                }
                else {
                    this._switchAudioModeForNormalSpeakers();
                }
            }
        }

        private _switchAudioModeForHeadphones() {
            this.mainSoundTrack.switchPanningModelToHRTF();

            for (var i = 0; i < this.soundTracks.length; i++) {
                this.soundTracks[i].switchPanningModelToHRTF();
            }
        }

        private _switchAudioModeForNormalSpeakers() {
            this.mainSoundTrack.switchPanningModelToEqualPower();

            for (var i = 0; i < this.soundTracks.length; i++) {
                this.soundTracks[i].switchPanningModelToEqualPower();
            }
        }

        public enableDepthRenderer(): DepthRenderer {
            if (this._depthRenderer) {
                return this._depthRenderer;
            }

            this._depthRenderer = new DepthRenderer(this);

            return this._depthRenderer;
        }

        public disableDepthRenderer(): void {
            if (!this._depthRenderer) {
                return;
            }

            this._depthRenderer.dispose();
            this._depthRenderer = null;
        }

        public freezeMaterials(): void {
            for (var i = 0; i < this.materials.length; i++) {
                this.materials[i].freeze();
            }
        }

        public unfreezeMaterials(): void {
            for (var i = 0; i < this.materials.length; i++) {
                this.materials[i].unfreeze();
            }
        }

        public dispose(): void {
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
            if (AudioEngine) {
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
        }

        // Release sounds & sounds tracks
        public disposeSounds() {
            this.mainSoundTrack.dispose();

            for (var scIndex = 0; scIndex < this.soundTracks.length; scIndex++) {
                this.soundTracks[scIndex].dispose();
            }
        }

        // Octrees
        public getWorldExtends(): { min: Vector3; max: Vector3 } {
            var min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];

                mesh.computeWorldMatrix(true);
                var minBox = mesh.getBoundingInfo().boundingBox.minimumWorld;
                var maxBox = mesh.getBoundingInfo().boundingBox.maximumWorld;

                Tools.CheckExtends(minBox, min, max);
                Tools.CheckExtends(maxBox, min, max);
            }

            return {
                min: min,
                max: max
            };
        }

        public createOrUpdateSelectionOctree(maxCapacity = 64, maxDepth = 2): Octree<AbstractMesh> {
            if (!this._selectionOctree) {
                this._selectionOctree = new Octree<AbstractMesh>(Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
            }

            var worldExtends = this.getWorldExtends();

            // Update octree
            this._selectionOctree.update(worldExtends.min, worldExtends.max, this.meshes);

            return this._selectionOctree;
        }

        // Picking
        public createPickingRay(x: number, y: number, world: Matrix, camera: Camera, cameraViewSpace = false): Ray {
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
            return Ray.CreateNew(x, y, viewport.width, viewport.height, world ? world : Matrix.Identity(), cameraViewSpace ? Matrix.Identity() : camera.getViewMatrix(), camera.getProjectionMatrix());
            //       return BABYLON.Ray.CreateNew(x / window.devicePixelRatio, y / window.devicePixelRatio, viewport.width, viewport.height, world ? world : BABYLON.Matrix.Identity(), camera.getViewMatrix(), camera.getProjectionMatrix());
        }

        public createPickingRayInCameraSpace(x: number, y: number, camera: Camera): Ray {
            var engine = this._engine;

            if (!camera) {
                if (!this.activeCamera)
                    throw new Error("Active camera not set");

                camera = this.activeCamera;
            }

            var cameraViewport = camera.viewport;
            var viewport = cameraViewport.toGlobal(engine);
            var identity = Matrix.Identity();

            // Moving coordinates to local viewport world
            x = x / this._engine.getHardwareScalingLevel() - viewport.x;
            y = y / this._engine.getHardwareScalingLevel() - (this._engine.getRenderHeight() - viewport.y - viewport.height);
            return Ray.CreateNew(x, y, viewport.width, viewport.height, identity, identity, camera.getProjectionMatrix());
        }

        private _internalPick(rayFunction: (world: Matrix) => Ray, predicate: (mesh: AbstractMesh) => boolean, fastCheck?: boolean): PickingInfo {
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

            return pickingInfo || new PickingInfo();
        }


        private _internalPickSprites(ray: Ray, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): PickingInfo {
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

            return pickingInfo || new PickingInfo();
        }

        public pick(x: number, y: number, predicate?: (mesh: AbstractMesh) => boolean, fastCheck?: boolean, camera?: Camera): PickingInfo {
            /// <summary>Launch a ray to try to pick a mesh in the scene</summary>
            /// <param name="x">X position on screen</param>
            /// <param name="y">Y position on screen</param>
            /// <param name="predicate">Predicate function used to determine eligible meshes. Can be set to null. In this case, a mesh must be enabled, visible and with isPickable set to true</param>
            /// <param name="fastCheck">Launch a fast check only using the bounding boxes. Can be set to null.</param>
            /// <param name="camera">camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used</param>
            return this._internalPick(world => this.createPickingRay(x, y, world, camera), predicate, fastCheck);
        }

        public pickSprite(x: number, y: number, predicate?: (sprite: Sprite) => boolean, fastCheck?: boolean, camera?: Camera): PickingInfo {
            /// <summary>Launch a ray to try to pick a mesh in the scene</summary>
            /// <param name="x">X position on screen</param>
            /// <param name="y">Y position on screen</param>
            /// <param name="predicate">Predicate function used to determine eligible sprites. Can be set to null. In this case, a sprite must have isPickable set to true</param>
            /// <param name="fastCheck">Launch a fast check only using the bounding boxes. Can be set to null.</param>
            /// <param name="camera">camera to use for computing the picking ray. Can be set to null. In this case, the scene.activeCamera will be used</param>
            return this._internalPickSprites(this.createPickingRayInCameraSpace(x, y, camera), predicate, fastCheck, camera);
        }

        public pickWithRay(ray: Ray, predicate: (mesh: Mesh) => boolean, fastCheck?: boolean) {
            return this._internalPick(world => {
                if (!this._pickWithRayInverseMatrix) {
                    this._pickWithRayInverseMatrix = Matrix.Identity();
                }
                world.invertToRef(this._pickWithRayInverseMatrix);
                return Ray.Transform(ray, this._pickWithRayInverseMatrix);
            }, predicate, fastCheck);
        }

        public setPointerOverMesh(mesh: AbstractMesh): void {
            if (this._pointerOverMesh === mesh) {
                return;
            }

            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(ActionManager.OnPointerOutTrigger, ActionEvent.CreateNew(this._pointerOverMesh));
            }

            this._pointerOverMesh = mesh;
            if (this._pointerOverMesh && this._pointerOverMesh.actionManager) {
                this._pointerOverMesh.actionManager.processTrigger(ActionManager.OnPointerOverTrigger, ActionEvent.CreateNew(this._pointerOverMesh));
            }
        }

        public getPointerOverMesh(): AbstractMesh {
            return this._pointerOverMesh;
        }

        public setPointerOverSprite(sprite: Sprite): void {
            if (this._pointerOverSprite === sprite) {
                return;
            }

            if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
                this._pointerOverSprite.actionManager.processTrigger(ActionManager.OnPointerOutTrigger, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
            }

            this._pointerOverSprite = sprite;
            if (this._pointerOverSprite && this._pointerOverSprite.actionManager) {
                this._pointerOverSprite.actionManager.processTrigger(ActionManager.OnPointerOverTrigger, ActionEvent.CreateNewFromSprite(this._pointerOverSprite, this));
            }
        }

        public getPointerOverSprite(): Sprite {
            return this._pointerOverSprite;
        }

        // Physics
        public getPhysicsEngine(): PhysicsEngine {
            return this._physicsEngine;
        }

        /**
         * Enables physics to the current scene
         * @param {BABYLON.Vector3} [gravity] - the scene's gravity for the physics engine
         * @param {BABYLON.IPhysicsEnginePlugin} [plugin] - The physics engine to be used. defaults to OimoJS.
         * @return {boolean} was the physics engine initialized
         */
        public enablePhysics(gravity?: Vector3, plugin?: IPhysicsEnginePlugin): boolean {
            if (this._physicsEngine) {
                return true;
            }

            try {
                this._physicsEngine = new PhysicsEngine(gravity, plugin);
                return true;
            } catch (e) {
                Tools.Error(e.message);
                return false;
            }

        }

        public disablePhysicsEngine(): void {
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine.dispose();
            this._physicsEngine = undefined;
        }

        public isPhysicsEnabled(): boolean {
            return this._physicsEngine !== undefined;
        }

        /**
         * 
         * Sets the gravity of the physics engine (and NOT of the scene)
         * @param {BABYLON.Vector3} [gravity] - the new gravity to be used
         */
        public setGravity(gravity: Vector3): void {
            Tools.Warn("Deprecated, please use 'scene.getPhysicsEngine().setGravity()'")
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine.setGravity(gravity);
        }

        /**
         * Legacy support, using the new API
         * @Deprecated
         */
        public createCompoundImpostor(parts: any, options: PhysicsImpostorParameters): any {
            Tools.Warn("Scene.createCompoundImpostor is deprecated. Please use PhysicsImpostor parent/child")

            if (parts.parts) { // Old API
                options = parts;
                parts = parts.parts;
            }

            var mainMesh: AbstractMesh = parts[0].mesh;
            mainMesh.physicsImpostor = new PhysicsImpostor(mainMesh, parts[0].impostor, options)
            for (var index = 1; index < parts.length; index++) {
                var mesh: AbstractMesh = parts[index].mesh;
                if (mesh.parent !== mainMesh) {
                    mesh.position = mesh.position.subtract(mainMesh.position);
                    mesh.parent = mainMesh;
                }
                mesh.physicsImpostor = new PhysicsImpostor(mesh, parts[index].impostor, options)

            }
            mainMesh.physicsImpostor.forceUpdate();
        }

        public deleteCompoundImpostor(compound: any): void {
            var mesh: AbstractMesh = compound.parts[0].mesh;
            mesh.physicsImpostor.dispose(true);
            mesh.physicsImpostor = null;
        }

        // Misc.
        public createDefaultCameraOrLight() {
            // Light
            if (this.lights.length === 0) {
                new HemisphericLight("default light", Vector3.Up(), this);
            }

            // Camera
            if (!this.activeCamera) {
                var camera = new FreeCamera("default camera", Vector3.Zero(), this);

                // Compute position
                var worldExtends = this.getWorldExtends();
                var worldCenter = worldExtends.min.add(worldExtends.max.subtract(worldExtends.min).scale(0.5));

                camera.position = new Vector3(worldCenter.x, worldCenter.y, worldExtends.min.z - (worldExtends.max.z - worldExtends.min.z));
                camera.setTarget(worldCenter);

                this.activeCamera = camera;
            }
        }

        // Tags
        private _getByTags(list: any[], tagsQuery: string, forEach?: (item: any) => void): any[] {
            if (tagsQuery === undefined) {
                // returns the complete list (could be done with BABYLON.Tags.MatchesQuery but no need to have a for-loop here)
                return list;
            }

            var listByTags = [];

            forEach = forEach || ((item: any) => { return; });

            for (var i in list) {
                var item = list[i];
                if (Tags.MatchesQuery(item, tagsQuery)) {
                    listByTags.push(item);
                    forEach(item);
                }
            }

            return listByTags;
        }

        public getMeshesByTags(tagsQuery: string, forEach?: (mesh: AbstractMesh) => void): Mesh[] {
            return this._getByTags(this.meshes, tagsQuery, forEach);
        }

        public getCamerasByTags(tagsQuery: string, forEach?: (camera: Camera) => void): Camera[] {
            return this._getByTags(this.cameras, tagsQuery, forEach);
        }

        public getLightsByTags(tagsQuery: string, forEach?: (light: Light) => void): Light[] {
            return this._getByTags(this.lights, tagsQuery, forEach);
        }

        public getMaterialByTags(tagsQuery: string, forEach?: (material: Material) => void): Material[] {
            return this._getByTags(this.materials, tagsQuery, forEach).concat(this._getByTags(this.multiMaterials, tagsQuery, forEach));
        }
    }
}

