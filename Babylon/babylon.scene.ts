module BABYLON {
    export interface IDisposable {
        dispose(): void;
    }

    export class Scene {
        // Statics
        public static FOGMODE_NONE = 0;
        public static FOGMODE_EXP = 1;
        public static FOGMODE_EXP2 = 2;
        public static FOGMODE_LINEAR = 3;

        // Members
        public autoClear = true;
        public clearColor = new BABYLON.Color3(0.2, 0.2, 0.3);
        public ambientColor = new BABYLON.Color3(0, 0, 0);
        public beforeRender: () => void;
        public afterRender: () => void;
        public beforeCameraRender: (camera: Camera) => void;
        public afterCameraRender: (camera: Camera) => void;
        public forceWireframe = false;
        public clipPlane: Plane;

        // Pointers
        private _onPointerMove: (evt: PointerEvent) => void;
        private _onPointerDown: (evt: PointerEvent) => void;
        public onPointerDown: (evt: PointerEvent, pickInfo: PickingInfo) => void;
        private _pointerX: number;
        private _pointerY: number;
        private _meshUnderPointer: AbstractMesh;

        // Fog
        public fogMode = BABYLON.Scene.FOGMODE_NONE;
        public fogColor = new Color3(0.2, 0.2, 0.3);
        public fogDensity = 0.1;
        public fogStart = 0;
        public fogEnd = 1000.0;

        // Lights
        public lightsEnabled = true;
        public lights = new Array<Light>();

        // Cameras
        public cameras = new Array<Camera>();
        public activeCameras = new Array<Camera>();
        public activeCamera: Camera;

        // Meshes
        public meshes = new Array<AbstractMesh>();

        // Geometries
        private _geometries = new Array<Geometry>();

        public materials = new Array<Material>();
        public multiMaterials = new Array<MultiMaterial>();
        public defaultMaterial = new BABYLON.StandardMaterial("default material", this);

        // Textures
        public texturesEnabled = true;
        public textures = new Array<BaseTexture>();

        // Particles
        public particlesEnabled = true;
        public particleSystems = new Array<ParticleSystem>();

        // Sprites
        public spriteManagers = new Array<SpriteManager>();

        // Layers
        public layers = new Array<Layer>();

        // Skeletons
        public skeletons = new Array<Skeleton>();

        // Lens flares
        public lensFlareSystems = new Array<LensFlareSystem>();

        // Collisions
        public collisionsEnabled = true;
        public gravity = new BABYLON.Vector3(0, -9.0, 0);

        // Postprocesses
        public postProcessesEnabled = true;
        public postProcessManager: PostProcessManager;
        public postProcessRenderPipelineManager: PostProcessRenderPipelineManager;

        // Customs render targets
        public renderTargetsEnabled = true;
        public customRenderTargets = new Array<RenderTargetTexture>();

        // Delay loading
        public useDelayedTextureLoading: boolean;

        // Imported meshes
        public importedMeshesFiles = new Array<String>();

        // Database
        public database; //ANY

        // Actions
        public actionManager: ActionManager;

        // Private
        private _engine: Engine;
        private _totalVertices = 0;
        public _activeVertices = 0;
        public _activeParticles = 0;
        private _lastFrameDuration = 0;
        private _evaluateActiveMeshesDuration = 0;
        private _renderTargetsDuration = 0;
        public _particlesDuration = 0;
        private _renderDuration = 0;
        public _spritesDuration = 0;
        private _animationRatio = 0;
        private _animationStartDate: number;

        private _renderId = 0;
        private _executeWhenReadyTimeoutId = -1;

        public _toBeDisposed = new SmartArray<IDisposable>(256);

        private _onReadyCallbacks = new Array<() => void>();
        private _pendingData = [];//ANY

        private _onBeforeRenderCallbacks = new Array<() => void>();

        private _activeMeshes = new SmartArray<Mesh>(256);
        private _processedMaterials = new SmartArray<Material>(256);
        private _renderTargets = new SmartArray<RenderTargetTexture>(256);
        public _activeParticleSystems = new SmartArray<ParticleSystem>(256);
        private _activeSkeletons = new SmartArray<Skeleton>(32);

        private _renderingManager: RenderingManager;
        private _physicsEngine: PhysicsEngine;

        public _activeAnimatables = new Array<Animatable>();

        private _transformMatrix = Matrix.Zero();
        private _pickWithRayInverseMatrix: Matrix;

        private _scaledPosition = Vector3.Zero();
        private _scaledVelocity = Vector3.Zero();

        private _boundingBoxRenderer: BoundingBoxRenderer;

        private _viewMatrix: Matrix;
        private _projectionMatrix: Matrix;
        private _frustumPlanes: Plane[];

        private _selectionOctree: Octree<AbstractMesh>;

        private _pointerOverMesh: AbstractMesh;

        // Constructor
        constructor(engine: Engine) {
            this._engine = engine;

            engine.scenes.push(this);

            this._renderingManager = new RenderingManager(this);

            this.postProcessManager = new PostProcessManager(this);

            this.postProcessRenderPipelineManager = new PostProcessRenderPipelineManager();

            this._boundingBoxRenderer = new BoundingBoxRenderer(this);

            this.attachControl();
        }

        // Properties 
        public get meshUnderPointer(): AbstractMesh {
            return this._meshUnderPointer;
        }

        public get pointerX(): number {
            return this._pointerX;
        }

        public get pointerY(): number {
            return this._pointerY;
        }

        public getBoundingBoxRenderer(): BoundingBoxRenderer {
            return this._boundingBoxRenderer;
        }

        public getEngine(): Engine {
            return this._engine;
        }

        public getTotalVertices(): number {
            return this._totalVertices;
        }

        public getActiveVertices(): number {
            return this._activeVertices;
        }

        public getActiveParticles(): number {
            return this._activeParticles;
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

        // Pointers handling
        public attachControl() {
            this._onPointerMove = (evt: PointerEvent) => {
                var canvas = this._engine.getRenderingCanvas();

                this._pointerX = evt.offsetX || evt.layerX;
                this._pointerY = evt.offsetY || evt.layerY;
                var pickResult = this.pick(this._pointerX, this._pointerY, (mesh: AbstractMesh): boolean => mesh.actionManager && mesh.isPickable && mesh.isVisible && mesh.isReady());

                if (pickResult.hit) {
                    this.setPointerOverMesh(pickResult.pickedMesh);
                    canvas.style.cursor = "pointer";

                    this._meshUnderPointer = pickResult.pickedMesh;
                } else {
                    this.setPointerOverMesh(null);
                    canvas.style.cursor = "";
                    this._meshUnderPointer = null;
                }
            };

            this._onPointerDown = (evt: PointerEvent) => {

                var predicate = null;

                if (!this.onPointerDown) {
                    predicate = (mesh: AbstractMesh): boolean => {
                        return mesh.actionManager && mesh.isPickable && mesh.isVisible && mesh.isReady();
                    };
                }

                var pickResult = this.pick(evt.offsetX || evt.layerX, evt.offsetY || evt.layerY, predicate);

                if (pickResult.hit) {
                    if (pickResult.pickedMesh.actionManager) {
                        switch (evt.buttons) {
                            case 1:
                                pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnLeftPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh));
                                break;
                            case 2:
                                pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnRightPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh));
                                break;
                            case 3:
                                pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnCenterPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh));
                                break;
                        }
                        pickResult.pickedMesh.actionManager.processTrigger(BABYLON.ActionManager.OnPickTrigger, ActionEvent.CreateNew(pickResult.pickedMesh));
                    }
                }

                if (this.onPointerDown) {
                    this.onPointerDown(evt, pickResult);
                }
            };


            var eventPrefix = Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "move", this._onPointerMove, false);
            this._engine.getRenderingCanvas().addEventListener(eventPrefix + "down", this._onPointerDown, false);
        }

        public detachControl() {
            var eventPrefix = Tools.GetPointerPrefix();
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "move", this._onPointerMove);
            this._engine.getRenderingCanvas().removeEventListener(eventPrefix + "down", this._onPointerDown);
        }

        // Ready
        public isReady(): boolean {
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
        public beginAnimation(target: any, from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void, animatable?: Animatable): Animatable {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            this.stopAnimation(target);

            if (!animatable) {
                animatable = new Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd);
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
        }

        public beginDirectAnimation(target: any, animations: Animation[], from: number, to: number, loop?: boolean, speedRatio?: number, onAnimationEnd?: () => void): Animatable {
            if (speedRatio === undefined) {
                speedRatio = 1.0;
            }

            var animatable = new BABYLON.Animatable(this, target, from, to, loop, speedRatio, onAnimationEnd, animations);

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

        public stopAnimation(target: any): void {
            var animatable = this.getAnimatableByTarget(target);

            if (animatable) {
                animatable.stop();
            }
        }

        private _animate(): void {
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
        public setActiveCameraByID(id: string): Camera {
            var camera = this.getCameraByID(id);

            if (camera) {
                this.activeCamera = camera;
                return camera;
            }

            return null;
        }

        public setActiveCameraByName(name: string): Camera {
            var camera = this.getCameraByName(name);

            if (camera) {
                this.activeCamera = camera;
                return camera;
            }

            return null;
        }

        public getMaterialByID(id: string): Material {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].id === id) {
                    return this.materials[index];
                }
            }

            return null;
        }

        public getMaterialByName(name: string): Material {
            for (var index = 0; index < this.materials.length; index++) {
                if (this.materials[index].name === name) {
                    return this.materials[index];
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

        public getCameraByName(name: string): Camera {
            for (var index = 0; index < this.cameras.length; index++) {
                if (this.cameras[index].name === name) {
                    return this.cameras[index];
                }
            }

            return null;
        }

        public getLightByName(name: string): Light {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].name === name) {
                    return this.lights[index];
                }
            }

            return null;
        }

        public getLightByID(id: string): Light {
            for (var index = 0; index < this.lights.length; index++) {
                if (this.lights[index].id === id) {
                    return this.lights[index];
                }
            }

            return null;
        }

        public getGeometryByID(id: string): Geometry {
            for (var index = 0; index < this._geometries.length; index++) {
                if (this._geometries[index].id === id) {
                    return this._geometries[index];
                }
            }

            return null;
        }

        public pushGeometry(geometry: Geometry, force?: boolean): boolean {
            if (!force && this.getGeometryByID(geometry.id)) {
                return false;
            }

            this._geometries.push(geometry);

            return true;
        }

        public getGeometries(): Geometry[] {
            return this._geometries;
        }

        public getMeshByID(id: string): AbstractMesh {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        public getLastMeshByID(id: string): AbstractMesh {
            for (var index = this.meshes.length - 1; index >= 0; index--) {
                if (this.meshes[index].id === id) {
                    return this.meshes[index];
                }
            }

            return null;
        }

        public getLastEntryByID(id: string): Node {
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
        }

        public getMeshByName(name: string): AbstractMesh {
            for (var index = 0; index < this.meshes.length; index++) {
                if (this.meshes[index].name === name) {
                    return this.meshes[index];
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
            if (mesh.subMeshes.length == 1 || subMesh.isInFrustum(this._frustumPlanes)) {
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
                    this._activeVertices += subMesh.verticesCount;
                    this._renderingManager.dispatch(subMesh);
                }
            }
        }

        private _evaluateActiveMeshes(): void {
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

                this._totalVertices += mesh.getTotalVertices();

                if (!mesh.isReady()) {
                    continue;
                }

                mesh.computeWorldMatrix();
                mesh._preActivate();

                if (mesh.isEnabled() && mesh.isVisible && mesh.visibility > 0 && ((mesh.layerMask & this.activeCamera.layerMask) != 0) && mesh.isInFrustum(this._frustumPlanes)) {
                    this._activeMeshes.push(mesh);
                    mesh._activate(this._renderId);

                    this._activeMesh(mesh);
                }
            }

            // Particle systems
            var beforeParticlesDate = new Date().getTime();
            if (this.particlesEnabled) {
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
            }
            this._particlesDuration += new Date().getTime() - beforeParticlesDate;
        }

        private _activeMesh(mesh: AbstractMesh): void {
            if (mesh.skeleton) {
                this._activeSkeletons.pushNoDuplicate(mesh.skeleton);
            }

            if (mesh.showBoundingBox) {
                this._boundingBoxRenderer.renderList.push(mesh.getBoundingInfo().boundingBox);
            }

            if (mesh.subMeshes) {
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

            // Skeletons
            for (var skeletonIndex = 0; skeletonIndex < this._activeSkeletons.length; skeletonIndex++) {
                var skeleton = this._activeSkeletons.data[skeletonIndex];

                skeleton.prepare();
            }

            // Customs render targets registration
            for (var customIndex = 0; customIndex < this.customRenderTargets.length; customIndex++) {
                var renderTarget = this.customRenderTargets[customIndex];
                this._renderTargets.push(renderTarget);
            }

            // Render targets
            var beforeRenderTargetDate = new Date().getTime();
            if (this.renderTargetsEnabled) {
                for (var renderIndex = 0; renderIndex < this._renderTargets.length; renderIndex++) {
                    renderTarget = this._renderTargets.data[renderIndex];
                    if (renderTarget._shouldRender()) {
                        this._renderId++;
                        renderTarget.render();
                    }
                }
                this._renderId++;
            }

            if (this._renderTargets.length > 0) { // Restore back buffer
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

            // Lens flares
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

        }

        private _processSubCameras(camera: Camera): void {
            if (camera.subCameras.length == 0) {
                this._renderForCamera(camera);
                return;
            }

            // Sub-cameras
            for (var index = 0; index < camera.subCameras.length; index++) {
                this._renderForCamera(camera.subCameras[index]);
            }

            this.activeCamera = camera;
            this.setTransformMatrix(this.activeCamera.getViewMatrix(), this.activeCamera.getProjectionMatrix());

            // Update camera
            this.activeCamera._updateFromScene();
        }

        public render(): void {
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
                this.actionManager.processTrigger(ActionManager.OnEveryFrameTrigger, null);
            }

            // Before render
            if (this.beforeRender) {
                this.beforeRender();
            }

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex]();
            }

            // Animations
            var deltaTime = Math.max(1.0, Math.min(BABYLON.Tools.GetDeltaTime(), 1000.0));
            this._animationRatio = deltaTime * (60.0 / 1000.0);
            this._animate();

            // Physics
            if (this._physicsEngine) {
                this._physicsEngine._runOneStep(deltaTime / 1000.0);
            }

            // Clear
            this._engine.clear(this.clearColor, this.autoClear || this.forceWireframe, true);

            // Shadows
            for (var lightIndex = 0; lightIndex < this.lights.length; lightIndex++) {
                var light = this.lights[lightIndex];
                var shadowGenerator = light.getShadowGenerator();

                if (light.isEnabled() && shadowGenerator && shadowGenerator.getShadowMap().getScene().textures.indexOf(shadowGenerator.getShadowMap()) !== -1) {
                    this._renderTargets.push(shadowGenerator.getShadowMap());
                }
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
            } else {
                this._processSubCameras(this.activeCamera);
            }

            // After render
            if (this.afterRender) {
                this.afterRender();
            }

            // Cleaning
            for (var index = 0; index < this._toBeDisposed.length; index++) {
                this._toBeDisposed.data[index].dispose();
                this._toBeDisposed[index] = null;
            }

            this._toBeDisposed.reset();

            this._lastFrameDuration = new Date().getTime() - startDate;
        }

        public dispose(): void {
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
            this._engine.scenes.splice(index, 1);

            this._engine.wipeCaches();
        }

        // Collisions
        public _getNewPosition(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, finalPosition: Vector3): void {
            position.divideToRef(collider.radius, this._scaledPosition);
            velocity.divideToRef(collider.radius, this._scaledVelocity);

            collider.retry = 0;
            collider.initialVelocity = this._scaledVelocity;
            collider.initialPosition = this._scaledPosition;
            this._collideWithWorld(this._scaledPosition, this._scaledVelocity, collider, maximumRetry, finalPosition);

            finalPosition.multiplyInPlace(collider.radius);
        }

        private _collideWithWorld(position: Vector3, velocity: Vector3, collider: Collider, maximumRetry: number, finalPosition: Vector3): void {
            var closeDistance = BABYLON.Engine.CollisionsEpsilon * 10.0;

            if (collider.retry >= maximumRetry) {
                finalPosition.copyFrom(position);
                return;
            }

            collider._initialize(position, velocity, closeDistance);

            // Check all meshes
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
        }

        // Octrees
        public createOrUpdateSelectionOctree(maxCapacity = 64, maxDepth = 2): Octree<AbstractMesh> {
            if (!this._selectionOctree) {
                this._selectionOctree = new BABYLON.Octree<AbstractMesh>(Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
            }

            var min = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var max = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = 0; index < this.meshes.length; index++) {
                var mesh = this.meshes[index];

                mesh.computeWorldMatrix(true);
                var minBox = mesh.getBoundingInfo().boundingBox.minimumWorld;
                var maxBox = mesh.getBoundingInfo().boundingBox.maximumWorld;

                Tools.CheckExtends(minBox, min, max);
                Tools.CheckExtends(maxBox, min, max);
            }

            // Update octree
            this._selectionOctree.update(min, max, this.meshes);

            return this._selectionOctree;
        }

        // Picking
        public createPickingRay(x: number, y: number, world: Matrix, camera: Camera): Ray {
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

            return pickingInfo || new BABYLON.PickingInfo();
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

        public pickWithRay(ray: Ray, predicate: (mesh: Mesh) => boolean, fastCheck?: boolean) {
            return this._internalPick(world => {
                if (!this._pickWithRayInverseMatrix) {
                    this._pickWithRayInverseMatrix = BABYLON.Matrix.Identity();
                }
                world.invertToRef(this._pickWithRayInverseMatrix);
                return BABYLON.Ray.Transform(ray, this._pickWithRayInverseMatrix);
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

        // Physics
        public getPhysicsEngine(): PhysicsEngine {
            return this._physicsEngine;
        }

        public enablePhysics(gravity: Vector3, plugin?: IPhysicsEnginePlugin): boolean {
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

        public setGravity(gravity: Vector3): void {
            if (!this._physicsEngine) {
                return;
            }

            this._physicsEngine._setGravity(gravity);
        }

        public createCompoundImpostor(parts: any, options: PhysicsBodyCreationOptions): any {
            if (parts.parts) { // Old API
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
        }

        //ANY
        public deleteCompoundImpostor(compound: any): void {
            for (var index = 0; index < compound.parts.length; index++) {
                var mesh = compound.parts[index].mesh;
                mesh._physicImpostor = BABYLON.PhysicsEngine.NoImpostor;
                this._physicsEngine._unregisterMesh(mesh);
            }
        }

        // Tags
        private _getByTags(list: any[], tagsQuery: string): any[] {
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
        }

        public getMeshesByTags(tagsQuery: string): Mesh[] {
            return this._getByTags(this.meshes, tagsQuery);
        }

        public getCamerasByTags(tagsQuery: string): Camera[] {
            return this._getByTags(this.cameras, tagsQuery);
        }

        public getLightsByTags(tagsQuery: string): Light[] {
            return this._getByTags(this.lights, tagsQuery);
        }

        public getMaterialByTags(tagsQuery: string): Material[] {
            return this._getByTags(this.materials, tagsQuery).concat(this._getByTags(this.multiMaterials, tagsQuery));
        }
    }
} 