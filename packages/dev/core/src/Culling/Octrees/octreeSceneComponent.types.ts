import { type SubMesh } from "../../Meshes/subMesh";
import { type AbstractMesh } from "../../Meshes/abstractMesh";
import { type Octree } from "./octree";
declare module "../../scene.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface Scene {
        /**
         * @internal
         * Backing Filed
         */
        _selectionOctree: Octree<AbstractMesh>;

        /**
         * Gets the octree used to boost mesh selection (picking)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeOctrees
         */
        selectionOctree: Octree<AbstractMesh>;

        /**
         * Creates or updates the octree used to boost selection (picking)
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeOctrees
         * @param maxCapacity defines the maximum capacity per leaf
         * @param maxDepth defines the maximum depth of the octree
         * @returns an octree of AbstractMesh
         */
        createOrUpdateSelectionOctree(maxCapacity?: number, maxDepth?: number): Octree<AbstractMesh>;
    }
}
declare module "../../Meshes/abstractMesh.pure" {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    export interface AbstractMesh {
        /**
         * @internal
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
         * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeOctrees
         */
        createOrUpdateSubmeshesOctree(maxCapacity?: number, maxDepth?: number): Octree<SubMesh>;
    }
}
