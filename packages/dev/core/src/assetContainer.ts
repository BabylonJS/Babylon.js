import { AbstractScene } from "./abstractScene";
import type { Scene } from "./scene";
import { Mesh } from "./Meshes/mesh";
import { TransformNode } from "./Meshes/transformNode";
import type { Skeleton } from "./Bones/skeleton";
import type { AnimationGroup } from "./Animations/animationGroup";
import type { Animatable } from "./Animations/animatable";
import { AbstractMesh } from "./Meshes/abstractMesh";
import type { MultiMaterial } from "./Materials/multiMaterial";
import type { Material } from "./Materials/material";
import { Logger } from "./Misc/logger";
import { EngineStore } from "./Engines/engineStore";
import type { Nullable } from "./types";
import type { Node } from "./node";
import type { Observer } from "./Misc/observable";
import type { ThinEngine } from "./Engines/thinEngine";
import { InstancedMesh } from "./Meshes/instancedMesh";
import { Light } from "./Lights/light";
import { Camera } from "./Cameras/camera";
import { Tools } from "./Misc/tools";

/**
 * Set of assets to keep when moving a scene into an asset container.
 */
export class KeepAssets extends AbstractScene {}

/**
 * Class used to store the output of the AssetContainer.instantiateAllMeshesToScene function
 */
export class InstantiatedEntries {
    /**
     * List of new root nodes (eg. nodes with no parent)
     */
    public rootNodes: Node[] = [];

    /**
     * List of new skeletons
     */
    public skeletons: Skeleton[] = [];

    /**
     * List of new animation groups
     */
    public animationGroups: AnimationGroup[] = [];

    /**
     * Disposes the instantiated entries from the scene
     */
    public dispose() {
        this.rootNodes.slice(0).forEach((o) => {
            o.dispose();
        });
        this.rootNodes.length = 0;

        this.skeletons.slice(0).forEach((o) => {
            o.dispose();
        });
        this.skeletons.length = 0;

        this.animationGroups.slice(0).forEach((o) => {
            o.dispose();
        });
        this.animationGroups.length = 0;
    }
}

/**
 * Container with a set of assets that can be added or removed from a scene.
 */
export class AssetContainer extends AbstractScene {
    private _wasAddedToScene = false;
    private _onContextRestoredObserver: Nullable<Observer<ThinEngine>>;

    /**
     * The scene the AssetContainer belongs to.
     */
    public scene: Scene;

    /**
     * Instantiates an AssetContainer.
     * @param scene The scene the AssetContainer belongs to.
     */
    constructor(scene?: Nullable<Scene>) {
        super();
        scene = scene || EngineStore.LastCreatedScene;
        if (!scene) {
            return;
        }
        this.scene = scene;
        this["sounds"] = [];
        this["effectLayers"] = [];
        this["layers"] = [];
        this["lensFlareSystems"] = [];
        this["proceduralTextures"] = [];
        this["reflectionProbes"] = [];

        scene.onDisposeObservable.add(() => {
            if (!this._wasAddedToScene) {
                this.dispose();
            }
        });

        this._onContextRestoredObserver = scene.getEngine().onContextRestoredObservable.add(() => {
            for (const geometry of this.geometries) {
                geometry._rebuild();
            }

            for (const mesh of this.meshes) {
                mesh._rebuild();
            }

            for (const system of this.particleSystems) {
                system.rebuild();
            }

            for (const texture of this.textures) {
                texture._rebuild();
            }
        });
    }

    /**
     * Given a list of nodes, return a topological sorting of them.
     * @param nodes
     * @returns a sorted array of nodes
     */
    private _topologicalSort(nodes: Node[]): Node[] {
        const nodesUidMap = new Map<number, Node>();

        for (const node of nodes) {
            nodesUidMap.set(node.uniqueId, node);
        }

        const dependencyGraph = {
            dependsOn: new Map<number, Set<number>>(), // given a node id, what are the ids of the nodes it depends on
            dependedBy: new Map<number, Set<number>>(), // given a node id, what are the ids of the nodes that depend on it
        };

        // Build the dependency graph given the list of nodes

        // First pass: Initialize the empty dependency graph
        for (const node of nodes) {
            const nodeId = node.uniqueId;
            dependencyGraph.dependsOn.set(nodeId, new Set<number>());
            dependencyGraph.dependedBy.set(nodeId, new Set<number>());
        }

        // Second pass: Populate the dependency graph. We assume that we
        // don't need to check for cycles here, as the scene graph cannot
        // contain cycles. Our graph also already contains all transitive
        // dependencies because getDescendants returns the transitive
        // dependencies by default.
        for (const node of nodes) {
            const nodeId = node.uniqueId;
            const dependsOn = dependencyGraph.dependsOn.get(nodeId)!;
            if (node instanceof InstancedMesh) {
                const masterMesh = node.sourceMesh;
                if (nodesUidMap.has(masterMesh.uniqueId)) {
                    dependsOn.add(masterMesh.uniqueId);
                    dependencyGraph.dependedBy.get(masterMesh.uniqueId)!.add(nodeId);
                }
            }
            const dependedBy = dependencyGraph.dependedBy.get(nodeId)!;

            for (const child of node.getDescendants()) {
                const childId = child.uniqueId;
                if (nodesUidMap.has(childId)) {
                    dependedBy.add(childId);

                    const childDependsOn = dependencyGraph.dependsOn.get(childId)!;
                    childDependsOn.add(nodeId);
                }
            }
        }

        // Third pass: Topological sort
        const sortedNodes: Node[] = [];

        // First: Find all nodes that have no dependencies
        const leaves: Node[] = [];
        for (const node of nodes) {
            const nodeId = node.uniqueId;
            if (dependencyGraph.dependsOn.get(nodeId)!.size === 0) {
                leaves.push(node);
                nodesUidMap.delete(nodeId);
            }
        }

        const visitList = leaves;
        while (visitList.length > 0) {
            const nodeToVisit = visitList.shift()!;

            sortedNodes.push(nodeToVisit);

            // Remove the node from the dependency graph
            // When a node is visited, we know that dependsOn is empty.
            // So we only need to remove the node from dependedBy.
            const dependedByVisitedNode = dependencyGraph.dependedBy.get(nodeToVisit.uniqueId)!;
            // Array.from(x.values()) is to make the TS compiler happy
            for (const dependedByVisitedNodeId of Array.from(dependedByVisitedNode.values())) {
                const dependsOnDependedByVisitedNode = dependencyGraph.dependsOn.get(dependedByVisitedNodeId)!;
                dependsOnDependedByVisitedNode.delete(nodeToVisit.uniqueId);

                if (dependsOnDependedByVisitedNode.size === 0 && nodesUidMap.get(dependedByVisitedNodeId)) {
                    visitList.push(nodesUidMap.get(dependedByVisitedNodeId)!);
                    nodesUidMap.delete(dependedByVisitedNodeId);
                }
            }
        }

        if (nodesUidMap.size > 0) {
            Logger.Error("SceneSerializer._topologicalSort: There were unvisited nodes:");
            nodesUidMap.forEach((node) => Logger.Error(node.name));
        }

        return sortedNodes;
    }

    private _addNodeAndDescendantsToList(list: Node[], addedIds: Set<number>, rootNode?: Node, predicate?: (entity: any) => boolean) {
        if (!rootNode || (predicate && !predicate(rootNode)) || addedIds.has(rootNode.uniqueId)) {
            return;
        }

        list.push(rootNode);
        addedIds.add(rootNode.uniqueId);

        for (const child of rootNode.getDescendants(true)) {
            this._addNodeAndDescendantsToList(list, addedIds, child, predicate);
        }
    }

    /**
     * Check if a specific node is contained in this asset container.
     * @param node the node to check
     * @returns true if the node is contained in this container, otherwise false.
     */
    private _isNodeInContainer(node: Node) {
        if (node instanceof Mesh && this.meshes.indexOf(node) !== -1) {
            return true;
        }
        if (node instanceof TransformNode && this.transformNodes.indexOf(node) !== -1) {
            return true;
        }
        if (node instanceof Light && this.lights.indexOf(node) !== -1) {
            return true;
        }
        if (node instanceof Camera && this.cameras.indexOf(node) !== -1) {
            return true;
        }
        return false;
    }

    /**
     * For every node in the scene, check if its parent node is also in the scene.
     * @returns true if every node's parent is also in the scene, otherwise false.
     */
    private _isValidHierarchy() {
        for (const node of this.meshes) {
            if (node.parent && !this._isNodeInContainer(node.parent)) {
                Logger.Warn(`Node ${node.name} has a parent that is not in the container.`);
                return false;
            }
        }
        for (const node of this.transformNodes) {
            if (node.parent && !this._isNodeInContainer(node.parent)) {
                Logger.Warn(`Node ${node.name} has a parent that is not in the container.`);
                return false;
            }
        }
        for (const node of this.lights) {
            if (node.parent && !this._isNodeInContainer(node.parent)) {
                Logger.Warn(`Node ${node.name} has a parent that is not in the container.`);
                return false;
            }
        }
        for (const node of this.cameras) {
            if (node.parent && !this._isNodeInContainer(node.parent)) {
                Logger.Warn(`Node ${node.name} has a parent that is not in the container.`);
                return false;
            }
        }
        return true;
    }

    /**
     * Instantiate or clone all meshes and add the new ones to the scene.
     * Skeletons and animation groups will all be cloned
     * @param nameFunction defines an optional function used to get new names for clones
     * @param cloneMaterials defines an optional boolean that defines if materials must be cloned as well (false by default)
     * @param options defines an optional list of options to control how to instantiate / clone models
     * @param options.doNotInstantiate defines if the model must be instantiated or just cloned
     * @param options.predicate defines a predicate used to filter whih mesh to instantiate/clone
     * @returns a list of rootNodes, skeletons and animation groups that were duplicated
     */
    public instantiateModelsToScene(
        nameFunction?: (sourceName: string) => string,
        cloneMaterials = false,
        options?: { doNotInstantiate?: boolean | ((node: Node) => boolean); predicate?: (entity: any) => boolean }
    ): InstantiatedEntries {
        if (!this._isValidHierarchy()) {
            Tools.Warn("SceneSerializer.InstantiateModelsToScene: The Asset Container hierarchy is not valid.");
        }
        const conversionMap: { [key: number]: number } = {};
        const storeMap: { [key: number]: any } = {};
        const result = new InstantiatedEntries();
        const alreadySwappedSkeletons: Skeleton[] = [];
        const alreadySwappedMaterials: Material[] = [];

        const localOptions = {
            doNotInstantiate: true,
            ...options,
        };

        const onClone = (source: Node, clone: Node) => {
            conversionMap[source.uniqueId] = clone.uniqueId;
            storeMap[clone.uniqueId] = clone;

            if (nameFunction) {
                clone.name = nameFunction(source.name);
            }

            if (clone instanceof Mesh) {
                const clonedMesh = clone as Mesh;

                if (clonedMesh.morphTargetManager) {
                    const oldMorphTargetManager = (source as Mesh).morphTargetManager!;
                    clonedMesh.morphTargetManager = oldMorphTargetManager.clone();

                    for (let index = 0; index < oldMorphTargetManager.numTargets; index++) {
                        const oldTarget = oldMorphTargetManager.getTarget(index);
                        const newTarget = clonedMesh.morphTargetManager.getTarget(index);

                        conversionMap[oldTarget.uniqueId] = newTarget.uniqueId;
                        storeMap[newTarget.uniqueId] = newTarget;
                    }
                }
            }
        };

        const nodesToSort: Node[] = [];
        const idsOnSortList = new Set<number>();

        for (const transformNode of this.transformNodes) {
            if (transformNode.parent === null) {
                this._addNodeAndDescendantsToList(nodesToSort, idsOnSortList, transformNode, localOptions.predicate);
            }
        }

        for (const mesh of this.meshes) {
            if (mesh.parent === null) {
                this._addNodeAndDescendantsToList(nodesToSort, idsOnSortList, mesh, localOptions.predicate);
            }
        }

        // Topologically sort nodes by parenting/instancing relationships so that all resources are in place
        // when a given node is instantiated.
        const sortedNodes = this._topologicalSort(nodesToSort);

        const onNewCreated = (source: Node, clone: Node) => {
            onClone(source, clone);

            if (source.parent) {
                const replicatedParentId = conversionMap[source.parent.uniqueId];
                const replicatedParent = storeMap[replicatedParentId];

                if (replicatedParent) {
                    clone.parent = replicatedParent;
                } else {
                    clone.parent = source.parent;
                }
            }

            if ((clone as any).position && (source as any).position) {
                (clone as any).position.copyFrom((source as any).position);
            }
            if ((clone as any).rotationQuaternion && (source as any).rotationQuaternion) {
                (clone as any).rotationQuaternion.copyFrom((source as any).rotationQuaternion);
            }
            if ((clone as any).rotation && (source as any).rotation) {
                (clone as any).rotation.copyFrom((source as any).rotation);
            }
            if ((clone as any).scaling && (source as any).scaling) {
                (clone as any).scaling.copyFrom((source as any).scaling);
            }

            if ((clone as any).material) {
                const mesh = clone as AbstractMesh;

                if (mesh.material) {
                    if (cloneMaterials) {
                        const sourceMaterial = (source as AbstractMesh).material!;

                        if (alreadySwappedMaterials.indexOf(sourceMaterial) === -1) {
                            let swap = sourceMaterial.clone(nameFunction ? nameFunction(sourceMaterial.name) : "Clone of " + sourceMaterial.name)!;
                            alreadySwappedMaterials.push(sourceMaterial);
                            conversionMap[sourceMaterial.uniqueId] = swap.uniqueId;
                            storeMap[swap.uniqueId] = swap;

                            if (sourceMaterial.getClassName() === "MultiMaterial") {
                                const multi = sourceMaterial as MultiMaterial;

                                for (const material of multi.subMaterials) {
                                    if (!material) {
                                        continue;
                                    }
                                    swap = material.clone(nameFunction ? nameFunction(material.name) : "Clone of " + material.name)!;
                                    alreadySwappedMaterials.push(material);
                                    conversionMap[material.uniqueId] = swap.uniqueId;
                                    storeMap[swap.uniqueId] = swap;
                                }

                                multi.subMaterials = multi.subMaterials.map((m) => m && storeMap[conversionMap[m.uniqueId]]);
                            }
                        }

                        if (mesh.getClassName() !== "InstancedMesh") {
                            mesh.material = storeMap[conversionMap[sourceMaterial.uniqueId]];
                        }
                    } else {
                        if (mesh.material.getClassName() === "MultiMaterial") {
                            if (this.scene.multiMaterials.indexOf(mesh.material as MultiMaterial) === -1) {
                                this.scene.addMultiMaterial(mesh.material as MultiMaterial);
                            }
                        } else {
                            if (this.scene.materials.indexOf(mesh.material) === -1) {
                                this.scene.addMaterial(mesh.material);
                            }
                        }
                    }
                }
            }

            if (clone.parent === null) {
                result.rootNodes.push(clone);
            }
        };

        sortedNodes.forEach((node) => {
            if (node.getClassName() === "InstancedMesh") {
                const instancedNode = node as InstancedMesh;
                const sourceMesh = instancedNode.sourceMesh;
                const replicatedSourceId = conversionMap[sourceMesh.uniqueId];
                const replicatedSource = typeof replicatedSourceId === "number" ? storeMap[replicatedSourceId] : sourceMesh;
                const replicatedInstancedNode = replicatedSource.createInstance(instancedNode.name);
                onNewCreated(instancedNode, replicatedInstancedNode);
            } else {
                // Mesh or TransformNode
                let canInstance = true;
                if (
                    node.getClassName() === "TransformNode" ||
                    node.getClassName() === "Node" ||
                    (node as Mesh).skeleton ||
                    !(node as any).getTotalVertices ||
                    (node as Mesh).getTotalVertices() === 0
                ) {
                    // Transform nodes, skinned meshes, and meshes with no vertices can never be instanced!
                    canInstance = false;
                } else if (localOptions.doNotInstantiate) {
                    if (typeof localOptions.doNotInstantiate === "function") {
                        canInstance = !localOptions.doNotInstantiate(node);
                    } else {
                        canInstance = !localOptions.doNotInstantiate;
                    }
                }
                const replicatedNode = canInstance ? (node as Mesh).createInstance(`instance of ${node.name}`) : node.clone(`Clone of ${node.name}`, null, true);
                if (!replicatedNode) {
                    throw new Error(`Could not clone or instantiate node on Asset Container ${node.name}`);
                }
                onNewCreated(node, replicatedNode);
            }
        });

        this.skeletons.forEach((s) => {
            if (localOptions.predicate && !localOptions.predicate(s)) {
                return;
            }

            const clone = s.clone(nameFunction ? nameFunction(s.name) : "Clone of " + s.name);

            for (const m of this.meshes) {
                if (m.skeleton === s && !m.isAnInstance) {
                    const copy = storeMap[conversionMap[m.uniqueId]] as Mesh;
                    if (!copy || copy.isAnInstance) {
                        continue;
                    }
                    copy.skeleton = clone;

                    if (alreadySwappedSkeletons.indexOf(clone) !== -1) {
                        continue;
                    }

                    alreadySwappedSkeletons.push(clone);

                    // Check if bones are mesh linked
                    for (const bone of clone.bones) {
                        if (bone._linkedTransformNode) {
                            bone._linkedTransformNode = storeMap[conversionMap[bone._linkedTransformNode.uniqueId]];
                        }
                    }
                }
            }

            result.skeletons.push(clone);
        });

        this.animationGroups.forEach((o) => {
            if (localOptions.predicate && !localOptions.predicate(o)) {
                return;
            }

            const clone = o.clone(nameFunction ? nameFunction(o.name) : "Clone of " + o.name, (oldTarget) => {
                const newTarget = storeMap[conversionMap[oldTarget.uniqueId]];

                return newTarget || oldTarget;
            });

            result.animationGroups.push(clone);
        });

        return result;
    }

    /**
     * Adds all the assets from the container to the scene.
     */
    public addAllToScene() {
        if (this._wasAddedToScene) {
            return;
        }
        if (!this._isValidHierarchy()) {
            Tools.Warn("SceneSerializer.addAllToScene: The Asset Container hierarchy is not valid.");
        }

        this._wasAddedToScene = true;

        this.addToScene(null);

        if (this.environmentTexture) {
            this.scene.environmentTexture = this.environmentTexture;
        }

        for (const component of this.scene._serializableComponents) {
            component.addFromContainer(this);
        }

        this.scene.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver);
        this._onContextRestoredObserver = null;
    }

    /**
     * Adds assets from the container to the scene.
     * @param predicate defines a predicate used to select which entity will be added (can be null)
     */
    public addToScene(predicate: Nullable<(entity: any) => boolean> = null) {
        const addedNodes: Node[] = [];
        this.cameras.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addCamera(o);
            addedNodes.push(o);
        });
        this.lights.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addLight(o);
            addedNodes.push(o);
        });
        this.meshes.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addMesh(o);
            addedNodes.push(o);
        });
        this.skeletons.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addSkeleton(o);
        });
        this.animations.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addAnimation(o);
        });
        this.animationGroups.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addAnimationGroup(o);
        });
        this.multiMaterials.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addMultiMaterial(o);
        });
        this.materials.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addMaterial(o);
        });
        this.morphTargetManagers.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addMorphTargetManager(o);
        });
        this.geometries.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addGeometry(o);
        });
        this.transformNodes.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addTransformNode(o);
            addedNodes.push(o);
        });
        this.actionManagers.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addActionManager(o);
        });
        this.textures.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addTexture(o);
        });
        this.reflectionProbes.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.addReflectionProbe(o);
        });

        for (const addedNode of addedNodes) {
            // If node was added to the scene, but parent is not in the scene, break the relationship
            if (addedNode.parent && this.scene.getNodes().indexOf(addedNode.parent) === -1) {
                // Use setParent to keep transform if possible
                if ((addedNode as TransformNode).setParent) {
                    (addedNode as TransformNode).setParent(null);
                } else {
                    addedNode.parent = null;
                }
            }
        }
    }

    /**
     * Removes all the assets in the container from the scene
     */
    public removeAllFromScene() {
        if (!this._isValidHierarchy()) {
            Tools.Warn("SceneSerializer.removeAllFromScene: The Asset Container hierarchy is not valid.");
        }

        this._wasAddedToScene = false;

        this.removeFromScene(null);

        if (this.environmentTexture === this.scene.environmentTexture) {
            this.scene.environmentTexture = null;
        }

        for (const component of this.scene._serializableComponents) {
            component.removeFromContainer(this);
        }
    }

    /**
     * Removes assets in the container from the scene
     * @param predicate defines a predicate used to select which entity will be added (can be null)
     */
    public removeFromScene(predicate: Nullable<(entity: any) => boolean> = null) {
        this.cameras.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeCamera(o);
        });
        this.lights.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeLight(o);
        });
        this.meshes.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeMesh(o, true);
        });
        this.skeletons.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeSkeleton(o);
        });
        this.animations.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeAnimation(o);
        });
        this.animationGroups.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeAnimationGroup(o);
        });
        this.multiMaterials.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeMultiMaterial(o);
        });
        this.materials.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeMaterial(o);
        });
        this.morphTargetManagers.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeMorphTargetManager(o);
        });
        this.geometries.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeGeometry(o);
        });
        this.transformNodes.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeTransformNode(o);
        });
        this.actionManagers.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeActionManager(o);
        });
        this.textures.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeTexture(o);
        });
        this.reflectionProbes.forEach((o) => {
            if (predicate && !predicate(o)) {
                return;
            }
            this.scene.removeReflectionProbe(o);
        });
    }

    /**
     * Disposes all the assets in the container
     */
    public dispose() {
        this.cameras.slice(0).forEach((o) => {
            o.dispose();
        });
        this.cameras.length = 0;

        this.lights.slice(0).forEach((o) => {
            o.dispose();
        });
        this.lights.length = 0;

        this.meshes.slice(0).forEach((o) => {
            o.dispose();
        });
        this.meshes.length = 0;

        this.skeletons.slice(0).forEach((o) => {
            o.dispose();
        });
        this.skeletons.length = 0;

        this.animationGroups.slice(0).forEach((o) => {
            o.dispose();
        });
        this.animationGroups.length = 0;

        this.multiMaterials.slice(0).forEach((o) => {
            o.dispose();
        });
        this.multiMaterials.length = 0;

        this.materials.slice(0).forEach((o) => {
            o.dispose();
        });
        this.materials.length = 0;

        this.geometries.slice(0).forEach((o) => {
            o.dispose();
        });
        this.geometries.length = 0;

        this.transformNodes.slice(0).forEach((o) => {
            o.dispose();
        });
        this.transformNodes.length = 0;

        this.actionManagers.slice(0).forEach((o) => {
            o.dispose();
        });
        this.actionManagers.length = 0;

        this.textures.slice(0).forEach((o) => {
            o.dispose();
        });
        this.textures.length = 0;

        this.reflectionProbes.slice(0).forEach((o) => {
            o.dispose();
        });
        this.reflectionProbes.length = 0;

        this.morphTargetManagers.slice(0).forEach((o) => {
            o.dispose();
        });
        this.morphTargetManagers.length = 0;

        if (this.environmentTexture) {
            this.environmentTexture.dispose();
            this.environmentTexture = null;
        }

        for (const component of this.scene._serializableComponents) {
            component.removeFromContainer(this, true);
        }

        if (this._onContextRestoredObserver) {
            this.scene.getEngine().onContextRestoredObservable.remove(this._onContextRestoredObserver);
            this._onContextRestoredObserver = null;
        }
    }

    private _moveAssets<T>(sourceAssets: T[], targetAssets: T[], keepAssets: T[]): void {
        if (!sourceAssets || !targetAssets) {
            return;
        }

        for (const asset of sourceAssets) {
            let move = true;
            if (keepAssets) {
                for (const keepAsset of keepAssets) {
                    if (asset === keepAsset) {
                        move = false;
                        break;
                    }
                }
            }

            if (move) {
                targetAssets.push(asset);
                (asset as any)._parentContainer = this;
            }
        }
    }

    /**
     * Removes all the assets contained in the scene and adds them to the container.
     * @param keepAssets Set of assets to keep in the scene. (default: empty)
     */
    public moveAllFromScene(keepAssets?: KeepAssets): void {
        this._wasAddedToScene = false;

        if (keepAssets === undefined) {
            keepAssets = new KeepAssets();
        }

        for (const key in this) {
            if (Object.prototype.hasOwnProperty.call(this, key)) {
                (<any>this)[key] = (<any>this)[key] || (key === "_environmentTexture" ? null : []);
                this._moveAssets((<any>this.scene)[key], (<any>this)[key], (<any>keepAssets)[key]);
            }
        }

        this.environmentTexture = this.scene.environmentTexture;

        this.removeAllFromScene();
    }

    /**
     * Adds all meshes in the asset container to a root mesh that can be used to position all the contained meshes. The root mesh is then added to the front of the meshes in the assetContainer.
     * @returns the root mesh
     */
    public createRootMesh() {
        const rootMesh = new Mesh("assetContainerRootMesh", this.scene);
        this.meshes.forEach((m) => {
            if (!m.parent) {
                rootMesh.addChild(m);
            }
        });
        this.meshes.unshift(rootMesh);
        return rootMesh;
    }

    /**
     * Merge animations (direct and animation groups) from this asset container into a scene
     * @param scene is the instance of BABYLON.Scene to append to (default: last created scene)
     * @param animatables set of animatables to retarget to a node from the scene
     * @param targetConverter defines a function used to convert animation targets from the asset container to the scene (default: search node by name)
     * @returns an array of the new AnimationGroup added to the scene (empty array if none)
     */
    public mergeAnimationsTo(
        scene: Nullable<Scene> = EngineStore.LastCreatedScene,
        animatables: Animatable[],
        targetConverter: Nullable<(target: any) => Nullable<Node>> = null
    ): AnimationGroup[] {
        if (!scene) {
            Logger.Error("No scene available to merge animations to");
            return [];
        }

        const _targetConverter = targetConverter
            ? targetConverter
            : (target: any) => {
                  let node = null;

                  const targetProperty = target.animations.length ? target.animations[0].targetProperty : "";
                  /*
              BabylonJS adds special naming to targets that are children of nodes.
              This name attempts to remove that special naming to get the parent nodes name in case the target
              can't be found in the node tree

              Ex: Torso_primitive0 likely points to a Mesh primitive. We take away primitive0 and are left with "Torso" which is the name
              of the primitive's parent.
          */
                  const name = target.name.split(".").join("").split("_primitive")[0];

                  switch (targetProperty) {
                      case "position":
                      case "rotationQuaternion":
                          node = scene.getTransformNodeByName(target.name) || scene.getTransformNodeByName(name);
                          break;
                      case "influence":
                          node = scene.getMorphTargetByName(target.name) || scene.getMorphTargetByName(name);
                          break;
                      default:
                          node = scene.getNodeByName(target.name) || scene.getNodeByName(name);
                  }

                  return node;
              };

        // Copy new node animations
        const nodesInAC = this.getNodes();
        nodesInAC.forEach((nodeInAC) => {
            const nodeInScene = _targetConverter(nodeInAC);
            if (nodeInScene !== null) {
                // Remove old animations with same target property as a new one
                for (const animationInAC of nodeInAC.animations) {
                    // Doing treatment on an array for safety measure
                    const animationsWithSameProperty = nodeInScene.animations.filter((animationInScene) => {
                        return animationInScene.targetProperty === animationInAC.targetProperty;
                    });
                    for (const animationWithSameProperty of animationsWithSameProperty) {
                        const index = nodeInScene.animations.indexOf(animationWithSameProperty, 0);
                        if (index > -1) {
                            nodeInScene.animations.splice(index, 1);
                        }
                    }
                }

                // Append new animations
                nodeInScene.animations = nodeInScene.animations.concat(nodeInAC.animations);
            }
        });

        const newAnimationGroups: AnimationGroup[] = [];

        // Copy new animation groups
        this.animationGroups.slice().forEach((animationGroupInAC) => {
            // Clone the animation group and all its animatables
            newAnimationGroups.push(animationGroupInAC.clone(animationGroupInAC.name, _targetConverter));

            // Remove animatables related to the asset container
            animationGroupInAC.animatables.forEach((animatable) => {
                animatable.stop();
            });
        });

        // Retarget animatables
        animatables.forEach((animatable) => {
            const target = _targetConverter(animatable.target);

            if (target) {
                // Clone the animatable and retarget it
                scene.beginAnimation(
                    target,
                    animatable.fromFrame,
                    animatable.toFrame,
                    animatable.loopAnimation,
                    animatable.speedRatio,
                    animatable.onAnimationEnd ? animatable.onAnimationEnd : undefined,
                    undefined,
                    true,
                    undefined,
                    animatable.onAnimationLoop ? animatable.onAnimationLoop : undefined
                );

                // Stop animation for the target in the asset container
                scene.stopAnimation(animatable.target);
            }
        });

        return newAnimationGroups;
    }

    /**
     * @since 6.15.0
     * This method checks for any node that has no parent
     * and is not in the rootNodes array, and adds the node
     * there, if so.
     */
    public populateRootNodes() {
        this.rootNodes.length = 0;
        this.meshes.forEach((m) => {
            if (!m.parent && this.rootNodes.indexOf(m) === -1) {
                this.rootNodes.push(m);
            }
        });
        this.transformNodes.forEach((t) => {
            if (!t.parent && this.rootNodes.indexOf(t) === -1) {
                this.rootNodes.push(t);
            }
        });
        this.lights.forEach((l) => {
            if (!l.parent && this.rootNodes.indexOf(l) === -1) {
                this.rootNodes.push(l);
            }
        });
        this.cameras.forEach((c) => {
            if (!c.parent && this.rootNodes.indexOf(c) === -1) {
                this.rootNodes.push(c);
            }
        });
    }

    /**
     * @since 6.26.0
     * Given a root asset, this method will traverse its hierarchy and add it, its children and any materials/skeletons/animation groups to the container.
     * @param root root node
     */
    public addAllAssetsToContainer(root: Node) {
        if (!root) {
            return;
        }

        const nodesToVisit: Node[] = [];
        const visitedNodes = new Set<Node>();

        nodesToVisit.push(root);

        while (nodesToVisit.length > 0) {
            const nodeToVisit = nodesToVisit.pop()!;

            if (nodeToVisit instanceof Mesh) {
                if (nodeToVisit.geometry && this.geometries.indexOf(nodeToVisit.geometry) === -1) {
                    this.geometries.push(nodeToVisit.geometry);
                }
                this.meshes.push(nodeToVisit);
            } else if (nodeToVisit instanceof TransformNode) {
                this.transformNodes.push(nodeToVisit);
            } else if (nodeToVisit instanceof Light) {
                this.lights.push(nodeToVisit);
            } else if (nodeToVisit instanceof Camera) {
                this.cameras.push(nodeToVisit);
            }

            if (nodeToVisit instanceof AbstractMesh) {
                if (nodeToVisit.material && this.materials.indexOf(nodeToVisit.material) === -1) {
                    this.materials.push(nodeToVisit.material);
                    for (const texture of nodeToVisit.material.getActiveTextures()) {
                        if (this.textures.indexOf(texture) === -1) {
                            this.textures.push(texture);
                        }
                    }
                }

                if (nodeToVisit.skeleton && this.skeletons.indexOf(nodeToVisit.skeleton) === -1) {
                    this.skeletons.push(nodeToVisit.skeleton);
                }

                if (nodeToVisit.morphTargetManager && this.morphTargetManagers.indexOf(nodeToVisit.morphTargetManager) === -1) {
                    this.morphTargetManagers.push(nodeToVisit.morphTargetManager);
                }
            }

            for (const child of nodeToVisit.getChildren()) {
                if (!visitedNodes.has(child)) {
                    nodesToVisit.push(child);
                }
            }

            visitedNodes.add(nodeToVisit);
        }

        this.populateRootNodes();
    }
}
