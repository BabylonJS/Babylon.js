import type { Nullable } from "core/types";
import type { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import type { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import type { Scene } from "core/scene";
import type { AnimationGroup } from "core/Animations/animationGroup";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Vector3, Quaternion } from "core/Maths/math.vector";
import type { RestPoseDataUpdate } from "./avatarManager";

import { Color3 } from "core/Maths/math.color";
import { Matrix } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Mesh } from "core/Meshes/mesh";
import { Observable } from "core/Misc/observable";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import { GizmoCoordinatesMode } from "core/Gizmos/gizmo";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { SkeletonViewer } from "core/Debug/skeletonViewer";
import { AppendSceneAsync } from "core/Loading/sceneLoader";
import { CreateSkeletonFromTransformNodeHierarchy } from "core/Bones/skeleton.functions";

// Side-effect import needed for scene.createPickingRay (prototype-augmented)
import "core/Culling/ray";

import { DistancePointToLine } from "./helperFunctions";
import type { GizmoType } from "./avatar";

const ShadowLayerMask = 0x20000000;

type TransformNodeTransformations = Map<TransformNode, { position: Vector3; scaling: Vector3; quaternion: Quaternion }>;

/**
 * Manages the right-side animation source viewport.
 * Mirrors the original animation.ts from the playground (no AnimatorAvatar — uses TransformNodes directly).
 */
export class AnimationSource {
    private _animationGroup: Nullable<AnimationGroup> = null;
    private _skeletonViewer: Nullable<SkeletonViewer> = null;
    private _skeletonMesh: Nullable<Mesh> = null;
    private _rootNode: Nullable<AbstractMesh> = null;
    private _gizmoManager: GizmoManager;
    private _gizmoSelectedNode: Nullable<Mesh> = null;
    private _selectedTransformNode: Nullable<TransformNode> = null;
    private _inRestPose = false;
    private _initialTransformNodeTransformations: TransformNodeTransformations = new Map();
    private _restPoseTransformNodeTransformations: TransformNodeTransformations = new Map();
    private _retargetedTransformNodeTransformations: TransformNodeTransformations = new Map();

    public readonly onLoadedObservable = new Observable<void>();
    public readonly onGizmoNodeSelectedObservable = new Observable<string>();
    public readonly onPlayingObservable = new Observable<boolean>();

    public get animationGroup(): Nullable<AnimationGroup> {
        return this._animationGroup;
    }
    public get isLoaded(): boolean {
        return this._animationGroup !== null;
    }
    /** True when the animation is actively playing (not in rest pose). */
    public get isPlaying(): boolean {
        return this._animationGroup !== null && !this._inRestPose;
    }
    public get selectedTransformNode(): Nullable<TransformNode> {
        return this._selectedTransformNode;
    }

    public constructor(
        private readonly _scene: Scene,
        private readonly _camera: ArcRotateCamera,
        private readonly _shadowGenerator: ShadowGenerator
    ) {
        this._gizmoManager = new GizmoManager(this._scene, undefined, new UtilityLayerRenderer(this._scene), new UtilityLayerRenderer(this._scene));
        this._gizmoManager.keepDepthUtilityLayer.setRenderCamera(this._camera);
        this._gizmoManager.utilityLayer.setRenderCamera(this._camera);
        this._gizmoManager.usePointerToAttachGizmos = false;
        this._gizmoManager.coordinatesMode = GizmoCoordinatesMode.Local;
    }

    public async loadAsync(path: string, restPoseUpdate?: RestPoseDataUpdate, skeletonRootNodeName?: string): Promise<void> {
        this._cleanScene();
        await this._loadFileAsync(path, restPoseUpdate, skeletonRootNodeName);
    }

    public clearScene(): void {
        this._cleanScene();
    }

    /** Returns a sorted list of transform node names targeted by the animation group. */
    public getTransformNodeNames(): string[] {
        if (!this._animationGroup || !this._rootNode) {
            return [];
        }

        const listUnsorted = new Set<string>();
        const listSorted: string[] = [];
        const listAllSorted: string[] = [];

        for (const ta of this._animationGroup.targetedAnimations) {
            if ((ta.target as TransformNode).getClassName?.() === "TransformNode") {
                listUnsorted.add((ta.target as TransformNode).name);
            }
        }

        this._rootNode.getChildTransformNodes(false).forEach((node) => {
            if (node.getClassName() === "TransformNode") {
                listAllSorted.push(node.name);
            }
        });

        for (const name of listAllSorted) {
            if (listUnsorted.has(name)) {
                listSorted.push(name);
            }
        }

        return listSorted;
    }

    /** Returns transform node options in hierarchy order, with indented labels for parenting. */
    public getTransformNodeOptions(): { label: string; value: string }[] {
        if (!this._animationGroup || !this._rootNode) {
            return [];
        }

        const allNames = new Set(this.getTransformNodeNames());
        // getChildTransformNodes(false) traverses in DFS order (parent before children)
        const result: { label: string; value: string }[] = [];

        this._rootNode.getChildTransformNodes(false).forEach((node) => {
            if (!allNames.has(node.name)) {
                return;
            }
            // Compute depth relative to _rootNode
            let depth = 0;
            let p = node.parent;
            while (p && p !== this._rootNode) {
                depth++;
                p = p.parent;
            }
            const indent = "\u00A0\u00A0".repeat(depth);
            result.push({ label: indent + node.name, value: node.name });
        });

        return result;
    }

    /** Called just before retargeting; saves the current rest-pose state. */
    public prepareRetargeting(): void {
        if (this._inRestPose) {
            this._restPoseTransformNodeTransformations.clear();
            this._saveTransformNodes(this._restPoseTransformNodeTransformations);
        } else {
            this._restoreTransformNodes(this._restPoseTransformNodeTransformations);
        }
        this._retargetedTransformNodeTransformations.clear();
        this._saveTransformNodes();
    }

    /** Builds the rest-pose export data for the playground code generator. */
    public buildExportData(restPoseUpdate?: RestPoseDataUpdate): RestPoseDataUpdate {
        const animationTransformNodes: RestPoseDataUpdate = [];

        if (restPoseUpdate) {
            for (const dataBlock of restPoseUpdate) {
                animationTransformNodes.push(dataBlock);
            }
        }

        for (const [node, newTransformations] of this._retargetedTransformNodeTransformations) {
            const initialTransformations = this._initialTransformNodeTransformations.get(node);
            if (!initialTransformations) {
                continue;
            }

            const name = node.name.replace(/"/g, '\\"');
            const entry = animationTransformNodes.find((v) => v.name === name);
            let key = entry?.data;

            if (!initialTransformations.scaling.equals(newTransformations.scaling)) {
                if (!key) {
                    key = {};
                    animationTransformNodes.push({ name, data: key });
                }
                key.scaling = newTransformations.scaling.asArray();
            }
            if (!initialTransformations.quaternion.equals(newTransformations.quaternion)) {
                if (!key) {
                    key = {};
                    animationTransformNodes.push({ name, data: key });
                }
                key.quaternion = newTransformations.quaternion.asArray();
            }
            if (!initialTransformations.position.equals(newTransformations.position)) {
                if (!key) {
                    key = {};
                    animationTransformNodes.push({ name, data: key });
                }
                key.position = newTransformations.position.asArray();
            }
        }

        return animationTransformNodes;
    }

    public play(speed: number): void {
        if (!this._animationGroup) {
            return;
        }
        this._animationGroup.stop();
        this._animationGroup.start(true, speed);
        this._inRestPose = false;
        this.onPlayingObservable.notifyObservers(true);
    }

    public setAnimSpeed(speed: number): void {
        if (this._animationGroup) {
            this._animationGroup.speedRatio = speed;
        }
    }

    public returnToRest(): void {
        if (!this._animationGroup) {
            return;
        }
        this._animationGroup.stop();
        this._restoreTransformNodes(this._restPoseTransformNodeTransformations);
        this._inRestPose = true;
        this.onPlayingObservable.notifyObservers(false);
    }

    /**
     * Captures the current transform node transformations (while in rest pose, possibly edited via gizmo)
     * as a `RestPoseDataUpdate`. All transform node transformations are saved as absolute values.
     */
    public saveAsRestPose(): RestPoseDataUpdate {
        const result: RestPoseDataUpdate = [];
        if (!this._rootNode) {
            return result;
        }
        this._rootNode.getChildTransformNodes(false).forEach((node) => {
            if (!node.rotationQuaternion) {
                return;
            }
            const data: { position?: number[]; scaling?: number[]; quaternion?: number[] } = {};
            data.position = node.position.asArray();
            data.scaling = node.scaling.asArray();
            data.quaternion = node.rotationQuaternion.asArray();
            result.push({ name: node.name, data });
        });
        // Update internal rest pose baseline
        this._restPoseTransformNodeTransformations.clear();
        this._saveTransformNodes(this._restPoseTransformNodeTransformations);
        return result;
    }

    public setSkeletonVisible(visible: boolean): void {
        this._skeletonShow(visible);
    }

    public setSkeletonLocalAxes(visible: boolean): void {
        this._skeletonShowLocalAxes(visible);
    }

    public setGizmo(enabled: boolean, type: GizmoType): void {
        this._updateGizmoEnabled(enabled, type);
    }

    /** Attaches the gizmo to the transform node with the given name (called when user picks from the dropdown). */
    public attachGizmoToTransformNode(nodeName: string): void {
        if (!this._rootNode) {
            return;
        }
        const node = this._rootNode.getChildTransformNodes(false, (n) => n.name === nodeName)[0];
        if (!node) {
            return;
        }
        if (this._gizmoSelectedNode) {
            this._gizmoSelectedNode.position.copyFrom(node.absolutePosition);
        }
        this._selectedTransformNode = node;
        this._gizmoManager.attachToNode(node);
    }

    public handleBoneClick(x: number, y: number): void {
        if (!this._rootNode) {
            return;
        }
        const ray = this._scene.createPickingRay(x, y, Matrix.Identity(), this._camera, false);
        let selectedNode: Nullable<TransformNode> = null;
        let minDistance = Number.POSITIVE_INFINITY;

        this._rootNode.getChildTransformNodes(false).forEach((node) => {
            const d = DistancePointToLine(node.absolutePosition, ray.origin, ray.direction);
            if (d < minDistance) {
                minDistance = d;
                selectedNode = node;
                if (this._gizmoSelectedNode) {
                    this._gizmoSelectedNode.position.copyFrom(node.absolutePosition);
                }
            }
        });

        if (selectedNode) {
            this._selectedTransformNode = selectedNode as TransformNode;
            this._gizmoManager.attachToNode(selectedNode as TransformNode);
            this.onGizmoNodeSelectedObservable.notifyObservers((selectedNode as TransformNode).name);
        }
    }

    public dispose(): void {
        this._cleanScene();
        this._gizmoSelectedNode?.dispose();
        this._gizmoSelectedNode = null;
        this._gizmoManager.dispose();
    }

    private async _loadFileAsync(path: string, restPoseUpdate?: RestPoseDataUpdate, skeletonRootNodeName?: string): Promise<void> {
        if (path.startsWith("file:")) {
            await AppendSceneAsync(path.substring(5), this._scene, { rootUrl: "file:" });
        } else {
            await AppendSceneAsync(path, this._scene);
        }

        this._rootNode = this._scene.getMeshByName("__root__");
        if (!this._rootNode) {
            return;
        }
        this._rootNode.name = "reference";

        // Keep only our 2 cameras; remove any cameras loaded from the file
        while (this._scene.cameras.length > 2) {
            this._scene.cameras[2].dispose();
        }

        // Keep only the first animation group (not the "avatar" retargeted one)
        this._animationGroup = null;
        const lstAnimDelete = new Set<AnimationGroup>();
        for (const animGroup of this._scene.animationGroups) {
            if (animGroup.name !== "avatar") {
                if (!this._animationGroup) {
                    this._animationGroup = animGroup;
                } else {
                    lstAnimDelete.add(animGroup);
                }
            }
        }
        lstAnimDelete.forEach((anim) => anim.dispose());

        if (!this._animationGroup) {
            return;
        }
        this._animationGroup.name = "reference";

        // Delete all skeletons loaded from the animation file (we don't need them)
        const skeletonsDelete = new Set<import("core/Bones/skeleton").Skeleton>();
        for (const skeleton of this._scene.skeletons) {
            if (skeleton.name !== "avatar") {
                skeletonsDelete.add(skeleton);
            }
        }
        skeletonsDelete.forEach((skeleton) => skeleton.dispose());

        // Delete all meshes under the root node (animation files only need transform nodes)
        this._rootNode
            .getChildren((node) => node instanceof Mesh, false)
            .forEach((mesh) => {
                (mesh as Mesh).dispose();
            });

        // Use the user-selected root node, or fall back to hips heuristic
        let skeletonRoot: TransformNode = this._rootNode;
        if (skeletonRootNodeName) {
            const found = this._rootNode.getChildTransformNodes(false, (node) => node.name === skeletonRootNodeName)[0];
            if (found) {
                skeletonRoot = found;
            }
        } else {
            // Legacy heuristic: find hips/pelvis node
            let hipsNode: Nullable<TransformNode> = this._rootNode.getChildTransformNodes(false, (node) => node.name === "mixamorig:Hips")?.[0] ?? null;
            if (!hipsNode) {
                hipsNode = this._rootNode.getChildTransformNodes(false, (node) => node.name === "Hips")[0] ?? null;
            }
            if (!hipsNode) {
                hipsNode = this._rootNode.getChildTransformNodes(false, (node) => node.name.toLowerCase().indexOf("hips") >= 0)[0] ?? null;
            }
            if (!hipsNode) {
                hipsNode = this._rootNode.getChildTransformNodes(false, (node) => node.name.toLowerCase().indexOf("pelvis") >= 0)[0] ?? null;
            }
            if (hipsNode) {
                skeletonRoot = hipsNode;
            }
        }

        // Create a skeleton + visualization mesh from the transform node hierarchy
        const meshOptions: { name?: string; boneMeshSize?: number; createMesh?: boolean; mesh?: Mesh } = {
            name: "reference",
            boneMeshSize: 0.0001,
            createMesh: true,
        };

        const animSkeleton = CreateSkeletonFromTransformNodeHierarchy(skeletonRoot, this._scene, meshOptions);
        const meshAnim = meshOptions.mesh!;
        this._skeletonMesh = meshAnim;
        meshAnim.layerMask = ShadowLayerMask;
        meshAnim.isVisible = false;

        const initialNode = skeletonRoot;
        this._selectedTransformNode = initialNode;
        this._gizmoManager.attachToNode(initialNode);
        this.onGizmoNodeSelectedObservable.notifyObservers(initialNode.name);

        const meshAnimExtendSize = meshAnim.getBoundingInfo().boundingBox.extendSizeWorld;

        const skeletonViewer = new SkeletonViewer(animSkeleton, meshAnim, this._scene, undefined, 0, {
            displayMode: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS,
            displayOptions: {
                showLocalAxes: false,
                localAxesSize: Math.max(meshAnimExtendSize.x, meshAnimExtendSize.y, meshAnimExtendSize.z) * 5,
            },
        });
        this._skeletonViewer = skeletonViewer;
        skeletonViewer.isEnabled = false;
        skeletonViewer.utilityLayer!.setRenderCamera(this._camera);
        this._skeletonDebugMeshSet();

        const utilScene = skeletonViewer.utilityLayer!.utilityLayerScene!;
        const mat = new StandardMaterial("selectedBoneMatAnim", utilScene);
        mat.emissiveColor = Color3.Red();
        mat.disableLighting = true;

        this._gizmoSelectedNode?.dispose();
        this._gizmoSelectedNode = MeshBuilder.CreateSphere("selectedTransformNode", { diameter: 0.07, segments: 10 }, utilScene);
        this._gizmoSelectedNode.setEnabled(false);
        this._gizmoSelectedNode.material = mat;
        this._gizmoSelectedNode.layerMask = ShadowLayerMask;
        this._gizmoSelectedNode.renderingGroupId = 3;
        this._gizmoSelectedNode.position.copyFrom(initialNode.absolutePosition);

        if (restPoseUpdate && restPoseUpdate.length > 0) {
            this._applyRestPoseUpdate(restPoseUpdate);
        }

        this._initialTransformNodeTransformations.clear();
        this._restPoseTransformNodeTransformations.clear();
        this._saveTransformNodes(this._initialTransformNodeTransformations);
        this._saveTransformNodes(this._restPoseTransformNodeTransformations);
        this._animationGroup.speedRatio = 1;

        this._inRestPose = false;

        this.onLoadedObservable.notifyObservers();
    }

    private _skeletonShow(visible: boolean): void {
        if (!this._skeletonViewer) {
            return;
        }
        this._skeletonViewer.isEnabled = visible;
        this._skeletonDebugMeshSet();
    }

    private _skeletonShowLocalAxes(visible: boolean): void {
        if (!this._skeletonViewer) {
            return;
        }
        this._skeletonViewer.changeDisplayOptions("showLocalAxes", visible);
        this._skeletonDebugMeshSet();
    }

    private _gizmoShow(show: boolean): void {
        if (this._gizmoSelectedNode) {
            this._gizmoSelectedNode.setEnabled(show);
        }
    }

    private _updateGizmoEnabled(enabled: boolean, type: GizmoType): void {
        this._gizmoManager.positionGizmoEnabled = enabled && type === "Position";
        this._gizmoManager.rotationGizmoEnabled = enabled && type === "Rotation";
        this._gizmoManager.scaleGizmoEnabled = enabled && type === "Scale";
        this._gizmoShow(enabled);
    }

    private _skeletonDebugMeshSet(): void {
        if (!this._skeletonViewer?.debugMesh) {
            return;
        }
        this._skeletonViewer.debugMesh.layerMask = ShadowLayerMask;
        this._skeletonViewer.debugMesh.alwaysSelectAsActiveMesh = true;
        this._shadowGenerator.addShadowCaster(this._skeletonViewer.debugMesh);
        if (this._skeletonViewer.debugLocalAxesMesh) {
            this._skeletonViewer.debugLocalAxesMesh.layerMask = ShadowLayerMask;
            this._skeletonViewer.debugLocalAxesMesh.alwaysSelectAsActiveMesh = true;
        }
    }

    private _saveTransformNodes(map?: TransformNodeTransformations): void {
        if (!this._rootNode) {
            return;
        }
        map = map ?? this._retargetedTransformNodeTransformations;
        this._rootNode.getChildTransformNodes(false).forEach((node) => {
            if (!node.rotationQuaternion) {
                return;
            }
            map!.set(node, {
                position: node.position.clone(),
                scaling: node.scaling.clone(),
                quaternion: node.rotationQuaternion.clone(),
            });
        });
    }

    private _restoreTransformNodes(map?: TransformNodeTransformations): void {
        map = map ?? this._retargetedTransformNodeTransformations;
        map.forEach((transformation, tn) => {
            tn.position = transformation.position.clone();
            tn.scaling = transformation.scaling.clone();
            tn.rotationQuaternion = transformation.quaternion.clone();
            tn.computeWorldMatrix(true);
        });
    }

    private _applyRestPoseUpdate(restPoseUpdate: RestPoseDataUpdate): void {
        if (!this._rootNode) {
            return;
        }
        for (const dataBlock of restPoseUpdate) {
            const node = this._rootNode.getChildTransformNodes(false, (node) => node.name === dataBlock.name)[0];
            if (node) {
                if (dataBlock.data.position) {
                    node.position.fromArray(dataBlock.data.position);
                }
                if (dataBlock.data.scaling) {
                    node.scaling.fromArray(dataBlock.data.scaling);
                }
                if (dataBlock.data.quaternion) {
                    node.rotationQuaternion!.fromArray(dataBlock.data.quaternion);
                }
            }
        }
    }

    private _cleanScene(): void {
        this._animationGroup?.dispose();
        if (this._skeletonViewer) {
            this._skeletonViewer.skeleton.dispose();
            this._skeletonViewer.dispose();
            this._skeletonViewer = null;
        }
        this._skeletonMesh?.dispose();
        this._skeletonMesh = null;
        this._rootNode?.dispose(false, true);
        this._animationGroup = null;
        this._rootNode = null;
        this._selectedTransformNode = null;
    }
}
