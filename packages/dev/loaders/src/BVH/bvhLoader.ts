import type { IAnimationKey } from "core/Animations";
import { Animation } from "core/Animations/animation";
import { Bone, Skeleton } from "core/Bones";
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
export class BVHLoader {
    static readonly X_POSITION = "Xposition";
    static readonly Y_POSITION = "Yposition";
    static readonly Z_POSITION = "Zposition";
    static readonly X_ROTATION = "Xrotation";
    static readonly Y_ROTATION = "Yrotation";
    static readonly Z_ROTATION = "Zrotation";

    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly HIERARCHY_NODE = "HIERARCHY";
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static readonly MOTION_NODE = "MOTION";

    /**
     * Reads a BVH file, returns a skeleton
     * @param text - The BVH file content
     * @param scene - The scene to add the skeleton to
     * @param loadingOptions - The loading options
     * @returns The skeleton
     */
    public static ReadBvh(text: string, scene: Scene, loadingOptions?: BVHLoadingOptions): Skeleton {
        const lines = text.split("\n");

        const context = new LoaderContext();
        context.animationName = loadingOptions?.animationName ?? "Animation";
        context.loopBehavior = loadingOptions?.loopBehavior ?? 1;
        context.realSkeleton = new Skeleton(loadingOptions?.skeletonName ?? "skeleton", loadingOptions?.skeletonId ?? "skeleton_id", scene);

        // read model structure
        if (lines.shift()?.trim().toUpperCase() != this.HIERARCHY_NODE) throw new Error("HIERARCHY expected");

        // @ts-ignore
        const root = BVHLoader.readNode(lines, lines.shift()?.trim(), null, context);

        // read motion data
        if (lines.shift()?.trim().toUpperCase() != this.MOTION_NODE) throw new Error("MOTION expected");

        // @ts-ignore
        let tokens = lines.shift()?.trim().split(/[\s]+/);

        // number of frames
        // @ts-ignore
        const numFrames = parseInt(tokens[1]);
        if (isNaN(numFrames)) throw new Error("Failed to read number of frames.");
        context.numFrames = numFrames;

        // frame time
        // @ts-ignore
        tokens = lines.shift()?.trim().split(/[\s]+/);
        // @ts-ignore
        const frameTime = parseFloat(tokens[2]);
        if (isNaN(frameTime)) throw new Error("Failed to read frame time.");

        context.frameRate = frameTime;

        // read frame data line by line
        for (let i = 0; i < numFrames; ++i) {
            // @ts-ignore
            tokens = lines.shift()?.trim().split(/[\s]+/);
            if (!tokens) {
                continue;
            }

            // @ts-ignore
            BVHLoader.readFrameData(tokens, i * frameTime, root);
        }

        context.root = root;

        this._convertNode(context.root, null, context);

        context.realSkeleton.returnToRest();
        return context.realSkeleton;
    }

    /**
     * Converts a BVH node to a Babylon bone
     * @param node - The BVH node to convert
     * @param parent - The parent bone
     * @param context - The loader context
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static _convertNode(node: BVHNode, parent: Nullable<Bone>, context: LoaderContext) {
        const matrix = this._boneOffset(node);
        const bone = new Bone(node.name, context.realSkeleton, parent, matrix);

        // Create animation for this bone
        const animation = this._createAnimations(node, context);
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
            this._convertNode(child, bone, context);
        }
    }

    /**
     * Converts the BVH node's offset to a Babylon matrix
     * @param node - The BVH node to convert
     * @returns The converted matrix
     */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static _boneOffset(node: BVHNode): Matrix {
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
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private static _createAnimations(node: BVHNode, context: LoaderContext): Animation | null {
        if (node.frames.length === 0) {
            return null;
        }

        let keyFrames: IAnimationKey[] = [];

        // Create position animation if there are position channels
        const hasPosition = node.channels.some((c) => c === BVHLoader.X_POSITION || c === BVHLoader.Y_POSITION || c === BVHLoader.Z_POSITION);

        // Create rotation animation if there are rotation channels
        const hasRotation = node.channels.some((c) => c === BVHLoader.X_ROTATION || c === BVHLoader.Y_ROTATION || c === BVHLoader.Z_ROTATION);

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

        let fps = 60 / context.frameRate;
        let animation = new Animation(node.name + "_anim", "_matrix", fps, Animation.ANIMATIONTYPE_MATRIX, Animation.ANIMATIONLOOPMODE_CYCLE);
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
    protected static readNode(lines: string[], firstLine: string, parent: BVHNode, context: LoaderContext): BVHNode {
        let node = new BVHNode();
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

        let offset = new Vector3(parseFloat(tokens[1]), parseFloat(tokens[2]), parseFloat(tokens[3]));

        if (isNaN(offset.x) || isNaN(offset.y) || isNaN(offset.z)) throw new Error("OFFSET: Invalid values");

        node.offset = offset;

        // parse CHANNELS definitions
        if (node.type != "ENDSITE") {
            // @ts-ignore
            tokens = lines.shift()?.trim().split(/\s+/);

            if (tokens[0].toUpperCase() != "CHANNELS") throw new Error("Expected CHANNELS definition");

            let numChannels = parseInt(tokens[1]);
            // Skip CHANNELS and the number of channels
            node.channels = tokens.splice(2, numChannels);
            node.children = [];
        }

        // read children
        while (true) {
            let line = lines.shift()?.trim();

            if (line == "}") {
                // Finish reading the node
                return node;
            } else if (line) {
                node.children.push(BVHLoader.readNode(lines, line, node, context));
            }
        }
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
    protected static readFrameData(data: string[], frameTime: number, bone: BVHNode) {
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
            let value = data.shift();
            if (!value) {
                continue;
            }

            switch (bone.channels[i]) {
                case this.X_POSITION:
                    keyframe.position.x = parseFloat(value.trim());
                    break;
                case this.Y_POSITION:
                    keyframe.position.y = parseFloat(value.trim());
                    break;
                case this.Z_POSITION:
                    keyframe.position.z = -parseFloat(value.trim()); // Flip Z position
                    break;
                case this.X_ROTATION:
                    pitch = (parseFloat(value.trim()) * Math.PI) / 180;
                    break;
                case this.Y_ROTATION:
                    yaw = (parseFloat(value.trim()) * Math.PI) / 180;
                    break;
                case this.Z_ROTATION:
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
            BVHLoader.readFrameData(data, frameTime, bone.children[i]);
        }
    }
}

class LoaderContext {
    animationName: string = "";
    loopBehavior: number = 0;
    list: BVHNode[] = [];
    root: BVHNode = new BVHNode();
    numFrames: number = 0;
    frameRate: number = 0;
    realSkeleton: Skeleton;

    constructor() {
        this.realSkeleton = null as any; // Will be initialized in readBvh
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
