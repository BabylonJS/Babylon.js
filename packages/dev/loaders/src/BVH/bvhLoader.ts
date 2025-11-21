import type { IAnimationKey } from "core/Animations";
import { Animation } from "core/Animations/animation";
import { Bone } from "core/Bones/bone";
import { Skeleton } from "core/Bones/skeleton";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import type { Scene } from "core/scene";
import type { Nullable } from "core/types";
import type { BVHLoadingOptions } from "./bvhLoadingOptions";
import { Tools } from "core/Misc/tools";
import type { AssetContainer } from "core/assetContainer";

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
    list: IBVHNode[] = [];
    root: IBVHNode = CreateBVHNode();
    numFrames: number = 0;
    frameRate: number = 0;
    skeleton: Skeleton;

    constructor(skeleton: Skeleton) {
        this.skeleton = skeleton;
    }
}

interface IBVHNode {
    name: string;
    type: string;
    offset: Vector3;
    channels: string[];
    children: IBVHNode[];
    frames: IBVHKeyFrame[];
    parent: Nullable<IBVHNode>;
}

interface IBVHKeyFrame {
    frame: number;
    position: Vector3;
    rotation: Quaternion;
}

function CreateBVHNode(): IBVHNode {
    return {
        name: "",
        type: "",
        offset: new Vector3(),
        channels: [],
        children: [],
        frames: [],
        parent: null,
    };
}

function CreateBVHKeyFrame(): IBVHKeyFrame {
    return {
        frame: 0,
        position: new Vector3(),
        rotation: new Quaternion(),
    };
}

/**
 * Converts the BVH node's offset to a Babylon matrix
 * @param node - The BVH node to convert
 * @returns The converted matrix
 */
function BoneOffset(node: IBVHNode): Matrix {
    const x = node.offset.x;
    const y = node.offset.y;
    const z = node.offset.z;
    return Matrix.Translation(x, y, z);
}

/**
 * Creates animations for the BVH node
 * @param node - The BVH node to create animations for
 * @param context - The loader context
 * @returns The created animations
 */
function CreateAnimations(node: IBVHNode, context: LoaderContext): Animation[] {
    if (node.frames.length === 0) {
        return [];
    }

    const animations: Animation[] = [];

    // Create position animation if there are position channels
    const hasPosition = node.channels.some((c) => c === _XPosition || c === _YPosition || c === _ZPosition);

    // Create rotation animation if there are rotation channels
    const hasRotation = node.channels.some((c) => c === _XRotation || c === _YRotation || c === _ZRotation);

    const posAnim = new Animation(`${node.name}_pos`, "position", context.frameRate, Animation.ANIMATIONTYPE_VECTOR3, context.loopMode);

    const rotAnim = new Animation(`${node.name}_rot`, "rotationQuaternion", context.frameRate, Animation.ANIMATIONTYPE_QUATERNION, context.loopMode);

    const posKeys: IAnimationKey[] = [];
    const rotKeys: IAnimationKey[] = [];

    for (let i = 0; i < node.frames.length; i++) {
        const frame = node.frames[i];

        if (hasPosition && frame.position) {
            posKeys.push({
                frame: frame.frame,
                value: frame.position.clone(),
            });
        }

        if (hasRotation) {
            rotKeys.push({
                frame: frame.frame,
                value: frame.rotation.clone(),
            });
        }
    }

    if (posKeys.length > 0) {
        posAnim.setKeys(posKeys);
        animations.push(posAnim);
    }

    if (rotKeys.length > 0) {
        rotAnim.setKeys(rotKeys);
        animations.push(rotAnim);
    }

    return animations;
}

/**
 * Converts a BVH node to a Babylon bone
 * @param node - The BVH node to convert
 * @param parent - The parent bone
 * @param context - The loader context
 */
function ConvertNode(node: IBVHNode, parent: Nullable<Bone>, context: LoaderContext) {
    const matrix = BoneOffset(node);
    const bone = new Bone(node.name, context.skeleton, parent, matrix);

    // Create animation for this bone
    const animations = CreateAnimations(node, context);
    for (const animation of animations) {
        if (animation.getKeys() && animation.getKeys().length > 0) {
            bone.animations.push(animation);
        }
    }

    for (const child of node.children) {
        ConvertNode(child, bone, context);
    }
}

/**
 * Recursively reads data from a single frame into the bone hierarchy.
 * The bone hierarchy has to be structured in the same order as the BVH file.
 * keyframe data is stored in bone.frames.
 * @param data - splitted string array (frame values), values are shift()ed
 * @param frameNumber - playback time for this keyframe
 * @param bone - the bone to read frame data from
 * @param tokenIndex - the index of the token to read
 */
function ReadFrameData(data: string[], frameNumber: number, bone: IBVHNode, tokenIndex: { i: number }) {
    if (bone.type === "ENDSITE") {
        // end sites have no motion data
        return;
    }

    // add keyframe
    const keyframe = CreateBVHKeyFrame();
    keyframe.frame = frameNumber;
    keyframe.position = new Vector3();
    keyframe.rotation = new Quaternion();

    bone.frames.push(keyframe);

    let combinedRotation = Matrix.Identity();

    // parse values for each channel in node
    for (let i = 0; i < bone.channels.length; ++i) {
        const channel = bone.channels[i];
        const value = data[tokenIndex.i++];
        if (!value) {
            continue;
        }
        const parsedValue = parseFloat(value.trim());
        if (channel.endsWith("position")) {
            switch (channel) {
                case _XPosition:
                    keyframe.position.x = parsedValue;
                    break;
                case _YPosition:
                    keyframe.position.y = parsedValue;
                    break;
                case _ZPosition:
                    keyframe.position.z = parsedValue;
                    break;
            }
        } else if (channel.endsWith("rotation")) {
            const angle = Tools.ToRadians(parsedValue);
            let rotationMatrix: Matrix;
            switch (channel) {
                case _XRotation:
                    rotationMatrix = Matrix.RotationX(angle);
                    break;
                case _YRotation:
                    rotationMatrix = Matrix.RotationY(angle);
                    break;
                case _ZRotation:
                    rotationMatrix = Matrix.RotationZ(angle);
                    break;
            }
            combinedRotation = rotationMatrix!.multiply(combinedRotation);
        }
    }

    Quaternion.FromRotationMatrixToRef(combinedRotation, keyframe.rotation);

    // parse child nodes
    for (const child of bone.children) {
        ReadFrameData(data, frameNumber, child, tokenIndex);
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
function ReadNode(lines: string[], firstLine: string, parent: Nullable<IBVHNode>, context: LoaderContext): IBVHNode {
    const node = CreateBVHNode();
    node.parent = parent;
    context.list.push(node);

    // parse node type and name.
    let tokens: string[] | undefined = firstLine.trim().split(/\s+/);

    if (tokens[0].toUpperCase() === "END" && tokens[1].toUpperCase() === "SITE") {
        node.type = "ENDSITE";
        node.name = "ENDSITE"; // bvh end sites have no name
    } else {
        node.name = tokens[1];
        node.type = tokens[0].toUpperCase();
    }

    // opening bracket
    if (lines.shift()?.trim() != "{") {
        throw new Error("Expected opening { after type & name");
    }

    // parse OFFSET
    const tokensSplit = lines.shift()?.trim().split(/\s+/);
    if (!tokensSplit) {
        throw new Error("Unexpected end of file: missing OFFSET");
    }
    tokens = tokensSplit;

    if (tokens[0].toUpperCase() != "OFFSET") {
        throw new Error("Expected OFFSET, but got: " + tokens[0]);
    }
    if (tokens.length != 4) {
        throw new Error("OFFSET: Invalid number of values");
    }

    const offset = new Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));

    if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) {
        throw new Error("OFFSET: Invalid values");
    }

    node.offset = offset;

    // parse CHANNELS definitions
    if (node.type != "ENDSITE") {
        tokens = lines.shift()?.trim().split(/\s+/);
        if (!tokens) {
            throw new Error("Unexpected end of file: missing CHANNELS");
        }

        if (tokens[0].toUpperCase() != "CHANNELS") {
            throw new Error("Expected CHANNELS definition");
        }

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
            node.children.push(ReadNode(lines, line, node, context));
        }
    }

    throw new Error("Unexpected end of file: missing closing brace");
}

/**
 * Reads a BVH file, returns a skeleton
 * @param text - The BVH file content
 * @param scene - The scene to add the skeleton to
 * @param assetContainer - The asset container to add the skeleton to
 * @param loadingOptions - The loading options
 * @returns The skeleton
 */
export function ReadBvh(text: string, scene: Scene, assetContainer: Nullable<AssetContainer>, loadingOptions: BVHLoadingOptions): Skeleton {
    const lines = text.split("\n");

    const { loopMode } = loadingOptions;

    scene._blockEntityCollection = !!assetContainer;
    const skeleton = new Skeleton("", "", scene);
    skeleton._parentContainer = assetContainer;
    scene._blockEntityCollection = false;

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
    const root = ReadNode(lines, nodeLine.trim(), null, context);

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
    if (frameTime <= 0) {
        throw new Error("Failed to read frame time. Invalid value " + frameTime);
    }

    context.frameRate = 1 / frameTime;

    // read frame data line by line
    for (let i = 0; i < numFrames; ++i) {
        const frameLine = lines.shift();
        if (!frameLine) {
            continue;
        }
        const tokens = frameLine.trim().split(/[\s]+/) || [];
        ReadFrameData(tokens, i, root, { i: 0 });
    }

    context.root = root;

    ConvertNode(context.root, null, context);

    context.skeleton.returnToRest();
    return context.skeleton;
}
