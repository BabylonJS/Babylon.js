import type { Nullable } from "core/types";
import type { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import type { ShadowGenerator } from "core/Lights/Shadows/shadowGenerator";
import type { Scene } from "core/scene";
import type { AnimationGroup } from "core/Animations/animationGroup";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { TransformNode } from "core/Meshes/transformNode";

import { Color3 } from "core/Maths/math.color";
import type { Vector3 } from "core/Maths/math.vector";

import { Matrix, TmpVectors } from "core/Maths/math.vector";
import { StandardMaterial } from "core/Materials/standardMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import { Mesh } from "core/Meshes/mesh";
import { Observable } from "core/Misc/observable";
import { GizmoManager } from "core/Gizmos/gizmoManager";
import { GizmoCoordinatesMode } from "core/Gizmos/gizmo";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import { AnimatorAvatar } from "core/Animations/animatorAvatar";
import { SkeletonViewer } from "core/Debug/skeletonViewer";
import { ImportMeshAsync } from "core/Loading/sceneLoader";
import type { Bone } from "core/Bones/bone";

// Side-effect import needed for scene.createPickingRay (prototype-augmented)
import "core/Culling/ray";

import { Avatars } from "./data";
import { FindAvatarFromPath, DistancePointToLine } from "./helperFunctions";

export type GizmoType = "Position" | "Rotation" | "Scale";

const ShadowLayerMask = 0x10000000;

type BoneTransformations = Map<Bone, { position: Vector3; scaling: Vector3; quaternion: import("core/Maths/math.vector").Quaternion }>;

export class Avatar {
    private _animatorAvatar: Nullable<AnimatorAvatar> = null;
    private _animationGroup: Nullable<AnimationGroup> = null;
    private _skeletonViewer: Nullable<SkeletonViewer> = null;
    private _gizmoManager: GizmoManager;
    private _gizmoSelectedNode: Nullable<Mesh> = null;
    private _selectedBoneTransform: Nullable<TransformNode | Bone> = null;
    private _scaleRatio = 1;
    private _inRestPose = false;
    private _initialBoneTransformations: BoneTransformations = new Map();
    private _retargetedBoneTransformations: BoneTransformations = new Map();

    public readonly onLoadedObservable = new Observable<void>();
    public readonly onGizmoNodeSelectedObservable = new Observable<string>();
    public readonly onPlayingObservable = new Observable<boolean>();

    public get animatorAvatar(): Nullable<AnimatorAvatar> {
        return this._animatorAvatar;
    }
    public get animationGroup(): Nullable<AnimationGroup> {
        return this._animationGroup;
    }
    public get scaleRatio(): number {
        return this._scaleRatio;
    }
    public get inRestPose(): boolean {
        return this._inRestPose;
    }
    public get isLoaded(): boolean {
        return this._animatorAvatar !== null;
    }
    /** True when a retargeted animation is actively playing (not in rest pose). */
    public get isPlaying(): boolean {
        return this._animationGroup !== null && !this._inRestPose;
    }
    public get selectedBoneTransform(): Nullable<TransformNode | Bone> {
        return this._selectedBoneTransform;
    }
    public get initialBoneTransformations(): BoneTransformations {
        return this._initialBoneTransformations;
    }
    public get retargetedBoneTransformations(): BoneTransformations {
        return this._retargetedBoneTransformations;
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

    public async loadAsync(path: string, updateRestPose: boolean, rescaleAvatar: boolean): Promise<void> {
        this._cleanScene();
        await this._loadFileAsync(path, updateRestPose, rescaleAvatar);
    }

    /** Returns the list of all bone names in the avatar skeleton, in hierarchy order. */
    public getBoneNames(): string[] {
        if (!this._animatorAvatar) {
            return [];
        }
        const [skeleton] = this._animatorAvatar.skeletons;
        return skeleton.bones.map((b) => b.name);
    }

    /** Returns bone options in hierarchy order, with indented labels for parenting. */
    public getBoneOptions(): { label: string; value: string }[] {
        if (!this._animatorAvatar) {
            return [];
        }
        const [skeleton] = this._animatorAvatar.skeletons;
        return skeleton.bones.map((bone) => {
            let depth = 0;
            let p = bone.parent;
            while (p) {
                depth++;
                p = p.parent;
            }
            const indent = "\u00A0\u00A0".repeat(depth);
            return { label: indent + bone.name, value: bone.name };
        });
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

    public setAnimSpeed(speed: number): void {
        if (this._animationGroup) {
            this._animationGroup.speedRatio = speed;
        }
    }

    public play(speed: number): void {
        this._play(speed);
        this.onPlayingObservable.notifyObservers(true);
    }

    public returnToRest(deleteAnimation = false): void {
        this._animationGroup?.stop();
        if (this._animatorAvatar) {
            for (const skeleton of this._animatorAvatar.skeletons) {
                if (this._inRestPose) {
                    skeleton.setCurrentPoseAsRest();
                }
                skeleton.returnToRest();
                skeleton.prepare(true);
            }
        }
        this._inRestPose = true;
        if (deleteAnimation) {
            this._animationGroup?.dispose();
            this._animationGroup = null;
        }
        this.onPlayingObservable.notifyObservers(false);
    }

    public prepareRetargeting(): void {
        this.returnToRest(true);
        this._retargetedBoneTransformations.clear();
        this._saveBoneTransformations(this._retargetedBoneTransformations);
    }

    public buildExportData(avatarPath: string, avatarUpdateRestPose: boolean, epsilon: number): import("./data").RestPoseDataUpdate {
        const boneTransformations: import("./data").RestPoseDataUpdate = [];

        if (!avatarUpdateRestPose) {
            return boneTransformations;
        }

        const avatarName = FindAvatarFromPath(avatarPath);
        const restPoseUpdate = Avatars[avatarName]?.restPoseUpdate;
        if (restPoseUpdate) {
            for (const dataBlock of restPoseUpdate) {
                boneTransformations.push(dataBlock);
            }
        }

        for (const [bone, newT] of this._retargetedBoneTransformations) {
            const initT = this._initialBoneTransformations.get(bone);
            if (!initT) {
                continue;
            }
            const name = bone.name.replace(/"/g, '\\"');
            const entry = boneTransformations.find((v) => v.name === name);
            let key = entry?.data;
            if (!initT.scaling.equalsWithEpsilon(newT.scaling)) {
                if (!key) {
                    key = {};
                    boneTransformations.push({ name, data: key });
                }
                key.scaling = newT.scaling.asArray();
            }
            if (!initT.quaternion.equalsWithEpsilon(newT.quaternion, epsilon)) {
                if (!key) {
                    key = {};
                    boneTransformations.push({ name, data: key });
                }
                key.quaternion = newT.quaternion.asArray();
            }
            if (!initT.position.equalsWithEpsilon(newT.position, epsilon)) {
                if (!key) {
                    key = {};
                    boneTransformations.push({ name, data: key });
                }
                key.position = newT.position.asArray();
            }
        }

        return boneTransformations;
    }

    public setRetargetedAnimation(animGroup: AnimationGroup, speed: number): void {
        this._animationGroup = animGroup;
        this._animationGroup.start(true, speed);
        this._inRestPose = false;
        this.onPlayingObservable.notifyObservers(true);
    }

    public attachGizmoToBone(boneName: string): void {
        if (!this._animatorAvatar) {
            return;
        }
        for (const skeleton of this._animatorAvatar.skeletons) {
            const bone = skeleton.bones.find((b) => b.name === boneName);
            if (!bone) {
                continue;
            }
            if (this._gizmoSelectedNode) {
                const bonePos = bone._linkedTransformNode?.absolutePosition ?? bone.getAbsolutePosition(this._animatorAvatar.rootNode);
                this._gizmoSelectedNode.position.copyFrom(bonePos);
            }
            this._selectedBoneTransform = bone.getTransformNode() ?? bone;
            this._gizmoManager.attachToNode(bone.getTransformNode() ?? bone);
            return;
        }
    }

    public handleBoneClick(x: number, y: number): void {
        if (!this._animatorAvatar || !this._inRestPose) {
            return;
        }
        const ray = this._scene.createPickingRay(x, y, Matrix.Identity(), this._camera, false);
        let selectedBone: Nullable<Bone> = null;
        let minDistance = Number.POSITIVE_INFINITY;
        for (const skeleton of this._animatorAvatar.skeletons) {
            for (const bone of skeleton.bones) {
                const rootNode = this._animatorAvatar.rootNode;
                const bonePos = bone._linkedTransformNode?.absolutePosition ?? bone.getAbsolutePosition(rootNode);
                const d = DistancePointToLine(bonePos, ray.origin, ray.direction);
                if (d < minDistance) {
                    minDistance = d;
                    selectedBone = bone;
                }
            }
        }
        if (selectedBone) {
            if (this._gizmoSelectedNode) {
                const bonePos = selectedBone._linkedTransformNode?.absolutePosition ?? selectedBone.getAbsolutePosition(this._animatorAvatar.rootNode);
                this._gizmoSelectedNode.position.copyFrom(bonePos);
            }
            this._selectedBoneTransform = selectedBone.getTransformNode() ?? selectedBone;
            this._gizmoManager.attachToNode(selectedBone.getTransformNode() ?? selectedBone);
            this.onGizmoNodeSelectedObservable.notifyObservers(selectedBone.name);
        }
    }

    public dispose(): void {
        this._cleanScene();
        this._gizmoManager.dispose();
    }

    private async _loadFileAsync(path: string, updateRestPose: boolean, rescaleAvatar: boolean): Promise<void> {
        const result = await ImportMeshAsync(path, this._scene);
        const avatarRootNode = result.meshes[0];
        avatarRootNode.name = "avatar";

        this._animatorAvatar = new AnimatorAvatar("avatar", avatarRootNode);
        for (const skeleton of this._animatorAvatar.skeletons) {
            skeleton.name = "avatar";
            skeleton.returnToRest();
        }

        const boundingVectors = avatarRootNode.getHierarchyBoundingVectors(true, (node) => node instanceof Mesh);
        const extendSize = boundingVectors.max.subtract(boundingVectors.min);
        const maxDim = Math.max(extendSize.x, extendSize.y, extendSize.z);

        this._scaleRatio = 1;
        if (rescaleAvatar && (maxDim > 3 || maxDim < 0.1)) {
            this._scaleRatio = 2 / maxDim;
            avatarRootNode.scaling.setAll(this._scaleRatio);
        }

        // Delete avatar's own animation groups, keep only the reference animation
        for (const anim of [...this._scene.animationGroups]) {
            if (anim.name !== "reference") {
                anim.dispose();
            }
        }

        // Set layer masks for all meshes recursively
        let avatarMesh: Nullable<AbstractMesh> = null;
        for (const mesh of avatarRootNode.getChildMeshes()) {
            if (!avatarMesh) {
                avatarMesh = mesh;
            }
            mesh.layerMask = ShadowLayerMask;
            mesh.receiveShadows = true;
            this._shadowGenerator.addShadowCaster(mesh);
        }

        if (updateRestPose) {
            this._updateRestPose(path);
        }

        this._initialBoneTransformations.clear();
        this._saveBoneTransformations(this._initialBoneTransformations);

        const [avatarSkeleton] = this._animatorAvatar.skeletons;
        const skeletonViewer = new SkeletonViewer(avatarSkeleton, (avatarMesh ?? result.meshes[1]) as Mesh, this._scene, undefined, 0, {
            displayMode: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS,
            displayOptions: {
                showLocalAxes: false,
                localAxesSize: Math.max(extendSize.x, extendSize.y, extendSize.z) / 20,
            },
        });
        this._skeletonViewer = skeletonViewer;
        skeletonViewer.isEnabled = false;
        skeletonViewer.utilityLayer!.setRenderCamera(this._camera);

        let rootBone = avatarSkeleton.bones[0];
        for (const bone of avatarSkeleton.bones) {
            if (!bone.parent) {
                rootBone = bone;
                break;
            }
        }

        const utilScene = skeletonViewer.utilityLayer!.utilityLayerScene!;
        const mat = new StandardMaterial("selectedBoneMatAvatar", utilScene);
        mat.emissiveColor = Color3.Red();
        mat.disableLighting = true;

        this._gizmoSelectedNode = MeshBuilder.CreateSphere("selectedBoneAvatar", { diameter: 0.07, segments: 10 }, utilScene);
        this._gizmoSelectedNode.setEnabled(false);
        this._gizmoSelectedNode.material = mat;
        this._gizmoSelectedNode.layerMask = ShadowLayerMask;
        this._gizmoSelectedNode.renderingGroupId = 1;

        const bonePos = rootBone._linkedTransformNode?.absolutePosition ?? rootBone.getAbsolutePosition(avatarRootNode);
        this._gizmoSelectedNode.position.copyFrom(bonePos);

        this._selectedBoneTransform = rootBone.getTransformNode() ?? rootBone;
        this._gizmoManager.attachToNode(rootBone.getTransformNode() ?? rootBone);
        this._gizmoManager.additionalTransformNode = rootBone.getTransformNode() ? undefined : avatarRootNode;

        this._inRestPose = true;
        this.onLoadedObservable.notifyObservers();
        this.onGizmoNodeSelectedObservable.notifyObservers(rootBone.name);
    }

    private _cleanScene(): void {
        this._animatorAvatar?.dispose();
        this._animatorAvatar = null;
        this._skeletonViewer?.dispose();
        this._skeletonViewer = null;
        this._gizmoSelectedNode?.dispose();
        this._gizmoSelectedNode = null;
        this._selectedBoneTransform = null;
        this._scene.getAnimationGroupByName("avatar")?.dispose();
    }

    private _updateRestPose(path: string): void {
        const avatarName = FindAvatarFromPath(path);
        const restPoseUpdate = Avatars[avatarName]?.restPoseUpdate;
        if (!restPoseUpdate || !this._animatorAvatar) {
            return;
        }

        const [avatarSkeleton] = this._animatorAvatar.skeletons;
        for (const dataBlock of restPoseUpdate) {
            const index = avatarSkeleton.getBoneIndexByName(dataBlock.name);
            if (index !== -1) {
                const bone = avatarSkeleton.bones[index];
                if (dataBlock.data.position) {
                    bone.position = TmpVectors.Vector3[0].fromArray(dataBlock.data.position);
                }
                if (dataBlock.data.scaling) {
                    bone.scaling = TmpVectors.Vector3[0].fromArray(dataBlock.data.scaling);
                }
                if (dataBlock.data.quaternion) {
                    bone.rotationQuaternion = TmpVectors.Quaternion[0].fromArray(dataBlock.data.quaternion);
                }
            }
        }
        avatarSkeleton.setCurrentPoseAsRest();
        avatarSkeleton.returnToRest();
    }

    private _skeletonDebugMeshSet(): void {
        if (!this._skeletonViewer?.debugMesh) {
            return;
        }
        this._skeletonViewer.debugMesh.layerMask = ShadowLayerMask;
        this._skeletonViewer.debugMesh.alwaysSelectAsActiveMesh = true;
        if (this._skeletonViewer.debugLocalAxesMesh) {
            this._skeletonViewer.debugLocalAxesMesh.layerMask = ShadowLayerMask;
        }
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
        const show = enabled && this._inRestPose;
        this._gizmoManager.positionGizmoEnabled = show && type === "Position";
        this._gizmoManager.rotationGizmoEnabled = show && type === "Rotation";
        this._gizmoManager.scaleGizmoEnabled = show && type === "Scale";
        this._gizmoShow(show);
    }

    private _saveBoneTransformations(map: BoneTransformations): void {
        if (!this._animatorAvatar) {
            return;
        }
        const [skeleton] = this._animatorAvatar.skeletons;
        for (const bone of skeleton.bones) {
            map.set(bone, {
                position: bone.position.clone(),
                scaling: bone.scaling.clone(),
                quaternion: bone.rotationQuaternion!.clone(),
            });
        }
    }

    private _play(speed: number): void {
        if (!this._animationGroup) {
            return;
        }
        this._animationGroup.stop();
        this._animationGroup.start(true, speed);
        this._inRestPose = false;
    }
}
