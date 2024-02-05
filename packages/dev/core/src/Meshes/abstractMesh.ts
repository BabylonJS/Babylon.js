import { Observable } from "../Misc/observable";
import type { Nullable, FloatArray, IndicesArray, DeepImmutable } from "../types";
import type { Camera } from "../Cameras/camera";
import type { Scene, IDisposable } from "../scene";
import { ScenePerformancePriority } from "../scene";
import type { Vector2 } from "../Maths/math.vector";
import { Quaternion, Matrix, Vector3, TmpVectors } from "../Maths/math.vector";
import { Engine } from "../Engines/engine";
import type { Node } from "../node";
import { VertexBuffer } from "../Buffers/buffer";
import type { IGetSetVerticesData } from "../Meshes/mesh.vertexData";
import { VertexData } from "../Meshes/mesh.vertexData";
import { TransformNode } from "../Meshes/transformNode";
import type { SubMesh } from "../Meshes/subMesh";
import { PickingInfo } from "../Collisions/pickingInfo";
import type { IntersectionInfo } from "../Collisions/intersectionInfo";
import type { ICullable } from "../Culling/boundingInfo";
import { BoundingInfo } from "../Culling/boundingInfo";
import type { Material } from "../Materials/material";
import type { MaterialDefines } from "../Materials/materialDefines";
import type { Light } from "../Lights/light";
import type { Skeleton } from "../Bones/skeleton";
import type { MorphTargetManager } from "../Morph/morphTargetManager";
import type { IBakedVertexAnimationManager } from "../BakedVertexAnimation/bakedVertexAnimationManager";
import type { IEdgesRenderer } from "../Rendering/edgesRenderer";
import type { SolidParticle } from "../Particles/solidParticle";
import { Constants } from "../Engines/constants";
import type { AbstractActionManager } from "../Actions/abstractActionManager";
import { UniformBuffer } from "../Materials/uniformBuffer";
import { _MeshCollisionData } from "../Collisions/meshCollisionData";
import { _WarnImport } from "../Misc/devTools";
import type { RawTexture } from "../Materials/Textures/rawTexture";
import { extractMinAndMax } from "../Maths/math.functions";
import { Color3, Color4 } from "../Maths/math.color";
import { Epsilon } from "../Maths/math.constants";
import type { Plane } from "../Maths/math.plane";
import { Axis } from "../Maths/math.axis";
import type { IParticleSystem } from "../Particles/IParticleSystem";
import { RegisterClass } from "../Misc/typeStore";

import type { Ray } from "../Culling/ray";
import type { Collider } from "../Collisions/collider";
import type { TrianglePickingPredicate } from "../Culling/ray";
import type { RenderingGroup } from "../Rendering/renderingGroup";
import type { IEdgesRendererOptions } from "../Rendering/edgesRenderer";

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
class _FacetDataStorage {
    // facetData private properties
    public facetPositions: Vector3[]; // facet local positions
    public facetNormals: Vector3[]; // facet local normals
    public facetPartitioning: number[][]; // partitioning array of facet index arrays
    public facetNb: number = 0; // facet number
    public partitioningSubdivisions: number = 10; // number of subdivisions per axis in the partitioning space
    public partitioningBBoxRatio: number = 1.01; // the partitioning array space is by default 1% bigger than the bounding box
    public facetDataEnabled: boolean = false; // is the facet data feature enabled on this mesh ?
    public facetParameters: any = {}; // keep a reference to the object parameters to avoid memory re-allocation
    public bbSize: Vector3 = Vector3.Zero(); // bbox size approximated for facet data
    public subDiv = {
        // actual number of subdivisions per axis for ComputeNormals()
        max: 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        X: 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Y: 1,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        Z: 1,
    };

    public facetDepthSort: boolean = false; // is the facet depth sort to be computed
    public facetDepthSortEnabled: boolean = false; // is the facet depth sort initialized
    public depthSortedIndices: IndicesArray; // copy of the indices array to store them once sorted
    public depthSortedFacets: { ind: number; sqDistance: number }[]; // array of depth sorted facets
    public facetDepthSortFunction: (f1: { ind: number; sqDistance: number }, f2: { ind: number; sqDistance: number }) => number; // facet depth sort function
    public facetDepthSortFrom: Vector3; // location where to depth sort from
    public facetDepthSortOrigin: Vector3; // same as facetDepthSortFrom but expressed in the mesh local space

    public invertedMatrix: Matrix; // Inverted world matrix.
}

/**
 * @internal
 **/
// eslint-disable-next-line @typescript-eslint/naming-convention
class _InternalAbstractMeshDataInfo {
    public _hasVertexAlpha = false;
    public _useVertexColors = true;
    public _numBoneInfluencers = 4;
    public _applyFog = true;
    public _receiveShadows = false;
    public _facetData = new _FacetDataStorage();
    public _visibility = 1.0;
    public _skeleton: Nullable<Skeleton> = null;
    public _layerMask: number = 0x0fffffff;
    public _computeBonesUsingShaders = true;
    public _isActive = false;
    public _onlyForInstances = false;
    public _isActiveIntermediate = false;
    public _onlyForInstancesIntermediate = false;
    public _actAsRegularMesh = false;
    public _currentLOD: Nullable<AbstractMesh> = null;
    public _currentLODIsUpToDate: boolean = false;
    public _collisionRetryCount: number = 3;
    public _morphTargetManager: Nullable<MorphTargetManager> = null;
    public _renderingGroupId = 0;
    public _bakedVertexAnimationManager: Nullable<IBakedVertexAnimationManager> = null;
    public _material: Nullable<Material> = null;
    public _materialForRenderPass: Array<Material | undefined>; // map a render pass id (index in the array) to a Material
    public _positions: Nullable<Vector3[]> = null;
    public _pointerOverDisableMeshTesting: boolean = false;
    // Collisions
    public _meshCollisionData = new _MeshCollisionData();
    public _enableDistantPicking = false;
    /** @internal
     * Bounding info that is unnafected by the addition of thin instances
     */
    public _rawBoundingInfo: Nullable<BoundingInfo> = null;
}

/**
 * Class used to store all common mesh properties
 */
export class AbstractMesh extends TransformNode implements IDisposable, ICullable, IGetSetVerticesData {
    /** No occlusion */
    public static OCCLUSION_TYPE_NONE = 0;
    /** Occlusion set to optimistic */
    public static OCCLUSION_TYPE_OPTIMISTIC = 1;
    /** Occlusion set to strict */
    public static OCCLUSION_TYPE_STRICT = 2;
    /** Use an accurate occlusion algorithm */
    public static OCCLUSION_ALGORITHM_TYPE_ACCURATE = 0;
    /** Use a conservative occlusion algorithm */
    public static OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE = 1;

    /** Default culling strategy : this is an exclusion test and it's the more accurate.
     *  Test order :
     *  Is the bounding sphere outside the frustum ?
     *  If not, are the bounding box vertices outside the frustum ?
     *  It not, then the cullable object is in the frustum.
     */
    public static readonly CULLINGSTRATEGY_STANDARD = Constants.MESHES_CULLINGSTRATEGY_STANDARD;
    /** Culling strategy : Bounding Sphere Only.
     *  This is an exclusion test. It's faster than the standard strategy because the bounding box is not tested.
     *  It's also less accurate than the standard because some not visible objects can still be selected.
     *  Test : is the bounding sphere outside the frustum ?
     *  If not, then the cullable object is in the frustum.
     */
    public static readonly CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY = Constants.MESHES_CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;
    /** Culling strategy : Optimistic Inclusion.
     *  This in an inclusion test first, then the standard exclusion test.
     *  This can be faster when a cullable object is expected to be almost always in the camera frustum.
     *  This could also be a little slower than the standard test when the tested object center is not the frustum but one of its bounding box vertex is still inside.
     *  Anyway, it's as accurate as the standard strategy.
     *  Test :
     *  Is the cullable object bounding sphere center in the frustum ?
     *  If not, apply the default culling strategy.
     */
    public static readonly CULLINGSTRATEGY_OPTIMISTIC_INCLUSION = Constants.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
    /** Culling strategy : Optimistic Inclusion then Bounding Sphere Only.
     *  This in an inclusion test first, then the bounding sphere only exclusion test.
     *  This can be the fastest test when a cullable object is expected to be almost always in the camera frustum.
     *  This could also be a little slower than the BoundingSphereOnly strategy when the tested object center is not in the frustum but its bounding sphere still intersects it.
     *  It's less accurate than the standard strategy and as accurate as the BoundingSphereOnly strategy.
     *  Test :
     *  Is the cullable object bounding sphere center in the frustum ?
     *  If not, apply the Bounding Sphere Only strategy. No Bounding Box is tested here.
     */
    public static readonly CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY = Constants.MESHES_CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY;

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

    /** Billboard on using position instead of orientation */
    public static get BILLBOARDMODE_USE_POSITION(): number {
        return TransformNode.BILLBOARDMODE_USE_POSITION;
    }

    // Internal data
    /** @internal */
    public _internalAbstractMeshDataInfo = new _InternalAbstractMeshDataInfo();

    /** @internal */
    public _waitingMaterialId: Nullable<string> = null;

    /**
     * The culling strategy to use to check whether the mesh must be rendered or not.
     * This value can be changed at any time and will be used on the next render mesh selection.
     * The possible values are :
     * - AbstractMesh.CULLINGSTRATEGY_STANDARD
     * - AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY
     * - AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION
     * - AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION_THEN_BSPHERE_ONLY
     * Please read each static variable documentation to get details about the culling process.
     * */
    public cullingStrategy = AbstractMesh.CULLINGSTRATEGY_BOUNDINGSPHERE_ONLY;

    /**
     * Gets the number of facets in the mesh
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#what-is-a-mesh-facet
     */
    public get facetNb(): number {
        return this._internalAbstractMeshDataInfo._facetData.facetNb;
    }
    /**
     * Gets or set the number (integer) of subdivisions per axis in the partitioning space
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#tweaking-the-partitioning
     */
    public get partitioningSubdivisions(): number {
        return this._internalAbstractMeshDataInfo._facetData.partitioningSubdivisions;
    }
    public set partitioningSubdivisions(nb: number) {
        this._internalAbstractMeshDataInfo._facetData.partitioningSubdivisions = nb;
    }
    /**
     * The ratio (float) to apply to the bounding box size to set to the partitioning space.
     * Ex : 1.01 (default) the partitioning space is 1% bigger than the bounding box
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#tweaking-the-partitioning
     */
    public get partitioningBBoxRatio(): number {
        return this._internalAbstractMeshDataInfo._facetData.partitioningBBoxRatio;
    }
    public set partitioningBBoxRatio(ratio: number) {
        this._internalAbstractMeshDataInfo._facetData.partitioningBBoxRatio = ratio;
    }

    /**
     * Gets or sets a boolean indicating that the facets must be depth sorted on next call to `updateFacetData()`.
     * Works only for updatable meshes.
     * Doesn't work with multi-materials
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#facet-depth-sort
     */
    public get mustDepthSortFacets(): boolean {
        return this._internalAbstractMeshDataInfo._facetData.facetDepthSort;
    }
    public set mustDepthSortFacets(sort: boolean) {
        this._internalAbstractMeshDataInfo._facetData.facetDepthSort = sort;
    }

    /**
     * The location (Vector3) where the facet depth sort must be computed from.
     * By default, the active camera position.
     * Used only when facet depth sort is enabled
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#facet-depth-sort
     */
    public get facetDepthSortFrom(): Vector3 {
        return this._internalAbstractMeshDataInfo._facetData.facetDepthSortFrom;
    }
    public set facetDepthSortFrom(location: Vector3) {
        this._internalAbstractMeshDataInfo._facetData.facetDepthSortFrom = location;
    }

    /** number of collision detection tries. Change this value if not all collisions are detected and handled properly */
    public get collisionRetryCount(): number {
        return this._internalAbstractMeshDataInfo._collisionRetryCount;
    }
    public set collisionRetryCount(retryCount: number) {
        this._internalAbstractMeshDataInfo._collisionRetryCount = retryCount;
    }
    /**
     * gets a boolean indicating if facetData is enabled
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData#what-is-a-mesh-facet
     */
    public get isFacetDataEnabled(): boolean {
        return this._internalAbstractMeshDataInfo._facetData.facetDataEnabled;
    }

    /**
     * Gets or sets the morph target manager
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/morphTargets
     */
    public get morphTargetManager(): Nullable<MorphTargetManager> {
        return this._internalAbstractMeshDataInfo._morphTargetManager;
    }

    public set morphTargetManager(value: Nullable<MorphTargetManager>) {
        if (this._internalAbstractMeshDataInfo._morphTargetManager === value) {
            return;
        }
        this._internalAbstractMeshDataInfo._morphTargetManager = value;
        this._syncGeometryWithMorphTargetManager();
    }

    /**
     * Gets or sets the baked vertex animation manager
     * @see https://doc.babylonjs.com/features/featuresDeepDive/animation/baked_texture_animations
     */
    public get bakedVertexAnimationManager(): Nullable<IBakedVertexAnimationManager> {
        return this._internalAbstractMeshDataInfo._bakedVertexAnimationManager;
    }

    public set bakedVertexAnimationManager(value: Nullable<IBakedVertexAnimationManager>) {
        if (this._internalAbstractMeshDataInfo._bakedVertexAnimationManager === value) {
            return;
        }
        this._internalAbstractMeshDataInfo._bakedVertexAnimationManager = value;
        this._markSubMeshesAsAttributesDirty();
    }

    /** @internal */
    public _syncGeometryWithMorphTargetManager(): void {}

    /**
     * @internal
     */
    public _updateNonUniformScalingState(value: boolean): boolean {
        if (!super._updateNonUniformScalingState(value)) {
            return false;
        }
        this._markSubMeshesAsMiscDirty();
        return true;
    }

    /** @internal */
    public get rawBoundingInfo(): Nullable<BoundingInfo> {
        return this._internalAbstractMeshDataInfo._rawBoundingInfo;
    }
    public set rawBoundingInfo(boundingInfo: Nullable<BoundingInfo>) {
        this._internalAbstractMeshDataInfo._rawBoundingInfo = boundingInfo;
    }

    // Events

    /**
     * An event triggered when this mesh collides with another one
     */
    public onCollideObservable = new Observable<AbstractMesh>();

    /** Set a function to call when this mesh collides with another one */
    public set onCollide(callback: (collidedMesh?: AbstractMesh) => void) {
        if (this._internalAbstractMeshDataInfo._meshCollisionData._onCollideObserver) {
            this.onCollideObservable.remove(this._internalAbstractMeshDataInfo._meshCollisionData._onCollideObserver);
        }
        this._internalAbstractMeshDataInfo._meshCollisionData._onCollideObserver = this.onCollideObservable.add(callback);
    }

    /**
     * An event triggered when the collision's position changes
     */
    public onCollisionPositionChangeObservable = new Observable<Vector3>();

    /** Set a function to call when the collision's position changes */
    public set onCollisionPositionChange(callback: () => void) {
        if (this._internalAbstractMeshDataInfo._meshCollisionData._onCollisionPositionChangeObserver) {
            this.onCollisionPositionChangeObservable.remove(this._internalAbstractMeshDataInfo._meshCollisionData._onCollisionPositionChangeObserver);
        }
        this._internalAbstractMeshDataInfo._meshCollisionData._onCollisionPositionChangeObserver = this.onCollisionPositionChangeObservable.add(callback);
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

    /** @internal */
    public _occlusionQuery: Nullable<WebGLQuery | number> = null;

    /** @internal */
    public _renderingGroup: Nullable<RenderingGroup> = null;

    /**
     * Gets or sets mesh visibility between 0 and 1 (default is 1)
     */
    public get visibility(): number {
        return this._internalAbstractMeshDataInfo._visibility;
    }

    /**
     * Gets or sets mesh visibility between 0 and 1 (default is 1)
     */
    public set visibility(value: number) {
        if (this._internalAbstractMeshDataInfo._visibility === value) {
            return;
        }

        const oldValue = this._internalAbstractMeshDataInfo._visibility;

        this._internalAbstractMeshDataInfo._visibility = value;

        if ((oldValue === 1 && value !== 1) || (oldValue !== 1 && value === 1)) {
            this._markSubMeshesAsDirty((defines) => {
                defines.markAsMiscDirty();
                defines.markAsPrePassDirty();
            });
        }
    }

    /** Gets or sets the alpha index used to sort transparent meshes
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering#alpha-index
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

    /**
     * Gets or sets a boolean indicating if the mesh can be near picked. Default is false
     */
    public isNearPickable = false;

    /**
     * Gets or sets a boolean indicating if the mesh can be near grabbed. Default is false
     */
    public isNearGrabbable = false;

    /** Gets or sets a boolean indicating that bounding boxes of subMeshes must be rendered as well (false by default) */
    public showSubMeshesBoundingBox = false;

    /** Gets or sets a boolean indicating if the mesh must be considered as a ray blocker for lens flares (false by default)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/environment/lenseFlare
     */
    public isBlocker = false;

    /**
     * Gets or sets a boolean indicating that pointer move events must be supported on this mesh (false by default)
     */
    public enablePointerMoveEvents = false;

    /**
     * Gets or sets the property which disables the test that is checking that the mesh under the pointer is the same than the previous time we tested for it (default: false).
     * Set this property to true if you want thin instances picking to be reported accurately when moving over the mesh.
     * Note that setting this property to true will incur some performance penalties when dealing with pointer events for this mesh so use it sparingly.
     */
    public get pointerOverDisableMeshTesting() {
        return this._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting;
    }

    public set pointerOverDisableMeshTesting(disable: boolean) {
        this._internalAbstractMeshDataInfo._pointerOverDisableMeshTesting = disable;
    }

    /**
     * Specifies the rendering group id for this mesh (0 by default)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/advanced/transparent_rendering#rendering-groups
     */
    public get renderingGroupId() {
        return this._internalAbstractMeshDataInfo._renderingGroupId;
    }

    public set renderingGroupId(value: number) {
        this._internalAbstractMeshDataInfo._renderingGroupId = value;
    }

    /** Gets or sets current material */
    public get material(): Nullable<Material> {
        return this._internalAbstractMeshDataInfo._material;
    }
    public set material(value: Nullable<Material>) {
        if (this._internalAbstractMeshDataInfo._material === value) {
            return;
        }

        // remove from material mesh map id needed
        if (this._internalAbstractMeshDataInfo._material && this._internalAbstractMeshDataInfo._material.meshMap) {
            this._internalAbstractMeshDataInfo._material.meshMap[this.uniqueId] = undefined;
        }

        this._internalAbstractMeshDataInfo._material = value;

        if (value && value.meshMap) {
            value.meshMap[this.uniqueId] = this;
        }

        if (this.onMaterialChangedObservable.hasObservers()) {
            this.onMaterialChangedObservable.notifyObservers(this);
        }

        if (!this.subMeshes) {
            return;
        }

        this.resetDrawCache();
        this._unBindEffect();
    }

    /**
     * Gets the material used to render the mesh in a specific render pass
     * @param renderPassId render pass id
     * @returns material used for the render pass. If no specific material is used for this render pass, undefined is returned (meaning mesh.material is used for this pass)
     */
    public getMaterialForRenderPass(renderPassId: number): Material | undefined {
        return this._internalAbstractMeshDataInfo._materialForRenderPass?.[renderPassId];
    }

    /**
     * Sets the material to be used to render the mesh in a specific render pass
     * @param renderPassId render pass id
     * @param material material to use for this render pass. If undefined is passed, no specific material will be used for this render pass but the regular material will be used instead (mesh.material)
     */
    public setMaterialForRenderPass(renderPassId: number, material?: Material): void {
        this.resetDrawCache(renderPassId);
        if (!this._internalAbstractMeshDataInfo._materialForRenderPass) {
            this._internalAbstractMeshDataInfo._materialForRenderPass = [];
        }
        this._internalAbstractMeshDataInfo._materialForRenderPass[renderPassId] = material;
    }

    /**
     * Gets or sets a boolean indicating that this mesh can receive realtime shadows
     * @see https://doc.babylonjs.com/features/featuresDeepDive/lights/shadows
     */
    public get receiveShadows(): boolean {
        return this._internalAbstractMeshDataInfo._receiveShadows;
    }
    public set receiveShadows(value: boolean) {
        if (this._internalAbstractMeshDataInfo._receiveShadows === value) {
            return;
        }

        this._internalAbstractMeshDataInfo._receiveShadows = value;
        this._markSubMeshesAsLightDirty();
    }

    /** Defines color to use when rendering outline */
    public outlineColor = Color3.Red();
    /** Define width to use when rendering outline */
    public outlineWidth = 0.02;

    /** Defines color to use when rendering overlay */
    public overlayColor = Color3.Red();
    /** Defines alpha to use when rendering overlay */
    public overlayAlpha = 0.5;

    /** Gets or sets a boolean indicating that this mesh contains vertex color data with alpha values */
    public get hasVertexAlpha(): boolean {
        return this._internalAbstractMeshDataInfo._hasVertexAlpha;
    }
    public set hasVertexAlpha(value: boolean) {
        if (this._internalAbstractMeshDataInfo._hasVertexAlpha === value) {
            return;
        }

        this._internalAbstractMeshDataInfo._hasVertexAlpha = value;
        this._markSubMeshesAsAttributesDirty();
        this._markSubMeshesAsMiscDirty();
    }

    /** Gets or sets a boolean indicating that this mesh needs to use vertex color data to render (if this kind of vertex data is available in the geometry) */
    public get useVertexColors(): boolean {
        return this._internalAbstractMeshDataInfo._useVertexColors;
    }
    public set useVertexColors(value: boolean) {
        if (this._internalAbstractMeshDataInfo._useVertexColors === value) {
            return;
        }

        this._internalAbstractMeshDataInfo._useVertexColors = value;
        this._markSubMeshesAsAttributesDirty();
    }

    /**
     * Gets or sets a boolean indicating that bone animations must be computed by the GPU (true by default)
     */
    public get computeBonesUsingShaders(): boolean {
        return this._internalAbstractMeshDataInfo._computeBonesUsingShaders;
    }
    public set computeBonesUsingShaders(value: boolean) {
        if (this._internalAbstractMeshDataInfo._computeBonesUsingShaders === value) {
            return;
        }

        this._internalAbstractMeshDataInfo._computeBonesUsingShaders = value;
        this._markSubMeshesAsAttributesDirty();
    }

    /** Gets or sets the number of allowed bone influences per vertex (4 by default) */
    public get numBoneInfluencers(): number {
        return this._internalAbstractMeshDataInfo._numBoneInfluencers;
    }
    public set numBoneInfluencers(value: number) {
        if (this._internalAbstractMeshDataInfo._numBoneInfluencers === value) {
            return;
        }

        this._internalAbstractMeshDataInfo._numBoneInfluencers = value;
        this._markSubMeshesAsAttributesDirty();
    }

    /** Gets or sets a boolean indicating that this mesh will allow fog to be rendered on it (true by default) */
    public get applyFog(): boolean {
        return this._internalAbstractMeshDataInfo._applyFog;
    }
    public set applyFog(value: boolean) {
        if (this._internalAbstractMeshDataInfo._applyFog === value) {
            return;
        }

        this._internalAbstractMeshDataInfo._applyFog = value;
        this._markSubMeshesAsMiscDirty();
    }

    /** When enabled, decompose picking matrices for better precision with large values for mesh position and scling */
    public get enableDistantPicking(): boolean {
        return this._internalAbstractMeshDataInfo._enableDistantPicking;
    }
    public set enableDistantPicking(value: boolean) {
        this._internalAbstractMeshDataInfo._enableDistantPicking = value;
    }

    /** Gets or sets a boolean indicating that internal octree (if available) can be used to boost submeshes selection (true by default) */
    public useOctreeForRenderingSelection = true;
    /** Gets or sets a boolean indicating that internal octree (if available) can be used to boost submeshes picking (true by default) */
    public useOctreeForPicking = true;
    /** Gets or sets a boolean indicating that internal octree (if available) can be used to boost submeshes collision (true by default) */
    public useOctreeForCollisions = true;
    /**
     * Gets or sets the current layer mask (default is 0x0FFFFFFF)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/layerMasksAndMultiCam
     */
    public get layerMask(): number {
        return this._internalAbstractMeshDataInfo._layerMask;
    }

    public set layerMask(value: number) {
        if (value === this._internalAbstractMeshDataInfo._layerMask) {
            return;
        }

        this._internalAbstractMeshDataInfo._layerMask = value;
        this._resyncLightSources();
    }

    /**
     * True if the mesh must be rendered in any case (this will shortcut the frustum clipping phase)
     */
    public alwaysSelectAsActiveMesh = false;

    /**
     * Gets or sets a boolean indicating that the bounding info does not need to be kept in sync (for performance reason)
     */
    public doNotSyncBoundingInfo = false;

    /**
     * Gets or sets the current action manager
     * @see https://doc.babylonjs.com/features/featuresDeepDive/events/actions
     */
    public actionManager: Nullable<AbstractActionManager> = null;

    /**
     * Gets or sets the ellipsoid used to impersonate this mesh when using collision engine (default is (0.5, 1, 0.5))
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     */
    public ellipsoid = new Vector3(0.5, 1, 0.5);
    /**
     * Gets or sets the ellipsoid offset used to impersonate this mesh when using collision engine (default is (0, 0, 0))
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     */
    public ellipsoidOffset = new Vector3(0, 0, 0);

    /**
     * Gets or sets a collision mask used to mask collisions (default is -1).
     * A collision between A and B will happen if A.collisionGroup & b.collisionMask !== 0
     */
    public get collisionMask(): number {
        return this._internalAbstractMeshDataInfo._meshCollisionData._collisionMask;
    }

    public set collisionMask(mask: number) {
        this._internalAbstractMeshDataInfo._meshCollisionData._collisionMask = !isNaN(mask) ? mask : -1;
    }

    /**
     * Gets or sets a collision response flag (default is true).
     * when collisionResponse is false, events are still triggered but colliding entity has no response
     * This helps creating trigger volume when user wants collision feedback events but not position/velocity
     * to respond to the collision.
     */
    public get collisionResponse(): boolean {
        return this._internalAbstractMeshDataInfo._meshCollisionData._collisionResponse;
    }

    public set collisionResponse(response: boolean) {
        this._internalAbstractMeshDataInfo._meshCollisionData._collisionResponse = response;
    }
    /**
     * Gets or sets the current collision group mask (-1 by default).
     * A collision between A and B will happen if A.collisionGroup & b.collisionMask !== 0
     */
    public get collisionGroup(): number {
        return this._internalAbstractMeshDataInfo._meshCollisionData._collisionGroup;
    }

    public set collisionGroup(mask: number) {
        this._internalAbstractMeshDataInfo._meshCollisionData._collisionGroup = !isNaN(mask) ? mask : -1;
    }

    /**
     * Gets or sets current surrounding meshes (null by default).
     *
     * By default collision detection is tested against every mesh in the scene.
     * It is possible to set surroundingMeshes to a defined list of meshes and then only these specified
     * meshes will be tested for the collision.
     *
     * Note: if set to an empty array no collision will happen when this mesh is moved.
     */
    public get surroundingMeshes(): Nullable<AbstractMesh[]> {
        return this._internalAbstractMeshDataInfo._meshCollisionData._surroundingMeshes;
    }

    public set surroundingMeshes(meshes: Nullable<AbstractMesh[]>) {
        this._internalAbstractMeshDataInfo._meshCollisionData._surroundingMeshes = meshes;
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
    /** @internal */
    public _edgesRenderer: Nullable<IEdgesRenderer> = null;

    /** @internal */
    public _masterMesh: Nullable<AbstractMesh> = null;
    protected _boundingInfo: Nullable<BoundingInfo> = null;
    protected _boundingInfoIsDirty = true;
    /** @internal */
    public _renderId = 0;

    /**
     * Gets or sets the list of subMeshes
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/multiMaterials
     */
    public subMeshes: SubMesh[];

    /** @internal */
    public _intersectionsInProgress = new Array<AbstractMesh>();

    /** @internal */
    public _unIndexed = false;

    /** @internal */
    public _lightSources = new Array<Light>();

    /** Gets the list of lights affecting that mesh */
    public get lightSources(): Light[] {
        return this._lightSources;
    }

    /** @internal */
    public get _positions(): Nullable<Vector3[]> {
        return null;
    }

    // Loading properties
    /** @internal */
    public _waitingData: {
        lods: Nullable<any>;
        actions: Nullable<any>;
        freezeWorldMatrix: Nullable<boolean>;
    } = {
        lods: null,
        actions: null,
        freezeWorldMatrix: null,
    };

    /** @internal */
    public _bonesTransformMatrices: Nullable<Float32Array> = null;

    /** @internal */
    public _transformMatrixTexture: Nullable<RawTexture> = null;

    /**
     * Gets or sets a skeleton to apply skinning transformations
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/bonesSkeletons
     */
    public set skeleton(value: Nullable<Skeleton>) {
        const skeleton = this._internalAbstractMeshDataInfo._skeleton;
        if (skeleton && skeleton.needInitialSkinMatrix) {
            skeleton._unregisterMeshWithPoseMatrix(this);
        }

        if (value && value.needInitialSkinMatrix) {
            value._registerMeshWithPoseMatrix(this);
        }

        this._internalAbstractMeshDataInfo._skeleton = value;

        if (!this._internalAbstractMeshDataInfo._skeleton) {
            this._bonesTransformMatrices = null;
        }

        this._markSubMeshesAsAttributesDirty();
    }

    public get skeleton(): Nullable<Skeleton> {
        return this._internalAbstractMeshDataInfo._skeleton;
    }

    /**
     * An event triggered when the mesh is rebuilt.
     */
    public onRebuildObservable = new Observable<AbstractMesh>();

    /**
     * The current mesh uniform buffer.
     * @internal Internal use only.
     */
    public _uniformBuffer: UniformBuffer;

    // Constructor

    /**
     * Creates a new AbstractMesh
     * @param name defines the name of the mesh
     * @param scene defines the hosting scene
     */
    constructor(name: string, scene: Nullable<Scene> = null) {
        super(name, scene, false);

        scene = this.getScene();

        scene.addMesh(this);

        this._resyncLightSources();

        // Mesh Uniform Buffer.
        this._uniformBuffer = new UniformBuffer(this.getScene().getEngine(), undefined, undefined, name, !this.getScene().getEngine().isWebGPU);
        this._buildUniformLayout();

        switch (scene.performancePriority) {
            case ScenePerformancePriority.Aggressive:
                this.doNotSyncBoundingInfo = true;
            // eslint-disable-next-line no-fallthrough
            case ScenePerformancePriority.Intermediate:
                this.alwaysSelectAsActiveMesh = true;
                this.isPickable = false;
                break;
        }
    }

    protected _buildUniformLayout(): void {
        this._uniformBuffer.addUniform("world", 16);
        this._uniformBuffer.addUniform("visibility", 1);
        this._uniformBuffer.create();
    }

    /**
     * Transfer the mesh values to its UBO.
     * @param world The world matrix associated with the mesh
     */
    public transferToEffect(world: Matrix): void {
        const ubo = this._uniformBuffer;

        ubo.updateMatrix("world", world);
        ubo.updateFloat("visibility", this._internalAbstractMeshDataInfo._visibility);

        ubo.update();
    }

    /**
     * Gets the mesh uniform buffer.
     * @returns the uniform buffer of the mesh.
     */
    public getMeshUniformBuffer(): UniformBuffer {
        return this._uniformBuffer;
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
        let ret = "Name: " + this.name + ", isInstance: " + (this.getClassName() !== "InstancedMesh" ? "YES" : "NO");
        ret += ", # of submeshes: " + (this.subMeshes ? this.subMeshes.length : 0);

        const skeleton = this._internalAbstractMeshDataInfo._skeleton;
        if (skeleton) {
            ret += ", skeleton: " + skeleton.name;
        }
        if (fullDetails) {
            ret += ", billboard mode: " + ["NONE", "X", "Y", null, "Z", null, null, "ALL"][this.billboardMode];
            ret += ", freeze wrld mat: " + (this._isWorldMatrixFrozen || this._waitingData.freezeWorldMatrix ? "YES" : "NO");
        }
        return ret;
    }

    /**
     * @internal
     */
    protected _getEffectiveParent(): Nullable<Node> {
        if (this._masterMesh && this.billboardMode !== TransformNode.BILLBOARDMODE_NONE) {
            return this._masterMesh;
        }

        return super._getEffectiveParent();
    }

    /**
     * @internal
     */
    public _getActionManagerForTrigger(trigger?: number, initialCall = true): Nullable<AbstractActionManager> {
        if (this.actionManager && (initialCall || this.actionManager.isRecursive)) {
            if (trigger) {
                if (this.actionManager.hasSpecificTrigger(trigger)) {
                    return this.actionManager;
                }
            } else {
                return this.actionManager;
            }
        }

        if (!this.parent) {
            return null;
        }

        return this.parent._getActionManagerForTrigger(trigger, false);
    }

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _rebuild(dispose = false): void {
        this.onRebuildObservable.notifyObservers(this);

        if (this._occlusionQuery !== null) {
            this._occlusionQuery = null;
        }

        if (!this.subMeshes) {
            return;
        }

        for (const subMesh of this.subMeshes) {
            subMesh._rebuild();
        }

        this.resetDrawCache();
    }

    /** @internal */
    public _resyncLightSources(): void {
        this._lightSources.length = 0;

        for (const light of this.getScene().lights) {
            if (!light.isEnabled()) {
                continue;
            }

            if (light.canAffectMesh(this)) {
                this._lightSources.push(light);
            }
        }

        this._markSubMeshesAsLightDirty();
    }

    /**
     * @internal
     */
    public _resyncLightSource(light: Light): void {
        const isIn = light.isEnabled() && light.canAffectMesh(this);

        const index = this._lightSources.indexOf(light);
        let removed = false;
        if (index === -1) {
            if (!isIn) {
                return;
            }
            this._lightSources.push(light);
        } else {
            if (isIn) {
                return;
            }
            removed = true;
            this._lightSources.splice(index, 1);
        }

        this._markSubMeshesAsLightDirty(removed);
    }

    /** @internal */
    public _unBindEffect() {
        for (const subMesh of this.subMeshes) {
            subMesh.setEffect(null);
        }
    }

    /**
     * @internal
     */
    public _removeLightSource(light: Light, dispose: boolean): void {
        const index = this._lightSources.indexOf(light);

        if (index === -1) {
            return;
        }
        this._lightSources.splice(index, 1);

        this._markSubMeshesAsLightDirty(dispose);
    }

    private _markSubMeshesAsDirty(func: (defines: MaterialDefines) => void) {
        if (!this.subMeshes) {
            return;
        }

        for (const subMesh of this.subMeshes) {
            for (let i = 0; i < subMesh._drawWrappers.length; ++i) {
                const drawWrapper = subMesh._drawWrappers[i];
                if (!drawWrapper || !drawWrapper.defines || !(drawWrapper.defines as MaterialDefines).markAllAsDirty) {
                    continue;
                }
                func(drawWrapper.defines as MaterialDefines);
            }
        }
    }

    /**
     * @internal
     */
    public _markSubMeshesAsLightDirty(dispose: boolean = false) {
        this._markSubMeshesAsDirty((defines) => defines.markAsLightDirty(dispose));
    }

    /** @internal */
    public _markSubMeshesAsAttributesDirty() {
        this._markSubMeshesAsDirty((defines) => defines.markAsAttributesDirty());
    }

    /** @internal */
    public _markSubMeshesAsMiscDirty() {
        this._markSubMeshesAsDirty((defines) => defines.markAsMiscDirty());
    }

    /**
     * Flag the AbstractMesh as dirty (Forcing it to update everything)
     * @param property if set to "rotation" the objects rotationQuaternion will be set to null
     * @returns this AbstractMesh
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public markAsDirty(property?: string): AbstractMesh {
        this._currentRenderId = Number.MAX_VALUE;
        this._isDirty = true;
        return this;
    }

    /**
     * Resets the draw wrappers cache for all submeshes of this abstract mesh
     * @param passId If provided, releases only the draw wrapper corresponding to this render pass id
     */
    public resetDrawCache(passId?: number): void {
        if (!this.subMeshes) {
            return;
        }

        for (const subMesh of this.subMeshes) {
            subMesh.resetDrawCache(passId);
        }
    }

    // Methods
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
     * Returns a positive integer : the total number of indices in this mesh geometry.
     * @returns the number of indices or zero if the mesh has no geometry.
     */
    public getTotalIndices(): number {
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public getVerticesData(kind: string): Nullable<FloatArray> {
        return null;
    }

    /**
     * Sets the vertex data of the mesh geometry for the requested `kind`.
     * If the mesh has no geometry, a new Geometry object is set to the mesh and then passed this vertex data.
     * Note that a new underlying VertexBuffer object is created each call.
     * If the `kind` is the `PositionKind`, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed.
     * @param kind defines vertex data kind:
     * * VertexBuffer.PositionKind
     * * VertexBuffer.UVKind
     * * VertexBuffer.UV2Kind
     * * VertexBuffer.UV3Kind
     * * VertexBuffer.UV4Kind
     * * VertexBuffer.UV5Kind
     * * VertexBuffer.UV6Kind
     * * VertexBuffer.ColorKind
     * * VertexBuffer.MatricesIndicesKind
     * * VertexBuffer.MatricesIndicesExtraKind
     * * VertexBuffer.MatricesWeightsKind
     * * VertexBuffer.MatricesWeightsExtraKind
     * @param data defines the data source
     * @param updatable defines if the data must be flagged as updatable (or static)
     * @param stride defines the vertex stride (size of an entire vertex). Can be null and in this case will be deduced from vertex data kind
     * @returns the current mesh
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public setVerticesData(kind: string, data: FloatArray, updatable?: boolean, stride?: number): AbstractMesh {
        return this;
    }

    /**
     * Updates the existing vertex data of the mesh geometry for the requested `kind`.
     * If the mesh has no geometry, it is simply returned as it is.
     * @param kind defines vertex data kind:
     * * VertexBuffer.PositionKind
     * * VertexBuffer.UVKind
     * * VertexBuffer.UV2Kind
     * * VertexBuffer.UV3Kind
     * * VertexBuffer.UV4Kind
     * * VertexBuffer.UV5Kind
     * * VertexBuffer.UV6Kind
     * * VertexBuffer.ColorKind
     * * VertexBuffer.MatricesIndicesKind
     * * VertexBuffer.MatricesIndicesExtraKind
     * * VertexBuffer.MatricesWeightsKind
     * * VertexBuffer.MatricesWeightsExtraKind
     * @param data defines the data source
     * @param updateExtends If `kind` is `PositionKind` and if `updateExtends` is true, the mesh BoundingInfo is renewed, so the bounding box and sphere, and the mesh World Matrix is recomputed
     * @param makeItUnique If true, a new global geometry is created from this data and is set to the mesh
     * @returns the current mesh
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public setIndices(indices: IndicesArray, totalVertices: Nullable<number>): AbstractMesh {
        return this;
    }

    /**
     * Gets a boolean indicating if specific vertex data is present
     * @param kind defines the vertex data kind to use
     * @returns true is data kind is present
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public isVerticesDataPresent(kind: string): boolean {
        return false;
    }

    /**
     * Returns the mesh BoundingInfo object or creates a new one and returns if it was undefined.
     * Note that it returns a shallow bounding of the mesh (i.e. it does not include children).
     * However, if the mesh contains thin instances, it will be expanded to include them. If you want the "raw" bounding data instead, then use `getRawBoundingInfo()`.
     * To get the full bounding of all children, call `getHierarchyBoundingVectors` instead.
     * @returns a BoundingInfo
     */
    public getBoundingInfo(): BoundingInfo {
        if (this._masterMesh) {
            return this._masterMesh.getBoundingInfo();
        }

        if (this._boundingInfoIsDirty) {
            this._boundingInfoIsDirty = false;
            // this._boundingInfo is being created if undefined
            this._updateBoundingInfo();
        }
        // cannot be null.
        return this._boundingInfo!;
    }

    /**
     * Returns the bounding info unnafected by instance data.
     * @returns the bounding info of the mesh unaffected by instance data.
     */
    public getRawBoundingInfo() {
        return this.rawBoundingInfo ?? this.getBoundingInfo();
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

    /**
     * Returns true if there is already a bounding info
     */
    public get hasBoundingInfo(): boolean {
        return this._boundingInfo !== null;
    }

    /**
     * Creates a new bounding info for the mesh
     * @param minimum min vector of the bounding box/sphere
     * @param maximum max vector of the bounding box/sphere
     * @param worldMatrix defines the new world matrix
     * @returns the new bounding info
     */
    public buildBoundingInfo(minimum: DeepImmutable<Vector3>, maximum: DeepImmutable<Vector3>, worldMatrix?: DeepImmutable<Matrix>) {
        this._boundingInfo = new BoundingInfo(minimum, maximum, worldMatrix);
        return this._boundingInfo;
    }

    /**
     * Uniformly scales the mesh to fit inside of a unit cube (1 X 1 X 1 units)
     * @param includeDescendants Use the hierarchy's bounding box instead of the mesh's bounding box. Default is false
     * @param ignoreRotation ignore rotation when computing the scale (ie. object will be axis aligned). Default is false
     * @param predicate predicate that is passed in to getHierarchyBoundingVectors when selecting which object should be included when scaling
     * @returns the current mesh
     */
    public normalizeToUnitCube(includeDescendants = true, ignoreRotation = false, predicate?: Nullable<(node: AbstractMesh) => boolean>): AbstractMesh {
        return <AbstractMesh>super.normalizeToUnitCube(includeDescendants, ignoreRotation, predicate);
    }

    /** Gets a boolean indicating if this mesh has skinning data and an attached skeleton */
    public get useBones(): boolean {
        return <boolean>(
            (this.skeleton &&
                this.getScene().skeletonsEnabled &&
                this.isVerticesDataPresent(VertexBuffer.MatricesIndicesKind) &&
                this.isVerticesDataPresent(VertexBuffer.MatricesWeightsKind))
        );
    }

    /** @internal */
    public _preActivate(): void {}

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _preActivateForIntermediateRendering(renderId: number): void {}

    /**
     * @internal
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public _activate(renderId: number, intermediateRendering: boolean): boolean {
        this._renderId = renderId;
        return true;
    }

    /** @internal */
    public _postActivate(): void {
        // Do nothing
    }

    /** @internal */
    public _freeze() {
        // Do nothing
    }

    /** @internal */
    public _unFreeze() {
        // Do nothing
    }

    /**
     * Gets the current world matrix
     * @returns a Matrix
     */
    public getWorldMatrix(): Matrix {
        if (this._masterMesh && this.billboardMode === TransformNode.BILLBOARDMODE_NONE) {
            return this._masterMesh.getWorldMatrix();
        }

        return super.getWorldMatrix();
    }

    /** @internal */
    public _getWorldMatrixDeterminant(): number {
        if (this._masterMesh) {
            return this._masterMesh._getWorldMatrixDeterminant();
        }

        return super._getWorldMatrixDeterminant();
    }

    /**
     * Gets a boolean indicating if this mesh is an instance or a regular mesh
     */
    public get isAnInstance(): boolean {
        return false;
    }

    /**
     * Gets a boolean indicating if this mesh has instances
     */
    public get hasInstances(): boolean {
        return false;
    }

    /**
     * Gets a boolean indicating if this mesh has thin instances
     */
    public get hasThinInstances(): boolean {
        return false;
    }

    // ================================== Point of View Movement =================================

    /**
     * Perform relative position change from the point of view of behind the front of the mesh.
     * This is performed taking into account the meshes current rotation, so you do not have to care.
     * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
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
     * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
     * @param amountRight defines the distance on the right axis
     * @param amountUp defines the distance on the up axis
     * @param amountForward defines the distance on the forward axis
     * @returns the new displacement vector
     */
    public calcMovePOV(amountRight: number, amountUp: number, amountForward: number): Vector3 {
        const rotMatrix = new Matrix();
        const rotQuaternion = this.rotationQuaternion ? this.rotationQuaternion : Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
        rotQuaternion.toRotationMatrix(rotMatrix);

        const translationDelta = Vector3.Zero();
        const defForwardMult = this.definedFacingForward ? -1 : 1;
        Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
        return translationDelta;
    }
    // ================================== Point of View Rotation =================================
    /**
     * Perform relative rotation change from the point of view of behind the front of the mesh.
     * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
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
     * Supports definition of mesh facing forward or backward {@link definedFacingForwardSearch | See definedFacingForwardSearch }.
     * @param flipBack defines the flip
     * @param twirlClockwise defines the twirl
     * @param tiltRight defines the tilt
     * @returns the new rotation vector
     */
    public calcRotatePOV(flipBack: number, twirlClockwise: number, tiltRight: number): Vector3 {
        const defForwardMult = this.definedFacingForward ? 1 : -1;
        return new Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
    }

    /**
     * This method recomputes and sets a new BoundingInfo to the mesh unless it is locked.
     * This means the mesh underlying bounding box and sphere are recomputed.
     * @param applySkeleton defines whether to apply the skeleton before computing the bounding info
     * @param applyMorph  defines whether to apply the morph target before computing the bounding info
     * @returns the current mesh
     */
    public refreshBoundingInfo(applySkeleton: boolean = false, applyMorph: boolean = false): AbstractMesh {
        if (this._boundingInfo && this._boundingInfo.isLocked) {
            return this;
        }

        this._refreshBoundingInfo(this._getPositionData(applySkeleton, applyMorph), null);
        return this;
    }

    /**
     * @internal
     */
    public _refreshBoundingInfo(data: Nullable<FloatArray>, bias: Nullable<Vector2>): void {
        if (data) {
            const extend = extractMinAndMax(data, 0, this.getTotalVertices(), bias);
            if (this._boundingInfo) {
                this._boundingInfo.reConstruct(extend.minimum, extend.maximum);
            } else {
                this._boundingInfo = new BoundingInfo(extend.minimum, extend.maximum);
            }
        }

        if (this.subMeshes) {
            for (let index = 0; index < this.subMeshes.length; index++) {
                this.subMeshes[index].refreshBoundingInfo(data);
            }
        }

        this._updateBoundingInfo();
    }

    /**
     * Internal function to get buffer data and possibly apply morphs and normals
     * @param applySkeleton
     * @param applyMorph
     * @param data
     * @param kind the kind of data you want. Can be Normal or Position
     * @returns a FloatArray of the vertex data
     */
    private _getData(applySkeleton: boolean = false, applyMorph: boolean = false, data?: Nullable<FloatArray>, kind: string = VertexBuffer.PositionKind): Nullable<FloatArray> {
        data = data ?? this.getVerticesData(kind)!.slice();

        if (data && applyMorph && this.morphTargetManager) {
            let faceIndexCount = 0;
            let positionIndex = 0;
            for (let vertexCount = 0; vertexCount < data.length; vertexCount++) {
                let value = data[vertexCount];
                for (let targetCount = 0; targetCount < this.morphTargetManager.numTargets; targetCount++) {
                    const targetMorph = this.morphTargetManager.getTarget(targetCount);
                    const influence = targetMorph.influence;
                    if (influence !== 0.0) {
                        let morphTargetData: Nullable<FloatArray> = null;
                        switch (kind) {
                            case VertexBuffer.PositionKind:
                                morphTargetData = targetMorph.getPositions();
                                break;
                            case VertexBuffer.NormalKind:
                                morphTargetData = targetMorph.getNormals();
                                break;
                            case VertexBuffer.TangentKind:
                                morphTargetData = targetMorph.getTangents();
                                break;
                            case VertexBuffer.UVKind:
                                morphTargetData = targetMorph.getUVs();
                                break;
                        }
                        if (morphTargetData) {
                            value += (morphTargetData[vertexCount] - data[vertexCount]) * influence;
                        }
                    }
                }
                data[vertexCount] = value;

                faceIndexCount++;
                if (kind === VertexBuffer.PositionKind) {
                    if (this._positions && faceIndexCount === 3) {
                        // We want to merge into positions every 3 indices starting (but not 0)
                        faceIndexCount = 0;
                        const index = positionIndex * 3;
                        this._positions[positionIndex++].copyFromFloats(data[index], data[index + 1], data[index + 2]);
                    }
                }
            }
        }

        if (data && applySkeleton && this.skeleton) {
            const matricesIndicesData = this.getVerticesData(VertexBuffer.MatricesIndicesKind);
            const matricesWeightsData = this.getVerticesData(VertexBuffer.MatricesWeightsKind);
            if (matricesWeightsData && matricesIndicesData) {
                const needExtras = this.numBoneInfluencers > 4;
                const matricesIndicesExtraData = needExtras ? this.getVerticesData(VertexBuffer.MatricesIndicesExtraKind) : null;
                const matricesWeightsExtraData = needExtras ? this.getVerticesData(VertexBuffer.MatricesWeightsExtraKind) : null;

                const skeletonMatrices = this.skeleton.getTransformMatrices(this);

                const tempVector = TmpVectors.Vector3[0];
                const finalMatrix = TmpVectors.Matrix[0];
                const tempMatrix = TmpVectors.Matrix[1];

                let matWeightIdx = 0;
                for (let index = 0; index < data.length; index += 3, matWeightIdx += 4) {
                    finalMatrix.reset();

                    let inf: number;
                    let weight: number;
                    for (inf = 0; inf < 4; inf++) {
                        weight = matricesWeightsData[matWeightIdx + inf];
                        if (weight > 0) {
                            Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, Math.floor(matricesIndicesData[matWeightIdx + inf] * 16), weight, tempMatrix);
                            finalMatrix.addToSelf(tempMatrix);
                        }
                    }
                    if (needExtras) {
                        for (inf = 0; inf < 4; inf++) {
                            weight = matricesWeightsExtraData![matWeightIdx + inf];
                            if (weight > 0) {
                                Matrix.FromFloat32ArrayToRefScaled(skeletonMatrices, Math.floor(matricesIndicesExtraData![matWeightIdx + inf] * 16), weight, tempMatrix);
                                finalMatrix.addToSelf(tempMatrix);
                            }
                        }
                    }

                    if (kind === VertexBuffer.NormalKind) {
                        Vector3.TransformNormalFromFloatsToRef(data[index], data[index + 1], data[index + 2], finalMatrix, tempVector);
                    } else {
                        Vector3.TransformCoordinatesFromFloatsToRef(data[index], data[index + 1], data[index + 2], finalMatrix, tempVector);
                    }
                    tempVector.toArray(data, index);

                    if (kind === VertexBuffer.PositionKind && this._positions) {
                        this._positions[index / 3].copyFrom(tempVector);
                    }
                }
            }
        }

        return data;
    }

    /**
     * Get the normals vertex data and optionally apply skeleton and morphing.
     * @param applySkeleton defines whether to apply the skeleton
     * @param applyMorph  defines whether to apply the morph target
     * @returns the normals data
     */
    public getNormalsData(applySkeleton = false, applyMorph = false): Nullable<FloatArray> {
        return this._getData(applySkeleton, applyMorph, null, VertexBuffer.NormalKind);
    }

    /**
     * Get the position vertex data and optionally apply skeleton and morphing.
     * @param applySkeleton defines whether to apply the skeleton
     * @param applyMorph  defines whether to apply the morph target
     * @param data defines the position data to apply the skeleton and morph to
     * @returns the position data
     */
    public getPositionData(applySkeleton: boolean = false, applyMorph: boolean = false, data?: Nullable<FloatArray>): Nullable<FloatArray> {
        return this._getData(applySkeleton, applyMorph, data, VertexBuffer.PositionKind);
    }

    /**
     * @internal
     */
    public _getPositionData(applySkeleton: boolean, applyMorph: boolean): Nullable<FloatArray> {
        let data = this.getVerticesData(VertexBuffer.PositionKind);

        if (this._internalAbstractMeshDataInfo._positions) {
            this._internalAbstractMeshDataInfo._positions = null;
        }

        if (data && ((applySkeleton && this.skeleton) || (applyMorph && this.morphTargetManager))) {
            data = data.slice();
            this._generatePointsArray();
            if (this._positions) {
                const pos = this._positions;
                this._internalAbstractMeshDataInfo._positions = new Array<Vector3>(pos.length);
                for (let i = 0; i < pos.length; i++) {
                    this._internalAbstractMeshDataInfo._positions[i] = pos[i]?.clone() || new Vector3();
                }
            }
            return this.getPositionData(applySkeleton, applyMorph, data);
        }

        return data;
    }

    /** @internal */
    public _updateBoundingInfo(): AbstractMesh {
        if (this._boundingInfo) {
            this._boundingInfo.update(this.worldMatrixFromCache);
        } else {
            this._boundingInfo = new BoundingInfo(Vector3.Zero(), Vector3.Zero(), this.worldMatrixFromCache);
        }
        this._updateSubMeshesBoundingInfo(this.worldMatrixFromCache);
        return this;
    }

    /**
     * @internal
     */
    public _updateSubMeshesBoundingInfo(matrix: DeepImmutable<Matrix>): AbstractMesh {
        if (!this.subMeshes) {
            return this;
        }
        const count = this.subMeshes.length;
        for (let subIndex = 0; subIndex < count; subIndex++) {
            const subMesh = this.subMeshes[subIndex];
            if (count > 1 || !subMesh.IsGlobal) {
                subMesh.updateBoundingInfo(matrix);
            }
        }
        return this;
    }

    /** @internal */
    protected _afterComputeWorldMatrix(): void {
        if (this.doNotSyncBoundingInfo) {
            return;
        }
        // Bounding info
        this._boundingInfoIsDirty = true;
    }

    /**
     * Returns `true` if the mesh is within the frustum defined by the passed array of planes.
     * A mesh is in the frustum if its bounding box intersects the frustum
     * @param frustumPlanes defines the frustum to test
     * @returns true if the mesh is in the frustum planes
     */
    public isInFrustum(frustumPlanes: Plane[]): boolean {
        return this.getBoundingInfo().isInFrustum(frustumPlanes, this.cullingStrategy);
    }

    /**
     * Returns `true` if the mesh is completely in the frustum defined be the passed array of planes.
     * A mesh is completely in the frustum if its bounding box it completely inside the frustum.
     * @param frustumPlanes defines the frustum to test
     * @returns true if the mesh is completely in the frustum planes
     */
    public isCompletelyInFrustum(frustumPlanes: Plane[]): boolean {
        return this.getBoundingInfo().isCompletelyInFrustum(frustumPlanes);
    }

    /**
     * True if the mesh intersects another mesh or a SolidParticle object
     * @param mesh defines a target mesh or SolidParticle to test
     * @param precise Unless the parameter `precise` is set to `true` the intersection is computed according to Axis Aligned Bounding Boxes (AABB), else according to OBB (Oriented BBoxes)
     * @param includeDescendants Can be set to true to test if the mesh defined in parameters intersects with the current mesh or any child meshes
     * @returns true if there is an intersection
     */
    public intersectsMesh(mesh: AbstractMesh | SolidParticle, precise: boolean = false, includeDescendants?: boolean): boolean {
        const boundingInfo = this.getBoundingInfo();
        const otherBoundingInfo = mesh.getBoundingInfo();

        if (boundingInfo.intersects(otherBoundingInfo, precise)) {
            return true;
        }

        if (includeDescendants) {
            for (const child of this.getChildMeshes()) {
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
        return this.getBoundingInfo().intersectsPoint(point);
    }

    // Collisions

    /**
     * Gets or sets a boolean indicating that this mesh can be used in the collision engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     */
    public get checkCollisions(): boolean {
        return this._internalAbstractMeshDataInfo._meshCollisionData._checkCollisions;
    }

    public set checkCollisions(collisionEnabled: boolean) {
        this._internalAbstractMeshDataInfo._meshCollisionData._checkCollisions = collisionEnabled;
    }

    /**
     * Gets Collider object used to compute collisions (not physics)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     */
    public get collider(): Nullable<Collider> {
        return this._internalAbstractMeshDataInfo._meshCollisionData._collider;
    }

    /**
     * Move the mesh using collision engine
     * @see https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_collisions
     * @param displacement defines the requested displacement vector
     * @returns the current mesh
     */
    public moveWithCollisions(displacement: Vector3): AbstractMesh {
        const globalPosition = this.getAbsolutePosition();

        globalPosition.addToRef(this.ellipsoidOffset, this._internalAbstractMeshDataInfo._meshCollisionData._oldPositionForCollisions);
        const coordinator = this.getScene().collisionCoordinator;

        if (!this._internalAbstractMeshDataInfo._meshCollisionData._collider) {
            this._internalAbstractMeshDataInfo._meshCollisionData._collider = coordinator.createCollider();
        }

        this._internalAbstractMeshDataInfo._meshCollisionData._collider._radius = this.ellipsoid;

        coordinator.getNewPosition(
            this._internalAbstractMeshDataInfo._meshCollisionData._oldPositionForCollisions,
            displacement,
            this._internalAbstractMeshDataInfo._meshCollisionData._collider,
            this.collisionRetryCount,
            this,
            this._onCollisionPositionChange,
            this.uniqueId
        );
        return this;
    }

    private _onCollisionPositionChange = (collisionId: number, newPosition: Vector3, collidedMesh: Nullable<AbstractMesh> = null) => {
        newPosition.subtractToRef(
            this._internalAbstractMeshDataInfo._meshCollisionData._oldPositionForCollisions,
            this._internalAbstractMeshDataInfo._meshCollisionData._diffPositionForCollisions
        );

        if (this._internalAbstractMeshDataInfo._meshCollisionData._diffPositionForCollisions.length() > Engine.CollisionsEpsilon) {
            this.position.addInPlace(this._internalAbstractMeshDataInfo._meshCollisionData._diffPositionForCollisions);
        }

        if (collidedMesh) {
            this.onCollideObservable.notifyObservers(collidedMesh);
        }

        this.onCollisionPositionChangeObservable.notifyObservers(this.position);
    };

    // Collisions
    /**
     * @internal
     */
    public _collideForSubMesh(subMesh: SubMesh, transformMatrix: Matrix, collider: Collider): AbstractMesh {
        this._generatePointsArray();

        if (!this._positions) {
            return this;
        }

        // Transformation
        if (!subMesh._lastColliderWorldVertices || !subMesh._lastColliderTransformMatrix!.equals(transformMatrix)) {
            subMesh._lastColliderTransformMatrix = transformMatrix.clone();
            subMesh._lastColliderWorldVertices = [];
            subMesh._trianglePlanes = [];
            const start = subMesh.verticesStart;
            const end = subMesh.verticesStart + subMesh.verticesCount;
            for (let i = start; i < end; i++) {
                subMesh._lastColliderWorldVertices.push(Vector3.TransformCoordinates(this._positions[i], transformMatrix));
            }
        }

        // Collide
        collider._collide(
            subMesh._trianglePlanes,
            subMesh._lastColliderWorldVertices,
            <IndicesArray>this.getIndices(),
            subMesh.indexStart,
            subMesh.indexStart + subMesh.indexCount,
            subMesh.verticesStart,
            !!subMesh.getMaterial(),
            this,
            this._shouldConvertRHS(),
            subMesh.getMaterial()?.fillMode === Constants.MATERIAL_TriangleStripDrawMode
        );
        return this;
    }

    /**
     * @internal
     */
    public _processCollisionsForSubMeshes(collider: Collider, transformMatrix: Matrix): AbstractMesh {
        const subMeshes = this._scene.getCollidingSubMeshCandidates(this, collider);
        const len = subMeshes.length;

        for (let index = 0; index < len; index++) {
            const subMesh = subMeshes.data[index];

            // Bounding test
            if (len > 1 && !subMesh._checkCollision(collider)) {
                continue;
            }

            this._collideForSubMesh(subMesh, transformMatrix, collider);
        }
        return this;
    }

    /** @internal */
    public _shouldConvertRHS() {
        return false;
    }

    /**
     * @internal
     */
    public _checkCollision(collider: Collider): AbstractMesh {
        // Bounding box test
        if (!this.getBoundingInfo()._checkCollision(collider)) {
            return this;
        }

        // Transformation matrix
        const collisionsScalingMatrix = TmpVectors.Matrix[0];
        const collisionsTransformMatrix = TmpVectors.Matrix[1];
        Matrix.ScalingToRef(1.0 / collider._radius.x, 1.0 / collider._radius.y, 1.0 / collider._radius.z, collisionsScalingMatrix);
        this.worldMatrixFromCache.multiplyToRef(collisionsScalingMatrix, collisionsTransformMatrix);
        this._processCollisionsForSubMeshes(collider, collisionsTransformMatrix);
        return this;
    }

    // Picking
    /** @internal */
    public _generatePointsArray(): boolean {
        return false;
    }

    /**
     * Checks if the passed Ray intersects with the mesh. A mesh triangle can be picked both from its front and back sides,
     * irrespective of orientation.
     * @param ray defines the ray to use. It should be in the mesh's LOCAL coordinate space.
     * @param fastCheck defines if fast mode (but less precise) must be used (false by default)
     * @param trianglePredicate defines an optional predicate used to select faces when a mesh intersection is detected
     * @param onlyBoundingInfo defines a boolean indicating if picking should only happen using bounding info (false by default)
     * @param worldToUse defines the world matrix to use to get the world coordinate of the intersection point
     * @param skipBoundingInfo a boolean indicating if we should skip the bounding info check
     * @returns the picking info
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/interactions/mesh_intersect
     */
    public intersects(
        ray: Ray,
        fastCheck?: boolean,
        trianglePredicate?: TrianglePickingPredicate,
        onlyBoundingInfo = false,
        worldToUse?: Matrix,
        skipBoundingInfo = false
    ): PickingInfo {
        const pickingInfo = new PickingInfo();
        const className = this.getClassName();
        const intersectionThreshold = className === "InstancedLinesMesh" || className === "LinesMesh" || className === "GreasedLineMesh" ? (this as any).intersectionThreshold : 0;
        const boundingInfo = this.getBoundingInfo();
        if (!this.subMeshes) {
            return pickingInfo;
        }
        if (
            !skipBoundingInfo &&
            (!ray.intersectsSphere(boundingInfo.boundingSphere, intersectionThreshold) || !ray.intersectsBox(boundingInfo.boundingBox, intersectionThreshold))
        ) {
            return pickingInfo;
        }

        if (onlyBoundingInfo) {
            pickingInfo.hit = skipBoundingInfo ? false : true;
            pickingInfo.pickedMesh = skipBoundingInfo ? null : this;
            pickingInfo.distance = skipBoundingInfo ? 0 : Vector3.Distance(ray.origin, boundingInfo.boundingSphere.center);
            pickingInfo.subMeshId = 0;
            return pickingInfo;
        }

        if (!this._generatePointsArray()) {
            return pickingInfo;
        }

        let intersectInfo: Nullable<IntersectionInfo> = null;

        const subMeshes = this._scene.getIntersectingSubMeshCandidates(this, ray);
        const len: number = subMeshes.length;

        // Check if all submeshes are using a material that don't allow picking (point/lines rendering)
        // if no submesh can be picked that way, then fallback to BBox picking
        let anySubmeshSupportIntersect = false;
        for (let index = 0; index < len; index++) {
            const subMesh = subMeshes.data[index];
            const material = subMesh.getMaterial();
            if (!material) {
                continue;
            }
            if (
                material.fillMode == Constants.MATERIAL_TriangleStripDrawMode ||
                material.fillMode == Constants.MATERIAL_TriangleFillMode ||
                material.fillMode == Constants.MATERIAL_WireFrameFillMode ||
                material.fillMode == Constants.MATERIAL_PointFillMode ||
                material.fillMode == Constants.MATERIAL_LineListDrawMode
            ) {
                anySubmeshSupportIntersect = true;
                break;
            }
        }

        // no sub mesh support intersection, fallback to BBox that has already be done
        if (!anySubmeshSupportIntersect) {
            pickingInfo.hit = true;
            pickingInfo.pickedMesh = this;
            pickingInfo.distance = Vector3.Distance(ray.origin, boundingInfo.boundingSphere.center);
            pickingInfo.subMeshId = -1;
            return pickingInfo;
        }

        // at least 1 submesh supports intersection, keep going
        for (let index = 0; index < len; index++) {
            const subMesh = subMeshes.data[index];

            // Bounding test
            if (len > 1 && !skipBoundingInfo && !subMesh.canIntersects(ray)) {
                continue;
            }

            const currentIntersectInfo = subMesh.intersects(ray, <Vector3[]>this._positions, <IndicesArray>this.getIndices(), fastCheck, trianglePredicate);

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
            const world = worldToUse ?? this.getWorldMatrix();
            const worldOrigin = TmpVectors.Vector3[0];
            const direction = TmpVectors.Vector3[1];
            Vector3.TransformCoordinatesToRef(ray.origin, world, worldOrigin);
            ray.direction.scaleToRef(intersectInfo.distance, direction);
            const worldDirection = Vector3.TransformNormal(direction, world);
            const pickedPoint = worldDirection.addInPlace(worldOrigin);

            // Return result
            pickingInfo.hit = true;
            pickingInfo.distance = Vector3.Distance(worldOrigin, pickedPoint);
            pickingInfo.pickedPoint = pickedPoint;
            pickingInfo.pickedMesh = this;
            pickingInfo.bu = intersectInfo.bu || 0;
            pickingInfo.bv = intersectInfo.bv || 0;
            pickingInfo.subMeshFaceId = intersectInfo.faceId;
            pickingInfo.faceId = intersectInfo.faceId + subMeshes.data[intersectInfo.subMeshId].indexStart / (this.getClassName().indexOf("LinesMesh") !== -1 ? 2 : 3);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public clone(name: string, newParent: Nullable<Node>, doNotCloneChildren?: boolean): Nullable<AbstractMesh> {
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
            this.subMeshes = [] as SubMesh[];
        }
        return this;
    }

    /**
     * Releases resources associated with this abstract mesh.
     * @param doNotRecurse Set to true to not recurse into each children (recurse into each children by default)
     * @param disposeMaterialAndTextures Set to true to also dispose referenced materials and textures (false by default)
     */
    public dispose(doNotRecurse?: boolean, disposeMaterialAndTextures = false): void {
        let index: number;

        const scene = this.getScene();

        // mesh map release.
        if (this._scene.useMaterialMeshMap) {
            // remove from material mesh map id needed
            if (this._internalAbstractMeshDataInfo._material && this._internalAbstractMeshDataInfo._material.meshMap) {
                this._internalAbstractMeshDataInfo._material.meshMap[this.uniqueId] = undefined;
            }
        }

        // Smart Array Retainers.
        scene.freeActiveMeshes();
        scene.freeRenderingGroups();
        if (scene.renderingManager.maintainStateBetweenFrames) {
            scene.renderingManager.restoreDispachedFlags();
        }

        // Action manager
        if (this.actionManager !== undefined && this.actionManager !== null) {
            // If it's the only mesh using the action manager, dispose of it.
            if (!this._scene.meshes.some((m) => m !== this && m.actionManager === this.actionManager)) {
                this.actionManager.dispose();
            }
            this.actionManager = null;
        }

        // Skeleton
        this._internalAbstractMeshDataInfo._skeleton = null;

        if (this._transformMatrixTexture) {
            this._transformMatrixTexture.dispose();
            this._transformMatrixTexture = null;
        }

        // Intersections in progress
        for (index = 0; index < this._intersectionsInProgress.length; index++) {
            const other = this._intersectionsInProgress[index];

            const pos = other._intersectionsInProgress.indexOf(this);
            other._intersectionsInProgress.splice(pos, 1);
        }

        this._intersectionsInProgress.length = 0;

        // Lights
        const lights = scene.lights;

        lights.forEach((light: Light) => {
            let meshIndex = light.includedOnlyMeshes.indexOf(this);

            if (meshIndex !== -1) {
                light.includedOnlyMeshes.splice(meshIndex, 1);
            }

            meshIndex = light.excludedMeshes.indexOf(this);

            if (meshIndex !== -1) {
                light.excludedMeshes.splice(meshIndex, 1);
            }

            // Shadow generators
            const generators = light.getShadowGenerators();
            if (generators) {
                const iterator = generators.values();
                for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                    const generator = key.value;
                    const shadowMap = generator.getShadowMap();

                    if (shadowMap && shadowMap.renderList) {
                        meshIndex = shadowMap.renderList.indexOf(this);

                        if (meshIndex !== -1) {
                            shadowMap.renderList.splice(meshIndex, 1);
                        }
                    }
                }
            }
        });

        // SubMeshes
        if (this.getClassName() !== "InstancedMesh" || this.getClassName() !== "InstancedLinesMesh") {
            this.releaseSubMeshes();
        }

        // Query
        const engine = scene.getEngine();
        if (this._occlusionQuery !== null) {
            this.isOcclusionQueryInProgress = false;
            engine.deleteQuery(this._occlusionQuery);
            this._occlusionQuery = null;
        }

        // Engine
        engine.wipeCaches();

        // Remove from scene
        scene.removeMesh(this);

        if (this._parentContainer) {
            const index = this._parentContainer.meshes.indexOf(this);
            if (index > -1) {
                this._parentContainer.meshes.splice(index, 1);
            }
            this._parentContainer = null;
        }

        if (disposeMaterialAndTextures) {
            if (this.material) {
                if (this.material.getClassName() === "MultiMaterial") {
                    this.material.dispose(false, true, true);
                } else {
                    this.material.dispose(false, true);
                }
            }
        }

        if (!doNotRecurse) {
            // Particles
            for (index = 0; index < scene.particleSystems.length; index++) {
                if (scene.particleSystems[index].emitter === this) {
                    scene.particleSystems[index].dispose();
                    index--;
                }
            }
        }

        // facet data
        if (this._internalAbstractMeshDataInfo._facetData.facetDataEnabled) {
            this.disableFacetData();
        }

        this._uniformBuffer.dispose();

        this.onAfterWorldMatrixUpdateObservable.clear();
        this.onCollideObservable.clear();
        this.onCollisionPositionChangeObservable.clear();
        this.onRebuildObservable.clear();

        super.dispose(doNotRecurse, disposeMaterialAndTextures);
    }

    /**
     * Adds the passed mesh as a child to the current mesh
     * @param mesh defines the child mesh
     * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
     * @returns the current mesh
     */
    public addChild(mesh: AbstractMesh, preserveScalingSign: boolean = false): AbstractMesh {
        mesh.setParent(this, preserveScalingSign);
        return this;
    }

    /**
     * Removes the passed mesh from the current mesh children list
     * @param mesh defines the child mesh
     * @param preserveScalingSign if true, keep scaling sign of child. Otherwise, scaling sign might change.
     * @returns the current mesh
     */
    public removeChild(mesh: AbstractMesh, preserveScalingSign: boolean = false): AbstractMesh {
        mesh.setParent(null, preserveScalingSign);
        return this;
    }

    // Facet data
    /** @internal */
    private _initFacetData(): AbstractMesh {
        const data = this._internalAbstractMeshDataInfo._facetData;
        if (!data.facetNormals) {
            data.facetNormals = [] as Vector3[];
        }
        if (!data.facetPositions) {
            data.facetPositions = [] as Vector3[];
        }
        if (!data.facetPartitioning) {
            data.facetPartitioning = new Array<number[]>();
        }
        data.facetNb = ((<IndicesArray>this.getIndices()).length / 3) | 0;
        data.partitioningSubdivisions = data.partitioningSubdivisions ? data.partitioningSubdivisions : 10; // default nb of partitioning subdivisions = 10
        data.partitioningBBoxRatio = data.partitioningBBoxRatio ? data.partitioningBBoxRatio : 1.01; // default ratio 1.01 = the partitioning is 1% bigger than the bounding box
        for (let f = 0; f < data.facetNb; f++) {
            data.facetNormals[f] = Vector3.Zero();
            data.facetPositions[f] = Vector3.Zero();
        }
        data.facetDataEnabled = true;
        return this;
    }

    /**
     * Updates the mesh facetData arrays and the internal partitioning when the mesh is morphed or updated.
     * This method can be called within the render loop.
     * You don't need to call this method by yourself in the render loop when you update/morph a mesh with the methods CreateXXX() as they automatically manage this computation
     * @returns the current mesh
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public updateFacetData(): AbstractMesh {
        const data = this._internalAbstractMeshDataInfo._facetData;
        if (!data.facetDataEnabled) {
            this._initFacetData();
        }
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const indices = this.getIndices();
        const normals = this.getVerticesData(VertexBuffer.NormalKind);
        const bInfo = this.getBoundingInfo();

        if (data.facetDepthSort && !data.facetDepthSortEnabled) {
            // init arrays, matrix and sort function on first call
            data.facetDepthSortEnabled = true;
            if (indices instanceof Uint16Array) {
                data.depthSortedIndices = new Uint16Array(indices!);
            } else if (indices instanceof Uint32Array) {
                data.depthSortedIndices = new Uint32Array(indices!);
            } else {
                let needs32bits = false;
                for (let i = 0; i < indices!.length; i++) {
                    if (indices![i] > 65535) {
                        needs32bits = true;
                        break;
                    }
                }
                if (needs32bits) {
                    data.depthSortedIndices = new Uint32Array(indices!);
                } else {
                    data.depthSortedIndices = new Uint16Array(indices!);
                }
            }
            data.facetDepthSortFunction = function (f1, f2) {
                return f2.sqDistance - f1.sqDistance;
            };
            if (!data.facetDepthSortFrom) {
                const camera = this.getScene().activeCamera;
                data.facetDepthSortFrom = camera ? camera.position : Vector3.Zero();
            }
            data.depthSortedFacets = [];
            for (let f = 0; f < data.facetNb; f++) {
                const depthSortedFacet = { ind: f * 3, sqDistance: 0.0 };
                data.depthSortedFacets.push(depthSortedFacet);
            }
            data.invertedMatrix = Matrix.Identity();
            data.facetDepthSortOrigin = Vector3.Zero();
        }

        data.bbSize.x = bInfo.maximum.x - bInfo.minimum.x > Epsilon ? bInfo.maximum.x - bInfo.minimum.x : Epsilon;
        data.bbSize.y = bInfo.maximum.y - bInfo.minimum.y > Epsilon ? bInfo.maximum.y - bInfo.minimum.y : Epsilon;
        data.bbSize.z = bInfo.maximum.z - bInfo.minimum.z > Epsilon ? bInfo.maximum.z - bInfo.minimum.z : Epsilon;
        let bbSizeMax = data.bbSize.x > data.bbSize.y ? data.bbSize.x : data.bbSize.y;
        bbSizeMax = bbSizeMax > data.bbSize.z ? bbSizeMax : data.bbSize.z;
        data.subDiv.max = data.partitioningSubdivisions;
        data.subDiv.X = Math.floor((data.subDiv.max * data.bbSize.x) / bbSizeMax); // adjust the number of subdivisions per axis
        data.subDiv.Y = Math.floor((data.subDiv.max * data.bbSize.y) / bbSizeMax); // according to each bbox size per axis
        data.subDiv.Z = Math.floor((data.subDiv.max * data.bbSize.z) / bbSizeMax);
        data.subDiv.X = data.subDiv.X < 1 ? 1 : data.subDiv.X; // at least one subdivision
        data.subDiv.Y = data.subDiv.Y < 1 ? 1 : data.subDiv.Y;
        data.subDiv.Z = data.subDiv.Z < 1 ? 1 : data.subDiv.Z;
        // set the parameters for ComputeNormals()
        data.facetParameters.facetNormals = this.getFacetLocalNormals();
        data.facetParameters.facetPositions = this.getFacetLocalPositions();
        data.facetParameters.facetPartitioning = this.getFacetLocalPartitioning();
        data.facetParameters.bInfo = bInfo;
        data.facetParameters.bbSize = data.bbSize;
        data.facetParameters.subDiv = data.subDiv;
        data.facetParameters.ratio = this.partitioningBBoxRatio;
        data.facetParameters.depthSort = data.facetDepthSort;
        if (data.facetDepthSort && data.facetDepthSortEnabled) {
            this.computeWorldMatrix(true);
            this._worldMatrix.invertToRef(data.invertedMatrix);
            Vector3.TransformCoordinatesToRef(data.facetDepthSortFrom, data.invertedMatrix, data.facetDepthSortOrigin);
            data.facetParameters.distanceTo = data.facetDepthSortOrigin;
        }
        data.facetParameters.depthSortedFacets = data.depthSortedFacets;
        if (normals) {
            VertexData.ComputeNormals(positions, indices, normals, data.facetParameters);
        }

        if (data.facetDepthSort && data.facetDepthSortEnabled) {
            data.depthSortedFacets.sort(data.facetDepthSortFunction);
            const l = (data.depthSortedIndices.length / 3) | 0;
            for (let f = 0; f < l; f++) {
                const sind = data.depthSortedFacets[f].ind;
                data.depthSortedIndices[f * 3] = indices![sind];
                data.depthSortedIndices[f * 3 + 1] = indices![sind + 1];
                data.depthSortedIndices[f * 3 + 2] = indices![sind + 2];
            }
            this.updateIndices(data.depthSortedIndices, undefined, true);
        }

        return this;
    }

    /**
     * Returns the facetLocalNormals array.
     * The normals are expressed in the mesh local spac
     * @returns an array of Vector3
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetLocalNormals(): Vector3[] {
        const facetData = this._internalAbstractMeshDataInfo._facetData;
        if (!facetData.facetNormals) {
            this.updateFacetData();
        }
        return facetData.facetNormals;
    }

    /**
     * Returns the facetLocalPositions array.
     * The facet positions are expressed in the mesh local space
     * @returns an array of Vector3
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetLocalPositions(): Vector3[] {
        const facetData = this._internalAbstractMeshDataInfo._facetData;
        if (!facetData.facetPositions) {
            this.updateFacetData();
        }
        return facetData.facetPositions;
    }

    /**
     * Returns the facetLocalPartitioning array
     * @returns an array of array of numbers
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetLocalPartitioning(): number[][] {
        const facetData = this._internalAbstractMeshDataInfo._facetData;

        if (!facetData.facetPartitioning) {
            this.updateFacetData();
        }
        return facetData.facetPartitioning;
    }

    /**
     * Returns the i-th facet position in the world system.
     * This method allocates a new Vector3 per call
     * @param i defines the facet index
     * @returns a new Vector3
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetPosition(i: number): Vector3 {
        const pos = Vector3.Zero();
        this.getFacetPositionToRef(i, pos);
        return pos;
    }

    /**
     * Sets the reference Vector3 with the i-th facet position in the world system
     * @param i defines the facet index
     * @param ref defines the target vector
     * @returns the current mesh
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetPositionToRef(i: number, ref: Vector3): AbstractMesh {
        const localPos = this.getFacetLocalPositions()[i];
        const world = this.getWorldMatrix();
        Vector3.TransformCoordinatesToRef(localPos, world, ref);
        return this;
    }

    /**
     * Returns the i-th facet normal in the world system.
     * This method allocates a new Vector3 per call
     * @param i defines the facet index
     * @returns a new Vector3
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetNormal(i: number): Vector3 {
        const norm = Vector3.Zero();
        this.getFacetNormalToRef(i, norm);
        return norm;
    }

    /**
     * Sets the reference Vector3 with the i-th facet normal in the world system
     * @param i defines the facet index
     * @param ref defines the target vector
     * @returns the current mesh
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetNormalToRef(i: number, ref: Vector3) {
        const localNorm = this.getFacetLocalNormals()[i];
        Vector3.TransformNormalToRef(localNorm, this.getWorldMatrix(), ref);
        return this;
    }

    /**
     * Returns the facets (in an array) in the same partitioning block than the one the passed coordinates are located (expressed in the mesh local system)
     * @param x defines x coordinate
     * @param y defines y coordinate
     * @param z defines z coordinate
     * @returns the array of facet indexes
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetsAtLocalCoordinates(x: number, y: number, z: number): Nullable<number[]> {
        const bInfo = this.getBoundingInfo();
        const data = this._internalAbstractMeshDataInfo._facetData;

        const ox = Math.floor(((x - bInfo.minimum.x * data.partitioningBBoxRatio) * data.subDiv.X * data.partitioningBBoxRatio) / data.bbSize.x);
        const oy = Math.floor(((y - bInfo.minimum.y * data.partitioningBBoxRatio) * data.subDiv.Y * data.partitioningBBoxRatio) / data.bbSize.y);
        const oz = Math.floor(((z - bInfo.minimum.z * data.partitioningBBoxRatio) * data.subDiv.Z * data.partitioningBBoxRatio) / data.bbSize.z);
        if (ox < 0 || ox > data.subDiv.max || oy < 0 || oy > data.subDiv.max || oz < 0 || oz > data.subDiv.max) {
            return null;
        }
        return data.facetPartitioning[ox + data.subDiv.max * oy + data.subDiv.max * data.subDiv.max * oz];
    }

    /**
     * Returns the closest mesh facet index at (x,y,z) World coordinates, null if not found
     * @param x defines x coordinate
     * @param y defines y coordinate
     * @param z defines z coordinate
     * @param projected sets as the (x,y,z) world projection on the facet
     * @param checkFace if true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned
     * @param facing if facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position. If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position
     * @returns the face index if found (or null instead)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getClosestFacetAtCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace: boolean = false, facing: boolean = true): Nullable<number> {
        const world = this.getWorldMatrix();
        const invMat = TmpVectors.Matrix[5];
        world.invertToRef(invMat);
        const invVect = TmpVectors.Vector3[8];
        Vector3.TransformCoordinatesFromFloatsToRef(x, y, z, invMat, invVect); // transform (x,y,z) to coordinates in the mesh local space
        const closest = this.getClosestFacetAtLocalCoordinates(invVect.x, invVect.y, invVect.z, projected, checkFace, facing);
        if (projected) {
            // transform the local computed projected vector to world coordinates
            Vector3.TransformCoordinatesFromFloatsToRef(projected.x, projected.y, projected.z, world, projected);
        }
        return closest;
    }

    /**
     * Returns the closest mesh facet index at (x,y,z) local coordinates, null if not found
     * @param x defines x coordinate
     * @param y defines y coordinate
     * @param z defines z coordinate
     * @param projected sets as the (x,y,z) local projection on the facet
     * @param checkFace if true (default false), only the facet "facing" to (x,y,z) or only the ones "turning their backs", according to the parameter "facing" are returned
     * @param facing if facing and checkFace are true, only the facet "facing" to (x, y, z) are returned : positive dot (x, y, z) * facet position. If facing si false and checkFace is true, only the facet "turning their backs" to (x, y, z) are returned : negative dot (x, y, z) * facet position
     * @returns the face index if found (or null instead)
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getClosestFacetAtLocalCoordinates(x: number, y: number, z: number, projected?: Vector3, checkFace: boolean = false, facing: boolean = true): Nullable<number> {
        let closest = null;
        let tmpx = 0.0;
        let tmpy = 0.0;
        let tmpz = 0.0;
        let d = 0.0; // tmp dot facet normal * facet position
        let t0 = 0.0;
        let projx = 0.0;
        let projy = 0.0;
        let projz = 0.0;
        // Get all the facets in the same partitioning block than (x, y, z)
        const facetPositions = this.getFacetLocalPositions();
        const facetNormals = this.getFacetLocalNormals();
        const facetsInBlock = this.getFacetsAtLocalCoordinates(x, y, z);
        if (!facetsInBlock) {
            return null;
        }
        // Get the closest facet to (x, y, z)
        let shortest = Number.MAX_VALUE; // init distance vars
        let tmpDistance = shortest;
        let fib; // current facet in the block
        let norm; // current facet normal
        let p0; // current facet barycenter position
        // loop on all the facets in the current partitioning block
        for (let idx = 0; idx < facetsInBlock.length; idx++) {
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
                tmpDistance = tmpx * tmpx + tmpy * tmpy + tmpz * tmpz; // compute length between (x, y, z) and its projection on the facet
                if (tmpDistance < shortest) {
                    // just keep the closest facet to (x, y, z)
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
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public getFacetDataParameters(): any {
        return this._internalAbstractMeshDataInfo._facetData.facetParameters;
    }

    /**
     * Disables the feature FacetData and frees the related memory
     * @returns the current mesh
     * @see https://doc.babylonjs.com/features/featuresDeepDive/mesh/facetData
     */
    public disableFacetData(): AbstractMesh {
        const facetData = this._internalAbstractMeshDataInfo._facetData;
        if (facetData.facetDataEnabled) {
            facetData.facetDataEnabled = false;
            facetData.facetPositions = [] as Vector3[];
            facetData.facetNormals = [] as Vector3[];
            facetData.facetPartitioning = new Array<number[]>();
            facetData.facetParameters = null;
            facetData.depthSortedIndices = new Uint32Array(0);
        }
        return this;
    }

    /**
     * Updates the AbstractMesh indices array
     * @param indices defines the data source
     * @param offset defines the offset in the index buffer where to store the new data (can be null)
     * @param gpuMemoryOnly defines a boolean indicating that only the GPU memory must be updated leaving the CPU version of the indices unchanged (false by default)
     * @returns the current mesh
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    public updateIndices(indices: IndicesArray, offset?: number, gpuMemoryOnly = false): AbstractMesh {
        return this;
    }

    /**
     * Creates new normals data for the mesh
     * @param updatable defines if the normal vertex buffer must be flagged as updatable
     * @returns the current mesh
     */
    public createNormals(updatable: boolean): AbstractMesh {
        const positions = this.getVerticesData(VertexBuffer.PositionKind);
        const indices = this.getIndices();
        let normals: FloatArray;

        if (this.isVerticesDataPresent(VertexBuffer.NormalKind)) {
            normals = <FloatArray>this.getVerticesData(VertexBuffer.NormalKind);
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

        const axisX = TmpVectors.Vector3[0];
        const axisZ = TmpVectors.Vector3[1];
        Vector3.CrossToRef(upDirection, normal, axisZ);
        Vector3.CrossToRef(normal, axisZ, axisX);

        if (this.rotationQuaternion) {
            Quaternion.RotationQuaternionFromAxisToRef(axisX, normal, axisZ, this.rotationQuaternion);
        } else {
            Vector3.RotationFromAxisToRef(axisX, normal, axisZ, this.rotation);
        }
        return this;
    }

    /** @internal */
    public _checkOcclusionQuery(): boolean {
        // Will be replaced by correct code if Occlusion queries are referenced
        return false;
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Disables the mesh edge rendering mode
     * @returns the currentAbstractMesh
     */
    disableEdgesRendering(): AbstractMesh {
        throw _WarnImport("EdgesRenderer");
    }

    // eslint-disable-next-line jsdoc/require-returns-check
    /**
     * Enables the edge rendering mode on the mesh.
     * This mode makes the mesh edges visible
     * @param epsilon defines the maximal distance between two angles to detect a face
     * @param checkVerticesInsteadOfIndices indicates that we should check vertex list directly instead of faces
     * @param options options to the edge renderer
     * @returns the currentAbstractMesh
     * @see https://www.babylonjs-playground.com/#19O9TU#0
     */
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    enableEdgesRendering(epsilon?: number, checkVerticesInsteadOfIndices?: boolean, options?: IEdgesRendererOptions): AbstractMesh {
        throw _WarnImport("EdgesRenderer");
    }

    /**
     * This function returns all of the particle systems in the scene that use the mesh as an emitter.
     * @returns an array of particle systems in the scene that use the mesh as an emitter
     */
    public getConnectedParticleSystems(): IParticleSystem[] {
        return this._scene.particleSystems.filter((particleSystem) => particleSystem.emitter === this);
    }
}

RegisterClass("BABYLON.AbstractMesh", AbstractMesh);
