/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * FBX constraints (FbxConstraint): aim, parent, position, rotation, scale and single chain IK. The property and
 * connection conventions follow the FBX SDK (target weights are `<TargetName>.Weight`, parent offsets
 * `<TargetName>.Offset T/R/S`, the constrained node arrives through the "Constrained Object" connection).
 */
import { type FBXNode, getPropertyValue, cleanFBXName } from "../types/fbxTypes";
import { type FBXObjectMap } from "./connections";
import { getPropertyEntries } from "./propertyTemplates";

export type FBXConstraintType = "aim" | "parent" | "position" | "rotation" | "scale" | "singleChainIK" | "unknown";

export type Vec3 = [number, number, number];
export type Bool3 = [boolean, boolean, boolean];

/** One weighted target of a constraint. */
export interface FBXConstraintTarget {
    modelId: number;
    /** Normalized weight (file value / 100, or as-is for IK pole targets) */
    weight: number;
    /** Parent constraint offsets expressed in the target's space */
    offsetTranslation: Vec3;
    offsetRotation: Vec3;
    offsetScale: Vec3;
}

export interface FBXConstraintData {
    id: number;
    name: string;
    type: FBXConstraintType;
    typeName: string;
    /** Constrained model */
    nodeId?: number;
    targets: FBXConstraintTarget[];
    /** Global weight (file value / 100) */
    weight: number;
    active: boolean;
    affectTranslation: Bool3;
    affectRotation: Bool3;
    affectScale: Bool3;
    /** Position / rotation (degrees) / scale offsets of the constrained node */
    offsetTranslation: Vec3;
    offsetRotation: Vec3;
    offsetScale: Vec3;
    /** Aim: local aim and up vectors, world up mode and vector */
    aimVector: Vec3;
    upVector: Vec3;
    worldUpVector: Vec3;
    /** 0 scene up, 1 aim up node, 2 align to node, 3 vector, 4 none */
    worldUpType: number;
    worldUpNodeId?: number;
    /** Single chain IK */
    ikFirstJointId?: number;
    ikEndJointId?: number;
    ikEffectorId?: number;
    ikPoleVector: Vec3;
}

const TYPE_NAMES: Record<string, FBXConstraintType> = {
    Aim: "aim",
    "Parent-Child": "parent",
    "Position From Positions": "position",
    "Rotation From Rotations": "rotation",
    "Scale From Scales": "scale",
    "Single Chain IK": "singleChainIK",
};

function vec3(values: unknown[] | undefined, fallback: Vec3): Vec3 {
    if (values && typeof values[0] === "number" && typeof values[1] === "number" && typeof values[2] === "number") {
        return [values[0], values[1], values[2]];
    }
    return fallback;
}

function num(values: unknown[] | undefined, fallback: number): number {
    const v = values?.[0];
    return typeof v === "number" ? v : typeof v === "boolean" ? (v ? 1 : 0) : fallback;
}

/** Reads every constraint object of the scene. */
export function extractConstraints(objectMap: FBXObjectMap): FBXConstraintData[] {
    const constraints: FBXConstraintData[] = [];
    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name !== "Constraint") {
            continue;
        }
        constraints.push(extractConstraint(id, node, objectMap));
    }
    return constraints;
}

function extractConstraint(id: number, node: FBXNode, objectMap: FBXObjectMap): FBXConstraintData {
    const typeChild = node.children.find((c) => c.name === "Type");
    const typeName = (typeChild ? getPropertyValue<string>(typeChild, 0) : undefined) ?? getPropertyValue<string>(node, 2) ?? "";
    const type = TYPE_NAMES[typeName] ?? "unknown";
    const props = new Map<string, unknown[]>();
    for (const entry of getPropertyEntries(node)) {
        props.set(entry.name, entry.values);
    }
    const bool3 = (prefix: string, fallback: boolean): Bool3 => [
        num(props.get(`${prefix}X`), fallback ? 1 : 0) !== 0,
        num(props.get(`${prefix}Y`), fallback ? 1 : 0) !== 0,
        num(props.get(`${prefix}Z`), fallback ? 1 : 0) !== 0,
    ];

    const constraint: FBXConstraintData = {
        id,
        name: cleanFBXName(getPropertyValue<string>(node, 1) ?? "Constraint"),
        type,
        typeName,
        targets: [],
        weight: num(props.get("Weight"), 100) / 100,
        active: num(props.get("Active"), 1) !== 0,
        affectTranslation: [true, true, true],
        affectRotation: [true, true, true],
        affectScale: [false, false, false],
        offsetTranslation: [0, 0, 0],
        offsetRotation: [0, 0, 0],
        offsetScale: [1, 1, 1],
        aimVector: vec3(props.get("AimVector"), [1, 0, 0]),
        upVector: vec3(props.get("UpVector"), [0, 1, 0]),
        worldUpVector: vec3(props.get("WorldUpVector"), [0, 1, 0]),
        worldUpType: num(props.get("WorldUpType"), 0),
        ikPoleVector: vec3(props.get("PoleVector"), [0, 0, 0]),
    };

    switch (type) {
        case "aim":
            constraint.affectRotation = bool3("Affect", true);
            constraint.offsetRotation = vec3(props.get("RotationOffset"), [0, 0, 0]);
            break;
        case "parent":
            constraint.affectTranslation = bool3("AffectTranslation", true);
            constraint.affectRotation = bool3("AffectRotation", true);
            constraint.affectScale = bool3("AffectScale", false);
            break;
        case "position":
            constraint.affectTranslation = bool3("Affect", true);
            constraint.offsetTranslation = vec3(props.get("Translation"), [0, 0, 0]);
            break;
        case "rotation":
            constraint.affectRotation = bool3("Affect", true);
            constraint.offsetRotation = vec3(props.get("Rotation"), [0, 0, 0]);
            break;
        case "scale":
            constraint.affectScale = bool3("Affect", true);
            constraint.offsetScale = vec3(props.get("Scaling"), [1, 1, 1]);
            break;
        default:
            break;
    }

    // Connected objects: the child of each OP connection is the model, the property names its role.
    const weightScale = type === "singleChainIK" ? 1 : 100;
    for (const conn of objectMap.connections) {
        if (conn.parentId !== id || conn.type !== "OP" || !conn.propertyName) {
            continue;
        }
        const modelNode = objectMap.objects.get(conn.childId);
        if (!modelNode || modelNode.name !== "Model") {
            continue;
        }
        const role = conn.propertyName;
        const targetName = cleanFBXName(getPropertyValue<string>(modelNode, 1) ?? "");
        switch (role) {
            case "Constrained Object":
            case "Constrained object (Child)":
                constraint.nodeId = conn.childId;
                break;
            case "Source":
            case "Source (Parent)":
            case "Aim At Object":
            case "Pole Vector Object":
                constraint.targets.push({
                    modelId: conn.childId,
                    weight: num(props.get(`${targetName}.Weight`), weightScale) / weightScale,
                    offsetTranslation: vec3(props.get(`${targetName}.Offset T`), [0, 0, 0]),
                    offsetRotation: vec3(props.get(`${targetName}.Offset R`), [0, 0, 0]),
                    offsetScale: vec3(props.get(`${targetName}.Offset S`), [1, 1, 1]),
                });
                break;
            case "World Up Object":
                constraint.worldUpNodeId = conn.childId;
                break;
            case "First Joint":
                constraint.ikFirstJointId = conn.childId;
                break;
            case "End Joint":
                constraint.ikEndJointId = conn.childId;
                break;
            case "Effector":
                constraint.ikEffectorId = conn.childId;
                break;
            default:
                break;
        }
    }
    return constraint;
}
