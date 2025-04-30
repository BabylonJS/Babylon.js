import type { IAnimationKey } from "core/Animations";
import { Animation } from "core/Animations/animation";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { Axis } from "core/Maths/math.axis";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { BVHLoadingOptions } from "./bvhLoadingOptions";
import { Tools } from "core/Misc/tools";

const _XPosition = "Xposition";
const _YPosition = "Yposition";
const _ZPosition = "Zposition";
const _XRotation = "Xrotation";
const _YRotation = "Yrotation";
const _ZRotation = "Zrotation";

const _HierarchyNode = "HIERARCHY";
const _MotionNode = "MOTION";

class LoaderContext {
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

/**
 * Converts the BVH node's offset to a Babylon matrix
 * @param node - The BVH node to convert
 * @returns The converted matrix
 */
function _boneOffset(node: BVHNode): Matrix {
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
function _createAnimations(node: BVHNode, context: LoaderContext): Animation | null {
    if (node.frames.length === 0) {
        return null;
    }

    const keyFrames: IAnimationKey[] = [];

    // Create position animation if there are position channels
    const hasPosition = node.channels.some((c) => c === _XPosition || c === _YPosition || c === _ZPosition);

    // Create rotation animation if there are rotation channels
    const hasRotation = node.channels.some((c) => c === _XRotation || c === _YRotation || c === _ZRotation);

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

/**
 * Converts a BVH node to a Babylon bone
 * @param node - The BVH node to convert
 * @param parent - The parent bone
 * @param context - The loader context
 */
function _convertNode(node: BVHNode, parent: Nullable<Bone>, context: LoaderContext) {
    const matrix = _boneOffset(node);
    const bone = new Bone(node.name, context.skeleton, parent, matrix);

    // Create animation for this bone
    const animation = _createAnimations(node, context);
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
        _convertNode(child, bone, context);
    }
}

/**
 * Recursively reads data from a single frame into the bone hierarchy.
 * The bone hierarchy has to be structured in the same order as the BVH file.
 * keyframe data is stored in bone.frames.
 * @param data - splitted string array (frame values), values are shift()ed
 * @param frameTime - playback time for this keyframe
 * @param bone - the bone to read frame data from
 */
function _readFrameData(data: string[], frameTime: number, bone: BVHNode) {
    if (bone.type === "ENDSITE") {
        // end sites have no motion data
        return;
    }

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
            case _XPosition:
                keyframe.position.x = parseFloat(value.trim());
                break;
            case _YPosition:
                keyframe.position.y = parseFloat(value.trim());
                break;
            case _ZPosition:
                keyframe.position.z = -parseFloat(value.trim()); // Flip Z axis to convert handedness.
                break;
            case _XRotation:
                pitch = Tools.ToRadians(+value);
                break;
            case _YRotation:
                yaw = Tools.ToRadians(+value);
                break;
            case _ZRotation:
                roll = Tools.ToRadians(+value);
                break;
            default:
                throw new Error("invalid channel type");
        }
    }

    if (yaw !== 0 || pitch !== 0 || roll !== 0) {
        // Create rotation matrix in proper order
        const rotationMatrix = Matrix.Identity();
        Matrix.RotationYawPitchRollToRef(yaw, pitch, roll, rotationMatrix);
        keyframe.rotation.fromRotationMatrix(rotationMatrix);
    }

    // parse child nodes
    for (let i = 0; i < bone.children.length; ++i) {
        _readFrameData(data, frameTime, bone.children[i]);
    }
}

/**
 * Recursively parses the HIERARCHY section of the BVH file
 * @param lines - all lines of the file. lines are consumed as we go along
 * @param firstLine - line containing the node type and name e.g. "JOINT hip"
 * @param parent - the parent node for hierarchy
 * @param context - the loader context containing the list of nodes and other data
 * @returns a BVH node including children
 */
function _readNode(lines: string[], firstLine: string, parent: Nullable<BVHNode>, context: LoaderContext): BVHNode {
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
            node.children.push(_readNode(lines, line, node, context));
        }
    }

    throw new Error("Unexpected end of file: missing closing brace");
}

/**
 * Reads a BVH file, returns a skeleton
 * @param text - The BVH file content
 * @param scene - The scene to add the skeleton to
 * @param loadingOptions - The loading options
 * @returns The skeleton
 */
export function readBvh(text: string, scene: Scene, loadingOptions: BVHLoadingOptions): Skeleton {
    const lines = text.split("\n");

    const { loopMode } = loadingOptions;

    const skeleton = new Skeleton("", "", scene);

    const context = new LoaderContext(skeleton);
    context.loopMode = loopMode;

    // read model structure
    const firstLine = lines.shift();
    if (!firstLine || firstLine.trim().toUpperCase() !== _HierarchyNode) {
        throw new Error("HIERARCHY expected");
    }

    const nodeLine = lines.shift();
    if (!nodeLine) {
        throw new Error("Unexpected end of file after HIERARCHY");
    }
    const root = _readNode(lines, nodeLine.trim(), null, context);

    // read motion data
    const motionLine = lines.shift();
    if (!motionLine || motionLine.trim().toUpperCase() !== _MotionNode) {
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
        _readFrameData(tokens, i * frameTime, root);
    }

    context.root = root;

    _convertNode(context.root, null, context);

    context.skeleton.returnToRest();
    return context.skeleton;
}
