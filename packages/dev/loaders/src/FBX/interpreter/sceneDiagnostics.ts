/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXNode, cleanFBXName, getPropertyValue } from "../types/fbxTypes";

import { type FBXObjectMap } from "./connections";

export type FBXSceneDiagnosticType =
    | "unsupported-constraint"
    | "unsupported-helper"
    | "unsupported-deformer"
    | "unsupported-node-attribute"
    | "unsupported-pose"
    | "unsupported-layered-texture"
    | "connection-graph";

export interface FBXSceneDiagnostic {
    type: FBXSceneDiagnosticType;
    message: string;
    objectId?: number;
    objectName?: string;
    nodeName?: string;
    subType?: string;
    /** Number of accepted parent graph edges for objectId, when objectId is known. */
    parentCount?: number;
    childCount?: number;
}

const HELPER_NODE_NAMES = new Set(["Character", "CharacterPose", "ControlSet", "ControlSetPlug"]);

/** Node attribute subtypes that are converted (or intentionally represented as plain transform nodes). */
const HANDLED_NODE_ATTRIBUTES = new Set([
    "Camera",
    "Light",
    "Null",
    "LodGroup",
    "LimbNode",
    "Limb",
    "Root",
    "Skeleton",
    "Marker",
    "CameraSwitcher",
    "Mesh",
    "NurbsCurve",
    "NurbsSurface",
    "TrimNurbsSurface",
    "Line",
    "Boundary",
]);

export function extractSceneDiagnostics(objectMap: FBXObjectMap): FBXSceneDiagnostic[] {
    const diagnostics: FBXSceneDiagnostic[] = objectMap.diagnostics.map((diagnostic) => ({
        type: "connection-graph",
        message: diagnostic.message,
        objectId: diagnostic.childId,
        subType: diagnostic.reason,
        parentCount: diagnostic.childId === undefined ? undefined : objectMap.connections.filter((connection) => connection.childId === diagnostic.childId).length,
    }));

    for (const [id, node] of Array.from(objectMap.objects)) {
        const subType = getPropertyValue<string>(node, 2) ?? "";
        if (node.name === "Constraint") {
            // Aim, parent, position, rotation and scale constraints are evaluated at runtime; IK chains are not.
            const typeChild = node.children.find((c) => c.name === "Type");
            const constraintType = (typeChild ? getPropertyValue<string>(typeChild, 0) : undefined) ?? subType;
            const evaluated = new Set(["Aim", "Parent-Child", "Position From Positions", "Rotation From Rotations", "Scale From Scales"]);
            if (!evaluated.has(constraintType)) {
                diagnostics.push(
                    createObjectDiagnostic(
                        objectMap,
                        id,
                        node,
                        "unsupported-constraint",
                        `Constraint '${constraintType || cleanFBXName(getPropertyValue<string>(node, 1) ?? "")}' is preserved as metadata but not evaluated at runtime.`
                    )
                );
            }
            continue;
        }

        if (HELPER_NODE_NAMES.has(node.name)) {
            diagnostics.push(
                createObjectDiagnostic(objectMap, id, node, "unsupported-helper", `${node.name} helper data is preserved as diagnostic data but not evaluated at runtime.`)
            );
            continue;
        }

        if (node.name === "LayeredTexture") {
            diagnostics.push(
                createObjectDiagnostic(
                    objectMap,
                    id,
                    node,
                    "unsupported-layered-texture",
                    "LayeredTexture is preserved as diagnostic data; runtime texture layer blending is not implemented."
                )
            );
            continue;
        }

        if (node.name === "Pose" && subType !== "BindPose") {
            diagnostics.push(
                createObjectDiagnostic(objectMap, id, node, "unsupported-pose", `Pose subtype '${subType}' is preserved as diagnostic data but not evaluated at runtime.`)
            );
            continue;
        }

        if (node.name === "Deformer" && !isSupportedDeformer(subType)) {
            diagnostics.push(
                createObjectDiagnostic(objectMap, id, node, "unsupported-deformer", `Deformer subtype '${subType}' is preserved as diagnostic data but not evaluated at runtime.`)
            );
            continue;
        }

        if (node.name === "NodeAttribute" && subType && !HANDLED_NODE_ATTRIBUTES.has(subType)) {
            diagnostics.push(
                createObjectDiagnostic(
                    objectMap,
                    id,
                    node,
                    "unsupported-node-attribute",
                    `NodeAttribute subtype '${subType}' is preserved as diagnostic data but not converted to a Babylon object.`
                )
            );
        }
    }

    return diagnostics;
}

function isSupportedDeformer(subType: string): boolean {
    return subType === "Skin" || subType === "Cluster" || subType === "BlendShape" || subType === "BlendShapeChannel";
}

function createObjectDiagnostic(objectMap: FBXObjectMap, id: number, node: FBXNode, type: FBXSceneDiagnosticType, message: string): FBXSceneDiagnostic {
    return {
        type,
        message,
        objectId: id,
        objectName: cleanFBXName(getPropertyValue<string>(node, 1) ?? node.name),
        nodeName: node.name,
        subType: getPropertyValue<string>(node, 2) ?? "",
        parentCount: objectMap.connections.filter((connection) => connection.childId === id).length,
        childCount: objectMap.childrenOf.get(id)?.length ?? 0,
    };
}
