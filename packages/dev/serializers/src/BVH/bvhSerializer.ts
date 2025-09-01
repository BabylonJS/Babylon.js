import type { Skeleton } from "core/Bones/skeleton";
import type { Bone } from "core/Bones/bone";
import type { IAnimationKey } from "core/Animations";
import { Vector3, Quaternion, Matrix } from "core/Maths/math.vector";
import { Tools } from "core/Misc/tools";

interface IBVHBoneData {
    bone: Bone;
    children: IBVHBoneData[];
    hasPositionChannels: boolean;
    hasRotationChannels: boolean;
    positionKeys: IAnimationKey[];
    rotationKeys: IAnimationKey[];
}

export class BVHExporter {
    public static Export(skeleton: Skeleton, animationNames: string[] = [], frameRate: number = 0.03333): string {
        // If no animation names provided, use all available animations
        let animationsToExport = animationNames;
        if (!animationNames || animationNames.length === 0) {
            animationsToExport = skeleton.animations.map((anim) => anim.name);
        }

        // Get animation range from the first animation (or create a default one)
        let animationRange = null;
        if (animationsToExport.length > 0) {
            animationRange = skeleton.getAnimationRange(animationsToExport[0]);
        }

        if (!animationRange) {
            // If no animation range found, create a default one or throw error
            if (skeleton.animations.length > 0) {
                // Use the first available animation
                animationRange = skeleton.getAnimationRange(skeleton.animations[0].name);
            }

            if (!animationRange) {
                throw new Error("No animation range found in skeleton");
            }
        }

        // Build bone hierarchy and collect animation data
        const boneHierarchy = this._BuildBoneHierarchy(skeleton, animationsToExport);
        const frameCount = animationRange.to - animationRange.from + 1;

        let exportString = "";
        exportString += `HIERARCHY\n`;

        // Export hierarchy recursively
        exportString += this._ExportHierarchy(boneHierarchy, 0);

        // Export motion data
        exportString += `MOTION\n`;
        exportString += `Frames: ${frameCount}\n`;
        exportString += `Frame Time: ${frameRate}\n`;
        exportString += `\n`;

        // Export frame data
        exportString += this._ExportMotionData(boneHierarchy, frameCount, animationRange.from, animationsToExport);

        return exportString;
    }

    private static _BuildBoneHierarchy(skeleton: Skeleton, animationNames: string[]): IBVHBoneData[] {
        const boneMap = new Map<Bone, IBVHBoneData>();
        const rootBones: IBVHBoneData[] = [];

        // First pass: create bone data objects
        for (const bone of skeleton.bones) {
            const boneData: IBVHBoneData = {
                bone,
                children: [],
                hasPositionChannels: false,
                hasRotationChannels: false,
                positionKeys: [],
                rotationKeys: [],
            };
            boneMap.set(bone, boneData);
        }

        // Second pass: build hierarchy and collect animation data
        for (const bone of skeleton.bones) {
            const boneData = boneMap.get(bone)!;

            // Check if bone has animations from the specified animation names
            if (bone.animations.length > 0) {
                for (const animation of bone.animations) {
                    // Only include animations that are in the specified animation names
                    if (animationNames.includes(animation.name)) {
                        if (animation.targetProperty === "position") {
                            boneData.hasPositionChannels = true;
                            boneData.positionKeys = animation.getKeys();
                        } else if (animation.targetProperty === "rotationQuaternion") {
                            boneData.hasRotationChannels = true;
                            boneData.rotationKeys = animation.getKeys();
                        }
                    }
                }
            }

            // Build hierarchy
            if (bone.getParent()) {
                const parentData = boneMap.get(bone.getParent()!);
                if (parentData) {
                    parentData.children.push(boneData);
                }
            } else {
                rootBones.push(boneData);
            }
        }

        return rootBones;
    }

    private static _ExportHierarchy(boneData: IBVHBoneData[], indentLevel: number): string {
        let result = "";
        // 4 spaces identation for each level
        const indent = "    ".repeat(indentLevel);

        for (const data of boneData) {
            const bone = data.bone;

            // Determine if this is an end site (bone with no children and no animations)
            if (data.children.length === 0 && !data.hasPositionChannels && !data.hasRotationChannels) {
                result += `${indent}End Site\n`;
                result += `${indent}{\n`;
                const offset = this._GetBoneOffset(bone);
                result += `${indent}    OFFSET ${offset.x.toFixed(6)} ${offset.y.toFixed(6)} ${offset.z.toFixed(6)}\n`;
                result += `${indent}}\n`;
            } else {
                result += `${indent}JOINT ${bone.name}\n`;
                result += `${indent}{\n`;
                const offset = this._GetBoneOffset(bone);
                result += `${indent}    OFFSET ${offset.x.toFixed(6)} ${offset.y.toFixed(6)} ${offset.z.toFixed(6)}\n`;

                // Determine channels
                const channels: string[] = [];
                if (data.hasPositionChannels) {
                    channels.push("Xposition", "Yposition", "Zposition");
                }
                if (data.hasRotationChannels) {
                    // BVH uses ZYX rotation order
                    channels.push("Zrotation", "Xrotation", "Yrotation");
                }

                if (channels.length > 0) {
                    result += `${indent}    CHANNELS ${channels.length} ${channels.join(" ")}\n`;
                }

                result += `${indent}}\n`;
            }

            // Export children recursively
            if (data.children.length > 0) {
                result += this._ExportHierarchy(data.children, indentLevel + 1);
            }
        }

        return result;
    }

    private static _GetBoneOffset(bone: Bone): Vector3 {
        // Get the local offset of the bone from its parent
        const parent = bone.getParent();
        if (!parent) {
            return Vector3.Zero(); // Root bone
        }

        // For BVH, we need to get the bone's offset from its parent
        // This should match the original BVH file's OFFSET values
        const boneMatrix = bone.getBindMatrix();
        const parentMatrix = parent.getBindMatrix();

        // Calculate the relative position
        const bonePosition = boneMatrix.getTranslation();
        const parentPosition = parentMatrix.getTranslation();
        const relativeOffset = bonePosition.subtract(parentPosition);

        // Return the full 3D offset
        return relativeOffset;
    }

    private static _ExportMotionData(boneData: IBVHBoneData[], frameCount: number, startFrame: number, animationNames: string[]): string {
        let result = "";

        for (let frame = 0; frame < frameCount; frame++) {
            const frameValues: number[] = [];

            // Collect values for all bones in hierarchy order
            this._CollectFrameValues(boneData, frame + startFrame, frameValues, animationNames);

            result += frameValues.map((v) => v.toFixed(6)).join(" ") + "\n";
        }

        return result;
    }

    private static _CollectFrameValues(boneData: IBVHBoneData[], frame: number, values: number[], animationNames: string[]): void {
        for (const data of boneData) {
            // Skip end sites
            if (data.children.length === 0 && !data.hasPositionChannels && !data.hasRotationChannels) {
                continue;
            }

            // Add position values if available
            if (data.hasPositionChannels) {
                const position = this.getPositionAtFrame(data.positionKeys, frame);
                values.push(position.x, position.y, position.z);
            }

            // Add rotation values if available
            if (data.hasRotationChannels) {
                const rotation = this.getRotationAtFrame(data.rotationKeys, frame);
                // Convert to Euler angles in ZYX order
                const euler = this.quaternionToEulerZYX(rotation);
                values.push(euler.z, euler.x, euler.y);
            }

            // Process children recursively
            if (data.children.length > 0) {
                this._CollectFrameValues(data.children, frame, values, animationNames);
            }
        }
    }

    private static getPositionAtFrame(keys: IAnimationKey[], frame: number): Vector3 {
        if (keys.length === 0) {
            return Vector3.Zero();
        }

        // Find the appropriate key or interpolate
        let key1 = keys[0];
        let key2 = keys[keys.length - 1];

        for (let i = 0; i < keys.length - 1; i++) {
            if (keys[i].frame <= frame && keys[i + 1].frame >= frame) {
                key1 = keys[i];
                key2 = keys[i + 1];
                break;
            }
        }

        if (key1.frame === key2.frame) {
            return key1.value.clone();
        }

        const t = (frame - key1.frame) / (key2.frame - key1.frame);
        return Vector3.Lerp(key1.value, key2.value, t);
    }

    private static getRotationAtFrame(keys: IAnimationKey[], frame: number): Quaternion {
        if (keys.length === 0) {
            return Quaternion.Identity();
        }

        // Find the appropriate key or interpolate
        let key1 = keys[0];
        let key2 = keys[keys.length - 1];

        for (let i = 0; i < keys.length - 1; i++) {
            if (keys[i].frame <= frame && keys[i + 1].frame >= frame) {
                key1 = keys[i];
                key2 = keys[i + 1];
                break;
            }
        }

        if (key1.frame === key2.frame) {
            return key1.value.clone();
        }

        const t = (frame - key1.frame) / (key2.frame - key1.frame);
        return Quaternion.Slerp(key1.value, key2.value, t);
    }

    private static quaternionToEulerZYX(quaternion: Quaternion): Vector3 {
        // Convert quaternion to Euler angles in ZYX order
        const matrix = quaternion.toRotationMatrix(new Matrix());

        let x, y, z;

        if (Math.abs(matrix.m[6]) < 0.999999) {
            x = Math.atan2(-matrix.m[7], matrix.m[8]);
            y = Math.asin(matrix.m[6]);
            z = Math.atan2(-matrix.m[3], matrix.m[0]);
        } else {
            x = Math.atan2(matrix.m[5], matrix.m[4]);
            y = Math.asin(matrix.m[6]);
            z = 0;
        }

        return new Vector3(Tools.ToDegrees(x), Tools.ToDegrees(y), Tools.ToDegrees(z));
    }
}
