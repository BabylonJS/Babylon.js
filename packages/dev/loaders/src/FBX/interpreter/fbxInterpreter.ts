/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
import { extractNodeTransform } from "./nodeTransform";
import {
    extractUserProperties,
    getPropertyEntries,
    type FBXUserPropertyValue,
    extractPropertyTemplates,
    getPropertyTemplate,
    resolveNumberProperty,
    resolvePropertyValue,
    resolveVector3Property,
    type FBXPropertyTemplate,
    type FBXPropertyTemplateMap,
} from "./propertyTemplates";
import { type FBXDocument, type FBXNode, findDocumentNode, findChildByName, getPropertyValue, cleanFBXName, getNodeArray } from "../types/fbxTypes";

import { resolveConnections, getChildren, type FBXObjectMap } from "./connections";
import { extractGeometry, type FBXGeometryData } from "./geometry";
import { extractLineGeometry, extractNurbsCurveGeometry, nurbsSurfaceToGeometry, type FBXCurveGeometryData } from "./nurbs";
import { isLegacyDocument, upgradeLegacyDocument } from "./legacyDocument";
import { extractConstraints, type FBXConstraintData } from "./constraints";
import { extractMaterial, extractTextureRef, type FBXMaterialData } from "./materials";
import { extractSkins, type FBXSkinData } from "./skeleton";
import { resolveRigs, type FBXRigData } from "./rig";
import { extractAnimations, type FBXAnimationStackData } from "./animation";
import { extractBlendShapes, type FBXBlendShapeData } from "./blendShapes";
import { extractSceneDiagnostics, type FBXSceneDiagnostic } from "./sceneDiagnostics";

/** Represents a model (transform node) in the FBX scene */
export interface FBXModelData {
    id: number;
    name: string;
    subType: string;
    /** Geometry attached to this model (meshes and tessellated NURBS surfaces) */
    geometry?: FBXGeometryData;
    /** Curve geometry attached to this model (Line and NurbsCurve) */
    curve?: FBXCurveGeometryData;
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
    customProperties?: Record<string, FBXUserPropertyValue>;
    /** LOD group settings when this model is a LodGroup; children are the levels in order */
    lodGroup?: FBXLodGroupData;
    /** Display layer (CollectionExclusive) the model belongs to */
    displayLayer?: FBXDisplayLayerData;
    /** Recoverable model import diagnostics */
    diagnostics: string[];
}

/** LOD group settings (NodeAttribute "LodGroup") */
export interface FBXLodGroupData {
    /** Switch distance for level i+1 (level 0 has none). In scene units, or percent of screen when `relative`. */
    thresholds: number[];
    /** ThresholdsUsedAsPercentage */
    relative: boolean;
    /** DisplayLevels|LevelN: 0 use LOD, 1 show, 2 hide */
    displayLevels: number[];
}

/** Display layer (CollectionExclusive "DisplayLayer") */
export interface FBXDisplayLayerData {
    id: number;
    name: string;
    show: boolean;
    freeze: boolean;
    color: [number, number, number];
    modelIds: number[];
}

/** One member of a selection set: a model, optionally with a component selection on its mesh */
export interface FBXSelectionNodeData {
    modelId: number;
    /** IsTheNodeInSet: the whole node is selected (as opposed to only components) */
    includeNode: boolean;
    /** Selected control point indices (VertexIndexArray) */
    vertices?: number[];
    /** Selected edge indices (EdgeIndexArray) */
    edges?: number[];
    /** Selected polygon indices (PolygonIndexArray) */
    faces?: number[];
}

/** Selection set (Collection "SelectionSet") */
export interface FBXSelectionSetData {
    id: number;
    name: string;
    members: FBXSelectionNodeData[];
}

/** Camera data extracted from FBX */
export interface FBXCameraData {
    /** Model ID this camera is attached to */
    modelId: number;
    /** NodeAttribute object ID (animation curves target this) */
    attributeId: number;
    /** Camera name */
    name: string;
    /** Vertical field of view in degrees */
    fieldOfView: number;
    /** Horizontal field of view in degrees */
    fieldOfViewX: number;
    /** ApertureMode: 0 horizontal and vertical, 1 horizontal, 2 vertical, 3 focal length */
    apertureMode: number;
    /** Aperture (film gate after gate fit) size in inches */
    apertureSizeInch: [number, number];
    /** Orthographic view size (width, height) in scene units */
    orthographicSize: [number, number];
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
    /** User-defined properties on the camera attribute */
    userProperties?: Record<string, FBXUserPropertyValue>;
    /** Known unsupported or unrecognized camera properties */
    unknownProperties: string[];
    /** Recoverable camera import diagnostics */
    diagnostics: string[];
}

/** Light data extracted from FBX */
export interface FBXLightData {
    /** Model ID this light is attached to */
    modelId: number;
    /** NodeAttribute object ID (animation curves target this) */
    attributeId: number;
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
    /** Near/far attenuation ranges in scene units (when enabled) */
    nearAttenuationStart?: number;
    nearAttenuationEnd?: number;
    farAttenuationStart?: number;
    farAttenuationEnd?: number;
    /** Area light shape: 0 rectangle, 1 sphere */
    areaLightShape?: number;
    /** User-defined properties on the light attribute */
    userProperties?: Record<string, FBXUserPropertyValue>;
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
    /** All curve geometries (lines and tessellated NURBS curves) */
    curves: FBXCurveGeometryData[];
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
    /** Constraints (aim, parent, position, rotation, scale, IK) */
    constraints: FBXConstraintData[];
    /** Display layers */
    displayLayers: FBXDisplayLayerData[];
    /** Selection sets */
    selectionSets: FBXSelectionSetData[];
    /** Global settings */
    upAxis: number;
    upAxisSign: number;
    frontAxis: number;
    frontAxisSign: number;
    coordAxis: number;
    coordAxisSign: number;
    unitScaleFactor: number;
    /** Scene frame rate derived from GlobalSettings TimeMode / CustomFrameRate */
    frameRate: number;
}

/**
 * Interpret a parsed FBX document into scene data.
 */
/** Options controlling how the document is interpreted. */
export interface FBXInterpretOptions {
    /** Segments per knot span when tessellating NURBS surfaces; defaults to the Step stored in the file */
    nurbsSubdivision?: number;
}

export function interpretFBX(doc: FBXDocument, options: FBXInterpretOptions = {}): FBXSceneData {
    if (isLegacyDocument(doc)) {
        doc = upgradeLegacyDocument(doc);
    }
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

    attachLegacyLayerTextures(objectMap, materials, propertyTemplates);

    // Extract all geometries
    const geometries: FBXGeometryData[] = [];
    const curves: FBXCurveGeometryData[] = [];
    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "Geometry") {
            const subType = getPropertyValue<string>(node, 2);
            if (subType === "Mesh") {
                const geometry = extractGeometry(node, id);
                // Edge-only or empty meshes have nothing to render; keep the node but drop the mesh.
                if (geometry.positions.length > 0 && geometry.indices.length > 0) {
                    geometries.push(geometry);
                }
            } else if (subType === "NurbsSurface") {
                const geometry = nurbsSurfaceToGeometry(node, id, options.nurbsSubdivision);
                if (geometry) {
                    geometries.push(geometry);
                }
            } else if (subType === "TrimNurbsSurface") {
                // The trimmed surface is rendered untrimmed: the underlying NurbsSurface is a child of the trim.
                const surfaceChild = getChildren(objectMap, id, "Geometry").find((child) => getPropertyValue<string>(child.node, 2) === "NurbsSurface");
                const geometry = surfaceChild ? nurbsSurfaceToGeometry(surfaceChild.node, id, options.nurbsSubdivision) : null;
                if (geometry) {
                    geometry.diagnostics.push({
                        type: "nurbs-trim-ignored",
                        message: `Trim curves of NURBS surface '${geometry.name}' are ignored; the surface is rendered untrimmed.`,
                    });
                    geometries.push(geometry);
                }
            } else if (subType === "NurbsCurve") {
                curves.push(extractNurbsCurveGeometry(node, id));
            } else if (subType === "Line") {
                curves.push(extractLineGeometry(node, id));
            }
        }
    }

    // Extract skeleton/skinning data
    const skins = extractSkins(objectMap, propertyTemplates);
    const rigs = resolveRigs(objectMap, skins);

    // Extract blend shape data
    const blendShapes = extractBlendShapes(objectMap);

    // Extract animation data
    const animations = extractAnimations(objectMap, doc);

    // Extract cameras and lights from NodeAttribute objects
    const cameras = extractCameras(objectMap, propertyTemplates);
    const lights = extractLights(objectMap, propertyTemplates);
    const diagnostics = extractSceneDiagnostics(objectMap);
    const constraints = extractConstraints(objectMap);

    // Build model hierarchy
    const rootModels = buildModelHierarchy(objectMap, geometries, curves, materials, propertyTemplates);
    const { displayLayers, selectionSets } = extractCollections(objectMap, rootModels);

    return {
        rootModels,
        displayLayers,
        selectionSets,
        constraints,
        geometries,
        curves,
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

// ── Legacy textures ────────────────────────────────────────────────────────────

/**
 * Pre-7000 files connect textures to the Model and select them per polygon through the mesh's LayerElementTexture
 * (TextureId indexes the model's textures), instead of connecting textures to material properties. Assign those
 * textures to the diffuse slot of the material used by the same polygons.
 */
function attachLegacyLayerTextures(objectMap: FBXObjectMap, materials: FBXMaterialData[], templates: FBXPropertyTemplateMap): void {
    const materialById = new Map(materials.map((m) => [m.id, m] as const));
    const textureTemplate = getPropertyTemplate(templates, "Texture", "FbxFileTexture") ?? getPropertyTemplate(templates, "Texture");
    for (const [modelId, modelNode] of Array.from(objectMap.objects)) {
        if (modelNode.name !== "Model") {
            continue;
        }
        const textureChildren = getChildren(objectMap, modelId, "Texture");
        if (textureChildren.length === 0) {
            continue;
        }
        const modelMaterials = getChildren(objectMap, modelId, "Material")
            .filter((c) => !c.propertyName)
            .map((c) => materialById.get(c.id))
            .filter((m): m is FBXMaterialData => m !== undefined);
        if (modelMaterials.length === 0) {
            continue;
        }
        const geometryNode = getChildren(objectMap, modelId, "Geometry")[0]?.node ?? modelNode;
        const materialLayer = findChildByName(geometryNode, "LayerElementMaterial");
        const materialIds = materialLayer ? getNodeArray(findChildByName(materialLayer, "Materials")) : null;

        // Each texture kind has its own layer element: LayerElementTexture (diffuse), LayerElementEmissiveTextures,
        // LayerElementSpecularTextures, LayerElementBumpTextures, ...
        const slotForElement = (elementName: string): { prop: string; fbx: keyof FBXMaterialData["model"]["fbx"]; pbr: keyof FBXMaterialData["model"]["pbr"] } | null => {
            const kind = elementName.replace(/^LayerElement/, "").replace(/Textures?$/, "");
            switch (kind) {
                case "":
                case "Diffuse":
                    return { prop: "DiffuseColor", fbx: "diffuseColor", pbr: "baseColor" };
                case "Emissive":
                    return { prop: "EmissiveColor", fbx: "emissionColor", pbr: "emissionColor" };
                case "Specular":
                    return { prop: "SpecularColor", fbx: "specularColor", pbr: "specularColor" };
                case "Ambient":
                    return { prop: "AmbientColor", fbx: "ambientColor", pbr: "ambientOcclusion" };
                case "Bump":
                case "NormalMap":
                    return { prop: "NormalMap", fbx: "normalMap", pbr: "normalMap" };
                case "Transparent":
                    return { prop: "TransparentColor", fbx: "transparencyColor", pbr: "opacity" };
                case "Reflection":
                    return { prop: "ReflectionColor", fbx: "reflectionColor", pbr: "specularColor" };
                case "Shininess":
                    return { prop: "ShininessExponent", fbx: "specularExponent", pbr: "roughness" };
                case "Displacement":
                    return { prop: "DisplacementColor", fbx: "displacement", pbr: "displacementMap" };
                default:
                    return null;
            }
        };

        const layerElements = geometryNode.children.filter((c) => /^LayerElement\w*Textures?$/.test(c.name));
        const textureRefs = textureChildren.map(({ id, node }) => extractTextureRef(id, node, undefined, objectMap, textureTemplate));
        const assign = (materialIndex: number, textureIndex: number, slot: NonNullable<ReturnType<typeof slotForElement>>) => {
            const material = modelMaterials[materialIndex];
            const source = textureRefs[textureIndex];
            if (!material || !source || material.textures.some((t) => t.propertyName === slot.prop)) {
                return;
            }
            const ref = { ...source, propertyName: slot.prop };
            material.textures.push(ref);
            const fbxMap = (material.model.fbx[slot.fbx] ??= { valueComponents: 0, textureEnabled: false });
            fbxMap.texture = ref;
            fbxMap.textureEnabled = true;
            const pbrMap = (material.model.pbr[slot.pbr] ??= { valueComponents: 0, textureEnabled: false });
            pbrMap.texture = ref;
            pbrMap.textureEnabled = true;
        };

        if (layerElements.length === 0) {
            // No layer element: a single texture on a single-material model is the diffuse map.
            if (modelMaterials.length === 1 && textureRefs.length === 1) {
                assign(0, 0, slotForElement("LayerElementTexture")!);
            }
            continue;
        }
        for (const element of layerElements) {
            const slot = slotForElement(element.name);
            const textureIds = getNodeArray(findChildByName(element, "TextureId"));
            if (!slot || !textureIds || textureIds.length === 0) {
                continue;
            }
            const polygonCount = Math.max(textureIds.length, materialIds?.length ?? 0);
            for (let poly = 0; poly < polygonCount; poly++) {
                const texIndex = textureIds[Math.min(poly, textureIds.length - 1)];
                const matIndex = materialIds && materialIds.length > 0 ? materialIds[Math.min(poly, materialIds.length - 1)] : 0;
                if (texIndex >= 0) {
                    assign(matIndex, texIndex, slot);
                }
            }
        }
    }
}

// ── Model Hierarchy ────────────────────────────────────────────────────────────

const MAX_MODEL_DEPTH = 512;

function buildModelHierarchy(
    objectMap: FBXObjectMap,
    geometries: FBXGeometryData[],
    curves: FBXCurveGeometryData[],
    materials: FBXMaterialData[],
    propertyTemplates: FBXPropertyTemplateMap
): FBXModelData[] {
    const geometryMap = new Map<number, FBXGeometryData>();
    for (const g of geometries) {
        geometryMap.set(g.id, g);
    }
    const curveMap = new Map<number, FBXCurveGeometryData>();
    for (const c of curves) {
        curveMap.set(c.id, c);
    }

    const materialMap = new Map<number, FBXMaterialData>();
    for (const m of materials) {
        materialMap.set(m.id, m);
    }

    // Find root models (those connected to ID 0, which is the scene root)
    const rootChildren = objectMap.childrenOf.get(0) ?? [];
    const rootModels: FBXModelData[] = [];
    const rootIds = new Set<number>();
    const buildStack = new Set<number>();

    for (const { id } of rootChildren) {
        const node = objectMap.objects.get(id);
        if (node && node.name === "Model" && !rootIds.has(id)) {
            rootIds.add(id);
            rootModels.push(buildModel(id, node, objectMap, geometryMap, curveMap, materialMap, propertyTemplates, buildStack));
        }
    }

    // Models without any Model (or scene root) parent connection also live at the root, as in the FBX SDK.
    // Typical examples are the default "Producer" cameras and the camera switcher written by Maya, MotionBuilder
    // and Blender in 6.x files, which are never connected.
    const hasModelParent = new Set<number>();
    for (const conn of objectMap.connections) {
        if (conn.type !== "OO") {
            continue;
        }
        const parentNode = objectMap.objects.get(conn.parentId);
        if (conn.parentId === 0 || parentNode?.name === "Model") {
            hasModelParent.add(conn.childId);
        }
    }
    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "Model" && !hasModelParent.has(id) && !rootIds.has(id)) {
            rootIds.add(id);
            rootModels.push(buildModel(id, node, objectMap, geometryMap, curveMap, materialMap, propertyTemplates, buildStack));
        }
    }

    return rootModels;
}

function buildModel(
    modelId: number,
    modelNode: FBXNode,
    objectMap: FBXObjectMap,
    geometryMap: Map<number, FBXGeometryData>,
    curveMap: Map<number, FBXCurveGeometryData>,
    materialMap: Map<number, FBXMaterialData>,
    propertyTemplates: FBXPropertyTemplateMap,
    buildStack: Set<number>
): FBXModelData {
    const name = cleanFBXName(getPropertyValue<string>(modelNode, 1) ?? "Model");
    buildStack.add(modelId);
    const subType = getPropertyValue<string>(modelNode, 2) ?? "Null";

    // Find attached geometry
    const geomChildren = getChildren(objectMap, modelId, "Geometry");
    const geometry = geomChildren.map((child) => geometryMap.get(child.id)).find((g) => g !== undefined);
    const curve = geomChildren.map((child) => curveMap.get(child.id)).find((c) => c !== undefined);

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
    // Only object-object connections express parenting; OP connections (look-at targets, constraint sources) do not.
    const childModelNodes = getChildren(objectMap, modelId, "Model").filter((child) => !child.propertyName);
    const children: FBXModelData[] = [];
    const cycleDiagnostics: string[] = [];
    for (const { id, node } of childModelNodes) {
        if (buildStack.size > MAX_MODEL_DEPTH) {
            cycleDiagnostics.push(`Model hierarchy deeper than ${MAX_MODEL_DEPTH} levels; deeper children were skipped.`);
            break;
        }
        if (buildStack.has(id)) {
            // Malformed files (duplicate ids, recursive connections) can make a model its own ancestor.
            cycleDiagnostics.push(`Model connection cycle detected at '${cleanFBXName(getPropertyValue<string>(node, 1) ?? "")}'; the recursive child was skipped.`);
            continue;
        }
        children.push(buildModel(id, node, objectMap, geometryMap, curveMap, materialMap, propertyTemplates, buildStack));
    }
    buildStack.delete(modelId);

    // Extract culling
    const cullingNode = modelNode.children.find((c) => c.name === "Culling");
    const cullingOff = cullingNode ? getPropertyValue<string>(cullingNode, 0) === "CullingOff" : false;

    // Extract user-defined custom properties
    const customProperties = extractCustomProperties(modelNode);

    // LOD groups carry their thresholds on the LodGroup node attribute
    let lodGroup: FBXLodGroupData | undefined;
    if (subType === "LodGroup") {
        const attribute = getChildren(objectMap, modelId, "NodeAttribute").find((a) => getPropertyValue<string>(a.node, 2) === "LodGroup");
        const entries = attribute ? getPropertyEntries(attribute.node) : [];
        const thresholds: number[] = [];
        const displayLevels: number[] = [];
        for (let i = 0; ; i++) {
            const entry = entries.find((e) => e.name === `Thresholds|Level${i}`);
            if (!entry) {
                break;
            }
            thresholds.push(typeof entry.values[0] === "number" ? entry.values[0] : 0);
        }
        for (let i = 0; ; i++) {
            const entry = entries.find((e) => e.name === `DisplayLevels|Level${i}`);
            if (!entry) {
                break;
            }
            displayLevels.push(typeof entry.values[0] === "number" ? entry.values[0] : 0);
        }
        const relativeEntry = entries.find((e) => e.name === "ThresholdsUsedAsPercentage");
        lodGroup = { thresholds, relative: !!relativeEntry && relativeEntry.values[0] !== 0 && relativeEntry.values[0] !== false, displayLevels };
    }

    return {
        id: modelId,
        name,
        subType,
        geometry,
        materials: modelMaterials,
        children,
        cullingOff,
        customProperties,
        lodGroup,
        curve,
        ...transform,
        diagnostics: [...transform.diagnostics, ...cycleDiagnostics],
    };
}

/** Display layers and selection sets: which models belong to which collection. */
function extractCollections(objectMap: FBXObjectMap, rootModels: FBXModelData[]): { displayLayers: FBXDisplayLayerData[]; selectionSets: FBXSelectionSetData[] } {
    const modelById = new Map<number, FBXModelData>();
    const walk = (models: FBXModelData[]) => {
        for (const m of models) {
            modelById.set(m.id, m);
            walk(m.children);
        }
    };
    walk(rootModels);

    const displayLayers: FBXDisplayLayerData[] = [];
    const selectionSets: FBXSelectionSetData[] = [];
    for (const [id, node] of Array.from(objectMap.objects)) {
        if (node.name === "CollectionExclusive") {
            const entries = getPropertyEntries(node);
            const num = (name: string, fallback: number) => {
                const v = entries.find((e) => e.name === name)?.values[0];
                return typeof v === "number" ? v : typeof v === "boolean" ? (v ? 1 : 0) : fallback;
            };
            const colorValues = entries.find((e) => e.name === "Color")?.values;
            const color: [number, number, number] =
                colorValues && typeof colorValues[0] === "number" && typeof colorValues[1] === "number" && typeof colorValues[2] === "number"
                    ? [colorValues[0], colorValues[1], colorValues[2]]
                    : [0.8, 0.8, 0.8];
            const layer: FBXDisplayLayerData = {
                id,
                name: cleanFBXName(getPropertyValue<string>(node, 1) ?? "DisplayLayer"),
                show: num("Show", 1) !== 0,
                freeze: num("Freeze", 0) !== 0,
                color,
                modelIds: getChildren(objectMap, id, "Model").map((c) => c.id),
            };
            displayLayers.push(layer);
            for (const modelId of layer.modelIds) {
                const model = modelById.get(modelId);
                if (model) {
                    model.displayLayer = layer;
                }
            }
        } else if (node.name === "SelectionSet" || (node.name === "Collection" && getPropertyValue<string>(node, 2) === "SelectionSet")) {
            const members: FBXSelectionNodeData[] = [];
            for (const child of getChildren(objectMap, id)) {
                if (child.node.name === "Model") {
                    members.push({ modelId: child.id, includeNode: true });
                } else if (child.node.name === "SelectionNode") {
                    const indices = (name: string): number[] | undefined => {
                        const arrayNode = findChildByName(child.node, name);
                        if (!arrayNode) {
                            return undefined;
                        }
                        return Array.from(getNodeArray(arrayNode) as ArrayLike<number>);
                    };
                    const inSet = findChildByName(child.node, "IsTheNodeInSet")?.properties[0]?.value;
                    for (const target of getChildren(objectMap, child.id, "Model")) {
                        members.push({
                            modelId: target.id,
                            includeNode: inSet === undefined || inSet === 1 || inSet === true,
                            vertices: indices("VertexIndexArray"),
                            edges: indices("EdgeIndexArray"),
                            faces: indices("PolygonIndexArray"),
                        });
                    }
                }
            }
            selectionSets.push({ id, name: cleanFBXName(getPropertyValue<string>(node, 1) ?? "SelectionSet"), members });
        }
    }
    return { displayLayers, selectionSets };
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
    return extractNodeTransform(modelNode, template);
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
    frameRate: number;
}

// Frame rates per FBX TimeMode enum value (eDefaultMode, eFrames120, ... eFrames59dot94).
const TIME_MODE_FPS = [30, 120, 100, 60, 50, 48, 30, 30, 29.97, 29.97, 25, 24, 1000, 23.976, 24, 96, 72, 59.94];

function extractGlobalSettings(doc: FBXDocument): GlobalSettings {
    const defaults: GlobalSettings = {
        upAxis: 1,
        upAxisSign: 1,
        frontAxis: 2,
        frontAxisSign: 1,
        coordAxis: 0,
        coordAxisSign: 1,
        unitScaleFactor: 1,
        frameRate: 30,
    };

    const gsNode = findDocumentNode(doc, "GlobalSettings");
    if (!gsNode) {
        return defaults;
    }

    let timeMode = 0;
    let customFrameRate = 24;

    for (const { name: propName, values } of getPropertyEntries(gsNode)) {
        const value = toNumber(values[0]);
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
                case "TimeMode":
                    timeMode = value;
                    break;
                case "CustomFrameRate":
                    customFrameRate = value;
                    break;
            }
        }
    }

    if (timeMode === 14) {
        defaults.frameRate = customFrameRate > 0 ? customFrameRate : 24;
    } else {
        defaults.frameRate = TIME_MODE_FPS[timeMode] ?? 30;
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

function extractCustomProperties(modelNode: FBXNode): Record<string, FBXUserPropertyValue> | undefined {
    // Properties flagged "U" are user-defined. Some writers (MotionBuilder) flag their own template properties
    // as user properties too, so the well-known node properties are filtered out again.
    const flagged = extractUserProperties(modelNode);
    if (!flagged) {
        return undefined;
    }
    let hasAny = false;
    const custom: Record<string, FBXUserPropertyValue> = {};
    for (const name of Object.keys(flagged)) {
        if (!SYSTEM_PROPERTIES.has(name)) {
            custom[name] = flagged[name];
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
        const projectionType =
            resolveNumberProperty(node, cameraTemplate, "CameraProjectionType", 0) === 1 || resolveNumberProperty(node, cameraTemplate, "ProjectionType", 0) === 1
                ? "orthographic"
                : "perspective";
        const focalLength = toNumber(resolvePropertyValue(node, cameraTemplate, "FocalLength"));
        const filmWidth = toNumber(resolvePropertyValue(node, cameraTemplate, "FilmWidth")) ?? toNumber(resolvePropertyValue(node, cameraTemplate, "ApertureWidth"));
        const filmHeight = toNumber(resolvePropertyValue(node, cameraTemplate, "FilmHeight")) ?? toNumber(resolvePropertyValue(node, cameraTemplate, "ApertureHeight"));
        const orthoZoom = toNumber(resolvePropertyValue(node, cameraTemplate, "OrthoZoom"));
        const roll = toNumber(resolvePropertyValue(node, cameraTemplate, "Roll"));
        const resolved = resolveCameraParameters(node, cameraTemplate);
        const aspectRatio = resolved.aspectRatio;
        const fieldOfView = resolved.fovDegY;
        const diagnostics: string[] = [];
        if (projectionType === "orthographic" && orthoZoom === undefined) {
            diagnostics.push("Orthographic camera has no OrthoZoom; runtime orthographic bounds use a fallback.");
        }
        if (focalLength !== undefined && filmHeight === undefined && resolvePropertyValue(node, cameraTemplate, "FieldOfView") === undefined) {
            diagnostics.push("FocalLength is present without FilmHeight; default field of view fallback may be used.");
        }

        cameras.push({
            modelId: parent.id,
            attributeId: id,
            userProperties: extractUserProperties(node),
            name,
            fieldOfView,
            fieldOfViewX: resolved.fovDegX,
            apertureMode: resolved.apertureMode,
            apertureSizeInch: resolved.apertureSizeInch,
            orthographicSize: resolved.orthographicSize,
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
            attributeId: id,
            userProperties: extractUserProperties(node),
            nearAttenuationStart: toNumber(resolvePropertyValue(node, lightTemplate, "NearAttenuationStart")),
            nearAttenuationEnd: toNumber(resolvePropertyValue(node, lightTemplate, "NearAttenuationEnd")),
            farAttenuationStart: toNumber(resolvePropertyValue(node, lightTemplate, "FarAttenuationStart")),
            farAttenuationEnd: toNumber(resolvePropertyValue(node, lightTemplate, "FarAttenuationEnd")),
            areaLightShape: toNumber(resolvePropertyValue(node, lightTemplate, "AreaLightShape")),
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
    return undefined;
}

function toBoolean(value: unknown): boolean | undefined {
    if (typeof value === "boolean") {
        return value;
    }
    if (typeof value === "number") {
        return value !== 0;
    }
    return undefined;
}

/** Film back sizes in thousandths of an inch per FBX ApertureFormat enum value. */
const APERTURE_FORMATS: [number, number][] = [
    [1000, 1000],
    [404, 295],
    [493, 292],
    [864, 630],
    [816, 612],
    [980, 735],
    [825, 446],
    [864, 732],
    [2066, 906],
    [1485, 991],
    [2080, 1480],
    [2772, 2072],
];

/**
 * Resolves the camera's projection parameters the way the FBX SDK does: aspect ratio from AspectWidth/Height and
 * the aspect mode, aperture (film gate) from the film size, squeeze ratio and gate fit, and the horizontal and
 * vertical field of view from the aperture mode (horizontal, vertical, both, or focal length).
 */
function resolveCameraParameters(
    node: FBXNode,
    template?: FBXPropertyTemplate
): { fovDegX: number; fovDegY: number; aspectRatio: number; apertureMode: number; apertureSizeInch: [number, number]; orthographicSize: [number, number] } {
    const num = (name: string, fallback: number) => toNumber(resolvePropertyValue(node, template, name)) ?? fallback;
    const aspectMode = num("AspectRatioMode", 0);
    const apertureMode = num("ApertureMode", 2);
    const apertureFormat = Math.max(0, Math.min(APERTURE_FORMATS.length - 1, Math.round(num("ApertureFormat", 0))));
    const gateFit = num("GateFit", 0);
    let aspectX = num("AspectW", 0);
    let aspectY = num("AspectH", 0);
    aspectX = num("AspectWidth", aspectX);
    aspectY = num("AspectHeight", aspectY);
    const fov = num("FieldOfView", 0);
    const fovX = num("FieldOfViewX", 0);
    const fovY = num("FieldOfViewY", 0);
    const focalLength = num("FocalLength", 0);
    const orthoExtent = 30 * num("OrthoZoom", 1);
    const format = APERTURE_FORMATS[apertureFormat];
    let filmX = num("FilmWidth", format[0] * 0.001);
    let filmY = num("FilmHeight", format[1] * 0.001);
    const squeeze = num("FilmSqueezeRatio", apertureFormat === 7 ? 2 : 1);

    if (aspectX <= 0 && aspectY <= 0) {
        aspectX = filmX > 0 ? filmX : 1;
        aspectY = filmY > 0 ? filmY : 1;
    } else if (aspectX <= 0) {
        aspectX = filmX > 0 && filmY > 0 ? (aspectY / filmY) * filmX : aspectY;
    } else if (aspectY <= 0) {
        aspectY = filmX > 0 && filmY > 0 ? (aspectX / filmX) * filmY : aspectX;
    }
    filmY *= squeeze;

    let resX = aspectX;
    let resY = aspectY;
    switch (aspectMode) {
        case 3: // fixed width
            resX = aspectX;
            resY = aspectX * aspectY;
            break;
        case 4: // fixed height
            resX = aspectY * aspectX;
            resY = aspectY;
            break;
        default:
            break;
    }
    const aspectRatio = resY !== 0 ? resX / resY : 1;
    const filmRatio = filmY !== 0 ? filmX / filmY : 1;

    let effectiveFit = gateFit;
    if (effectiveFit === 3) {
        effectiveFit = aspectRatio > filmRatio ? 2 : 1;
    } else if (effectiveFit === 4) {
        effectiveFit = aspectRatio < filmRatio ? 2 : 1;
    }
    let apertureX = filmX;
    let apertureY = filmY;
    let orthoX = orthoExtent;
    let orthoY = orthoExtent;
    switch (effectiveFit) {
        case 1: // vertical
            apertureX = filmY * aspectRatio;
            apertureY = filmY;
            orthoX = orthoExtent * aspectRatio;
            break;
        case 2: // horizontal
            apertureX = filmX;
            apertureY = filmX / aspectRatio;
            orthoY = orthoExtent / aspectRatio;
            break;
        default:
            break;
    }
    filmX = apertureX;
    void filmX;

    const d2r = Math.PI / 180;
    const r2d = 180 / Math.PI;
    let tanX: number;
    let tanY: number;
    switch (apertureMode) {
        case 0:
            tanX = Math.tan(fovX * d2r * 0.5);
            tanY = Math.tan(fovY * d2r * 0.5);
            break;
        case 1:
            tanX = Math.tan(fov * d2r * 0.5);
            tanY = tanX / aspectRatio;
            break;
        case 3: {
            const focalInch = focalLength / 25.4;
            tanX = focalInch > 0 ? (apertureX / focalInch) * 0.5 : Math.tan(fov * d2r * 0.5) * aspectRatio;
            tanY = focalInch > 0 ? (apertureY / focalInch) * 0.5 : Math.tan(fov * d2r * 0.5);
            break;
        }
        default:
            tanY = Math.tan(fov * d2r * 0.5);
            tanX = tanY * aspectRatio;
            break;
    }
    return {
        fovDegX: Math.atan(tanX) * r2d * 2,
        fovDegY: Math.atan(tanY) * r2d * 2,
        aspectRatio,
        apertureMode,
        apertureSizeInch: [apertureX, apertureY],
        orthographicSize: [orthoX, orthoY],
    };
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
