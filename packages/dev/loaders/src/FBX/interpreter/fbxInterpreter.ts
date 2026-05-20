/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { type FBXDocument, type FBXNode, findDocumentNode, findChildByName, getPropertyValue, cleanFBXName } from "../types/fbxTypes";

import { resolveConnections, getChildren, type FBXObjectMap } from "./connections";
import { extractGeometry, type FBXGeometryData } from "./geometry";
import { extractMaterial, type FBXMaterialData } from "./materials";
import { extractSkins, type FBXSkinData } from "./skeleton";
import { resolveRigs, type FBXRigData } from "./rig";
import { extractAnimations, type FBXAnimationStackData } from "./animation";
import { extractBlendShapes, type FBXBlendShapeData } from "./blendShapes";
import { extractSceneDiagnostics, type FBXSceneDiagnostic } from "./sceneDiagnostics";
import {
    extractPropertyTemplates,
    getPropertyTemplate,
    resolveNumberProperty,
    resolvePropertyValue,
    resolveVector3Property,
    type FBXPropertyTemplate,
    type FBXPropertyTemplateMap,
} from "./propertyTemplates";

/** Represents a model (transform node) in the FBX scene */
export interface FBXModelData {
    id: bigint;
    name: string;
    subType: string;
    /** Geometry attached to this model (if it's a Mesh type) */
    geometry?: FBXGeometryData;
    /** Materials assigned to this model */
    materials: FBXMaterialData[];
    /** Child models */
    children: FBXModelData[];
    /** Transform properties */
    translation: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    /** PreRotation (applied before Lcl Rotation, in degrees) */
    preRotation: [number, number, number];
    /** PostRotation (applied after Lcl Rotation, inverted, in degrees) */
    postRotation: [number, number, number];
    /** RotationPivot — point around which rotation occurs */
    rotationPivot: [number, number, number];
    /** ScalingPivot — point around which scaling occurs */
    scalingPivot: [number, number, number];
    /** RotationOffset — translation after rotation pivot */
    rotationOffset: [number, number, number];
    /** ScalingOffset — translation after scaling pivot */
    scalingOffset: [number, number, number];
    /** Geometric transforms — applied to geometry only, do not affect children */
    geometricTranslation: [number, number, number];
    geometricRotation: [number, number, number];
    geometricScaling: [number, number, number];
    /** Rotation order: 0=XYZ, 1=XZY, 2=YZX, 3=YXZ, 4=ZXY, 5=ZYX */
    rotationOrder: number;
    /** FBX transform inheritance mode. 0=RrSs, 1=RSrs, 2=Rrs */
    inheritType: number;
    /** Whether backface culling is disabled ("CullingOff") */
    cullingOff: boolean;
    /** User-defined custom properties from Properties70 */
    customProperties?: Record<string, string | number | boolean>;
    /** Recoverable model import diagnostics */
    diagnostics: string[];
}

/** Camera data extracted from FBX */
export interface FBXCameraData {
    /** Model ID this camera is attached to */
    modelId: bigint;
    /** Camera name */
    name: string;
    /** Field of view in degrees */
    fieldOfView: number;
    /** Near clip plane */
    nearPlane: number;
    /** Far clip plane */
    farPlane: number;
    /** Aspect ratio (width/height), 0 = use viewport */
    aspectRatio: number;
    /** Projection type */
    projectionType: "perspective" | "orthographic";
    /** Focal length in millimeters when present */
    focalLength?: number;
    /** Filmback width in inches when present */
    filmWidth?: number;
    /** Filmback height in inches when present */
    filmHeight?: number;
    /** Orthographic zoom/height when present */
    orthoZoom?: number;
    /** Camera roll in degrees when present */
    roll?: number;
    /** Known unsupported or unrecognized camera properties */
    unknownProperties: string[];
    /** Recoverable camera import diagnostics */
    diagnostics: string[];
}

/** Light data extracted from FBX */
export interface FBXLightData {
    /** Model ID this light is attached to */
    modelId: bigint;
    /** Light name */
    name: string;
    /** Light type: 0=Point, 1=Directional, 2=Spot */
    lightType: number;
    /** Color [r,g,b] 0-1 */
    color: [number, number, number];
    /** Intensity multiplier */
    intensity: number;
    /** Cone angle in degrees (for spot lights) */
    coneAngle: number;
    /** Decay type: 0=None, 1=Linear, 2=Quadratic */
    decayType: number;
    /** Inner cone angle in degrees for spot lights */
    innerAngle?: number;
    /** Outer cone angle in degrees for spot lights */
    outerAngle?: number;
    /** Distance at which FBX attenuation starts; preserved as metadata */
    decayStart?: number;
    /** Whether FBX near attenuation is enabled */
    enableNearAttenuation?: boolean;
    /** Whether FBX far attenuation is enabled */
    enableFarAttenuation?: boolean;
    /** Whether the source light requested shadow casting */
    castShadows?: boolean;
    /** Known unsupported or unrecognized light properties */
    unknownProperties: string[];
    /** Recoverable light import diagnostics */
    diagnostics: string[];
}

/** Result of interpreting an FBX document */
export interface FBXSceneData {
    /** All root-level models */
    rootModels: FBXModelData[];
    /** All geometries in the scene */
    geometries: FBXGeometryData[];
    /** All materials in the scene */
    materials: FBXMaterialData[];
    /** Skin deformers (skeletons + vertex weights) */
    skins: FBXSkinData[];
    /** Resolved deformation rigs shared by one or more skins */
    rigs: FBXRigData[];
    /** Blend shape deformers (morph targets) */
    blendShapes: FBXBlendShapeData[];
    /** Animation stacks (clips) */
    animations: FBXAnimationStackData[];
    /** Cameras */
    cameras: FBXCameraData[];
    /** Lights */
    lights: FBXLightData[];
    /** Scene-level unsupported feature diagnostics */
    diagnostics: FBXSceneDiagnostic[];
    /** Global settings */
    upAxis: number;
    upAxisSign: number;
    frontAxis: number;
    frontAxisSign: number;
    coordAxis: number;
    coordAxisSign: number;
    unitScaleFactor: number;
}

/**
 * Interpret a parsed FBX document into scene data.
 */
export function interpretFBX(doc: FBXDocument): FBXSceneData {
    const objectMap = resolveConnections(doc);
    const propertyTemplates = extractPropertyTemplates(doc);

    // Extract global settings
    const globalSettings = extractGlobalSettings(doc);

    // Extract all materials
    const materials: FBXMaterialData[] = [];
    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "Material") {
            materials.push(extractMaterial(node, id, objectMap, propertyTemplates));
        }
    }

    // Extract all geometries
    const geometries: FBXGeometryData[] = [];
    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "Geometry") {
            const subType = getPropertyValue<string>(node, 2);
            if (subType === "Mesh") {
                geometries.push(extractGeometry(node, id));
            }
        }
    }

    // Extract skeleton/skinning data
    const skins = extractSkins(objectMap);
    const rigs = resolveRigs(objectMap, skins);

    // Extract blend shape data
    const blendShapes = extractBlendShapes(objectMap);

    // Extract animation data
    const animations = extractAnimations(objectMap);

    // Extract cameras and lights from NodeAttribute objects
    const cameras = extractCameras(objectMap, propertyTemplates);
    const lights = extractLights(objectMap, propertyTemplates);
    const diagnostics = extractSceneDiagnostics(objectMap);

    // Build model hierarchy
    const rootModels = buildModelHierarchy(objectMap, geometries, materials, propertyTemplates);

    return {
        rootModels,
        geometries,
        materials,
        skins,
        rigs,
        blendShapes,
        animations,
        cameras,
        lights,
        diagnostics,
        ...globalSettings,
    };
}

// ── Model Hierarchy ────────────────────────────────────────────────────────────

function buildModelHierarchy(objectMap: FBXObjectMap, geometries: FBXGeometryData[], materials: FBXMaterialData[], propertyTemplates: FBXPropertyTemplateMap): FBXModelData[] {
    const geometryMap = new Map<bigint, FBXGeometryData>();
    for (const g of geometries) {
        geometryMap.set(g.id, g);
    }

    const materialMap = new Map<bigint, FBXMaterialData>();
    for (const m of materials) {
        materialMap.set(m.id, m);
    }

    // Find root models (those connected to ID 0, which is the scene root)
    const rootChildren = objectMap.childrenOf.get(0n) ?? [];
    const rootModels: FBXModelData[] = [];

    for (const { id } of rootChildren) {
        const node = objectMap.objects.get(id);
        if (node && node.name === "Model") {
            rootModels.push(buildModel(id, node, objectMap, geometryMap, materialMap, propertyTemplates));
        }
    }

    return rootModels;
}

function buildModel(
    modelId: bigint,
    modelNode: FBXNode,
    objectMap: FBXObjectMap,
    geometryMap: Map<bigint, FBXGeometryData>,
    materialMap: Map<bigint, FBXMaterialData>,
    propertyTemplates: FBXPropertyTemplateMap
): FBXModelData {
    const name = cleanFBXName(getPropertyValue<string>(modelNode, 1) ?? "Model");
    const subType = getPropertyValue<string>(modelNode, 2) ?? "Null";

    // Find attached geometry
    const geomChildren = getChildren(objectMap, modelId, "Geometry");
    const geometry = geomChildren.length > 0 ? geometryMap.get(geomChildren[0].id) : undefined;

    // Find attached materials
    const matChildren = getChildren(objectMap, modelId, "Material");
    const modelMaterials: FBXMaterialData[] = [];
    for (const { id } of matChildren) {
        const mat = materialMap.get(id);
        if (mat) {
            modelMaterials.push(mat);
        }
    }

    // Extract transform
    const transform = extractTransform(modelNode, getPropertyTemplate(propertyTemplates, "Model", "FbxNode") ?? getPropertyTemplate(propertyTemplates, "Model"));

    // Recursively build child models
    const childModelNodes = getChildren(objectMap, modelId, "Model");
    const children: FBXModelData[] = [];
    for (const { id, node } of childModelNodes) {
        children.push(buildModel(id, node, objectMap, geometryMap, materialMap, propertyTemplates));
    }

    // Extract culling
    const cullingNode = modelNode.children.find((c) => c.name === "Culling");
    const cullingOff = cullingNode ? getPropertyValue<string>(cullingNode, 0) === "CullingOff" : false;

    // Extract user-defined custom properties
    const customProperties = extractCustomProperties(modelNode);

    return {
        id: modelId,
        name,
        subType,
        geometry,
        materials: modelMaterials,
        children,
        cullingOff,
        customProperties,
        ...transform,
    };
}

function extractTransform(
    modelNode: FBXNode,
    template?: FBXPropertyTemplate
): {
    translation: [number, number, number];
    rotation: [number, number, number];
    scale: [number, number, number];
    preRotation: [number, number, number];
    postRotation: [number, number, number];
    rotationPivot: [number, number, number];
    scalingPivot: [number, number, number];
    rotationOffset: [number, number, number];
    scalingOffset: [number, number, number];
    geometricTranslation: [number, number, number];
    geometricRotation: [number, number, number];
    geometricScaling: [number, number, number];
    rotationOrder: number;
    inheritType: number;
    diagnostics: string[];
} {
    const translation = resolveVector3Property(modelNode, template, "Lcl Translation", [0, 0, 0]);
    const rotation = resolveVector3Property(modelNode, template, "Lcl Rotation", [0, 0, 0]);
    const scale = resolveVector3Property(modelNode, template, "Lcl Scaling", [1, 1, 1]);
    const preRotation = resolveVector3Property(modelNode, template, "PreRotation", [0, 0, 0]);
    const postRotation = resolveVector3Property(modelNode, template, "PostRotation", [0, 0, 0]);
    const rotationPivot = resolveVector3Property(modelNode, template, "RotationPivot", [0, 0, 0]);
    const scalingPivot = resolveVector3Property(modelNode, template, "ScalingPivot", [0, 0, 0]);
    const rotationOffset = resolveVector3Property(modelNode, template, "RotationOffset", [0, 0, 0]);
    const scalingOffset = resolveVector3Property(modelNode, template, "ScalingOffset", [0, 0, 0]);
    const geometricTranslation = resolveVector3Property(modelNode, template, "GeometricTranslation", [0, 0, 0]);
    const geometricRotation = resolveVector3Property(modelNode, template, "GeometricRotation", [0, 0, 0]);
    const geometricScaling = resolveVector3Property(modelNode, template, "GeometricScaling", [1, 1, 1]);
    const rotationOrder = resolveNumberProperty(modelNode, template, "RotationOrder", 0);
    const inheritType = resolveNumberProperty(modelNode, template, "InheritType", 1);
    const diagnostics =
        inheritType !== 1 && inheritType !== 2
            ? [
                  `InheritType ${inheritType} is parsed and preserved; runtime parent-scale inheritance remains gated to avoid changing existing visual behavior without a fixture-specific baseline.`,
              ]
            : [];

    return {
        translation,
        rotation,
        scale,
        preRotation,
        postRotation,
        rotationPivot,
        scalingPivot,
        rotationOffset,
        scalingOffset,
        geometricTranslation,
        geometricRotation,
        geometricScaling,
        rotationOrder,
        inheritType,
        diagnostics,
    };
}

// ── Global Settings ────────────────────────────────────────────────────────────

interface GlobalSettings {
    upAxis: number;
    upAxisSign: number;
    frontAxis: number;
    frontAxisSign: number;
    coordAxis: number;
    coordAxisSign: number;
    unitScaleFactor: number;
}

function extractGlobalSettings(doc: FBXDocument): GlobalSettings {
    const defaults: GlobalSettings = {
        upAxis: 1,
        upAxisSign: 1,
        frontAxis: 2,
        frontAxisSign: 1,
        coordAxis: 0,
        coordAxisSign: 1,
        unitScaleFactor: 1,
    };

    const gsNode = findDocumentNode(doc, "GlobalSettings");
    if (!gsNode) {
        return defaults;
    }

    const props70 = gsNode.children.find((c) => c.name === "Properties70");
    if (!props70) {
        return defaults;
    }

    for (const p of props70.children) {
        if (p.name !== "P") {
            continue;
        }
        const propName = getPropertyValue<string>(p, 0);
        const value = toNumber(p.properties[4]?.value);
        if (propName && value !== undefined) {
            switch (propName) {
                case "UpAxis":
                    defaults.upAxis = value;
                    break;
                case "UpAxisSign":
                    defaults.upAxisSign = value;
                    break;
                case "FrontAxis":
                    defaults.frontAxis = value;
                    break;
                case "FrontAxisSign":
                    defaults.frontAxisSign = value;
                    break;
                case "CoordAxis":
                    defaults.coordAxis = value;
                    break;
                case "CoordAxisSign":
                    defaults.coordAxisSign = value;
                    break;
                case "UnitScaleFactor":
                    defaults.unitScaleFactor = value;
                    break;
            }
        }
    }

    return defaults;
}

// ── Cameras & Lights ──────────────────────────────────────────────────────────

const SYSTEM_PROPERTIES = new Set([
    "Lcl Translation",
    "Lcl Rotation",
    "Lcl Scaling",
    "PreRotation",
    "PostRotation",
    "RotationPivot",
    "ScalingPivot",
    "RotationOffset",
    "ScalingOffset",
    "RotationOrder",
    "GeometricTranslation",
    "GeometricRotation",
    "GeometricScaling",
    "Visibility",
    "InheritType",
    "ScalingMax",
    "DefaultAttributeIndex",
    "currentUVSet",
    "lockInfluenceWeights",
]);

function extractCustomProperties(modelNode: FBXNode): Record<string, string | number | boolean> | undefined {
    const props70 = findChildByName(modelNode, "Properties70");
    if (!props70) {
        return undefined;
    }

    const custom: Record<string, string | number | boolean> = {};
    let hasAny = false;

    for (const p of props70.children) {
        if (p.name !== "P") {
            continue;
        }
        const propName = getPropertyValue<string>(p, 0);
        if (!propName || SYSTEM_PROPERTIES.has(propName)) {
            continue;
        }

        // Accept user-defined properties (type starts with something other than standard types)
        // Standard FBX types: "KString", "Number", "double", "int", "bool", "Lcl"...
        // User properties often have types like "KString", but are in the UDP (User Defined Properties) section
        // Heuristic: if not in SYSTEM_PROPERTIES set, it's user-defined
        const val = p.properties[4]?.value;
        if (val === undefined) {
            continue;
        }

        if (typeof val === "string") {
            custom[propName] = val;
            hasAny = true;
        } else if (typeof val === "number") {
            custom[propName] = val;
            hasAny = true;
        } else if (typeof val === "bigint") {
            custom[propName] = Number(val);
            hasAny = true;
        } else if (typeof val === "boolean") {
            custom[propName] = val;
            hasAny = true;
        }
    }

    return hasAny ? custom : undefined;
}

const CAMERA_PROPERTIES = new Set([
    "FieldOfView",
    "FieldOfViewX",
    "FieldOfViewY",
    "NearPlane",
    "FarPlane",
    "AspectWidth",
    "AspectHeight",
    "FilmAspectRatio",
    "FocalLength",
    "FilmWidth",
    "FilmHeight",
    "ApertureWidth",
    "ApertureHeight",
    "CameraProjectionType",
    "ProjectionType",
    "OrthoZoom",
    "Roll",
    "ApertureMode",
]);

const LIGHT_PROPERTIES = new Set([
    "LightType",
    "Color",
    "Intensity",
    "InnerAngle",
    "OuterAngle",
    "ConeAngle",
    "DecayType",
    "DecayStart",
    "EnableNearAttenuation",
    "EnableFarAttenuation",
    "CastShadow",
    "Shadow",
]);

function extractCameras(objectMap: FBXObjectMap, templates: FBXPropertyTemplateMap): FBXCameraData[] {
    const cameras: FBXCameraData[] = [];
    const cameraTemplate = getPropertyTemplate(templates, "NodeAttribute", "FbxCamera") ?? getPropertyTemplate(templates, "NodeAttribute");

    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name !== "NodeAttribute") {
            continue;
        }
        const subType = getPropertyValue<string>(node, 2);
        if (subType !== "Camera") {
            continue;
        }

        // Find the model this camera is attached to (parent)
        const parent = objectMap.parentOf.get(id);
        if (!parent) {
            continue;
        }
        const parentNode = objectMap.objects.get(parent.id);
        if (!parentNode || parentNode.name !== "Model") {
            continue;
        }

        const name = cleanFBXName(getPropertyValue<string>(parentNode, 1) ?? "Camera");

        const nearPlane = resolveNumberProperty(node, cameraTemplate, "NearPlane", 0.1);
        const farPlane = resolveNumberProperty(node, cameraTemplate, "FarPlane", 10000);
        const aspectRatio = resolveCameraAspectRatio(node, cameraTemplate);
        const projectionType =
            resolveNumberProperty(node, cameraTemplate, "CameraProjectionType", 0) === 1 || resolveNumberProperty(node, cameraTemplate, "ProjectionType", 0) === 1
                ? "orthographic"
                : "perspective";
        const focalLength = toNumber(resolvePropertyValue(node, cameraTemplate, "FocalLength"));
        const filmWidth = toNumber(resolvePropertyValue(node, cameraTemplate, "FilmWidth")) ?? toNumber(resolvePropertyValue(node, cameraTemplate, "ApertureWidth"));
        const filmHeight = toNumber(resolvePropertyValue(node, cameraTemplate, "FilmHeight")) ?? toNumber(resolvePropertyValue(node, cameraTemplate, "ApertureHeight"));
        const orthoZoom = toNumber(resolvePropertyValue(node, cameraTemplate, "OrthoZoom"));
        const roll = toNumber(resolvePropertyValue(node, cameraTemplate, "Roll"));
        const fieldOfView = resolveCameraFieldOfView(node, cameraTemplate, aspectRatio, focalLength, filmHeight);
        const diagnostics: string[] = [];
        if (projectionType === "orthographic" && orthoZoom === undefined) {
            diagnostics.push("Orthographic camera has no OrthoZoom; runtime orthographic bounds use a fallback.");
        }
        if (focalLength !== undefined && filmHeight === undefined && resolvePropertyValue(node, cameraTemplate, "FieldOfView") === undefined) {
            diagnostics.push("FocalLength is present without FilmHeight; default field of view fallback may be used.");
        }

        cameras.push({
            modelId: parent.id,
            name,
            fieldOfView,
            nearPlane,
            farPlane,
            aspectRatio,
            projectionType,
            focalLength,
            filmWidth,
            filmHeight,
            orthoZoom,
            roll,
            unknownProperties: collectUnknownLocalProperties(node, CAMERA_PROPERTIES),
            diagnostics,
        });
    }

    return cameras;
}

function extractLights(objectMap: FBXObjectMap, templates: FBXPropertyTemplateMap): FBXLightData[] {
    const lights: FBXLightData[] = [];
    const lightTemplate = getPropertyTemplate(templates, "NodeAttribute", "FbxLight") ?? getPropertyTemplate(templates, "NodeAttribute");

    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name !== "NodeAttribute") {
            continue;
        }
        const subType = getPropertyValue<string>(node, 2);
        if (subType !== "Light") {
            continue;
        }

        // Find the model this light is attached to
        const parent = objectMap.parentOf.get(id);
        if (!parent) {
            continue;
        }
        const parentNode = objectMap.objects.get(parent.id);
        if (!parentNode || parentNode.name !== "Model") {
            continue;
        }

        const name = cleanFBXName(getPropertyValue<string>(parentNode, 1) ?? "Light");

        const lightType = resolveNumberProperty(node, lightTemplate, "LightType", 0);
        const color = resolveVector3Property(node, lightTemplate, "Color", [1, 1, 1]);
        const intensity = resolveNumberProperty(node, lightTemplate, "Intensity", 100) / 100;
        const outerAngle = toNumber(resolvePropertyValue(node, lightTemplate, "OuterAngle")) ?? toNumber(resolvePropertyValue(node, lightTemplate, "ConeAngle"));
        const innerAngle = toNumber(resolvePropertyValue(node, lightTemplate, "InnerAngle"));
        const coneAngle = outerAngle ?? 45;
        const decayType = resolveNumberProperty(node, lightTemplate, "DecayType", 2);
        const decayStart = toNumber(resolvePropertyValue(node, lightTemplate, "DecayStart"));
        const enableNearAttenuation = toBoolean(resolvePropertyValue(node, lightTemplate, "EnableNearAttenuation"));
        const enableFarAttenuation = toBoolean(resolvePropertyValue(node, lightTemplate, "EnableFarAttenuation"));
        const castShadows =
            toBoolean(resolvePropertyValue(node, lightTemplate, "CastShadow")) ??
            toBoolean(resolvePropertyValue(parentNode, undefined, "CastShadow")) ??
            toBoolean(resolvePropertyValue(parentNode, undefined, "Shadow"));
        const diagnostics: string[] = [];
        if (decayType !== 2) {
            diagnostics.push(`DecayType ${decayType} is preserved as metadata; Babylon falloff is not remapped in this pass.`);
        }
        if (decayStart !== undefined) {
            diagnostics.push("DecayStart is preserved as metadata and is not mapped to Babylon light range.");
        }

        lights.push({
            modelId: parent.id,
            name,
            lightType,
            color,
            intensity,
            coneAngle,
            decayType,
            innerAngle,
            outerAngle,
            decayStart,
            enableNearAttenuation,
            enableFarAttenuation,
            castShadows,
            unknownProperties: collectUnknownLocalProperties(node, LIGHT_PROPERTIES),
            diagnostics,
        });
    }

    return lights;
}

// ── Utilities ──────────────────────────────────────────────────────────────────

function toNumber(value: unknown): number | undefined {
    if (typeof value === "number") {
        return value;
    }
    if (typeof value === "bigint") {
        return Number(value);
    }
    return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    if (typeof value === "bigint") {
        return value !== 0n;
    }
    return undefined;
}

function resolveCameraAspectRatio(node: FBXNode, template?: FBXPropertyTemplate): number {
    const filmAspectRatio = toNumber(resolvePropertyValue(node, template, "FilmAspectRatio"));
    if (filmAspectRatio !== undefined && filmAspectRatio > 0) {
        return filmAspectRatio;
    }

    const aspectWidth = toNumber(resolvePropertyValue(node, template, "AspectWidth"));
    const aspectHeight = toNumber(resolvePropertyValue(node, template, "AspectHeight"));
    if (aspectWidth !== undefined && aspectHeight !== undefined && aspectWidth > 0 && aspectHeight > 0) {
        return aspectWidth / aspectHeight;
    }

    return 0;
}

function resolveCameraFieldOfView(
    node: FBXNode,
    template: FBXPropertyTemplate | undefined,
    aspectRatio: number,
    focalLength: number | undefined,
    filmHeight: number | undefined
): number {
    const verticalFov = toNumber(resolvePropertyValue(node, template, "FieldOfViewY")) ?? toNumber(resolvePropertyValue(node, template, "FieldOfView"));
    if (verticalFov !== undefined) {
        return verticalFov;
    }

    const horizontalFov = toNumber(resolvePropertyValue(node, template, "FieldOfViewX"));
    if (horizontalFov !== undefined) {
        if (aspectRatio > 0) {
            return radiansToDegrees(2 * Math.atan(Math.tan(degreesToRadians(horizontalFov) / 2) / aspectRatio));
        }
        return horizontalFov;
    }

    if (focalLength !== undefined && focalLength > 0 && filmHeight !== undefined && filmHeight > 0) {
        return radiansToDegrees(2 * Math.atan((filmHeight * 25.4) / (2 * focalLength)));
    }

    return 45;
}

function collectUnknownLocalProperties(node: FBXNode, known: Set<string>): string[] {
    const unknown = new Set<string>();
    for (const containerName of ["Properties70", "Properties60"]) {
        const container = findChildByName(node, containerName);
        for (const propertyNode of container?.children ?? []) {
            if (propertyNode.name !== "P" && propertyNode.name !== "Property") {
                continue;
            }
            const propertyName = getPropertyValue<string>(propertyNode, 0);
            if (propertyName && !known.has(propertyName)) {
                unknown.add(propertyName);
            }
        }
    }
    return Array.from(unknown).sort();
}

function degreesToRadians(degrees: number): number {
    return (degrees * Math.PI) / 180;
}

function radiansToDegrees(radians: number): number {
    return (radians * 180) / Math.PI;
}
