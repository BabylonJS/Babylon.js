import { Nullable, FloatArray, IndicesArray } from "../types";
import { Vector3, Matrix, Tmp } from "../Maths/math";
import { Logger } from "../Misc/logger";
import { Camera } from "../Cameras/camera";
import { Node } from "../node";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Material } from "../Materials/material";
import { Skeleton } from "../Bones/skeleton";
import { DeepCopier } from "../Misc/deepCopier";
import { TransformNode } from './transformNode';
import { Light } from '../Lights/light';

Mesh._instancedMeshFactory = (name: string, mesh: Mesh): InstancedMesh => {
    return new InstancedMesh(name, mesh);
};

/**
 * Creates an instance based on a source mesh.
 */
export class InstancedMesh extends AbstractMesh {
    private _sourceMesh: Mesh;
    private _currentLOD: Mesh;

    /** @hidden */
    public _indexInSourceMeshInstanceArray = -1;

    constructor(name: string, source: Mesh) {
        super(name, source.getScene());

        source.addInstance(this);

        this._sourceMesh = source;

        this.position.copyFrom(source.position);
        this.rotation.copyFrom(source.rotation);
        this.scaling.copyFrom(source.scaling);

        if (source.rotationQuaternion) {
            this.rotationQuaternion = source.rotationQuaternion.clone();
        }

        this.infiniteDistance = source.infiniteDistance;

        this.setPivotMatrix(source.getPivotMatrix());

        this.refreshBoundingInfo();
        this._syncSubMeshes();
    }

    /**
     * Returns the string "InstancedMesh".
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

    public _resyncLighSource(light: Light): void {
        // Do nothing as all the work will be done by source mesh
    }

    public _removeLightSource(light: Light): void {
        // Do nothing as all the work will be done by source mesh
    }

    // Methods
    /**
     * If the source mesh receives shadows
     */
    public get receiveShadows(): boolean {
        return this._sourceMesh.receiveShadows;
    }

    /**
     * The material of the source mesh
     */
    public get material(): Nullable<Material> {
        return this._sourceMesh.material;
    }

    /**
     * Visibility of the source mesh
     */
    public get visibility(): number {
        return this._sourceMesh.visibility;
    }

    /**
     * Skeleton of the source mesh
     */
    public get skeleton(): Nullable<Skeleton> {
        return this._sourceMesh.skeleton;
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
     * Returns the total number of vertices (integer).
     */
    public getTotalVertices(): number {
        return this._sourceMesh.getTotalVertices();
    }

    /**
     * Returns a positive integer : the total number of indices in this mesh geometry.
     * @returns the numner of indices or zero if the mesh has no geometry.
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
     * Is this node ready to be used/rendered
     * @param completeCheck defines if a complete check (including materials and lights) has to be done (false by default)
     * @return {boolean} is it ready
     */
    public isReady(completeCheck = false): boolean {
        return this._sourceMesh.isReady(completeCheck, true);
    }

    /**
     * Returns an array of integers or a typed array (Int32Array, Uint32Array, Uint16Array) populated with the mesh indices.
     * @param kind kind of verticies to retreive (eg. positons, normals, uvs, etc.)
     * @param copyWhenShared If true (default false) and and if the mesh geometry is shared among some other meshes, the returned array is a copy of the internal one.
     * @returns a float array or a Float32Array of the requested kind of data : positons, normals, uvs, etc.
     */
    public getVerticesData(kind: string, copyWhenShared?: boolean): Nullable<FloatArray> {
        return this._sourceMesh.getVerticesData(kind, copyWhenShared);
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
     */
    public setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): Mesh {
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
     */
    public setIndices(indices: IndicesArray, totalVertices: Nullable<number> = null): Mesh {
        if (this.sourceMesh) {
            this.sourceMesh.setIndices(indices, totalVertices);
        }
        return this.sourceMesh;
    }

    /**
     * Boolean : True if the mesh owns the requested kind of data.
     */
    public isVerticesDataPresent(kind: string): boolean {
        return this._sourceMesh.isVerticesDataPresent(kind);
    }

    /**
     * Returns an array of indices (IndicesArray).
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
     * @returns the current mesh
     */
    public refreshBoundingInfo(applySkeleton: boolean = false): InstancedMesh {
        if (this._boundingInfo && this._boundingInfo.isLocked) {
            return this;
        }

        const bias = this._sourceMesh.geometry ? this._sourceMesh.geometry.boundingBias : null;
        this._refreshBoundingInfo(this._sourceMesh._getPositionData(applySkeleton), bias);
        return this;
    }

    /** @hidden */
    public _preActivate(): InstancedMesh {
        if (this._currentLOD) {
            this._currentLOD._preActivate();
        }
        return this;
    }

    /** @hidden */
    public _activate(renderId: number): boolean {
        if (this._currentLOD) {
            this._currentLOD._registerInstanceForRenderId(this, renderId);
        }

        if (this._edgesRenderer && this._edgesRenderer.isEnabled && this._sourceMesh._renderingGroup) {
            this._sourceMesh._renderingGroup._edgesRenderers.push(this._edgesRenderer);
        }

        if (!this._currentLOD._isActive) {
            this._currentLOD._onlyForInstances = true;
            this._currentLOD._isActive = true;
            return true;
        }
        return false;
    }

    public getWorldMatrix(): Matrix {
        if (this._currentLOD && this._currentLOD.billboardMode !== TransformNode.BILLBOARDMODE_NONE && this._currentLOD._masterMesh !== this) {
            let tempMaster = this._currentLOD._masterMesh;
            this._currentLOD._masterMesh = this;
            Tmp.Matrix[0].copyFrom(this._currentLOD.computeWorldMatrix(true));
            this._currentLOD._masterMesh = tempMaster;
            return Tmp.Matrix[0];
        }

        return super.getWorldMatrix();
    }

    /**
     * Returns the current associated LOD AbstractMesh.
     */
    public getLOD(camera: Camera): AbstractMesh {
        if (!camera) {
            return this;
        }

        let boundingInfo = this.getBoundingInfo();

        this._currentLOD = <Mesh>this.sourceMesh.getLOD(camera, boundingInfo.boundingSphere);

        if (this._currentLOD === this.sourceMesh) {
            return this;
        }

        return this._currentLOD;
    }

    /** @hidden */
    public _syncSubMeshes(): InstancedMesh {
        this.releaseSubMeshes();
        if (this._sourceMesh.subMeshes) {
            for (var index = 0; index < this._sourceMesh.subMeshes.length; index++) {
                this._sourceMesh.subMeshes[index].clone(this, this._sourceMesh);
            }
        }
        return this;
    }

    /** @hidden */
    public _generatePointsArray(): boolean {
        return this._sourceMesh._generatePointsArray();
    }

    /**
     * Creates a new InstancedMesh from the current mesh.
     * - name (string) : the cloned mesh name
     * - newParent (optional Node) : the optional Node to parent the clone to.
     * - doNotCloneChildren (optional boolean, default `false`) : if `true` the model children aren't cloned.
     *
     * Returns the clone.
     */
    public clone(name: string, newParent: Node, doNotCloneChildren?: boolean): InstancedMesh {
        var result = this._sourceMesh.createInstance(name);

        // Deep copy
        DeepCopier.DeepCopy(this, result, ["name", "subMeshes", "uniqueId"], []);

        // Bounding info
        this.refreshBoundingInfo();

        // Parent
        if (newParent) {
            result.parent = newParent;
        }

        if (!doNotCloneChildren) {
            // Children
            for (var index = 0; index < this.getScene().meshes.length; index++) {
                var mesh = this.getScene().meshes[index];

                if (mesh.parent === this) {
                    mesh.clone(mesh.name, result);
                }
            }
        }

        result.computeWorldMatrix(true);

        return result;
    }

    /**
     * Disposes the InstancedMesh.
     * Returns nothing.
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        // Remove from mesh
        this._sourceMesh.removeInstance(this);
        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }
}
