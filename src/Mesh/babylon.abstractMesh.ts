module BABYLON {
    export class AbstractMesh extends Node implements IDisposable, ICullable, IGetSetVerticesData {
        // Statics
        private static _BILLBOARDMODE_NONE = 0;
        private static _BILLBOARDMODE_X = 1;
        private static _BILLBOARDMODE_Y = 2;
        private static _BILLBOARDMODE_Z = 4;
        private static _BILLBOARDMODE_ALL = 7;

        public static OCCLUSION_TYPE_NONE = 0;
        public static OCCLUSION_TYPE_OPTIMISTIC = 1;
        public static OCCLUSION_TYPE_STRICT = 2;
        public static OCCLUSION_ALGORITHM_TYPE_ACCURATE = 0;
        public static OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE = 1;

        public static get BILLBOARDMODE_NONE(): number {
            return AbstractMesh._BILLBOARDMODE_NONE;
        }

        public static get BILLBOARDMODE_X(): number {
            return AbstractMesh._BILLBOARDMODE_X;
        }

        public static get BILLBOARDMODE_Y(): number {
            return AbstractMesh._BILLBOARDMODE_Y;
        }

        public static get BILLBOARDMODE_Z(): number {
            return AbstractMesh._BILLBOARDMODE_Z;
        }

        public static get BILLBOARDMODE_ALL(): number {
            return AbstractMesh._BILLBOARDMODE_ALL;
        }

        // facetData private properties
        private _facetPositions: Vector3[];             // facet local positions
        private _facetNormals: Vector3[];               // facet local normals
        private _facetPartitioning: number[][];           // partitioning array of facet index arrays
        private _facetNb: number = 0;                   // facet number
        private _partitioningSubdivisions: number = 10; // number of subdivisions per axis in the partioning space  
        private _partitioningBBoxRatio: number = 1.01;  // the partioning array space is by default 1% bigger than the bounding box
        private _facetDataEnabled: boolean = false;     // is the facet data feature enabled on this mesh ?
        private _facetParameters: any = {};                  // keep a reference to the object parameters to avoid memory re-allocation
        private _bbSize: Vector3 = Vector3.Zero();      // bbox size approximated for facet data
        private _subDiv = {                         // actual number of subdivisions per axis for ComputeNormals()
            max: 1,
            X: 1,
            Y: 1,
            Z: 1
        };
        /**
         * Read-only : the number of facets in the mesh
         */
        public get facetNb(): number {
            return this._facetNb;
        }
        /**
         * The number (integer) of subdivisions per axis in the partioning space
         */
        public get partitioningSubdivisions(): number {
            return this._partitioningSubdivisions;
        }
        public set partitioningSubdivisions(nb: number) {
            this._partitioningSubdivisions = nb;
        }
        /**
         * The ratio (float) to apply to the bouding box size to set to the partioning space.  
         * Ex : 1.01 (default) the partioning space is 1% bigger than the bounding box.
         */
        public get partitioningBBoxRatio(): number {
            return this._partitioningBBoxRatio;
        }
        public set partitioningBBoxRatio(ratio: number) {
            this._partitioningBBoxRatio = ratio;
        }
        /**
         * Read-only boolean : is the feature facetData enabled ?
         */
        public get isFacetDataEnabled(): boolean {
            return this._facetDataEnabled;
        }

        // Normal matrix
        private _nonUniformScaling = false;
        public get nonUniformScaling(): boolean {
            return this._nonUniformScaling;
        }

        public set nonUniformScaling(value: boolean) {
            if (this._nonUniformScaling === value) {
                return;
            }
            this._nonUniformScaling = true;
            this._markSubMeshesAsMiscDirty();
        }

        // Events

        /**
        * An event triggered when this mesh collides with another one
        * @type {BABYLON.Observable}
        */
        public onCollideObservable = new Observable<AbstractMesh>();

        private _onCollideObserver: Nullable<Observer<AbstractMesh>>;
        public set onCollide(callback: () => void) {
            if (this._onCollideObserver) {
                this.onCollideObservable.remove(this._onCollideObserver);
            }
            this._onCollideObserver = this.onCollideObservable.add(callback);
        }

        /**
        * An event triggered when the collision's position changes
        * @type {BABYLON.Observable}
        */
        public onCollisionPositionChangeObservable = new Observable<Vector3>();

        private _onCollisionPositionChangeObserver: Nullable<Observer<Vector3>>;
        public set onCollisionPositionChange(callback: () => void) {
            if (this._onCollisionPositionChangeObserver) {
                this.onCollisionPositionChangeObservable.remove(this._onCollisionPositionChangeObserver);
            }
            this._onCollisionPositionChangeObserver = this.onCollisionPositionChangeObservable.add(callback);
        }

        /**
        * An event triggered after the world matrix is updated
        * @type {BABYLON.Observable}
        */
        public onAfterWorldMatrixUpdateObservable = new Observable<AbstractMesh>();

        /**
        * An event triggered when material is changed
        * @type {BABYLON.Observable}
        */
        public onMaterialChangedObservable = new Observable<AbstractMesh>();

        // Properties
        public definedFacingForward = true; // orientation for POV movement & rotation
        public position = Vector3.Zero();

        /**
        * This property determines the type of occlusion query algorithm to run in WebGl, you can use:

        * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE which is mapped to GL_ANY_SAMPLES_PASSED.

        * or

        * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE (Default Value) which is mapped to GL_ANY_SAMPLES_PASSED_CONSERVATIVE which is a false positive algorithm that is faster than GL_ANY_SAMPLES_PASSED but less accurate.

        * for more info check WebGl documentations
        */
        public occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
        /**
         * This property is responsible for starting the occlusion query within the Mesh or not, this property is also used     to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:

        * OCCLUSION_TYPE_NONE (Default Value): this option means no occlusion query whith the Mesh.

        * OCCLUSION_TYPE_OPTIMISTIC: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.

            * OCCLUSION_TYPE_STRICT: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         */
        public occlusionType = AbstractMesh.OCCLUSION_TYPE_NONE;
        /**
        * This number indicates the number of allowed retries before stop the occlusion query, this is useful if the        occlusion query is taking long time before to the query result is retireved, the query result indicates if the object is visible within the scene or not and based on that Babylon.Js engine decideds to show or hide the object.

        * The default value is -1 which means don't break the query and wait till the result.
        */
        public occlusionRetryCount = -1;
        private _occlusionInternalRetryCounter = 0;

        protected _isOccluded = false;
        /**
        * Property isOccluded : Gets or sets whether the mesh is occluded or not, it is used also to set the intial state of the mesh to be occluded or not.
        */
        public get isOccluded(): boolean {
            return this._isOccluded;
        }

        public set isOccluded(value: boolean) {
            this._isOccluded = value;
        }

        private _isOcclusionQueryInProgress = false;
        /**
        * Flag to check the progress status of the query
        */
        public get isOcclusionQueryInProgress(): boolean {
            return this._isOcclusionQueryInProgress;
        }

        private _occlusionQuery: Nullable<WebGLQuery>;

        private _rotation = Vector3.Zero();
        private _rotationQuaternion: Nullable<Quaternion>;
        private _scaling = Vector3.One();
        public billboardMode = AbstractMesh.BILLBOARDMODE_NONE;
        public visibility = 1.0;
        public alphaIndex = Number.MAX_VALUE;
        public infiniteDistance = false;
        public isVisible = true;
        public isPickable = true;
        public showBoundingBox = false;
        public showSubMeshesBoundingBox = false;
        public isBlocker = false;
        public enablePointerMoveEvents = false;
        public renderingGroupId = 0;
        private _material: Nullable<Material>
        public get material(): Nullable<Material> {
            return this._material;
        }
        public set material(value: Nullable<Material>) {
            if (this._material === value) {
                return;
            }

            this._material = value;

            if (this.onMaterialChangedObservable.hasObservers) {
                this.onMaterialChangedObservable.notifyObservers(this);
            }

            if (!this.subMeshes) {
                return;
            }

            for (var subMesh of this.subMeshes) {
                subMesh.setEffect(null);
            }
        }

        private _receiveShadows = false;
        public get receiveShadows(): boolean {
            return this._receiveShadows;
        }
        public set receiveShadows(value: boolean) {
            if (this._receiveShadows === value) {
                return;
            }

            this._receiveShadows = value;
            this._markSubMeshesAsLightDirty();
        }

        public renderOutline = false;
        public outlineColor = Color3.Red();
        public outlineWidth = 0.02;
        public renderOverlay = false;
        public overlayColor = Color3.Red();
        public overlayAlpha = 0.5;
        private _hasVertexAlpha = false;
        public get hasVertexAlpha(): boolean {
            return this._hasVertexAlpha;
        }
        public set hasVertexAlpha(value: boolean) {
            if (this._hasVertexAlpha === value) {
                return;
            }

            this._hasVertexAlpha = value;
            this._markSubMeshesAsAttributesDirty();
        }

        private _useVertexColors = true;
        public get useVertexColors(): boolean {
            return this._useVertexColors;
        }
        public set useVertexColors(value: boolean) {
            if (this._useVertexColors === value) {
                return;
            }

            this._useVertexColors = value;
            this._markSubMeshesAsAttributesDirty();
        }

        private _computeBonesUsingShaders = true;
        public get computeBonesUsingShaders(): boolean {
            return this._computeBonesUsingShaders;
        }
        public set computeBonesUsingShaders(value: boolean) {
            if (this._computeBonesUsingShaders === value) {
                return;
            }

            this._computeBonesUsingShaders = value;
            this._markSubMeshesAsAttributesDirty();
        }

        private _numBoneInfluencers = 4;
        public get numBoneInfluencers(): number {
            return this._numBoneInfluencers;
        }
        public set numBoneInfluencers(value: number) {
            if (this._numBoneInfluencers === value) {
                return;
            }

            this._numBoneInfluencers = value;
            this._markSubMeshesAsAttributesDirty();
        }

        private _applyFog = true;
        public get applyFog(): boolean {
            return this._applyFog;
        }
        public set applyFog(value: boolean) {
            if (this._applyFog === value) {
                return;
            }

            this._applyFog = value;
            this._markSubMeshesAsMiscDirty();
        }

        public scalingDeterminant = 1;

        public useOctreeForRenderingSelection = true;
        public useOctreeForPicking = true;
        public useOctreeForCollisions = true;

        private _layerMask: number = 0x0FFFFFFF;

        public get layerMask(): number {
            return this._layerMask;
        }

        public set layerMask(value: number) {
            if (value === this._layerMask) {
                return;
            }

            this._layerMask = value;
            this._resyncLightSources();
        }

        /**
         * True if the mesh must be rendered in any case.  
         */
        public alwaysSelectAsActiveMesh = false;

        /**
         * This scene's action manager
         * @type {BABYLON.ActionManager}
        */
        public actionManager: Nullable<ActionManager>;

        // Physics
        public physicsImpostor: Nullable<PhysicsImpostor>;

        // Collisions
        private _checkCollisions = false;
        private _collisionMask = -1;
        private _collisionGroup = -1;
        public ellipsoid = new Vector3(0.5, 1, 0.5);
        public ellipsoidOffset = new Vector3(0, 0, 0);
        private _collider: Collider;
        private _oldPositionForCollisions = new Vector3(0, 0, 0);
        private _diffPositionForCollisions = new Vector3(0, 0, 0);


        public get collisionMask(): number {
            return this._collisionMask;
        }

        public set collisionMask(mask: number) {
            this._collisionMask = !isNaN(mask) ? mask : -1;
        }

        public get collisionGroup(): number {
            return this._collisionGroup;
        }

        public set collisionGroup(mask: number) {
            this._collisionGroup = !isNaN(mask) ? mask : -1;
        }

        // Attach to bone
        private _meshToBoneReferal: Nullable<AbstractMesh>;

        // Edges
        public edgesWidth = 1;
        public edgesColor = new Color4(1, 0, 0, 1);
        public _edgesRenderer: Nullable<EdgesRenderer>;

        // Cache
        private _localWorld = Matrix.Zero();
        public _worldMatrix = Matrix.Zero();
        private _absolutePosition = Vector3.Zero();
        private _collisionsTransformMatrix = Matrix.Zero();
        private _collisionsScalingMatrix = Matrix.Zero();
        private _isDirty = false;
        public _masterMesh: Nullable<AbstractMesh>;

        public _boundingInfo: Nullable<BoundingInfo>;
        private _pivotMatrix = Matrix.Identity();
        private _pivotMatrixInverse: Matrix;
        private _postMultiplyPivotMatrix = false;
        public _isDisposed = false;
        public _renderId = 0;

        public subMeshes: SubMesh[];
        public _submeshesOctree: Octree<SubMesh>;
        public _intersectionsInProgress = new Array<AbstractMesh>();

        private _isWorldMatrixFrozen = false;

        public _unIndexed = false;

        public _poseMatrix: Matrix;

        public _lightSources = new Array<Light>();

        public get _positions(): Nullable<Vector3[]> {
            return null;
        }

        // Loading properties
        public _waitingActions: any;
        public _waitingFreezeWorldMatrix: Nullable<boolean>;

        // Skeleton
        private _skeleton: Nullable<Skeleton>;
        public _bonesTransformMatrices: Nullable<Float32Array>;

        public set skeleton(value: Nullable<Skeleton>) {
            if (this._skeleton && this._skeleton.needInitialSkinMatrix) {
                this._skeleton._unregisterMeshWithPoseMatrix(this);
            }

            if (value && value.needInitialSkinMatrix) {
                value._registerMeshWithPoseMatrix(this);
            }

            this._skeleton = value;

            if (!this._skeleton) {
                this._bonesTransformMatrices = null;
            }

            this._markSubMeshesAsAttributesDirty();
        }

        public get skeleton(): Nullable<Skeleton> {
            return this._skeleton;
        }

        // Constructor
        constructor(name: string, scene: Scene) {
            super(name, scene);

            this.getScene().addMesh(this);

            this._resyncLightSources();
        }

        /**
         * Boolean : true if the mesh has been disposed.  
         */
        public isDisposed(): boolean {
            return this._isDisposed;
        }

        /**
         * Returns the string "AbstractMesh"
         */
        public getClassName(): string {
            return "AbstractMesh";
        }

        /**
         * @param {boolean} fullDetails - support for multiple levels of logging within scene loading
         */
        public toString(fullDetails?: boolean): string {
            var ret = "Name: " + this.name + ", isInstance: " + (this instanceof InstancedMesh ? "YES" : "NO");
            ret += ", # of submeshes: " + (this.subMeshes ? this.subMeshes.length : 0);
            if (this._skeleton) {
                ret += ", skeleton: " + this._skeleton.name;
            }
            if (fullDetails) {
                ret += ", billboard mode: " + (["NONE", "X", "Y", null, "Z", null, null, "ALL"])[this.billboardMode];
                ret += ", freeze wrld mat: " + (this._isWorldMatrixFrozen || this._waitingFreezeWorldMatrix ? "YES" : "NO");
            }
            return ret;
        }

        public _rebuild(): void {
            if (this._occlusionQuery) {
                this._occlusionQuery = null;
            }

            if (this._edgesRenderer) {
                this._edgesRenderer._rebuild();
            }

            if (!this.subMeshes) {
                return;
            }
            
            for (var subMesh of this.subMeshes) {
                subMesh._rebuild();
            }
        }

        public _resyncLightSources(): void {
            this._lightSources.length = 0;

            for (var light of this.getScene().lights) {
                if (!light.isEnabled()) {
                    continue;
                }

                if (light.canAffectMesh(this)) {
                    this._lightSources.push(light);
                }
            }

            this._markSubMeshesAsLightDirty();
        }

        public _resyncLighSource(light: Light): void {
            var isIn = light.isEnabled() && light.canAffectMesh(this);

            var index = this._lightSources.indexOf(light);

            if (index === -1) {
                if (!isIn) {
                    return;
                }
                this._lightSources.push(light);
            } else {
                if (isIn) {
                    return;
                }
                this._lightSources.splice(index, 1);
            }

            this._markSubMeshesAsLightDirty();
        }

        public _removeLightSource(light: Light): void {
            var index = this._lightSources.indexOf(light);

            if (index === -1) {
                return;
            }
            this._lightSources.splice(index, 1);
        }

        private _markSubMeshesAsDirty(func: (defines: MaterialDefines) => void) {
            if (!this.subMeshes) {
                return;
            }

            for (var subMesh of this.subMeshes) {
                if (subMesh._materialDefines) {
                    func(subMesh._materialDefines);
                }
            }
        }

        public _markSubMeshesAsLightDirty() {
            this._markSubMeshesAsDirty(defines => defines.markAsLightDirty());
        }

        public _markSubMeshesAsAttributesDirty() {
            this._markSubMeshesAsDirty(defines => defines.markAsAttributesDirty());
        }

        public _markSubMeshesAsMiscDirty() {
            if (!this.subMeshes) {
                return;
            }

            for (var subMesh of this.subMeshes) {
                var material = subMesh.getMaterial();
                if (material) {
                    material.markAsDirty(Material.MiscDirtyFlag);
                }
            }
        }

        /**
         * Rotation property : a Vector3 depicting the rotation value in radians around each local axis X, Y, Z. 
         * If rotation quaternion is set, this Vector3 will (almost always) be the Zero vector!
         * Default : (0.0, 0.0, 0.0)
         */
        public get rotation(): Vector3 {
            return this._rotation;
        }

        public set rotation(newRotation: Vector3) {
            this._rotation = newRotation;
        }

        /**
         * Scaling property : a Vector3 depicting the mesh scaling along each local axis X, Y, Z.  
         * Default : (1.0, 1.0, 1.0)
         */
        public get scaling(): Vector3 {
            return this._scaling;
        }

        public set scaling(newScaling: Vector3) {
            this._scaling = newScaling;
            if (this.physicsImpostor) {
                this.physicsImpostor.forceUpdate();
            }
        }

        /**
         * Rotation Quaternion property : this a Quaternion object depicting the mesh rotation by using a unit quaternion. 
         * It's null by default.  
         * If set, only the rotationQuaternion is then used to compute the mesh rotation and its property `.rotation\ is then ignored and set to (0.0, 0.0, 0.0)
         */
        public get rotationQuaternion(): Nullable<Quaternion> {
            return this._rotationQuaternion;
        }

        public set rotationQuaternion(quaternion: Nullable<Quaternion>) {
            this._rotationQuaternion = quaternion;
            //reset the rotation vector. 
            if (quaternion && this.rotation.length()) {
                this.rotation.copyFromFloats(0.0, 0.0, 0.0);
            }
        }

        // Methods
        /**
         * Copies the paramater passed Matrix into the mesh Pose matrix.  
         * Returns the AbstractMesh.  
         */
        public updatePoseMatrix(matrix: Matrix): AbstractMesh {
            this._poseMatrix.copyFrom(matrix);
            return this;
        }

        /**
         * Returns the mesh Pose matrix.  
         * Returned object : Matrix
         */
        public getPoseMatrix(): Matrix {
            return this._poseMatrix;
        }

        /**
         * Disables the mesh edger rendering mode.  
         * Returns the AbstractMesh.  
         */
        public disableEdgesRendering(): AbstractMesh {
            if (this._edgesRenderer) {
                this._edgesRenderer.dispose();
                this._edgesRenderer = null;
            }
            return this;
        }
        /**
         * Enables the edge rendering mode on the mesh.  
         * This mode makes the mesh edges visible.  
         * Returns the AbstractMesh.  
         */
        public enableEdgesRendering(epsilon = 0.95, checkVerticesInsteadOfIndices = false): AbstractMesh {
            this.disableEdgesRendering();
            this._edgesRenderer = new EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
            return this;
        }

        /**
         * Returns true if the mesh is blocked. Used by the class Mesh.
         * Returns the boolean `false` by default.  
         */
        public get isBlocked(): boolean {
            return false;
        }

        /**
         * Returns the mesh itself by default, used by the class Mesh.  
         * Returned type : AbstractMesh
         */
        public getLOD(camera: Camera): AbstractMesh {
            return this;
        }

        /**
         * Returns 0 by default, used by the class Mesh.  
         * Returns an integer.  
         */
        public getTotalVertices(): number {
            return 0;
        }

        /**
         * Returns null by default, used by the class Mesh. 
         * Returned type : integer array 
         */
        public getIndices(): Nullable<IndicesArray> {
            return null;
        }

        /**
         * Returns the array of the requested vertex data kind. Used by the class Mesh. Returns null here. 
         * Returned type : float array or Float32Array 
         */
        public getVerticesData(kind: string): Nullable<FloatArray> {
            return null;
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
        public setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): AbstractMesh {
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
        public updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): AbstractMesh {
            return this;
        }

        /**
         * Sets the mesh indices.  
         * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh. 
         * This method creates a new index buffer each call.  
         * Returns the Mesh.  
         */
        public setIndices(indices: IndicesArray, totalVertices: Nullable<number>): AbstractMesh {
            return this;
        }

        /** Returns false by default, used by the class Mesh.  
         *  Returns a boolean
        */
        public isVerticesDataPresent(kind: string): boolean {
            return false;
        }

        /**
         * Returns the mesh BoundingInfo object or creates a new one and returns it if undefined.
         * Returns a BoundingInfo
         */
        public getBoundingInfo(): Nullable<BoundingInfo> {
            if (this._masterMesh) {
                return this._masterMesh.getBoundingInfo();
            }

            if (!this._boundingInfo) {
                this._updateBoundingInfo();
            }
            return this._boundingInfo;
        }

        /**
         * Sets a mesh new object BoundingInfo.
         * Returns the AbstractMesh.  
         */
        public setBoundingInfo(boundingInfo: BoundingInfo): AbstractMesh {
            this._boundingInfo = boundingInfo;
            return this;
        }

        public get useBones(): boolean {
            return (<boolean>(this.skeleton && this.getScene().skeletonsEnabled && this.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) && this.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)));
        }

        public _preActivate(): void {
        }

        public _preActivateForIntermediateRendering(renderId: number): void {
        }

        public _activate(renderId: number): void {
            this._renderId = renderId;
        }

        /**
         * Returns the last update of the World matrix
         * Returns a Matrix.  
         */
        public getWorldMatrix(): Matrix {
            if (this._masterMesh) {
                return this._masterMesh.getWorldMatrix();
            }

            if (this._currentRenderId !== this.getScene().getRenderId() || !this.isSynchronized()) {
                this.computeWorldMatrix();
            }
            return this._worldMatrix;
        }

        /**
         * Returns directly the last state of the mesh World matrix. 
         * A Matrix is returned.    
         */
        public get worldMatrixFromCache(): Matrix {
            return this._worldMatrix;
        }

        /**
         * Returns the current mesh absolute position.
         * Retuns a Vector3.
         */
        public get absolutePosition(): Vector3 {
            return this._absolutePosition;
        }
        /**
         * Prevents the World matrix to be computed any longer.
         * Returns the AbstractMesh.  
         */
        public freezeWorldMatrix(): AbstractMesh {
            this._isWorldMatrixFrozen = false;  // no guarantee world is not already frozen, switch off temporarily
            this.computeWorldMatrix(true);
            this._isWorldMatrixFrozen = true;
            return this;
        }

        /**
         * Allows back the World matrix computation. 
         * Returns the AbstractMesh.  
         */
        public unfreezeWorldMatrix() {
            this._isWorldMatrixFrozen = false;
            this.computeWorldMatrix(true);
            return this;
        }

        /**
         * True if the World matrix has been frozen.  
         * Returns a boolean.  
         */
        public get isWorldMatrixFrozen(): boolean {
            return this._isWorldMatrixFrozen;
        }

        private static _rotationAxisCache = new Quaternion();
        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in the given space.  
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.  
         * The passed axis is also normalized.  
         * Returns the AbstractMesh.
         */
        public rotate(axis: Vector3, amount: number, space?: Space): AbstractMesh {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation = Vector3.Zero();
            }
            var rotationQuaternion: Quaternion;
            if (!space || (space as any) === Space.LOCAL) {
                rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, AbstractMesh._rotationAxisCache);
                this.rotationQuaternion.multiplyToRef(rotationQuaternion, this.rotationQuaternion);
            }
            else {
                if (this.parent) {
                    var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                    invertParentWorldMatrix.invert();
                    axis = Vector3.TransformNormal(axis, invertParentWorldMatrix);
                }
                rotationQuaternion = Quaternion.RotationAxisToRef(axis, amount, AbstractMesh._rotationAxisCache);
                rotationQuaternion.multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);
            }
            return this;
        }

        /**
         * Rotates the mesh around the axis vector for the passed angle (amount) expressed in radians, in world space.  
         * Note that the property `rotationQuaternion` is then automatically updated and the property `rotation` is set to (0,0,0) and no longer used.  
         * The passed axis is also normalized.  
         * Returns the AbstractMesh.
         * Method is based on http://www.euclideanspace.com/maths/geometry/affine/aroundPoint/index.htm
         */
        public rotateAround(point: Vector3, axis: Vector3, amount: number): AbstractMesh {
            axis.normalize();
            if (!this.rotationQuaternion) {
                this.rotationQuaternion = Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
                this.rotation.copyFromFloats(0, 0, 0);
            }
            point.subtractToRef(this.position, Tmp.Vector3[0]);
            Matrix.TranslationToRef(Tmp.Vector3[0].x, Tmp.Vector3[0].y, Tmp.Vector3[0].z, Tmp.Matrix[0]);
            Tmp.Matrix[0].invertToRef(Tmp.Matrix[2]);
            Matrix.RotationAxisToRef(axis, amount, Tmp.Matrix[1]);
            Tmp.Matrix[2].multiplyToRef(Tmp.Matrix[1], Tmp.Matrix[2]);
            Tmp.Matrix[2].multiplyToRef(Tmp.Matrix[0], Tmp.Matrix[2]);

            Tmp.Matrix[2].decompose(Tmp.Vector3[0], Tmp.Quaternion[0], Tmp.Vector3[1]);

            this.position.addInPlace(Tmp.Vector3[1]);
            Tmp.Quaternion[0].multiplyToRef(this.rotationQuaternion, this.rotationQuaternion);

            return this;
        }

        /**
         * Translates the mesh along the axis vector for the passed distance in the given space.  
         * space (default LOCAL) can be either BABYLON.Space.LOCAL, either BABYLON.Space.WORLD.
         * Returns the AbstractMesh.
         */
        public translate(axis: Vector3, distance: number, space?: Space): AbstractMesh {
            var displacementVector = axis.scale(distance);
            if (!space || (space as any) === Space.LOCAL) {
                var tempV3 = this.getPositionExpressedInLocalSpace().add(displacementVector);
                this.setPositionWithLocalVector(tempV3);
            }
            else {
                this.setAbsolutePosition(this.getAbsolutePosition().add(displacementVector));
            }
            return this;
        }

        /**
         * Adds a rotation step to the mesh current rotation.  
         * x, y, z are Euler angles expressed in radians.  
         * This methods updates the current mesh rotation, either mesh.rotation, either mesh.rotationQuaternion if it's set.  
         * This means this rotation is made in the mesh local space only.   
         * It's useful to set a custom rotation order different from the BJS standard one YXZ.  
         * Example : this rotates the mesh first around its local X axis, then around its local Z axis, finally around its local Y axis.  
         * ```javascript
         * mesh.addRotation(x1, 0, 0).addRotation(0, 0, z2).addRotation(0, 0, y3);
         * ```
         * Note that `addRotation()` accumulates the passed rotation values to the current ones and computes the .rotation or .rotationQuaternion updated values.  
         * Under the hood, only quaternions are used. So it's a little faster is you use .rotationQuaternion because it doesn't need to translate them back to Euler angles.   
         * Returns the AbstractMesh.  
         */
        public addRotation(x: number, y: number, z: number): AbstractMesh {
            var rotationQuaternion;
            if (this.rotationQuaternion) {
                rotationQuaternion = this.rotationQuaternion;
            }
            else {
                rotationQuaternion = Tmp.Quaternion[1];
                Quaternion.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, rotationQuaternion);
            }
            var accumulation = BABYLON.Tmp.Quaternion[0];
            Quaternion.RotationYawPitchRollToRef(y, x, z, accumulation);
            rotationQuaternion.multiplyInPlace(accumulation);
            if (!this.rotationQuaternion) {
                rotationQuaternion.toEulerAnglesToRef(this.rotation);
            }
            return this;
        }

        /**
         * Retuns the mesh absolute position in the World.  
         * Returns a Vector3.
         */
        public getAbsolutePosition(): Vector3 {
            this.computeWorldMatrix();
            return this._absolutePosition;
        }

        /**
         * Sets the mesh absolute position in the World from a Vector3 or an Array(3).
         * Returns the AbstractMesh.  
         */
        public setAbsolutePosition(absolutePosition: Vector3): AbstractMesh {
            if (!absolutePosition) {
                return this;
            }
            var absolutePositionX;
            var absolutePositionY;
            var absolutePositionZ;
            if (absolutePosition.x === undefined) {
                if (arguments.length < 3) {
                    return this;
                }
                absolutePositionX = arguments[0];
                absolutePositionY = arguments[1];
                absolutePositionZ = arguments[2];
            }
            else {
                absolutePositionX = absolutePosition.x;
                absolutePositionY = absolutePosition.y;
                absolutePositionZ = absolutePosition.z;
            }
            if (this.parent) {
                var invertParentWorldMatrix = this.parent.getWorldMatrix().clone();
                invertParentWorldMatrix.invert();
                var worldPosition = new Vector3(absolutePositionX, absolutePositionY, absolutePositionZ);
                this.position = Vector3.TransformCoordinates(worldPosition, invertParentWorldMatrix);
            } else {
                this.position.x = absolutePositionX;
                this.position.y = absolutePositionY;
                this.position.z = absolutePositionZ;
            }
            return this;
        }

        // ================================== Point of View Movement =================================
        /**
         * Perform relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward
         * 
         * Returns the AbstractMesh.
         */
        public movePOV(amountRight: number, amountUp: number, amountForward: number): AbstractMesh {
            this.position.addInPlace(this.calcMovePOV(amountRight, amountUp, amountForward));
            return this;
        }

        /**
         * Calculate relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward.
         * @param {number} amountRight
         * @param {number} amountUp
         * @param {number} amountForward  
         * 
         * Returns a new Vector3.  
         */
        public calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3 {
            var rotMatrix = new Matrix();
            var rotQuaternion = (this.rotationQuaternion) ? this.rotationQuaternion : Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
            rotQuaternion.toRotationMatrix(rotMatrix);

            var translationDelta = Vector3.Zero();
            var defForwardMult = this.definedFacingForward ? -1 : 1;
            Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
            return translationDelta;
        }
        // ================================== Point of View Rotation =================================
        /**
         * Perform relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         * 
         * Returns the AbstractMesh.  
         */
        public rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): AbstractMesh {
            this.rotation.addInPlace(this.calcRotatePOV(flipBack, twirlClockwise, tiltRight));
            return this;
        }

        /**
         * Calculate relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param {number} flipBack
         * @param {number} twirlClockwise
         * @param {number} tiltRight
         * 
         * Returns a new Vector3.
         */
        public calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3 {
            var defForwardMult = this.definedFacingForward ? 1 : -1;
            return new Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
        }

        /**
         * Sets a new pivot matrix to the mesh.  
         * Returns the AbstractMesh.
         */
        public setPivotMatrix(matrix: Matrix, postMultiplyPivotMatrix = false): AbstractMesh {
            this._pivotMatrix = matrix.clone();
            this._cache.pivotMatrixUpdated = true;
            this._postMultiplyPivotMatrix = postMultiplyPivotMatrix;

            if (this._postMultiplyPivotMatrix) {
                this._pivotMatrixInverse = Matrix.Invert(matrix);
            }
            return this;
        }

        /**
         * Returns the mesh pivot matrix.
         * Default : Identity.  
         * A Matrix is returned.  
         */
        public getPivotMatrix(): Matrix {
            return this._pivotMatrix;
        }

        public _isSynchronized(): boolean {
            if (this._isDirty) {
                return false;
            }

            if (this.billboardMode !== this._cache.billboardMode || this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE)
                return false;

            if (this._cache.pivotMatrixUpdated) {
                return false;
            }

            if (this.infiniteDistance) {
                return false;
            }

            if (!this._cache.position.equals(this.position))
                return false;

            if (this.rotationQuaternion) {
                if (!this._cache.rotationQuaternion.equals(this.rotationQuaternion))
                    return false;
            }

            if (!this._cache.rotation.equals(this.rotation))
                return false;

            if (!this._cache.scaling.equals(this.scaling))
                return false;

            return true;
        }

        public _initCache() {
            super._initCache();

            this._cache.localMatrixUpdated = false;
            this._cache.position = Vector3.Zero();
            this._cache.scaling = Vector3.Zero();
            this._cache.rotation = Vector3.Zero();
            this._cache.rotationQuaternion = new Quaternion(0, 0, 0, 0);
            this._cache.billboardMode = -1;
        }

        public markAsDirty(property: string): AbstractMesh {
            if (property === "rotation") {
                this.rotationQuaternion = null;
            }
            this._currentRenderId = Number.MAX_VALUE;
            this._isDirty = true;
            return this;
        }

        /**
         * Return the minimum and maximum world vectors of the entire hierarchy under current mesh
         */
        public getHierarchyBoundingVectors(): { min: Vector3, max: Vector3 }{
            this.computeWorldMatrix(true);

            let min: Vector3;
            let max: Vector3;
            let boundingInfo = this.getBoundingInfo();
            
            if (!this.subMeshes || !boundingInfo) {
                min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
                max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            } else {
                min = boundingInfo.boundingBox.minimumWorld;
                max = boundingInfo.boundingBox.maximumWorld;
            }

            let descendants = this.getDescendants(false);

            for (var descendant of descendants) {
                let childMesh = <AbstractMesh>descendant;

                childMesh.computeWorldMatrix(true);
                let childBoundingInfo = childMesh.getBoundingInfo();

                if (childMesh.getTotalVertices() === 0 || !childBoundingInfo) {
                    continue;
                }
                let boundingBox = childBoundingInfo.boundingBox;

                var minBox = boundingBox.minimumWorld;
                var maxBox = boundingBox.maximumWorld;

                Tools.CheckExtends(minBox, min, max);
                Tools.CheckExtends(maxBox, min, max);
            }

            return {
                min: min,
                max: max
            }
        }

        /**
         * Updates the mesh BoundingInfo object and all its children BoundingInfo objects also.  
         * Returns the AbstractMesh.  
         */
        public _updateBoundingInfo(): AbstractMesh {
            this._boundingInfo = this._boundingInfo || new BoundingInfo(this.absolutePosition, this.absolutePosition);
            this._boundingInfo.update(this.worldMatrixFromCache);
            this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
            return this;
        }

        /**
         * Update a mesh's children BoundingInfo objects only.  
         * Returns the AbstractMesh.  
         */
        public _updateSubMeshesBoundingInfo(matrix: Matrix): AbstractMesh {
            if (!this.subMeshes) {
                return this;
            }
            for (var subIndex = 0; subIndex < this.subMeshes.length; subIndex++) {
                var subMesh = this.subMeshes[subIndex];
                if (!subMesh.IsGlobal) {
                    subMesh.updateBoundingInfo(matrix);
                }
            }
            return this;
        }

        /**
         * Computes the mesh World matrix and returns it.  
         * If the mesh world matrix is frozen, this computation does nothing more than returning the last frozen values.  
         * If the parameter `force` is let to `false` (default), the current cached World matrix is returned. 
         * If the parameter `force`is set to `true`, the actual computation is done.  
         * Returns the mesh World Matrix.
         */
        public computeWorldMatrix(force?: boolean): Matrix {
            if (this._isWorldMatrixFrozen) {
                return this._worldMatrix;
            }

            if (!force && this.isSynchronized(true)) {
                this._currentRenderId = this.getScene().getRenderId();
                return this._worldMatrix;
            }

            this._cache.position.copyFrom(this.position);
            this._cache.scaling.copyFrom(this.scaling);
            this._cache.pivotMatrixUpdated = false;
            this._cache.billboardMode = this.billboardMode;
            this._currentRenderId = this.getScene().getRenderId();
            this._isDirty = false;

            // Scaling
            Matrix.ScalingToRef(this.scaling.x * this.scalingDeterminant, this.scaling.y * this.scalingDeterminant, this.scaling.z * this.scalingDeterminant, Tmp.Matrix[1]);

            // Rotation

            //rotate, if quaternion is set and rotation was used
            if (this.rotationQuaternion) {
                var len = this.rotation.length();
                if (len) {
                    this.rotationQuaternion.multiplyInPlace(BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z))
                    this.rotation.copyFromFloats(0, 0, 0);
                }
            }

            if (this.rotationQuaternion) {
                this.rotationQuaternion.toRotationMatrix(Tmp.Matrix[0]);
                this._cache.rotationQuaternion.copyFrom(this.rotationQuaternion);
            } else {
                Matrix.RotationYawPitchRollToRef(this.rotation.y, this.rotation.x, this.rotation.z, Tmp.Matrix[0]);
                this._cache.rotation.copyFrom(this.rotation);
            }

            // Translation
            let camera = (<Camera>this.getScene().activeCamera);
            
            if (this.infiniteDistance && !this.parent && camera) {

                var cameraWorldMatrix = camera.getWorldMatrix();

                var cameraGlobalPosition = new Vector3(cameraWorldMatrix.m[12], cameraWorldMatrix.m[13], cameraWorldMatrix.m[14]);

                Matrix.TranslationToRef(this.position.x + cameraGlobalPosition.x, this.position.y + cameraGlobalPosition.y,
                    this.position.z + cameraGlobalPosition.z, Tmp.Matrix[2]);
            } else {
                Matrix.TranslationToRef(this.position.x, this.position.y, this.position.z, Tmp.Matrix[2]);
            }

            // Composing transformations
            this._pivotMatrix.multiplyToRef(Tmp.Matrix[1], Tmp.Matrix[4]);
            Tmp.Matrix[4].multiplyToRef(Tmp.Matrix[0], Tmp.Matrix[5]);

            // Billboarding (testing PG:http://www.babylonjs-playground.com/#UJEIL#13)
            if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE && camera) {
                if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_ALL) !== AbstractMesh.BILLBOARDMODE_ALL) {
                    // Need to decompose each rotation here
                    var currentPosition = Tmp.Vector3[3];

                    if (this.parent && this.parent.getWorldMatrix) {
                        if (this._meshToBoneReferal) {
                            this.parent.getWorldMatrix().multiplyToRef(this._meshToBoneReferal.getWorldMatrix(), Tmp.Matrix[6]);
                            Vector3.TransformCoordinatesToRef(this.position, Tmp.Matrix[6], currentPosition);
                        } else {
                            Vector3.TransformCoordinatesToRef(this.position, this.parent.getWorldMatrix(), currentPosition);
                        }
                    } else {
                        currentPosition.copyFrom(this.position);
                    }

                    currentPosition.subtractInPlace(camera.globalPosition);

                    var finalEuler = Tmp.Vector3[4].copyFromFloats(0, 0, 0);
                    if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_X) === AbstractMesh.BILLBOARDMODE_X) {
                        finalEuler.x = Math.atan2(-currentPosition.y, currentPosition.z);
                    }

                    if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_Y) === AbstractMesh.BILLBOARDMODE_Y) {
                        finalEuler.y = Math.atan2(currentPosition.x, currentPosition.z);
                    }

                    if ((this.billboardMode & AbstractMesh.BILLBOARDMODE_Z) === AbstractMesh.BILLBOARDMODE_Z) {
                        finalEuler.z = Math.atan2(currentPosition.y, currentPosition.x);
                    }

                    Matrix.RotationYawPitchRollToRef(finalEuler.y, finalEuler.x, finalEuler.z, Tmp.Matrix[0]);
                } else {
                    Tmp.Matrix[1].copyFrom(camera.getViewMatrix());

                    Tmp.Matrix[1].setTranslationFromFloats(0, 0, 0);
                    Tmp.Matrix[1].invertToRef(Tmp.Matrix[0]);
                }

                Tmp.Matrix[1].copyFrom(Tmp.Matrix[5]);
                Tmp.Matrix[1].multiplyToRef(Tmp.Matrix[0], Tmp.Matrix[5]);
            }

            // Local world
            Tmp.Matrix[5].multiplyToRef(Tmp.Matrix[2], this._localWorld);

            // Parent
            if (this.parent && this.parent.getWorldMatrix) {
                if (this.billboardMode !== AbstractMesh.BILLBOARDMODE_NONE) {
                    if (this._meshToBoneReferal) {
                        this.parent.getWorldMatrix().multiplyToRef(this._meshToBoneReferal.getWorldMatrix(), Tmp.Matrix[6]);
                        Tmp.Matrix[5].copyFrom(Tmp.Matrix[6]);
                    } else {
                        Tmp.Matrix[5].copyFrom(this.parent.getWorldMatrix());
                    }

                    this._localWorld.getTranslationToRef(Tmp.Vector3[5]);
                    Vector3.TransformCoordinatesToRef(Tmp.Vector3[5], Tmp.Matrix[5], Tmp.Vector3[5]);
                    this._worldMatrix.copyFrom(this._localWorld);
                    this._worldMatrix.setTranslation(Tmp.Vector3[5]);

                } else {
                    if (this._meshToBoneReferal) {
                        this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), Tmp.Matrix[6]);
                        Tmp.Matrix[6].multiplyToRef(this._meshToBoneReferal.getWorldMatrix(), this._worldMatrix);
                    } else {
                        this._localWorld.multiplyToRef(this.parent.getWorldMatrix(), this._worldMatrix);
                    }
                }
                this._markSyncedWithParent();
            } else {
                this._worldMatrix.copyFrom(this._localWorld);
            }

            // Post multiply inverse of pivotMatrix
            if (this._postMultiplyPivotMatrix) {
                this._worldMatrix.multiplyToRef(this._pivotMatrixInverse, this._worldMatrix);
            }

            // Normal matrix
            if (this.scaling.isNonUniform) {
                this.nonUniformScaling = true;
            } else if (this.parent && (<AbstractMesh>this.parent)._nonUniformScaling) {
                this.nonUniformScaling = (<AbstractMesh>this.parent)._nonUniformScaling;
            } else {
                this.nonUniformScaling = false;
            }

            // Bounding info
            this._updateBoundingInfo();

            // Absolute position
            this._absolutePosition.copyFromFloats(this._worldMatrix.m[12], this._worldMatrix.m[13], this._worldMatrix.m[14]);

            // Callbacks
            this.onAfterWorldMatrixUpdateObservable.notifyObservers(this);

            if (!this._poseMatrix) {
                this._poseMatrix = Matrix.Invert(this._worldMatrix);
            }

            return this._worldMatrix;
        }

        /**
        * If you'd like to be called back after the mesh position, rotation or scaling has been updated.  
        * @param func: callback function to add
        *
        * Returns the AbstractMesh. 
        */
        public registerAfterWorldMatrixUpdate(func: (mesh: AbstractMesh) => void): AbstractMesh {
            this.onAfterWorldMatrixUpdateObservable.add(func);
            return this;
        }

        /**
         * Removes a registered callback function.  
         * Returns the AbstractMesh.
         */
        public unregisterAfterWorldMatrixUpdate(func: (mesh: AbstractMesh) => void): AbstractMesh {
            this.onAfterWorldMatrixUpdateObservable.removeCallback(func);
            return this;
        }

        /**
         * Sets the mesh position in its local space.  
         * Returns the AbstractMesh.  
         */
        public setPositionWithLocalVector(vector3: Vector3): AbstractMesh {
            this.computeWorldMatrix();
            this.position = Vector3.TransformNormal(vector3, this._localWorld);
            return this;
        }

        /**
         * Returns the mesh position in the local space from the current World matrix values.
         * Returns a new Vector3.
         */
        public getPositionExpressedInLocalSpace(): Vector3 {
            this.computeWorldMatrix();
            var invLocalWorldMatrix = this._localWorld.clone();
            invLocalWorldMatrix.invert();

            return Vector3.TransformNormal(this.position, invLocalWorldMatrix);
        }

        /**
         * Translates the mesh along the passed Vector3 in its local space.  
         * Returns the AbstractMesh. 
         */
        public locallyTranslate(vector3: Vector3): AbstractMesh {
            this.computeWorldMatrix(true);
            this.position = Vector3.TransformCoordinates(vector3, this._localWorld);
            return this;
        }

        private static _lookAtVectorCache = new Vector3(0, 0, 0);
        public lookAt(targetPoint: Vector3, yawCor: number = 0, pitchCor: number = 0, rollCor: number = 0, space: Space = Space.LOCAL): AbstractMesh {
            /// <summary>Orients a mesh towards a target point. Mesh must be drawn facing user.</summary>
            /// <param name="targetPoint" type="Vector3">The position (must be in same space as current mesh) to look at</param>
            /// <param name="yawCor" type="Number">optional yaw (y-axis) correction in radians</param>
            /// <param name="pitchCor" type="Number">optional pitch (x-axis) correction in radians</param>
            /// <param name="rollCor" type="Number">optional roll (z-axis) correction in radians</param>
            /// <returns>Mesh oriented towards targetMesh</returns>

            var dv = AbstractMesh._lookAtVectorCache;
            var pos = space === Space.LOCAL ? this.position : this.getAbsolutePosition();
            targetPoint.subtractToRef(pos, dv);
            var yaw = -Math.atan2(dv.z, dv.x) - Math.PI / 2;
            var len = Math.sqrt(dv.x * dv.x + dv.z * dv.z);
            var pitch = Math.atan2(dv.y, len);
            this.rotationQuaternion = this.rotationQuaternion || new Quaternion();
            Quaternion.RotationYawPitchRollToRef(yaw + yawCor, pitch + pitchCor, rollCor, this.rotationQuaternion);
            return this;
        }

        public attachToBone(bone: Bone, affectedMesh: AbstractMesh): AbstractMesh {
            this._meshToBoneReferal = affectedMesh;
            this.parent = bone;

            if (bone.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
            return this;
        }

        public detachFromBone(): AbstractMesh {
            if (!this.parent) {
                return this;
            }

            if (this.parent.getWorldMatrix().determinant() < 0) {
                this.scalingDeterminant *= -1;
            }
            this._meshToBoneReferal = null;
            this.parent = null;
            return this;
        }

        /**
         * Returns `true` if the mesh is within the frustum defined by the passed array of planes.  
         * A mesh is in the frustum if its bounding box intersects the frustum.  
         * Boolean returned.  
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return this._boundingInfo !== null && this._boundingInfo.isInFrustum(frustumPlanes);
        }

        /**
         * Returns `true` if the mesh is completely in the frustum defined be the passed array of planes.  
         * A mesh is completely in the frustum if its bounding box it completely inside the frustum.  
         * Boolean returned.  
         */
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return this._boundingInfo !== null && this._boundingInfo.isCompletelyInFrustum(frustumPlanes);;
        }

        /** 
         * True if the mesh intersects another mesh or a SolidParticle object.  
         * Unless the parameter `precise` is set to `true` the intersection is computed according to Axis Aligned Bounding Boxes (AABB), else according to OBB (Oriented BBoxes)
         * includeDescendants can be set to true to test if the mesh defined in parameters intersects with the current mesh or any child meshes
         * Returns a boolean.  
         */
        public intersectsMesh(mesh: AbstractMesh | SolidParticle, precise: boolean = false, includeDescendants?: boolean): boolean {
            if (!this._boundingInfo || !mesh._boundingInfo) {
                return false;
            }

            if (this._boundingInfo.intersects(mesh._boundingInfo, precise)) {
                return true;
            }

            if (includeDescendants) {
                for (var child of this.getChildMeshes()) {
                    if (child.intersectsMesh(mesh, precise, true)) {
                        return true;
                    }
                }
            }

            return false;
        }

        /**
         * Returns true if the passed point (Vector3) is inside the mesh bounding box.  
         * Returns a boolean.  
         */
        public intersectsPoint(point: Vector3): boolean {
            if (!this._boundingInfo) {
                return false;
            }

            return this._boundingInfo.intersectsPoint(point);
        }

        public getPhysicsImpostor(): Nullable<PhysicsImpostor> {
            return this.physicsImpostor;
        }

        public getPositionInCameraSpace(camera: Nullable<Camera> = null): Vector3 {
            if (!camera) {
                camera = (<Camera>this.getScene().activeCamera);
            }

            return Vector3.TransformCoordinates(this.absolutePosition, camera.getViewMatrix());
        }

        /**
         * Returns the distance from the mesh to the active camera.  
         * Returns a float.  
         */
        public getDistanceToCamera(camera: Nullable<Camera> = null): number {
            if (!camera) {
                camera = (<Camera>this.getScene().activeCamera);
            }
            return this.absolutePosition.subtract(camera.position).length();
        }

        public applyImpulse(force: Vector3, contactPoint: Vector3): AbstractMesh {
            if (!this.physicsImpostor) {
                return this;
            }
            this.physicsImpostor.applyImpulse(force, contactPoint);
            return this;
        }

        public setPhysicsLinkWith(otherMesh: Mesh, pivot1: Vector3, pivot2: Vector3, options?: any): AbstractMesh {
            if (!this.physicsImpostor || !otherMesh.physicsImpostor) {
                return this;
            }
            this.physicsImpostor.createJoint(otherMesh.physicsImpostor, PhysicsJoint.HingeJoint, {
                mainPivot: pivot1,
                connectedPivot: pivot2,
                nativeParams: options
            });
            return this;
        }

        // Collisions

        /**
         * Property checkCollisions : Boolean, whether the camera should check the collisions against the mesh.  
         * Default `false`.
         */
        public get checkCollisions(): boolean {
            return this._checkCollisions;
        }

        public set checkCollisions(collisionEnabled: boolean) {
            this._checkCollisions = collisionEnabled;
            if (this.getScene().workerCollisions) {
                this.getScene().collisionCoordinator.onMeshUpdated(this);
            }
        }

        public moveWithCollisions(displacement: Vector3): AbstractMesh {
            var globalPosition = this.getAbsolutePosition();

            globalPosition.subtractFromFloatsToRef(0, this.ellipsoid.y, 0, this._oldPositionForCollisions);
            this._oldPositionForCollisions.addInPlace(this.ellipsoidOffset);

            if (!this._collider) {
                this._collider = new Collider();
            }

            this._collider.radius = this.ellipsoid;

            this.getScene().collisionCoordinator.getNewPosition(this._oldPositionForCollisions, displacement, this._collider, 3, this, this._onCollisionPositionChange, this.uniqueId);
            return this;
        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
            //TODO move this to the collision coordinator!
            if (this.getScene().workerCollisions)
                newPosition.multiplyInPlace(this._collider.radius);

            newPosition.subtractToRef(this._oldPositionForCollisions, this._diffPositionForCollisions);

            if (this._diffPositionForCollisions.length() > Engine.CollisionsEpsilon) {
                this.position.addInPlace(this._diffPositionForCollisions);
            }

            if (collidedMesh) {
                this.onCollideObservable.notifyObservers(collidedMesh);
            }

            this.onCollisionPositionChangeObservable.notifyObservers(this.position);
        }

        // Submeshes octree

        /**
        * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.  
        * Please note that you must have a decent number of submeshes to get performance improvements when using an octree.  
        * Returns an Octree of submeshes.  
        */
        public createOrUpdateSubmeshesOctree(maxCapacity = 64, maxDepth = 2): Octree<SubMesh> {
            if (!this._submeshesOctree) {
                this._submeshesOctree = new Octree<SubMesh>(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
            }

            this.computeWorldMatrix(true);

            let boundingInfo = this.getBoundingInfo();

            // Update octree
            if (boundingInfo) {
                var bbox = boundingInfo.boundingBox;
                this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);
            }

            return this._submeshesOctree;
        }

        // Collisions
        public _collideForSubMesh(subMesh: SubMesh, transformMatrix: Matrix, collider: Collider): AbstractMesh {
            this._generatePointsArray();

            if (!this._positions) {
                return this;
            }
            
            // Transformation
            if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix.equals(transformMatrix)) {
                subMesh._lastColliderTransformMatrix = transformMatrix.clone();
                subMesh._lastColliderWorldVertices = [];
                subMesh._trianglePlanes = [];
                var start = subMesh.verticesStart;
                var end = (subMesh.verticesStart + subMesh.verticesCount);
                for (var i = start; i < end; i++) {
                    subMesh._lastColliderWorldVertices.push(Vector3.TransformCoordinates(this._positions[i], transformMatrix));
                }
            }
            // Collide
            collider._collide(subMesh._trianglePlanes, subMesh._lastColliderWorldVertices, (<IndicesArray>this.getIndices()), subMesh.indexStart, subMesh.indexStart + subMesh.indexCount, subMesh.verticesStart, !!subMesh.getMaterial());
            if (collider.collisionFound) {
                collider.collidedMesh = this;
            }
            return this;
        }

        public _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): AbstractMesh {
            var subMeshes: SubMesh[];
            var len: number;

            // Octrees
            if (this._submeshesOctree && this.useOctreeForCollisions) {
                var radius = collider.velocityWorldLength + Math.max(collider.radius.x, collider.radius.y, collider.radius.z);
                var intersections = this._submeshesOctree.intersects(collider.basePointWorld, radius);

                len = intersections.length;
                subMeshes = intersections.data;
            } else {
                subMeshes = this.subMeshes;
                len = subMeshes.length;
            }

            for (var index = 0; index < len; index++) {
                var subMesh = subMeshes[index];

                // Bounding test
                if (len > 1 && !subMesh._checkCollision(collider))
                    continue;

                this._collideForSubMesh(subMesh, transformMatrix, collider);
            }
            return this;
        }

        public _checkCollision(collider: Collider): AbstractMesh {
            // Bounding box test
            if (!this._boundingInfo || !this._boundingInfo._checkCollision(collider))
                return this;

            // Transformation matrix
            Matrix.ScalingToRef(1.0 / collider.radius.x, 1.0 / collider.radius.y, 1.0 / collider.radius.z, this._collisionsScalingMatrix);
            this.worldMatrixFromCache.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);
            this._processCollisionsForSubMeshes(collider, this._collisionsTransformMatrix);
            return this;
        }

        // Picking
        public _generatePointsArray(): boolean {
            return false;
        }

        /**
         * Checks if the passed Ray intersects with the mesh.  
         * Returns an object PickingInfo.
         */
        public intersects(ray: Ray, fastCheck?: boolean): PickingInfo {
            var pickingInfo = new PickingInfo();

            if (!this.subMeshes || !this._boundingInfo || !ray.intersectsSphere(this._boundingInfo.boundingSphere) || !ray.intersectsBox(this._boundingInfo.boundingBox)) {
                return pickingInfo;
            }

            if (!this._generatePointsArray()) {
                return pickingInfo;
            }

            var intersectInfo: Nullable<IntersectionInfo> = null;

            // Octrees
            var subMeshes: SubMesh[];
            var len: number;

            if (this._submeshesOctree && this.useOctreeForPicking) {
                var worldRay = Ray.Transform(ray, this.getWorldMatrix());
                var intersections = this._submeshesOctree.intersectsRay(worldRay);

                len = intersections.length;
                subMeshes = intersections.data;
            } else {
                subMeshes = this.subMeshes;
                len = subMeshes.length;
            }

            for (var index = 0; index < len; index++) {
                var subMesh = subMeshes[index];

                // Bounding test
                if (len > 1 && !subMesh.canIntersects(ray))
                    continue;

                var currentIntersectInfo = subMesh.intersects(ray, (<Vector3[]>this._positions), (<IndicesArray>this.getIndices()), fastCheck);

                if (currentIntersectInfo) {
                    if (fastCheck || !intersectInfo || currentIntersectInfo.distance < intersectInfo.distance) {
                        intersectInfo = currentIntersectInfo;
                        intersectInfo.subMeshId = index;

                        if (fastCheck) {
                            break;
                        }
                    }
                }
            }

            if (intersectInfo) {
                // Get picked point
                var world = this.getWorldMatrix();
                var worldOrigin = Vector3.TransformCoordinates(ray.origin, world);
                var direction = ray.direction.clone();
                direction = direction.scale(intersectInfo.distance);
                var worldDirection = Vector3.TransformNormal(direction, world);

                var pickedPoint = worldOrigin.add(worldDirection);

                // Return result
                pickingInfo.hit = true;
                pickingInfo.distance = Vector3.Distance(worldOrigin, pickedPoint);
                pickingInfo.pickedPoint = pickedPoint;
                pickingInfo.pickedMesh = this;
                pickingInfo.bu = intersectInfo.bu || 0;
                pickingInfo.bv = intersectInfo.bv || 0;
                pickingInfo.faceId = intersectInfo.faceId;
                pickingInfo.subMeshId = intersectInfo.subMeshId;
                return pickingInfo;
            }

            return pickingInfo;
        }

        /**
         * Clones the mesh, used by the class Mesh.  
         * Just returns `null` for an AbstractMesh.  
         */
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Nullable<AbstractMesh> {
            return null;
        }

        /**
         * Disposes all the mesh submeshes.  
         * Returns the AbstractMesh.  
         */
        public releaseSubMeshes(): AbstractMesh {
            if (this.subMeshes) {
                while (this.subMeshes.length) {
                    this.subMeshes[0].dispose();
                }
            } else {
                this.subMeshes = new Array<SubMesh>();
            }
            return this;
        }

        /**
         * Disposes the AbstractMesh.  
         * Some internal references are kept for further use.  
         * By default, all the mesh children are also disposed unless the parameter `doNotRecurse` is set to `true`.  
         * Returns nothing.  
         */
        public dispose(doNotRecurse?: boolean): void {
            var index: number;

            // Action manager
            if (this.actionManager) {
                this.actionManager.dispose();
                this.actionManager = null;
            }

            // Skeleton
            this.skeleton = null;

            // Animations
            this.getScene().stopAnimation(this);

            // Physics
            if (this.physicsImpostor) {
                this.physicsImpostor.dispose(/*!doNotRecurse*/);
            }

            // Intersections in progress
            for (index = 0; index < this._intersectionsInProgress.length; index++) {
                var other = this._intersectionsInProgress[index];

                var pos = other._intersectionsInProgress.indexOf(this);
                other._intersectionsInProgress.splice(pos, 1);
            }

            this._intersectionsInProgress = [];

            // Lights
            var lights = this.getScene().lights;

            lights.forEach((light: Light) => {
                var meshIndex = light.includedOnlyMeshes.indexOf(this);

                if (meshIndex !== -1) {
                    light.includedOnlyMeshes.splice(meshIndex, 1);
                }

                meshIndex = light.excludedMeshes.indexOf(this);

                if (meshIndex !== -1) {
                    light.excludedMeshes.splice(meshIndex, 1);
                }

                // Shadow generators
                var generator = light.getShadowGenerator();
                if (generator) {
                    var shadowMap = generator.getShadowMap();

                    if (shadowMap && shadowMap.renderList) {
                        meshIndex = shadowMap.renderList.indexOf(this);

                        if (meshIndex !== -1) {
                            shadowMap.renderList.splice(meshIndex, 1);
                        }
                    }
                }
            });

            // Edges
            if (this._edgesRenderer) {
                this._edgesRenderer.dispose();
                this._edgesRenderer = null;
            }

            // SubMeshes
            if (this.getClassName() !== "InstancedMesh") {
                this.releaseSubMeshes();
            }

            // Octree
            var sceneOctree = this.getScene().selectionOctree;
            if (sceneOctree) {
                var index = sceneOctree.dynamicContent.indexOf(this);

                if (index !== -1) {
                    sceneOctree.dynamicContent.splice(index, 1);
                }
            }

            // Query
            let engine = this.getScene().getEngine();
            if (this._occlusionQuery) {
                this._isOcclusionQueryInProgress = false;
                engine.deleteQuery(this._occlusionQuery);
                this._occlusionQuery = null;
            }

            // Engine
            engine.wipeCaches();

            // Remove from scene
            this.getScene().removeMesh(this);

            if (!doNotRecurse) {
                // Particles
                for (index = 0; index < this.getScene().particleSystems.length; index++) {
                    if (this.getScene().particleSystems[index].emitter === this) {
                        this.getScene().particleSystems[index].dispose();
                        index--;
                    }
                }

                // Children
                var objects = this.getDescendants(true);
                for (index = 0; index < objects.length; index++) {
                    objects[index].dispose();
                }
            } else {
                var childMeshes = this.getChildMeshes(true);
                for (index = 0; index < childMeshes.length; index++) {
                    var child = childMeshes[index];
                    child.parent = null;
                    child.computeWorldMatrix(true);
                }
            }

            // facet data
            if (this._facetDataEnabled) {
                this.disableFacetData();
            }

            this.onAfterWorldMatrixUpdateObservable.clear();
            this.onCollideObservable.clear();
            this.onCollisionPositionChangeObservable.clear();

            this._isDisposed = true;

            super.dispose();
        }

        /**
         * Returns a new Vector3 what is the localAxis, expressed in the mesh local space, rotated like the mesh.  
         * This Vector3 is expressed in the World space.  
         */
        public getDirection(localAxis: Vector3): Vector3 {
            var result = Vector3.Zero();

            this.getDirectionToRef(localAxis, result);

            return result;
        }

        /**
         * Sets the Vector3 "result" as the rotated Vector3 "localAxis" in the same rotation than the mesh.
         * localAxis is expressed in the mesh local space.
         * result is computed in the Wordl space from the mesh World matrix.  
         * Returns the AbstractMesh.  
         */
        public getDirectionToRef(localAxis: Vector3, result: Vector3): AbstractMesh {
            Vector3.TransformNormalToRef(localAxis, this.getWorldMatrix(), result);
            return this;
        }

        public setPivotPoint(point: Vector3, space: Space = Space.LOCAL): AbstractMesh {

            if (this.getScene().getRenderId() == 0) {
                this.computeWorldMatrix(true);
            }

            var wm = this.getWorldMatrix();

            if (space == Space.WORLD) {
                var tmat = Tmp.Matrix[0];
                wm.invertToRef(tmat);
                point = Vector3.TransformCoordinates(point, tmat);
            }

            Vector3.TransformCoordinatesToRef(point, wm, this.position);
            this._pivotMatrix.m[12] = -point.x;
            this._pivotMatrix.m[13] = -point.y;
            this._pivotMatrix.m[14] = -point.z;
            this._cache.pivotMatrixUpdated = true;
            return this;
        }

        /**
         * Returns a new Vector3 set with the mesh pivot point coordinates in the local space.  
         */
        public getPivotPoint(): Vector3 {
            var point = Vector3.Zero();
            this.getPivotPointToRef(point);
            return point;
        }

        /**
         * Sets the passed Vector3 "result" with the coordinates of the mesh pivot point in the local space.   
         * Returns the AbstractMesh.   
         */
        public getPivotPointToRef(result: Vector3): AbstractMesh {
            result.x = -this._pivotMatrix.m[12];
            result.y = -this._pivotMatrix.m[13];
            result.z = -this._pivotMatrix.m[14];
            return this;
        }

        /**
         * Returns a new Vector3 set with the mesh pivot point World coordinates.  
         */
        public getAbsolutePivotPoint(): Vector3 {
            var point = Vector3.Zero();
            this.getAbsolutePivotPointToRef(point);
            return point;
        }

        /**
         * Defines the passed mesh as the parent of the current mesh.  
         * Returns the AbstractMesh.  
         */
        public setParent(mesh: Nullable<AbstractMesh>): AbstractMesh {

            var child = this;
            var parent = (<AbstractMesh>mesh);

            if (mesh == null) {

                var rotation = Tmp.Quaternion[0];
                var position = Tmp.Vector3[0];
                var scale = Tmp.Vector3[1];

                child.getWorldMatrix().decompose(scale, rotation, position);

                if (child.rotationQuaternion) {
                    child.rotationQuaternion.copyFrom(rotation);
                } else {
                    rotation.toEulerAnglesToRef(child.rotation);
                }

                child.position.x = position.x;
                child.position.y = position.y;
                child.position.z = position.z;

            } else {

                var position = Tmp.Vector3[0];
                var m1 = Tmp.Matrix[0];

                parent.getWorldMatrix().invertToRef(m1);
                Vector3.TransformCoordinatesToRef(child.position, m1, position);

                child.position.copyFrom(position);
            }
            child.parent = parent;
            return this;
        }

        /**
         * Adds the passed mesh as a child to the current mesh.  
         * Returns the AbstractMesh.  
         */
        public addChild(mesh: AbstractMesh): AbstractMesh {
            mesh.setParent(this);
            return this;
        }

        /**
         * Removes the passed mesh from the current mesh children list.  
         * Returns the AbstractMesh.  
         */
        public removeChild(mesh: AbstractMesh): AbstractMesh {
            mesh.setParent(null);
            return this;
        }

        /**
         * Sets the Vector3 "result" coordinates with the mesh pivot point World coordinates.  
         * Returns the AbstractMesh.  
         */
        public getAbsolutePivotPointToRef(result: Vector3): AbstractMesh {
            result.x = this._pivotMatrix.m[12];
            result.y = this._pivotMatrix.m[13];
            result.z = this._pivotMatrix.m[14];
            this.getPivotPointToRef(result);
            Vector3.TransformCoordinatesToRef(result, this.getWorldMatrix(), result);
            return this;
        }

        // Facet data
        /** 
         *  Initialize the facet data arrays : facetNormals, facetPositions and facetPartitioning.   
         * Returns the AbstractMesh.  
         */
        private _initFacetData(): AbstractMesh {
            if (!this._facetNormals) {
                this._facetNormals = new Array<Vector3>();
            }
            if (!this._facetPositions) {
                this._facetPositions = new Array<Vector3>();
            }
            if (!this._facetPartitioning) {
                this._facetPartitioning = new Array<number[]>();
            }
            this._facetNb = (<IndicesArray>this.getIndices()).length / 3;
            this._partitioningSubdivisions = (this._partitioningSubdivisions) ? this._partitioningSubdivisions : 10;   // default nb of partitioning subdivisions = 10
            this._partitioningBBoxRatio = (this._partitioningBBoxRatio) ? this._partitioningBBoxRatio : 1.01;          // default ratio 1.01 = the partitioning is 1% bigger than the bounding box
            for (var f = 0; f < this._facetNb; f++) {
                this._facetNormals[f] = Vector3.Zero();
                this._facetPositions[f] = Vector3.Zero();
            }
            this._facetDataEnabled = true;
            return this;
        }

        /**
         * Updates the mesh facetData arrays and the internal partitioning when the mesh is morphed or updated.  
         * This method can be called within the render loop.  
         * You don't need to call this method by yourself in the render loop when you update/morph a mesh with the methods CreateXXX() as they automatically manage this computation.   
         * Returns the AbstractMesh.  
         */
        public updateFacetData(): AbstractMesh {
            if (!this._facetDataEnabled) {
                this._initFacetData();
            }
            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            var indices = this.getIndices();
            var normals = this.getVerticesData(VertexBuffer.NormalKind);
            var bInfo = this.getBoundingInfo();

            if (!bInfo) {
                return this;
            }

            this._bbSize.x = (bInfo.maximum.x - bInfo.minimum.x > Epsilon) ? bInfo.maximum.x - bInfo.minimum.x : Epsilon;
            this._bbSize.y = (bInfo.maximum.y - bInfo.minimum.y > Epsilon) ? bInfo.maximum.y - bInfo.minimum.y : Epsilon;
            this._bbSize.z = (bInfo.maximum.z - bInfo.minimum.z > Epsilon) ? bInfo.maximum.z - bInfo.minimum.z : Epsilon;
            var bbSizeMax = (this._bbSize.x > this._bbSize.y) ? this._bbSize.x : this._bbSize.y;
            bbSizeMax = (bbSizeMax > this._bbSize.z) ? bbSizeMax : this._bbSize.z;
            this._subDiv.max = this._partitioningSubdivisions;
            this._subDiv.X = Math.floor(this._subDiv.max * this._bbSize.x / bbSizeMax);   // adjust the number of subdivisions per axis
            this._subDiv.Y = Math.floor(this._subDiv.max * this._bbSize.y / bbSizeMax);   // according to each bbox size per axis
            this._subDiv.Z = Math.floor(this._subDiv.max * this._bbSize.z / bbSizeMax);
            this._subDiv.X = this._subDiv.X < 1 ? 1 : this._subDiv.X;                     // at least one subdivision
            this._subDiv.Y = this._subDiv.Y < 1 ? 1 : this._subDiv.Y;
            this._subDiv.Z = this._subDiv.Z < 1 ? 1 : this._subDiv.Z;
            // set the parameters for ComputeNormals()
            this._facetParameters.facetNormals = this.getFacetLocalNormals();
            this._facetParameters.facetPositions = this.getFacetLocalPositions();
            this._facetParameters.facetPartitioning = this.getFacetLocalPartitioning();
            this._facetParameters.bInfo = bInfo;
            this._facetParameters.bbSize = this._bbSize;
            this._facetParameters.subDiv = this._subDiv;
            this._facetParameters.ratio = this.partitioningBBoxRatio;
            VertexData.ComputeNormals(positions, indices, normals, this._facetParameters);

            return this;
        }
        /**
         * Returns the facetLocalNormals array.  
         * The normals are expressed in the mesh local space.  
         */
        public getFacetLocalNormals(): Vector3[] {
            if (!this._facetNormals) {
                this.updateFacetData();
            }
            return this._facetNormals;
        }
        /**
         * Returns the facetLocalPositions array.  
         * The facet positions are expressed in the mesh local space.  
         */
        public getFacetLocalPositions(): Vector3[] {
            if (!this._facetPositions) {
                this.updateFacetData();
            }
            return this._facetPositions;
        }
        /**
         * Returns the facetLocalPartioning array.
         */
        public getFacetLocalPartitioning(): number[][] {
            if (!this._facetPartitioning) {
                this.updateFacetData();
            }
            return this._facetPartitioning;
        }
        /**
         * Returns the i-th facet position in the world system.  
         * This method allocates a new Vector3 per call.  
         */
        public getFacetPosition(i: number): Vector3 {
            var pos = Vector3.Zero();
            this.getFacetPositionToRef(i, pos);
            return pos;
        }
        /**
         * Sets the reference Vector3 with the i-th facet position in the world system.  
         * Returns the AbstractMesh.  
         */
        public getFacetPositionToRef(i: number, ref: Vector3): AbstractMesh {
            var localPos = (this.getFacetLocalPositions())[i];
            var world = this.getWorldMatrix();
            Vector3.TransformCoordinatesToRef(localPos, world, ref);
            return this;
        }
        /**
         * Returns the i-th facet normal in the world system.  
         * This method allocates a new Vector3 per call.  
         */
        public getFacetNormal(i: number): Vector3 {
            var norm = Vector3.Zero();
            this.getFacetNormalToRef(i, norm);
            return norm;
        }
        /**
         * Sets the reference Vector3 with the i-th facet normal in the world system.  
         * Returns the AbstractMesh.  
         */
        public getFacetNormalToRef(i: number, ref: Vector3) {
            var localNorm = (this.getFacetLocalNormals())[i];
            Vector3.TransformNormalToRef(localNorm, this.getWorldMatrix(), ref);
            return this;
        }
        /** 
         * Returns the facets (in an array) in the same partitioning block than the one the passed coordinates are located (expressed in the mesh local system).
         */
        public getFacetsAtLocalCoordinates(x: number, y: number, z: number): Nullable<number[]> {
            var bInfo = this.getBoundingInfo();

            if (!bInfo) {
                return null;
            }

            var ox = Math.floor((x - bInfo.minimum.x * this._partitioningBBoxRatio) * this._subDiv.X * this._partitioningBBoxRatio / this._bbSize.x);
            var oy = Math.floor((y - bInfo.minimum.y * this._partitioningBBoxRatio) * this._subDiv.Y * this._partitioningBBoxRatio / this._bbSize.y);
            var oz = Math.floor((z - bInfo.minimum.z * this._partitioningBBoxRatio) * this._subDiv.Z * this._partitioningBBoxRatio / this._bbSize.z);
            if (ox < 0 || ox > this._subDiv.max || oy < 0 || oy > this._subDiv.max || oz < 0 || oz > this._subDiv.max) {
                return null;
            }
            return this._facetPartitioning[ox + this._subDiv.max * oy + this._subDiv.max * this._subDiv.max * oz];
        }
        /** 
         * Returns the closest mesh facet index at (x,y,z) World coordinates, null if not found.  
         * If the parameter projected (vector3) is passed, it is set as the (x,y,z) World projection on the facet.  
         * If checkFace is true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned.
         * If facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position.
         * If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position. 
         */
        public getClosestFacetAtCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace: boolean = false, facing: boolean = true): Nullable<number> {
            var world = this.getWorldMatrix();
            var invMat = Tmp.Matrix[5];
            world.invertToRef(invMat);
            var invVect = Tmp.Vector3[8];
            Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, invMat, invVect);  // transform (x,y,z) to coordinates in the mesh local space
            var closest = this.getClosestFacetAtLocalCoordinates(invVect.x, invVect.y, invVect.z, projected, checkFace, facing);
            if (projected) {
                // tranform the local computed projected vector to world coordinates
                Vector3.TransformCoordinatesFromFloatsToRef(projected.x, projected.y, projected.z, world, projected);
            }
            return closest;
        }
        /** 
         * Returns the closest mesh facet index at (x,y,z) local coordinates, null if not found.   
         * If the parameter projected (vector3) is passed, it is set as the (x,y,z) local projection on the facet.  
         * If checkFace is true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned.
         * If facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position.
         * If facing si false and checkFace is true, only the facet "turning their backs"  to (x, y, z) are returned : negative dot (x, y, z) * facet position.
         */
        public getClosestFacetAtLocalCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace: boolean = false, facing: boolean = true): Nullable<number> {
            var closest = null;
            var tmpx = 0.0;
            var tmpy = 0.0;
            var tmpz = 0.0;
            var d = 0.0;            // tmp dot facet normal * facet position
            var t0 = 0.0;
            var projx = 0.0;
            var projy = 0.0;
            var projz = 0.0;
            // Get all the facets in the same partitioning block than (x, y, z)
            var facetPositions = this.getFacetLocalPositions();
            var facetNormals = this.getFacetLocalNormals();
            var facetsInBlock = this.getFacetsAtLocalCoordinates(x, y, z);
            if (!facetsInBlock) {
                return null;
            }
            // Get the closest facet to (x, y, z)
            var shortest = Number.MAX_VALUE;            // init distance vars
            var tmpDistance = shortest;
            var fib;                                    // current facet in the block
            var norm;                                   // current facet normal
            var p0;                                     // current facet barycenter position
            // loop on all the facets in the current partitioning block
            for (var idx = 0; idx < facetsInBlock.length; idx++) {
                fib = facetsInBlock[idx];
                norm = facetNormals[fib];
                p0 = facetPositions[fib];

                d = (x - p0.x) * norm.x + (y - p0.y) * norm.y + (z - p0.z) * norm.z;
                if (!checkFace || (checkFace && facing && d >= 0.0) || (checkFace && !facing && d <= 0.0)) {
                    // compute (x,y,z) projection on the facet = (projx, projy, projz)
                    d = norm.x * p0.x + norm.y * p0.y + norm.z * p0.z;
                    t0 = -(norm.x * x + norm.y * y + norm.z * z - d) / (norm.x * norm.x + norm.y * norm.y + norm.z * norm.z);
                    projx = x + norm.x * t0;
                    projy = y + norm.y * t0;
                    projz = z + norm.z * t0;

                    tmpx = projx - x;
                    tmpy = projy - y;
                    tmpz = projz - z;
                    tmpDistance = tmpx * tmpx + tmpy * tmpy + tmpz * tmpz;             // compute length between (x, y, z) and its projection on the facet
                    if (tmpDistance < shortest) {                                      // just keep the closest facet to (x, y, z)
                        shortest = tmpDistance;
                        closest = fib;
                        if (projected) {
                            projected.x = projx;
                            projected.y = projy;
                            projected.z = projz;
                        }
                    }
                }
            }
            return closest;
        }
        /**
         * Returns the object "parameter" set with all the expected parameters for facetData computation by ComputeNormals()  
         */
        public getFacetDataParameters(): any {
            return this._facetParameters;
        }
        /** 
         * Disables the feature FacetData and frees the related memory.  
         * Returns the AbstractMesh.  
         */
        public disableFacetData(): AbstractMesh {
            if (this._facetDataEnabled) {
                this._facetDataEnabled = false;
                this._facetPositions = new Array<Vector3>();;
                this._facetNormals = new Array<Vector3>();;
                this._facetPartitioning = new Array<number[]>();;
                this._facetParameters = null;
            }
            return this;
        }

        /**
         * Creates new normals data for the mesh.
         * @param updatable.
         */
        public createNormals(updatable: boolean) {
            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            var indices = this.getIndices();
            var normals: FloatArray;

            if (this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
                normals = (<FloatArray>this.getVerticesData(VertexBuffer.NormalKind));
            } else {
                normals = [];
            }

            VertexData.ComputeNormals(positions, indices, normals, { useRightHandedSystem: this.getScene().useRightHandedSystem });
            this.setVerticesData(VertexBuffer.NormalKind, normals, updatable);
        }

        protected checkOcclusionQuery() {
            var engine = this.getEngine();

            if (engine.webGLVersion < 2 || this.occlusionType === AbstractMesh.OCCLUSION_TYPE_NONE) {
                this._isOccluded = false;
                return;
            }

            if (this.isOcclusionQueryInProgress && this._occlusionQuery) {
                
                var isOcclusionQueryAvailable = engine.isQueryResultAvailable(this._occlusionQuery);
                if (isOcclusionQueryAvailable) {
                    var occlusionQueryResult = engine.getQueryResult(this._occlusionQuery);

                    this._isOcclusionQueryInProgress = false;
                    this._occlusionInternalRetryCounter = 0;
                    this._isOccluded = occlusionQueryResult === 1 ? false : true;
                }
                else {

                    this._occlusionInternalRetryCounter++;

                    if (this.occlusionRetryCount !== -1 && this._occlusionInternalRetryCounter > this.occlusionRetryCount) {
                        this._isOcclusionQueryInProgress = false;
                        this._occlusionInternalRetryCounter = 0;

                        // if optimistic set isOccluded to false regardless of the status of isOccluded. (Render in the current render loop)
                        // if strict continue the last state of the object.
                        this._isOccluded = this.occlusionType === AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC ? false : this._isOccluded;
                    }
                    else {
                        return;
                    }

                }
            }

            var scene = this.getScene();
            var occlusionBoundingBoxRenderer = scene.getBoundingBoxRenderer();

            if (!this._occlusionQuery) {
                this._occlusionQuery = engine.createQuery();
            }

            engine.beginQuery(this.occlusionQueryAlgorithmType, this._occlusionQuery);
            occlusionBoundingBoxRenderer.renderOcclusionBoundingBox(this);
            engine.endQuery(this.occlusionQueryAlgorithmType);
            this._isOcclusionQueryInProgress = true;
        }

    }
}
