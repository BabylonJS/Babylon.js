import type { MorphTargetManager, Immutable, Bone, Nullable, MorphTarget, AnimationGroup, Animation, Node, Skeleton, TargetedAnimation, DeepImmutableObject } from "core/index";
import { Vector3, Quaternion, TmpVectors, Matrix } from "core/Maths/math.vector";
import { Logger } from "../Misc/logger";
import { TransformNode } from "../Meshes/transformNode";
import { AbstractMesh } from "../Meshes/abstractMesh";

/**
 * Options for retargeting an animation group to an avatar.
 */
export interface IRetargetOptions {
    /**
     * The name to assign to the (cloned) retargeted animation group.
     * If not specified, the same name as the original animation group will be used.
     */
    animationGroupName?: string;

    /**
     * If true, the retargeted animations will be fixed to correct common issues like orthogonal quaternions.
     * Default is false.
     */
    fixAnimations?: boolean;

    /**
     * If true, the parent hierarchy of bones and transform nodes will be checked during retargeting.
     * Animations will be removed if the hierarchies don't match.
     * Default is false.
     */
    checkHierarchy?: boolean;

    /**
     * If true, the frame values in the animation keyframes will be adjusted during retargeting to account for differences
     * between the source and target bone transforms.
     * Default is true.
     */
    retargetAnimationKeys?: boolean;

    /**
     * If true, scales and adjusts the root position animation to account for size differences between the source and target avatars.
     * This helps maintain the relative motion of the character when retargeting between avatars of different proportions.
     * Default is true.
     */
    fixRootPosition?: boolean;

    /**
     * If true, adjusts the root position animation to correct for ground reference height differences between the source and target avatars.
     * This ensures that the animated character maintains proper contact with the ground during retargeting.
     * Requires groundReferenceNodeName to be specified to determine the ground reference point in the source animation.
     * Default is false.
     */
    fixGroundReference?: boolean;

    /**
     * If true, adjusts the ground reference dynamically during retargeting. fixGroundReference must be true for this to work.
     * When enabled, the system will continuously adjust the ground reference point throughout the retargeting process to make sure it's the lowest point of the character.
     * This allows for more accurate ground contact correction, especially in animations where groundReferenceNodeName is not always the lowest point (e.g., walking, running).
     * Default is false.
     */
    fixGroundReferenceDynamicRefNode?: boolean;

    /**
     * The name of the root transform node in the source animation group (typically "Hips" or similar).
     * If not specified, the system will attempt to automatically find the first bone without a parent.
     * This bone is used as a reference point for fixing root position during retargeting.
     * It's also used by the ground reference fixing processing.
     */
    rootNodeName?: string;

    /**
     * The name of the transform node in the source animation group used as a ground reference point (typically a foot bone like "LeftFoot" or "RightFoot").
     * This bone is used to determine the vertical offset needed to maintain proper ground contact during retargeting.
     * Required when fixGroundReference or fixRootPosition is enabled.
     */
    groundReferenceNodeName?: string;

    /**
     * Specifies which axis represents the vertical/up direction in the animation space.
     * Use "X", "Y", or "Z" to explicitly set the vertical axis, or "" (empty string) / undefined to auto-detect.
     * If not specified or empty, the system will automatically determine the vertical axis based on the difference
     * between the root node and ground reference node positions.
     * Default is undefined (auto-detect).
     */
    groundReferenceVerticalAxis?: "" | "X" | "Y" | "Z";

    /**
     * A map for renaming nodes during retargeting when the source transform node hierarchy and target skeleton use different naming conventions.
     * The map keys are the original node names from the source animation group, and the values are the corresponding
     * node names in the target skeleton. This is useful when bone names don't match between avatars.
     */
    mapNodeNames?: Map<string, string>;
}

type TransformNodeNameToNode = Map<string, { node: TransformNode; initialTransformations: { position: Vector3; scaling: Vector3; quaternion: Quaternion } }>;

/**
 * Represents an animator avatar that manages meshes, skeletons and morph target managers for a hierarchical transform node and mesh structure.
 * This class is used to group and manage animation-related resources (meshes, skeletons and morph targets) associated with a root transform node and its descendants.
 */
export class AnimatorAvatar {
    /**
     * List of meshes found in the hierarchy of the root node. Only meshes with at least one vertex are included.
     */
    public meshes: AbstractMesh[];

    /**
     * Set of skeletons found in the mesh hierarchy.
     */
    public skeletons: Set<Skeleton>;

    /**
     * Set of morph target managers found in the mesh hierarchy.
     * Each morph target manager is configured with the appropriate mesh name and influencer count.
     */
    public morphTargetManagers: Set<MorphTargetManager>;

    private _mapMorphTargetNameToMorphTarget: Map<string, MorphTarget>;
    /**
     * Map of morph target names to their corresponding MorphTarget instances.
     * The keys are constructed using the format "meshName_morphTargetName".
     */
    public get mapMorphTargetNameToMorphTarget(): Immutable<Map<string, MorphTarget>> {
        if (!this._mapMorphTargetNameToMorphTarget) {
            this._buildMorphTargetMap();
        }
        return this._mapMorphTargetNameToMorphTarget;
    }

    /**
     * Indicates whether to show warnings during retargeting operations.
     */
    public showWarnings = true;

    /**
     * Creates an instance of AnimatorAvatar.
     * @param name - The name to assign to this avatar and its root node
     * @param rootNode - The root node of the avatar hierarchy. This node and its descendants will be scanned for meshes, skeletons and morph target managers. If not provided, you are expected to manually manage meshes, skeletons and morph target managers.
     * @param _disposeResources - Indicates whether to dispose of resources (meshes, skeletons, morph target managers, root node and descendants + materials and textures) when the avatar is disposed (true by default)
     * @param setAvatarName - Indicates whether to set the name of the root node to the avatar name. Default is true. Set this to false if you don't want the root node to be renamed, or if you want to set it to a different name after creating the avatar.
     */
    constructor(
        public readonly name: string,
        public readonly rootNode?: TransformNode,
        private _disposeResources = true,
        setAvatarName = true
    ) {
        this.meshes = [];
        this.skeletons = new Set<Skeleton>();
        this.morphTargetManagers = new Set<MorphTargetManager>();

        if (!rootNode) {
            return;
        }

        if (setAvatarName) {
            rootNode.name = name;
        }

        if (rootNode instanceof AbstractMesh && rootNode.getTotalVertices() > 0) {
            this._collectMesh(rootNode);
        }

        rootNode
            .getChildMeshes(false, (node) => {
                const mesh = node as AbstractMesh;
                return mesh.getTotalVertices() > 0;
            })
            .forEach((mesh) => {
                this._collectMesh(mesh);
            });

        this._computeBoneWorldMatrices();
    }

    private _collectMesh(mesh: AbstractMesh) {
        this.meshes.push(mesh);

        if (mesh.skeleton) {
            this.skeletons.add(mesh.skeleton);
        }

        if (mesh.morphTargetManager) {
            mesh.morphTargetManager.meshName = mesh.name;
            mesh.morphTargetManager.numMaxInfluencers = mesh.morphTargetManager.numTargets;

            this.morphTargetManagers.add(mesh.morphTargetManager);
        }
    }

    /**
     * Finds a bone in the avatar's skeletons by its linked transform node or the name of the linked transform node.
     * @param nameOrTransformNode The linked transform node or the name of the linked transform node
     * @returns The found bone or null if not found
     */
    public findBoneByTransformNode(nameOrTransformNode: string | TransformNode): Nullable<Bone> {
        const isName = !this._isTransformNode(nameOrTransformNode);
        const iterator = this.skeletons.keys();

        let bone: Nullable<Bone> = null;

        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const skeleton = key.value;

            if (isName) {
                bone = skeleton.findBoneFromLinkedTransformNodeName(nameOrTransformNode);
            } else {
                bone = skeleton.findBoneFromLinkedTransformNode(nameOrTransformNode);
            }

            if (bone) {
                return bone;
            }
        }

        return null;
    }

    /**
     * Finds a bone in the avatar's skeletons by its name.
     * @param name The name of the bone
     * @returns The found bone or null if not found
     */
    public findBoneByName(name: string): Nullable<Bone> {
        const iterator = this.skeletons.keys();

        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const skeleton = key.value;
            const index = skeleton.getBoneIndexByName(name);

            if (index !== -1) {
                return skeleton.bones[index];
            }
        }

        return null;
    }

    /**
     * Make sures that the animation group passed as the first parameter will animate the bones in the skeleton(s) / the morphs in the morph target manager(s) of the avatar.
     * Retargeting is based on the names of the targets (TransformNode or MorphTarget) in the animation and the names of the bones in the skeleton / morph targets in the morph target manager.
     * Note that you can use the mapNodeNames option to specify a mapping between source transform node names and target bone names in case they are different.
     * If no bones with the same name as a target (TransformNode) of a targeted animation are found, the targeted animation is removed from the animation group.
     * Same for morph targets.
     * Note that for the time being, we only support a source animation group which animates transform nodes, not bones!
     * That's typically the case when the source animation group is created from a glTF file, as glTF animations always target transform nodes.
     * @param sourceAnimationGroup The animation group to retarget
     * @param options Options for retargeting the animation group (optional)
     * @returns The retargeted (new) animation group
     */
    public retargetAnimationGroup(sourceAnimationGroup: AnimationGroup, options?: IRetargetOptions): AnimationGroup {
        const localOptions: IRetargetOptions = {
            animationGroupName: sourceAnimationGroup.name,
            fixAnimations: false,
            checkHierarchy: false,
            retargetAnimationKeys: true,
            fixGroundReference: false,
            fixGroundReferenceDynamicRefNode: false,
            fixRootPosition: true,
            ...options,
        };

        // Make sure that all world matrices are up to date, both in the bone hierarchy and in the animation transform node hierarchy
        this._computeBoneWorldMatrices();

        const mapNodeNames = localOptions.mapNodeNames ?? new Map();
        const lstSourceTransformNodes = new Set<TransformNode>();
        const sourceTransformNodeNameToNode: TransformNodeNameToNode = new Map();

        for (let i = 0; i < sourceAnimationGroup.targetedAnimations.length; ++i) {
            const ta = sourceAnimationGroup.targetedAnimations[i];
            if (ta.target.getClassName?.() === "TransformNode" && !lstSourceTransformNodes.has(ta.target)) {
                const tn = ta.target as TransformNode;

                lstSourceTransformNodes.add(tn);

                if (!tn.rotationQuaternion) {
                    tn.rotationQuaternion = Quaternion.FromEulerAngles(tn.rotation.x, tn.rotation.y, tn.rotation.z);
                    tn.rotation.setAll(0);
                }

                sourceTransformNodeNameToNode.set(mapNodeNames.get(tn.name) ?? tn.name, {
                    node: tn,
                    initialTransformations: {
                        position: tn.position.clone(),
                        scaling: tn.scaling.clone(),
                        quaternion: tn.rotationQuaternion.clone(),
                    },
                });
            }
        }

        lstSourceTransformNodes.forEach((node) => {
            node.computeWorldMatrix(true);
        });

        // Clone the source animation and retarget it
        const animationGroup = sourceAnimationGroup.clone(localOptions.animationGroupName!, undefined, true, true);

        const mapTransformNodeToRootNode: Map<TransformNode, Node> = new Map<TransformNode, Node>();
        const lstAnims = new Set<Animation>();

        for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
            const ta = animationGroup.targetedAnimations[i];
            const animation = ta.animation;

            if (lstAnims.has(animation)) {
                if (this.showWarnings) {
                    Logger.Warn(
                        `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': animation '${animation.name}' is used multiple times in the same animation group: duplicated animations are not supported, the retargeted animation may not work as expected.`
                    );
                }
            }

            lstAnims.add(animation);

            switch (animation.targetProperty) {
                case "influence": {
                    if (!this._retargetMorphTarget(ta, animationGroup.name)) {
                        animationGroup.targetedAnimations.splice(i, 1);
                        i--;
                    }
                    break;
                }
                case "position":
                case "rotationQuaternion":
                case "scaling": {
                    if (ta.target.getClassName?.() !== "TransformNode") {
                        break;
                    }

                    const sourceTransformNode = ta.target as TransformNode;
                    const sourceTransformNodeName = mapNodeNames.get(sourceTransformNode.name) ?? sourceTransformNode.name;
                    let targetBone = this.findBoneByTransformNode(sourceTransformNodeName);

                    if (!targetBone) {
                        targetBone = this.findBoneByName(sourceTransformNodeName);
                    }

                    if (!targetBone) {
                        if (this.showWarnings) {
                            Logger.Warn(
                                `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': "${sourceTransformNodeName}" bone not found in any skeleton of avatar: animation removed.`
                            );
                            animationGroup.targetedAnimations.splice(i, 1);
                            i--;
                        }
                        break;
                    }

                    if (
                        !this._retargetTransformNodeToBone(
                            ta,
                            sourceTransformNode,
                            targetBone,
                            animationGroup.name,
                            mapTransformNodeToRootNode,
                            mapNodeNames,
                            !!localOptions.checkHierarchy
                        )
                    ) {
                        animationGroup.targetedAnimations.splice(i, 1);
                        i--;
                    } else if (localOptions.retargetAnimationKeys) {
                        this._retargetAnimationKeys(ta.animation, sourceTransformNode, targetBone);
                    }

                    break;
                }
            }
        }

        if (localOptions.fixAnimations) {
            this._fixAnimationGroup(animationGroup);
        }

        if (localOptions.fixGroundReference || localOptions.fixRootPosition) {
            const msg =
                localOptions.fixGroundReference && localOptions.fixRootPosition
                    ? "Ground reference and root position fixing processes skipped."
                    : localOptions.fixGroundReference
                      ? "Ground reference fixing process skipped."
                      : "Root position fixing process skipped.";

            const res = this._findVerticalAxis(
                msg,
                animationGroup,
                mapNodeNames.get(localOptions.rootNodeName) ?? localOptions.rootNodeName,
                sourceTransformNodeNameToNode,
                mapNodeNames.get(localOptions.groundReferenceNodeName) ?? localOptions.groundReferenceNodeName,
                localOptions.groundReferenceVerticalAxis
            );

            if (res) {
                const {
                    verticalAxis,
                    sourceRootTransformNode,
                    targetRootTransformNodeOrBone,
                    targetRootPositionAnimation,
                    sourceGroundReferenceTransformNode,
                    targetGroundReferenceTransformNodeOrBone,
                    proportionRatio,
                } = res;

                if (localOptions.fixRootPosition) {
                    this._fixRootPosition(
                        sourceAnimationGroup,
                        animationGroup,
                        sourceRootTransformNode,
                        targetRootTransformNodeOrBone,
                        targetRootPositionAnimation,
                        proportionRatio
                    );
                    this._resetStates(sourceTransformNodeNameToNode);
                }

                const fixGroundReferenceDynamicRefNode = !!localOptions.fixGroundReferenceDynamicRefNode;

                if (localOptions.fixGroundReference) {
                    this._fixGroundReference(
                        sourceAnimationGroup,
                        animationGroup,
                        verticalAxis,
                        targetRootTransformNodeOrBone,
                        targetRootPositionAnimation,
                        sourceGroundReferenceTransformNode,
                        targetGroundReferenceTransformNodeOrBone,
                        lstSourceTransformNodes,
                        mapNodeNames,
                        fixGroundReferenceDynamicRefNode
                    );
                    this._resetStates(sourceTransformNodeNameToNode);
                } else if (fixGroundReferenceDynamicRefNode) {
                    if (this.showWarnings) {
                        Logger.Warn(
                            `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': fixGroundReferenceDynamicRefNode option is set to true but fixGroundReference is false: dynamic ground reference node fixing process skipped.`
                        );
                    }
                }
            }
        }

        return animationGroup;
    }

    /**
     * Disposes of the avatar and releases all associated resources.
     * This will dispose all skeletons, morph target managers, and the root mesh with its descendants (including materials and textures).
     * If disposeResources was set to false in the constructor, this method does nothing.
     */
    public dispose(): void {
        if (!this._disposeResources) {
            return;
        }

        const iterator = this.skeletons.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            key.value.dispose();
        }

        const iterator2 = this.morphTargetManagers.keys();
        for (let key = iterator2.next(); key.done !== true; key = iterator2.next()) {
            key.value.dispose();
        }

        this.rootNode?.dispose(false, true);
    }

    private _computeBoneWorldMatrices() {
        this.skeletons.forEach((skeleton) => {
            skeleton.prepare(true);

            skeleton.bones.forEach((bone) => {
                bone._linkedTransformNode?.computeWorldMatrix(true);
            });
        });
    }

    private _isTransformNode(nameOrTransformNode: string | TransformNode): nameOrTransformNode is TransformNode {
        return typeof nameOrTransformNode !== "string";
    }

    private _buildMorphTargetMap(): void {
        this._mapMorphTargetNameToMorphTarget = new Map<string, MorphTarget>();

        this.morphTargetManagers.forEach((manager) => {
            const numTargets = manager.numTargets;

            for (let t = 0; t < numTargets; ++t) {
                const target = manager.getTarget(t);
                const key = manager.meshName + "_" + target.name;

                this._mapMorphTargetNameToMorphTarget.set(key, target);
            }
        });
    }

    private _retargetMorphTarget(ta: TargetedAnimation, animationGroupName: string) {
        const morphTarget = ta.target as MorphTarget;
        const key = morphTarget.morphTargetManager?.meshName + "_" + morphTarget.name;

        if (!this.mapMorphTargetNameToMorphTarget.has(key)) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroupName}': "${morphTarget.name}" morph target not found in morph target manager of mesh "${morphTarget.morphTargetManager?.meshName}": animation removed`
                );
            }
            return false;
        }

        ta.target = this.mapMorphTargetNameToMorphTarget.get(key)!;

        return true;
    }

    private _retargetTransformNodeToBone(
        ta: TargetedAnimation,
        sourceTransformNode: TransformNode,
        targetBone: Bone,
        animationGroupName: string,
        mapTransformNodeToRootNode: Map<TransformNode, Node>,
        mapNodeNames: Map<string, string>,
        checkHierarchy: boolean
    ) {
        if (checkHierarchy) {
            let rootNode = mapTransformNodeToRootNode.get(sourceTransformNode);

            if (!rootNode) {
                rootNode = this._getRootNode(sourceTransformNode);
                mapTransformNodeToRootNode.set(sourceTransformNode, rootNode);
            }

            if (!this._checkParentHierarchy(targetBone, rootNode!, mapNodeNames)) {
                if (this.showWarnings) {
                    Logger.Warn(
                        `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroupName}': parent hierarchy mismatch between bone "${targetBone._linkedTransformNode?.name ?? targetBone.name}" and transform node "${sourceTransformNode.name}": animation removed`
                    );
                }
                return false;
            }
        }

        ta.target = targetBone._linkedTransformNode ?? targetBone;

        return true;
    }

    private _retargetAnimationKeys(animation: Animation, sourceTransformNode: TransformNode, targetBone: Bone) {
        const keys = animation.getKeys();
        const targetTransformNode = targetBone._linkedTransformNode;

        let targetWorldMatrix: Matrix;
        let targetParentWorldMatrix: DeepImmutableObject<Matrix>;

        if (targetTransformNode) {
            targetWorldMatrix = targetTransformNode.getWorldMatrix();
            targetParentWorldMatrix = targetTransformNode.parent ? targetTransformNode.parent.getWorldMatrix() : Matrix.IdentityReadOnly;
        } else {
            targetWorldMatrix = targetBone.getFinalMatrix();
            targetParentWorldMatrix = targetBone.parent ? targetBone.parent.getFinalMatrix() : Matrix.IdentityReadOnly;
        }

        const targetParentInverseWorldMatrix = targetParentWorldMatrix.invertToRef(TmpVectors.Matrix[0]);

        const sourceInverseWorld = sourceTransformNode.getWorldMatrix().invertToRef(TmpVectors.Matrix[1]);
        const sourceParentWorld = sourceTransformNode.parent ? sourceTransformNode.parent.getWorldMatrix() : Matrix.IdentityReadOnly;

        switch (animation.targetProperty) {
            case "rotationQuaternion": {
                for (const key of keys) {
                    const quaternion = key.value as Quaternion;

                    const localMat = Matrix.ComposeToRef(sourceTransformNode.scaling, quaternion, sourceTransformNode.position, TmpVectors.Matrix[2]);

                    sourceInverseWorld.multiplyToRef(localMat, localMat).multiplyToRef(sourceParentWorld, localMat);
                    targetWorldMatrix.multiplyToRef(localMat, localMat).multiplyToRef(targetParentInverseWorldMatrix, localMat).decompose(undefined, quaternion, undefined);
                }
                break;
            }
            case "position": {
                for (const key of keys) {
                    const position = key.value as Vector3;

                    const localMat = Matrix.ComposeToRef(sourceTransformNode.scaling, sourceTransformNode.rotationQuaternion!, position, TmpVectors.Matrix[2]);

                    sourceInverseWorld.multiplyToRef(localMat, localMat).multiplyToRef(sourceParentWorld, localMat);
                    targetWorldMatrix.multiplyToRef(localMat, localMat).multiplyToRef(targetParentInverseWorldMatrix, localMat).decompose(undefined, undefined, position);
                }
                break;
            }
            case "scaling": {
                for (const key of keys) {
                    const scaling = key.value as Vector3;

                    const localMat = Matrix.ComposeToRef(scaling, sourceTransformNode.rotationQuaternion!, sourceTransformNode.position, TmpVectors.Matrix[2]);

                    sourceInverseWorld.multiplyToRef(localMat, localMat).multiplyToRef(sourceParentWorld, localMat);
                    targetWorldMatrix.multiplyToRef(localMat, localMat).multiplyToRef(targetParentInverseWorldMatrix, localMat).decompose(scaling, undefined, undefined);
                }
                break;
            }
        }
    }

    /**
     * This method corrects quaternion animations when two consecutive quaternions are orthogonal to each other. When this happens, in 99.99% of
     * cases it's an error in the animation data, as two consecutive rotations should normally be close to each other and not have a large gap.
     * The fix is to copy the first quaternion into the second.
     * @param animationGroup The animation group to fix
     * @internal
     */
    private _fixAnimationGroup(animationGroup: AnimationGroup) {
        for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
            const ta = animationGroup.targetedAnimations[i];

            switch (ta.animation.targetProperty) {
                case "rotationQuaternion": {
                    const keys = ta.animation.getKeys();

                    for (let i = 0; i < keys.length - 1; ++i) {
                        const curQuat = keys[i].value as Quaternion;
                        const nextQuat = keys[i + 1].value as Quaternion;

                        if (Math.abs(Quaternion.Dot(curQuat, nextQuat)) < 0.001) {
                            keys[i + 1].value = curQuat.clone();
                            i += 1;
                        }
                    }
                    break;
                }
            }
        }
    }

    private _getRootNode(node: Node): Node {
        let current: Node = node;

        while (current.parent) {
            current = current.parent;
        }

        return current;
    }

    /**
     * Checks whether the parent hierarchy of a bone matches that of a given transform node. Checks are performed by name.
     * It works by first finding the transform node in the descendants of the root transform node that matches the bone's linked transform node.
     * Then it traverses up the hierarchy of both the bone and the transform node, comparing their names at each level.
     * @param bone The bone to check
     * @param rootTransformNode The root transform node to check against
     * @returns True if the hierarchies match, false otherwise
     * @internal
     */
    private _checkParentHierarchy(bone: Bone, rootTransformNode: Node, mapNodeNames: Map<string, string>) {
        const children = rootTransformNode.getDescendants(false, (node) => (mapNodeNames.get(node.name) ?? node.name) === (bone._linkedTransformNode?.name ?? bone.name));
        if (!children || children.length !== 1) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', CheckParentHierarchy: unable to find a corresponding transform node to bone name "${bone._linkedTransformNode?.name ?? bone.name}" in the source animation.`
                );
            }
            return false;
        }

        let transformNode: Nullable<Node> = children[0];

        while (bone) {
            const name = mapNodeNames.get(transformNode?.name ?? "") ?? transformNode?.name;
            const boneName = bone._linkedTransformNode?.name ?? bone.name;
            if (boneName !== name) {
                if (this.showWarnings) {
                    Logger.Warn(`RetargetAnimationGroup - Avatar '${this.name}', CheckParentHierarchy: bone name "${boneName}" is different from transform node name "${name}".`);
                }
                return false;
            }

            bone = bone.parent;
            transformNode = transformNode!.parent;
        }

        return true;
    }

    private _getRootNodeName(rootNodeName: string | undefined, transformNodeNameToNode: TransformNodeNameToNode) {
        if (rootNodeName) {
            return rootNodeName;
        }

        // Look for the first bone that doesn't have a parent
        const iterator = this.skeletons.keys();
        for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
            const skeleton = key.value;

            for (const bone of skeleton.bones) {
                if (!bone.parent) {
                    // Make sure there's a transform node with that name in the source animation
                    if (transformNodeNameToNode.get(bone.name)) {
                        return bone.name;
                    }
                }
            }
        }

        return;
    }

    private _findVerticalAxis(
        msg: string,
        animationGroup: AnimationGroup,
        remappedRootNodeName: string | undefined,
        sourceTransformNodeNameToNode: TransformNodeNameToNode,
        remappedGroundReferenceNodeName?: string,
        groundReferenceVerticalAxis?: string
    ) {
        if (!remappedGroundReferenceNodeName) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': you must provide the name of the ground reference node (option parameter "groundReferenceNodeName"). ${msg}`
                );
            }
            return null;
        }

        remappedRootNodeName = this._getRootNodeName(remappedRootNodeName, sourceTransformNodeNameToNode);

        if (!remappedRootNodeName) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': unable to find a suitable root node in the source animation. You should provide its name through the "rootNodeName" optional parameter. ${msg}`
                );
            }
            return null;
        }

        const sourceRootTransformNode = sourceTransformNodeNameToNode.get(remappedRootNodeName)?.node;
        const sourceGroundReferenceTransformNode = sourceTransformNodeNameToNode.get(remappedGroundReferenceNodeName)?.node;

        if (!sourceRootTransformNode) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': unable to find the transform node corresponding to "${remappedRootNodeName}" in the source animation. This transform node either doesn't exist or is not animated. ${msg}`
                );
            }
            return null;
        }

        if (!sourceGroundReferenceTransformNode) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': unable to find the transform node corresponding to "${remappedGroundReferenceNodeName}" in the source animation. This transform node either doesn't exist or is not animated. ${msg}`
                );
            }
            return null;
        }

        // Look for the position animation + target node of the root node name (generally the hips) in the retargeted animation
        let targetRootPositionAnimation: Animation | undefined;
        let targetRootTransformNodeOrBone: TransformNode | Bone | undefined;

        for (let i = 0; i < animationGroup.targetedAnimations.length; ++i) {
            const ta = animationGroup.targetedAnimations[i];
            const target = ta.target;
            const animation = ta.animation;

            if (target.name === remappedRootNodeName && animation.targetProperty === "position") {
                targetRootPositionAnimation = animation;
                targetRootTransformNodeOrBone = ta.target;
                break;
            }
        }

        if (!targetRootPositionAnimation || !targetRootTransformNodeOrBone) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': unable to find a "position" animation for the node "${remappedRootNodeName}". ${msg}`
                );
            }
            return null;
        }

        let targetGroundReferenceTransformNodeOrBone: Nullable<TransformNode | Bone> = null;

        if (targetRootTransformNodeOrBone instanceof TransformNode) {
            targetGroundReferenceTransformNodeOrBone = this.findBoneByTransformNode(remappedGroundReferenceNodeName)?._linkedTransformNode!;
        } else {
            targetGroundReferenceTransformNodeOrBone = this.findBoneByName(remappedGroundReferenceNodeName);
        }

        if (!targetGroundReferenceTransformNodeOrBone) {
            if (this.showWarnings) {
                Logger.Warn(
                    `RetargetAnimationGroup - Avatar '${this.name}', AnimationGroup '${animationGroup.name}': unable to find the bone/transform node corresponding with name "${remappedGroundReferenceNodeName}" in the avatar skeleton. Ensure that this bone exists. ${msg}`
                );
            }
            return null;
        }

        sourceRootTransformNode.computeWorldMatrix(true);
        sourceGroundReferenceTransformNode.computeWorldMatrix(true);

        // Determine the vertical axis
        const sourceRootGroundReferenceDiff = sourceRootTransformNode.getAbsolutePosition().subtract(sourceGroundReferenceTransformNode.getAbsolutePosition());

        let verticalAxis = 0;

        if (groundReferenceVerticalAxis) {
            switch (groundReferenceVerticalAxis) {
                case "Y":
                    verticalAxis = 1;
                    break;
                case "Z":
                    verticalAxis = 2;
                    break;
            }
        } else {
            // No axis provided: assume the vertical axis is the one with the larger difference between the reference and the ground reference transform nodes
            if (Math.abs(sourceRootGroundReferenceDiff.y) > Math.abs(sourceRootGroundReferenceDiff.x)) {
                verticalAxis = 1;
            }
            if (Math.abs(sourceRootGroundReferenceDiff.z) > Math.abs(sourceRootGroundReferenceDiff.y)) {
                verticalAxis = 2;
            }
        }

        const targetRootGroundReferenceDiff = targetRootTransformNodeOrBone.getAbsolutePosition().subtract(targetGroundReferenceTransformNodeOrBone.getAbsolutePosition());

        return {
            verticalAxis,
            sourceRootTransformNode,
            sourceGroundReferenceTransformNode,
            targetRootTransformNodeOrBone,
            targetRootPositionAnimation,
            targetGroundReferenceTransformNodeOrBone,
            proportionRatio:
                verticalAxis === 0
                    ? targetRootGroundReferenceDiff.x / sourceRootGroundReferenceDiff.x
                    : verticalAxis === 1
                      ? targetRootGroundReferenceDiff.y / sourceRootGroundReferenceDiff.y
                      : targetRootGroundReferenceDiff.z / sourceRootGroundReferenceDiff.z,
        };
    }

    private _resetStates(sourceTransformNodeNameToNode: TransformNodeNameToNode) {
        this.skeletons.forEach((skeleton) => skeleton.returnToRest());

        sourceTransformNodeNameToNode.forEach((data) => {
            const { node, initialTransformations } = data;
            node.position = initialTransformations.position;
            node.scaling = initialTransformations.scaling;
            node.rotationQuaternion = initialTransformations.quaternion;
            node.computeWorldMatrix(true);
        });
    }

    private _fixRootPosition(
        sourceAnimationGroup: AnimationGroup,
        animationGroup: AnimationGroup,
        sourceRootTransformNode: TransformNode,
        targetRootTransformNodeOrBone: TransformNode | Bone,
        targetRootPositionAnimation: Animation,
        proportionRatio: number
    ) {
        const targetNodeInverseParentWorldMatrix =
            targetRootTransformNodeOrBone instanceof TransformNode
                ? (targetRootTransformNodeOrBone.parent?.getWorldMatrix().invertToRef(TmpVectors.Matrix[0]) ?? Matrix.IdentityReadOnly)
                : (targetRootTransformNodeOrBone.parent?.getFinalMatrix().invertToRef(TmpVectors.Matrix[0]) ?? Matrix.IdentityReadOnly);

        sourceRootTransformNode.computeWorldMatrix(true);
        targetRootTransformNodeOrBone.computeWorldMatrix(true);

        const sourceWorldPosition = sourceRootTransformNode.absolutePosition.clone();
        const targetWorldPosition = targetRootTransformNodeOrBone.getAbsolutePosition().clone();

        sourceAnimationGroup.play(false);
        animationGroup.play(false);

        // Loop over the position animation of the root transform node
        for (const key of targetRootPositionAnimation.getKeys()) {
            const frame = key.frame;

            // Advance the source and retargeted animations to this frame
            sourceAnimationGroup.goToFrame(frame);
            sourceAnimationGroup.pause();

            animationGroup.goToFrame(frame);
            animationGroup.pause();

            sourceRootTransformNode.computeWorldMatrix(true);

            const offset = sourceRootTransformNode.absolutePosition.subtractToRef(sourceWorldPosition, TmpVectors.Vector3[0]);

            offset.scaleInPlace(proportionRatio);
            offset.addInPlace(targetWorldPosition);

            Vector3.TransformNormalToRef(offset, targetNodeInverseParentWorldMatrix, key.value);
        }

        sourceAnimationGroup.stop();
        animationGroup.stop();
    }

    private _fixGroundReference(
        sourceAnimationGroup: AnimationGroup,
        animationGroup: AnimationGroup,
        verticalAxis: number,
        targetRootTransformNodeOrBone: TransformNode | Bone,
        targetRootPositionAnimation: Animation,
        sourceGroundReferenceTransformNode: TransformNode,
        targetGroundReferenceTransformNodeOrBone: TransformNode | Bone,
        sourceListTransformNodes: Set<TransformNode>,
        mapNodeNames: Map<string, string>,
        fixGroundReferenceDynamicRefNode: boolean
    ) {
        const targetNodeInverseParentWorldMatrix =
            targetRootTransformNodeOrBone instanceof TransformNode
                ? (targetRootTransformNodeOrBone.parent?.getWorldMatrix().invertToRef(TmpVectors.Matrix[0]) ?? Matrix.IdentityReadOnly)
                : (targetRootTransformNodeOrBone.parent?.getFinalMatrix().invertToRef(TmpVectors.Matrix[0]) ?? Matrix.IdentityReadOnly);

        sourceAnimationGroup.play(false);
        animationGroup.play(false);

        // Loop over the position animation of the root transform node
        for (const key of targetRootPositionAnimation.getKeys()) {
            const frame = key.frame;

            // Advance the source and retargeted animations to this frame
            sourceAnimationGroup.goToFrame(frame);
            sourceAnimationGroup.pause();

            animationGroup.goToFrame(frame);
            animationGroup.pause();

            sourceGroundReferenceTransformNode.computeWorldMatrix(true);
            targetGroundReferenceTransformNodeOrBone.computeWorldMatrix(true);

            // Calculate the offset to apply to the root position in the target to have the ground reference at the same height in the source and target animations
            const diffGroundReferences = targetGroundReferenceTransformNodeOrBone
                .getAbsolutePosition()
                .subtractToRef(sourceGroundReferenceTransformNode.absolutePosition, TmpVectors.Vector3[0]);

            let groundReferenceOffset = verticalAxis === 0 ? diffGroundReferences.x : verticalAxis === 1 ? diffGroundReferences.y : diffGroundReferences.z;

            if (fixGroundReferenceDynamicRefNode) {
                // Try to find a bone in this frame that has a greater offset than the ground reference, to use it instead of the ground reference.
                const targetRootToGroundReferenceDiff = targetRootTransformNodeOrBone
                    .getAbsolutePosition()
                    .subtractToRef(targetGroundReferenceTransformNodeOrBone.getAbsolutePosition(), TmpVectors.Vector3[0]);

                const targetRootToGroundReferenceOffset =
                    verticalAxis === 0 ? targetRootToGroundReferenceDiff.x : verticalAxis === 1 ? targetRootToGroundReferenceDiff.y : targetRootToGroundReferenceDiff.z;

                const iterator = sourceListTransformNodes.keys();

                for (let key = iterator.next(); key.done !== true; key = iterator.next()) {
                    const sourceTransformNode = key.value;
                    if (sourceTransformNode === sourceGroundReferenceTransformNode) {
                        continue;
                    }

                    const targetNodeName = mapNodeNames.get(sourceTransformNode.name) ?? sourceTransformNode.name;

                    let targetBone = this.findBoneByTransformNode(targetNodeName);
                    if (!targetBone) {
                        targetBone = this.findBoneByName(targetNodeName);
                    }
                    if (!targetBone) {
                        continue;
                    }

                    sourceTransformNode.computeWorldMatrix();
                    targetBone.computeWorldMatrix();

                    const targetBoneWorldPosition = targetBone._linkedTransformNode?.getAbsolutePosition() ?? targetBone.getAbsolutePosition();
                    const targetRootToBoneDiff = targetRootTransformNodeOrBone.getAbsolutePosition().subtractToRef(targetBoneWorldPosition, TmpVectors.Vector3[0]);
                    const rootToBoneOffset = verticalAxis === 0 ? targetRootToBoneDiff.x : verticalAxis === 1 ? targetRootToBoneDiff.y : targetRootToBoneDiff.z;

                    if (Math.abs(rootToBoneOffset) > Math.abs(targetRootToGroundReferenceOffset) && Math.sign(rootToBoneOffset) === Math.sign(targetRootToGroundReferenceOffset)) {
                        const diff = targetBoneWorldPosition.subtractToRef(sourceTransformNode.getAbsolutePosition(), TmpVectors.Vector3[0]);
                        const offset = verticalAxis === 0 ? diff.x : verticalAxis === 1 ? diff.y : diff.z;

                        groundReferenceOffset = offset;
                    }
                }
            }

            const localOffset = Vector3.TransformNormalToRef(
                new Vector3(verticalAxis === 0 ? groundReferenceOffset : 0, verticalAxis === 1 ? groundReferenceOffset : 0, verticalAxis === 2 ? groundReferenceOffset : 0),
                targetNodeInverseParentWorldMatrix,
                TmpVectors.Vector3[1]
            );

            key.value.subtractInPlace(localOffset);
        }

        sourceAnimationGroup.stop();
        animationGroup.stop();
    }
}
