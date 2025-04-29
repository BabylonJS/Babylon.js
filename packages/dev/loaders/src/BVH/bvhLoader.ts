import type { IAnimationKey } from "core/Animations";
import { Animation } from "core/Animations/animation";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { Axis } from "core/Maths/math.axis";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { BVHLoadingOptions } from "./bvhLoadingOptions";

/**
 * Original code from: https://github.com/herzig/BVHImporter/
 *
 * Ivo Herzig, 2016
 * MIT License
 */
export class BVHParser {
    private static readonly _XPosition = "Xposition";
    private static readonly _YPosition = "Yposition";
    private static readonly _ZPosition = "Zposition";
    private static readonly _XRotation = "Xrotation";
    private static readonly _YRotation = "Yrotation";
    private static readonly _ZRotation = "Zrotation";

    private static readonly _HierarchyNode = "HIERARCHY";
    private static readonly _MotionNode = "MOTION";

    /**
     * Reads a BVH file, returns a skeleton
     * @param text - The BVH file content
     * @param scene - The scene to add the skeleton to
     * @param loadingOptions - The loading options
     * @returns The skeleton
     */
    public static ReadBvh(text: string, scene: Scene, loadingOptions: BVHLoadingOptions): Skeleton {
        const lines = text.split("\n");

        const { animationName, loopMode, skeletonName, skeletonId } = loadingOptions;

        const skeleton = new Skeleton(skeletonName, skeletonId, scene);

        const context = new LoaderContext(skeleton);
        context.animationName = animationName;
        context.loopMode = loopMode;

        // read model structure
        const firstLine = lines.shift();
        if (!firstLine || firstLine.trim().toUpperCase() !== this._HierarchyNode) {
            throw new Error("HIERARCHY expected");
        }

        const nodeLine = lines.shift();
        if (!nodeLine) {
            throw new Error("Unexpected end of file after HIERARCHY");
        }
        const root = BVHParser._ReadNode(lines, nodeLine.trim(), null, context);

        // read motion data
        const motionLine = lines.shift();
        if (!motionLine || motionLine.trim().toUpperCase() !== this._MotionNode) {
            throw new Error("MOTION expected");
        }

        const framesLine = lines.shift();
        if (!framesLine) {
            throw new Error("Unexpected end of file before frame count");
        }
        const framesTokens = framesLine.trim().split(/[\s]+/);
        if (framesTokens.length < 2) {
            throw new Error("Invalid frame count line");
        }

        // number of frames
        const numFrames = parseInt(framesTokens[1]);
        if (isNaN(numFrames)) {
            throw new Error("Failed to read number of frames.");
        }
        context.numFrames = numFrames;

        // frame time
        const frameTimeLine = lines.shift();
        if (!frameTimeLine) {
            throw new Error("Unexpected end of file before frame time");
        }
        const frameTimeTokens = frameTimeLine.trim().split(/[\s]+/);
        if (frameTimeTokens.length < 3) {
            throw new Error("Invalid frame time line");
        }
        const frameTime = parseFloat(frameTimeTokens[2]);
        if (isNaN(frameTime)) {
            throw new Error("Failed to read frame time.");
        }

        context.frameRate = frameTime;

        // read frame data line by line
        for (let i = 0; i < numFrames; ++i) {
            const frameLine = lines.shift();
            if (!frameLine) {
                continue;
            }
            const tokens = frameLine.trim().split(/[\s]+/);
            BVHParser._ReadFrameData(tokens, i * frameTime, root);
        }

        context.root = root;

        this._ConvertNode(context.root, null, context);

        context.skeleton.returnToRest();
        return context.skeleton;
    }

    /**
     * Converts a BVH node to a Babylon bone
     * @param node - The BVH node to convert
     * @param parent - The parent bone
     * @param context - The loader context
     */
    private static _ConvertNode(node: BVHNode, parent: Nullable<Bone>, context: LoaderContext) {
        const matrix = this._BoneOffset(node);
        const bone = new Bone(node.name, context.skeleton, parent, matrix);

        // Create animation for this bone
        const animation = this._CreateAnimations(node, context);
        if (animation) {
            // Apply rotation correction to the root bone's animation keys
            if (!parent) {
                // Check if it's the root node
                const correctionMatrix = Matrix.RotationAxis(Axis.X, Math.PI / 2); // -90 degrees on X-axis
                const correctedKeys = animation.getKeys().map((key: IAnimationKey) => {
                    const originalMatrix = key.value as Matrix;
                    // Apply correction: We want to rotate the final orientation, so post-multiply
                    const correctedMatrix = originalMatrix.multiply(correctionMatrix);
                    return { frame: key.frame, value: correctedMatrix };
                });
                animation.setKeys(correctedKeys);
            }
            bone.animations.push(animation);
        }

        for (const child of node.children) {
            this._ConvertNode(child, bone, context);
        }
    }

    /**
     * Converts the BVH node's offset to a Babylon matrix
     * @param node - The BVH node to convert
     * @returns The converted matrix
     */
    private static _BoneOffset(node: BVHNode): Matrix {
        // Convert BVH Y-up, right-handed offset to Babylon's Y-up, left-handed system.
        const x = node.offset.x;
        const y = node.offset.y;
        // Flip Z axis to convert handedness.
        const z = -node.offset.z;
        return Matrix.Translation(x, y, z);
    }

    /**
     * Creates animations for the BVH node
     * @param node - The BVH node to create animations for
     * @param context - The loader context
     * @returns The created animations
     */
    private static _CreateAnimations(node: BVHNode, context: LoaderContext): Animation | null {
        if (node.frames.length === 0) {
            return null;
        }

        const keyFrames: IAnimationKey[] = [];

        // Create position animation if there are position channels
        const hasPosition = node.channels.some((c) => c === BVHParser._XPosition || c === BVHParser._YPosition || c === BVHParser._ZPosition);

        // Create rotation animation if there are rotation channels
        const hasRotation = node.channels.some((c) => c === BVHParser._XRotation || c === BVHParser._YRotation || c === BVHParser._ZRotation);

        for (let i = 0; i < node.frames.length; i++) {
            const frame = node.frames[i];
            const time = i * context.frameRate * 1000; // Convert to milliseconds

            if (hasPosition || hasRotation) {
                let matrix = Matrix.Identity();

                if (hasRotation) {
                    const rotationMatrix = new Matrix();
                    frame.rotation.toRotationMatrix(rotationMatrix);
                    matrix = rotationMatrix;
                }

                if (hasPosition) {
                    const position = frame.position;
                    matrix.setTranslation(new Vector3(position.x, position.y, position.z));
                }

                keyFrames.push({
                    frame: time,
                    value: matrix,
                });
            }
        }

        if (keyFrames.length === 0) {
            return null;
        }

        const fps = 60 / context.frameRate;
        const animation = new Animation(node.name + "_anim", "_matrix", fps, Animation.ANIMATIONTYPE_MATRIX, context.loopMode);
        animation.setKeys(keyFrames);

        return animation;
    }

    /*
         Recursively parses the HIERARCHY section of the BVH file
            
         - lines: all lines of the file. lines are consumed as we go along.
         - firstLine: line containing the node type and name e.g. "JOINT hip"
         - parent: the parent node for hierarchy
         - context: the loader context containing the list of nodes and other data
        
         returns: a BVH node including children
        */
    private static _ReadNode(lines: string[], firstLine: string, parent: Nullable<BVHNode>, context: LoaderContext): BVHNode {
        const node = new BVHNode();
        node.parent = parent;
        context.list.push(node);

        // parse node type and name.
        let tokens = firstLine.trim().split(/\s+/);

        if (tokens[0].toUpperCase() === "END" && tokens[1].toUpperCase() === "SITE") {
            node.type = "ENDSITE";
            node.name = "ENDSITE"; // bvh end sites have no name
        } else {
            node.name = tokens[1];
            node.type = tokens[0].toUpperCase();
        }

        // opening bracket
        if (lines.shift()?.trim() != "{") throw new Error("Expected opening { after type & name");

        // parse OFFSET
        // @ts-ignore
        tokens = lines.shift()?.trim().split(/\s+/);

        if (tokens[0].toUpperCase() != "OFFSET") throw new Error("Expected OFFSET, but got: " + tokens[0]);
        if (tokens.length != 4) throw new Error("OFFSET: Invalid number of values");

        const offset = new Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));

        if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) throw new Error("OFFSET: Invalid values");

        node.offset = offset;

        // parse CHANNELS definitions
        if (node.type != "ENDSITE") {
            // @ts-ignore
            tokens = lines.shift()?.trim().split(/\s+/);

            if (tokens[0].toUpperCase() != "CHANNELS") throw new Error("Expected CHANNELS definition");

            const numChannels = parseInt(tokens[1]);
            // Skip CHANNELS and the number of channels
            node.channels = tokens.splice(2, numChannels);
            node.children = [];
        }

        // read children
        while (lines.length > 0) {
            const line = lines.shift()?.trim();

            if (line === "}") {
                // Finish reading the node
                return node;
            } else if (line) {
                node.children.push(BVHParser._ReadNode(lines, line, node, context));
            }
        }

        throw new Error("Unexpected end of file: missing closing brace");
    }

    /*
         Recursively reads data from a single frame into the bone hierarchy.
         The bone hierarchy has to be structured in the same order as the BVH file.
         keyframe data is stored in bone.frames.
    
         - data: splitted string array (frame values), values are shift()ed so
         this should be empty after parsing the whole hierarchy.
         - frameTime: playback time for this keyframe.
         - bone: the bone to read frame data from.

         Note: Position data (specifically Z) is flipped to convert coordinate systems.
    */
    private static _ReadFrameData(data: string[], frameTime: number, bone: BVHNode) {
        if (bone.type === "ENDSITE")
            // end sites have no motion data
            return;

        // add keyframe
        const keyframe = new BVHKeyFrame();
        keyframe.time = frameTime;
        keyframe.position = new Vector3();
        keyframe.rotation = new Quaternion();

        bone.frames.push(keyframe);

        let pitch = 0,
            yaw = 0,
            roll = 0;

        // parse values for each channel in node
        for (let i = 0; i < bone.channels.length; ++i) {
            const value = data.shift();
            if (!value) {
                continue;
            }

            switch (bone.channels[i]) {
                case this._XPosition:
                    keyframe.position.x = parseFloat(value.trim());
                    break;
                case this._YPosition:
                    keyframe.position.y = parseFloat(value.trim());
                    break;
                case this._ZPosition:
                    keyframe.position.z = -parseFloat(value.trim()); // Flip Z position
                    break;
                case this._XRotation:
                    pitch = (parseFloat(value.trim()) * Math.PI) / 180;
                    break;
                case this._YRotation:
                    yaw = (parseFloat(value.trim()) * Math.PI) / 180;
                    break;
                case this._ZRotation:
                    roll = (parseFloat(value.trim()) * Math.PI) / 180;
                    break;
                default:
                    throw new Error("invalid channel type");
            }
        }

        if (yaw != 0 || pitch != 0 || roll != 0) {
            // Create rotation matrix in proper order
            const rotationMatrix = Matrix.Identity();
            Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotationMatrix);
            keyframe.rotation.fromRotationMatrix(rotationMatrix);
        }

        // parse child nodes
        for (let i = 0; i < bone.children.length; ++i) {
            BVHParser._ReadFrameData(data, frameTime, bone.children[i]);
        }
    }
}

class LoaderContext {
    animationName: string = "";
    loopMode: number = Animation.ANIMATIONLOOPMODE_CYCLE;
    list: BVHNode[] = [];
    root: BVHNode = new BVHNode();
    numFrames: number = 0;
    frameRate: number = 0;
    skeleton: Skeleton;

    constructor(skeleton: Skeleton) {
        this.skeleton = skeleton;
    }
}

class BVHNode {
    public name: string = "";
    public type: string = "";
    public offset: Vector3 = new Vector3();
    public channels: string[] = [];
    public children: BVHNode[] = [];
    public frames: BVHKeyFrame[] = [];
    public parent: Nullable<BVHNode> = null;
}

class BVHKeyFrame {
    public time: number = 0;
    public position: Vector3 = new Vector3();
    public rotation: Quaternion = new Quaternion();
}
