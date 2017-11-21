module BABYLON {
    export class _InstancesBatch {
        public mustReturn = false;
        public visibleInstances = new Array<Nullable<Array<InstancedMesh>>>();
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
        /**
         * Mesh side orientation : usually the external or front surface
         */
        public static get FRONTSIDE(): number {
            return Mesh._FRONTSIDE;
        }
        /**
         * Mesh side orientation : usually the internal or back surface
         */
        public static get BACKSIDE(): number {
            return Mesh._BACKSIDE;
        }
        /**
         * Mesh side orientation : both internal and external or front and back surfaces
         */
        public static get DOUBLESIDE(): number {
            return Mesh._DOUBLESIDE;
        }
        /**
         * Mesh side orientation : by default, `FRONTSIDE`
         */
        public static get DEFAULTSIDE(): number {
            return Mesh._DEFAULTSIDE;
        }
        /**
         * Mesh cap setting : no cap
         */
        public static get NO_CAP(): number {
            return Mesh._NO_CAP;
        }
        /**
         * Mesh cap setting : one cap at the beginning of the mesh
         */
        public static get CAP_START(): number {
            return Mesh._CAP_START;
        }
        /**
         * Mesh cap setting : one cap at the end of the mesh
         */
        public static get CAP_END(): number {
            return Mesh._CAP_END;
        }
        /**
         * Mesh cap setting : two caps, one at the beginning  and one at the end of the mesh
         */
        public static get CAP_ALL(): number {
            return Mesh._CAP_ALL;
        }

        // Events 

        /**
         * An event triggered before rendering the mesh
         * @type {BABYLON.Observable}
         */
        public onBeforeRenderObservable = new Observable<Mesh>();

        /**
        * An event triggered after rendering the mesh
        * @type {BABYLON.Observable}
        */
        public onAfterRenderObservable = new Observable<Mesh>();

        /**
        * An event triggered before drawing the mesh
        * @type {BABYLON.Observable}
        */
        public onBeforeDrawObservable = new Observable<Mesh>();

        private _onBeforeDrawObserver: Nullable<Observer<Mesh>>;
        public set onBeforeDraw(callback: () => void) {
            if (this._onBeforeDrawObserver) {
                this.onBeforeDrawObservable.remove(this._onBeforeDrawObserver);
            }
            this._onBeforeDrawObserver = this.onBeforeDrawObservable.add(callback);
        }

        // Members
        public delayLoadState = Engine.DELAYLOADSTATE_NONE;
        public instances = new Array<InstancedMesh>();
        public delayLoadingFile: string;
        public _binaryInfo: any;
        private _LODLevels = new Array<Internals.MeshLODLevel>();
        public onLODLevelSelection: (distance: number, mesh: Mesh, selectedLevel: Mesh) => void;

        // Morph
        private _morphTargetManager: Nullable<MorphTargetManager>;

        public get morphTargetManager(): Nullable<MorphTargetManager> {
            return this._morphTargetManager;
        }

        public set morphTargetManager(value: Nullable<MorphTargetManager>) {
            if (this._morphTargetManager === value) {
                return;
            }
            this._morphTargetManager = value;
            this._syncGeometryWithMorphTargetManager();
        }

        // Private
        public _geometry: Nullable<Geometry>;
        public _delayInfo: Array<string>;
        public _delayLoadingFunction: (any: any, mesh: Mesh) => void;

        public _visibleInstances: any = {};
        private _renderIdForInstances = new Array<number>();
        private _batchCache = new _InstancesBatch();
        private _instancesBufferSize = 32 * 16 * 4; // let's start with a maximum of 32 instances
        private _instancesBuffer: Nullable<Buffer>;
        private _instancesData: Float32Array;
        private _overridenInstanceCount: number;

        private _effectiveMaterial: Material;

        public _shouldGenerateFlatShading: boolean;
        private _preActivateId: number;

        // Use by builder only to know what orientation were the mesh build in.
        public _originalBuilderSideOrientation: number = Mesh._DEFAULTSIDE;

        public overrideMaterialSideOrientation: Nullable<number> = null;

        private _areNormalsFrozen: boolean = false; // Will be used by ribbons mainly

        private _sourcePositions: Float32Array; // Will be used to save original positions when using software skinning
        private _sourceNormals: Float32Array;   // Will be used to save original normals when using software skinning

        // Will be used to save a source mesh reference, If any
        private _source: Nullable<Mesh> = null;
        public get source(): Nullable<Mesh> {
            return this._source;
        }

        /**
         * @constructor
         * @param {string} name The value used by scene.getMeshByName() to do a lookup.
         * @param {Scene} scene The scene to add this mesh to.
         * @param {Node} parent The parent of this mesh, if it has one
         * @param {Mesh} source An optional Mesh from which geometry is shared, cloned.
         * @param {boolean} doNotCloneChildren When cloning, skip cloning child meshes of source, default False.
         *                  When false, achieved by calling a clone(), also passing False.
         *                  This will make creation of children, recursive.
         * @param {boolean} clonePhysicsImpostor When cloning, include cloning mesh physics impostor, default True.
         */
        constructor(name: string, scene: Nullable<Scene> = null, parent: Nullable<Node> = null, source: Nullable<Mesh> = null, doNotCloneChildren?: boolean, clonePhysicsImpostor: boolean = true) {
            super(name, scene);

            scene = this.getScene();

            if (source) {
                // Source mesh
                this._source = source;

                // Geometry
                if (source._geometry) {
                    source._geometry.applyToMesh(this);
                }

                // Deep copy
                Tools.DeepCopy(source, this, ["name", "material", "skeleton", "instances", "parent", "uniqueId", "source"], ["_poseMatrix", "_source"]);

                // Tags
                if (Tags.HasTags(source)) {
                    Tags.AddTagsTo(this, Tags.GetTags(source, true));
                }

                this.metadata = source.metadata;

                // Parent
                this.parent = source.parent;

                // Pivot
                this.setPivotMatrix(source.getPivotMatrix());

                this.id = name + "." + source.id;

                // Material
                this.material = source.material;
                var index: number;
                if (!doNotCloneChildren) {
                    // Children
                    let directDescendants = source.getDescendants(true);
                    for (let index = 0; index < directDescendants.length; index++) {
                        var child = directDescendants[index];

                        if ((<any>child).clone) {
                            (<any>child).clone(name + "." + child.name, this);
                        }
                    }
                }

                // Physics clone  
                var physicsEngine = this.getScene().getPhysicsEngine();
                if (clonePhysicsImpostor && physicsEngine) {
                    var impostor = physicsEngine.getImpostorForPhysicsObject(source);
                    if (impostor) {
                        this.physicsImpostor = impostor.clone(this);
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
        /**
         * Returns the string "Mesh".  
         */
        public getClassName(): string {
            return "Mesh";
        }

        /**
         * Returns a string.  
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails?: boolean): string {
            var ret = super.toString(fullDetails);
            ret += ", n vertices: " + this.getTotalVertices();
            ret += ", parent: " + (this._waitingParentId ? this._waitingParentId : (this.parent ? this.parent.name : "NONE"));

            if (this.animations) {
                for (var i = 0; i < this.animations.length; i++) {
                    ret += ", animation[0]: " + this.animations[i].toString(fullDetails);
                }
            }

            if (fullDetails) {

                if (this._geometry) {
                    let ib = this.getIndices();
                    let vb = this.getVerticesData(VertexBuffer.PositionKind);

                    if (vb && ib) {
                        ret += ", flat shading: " + (vb.length / 3 === ib.length ? "YES" : "NO");
                    }
                } else {
                    ret += ", flat shading: UNKNOWN";
                }
            }
            return ret;
        }

        /**
         * True if the mesh has some Levels Of Details (LOD).  
         * Returns a boolean. 
         */
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
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * @param {number} distance The distance from the center of the object to show this level
         * @param {Mesh} mesh The mesh to be added as LOD level
         * @return {Mesh} This mesh (for chaining)
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
        /**
         * Returns the LOD level mesh at the passed distance or null if not found.  
         * It is related to the method `addLODLevel(distance, mesh)`. 
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD   
         * Returns an object Mesh or `null`.  
         */
        public getLODLevelAtDistance(distance: number): Nullable<Mesh> {
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
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         * @param {Mesh} mesh The mesh to be removed.
         * @return {Mesh} This mesh (for chaining)
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

        /**
         * Returns the registered LOD mesh distant from the parameter `camera` position if any, else returns the current mesh.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_LOD
         */
        public getLOD(camera: Camera, boundingSphere?: BoundingSphere): AbstractMesh {
            if (!this._LODLevels || this._LODLevels.length === 0) {
                return this;
            }

            let bSphere: BoundingSphere;

            if (boundingSphere) {
                bSphere = boundingSphere;
            } else {
                let boundingInfo = this.getBoundingInfo();

                bSphere = boundingInfo.boundingSphere;
            }

            var distanceToCamera = bSphere.centerWorld.subtract(camera.globalPosition).length();

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
        /**
         * Returns the mesh internal Geometry object.  
         */
        public get geometry(): Nullable<Geometry> {
            return this._geometry;
        }

        /**
         * Returns a positive integer : the total number of vertices within the mesh geometry or zero if the mesh has no geometry.
         */
        public getTotalVertices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalVertices();
        }

        /**
         * Returns an array of integers or floats, or a Float32Array, depending on the requested `kind` (positions, indices, normals, etc).  
         * If `copywhenShared` is true (default false) and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * You can force the copy with forceCopy === true
         * Returns null if the mesh has no geometry or no vertex buffer.    
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind 
         */
        public getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray> {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVerticesData(kind, copyWhenShared, forceCopy);
        }

        /**
         * Returns the mesh VertexBuffer object from the requested `kind` : positions, indices, normals, etc.
         * Returns `null` if the mesh has no geometry.   
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind 
         */
        public getVertexBuffer(kind: string): Nullable<VertexBuffer> {
            if (!this._geometry) {
                return null;
            }
            return this._geometry.getVertexBuffer(kind);
        }

        /**
         * Returns a boolean depending on the existence of the Vertex Data for the requested `kind`.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        public isVerticesDataPresent(kind: string): boolean {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVerticesDataPresent(kind);
        }


        /**
         * Returns a boolean defining if the vertex data for the requested `kind` is updatable.
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        public isVertexBufferUpdatable(kind: string): boolean {
            if (!this._geometry) {
                if (this._delayInfo) {
                    return this._delayInfo.indexOf(kind) !== -1;
                }
                return false;
            }
            return this._geometry.isVertexBufferUpdatable(kind);
        }
        /**
         * Returns a string : the list of existing `kinds` of Vertex Data for this mesh.  
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         */
        public getVerticesDataKinds(): string[] {
            if (!this._geometry) {
                var result = new Array<string>();
                if (this._delayInfo) {
                    this._delayInfo.forEach(function (kind, index, array) {
                        result.push(kind);
                    });
                }
                return result;
            }
            return this._geometry.getVerticesDataKinds();
        }

        /**
         * Returns a positive integer : the total number of indices in this mesh geometry.
         * Returns zero if the mesh has no geometry.  
         */
        public getTotalIndices(): number {
            if (!this._geometry) {
                return 0;
            }
            return this._geometry.getTotalIndices();
        }

        /**
         * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.  
         * If the parameter `copyWhenShared` is true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
         * Returns an empty array if the mesh has no geometry.
         */
        public getIndices(copyWhenShared?: boolean): Nullable<IndicesArray> {

            if (!this._geometry) {
                return [];
            }
            return this._geometry.getIndices(copyWhenShared);
        }

        public get isBlocked(): boolean {
            return this._masterMesh !== null && this._masterMesh !== undefined;
        }

        /**
         * Boolean : true once the mesh is ready after all the delayed process (loading, etc) are complete.
         */
        public isReady(): boolean {
            if (this.delayLoadState === Engine.DELAYLOADSTATE_LOADING) {
                return false;
            }

            return super.isReady();
        }

        /**
         * Boolean : true if the normals aren't to be recomputed on next mesh `positions` array update.
         * This property is pertinent only for updatable parametric shapes.
         */
        public get areNormalsFrozen(): boolean {
            return this._areNormalsFrozen;
        }

        /**  
         * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc. 
         * It has no effect at all on other shapes.
         * It prevents the mesh normals from being recomputed on next `positions` array update.  
         * Returns the Mesh.  
         */
        public freezeNormals(): Mesh {
            this._areNormalsFrozen = true;
            return this;
        }

        /**  
         * This function affects parametric shapes on vertex position update only : ribbons, tubes, etc. 
         * It has no effect at all on other shapes.
         * It reactivates the mesh normals computation if it was previously frozen.  
         * Returns the Mesh.  
         */
        public unfreezeNormals(): Mesh {
            this._areNormalsFrozen = false;
            return this;
        }

        /**
         * Overrides instance count. Only applicable when custom instanced InterleavedVertexBuffer are used rather than InstancedMeshs
         */
        public set overridenInstanceCount(count: number) {
            this._overridenInstanceCount = count;
        }

        // Methods
        public _preActivate(): Mesh {
            var sceneRenderId = this.getScene().getRenderId();
            if (this._preActivateId === sceneRenderId) {
                return this;
            }

            this._preActivateId = sceneRenderId;
            this._visibleInstances = null;
            return this;
        }

        public _preActivateForIntermediateRendering(renderId: number): Mesh {
            if (this._visibleInstances) {
                this._visibleInstances.intermediateDefaultRenderId = renderId;
            }
            return this;
        }

        public _registerInstanceForRenderId(instance: InstancedMesh, renderId: number): Mesh {
            if (!this._visibleInstances) {
                this._visibleInstances = {};
                this._visibleInstances.defaultRenderId = renderId;
                this._visibleInstances.selfDefaultRenderId = this._renderId;
            }

            if (!this._visibleInstances[renderId]) {
                this._visibleInstances[renderId] = new Array<InstancedMesh>();
            }

            this._visibleInstances[renderId].push(instance);
            return this;
        }

        /**
         * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
         * This means the mesh underlying bounding box and sphere are recomputed.   
         * Returns the Mesh.  
         */
        public refreshBoundingInfo(): Mesh {
            if (this._boundingInfo && this._boundingInfo.isLocked) {
                return this;
            }
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
            return this;
        }

        public _createGlobalSubMesh(force: boolean): Nullable<SubMesh> {
            var totalVertices = this.getTotalVertices();
            if (!totalVertices || !this.getIndices()) {
                return null;
            }

            // Check if we need to recreate the submeshes
            if (this.subMeshes && this.subMeshes.length > 0) {
                let ib = this.getIndices();

                if (!ib) {
                    return null;
                }

                var totalIndices = ib.length;
                let needToRecreate = false;

                if (force) {
                    needToRecreate = true;
                } else {
                    for (var submesh of this.subMeshes) {
                        if (submesh.indexStart + submesh.indexCount >= totalIndices) {
                            needToRecreate = true;
                            break;
                        }

                        if (submesh.verticesStart + submesh.verticesCount >= totalVertices) {
                            needToRecreate = true;
                            break;
                        }
                    }
                }

                if (!needToRecreate) {
                    return this.subMeshes[0];
                }
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

        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.  
         * The `data` are either a numeric array either a Float32Array. 
         * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initianilly none) or updater. 
         * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).  
         * Note that a new underlying VertexBuffer object is created each call. 
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed. 
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind  
         * 
         * Returns the Mesh.  
         */
        public setVerticesData(kind: string, data: FloatArray, updatable: boolean = false, stride?: number): Mesh {
            if (!this._geometry) {
                var vertexData = new VertexData();
                vertexData.set(data, kind);

                var scene = this.getScene();

                new Geometry(Geometry.RandomId(), scene, vertexData, updatable, this);
            }
            else {
                this._geometry.setVerticesData(kind, data, updatable, stride);
            }
            return this;
        }

        public markVerticesDataAsUpdatable(kind: string, updatable = true) {
            let vb = this.getVertexBuffer(kind);

            if (!vb || vb.isUpdatable() === updatable) {
                return;
            }

            this.setVerticesData(kind, (<FloatArray>this.getVerticesData(kind)), updatable);
        }

        /**
         * Sets the mesh VertexBuffer.  
         * Returns the Mesh.  
         */
        public setVerticesBuffer(buffer: VertexBuffer): Mesh {
            if (!this._geometry) {
                this._geometry = Geometry.CreateGeometryForMesh(this);
            }

            this._geometry.setVerticesBuffer(buffer);
            return this;
        }

        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.  
         * The `data` are either a numeric array either a Float32Array. 
         * No new underlying VertexBuffer object is created. 
         * If the `kind` is the `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.  
         * If the parameter `makeItUnique` is true, a new global geometry is created from this positions and is set to the mesh.
         *
         * Possible `kind` values :
         * - BABYLON.VertexBuffer.PositionKind
         * - BABYLON.VertexBuffer.UVKind
         * - BABYLON.VertexBuffer.UV2Kind
         * - BABYLON.VertexBuffer.UV3Kind
         * - BABYLON.VertexBuffer.UV4Kind
         * - BABYLON.VertexBuffer.UV5Kind
         * - BABYLON.VertexBuffer.UV6Kind
         * - BABYLON.VertexBuffer.ColorKind
         * - BABYLON.VertexBuffer.MatricesIndicesKind
         * - BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * - BABYLON.VertexBuffer.MatricesWeightsKind
         * - BABYLON.VertexBuffer.MatricesWeightsExtraKind
         * 
         * Returns the Mesh.  
         */
        public updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh {
            if (!this._geometry) {
                return this;
            }
            if (!makeItUnique) {
                this._geometry.updateVerticesData(kind, data, updateExtends);
            }
            else {
                this.makeGeometryUnique();
                this.updateVerticesData(kind, data, updateExtends, false);
            }
            return this;
        }

        /**
         * This method updates the vertex positions of an updatable mesh according to the `positionFunction` returned values.
         * tuto : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#other-shapes-updatemeshpositions  
         * The parameter `positionFunction` is a simple JS function what is passed the mesh `positions` array. It doesn't need to return anything.
         * The parameter `computeNormals` is a boolean (default true) to enable/disable the mesh normal recomputation after the vertex position update.     
         * Returns the Mesh.  
         */
        public updateMeshPositions(positionFunction: (data: FloatArray) => void, computeNormals: boolean = true): Mesh {
            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            if (!positions) {
                return this;
            }

            positionFunction(positions);
            this.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);

            if (computeNormals) {
                var indices = this.getIndices();
                var normals = this.getVerticesData(VertexBuffer.NormalKind);

                if (!normals) {
                    return this;
                }

                VertexData.ComputeNormals(positions, indices, normals);
                this.updateVerticesData(VertexBuffer.NormalKind, normals, false, false);
            }
            return this;
        }

        /**
         * Creates a un-shared specific occurence of the geometry for the mesh.  
         * Returns the Mesh.  
         */
        public makeGeometryUnique(): Mesh {
            if (!this._geometry) {
                return this;
            }
            var oldGeometry = this._geometry;
            var geometry = this._geometry.copy(Geometry.RandomId());
            oldGeometry.releaseForMesh(this, true);
            geometry.applyToMesh(this);
            return this;
        }

        /**
         * Sets the mesh indices.  
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * Type is Uint16Array by default unless the mesh has more than 65536 vertices.
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh. 
         * This method creates a new index buffer each call.  
         * Returns the Mesh.  
         */
        public setIndices(indices: IndicesArray, totalVertices: Nullable<number> = null, updatable: boolean = false): Mesh {
            if (!this._geometry) {
                var vertexData = new VertexData();
                vertexData.indices = indices;

                var scene = this.getScene();

                new Geometry(Geometry.RandomId(), scene, vertexData, updatable, this);
            }
            else {
                this._geometry.setIndices(indices, totalVertices, updatable);
            }
            return this;
        }

        /**
         * Update the current index buffer
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array)
         * Returns the Mesh. 
         */
        public updateIndices(indices: IndicesArray, offset?: number): Mesh {
            if (!this._geometry) {
                return this;
            }

            this._geometry.updateIndices(indices, offset);
            return this;
        }


        /**
         * Invert the geometry to move from a right handed system to a left handed one.  
         * Returns the Mesh.  
         */
        public toLeftHanded(): Mesh {
            if (!this._geometry) {
                return this;
            }
            this._geometry.toLeftHanded();
            return this;
        }

        public _bind(subMesh: SubMesh, effect: Effect, fillMode: number): Mesh {
            if (!this._geometry) {
                return this;
            }

            var engine = this.getScene().getEngine();

            // Wireframe
            var indexToBind;

            if (this._unIndexed) {
                indexToBind = null;
            } else {
                switch (fillMode) {
                    case Material.PointFillMode:
                        indexToBind = null;
                        break;
                    case Material.WireFrameFillMode:
                        indexToBind = subMesh.getLinesIndexBuffer(<IndicesArray>this.getIndices(), engine);
                        break;
                    default:
                    case Material.TriangleFillMode:
                        indexToBind = this._unIndexed ? null : this._geometry.getIndexBuffer();
                        break;
                }
            }

            // VBOs
            this._geometry._bind(effect, indexToBind);
            return this;
        }

        public _draw(subMesh: SubMesh, fillMode: number, instancesCount?: number, alternate = false): Mesh {
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return this;
            }

            this.onBeforeDrawObservable.notifyObservers(this);

            let scene = this.getScene();
            let engine = scene.getEngine();

            // Draw order
            switch (fillMode) {
                case Material.PointFillMode:
                    engine.drawPointClouds(subMesh.verticesStart, subMesh.verticesCount, instancesCount);
                    break;
                case Material.WireFrameFillMode:
                    if (this._unIndexed) {
                        engine.drawUnIndexed(false, subMesh.verticesStart, subMesh.verticesCount, instancesCount);
                    } else {
                        engine.draw(false, 0, subMesh.linesIndexCount, instancesCount);
                    }
                    break;

                default:
                    if (this._unIndexed) {
                        engine.drawUnIndexed(true, subMesh.verticesStart, subMesh.verticesCount, instancesCount);
                    } else {
                        engine.draw(true, subMesh.indexStart, subMesh.indexCount, instancesCount);
                    }
            }

            if (scene._isAlternateRenderingEnabled && !alternate) {
                let effect = subMesh.effect || this._effectiveMaterial.getEffect();
                if (!effect || !scene.activeCamera) {
                    return this;
                }
                scene._switchToAlternateCameraConfiguration(true);
                this._effectiveMaterial.bindView(effect);
                this._effectiveMaterial.bindViewProjection(effect);

                engine.setViewport(scene.activeCamera._alternateCamera.viewport);
                this._draw(subMesh, fillMode, instancesCount, true);
                engine.setViewport(scene.activeCamera.viewport);

                scene._switchToAlternateCameraConfiguration(false);
                this._effectiveMaterial.bindView(effect);
                this._effectiveMaterial.bindViewProjection(effect);
            }
            return this;
        }

        /**
         * Registers for this mesh a javascript function called just before the rendering process.
         * This function is passed the current mesh.  
         * Return the Mesh.  
         */
        public registerBeforeRender(func: (mesh: AbstractMesh) => void): Mesh {
            this.onBeforeRenderObservable.add(func);
            return this;
        }

        /**
         * Disposes a previously registered javascript function called before the rendering.
         * This function is passed the current mesh.  
         * Returns the Mesh.  
         */
        public unregisterBeforeRender(func: (mesh: AbstractMesh) => void): Mesh {
            this.onBeforeRenderObservable.removeCallback(func);
            return this;
        }

        /**
         * Registers for this mesh a javascript function called just after the rendering is complete.
         * This function is passed the current mesh.  
         * Returns the Mesh.  
         */
        public registerAfterRender(func: (mesh: AbstractMesh) => void): Mesh {
            this.onAfterRenderObservable.add(func);
            return this;
        }

        /**
         * Disposes a previously registered javascript function called after the rendering.
         * This function is passed the current mesh.  
         * Return the Mesh.  
         */
        public unregisterAfterRender(func: (mesh: AbstractMesh) => void): Mesh {
            this.onAfterRenderObservable.removeCallback(func);
            return this;
        }

        public _getInstancesRenderList(subMeshId: number): _InstancesBatch {
            var scene = this.getScene();
            this._batchCache.mustReturn = false;
            this._batchCache.renderSelf[subMeshId] = this.isEnabled() && this.isVisible;
            this._batchCache.visibleInstances[subMeshId] = null;

            if (this._visibleInstances) {
                var currentRenderId = scene.getRenderId();
                var defaultRenderId = (scene._isInIntermediateRendering() ? this._visibleInstances.intermediateDefaultRenderId : this._visibleInstances.defaultRenderId);
                this._batchCache.visibleInstances[subMeshId] = this._visibleInstances[currentRenderId];
                var selfRenderId = this._renderId;

                if (!this._batchCache.visibleInstances[subMeshId] && defaultRenderId) {
                    this._batchCache.visibleInstances[subMeshId] = this._visibleInstances[defaultRenderId];
                    currentRenderId = Math.max(defaultRenderId, currentRenderId);
                    selfRenderId = Math.max(this._visibleInstances.selfDefaultRenderId, currentRenderId);
                }

                let visibleInstancesForSubMesh = this._batchCache.visibleInstances[subMeshId];
                if (visibleInstancesForSubMesh && visibleInstancesForSubMesh.length) {
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

        public _renderWithInstances(subMesh: SubMesh, fillMode: number, batch: _InstancesBatch, effect: Effect, engine: Engine): Mesh {
            var visibleInstances = batch.visibleInstances[subMesh._id];
            if (!visibleInstances) {
                return this;
            }

            var matricesCount = visibleInstances.length + 1;
            var bufferSize = matricesCount * 16 * 4;

            var currentInstancesBufferSize = this._instancesBufferSize;
            var instancesBuffer = this._instancesBuffer;

            while (this._instancesBufferSize < bufferSize) {
                this._instancesBufferSize *= 2;
            }

            if (!this._instancesData || currentInstancesBufferSize != this._instancesBufferSize) {
                this._instancesData = new Float32Array(this._instancesBufferSize / 4);
            }

            var offset = 0;
            var instancesCount = 0;

            var world = this.getWorldMatrix();
            if (batch.renderSelf[subMesh._id]) {
                world.copyToArray(this._instancesData, offset);
                offset += 16;
                instancesCount++;
            }

            if (visibleInstances) {
                for (var instanceIndex = 0; instanceIndex < visibleInstances.length; instanceIndex++) {
                    var instance = visibleInstances[instanceIndex];
                    instance.getWorldMatrix().copyToArray(this._instancesData, offset);
                    offset += 16;
                    instancesCount++;
                }
            }

            if (!instancesBuffer || currentInstancesBufferSize != this._instancesBufferSize) {
                if (instancesBuffer) {
                    instancesBuffer.dispose();
                }

                instancesBuffer = new Buffer(engine, this._instancesData, true, 16, false, true);
                this._instancesBuffer = instancesBuffer;

                this.setVerticesBuffer(instancesBuffer.createVertexBuffer("world0", 0, 4));
                this.setVerticesBuffer(instancesBuffer.createVertexBuffer("world1", 4, 4));
                this.setVerticesBuffer(instancesBuffer.createVertexBuffer("world2", 8, 4));
                this.setVerticesBuffer(instancesBuffer.createVertexBuffer("world3", 12, 4));
            } else {
                instancesBuffer.updateDirectly(this._instancesData, 0, instancesCount);
            }

            this._bind(subMesh, effect, fillMode);
            this._draw(subMesh, fillMode, instancesCount);

            engine.unbindInstanceAttributes();
            return this;
        }

        public _processRendering(subMesh: SubMesh, effect: Effect, fillMode: number, batch: _InstancesBatch, hardwareInstancedRendering: boolean,
            onBeforeDraw: (isInstance: boolean, world: Matrix, effectiveMaterial?: Material) => void, effectiveMaterial?: Material): Mesh {
            var scene = this.getScene();
            var engine = scene.getEngine();

            if (hardwareInstancedRendering) {
                this._renderWithInstances(subMesh, fillMode, batch, effect, engine);
            } else {
                if (batch.renderSelf[subMesh._id]) {
                    // Draw
                    if (onBeforeDraw) {
                        onBeforeDraw(false, this.getWorldMatrix(), effectiveMaterial);
                    }

                    this._draw(subMesh, fillMode, this._overridenInstanceCount);
                }

                let visibleInstancesForSubMesh = batch.visibleInstances[subMesh._id];

                if (visibleInstancesForSubMesh) {
                    for (var instanceIndex = 0; instanceIndex < visibleInstancesForSubMesh.length; instanceIndex++) {
                        var instance = visibleInstancesForSubMesh[instanceIndex];

                        // World
                        var world = instance.getWorldMatrix();
                        if (onBeforeDraw) {
                            onBeforeDraw(true, world, effectiveMaterial);
                        }

                        // Draw
                        this._draw(subMesh, fillMode);
                    }
                }
            }
            return this;
        }

        /**
         * Triggers the draw call for the mesh.
         * Usually, you don't need to call this method by your own because the mesh rendering is handled by the scene rendering manager.   
         * Returns the Mesh.   
         */
        public render(subMesh: SubMesh, enableAlphaMode: boolean): Mesh {

            this.checkOcclusionQuery();
            if (this._isOccluded) {
                return this;
            }

            var scene = this.getScene();

            // Managing instances
            var batch = this._getInstancesRenderList(subMesh._id);

            if (batch.mustReturn) {
                return this;
            }

            // Checking geometry state
            if (!this._geometry || !this._geometry.getVertexBuffers() || !this._geometry.getIndexBuffer()) {
                return this;
            }

            this.onBeforeRenderObservable.notifyObservers(this);

            var engine = scene.getEngine();
            var hardwareInstancedRendering = (engine.getCaps().instancedArrays) && (batch.visibleInstances[subMesh._id] !== null) && (batch.visibleInstances[subMesh._id] !== undefined);

            // Material
            let material = subMesh.getMaterial();

            if (!material) {
                return this;
            }

            this._effectiveMaterial = material

            if (this._effectiveMaterial.storeEffectOnSubMeshes) {
                if (!this._effectiveMaterial.isReadyForSubMesh(this, subMesh, hardwareInstancedRendering)) {
                    return this;
                }
            } else if (!this._effectiveMaterial.isReady(this, hardwareInstancedRendering)) {
                return this;
            }

            // Alpha mode
            if (enableAlphaMode) {
                engine.setAlphaMode(this._effectiveMaterial.alphaMode);
            }

            // Outline - step 1
            var savedDepthWrite = engine.getDepthWrite();
            if (this.renderOutline) {
                engine.setDepthWrite(false);
                scene.getOutlineRenderer().render(subMesh, batch);
                engine.setDepthWrite(savedDepthWrite);
            }

            var effect: Nullable<Effect>;
            if (this._effectiveMaterial.storeEffectOnSubMeshes) {
                effect = subMesh.effect;
            } else {
                effect = this._effectiveMaterial.getEffect();
            }

            if (!effect) {
                return this;
            }

            var reverse = this._effectiveMaterial._preBind(effect, this.overrideMaterialSideOrientation);

            if (this._effectiveMaterial.forceDepthWrite) {
                engine.setDepthWrite(true);
            }

            // Bind
            var fillMode = scene.forcePointsCloud ? Material.PointFillMode : (scene.forceWireframe ? Material.WireFrameFillMode : this._effectiveMaterial.fillMode);

            if (!hardwareInstancedRendering) { // Binding will be done later because we need to add more info to the VB
                this._bind(subMesh, effect, fillMode);
            }

            var world = this.getWorldMatrix();

            if (this._effectiveMaterial.storeEffectOnSubMeshes) {
                this._effectiveMaterial.bindForSubMesh(world, this, subMesh);
            } else {
                this._effectiveMaterial.bind(world, this);
            }

            if (!this._effectiveMaterial.backFaceCulling && this._effectiveMaterial.separateCullingPass) {
                engine.setState(true, this._effectiveMaterial.zOffset, false, !reverse);
                this._processRendering(subMesh, effect, fillMode, batch, hardwareInstancedRendering, this._onBeforeDraw, this._effectiveMaterial);
                engine.setState(true, this._effectiveMaterial.zOffset, false, reverse);
            }

            // Draw
            this._processRendering(subMesh, effect, fillMode, batch, hardwareInstancedRendering, this._onBeforeDraw, this._effectiveMaterial);

            // Unbind
            this._effectiveMaterial.unbind();

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

            this.onAfterRenderObservable.notifyObservers(this);
            return this;
        }

        private _onBeforeDraw(isInstance: boolean, world: Matrix, effectiveMaterial?: Material): void {
            if (isInstance && effectiveMaterial) {
                effectiveMaterial.bindOnlyWorldMatrix(world);
            }
        }

        /**
         * Returns an array populated with ParticleSystem objects whose the mesh is the emitter. 
         */
        public getEmittedParticleSystems(): IParticleSystem[] {
            var results = new Array<IParticleSystem>();
            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                if (particleSystem.emitter === this) {
                    results.push(particleSystem);
                }
            }
            return results;
        }

        /**
         * Returns an array populated with ParticleSystem objects whose the mesh or its children are the emitter.
         */
        public getHierarchyEmittedParticleSystems(): IParticleSystem[] {
            var results = new Array<IParticleSystem>();
            var descendants = this.getDescendants();
            descendants.push(this);

            for (var index = 0; index < this.getScene().particleSystems.length; index++) {
                var particleSystem = this.getScene().particleSystems[index];
                let emitter: any = particleSystem.emitter;

                if (emitter.position && descendants.indexOf(emitter) !== -1) {
                    results.push(particleSystem);
                }
            }

            return results;
        }

        public _checkDelayState(): Mesh {
            var scene = this.getScene();
            if (this._geometry) {
                this._geometry.load(scene);
            }
            else if (this.delayLoadState === Engine.DELAYLOADSTATE_NOTLOADED) {
                this.delayLoadState = Engine.DELAYLOADSTATE_LOADING;

                this._queueLoad(this, scene);
            }
            return this;
        }

        private _queueLoad(mesh: Mesh, scene: Scene): Mesh {
            scene._addPendingData(mesh);

            var getBinaryData = (this.delayLoadingFile.indexOf(".babylonbinarymeshdata") !== -1);

            Tools.LoadFile(this.delayLoadingFile, data => {

                if (data instanceof ArrayBuffer) {
                    this._delayLoadingFunction(data, this);
                }
                else {
                    this._delayLoadingFunction(JSON.parse(data), this);
                }

                this.instances.forEach(instance => {
                    instance._syncSubMeshes();
                });


                this.delayLoadState = Engine.DELAYLOADSTATE_LOADED;
                scene._removePendingData(this);

            }, () => { }, scene.database, getBinaryData);
            return this;
        }

        /**
         * Boolean, true is the mesh in the frustum defined by the Plane objects from the `frustumPlanes` array parameter.
         */
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

        /**
         * Sets the mesh material by the material or multiMaterial `id` property.  
         * The material `id` is a string identifying the material or the multiMaterial.  
         * This method returns the Mesh. 
         */
        public setMaterialByID(id: string): Mesh {
            var materials = this.getScene().materials;
            var index: number;
            for (index = materials.length - 1; index > -1; index--) {
                if (materials[index].id === id) {
                    this.material = materials[index];
                    return this;
                }
            }

            // Multi
            var multiMaterials = this.getScene().multiMaterials;
            for (index = multiMaterials.length - 1; index > -1; index--) {
                if (multiMaterials[index].id === id) {
                    this.material = multiMaterials[index];
                    return this;
                }
            }
            return this;
        }

        /**
         * Returns as a new array populated with the mesh material and/or skeleton, if any.
         */
        public getAnimatables(): IAnimatable[] {
            var results = new Array<IAnimatable>();

            if (this.material) {
                results.push(this.material);
            }

            if (this.skeleton) {
                results.push(this.skeleton);
            }

            return results;
        }

        /**
         * Modifies the mesh geometry according to the passed transformation matrix.  
         * This method returns nothing but it really modifies the mesh even if it's originally not set as updatable. 
         * The mesh normals are modified accordingly the same transformation.  
         * tuto : http://doc.babylonjs.com/tutorials/How_Rotations_and_Translations_Work#baking-transform  
         * Note that, under the hood, this method sets a new VertexBuffer each call.  
         * Returns the Mesh.  
         */
        public bakeTransformIntoVertices(transform: Matrix): Mesh {
            // Position
            if (!this.isVerticesDataPresent(VertexBuffer.PositionKind)) {
                return this;
            }

            var submeshes = this.subMeshes.splice(0);

            this._resetPointsArrayCache();

            var data = <FloatArray>this.getVerticesData(VertexBuffer.PositionKind);

            var temp = new Array<number>();
            var index: number;
            for (index = 0; index < data.length; index += 3) {
                Vector3.TransformCoordinates(Vector3.FromArray(data, index), transform).toArray(temp, index);
            }

            this.setVerticesData(VertexBuffer.PositionKind, temp, (<VertexBuffer>this.getVertexBuffer(VertexBuffer.PositionKind)).isUpdatable());

            // Normals
            if (!this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                return this;
            }
            data = <FloatArray>this.getVerticesData(VertexBuffer.NormalKind);
            temp = [];
            for (index = 0; index < data.length; index += 3) {
                Vector3.TransformNormal(Vector3.FromArray(data, index), transform).normalize().toArray(temp, index);
            }
            this.setVerticesData(VertexBuffer.NormalKind, temp, (<VertexBuffer>this.getVertexBuffer(VertexBuffer.NormalKind)).isUpdatable());

            // flip faces?
            if (transform.m[0] * transform.m[5] * transform.m[10] < 0) { this.flipFaces(); }

            // Restore submeshes
            this.releaseSubMeshes();
            this.subMeshes = submeshes;
            return this;
        }

        /**
         * Modifies the mesh geometry according to its own current World Matrix.  
         * The mesh World Matrix is then reset.
         * This method returns nothing but really modifies the mesh even if it's originally not set as updatable.
         * tuto : tuto : http://doc.babylonjs.com/tutorials/How_Rotations_and_Translations_Work#baking-transform 
         * Note that, under the hood, this method sets a new VertexBuffer each call.   
         * Returns the Mesh.  
         */
        public bakeCurrentTransformIntoVertices(): Mesh {
            this.bakeTransformIntoVertices(this.computeWorldMatrix(true));
            this.scaling.copyFromFloats(1, 1, 1);
            this.position.copyFromFloats(0, 0, 0);
            this.rotation.copyFromFloats(0, 0, 0);
            //only if quaternion is already set
            if (this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.Identity();
            }
            this._worldMatrix = Matrix.Identity();
            return this;
        }

        // Cache
        public get _positions(): Nullable<Vector3[]> {
            if (this._geometry) {
                return this._geometry._positions;
            }
            return null;
        }

        public _resetPointsArrayCache(): Mesh {
            if (this._geometry) {
                this._geometry._resetPointsArrayCache();
            }
            return this;
        }

        public _generatePointsArray(): boolean {
            if (this._geometry) {
                return this._geometry._generatePointsArray();
            }
            return false;
        }

        /**
         * Returns a new Mesh object generated from the current mesh properties.
         * This method must not get confused with createInstance().  
         * The parameter `name` is a string, the name given to the new mesh. 
         * The optional parameter `newParent` can be any Node object (default `null`).  
         * The optional parameter `doNotCloneChildren` (default `false`) allows/denies the recursive cloning of the original mesh children if any.
         * The parameter `clonePhysicsImpostor` (default `true`)  allows/denies the cloning in the same time of the original mesh `body` used by the physics engine, if any. 
         */
        public clone(name: string, newParent?: Node, doNotCloneChildren?: boolean, clonePhysicsImpostor: boolean = true): Mesh {
            return new Mesh(name, this.getScene(), newParent, this, doNotCloneChildren, clonePhysicsImpostor);
        }

        /**
         * Disposes the Mesh.  
         * By default, all the mesh children are also disposed unless the parameter `doNotRecurse` is set to `true`.  
         * Returns nothing.  
         */
        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures: boolean = false): void {
            this.morphTargetManager = null;

            if (this._geometry) {
                this._geometry.releaseForMesh(this, true);
            }

            // Sources
            var meshes = this.getScene().meshes;
            meshes.forEach((abstractMesh: AbstractMesh) => {
                let mesh = abstractMesh as Mesh;
                if (mesh._source && mesh._source === this) {
                    mesh._source = null;
                }
            });
            this._source = null;

            // Instances
            if (this._instancesBuffer) {
                this._instancesBuffer.dispose();
                this._instancesBuffer = null;
            }

            while (this.instances.length) {
                this.instances[0].dispose();
            }

            // Highlight layers.
            let highlightLayers = this.getScene().highlightLayers;
            for (let i = 0; i < highlightLayers.length; i++) {
                let highlightLayer = highlightLayers[i];
                if (highlightLayer) {
                    highlightLayer.removeMesh(this);
                    highlightLayer.removeExcludedMesh(this);
                }
            }
            super.dispose(doNotRecurse, disposeMaterialAndTextures);
        }

        /**
         * Modifies the mesh geometry according to a displacement map.
         * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.  
         * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
         * This method returns nothing.   
         * The parameter `url` is a string, the URL from the image file is to be downloaded.  
         * The parameters `minHeight` and `maxHeight` are the lower and upper limits of the displacement.
         * The parameter `onSuccess` is an optional Javascript function to be called just after the mesh is modified. It is passed the modified mesh and must return nothing.
         * The parameter `uvOffset` is an optional vector2 used to offset UV.
         * The parameter `uvScale` is an optional vector2 used to scale UV.  
         * 
         * Returns the Mesh.  
         */
        public applyDisplacementMap(url: string, minHeight: number, maxHeight: number, onSuccess?: (mesh: Mesh) => void, uvOffset?: Vector2, uvScale?: Vector2): Mesh {
            var scene = this.getScene();

            var onload = (img: HTMLImageElement) => {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = <CanvasRenderingContext2D>canvas.getContext("2d");
                var heightMapWidth = img.width;
                var heightMapHeight = img.height;
                canvas.width = heightMapWidth;
                canvas.height = heightMapHeight;

                context.drawImage(img, 0, 0);

                // Create VertexData from map data
                //Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = <Uint8Array>(<any>context.getImageData(0, 0, heightMapWidth, heightMapHeight).data);

                this.applyDisplacementMapFromBuffer(buffer, heightMapWidth, heightMapHeight, minHeight, maxHeight, uvOffset, uvScale);
                //execute success callback, if set
                if (onSuccess) {
                    onSuccess(this);
                }
            };

            Tools.LoadImage(url, onload, () => { }, scene.database);
            return this;
        }

        /**
         * Modifies the mesh geometry according to a displacementMap buffer.
         * A displacement map is a colored image. Each pixel color value (actually a gradient computed from red, green, blue values) will give the displacement to apply to each mesh vertex.  
         * The mesh must be set as updatable. Its internal geometry is directly modified, no new buffer are allocated.
         * This method returns nothing.   
         * The parameter `buffer` is a `Uint8Array` buffer containing series of `Uint8` lower than 255, the red, green, blue and alpha values of each successive pixel.
         * The parameters `heightMapWidth` and `heightMapHeight` are positive integers to set the width and height of the buffer image.     
         * The parameters `minHeight` and `maxHeight` are the lower and upper limits of the displacement.
         * The parameter `uvOffset` is an optional vector2 used to offset UV.
         * The parameter `uvScale` is an optional vector2 used to scale UV.  
         * 
         * Returns the Mesh.  
         */
        public applyDisplacementMapFromBuffer(buffer: Uint8Array, heightMapWidth: number, heightMapHeight: number, minHeight: number, maxHeight: number, uvOffset?: Vector2, uvScale?: Vector2): Mesh {
            if (!this.isVerticesDataPresent(VertexBuffer.PositionKind)
                || !this.isVerticesDataPresent(VertexBuffer.NormalKind)
                || !this.isVerticesDataPresent(VertexBuffer.UVKind)) {
                Tools.Warn("Cannot call applyDisplacementMap: Given mesh is not complete. Position, Normal or UV are missing");
                return this;
            }

            var positions = <FloatArray>this.getVerticesData(VertexBuffer.PositionKind);
            var normals = <FloatArray>this.getVerticesData(VertexBuffer.NormalKind);
            var uvs = <number[]>this.getVerticesData(VertexBuffer.UVKind);
            var position = Vector3.Zero();
            var normal = Vector3.Zero();
            var uv = Vector2.Zero();

            uvOffset = uvOffset || Vector2.Zero();
            uvScale = uvScale || new Vector2(1, 1);

            for (var index = 0; index < positions.length; index += 3) {
                Vector3.FromArrayToRef(positions, index, position);
                Vector3.FromArrayToRef(normals, index, normal);
                Vector2.FromArrayToRef(uvs, (index / 3) * 2, uv);

                // Compute height
                var u = ((Math.abs(uv.x * uvScale.x + uvOffset.x) * heightMapWidth) % heightMapWidth) | 0;
                var v = ((Math.abs(uv.y * uvScale.y + uvOffset.y) * heightMapHeight) % heightMapHeight) | 0;

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
            return this;
        }

        /**
         * Modify the mesh to get a flat shading rendering.
         * This means each mesh facet will then have its own normals. Usually new vertices are added in the mesh geometry to get this result.
         * This method returns the Mesh.   
         * Warning : the mesh is really modified even if not set originally as updatable and, under the hood, a new VertexBuffer is allocated.
         */
        public convertToFlatShadedMesh(): Mesh {
            /// <summary>Update normals and vertices to get a flat shading rendering.</summary>
            /// <summary>Warning: This may imply adding vertices to the mesh in order to get exactly 3 vertices per face</summary>

            var kinds = this.getVerticesDataKinds();
            var vbs: { [key: string]: VertexBuffer } = {};
            var data: { [key: string]: FloatArray } = {};
            var newdata: { [key: string]: Array<number> } = {};
            var updatableNormals = false;
            var kindIndex: number;
            var kind: string;
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                var vertexBuffer = <VertexBuffer>this.getVertexBuffer(kind);

                if (kind === VertexBuffer.NormalKind) {
                    updatableNormals = vertexBuffer.isUpdatable();
                    kinds.splice(kindIndex, 1);
                    kindIndex--;
                    continue;
                }

                vbs[kind] = vertexBuffer;
                data[kind] = <FloatArray>vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = <IndicesArray>this.getIndices();
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
                SubMesh.AddToMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }

            this.synchronizeInstances();
            return this;
        }

        /**
         * This method removes all the mesh indices and add new vertices (duplication) in order to unfold facets into buffers.
         * In other words, more vertices, no more indices and a single bigger VBO.
         * The mesh is really modified even if not set originally as updatable. Under the hood, a new VertexBuffer is allocated.  
         * Returns the Mesh.  
         */
        public convertToUnIndexedMesh(): Mesh {
            /// <summary>Remove indices by unfolding faces into buffers</summary>
            /// <summary>Warning: This implies adding vertices to the mesh in order to get exactly 3 vertices per face</summary>

            var kinds = this.getVerticesDataKinds();
            var vbs: { [key: string]: VertexBuffer } = {};
            var data: { [key: string]: FloatArray } = {};
            var newdata: { [key: string]: Array<number> } = {};
            var kindIndex: number;
            var kind: string;
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                var vertexBuffer = <VertexBuffer>this.getVertexBuffer(kind);
                vbs[kind] = vertexBuffer;
                data[kind] = <FloatArray>vbs[kind].getData();
                newdata[kind] = [];
            }

            // Save previous submeshes
            var previousSubmeshes = this.subMeshes.slice(0);

            var indices = <IndicesArray>this.getIndices();
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

            // Updating indices
            for (index = 0; index < totalIndices; index += 3) {
                indices[index] = index;
                indices[index + 1] = index + 1;
                indices[index + 2] = index + 2;
            }

            this.setIndices(indices);

            // Updating vertex buffers
            for (kindIndex = 0; kindIndex < kinds.length; kindIndex++) {
                kind = kinds[kindIndex];
                this.setVerticesData(kind, newdata[kind], vbs[kind].isUpdatable());
            }

            // Updating submeshes
            this.releaseSubMeshes();
            for (var submeshIndex = 0; submeshIndex < previousSubmeshes.length; submeshIndex++) {
                var previousOne = previousSubmeshes[submeshIndex];
                SubMesh.AddToMesh(previousOne.materialIndex, previousOne.indexStart, previousOne.indexCount, previousOne.indexStart, previousOne.indexCount, this);
            }

            this._unIndexed = true;

            this.synchronizeInstances();
            return this;
        }

        /**
         * Inverses facet orientations and inverts also the normals with `flipNormals` (default `false`) if true.
         * This method returns the Mesh.
         * Warning : the mesh is really modified even if not set originally as updatable. A new VertexBuffer is created under the hood each call.
         */
        public flipFaces(flipNormals: boolean = false): Mesh {
            var vertex_data = VertexData.ExtractFromMesh(this);
            var i: number;
            if (flipNormals && this.isVerticesDataPresent(VertexBuffer.NormalKind) && vertex_data.normals) {
                for (i = 0; i < vertex_data.normals.length; i++) {
                    vertex_data.normals[i] *= -1;
                }
            }

            if (vertex_data.indices) {
                var temp;
                for (i = 0; i < vertex_data.indices.length; i += 3) {
                    // reassign indices
                    temp = vertex_data.indices[i + 1];
                    vertex_data.indices[i + 1] = vertex_data.indices[i + 2];
                    vertex_data.indices[i + 2] = temp;
                }
            }

            vertex_data.applyToMesh(this);
            return this;
        }

        // Instances
        /**
         * Creates a new InstancedMesh object from the mesh model.
         * An instance shares the same properties and the same material than its model.
         * Only these properties of each instance can then be set individually :
         * - position
         * - rotation
         * - rotationQuaternion
         * - setPivotMatrix
         * - scaling
         * tuto : http://doc.babylonjs.com/tutorials/How_to_use_Instances
         * Warning : this method is not supported for Line mesh and LineSystem
         */
        public createInstance(name: string): InstancedMesh {
            return new InstancedMesh(name, this);
        }

        /**
         * Synchronises all the mesh instance submeshes to the current mesh submeshes, if any.
         * After this call, all the mesh instances have the same submeshes than the current mesh.
         * This method returns the Mesh.   
         */
        public synchronizeInstances(): Mesh {
            for (var instanceIndex = 0; instanceIndex < this.instances.length; instanceIndex++) {
                var instance = this.instances[instanceIndex];
                instance._syncSubMeshes();
            }
            return this;
        }

        /**
         * Simplify the mesh according to the given array of settings.
         * Function will return immediately and will simplify async. It returns the Mesh.  
         * @param settings a collection of simplification settings.
         * @param parallelProcessing should all levels calculate parallel or one after the other.
         * @param type the type of simplification to run.
         * @param successCallback optional success callback to be called after the simplification finished processing all settings.
         */
        public simplify(settings: Array<ISimplificationSettings>, parallelProcessing: boolean = true, simplificationType: SimplificationType = SimplificationType.QUADRATIC, successCallback?: (mesh?: Mesh, submeshIndex?: number) => void): Mesh {
            this.getScene().simplificationQueue.addTask({
                settings: settings,
                parallelProcessing: parallelProcessing,
                mesh: this,
                simplificationType: simplificationType,
                successCallback: successCallback
            });
            return this;
        }

        /**
         * Optimization of the mesh's indices, in case a mesh has duplicated vertices.   
         * The function will only reorder the indices and will not remove unused vertices to avoid problems with submeshes.   
         * This should be used together with the simplification to avoid disappearing triangles.  
         * Returns the Mesh.   
         * @param successCallback an optional success callback to be called after the optimization finished.   
         */
        public optimizeIndices(successCallback?: (mesh?: Mesh) => void): Mesh {
            var indices = <IndicesArray>this.getIndices();
            var positions = this.getVerticesData(VertexBuffer.PositionKind);

            if (!positions || !indices) {
                return this;
            }

            var vectorPositions = new Array<Vector3>();
            for (var pos = 0; pos < positions.length; pos = pos + 3) {
                vectorPositions.push(Vector3.FromArray(positions, pos));
            }
            var dupes = new Array<number>();

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
            return this;
        }

        public serialize(serializationObject: any): void {
            serializationObject.name = this.name;
            serializationObject.id = this.id;
            serializationObject.type = this.getClassName();

            if (Tags && Tags.HasTags(this)) {
                serializationObject.tags = Tags.GetTags(this);
            }

            serializationObject.position = this.position.asArray();

            if (this.rotationQuaternion) {
                serializationObject.rotationQuaternion = this.rotationQuaternion.asArray();
            } else if (this.rotation) {
                serializationObject.rotation = this.rotation.asArray();
            }

            serializationObject.scaling = this.scaling.asArray();
            serializationObject.localMatrix = this.getPivotMatrix().asArray();

            serializationObject.isEnabled = this.isEnabled();
            serializationObject.isVisible = this.isVisible;
            serializationObject.infiniteDistance = this.infiniteDistance;
            serializationObject.pickable = this.isPickable;

            serializationObject.receiveShadows = this.receiveShadows;

            serializationObject.billboardMode = this.billboardMode;
            serializationObject.visibility = this.visibility;

            serializationObject.checkCollisions = this.checkCollisions;
            serializationObject.isBlocker = this.isBlocker;

            // Parent
            if (this.parent) {
                serializationObject.parentId = this.parent.id;
            }

            // Geometry
            var geometry = this._geometry;
            if (geometry) {
                var geometryId = geometry.id;
                serializationObject.geometryId = geometryId;

                // SubMeshes
                serializationObject.subMeshes = [];
                for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                    var subMesh = this.subMeshes[subIndex];

                    serializationObject.subMeshes.push({
                        materialIndex: subMesh.materialIndex,
                        verticesStart: subMesh.verticesStart,
                        verticesCount: subMesh.verticesCount,
                        indexStart: subMesh.indexStart,
                        indexCount: subMesh.indexCount
                    });
                }
            }

            // Material
            if (this.material) {
                serializationObject.materialId = this.material.id;
            } else {
                this.material = null;
            }

            // Morph targets
            if (this.morphTargetManager) {
                serializationObject.morphTargetManagerId = this.morphTargetManager.uniqueId;
            }

            // Skeleton
            if (this.skeleton) {
                serializationObject.skeletonId = this.skeleton.id;
            }

            // Physics
            //TODO implement correct serialization for physics impostors.

            let impostor = this.getPhysicsImpostor();
            if (impostor) {
                serializationObject.physicsMass = impostor.getParam("mass");
                serializationObject.physicsFriction = impostor.getParam("friction");
                serializationObject.physicsRestitution = impostor.getParam("mass");
                serializationObject.physicsImpostor = impostor.type;
            }

            // Metadata
            if (this.metadata) {
                serializationObject.metadata = this.metadata;
            }

            // Instances
            serializationObject.instances = [];
            for (var index = 0; index < this.instances.length; index++) {
                var instance = this.instances[index];
                var serializationInstance: any = {
                    name: instance.name,
                    position: instance.position.asArray(),
                    scaling: instance.scaling.asArray()
                };
                if (instance.rotationQuaternion) {
                    serializationInstance.rotationQuaternion = instance.rotationQuaternion.asArray();
                } else if (instance.rotation) {
                    serializationInstance.rotation = instance.rotation.asArray();
                }
                serializationObject.instances.push(serializationInstance);

                // Animations
                Animation.AppendSerializedAnimations(instance, serializationInstance);
                serializationInstance.ranges = instance.serializeAnimationRanges();
            }

            // 

            // Animations
            Animation.AppendSerializedAnimations(this, serializationObject);
            serializationObject.ranges = this.serializeAnimationRanges();

            // Layer mask
            serializationObject.layerMask = this.layerMask;

            // Alpha
            serializationObject.alphaIndex = this.alphaIndex;
            serializationObject.hasVertexAlpha = this.hasVertexAlpha;

            // Overlay
            serializationObject.overlayAlpha = this.overlayAlpha;
            serializationObject.overlayColor = this.overlayColor.asArray();
            serializationObject.renderOverlay = this.renderOverlay;

            // Fog
            serializationObject.applyFog = this.applyFog;

            // Action Manager
            if (this.actionManager) {
                serializationObject.actions = this.actionManager.serialize(this.name);
            }
        }

        public _syncGeometryWithMorphTargetManager() {
            if (!this.geometry) {
                return;
            }

            this._markSubMeshesAsAttributesDirty();

            let morphTargetManager = this._morphTargetManager;
            if (morphTargetManager && morphTargetManager.vertexCount) {
                if (morphTargetManager.vertexCount !== this.getTotalVertices()) {
                    Tools.Error("Mesh is incompatible with morph targets. Targets and mesh must all have the same vertices count.");
                    this.morphTargetManager = null;
                    return;
                }

                for (var index = 0; index < morphTargetManager.numInfluencers; index++) {
                    var morphTarget = morphTargetManager.getActiveTarget(index);

                    const positions = morphTarget.getPositions();
                    if (!positions) {
                        Tools.Error("Invalid morph target. Target must have positions.");
                        return;
                    }

                    this.geometry.setVerticesData(VertexBuffer.PositionKind + index, positions, false, 3);

                    const normals = morphTarget.getNormals();
                    if (normals) {
                        this.geometry.setVerticesData(VertexBuffer.NormalKind + index, normals, false, 3);
                    }

                    const tangents = morphTarget.getTangents();
                    if (tangents) {
                        this.geometry.setVerticesData(VertexBuffer.TangentKind + index, tangents, false, 3);
                    }
                }
            } else {
                var index = 0;

                // Positions
                while (this.geometry.isVerticesDataPresent(VertexBuffer.PositionKind + index)) {
                    this.geometry.removeVerticesData(VertexBuffer.PositionKind + index);

                    if (this.geometry.isVerticesDataPresent(VertexBuffer.NormalKind + index)) {
                        this.geometry.removeVerticesData(VertexBuffer.NormalKind + index);
                    }
                    if (this.geometry.isVerticesDataPresent(VertexBuffer.TangentKind + index)) {
                        this.geometry.removeVerticesData(VertexBuffer.TangentKind + index);
                    }
                    index++;
                }
            }
        }

        // Statics
        /**
         * Returns a new Mesh object parsed from the source provided.   
         * The parameter `parsedMesh` is the source.   
         * The parameter `rootUrl` is a string, it's the root URL to prefix the `delayLoadingFile` property with
         */
        public static Parse(parsedMesh: any, scene: Scene, rootUrl: string): Mesh {
            var mesh: Mesh;

            if (parsedMesh.type && parsedMesh.type === "GroundMesh") {
                mesh = GroundMesh.Parse(parsedMesh, scene);
            } else {
                mesh = new Mesh(parsedMesh.name, scene);
            }
            mesh.id = parsedMesh.id;

            if (Tags) {
                Tags.AddTagsTo(mesh, parsedMesh.tags);
            }

            mesh.position = Vector3.FromArray(parsedMesh.position);

            if (parsedMesh.metadata !== undefined) {
                mesh.metadata = parsedMesh.metadata;
            }

            if (parsedMesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.FromArray(parsedMesh.rotationQuaternion);
            } else if (parsedMesh.rotation) {
                mesh.rotation = Vector3.FromArray(parsedMesh.rotation);
            }

            mesh.scaling = Vector3.FromArray(parsedMesh.scaling);

            if (parsedMesh.localMatrix) {
                mesh.setPivotMatrix(Matrix.FromArray(parsedMesh.localMatrix));
            } else if (parsedMesh.pivotMatrix) {
                mesh.setPivotMatrix(Matrix.FromArray(parsedMesh.pivotMatrix));
            }

            mesh.setEnabled(parsedMesh.isEnabled);
            mesh.isVisible = parsedMesh.isVisible;
            mesh.infiniteDistance = parsedMesh.infiniteDistance;

            mesh.showBoundingBox = parsedMesh.showBoundingBox;
            mesh.showSubMeshesBoundingBox = parsedMesh.showSubMeshesBoundingBox;

            if (parsedMesh.applyFog !== undefined) {
                mesh.applyFog = parsedMesh.applyFog;
            }

            if (parsedMesh.pickable !== undefined) {
                mesh.isPickable = parsedMesh.pickable;
            }

            if (parsedMesh.alphaIndex !== undefined) {
                mesh.alphaIndex = parsedMesh.alphaIndex;
            }

            mesh.receiveShadows = parsedMesh.receiveShadows;

            mesh.billboardMode = parsedMesh.billboardMode;

            if (parsedMesh.visibility !== undefined) {
                mesh.visibility = parsedMesh.visibility;
            }

            mesh.checkCollisions = parsedMesh.checkCollisions;

            if (parsedMesh.isBlocker !== undefined) {
                mesh.isBlocker = parsedMesh.isBlocker;
            }

            mesh._shouldGenerateFlatShading = parsedMesh.useFlatShading;

            // freezeWorldMatrix
            if (parsedMesh.freezeWorldMatrix) {
                mesh._waitingFreezeWorldMatrix = parsedMesh.freezeWorldMatrix;
            }

            // Parent
            if (parsedMesh.parentId) {
                mesh._waitingParentId = parsedMesh.parentId;
            }

            // Actions
            if (parsedMesh.actions !== undefined) {
                mesh._waitingActions = parsedMesh.actions;
            }

            // Overlay
            if (parsedMesh.overlayAlpha !== undefined) {
                mesh.overlayAlpha = parsedMesh.overlayAlpha;
            }

            if (parsedMesh.overlayColor !== undefined) {
                mesh.overlayColor = Color3.FromArray(parsedMesh.overlayColor);
            }

            if (parsedMesh.renderOverlay !== undefined) {
                mesh.renderOverlay = parsedMesh.renderOverlay;
            }

            // Geometry
            mesh.hasVertexAlpha = parsedMesh.hasVertexAlpha;

            if (parsedMesh.delayLoadingFile) {
                mesh.delayLoadState = Engine.DELAYLOADSTATE_NOTLOADED;
                mesh.delayLoadingFile = rootUrl + parsedMesh.delayLoadingFile;
                mesh._boundingInfo = new BoundingInfo(Vector3.FromArray(parsedMesh.boundingBoxMinimum), Vector3.FromArray(parsedMesh.boundingBoxMaximum));

                if (parsedMesh._binaryInfo) {
                    mesh._binaryInfo = parsedMesh._binaryInfo;
                }

                mesh._delayInfo = [];
                if (parsedMesh.hasUVs) {
                    mesh._delayInfo.push(VertexBuffer.UVKind);
                }

                if (parsedMesh.hasUVs2) {
                    mesh._delayInfo.push(VertexBuffer.UV2Kind);
                }

                if (parsedMesh.hasUVs3) {
                    mesh._delayInfo.push(VertexBuffer.UV3Kind);
                }

                if (parsedMesh.hasUVs4) {
                    mesh._delayInfo.push(VertexBuffer.UV4Kind);
                }

                if (parsedMesh.hasUVs5) {
                    mesh._delayInfo.push(VertexBuffer.UV5Kind);
                }

                if (parsedMesh.hasUVs6) {
                    mesh._delayInfo.push(VertexBuffer.UV6Kind);
                }

                if (parsedMesh.hasColors) {
                    mesh._delayInfo.push(VertexBuffer.ColorKind);
                }

                if (parsedMesh.hasMatricesIndices) {
                    mesh._delayInfo.push(VertexBuffer.MatricesIndicesKind);
                }

                if (parsedMesh.hasMatricesWeights) {
                    mesh._delayInfo.push(VertexBuffer.MatricesWeightsKind);
                }

                mesh._delayLoadingFunction = Geometry.ImportGeometry;

                if (SceneLoader.ForceFullSceneLoadingForIncremental) {
                    mesh._checkDelayState();
                }

            } else {
                Geometry.ImportGeometry(parsedMesh, mesh);
            }

            // Material
            if (parsedMesh.materialId) {
                mesh.setMaterialByID(parsedMesh.materialId);
            } else {
                mesh.material = null;
            }

            // Morph targets
            if (parsedMesh.morphTargetManagerId > -1) {
                mesh.morphTargetManager = scene.getMorphTargetManagerById(parsedMesh.morphTargetManagerId);
            }

            // Skeleton
            if (parsedMesh.skeletonId > -1) {
                mesh.skeleton = scene.getLastSkeletonByID(parsedMesh.skeletonId);
                if (parsedMesh.numBoneInfluencers) {
                    mesh.numBoneInfluencers = parsedMesh.numBoneInfluencers;
                }
            }

            // Animations
            if (parsedMesh.animations) {
                for (var animationIndex = 0; animationIndex < parsedMesh.animations.length; animationIndex++) {
                    var parsedAnimation = parsedMesh.animations[animationIndex];

                    mesh.animations.push(Animation.Parse(parsedAnimation));
                }
                Node.ParseAnimationRanges(mesh, parsedMesh, scene);
            }

            if (parsedMesh.autoAnimate) {
                scene.beginAnimation(mesh, parsedMesh.autoAnimateFrom, parsedMesh.autoAnimateTo, parsedMesh.autoAnimateLoop, parsedMesh.autoAnimateSpeed || 1.0);
            }

            // Layer Mask
            if (parsedMesh.layerMask && (!isNaN(parsedMesh.layerMask))) {
                mesh.layerMask = Math.abs(parseInt(parsedMesh.layerMask));
            } else {
                mesh.layerMask = 0x0FFFFFFF;
            }


            // Physics
            if (parsedMesh.physicsImpostor) {
                mesh.physicsImpostor = new BABYLON.PhysicsImpostor(mesh, parsedMesh.physicsImpostor, {
                    mass: parsedMesh.physicsMass,
                    friction: parsedMesh.physicsFriction,
                    restitution: parsedMesh.physicsRestitution
                }, scene);
            }

            // Instances
            if (parsedMesh.instances) {
                for (var index = 0; index < parsedMesh.instances.length; index++) {
                    var parsedInstance = parsedMesh.instances[index];
                    var instance = mesh.createInstance(parsedInstance.name);

                    if (Tags) {
                        Tags.AddTagsTo(instance, parsedInstance.tags);
                    }

                    instance.position = Vector3.FromArray(parsedInstance.position);

                    if (parsedInstance.parentId) {
                        instance._waitingParentId = parsedInstance.parentId;
                    }

                    if (parsedInstance.rotationQuaternion) {
                        instance.rotationQuaternion = Quaternion.FromArray(parsedInstance.rotationQuaternion);
                    } else if (parsedInstance.rotation) {
                        instance.rotation = Vector3.FromArray(parsedInstance.rotation);
                    }

                    instance.scaling = Vector3.FromArray(parsedInstance.scaling);

                    instance.checkCollisions = mesh.checkCollisions;

                    if (parsedMesh.animations) {
                        for (animationIndex = 0; animationIndex < parsedMesh.animations.length; animationIndex++) {
                            parsedAnimation = parsedMesh.animations[animationIndex];

                            instance.animations.push(Animation.Parse(parsedAnimation));
                        }
                        Node.ParseAnimationRanges(instance, parsedMesh, scene);
                    }
                }
            }

            return mesh;
        }

        /**
         * Creates a ribbon mesh.   
         * Please consider using the same method from the MeshBuilder class instead.   
         * The ribbon is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.    
         *
         * Please read this full tutorial to understand how to design a ribbon : http://doc.babylonjs.com/tutorials/Ribbon_Tutorial    
         * The parameter `pathArray` is a required array of paths, what are each an array of successive Vector3. The pathArray parameter depicts the ribbon geometry.    
         * The parameter `closeArray` (boolean, default false) creates a seam between the first and the last paths of the path array.  
         * The parameter `closePath` (boolean, default false) creates a seam between the first and the last points of each path of the path array.
         * The parameter `offset` (positive integer, default : rounded half size of the pathArray length), is taken in account only if the `pathArray` is containing a single path. 
         * It's the offset to join together the points from the same path. Ex : offset = 10 means the point 1 is joined to the point 11.    
         * The optional parameter `instance` is an instance of an existing Ribbon object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#ribbon   
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateRibbon(name: string, pathArray: Vector3[][], closeArray: boolean = false, closePath: boolean, offset: number, scene?: Scene, updatable: boolean = false, sideOrientation?: number, instance?: Mesh): Mesh {
            return MeshBuilder.CreateRibbon(name, {
                pathArray: pathArray,
                closeArray: closeArray,
                closePath: closePath,
                offset: offset,
                updatable: updatable,
                sideOrientation: sideOrientation,
                instance: instance
            }, scene);
        }
        /**
         * Creates a plane polygonal mesh.  By default, this is a disc.   
         * Please consider using the same method from the MeshBuilder class instead.   
         * The parameter `radius` sets the radius size (float) of the polygon (default 0.5).  
         * The parameter `tessellation` sets the number of polygon sides (positive integer, default 64). So a tessellation valued to 3 will build a triangle, to 4 a square, etc.  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateDisc(name: string, radius: number, tessellation: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                radius: radius,
                tessellation: tessellation,
                sideOrientation: sideOrientation,
                updatable: updatable
            }

            return MeshBuilder.CreateDisc(name, options, scene);
        }
        /**
         * Creates a box mesh.  
         * Please consider using the same method from the MeshBuilder class instead.   
         * The parameter `size` sets the size (float) of each box side (default 1).  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateBox(name: string, size: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                size: size,
                sideOrientation: sideOrientation,
                updatable: updatable
            };

            return MeshBuilder.CreateBox(name, options, scene);
        }
        /**
         * Creates a sphere mesh.  
         * Please consider using the same method from the MeshBuilder class instead.   
         * The parameter `diameter` sets the diameter size (float) of the sphere (default 1).  
         * The parameter `segments` sets the sphere number of horizontal stripes (positive integer, default 32).  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateSphere(name: string, segments: number, diameter: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                segments: segments,
                diameterX: diameter,
                diameterY: diameter,
                diameterZ: diameter,
                sideOrientation: sideOrientation,
                updatable: updatable
            }

            return MeshBuilder.CreateSphere(name, options, scene);
        }

        /**
         * Creates a cylinder or a cone mesh.   
         * Please consider using the same method from the MeshBuilder class instead.   
         * The parameter `height` sets the height size (float) of the cylinder/cone (float, default 2).  
         * The parameter `diameter` sets the diameter of the top and bottom cap at once (float, default 1).  
         * The parameters `diameterTop` and `diameterBottom` overwrite the parameter `diameter` and set respectively the top cap and bottom cap diameter (floats, default 1). The parameter "diameterBottom" can't be zero.  
         * The parameter `tessellation` sets the number of cylinder sides (positive integer, default 24). Set it to 3 to get a prism for instance.
         * The parameter `subdivisions` sets the number of rings along the cylinder height (positive integer, default 1).   
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateCylinder(name: string, height: number, diameterTop: number, diameterBottom: number, tessellation: number, subdivisions: any, scene?: Scene, updatable?: any, sideOrientation?: number): Mesh {
            if (scene === undefined || !(scene instanceof Scene)) {
                if (scene !== undefined) {
                    sideOrientation = updatable || Mesh.DEFAULTSIDE;
                    updatable = scene;
                }
                scene = <Scene>subdivisions;
                subdivisions = 1;
            }

            var options = {
                height: height,
                diameterTop: diameterTop,
                diameterBottom: diameterBottom,
                tessellation: tessellation,
                subdivisions: subdivisions,
                sideOrientation: sideOrientation,
                updatable: updatable
            }

            return MeshBuilder.CreateCylinder(name, options, scene);
        }

        // Torus  (Code from SharpDX.org)
        /**
         * Creates a torus mesh.   
         * Please consider using the same method from the MeshBuilder class instead.      
         * The parameter `diameter` sets the diameter size (float) of the torus (default 1).  
         * The parameter `thickness` sets the diameter size of the tube of the torus (float, default 0.5).  
         * The parameter `tessellation` sets the number of torus sides (postive integer, default 16).  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTorus(name: string, diameter: number, thickness: number, tessellation: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                diameter: diameter,
                thickness: thickness,
                tessellation: tessellation,
                sideOrientation: sideOrientation,
                updatable: updatable
            }

            return MeshBuilder.CreateTorus(name, options, scene);
        }
        /**
         * Creates a torus knot mesh.   
         * Please consider using the same method from the MeshBuilder class instead.     
         * The parameter `radius` sets the global radius size (float) of the torus knot (default 2).  
         * The parameter `radialSegments` sets the number of sides on each tube segments (positive integer, default 32).  
         * The parameter `tubularSegments` sets the number of tubes to decompose the knot into (positive integer, default 32).  
         * The parameters `p` and `q` are the number of windings on each axis (positive integers, default 2 and 3).    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTorusKnot(name: string, radius: number, tube: number, radialSegments: number, tubularSegments: number, p: number, q: number, scene?: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                radius: radius,
                tube: tube,
                radialSegments: radialSegments,
                tubularSegments: tubularSegments,
                p: p,
                q: q,
                sideOrientation: sideOrientation,
                updatable: updatable
            }

            return MeshBuilder.CreateTorusKnot(name, options, scene);
        }

        /**
         * Creates a line mesh.  
         * Please consider using the same method from the MeshBuilder class instead.     
         * A line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.  
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.  
         * The parameter `points` is an array successive Vector3.   
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines    
         * When updating an instance, remember that only point positions can change, not the number of points.      
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateLines(name: string, points: Vector3[], scene: Nullable<Scene> = null, updatable: boolean = false, instance: Nullable<LinesMesh> = null): LinesMesh {
            var options = {
                points: points,
                updatable: updatable,
                instance: instance
            }
            return MeshBuilder.CreateLines(name, options, scene);
        }

        /**
         * Creates a dashed line mesh.  
         * Please consider using the same method from the MeshBuilder class instead.    
         * A dashed line mesh is considered as a parametric shape since it has no predefined original shape. Its shape is determined by the passed array of points as an input parameter.  
         * Like every other parametric shape, it is dynamically updatable by passing an existing instance of LineMesh to this static function.  
         * The parameter `points` is an array successive Vector3.  
         * The parameter `dashNb` is the intended total number of dashes (positive integer, default 200).    
         * The parameter `dashSize` is the size of the dashes relatively the dash number (positive float, default 3).  
         * The parameter `gapSize` is the size of the gap between two successive dashes relatively the dash number (positive float, default 1).  
         * The optional parameter `instance` is an instance of an existing LineMesh object to be updated with the passed `points` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#lines-and-dashedlines    
         * When updating an instance, remember that only point positions can change, not the number of points.      
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateDashedLines(name: string, points: Vector3[], dashSize: number, gapSize: number, dashNb: number, scene: Nullable<Scene> = null, updatable?: boolean, instance?: LinesMesh): LinesMesh {
            var options = {
                points: points,
                dashSize: dashSize,
                gapSize: gapSize,
                dashNb: dashNb,
                updatable: updatable,
                instance: instance
            }
            return MeshBuilder.CreateDashedLines(name, options, scene);
        }

        /**
         * Creates a polygon mesh.
         * Please consider using the same method from the MeshBuilder class instead. 
         * The polygon's shape will depend on the input parameters and is constructed parallel to a ground mesh.
         * The parameter `shape` is a required array of successive Vector3 representing the corners of the polygon in th XoZ plane, that is y = 0 for all vectors.
         * You can set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.
         * Remember you can only change the shape positions, not their number when updating a polygon.
         */
        public static CreatePolygon(name: string, shape: Vector3[], scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                shape: shape,
                holes: holes,
                updatable: updatable,
                sideOrientation: sideOrientation
            }
            return MeshBuilder.CreatePolygon(name, options, scene);
        }

        /**
          * Creates an extruded polygon mesh, with depth in the Y direction. 
          * Please consider using the same method from the MeshBuilder class instead. 
         */
        public static ExtrudePolygon(name: string, shape: Vector3[], depth: number, scene: Scene, holes?: Vector3[][], updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                shape: shape,
                holes: holes,
                depth: depth,
                updatable: updatable,
                sideOrientation: sideOrientation
            }
            return MeshBuilder.ExtrudePolygon(name, options, scene);
        }

        /**
         * Creates an extruded shape mesh.    
         * The extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.  
         * Please consider using the same method from the MeshBuilder class instead.    
         *
         * Please read this full tutorial to understand how to design an extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion     
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.    
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.      
         * The parameter `rotation` (float, default 0 radians) is the angle value to rotate the shape each step (each path point), from the former step (so rotation added each step) along the curve.    
         * The parameter `scale` (float, default 1) is the value to scale the shape.  
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL      
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape  
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.       
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static ExtrudeShape(name: string, shape: Vector3[], path: Vector3[], scale: number, rotation: number, cap: number, scene: Nullable<Scene> = null, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh {
            var options = {
                shape: shape,
                path: path,
                scale: scale,
                rotation: rotation,
                cap: (cap === 0) ? 0 : cap || Mesh.NO_CAP,
                sideOrientation: sideOrientation,
                instance: instance,
                updatable: updatable
            }

            return MeshBuilder.ExtrudeShape(name, options, scene);
        }
        /**
         * Creates an custom extruded shape mesh.    
         * The custom extrusion is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.  
         * Please consider using the same method from the MeshBuilder class instead.    
         *
         * Please read this full tutorial to understand how to design a custom extruded shape : http://doc.babylonjs.com/tutorials/Parametric_Shapes#extrusion     
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be extruded in its local space : the shape must be designed in the xOy plane and will be
         * extruded along the Z axis.    
         * The parameter `path` is a required array of successive Vector3. This is the axis curve the shape is extruded along.      
         * The parameter `rotationFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path 
         * and the distance of this point from the begining of the path : 
         * ```javascript
         * var rotationFunction = function(i, distance) {
         *     // do things
         *     return rotationValue; }
         * ```  
         * It must returns a float value that will be the rotation in radians applied to the shape on each path point.      
         * The parameter `scaleFunction` (JS function) is a custom Javascript function called on each path point. This function is passed the position i of the point in the path 
         * and the distance of this point from the begining of the path : 
         * ```javascript
         * var scaleFunction = function(i, distance) {
         *     // do things
         *    return scaleValue;}
         * ```  
         * It must returns a float value that will be the scale value applied to the shape on each path point.   
         * The parameter `ribbonClosePath` (boolean, default false) forces the extrusion underlying ribbon to close all the paths in its `pathArray`.  
         * The parameter `ribbonCloseArray` (boolean, default false) forces the extrusion underlying ribbon to close its `pathArray`.
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL        
         * The optional parameter `instance` is an instance of an existing ExtrudedShape object to be updated with the passed `shape`, `path`, `scale` or `rotation` parameters : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#extruded-shape  
         * Remember you can only change the shape or path point positions, not their number when updating an extruded shape.       
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static ExtrudeShapeCustom(name: string, shape: Vector3[], path: Vector3[], scaleFunction: Function, rotationFunction: Function, ribbonCloseArray: boolean, ribbonClosePath: boolean, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh {
            var options = {
                shape: shape,
                path: path,
                scaleFunction: scaleFunction,
                rotationFunction: rotationFunction,
                ribbonCloseArray: ribbonCloseArray,
                ribbonClosePath: ribbonClosePath,
                cap: (cap === 0) ? 0 : cap || Mesh.NO_CAP,
                sideOrientation: sideOrientation,
                instance: instance,
                updatable: updatable
            }

            return MeshBuilder.ExtrudeShapeCustom(name, options, scene);
        }

        /**
         * Creates lathe mesh.  
         * The lathe is a shape with a symetry axis : a 2D model shape is rotated around this axis to design the lathe.      
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameter `shape` is a required array of successive Vector3. This array depicts the shape to be rotated in its local space : the shape must be designed in the xOy plane and will be
         * rotated around the Y axis. It's usually a 2D shape, so the Vector3 z coordinates are often set to zero.    
         * The parameter `radius` (positive float, default 1) is the radius value of the lathe.        
         * The parameter `tessellation` (positive integer, default 64) is the side number of the lathe.      
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateLathe(name: string, shape: Vector3[], radius: number, tessellation: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                shape: shape,
                radius: radius,
                tessellation: tessellation,
                sideOrientation: sideOrientation,
                updatable: updatable
            };

            return MeshBuilder.CreateLathe(name, options, scene);
        }

        /**
         * Creates a plane mesh.  
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameter `size` sets the size (float) of both sides of the plane at once (default 1).  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreatePlane(name: string, size: number, scene: Scene, updatable?: boolean, sideOrientation?: number): Mesh {
            var options = {
                size: size,
                width: size,
                height: size,
                sideOrientation: sideOrientation,
                updatable: updatable
            }

            return MeshBuilder.CreatePlane(name, options, scene);
        }
        /**
         * Creates a ground mesh.  
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameters `width` and `height` (floats, default 1) set the width and height sizes of the ground.    
         * The parameter `subdivisions` (positive integer) sets the number of subdivisions per side.       
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateGround(name: string, width: number, height: number, subdivisions: number, scene?: Scene, updatable?: boolean): Mesh {
            var options = {
                width: width,
                height: height,
                subdivisions: subdivisions,
                updatable: updatable
            }

            return MeshBuilder.CreateGround(name, options, scene);
        }
        /**
         * Creates a tiled ground mesh.  
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameters `xmin` and `xmax` (floats, default -1 and 1) set the ground minimum and maximum X coordinates.     
         * The parameters `zmin` and `zmax` (floats, default -1 and 1) set the ground minimum and maximum Z coordinates.   
         * The parameter `subdivisions` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 6, h: 6}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height. Each subdivision is called a tile.    
         * The parameter `precision` is a javascript object `{w: positive integer, h: positive integer}` (default `{w: 2, h: 2}`). `w` and `h` are the
         * numbers of subdivisions on the ground width and height of each tile.  
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTiledGround(name: string, xmin: number, zmin: number, xmax: number, zmax: number, subdivisions: { w: number; h: number; }, precision: { w: number; h: number; }, scene: Scene, updatable?: boolean): Mesh {
            var options = {
                xmin: xmin,
                zmin: zmin,
                xmax: xmax,
                zmax: zmax,
                subdivisions: subdivisions,
                precision: precision,
                updatable: updatable
            }

            return MeshBuilder.CreateTiledGround(name, options, scene);
        }
        /**
         * Creates a ground mesh from a height map.    
         * tuto : http://doc.babylonjs.com/tutorials/14._Height_Map   
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameter `url` sets the URL of the height map image resource.  
         * The parameters `width` and `height` (positive floats, default 10) set the ground width and height sizes.     
         * The parameter `subdivisions` (positive integer, default 1) sets the number of subdivision per side.  
         * The parameter `minHeight` (float, default 0) is the minimum altitude on the ground.     
         * The parameter `maxHeight` (float, default 1) is the maximum altitude on the ground.   
         * The parameter `onReady` is a javascript callback function that will be called  once the mesh is just built (the height map download can last some time).  
         * This function is passed the newly built mesh : 
         * ```javascript
         * function(mesh) { // do things
         *     return; }
         * ```
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateGroundFromHeightMap(name: string, url: string, width: number, height: number, subdivisions: number, minHeight: number, maxHeight: number, scene: Scene, updatable?: boolean, onReady?: (mesh: GroundMesh) => void): GroundMesh {
            var options = {
                width: width,
                height: height,
                subdivisions: subdivisions,
                minHeight: minHeight,
                maxHeight: maxHeight,
                updatable: updatable,
                onReady: onReady
            };

            return MeshBuilder.CreateGroundFromHeightMap(name, url, options, scene);
        }
        /**
         * Creates a tube mesh.    
         * The tube is a parametric shape :  http://doc.babylonjs.com/tutorials/Parametric_Shapes.  It has no predefined shape. Its final shape will depend on the input parameters.    
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameter `path` is a required array of successive Vector3. It is the curve used as the axis of the tube.        
         * The parameter `radius` (positive float, default 1) sets the tube radius size.    
         * The parameter `tessellation` (positive float, default 64) is the number of sides on the tubular surface.  
         * The parameter `radiusFunction` (javascript function, default null) is a vanilla javascript function. If it is not null, it overwrittes the parameter `radius`. 
         * This function is called on each point of the tube path and is passed the index `i` of the i-th point and the distance of this point from the first point of the path. 
         * It must return a radius value (positive float) : 
         * ```javascript
         * var radiusFunction = function(i, distance) {
         *     // do things
         *     return radius; }
         * ```
         * The parameter `cap` sets the way the extruded shape is capped. Possible values : BABYLON.Mesh.NO_CAP (default), BABYLON.Mesh.CAP_START, BABYLON.Mesh.CAP_END, BABYLON.Mesh.CAP_ALL         
         * The optional parameter `instance` is an instance of an existing Tube object to be updated with the passed `pathArray` parameter : http://doc.babylonjs.com/tutorials/How_to_dynamically_morph_a_mesh#tube    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateTube(name: string, path: Vector3[], radius: number, tessellation: number, radiusFunction: { (i: number, distance: number): number; }, cap: number, scene: Scene, updatable?: boolean, sideOrientation?: number, instance?: Mesh): Mesh {
            var options = {
                path: path,
                radius: radius,
                tessellation: tessellation,
                radiusFunction: radiusFunction,
                arc: 1,
                cap: cap,
                updatable: updatable,
                sideOrientation: sideOrientation,
                instance: instance
            }
            return MeshBuilder.CreateTube(name, options, scene);
        }
        /**
         * Creates a polyhedron mesh.  
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameter `type` (positive integer, max 14, default 0) sets the polyhedron type to build among the 15 embbeded types. Please refer to the type sheet in the tutorial
         *  to choose the wanted type.  
         * The parameter `size` (positive float, default 1) sets the polygon size.  
         * You can overwrite the `size` on each dimension bu using the parameters `sizeX`, `sizeY` or `sizeZ` (positive floats, default to `size` value).  
         * You can build other polyhedron types than the 15 embbeded ones by setting the parameter `custom` (`polyhedronObject`, default null). If you set the parameter `custom`, this overwrittes the parameter `type`.  
         * A `polyhedronObject` is a formatted javascript object. You'll find a full file with pre-set polyhedra here : https://github.com/BabylonJS/Extensions/tree/master/Polyhedron    
         * You can set the color and the UV of each side of the polyhedron with the parameters `faceColors` (Color4, default `(1, 1, 1, 1)`) and faceUV (Vector4, default `(0, 0, 1, 1)`). 
         * To understand how to set `faceUV` or `faceColors`, please read this by considering the right number of faces of your polyhedron, instead of only 6 for the box : http://doc.babylonjs.com/tutorials/CreateBox_Per_Face_Textures_And_Colors  
         * The parameter `flat` (boolean, default true). If set to false, it gives the polyhedron a single global face, so less vertices and shared normals. In this case, `faceColors` and `faceUV` are ignored.    
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.   
         */
        public static CreatePolyhedron(name: string, options: { type?: number, size?: number, sizeX?: number, sizeY?: number, sizeZ?: number, custom?: any, faceUV?: Vector4[], faceColors?: Color4[], updatable?: boolean, sideOrientation?: number }, scene: Scene): Mesh {
            return MeshBuilder.CreatePolyhedron(name, options, scene);
        }
        /**
         * Creates a sphere based upon an icosahedron with 20 triangular faces which can be subdivided.   
         * Please consider using the same method from the MeshBuilder class instead.    
         * The parameter `radius` sets the radius size (float) of the icosphere (default 1).  
         * You can set some different icosphere dimensions, for instance to build an ellipsoid, by using the parameters `radiusX`, `radiusY` and `radiusZ` (all by default have the same value than `radius`).  
         * The parameter `subdivisions` sets the number of subdivisions (postive integer, default 4). The more subdivisions, the more faces on the icosphere whatever its size.    
         * The parameter `flat` (boolean, default true) gives each side its own normals. Set it to false to get a smooth continuous light reflection on the surface.  
         * You can also set the mesh side orientation with the values : BABYLON.Mesh.FRONTSIDE (default), BABYLON.Mesh.BACKSIDE or BABYLON.Mesh.DOUBLESIDE  
         * Detail here : http://doc.babylonjs.com/tutorials/02._Discover_Basic_Elements#side-orientation    
         * The mesh can be set to updatable with the boolean parameter `updatable` (default false) if its internal geometry is supposed to change once created.  
         */
        public static CreateIcoSphere(name: string, options: { radius?: number, flat?: boolean, subdivisions?: number, sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh {
            return MeshBuilder.CreateIcoSphere(name, options, scene);
        }

        /**
         * Creates a decal mesh.  
         * Please consider using the same method from the MeshBuilder class instead.    
         * A decal is a mesh usually applied as a model onto the surface of another mesh. So don't forget the parameter `sourceMesh` depicting the decal.  
         * The parameter `position` (Vector3, default `(0, 0, 0)`) sets the position of the decal in World coordinates.  
         * The parameter `normal` (Vector3, default Vector3.Up) sets the normal of the mesh where the decal is applied onto in World coordinates.  
         * The parameter `size` (Vector3, default `(1, 1, 1)`) sets the decal scaling.  
         * The parameter `angle` (float in radian, default 0) sets the angle to rotate the decal.  
         */
        public static CreateDecal(name: string, sourceMesh: AbstractMesh, position: Vector3, normal: Vector3, size: Vector3, angle: number): Mesh {
            var options = {
                position: position,
                normal: normal,
                size: size,
                angle: angle
            }

            return MeshBuilder.CreateDecal(name, sourceMesh, options);
        }

        // Skeletons
        /**
         * @returns original positions used for CPU skinning.  Useful for integrating Morphing with skeletons in same mesh.
         */
        public setPositionsForCPUSkinning(): Float32Array {
            if (!this._sourcePositions) {
                let source = this.getVerticesData(VertexBuffer.PositionKind);
                if (!source) {
                    return this._sourcePositions;
                }

                this._sourcePositions = new Float32Array(<any>source);

                if (!this.isVertexBufferUpdatable(VertexBuffer.PositionKind)) {
                    this.setVerticesData(VertexBuffer.PositionKind, source, true);
                }
            }
            return this._sourcePositions;
        }

        /**
         * @returns original normals used for CPU skinning.  Useful for integrating Morphing with skeletons in same mesh.
         */
        public setNormalsForCPUSkinning(): Float32Array {
            if (!this._sourceNormals) {
                let source = this.getVerticesData(VertexBuffer.NormalKind);

                if (!source) {
                    return this._sourceNormals;
                }

                this._sourceNormals = new Float32Array(<any>source);

                if (!this.isVertexBufferUpdatable(VertexBuffer.NormalKind)) {
                    this.setVerticesData(VertexBuffer.NormalKind, source, true);
                }
            }
            return this._sourceNormals;
        }

        /**
         * Updates the vertex buffer by applying transformation from the bones.  
         * Returns the Mesh.  
         * 
         * @param {skeleton} skeleton to apply
         */
        public applySkeleton(skeleton: Skeleton): Mesh {
            if (!this.geometry) {
                return this;
            }

            if (this.geometry._softwareSkinningRenderId == this.getScene().getRenderId()) {
                return this;
            }

            this.geometry._softwareSkinningRenderId = this.getScene().getRenderId();

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

            if (!this._sourcePositions) {
                var submeshes = this.subMeshes.slice();
                this.setPositionsForCPUSkinning();
                this.subMeshes = submeshes;
            }

            if (!this._sourceNormals) {
                this.setNormalsForCPUSkinning();
            }

            // positionsData checks for not being Float32Array will only pass at most once
            var positionsData = this.getVerticesData(VertexBuffer.PositionKind);

            if (!positionsData) {
                return this;
            }

            if (!(positionsData instanceof Float32Array)) {
                positionsData = new Float32Array(positionsData);
            }

            // normalsData checks for not being Float32Array will only pass at most once
            var normalsData = this.getVerticesData(VertexBuffer.NormalKind);

            if (!normalsData) {
                return this;
            }

            if (!(normalsData instanceof Float32Array)) {
                normalsData = new Float32Array(normalsData);
            }

            var matricesIndicesData = this.getVerticesData(VertexBuffer.MatricesIndicesKind);
            var matricesWeightsData = this.getVerticesData(VertexBuffer.MatricesWeightsKind);

            if (!matricesWeightsData || !matricesIndicesData) {
                return this;
            }

            var needExtras = this.numBoneInfluencers > 4;
            var matricesIndicesExtraData = needExtras ? this.getVerticesData(VertexBuffer.MatricesIndicesExtraKind) : null;
            var matricesWeightsExtraData = needExtras ? this.getVerticesData(VertexBuffer.MatricesWeightsExtraKind) : null;

            if (!matricesWeightsExtraData || !matricesIndicesExtraData) {
                return this;
            }

            var skeletonMatrices = skeleton.getTransformMatrices(this);

            var tempVector3 = Vector3.Zero();
            var finalMatrix = new Matrix();
            var tempMatrix = new Matrix();

            var matWeightIdx = 0;
            var inf: number;
            for (var index = 0; index < positionsData.length; index += 3, matWeightIdx += 4) {
                var weight: number;
                for (inf = 0; inf < 4; inf++) {
                    weight = matricesWeightsData[matWeightIdx + inf];
                    if (weight > 0) {
                        Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesData[matWeightIdx + inf] * 16, weight, tempMatrix);
                        finalMatrix.addToSelf(tempMatrix);

                    } else break;
                }
                if (needExtras) {
                    for (inf = 0; inf < 4; inf++) {
                        weight = matricesWeightsExtraData[matWeightIdx + inf];
                        if (weight > 0) {
                            Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, matricesIndicesExtraData[matWeightIdx + inf] * 16, weight, tempMatrix);
                            finalMatrix.addToSelf(tempMatrix);

                        } else break;
                    }
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
        /**
         * Returns an object `{min:` Vector3`, max:` Vector3`}`
         * This min and max Vector3 are the minimum and maximum vectors of each mesh bounding box from the passed array, in the World system
         */
        public static MinMax(meshes: AbstractMesh[]): { min: Vector3; max: Vector3 } {
            var minVector: Nullable<Vector3> = null;
            var maxVector: Nullable<Vector3> = null;

            meshes.forEach(function (mesh, index, array) {
                let boundingInfo = mesh.getBoundingInfo();

                let boundingBox = boundingInfo.boundingBox;
                if (!minVector || !maxVector) {
                    minVector = boundingBox.minimumWorld;
                    maxVector = boundingBox.maximumWorld;
                } else {
                    minVector.MinimizeInPlace(boundingBox.minimumWorld);
                    maxVector.MaximizeInPlace(boundingBox.maximumWorld);
                }
            });

            if (!minVector || !maxVector) {
                return {
                    min: Vector3.Zero(),
                    max: Vector3.Zero()
                }
            }

            return {
                min: minVector,
                max: maxVector
            };
        }
        /**
         * Returns a Vector3, the center of the `{min:` Vector3`, max:` Vector3`}` or the center of MinMax vector3 computed from a mesh array.
         */
        public static Center(meshesOrMinMaxVector: { min: Vector3; max: Vector3 } | AbstractMesh[]): Vector3 {
            var minMaxVector = (meshesOrMinMaxVector instanceof Array) ? BABYLON.Mesh.MinMax(meshesOrMinMaxVector) : meshesOrMinMaxVector;
            return Vector3.Center(minMaxVector.min, minMaxVector.max);
        }

        /**
         * Merge the array of meshes into a single mesh for performance reasons.
         * @param {Array<Mesh>} meshes - The vertices source.  They should all be of the same material.  Entries can empty
         * @param {boolean} disposeSource - When true (default), dispose of the vertices from the source meshes
         * @param {boolean} allow32BitsIndices - When the sum of the vertices > 64k, this must be set to true.
         * @param {Mesh} meshSubclass - When set, vertices inserted into this Mesh.  Meshes can then be merged into a Mesh sub-class.
         * @param {boolean} subdivideWithSubMeshes - When true (false default), subdivide mesh to his subMesh array with meshes source.
         */
        public static MergeMeshes(meshes: Array<Mesh>, disposeSource = true, allow32BitsIndices?: boolean, meshSubclass?: Mesh, subdivideWithSubMeshes?: boolean): Nullable<Mesh> {
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
            var vertexData: Nullable<VertexData> = null;
            var otherVertexData: VertexData;
            var indiceArray: Array<number> = new Array<number>();
            var source: Nullable<Mesh> = null;
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

                    if (subdivideWithSubMeshes) {
                        indiceArray.push(meshes[index].getTotalIndices());
                    }
                }
            }

            source = <Mesh>source;

            if (!meshSubclass) {
                meshSubclass = new Mesh(source.name + "_merged", source.getScene());
            }

            (<VertexData>vertexData).applyToMesh(meshSubclass);

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

            // Subdivide
            if (subdivideWithSubMeshes) {

                //-- Suppresions du submesh global
                meshSubclass.releaseSubMeshes();
                index = 0;
                var offset = 0;

                //-- aplique la subdivision en fonction du tableau d'indices
                while (index < indiceArray.length) {
                    BABYLON.SubMesh.CreateFromIndices(0, offset, indiceArray[index], meshSubclass);
                    offset += indiceArray[index];
                    index++;
                }
            }

            return meshSubclass;
        }
    }
}