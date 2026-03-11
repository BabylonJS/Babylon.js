import { WebXRAbstractFeature } from "./WebXRAbstractFeature";
import { type WebXRSessionManager } from "../webXRSessionManager";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { type AbstractMesh } from "../../Meshes/abstractMesh";
import { Matrix, Quaternion, Vector3 } from "../../Maths/math.vector";
import { type Nullable } from "../../types";
import { type IDisposable, type Scene } from "../../scene";
import { type Observer, Observable } from "../../Misc/observable";
import { TransformNode } from "../../Meshes/transformNode";
import { type Node } from "../../node";
import { Logger } from "../../Misc/logger";
import { type Bone } from "../../Bones/bone";

/**
 * All 83 body joint names as defined by the WebXR Body Tracking specification.
 * @see https://immersive-web.github.io/body-tracking/#xrbody-interface
 */
export const enum WebXRBodyJoint {
    /** The center of the hips / pelvis */
    HIPS = "hips",
    /** Lower spine (lumbar) */
    SPINE_LOWER = "spine-lower",
    /** Middle spine (thoracic) */
    SPINE_MIDDLE = "spine-middle",
    /** Upper spine */
    SPINE_UPPER = "spine-upper",
    /** Chest */
    CHEST = "chest",
    /** Neck */
    NECK = "neck",
    /** Head */
    HEAD = "head",

    // ── Left Arm ──────────────────────────────────────────────
    /** Left shoulder */
    LEFT_SHOULDER = "left-shoulder",
    /** Left scapula */
    LEFT_SCAPULA = "left-scapula",
    /** Left upper arm */
    LEFT_ARM_UPPER = "left-arm-upper",
    /** Left forearm (lower arm) */
    LEFT_ARM_LOWER = "left-arm-lower",
    /** Left hand wrist twist (forearm twist) */
    LEFT_HAND_WRIST_TWIST = "left-hand-wrist-twist",

    // ── Right Arm ─────────────────────────────────────────────
    /** Right shoulder */
    RIGHT_SHOULDER = "right-shoulder",
    /** Right scapula */
    RIGHT_SCAPULA = "right-scapula",
    /** Right upper arm */
    RIGHT_ARM_UPPER = "right-arm-upper",
    /** Right forearm (lower arm) */
    RIGHT_ARM_LOWER = "right-arm-lower",
    /** Right hand wrist twist (forearm twist) */
    RIGHT_HAND_WRIST_TWIST = "right-hand-wrist-twist",

    // ── Left Hand ─────────────────────────────────────────────
    /** Left palm center */
    LEFT_HAND_PALM = "left-hand-palm",
    /** Left wrist */
    LEFT_HAND_WRIST = "left-hand-wrist",
    /** Left thumb metacarpal */
    LEFT_HAND_THUMB_METACARPAL = "left-hand-thumb-metacarpal",
    /** Left thumb proximal phalanx */
    LEFT_HAND_THUMB_PHALANX_PROXIMAL = "left-hand-thumb-phalanx-proximal",
    /** Left thumb distal phalanx */
    LEFT_HAND_THUMB_PHALANX_DISTAL = "left-hand-thumb-phalanx-distal",
    /** Left thumb tip */
    LEFT_HAND_THUMB_TIP = "left-hand-thumb-tip",
    /** Left index finger metacarpal */
    LEFT_HAND_INDEX_METACARPAL = "left-hand-index-metacarpal",
    /** Left index finger proximal phalanx */
    LEFT_HAND_INDEX_PHALANX_PROXIMAL = "left-hand-index-phalanx-proximal",
    /** Left index finger intermediate phalanx */
    LEFT_HAND_INDEX_PHALANX_INTERMEDIATE = "left-hand-index-phalanx-intermediate",
    /** Left index finger distal phalanx */
    LEFT_HAND_INDEX_PHALANX_DISTAL = "left-hand-index-phalanx-distal",
    /** Left index finger tip */
    LEFT_HAND_INDEX_TIP = "left-hand-index-tip",
    /** Left middle finger metacarpal */
    LEFT_HAND_MIDDLE_METACARPAL = "left-hand-middle-metacarpal",
    /** Left middle finger proximal phalanx */
    LEFT_HAND_MIDDLE_PHALANX_PROXIMAL = "left-hand-middle-phalanx-proximal",
    /** Left middle finger intermediate phalanx */
    LEFT_HAND_MIDDLE_PHALANX_INTERMEDIATE = "left-hand-middle-phalanx-intermediate",
    /** Left middle finger distal phalanx */
    LEFT_HAND_MIDDLE_PHALANX_DISTAL = "left-hand-middle-phalanx-distal",
    /** Left middle finger tip */
    LEFT_HAND_MIDDLE_TIP = "left-hand-middle-tip",
    /** Left ring finger metacarpal */
    LEFT_HAND_RING_METACARPAL = "left-hand-ring-metacarpal",
    /** Left ring finger proximal phalanx */
    LEFT_HAND_RING_PHALANX_PROXIMAL = "left-hand-ring-phalanx-proximal",
    /** Left ring finger intermediate phalanx */
    LEFT_HAND_RING_PHALANX_INTERMEDIATE = "left-hand-ring-phalanx-intermediate",
    /** Left ring finger distal phalanx */
    LEFT_HAND_RING_PHALANX_DISTAL = "left-hand-ring-phalanx-distal",
    /** Left ring finger tip */
    LEFT_HAND_RING_TIP = "left-hand-ring-tip",
    /** Left little finger metacarpal */
    LEFT_HAND_LITTLE_METACARPAL = "left-hand-little-metacarpal",
    /** Left little finger proximal phalanx */
    LEFT_HAND_LITTLE_PHALANX_PROXIMAL = "left-hand-little-phalanx-proximal",
    /** Left little finger intermediate phalanx */
    LEFT_HAND_LITTLE_PHALANX_INTERMEDIATE = "left-hand-little-phalanx-intermediate",
    /** Left little finger distal phalanx */
    LEFT_HAND_LITTLE_PHALANX_DISTAL = "left-hand-little-phalanx-distal",
    /** Left little finger tip */
    LEFT_HAND_LITTLE_TIP = "left-hand-little-tip",

    // ── Right Hand ────────────────────────────────────────────
    /** Right palm center */
    RIGHT_HAND_PALM = "right-hand-palm",
    /** Right wrist */
    RIGHT_HAND_WRIST = "right-hand-wrist",
    /** Right thumb metacarpal */
    RIGHT_HAND_THUMB_METACARPAL = "right-hand-thumb-metacarpal",
    /** Right thumb proximal phalanx */
    RIGHT_HAND_THUMB_PHALANX_PROXIMAL = "right-hand-thumb-phalanx-proximal",
    /** Right thumb distal phalanx */
    RIGHT_HAND_THUMB_PHALANX_DISTAL = "right-hand-thumb-phalanx-distal",
    /** Right thumb tip */
    RIGHT_HAND_THUMB_TIP = "right-hand-thumb-tip",
    /** Right index finger metacarpal */
    RIGHT_HAND_INDEX_METACARPAL = "right-hand-index-metacarpal",
    /** Right index finger proximal phalanx */
    RIGHT_HAND_INDEX_PHALANX_PROXIMAL = "right-hand-index-phalanx-proximal",
    /** Right index finger intermediate phalanx */
    RIGHT_HAND_INDEX_PHALANX_INTERMEDIATE = "right-hand-index-phalanx-intermediate",
    /** Right index finger distal phalanx */
    RIGHT_HAND_INDEX_PHALANX_DISTAL = "right-hand-index-phalanx-distal",
    /** Right index finger tip */
    RIGHT_HAND_INDEX_TIP = "right-hand-index-tip",
    /** Right middle finger metacarpal */
    RIGHT_HAND_MIDDLE_METACARPAL = "right-hand-middle-metacarpal",
    /** Right middle finger proximal phalanx */
    RIGHT_HAND_MIDDLE_PHALANX_PROXIMAL = "right-hand-middle-phalanx-proximal",
    /** Right middle finger intermediate phalanx */
    RIGHT_HAND_MIDDLE_PHALANX_INTERMEDIATE = "right-hand-middle-phalanx-intermediate",
    /** Right middle finger distal phalanx */
    RIGHT_HAND_MIDDLE_PHALANX_DISTAL = "right-hand-middle-phalanx-distal",
    /** Right middle finger tip */
    RIGHT_HAND_MIDDLE_TIP = "right-hand-middle-tip",
    /** Right ring finger metacarpal */
    RIGHT_HAND_RING_METACARPAL = "right-hand-ring-metacarpal",
    /** Right ring finger proximal phalanx */
    RIGHT_HAND_RING_PHALANX_PROXIMAL = "right-hand-ring-phalanx-proximal",
    /** Right ring finger intermediate phalanx */
    RIGHT_HAND_RING_PHALANX_INTERMEDIATE = "right-hand-ring-phalanx-intermediate",
    /** Right ring finger distal phalanx */
    RIGHT_HAND_RING_PHALANX_DISTAL = "right-hand-ring-phalanx-distal",
    /** Right ring finger tip */
    RIGHT_HAND_RING_TIP = "right-hand-ring-tip",
    /** Right little finger metacarpal */
    RIGHT_HAND_LITTLE_METACARPAL = "right-hand-little-metacarpal",
    /** Right little finger proximal phalanx */
    RIGHT_HAND_LITTLE_PHALANX_PROXIMAL = "right-hand-little-phalanx-proximal",
    /** Right little finger intermediate phalanx */
    RIGHT_HAND_LITTLE_PHALANX_INTERMEDIATE = "right-hand-little-phalanx-intermediate",
    /** Right little finger distal phalanx */
    RIGHT_HAND_LITTLE_PHALANX_DISTAL = "right-hand-little-phalanx-distal",
    /** Right little finger tip */
    RIGHT_HAND_LITTLE_TIP = "right-hand-little-tip",

    // ── Left Leg / Foot ───────────────────────────────────────
    /** Left upper leg (thigh) */
    LEFT_UPPER_LEG = "left-upper-leg",
    /** Left lower leg (shin) */
    LEFT_LOWER_LEG = "left-lower-leg",
    /** Left foot ankle twist */
    LEFT_FOOT_ANKLE_TWIST = "left-foot-ankle-twist",
    /** Left foot ankle */
    LEFT_FOOT_ANKLE = "left-foot-ankle",
    /** Left foot subtalar */
    LEFT_FOOT_SUBTALAR = "left-foot-subtalar",
    /** Left foot transverse */
    LEFT_FOOT_TRANSVERSE = "left-foot-transverse",
    /** Left foot ball */
    LEFT_FOOT_BALL = "left-foot-ball",

    // ── Right Leg / Foot ──────────────────────────────────────
    /** Right upper leg (thigh) */
    RIGHT_UPPER_LEG = "right-upper-leg",
    /** Right lower leg (shin) */
    RIGHT_LOWER_LEG = "right-lower-leg",
    /** Right foot ankle twist */
    RIGHT_FOOT_ANKLE_TWIST = "right-foot-ankle-twist",
    /** Right foot ankle */
    RIGHT_FOOT_ANKLE = "right-foot-ankle",
    /** Right foot subtalar */
    RIGHT_FOOT_SUBTALAR = "right-foot-subtalar",
    /** Right foot transverse */
    RIGHT_FOOT_TRANSVERSE = "right-foot-transverse",
    /** Right foot ball */
    RIGHT_FOOT_BALL = "right-foot-ball",
}

/**
 * The ordered array of all 83 body joints, matching the iteration order defined
 * by the WebXR Body Tracking specification.
 * @see https://immersive-web.github.io/body-tracking/#xrbody-interface
 */
const BodyJointReferenceArray: WebXRBodyJoint[] = [
    // Torso / spine
    WebXRBodyJoint.HIPS,
    WebXRBodyJoint.SPINE_LOWER,
    WebXRBodyJoint.SPINE_MIDDLE,
    WebXRBodyJoint.SPINE_UPPER,
    WebXRBodyJoint.CHEST,
    WebXRBodyJoint.NECK,
    WebXRBodyJoint.HEAD,

    // Left arm
    WebXRBodyJoint.LEFT_SHOULDER,
    WebXRBodyJoint.LEFT_SCAPULA,
    WebXRBodyJoint.LEFT_ARM_UPPER,
    WebXRBodyJoint.LEFT_ARM_LOWER,
    WebXRBodyJoint.LEFT_HAND_WRIST_TWIST,

    // Right arm
    WebXRBodyJoint.RIGHT_SHOULDER,
    WebXRBodyJoint.RIGHT_SCAPULA,
    WebXRBodyJoint.RIGHT_ARM_UPPER,
    WebXRBodyJoint.RIGHT_ARM_LOWER,
    WebXRBodyJoint.RIGHT_HAND_WRIST_TWIST,

    // Left hand
    WebXRBodyJoint.LEFT_HAND_PALM,
    WebXRBodyJoint.LEFT_HAND_WRIST,
    WebXRBodyJoint.LEFT_HAND_THUMB_METACARPAL,
    WebXRBodyJoint.LEFT_HAND_THUMB_PHALANX_PROXIMAL,
    WebXRBodyJoint.LEFT_HAND_THUMB_PHALANX_DISTAL,
    WebXRBodyJoint.LEFT_HAND_THUMB_TIP,
    WebXRBodyJoint.LEFT_HAND_INDEX_METACARPAL,
    WebXRBodyJoint.LEFT_HAND_INDEX_PHALANX_PROXIMAL,
    WebXRBodyJoint.LEFT_HAND_INDEX_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.LEFT_HAND_INDEX_PHALANX_DISTAL,
    WebXRBodyJoint.LEFT_HAND_INDEX_TIP,
    WebXRBodyJoint.LEFT_HAND_MIDDLE_METACARPAL,
    WebXRBodyJoint.LEFT_HAND_MIDDLE_PHALANX_PROXIMAL,
    WebXRBodyJoint.LEFT_HAND_MIDDLE_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.LEFT_HAND_MIDDLE_PHALANX_DISTAL,
    WebXRBodyJoint.LEFT_HAND_MIDDLE_TIP,
    WebXRBodyJoint.LEFT_HAND_RING_METACARPAL,
    WebXRBodyJoint.LEFT_HAND_RING_PHALANX_PROXIMAL,
    WebXRBodyJoint.LEFT_HAND_RING_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.LEFT_HAND_RING_PHALANX_DISTAL,
    WebXRBodyJoint.LEFT_HAND_RING_TIP,
    WebXRBodyJoint.LEFT_HAND_LITTLE_METACARPAL,
    WebXRBodyJoint.LEFT_HAND_LITTLE_PHALANX_PROXIMAL,
    WebXRBodyJoint.LEFT_HAND_LITTLE_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.LEFT_HAND_LITTLE_PHALANX_DISTAL,
    WebXRBodyJoint.LEFT_HAND_LITTLE_TIP,

    // Right hand
    WebXRBodyJoint.RIGHT_HAND_PALM,
    WebXRBodyJoint.RIGHT_HAND_WRIST,
    WebXRBodyJoint.RIGHT_HAND_THUMB_METACARPAL,
    WebXRBodyJoint.RIGHT_HAND_THUMB_PHALANX_PROXIMAL,
    WebXRBodyJoint.RIGHT_HAND_THUMB_PHALANX_DISTAL,
    WebXRBodyJoint.RIGHT_HAND_THUMB_TIP,
    WebXRBodyJoint.RIGHT_HAND_INDEX_METACARPAL,
    WebXRBodyJoint.RIGHT_HAND_INDEX_PHALANX_PROXIMAL,
    WebXRBodyJoint.RIGHT_HAND_INDEX_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.RIGHT_HAND_INDEX_PHALANX_DISTAL,
    WebXRBodyJoint.RIGHT_HAND_INDEX_TIP,
    WebXRBodyJoint.RIGHT_HAND_MIDDLE_METACARPAL,
    WebXRBodyJoint.RIGHT_HAND_MIDDLE_PHALANX_PROXIMAL,
    WebXRBodyJoint.RIGHT_HAND_MIDDLE_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.RIGHT_HAND_MIDDLE_PHALANX_DISTAL,
    WebXRBodyJoint.RIGHT_HAND_MIDDLE_TIP,
    WebXRBodyJoint.RIGHT_HAND_RING_METACARPAL,
    WebXRBodyJoint.RIGHT_HAND_RING_PHALANX_PROXIMAL,
    WebXRBodyJoint.RIGHT_HAND_RING_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.RIGHT_HAND_RING_PHALANX_DISTAL,
    WebXRBodyJoint.RIGHT_HAND_RING_TIP,
    WebXRBodyJoint.RIGHT_HAND_LITTLE_METACARPAL,
    WebXRBodyJoint.RIGHT_HAND_LITTLE_PHALANX_PROXIMAL,
    WebXRBodyJoint.RIGHT_HAND_LITTLE_PHALANX_INTERMEDIATE,
    WebXRBodyJoint.RIGHT_HAND_LITTLE_PHALANX_DISTAL,
    WebXRBodyJoint.RIGHT_HAND_LITTLE_TIP,

    // Left leg / foot
    WebXRBodyJoint.LEFT_UPPER_LEG,
    WebXRBodyJoint.LEFT_LOWER_LEG,
    WebXRBodyJoint.LEFT_FOOT_ANKLE_TWIST,
    WebXRBodyJoint.LEFT_FOOT_ANKLE,
    WebXRBodyJoint.LEFT_FOOT_SUBTALAR,
    WebXRBodyJoint.LEFT_FOOT_TRANSVERSE,
    WebXRBodyJoint.LEFT_FOOT_BALL,

    // Right leg / foot
    WebXRBodyJoint.RIGHT_UPPER_LEG,
    WebXRBodyJoint.RIGHT_LOWER_LEG,
    WebXRBodyJoint.RIGHT_FOOT_ANKLE_TWIST,
    WebXRBodyJoint.RIGHT_FOOT_ANKLE,
    WebXRBodyJoint.RIGHT_FOOT_SUBTALAR,
    WebXRBodyJoint.RIGHT_FOOT_TRANSVERSE,
    WebXRBodyJoint.RIGHT_FOOT_BALL,
];

/**
 * Reverse lookup: {@link WebXRBodyJoint} → index in {@link BodyJointReferenceArray}.
 * Used for O(1) name-based access where previously `indexOf` was called in hot paths.
 */
const BodyJointNameToIndex: ReadonlyMap<WebXRBodyJoint, number> = new Map<WebXRBodyJoint, number>(BodyJointReferenceArray.map((j, i) => [j, i]));

/**
 * The total number of joints in the body tracking spec.
 * The XRBody size attribute MUST return this value.
 */
const BODY_JOINT_COUNT = 83;

/**
 * Parent index for each joint in {@link BodyJointReferenceArray} order.
 * -1 means "root" (no parent).  Used to convert world-space XR poses to
 * local-space transforms suitable for skeleton bones.
 *
 * Hierarchy follows the WebXR Body Tracking specification and standard
 * humanoid anatomy.
 */
// prettier-ignore
export const BodyJointParentIndex: number[] = [
    //  0: hips (root)
    -1,
    //  1: spine-lower → hips
    0,
    //  2: spine-middle → spine-lower
    1,
    //  3: spine-upper → spine-middle
    2,
    //  4: chest → spine-upper
    3,
    //  5: neck → chest
    4,
    //  6: head → neck
    5,

    // Left arm (7-11)
    4,   //  7: left-shoulder → chest
    7,   //  8: left-scapula → left-shoulder
    8,   //  9: left-arm-upper → left-scapula
    9,   // 10: left-arm-lower → left-arm-upper
    10,  // 11: left-hand-wrist-twist → left-arm-lower

    // Right arm (12-16)
    4,   // 12: right-shoulder → chest
    12,  // 13: right-scapula → right-shoulder
    13,  // 14: right-arm-upper → right-scapula
    14,  // 15: right-arm-lower → right-arm-upper
    15,  // 16: right-hand-wrist-twist → right-arm-lower

    // Left hand (17-42)
    11,  // 17: left-hand-palm → left-hand-wrist-twist
    11,  // 18: left-hand-wrist → left-hand-wrist-twist
    18,  // 19: left-hand-thumb-metacarpal → left-hand-wrist
    19,  // 20: left-hand-thumb-phalanx-proximal
    20,  // 21: left-hand-thumb-phalanx-distal
    21,  // 22: left-hand-thumb-tip
    18,  // 23: left-hand-index-metacarpal → left-hand-wrist
    23,  // 24: left-hand-index-phalanx-proximal
    24,  // 25: left-hand-index-phalanx-intermediate
    25,  // 26: left-hand-index-phalanx-distal
    26,  // 27: left-hand-index-tip
    18,  // 28: left-hand-middle-metacarpal → left-hand-wrist
    28,  // 29: left-hand-middle-phalanx-proximal
    29,  // 30: left-hand-middle-phalanx-intermediate
    30,  // 31: left-hand-middle-phalanx-distal
    31,  // 32: left-hand-middle-tip
    18,  // 33: left-hand-ring-metacarpal → left-hand-wrist
    33,  // 34: left-hand-ring-phalanx-proximal
    34,  // 35: left-hand-ring-phalanx-intermediate
    35,  // 36: left-hand-ring-phalanx-distal
    36,  // 37: left-hand-ring-tip
    18,  // 38: left-hand-little-metacarpal → left-hand-wrist
    38,  // 39: left-hand-little-phalanx-proximal
    39,  // 40: left-hand-little-phalanx-intermediate
    40,  // 41: left-hand-little-phalanx-distal
    41,  // 42: left-hand-little-tip

    // Right hand (43-68)
    16,  // 43: right-hand-palm → right-hand-wrist-twist
    16,  // 44: right-hand-wrist → right-hand-wrist-twist
    44,  // 45: right-hand-thumb-metacarpal → right-hand-wrist
    45,  // 46: right-hand-thumb-phalanx-proximal
    46,  // 47: right-hand-thumb-phalanx-distal
    47,  // 48: right-hand-thumb-tip
    44,  // 49: right-hand-index-metacarpal → right-hand-wrist
    49,  // 50: right-hand-index-phalanx-proximal
    50,  // 51: right-hand-index-phalanx-intermediate
    51,  // 52: right-hand-index-phalanx-distal
    52,  // 53: right-hand-index-tip
    44,  // 54: right-hand-middle-metacarpal → right-hand-wrist
    54,  // 55: right-hand-middle-phalanx-proximal
    55,  // 56: right-hand-middle-phalanx-intermediate
    56,  // 57: right-hand-middle-phalanx-distal
    57,  // 58: right-hand-middle-tip
    44,  // 59: right-hand-ring-metacarpal → right-hand-wrist
    59,  // 60: right-hand-ring-phalanx-proximal
    60,  // 61: right-hand-ring-phalanx-intermediate
    61,  // 62: right-hand-ring-phalanx-distal
    62,  // 63: right-hand-ring-tip
    44,  // 64: right-hand-little-metacarpal → right-hand-wrist
    64,  // 65: right-hand-little-phalanx-proximal
    65,  // 66: right-hand-little-phalanx-intermediate
    66,  // 67: right-hand-little-phalanx-distal
    67,  // 68: right-hand-little-tip

    // Left leg / foot (69-75)
    0,   // 69: left-upper-leg → hips
    69,  // 70: left-lower-leg → left-upper-leg
    70,  // 71: left-foot-ankle-twist → left-lower-leg
    71,  // 72: left-foot-ankle → left-foot-ankle-twist
    72,  // 73: left-foot-subtalar → left-foot-ankle
    73,  // 74: left-foot-transverse → left-foot-subtalar
    74,  // 75: left-foot-ball → left-foot-transverse

    // Right leg / foot (76-82)
    0,   // 76: right-upper-leg → hips
    76,  // 77: right-lower-leg → right-upper-leg
    77,  // 78: right-foot-ankle-twist → right-lower-leg
    78,  // 79: right-foot-ankle → right-foot-ankle-twist
    79,  // 80: right-foot-subtalar → right-foot-ankle
    80,  // 81: right-foot-transverse → right-foot-subtalar
    81,  // 82: right-foot-ball → right-foot-transverse
];

/**
 * Logical body parts for convenient grouping of joints.
 */
export const enum BodyPart {
    /** Torso / spine (hips through head) */
    TORSO = "torso",
    /** Left arm (shoulder through wrist twist) */
    LEFT_ARM = "left-arm",
    /** Right arm (shoulder through wrist twist) */
    RIGHT_ARM = "right-arm",
    /** Left hand (palm through finger tips) */
    LEFT_HAND = "left-hand",
    /** Right hand (palm through finger tips) */
    RIGHT_HAND = "right-hand",
    /** Left leg (upper leg through foot ball) */
    LEFT_LEG = "left-leg",
    /** Right leg (upper leg through foot ball) */
    RIGHT_LEG = "right-leg",
}

/**
 * Which body joints belong to each body part.
 */
const BodyPartsDefinition: { [key in BodyPart]: WebXRBodyJoint[] } = {
    [BodyPart.TORSO]: [
        WebXRBodyJoint.HIPS,
        WebXRBodyJoint.SPINE_LOWER,
        WebXRBodyJoint.SPINE_MIDDLE,
        WebXRBodyJoint.SPINE_UPPER,
        WebXRBodyJoint.CHEST,
        WebXRBodyJoint.NECK,
        WebXRBodyJoint.HEAD,
    ],
    [BodyPart.LEFT_ARM]: [
        WebXRBodyJoint.LEFT_SHOULDER,
        WebXRBodyJoint.LEFT_SCAPULA,
        WebXRBodyJoint.LEFT_ARM_UPPER,
        WebXRBodyJoint.LEFT_ARM_LOWER,
        WebXRBodyJoint.LEFT_HAND_WRIST_TWIST,
    ],
    [BodyPart.RIGHT_ARM]: [
        WebXRBodyJoint.RIGHT_SHOULDER,
        WebXRBodyJoint.RIGHT_SCAPULA,
        WebXRBodyJoint.RIGHT_ARM_UPPER,
        WebXRBodyJoint.RIGHT_ARM_LOWER,
        WebXRBodyJoint.RIGHT_HAND_WRIST_TWIST,
    ],
    [BodyPart.LEFT_HAND]: [
        WebXRBodyJoint.LEFT_HAND_PALM,
        WebXRBodyJoint.LEFT_HAND_WRIST,
        WebXRBodyJoint.LEFT_HAND_THUMB_METACARPAL,
        WebXRBodyJoint.LEFT_HAND_THUMB_PHALANX_PROXIMAL,
        WebXRBodyJoint.LEFT_HAND_THUMB_PHALANX_DISTAL,
        WebXRBodyJoint.LEFT_HAND_THUMB_TIP,
        WebXRBodyJoint.LEFT_HAND_INDEX_METACARPAL,
        WebXRBodyJoint.LEFT_HAND_INDEX_PHALANX_PROXIMAL,
        WebXRBodyJoint.LEFT_HAND_INDEX_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.LEFT_HAND_INDEX_PHALANX_DISTAL,
        WebXRBodyJoint.LEFT_HAND_INDEX_TIP,
        WebXRBodyJoint.LEFT_HAND_MIDDLE_METACARPAL,
        WebXRBodyJoint.LEFT_HAND_MIDDLE_PHALANX_PROXIMAL,
        WebXRBodyJoint.LEFT_HAND_MIDDLE_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.LEFT_HAND_MIDDLE_PHALANX_DISTAL,
        WebXRBodyJoint.LEFT_HAND_MIDDLE_TIP,
        WebXRBodyJoint.LEFT_HAND_RING_METACARPAL,
        WebXRBodyJoint.LEFT_HAND_RING_PHALANX_PROXIMAL,
        WebXRBodyJoint.LEFT_HAND_RING_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.LEFT_HAND_RING_PHALANX_DISTAL,
        WebXRBodyJoint.LEFT_HAND_RING_TIP,
        WebXRBodyJoint.LEFT_HAND_LITTLE_METACARPAL,
        WebXRBodyJoint.LEFT_HAND_LITTLE_PHALANX_PROXIMAL,
        WebXRBodyJoint.LEFT_HAND_LITTLE_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.LEFT_HAND_LITTLE_PHALANX_DISTAL,
        WebXRBodyJoint.LEFT_HAND_LITTLE_TIP,
    ],
    [BodyPart.RIGHT_HAND]: [
        WebXRBodyJoint.RIGHT_HAND_PALM,
        WebXRBodyJoint.RIGHT_HAND_WRIST,
        WebXRBodyJoint.RIGHT_HAND_THUMB_METACARPAL,
        WebXRBodyJoint.RIGHT_HAND_THUMB_PHALANX_PROXIMAL,
        WebXRBodyJoint.RIGHT_HAND_THUMB_PHALANX_DISTAL,
        WebXRBodyJoint.RIGHT_HAND_THUMB_TIP,
        WebXRBodyJoint.RIGHT_HAND_INDEX_METACARPAL,
        WebXRBodyJoint.RIGHT_HAND_INDEX_PHALANX_PROXIMAL,
        WebXRBodyJoint.RIGHT_HAND_INDEX_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.RIGHT_HAND_INDEX_PHALANX_DISTAL,
        WebXRBodyJoint.RIGHT_HAND_INDEX_TIP,
        WebXRBodyJoint.RIGHT_HAND_MIDDLE_METACARPAL,
        WebXRBodyJoint.RIGHT_HAND_MIDDLE_PHALANX_PROXIMAL,
        WebXRBodyJoint.RIGHT_HAND_MIDDLE_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.RIGHT_HAND_MIDDLE_PHALANX_DISTAL,
        WebXRBodyJoint.RIGHT_HAND_MIDDLE_TIP,
        WebXRBodyJoint.RIGHT_HAND_RING_METACARPAL,
        WebXRBodyJoint.RIGHT_HAND_RING_PHALANX_PROXIMAL,
        WebXRBodyJoint.RIGHT_HAND_RING_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.RIGHT_HAND_RING_PHALANX_DISTAL,
        WebXRBodyJoint.RIGHT_HAND_RING_TIP,
        WebXRBodyJoint.RIGHT_HAND_LITTLE_METACARPAL,
        WebXRBodyJoint.RIGHT_HAND_LITTLE_PHALANX_PROXIMAL,
        WebXRBodyJoint.RIGHT_HAND_LITTLE_PHALANX_INTERMEDIATE,
        WebXRBodyJoint.RIGHT_HAND_LITTLE_PHALANX_DISTAL,
        WebXRBodyJoint.RIGHT_HAND_LITTLE_TIP,
    ],
    [BodyPart.LEFT_LEG]: [
        WebXRBodyJoint.LEFT_UPPER_LEG,
        WebXRBodyJoint.LEFT_LOWER_LEG,
        WebXRBodyJoint.LEFT_FOOT_ANKLE_TWIST,
        WebXRBodyJoint.LEFT_FOOT_ANKLE,
        WebXRBodyJoint.LEFT_FOOT_SUBTALAR,
        WebXRBodyJoint.LEFT_FOOT_TRANSVERSE,
        WebXRBodyJoint.LEFT_FOOT_BALL,
    ],
    [BodyPart.RIGHT_LEG]: [
        WebXRBodyJoint.RIGHT_UPPER_LEG,
        WebXRBodyJoint.RIGHT_LOWER_LEG,
        WebXRBodyJoint.RIGHT_FOOT_ANKLE_TWIST,
        WebXRBodyJoint.RIGHT_FOOT_ANKLE,
        WebXRBodyJoint.RIGHT_FOOT_SUBTALAR,
        WebXRBodyJoint.RIGHT_FOOT_TRANSVERSE,
        WebXRBodyJoint.RIGHT_FOOT_BALL,
    ],
};

/**
 * A dictionary mapping each {@link WebXRBodyJoint} to a bone name in a rigged body mesh.
 *
 * When you supply a rigged mesh to {@link WebXRTrackedBody.setBodyMesh}, provide
 * a mapping so the feature knows which skeleton bone to drive for each joint.
 *
 * @example
 * ```typescript
 * const rigMapping: XRBodyMeshRigMapping = {
 *   "hips": "Bip01_Pelvis",
 *   "spine-lower": "Bip01_Spine",
 *   "head": "Bip01_Head",
 *   // …remaining joints…
 * };
 * ```
 */
export type XRBodyMeshRigMapping = { [jointName in WebXRBodyJoint]?: string };

// ────────────────────────────────────────────────────────────────────────────
// XRBody / XRBodySpace WebXR API type declarations
// These types are not yet part of the standard TypeScript lib, so we declare them
// locally. They mirror the interfaces defined in the WebXR Body Tracking spec.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Represents the XRBodySpace native interface as defined by the spec.
 * An XRBodySpace is an XRSpace that additionally exposes a jointName.
 * @see https://immersive-web.github.io/body-tracking/#xrjointspace-interface
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface XRBodySpace extends XRSpace {
    readonly jointName: string;
}

/**
 * Represents the native XRBody interface as defined by the spec.
 * An XRBody is an iterable map of XRBodyJoint → XRBodySpace.
 * @see https://immersive-web.github.io/body-tracking/#xrbody-interface
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
interface XRBody {
    readonly size: number;
    get(key: string): XRBodySpace | undefined;
    forEach(callbackfn: (value: XRBodySpace, key: string, map: XRBody) => void): void;
    [Symbol.iterator](): IterableIterator<[string, XRBodySpace]>;
    entries(): IterableIterator<[string, XRBodySpace]>;
    keys(): IterableIterator<string>;
    values(): IterableIterator<XRBodySpace>;
}

// Augment the XRFrame interface so TypeScript knows about the `body` property.
declare global {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    interface XRFrame {
        body?: XRBody;
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Configuration
// ────────────────────────────────────────────────────────────────────────────

/**
 * Configuration options for the WebXR body tracking feature.
 */
export interface IWebXRBodyTrackingOptions {
    /**
     * A pre-existing rigged body mesh to drive with tracked joint poses.
     * If provided, skeleton bones will be linked to tracked joints automatically.
     * The mesh should contain a skeleton whose bones can be mapped via `rigMapping`.
     */
    bodyMesh?: AbstractMesh;

    /**
     * A mapping from {@link WebXRBodyJoint} names to skeleton bone names.
     * Required when the skeleton's bone names do not match the WebXR joint names.
     * If omitted and a body mesh is provided, the feature assumes bones are
     * named identically to the WebXR joint names (e.g. `"hips"`, `"left-arm-upper"`, etc.).
     */
    rigMapping?: XRBodyMeshRigMapping;

    /**
     * Scale factor applied to the local-space position of every joint.
     *
     * This uniformly scales the distances between parent and child joints,
     * allowing you to fit XR body tracking data to meshes that are larger or
     * smaller than the tracked user.
     *
     * - `1.0` (default): no scaling — real-world proportions.
     * - `> 1.0`: stretches the skeleton (makes it taller / wider).
     * - `< 1.0`: compresses the skeleton.
     *
     * Only affects local joint offsets, not the root (hips) position.
     */
    jointScaleFactor?: number;

    /**
     * Preserve bind-pose local translations for mapped bones and only retarget rotations.
     *
     * When `false` (default), mapped bones are translated directly to the tracked joint
     * positions. This reproduces the tracked skeleton exactly, but can distort avatars whose
     * proportions differ from the tracked user.
     *
     * When `true`, mapped child bones keep their bind-pose local translation offsets while
     * still using the tracked joint rotations. This is the typical retargeting mode for
     * driving arbitrary skinned characters without forcing them to the tracked skeleton's
     * segment lengths.
     */
    preserveBindPoseBonePositions?: boolean;

    /**
     * Apply a per-bone orientation offset so the avatar bone basis matches the XR joint basis.
     *
     * When enabled, WebXR joint rotations are corrected using the bone's bind-space child axis.
     * This is useful for rigs whose bone local axes do not match the anatomical axes used by
     * the WebXR body-tracking joint orientations.
     */
    useBoneOrientationOffsets?: boolean;

    /**
     * Rotation applied in each tracked joint's local frame to re-base the
     * XR joint axes. Some runtimes (e.g., some Meta Quest builds) emit body
     * joint poses whose +Z axis points along the bone (parent → child), while
     * most avatar rigs expect +Y along the bone. Setting this to
     * `Quaternion.RotationAxis(Vector3.Right(), -Math.PI / 2)` converts
     * "+Z-along-bone" joint data to "+Y-along-bone" before retargeting.
     *
     * Applied as a pre-multiply on each joint's world matrix:
     * `M' = R × M`, which, under Babylon's row-vector convention
     * (`v_world = v_local × M`), effectively re-bases the joint-local axes.
     *
     * Default `undefined` = identity (no re-basing).
     */
    jointLocalRotationOffset?: Quaternion;

    /**
     * Per–XR-joint override for the "aim child" joint used when
     * {@link useBoneOrientationOffsets} is enabled.
     *
     * By default the aim direction for a mapped bone is computed against its
     * nearest mapped descendant in the skeleton. For rigs whose XR-mapped
     * spine chain has very short segments (e.g. WebXR's `hips`→`spine-lower`
     * is typically only ~1 cm), the aim direction becomes noise-dominated and
     * can produce a large incorrect rotation for the parent bone.
     *
     * Use this map to redirect a specific XR joint's aim target to a farther
     * XR joint whose relative position is stable. Both the source and target
     * joint must be present in {@link rigMapping} (i.e. mapped to a bone on the
     * skeleton).
     *
     * Example for a Mixamo-style rig where hips, spine, spine1, spine2 and
     * neck are all mapped:
     * ```ts
     * aimChildOverrides: {
     *   [WebXRBodyJoint.HIPS]: WebXRBodyJoint.SPINE_UPPER,   // skip spine-lower/middle
     *   [WebXRBodyJoint.SPINE_LOWER]: WebXRBodyJoint.NECK,   // long stable segment
     *   [WebXRBodyJoint.SPINE_MIDDLE]: WebXRBodyJoint.NECK,
     * }
     * ```
     */
    aimChildOverrides?: Partial<Record<WebXRBodyJoint, WebXRBodyJoint>>;

    /**
     * Convenience flag for Mixamo-rigged characters.
     *
     * When set to `true`, the feature automatically applies:
     * - {@link MixamoRigMapping} as the `rigMapping` (skipping any explicit
     *   `rigMapping` you provide).
     * - {@link MixamoAimChildOverrides} as `aimChildOverrides` (skipping any
     *   explicit `aimChildOverrides` you provide).
     * - Turns on {@link useBoneOrientationOffsets} by default (you can still
     *   override to `false`).
     *
     * The Mixamo `mixamorig:` bone-name prefix is detected automatically by
     * inspecting the skeleton, so the same mapping works regardless of whether
     * the bones have been renamed to strip the prefix (common when re-exporting).
     */
    isMixamoModel?: boolean;
}

// ────────────────────────────────────────────────────────────────────────────
// Built-in rig mappings
// ────────────────────────────────────────────────────────────────────────────

/**
 * Default rig mapping for Mixamo-rigged humanoid characters.
 *
 * Maps each supported {@link WebXRBodyJoint} to the corresponding Mixamo bone
 * name, **without** the `mixamorig:` prefix. When the feature applies this
 * mapping, it auto-detects whether the skeleton uses the `mixamorig:` prefix
 * and prepends it as needed, so the same table works for both prefixed and
 * unprefixed exports.
 *
 * @example
 * ```ts
 * xr.featuresManager.enableFeature(WebXRFeatureName.BODY_TRACKING, "latest", {
 *     bodyMesh: myMixamoMesh,
 *     isMixamoModel: true,
 * });
 * ```
 *
 * Or, if you want to extend or customize it:
 * ```ts
 * import { MixamoRigMapping } from "@babylonjs/core";
 * const rigMapping: XRBodyMeshRigMapping = { ...MixamoRigMapping, [WebXRBodyJoint.NECK]: "MyNeckBone" };
 * ```
 */
export const MixamoRigMapping: XRBodyMeshRigMapping = {
    [WebXRBodyJoint.HIPS]: "Hips",
    [WebXRBodyJoint.SPINE_LOWER]: "Spine",
    [WebXRBodyJoint.SPINE_MIDDLE]: "Spine1",
    [WebXRBodyJoint.SPINE_UPPER]: "Spine2",
    [WebXRBodyJoint.NECK]: "Neck",
    [WebXRBodyJoint.HEAD]: "Head",

    [WebXRBodyJoint.LEFT_SHOULDER]: "LeftShoulder",
    [WebXRBodyJoint.LEFT_ARM_UPPER]: "LeftArm",
    [WebXRBodyJoint.LEFT_ARM_LOWER]: "LeftForeArm",
    [WebXRBodyJoint.LEFT_HAND_WRIST]: "LeftHand",

    [WebXRBodyJoint.RIGHT_SHOULDER]: "RightShoulder",
    [WebXRBodyJoint.RIGHT_ARM_UPPER]: "RightArm",
    [WebXRBodyJoint.RIGHT_ARM_LOWER]: "RightForeArm",
    [WebXRBodyJoint.RIGHT_HAND_WRIST]: "RightHand",

    [WebXRBodyJoint.LEFT_UPPER_LEG]: "LeftUpLeg",
    [WebXRBodyJoint.LEFT_LOWER_LEG]: "LeftLeg",
    [WebXRBodyJoint.LEFT_FOOT_ANKLE]: "LeftFoot",
    [WebXRBodyJoint.LEFT_FOOT_BALL]: "LeftToeBase",

    [WebXRBodyJoint.RIGHT_UPPER_LEG]: "RightUpLeg",
    [WebXRBodyJoint.RIGHT_LOWER_LEG]: "RightLeg",
    [WebXRBodyJoint.RIGHT_FOOT_ANKLE]: "RightFoot",
    [WebXRBodyJoint.RIGHT_FOOT_BALL]: "RightToeBase",
};

/**
 * Default aim-child overrides for Mixamo-rigged humanoids.
 *
 * Redirects the short / noisy XR spine segments to longer, stable ones so that
 * {@link IWebXRBodyTrackingOptions.useBoneOrientationOffsets} produces clean
 * torso rotations. In WebXR data, `hips`→`spine-lower` is typically only ~1 cm
 * apart — too short to give a stable aim direction — so we reroute Mixamo's
 * Hips/Spine/Spine1 bones to aim at `spine-upper` / `neck` instead.
 */
export const MixamoAimChildOverrides: Partial<Record<WebXRBodyJoint, WebXRBodyJoint>> = {
    [WebXRBodyJoint.HIPS]: WebXRBodyJoint.SPINE_UPPER,
    [WebXRBodyJoint.SPINE_LOWER]: WebXRBodyJoint.NECK,
    [WebXRBodyJoint.SPINE_MIDDLE]: WebXRBodyJoint.NECK,
    // Hands have no mapped finger descendants on a typical Mixamo rig. Aim
    // them at the tracked Middle-finger metacarpal joint to give the wrist
    // a real orientation reference instead of relying on Meta's raw wrist
    // rotation (which tends to flop around when the cameras can't resolve
    // the hand pose).
    [WebXRBodyJoint.LEFT_HAND_WRIST]: WebXRBodyJoint.LEFT_HAND_MIDDLE_METACARPAL,
    [WebXRBodyJoint.RIGHT_HAND_WRIST]: WebXRBodyJoint.RIGHT_HAND_MIDDLE_METACARPAL,
};

/**
 * Resolve the Mixamo rig mapping for a given body mesh, auto-detecting the
 * `mixamorig:` bone-name prefix. Falls back to the unprefixed names.
 * @param bodyMesh The rigged Mixamo body mesh.
 * @returns An {@link XRBodyMeshRigMapping} whose bone names include the
 *          detected prefix (if any).
 * @internal
 */
export function _ResolveMixamoRigMapping(bodyMesh: AbstractMesh): XRBodyMeshRigMapping {
    let skeleton = bodyMesh.skeleton;
    if (!skeleton) {
        for (const child of bodyMesh.getChildMeshes()) {
            if (child.skeleton) {
                skeleton = child.skeleton;
                break;
            }
        }
    }
    let prefix = "";
    if (skeleton) {
        // Look for the Hips bone to determine whether bones use the mixamorig: prefix.
        if (skeleton.getBoneIndexByName("mixamorig:Hips") !== -1) {
            prefix = "mixamorig:";
        } else if (skeleton.getBoneIndexByName("Hips") === -1) {
            // Neither prefixed nor unprefixed Hips was found — try to auto-detect
            // the prefix by scanning bone names.
            for (const b of skeleton.bones) {
                const match = /^(.*?)Hips$/.exec(b.name);
                if (match) {
                    prefix = match[1];
                    break;
                }
            }
        }
    }
    if (!prefix) {
        return MixamoRigMapping;
    }
    const resolved: XRBodyMeshRigMapping = {};
    for (const key of Object.keys(MixamoRigMapping) as WebXRBodyJoint[]) {
        resolved[key] = prefix + MixamoRigMapping[key]!;
    }
    return resolved;
}

// ────────────────────────────────────────────────────────────────────────────
// WebXRTrackedBody — runtime representation of a tracked body
// ────────────────────────────────────────────────────────────────────────────

/**
 * Represents a tracked body during a WebXR session.
 *
 * This class manages the bridge between the WebXR body pose data and the
 * Babylon.js scene graph.  It creates a set of {@link TransformNode}s — one per
 * body joint — whose transforms are updated every frame from the XR runtime.
 * When a rigged body mesh is attached, its skeleton bones are linked to these
 * transform nodes, causing the mesh to follow the user's body automatically.
 *
 * Coordinate-system handling:
 * - WebXR delivers poses in a right-handed system.
 * - By default, Babylon.js uses a left-handed system.
 * - The class converts the data in-place (negating the Z components of every
 *   4 × 4 joint matrix) before decomposing into Babylon transforms.
 * - If the mesh was authored in a right-handed tool (the common case for glTF),
 *   the bone transforms are un-flipped so the skeleton interprets them correctly.
 */
export class WebXRTrackedBody implements IDisposable {
    /**
     * Fired when the body mesh is changed via {@link setBodyMesh}.
     */
    public readonly onBodyMeshSetObservable = new Observable<WebXRTrackedBody>();

    private _scene: Scene;

    /**
     * One {@link TransformNode} per joint.  These receive the WebXR matrix data
     * every frame and serve as link targets for skeleton bones.
     */
    private _jointTransforms = new Array<TransformNode>(BODY_JOINT_COUNT);

    /**
     * Flat Float32Array that receives transform matrices directly from the
     * WebXR API (via `fillPoses`). 16 floats per joint × 83 joints = 1 328 floats.
     */
    private _jointTransformMatrices = new Float32Array(BODY_JOINT_COUNT * 16);

    /**
     * Copy of the raw RHS XR matrices (before LHS conversion).
     * Used to compute bone-local transforms for glTF skeletons that
     * operate in RHS space.
     */
    private _jointTransformMatricesRHS = new Float32Array(BODY_JOINT_COUNT * 16);

    /**
     * Cached array of XRBodySpace objects extracted from the XRBody, kept in the
     * same order as {@link BodyJointReferenceArray}.
     */
    private _jointSpaces: (XRBodySpace | undefined)[] = new Array(BODY_JOINT_COUNT);

    /** Temporary matrix: this joint's XR world-space matrix. */
    private _tempJointMatrix = new Matrix();

    /** Temporary matrix: parent joint's XR world-space matrix. */
    private _tempParentMatrix = new Matrix();

    /** Temporary matrix: computed bone-local matrix. */
    private _tempLocalMatrix = new Matrix();

    /** Temporary vector for scale extracted from decompose. */
    private _tempScaleVector = new Vector3();

    /** Temporary quaternion for decompose. */
    private _tempRotQuat = new Quaternion();

    /** Temporary position vector for decompose. */
    private _tempPosVec = new Vector3();

    /** Temporary quaternion for alternate rotation calculations. */
    private _tempRotQuat2 = new Quaternion();

    /** Temporary vector for desired child direction. */
    private _tempDirection = new Vector3();

    /** Temporary vector for joint-local child direction. */
    private _tempLocalDirection = new Vector3();

    /** Cached desired final positions for mapped joints. */
    private _desiredFinalPositions = Array.from({ length: BODY_JOINT_COUNT }, () => new Vector3());

    /**
     * For each joint index, the joint index of the nearest mapped SKELETON
     * ancestor bone.  -1 when the bone has no mapped ancestor (root level).
     * Precomputed in {@link setBodyMesh} by walking the skeleton hierarchy.
     */
    private _jointParentJointIdx: number[] = new Array(BODY_JOINT_COUNT).fill(-1);

    /** Tracks which joint indices have a linked bone (for step 4b). */
    private _jointHasBone: boolean[] = new Array(BODY_JOINT_COUNT).fill(false);

    /** Bone → XR joint index lookup, built in {@link setBodyMesh}. */
    private _boneToJointIdx = new Map<Bone, number>();

    /** Original bind-pose local matrices for mapped bones. */
    private _mappedBoneBindLocals = new Map<Bone, Matrix>();

    /** Nearest mapped child bone for each mapped bone. */
    private _mappedChildBones = new Map<Bone, Bone>();

    /** Bind-space local child direction for each mapped bone. */
    private _bindLocalAimDirections = new Map<Bone, Vector3>();

    /**
     * XR joint index to aim each mapped bone at. This can be a mapped joint
     * (same as `_boneToJointIdx.get(aimChildBone)`) or an **unmapped** XR
     * joint whose tracked position is nonetheless useful for aim correction —
     * e.g. `LEFT_HAND_MIDDLE_METACARPAL` for `mixamorig:LeftHand`, which has
     * no mapped finger descendant but whose tracked position still defines
     * "where the hand is pointing".
     */
    private _boneAimTargetJointIdx = new Map<Bone, number>();

    /**
     * Per-mapped-bone bind-pose world rotation in mesh-local space
     * (decomposed from `bone.getFinalMatrix()` at bind time). Used by the
     * delta-from-bind retarget path (axis-convention-invariant).
     */
    private _bindBoneWorldRotMeshLocal = new Map<Bone, Quaternion>();

    /**
     * Bind-pose tracked joint rotation in mesh-local space per mapped joint.
     * Captured on the first tracked frame (or on demand via
     * {@link captureTrackedBind}). `null` until captured.
     */
    private _trackedBindDesiredFinalRot: Nullable<Quaternion[]> = null;

    /** Bind-pose tracked joint position (mesh-local), captured alongside rotation. */
    private _trackedBindDesiredFinalPos: Nullable<Vector3[]> = null;

    /** True once a tracked-bind snapshot has been taken. */
    private _hasTrackedBind = false;

    /**
     * When `true` (default), the first tracked frame after the feature
     * attaches is used as the "rest" pose for delta-from-bind retargeting.
     * Set to `false` to require an explicit {@link captureTrackedBind} call.
     */
    public autoCaptureBindOnFirstFrame = true;

    /** Scratch quaternion for retarget delta composition. */
    private _tempDeltaQuat = new Quaternion();
    private _tempBoneWorldRot = new Quaternion();
    private _tempParentNewWorldRotInv = new Quaternion();
    private _tempTrackedCurRot = new Quaternion();
    private _tempTrackedCurPos = new Vector3();
    private _tempBindLocalScale = new Vector3();
    private _tempBindLocalPos = new Vector3();
    /**
     * Per-bone cache of the current frame's computed world rotation.
     * Entries are pooled across frames (values are reused via `copyFrom`)
     * to avoid allocating a fresh Quaternion per mapped bone per frame.
     * A bone is considered "populated this frame" iff it has been visited
     * by the current retarget pass (tracked via `_computedBoneNewWorldRotFrameId`).
     */
    private _computedBoneNewWorldRot = new Map<Bone, Quaternion>();
    /** Per-bone marker: frame id at which the pooled rotation above was last set. */
    private _computedBoneNewWorldRotFrameId = new Map<Bone, number>();
    private _currentRetargetFrameId = 0;
    /** Scratch quaternion reused for the parent-world accumulation loop. */
    private _tempParentAccumRot = new Quaternion();
    /** Scratch quaternion reused for the parent-world intermediate product. */
    private _tempParentAccumTmp = new Quaternion();

    /** The skeleton reference for iterating bones in parent-first order. */
    private _skeleton: Nullable<import("../../Bones/skeleton").Skeleton> = null;

    /** Cached inverse of the skeleton mesh's world matrix. */
    private _meshWorldMatrixInverse = new Matrix();

    /** Cached inverse of the skeleton mesh pose matrix when initial skinning is used. */
    private _initialSkinMatrixInverse = new Matrix();

    /**
     * Pre-allocated desiredFinal matrices (one per joint slot).
     * `desiredFinal[i] = strip(xrWorld[i] × inv(meshWorld))` — the bone's
     * target skeleton-space final matrix with parasitic scale removed.
     */
    private _desiredFinals: Matrix[] = [];

    /**
     * Standalone TransformNodes created for unmapped skinned bones.
     * These TNs are initialized to the bone's bind-pose local and linked
     * so that `prepare()` reads deterministic values rather than the
     * original glTF scene-graph TNs (which we don't control).
     */
    private _unmappedBoneNodes: { bone: Bone; standaloneNode: TransformNode }[] = [];

    /** The mesh that owns the skeleton (used for world-matrix inverse). */
    private _skeletonMesh: Nullable<AbstractMesh> = null;

    /** The body mesh root (topmost parent), used to parent the mesh to the camera. */
    private _bodyMeshRoot: Nullable<Node> = null;

    /** The rigged body mesh, if any. */
    private _bodyMesh: Nullable<AbstractMesh> = null;

    /** Scale factor for local joint offsets. */
    private _jointScaleFactor: number;

    /** Whether mapped bones should keep their bind-pose local translations. */
    private readonly _preserveBindPoseBonePositions: boolean;

    /** Whether mapped bones should correct WebXR joint rotations using bind-space orientation offsets. */
    private readonly _useBoneOrientationOffsets: boolean;

    /** Per–XR-joint override mapping for aim children (used with _useBoneOrientationOffsets). */
    private _aimChildOverrides: Partial<Record<WebXRBodyJoint, WebXRBodyJoint>> | undefined;

    /**
     * Runtime-mutable rotation applied in each tracked joint's local frame to
     * re-base XR joint axes (e.g., "+Z-along-bone" → "+Y-along-bone").
     * `null` = identity / disabled.
     */
    public jointLocalRotationOffset: Nullable<Quaternion> = null;

    /** Cached 4×4 matrix form of {@link jointLocalRotationOffset} for the fast path. */
    private _jointLocalRotationOffsetMatrix = new Matrix();

    /** Temporary matrix used when applying {@link jointLocalRotationOffset}. */
    private _tempOffsetAppliedMatrix = new Matrix();

    /**
     * When true, bypass skeleton.prepare() and write skin matrices directly.
     * This is a diagnostic flag to help isolate rendering issues. When the
     * standard pipeline (TN → bone → prepare → skin matrices) produces
     * unexpected results, enabling this writes `absInvBind × final` directly
     * into the skeleton's transform matrix buffer.
     * @internal
     */
    public _directSkinWrite = false;

    /**
     * Debug info string from the last `updateFromXRFrame` call.
     * Useful for diagnosing tracking failures on-device.
     * @internal
     */
    public _lastDebugInfo: string = "TB:not called";

    /**
     * Get the current body mesh (if any).
     */
    public get bodyMesh(): Nullable<AbstractMesh> {
        return this._bodyMesh;
    }

    /**
     * Get or set the scale factor for local joint offsets.
     * @see {@link IWebXRBodyTrackingOptions.jointScaleFactor}
     */
    public get jointScaleFactor(): number {
        return this._jointScaleFactor;
    }

    public set jointScaleFactor(value: number) {
        this._jointScaleFactor = value;
    }

    /**
     * Returns the array of transform nodes representing each body joint.
     * The order matches {@link WebXRBodyTracking.AllBodyJoints}; use
     * {@link getJointTransform} or {@link getBodyPartTransforms} for
     * name-based lookup.
     *
     * Note: when a body mesh is attached, these transform nodes are also
     * used as the skeleton's link targets for mapped joints. In that case
     * the values held by mapped-joint nodes are skeleton-local (parent bone's
     * frame), not XR world-space. Unmapped-joint nodes always hold world-space
     * pose. If you need world-space poses for every joint regardless of
     * mapping, sample the bone matrices directly via the attached skeleton.
     */
    public get jointTransforms(): readonly TransformNode[] {
        return this._jointTransforms;
    }

    /**
     * Get the transform node for a specific body joint.
     * @param jointName The name of the body joint (from {@link WebXRBodyJoint}).
     * @returns The transform node corresponding to that joint, or `undefined` if not found.
     */
    public getJointTransform(jointName: WebXRBodyJoint): TransformNode | undefined {
        const idx = BodyJointNameToIndex.get(jointName);
        return idx !== undefined ? this._jointTransforms[idx] : undefined;
    }

    /**
     * Get all joint transform nodes that belong to a given body part.
     * @param part The body part to query.
     * @param result Optional pre-allocated array to fill (avoids per-call allocation).
     *   The array is cleared and populated with the results.
     * @returns An array of TransformNodes for that body part.
     */
    public getBodyPartTransforms(part: BodyPart, result?: TransformNode[]): TransformNode[] {
        const joints = BodyPartsDefinition[part];
        if (!result) {
            result = new Array<TransformNode>(joints.length);
        } else {
            result.length = joints.length;
        }
        for (let i = 0; i < joints.length; i++) {
            result[i] = this._jointTransforms[BodyJointNameToIndex.get(joints[i])!];
        }
        return result;
    }

    /**
     * Construct a new tracked body instance.
     * @param scene The Babylon.js scene.
     * @param bodyMesh Optional rigged body mesh to attach immediately.
     * @param rigMapping Optional mapping from WebXR joint names to skeleton bone names.
     * @param jointScaleFactor Scale factor for local joint offsets (default 1.0).
     * @param preserveBindPoseBonePositions Whether mapped bones should keep bind-pose local translations.
     * @param useBoneOrientationOffsets Whether mapped bones should correct XR joint rotations using bind-space offsets.
     * @param aimChildOverrides Per–XR-joint override for the aim child used with `useBoneOrientationOffsets`.
     * @param jointLocalRotationOffset Optional rotation re-basing each XR joint's local frame (e.g. Z-along-bone → Y-along-bone).
     */
    constructor(
        scene: Scene,
        bodyMesh?: AbstractMesh,
        rigMapping?: XRBodyMeshRigMapping,
        jointScaleFactor: number = 1.0,
        preserveBindPoseBonePositions: boolean = false,
        useBoneOrientationOffsets: boolean = false,
        aimChildOverrides?: Partial<Record<WebXRBodyJoint, WebXRBodyJoint>>,
        jointLocalRotationOffset?: Quaternion
    ) {
        this._scene = scene;
        this._jointScaleFactor = jointScaleFactor;
        this._preserveBindPoseBonePositions = preserveBindPoseBonePositions;
        this._useBoneOrientationOffsets = useBoneOrientationOffsets;
        this._aimChildOverrides = aimChildOverrides;
        if (jointLocalRotationOffset) {
            this.jointLocalRotationOffset = jointLocalRotationOffset.clone();
        }

        // Initialize a TransformNode for every body joint.
        for (let i = 0; i < BODY_JOINT_COUNT; i++) {
            this._jointTransforms[i] = new TransformNode(BodyJointReferenceArray[i], this._scene);
            this._jointTransforms[i].rotationQuaternion = new Quaternion();
        }

        if (bodyMesh) {
            this.setBodyMesh(bodyMesh, rigMapping);
        }
    }

    /**
     * Attach (or replace) a rigged body mesh.
     *
     * The mesh's skeleton bones are linked to the internal transform nodes
     * that receive WebXR tracking data each frame.  If the mesh has a skeleton,
     * the `rigMapping` (or a direct name match) is used to bind each bone.
     *
     * @param bodyMesh The rigged mesh to drive.
     * @param rigMapping An optional mapping from {@link WebXRBodyJoint} to bone name.
     *   If omitted, bones are expected to be named after the WebXR joint names.
     */
    public setBodyMesh(bodyMesh: AbstractMesh, rigMapping?: XRBodyMeshRigMapping): void {
        this._bodyMesh = bodyMesh;

        // Walk up to find the mesh root for parenting.
        this._bodyMeshRoot = this._bodyMesh;
        while (this._bodyMeshRoot.parent) {
            this._bodyMeshRoot = this._bodyMeshRoot.parent;
        }

        // Disable frustum culling on the body mesh and its children so
        // the mesh is never culled while the user is in XR.
        bodyMesh.alwaysSelectAsActiveMesh = true;
        for (const child of bodyMesh.getChildMeshes()) {
            child.alwaysSelectAsActiveMesh = true;
        }

        // Bind skeleton bones via linkTransformNode so that skeleton.prepare()
        // copies TransformNode data → bone local at the correct time (after
        // animations, before final matrix computation).
        // We also precompute which joints have bones and their nearest mapped
        // skeleton ancestor so we can write bone-local data onto the nodes.
        this._jointHasBone.fill(false);
        this._jointParentJointIdx.fill(-1);
        this._boneToJointIdx.clear();
        this._mappedBoneBindLocals.clear();
        this._mappedChildBones.clear();
        this._bindLocalAimDirections.clear();
        this._boneAimTargetJointIdx.clear();
        this._bindBoneWorldRotMeshLocal.clear();
        this._computedBoneNewWorldRot.clear();
        this._computedBoneNewWorldRotFrameId.clear();
        this._trackedBindDesiredFinalRot = null;
        this._trackedBindDesiredFinalPos = null;
        this._hasTrackedBind = false;
        this._skeleton = null;
        for (const { standaloneNode } of this._unmappedBoneNodes) {
            standaloneNode.dispose();
        }
        this._unmappedBoneNodes = [];
        this._skeletonMesh = null;
        let skeleton = this._bodyMesh.skeleton;
        let skeletonMesh: AbstractMesh | null = this._bodyMesh.skeleton ? this._bodyMesh : null;
        if (!skeleton) {
            for (const child of this._bodyMesh.getChildMeshes()) {
                if (child.skeleton) {
                    skeleton = child.skeleton;
                    skeletonMesh = child;
                    break;
                }
            }
        }
        if (skeleton) {
            this._skeletonMesh = skeletonMesh;
            this._skeleton = skeleton;

            skeleton.prepare(true);
            const bindPoseFinals = new Map<Bone, Matrix>();
            for (const bone of skeleton.bones) {
                bindPoseFinals.set(bone, bone.getFinalMatrix().clone());
            }

            // Step A: link transform nodes to bones
            for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                const jointName = BodyJointReferenceArray[i];
                const boneName = rigMapping ? rigMapping[jointName] : jointName;
                if (!boneName) {
                    continue;
                }
                const boneIdx = skeleton.getBoneIndexByName(boneName);
                if (boneIdx !== -1) {
                    const bone = skeleton.bones[boneIdx];
                    // Initialize the joint's TransformNode to the bone's current
                    // (bind-pose) local transform BEFORE linking, so the mesh
                    // stays in its bind pose until the first XR frame arrives.
                    // Without this the TN defaults (identity rotation, zero
                    // position, unit scale) would be copied into the bone's
                    // local on the next skeleton.prepare() and collapse the mesh.
                    const jointTransform = this._jointTransforms[i];
                    bone.getLocalMatrix().decompose(jointTransform.scaling, jointTransform.rotationQuaternion!, jointTransform.position);
                    bone.linkTransformNode(jointTransform);
                    this._jointHasBone[i] = true;
                    this._boneToJointIdx.set(bone, i);
                    this._mappedBoneBindLocals.set(bone, bone.getLocalMatrix().clone());
                }
            }

            const findMappedChildBone = (bone: Bone): Bone | null => {
                for (const child of bone.children) {
                    if (this._boneToJointIdx.has(child)) {
                        return child;
                    }
                    const descendant = findMappedChildBone(child);
                    if (descendant) {
                        return descendant;
                    }
                }
                return null;
            };

            const bindWorldPositions = new Map<Bone, Vector3>();
            const bindWorldRotations = new Map<Bone, Quaternion>();

            for (const bone of skeleton.bones) {
                const bindFinal = bindPoseFinals.get(bone);
                if (!bindFinal) {
                    continue;
                }
                bindFinal.decompose(this._tempScaleVector, this._tempRotQuat, this._tempPosVec);
                bindWorldPositions.set(bone, this._tempPosVec.clone());
                bindWorldRotations.set(bone, this._tempRotQuat.clone());
                // Persist bone bind-pose world rotation for delta-from-bind retarget.
                if (this._boneToJointIdx.has(bone)) {
                    this._bindBoneWorldRotMeshLocal.set(bone, this._tempRotQuat.clone());
                }
            }

            for (const bone of Array.from(this._boneToJointIdx.keys())) {
                // Prefer an explicit override (XR-joint → XR-joint) when provided.
                const selfJointIdx = this._boneToJointIdx.get(bone)!;
                const selfJointName = BodyJointReferenceArray[selfJointIdx] as WebXRBodyJoint;
                const overrideTargetJointName = this._aimChildOverrides?.[selfJointName];
                let childBone: Bone | null = null;
                let overrideTargetJointIdx = -1;
                if (overrideTargetJointName) {
                    overrideTargetJointIdx = BodyJointNameToIndex.get(overrideTargetJointName) ?? -1;
                    const overrideBoneName = rigMapping ? rigMapping[overrideTargetJointName] : overrideTargetJointName;
                    if (overrideBoneName) {
                        const overrideBoneIdx = skeleton.getBoneIndexByName(overrideBoneName);
                        if (overrideBoneIdx !== -1) {
                            const candidate = skeleton.bones[overrideBoneIdx];
                            if (this._boneToJointIdx.has(candidate)) {
                                childBone = candidate;
                            }
                        }
                    }
                }

                // Case A: override target is a MAPPED bone → use bind positions
                //   of both bones (as before).
                if (childBone) {
                    const boneBindPos = bindWorldPositions.get(bone);
                    const childBindPos = bindWorldPositions.get(childBone);
                    const bindWorldRotation = bindWorldRotations.get(bone);
                    if (boneBindPos && childBindPos && bindWorldRotation) {
                        childBindPos.subtractToRef(boneBindPos, this._tempDirection);
                        if (this._tempDirection.lengthSquared() > 1e-8) {
                            this._tempDirection.normalize();
                            Quaternion.InverseToRef(bindWorldRotation, this._tempRotQuat2);
                            this._tempDirection.rotateByQuaternionToRef(this._tempRotQuat2, this._tempLocalDirection);
                            if (this._tempLocalDirection.lengthSquared() > 1e-8) {
                                this._tempLocalDirection.normalize();
                                this._mappedChildBones.set(bone, childBone);
                                this._bindLocalAimDirections.set(bone, this._tempLocalDirection.clone());
                                this._boneAimTargetJointIdx.set(bone, this._boneToJointIdx.get(childBone)!);
                            }
                        }
                    }
                    continue;
                }

                // Case B: override target is an UNMAPPED XR joint (e.g.
                //   hand → middle metacarpal). Try to resolve it to a real
                //   unmapped descendant bone by name match so we can compute
                //   bind-local aim from the rig's own bind pose (the tracked
                //   bind pose of the user doesn't necessarily match the rig's
                //   bind orientation — using it would introduce a constant
                //   offset).
                if (overrideTargetJointIdx !== -1 && overrideTargetJointName) {
                    this._boneAimTargetJointIdx.set(bone, overrideTargetJointIdx);

                    // Extract significant tokens from target joint name.
                    // "LEFT_HAND_MIDDLE_METACARPAL" → ["middle", "metacarpal"]
                    const tokens = overrideTargetJointName
                        .toLowerCase()
                        .split(/[_\-\s]+/)
                        .filter((t) => t.length >= 4 && t !== "left" && t !== "right" && t !== "hand" && t !== "foot" && t !== "joint" && t !== "body");
                    // Find best-matching descendant bone: most tokens matched,
                    // prefer shorter names (closer to the target).
                    let bestDescendant: Bone | null = null;
                    let bestScore = 0;
                    const walk = (b: Bone): void => {
                        for (const child of b.children) {
                            if (!this._boneToJointIdx.has(child)) {
                                const lname = child.name.toLowerCase();
                                let score = 0;
                                for (const t of tokens) {
                                    if (lname.indexOf(t) !== -1) {
                                        score++;
                                    }
                                }
                                if (score > bestScore) {
                                    bestScore = score;
                                    bestDescendant = child;
                                }
                                walk(child);
                            }
                        }
                    };
                    walk(bone);

                    if (bestDescendant && bestScore > 0) {
                        const descendant: Bone = bestDescendant;
                        const boneBindPos = bindWorldPositions.get(bone);
                        // Walk up: descendant's bind world position isn't in
                        // bindWorldPositions (only mapped bones were added).
                        // Compute it from the final matrix captured at bind.
                        const descBindFinal = bindPoseFinals.get(descendant);
                        const bindWorldRotation = bindWorldRotations.get(bone);
                        if (boneBindPos && descBindFinal && bindWorldRotation) {
                            descBindFinal.decompose(undefined, undefined, this._tempPosVec);
                            this._tempPosVec.subtractToRef(boneBindPos, this._tempDirection);
                            if (this._tempDirection.lengthSquared() > 1e-8) {
                                this._tempDirection.normalize();
                                Quaternion.InverseToRef(bindWorldRotation, this._tempRotQuat2);
                                this._tempDirection.rotateByQuaternionToRef(this._tempRotQuat2, this._tempLocalDirection);
                                if (this._tempLocalDirection.lengthSquared() > 1e-8) {
                                    this._tempLocalDirection.normalize();
                                    this._bindLocalAimDirections.set(bone, this._tempLocalDirection.clone());
                                }
                            }
                        }
                    }
                    // If we couldn't find a descendant, bind aim will be
                    // computed from tracked-bind positions later (fallback).
                    continue;
                }

                // Case C: no override → auto-detect a mapped descendant.
                const autoChild = findMappedChildBone(bone);
                if (!autoChild) {
                    continue;
                }
                const boneBindPos = bindWorldPositions.get(bone);
                const childBindPos = bindWorldPositions.get(autoChild);
                const bindWorldRotation = bindWorldRotations.get(bone);
                if (!boneBindPos || !childBindPos || !bindWorldRotation) {
                    continue;
                }
                childBindPos.subtractToRef(boneBindPos, this._tempDirection);
                if (this._tempDirection.lengthSquared() < 1e-8) {
                    continue;
                }
                this._tempDirection.normalize();
                Quaternion.InverseToRef(bindWorldRotation, this._tempRotQuat2);
                this._tempDirection.rotateByQuaternionToRef(this._tempRotQuat2, this._tempLocalDirection);
                if (this._tempLocalDirection.lengthSquared() < 1e-8) {
                    continue;
                }
                this._tempLocalDirection.normalize();
                this._mappedChildBones.set(bone, autoChild);
                this._bindLocalAimDirections.set(bone, this._tempLocalDirection.clone());
                this._boneAimTargetJointIdx.set(bone, this._boneToJointIdx.get(autoChild)!);
            }

            // Step B: for each mapped bone, walk UP the skeleton hierarchy
            // to find the nearest ancestor bone that is also mapped to an
            // XR joint.  This lets us compute correct bone-local transforms
            // even when unmapped bones exist between two mapped ones.
            for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                if (!this._jointHasBone[i]) {
                    continue;
                }
                const bone = skeleton.bones[skeleton.getBoneIndexByName((rigMapping ? rigMapping[BodyJointReferenceArray[i]] : BodyJointReferenceArray[i])!)];
                let ancestor = bone.getParent();
                while (ancestor) {
                    const pIdx = this._boneToJointIdx.get(ancestor as Bone);
                    if (pIdx !== undefined) {
                        this._jointParentJointIdx[i] = pIdx;
                        break;
                    }
                    ancestor = ancestor.getParent();
                }
            }

            // Step C: pre-allocate desiredFinal matrices and compute
            // bind-pose finals (via skeleton.prepare) for unmapped bone setup.
            if (this._desiredFinals.length === 0) {
                for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                    this._desiredFinals.push(new Matrix());
                }
            }
            skeleton.prepare(true);

            // Step D: create standalone TNs for unmapped skinned bones.
            // Bones that influence vertices (_index >= 0) but aren't mapped to
            // any XR joint need standalone TNs so prepare() reads bind-pose
            // locals rather than the original glTF scene-graph TNs (which we
            // don't control).  During tracking, these bones keep their
            // bind-pose local and chain naturally with tracked parent finals —
            // their vertices follow the parent bone's motion.
            this._unmappedBoneNodes = [];
            for (const bone of skeleton.bones) {
                if (this._boneToJointIdx.has(bone)) {
                    continue; // mapped — handled by body tracking
                }
                const boneIndex = bone._index;
                if (boneIndex === -1 || boneIndex === null) {
                    continue; // unskinned (e.g. Armature)
                }
                // This bone influences vertices but isn't tracked by an XR joint.
                // Create a standalone TN with the bind-pose local so the bone
                // keeps its offset from its parent and follows parent motion.
                const tn = new TransformNode(`_xrUnmapped_${bone.name}`, skeleton.getScene());
                tn.rotationQuaternion = new Quaternion();
                // Initialize TN with the current (bind-pose) local
                bone.getLocalMatrix().decompose(tn.scaling, tn.rotationQuaternion, tn.position);
                bone.linkTransformNode(tn);
                this._unmappedBoneNodes.push({ bone, standaloneNode: tn });
            }
        }

        this.onBodyMeshSetObservable.notifyObservers(this);
    }

    /**
     * Update joint transforms from the current XR frame.
     *
     * This method is called once per frame by the feature class.  Internally it:
     * 1. Extracts all XRBodySpaces from the XRBody.
     * 2. Fills the transform-matrix buffer via `fillPoses()` (or per-joint fallback).
     * 3. Converts from WebXR right-handed to Babylon left-handed coordinates.
     * 4. Decomposes each matrix into the corresponding TransformNode.
     * 5. Parents the body mesh root to the XR camera so it tracks correctly.
     *
     * @param xrFrame The current XRFrame.
     * @param referenceSpace The XRReferenceSpace to resolve poses against.
     * @param xrCameraParent The parent node of the XR camera (used for parenting).
     * @returns `true` if valid tracking data was processed, `false` otherwise.
     */
    public updateFromXRFrame(xrFrame: XRFrame, referenceSpace: XRReferenceSpace, xrCameraParent: Nullable<Node>): boolean {
        const body: XRBody | undefined = xrFrame.body;
        if (!body) {
            this._lastDebugInfo = "no body";
            return false;
        }

        // ── Step 1: collect the body spaces in order ──────────────────────
        // Some UAs expose joints as direct properties on the body object in
        // addition to (or instead of) the Map-like .get() accessor — mirror
        // the same double-lookup hand tracking uses.
        const anyBody: any = body;
        let validSpaceCount = 0;
        for (let i = 0; i < BODY_JOINT_COUNT; i++) {
            const jointName = BodyJointReferenceArray[i];
            const space = anyBody[jointName] || body.get(jointName);
            this._jointSpaces[i] = space;
            if (space) {
                validSpaceCount++;
            }
        }

        if (validSpaceCount === 0) {
            this._lastDebugInfo = "0 spaces";
            if (this._bodyMesh) {
                this._bodyMesh.isVisible = false;
            }
            return false;
        }

        // ── Step 2: fill matrices (prefer batch API, fall back to per-joint) ──
        let trackingSuccessful = false;
        let fillPosesError = "";

        // Only use fillPoses when ALL joint spaces resolved — the batch API
        // does not tolerate undefined entries.  Wrap in try/catch because
        // fillPoses may not accept body-tracking spaces on every UA.
        if (validSpaceCount === BODY_JOINT_COUNT && xrFrame.fillPoses) {
            try {
                trackingSuccessful = xrFrame.fillPoses(this._jointSpaces as XRSpace[], referenceSpace, this._jointTransformMatrices);
                if (!trackingSuccessful) {
                    fillPosesError = "returned false";
                }
            } catch (e) {
                fillPosesError = "" + e;
                trackingSuccessful = false;
            }
        }

        // Fallback: query each joint individually via getPose().
        // Lenient — skips missing joints and succeeds as long as at least
        // one joint returned valid data.
        let getPoseCount = 0;
        let getPoseNullCount = 0;
        if (!trackingSuccessful) {
            let anyJointTracked = false;
            for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                const space = this._jointSpaces[i];
                if (!space) {
                    continue;
                }
                const pose = xrFrame.getPose(space, referenceSpace);
                if (pose) {
                    this._jointTransformMatrices.set(pose.transform.matrix, i * 16);
                    anyJointTracked = true;
                    getPoseCount++;
                } else {
                    getPoseNullCount++;
                }
            }
            trackingSuccessful = anyJointTracked;
        }

        this._lastDebugInfo = "spaces:" + validSpaceCount + " fillPoses:" + fillPosesError + " getPose:" + getPoseCount + "/" + getPoseNullCount + " ok:" + trackingSuccessful;

        if (!trackingSuccessful) {
            if (this._bodyMesh) {
                this._bodyMesh.isVisible = false;
            }
            return false;
        }

        this._processTrackedJointMatrices(xrCameraParent);
        return true;
    }

    /**
     * Replay a pre-captured joint matrix set through the retargeting
     * pipeline as if it had just been delivered by an XR frame.
     *
     * Useful for headset-less testing: call with a snapshot captured via
     * {@link snapshotFrame} (the `jointMatricesRHS` array, or `jointMatricesLHS`
     * already flipped). The matrices are assumed to be RHS unless
     * `isAlreadyLhs=true`, in which case the RHS→LHS flip step is skipped.
     *
     * @param rawMatrices Float32Array of BODY_JOINT_COUNT × 16 (= 1328) floats.
     * @param isAlreadyLhs Set to `true` if matrices are already LHS-converted.
     */
    public replayRawJointMatrices(rawMatrices: Float32Array | number[], isAlreadyLhs: boolean = false): void {
        const src = rawMatrices instanceof Float32Array ? rawMatrices : new Float32Array(rawMatrices);
        const expectedLen = BODY_JOINT_COUNT * 16;
        if (src.length !== expectedLen) {
            Logger.Warn("WebXR Body Tracking: replayRawJointMatrices expected " + expectedLen + " floats, got " + src.length);
            return;
        }
        this._jointTransformMatrices.set(src);
        this._processTrackedJointMatrices(null, /*skipRhsToLhs*/ isAlreadyLhs);
    }

    /**
     * Run steps 2.5 → 5 of the retargeting pipeline using whatever is
     * currently in `_jointTransformMatrices` (as if the WebXR API just
     * filled it for the current frame).
     * @param xrCameraParent Parent node of the XR camera (used to parent the body mesh root during live XR).
     * @param skipRhsToLhs If true, skip the RHS→LHS flip (matrices are already in the scene's handedness).
     */
    private _processTrackedJointMatrices(xrCameraParent: Nullable<Node>, skipRhsToLhs: boolean = false): void {
        // ── Step 2.5: re-base joint local axes (optional) ────────────────
        // If jointLocalRotationOffset is set, right-multiply every joint's
        // world matrix by its 4×4 form. Under Babylon's row-vector convention
        // (`v_world = v_local × M`), `M_new = R × M` re-bases the joint-local
        // frame so that what used to be along `R⁻¹·x` is now along `x`.
        // Typical use: convert "+Z-along-bone" XR data to "+Y-along-bone" via
        // `Quaternion.RotationAxis(Vector3.Right(), -Math.PI / 2)`.
        if (this.jointLocalRotationOffset) {
            Matrix.FromQuaternionToRef(this.jointLocalRotationOffset, this._jointLocalRotationOffsetMatrix);
            for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                const o = i * 16;
                Matrix.FromArrayToRef(this._jointTransformMatrices, o, this._tempJointMatrix);
                this._jointLocalRotationOffsetMatrix.multiplyToRef(this._tempJointMatrix, this._tempOffsetAppliedMatrix);
                this._tempOffsetAppliedMatrix.copyToArray(this._jointTransformMatrices, o);
            }
        }

        // ── Step 3: RHS → LHS coordinate conversion ──────────────────────
        // WebXR delivers right-handed matrices.  When Babylon is running in
        // its default left-handed mode we negate the Z-related components of
        // every column-major 4 × 4 matrix in-place.
        //
        // Column-major layout (indices 0-15):
        //   [ m00  m10  m20  m30 ]     indices 0  1  2  3
        //   [ m01  m11  m21  m31 ]     indices 4  5  6  7
        //   [ m02  m12  m22  m32 ]     indices 8  9  10 11
        //   [ m03  m13  m23  m33 ]     indices 12 13 14 15
        //
        // Negated indices: 2, 6, 8, 9, 14  (third row + translation Z)
        // Always keep a copy of the pre-flip (raw RHS) matrices so that
        // `snapshotFrame()` always has them available, regardless of the
        // scene handedness or the `skipRhsToLhs` flag.
        this._jointTransformMatricesRHS.set(this._jointTransformMatrices);
        if (!skipRhsToLhs && !this._scene.useRightHandedSystem) {
            for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                const o = i * 16;
                this._jointTransformMatrices[o + 2] *= -1;
                this._jointTransformMatrices[o + 6] *= -1;
                this._jointTransformMatrices[o + 8] *= -1;
                this._jointTransformMatrices[o + 9] *= -1;
                this._jointTransformMatrices[o + 14] *= -1;
            }
        }

        // ── Step 4: decompose world-space matrices into TransformNodes ─────
        // For unmapped joints, TransformNodes hold world-space pose for
        // consumers (e.g., debug boxes).  For mapped joints (linked to
        // skeleton bones), we overwrite with bone-local data in step 4b.
        for (let i = 0; i < BODY_JOINT_COUNT; i++) {
            if (!this._jointHasBone[i]) {
                const jointTransform = this._jointTransforms[i];
                Matrix.FromArrayToRef(this._jointTransformMatrices, i * 16, this._tempJointMatrix);
                this._tempJointMatrix.decompose(undefined, jointTransform.rotationQuaternion!, jointTransform.position);
            }
        }

        // ── Step 4b: compute bone-local transforms via desiredFinals ──────
        // For every mapped joint we compute the target skeleton-space final:
        //   desiredFinal = strip(xrWorld × inv(meshWorld))
        // All desiredFinals are in the same space (skeleton space), so
        // locals derived from them have consistent units and scale.
        // We then iterate ALL skeleton bones in array order (parents first)
        // and compute each bone's local as:
        //   mapped bone:   local = desiredFinal × inv(parentBone.final)
        //   unmapped bone: local unchanged (bind-pose), chain with parent final
        if (this._skeletonMesh && this._skeleton) {
            this._skeletonMesh.getWorldMatrix().invertToRef(this._meshWorldMatrixInverse);
            const scaleFactor = this._jointScaleFactor;
            const useInitialSkinMatrix = this._skeleton.needInitialSkinMatrix;
            const useBoneOrientationOffsets = this._useBoneOrientationOffsets;
            const computedWorldRotations = useBoneOrientationOffsets ? new Map<Bone, Quaternion>() : null;

            if (useInitialSkinMatrix) {
                this._skeletonMesh.getPoseMatrix().invertToRef(this._initialSkinMatrixInverse);
            }

            // Pass 1: compute desiredFinals for all mapped joints.
            for (let i = 0; i < BODY_JOINT_COUNT; i++) {
                if (!this._jointHasBone[i]) {
                    continue;
                }
                Matrix.FromArrayToRef(this._jointTransformMatrices, i * 16, this._tempJointMatrix);
                this._tempJointMatrix.multiplyToRef(this._meshWorldMatrixInverse, this._desiredFinals[i]);
                // Strip parasitic scale from inv(meshWorld) to ±1.
                this._desiredFinals[i].decompose(this._tempScaleVector, this._tempRotQuat, this._tempPosVec);
                this._tempScaleVector.set(Math.sign(this._tempScaleVector.x) || 1, Math.sign(this._tempScaleVector.y) || 1, Math.sign(this._tempScaleVector.z) || 1);
                Matrix.ComposeToRef(this._tempScaleVector, this._tempRotQuat, this._tempPosVec, this._desiredFinals[i]);
                this._desiredFinalPositions[i].copyFrom(this._tempPosVec);
            }

            // Pass 1b: compute mesh-local positions for any UNMAPPED XR joints
            // that are referenced as aim targets (e.g. hand → middle metacarpal).
            // Rotations are not needed for these joints — only positions.
            // Use Map.forEach to avoid allocating an array and to stay within the ES5
            // target's iteration rules.
            this._boneAimTargetJointIdx.forEach((targetIdx) => {
                if (this._jointHasBone[targetIdx]) {
                    return; // position already filled above.
                }
                Matrix.FromArrayToRef(this._jointTransformMatrices, targetIdx * 16, this._tempJointMatrix);
                this._tempJointMatrix.multiplyToRef(this._meshWorldMatrixInverse, this._tempLocalMatrix);
                this._tempLocalMatrix.decompose(undefined, undefined, this._desiredFinalPositions[targetIdx]);
            });

            // Auto-capture bind on first frame when enabled.
            if (!this._hasTrackedBind && this.autoCaptureBindOnFirstFrame) {
                this._captureTrackedBindFromDesiredFinals();
            }

            if (this._hasTrackedBind && this._trackedBindDesiredFinalRot && this._trackedBindDesiredFinalPos) {
                // ── Pass 2 (primary): delta-from-bind retargeting ─────────
                // Axis-convention-invariant. For every mapped bone:
                //   deltaMeshLocalRot[j] = trackedBindDesiredRot[j]⁻¹ × trackedCurrentDesiredRot[j]
                //   newBoneWorldRot[b]   = bindBoneWorldRot[b] × deltaMeshLocalRot[j(b)]
                //   newBoneLocalRot[b]   = newBoneWorldRot[b] × newBoneParentWorldRot[b]⁻¹
                this._retargetDeltaFromBind(scaleFactor);
                // Unmapped bones: chain bind-pose local × parent final.
                for (const bone of this._skeleton.bones) {
                    if (this._boneToJointIdx.has(bone)) {
                        continue;
                    }
                    const parentBone = bone.getParent();
                    if (parentBone) {
                        bone.getLocalMatrix().multiplyToRef(parentBone.getFinalMatrix(), bone.getFinalMatrix());
                    } else {
                        bone.getFinalMatrix().copyFrom(bone.getLocalMatrix());
                    }
                }
            } else {
                // ── Pass 2 (fallback): direct retarget ─────────────────────
                // Used before a tracked bind has been captured (e.g. during
                // the first frame with autoCaptureBindOnFirstFrame=false).
                this._retargetDirect(useInitialSkinMatrix, useBoneOrientationOffsets, scaleFactor, computedWorldRotations);
            }

            // ── Step 4c (diagnostic): direct skin matrix write ───────────
            // When _directSkinWrite is enabled, write absInvBind × final
            // directly into the skeleton's transform matrix buffer, bypassing
            // the normal TN → bone → prepare() → skin matrix pipeline.
            if (this._directSkinWrite) {
                const skinMatrices = this._skeleton.getTransformMatrices(this._skeletonMesh);
                if (skinMatrices) {
                    for (const bone of this._skeleton.bones) {
                        const bIdx = bone._index;
                        if (bIdx === -1 || bIdx === null) {
                            continue;
                        }
                        const mappedIndex = bIdx;
                        bone.getAbsoluteInverseBindMatrix().multiplyToArray(bone.getFinalMatrix(), skinMatrices, mappedIndex * 16);
                    }
                }
            }
        }

        // ── Step 5: parent the mesh to the XR camera ─────────────────────
        if (this._bodyMesh) {
            this._bodyMesh.isVisible = true;
            if (this._bodyMeshRoot && xrCameraParent) {
                this._bodyMeshRoot.parent = xrCameraParent;
            }
        }
    }

    /**
     * Capture the current tracked-joint desired-final rotations and positions
     * as the "rest pose" for delta-from-bind retargeting.
     *
     * Delta-from-bind is the production retarget path: every subsequent
     * frame is interpreted as a rotation delta from this snapshot, which
     * makes retargeting invariant to the XR-joint axis convention and to
     * any skeletal-proportion differences between the tracked user and the
     * avatar.
     *
     * Call this after the user assumes a known rest pose (e.g. T-pose,
     * A-pose, arms-at-sides). By default the feature auto-captures on the
     * first tracked frame — disable via {@link autoCaptureBindOnFirstFrame}.
     */
    public captureTrackedBind(): void {
        this._captureTrackedBindFromDesiredFinals();
    }

    /**
     * Clear any captured bind, reverting subsequent frames to the fallback
     * direct-retarget path (or re-triggering auto-capture on the next frame).
     */
    public clearTrackedBind(): void {
        this._hasTrackedBind = false;
    }

    /** Internal: copy current desiredFinals into the tracked-bind slots. */
    private _captureTrackedBindFromDesiredFinals(): void {
        if (!this._trackedBindDesiredFinalRot) {
            this._trackedBindDesiredFinalRot = Array.from({ length: BODY_JOINT_COUNT }, () => new Quaternion());
            this._trackedBindDesiredFinalPos = Array.from({ length: BODY_JOINT_COUNT }, () => new Vector3());
        }
        for (let i = 0; i < BODY_JOINT_COUNT; i++) {
            if (!this._jointHasBone[i]) {
                continue;
            }
            this._desiredFinals[i].decompose(undefined, this._tempRotQuat, this._tempPosVec);
            this._trackedBindDesiredFinalRot[i].copyFrom(this._tempRotQuat);
            this._trackedBindDesiredFinalPos![i].copyFrom(this._tempPosVec);
        }

        // Also capture positions for aim-target joints that aren't mapped
        // (e.g. hand's middle metacarpal). These are only needed for the
        // positional aim-correction reference.
        for (const targetIdx of Array.from(this._boneAimTargetJointIdx.values())) {
            if (this._jointHasBone[targetIdx]) {
                continue;
            }
            this._trackedBindDesiredFinalPos![targetIdx].copyFrom(this._desiredFinalPositions[targetIdx]);
        }

        // For any bone whose aim target is UNMAPPED and therefore wasn't
        // resolved at setBodyMesh time, compute its bind-local aim direction
        // now — using tracked bind positions for both endpoints and the
        // bone's bind-world rotation as the frame.
        for (const [bone, targetIdx] of Array.from(this._boneAimTargetJointIdx)) {
            if (this._bindLocalAimDirections.has(bone)) {
                continue;
            }
            const selfJointIdx = this._boneToJointIdx.get(bone);
            const bindWorldRot = this._bindBoneWorldRotMeshLocal.get(bone);
            if (selfJointIdx === undefined || !bindWorldRot) {
                continue;
            }
            this._trackedBindDesiredFinalPos![targetIdx].subtractToRef(this._trackedBindDesiredFinalPos![selfJointIdx], this._tempDirection);
            if (this._tempDirection.lengthSquared() < 1e-8) {
                continue;
            }
            this._tempDirection.normalize();
            Quaternion.InverseToRef(bindWorldRot, this._tempRotQuat2);
            this._tempDirection.rotateByQuaternionToRef(this._tempRotQuat2, this._tempLocalDirection);
            if (this._tempLocalDirection.lengthSquared() < 1e-8) {
                continue;
            }
            this._tempLocalDirection.normalize();
            this._bindLocalAimDirections.set(bone, this._tempLocalDirection.clone());
        }

        this._hasTrackedBind = true;
    }

    /**
     * Delta-from-bind retarget: axis-convention-invariant.
     *
     * For each mapped bone in skeleton order (parents first):
     *   let j = joint mapped to this bone
     *   deltaMeshLocalRot  = bindTracked[j]⁻¹ × currentTracked[j]     (right-side in row-vector)
     *   newBoneWorldRot    = bindBoneWorldRot × deltaMeshLocalRot
     *   newBoneLocalRot    = newBoneWorldRot × parentNewBoneWorldRot⁻¹
     *
     * Positions: root bone receives tracked world delta (so the avatar
     * translates with the user). All other mapped bones keep their rig's
     * bind-pose local translation to preserve segment lengths.
     * @param scaleFactor Additional scale applied to joint local positions.
     */
    private _retargetDeltaFromBind(scaleFactor: number): void {
        if (!this._skeleton || !this._trackedBindDesiredFinalRot || !this._trackedBindDesiredFinalPos) {
            return;
        }
        // Bump the frame id so pooled per-bone rotations are treated as stale.
        // The Quaternion instances themselves are reused across frames (no allocations).
        this._currentRetargetFrameId++;

        for (const bone of this._skeleton.bones) {
            const parentBone = bone.getParent();
            const jointIdx = this._boneToJointIdx.get(bone);

            if (jointIdx === undefined) {
                // Unmapped bones are handled by the caller.
                continue;
            }

            const jointTransform = this._jointTransforms[jointIdx];
            const bindBoneWorldRot = this._bindBoneWorldRotMeshLocal.get(bone);
            if (!bindBoneWorldRot) {
                continue;
            }

            // Current tracked rotation/position in mesh-local (already in _desiredFinals).
            this._desiredFinals[jointIdx].decompose(undefined, this._tempTrackedCurRot, this._tempTrackedCurPos);

            // Babylon Quaternion multiplication is column-vector Hamilton:
            //   worldQ = parentWorldQ.multiply(localQ)   (== parent * local)
            //
            // World-frame delta joint rotation:
            //   deltaWorld = curJointWorld * bindJointWorld⁻¹
            Quaternion.InverseToRef(this._trackedBindDesiredFinalRot[jointIdx], this._tempRotQuat2);
            this._tempTrackedCurRot.multiplyToRef(this._tempRotQuat2, this._tempDeltaQuat);

            // Apply world delta to bone's bind world rotation:
            //   newBoneWorld = deltaWorld * boneBindWorld
            this._tempDeltaQuat.multiplyToRef(bindBoneWorldRot, this._tempBoneWorldRot);
            this._tempBoneWorldRot.normalize();

            // ── Aim correction (positional) ─────────────────────────────
            // Meta's emitted rotation for some joints (notably the
            // forearm, LEFT/RIGHT_ARM_LOWER) is unreliable: the cameras
            // frequently report a rotation that makes the forearm bone
            // align with the upper arm, so the elbow "raises" but the
            // forearm does not bend when the user lifts/rotates a hand.
            //
            // The tracked *positions*, however, are accurate. We re-aim
            // the bone so that the bind-time local aim axis (bone →
            // child bone) ends up pointing along the live (childJoint −
            // selfJoint) direction in mesh-local space. This is a single
            // shortest-arc rotation applied to the world rotation before
            // it is chained into children.
            if (this._useBoneOrientationOffsets) {
                const targetIdx = this._boneAimTargetJointIdx.get(bone);
                const bindLocalAim = this._bindLocalAimDirections.get(bone);
                if (bindLocalAim && targetIdx !== undefined) {
                    // Desired aim direction in mesh-local (tracked positions).
                    this._desiredFinalPositions[targetIdx].subtractToRef(this._desiredFinalPositions[jointIdx], this._tempDirection);
                    if (this._tempDirection.lengthSquared() > 1e-8) {
                        this._tempDirection.normalize();
                        // Current aim direction in mesh-local: rotate bind-local aim by newBoneWorld.
                        bindLocalAim.rotateByQuaternionToRef(this._tempBoneWorldRot, this._tempLocalDirection);
                        if (this._tempLocalDirection.lengthSquared() > 1e-8) {
                            this._tempLocalDirection.normalize();
                            // Correction: shortest-arc rotation taking current aim → desired aim.
                            Quaternion.FromUnitVectorsToRef(this._tempLocalDirection, this._tempDirection, this._tempRotQuat2);
                            // Apply correction in world space (pre-multiply column-vector).
                            this._tempRotQuat2.multiplyToRef(this._tempBoneWorldRot, this._tempDeltaQuat);
                            this._tempBoneWorldRot.copyFrom(this._tempDeltaQuat);
                            this._tempBoneWorldRot.normalize();
                        }
                    }
                }
            }

            // Store for children's parent lookup (reuse pooled quaternion).
            let pooled = this._computedBoneNewWorldRot.get(bone);
            if (!pooled) {
                pooled = new Quaternion();
                this._computedBoneNewWorldRot.set(bone, pooled);
            }
            pooled.copyFrom(this._tempBoneWorldRot);
            this._computedBoneNewWorldRotFrameId.set(bone, this._currentRetargetFrameId);

            // Parent's new world rotation: either the directly-computed
            // mapped parent's rotation, or the closest mapped ancestor's
            // rotation chained through any unmapped intermediates' bind
            // local rotations.
            let parentNewWorldRot: Quaternion | null = null;
            if (parentBone) {
                const directMapped =
                    this._computedBoneNewWorldRotFrameId.get(parentBone) === this._currentRetargetFrameId ? this._computedBoneNewWorldRot.get(parentBone) : undefined;
                if (directMapped) {
                    parentNewWorldRot = directMapped;
                } else {
                    // Walk up to nearest mapped ancestor. Chain any
                    // unmapped intermediates' bind local rotations:
                    //   effectiveParentWorld = mappedAncestorNewWorld * child1Local * child2Local * ... * parentBoneLocal
                    // (column-vector composition).
                    const accum = this._tempParentAccumRot;
                    accum.set(0, 0, 0, 1);
                    let cursor: Bone | null = parentBone;
                    while (cursor) {
                        const mapped = this._computedBoneNewWorldRotFrameId.get(cursor) === this._currentRetargetFrameId ? this._computedBoneNewWorldRot.get(cursor) : undefined;
                        if (mapped) {
                            // mapped * accum, where accum is the local chain below.
                            mapped.multiplyToRef(accum, this._tempParentAccumTmp);
                            accum.copyFrom(this._tempParentAccumTmp);
                            parentNewWorldRot = accum;
                            break;
                        }
                        cursor.getLocalMatrix().decompose(undefined, this._tempRotQuat2, undefined);
                        // accum = localCursor * accum (column-vector: cursor's local applied to child chain)
                        this._tempRotQuat2.multiplyToRef(accum, this._tempParentAccumTmp);
                        accum.copyFrom(this._tempParentAccumTmp);
                        cursor = cursor.getParent();
                    }
                }
            }

            // newBoneLocal = parentNewWorldInv * newBoneWorld
            if (parentNewWorldRot) {
                Quaternion.InverseToRef(parentNewWorldRot, this._tempParentNewWorldRotInv);
                this._tempParentNewWorldRotInv.multiplyToRef(this._tempBoneWorldRot, jointTransform.rotationQuaternion!);
            } else {
                jointTransform.rotationQuaternion!.copyFrom(this._tempBoneWorldRot);
            }
            jointTransform.rotationQuaternion!.normalize();

            // Position/scale: preserve rig's bind-local values. Root bone
            // additionally receives the tracked-position delta so the avatar
            // translates with the user.
            const bindLocal = this._mappedBoneBindLocals.get(bone);
            if (bindLocal) {
                bindLocal.decompose(this._tempBindLocalScale, undefined, this._tempBindLocalPos);
                jointTransform.scaling.copyFrom(this._tempBindLocalScale);
                jointTransform.position.copyFrom(this._tempBindLocalPos);
            }

            if (!parentNewWorldRot) {
                // Root: add tracked mesh-local position delta to bind local.
                const bindTrackedPos = this._trackedBindDesiredFinalPos[jointIdx];
                jointTransform.position.addInPlace(this._tempTrackedCurPos).subtractInPlace(bindTrackedPos);
            }

            if (scaleFactor !== 1.0) {
                jointTransform.position.scaleInPlace(scaleFactor);
            }

            // Compose and chain final.
            Matrix.ComposeToRef(jointTransform.scaling, jointTransform.rotationQuaternion!, jointTransform.position, this._tempLocalMatrix);
            if (parentBone) {
                this._tempLocalMatrix.multiplyToRef(parentBone.getFinalMatrix(), bone.getFinalMatrix());
            } else {
                bone.getFinalMatrix().copyFrom(this._tempLocalMatrix);
            }
        }
    }

    /**
     * Legacy direct-retarget path (pre-bind-capture). Kept as fallback.
     * @param useInitialSkinMatrix Skeleton needs initial-skin-matrix chaining for the root.
     * @param useBoneOrientationOffsets Apply aim-direction correction per mapped bone.
     * @param scaleFactor Additional scale applied to joint local positions.
     * @param computedWorldRotations Optional map used by the aim-correction path for parent lookups.
     */
    private _retargetDirect(useInitialSkinMatrix: boolean, useBoneOrientationOffsets: boolean, scaleFactor: number, computedWorldRotations: Nullable<Map<Bone, Quaternion>>): void {
        if (!this._skeleton || !this._skeletonMesh) {
            return;
        }
        for (const bone of this._skeleton.bones) {
            const parentBone = bone.getParent();
            const jointIdx = this._boneToJointIdx.get(bone);

            if (jointIdx !== undefined) {
                const jointTransform = this._jointTransforms[jointIdx];
                if (parentBone) {
                    parentBone.getFinalMatrix().invertToRef(this._tempParentMatrix);
                    this._desiredFinals[jointIdx].multiplyToRef(this._tempParentMatrix, this._tempLocalMatrix);
                } else {
                    if (useInitialSkinMatrix) {
                        this._desiredFinals[jointIdx].multiplyToRef(this._initialSkinMatrixInverse, this._tempLocalMatrix);
                    } else {
                        this._tempLocalMatrix.copyFrom(this._desiredFinals[jointIdx]);
                    }
                }
                this._tempLocalMatrix.decompose(jointTransform.scaling, jointTransform.rotationQuaternion!, jointTransform.position);

                if (useBoneOrientationOffsets) {
                    const childBone = this._mappedChildBones.get(bone);
                    const bindLocalAimDirection = this._bindLocalAimDirections.get(bone);
                    const childJointIdx = childBone ? this._boneToJointIdx.get(childBone) : undefined;

                    if (bindLocalAimDirection && childJointIdx !== undefined) {
                        this._desiredFinalPositions[childJointIdx].subtractToRef(this._desiredFinalPositions[jointIdx], this._tempDirection);
                        if (this._tempDirection.lengthSquared() > 1e-8) {
                            this._tempDirection.normalize();
                            this._desiredFinals[jointIdx].decompose(this._tempScaleVector, this._tempRotQuat, this._tempPosVec);
                            Quaternion.InverseToRef(this._tempRotQuat, this._tempRotQuat2);
                            this._tempDirection.rotateByQuaternionToRef(this._tempRotQuat2, this._tempLocalDirection);
                            if (this._tempLocalDirection.lengthSquared() > 1e-8) {
                                this._tempLocalDirection.normalize();
                                Quaternion.FromUnitVectorsToRef(bindLocalAimDirection, this._tempLocalDirection, this._tempRotQuat2);
                                this._tempRotQuat.multiplyToRef(this._tempRotQuat2, this._tempRotQuat);

                                if (parentBone) {
                                    const parentWorldRotation = computedWorldRotations?.get(parentBone);
                                    if (parentWorldRotation) {
                                        Quaternion.InverseToRef(parentWorldRotation, this._tempRotQuat2);
                                        this._tempRotQuat.multiplyToRef(this._tempRotQuat2, jointTransform.rotationQuaternion!);
                                    } else {
                                        jointTransform.rotationQuaternion!.copyFrom(this._tempRotQuat);
                                    }
                                } else if (useInitialSkinMatrix) {
                                    this._skeletonMesh.getPoseMatrix().decompose(this._tempScaleVector, this._tempRotQuat2, this._tempPosVec);
                                    Quaternion.InverseToRef(this._tempRotQuat2, this._tempRotQuat2);
                                    this._tempRotQuat.multiplyToRef(this._tempRotQuat2, jointTransform.rotationQuaternion!);
                                } else {
                                    jointTransform.rotationQuaternion!.copyFrom(this._tempRotQuat);
                                }
                                jointTransform.rotationQuaternion!.normalize();
                            }
                        }
                    }
                }

                if (this._preserveBindPoseBonePositions) {
                    const bindLocal = this._mappedBoneBindLocals.get(bone);
                    if (bindLocal) {
                        bindLocal.decompose(this._tempScaleVector, this._tempRotQuat, this._tempPosVec);
                        jointTransform.scaling.copyFrom(this._tempScaleVector);
                        if (parentBone) {
                            jointTransform.position.copyFrom(this._tempPosVec);
                        }
                    }
                }

                if (scaleFactor !== 1.0) {
                    jointTransform.position.scaleInPlace(scaleFactor);
                }

                Matrix.ComposeToRef(jointTransform.scaling, jointTransform.rotationQuaternion!, jointTransform.position, this._tempLocalMatrix);
                if (parentBone) {
                    this._tempLocalMatrix.multiplyToRef(parentBone.getFinalMatrix(), bone.getFinalMatrix());
                } else {
                    bone.getFinalMatrix().copyFrom(this._tempLocalMatrix);
                }

                if (computedWorldRotations) {
                    bone.getFinalMatrix().decompose(this._tempScaleVector, this._tempRotQuat, this._tempPosVec);
                    computedWorldRotations.set(bone, this._tempRotQuat.clone());
                }
            } else {
                // Unmapped bone: chain bind-pose local × parent final.
                if (parentBone) {
                    bone.getLocalMatrix().multiplyToRef(parentBone.getFinalMatrix(), bone.getFinalMatrix());
                } else {
                    bone.getFinalMatrix().copyFrom(bone.getLocalMatrix());
                }
            }
        }
    }

    /**
     * Capture a snapshot of the current frame's raw XR joint matrices and
     * skeleton metadata.  Returns a JSON string that can be used offline to
     * replay / debug bone-local computation without a headset.
     *
     * The snapshot includes:
     * - `jointMatricesRHS` – 83 × 16 raw RHS matrices (before LHS conversion)
     * - `jointMatricesLHS` – 83 × 16 LHS-converted matrices (after step 3)
     * - `meshWorldMatrix` – 16 floats, the skeleton mesh's world matrix (if any)
     * - `jointHasBone` – boolean[83], which joints are mapped to bones
     * - `jointParentJointIdx` – number[83], mapped ancestor for each joint
     * - `useRightHandedSystem` – scene handedness setting
     * - `jointNames` – the 83 joint names in order
     *
     * @returns A JSON string with the snapshot data.
     */
    public snapshotFrame(): string {
        const data = {
            jointMatricesRHS: Array.from(this._jointTransformMatricesRHS).map((x) => +x.toFixed(3)), // round for readability
            jointMatricesLHS: Array.from(this._jointTransformMatrices).map((x) => +x.toFixed(3)),
            meshWorldMatrix: this._skeletonMesh ? Array.from(this._skeletonMesh.getWorldMatrix().toArray()).map((x) => +x.toFixed(3)) : null,
            jointHasBone: Array.from(this._jointHasBone),
            jointParentJointIdx: Array.from(this._jointParentJointIdx),
            useRightHandedSystem: this._scene.useRightHandedSystem,
            jointNames: BodyJointReferenceArray.slice(),
        };
        return JSON.stringify(data);
    }

    /**
     * Capture a snapshot and copy it to the system clipboard.
     * Logs to the console on success or failure.
     * @returns A promise that resolves when the copy completes.
     */
    public async snapshotFrameToClipboardAsync(): Promise<void> {
        const json = this.snapshotFrame();
        // compress the string by removing whitespace (makes it less human-readable but more compact for clipboard)
        // also remove 0. padding from numbers (e.g. "0.123" → ".123") to further reduce size, since the leading zero is not needed for parsing.
        const compressed = json.replace(/\s+/g, "").replace(/:0\.(\d+)/g, ":.$1");
        try {
            await navigator.clipboard.writeText(compressed);
            Logger.Log("WebXR Body Tracking: snapshot copied to clipboard (" + compressed.length + " chars)");
        } catch (e) {
            Logger.Warn("WebXR Body Tracking: clipboard write failed: " + e + " — logging snapshot to console instead");
            // eslint-disable-next-line no-console
            console.log(compressed);
        }
    }

    /**
     * Dispose of this tracked body and its resources.
     * @param disposeMesh If `true`, the body mesh and its skeleton are disposed as well.
     */
    public dispose(disposeMesh = false): void {
        if (this._bodyMesh) {
            if (disposeMesh) {
                this._bodyMesh.skeleton?.dispose();
                this._bodyMesh.dispose(false, true);
            } else {
                this._bodyMesh.isVisible = false;
            }
        }
        for (const transform of this._jointTransforms) {
            transform.dispose();
        }
        this._jointTransforms.length = 0;
        for (const { standaloneNode } of this._unmappedBoneNodes) {
            standaloneNode.dispose();
        }
        this._unmappedBoneNodes = [];
        this._boneToJointIdx.clear();
        this._skeleton = null;
        this._jointHasBone.fill(false);
        this._jointParentJointIdx.fill(-1);
        this._skeletonMesh = null;
        this.onBodyMeshSetObservable.clear();
    }
}

// ────────────────────────────────────────────────────────────────────────────
// WebXRBodyTracking — the feature class
// ────────────────────────────────────────────────────────────────────────────

/**
 * WebXR Body Tracking feature.
 *
 * This feature tracks the user's full-body pose using the
 * [WebXR Body Tracking Module](https://immersive-web.github.io/body-tracking/),
 * which exposes 83 articulated joints covering the torso, arms, hands, legs and feet.
 *
 * ## Quick Start
 *
 * ```typescript
 * // Enable body tracking when creating the default XR experience:
 * const xr = await scene.createDefaultXRExperienceAsync();
 * const bodyTracking = xr.baseExperience.featuresManager.enableFeature(
 *     WebXRFeatureName.BODY_TRACKING,
 *     "latest",
 *     {
 *         bodyMesh: myRiggedBodyMesh,
 *         rigMapping: {
 *             "hips": "Bip01_Pelvis",
 *             "spine-lower": "Bip01_Spine",
 *             // … one entry per joint you want to drive …
 *         },
 *     } as IWebXRBodyTrackingOptions,
 * );
 *
 * // React to tracking changes:
 * bodyTracking.onBodyTrackingStartedObservable.add((trackedBody) => {
 *     console.log("Body tracking started");
 * });
 * bodyTracking.onBodyTrackingFrameUpdateObservable.add((trackedBody) => {
 *     // The tracked body's joint transforms are already up-to-date.
 * });
 * ```
 *
 * ## How It Works
 *
 * 1. The feature requests the `"body-tracking"` native WebXR feature at session start.
 * 2. Each frame, if `XRFrame.body` is available, joint poses are filled into a
 *    flat Float32Array via the batch `fillPoses()` API (with a per-joint fallback).
 * 3. The 4 × 4 matrices are converted from WebXR right-handed coordinates to
 *    Babylon.js left-handed coordinates in-place (unless the scene is RHS).
 * 4. Each matrix is decomposed and written to a TransformNode; skeleton bones
 *    linked to those nodes animate the rigged mesh automatically.
 *
 * ## Coordinate System
 *
 * WebXR data arrives in a **right-handed** coordinate system.  Babylon.js
 * defaults to **left-handed**.  The conversion is handled automatically:
 * - Joint matrices are flipped in-place (Z-negation of specific matrix elements).
 * - For meshes authored in a right-handed tool (glTF, Blender, etc.), the bone
 *   data is un-flipped so the skeleton interprets poses correctly.
 * - If you use `scene.useRightHandedSystem = true`, no conversion is applied.
 *
 * @see https://immersive-web.github.io/body-tracking/
 */
export class WebXRBodyTracking extends WebXRAbstractFeature {
    /**
     * The module's name, used when enabling the feature on the features manager.
     * Value: `"xr-body-tracking"`.
     */
    public static readonly Name = WebXRFeatureName.BODY_TRACKING;
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number does not correspond to the WebXR specs version.
     */
    public static readonly Version = 1;

    /**
     * Observable fired when body tracking starts (i.e. the first frame where
     * `XRFrame.body` returns valid data).
     */
    public readonly onBodyTrackingStartedObservable: Observable<WebXRTrackedBody> = new Observable();

    /**
     * Observable fired when body tracking is lost (i.e. `XRFrame.body` becomes
     * `null` or returns no valid poses after previously tracking).
     */
    public readonly onBodyTrackingEndedObservable: Observable<void> = new Observable();

    /**
     * Observable fired every frame that has valid body tracking data.
     * At the point of notification, all joint transforms are up-to-date.
     */
    public readonly onBodyTrackingFrameUpdateObservable: Observable<WebXRTrackedBody> = new Observable();

    /**
     * Observable fired when the body mesh has been set via {@link setBodyMesh}
     * or during initial configuration.
     */
    public readonly onBodyMeshSetObservable: Observable<WebXRTrackedBody> = new Observable();

    /** The current tracked body, or null when not tracking. */
    private _trackedBody: Nullable<WebXRTrackedBody> = null;

    /** True while we have an active body tracking session. */
    private _isTracking = false;

    /** Observer for world scale changes, so the body mesh can be rescaled. */
    private _worldScaleObserver: Nullable<Observer<{ previousScaleFactor: number; newScaleFactor: number }>> = null;

    /**
     * Debug info from the feature-level frame loop.
     * Shows why `_onXRFrame` did or did not call `updateFromXRFrame`.
     * @internal
     */
    public _lastFrameDebugInfo: string = "not called";

    /**
     * Get the currently tracked body, if any.
     */
    public get trackedBody(): Nullable<WebXRTrackedBody> {
        return this._trackedBody;
    }

    /**
     * Returns `true` while body tracking data is actively being received.
     */
    public get isTracking(): boolean {
        return this._isTracking;
    }

    /**
     * Construct a new WebXRBodyTracking feature.
     * @param _xrSessionManager The XR session manager.
     * @param options Configuration options.
     */
    constructor(
        _xrSessionManager: WebXRSessionManager,
        /** Configuration options for the body tracking feature. */
        public readonly options: IWebXRBodyTrackingOptions = {}
    ) {
        super(_xrSessionManager);
        this.xrNativeFeatureName = "body-tracking";
    }

    /**
     * Attach a rigged body mesh (or replace the current one) at any time.
     *
     * This is a convenience method that forwards to the underlying
     * {@link WebXRTrackedBody.setBodyMesh}.  The body does not need to be
     * already tracking for this to work — the mesh will be applied once
     * tracking begins.
     *
     * @param bodyMesh The rigged mesh to drive.
     * @param rigMapping Optional mapping from {@link WebXRBodyJoint} names to bone names.
     */
    public setBodyMesh(bodyMesh: AbstractMesh, rigMapping?: XRBodyMeshRigMapping): void {
        // Store on options so it is picked up on (re-)attach.
        this.options.bodyMesh = bodyMesh;
        this.options.rigMapping = rigMapping;
        if (this._trackedBody) {
            this._trackedBody.setBodyMesh(bodyMesh, rigMapping);
            this.onBodyMeshSetObservable.notifyObservers(this._trackedBody);
        }
    }

    // ── Attach / Detach ──────────────────────────────────────────────────

    /**
     * Attach the feature.
     * Called by the features manager when the XR session initialises.
     *
     * Body tracking is a draft WebXR spec.  Some UAs (e.g. Meta Quest) provide
     * body data on `XRFrame.body` but do not list `"body-tracking"` in
     * `session.enabledFeatures`.  To handle this, we temporarily clear
     * {@link xrNativeFeatureName} before calling the base `attach()` so the
     * enabled-features check is skipped, then restore it afterwards.
     * @returns `true` if attachment succeeded.
     */
    public override attach(): boolean {
        // Temporarily clear the native feature name so super.attach() does
        // not reject when "body-tracking" is absent from enabledFeatures.
        // The actual data availability is checked every frame in _onXRFrame.
        const nativeName = this.xrNativeFeatureName;
        this.xrNativeFeatureName = "";
        const attached = super.attach();
        this.xrNativeFeatureName = nativeName;
        if (!attached) {
            this._lastFrameDebugInfo = "super.attach() returned false";
            return false;
        }

        // Create the tracked body container (transform nodes etc.).
        try {
            let rigMapping = this.options.rigMapping;
            let aimChildOverrides = this.options.aimChildOverrides;
            let useBoneOrientationOffsets = this.options.useBoneOrientationOffsets;
            if (this.options.isMixamoModel && this.options.bodyMesh) {
                rigMapping = rigMapping ?? _ResolveMixamoRigMapping(this.options.bodyMesh);
                aimChildOverrides = aimChildOverrides ?? MixamoAimChildOverrides;
                useBoneOrientationOffsets = useBoneOrientationOffsets ?? true;
            }
            this._trackedBody = new WebXRTrackedBody(
                this._xrSessionManager.scene,
                this.options.bodyMesh,
                rigMapping,
                this.options.jointScaleFactor ?? 1.0,
                this.options.preserveBindPoseBonePositions ?? false,
                useBoneOrientationOffsets ?? false,
                aimChildOverrides,
                this.options.jointLocalRotationOffset
            );
        } catch (e) {
            this._lastFrameDebugInfo = "ATTACH ERROR: " + e;
            Logger.Warn("WebXR Body Tracking: failed to create tracked body: " + e);
            return false;
        }

        // Observe world-scale changes to rescale the body mesh.
        if (this.options.bodyMesh) {
            this.options.bodyMesh.scaling.setAll(this._xrSessionManager.worldScalingFactor);
            this._worldScaleObserver = this._xrSessionManager.onWorldScaleFactorChangedObservable.add((factors) => {
                if (this.options.bodyMesh) {
                    this.options.bodyMesh.scaling.scaleInPlace(factors.newScaleFactor / factors.previousScaleFactor);
                }
            });
        }

        this._lastFrameDebugInfo = "attached OK, waiting for frames";
        return true;
    }

    /**
     * Detach the feature.
     * Called by the features manager when the XR session ends.
     * @returns `true` if detachment succeeded.
     */
    public override detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        if (this._isTracking) {
            this._isTracking = false;
            this.onBodyTrackingEndedObservable.notifyObservers();
        }

        if (this._trackedBody) {
            this._trackedBody.dispose();
            this._trackedBody = null;
        }

        if (this._worldScaleObserver) {
            this._xrSessionManager.onWorldScaleFactorChangedObservable.remove(this._worldScaleObserver);
            this._worldScaleObserver = null;
        }

        return true;
    }

    /**
     * Dispose this feature and all resources.
     */
    public override dispose(): void {
        super.dispose();
        this.onBodyTrackingStartedObservable.clear();
        this.onBodyTrackingEndedObservable.clear();
        this.onBodyTrackingFrameUpdateObservable.clear();
        this.onBodyMeshSetObservable.clear();
    }

    // ── Frame loop ───────────────────────────────────────────────────────

    /**
     * Called every XR frame by the base class.
     * Reads body joint data from the XR runtime and updates transforms.
     * @param xrFrame The current XRFrame.
     */
    protected _onXRFrame(xrFrame: XRFrame): void {
        try {
            if (!this._trackedBody) {
                this._lastFrameDebugInfo = "no trackedBody";
                return;
            }

            const body: XRBody | undefined = xrFrame.body;
            if (!body) {
                this._lastFrameDebugInfo = "no xrFrame.body (hasBody prop:" + ("body" in xrFrame) + ")";
                // Tracking lost this frame.
                if (this._isTracking) {
                    this._isTracking = false;
                    this.onBodyTrackingEndedObservable.notifyObservers();
                }
                return;
            }

            this._lastFrameDebugInfo = "body.size:" + body.size + " calling update";

            const success = this._trackedBody.updateFromXRFrame(xrFrame, this._xrSessionManager.referenceSpace, this._xrSessionManager.scene.activeCamera?.parent ?? null);

            this._lastFrameDebugInfo = "body.size:" + body.size + " update:" + success + " | " + this._trackedBody._lastDebugInfo;

            if (!success) {
                if (this._isTracking) {
                    this._isTracking = false;
                    this.onBodyTrackingEndedObservable.notifyObservers();
                }
                return;
            }

            // Detect tracking start / continuation.
            if (!this._isTracking) {
                this._isTracking = true;
                this.onBodyTrackingStartedObservable.notifyObservers(this._trackedBody);
            }

            this.onBodyTrackingFrameUpdateObservable.notifyObservers(this._trackedBody);
        } catch (e) {
            // Catch absolutely everything so we never break the XR render loop.
            this._lastFrameDebugInfo = "EXCEPTION: " + e;
            Logger.Warn("WebXR Body Tracking: error in _onXRFrame: " + e);
        }
    }

    /**
     * Returns the complete ordered list of body joint names tracked by this feature.
     * Useful for iterating over all joints or building UI.
     */
    public static get AllBodyJoints(): readonly WebXRBodyJoint[] {
        return BodyJointReferenceArray;
    }

    /**
     * Capture a single-frame snapshot of all 83 joints and copy it to the
     * clipboard.  Call this from a playground button or the console while
     * wearing the headset:
     *
     * ```typescript
     * bodyTracking.snapshotFrameToClipboard();
     * ```
     *
     * The JSON can later be loaded offline to replay the bone-local
     * computation without a headset.
     * @returns A promise that resolves when the copy completes, or rejects
     *   if no body is currently tracked.
     */
    public async snapshotFrameToClipboardAsync(): Promise<void> {
        if (!this._trackedBody) {
            Logger.Warn("WebXR Body Tracking: no tracked body to snapshot");
            return;
        }
        return await this._trackedBody.snapshotFrameToClipboardAsync();
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Feature registration
// ────────────────────────────────────────────────────────────────────────────

// Register the feature so it can be enabled via the features manager:
//   featuresManager.enableFeature(WebXRFeatureName.BODY_TRACKING, "latest", options);
WebXRFeaturesManager.AddWebXRFeature(
    WebXRBodyTracking.Name,
    (xrSessionManager, options) => {
        return () => new WebXRBodyTracking(xrSessionManager, options);
    },
    WebXRBodyTracking.Version,
    false
);
