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


        // Members
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;
        public instances = new Array<InstancedMesh>();
        public delayLoadingFile: string;
        public _binaryInfo: any;
        private _LODLevels = new Array<Internals.MeshLODLevel>();

        // Private
        public _geometry: Geometry;
        private _onBeforeRenderCallbacks = new Array<(mesh: AbstractMesh) => void>();
        private _onAfterRenderCallbacks = new Array<(mesh: AbstractMesh) => void>();
        public _delayInfo; //ANY
        public _delayLoadingFunction: (any, Mesh) => void;
        public _visibleInstances: any = {};
        private _renderIdForInstances = new Array<number>();
        private _batchCache = new _InstancesBatch();
        private _worldMatricesInstancesBuffer: WebGLBuffer;
        private _worldMatricesInstancesArray: Float32Array;
        private _instancesBufferSize = 32 * 16 * 4; // let's start with a maximum of 32 instances
        public _shouldGenerateFlatShading: boolean;
        private _preActivateId: number;

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
                Tools.DeepCopy(source, this, ["name", "material", "skeleton"], []);

                // Material
                this.material = source.material;

                if (!doNotCloneChildren) {
                    // Children
                    for (var index = 0; index < scene.meshes.length; index++) {
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
                return this;
            }

            for (var index = 0; index < this._LODLevels.length; index++) {
                var level = this._LODLevels[index];

                if (level.distance < distanceToCamera) {

                    if (level.mesh) {
                        level.mesh._preActivate();
                        level.mesh._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
                    }
                    return level.mesh;
                }
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

        public getVerticesData(kind: string): number[] {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind);
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

        public getIndices(): number[] {
            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices();
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

        public registerAfterRender(func: () => void): void {
            this._onAfterRenderCallbacks.push(func);
        }

        public unregisterAfterRender(func: () => void): void {
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

        public render(subMesh: SubMesh): void {
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

            for (var callbackIndex = 0; callbackIndex < this._onBeforeRenderCallbacks.length; callbackIndex++) {
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
            for (var index = 0; index < materials.length; index++) {
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
            for (var index = 0; index < data.length; index += 3) {
                Vector3.TransformCoordinates(Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(VertexBuffer.PositionKind, temp, this.getVertexBuffer(VertexBuffer.PositionKind).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                return;
            }

            data = this.getVerticesData(VertexBuffer.NormalKind);
            for (index = 0; index < data.length; index += 3) {
                Vector3.TransformNormal(Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(VertexBuffer.NormalKind, temp, this.getVertexBuffer(VertexBuffer.NormalKind).isUpdatable());
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
                var buffer = <Uint8Array> (<any>context.getImageData(0, 0, heightMapWidth, heightMapHeight).data);

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
            for (var kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                var kind = kinds[kindIndex];
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
            for (var index = 0; index < totalIndices; index++) {
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
            },  () => {
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
        public static CreateRibbon(name: string, pathArray: Vector3[][], closeArray: boolean, closePath: boolean, offset: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var ribbon = new Mesh(name, scene);
            var vertexData = VertexData.CreateRibbon(pathArray, closeArray, closePath, offset, sideOrientation);

            vertexData.applyToMesh(ribbon, updatable);

            return ribbon;
        }

        public static CreateBox(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var box = new Mesh(name, scene);
            var vertexData = VertexData.CreateBox(size, sideOrientation);

            vertexData.applyToMesh(box, updatable);

            return box;
        }

        public static CreateSphere(name: string, segments: number, diameter: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var sphere = new Mesh(name, scene);
            var vertexData = VertexData.CreateSphere(segments, diameter, sideOrientation);

            vertexData.applyToMesh(sphere, updatable);

            return sphere;
        }

        // Cylinder and cone (Code inspired by SharpDX.org)
        public static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: any, scene: Scene, updatable?: any, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            // subdivisions is a new parameter, we need to support old signature
            if (scene === undefined || !(scene instanceof Scene)) {
                if (scene !== undefined) {
                    updatable = scene;
                }
                scene = <Scene>subdivisions;
                subdivisions = 1;
            }

            var cylinder = new Mesh(name, scene);
            var vertexData = VertexData.CreateCylinder(height, diameterTop, diameterBottom, tessellation, subdivisions);

            vertexData.applyToMesh(cylinder, updatable);

            return cylinder;
        }

        // Torus  (Code from SharpDX.org)
        public static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var torus = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorus(diameter, thickness, tessellation, sideOrientation);

            vertexData.applyToMesh(torus, updatable);

            return torus;
        }

        public static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var torusKnot = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorusKnot(radius, tube, radialSegments, tubularSegments, p, q, sideOrientation);

            vertexData.applyToMesh(torusKnot, updatable);

            return torusKnot;
        }

        // Lines
        public static CreateLines(name: string, points: Vector3[], scene: Scene, updatable?: boolean): LinesMesh {
            var lines = new LinesMesh(name, scene, updatable);

            var vertexData = VertexData.CreateLines(points);

            vertexData.applyToMesh(lines, updatable);

            return lines;
        }

        // Extrusion
        public static ExtrudeShape(name: string, shape: Vector3[], path: Vector3[], scale: number, rotation: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            scale = scale || 1;
            rotation = rotation || 0;
            var extruded = Mesh._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, false, scene, updatable, sideOrientation);
            return extruded;
        }

        public static ExtrudeShapeCustom(name: string, shape: Vector3[], path: Vector3[], scaleFunction, rotationFunction, ribbonCloseArray: boolean, ribbonClosePath: boolean, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var extrudedCustom = Mesh._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, true, scene, updatable, sideOrientation);
            return extrudedCustom;
        }

        private static _ExtrudeShapeGeneric(name: string, shape: Vector3[], curve: Vector3[], scale: number, rotation: number, scaleFunction, rotationFunction, rbCA: boolean, rbCP: boolean, custom: boolean, scene: Scene, updtbl: boolean, side: number): Mesh {
            var path3D = new Path3D(curve);

            var shapePaths: Vector3[][] = [];
            var extrudedGeneric = Mesh.CreateRibbon(name, shapePaths, rbCA, rbCP, 0, scene, updtbl, side);
            return extrudedGeneric;

        }

        // Plane & ground
        public static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var plane = new Mesh(name, scene);
            var vertexData = VertexData.CreatePlane(size, sideOrientation);

            vertexData.applyToMesh(plane, updatable);

            return plane;
        }

        public static CreateGround(name: string, width: number, height: number, subdivisions: number, scene: Scene, updatable?: boolean): Mesh {
            var ground = new GroundMesh(name, scene);
            ground._setReady(false);
            ground._subdivisions = subdivisions;

            var vertexData = VertexData.CreateGround(width, height, subdivisions);

            vertexData.applyToMesh(ground, updatable);

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
                var buffer = <Uint8Array> (<any>context.getImageData(0, 0, heightMapWidth, heightMapHeight).data);
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

        public static CreateTube(name: string, path: Vector3[], radius: number, tesselation: number, radiusFunction: { (i: number, distance: number): number; }, scene: Scene, updatable?: boolean, sideOrientation: number = Mesh.DEFAULTSIDE): Mesh {
            var path3D = new Path3D(path);
            var tangents = path3D.getTangents();
            var normals = path3D.getNormals();
            var distances = path3D.getDistances();
            var pi2 = Math.PI * 2;
            var step = pi2 / tesselation;
            var returnRadius: { (i: number, distance: number): number; } = (i, distance) => radius;
            var radiusFunctionFinal: { (i: number, distance: number): number; } = radiusFunction || returnRadius;

            var circlePaths = new Array<Array<Vector3>>();
            var circlePath: Vector3[];
            var rad: number;
            var normal: Vector3;
            var rotated: Vector3;
            var rotationMatrix: Matrix;
            for (var i = 0; i < path.length; i++) {
                rad = radiusFunctionFinal(i, distances[i]); // current radius
                circlePath = Array<Vector3>();              // current circle array
                normal = normals[i];                        // current normal  
                for (var ang = 0; ang < pi2; ang += step) {
                    rotationMatrix = Matrix.RotationAxis(tangents[i], ang);
                    rotated = Vector3.TransformCoordinates(normal, rotationMatrix).scaleInPlace(rad).add(path[i]);
                    circlePath.push(rotated);
                }
                circlePaths.push(circlePath);
            }
            var tube = Mesh.CreateRibbon(name, circlePaths, false, true, 0, scene, updatable, sideOrientation);
            return tube;
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

        public static MergeMeshes(meshes: Array<Mesh>, disposeSource = true, allow32BitsIndices?: boolean): Mesh {
            var source = meshes[0];
            var material = source.material;
            var scene = source.getScene();

            if (!allow32BitsIndices) {
                var totalVertices = 0;

                // Counting vertices
                for (var index = 0; index < meshes.length; index++) {
                    totalVertices += meshes[index].getTotalVertices();

                    if (totalVertices > 65536) {
                        Tools.Warn("Cannot merge meshes because resulting mesh will have more than 65536 vertices. Please use allow32BitsIndices = true to use 32 bits indices");
                        return null;
                    }
                }
            }

            // Merge
            var vertexData = VertexData.ExtractFromMesh(source);
            vertexData.transform(source.getWorldMatrix());

            for (index = 1; index < meshes.length; index++) {
                var otherVertexData = VertexData.ExtractFromMesh(meshes[index]);
                otherVertexData.transform(meshes[index].getWorldMatrix());

                vertexData.merge(otherVertexData);
            }

            var newMesh = new Mesh(source.name + "_merged", scene);

            vertexData.applyToMesh(newMesh);

            // Setting properties
            newMesh.material = material;
            newMesh.checkCollisions = source.checkCollisions;

            // Cleaning
            if (disposeSource) {
                for (index = 0; index < meshes.length; index++) {
                    meshes[index].dispose();
                }
            }

            return newMesh;
        }
    }
} 