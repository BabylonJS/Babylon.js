﻿module BABYLON {
    export class _InstancesBatch {
        public mustReturn = false;
        public visibleInstances = new Array<Array<InstancedMesh>>();
        public renderSelf = new Array<boolean>();
    }

    export class Mesh extends AbstractMesh implements IGetSetVerticesData {
        // Consts
        public static _FRONTSIDE: number = 0;
        public static _BACKSIDE: number = 1;
        public static _DOUBLESIDE: number = 2;
        public static _DEFAULTSIDE: number = 0;
        public static _NO_CAP = 0;
        public static _CAP_START = 1;
        public static _CAP_END = 2;
        public static _CAP_ALL = 3;

        public static get FRONTSIDE(): number {
            return Mesh._FRONTSIDE;
        }

        public static get BACKSIDE(): number {
            return Mesh._BACKSIDE;
        }

        public static get DOUBLESIDE(): number {
            return Mesh._DOUBLESIDE;
        }

        public static get DEFAULTSIDE(): number {
            return Mesh._DEFAULTSIDE;
        }
        public static get NO_CAP(): number {
            return Mesh._NO_CAP;
        }
        public static get CAP_START(): number {
            return Mesh._CAP_START;
        }
        public static get CAP_END(): number {
            return Mesh._CAP_END;
        }
        public static get CAP_ALL(): number {
            return Mesh._CAP_ALL;
        }

        // Members
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;
        public instances = new Array<InstancedMesh>();
        public delayLoadingFile: string;
        public _binaryInfo: any;
        private _LODLevels = new Array<Internals.MeshLODLevel>();
        public onLODLevelSelection: (distance: number, mesh: Mesh, selectedLevel: Mesh) => void;

        // Private
        public _geometry: Geometry;
        private _onBeforeRenderCallbacks = new Array<(mesh: AbstractMesh) => void>();
        private _onAfterRenderCallbacks = new Array<(mesh: AbstractMesh) => void>();
        public _delayInfo; //ANY
        public _delayLoadingFunction: (any: any, mesh: Mesh) => void;
        public _visibleInstances: any = {};
        private _renderIdForInstances = new Array<number>();
        private _batchCache = new _InstancesBatch();
        private _worldMatricesInstancesBuffer: WebGLBuffer;
        private _worldMatricesInstancesArray: Float32Array;
        private _instancesBufferSize = 32 * 16 * 4; // let's start with a maximum of 32 instances
        public _shouldGenerateFlatShading: boolean;
        private _preActivateId: number;
        private _sideOrientation: number = Mesh._DEFAULTSIDE;
        private _areNormalsFrozen: boolean = false; // Will be used by ribbons mainly

        private _sourcePositions: Float32Array; // Will be used to save original positions when using software skinning
        private _sourceNormals: Float32Array; // Will be used to save original normals when using software skinning

        /**
         * @constructor
         * @param {string} name - The value used by scene.getMeshByName() to do a lookup.
         * @param {Scene} scene - The scene to add this mesh to.
         * @param {Node} parent - The parent of this mesh, if it has one
         * @param {Mesh} source - An optional Mesh from which geometry is shared, cloned.
         * @param {boolean} doNotCloneChildren - When cloning, skip cloning child meshes of source, default False.
         *                  When false, achieved by calling a clone(), also passing False.
         *                  This will make creation of children, recursive.
         */
        constructor(name: string, scene: Scene, parent: Node = null, source?: Mesh, doNotCloneChildren?: boolean) {
            super(name, scene);

            if (source) {
                // Geometry
                if (source._geometry) {
                    source._geometry.applyToMesh(this);
                }

                // Deep copy
                Tools.DeepCopy(source, this, ["name", "material", "skeleton", "instances"], []);

                this.id = name + "." + source.id;

                // Material
                this.material = source.material;
                var index: number;
                if (!doNotCloneChildren) {
                    // Children
                    for (index = 0; index < scene.meshes.length; index++) {
                        var mesh = scene.meshes[index];

                        if (mesh.parent === source) {
                            // doNotCloneChildren is always going to be False
                            var newChild = mesh.clone(name + "." + mesh.name, this, doNotCloneChildren);
                        }
                    }
                }

                // Particles
                for (index = 0; index < scene.particleSystems.length; index++) {
                    var system = scene.particleSystems[index];

                    if (system.emitter === source) {
                        system.clone(system.name, this);
                    }
                }
                this.computeWorldMatrix(true);
            }

            // Parent
            if (parent !== null) {
                this.parent = parent;
            }

        }

        // Methods
        public get hasLODLevels(): boolean {
            return this._LODLevels.length > 0;
        }

        private _sortLODLevels(): void {
            this._LODLevels.sort((a, b) => {
                if (a.distance < b.distance) {
                    return 1;
                }
                if (a.distance > b.distance) {
                    return -1;
                }

                return 0;
            });
        }

        /**
         * Add a mesh as LOD level triggered at the given distance.
         * @param {number} distance - the distance from the center of the object to show this level
         * @param {BABYLON.Mesh} mesh - the mesh to be added as LOD level
         * @return {BABYLON.Mesh} this mesh (for chaining)
         */
        public addLODLevel(distance: number, mesh: Mesh): Mesh {
            if (mesh && mesh._masterMesh) {
                Tools.Warn("You cannot use a mesh as LOD level twice");
                return this;
            }

            var level = new Internals.MeshLODLevel(distance, mesh);
            this._LODLevels.push(level);

            if (mesh) {
                mesh._masterMesh = this;
            }

            this._sortLODLevels();

            return this;
        }

        public getLODLevelAtDistance(distance: number): Mesh {
            for (var index = 0; index < this._LODLevels.length; index++) {
                var level = this._LODLevels[index];

                if (level.distance === distance) {
                    return level.mesh;
                }
            }
            return null;
        }

        /**
         * Remove a mesh from the LOD array
         * @param {BABYLON.Mesh} mesh - the mesh to be removed.
         * @return {BABYLON.Mesh} this mesh (for chaining)
         */
        public removeLODLevel(mesh: Mesh): Mesh {

            for (var index = 0; index < this._LODLevels.length; index++) {
                if (this._LODLevels[index].mesh === mesh) {
                    this._LODLevels.splice(index, 1);
                    if (mesh) {
                        mesh._masterMesh = null;
                    }
                }
            }

            this._sortLODLevels();
            return this;
        }

        public getLOD(camera: Camera, boundingSphere?: BoundingSphere): AbstractMesh {
            if (!this._LODLevels || this._LODLevels.length === 0) {
                return this;
            }

            var distanceToCamera = (boundingSphere ? boundingSphere : this.getBoundingInfo().boundingSphere).centerWorld.subtract(camera.position).length();

            if (this._LODLevels[this._LODLevels.length - 1].distance > distanceToCamera) {
                if (this.onLODLevelSelection) {
                    this.onLODLevelSelection(distanceToCamera, this, this._LODLevels[this._LODLevels.length - 1].mesh);
                }
                return this;
            }

            for (var index = 0; index < this._LODLevels.length; index++) {
                var level = this._LODLevels[index];

                if (level.distance < distanceToCamera) {
                    if (level.mesh) {
                        level.mesh._preActivate();
                        level.mesh._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
                    }

                    if (this.onLODLevelSelection) {
                        this.onLODLevelSelection(distanceToCamera, this, level.mesh);
                    }
                    return level.mesh;
                }
            }

            if (this.onLODLevelSelection) {
                this.onLODLevelSelection(distanceToCamera, this, this);
            }
            return this;
        }

        public get geometry(): Geometry {
            return this._geometry;
        }

        public getTotalVertices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalVertices();
        }

        public getVerticesData(kind: string, copyWhenShared?: boolean): number[] {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind, copyWhenShared);
        }

        public getVertexBuffer(kind): VertexBuffer {
            if (!this._geometry) {
                return undefined;
            }
            return this._geometry.getVertexBuffer(kind);
        }

        public isVerticesDataPresent(kind: string): boolean {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVerticesDataPresent(kind);
        }

        public getVerticesDataKinds(): string[] {
            if (!this._geometry) {
                var result = [];
                if (this._delayInfo) {
                    for (var kind in this._delayInfo) {
                        result.push(kind);
                    }
                }
                return result;
            }
            return this._geometry.getVerticesDataKinds();
        }

        public getTotalIndices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalIndices();
        }

        public getIndices(copyWhenShared?: boolean): number[] {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices(copyWhenShared);
        }

        public get isBlocked(): boolean {
            return this._masterMesh !== null && this._masterMesh !== undefined;
        }

        public isReady(): boolean {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            return super.isReady();
        }

        public isDisposed(): boolean {
            return this._isDisposed;
        }

        public get sideOrientation(): number {
            return this._sideOrientation;
        }

        public set sideOrientation(sideO: number) {
            this._sideOrientation = sideO;
        }

        public get areNormalsFrozen(): boolean {
            return this._areNormalsFrozen;
        }

        /**  This function affects parametric shapes on update only : ribbons, tubes, etc. It has no effect at all on other shapes */
        public freezeNormals(): void {
            this._areNormalsFrozen = true;
        }

        /**  This function affects parametric shapes on update only : ribbons, tubes, etc. It has no effect at all on other shapes */
        public unfreezeNormals(): void {
            this._areNormalsFrozen = false;
        }

        // Methods
        public _preActivate(): void {
            var sceneRenderId = this.getScene().getRenderId();
            if (this._preActivateId === sceneRenderId) {
                return;
            }

            this._preActivateId = sceneRenderId;
            this._visibleInstances = null;
        }

        public _registerInstanceForRenderId(instance: InstancedMesh, renderId: number) {
            if (!this._visibleInstances) {
                this._visibleInstances = {};
                this._visibleInstances.defaultRenderId = renderId;
                this._visibleInstances.selfDefaultRenderId = this._renderId;
            }

            if (!this._visibleInstances[renderId]) {
                this._visibleInstances[renderId] = new Array<InstancedMesh>();
            }

            this._visibleInstances[renderId].push(instance);
        }

        public refreshBoundingInfo(): void {
            var data = this.getVerticesData(VertexBuffer.PositionKind);

            if (data) {
                var extend = Tools.ExtractMinAndMax(data, 0, this.getTotalVertices());
                this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
            }

            if (this.subMeshes) {
                for (var index = 0; index < this.subMeshes.length; index++) {
                    this.subMeshes[index].refreshBoundingInfo();
                }
            }

            this._updateBoundingInfo();
        }

        public _createGlobalSubMesh(): SubMesh {
            var totalVertices = this.getTotalVertices();
            if (!totalVertices || !this.getIndices()) {
                return null;
            }

            this.releaseSubMeshes();
            return new SubMesh(0, 0, totalVertices, 0, this.getTotalIndices(), this);
        }

        public subdivide(count: number): void {
            if (count < 1) {
                return;
            }

            var totalIndices = this.getTotalIndices();
            var subdivisionSize = (totalIndices / count) | 0;
            var offset = 0;

            // Ensure that subdivisionSize is a multiple of 3
            while (subdivisionSize % 3 !== 0) {
                subdivisionSize++;
            }

            this.releaseSubMeshes();
            for (var index = 0; index < count; index++) {
                if (offset >= totalIndices) {
                    break;
                }

                SubMesh.CreateFromIndices(0, offset, Math.min(subdivisionSize, totalIndices - offset), this);

                offset += subdivisionSize;
            }

            this.synchronizeInstances();
        }

        public setVerticesData(kind: any, data: any, updatable?: boolean, stride?: number): void {
            if (kind instanceof Array) {
                var temp = data;
                data = kind;
                kind = temp;

                Tools.Warn("Deprecated usage of setVerticesData detected (since v1.12). Current signature is setVerticesData(kind, data, updatable).");
            }

            if (!this._geometry) {
                var vertexData = new VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new Geometry(Geometry.RandomId(), scene, vertexData, updatable, this);
            }
            else {
                this._geometry.setVerticesData(kind, data, updatable, stride);
            }
        }

        public updateVerticesData(kind: string, data: number[], updateExtends?: boolean, makeItUnique?: boolean): void {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
        }

        public updateVerticesDataDirectly(kind: string, data: Float32Array, offset?: number, makeItUnique?: boolean): void {
            if (!this._geometry) {
                return;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesDataDirectly(kind, data, offset);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesDataDirectly(kind, data, offset, false);
            }
        }

        // Mesh positions update function :
        // updates the mesh positions according to the positionFunction returned values.
        // The positionFunction argument must be a javascript function accepting the mesh "positions" array as parameter.
        // This dedicated positionFunction computes new mesh positions according to the given mesh type.
        public updateMeshPositions(positionFunction, computeNormals: boolean = true): void {
            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            positionFunction(positions);
            this.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
            if (computeNormals) {
                var indices = this.getIndices();
                var normals = this.getVerticesData(VertexBuffer.NormalKind);
                VertexData.ComputeNormals(positions, indices, normals);
                this.updateVerticesData(VertexBuffer.NormalKind, normals, false, false);
            }
        }


        public makeGeometryUnique() {
            if (!this._geometry) {
                return;
            }
            var geometry = this._geometry.copy(Geometry.RandomId());
            geometry.applyToMesh(this);
        }

        public setIndices(indices: number[], totalVertices?: number): void {
            if (!this._geometry) {
                var vertexData = new VertexData();
                vertexData.indices = indices;

                var scene = this.getScene();

                new Geometry(Geometry.RandomId(), scene, vertexData, false, this);
            }
            else {
                this._geometry.setIndices(indices, totalVertices);
            }
        }

        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): void {
            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind;

            switch (fillMode) {
                case Material.PointFillMode:
                    indexToBind = null;
                    break;
                case Material.WireFrameFillMode:
                    indexToBind = subMesh.getLinesIndexBuffer(this.getIndices(), engine);
                    break;
                default:
                case Material.TriangleFillMode:
                    indexToBind = this._geometry.getIndexBuffer();
                    break;
            }

            // VBOs
            engine.bindMultiBuffers(this._geometry.getVertexBuffers(), indexToBind, effect);
        }

        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number): void {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }

            var engine = this.getScene().getEngine();

            // Draw order
            switch (fillMode) {
                case Material.PointFillMode:
                    engine.drawPointClouds(subMesh.verticesStart, subMesh.verticesCount, instancesCount);
                    break;
                case Material.WireFrameFillMode:
                    engine.draw(false, 0, subMesh.linesIndexCount, instancesCount);
                    break;

                default:
                    engine.draw(true, subMesh.indexStart, subMesh.indexCount, instancesCount);
            }
        }

        public registerBeforeRender(func: (mesh: AbstractMesh) => void): void {
            this._onBeforeRenderCallbacks.push(func);
        }

        public unregisterBeforeRender(func: (mesh: AbstractMesh) => void): void {
            var index = this._onBeforeRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onBeforeRenderCallbacks.splice(index, 1);
            }
        }

        public registerAfterRender(func: (mesh: AbstractMesh) => void): void {
            this._onAfterRenderCallbacks.push(func);
        }

        public unregisterAfterRender(func: (mesh: AbstractMesh) => void): void {
            var index = this._onAfterRenderCallbacks.indexOf(func);

            if (index > -1) {
                this._onAfterRenderCallbacks.splice(index, 1);
            }
        }

        public _getInstancesRenderList(subMeshId: number): _InstancesBatch {
            var scene = this.getScene();
            this._batchCache.mustReturn = false;
            this._batchCache.renderSelf[subMeshId] = this.isEnabled() && this.isVisible;
            this._batchCache.visibleInstances[subMeshId] = null;

            if (this._visibleInstances) {
                var currentRenderId = scene.getRenderId();
                this._batchCache.visibleInstances[subMeshId] = this._visibleInstances[currentRenderId];
                var selfRenderId = this._renderId;

                if (!this._batchCache.visibleInstances[subMeshId] && this._visibleInstances.defaultRenderId) {
                    this._batchCache.visibleInstances[subMeshId] = this._visibleInstances[this._visibleInstances.defaultRenderId];
                    currentRenderId = Math.max(this._visibleInstances.defaultRenderId, currentRenderId);
                    selfRenderId = Math.max(this._visibleInstances.selfDefaultRenderId, currentRenderId);
                }

                if (this._batchCache.visibleInstances[subMeshId] && this._batchCache.visibleInstances[subMeshId].length) {
                    if (this._renderIdForInstances[subMeshId] === currentRenderId) {
                        this._batchCache.mustReturn = true;
                        return this._batchCache;
                    }

                    if (currentRenderId !== selfRenderId) {
                        this._batchCache.renderSelf[subMeshId] = false;
                    }

                }
                this._renderIdForInstances[subMeshId] = currentRenderId;
            }

            return this._batchCache;
        }

        public _renderWithInstances(subMesh: SubMesh, fillMode: number, batch: _InstancesBatch, effect: Effect, engine: Engine): void {
            var visibleInstances = batch.visibleInstances[subMesh._id];
            var matricesCount = visibleInstances.length + 1;
            var bufferSize = matricesCount * 16 * 4;

            while (this._instancesBufferSize < bufferSize) {
                this._instancesBufferSize *= 2;
            }

            if (!this._worldMatricesInstancesBuffer || this._worldMatricesInstancesBuffer.capacity < this._instancesBufferSize) {
                if (this._worldMatricesInstancesBuffer) {
                    engine.deleteInstancesBuffer(this._worldMatricesInstancesBuffer);
                }

                this._worldMatricesInstancesBuffer = engine.createInstancesBuffer(this._instancesBufferSize);
                this._worldMatricesInstancesArray = new Float32Array(this._instancesBufferSize / 4);
            }

            var offset = 0;
            var instancesCount = 0;

            var world = this.getWorldMatrix();
            if (batch.renderSelf[subMesh._id]) {
                world.copyToArray(this._worldMatricesInstancesArray, offset);
                offset += 16;
                instancesCount++;
            }


            if (visibleInstances) {
                for (var instanceIndex = 0; instanceIndex < visibleInstances.length; instanceIndex++) {
                    var instance = visibleInstances[instanceIndex];
                    instance.getWorldMatrix().copyToArray(this._worldMatricesInstancesArray, offset);
                    offset += 16;
                    instancesCount++;
                }
            }

            var offsetLocation0 = effect.getAttributeLocationByName("world0");
            var offsetLocation1 = effect.getAttributeLocationByName("world1");
            var offsetLocation2 = effect.getAttributeLocationByName("world2");
            var offsetLocation3 = effect.getAttributeLocationByName("world3");

            var offsetLocations = [offsetLocation0, offsetLocation1, offsetLocation2, offsetLocation3];

            engine.updateAndBindInstancesBuffer(this._worldMatricesInstancesBuffer, this._worldMatricesInstancesArray, offsetLocations);

            this._draw(subMesh, fillMode, instancesCount);

            engine.unBindInstancesBuffer(this._worldMatricesInstancesBuffer, offsetLocations);
        }

        public _processRendering(subMesh: SubMesh, effect: Effect, fillMode: number, batch: _InstancesBatch, hardwareInstancedRendering: boolean,
            onBeforeDraw: (isInstance: boolean, world: Matrix) => void) {
            var scene = this.getScene();
            var engine = scene.getEngine();

            if (hardwareInstancedRendering) {
                this._renderWithInstances(subMesh, fillMode, batch, effect, engine);
            } else {
                if (batch.renderSelf[subMesh._id]) {
                    // Draw
                    if (onBeforeDraw) {
                        onBeforeDraw(false, this.getWorldMatrix());
                    }

                    this._draw(subMesh, fillMode);
                }

                if (batch.visibleInstances[subMesh._id]) {
                    for (var instanceIndex = 0; instanceIndex < batch.visibleInstances[subMesh._id].length; instanceIndex++) {
                        var instance = batch.visibleInstances[subMesh._id][instanceIndex];

                        // World
                        var world = instance.getWorldMatrix();
                        if (onBeforeDraw) {
                            onBeforeDraw(true, world);
                        }

                        // Draw
                        this._draw(subMesh, fillMode);
                    }
                }
            }
        }

        public render(subMesh: SubMesh, enableAlphaMode: boolean): void {
            var scene = this.getScene();

            // Managing instances
            var batch = this._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return;
            }

            // Checking geometry state
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return;
            }
            var callbackIndex: number;
            for (callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
                this._onBeforeRenderCallbacks[callbackIndex](this);
            }

            var engine = scene.getEngine();
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays !== null) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);

            // Material
            var effectiveMaterial = subMesh.getMaterial();

            if (!effectiveMaterial || !effectiveMaterial.isReady(this, hardwareInstancedRendering)) {
                return;
            }

            // Outline - step 1
            var savedDepthWrite = engine.getDepthWrite();
            if (this.renderOutline) {
                engine.setDepthWrite(false);
                scene.getOutlineRenderer().render(subMesh, batch);
                engine.setDepthWrite(savedDepthWrite);
            }

            effectiveMaterial._preBind();
            var effect = effectiveMaterial.getEffect();

            // Bind
            var fillMode = scene.forcePointsCloud ? Material.PointFillMode : (scene.forceWireframe ? Material.WireFrameFillMode : effectiveMaterial.fillMode);
            this._bind(subMesh, effect, fillMode);

            var world = this.getWorldMatrix();

            effectiveMaterial.bind(world, this);

            // Alpha mode
            if (enableAlphaMode) {
                engine.setAlphaMode(effectiveMaterial.alphaMode);
            }

            // Draw
            this._processRendering(subMesh, effect, fillMode, batch, hardwareInstancedRendering,
                (isInstance, world) => {
                    if (isInstance) {
                        effectiveMaterial.bindOnlyWorldMatrix(world);
                    }
                });

            // Unbind
            effectiveMaterial.unbind();

            // Outline - step 2
            if (this.renderOutline && savedDepthWrite) {
                engine.setDepthWrite(true);
                engine.setColorWrite(false);
                scene.getOutlineRenderer().render(subMesh, batch);
                engine.setColorWrite(true);
            }
            
            // Overlay
            if (this.renderOverlay) {
                var currentMode = engine.getAlphaMode();
                engine.setAlphaMode(Engine.ALPHA_COMBINE);
                scene.getOutlineRenderer().render(subMesh, batch, true);
                engine.setAlphaMode(currentMode);
            }

            for (callbackIndex = 0; callbackIndex < this._onAfterRenderCallbacks.length; callbackIndex++) {
                this._onAfterRenderCallbacks[callbackIndex](this);
            }
        }

        public getEmittedParticleSystems(): ParticleSystem[] {
            var results = new Array<ParticleSystem>();
            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (particleSystem.emitter === this) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public getHierarchyEmittedParticleSystems(): ParticleSystem[] {
            var results = new Array<ParticleSystem>();
            var descendants = this.getDescendants();
            descendants.push(this);

            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (descendants.indexOf(particleSystem.emitter) !== -1) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public getChildren(): Node[] {
            var results = [];
            for (var index = 0; index < this.getScene().meshes.length; index++) {
                var mesh = this.getScene().meshes[index];
                if (mesh.parent === this) {
                    results.push(mesh);
                }
            }

            return results;
        }

        public _checkDelayState(): void {
            var that = this;
            var scene = this.getScene();

            if (this._geometry) {
                this._geometry.load(scene);
            }
            else if (that.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) {
                that.delayLoadState = Engine.DELAYLOADSTATE_LOADING;

                scene._addPendingData(that);

                var getBinaryData = (this.delayLoadingFile.indexOf(".babylonbinarymeshdata") !== -1);

                Tools.LoadFile(this.delayLoadingFile, data => {

                    if (data instanceof ArrayBuffer) {
                        this._delayLoadingFunction(data, this);
                    }
                    else {
                        this._delayLoadingFunction(JSON.parse(data), this);
                    }

                    this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
                    scene._removePendingData(this);
                }, () => { }, scene.database, getBinaryData);
            }
        }

        public isInFrustum(frustumPlanes: Plane[]): boolean {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            if (!super.isInFrustum(frustumPlanes)) {
                return false;
            }

            this._checkDelayState();

            return true;
        }

        public setMaterialByID(id: string): void {
            var materials = this.getScene().materials;
            var index: number;
            for (index = 0; index < materials.length; index++) {
                if (materials[index].id === id) {
                    this.material = materials[index];
                    return;
                }
            }

            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = 0; index < multiMaterials.length; index++) {
                if (multiMaterials[index].id === id) {
                    this.material = multiMaterials[index];
                    return;
                }
            }
        }

        public getAnimatables(): IAnimatable[] {
            var results = [];

            if (this.material) {
                results.push(this.material);
            }

            if (this.skeleton) {
                results.push(this.skeleton);
            }

            return results;
        }

        // Geometry
        public bakeTransformIntoVertices(transform: Matrix): void {
            // Position
            if (!this.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                return;
            }

            this._resetPointsArrayCache();

            var data = this.getVerticesData(VertexBuffer.PositionKind);
            var temp = [];
            var index: number;
            for (index = 0; index < data.length; index += 3) {
                Vector3.TransformCoordinates(Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(VertexBuffer.PositionKind, temp, this.getVertexBuffer(VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                return;
            }
            data = this.getVerticesData(VertexBuffer.NormalKind);
            temp = [];
            for (index = 0; index < data.length; index += 3) {
                Vector3.TransformNormal(Vector3.FromArray(data, index), transform).normalize().toArray(temp, index);
            }
            this.setVerticesData(VertexBuffer.NormalKind, temp, this.getVertexBuffer(VertexBuffer.NormalKind).isUpdatable());
            
            // flip faces?
            if (transform.m[0] * transform.m[5] * transform.m[10] < 0) { this.flipFaces(); }
        }

        // Will apply current transform to mesh and reset world matrix
        public bakeCurrentTransformIntoVertices(): void {
            this.bakeTransformIntoVertices(this.computeWorldMatrix(true));
            this.scaling.copyFromFloats(1, 1, 1);
            this.position.copyFromFloats(0, 0, 0);
            this.rotation.copyFromFloats(0, 0, 0);
            //only if quaternion is already set
            if (this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.Identity();
            }
            this._worldMatrix = Matrix.Identity();
        }

        // Cache
        public _resetPointsArrayCache(): void {
            this._positions = null;
        }

        public _generatePointsArray(): boolean {
            if (this._positions)
                return true;

            this._positions = [];

            var data = this.getVerticesData(VertexBuffer.PositionKind);

            if (!data) {
                return false;
            }

            for (var index = 0; index < data.length; index += 3) {
                this._positions.push(Vector3.FromArray(data, index));
            }

            return true;
        }

        // Clone
        public clone(name: string, newParent?: Node, doNotCloneChildren?: boolean): Mesh {
            return new Mesh(name, this.getScene(), newParent, this, doNotCloneChildren);
        }

        // Dispose
        public dispose(doNotRecurse?: boolean): void {
            if (this._geometry) {
                this._geometry.releaseForMesh(this, true);
            }

            // Instances
            if (this._worldMatricesInstancesBuffer) {
                this.getEngine().deleteInstancesBuffer(this._worldMatricesInstancesBuffer);
                this._worldMatricesInstancesBuffer = null;
            }

            while (this.instances.length) {
                this.instances[0].dispose();
            }

            super.dispose(doNotRecurse);
        }

        // Geometric tools
        public applyDisplacementMap(url: string, minHeight: number, maxHeight: number, onSuccess?: (mesh: Mesh) => void): void {
            var scene = this.getScene();

            var onload = img => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                //Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = <Uint8Array>(<any>context.getImageData(0, 0, heightMapWidth, heightMapHeight).data);

                this.applyDisplacementMapFromBuffer(buffer, heightMapWidth, heightMapHeight, minHeight, maxHeight);
                //execute success callback, if set
                if (onSuccess) {
                    onSuccess(this);
                }
            };

            Tools.LoadImage(url, onload, () => { }, scene.database);
        }

        public applyDisplacementMapFromBuffer(buffer: Uint8Array, heightMapWidth: number, heightMapHeight: number, minHeight: number, maxHeight: number): void {
            if (!this.isVerticesDataPresent(VertexBuffer.PositionKind)
                || !this.isVerticesDataPresent(VertexBuffer.NormalKind)
                || !this.isVerticesDataPresent(VertexBuffer.UVKind)) {
                Tools.Warn("Cannot call applyDisplacementMap: Given mesh is not complete. Position, Normal or UV are missing");
                return;
            }

            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            var normals = this.getVerticesData(VertexBuffer.NormalKind);
            var uvs = this.getVerticesData(VertexBuffer.UVKind);
            var position = Vector3.Zero();
            var normal = Vector3.Zero();
            var uv = Vector2.Zero();

            for (var index = 0; index < positions.length; index += 3) {
                Vector3.FromArrayToRef(positions, index, position);
                Vector3.FromArrayToRef(normals, index, normal);
                Vector2.FromArrayToRef(uvs, (index / 3) * 2, uv);

                // Compute height
                var u = ((Math.abs(uv.x) * heightMapWidth) % heightMapWidth) | 0;
                var v = ((Math.abs(uv.y) * heightMapHeight) % heightMapHeight) | 0;

                var pos = (u + v * heightMapWidth) * 4;
                var r = buffer[pos] / 255.0;
                var g = buffer[pos + 1] / 255.0;
                var b = buffer[pos + 2] / 255.0;

                var gradient = r * 0.3 + g * 0.59 + b * 0.11;

                normal.normalize();
                normal.scaleInPlace(minHeight + (maxHeight - minHeight) * gradient);
                position = position.add(normal);

                position.toArray(positions, index);
            }

            VertexData.ComputeNormals(positions, this.getIndices(), normals);

            this.updateVerticesData(VertexBuffer.PositionKind, positions);
            this.updateVerticesData(VertexBuffer.NormalKind, normals);
        }


        public convertToFlatShadedMesh(): void {
            /// <summary>Update normals and vertices to get a flat shading rendering.</summary>
            /// <summary>Warning: This may imply adding vertices to the mesh in order to get exactly 3 vertices per face</summary>

            var kinds = this.getVerticesDataKinds();
            var vbs = [];
            var data = [];
            var newdata = [];
            var updatableNormals = false;
            var kindIndex: number;
            var kind: string;
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                var vertexBuffer = this.getVertexBuffer(kind);

                if (kind === VertexBuffer.NormalKind) {
                    updatableNormals = vertexBuffer.isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = vertexBuffer;
                data[kind] = vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = this.getIndices();
            var totalIndices = this.getTotalIndices();

            // Generating unique vertices per face
            var index: number;
            for (index = 0; index < totalIndices; index++) {
                var vertexIndex = indices[index];

                for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                    kind = kinds[kindIndex];
                    var stride = vbs[kind].getStrideSize();

                    for (var offset = 0; offset < stride; offset++) {
                        newdata[kind].push(data[kind][vertexIndex * stride + offset]);
                    }
                }
            }

            // Updating faces & normal
            var normals = [];
            var positions = newdata[VertexBuffer.PositionKind];
            for (index = 0; index < totalIndices; index += 3) {
                indices[index] = index;
                indices[index + 1] = index + 1;
                indices[index + 2] = index + 2;

                var p1 = Vector3.FromArray(positions, index * 3);
                var p2 = Vector3.FromArray(positions, (index + 1) * 3);
                var p3 = Vector3.FromArray(positions, (index + 2) * 3);

                var p1p2 = p1.subtract(p2);
                var p3p2 = p3.subtract(p2);

                var normal = Vector3.Normalize(Vector3.Cross(p1p2, p3p2));

                // Store same normals for every vertex
                for (var localIndex = 0; localIndex < 3; localIndex++) {
                    normals.push(normal.x);
                    normals.push(normal.y);
                    normals.push(normal.z);
                }
            }

            this.setIndices(indices);
            this.setVerticesData(VertexBuffer.NormalKind, normals, updatableNormals);

            // Updating vertex buffers
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(kind, newdata[kind], vbs[kind].isUpdatable());
            }

            // Updating submeshes
            this.releaseSubMeshes();
            for (var submeshIndex = 0; submeshIndex < previousSubmeshes.length; submeshIndex++) {
                var previousOne = previousSubmeshes[submeshIndex];
                var subMesh = new SubMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }

            this.synchronizeInstances();
        }

        // will inverse faces orientations, and invert normals too if specified
        public flipFaces(flipNormals: boolean = false): void {
            var vertex_data = VertexData.ExtractFromMesh(this);
            var i: number;
            if (flipNormals && this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                for (i = 0; i < vertex_data.normals.length; i++) {
                    vertex_data.normals[i] *= -1;
                }
            }

            var temp;
            for (i = 0; i < vertex_data.indices.length; i += 3) {
                // reassign indices
                temp = vertex_data.indices[i + 1];
                vertex_data.indices[i + 1] = vertex_data.indices[i + 2];
                vertex_data.indices[i + 2] = temp;
            }

            vertex_data.applyToMesh(this);
        }

        // Instances
        public createInstance(name: string): InstancedMesh {
            return new InstancedMesh(name, this);
        }

        public synchronizeInstances(): void {
            for (var instanceIndex = 0; instanceIndex < this.instances.length; instanceIndex++) {
                var instance = this.instances[instanceIndex];
                instance._syncSubMeshes();
            }
        }

        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async.
         * @param settings a collection of simplification settings.
         * @param parallelProcessing should all levels calculate parallel or one after the other.
         * @param type the type of simplification to run.
         * @param successCallback optional success callback to be called after the simplification finished processing all settings.
         */
        public simplify(settings: Array<ISimplificationSettings>, parallelProcessing: boolean = true, simplificationType: SimplificationType = SimplificationType.QUADRATIC, successCallback?: (mesh?: Mesh, submeshIndex?: number) => void) {
            this.getScene().simplificationQueue.addTask({
                settings: settings,
                parallelProcessing: parallelProcessing,
                mesh: this,
                simplificationType: simplificationType,
                successCallback: successCallback
            });
        }

        /**
         * Optimization of the mesh's indices, in case a mesh has duplicated vertices.
         * The function will only reorder the indices and will not remove unused vertices to avoid problems with submeshes.
         * This should be used together with the simplification to avoid disappearing triangles.
         * @param successCallback an optional success callback to be called after the optimization finished.
         */
        public optimizeIndices(successCallback?: (mesh?: Mesh) => void) {
            var indices = this.getIndices();
            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            var vectorPositions = [];
            for (var pos = 0; pos < positions.length; pos = pos + 3) {
                vectorPositions.push(Vector3.FromArray(positions, pos));
            }
            var dupes = [];

            AsyncLoop.SyncAsyncForLoop(vectorPositions.length, 40, (iteration) => {
                var realPos = vectorPositions.length - 1 - iteration;
                var testedPosition = vectorPositions[realPos];
                for (var j = 0; j < realPos; ++j) {
                    var againstPosition = vectorPositions[j];
                    if (testedPosition.equals(againstPosition)) {
                        dupes[realPos] = j;
                        break;
                    }
                }
            }, () => {
                for (var i = 0; i < indices.length; ++i) {
                    indices[i] = dupes[indices[i]] || indices[i];
                }

                //indices are now reordered
                var originalSubMeshes = this.subMeshes.slice(0);
                this.setIndices(indices);
                this.subMeshes = originalSubMeshes;
                if (successCallback) {
                    successCallback(this);
                }
            });
        }

        // Statics
        public static CreateRibbon(name: string, pathArray: Vector3[][], closeArray: boolean, closePath: boolean, offset: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        public static CreateRibbon(name: string, options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene?: Scene): Mesh;
        public static CreateRibbon(name: string, options: any, closeArrayOrScene?: any, closePath?: boolean, offset?: number, scene?: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE, instance: Mesh = null): Mesh {
            var pathArray;
            var closeArray;
            if (Array.isArray(options)) {
                pathArray = options;
                closeArray = closeArrayOrScene;
                if (!instance) {
                    options = {
                        pathArray: pathArray,
                        closeArray: closeArray,
                        closePath: closePath,
                        offset: offset,
                        updatable: updatable,
                        sideOrientation: sideOrientation
                    }
                }

            } else {
                scene = closeArrayOrScene;
                pathArray = options.pathArray;
                closeArray = options.closeArray;
                closePath = options.closePath;
                offset = options.offset;
                sideOrientation = options.sideOrientation;
                instance = options.instance;
                updatable = options.updatable;
            }

            if (instance) {   // existing ribbon instance update
                // positionFunction : ribbon case
                // only pathArray and sideOrientation parameters are taken into account for positions update
                var positionFunction = positions => {
                    var minlg = pathArray[0].length;
                    var i = 0;
                    var ns = (instance.sideOrientation === Mesh.DOUBLESIDE) ? 2 : 1;
                    for (var si = 1; si <= ns; si++) {
                        for (var p = 0; p < pathArray.length; p++) {
                            var path = pathArray[p];
                            var l = path.length;
                            minlg = (minlg < l) ? minlg : l;
                            var j = 0;
                            while (j < minlg) {
                                positions[i] = path[j].x;
                                positions[i + 1] = path[j].y;
                                positions[i + 2] = path[j].z;
                                j++;
                                i += 3;
                            }
                            if ((<any>instance)._closePath) {
                                positions[i] = path[0].x;
                                positions[i + 1] = path[0].y;
                                positions[i + 2] = path[0].z;
                                i += 3;
                            }
                        }
                    }
                };
                var positions = instance.getVerticesData(VertexBuffer.PositionKind);
                positionFunction(positions);
                instance.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
                if (!(instance.areNormalsFrozen)) {
                    var indices = instance.getIndices();
                    var normals = instance.getVerticesData(VertexBuffer.NormalKind);
                    VertexData.ComputeNormals(positions, indices, normals);

                    if ((<any>instance)._closePath) {
                        var indexFirst: number = 0;
                        var indexLast: number = 0;
                        for (var p = 0; p < pathArray.length; p++) {
                            indexFirst = (<any>instance)._idx[p] * 3;
                            if (p + 1 < pathArray.length) {
                                indexLast = ((<any>instance)._idx[p + 1] - 1) * 3;
                            }
                            else {
                                indexLast = normals.length - 3;
                            }
                            normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                            normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                            normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                            normals[indexLast] = normals[indexFirst];
                            normals[indexLast + 1] = normals[indexFirst + 1];
                            normals[indexLast + 2] = normals[indexFirst + 2];
                        }
                    }

                    instance.updateVerticesData(VertexBuffer.NormalKind, normals, false, false);
                }

                return instance;
            }
            else {  // new ribbon creation

                var ribbon = new Mesh(name, scene);
                ribbon.sideOrientation = sideOrientation;

                var vertexData = VertexData.CreateRibbon(options);
                if (closePath) {
                    (<any>ribbon)._idx = (<any>vertexData)._idx;
                }
                (<any>ribbon)._closePath = closePath;
                (<any>ribbon)._closeArray = closeArray;

                vertexData.applyToMesh(ribbon, updatable);

                return ribbon;
            }
        }

        public static CreateDisc(name: string, radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        public static CreateDisc(name: string, options: { radius: number, tessellation: number, updatable?: boolean, sideOrientation?: number }, scene: Scene): Mesh;
        public static CreateDisc(name: string, options: any, tessellationOrScene: any, scene?: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            if (tessellationOrScene instanceof Scene) {
                scene = tessellationOrScene;
            } else {
                var radius = options;
                options = {
                    radius: radius,
                    tessellation: tessellationOrScene,
                    sideOrientation: sideOrientation
                }
            }
            var disc = new Mesh(name, scene);
            var vertexData = VertexData.CreateDisc(options);

            vertexData.applyToMesh(disc, updatable || options.updatable);

            return disc;
        }

        public static CreateBox(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        public static CreateBox(name: string, options: { width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh;
        public static CreateBox(name: string, options: any, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            // Check parameters
            updatable = updatable || options.updatable;
            if (typeof options === 'number') {
                var size = options;
                options = {
                    size: size,
                    sideOrientation: sideOrientation
                };
            }

            var box = new Mesh(name, scene);
            var vertexData = VertexData.CreateBox(options);

            vertexData.applyToMesh(box, updatable);

            return box;
        }

        public static CreateSphere(name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        public static CreateSphere(name: string, options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, sideOrientation?: number, updatable?: boolean }, scene: any): Mesh;
        public static CreateSphere(name: string, options: any, diameterOrScene: any, scene?: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            if (diameterOrScene instanceof Scene) {
                scene = diameterOrScene;
                updatable = options.updatable;
            } else {
                var segments = options;

                options = {
                    segments: segments,
                    diameterX: diameterOrScene,
                    diameterY: diameterOrScene,
                    diameterZ: diameterOrScene,
                    sideOrientation: sideOrientation
                }
            }

            var sphere = new Mesh(name, scene);
            var vertexData = VertexData.CreateSphere(options);

            vertexData.applyToMesh(sphere, updatable);

            return sphere;
        }

        // Cylinder and cone
        public static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: any, scene: Scene, updatable?: any, sideOrientation?: number): Mesh;
        public static CreateCylinder(name: string, options: { height?: number, diameterTop?: number, diameterBottom?: number, tessellation?: number, subdivisions?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh;
        public static CreateCylinder(name: string, options: any, diameterTopOrScene: any, diameterBottom?: number, tessellation?: number, subdivisions?: any, scene?: Scene, updatable?: any, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {

            if (diameterTopOrScene instanceof Scene) {
                scene = diameterTopOrScene;
                updatable = options.updatable;
            } else {
                if (scene === undefined || !(scene instanceof Scene)) {
                    if (scene !== undefined) {
                        sideOrientation = updatable || Mesh.DEFAULTSIDE;
                        updatable = scene;
                    }
                    scene = <Scene>subdivisions;
                    subdivisions = 1;
                }
                var height = options;
                options = {
                    height: height,
                    diameterTop: diameterTopOrScene,
                    diameterBottom: diameterBottom,
                    tessellation: tessellation,
                    subdivisions: subdivisions,
                    sideOrientation: sideOrientation
                }

            }
            var cylinder = new Mesh(name, scene);
            var vertexData = VertexData.CreateCylinder(options);

            vertexData.applyToMesh(cylinder, updatable);

            return cylinder;
        }

        // Torus  (Code from SharpDX.org)
        public static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        public static CreateTorus(name: string, options: { diameter?: number, thickness?: number, tessellation?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh;
        public static CreateTorus(name: string, options: any, thicknessOrScene: any, tessellation?: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            if (thicknessOrScene instanceof Scene) {
                scene = thicknessOrScene;
                updatable = options.updatable;
            } else {
                var diameter = options;
                options = {
                    diameter: diameter,
                    thickness: thicknessOrScene,
                    tessellation: tessellation,
                    sideOrientation: sideOrientation
                }
            }
            var torus = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorus(options);

            vertexData.applyToMesh(torus, updatable);

            return torus;
        }

        public static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        public static CreateTorusKnot(name: string, options: { radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, p?: number, q?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh;
        public static CreateTorusKnot(name: string, options: any, tubeOrScene: any, radialSegments?: number, tubularSegments?: number, p?: number, q?: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            if (tubeOrScene instanceof Scene) {
                scene = tubeOrScene;
                updatable = options.updatable;
            } else {
                var radius = options;
                options = {
                    radius: radius,
                    tube: tubeOrScene,
                    radialSegments: radialSegments,
                    tubularSegments: tubularSegments,
                    p: p,
                    q: q,
                    sideOrientation: sideOrientation
                }
            }
            var torusKnot = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorusKnot(options);

            vertexData.applyToMesh(torusKnot, updatable);

            return torusKnot;
        }

        // Lines
        public static CreateLines(name: string, points: Vector3[], scene: Scene, updatable?: boolean, instance?: LinesMesh): LinesMesh;
        public static CreateLines(name: string, options: { points: Vector3[], updatable?: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh;
        public static CreateLines(name: string, options: any, scene: Scene, updatable?: boolean, instance?: LinesMesh): LinesMesh {
            var points: Vector3[];
            if (Array.isArray(options)) {
                points = options;
                if (!instance) {
                    options = {
                        points: points
                    }
                }
            } else {
                instance = options.instance;
                points = options.points;
            }

            if (instance) { // lines update
                var positionFunction = positions => {
                    var i = 0;
                    for (var p = 0; p < points.length; p++) {
                        positions[i] = points[p].x;
                        positions[i + 1] = points[p].y;
                        positions[i + 2] = points[p].z;
                        i += 3;
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }

            // lines creation
            var lines = new LinesMesh(name, scene);
            var vertexData = VertexData.CreateLines(options);
            vertexData.applyToMesh(lines, updatable || options.updatable);
            return lines;
        }

        // Dashed Lines
        public static CreateDashedLines(name: string, points: Vector3[], dashSize: number, gapSize: number, dashNb: number, scene: Scene, updatable?: boolean, instance?: LinesMesh): LinesMesh;
        public static CreateDashedLines(name: string, options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number, updatable?: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh;
        public static CreateDashedLines(name: string, options: any, dashSizeOrScene: any, gapSize?: number, dashNb?: number, scene?: Scene, updatable?: boolean, instance?: LinesMesh): LinesMesh {
            var points: Vector3[];
            var dashSize: number;
            if (Array.isArray(options)) {
                points = options;
                dashSize = dashSizeOrScene;
                if (!instance) {
                    options = {
                        points: points,
                        dashSize: dashSize,
                        gapSize: gapSize,
                        dashNb: dashNb
                    }
                }
            } else {
                scene = dashSizeOrScene,
                points = options.points;
                instance = options.instance;
                gapSize = options.gapSize;
                dashNb = options.dashNb;
                dashSize = options.dashSize;
            }
            if (instance) {  //  dashed lines update
                var positionFunction = (positions: number[]): void => {
                    var curvect = Vector3.Zero();
                    var nbSeg = positions.length / 6;
                    var lg = 0;
                    var nb = 0;
                    var shft = 0;
                    var dashshft = 0;
                    var curshft = 0;
                    var p = 0;
                    var i = 0;
                    var j = 0;
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        lg += curvect.length();
                    }
                    shft = lg / nbSeg;
                    dashshft = (<any>instance).dashSize * shft / ((<any>instance).dashSize + (<any>instance).gapSize);
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        nb = Math.floor(curvect.length() / shft);
                        curvect.normalize();
                        j = 0;
                        while (j < nb && p < positions.length) {
                            curshft = shft * j;
                            positions[p] = points[i].x + curshft * curvect.x;
                            positions[p + 1] = points[i].y + curshft * curvect.y;
                            positions[p + 2] = points[i].z + curshft * curvect.z;
                            positions[p + 3] = points[i].x + (curshft + dashshft) * curvect.x;
                            positions[p + 4] = points[i].y + (curshft + dashshft) * curvect.y;
                            positions[p + 5] = points[i].z + (curshft + dashshft) * curvect.z;
                            p += 6;
                            j++;
                        }
                    }
                    while (p < positions.length) {
                        positions[p] = points[i].x;
                        positions[p + 1] = points[i].y;
                        positions[p + 2] = points[i].z;
                        p += 3;
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }
            // dashed lines creation
            var dashedLines = new LinesMesh(name, scene);
            var vertexData = VertexData.CreateDashedLines(options);
            vertexData.applyToMesh(dashedLines, updatable || options.updatable);
            (<any>dashedLines).dashSize = dashSize;
            (<any>dashedLines).gapSize = gapSize;
            return dashedLines;
        }

        // Extrusion
        public static ExtrudeShape(name: string, shape: Vector3[], path: Vector3[], scale: number, rotation: number, cap: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE, extrudedInstance: Mesh = null): Mesh {
            scale = scale || 1;
            rotation = rotation || 0;
            var extruded = Mesh._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, cap, false, scene, updatable, sideOrientation, extrudedInstance);
            return extruded;
        }

        public static ExtrudeShapeCustom(name: string, shape: Vector3[], path: Vector3[], scaleFunction, rotationFunction, ribbonCloseArray: boolean, ribbonClosePath: boolean, cap: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE, extrudedInstance: Mesh = null): Mesh {
            var extrudedCustom = Mesh._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, cap, true, scene, updatable, sideOrientation, extrudedInstance);
            return extrudedCustom;
        }

        private static _ExtrudeShapeGeneric(name: string, shape: Vector3[], curve: Vector3[], scale: number, rotation: number, scaleFunction: { (i: number, distance: number): number; }, rotateFunction: { (i: number, distance: number): number; }, rbCA: boolean, rbCP: boolean, cap: number, custom: boolean, scene: Scene, updtbl: boolean, side: number, instance: Mesh): Mesh {

            // extrusion geometry
            var extrusionPathArray = (shape, curve, path3D, shapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom) => {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var binormals = path3D.getBinormals();
                var distances = path3D.getDistances();

                var angle = 0;
                var returnScale: { (i: number, distance: number): number; } = (i, distance) => { return scale; };
                var returnRotation: { (i: number, distance: number): number; } = (i, distance) => { return rotation; };
                var rotate: { (i: number, distance: number): number; } = custom ? rotateFunction : returnRotation;
                var scl: { (i: number, distance: number): number; } = custom ? scaleFunction : returnScale;
                var index = 0;

                for (var i = 0; i < curve.length; i++) {
                    var shapePath = new Array<Vector3>();
                    var angleStep = rotate(i, distances[i]);
                    var scaleRatio = scl(i, distances[i]);
                    for (var p = 0; p < shape.length; p++) {
                        var rotationMatrix = Matrix.RotationAxis(tangents[i], angle);
                        var planed = ((tangents[i].scale(shape[p].z)).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y)));
                        var rotated = Vector3.TransformCoordinates(planed, rotationMatrix).scaleInPlace(scaleRatio).add(curve[i]);
                        shapePath.push(rotated);
                    }
                    shapePaths[index] = shapePath;
                    angle += angleStep;
                    index++;
                }
                // cap
                var capPath = shapePath => {
                    var pointCap = Array<Vector3>();
                    var barycenter = Vector3.Zero();
                    var i: number;
                    for (i = 0; i < shapePath.length; i++) {
                        barycenter.addInPlace(shapePath[i]);
                    }
                    barycenter.scaleInPlace(1 / shapePath.length);
                    for (i = 0; i < shapePath.length; i++) {
                        pointCap.push(barycenter);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case Mesh.NO_CAP:
                        break;
                    case Mesh.CAP_START:
                        shapePaths.unshift(capPath(shapePaths[0]));
                        break;
                    case Mesh.CAP_END:
                        shapePaths.push(capPath(shapePaths[shapePaths.length - 1]));
                        break;
                    case Mesh.CAP_ALL:
                        shapePaths.unshift(capPath(shapePaths[0]));
                        shapePaths.push(capPath(shapePaths[shapePaths.length - 1]));
                        break;
                    default:
                        break;
                }
                return shapePaths;
            };
            var path3D;
            var pathArray;
            if (instance) { // instance update
                path3D = ((<any>instance).path3D).update(curve);
                pathArray = extrusionPathArray(shape, curve, (<any>instance).path3D, (<any>instance).pathArray, scale, rotation, scaleFunction, rotateFunction, (<any>instance).cap, custom);
                instance = Mesh.CreateRibbon(null, pathArray, null, null, null, null, null, null, instance);

                return instance;
            }
            // extruded shape creation
            path3D = <any>new Path3D(curve);
            var newShapePaths = new Array<Array<Vector3>>();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom);
            var extrudedGeneric = Mesh.CreateRibbon(name, pathArray, rbCA, rbCP, 0, scene, updtbl, side);
            (<any>extrudedGeneric).pathArray = pathArray;
            (<any>extrudedGeneric).path3D = path3D;
            (<any>extrudedGeneric).cap = cap;

            return extrudedGeneric;
        }

        // Lathe
        public static CreateLathe(name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            radius = radius || 1;
            tessellation = tessellation || radius * 60;
            var pi2 = Math.PI * 2;
            var shapeLathe = new Array<Vector3>();

            // first rotatable point
            var i = 0;
            while (shape[i].x === 0) {
                i++;
            }
            var pt = shape[i];
            for (i = 0; i < shape.length; i++) {
                shapeLathe.push(shape[i].subtract(pt));
            }

            // circle path
            var step = pi2 / tessellation;
            var rotated;
            var path = new Array<Vector3>();;
            for (i = 0; i < tessellation; i++) {
                rotated = new Vector3(Math.cos(i * step) * radius, 0, Math.sin(i * step) * radius);
                path.push(rotated);
            }
            path.push(path[0]);

            // extrusion
            var scaleFunction = () => { return 1; };
            var rotateFunction = () => { return 0; };
            var lathe = Mesh.ExtrudeShapeCustom(name, shapeLathe, path, scaleFunction, rotateFunction, true, false, Mesh.NO_CAP, scene, updatable, sideOrientation);
            return lathe;
        }

        // Plane & ground
        public static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh;
        public static CreatePlane(name: string, options: { size?: number, width?: number, height?: number, sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh;
        public static CreatePlane(name: string, options: any, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            if (typeof options === 'number') {
                var size = options;
                options = {
                    size: size,
                    width: size,
                    height: size,
                    sideOrientation: sideOrientation
                }
            }
            var plane = new Mesh(name, scene);

            var vertexData = VertexData.CreatePlane(options);

            vertexData.applyToMesh(plane, updatable || options.updatable);

            return plane;
        }

        public static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable?: boolean): Mesh;
        public static CreateGround(name: string, options: { width?: number, height?: number, subdivisions?: number, updatable?: boolean }, scene: any): Mesh;
        public static CreateGround(name: string, options: any, heightOrScene: any, subdivisions?: number, scene?: Scene, updatable?: boolean): Mesh {
            if (heightOrScene instanceof Scene) {
                scene = heightOrScene;
                updatable = options.updatable;
            } else {
                var width = options;

                options = {
                    width: width,
                    height: heightOrScene,
                    subdivisions: subdivisions
                }
            }

            var ground = new GroundMesh(name, scene);
            ground._setReady(false);
            ground._subdivisions = options.subdivisions || 1;

            var vertexData = VertexData.CreateGround(options);

            vertexData.applyToMesh(ground, updatable || options.updatable);

            ground._setReady(true);

            return ground;
        }

        public static CreateTiledGround(name: string, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: { w: number; h: number; }, precision: { w: number; h: number; }, scene: Scene, updatable?: boolean): Mesh {
            var tiledGround = new Mesh(name, scene);

            var vertexData = VertexData.CreateTiledGround(xmin, zmin, xmax, zmax, subdivisions, precision);

            vertexData.applyToMesh(tiledGround, updatable);

            return tiledGround;
        }

        public static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean, onReady?: (mesh: GroundMesh) => void): GroundMesh {
            var ground = new GroundMesh(name, scene);
            ground._subdivisions = subdivisions;

            ground._setReady(false);

            var onload = img => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = <Uint8Array>(<any>context.getImageData(0, 0, heightMapWidth, heightMapHeight).data);
                var vertexData = VertexData.CreateGroundFromHeightMap(width, height, subdivisions, minHeight, maxHeight, buffer, heightMapWidth, heightMapHeight);

                vertexData.applyToMesh(ground, updatable);

                ground._setReady(true);

                //execute ready callback, if set
                if (onReady) {
                    onReady(ground);
                }
            };

            Tools.LoadImage(url, onload, () => { }, scene.database);

            return ground;
        }

        public static CreateTube(name: string, path: Vector3[], radius: number, tessellation: number, radiusFunction: { (i: number, distance: number): number; }, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh;
        public static CreateTube(name: string, options: { path: Vector3[], radius?: number, tessellation?: number, radiusFunction?: { (i: number, distance: number): number; }, cap?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene: Scene): Mesh;
        public static CreateTube(name: string, options: any, radiusOrScene: any, tessellation?: number, radiusFunction?: { (i: number, distance: number): number; }, cap?: number, scene?: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE, instance: Mesh = null): Mesh {
            var path: Vector3[];
            var radius: number;
            if (Array.isArray(options)) {
                    path = options;
                    radius = radiusOrScene;
                } else {
                    scene = radiusOrScene;
                    path = options.path;
                    radius = options.radius || 1;
                    tessellation = options.tessellation || 64;
                    radiusFunction = options.radiusFunction;
                    cap = options.cap || Mesh.NO_CAP,
                    updatable = options.updatable;
                    sideOrientation = options.sideOrientation || Mesh.DEFAULTSIDE,
                    instance = options.instance
                }
            // tube geometry
            var tubePathArray = (path, path3D, circlePaths, radius, tessellation, radiusFunction, cap) => {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var distances = path3D.getDistances();
                var pi2 = Math.PI * 2;
                var step = pi2 / tessellation;
                var returnRadius: { (i: number, distance: number): number; } = (i, distance) => radius;
                var radiusFunctionFinal: { (i: number, distance: number): number; } = radiusFunction || returnRadius;

                var circlePath: Vector3[];
                var rad: number;
                var normal: Vector3;
                var rotated: Vector3;
                var rotationMatrix: Matrix;
                var index = 0;
                for (var i = 0; i < path.length; i++) {
                    rad = radiusFunctionFinal(i, distances[i]); // current radius
                    circlePath = Array<Vector3>();              // current circle array
                    normal = normals[i];                        // current normal
                    for (var t = 0; t < tessellation; t++) {
                        rotationMatrix = Matrix.RotationAxis(tangents[i], step * t);
                        rotated = Vector3.TransformCoordinates(normal, rotationMatrix).scaleInPlace(rad).add(path[i]);
                        circlePath.push(rotated);
                    }
                    circlePaths[index] = circlePath;
                    index++;
                }
                // cap
                var capPath = (nbPoints, pathIndex) => {
                    var pointCap = Array<Vector3>();
                    for (var i = 0; i < nbPoints; i++) {
                        pointCap.push(path[pathIndex]);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case Mesh.NO_CAP:
                        break;
                    case Mesh.CAP_START:
                        circlePaths.unshift(capPath(tessellation + 1, 0));
                        break;
                    case Mesh.CAP_END:
                        circlePaths.push(capPath(tessellation + 1, path.length - 1));
                        break;
                    case Mesh.CAP_ALL:
                        circlePaths.unshift(capPath(tessellation + 1, 0));
                        circlePaths.push(capPath(tessellation + 1, path.length - 1));
                        break;
                    default:
                        break;
                }
                return circlePaths;
            };
            var path3D;
            var pathArray;
            if (instance) { // tube update
                path3D = ((<any>instance).path3D).update(path);
                pathArray = tubePathArray(path, path3D, (<any>instance).pathArray, radius, (<any>instance).tessellation, radiusFunction, (<any>instance).cap);
                instance = Mesh.CreateRibbon(null, { pathArray: pathArray, instance: instance });
                (<any>instance).path3D = path3D;
                (<any>instance).pathArray = pathArray;

                return instance;

            }
            // tube creation
            path3D = <any>new Path3D(path);
            var newPathArray = new Array<Array<Vector3>>();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap);
            var tube = Mesh.CreateRibbon(name, {pathArray: pathArray, closePath: true, closeArray: false, updatable: updatable, sideOrientation: sideOrientation}, scene);
            (<any>tube).pathArray = pathArray;
            (<any>tube).path3D = path3D;
            (<any>tube).tessellation = tessellation;
            (<any>tube).cap = cap;

            return tube;
        }

        // Decals
        public static CreateDecal(name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number = 0) {
            var indices = sourceMesh.getIndices();
            var positions = sourceMesh.getVerticesData(VertexBuffer.PositionKind);
            var normals = sourceMesh.getVerticesData(VertexBuffer.NormalKind);

            // Getting correct rotation
            if (!normal) {
                var target = new Vector3(0, 0, 1);
                var camera = sourceMesh.getScene().activeCamera;
                var cameraWorldTarget = Vector3.TransformCoordinates(target, camera.getWorldMatrix());

                normal = camera.globalPosition.subtract(cameraWorldTarget);
            }

            var yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
            var len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
            var pitch = Math.atan2(normal.y, len);

            // Matrix
            var decalWorldMatrix = Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(Matrix.Translation(position.x, position.y, position.z));
            var inverseDecalWorldMatrix = Matrix.Invert(decalWorldMatrix);
            var meshWorldMatrix = sourceMesh.getWorldMatrix();
            var transformMatrix = meshWorldMatrix.multiply(inverseDecalWorldMatrix);

            var vertexData = new VertexData();
            vertexData.indices = [];
            vertexData.positions = [];
            vertexData.normals = [];
            vertexData.uvs = [];

            var currentVertexDataIndex = 0;

            var extractDecalVector3 = (indexId: number): PositionNormalVertex => {
                var vertexId = indices[indexId];
                var result = new PositionNormalVertex();
                result.position = new Vector3(positions[vertexId * 3], positions[vertexId * 3 + 1], positions[vertexId * 3 + 2]);

                // Send vector to decal local world
                result.position = Vector3.TransformCoordinates(result.position, transformMatrix);

                // Get normal
                result.normal = new Vector3(normals[vertexId * 3], normals[vertexId * 3 + 1], normals[vertexId * 3 + 2]);

                return result;
            }; // Inspired by https://github.com/mrdoob/three.js/blob/eee231960882f6f3b6113405f524956145148146/examples/js/geometries/DecalGeometry.js
            var clip = (vertices: PositionNormalVertex[], axis: Vector3): PositionNormalVertex[]=> {
                if (vertices.length === 0) {
                    return vertices;
                }

                var clipSize = 0.5 * Math.abs(Vector3.Dot(size, axis));

                var clipVertices = (v0: PositionNormalVertex, v1: PositionNormalVertex): PositionNormalVertex => {
                    var clipFactor = Vector3.GetClipFactor(v0.position, v1.position, axis, clipSize);

                    return new PositionNormalVertex(
                        Vector3.Lerp(v0.position, v1.position, clipFactor),
                        Vector3.Lerp(v0.normal, v1.normal, clipFactor)
                    );
                };
                var result = new Array<PositionNormalVertex>();

                for (var index = 0; index < vertices.length; index += 3) {
                    var v1Out: boolean;
                    var v2Out: boolean;
                    var v3Out: boolean;
                    var total = 0;
                    var nV1: PositionNormalVertex, nV2: PositionNormalVertex, nV3: PositionNormalVertex, nV4: PositionNormalVertex;

                    var d1 = Vector3.Dot(vertices[index].position, axis) - clipSize;
                    var d2 = Vector3.Dot(vertices[index + 1].position, axis) - clipSize;
                    var d3 = Vector3.Dot(vertices[index + 2].position, axis) - clipSize;

                    v1Out = d1 > 0;
                    v2Out = d2 > 0;
                    v3Out = d3 > 0;

                    total = (v1Out ? 1 : 0) + (v2Out ? 1 : 0) + (v3Out ? 1 : 0);

                    switch (total) {
                        case 0:
                            result.push(vertices[index]);
                            result.push(vertices[index + 1]);
                            result.push(vertices[index + 2]);
                            break;
                        case 1:

                            if (v1Out) {
                                nV1 = vertices[index + 1];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index], nV1);
                                nV4 = clipVertices(vertices[index], nV2);
                            }

                            if (v2Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index + 1], nV1);
                                nV4 = clipVertices(vertices[index + 1], nV2);

                                result.push(nV3);
                                result.push(nV2.clone());
                                result.push(nV1.clone());

                                result.push(nV2.clone());
                                result.push(nV3.clone());
                                result.push(nV4);
                                break;
                            }
                            if (v3Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 1];
                                nV3 = clipVertices(vertices[index + 2], nV1);
                                nV4 = clipVertices(vertices[index + 2], nV2);
                            }

                            result.push(nV1.clone());
                            result.push(nV2.clone());
                            result.push(nV3);

                            result.push(nV4);
                            result.push(nV3.clone());
                            result.push(nV2.clone());
                            break;
                        case 2:
                            if (!v1Out) {
                                nV1 = vertices[index].clone();
                                nV2 = clipVertices(nV1, vertices[index + 1]);
                                nV3 = clipVertices(nV1, vertices[index + 2]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v2Out) {
                                nV1 = vertices[index + 1].clone();
                                nV2 = clipVertices(nV1, vertices[index + 2]);
                                nV3 = clipVertices(nV1, vertices[index]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v3Out) {
                                nV1 = vertices[index + 2].clone();
                                nV2 = clipVertices(nV1, vertices[index]);
                                nV3 = clipVertices(nV1, vertices[index + 1]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            break;
                        case 3:
                            break;
                    }
                }

                return result;
            };
            for (var index = 0; index < indices.length; index += 3) {
                var faceVertices = new Array<PositionNormalVertex>();

                faceVertices.push(extractDecalVector3(index));
                faceVertices.push(extractDecalVector3(index + 1));
                faceVertices.push(extractDecalVector3(index + 2));

                // Clip
                faceVertices = clip(faceVertices, new Vector3(1, 0, 0));
                faceVertices = clip(faceVertices, new Vector3(-1, 0, 0));
                faceVertices = clip(faceVertices, new Vector3(0, 1, 0));
                faceVertices = clip(faceVertices, new Vector3(0, -1, 0));
                faceVertices = clip(faceVertices, new Vector3(0, 0, 1));
                faceVertices = clip(faceVertices, new Vector3(0, 0, -1));

                if (faceVertices.length === 0) {
                    continue;
                }

                // Add UVs and get back to world
                for (var vIndex = 0; vIndex < faceVertices.length; vIndex++) {
                    var vertex = faceVertices[vIndex];

                    vertexData.indices.push(currentVertexDataIndex);
                    vertex.position.toArray(vertexData.positions, currentVertexDataIndex * 3);
                    vertex.normal.toArray(vertexData.normals, currentVertexDataIndex * 3);
                    vertexData.uvs.push(0.5 + vertex.position.x / size.x);
                    vertexData.uvs.push(0.5 + vertex.position.y / size.y);

                    currentVertexDataIndex++;
                }
            }

            // Return mesh
            var decal = new Mesh(name, sourceMesh.getScene());
            vertexData.applyToMesh(decal);

            decal.position = position.clone();
            decal.rotation = new Vector3(pitch, yaw, angle);

            return decal;
        }

        // Skeletons

        /**
         * Update the vertex buffers by applying transformation from the bones
         * @param {skeleton} skeleton to apply
         */
        public applySkeleton(skeleton: Skeleton): Mesh {
            if (!this.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                return this;
            }
            if (!this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                return this;
            }
            if (!this.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind)) {
                return this;
            }
            if (!this.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)) {
                return this;
            }
            var source: number[];
            if (!this._sourcePositions) {
                source = this.getVerticesData(VertexBuffer.PositionKind);
                this._sourcePositions = new Float32Array(source);

                if (!this.getVertexBuffer(VertexBuffer.PositionKind).isUpdatable()) {
                    this.setVerticesData(VertexBuffer.PositionKind, source, true);
                }
            }

            if (!this._sourceNormals) {
                source = this.getVerticesData(VertexBuffer.NormalKind);
                this._sourceNormals = new Float32Array(source);

                if (!this.getVertexBuffer(VertexBuffer.NormalKind).isUpdatable()) {
                    this.setVerticesData(VertexBuffer.NormalKind, source, true);
                }
            }

            var positionsData = this.getVerticesData(VertexBuffer.PositionKind);
            var normalsData = this.getVerticesData(VertexBuffer.NormalKind);

            var matricesIndicesData = this.getVerticesData(VertexBuffer.MatricesIndicesKind);
            var matricesWeightsData = this.getVerticesData(VertexBuffer.MatricesWeightsKind);

            var skeletonMatrices = skeleton.getTransformMatrices();

            var tempVector3 = Vector3.Zero();
            var finalMatrix = new Matrix();
            var tempMatrix = new Matrix();

            for (var index = 0; index < positionsData.length; index += 3) {
                var index4 = (index / 3) * 4;
                var matricesWeight0 = matricesWeightsData[index4];
                var matricesWeight1 = matricesWeightsData[index4 + 1];
                var matricesWeight2 = matricesWeightsData[index4 + 2];
                var matricesWeight3 = matricesWeightsData[index4 + 3];

                if (matricesWeight0 > 0) {
                    Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4] * 16, matricesWeight0, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }

                if (matricesWeight1 > 0) {
                    Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4 + 1] * 16, matricesWeight1, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }

                if (matricesWeight2 > 0) {
                    Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4 + 2] * 16, matricesWeight2, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }

                if (matricesWeight3 > 0) {
                    Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[index4 + 3] * 16, matricesWeight3, tempMatrix);
                    finalMatrix.addToSelf(tempMatrix);
                }

                Vector3.TransformCoordinatesFromFloatsToRef(this._sourcePositions[index], this._sourcePositions[index + 1], this._sourcePositions[index + 2], finalMatrix, tempVector3);
                tempVector3.toArray(positionsData, index);

                Vector3.TransformNormalFromFloatsToRef(this._sourceNormals[index], this._sourceNormals[index + 1], this._sourceNormals[index + 2], finalMatrix, tempVector3);
                tempVector3.toArray(normalsData, index);

                finalMatrix.reset();
            }

            this.updateVerticesData(VertexBuffer.PositionKind, positionsData);
            this.updateVerticesData(VertexBuffer.NormalKind, normalsData);

            return this;
        }

        // Tools
        public static MinMax(meshes: AbstractMesh[]): { min: Vector3; max: Vector3 } {
            var minVector: Vector3 = null;
            var maxVector: Vector3 = null;
            for (var i in meshes) {
                var mesh = meshes[i];
                var boundingBox = mesh.getBoundingInfo().boundingBox;
                if (!minVector) {
                    minVector = boundingBox.minimumWorld;
                    maxVector = boundingBox.maximumWorld;
                    continue;
                }
                minVector.MinimizeInPlace(boundingBox.minimumWorld);
                maxVector.MaximizeInPlace(boundingBox.maximumWorld);
            }

            return {
                min: minVector,
                max: maxVector
            };
        }

        public static Center(meshesOrMinMaxVector): Vector3 {
            var minMaxVector = meshesOrMinMaxVector.min !== undefined ? meshesOrMinMaxVector : Mesh.MinMax(meshesOrMinMaxVector);
            return Vector3.Center(minMaxVector.min, minMaxVector.max);
        }

        /**
         * Merge the array of meshes into a single mesh for performance reasons.
         * @param {Array<Mesh>} meshes - The vertices source.  They should all be of the same material.  Entries can empty
         * @param {boolean} disposeSource - When true (default), dispose of the vertices from the source meshes
         * @param {boolean} allow32BitsIndices - When the sum of the vertices > 64k, this must be set to true.
         * @param {Mesh} meshSubclass - When set, vertices inserted into this Mesh.  Meshes can then be merged into a Mesh sub-class.
         */
        public static MergeMeshes(meshes: Array<Mesh>, disposeSource = true, allow32BitsIndices?: boolean, meshSubclass?: Mesh): Mesh {
            var index: number;
            if (!allow32BitsIndices) {
                var totalVertices = 0;

                // Counting vertices
                for (index = 0; index < meshes.length; index++) {
                    if (meshes[index]) {
                        totalVertices += meshes[index].getTotalVertices();

                        if (totalVertices > 65536) {
                            Tools.Warn("Cannot merge meshes because resulting mesh will have more than 65536 vertices. Please use allow32BitsIndices = true to use 32 bits indices");
                            return null;
                        }
                    }
                }
            }

            // Merge
            var vertexData: VertexData;
            var otherVertexData: VertexData;

            var source: Mesh;
            for (index = 0; index < meshes.length; index++) {
                if (meshes[index]) {
                    meshes[index].computeWorldMatrix(true);
                    otherVertexData = VertexData.ExtractFromMesh(meshes[index], true);
                    otherVertexData.transform(meshes[index].getWorldMatrix());

                    if (vertexData) {
                        vertexData.merge(otherVertexData);
                    } else {
                        vertexData = otherVertexData;
                        source = meshes[index];
                    }
                }
            }

            if (!meshSubclass) {
                meshSubclass = new Mesh(source.name + "_merged", source.getScene());
            }
            vertexData.applyToMesh(meshSubclass);

            // Setting properties
            meshSubclass.material = source.material;
            meshSubclass.checkCollisions = source.checkCollisions;

            // Cleaning
            if (disposeSource) {
                for (index = 0; index < meshes.length; index++) {
                    if (meshes[index]) {
                        meshes[index].dispose();
                    }
                }
            }

            return meshSubclass;
        }
    }
}





