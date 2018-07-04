﻿module BABYLON {
    /**
     * Class used to store all common mesh properties
     */
    export class AbstractMesh extends TransformNode implements IDisposable, ICullable, IGetSetVerticesData {
        /** No occlusion */
        public static OCCLUSION_TYPE_NONE = 0;
        /** Occlusion set to optimisitic */
        public static OCCLUSION_TYPE_OPTIMISTIC = 1;
        /** Occlusion set to strict */
        public static OCCLUSION_TYPE_STRICT = 2;
        /** Use an accurante occlusion algorithm */
        public static OCCLUSION_ALGORITHM_TYPE_ACCURATE = 0;
        /** Use a conservative occlusion algorithm */
        public static OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE = 1;

        /**
         * No billboard
         */
        public static get BILLBOARDMODE_NONE(): number {
            return TransformNode.BILLBOARDMODE_NONE;
        }

        /** Billboard on X axis */
        public static get BILLBOARDMODE_X(): number {
            return TransformNode.BILLBOARDMODE_X;
        }

        /** Billboard on Y axis */
        public static get BILLBOARDMODE_Y(): number {
            return TransformNode.BILLBOARDMODE_Y;
        }

        /** Billboard on Z axis */
        public static get BILLBOARDMODE_Z(): number {
            return TransformNode.BILLBOARDMODE_Z;
        }

        /** Billboard on all axes */
        public static get BILLBOARDMODE_ALL(): number {
            return TransformNode.BILLBOARDMODE_ALL;
        }

        // facetData private properties
        private _facetPositions: Vector3[];             // facet local positions
        private _facetNormals: Vector3[];               // facet local normals
        private _facetPartitioning: number[][];         // partitioning array of facet index arrays
        private _facetNb: number = 0;                   // facet number
        private _partitioningSubdivisions: number = 10; // number of subdivisions per axis in the partioning space  
        private _partitioningBBoxRatio: number = 1.01;  // the partioning array space is by default 1% bigger than the bounding box
        private _facetDataEnabled: boolean = false;     // is the facet data feature enabled on this mesh ?
        private _facetParameters: any = {};             // keep a reference to the object parameters to avoid memory re-allocation
        private _bbSize: Vector3 = Vector3.Zero();      // bbox size approximated for facet data
        private _subDiv = {                             // actual number of subdivisions per axis for ComputeNormals()
            max: 1,
            X: 1,
            Y: 1,
            Z: 1
        };

        private _facetDepthSort: boolean = false;                           // is the facet depth sort to be computed
        private _facetDepthSortEnabled: boolean = false;                    // is the facet depth sort initialized
        private _depthSortedIndices: IndicesArray;                          // copy of the indices array to store them once sorted
        private _depthSortedFacets: { ind: number, sqDistance: number }[];    // array of depth sorted facets
        private _facetDepthSortFunction: (f1: { ind: number, sqDistance: number }, f2: { ind: number, sqDistance: number }) => number;  // facet depth sort function
        private _facetDepthSortFrom: Vector3;                               // location where to depth sort from
        private _facetDepthSortOrigin: Vector3;                             // same as facetDepthSortFrom but expressed in the mesh local space
        private _invertedMatrix: Matrix;                                    // Mesh inverted World Matrix

        /**
         * Gets the number of facets in the mesh
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata#what-is-a-mesh-facet
         */
        public get facetNb(): number {
            return this._facetNb;
        }
        /**
         * Gets or set the number (integer) of subdivisions per axis in the partioning space
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata#tweaking-the-partitioning
         */
        public get partitioningSubdivisions(): number {
            return this._partitioningSubdivisions;
        }
        public set partitioningSubdivisions(nb: number) {
            this._partitioningSubdivisions = nb;
        }
        /**
         * The ratio (float) to apply to the bouding box size to set to the partioning space.  
         * Ex : 1.01 (default) the partioning space is 1% bigger than the bounding box
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata#tweaking-the-partitioning
         */
        public get partitioningBBoxRatio(): number {
            return this._partitioningBBoxRatio;
        }
        public set partitioningBBoxRatio(ratio: number) {
            this._partitioningBBoxRatio = ratio;
        }

        /**
         * Gets or sets a boolean indicating that the facets must be depth sorted on next call to `updateFacetData()`.
         * Works only for updatable meshes.  
         * Doesn't work with multi-materials
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata#facet-depth-sort
         */
        public get mustDepthSortFacets(): boolean {
            return this._facetDepthSort;
        }
        public set mustDepthSortFacets(sort: boolean) {
            this._facetDepthSort = sort;
        }

        /**
         * The location (Vector3) where the facet depth sort must be computed from.  
         * By default, the active camera position.  
         * Used only when facet depth sort is enabled
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata#facet-depth-sort
         */
        public get facetDepthSortFrom(): Vector3 {
            return this._facetDepthSortFrom;
        }
        public set facetDepthSortFrom(location: Vector3) {
            this._facetDepthSortFrom = location;
        }

        /**
         * gets a boolean indicating if facetData is enabled
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata#what-is-a-mesh-facet
         */
        public get isFacetDataEnabled(): boolean {
            return this._facetDataEnabled;
        }

        /** @hidden */
        public _updateNonUniformScalingState(value: boolean): boolean {
            if (!super._updateNonUniformScalingState(value)) {
                return false;
            }
            this._markSubMeshesAsMiscDirty();
            return true;
        }

        // Events

        /**
        * An event triggered when this mesh collides with another one
        */
        public onCollideObservable = new Observable<AbstractMesh>();

        private _onCollideObserver: Nullable<Observer<AbstractMesh>>;

        /** Set a function to call when this mesh collides with another one */
        public set onCollide(callback: () => void) {
            if (this._onCollideObserver) {
                this.onCollideObservable.remove(this._onCollideObserver);
            }
            this._onCollideObserver = this.onCollideObservable.add(callback);
        }

        /**
        * An event triggered when the collision's position changes
        */
        public onCollisionPositionChangeObservable = new Observable<Vector3>();

        private _onCollisionPositionChangeObserver: Nullable<Observer<Vector3>>;
        /** Set a function to call when the collision's position changes */
        public set onCollisionPositionChange(callback: () => void) {
            if (this._onCollisionPositionChangeObserver) {
                this.onCollisionPositionChangeObservable.remove(this._onCollisionPositionChangeObserver);
            }
            this._onCollisionPositionChangeObserver = this.onCollisionPositionChangeObservable.add(callback);
        }

        /**
        * An event triggered when material is changed
        */
        public onMaterialChangedObservable = new Observable<AbstractMesh>();

        // Properties

        /**
         * Gets or sets the orientation for POV movement & rotation
         */
        public definedFacingForward = true; 

        /**
        * This property determines the type of occlusion query algorithm to run in WebGl, you can use:
        * * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_ACCURATE which is mapped to GL_ANY_SAMPLES_PASSED.
        * * AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE (Default Value) which is mapped to GL_ANY_SAMPLES_PASSED_CONSERVATIVE which is a false positive algorithm that is faster than GL_ANY_SAMPLES_PASSED but less accurate.
        * @see http://doc.babylonjs.com/features/occlusionquery
        */
        public occlusionQueryAlgorithmType = AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;

        /**
         * This property is responsible for starting the occlusion query within the Mesh or not, this property is also used to determine what should happen when the occlusionRetryCount is reached. It has supports 3 values:
         * * OCCLUSION_TYPE_NONE (Default Value): this option means no occlusion query whith the Mesh.
         * * OCCLUSION_TYPE_OPTIMISTIC: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken show the mesh.
         * * OCCLUSION_TYPE_STRICT: this option is means use occlusion query and if occlusionRetryCount is reached and the query is broken restore the last state of the mesh occlusion if the mesh was visible then show the mesh if was hidden then hide don't show.
         * @see http://doc.babylonjs.com/features/occlusionquery
         */
        public occlusionType = AbstractMesh.OCCLUSION_TYPE_NONE;

        /**
        * This number indicates the number of allowed retries before stop the occlusion query, this is useful if the occlusion query is taking long time before to the query result is retireved, the query result indicates if the object is visible within the scene or not and based on that Babylon.Js engine decideds to show or hide the object.
        * The default value is -1 which means don't break the query and wait till the result
        * @see http://doc.babylonjs.com/features/occlusionquery
        */
        public occlusionRetryCount = -1;
        private _occlusionInternalRetryCounter = 0;

        protected _isOccluded = false;

        /**
        * Gets or sets whether the mesh is occluded or not, it is used also to set the intial state of the mesh to be occluded or not
        * @see http://doc.babylonjs.com/features/occlusionquery
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
         * @see http://doc.babylonjs.com/features/occlusionquery
         */
        public get isOcclusionQueryInProgress(): boolean {
            return this._isOcclusionQueryInProgress;
        }

        private _occlusionQuery: Nullable<WebGLQuery>;

        private _visibility = 1.0;

        /**
         * Gets or sets mesh visibility between 0 and 1 (default is 1)
         */
        public get visibility(): number {
            return this._visibility;
        }

        /**
         * Gets or sets mesh visibility between 0 and 1 (default is 1)
         */        
        public set visibility(value: number) {
            if (this._visibility === value) {
                return;
            }

            this._visibility = value;
            this._markSubMeshesAsMiscDirty();
        }        

        /** Gets or sets the alpha index used to sort transparent meshes
         * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered#alpha-index
         */
        public alphaIndex = Number.MAX_VALUE;

        /**
         * Gets or sets a boolean indicating if the mesh is visible (renderable). Default is true
         */
        public isVisible = true;

        /**
         * Gets or sets a boolean indicating if the mesh can be picked (by scene.pick for instance or through actions). Default is true
         */
        public isPickable = true;

        /** Gets or sets a boolean indicating that bounding boxes of subMeshes must be rendered as well (false by default) */
        public showSubMeshesBoundingBox = false;

        /** Gets or sets a boolean indicating if the mesh must be considered as a ray blocker for lens flares (false by default)
         * @see http://doc.babylonjs.com/how_to/how_to_use_lens_flares
         */
        public isBlocker = false;

        /**
         * Gets or sets a boolean indicating that pointer move events must be supported on this mesh (false by default)
         */
        public enablePointerMoveEvents = false;

        /** 
         * Specifies the rendering group id for this mesh (0 by default) 
         * @see http://doc.babylonjs.com/resources/transparency_and_how_meshes_are_rendered#rendering-groups
         */
        public renderingGroupId = 0;
        private _material: Nullable<Material>

        /** Gets or sets current material */
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

            this._unBindEffect();
        }

        private _receiveShadows = false;

        /** 
         * Gets or sets a boolean indicating that this mesh can receive realtime shadows
         * @see http://doc.babylonjs.com/babylon101/shadows
         */
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

        /**
         * Gets or sets a boolean indicating if the outline must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#3
         */
        public renderOutline = false;
        /** Defines color to use when rendering outline */
        public outlineColor = Color3.Red();
        /** Define width to use when rendering outline */
        public outlineWidth = 0.02;

        /**
         * Gets or sets a boolean indicating if the overlay must be rendered as well
         * @see https://www.babylonjs-playground.com/#10WJ5S#2
         */        
        public renderOverlay = false;
        /** Defines color to use when rendering overlay */
        public overlayColor = Color3.Red();
        /** Defines alpha to use when rendering overlay */
        public overlayAlpha = 0.5;

        private _hasVertexAlpha = false;
        /** Gets or sets a boolean indicating that this mesh contains vertex color data with alpha values */
        public get hasVertexAlpha(): boolean {
            return this._hasVertexAlpha;
        }
        public set hasVertexAlpha(value: boolean) {
            if (this._hasVertexAlpha === value) {
                return;
            }

            this._hasVertexAlpha = value;
            this._markSubMeshesAsAttributesDirty();
            this._markSubMeshesAsMiscDirty();
        }

        private _useVertexColors = true;

        /** Gets or sets a boolean indicating that this mesh needs to use vertex color data to render (if this kind of vertex data is available in the geometry) */
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
        /**
         * Gets or sets a boolean indicating that bone animations must be computed by the CPU (false by default)
         */
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
        /** Gets or sets the number of allowed bone influences per vertex (4 by default) */
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

        /** Gets or sets a boolean indicating that this mesh will allow fog to be rendered on it (true by default) */
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

        /** Gets or sets a boolean indicating that internal octree (if available) can be used to boost submeshes selection (true by default) */
        public useOctreeForRenderingSelection = true;
        /** Gets or sets a boolean indicating that internal octree (if available) can be used to boost submeshes picking (true by default) */
        public useOctreeForPicking = true;
        /** Gets or sets a boolean indicating that internal octree (if available) can be used to boost submeshes collision (true by default) */
        public useOctreeForCollisions = true;

        private _layerMask: number = 0x0FFFFFFF;

        /**
         * Gets or sets the current layer mask (default is 0x0FFFFFFF)
         * @see http://doc.babylonjs.com/how_to/layermasks_and_multi-cam_textures
         */
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
         * True if the mesh must be rendered in any case (this will shortcut the frustum clipping phase)
         */
        public alwaysSelectAsActiveMesh = false;

        /**
         * Gets or sets the current action manager
         * @see http://doc.babylonjs.com/how_to/how_to_use_actions
         */
        public actionManager: Nullable<ActionManager> = null;

        /**
         * Gets or sets impostor used for physic simulation
         * @see http://doc.babylonjs.com/features/physics_engine
         */
        public physicsImpostor: Nullable<PhysicsImpostor> = null;

        // Collisions
        private _checkCollisions = false;
        private _collisionMask = -1;
        private _collisionGroup = -1;

        /**
         * Gets or sets the ellipsoid used to impersonate this mesh when using collision engine (default is (0.5, 1, 0.5))
         * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
         */
        public ellipsoid = new Vector3(0.5, 1, 0.5);
        /**
         * Gets or sets the ellipsoid offset used to impersonate this mesh when using collision engine (default is (0, 0, 0))
         * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
         */
        public ellipsoidOffset = new Vector3(0, 0, 0);
        private _collider: Collider;
        private _oldPositionForCollisions = new Vector3(0, 0, 0);
        private _diffPositionForCollisions = new Vector3(0, 0, 0);

        /**
         * Gets or sets a collision mask used to mask collisions (default is -1).
         * A collision between A and B will happen if A.collisionGroup & b.collisionMask !== 0
         */
        public get collisionMask(): number {
            return this._collisionMask;
        }

        public set collisionMask(mask: number) {
            this._collisionMask = !isNaN(mask) ? mask : -1;
        }

        /**
         * Gets or sets the current collision group mask (-1 by default).
         * A collision between A and B will happen if A.collisionGroup & b.collisionMask !== 0
         */        
        public get collisionGroup(): number {
            return this._collisionGroup;
        }

        public set collisionGroup(mask: number) {
            this._collisionGroup = !isNaN(mask) ? mask : -1;
        }

        // Edges
        /** 
         * Defines edge width used when edgesRenderer is enabled
         * @see https://www.babylonjs-playground.com/#10OJSG#13
         */
        public edgesWidth = 1;
        /** 
         * Defines edge color used when edgesRenderer is enabled
         * @see https://www.babylonjs-playground.com/#10OJSG#13
         */
        public edgesColor = new Color4(1, 0, 0, 1);
        /** @hidden */
        public _edgesRenderer: Nullable<EdgesRenderer>;

        // Cache
        private _collisionsTransformMatrix = Matrix.Zero();
        private _collisionsScalingMatrix = Matrix.Zero();
        /** @hidden */
        public _masterMesh: Nullable<AbstractMesh>;
        /** @hidden */
        public _boundingInfo: Nullable<BoundingInfo>;
        /** @hidden */
        public _renderId = 0;

        /** 
         * Gets or sets the list of subMeshes 
         * @see http://doc.babylonjs.com/how_to/multi_materials
         */
        public subMeshes: SubMesh[];
        /** @hidden */
        public _submeshesOctree: Octree<SubMesh>;
        /** @hidden */
        public _intersectionsInProgress = new Array<AbstractMesh>();

        /** @hidden */
        public _unIndexed = false;

        /** @hidden */
        public _lightSources = new Array<Light>();

        /** @hidden */
        public get _positions(): Nullable<Vector3[]> {
            return null;
        }

        // Loading properties
        /** @hidden */
        public _waitingActions: any;
        /** @hidden */
        public _waitingFreezeWorldMatrix: Nullable<boolean>;

        // Skeleton
        private _skeleton: Nullable<Skeleton>;
        /** @hidden */
        public _bonesTransformMatrices: Nullable<Float32Array>;

        /**
         * Gets or sets a skeleton to apply skining transformations
         * @see http://doc.babylonjs.com/how_to/how_to_use_bones_and_skeletons
         */
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

        /**
         * Creates a new AbstractMesh
         * @param name defines the name of the mesh
         * @param scene defines the hosting scene
         */
        constructor(name: string, scene: Nullable<Scene> = null) {
            super(name, scene, false);

            this.getScene().addMesh(this);

            this._resyncLightSources();
        }

        /**
         * Returns the string "AbstractMesh"
         * @returns "AbstractMesh"
         */
        public getClassName(): string {
            return "AbstractMesh";
        }

        /**
         * Gets a string representation of the current mesh 
         * @param fullDetails defines a boolean indicating if full details must be included
         * @returns a string representation of the current mesh
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

        /** @hidden */
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

        /** @hidden */
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

        /** @hidden */
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

        /** @hidden */
        public _unBindEffect() {
            for (var subMesh of this.subMeshes) {
                subMesh.setEffect(null);
            }
        }        

        /** @hidden */
        public _removeLightSource(light: Light): void {
            var index = this._lightSources.indexOf(light);

            if (index === -1) {
                return;
            }
            this._lightSources.splice(index, 1);

            this._markSubMeshesAsLightDirty();
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

        /** @hidden */
        public _markSubMeshesAsLightDirty() {
            this._markSubMeshesAsDirty(defines => defines.markAsLightDirty());
        }

        /** @hidden */
        public _markSubMeshesAsAttributesDirty() {
            this._markSubMeshesAsDirty(defines => defines.markAsAttributesDirty());
        }

        /** @hidden */
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
        * Gets or sets a Vector3 depicting the mesh scaling along each local axis X, Y, Z.  Default is (1.0, 1.0, 1.0)
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

        // Methods

        /**
         * Disables the mesh edge rendering mode
         * @returns the currentAbstractMesh
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
         * This mode makes the mesh edges visible
         * @param epsilon defines the maximal distance between two angles to detect a face
         * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
         * @returns the currentAbstractMesh 
         * @see https://www.babylonjs-playground.com/#19O9TU#0
         */
        public enableEdgesRendering(epsilon = 0.95, checkVerticesInsteadOfIndices = false): AbstractMesh {
            this.disableEdgesRendering();
            this._edgesRenderer = new EdgesRenderer(this, epsilon, checkVerticesInsteadOfIndices);
            return this;
        }

        /**
         * Gets the edgesRenderer associated with the mesh
         */
        public get edgesRenderer(): Nullable<EdgesRenderer> {
            return this._edgesRenderer;
        }

        /**
         * Returns true if the mesh is blocked. Implemented by child classes
         */
        public get isBlocked(): boolean {
            return false;
        }

        /**
         * Returns the mesh itself by default. Implemented by child classes 
         * @param camera defines the camera to use to pick the right LOD level
         * @returns the currentAbstractMesh 
         */
        public getLOD(camera: Camera): Nullable<AbstractMesh> {
            return this;
        }

        /**
         * Returns 0 by default. Implemented by child classes  
         * @returns an integer
         */
        public getTotalVertices(): number {
            return 0;
        }

        /**
         * Returns null by default. Implemented by child classes  
         * @returns null
         */
        public getIndices(): Nullable<IndicesArray> {
            return null;
        }

        /**
         * Returns the array of the requested vertex data kind. Implemented by child classes  
         * @param kind defines the vertex data kind to use
         * @returns null
         */
        public getVerticesData(kind: string): Nullable<FloatArray> {
            return null;
        }

        /**
         * Sets the vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.  
         * Note that a new underlying VertexBuffer object is created each call. 
         * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed. 
         * @param kind defines vertex data kind:
         * * BABYLON.VertexBuffer.PositionKind
         * * BABYLON.VertexBuffer.UVKind
         * * BABYLON.VertexBuffer.UV2Kind
         * * BABYLON.VertexBuffer.UV3Kind
         * * BABYLON.VertexBuffer.UV4Kind
         * * BABYLON.VertexBuffer.UV5Kind
         * * BABYLON.VertexBuffer.UV6Kind
         * * BABYLON.VertexBuffer.ColorKind
         * * BABYLON.VertexBuffer.MatricesIndicesKind
         * * BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * * BABYLON.VertexBuffer.MatricesWeightsKind
         * * BABYLON.VertexBuffer.MatricesWeightsExtraKind  
         * @param data defines the data source
         * @param updatable defines if the data must be flagged as updatable (or static)
         * @param stride defines the vertex stride (size of an entire vertex). Can be null and in this case will be deduced from vertex data kind
         * @returns the current mesh
         */
        public setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): AbstractMesh {
            return this;
        }

        /**
         * Updates the existing vertex data of the mesh geometry for the requested `kind`.
         * If the mesh has no geometry, it is simply returned as it is.  
         * @param kind defines vertex data kind:
         * * BABYLON.VertexBuffer.PositionKind
         * * BABYLON.VertexBuffer.UVKind
         * * BABYLON.VertexBuffer.UV2Kind
         * * BABYLON.VertexBuffer.UV3Kind
         * * BABYLON.VertexBuffer.UV4Kind
         * * BABYLON.VertexBuffer.UV5Kind
         * * BABYLON.VertexBuffer.UV6Kind
         * * BABYLON.VertexBuffer.ColorKind
         * * BABYLON.VertexBuffer.MatricesIndicesKind
         * * BABYLON.VertexBuffer.MatricesIndicesExtraKind
         * * BABYLON.VertexBuffer.MatricesWeightsKind
         * * BABYLON.VertexBuffer.MatricesWeightsExtraKind  
         * @param data defines the data source
         * @param updateExtends If `kind` is `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed
         * @param makeItUnique If true, a new global geometry is created from this data and is set to the mesh
         * @returns the current mesh 
         */
        public updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): AbstractMesh {
            return this;
        }

        /**
         * Sets the mesh indices,
         * If the mesh has no geometry, a new Geometry object is created and set to the mesh. 
         * @param indices Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array)
         * @param totalVertices Defines the total number of vertices
         * @returns the current mesh  
         */
        public setIndices(indices: IndicesArray, totalVertices: Nullable<number>): AbstractMesh {
            return this;
        }

        /** 
         * Gets a boolean indicating if specific vertex data is present
         * @param kind defines the vertex data kind to use
         * @returns true is data kind is present
         */
        public isVerticesDataPresent(kind: string): boolean {
            return false;
        }

        /**
         * Returns the mesh BoundingInfo object or creates a new one and returns if it was undefined
         * @returns a BoundingInfo
         */
        public getBoundingInfo(): BoundingInfo {
            if (this._masterMesh) {
                return this._masterMesh.getBoundingInfo();
            }

            if (!this._boundingInfo) {
                // this._boundingInfo is being created here
                this._updateBoundingInfo();
            }
            // cannot be null.
            return this._boundingInfo!;
        }

        /**
         * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units)
         * @param includeDescendants Use the hierarchy's bounding box instead of the mesh's bounding box
         * @returns the current mesh
         */
        public normalizeToUnitCube(includeDescendants = true): AbstractMesh {
            let boundingVectors = this.getHierarchyBoundingVectors(includeDescendants);
            let sizeVec = boundingVectors.max.subtract(boundingVectors.min);
            let maxDimension = Math.max(sizeVec.x, sizeVec.y, sizeVec.z);

            if (maxDimension === 0) {
                return this;
            }

            let scale = 1 / maxDimension;

            this.scaling.scaleInPlace(scale);

            return this;
        }

        /**
         * Overwrite the current bounding info
         * @param boundingInfo defines the new bounding info
         * @returns the current mesh 
         */
        public setBoundingInfo(boundingInfo: BoundingInfo): AbstractMesh {
            this._boundingInfo = boundingInfo;
            return this;
        }

        /** Gets a boolean indicating if this mesh has skinning data and an attached skeleton */
        public get useBones(): boolean {
            return (<boolean>(this.skeleton && this.getScene().skeletonsEnabled && this.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) && this.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind)));
        }

        /** @hidden */
        public _preActivate(): void {
        }

        /** @hidden */
        public _preActivateForIntermediateRendering(renderId: number): void {
        }

        /** @hidden */
        public _activate(renderId: number): void {
            this._renderId = renderId;
        }

        /**
         * Gets the current world matrix
         * @returns a Matrix
         */
        public getWorldMatrix(): Matrix {
            if (this._masterMesh) {
                return this._masterMesh.getWorldMatrix();
            }

            return super.getWorldMatrix();
        }

        /** @hidden */
        public _getWorldMatrixDeterminant(): number {
            if (this._masterMesh) {
                return this._masterMesh._getWorldMatrixDeterminant();
            }

            return super._getWorldMatrixDeterminant();
        }

        // ================================== Point of View Movement =================================
        
        /**
         * Perform relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward
         * @param amountRight defines the distance on the right axis
         * @param amountUp defines the distance on the up axis
         * @param amountForward defines the distance on the forward axis
         * @returns the current mesh 
         */
        public movePOV(amountRight: number, amountUp: number, amountForward: number): AbstractMesh {
            this.position.addInPlace(this.calcMovePOV(amountRight, amountUp, amountForward));
            return this;
        }

        /**
         * Calculate relative position change from the point of view of behind the front of the mesh.
         * This is performed taking into account the meshes current rotation, so you do not have to care.
         * Supports definition of mesh facing forward or backward
         * @param amountRight defines the distance on the right axis
         * @param amountUp defines the distance on the up axis
         * @param amountForward defines the distance on the forward axis
         * @returns the new displacement vector 
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
         * Supports definition of mesh facing forward or backward
         * @param flipBack defines the flip
         * @param twirlClockwise defines the twirl
         * @param tiltRight defines the tilt
         * @returns the current mesh  
         */
        public rotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): AbstractMesh {
            this.rotation.addInPlace(this.calcRotatePOV(flipBack, twirlClockwise, tiltRight));
            return this;
        }

        /**
         * Calculate relative rotation change from the point of view of behind the front of the mesh.
         * Supports definition of mesh facing forward or backward.
         * @param flipBack defines the flip
         * @param twirlClockwise defines the twirl
         * @param tiltRight defines the tilt
         * @returns the new rotation vector
         */
        public calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3 {
            var defForwardMult = this.definedFacingForward ? 1 : -1;
            return new Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
        }

        /**
         * Return the minimum and maximum world vectors of the entire hierarchy under current mesh
         * @param includeDescendants Include bounding info from descendants as well (true by default)
         * @param predicate defines a callback function that can be customize to filter what meshes should be included in the list used to compute the bounding vectors
         * @returns the new bounding vectors
         */
        public getHierarchyBoundingVectors(includeDescendants = true, predicate: Nullable<(abstractMesh: AbstractMesh) => boolean> = null): { min: Vector3, max: Vector3 } {
            // Ensures that all world matrix will be recomputed.
            this.getScene().incrementRenderId();

            this.computeWorldMatrix(true);

            let min: Vector3;
            let max: Vector3;
            let boundingInfo = this.getBoundingInfo();

            if (!this.subMeshes) {
                min = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
                max = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            } else {
                min = boundingInfo.boundingBox.minimumWorld;
                max = boundingInfo.boundingBox.maximumWorld;
            }

            if (includeDescendants) {
                let descendants = this.getDescendants(false);

                for (var descendant of descendants) {
                    let childMesh = <AbstractMesh>descendant;
                    childMesh.computeWorldMatrix(true);

                    // Filters meshes based on custom predicate function.
                    if (predicate && !predicate(childMesh)) {
                        continue;
                    }

                    //make sure we have the needed params to get mix and max
                    if (!childMesh.getBoundingInfo || childMesh.getTotalVertices() === 0) {
                        continue;
                    }

                    let childBoundingInfo = childMesh.getBoundingInfo();
                    let boundingBox = childBoundingInfo.boundingBox;

                    var minBox = boundingBox.minimumWorld;
                    var maxBox = boundingBox.maximumWorld;

                    Tools.CheckExtends(minBox, min, max);
                    Tools.CheckExtends(maxBox, min, max);
                }
            }

            return {
                min: min,
                max: max
            }
        }

        /** @hidden */
        public _updateBoundingInfo(): AbstractMesh {
            this._boundingInfo = this._boundingInfo || new BoundingInfo(this.absolutePosition, this.absolutePosition);
            this._boundingInfo.update(this.worldMatrixFromCache);
            this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
            return this;
        }

        /** @hidden */
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

        /** @hidden */
        protected _afterComputeWorldMatrix(): void {
            // Bounding info
            this._updateBoundingInfo();
        }

        /**
         * Returns `true` if the mesh is within the frustum defined by the passed array of planes.  
         * A mesh is in the frustum if its bounding box intersects the frustum
         * @param frustumPlanes defines the frustum to test
         * @returns true if the mesh is in the frustum planes 
         */
        public isInFrustum(frustumPlanes: Plane[]): boolean {
            return this._boundingInfo !== null && this._boundingInfo.isInFrustum(frustumPlanes);
        }

        /**
         * Returns `true` if the mesh is completely in the frustum defined be the passed array of planes.  
         * A mesh is completely in the frustum if its bounding box it completely inside the frustum.  
         * @param frustumPlanes defines the frustum to test
         * @returns true if the mesh is completely in the frustum planes 
         */
        public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
            return this._boundingInfo !== null && this._boundingInfo.isCompletelyInFrustum(frustumPlanes);
        }

        /** 
         * True if the mesh intersects another mesh or a SolidParticle object
         * @param mesh defines a target mesh or SolidParticle to test
         * @param precise Unless the parameter `precise` is set to `true` the intersection is computed according to Axis Aligned Bounding Boxes (AABB), else according to OBB (Oriented BBoxes)
         * @param includeDescendants Can be set to true to test if the mesh defined in parameters intersects with the current mesh or any child meshes
         * @returns true if there is an intersection
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
         * Returns true if the passed point (Vector3) is inside the mesh bounding box
         * @param point defines the point to test
         * @returns true if there is an intersection
         */
        public intersectsPoint(point: Vector3): boolean {
            if (!this._boundingInfo) {
                return false;
            }

            return this._boundingInfo.intersectsPoint(point);
        }

        /**
         * Gets the current physics impostor
         * @see http://doc.babylonjs.com/features/physics_engine
         * @returns a physics impostor or null
         */
        public getPhysicsImpostor(): Nullable<PhysicsImpostor> {
            return this.physicsImpostor;
        }

        /**
         * Gets the position of the current mesh in camera space
         * @param camera defines the camera to use
         * @returns a position
         */
        public getPositionInCameraSpace(camera: Nullable<Camera> = null): Vector3 {
            if (!camera) {
                camera = (<Camera>this.getScene().activeCamera);
            }

            return Vector3.TransformCoordinates(this.absolutePosition, camera.getViewMatrix());
        }

        /**
         * Returns the distance from the mesh to the active camera
         * @param camera defines the camera to use
         * @returns the distance
         */
        public getDistanceToCamera(camera: Nullable<Camera> = null): number {
            if (!camera) {
                camera = (<Camera>this.getScene().activeCamera);
            }
            return this.absolutePosition.subtract(camera.position).length();
        }

        /**
         * Apply a physic impulse to the mesh 
         * @param force defines the force to apply
         * @param contactPoint defines where to apply the force
         * @returns the current mesh
         * @see http://doc.babylonjs.com/how_to/using_the_physics_engine
         */
        public applyImpulse(force: Vector3, contactPoint: Vector3): AbstractMesh {
            if (!this.physicsImpostor) {
                return this;
            }
            this.physicsImpostor.applyImpulse(force, contactPoint);
            return this;
        }

        /**
         * Creates a physic joint between two meshes
         * @param otherMesh defines the other mesh to use
         * @param pivot1 defines the pivot to use on this mesh
         * @param pivot2 defines the pivot to use on the other mesh
         * @param options defines additional options (can be plugin dependent)
         * @returns the current mesh
         * @see https://www.babylonjs-playground.com/#0BS5U0#0
         */
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
         * Gets or sets a boolean indicating that this mesh can be used in the collision engine 
         * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
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

        /**
         * Gets Collider object used to compute collisions (not physics)
         * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
         */
        public get collider(): Collider {
            return this._collider;
        }

        /**
         * Move the mesh using collision engine
         * @see http://doc.babylonjs.com/babylon101/cameras,_mesh_collisions_and_gravity
         * @param displacement defines the requested displacement vector
         * @returns the current mesh
         */
        public moveWithCollisions(displacement: Vector3): AbstractMesh {
            var globalPosition = this.getAbsolutePosition();

            globalPosition.addToRef(this.ellipsoidOffset, this._oldPositionForCollisions);

            if (!this._collider) {
                this._collider = new Collider();
            }

            this._collider._radius = this.ellipsoid;

            this.getScene().collisionCoordinator.getNewPosition(this._oldPositionForCollisions, displacement, this._collider, 3, this, this._onCollisionPositionChange, this.uniqueId);
            return this;
        }

        private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
            //TODO move this to the collision coordinator!
            if (this.getScene().workerCollisions)
                newPosition.multiplyInPlace(this._collider._radius);

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
        * Please note that you must have a decent number of submeshes to get performance improvements when using an octree
        * @param maxCapacity defines the maximum size of each block (64 by default)
        * @param maxDepth defines the maximum depth to use (no more than 2 levels by default)
        * @returns the new octree
        * @see https://www.babylonjs-playground.com/#NA4OQ#12
        * @see http://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
        */
        public createOrUpdateSubmeshesOctree(maxCapacity = 64, maxDepth = 2): Octree<SubMesh> {
            if (!this._submeshesOctree) {
                this._submeshesOctree = new Octree<SubMesh>(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
            }

            this.computeWorldMatrix(true);

            let boundingInfo = this.getBoundingInfo();

            // Update octree
            var bbox = boundingInfo.boundingBox;
            this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);

            return this._submeshesOctree;
        }

        // Collisions
        /** @hidden */
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

        /** @hidden */
        public _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): AbstractMesh {
            var subMeshes: SubMesh[];
            var len: number;

            // Octrees
            if (this._submeshesOctree && this.useOctreeForCollisions) {
                var radius = collider._velocityWorldLength + Math.max(collider._radius.x, collider._radius.y, collider._radius.z);
                var intersections = this._submeshesOctree.intersects(collider._basePointWorld, radius);

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

        /** @hidden */
        public _checkCollision(collider: Collider): AbstractMesh {
            // Bounding box test
            if (!this._boundingInfo || !this._boundingInfo._checkCollision(collider))
                return this;

            // Transformation matrix
            Matrix.ScalingToRef(1.0 / collider._radius.x, 1.0 / collider._radius.y, 1.0 / collider._radius.z, this._collisionsScalingMatrix);
            this.worldMatrixFromCache.multiplyToRef(this._collisionsScalingMatrix, this._collisionsTransformMatrix);
            this._processCollisionsForSubMeshes(collider, this._collisionsTransformMatrix);
            return this;
        }

        // Picking
        /** @hidden */
        public _generatePointsArray(): boolean {
            return false;
        }

        /**
         * Checks if the passed Ray intersects with the mesh
         * @param ray defines the ray to use
         * @param fastCheck defines if fast mode (but less precise) must be used (false by default)
         * @returns the picking info
         * @see http://doc.babylonjs.com/babylon101/intersect_collisions_-_mesh
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
         * Clones the current mesh
         * @param name defines the mesh name
         * @param newParent defines the new mesh parent 
         * @param doNotCloneChildren defines a boolean indicating that children must not be cloned (false by default)
         * @returns the new mesh 
         */
        public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): Nullable<AbstractMesh> {
            return null;
        }

        /**
         * Disposes all the submeshes of the current meshnp
         * @returns the current mesh
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
         * Releases resources associated with this abstract mesh.
         * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
         * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
         */
        public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
            var index: number;

            // Smart Array Retainers.
            this.getScene().freeActiveMeshes();
            this.getScene().freeRenderingGroups();

            // Action manager
            if (this.actionManager !== undefined && this.actionManager !== null) {
                this.actionManager.dispose();
                this.actionManager = null;
            }

            // Skeleton
            this._skeleton = null;

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
            const sceneOctree = this.getScene().selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
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

            if (disposeMaterialAndTextures) {
                if (this.material) {
                    this.material.dispose(false, true);
                }
            }

            if (!doNotRecurse) {
                // Particles
                for (index = 0; index < this.getScene().particleSystems.length; index++) {
                    if (this.getScene().particleSystems[index].emitter === this) {
                        this.getScene().particleSystems[index].dispose();
                        index--;
                    }
                }
            }

            // facet data
            if (this._facetDataEnabled) {
                this.disableFacetData();
            }

            this.onAfterWorldMatrixUpdateObservable.clear();
            this.onCollideObservable.clear();
            this.onCollisionPositionChangeObservable.clear();

            super.dispose(doNotRecurse, disposeMaterialAndTextures);
        }

        /**
         * Adds the passed mesh as a child to the current mesh
         * @param mesh defines the child mesh
         * @returns the current mesh
         */
        public addChild(mesh: AbstractMesh): AbstractMesh {
            mesh.setParent(this);
            return this;
        }

        /**
         * Removes the passed mesh from the current mesh children list 
         * @param mesh defines the child mesh
         * @returns the current mesh
         */
        public removeChild(mesh: AbstractMesh): AbstractMesh {
            mesh.setParent(null);
            return this;
        }

        // Facet data
        /** @hidden */
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
            this._facetNb = ((<IndicesArray>this.getIndices()).length / 3) | 0;
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
         * You don't need to call this method by yourself in the render loop when you update/morph a mesh with the methods CreateXXX() as they automatically manage this computation
         * @returns the current mesh
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata
         */
        public updateFacetData(): AbstractMesh {
            if (!this._facetDataEnabled) {
                this._initFacetData();
            }
            var positions = this.getVerticesData(VertexBuffer.PositionKind);
            var indices = this.getIndices();
            var normals = this.getVerticesData(VertexBuffer.NormalKind);
            var bInfo = this.getBoundingInfo();

            if (this._facetDepthSort && !this._facetDepthSortEnabled) {
                // init arrays, matrix and sort function on first call
                this._facetDepthSortEnabled = true;
                if (indices instanceof Uint16Array) {
                    this._depthSortedIndices = new Uint16Array(indices!);
                }
                else if (indices instanceof Uint32Array) {
                    this._depthSortedIndices = new Uint32Array(indices!);
                }
                else {
                    var needs32bits = false;
                    for (var i = 0; i < indices!.length; i++) {
                        if (indices![i] > 65535) {
                            needs32bits = true;
                            break;
                        }
                    }
                    if (needs32bits) {
                        this._depthSortedIndices = new Uint32Array(indices!);
                    }
                    else {
                        this._depthSortedIndices = new Uint16Array(indices!);
                    }
                }
                this._facetDepthSortFunction = function (f1, f2) {
                    return (f2.sqDistance - f1.sqDistance);
                };
                if (!this._facetDepthSortFrom) {
                    var camera = this.getScene().activeCamera;
                    this._facetDepthSortFrom = (camera) ? camera.position : Vector3.Zero();
                }
                this._depthSortedFacets = [];
                for (var f = 0; f < this._facetNb; f++) {
                    var depthSortedFacet = { ind: f * 3, sqDistance: 0.0 };
                    this._depthSortedFacets.push(depthSortedFacet);
                }
                this._invertedMatrix = Matrix.Identity();
                this._facetDepthSortOrigin = Vector3.Zero();
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
            this._facetParameters.depthSort = this._facetDepthSort;
            if (this._facetDepthSort && this._facetDepthSortEnabled) {
                this.computeWorldMatrix(true);
                this._worldMatrix.invertToRef(this._invertedMatrix);
                Vector3.TransformCoordinatesToRef(this._facetDepthSortFrom, this._invertedMatrix, this._facetDepthSortOrigin);
                this._facetParameters.distanceTo = this._facetDepthSortOrigin;
            }
            this._facetParameters.depthSortedFacets = this._depthSortedFacets;
            VertexData.ComputeNormals(positions, indices, normals, this._facetParameters);

            if (this._facetDepthSort && this._facetDepthSortEnabled) {
                this._depthSortedFacets.sort(this._facetDepthSortFunction);
                var l = (this._depthSortedIndices.length / 3) | 0;
                for (var f = 0; f < l; f++) {
                    var sind = this._depthSortedFacets[f].ind;
                    this._depthSortedIndices[f * 3] = indices![sind];
                    this._depthSortedIndices[f * 3 + 1] = indices![sind + 1];
                    this._depthSortedIndices[f * 3 + 2] = indices![sind + 2];
                }
                this.updateIndices(this._depthSortedIndices);
            }

            return this;
        }

        /**
         * Returns the facetLocalNormals array.  
         * The normals are expressed in the mesh local spac
         * @returns an array of Vector3
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata
         */
        public getFacetLocalNormals(): Vector3[] {
            if (!this._facetNormals) {
                this.updateFacetData();
            }
            return this._facetNormals;
        }

        /**
         * Returns the facetLocalPositions array.  
         * The facet positions are expressed in the mesh local space
         * @returns an array of Vector3
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetLocalPositions(): Vector3[] {
            if (!this._facetPositions) {
                this.updateFacetData();
            }
            return this._facetPositions;
        }

        /**
         * Returns the facetLocalPartioning array
         * @returns an array of array of numbers
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetLocalPartitioning(): number[][] {
            if (!this._facetPartitioning) {
                this.updateFacetData();
            }
            return this._facetPartitioning;
        }

        /**
         * Returns the i-th facet position in the world system.  
         * This method allocates a new Vector3 per call
         * @param i defines the facet index
         * @returns a new Vector3
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetPosition(i: number): Vector3 {
            var pos = Vector3.Zero();
            this.getFacetPositionToRef(i, pos);
            return pos;
        }

        /**
         * Sets the reference Vector3 with the i-th facet position in the world system
         * @param i defines the facet index
         * @param ref defines the target vector
         * @returns the current mesh
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetPositionToRef(i: number, ref: Vector3): AbstractMesh {
            var localPos = (this.getFacetLocalPositions())[i];
            var world = this.getWorldMatrix();
            Vector3.TransformCoordinatesToRef(localPos, world, ref);
            return this;
        }

        /**
         * Returns the i-th facet normal in the world system.  
         * This method allocates a new Vector3 per call
         * @param i defines the facet index
         * @returns a new Vector3
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetNormal(i: number): Vector3 {
            var norm = Vector3.Zero();
            this.getFacetNormalToRef(i, norm);
            return norm;
        }

        /**
         * Sets the reference Vector3 with the i-th facet normal in the world system
         * @param i defines the facet index
         * @param ref defines the target vector
         * @returns the current mesh
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetNormalToRef(i: number, ref: Vector3) {
            var localNorm = (this.getFacetLocalNormals())[i];
            Vector3.TransformNormalToRef(localNorm, this.getWorldMatrix(), ref);
            return this;
        }

        /** 
         * Returns the facets (in an array) in the same partitioning block than the one the passed coordinates are located (expressed in the mesh local system)
         * @param x defines x coordinate
         * @param y defines y coordinate
         * @param z defines z coordinate
         * @returns the array of facet indexes
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetsAtLocalCoordinates(x: number, y: number, z: number): Nullable<number[]> {
            var bInfo = this.getBoundingInfo();

            var ox = Math.floor((x - bInfo.minimum.x * this._partitioningBBoxRatio) * this._subDiv.X * this._partitioningBBoxRatio / this._bbSize.x);
            var oy = Math.floor((y - bInfo.minimum.y * this._partitioningBBoxRatio) * this._subDiv.Y * this._partitioningBBoxRatio / this._bbSize.y);
            var oz = Math.floor((z - bInfo.minimum.z * this._partitioningBBoxRatio) * this._subDiv.Z * this._partitioningBBoxRatio / this._bbSize.z);
            if (ox < 0 || ox > this._subDiv.max || oy < 0 || oy > this._subDiv.max || oz < 0 || oz > this._subDiv.max) {
                return null;
            }
            return this._facetPartitioning[ox + this._subDiv.max * oy + this._subDiv.max * this._subDiv.max * oz];
        }

        /** 
         * Returns the closest mesh facet index at (x,y,z) World coordinates, null if not found
         * @param projected sets as the (x,y,z) world projection on the facet
         * @param checkFace if true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned
         * @param facing if facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position. If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position
         * @param x defines x coordinate
         * @param y defines y coordinate
         * @param z defines z coordinate
         * @returns the face index if found (or null instead)
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
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
         * Returns the closest mesh facet index at (x,y,z) local coordinates, null if not found
         * @param projected sets as the (x,y,z) local projection on the facet
         * @param checkFace if true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned
         * @param facing if facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position. If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position
         * @param x defines x coordinate
         * @param y defines y coordinate
         * @param z defines z coordinate
         * @returns the face index if found (or null instead)
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
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
         * @returns the parameters
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public getFacetDataParameters(): any {
            return this._facetParameters;
        }

        /** 
         * Disables the feature FacetData and frees the related memory
         * @returns the current mesh
         * @see http://doc.babylonjs.com/how_to/how_to_use_facetdata 
         */
        public disableFacetData(): AbstractMesh {
            if (this._facetDataEnabled) {
                this._facetDataEnabled = false;
                this._facetPositions = new Array<Vector3>();
                this._facetNormals = new Array<Vector3>();
                this._facetPartitioning = new Array<number[]>();
                this._facetParameters = null;
                this._depthSortedIndices = new Uint32Array(0);
            }
            return this;
        }

        /**
         * Updates the AbstractMesh indices array
         * @param indices defines the data source
         * @returns the current mesh
         */
        public updateIndices(indices: IndicesArray): AbstractMesh {
            return this;
        }

        /**
         * Creates new normals data for the mesh
         * @param updatable defines if the normal vertex buffer must be flagged as updatable
         * @returns the current mesh
         */
        public createNormals(updatable: boolean): AbstractMesh {
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
            return this;
        }

        /**
         * Align the mesh with a normal
         * @param normal defines the normal to use
         * @param upDirection can be used to redefined the up vector to use (will use the (0, 1, 0) by default)
         * @returns the current mesh
         */
        public alignWithNormal(normal: Vector3, upDirection?: Vector3): AbstractMesh {
            if (!upDirection) {
                upDirection = Axis.Y;
            }

            var axisX = Tmp.Vector3[0];
            var axisZ = Tmp.Vector3[1];
            Vector3.CrossToRef(upDirection, normal, axisZ);
            Vector3.CrossToRef(normal, axisZ, axisX);

            if (this.rotationQuaternion) {
                Quaternion.RotationQuaternionFromAxisToRef(axisX, normal, axisZ, this.rotationQuaternion);
            } else {
                Vector3.RotationFromAxisToRef(axisX, normal, axisZ, this.rotation);
            }
            return this;
        }

        /** @hidden */
        protected _checkOcclusionQuery() {
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

            // Todo. Move into an occlusion query component.
            var scene = this.getScene();
            if (scene.getBoundingBoxRenderer) {
               var occlusionBoundingBoxRenderer = scene.getBoundingBoxRenderer();

                if (!this._occlusionQuery) {
                    this._occlusionQuery = engine.createQuery();
                }

                engine.beginOcclusionQuery(this.occlusionQueryAlgorithmType, this._occlusionQuery);
                occlusionBoundingBoxRenderer.renderOcclusionBoundingBox(this);
                engine.endOcclusionQuery(this.occlusionQueryAlgorithmType);
                this._isOcclusionQueryInProgress = true;
            }
        }
    }
}
