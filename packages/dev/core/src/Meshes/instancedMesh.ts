import type { Nullable, FloatArray, IndicesArray } from "../types";
import type { Vector3 } from "../Maths/math.vector";
import { Matrix, TmpVectors } from "../Maths/math.vector";
import { Logger } from "../Misc/logger";
import type { Camera } from "../Cameras/camera";
import type { Node } from "../node";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import type { Material } from "../Materials/material";
import type { Skeleton } from "../Bones/skeleton";
import { DeepCopier } from "../Misc/deepCopier";
import { TransformNode } from "./transformNode";
import type { Light } from "../Lights/light";
import { VertexBuffer } from "../Buffers/buffer";
import { Tools } from "../Misc/tools";

Mesh._instancedMeshFactory = (name: string, mesh: Mesh): InstancedMesh => {
    const instance = new InstancedMesh(name, mesh);

    if (mesh.instancedBuffers) {
        instance.instancedBuffers = {};

        for (const key in mesh.instancedBuffers) {
            instance.instancedBuffers[key] = mesh.instancedBuffers[key];
        }
    }

    return instance;
};

/**
 * Creates an instance based on a source mesh.
 */
export class InstancedMesh extends AbstractMesh {
    private _sourceMesh: Mesh;
    private _currentLOD: Mesh;
    private _billboardWorldMatrix: Matrix;

    /** @internal */
    public _indexInSourceMeshInstanceArray = -1;
    /** @internal */
    public _distanceToCamera: number = 0;
    /** @internal */
    public _previousWorldMatrix: Nullable<Matrix>;

    /**
     * Creates a new InstancedMesh object from the mesh source.
     * @param name defines the name of the instance
     * @param source the mesh to create the instance from
     */
    constructor(name: string, source: Mesh) {
        super(name, source.getScene());

        source.addInstance(this);

        this._sourceMesh = source;

        this._unIndexed = source._unIndexed;

        this.position.copyFrom(source.position);
        this.rotation.copyFrom(source.rotation);
        this.scaling.copyFrom(source.scaling);

        if (source.rotationQuaternion) {
            this.rotationQuaternion = source.rotationQuaternion.clone();
        }

        this.animations = source.animations.slice();
        for (const range of source.getAnimationRanges()) {
            if (range != null) {
                this.createAnimationRange(range.name, range.from, range.to);
            }
        }

        this.infiniteDistance = source.infiniteDistance;

        this.setPivotMatrix(source.getPivotMatrix());

        this.refreshBoundingInfo(true, true);
        this._syncSubMeshes();
    }

    /**
     * @returns the string "InstancedMesh".
     */
    public getClassName(): string {
        return "InstancedMesh";
    }

    /** Gets the list of lights affecting that mesh */
    public get lightSources(): Light[] {
        return this._sourceMesh._lightSources;
    }

    public _resyncLightSources(): void {
        // Do nothing as all the work will be done by source mesh
    }

    public _resyncLightSource(): void {
        // Do nothing as all the work will be done by source mesh
    }

    public _removeLightSource(): void {
        // Do nothing as all the work will be done by source mesh
    }

    // Methods
    /**
     * If the source mesh receives shadows
     */
    public get receiveShadows(): boolean {
        return this._sourceMesh.receiveShadows;
    }

    public set receiveShadows(_value: boolean) {
        if (this._sourceMesh?.receiveShadows !== _value) {
            Tools.Warn("Setting receiveShadows on an instanced mesh has no effect");
        }
    }

    /**
     * The material of the source mesh
     */
    public get material(): Nullable<Material> {
        return this._sourceMesh.material;
    }

    public set material(_value: Nullable<Material>) {
        if (this._sourceMesh?.material !== _value) {
            Tools.Warn("Setting material on an instanced mesh has no effect");
        }
    }

    /**
     * Visibility of the source mesh
     */
    public get visibility(): number {
        return this._sourceMesh.visibility;
    }

    public set visibility(_value: number) {
        if (this._sourceMesh?.visibility !== _value) {
            Tools.Warn("Setting visibility on an instanced mesh has no effect");
        }
    }

    /**
     * Skeleton of the source mesh
     */
    public get skeleton(): Nullable<Skeleton> {
        return this._sourceMesh.skeleton;
    }

    public set skeleton(_value: Nullable<Skeleton>) {
        if (this._sourceMesh?.skeleton !== _value) {
            Tools.Warn("Setting skeleton on an instanced mesh has no effect");
        }
    }

    /**
     * Rendering ground id of the source mesh
     */
    public get renderingGroupId(): number {
        return this._sourceMesh.renderingGroupId;
    }

    public set renderingGroupId(value: number) {
        if (!this._sourceMesh || value === this._sourceMesh.renderingGroupId) {
            return;
        }

        //no-op with warning
        Logger.Warn("Note - setting renderingGroupId of an instanced mesh has no effect on the scene");
    }

    /**
     * @returns the total number of vertices (integer).
     */
    public getTotalVertices(): number {
        return this._sourceMesh ? this._sourceMesh.getTotalVertices() : 0;
    }

    /**
     * Returns a positive integer : the total number of indices in this mesh geometry.
     * @returns the number of indices or zero if the mesh has no geometry.
     */
    public getTotalIndices(): number {
        return this._sourceMesh.getTotalIndices();
    }

    /**
     * The source mesh of the instance
     */
    public get sourceMesh(): Mesh {
        return this._sourceMesh;
    }

    /**
     * Creates a new InstancedMesh object from the mesh model.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances
     * @param name defines the name of the new instance
     * @returns a new InstancedMesh
     */
    public createInstance(name: string): InstancedMesh {
        return this._sourceMesh.createInstance(name);
    }

    /**
     * Is this node ready to be used/rendered
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @returns {boolean} is it ready
     */
    public isReady(completeCheck = false): boolean {
        return this._sourceMesh.isReady(completeCheck, true);
    }

    /**
     * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
     * @param kind kind of verticies to retrieve (eg. positions, normals, uvs, etc.)
     * @param copyWhenShared If true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
     * @param forceCopy defines a boolean forcing the copy of the buffer no matter what the value of copyWhenShared is
     * @returns a float array or a Float32Array of the requested kind of data : positions, normals, uvs, etc.
     */
    public getVerticesData(kind: string, copyWhenShared?: boolean, forceCopy?: boolean): Nullable<FloatArray> {
        return this._sourceMesh.getVerticesData(kind, copyWhenShared, forceCopy);
    }

    /**
     * Sets the vertex data of the mesh geometry for the requested `kind`.
     * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
     * The `data` are either a numeric array either a Float32Array.
     * The parameter `updatable` is passed as is to the underlying Geometry object constructor (if initially none) or updater.
     * The parameter `stride` is an optional positive integer, it is usually automatically deducted from the `kind` (3 for positions or normals, 2 for UV, etc).
     * Note that a new underlying VertexBuffer object is created each call.
     * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
     *
     * Possible `kind` values :
     * - VertexBuffer.PositionKind
     * - VertexBuffer.UVKind
     * - VertexBuffer.UV2Kind
     * - VertexBuffer.UV3Kind
     * - VertexBuffer.UV4Kind
     * - VertexBuffer.UV5Kind
     * - VertexBuffer.UV6Kind
     * - VertexBuffer.ColorKind
     * - VertexBuffer.MatricesIndicesKind
     * - VertexBuffer.MatricesIndicesExtraKind
     * - VertexBuffer.MatricesWeightsKind
     * - VertexBuffer.MatricesWeightsExtraKind
     *
     * Returns the Mesh.
     * @param kind defines vertex data kind
     * @param data defines the data source
     * @param updatable defines if the data must be flagged as updatable (false as default)
     * @param stride defines the vertex stride (optional)
     * @returns the current mesh
     */
    public setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): AbstractMesh {
        if (this.sourceMesh) {
            this.sourceMesh.setVerticesData(kind, data, updatable, stride);
        }
        return this.sourceMesh;
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
     * - VertexBuffer.PositionKind
     * - VertexBuffer.UVKind
     * - VertexBuffer.UV2Kind
     * - VertexBuffer.UV3Kind
     * - VertexBuffer.UV4Kind
     * - VertexBuffer.UV5Kind
     * - VertexBuffer.UV6Kind
     * - VertexBuffer.ColorKind
     * - VertexBuffer.MatricesIndicesKind
     * - VertexBuffer.MatricesIndicesExtraKind
     * - VertexBuffer.MatricesWeightsKind
     * - VertexBuffer.MatricesWeightsExtraKind
     *
     * Returns the Mesh.
     * @param kind defines vertex data kind
     * @param data defines the data source
     * @param updateExtends defines if extends info of the mesh must be updated (can be null). This is mostly useful for "position" kind
     * @param makeItUnique defines it the updated vertex buffer must be flagged as unique (false by default)
     * @returns the source mesh
     */
    public updateVerticesData(kind: string, data: FloatArray, updateExtends?: boolean, makeItUnique?: boolean): Mesh {
        if (this.sourceMesh) {
            this.sourceMesh.updateVerticesData(kind, data, updateExtends, makeItUnique);
        }
        return this.sourceMesh;
    }

    /**
     * Sets the mesh indices.
     * Expects an array populated with integers or a typed array (Int32Array, Uint32Array, Uint16Array).
     * If the mesh has no geometry, a new Geometry object is created and set to the mesh.
     * This method creates a new index buffer each call.
     * Returns the Mesh.
     * @param indices the source data
     * @param totalVertices defines the total number of vertices referenced by indices (could be null)
     * @returns source mesh
     */
    public setIndices(indices: IndicesArray, totalVertices: Nullable<number> = null): Mesh {
        if (this.sourceMesh) {
            this.sourceMesh.setIndices(indices, totalVertices);
        }
        return this.sourceMesh;
    }

    /**
     * Boolean : True if the mesh owns the requested kind of data.
     * @param kind defines which buffer to check (positions, indices, normals, etc). Possible `kind` values :
     * - VertexBuffer.PositionKind
     * - VertexBuffer.UVKind
     * - VertexBuffer.UV2Kind
     * - VertexBuffer.UV3Kind
     * - VertexBuffer.UV4Kind
     * - VertexBuffer.UV5Kind
     * - VertexBuffer.UV6Kind
     * - VertexBuffer.ColorKind
     * - VertexBuffer.MatricesIndicesKind
     * - VertexBuffer.MatricesIndicesExtraKind
     * - VertexBuffer.MatricesWeightsKind
     * - VertexBuffer.MatricesWeightsExtraKind
     * @returns true if data kind is present
     */
    public isVerticesDataPresent(kind: string): boolean {
        return this._sourceMesh.isVerticesDataPresent(kind);
    }

    /**
     * @returns an array of indices (IndicesArray).
     */
    public getIndices(): Nullable<IndicesArray> {
        return this._sourceMesh.getIndices();
    }

    public get _positions(): Nullable<Vector3[]> {
        return this._sourceMesh._positions;
    }

    /**
     * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
     * This means the mesh underlying bounding box and sphere are recomputed.
     * @param applySkeleton defines whether to apply the skeleton before computing the bounding info
     * @param applyMorph  defines whether to apply the morph target before computing the bounding info
     * @returns the current mesh
     */
    public refreshBoundingInfo(applySkeleton: boolean = false, applyMorph: boolean = false): InstancedMesh {
        if (this.hasBoundingInfo && this.getBoundingInfo().isLocked) {
            return this;
        }

        const bias = this._sourceMesh.geometry ? this._sourceMesh.geometry.boundingBias : null;
        this._refreshBoundingInfo(this._sourceMesh._getPositionData(applySkeleton, applyMorph), bias);
        return this;
    }

    /** @internal */
    public _preActivate(): InstancedMesh {
        if (this._currentLOD) {
            this._currentLOD._preActivate();
        }
        return this;
    }

    /**
     * @internal
     */
    public _activate(renderId: number, intermediateRendering: boolean): boolean {
        super._activate(renderId, intermediateRendering);

        if (!this._sourceMesh.subMeshes) {
            Logger.Warn("Instances should only be created for meshes with geometry.");
        }

        if (this._currentLOD) {
            const differentSign = this._currentLOD._getWorldMatrixDeterminant() >= 0 !== this._getWorldMatrixDeterminant() >= 0;
            if (differentSign) {
                this._internalAbstractMeshDataInfo._actAsRegularMesh = true;
                return true;
            }
            this._internalAbstractMeshDataInfo._actAsRegularMesh = false;

            this._currentLOD._registerInstanceForRenderId(this, renderId);

            if (intermediateRendering) {
                if (!this._currentLOD._internalAbstractMeshDataInfo._isActiveIntermediate) {
                    this._currentLOD._internalAbstractMeshDataInfo._onlyForInstancesIntermediate = true;
                    return true;
                }
            } else {
                if (!this._currentLOD._internalAbstractMeshDataInfo._isActive) {
                    this._currentLOD._internalAbstractMeshDataInfo._onlyForInstances = true;
                    return true;
                }
            }
        }
        return false;
    }

    /** @internal */
    public _postActivate(): void {
        if (this._sourceMesh.edgesShareWithInstances && this._sourceMesh._edgesRenderer && this._sourceMesh._edgesRenderer.isEnabled && this._sourceMesh._renderingGroup) {
            // we are using the edge renderer of the source mesh
            this._sourceMesh._renderingGroup._edgesRenderers.pushNoDuplicate(this._sourceMesh._edgesRenderer);
            this._sourceMesh._edgesRenderer.customInstances.push(this.getWorldMatrix());
        } else if (this._edgesRenderer && this._edgesRenderer.isEnabled && this._sourceMesh._renderingGroup) {
            // we are using the edge renderer defined for this instance
            this._sourceMesh._renderingGroup._edgesRenderers.push(this._edgesRenderer);
        }
    }

    public getWorldMatrix(): Matrix {
        if (this._currentLOD && this._currentLOD.billboardMode !== TransformNode.BILLBOARDMODE_NONE && this._currentLOD._masterMesh !== this) {
            if (!this._billboardWorldMatrix) {
                this._billboardWorldMatrix = new Matrix();
            }
            const tempMaster = this._currentLOD._masterMesh;
            this._currentLOD._masterMesh = this;
            TmpVectors.Vector3[7].copyFrom(this._currentLOD.position);
            this._currentLOD.position.set(0, 0, 0);
            this._billboardWorldMatrix.copyFrom(this._currentLOD.computeWorldMatrix(true));
            this._currentLOD.position.copyFrom(TmpVectors.Vector3[7]);
            this._currentLOD._masterMesh = tempMaster;
            return this._billboardWorldMatrix;
        }

        return super.getWorldMatrix();
    }

    public get isAnInstance(): boolean {
        return true;
    }

    /**
     * Returns the current associated LOD AbstractMesh.
     * @param camera defines the camera to use to pick the LOD level
     * @returns a Mesh or `null` if no LOD is associated with the AbstractMesh
     */
    public getLOD(camera: Camera): AbstractMesh {
        if (!camera) {
            return this;
        }

        const sourceMeshLODLevels = this.sourceMesh.getLODLevels();
        if (!sourceMeshLODLevels || sourceMeshLODLevels.length === 0) {
            this._currentLOD = this.sourceMesh;
        } else {
            const boundingInfo = this.getBoundingInfo();
            this._currentLOD = <Mesh>this.sourceMesh.getLOD(camera, boundingInfo.boundingSphere);
        }

        return this._currentLOD;
    }

    /**
     * @internal
     */
    public _preActivateForIntermediateRendering(renderId: number): Mesh {
        return <Mesh>this.sourceMesh._preActivateForIntermediateRendering(renderId);
    }

    /** @internal */
    public _syncSubMeshes(): InstancedMesh {
        this.releaseSubMeshes();
        if (this._sourceMesh.subMeshes) {
            for (let index = 0; index < this._sourceMesh.subMeshes.length; index++) {
                this._sourceMesh.subMeshes[index].clone(this, this._sourceMesh);
            }
        }
        return this;
    }

    /** @internal */
    public _generatePointsArray(): boolean {
        return this._sourceMesh._generatePointsArray();
    }

    /** @internal */
    public _updateBoundingInfo(): AbstractMesh {
        if (this.hasBoundingInfo) {
            this.getBoundingInfo().update(this.worldMatrixFromCache);
        } else {
            this.buildBoundingInfo(this.absolutePosition, this.absolutePosition, this.worldMatrixFromCache);
        }
        this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
        return this;
    }

    /**
     * Creates a new InstancedMesh from the current mesh.
     *
     * Returns the clone.
     * @param name the cloned mesh name
     * @param newParent the optional Node to parent the clone to.
     * @param doNotCloneChildren if `true` the model children aren't cloned.
     * @param newSourceMesh if set this mesh will be used as the source mesh instead of ths instance's one
     * @returns the clone
     */
    public clone(name: string, newParent: Nullable<Node> = null, doNotCloneChildren?: boolean, newSourceMesh?: Mesh): InstancedMesh {
        const result = (newSourceMesh || this._sourceMesh).createInstance(name);

        // Deep copy
        DeepCopier.DeepCopy(
            this,
            result,
            [
                "name",
                "subMeshes",
                "uniqueId",
                "parent",
                "lightSources",
                "receiveShadows",
                "material",
                "visibility",
                "skeleton",
                "sourceMesh",
                "isAnInstance",
                "facetNb",
                "isFacetDataEnabled",
                "isBlocked",
                "useBones",
                "hasInstances",
                "collider",
                "edgesRenderer",
                "forward",
                "up",
                "right",
                "absolutePosition",
                "absoluteScaling",
                "absoluteRotationQuaternion",
                "isWorldMatrixFrozen",
                "nonUniformScaling",
                "behaviors",
                "worldMatrixFromCache",
                "hasThinInstances",
                "hasBoundingInfo",
            ],
            []
        );

        // Bounding info
        this.refreshBoundingInfo();

        // Parent
        if (newParent) {
            result.parent = newParent;
        }

        if (!doNotCloneChildren) {
            // Children
            for (let index = 0; index < this.getScene().meshes.length; index++) {
                const mesh = this.getScene().meshes[index];

                if (mesh.parent === this) {
                    mesh.clone(mesh.name, result);
                }
            }
        }

        result.computeWorldMatrix(true);

        this.onClonedObservable.notifyObservers(result);

        return result;
    }

    /**
     * Disposes the InstancedMesh.
     * Returns nothing.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        // Remove from mesh
        this._sourceMesh.removeInstance(this);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    /**
     * @internal
     */
    public _serializeAsParent(serializationObject: any) {
        super._serializeAsParent(serializationObject);

        serializationObject.parentId = this._sourceMesh.uniqueId;
        serializationObject.parentInstanceIndex = this._indexInSourceMeshInstanceArray;
    }

    /**
     * Instantiate (when possible) or clone that node with its hierarchy
     * @param newParent defines the new parent to use for the instance (or clone)
     * @param options defines options to configure how copy is done
     * @param options.doNotInstantiate defines if the model must be instantiated or just cloned
     * @param options.newSourcedMesh newSourcedMesh the new source mesh for the instance (or clone)
     * @param onNewNodeCreated defines an option callback to call when a clone or an instance is created
     * @returns an instance (or a clone) of the current node with its hierarchy
     */
    public instantiateHierarchy(
        newParent: Nullable<TransformNode> = null,
        options?: { doNotInstantiate: boolean | ((node: TransformNode) => boolean); newSourcedMesh?: Mesh },
        onNewNodeCreated?: (source: TransformNode, clone: TransformNode) => void
    ): Nullable<TransformNode> {
        const clone = this.clone("Clone of " + (this.name || this.id), newParent || this.parent, true, options && options.newSourcedMesh);

        if (clone) {
            if (onNewNodeCreated) {
                onNewNodeCreated(this, clone);
            }
        }

        for (const child of this.getChildTransformNodes(true)) {
            child.instantiateHierarchy(clone, options, onNewNodeCreated);
        }

        return clone;
    }
}

declare module "./mesh" {
    export interface Mesh {
        /**
         * Register a custom buffer that will be instanced
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances#custom-buffers
         * @param kind defines the buffer kind
         * @param stride defines the stride in floats
         */
        registerInstancedBuffer(kind: string, stride: number): void;

        /**
         * Invalidate VertexArrayObjects belonging to the mesh (but not to the Geometry of the mesh).
         */
        _invalidateInstanceVertexArrayObject(): void;

        /**
         * true to use the edge renderer for all instances of this mesh
         */
        edgesShareWithInstances: boolean;

        /** @internal */
        _userInstancedBuffersStorage: {
            data: { [key: string]: Float32Array };
            sizes: { [key: string]: number };
            vertexBuffers: { [key: string]: Nullable<VertexBuffer> };
            strides: { [key: string]: number };
            vertexArrayObjects?: { [key: string]: WebGLVertexArrayObject };
        };
    }
}

declare module "./abstractMesh" {
    export interface AbstractMesh {
        /**
         * Object used to store instanced buffers defined by user
         * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/copies/instances#custom-buffers
         */
        instancedBuffers: { [key: string]: any };
    }
}

Mesh.prototype.registerInstancedBuffer = function (kind: string, stride: number): void {
    // Remove existing one
    this._userInstancedBuffersStorage?.vertexBuffers[kind]?.dispose();

    // Creates the instancedBuffer field if not present
    if (!this.instancedBuffers) {
        this.instancedBuffers = {};

        for (const instance of this.instances) {
            instance.instancedBuffers = {};
        }
    }

    if (!this._userInstancedBuffersStorage) {
        this._userInstancedBuffersStorage = {
            data: {},
            vertexBuffers: {},
            strides: {},
            sizes: {},
            vertexArrayObjects: this.getEngine().getCaps().vertexArrayObject ? {} : undefined,
        };
    }

    // Creates an empty property for this kind
    this.instancedBuffers[kind] = null;

    this._userInstancedBuffersStorage.strides[kind] = stride;
    this._userInstancedBuffersStorage.sizes[kind] = stride * 32; // Initial size
    this._userInstancedBuffersStorage.data[kind] = new Float32Array(this._userInstancedBuffersStorage.sizes[kind]);
    this._userInstancedBuffersStorage.vertexBuffers[kind] = new VertexBuffer(this.getEngine(), this._userInstancedBuffersStorage.data[kind], kind, true, false, stride, true);

    for (const instance of this.instances) {
        instance.instancedBuffers[kind] = null;
    }

    this._invalidateInstanceVertexArrayObject();

    this._markSubMeshesAsAttributesDirty();
};

Mesh.prototype._processInstancedBuffers = function (visibleInstances: Nullable<InstancedMesh[]>, renderSelf: boolean) {
    const instanceCount = visibleInstances ? visibleInstances.length : 0;

    for (const kind in this.instancedBuffers) {
        let size = this._userInstancedBuffersStorage.sizes[kind];
        const stride = this._userInstancedBuffersStorage.strides[kind];

        // Resize if required
        const expectedSize = (instanceCount + 1) * stride;

        while (size < expectedSize) {
            size *= 2;
        }

        if (this._userInstancedBuffersStorage.data[kind].length != size) {
            this._userInstancedBuffersStorage.data[kind] = new Float32Array(size);
            this._userInstancedBuffersStorage.sizes[kind] = size;
            if (this._userInstancedBuffersStorage.vertexBuffers[kind]) {
                this._userInstancedBuffersStorage.vertexBuffers[kind]!.dispose();
                this._userInstancedBuffersStorage.vertexBuffers[kind] = null;
            }
        }

        const data = this._userInstancedBuffersStorage.data[kind];

        // Update data buffer
        let offset = 0;
        if (renderSelf) {
            const value = this.instancedBuffers[kind];

            if (value.toArray) {
                value.toArray(data, offset);
            } else if (value.copyToArray) {
                value.copyToArray(data, offset);
            } else {
                data[offset] = value;
            }

            offset += stride;
        }

        for (let instanceIndex = 0; instanceIndex < instanceCount; instanceIndex++) {
            const instance = visibleInstances![instanceIndex]!;

            const value = instance.instancedBuffers[kind];

            if (value.toArray) {
                value.toArray(data, offset);
            } else if (value.copyToArray) {
                value.copyToArray(data, offset);
            } else {
                data[offset] = value;
            }

            offset += stride;
        }

        // Update vertex buffer
        if (!this._userInstancedBuffersStorage.vertexBuffers[kind]) {
            this._userInstancedBuffersStorage.vertexBuffers[kind] = new VertexBuffer(
                this.getEngine(),
                this._userInstancedBuffersStorage.data[kind],
                kind,
                true,
                false,
                stride,
                true
            );
            this._invalidateInstanceVertexArrayObject();
        } else {
            this._userInstancedBuffersStorage.vertexBuffers[kind]!.updateDirectly(data, 0);
        }
    }
};

Mesh.prototype._invalidateInstanceVertexArrayObject = function () {
    if (!this._userInstancedBuffersStorage || this._userInstancedBuffersStorage.vertexArrayObjects === undefined) {
        return;
    }

    for (const kind in this._userInstancedBuffersStorage.vertexArrayObjects) {
        this.getEngine().releaseVertexArrayObject(this._userInstancedBuffersStorage.vertexArrayObjects[kind]);
    }

    this._userInstancedBuffersStorage.vertexArrayObjects = {};
};

Mesh.prototype._disposeInstanceSpecificData = function () {
    if (this._instanceDataStorage.instancesBuffer) {
        this._instanceDataStorage.instancesBuffer.dispose();
        this._instanceDataStorage.instancesBuffer = null;
    }

    while (this.instances.length) {
        this.instances[0].dispose();
    }

    for (const kind in this.instancedBuffers) {
        if (this._userInstancedBuffersStorage.vertexBuffers[kind]) {
            this._userInstancedBuffersStorage.vertexBuffers[kind]!.dispose();
        }
    }

    this._invalidateInstanceVertexArrayObject();

    this.instancedBuffers = {};
};
