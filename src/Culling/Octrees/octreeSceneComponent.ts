import { ISmartArrayLike } from "../../Misc/smartArray";
import { Scene } from "../../scene";
import { Vector3 } from "../../Maths/math.vector";
import { SubMesh } from "../../Meshes/subMesh";
import { AbstractMesh } from "../../Meshes/abstractMesh";
import { Ray } from "../../Culling/ray";
import { SceneComponentConstants } from "../../sceneComponent";

import { Octree } from "./octree";

declare type Collider = import("../../Collisions/collider").Collider;

declare module "../../scene" {
    export interface Scene {
        /**
         * @hidden
         * Backing Filed
         */
        _selectionOctree: Octree<AbstractMesh>;

        /**
         * Gets the octree used to boost mesh selection (picking)
         * @see https://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
         */
        selectionOctree: Octree<AbstractMesh>;

        /**
         * Creates or updates the octree used to boost selection (picking)
         * @see https://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
         * @param maxCapacity defines the maximum capacity per leaf
         * @param maxDepth defines the maximum depth of the octree
         * @returns an octree of AbstractMesh
         */
        createOrUpdateSelectionOctree(maxCapacity?: number, maxDepth?: number): Octree<AbstractMesh>;
    }
}

Scene.prototype.createOrUpdateSelectionOctree = function(maxCapacity = 64, maxDepth = 2): Octree<AbstractMesh> {
    let component = this._getComponent(SceneComponentConstants.NAME_OCTREE);
    if (!component) {
        component = new OctreeSceneComponent(this);
        this._addComponent(component);
    }

    if (!this._selectionOctree) {
        this._selectionOctree = new Octree<AbstractMesh>(Octree.CreationFuncForMeshes, maxCapacity, maxDepth);
    }

    var worldExtends = this.getWorldExtends();

    // Update octree
    this._selectionOctree.update(worldExtends.min, worldExtends.max, this.meshes);

    return this._selectionOctree;
};

Object.defineProperty(Scene.prototype, "selectionOctree", {
    get: function(this: Scene) {
        return this._selectionOctree;
    },
    enumerable: true,
    configurable: true
});

declare module "../../Meshes/abstractMesh" {
    export interface AbstractMesh {
        /**
         * @hidden
         * Backing Field
         */
        _submeshesOctree: Octree<SubMesh>;

        /**
         * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.
         * Please note that you must have a decent number of submeshes to get performance improvements when using an octree
         * @param maxCapacity defines the maximum size of each block (64 by default)
         * @param maxDepth defines the maximum depth to use (no more than 2 levels by default)
         * @returns the new octree
         * @see https://www.babylonjs-playground.com/#NA4OQ#12
         * @see https://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
         */
        createOrUpdateSubmeshesOctree(maxCapacity?: number, maxDepth?: number): Octree<SubMesh>;
    }
}

/**
 * This function will create an octree to help to select the right submeshes for rendering, picking and collision computations.
 * Please note that you must have a decent number of submeshes to get performance improvements when using an octree
 * @param maxCapacity defines the maximum size of each block (64 by default)
 * @param maxDepth defines the maximum depth to use (no more than 2 levels by default)
 * @returns the new octree
 * @see https://www.babylonjs-playground.com/#NA4OQ#12
 * @see https://doc.babylonjs.com/how_to/optimizing_your_scene_with_octrees
 */
AbstractMesh.prototype.createOrUpdateSubmeshesOctree = function(maxCapacity = 64, maxDepth = 2): Octree<SubMesh> {
    const scene = this.getScene();
    let component = scene._getComponent(SceneComponentConstants.NAME_OCTREE);
    if (!component) {
        component = new OctreeSceneComponent(scene);
        scene._addComponent(component);
    }

    if (!this._submeshesOctree) {
        this._submeshesOctree = new Octree<SubMesh>(Octree.CreationFuncForSubMeshes, maxCapacity, maxDepth);
    }

    this.computeWorldMatrix(true);

    let boundingInfo = this.getBoundingInfo();

    // Update octree
    var bbox = boundingInfo.boundingBox;
    this._submeshesOctree.update(bbox.minimumWorld, bbox.maximumWorld, this.subMeshes);

    return this._submeshesOctree;
};

/**
 * Defines the octree scene component responsible to manage any octrees
 * in a given scene.
 */
export class OctreeSceneComponent {
    /**
     * The component name help to identify the component in the list of scene components.
     */
    public readonly name = SceneComponentConstants.NAME_OCTREE;

    /**
     * The scene the component belongs to.
     */
    public scene: Scene;

    /**
     * Indicates if the meshes have been checked to make sure they are isEnabled()
     */
    public readonly checksIsEnabled = true;

    /**
     * Creates a new instance of the component for the given scene
     * @param scene Defines the scene to register the component in
     */
    constructor(scene: Scene) {
        this.scene = scene;

        this.scene.getActiveMeshCandidates = this.getActiveMeshCandidates.bind(this);

        this.scene.getActiveSubMeshCandidates = this.getActiveSubMeshCandidates.bind(this);
        this.scene.getCollidingSubMeshCandidates = this.getCollidingSubMeshCandidates.bind(this);
        this.scene.getIntersectingSubMeshCandidates = this.getIntersectingSubMeshCandidates.bind(this);
    }

    /**
     * Registers the component in a given scene
     */
    public register(): void {
        this.scene.onMeshRemovedObservable.add((mesh: AbstractMesh) => {
            const sceneOctree = this.scene.selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
                var index = sceneOctree.dynamicContent.indexOf(mesh);

                if (index !== -1) {
                    sceneOctree.dynamicContent.splice(index, 1);
                }
            }
        });

        this.scene.onMeshImportedObservable.add((mesh: AbstractMesh) => {
            const sceneOctree = this.scene.selectionOctree;
            if (sceneOctree !== undefined && sceneOctree !== null) {
                sceneOctree.addMesh(mesh);
            }
        });
    }

    /**
     * Return the list of active meshes
     * @returns the list of active meshes
     */
    public getActiveMeshCandidates(): ISmartArrayLike<AbstractMesh> {
        if (this.scene._selectionOctree) {
            var selection = this.scene._selectionOctree.select(this.scene.frustumPlanes);
            return selection;
        }
        return this.scene._getDefaultMeshCandidates();
    }

    /**
     * Return the list of active sub meshes
     * @param mesh The mesh to get the candidates sub meshes from
     * @returns the list of active sub meshes
     */
    public getActiveSubMeshCandidates(mesh: AbstractMesh): ISmartArrayLike<SubMesh> {
        if (mesh._submeshesOctree && mesh.useOctreeForRenderingSelection) {
            var intersections = mesh._submeshesOctree.select(this.scene.frustumPlanes);
            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }

    private _tempRay = new Ray(Vector3.Zero(), new Vector3(1, 1, 1));
    /**
     * Return the list of sub meshes intersecting with a given local ray
     * @param mesh defines the mesh to find the submesh for
     * @param localRay defines the ray in local space
     * @returns the list of intersecting sub meshes
     */
    public getIntersectingSubMeshCandidates(mesh: AbstractMesh, localRay: Ray): ISmartArrayLike<SubMesh> {
        if (mesh._submeshesOctree && mesh.useOctreeForPicking) {
            Ray.TransformToRef(localRay, mesh.getWorldMatrix(), this._tempRay);
            var intersections = mesh._submeshesOctree.intersectsRay(this._tempRay);

            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }

    /**
     * Return the list of sub meshes colliding with a collider
     * @param mesh defines the mesh to find the submesh for
     * @param collider defines the collider to evaluate the collision against
     * @returns the list of colliding sub meshes
     */
    public getCollidingSubMeshCandidates(mesh: AbstractMesh, collider: Collider): ISmartArrayLike<SubMesh> {
        if (mesh._submeshesOctree && mesh.useOctreeForCollisions) {
            var radius = collider._velocityWorldLength + Math.max(collider._radius.x, collider._radius.y, collider._radius.z);
            var intersections = mesh._submeshesOctree.intersects(collider._basePointWorld, radius);

            return intersections;
        }
        return this.scene._getDefaultSubMeshCandidates(mesh);
    }

    /**
     * Rebuilds the elements related to this component in case of
     * context lost for instance.
     */
    public rebuild(): void {
        // Nothing to do here.
    }

    /**
     * Disposes the component and the associated ressources.
     */
    public dispose(): void {
        // Nothing to do here.
    }
}
