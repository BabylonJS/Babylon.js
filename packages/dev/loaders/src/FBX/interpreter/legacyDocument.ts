/* eslint-disable @typescript-eslint/naming-convention, jsdoc/require-param, jsdoc/require-returns */
/**
 * FBX 5.x (and older) documents store everything at the top level: one `Model` node per object with inline
 * geometry, materials, skin links, lights and cameras, and `Children` lists instead of connections. This module
 * rewrites such a document into the 6.x layout (`Objects`, `Connections`, `Takes`) so the rest of the importer
 * can treat both the same way. The rules follow the FBX SDK's legacy reader as implemented by ufbx.
 */
import { type FBXDocument, type FBXNode, type FBXProperty, findChildByName, findDocumentNode, getPropertyValue, getNodeArray, cleanFBXName } from "../types/fbxTypes";

const str = (value: string): FBXProperty => ({ type: "string", value });
const num = (value: number): FBXProperty => ({ type: "float64", value });
const int = (value: number): FBXProperty => ({ type: "int32", value });
const makeNode = (name: string, properties: FBXProperty[] = [], children: FBXNode[] = []): FBXNode => ({ name, properties, children });
const property60 = (name: string, typeName: string, flags: string, ...values: (number | string)[]): FBXNode =>
    makeNode("Property", [str(name), str(typeName), str(flags), ...values.map((v) => (typeof v === "string" ? str(v) : num(v)))]);
const arrayNode = (name: string, array: Float64Array | Int32Array): FBXNode => makeNode(name, [{ type: array instanceof Int32Array ? "int32[]" : "float64[]", value: array }]);

/** True for pre-6000 files: no `Objects` section but top-level `Model` nodes. */
export function isLegacyDocument(doc: FBXDocument): boolean {
    return !findDocumentNode(doc, "Objects") && doc.nodes.some((n) => n.name === "Model");
}

function numberAt(node: FBXNode | undefined, index = 0): number | undefined {
    const v = node?.properties[index]?.value;
    return typeof v === "number" ? v : typeof v === "boolean" ? (v ? 1 : 0) : undefined;
}

function numbers(node: FBXNode | undefined): number[] {
    if (!node) {
        return [];
    }
    const array = getNodeArray(node);
    return array ? Array.from(array as ArrayLike<number>) : [];
}

function toFloat64(node: FBXNode | undefined): Float64Array | null {
    const array = node ? getNodeArray(node) : null;
    if (!array) {
        return null;
    }
    return array instanceof Float64Array ? array : Float64Array.from(array as ArrayLike<number>);
}

function toInt32(node: FBXNode | undefined): Int32Array | null {
    const array = node ? getNodeArray(node) : null;
    if (!array) {
        return null;
    }
    return array instanceof Int32Array ? array : Int32Array.from(array as ArrayLike<number>, (v) => Math.trunc(v));
}

/** Default (rest) value of a `Channel` tree: T/R/S each with X/Y/Z sub channels carrying `Default`. */
function readTransformChannelDefaults(transformChannel: FBXNode | undefined, out: { t?: number[]; r?: number[]; s?: number[] }): void {
    if (!transformChannel) {
        return;
    }
    for (const sub of transformChannel.children) {
        if (sub.name !== "Channel") {
            continue;
        }
        const kind = getPropertyValue<string>(sub, 0);
        const key = kind === "T" ? "t" : kind === "R" ? "r" : kind === "S" ? "s" : undefined;
        if (!key || out[key]) {
            continue;
        }
        const values = [0, 0, 0];
        let any = false;
        for (const axis of sub.children) {
            if (axis.name !== "Channel") {
                continue;
            }
            const axisName = getPropertyValue<string>(axis, 0);
            const index = axisName === "X" ? 0 : axisName === "Y" ? 1 : axisName === "Z" ? 2 : -1;
            const value = numberAt(findChildByName(axis, "Default"));
            if (index >= 0 && value !== undefined) {
                values[index] = value;
                any = true;
            }
        }
        if (any) {
            out[key] = values;
        }
    }
}

function channelHasKeys(channel: FBXNode): boolean {
    const keys = findChildByName(channel, "Key");
    if (keys && keys.properties.length > 0) {
        return true;
    }
    return channel.children.some((c) => c.name === "Channel" && channelHasKeys(c));
}

interface LegacyContext {
    version: number;
    objects: FBXNode[];
    connections: FBXNode[];
    usedNames: Map<string, number>;
    /** Model raw name → transform channel defaults from the takes */
    takeDefaults: Map<string, FBXNode>;
}

function uniqueName(ctx: LegacyContext, name: string): string {
    const count = ctx.usedNames.get(name) ?? 0;
    ctx.usedNames.set(name, count + 1);
    return count === 0 ? name : `${name} (${count + 1})`;
}

function connect(ctx: LegacyContext, child: string, parent: string): void {
    ctx.connections.push(makeNode("C", [str("OO"), str(child), str(parent)]));
}

function normalize3(array: Float64Array): Float64Array {
    const out = new Float64Array(array.length);
    for (let i = 0; i + 2 < array.length; i += 3) {
        const x = array[i],
            y = array[i + 1],
            z = array[i + 2];
        const len = Math.hypot(x, y, z);
        if (len > 0) {
            out[i] = x / len;
            out[i + 1] = y / len;
            out[i + 2] = z / len;
        }
    }
    return out;
}

/** Converts the inline polygon mesh of a legacy model into 6.x-style geometry children. */
function convertMesh(model: FBXNode, version: number): FBXNode[] {
    const vertices = toFloat64(findChildByName(model, "Vertices"));
    const indices = toInt32(findChildByName(model, "PolygonVertexIndex"));
    if (!vertices || !indices) {
        return [];
    }
    const numVertices = Math.floor(vertices.length / 3);
    const numIndices = indices.length;
    if (numIndices > 0 && indices[numIndices - 1] >= 0) {
        indices[numIndices - 1] = ~indices[numIndices - 1];
    }
    const out: FBXNode[] = [makeNode("GeometryVersion", [int(124)]), arrayNode("Vertices", vertices), arrayNode("PolygonVertexIndex", indices)];

    // Normals are per vertex or per polygon-vertex, decided by their count (5000 files prefer per vertex).
    const normals = toFloat64(findChildByName(model, "Normals"));
    if (normals) {
        const count = Math.floor(normals.length / 3);
        const perVertex = count === numVertices;
        const perIndex = count === numIndices;
        const mapping = perVertex && (!perIndex || version === 5000) ? "ByVertice" : perIndex ? "ByPolygonVertex" : undefined;
        if (mapping) {
            out.push(
                makeNode(
                    "LayerElementNormal",
                    [int(0)],
                    [
                        makeNode("Version", [int(101)]),
                        makeNode("Name", [str("")]),
                        makeNode("MappingInformationType", [str(mapping)]),
                        makeNode("ReferenceInformationType", [str("Direct")]),
                        arrayNode("Normals", normalize3(normals)),
                    ]
                )
            );
        }
    }

    const uvInfo = findChildByName(model, "GeometryUVInfo");
    const uv = uvInfo ? toFloat64(findChildByName(uvInfo, "TextureUV")) : null;
    if (uvInfo && uv) {
        const uvIndex = toInt32(findChildByName(uvInfo, "TextureUVVerticeIndex"));
        const numUV = Math.floor(uv.length / 2);
        let element: FBXNode | undefined;
        const base = [makeNode("Version", [int(101)]), makeNode("Name", [str("")])];
        if (uvIndex && uvIndex.length === numIndices) {
            element = makeNode(
                "LayerElementUV",
                [int(0)],
                [
                    ...base,
                    makeNode("MappingInformationType", [str("ByPolygonVertex")]),
                    makeNode("ReferenceInformationType", [str("IndexToDirect")]),
                    arrayNode("UV", uv),
                    arrayNode("UVIndex", uvIndex),
                ]
            );
        } else if (numUV === numIndices) {
            element = makeNode(
                "LayerElementUV",
                [int(0)],
                [...base, makeNode("MappingInformationType", [str("ByPolygonVertex")]), makeNode("ReferenceInformationType", [str("Direct")]), arrayNode("UV", uv)]
            );
        } else if (numUV === numVertices) {
            element = makeNode(
                "LayerElementUV",
                [int(0)],
                [...base, makeNode("MappingInformationType", [str("ByVertice")]), makeNode("ReferenceInformationType", [str("Direct")]), arrayNode("UV", uv)]
            );
        }
        if (element) {
            out.push(element);
        }
    }

    const assignation = getPropertyValue<string>(findChildByName(model, "MaterialAssignation") ?? makeNode("x"), 0);
    const materials = toInt32(findChildByName(model, "Materials"));
    if (materials && materials.length > 0) {
        const mapping = assignation === "ByPolygon" ? "ByPolygon" : "AllSame";
        out.push(
            makeNode(
                "LayerElementMaterial",
                [int(0)],
                [
                    makeNode("Version", [int(101)]),
                    makeNode("Name", [str("")]),
                    makeNode("MappingInformationType", [str(mapping)]),
                    makeNode("ReferenceInformationType", [str("IndexToDirect")]),
                    arrayNode("Materials", mapping === "AllSame" ? Int32Array.of(materials[0]) : materials),
                ]
            )
        );
    }

    // Blend shapes keep the 6.x inline form; the connection resolver turns them into deformers.
    for (const child of model.children) {
        if (child.name === "Shape") {
            out.push(child);
        }
    }
    return out;
}

/** Legacy materials are embedded in the model; each becomes its own object connected to the model. */
function convertMaterials(ctx: LegacyContext, model: FBXNode, modelName: string): void {
    for (const child of model.children) {
        if (child.name !== "Material") {
            continue;
        }
        const rawName = getPropertyValue<string>(child, 0) ?? "Material";
        const name = uniqueName(ctx, rawName.includes("::") ? rawName : `Material::${rawName}`);
        const color = (source: string, target: string): FBXNode | null => {
            const values = numbers(findChildByName(child, source));
            return values.length >= 3 ? property60(target, "ColorRGB", "", values[0], values[1], values[2]) : null;
        };
        const scalar = (source: string, target: string): FBXNode | null => {
            const value = numberAt(findChildByName(child, source));
            return value !== undefined ? property60(target, "double", "", value) : null;
        };
        const properties = [
            color("Ambient", "AmbientColor"),
            color("Diffuse", "DiffuseColor"),
            color("Specular", "SpecularColor"),
            color("Emissive", "EmissiveColor"),
            scalar("Shininess", "Shininess"),
            scalar("Alpha", "Opacity"),
            scalar("Reflectivity", "ReflectionFactor"),
        ].filter((p): p is FBXNode => p !== null);
        const shading = findChildByName(child, "ShadingModel");
        ctx.objects.push(
            makeNode(
                "Material",
                [str(name), str("")],
                [makeNode("Version", [int(100)]), shading ?? makeNode("ShadingModel", [str("phong")]), makeNode("Properties60", [], properties)]
            )
        );
        connect(ctx, name, modelName);
    }
}

/** `Link` children are skin clusters bound to other models. */
function convertLinks(ctx: LegacyContext, model: FBXNode, modelName: string): void {
    const links = model.children.filter((c) => c.name === "Link");
    if (links.length === 0) {
        return;
    }
    const skinName = uniqueName(ctx, `Deformer::Skin ${cleanFBXName(modelName)}`);
    ctx.objects.push(makeNode("Deformer", [str(skinName), str("Skin")], [makeNode("Version", [int(100)]), makeNode("Link_DeformAcuracy", [num(50)])]));
    connect(ctx, skinName, modelName);
    for (const link of links) {
        const boneName = getPropertyValue<string>(link, 0) ?? "";
        const clusterName = uniqueName(ctx, `SubDeformer::Cluster ${cleanFBXName(modelName)} ${cleanFBXName(boneName)}`);
        const children: FBXNode[] = [makeNode("Version", [int(100)]), makeNode("Mode", [str("Normalize")])];
        for (const arrayName of ["Indexes", "Weights", "Transform", "TransformLink"]) {
            const child = findChildByName(link, arrayName);
            if (!child) {
                continue;
            }
            const array = arrayName === "Indexes" ? toInt32(child) : toFloat64(child);
            if (array) {
                children.push(arrayNode(arrayName, array));
            }
        }
        ctx.objects.push(makeNode("Deformer", [str(clusterName), str("Cluster")], children));
        connect(ctx, clusterName, skinName);
        connect(ctx, boneName, clusterName);
    }
}

function lightProperties(model: FBXNode): FBXNode[] {
    const out: FBXNode[] = [];
    const lightType = numberAt(findChildByName(model, "LightType"));
    if (lightType !== undefined) {
        out.push(property60("LightType", "enum", "", lightType));
    }
    const color = numbers(findChildByName(model, "Color"));
    if (color.length >= 3) {
        out.push(property60("Color", "ColorRGB", "", color[0], color[1], color[2]));
    }
    const scalars: [string, string][] = [
        ["Intensity", "Intensity"],
        ["ConeAngle", "OuterAngle"],
        ["HotSpot", "InnerAngle"],
    ];
    for (const [source, target] of scalars) {
        const value = numberAt(findChildByName(model, source));
        if (value !== undefined) {
            out.push(property60(target, "double", "", value));
        }
    }
    const castShadows = numberAt(findChildByName(model, "CastShadows"));
    if (castShadows !== undefined) {
        out.push(property60("CastShadows", "bool", "", castShadows));
    }
    return out;
}

function cameraProperties(model: FBXNode): FBXNode[] {
    const out: FBXNode[] = [];
    const scalars: [string, string][] = [
        ["Aperture", "FieldOfView"],
        ["FieldOfViewXProperty", "FieldOfViewX"],
        ["FieldOfViewYProperty", "FieldOfViewY"],
        ["SqueezeRatio", "FilmSqueezeRatio"],
        ["FocalLength", "FocalLength"],
        ["AspectType", "AspectRatioMode"],
        ["AspectW", "AspectWidth"],
        ["AspectH", "AspectHeight"],
        ["ApertureMode", "ApertureMode"],
        ["NearPlane", "NearPlane"],
        ["FarPlane", "FarPlane"],
        ["Roll", "Roll"],
    ];
    for (const [source, target] of scalars) {
        const value = numberAt(findChildByName(model, source));
        if (value !== undefined) {
            out.push(property60(target, target === "AspectRatioMode" || target === "ApertureMode" ? "enum" : "double", "", value));
        }
    }
    const aperture = numbers(findChildByName(model, "CameraAperture"));
    if (aperture.length >= 2) {
        out.push(property60("FilmWidth", "double", "", aperture[0]));
        out.push(property60("FilmHeight", "double", "", aperture[1]));
    }
    return out;
}

function convertModel(ctx: LegacyContext, model: FBXNode): void {
    const rawName = getPropertyValue<string>(model, 0) ?? "Model";
    const typeName = getPropertyValue<string>(findChildByName(model, "Type") ?? makeNode("x"), 0);
    const hasVertices = !!findChildByName(model, "Vertices");
    const subType = typeName === "Light" ? "Light" : typeName === "Camera" ? "Camera" : typeName === "LimbNode" ? "LimbNode" : hasVertices ? "Mesh" : "Null";

    // Rest transform: defaults of the model's own channels, else of the take channels.
    const defaults: { t?: number[]; r?: number[]; s?: number[] } = {};
    const ownTransform = model.children.find((c) => c.name === "Channel" && getPropertyValue<string>(c, 0) === "Transform");
    readTransformChannelDefaults(ownTransform, defaults);
    readTransformChannelDefaults(ctx.takeDefaults.get(rawName), defaults);
    const t = defaults.t ?? [0, 0, 0];
    const r = defaults.r ?? [0, 0, 0];
    const s = defaults.s ?? [1, 1, 1];
    const properties: FBXNode[] = [
        property60("Lcl Translation", "Lcl Translation", "A+", t[0], t[1], t[2]),
        property60("Lcl Rotation", "Lcl Rotation", "A+", r[0], r[1], r[2]),
        property60("Lcl Scaling", "Lcl Scaling", "A+", s[0], s[1], s[2]),
    ];
    const visibilityChannel = model.children.find((c) => c.name === "Channel" && getPropertyValue<string>(c, 0) === "Visibility");
    const visibility = numberAt(findChildByName(visibilityChannel ?? makeNode("x"), "Default"));
    if (visibility !== undefined && visibility <= 0) {
        properties.push(property60("Visibility", "Visibility", "A+", 0));
    }
    if (subType === "Light") {
        properties.push(...lightProperties(model));
    } else if (subType === "Camera") {
        properties.push(...cameraProperties(model));
    } else if (subType === "LimbNode") {
        const size = numberAt(findChildByName(findChildByName(model, "Properties") ?? makeNode("x"), "Size"));
        if (size !== undefined) {
            properties.push(property60("Size", "double", "", size));
        }
    }

    const children: FBXNode[] = [makeNode("Version", [int(232)]), makeNode("Properties60", [], properties)];
    for (const name of ["Culling", "Position", "Up", "LookAt"]) {
        const child = findChildByName(model, name);
        if (child) {
            children.push(child);
        }
    }
    if (subType === "Mesh") {
        children.push(...convertMesh(model, ctx.version));
    }
    ctx.objects.push(makeNode("Model", [str(rawName), str(subType)], children));

    convertMaterials(ctx, model, rawName);
    convertLinks(ctx, model, rawName);

    const childNames = findChildByName(model, "Children");
    for (const p of childNames?.properties ?? []) {
        if (typeof p.value === "string") {
            connect(ctx, p.value, rawName);
        }
    }
}

/** Rewrites a legacy document into the 6.x object/connection layout. */
export function upgradeLegacyDocument(doc: FBXDocument): FBXDocument {
    const headerVersion = numberAt(findChildByName(findDocumentNode(doc, "FBXHeaderExtension") ?? makeNode("x"), "FBXVersion"));
    const version = Math.max(doc.version, headerVersion ?? 0);
    const ctx: LegacyContext = { version, objects: [], connections: [], usedNames: new Map(), takeDefaults: new Map() };

    // Takes keep their format; their Transform channels also provide rest values for models without own channels.
    const takes = findDocumentNode(doc, "Takes");
    for (const take of takes?.children ?? []) {
        if (take.name !== "Take") {
            continue;
        }
        for (const model of take.children) {
            if (model.name !== "Model") {
                continue;
            }
            const name = getPropertyValue<string>(model, 0);
            const transform = model.children.find((c) => c.name === "Channel" && getPropertyValue<string>(c, 0) === "Transform");
            if (name && transform && !ctx.takeDefaults.has(name)) {
                ctx.takeDefaults.set(name, transform);
            }
        }
    }

    const models = doc.nodes.filter((n) => n.name === "Model");
    for (const model of models) {
        convertModel(ctx, model);
    }

    // Animation stored directly on models (pre-5800) becomes an implicit take, as in the SDK.
    const implicitModels: FBXNode[] = [];
    for (const model of models) {
        const channels = model.children.filter((c) => c.name === "Channel" && channelHasKeys(c));
        if (channels.length > 0) {
            implicitModels.push(makeNode("Model", [str(getPropertyValue<string>(model, 0) ?? "")], channels));
        }
    }
    let takesNode = takes;
    if (implicitModels.length > 0) {
        const implicitTake = makeNode("Take", [str("(internal)")], implicitModels);
        takesNode = takes ? makeNode("Takes", takes.properties, [...takes.children, implicitTake]) : makeNode("Takes", [], [implicitTake]);
    }

    // Frame rate from the legacy settings block.
    const settings = findDocumentNode(doc, "Settings") ?? findChildByName(findDocumentNode(doc, "Version5") ?? makeNode("x"), "Settings");
    const frameRateNode = settings ? findChildByName(settings, "FrameRate") : undefined;
    const frameRateValue = frameRateNode?.properties[0]?.value;
    const fps = typeof frameRateValue === "number" ? frameRateValue : typeof frameRateValue === "string" ? Number.parseFloat(frameRateValue) : NaN;
    const extra: FBXNode[] = [];
    if (Number.isFinite(fps) && fps > 0) {
        extra.push(
            makeNode(
                "GlobalSettings",
                [],
                [makeNode("Version", [int(1000)]), makeNode("Properties60", [], [property60("TimeMode", "enum", "", 14), property60("CustomFrameRate", "double", "", fps)])]
            )
        );
    }

    const kept = doc.nodes.filter((n) => n.name !== "Model" && n.name !== "Takes" && n.name !== "Settings" && n.name !== "GlobalSettings");
    const nodes = [...kept, ...extra, makeNode("Objects", [], ctx.objects), makeNode("Connections", [], ctx.connections)];
    if (takesNode) {
        nodes.push(takesNode);
    }
    return { ...doc, version, nodes };
}
