import {
    type IResolvedDiagnostic,
    type IResolvedMaterial,
    type IResolvedMesh,
    type IResolvedPrim,
    type IResolvedSkeleton,
    type IResolvedStage,
    type IStageMetadata,
} from "../resolvedStage";
import { type ISdfLayer, type ISdfPrimSpec } from "../sdf/index";
import { ResolvePrimAnimation } from "./animationMapping";
import { ResolveCamera } from "./cameraMapping";
import { ResolveMaterialIndex, GetMaterialBindingPath, GetDisplayColorFallback } from "./materialMapping";
import { type IStageMappingContext } from "./mappingContext";
import { BuildMeshPoolKey, CollectInheritablePrimvars, EmptyInheritedPrimvars, ResolveMesh, type IInheritedPrimvars } from "./meshMapping";
import { ResolveSkeletonIndex, ResolveSkinning } from "./skeletonMapping";
import { IdentityTransform, ResolveTransform } from "./transformMapping";
import { AsToken, GetAttribute, GetAttributeValue, GetRelationship, GetRelationshipTargets } from "./valueAccess";

type StageMapperContext = IStageMappingContext & {
    skeletons: IResolvedSkeleton[];
    skeletonIndexByPath: Map<string, number>;
    pointInstancerPrototypePaths: ReadonlySet<string>;
};

/**
 * Maps one validated and normalized USDA layer into the read-only resolved stage contract.
 * @param layer single Sdf layer to map
 * @returns resolved stage consumed by the Babylon USD adapter
 */
export function MapLayerToResolvedStage(layer: ISdfLayer): IResolvedStage {
    const diagnostics: IResolvedDiagnostic[] = [];
    const meshes: IResolvedMesh[] = [];
    const materials: IResolvedMaterial[] = [];
    const skeletons: IResolvedSkeleton[] = [];
    const context: StageMapperContext = {
        layer,
        primByPath: BuildPrimIndex(layer.rootPrims),
        meshes,
        materials,
        skeletons,
        meshIndexByKey: new Map(),
        materialIndexByPath: new Map(),
        skeletonIndexByPath: new Map(),
        pointInstancerPrototypePaths: CollectPointInstancerPrototypePaths(layer.rootPrims),
        diagnostics,
    };
    const metadata = ResolveStageMetadata(layer, diagnostics);
    const root: IResolvedPrim = {
        path: "/",
        name: "",
        kind: "transform",
        transform: IdentityTransform(),
        visible: true,
        children: MapPrims(layer.rootPrims, true, metadata, context, undefined, EmptyInheritedPrimvars),
    };

    return {
        metadata,
        root,
        meshes,
        materials,
        skeletons,
        diagnostics,
    };
}

function ResolveStageMetadata(layer: ISdfLayer, diagnostics: IResolvedDiagnostic[]): IStageMetadata {
    return {
        upAxis: layer.upAxis === "Z" ? "Z" : "Y",
        metersPerUnit: layer.metersPerUnit ?? 0.01,
        timeCodesPerSecond: ResolveTimeCodesPerSecond(layer, diagnostics),
        startTimeCode: layer.startTimeCode ?? 0,
        endTimeCode: layer.endTimeCode ?? 0,
        defaultPrimPath: layer.defaultPrim ? (layer.defaultPrim.startsWith("/") ? layer.defaultPrim : `/${layer.defaultPrim}`) : undefined,
    };
}

// USD's default stage time-code rate.
const DefaultTimeCodesPerSecond = 24;

function IsValidRate(value: number): boolean {
    return Number.isFinite(value) && value > 0;
}

// Resolves the stage time-code rate: the divisor that converts authored time codes into seconds when baking
// time samples, so it must stay positive and finite or animation timing becomes infinite, NaN, or reversed.
// USD prefers `timeCodesPerSecond`, then the legacy `framesPerSecond`, then a default of 24, but validates the
// two fields with different severities to match OpenUSD:
//   - `framesPerSecond` is a validated layer field; OpenUSD rejects the entire layer when it is authored
//     non-positive or non-finite, so an invalid value is a fatal load error even when another rate is present.
//   - `timeCodesPerSecond` is not range-checked by OpenUSD and parses at 0 or negative, so an invalid value is
//     handled defensively: it is ignored with a warning and the next valid candidate (a valid `framesPerSecond`,
//     otherwise the default) is used so timing stays finite.
function ResolveTimeCodesPerSecond(layer: ISdfLayer, diagnostics: IResolvedDiagnostic[]): number {
    if (layer.framesPerSecond !== undefined && !IsValidRate(layer.framesPerSecond)) {
        throw new Error(`USD: invalid value for field framesPerSecond (${layer.framesPerSecond}); it must be a positive, finite number.`);
    }

    const fallback = layer.framesPerSecond ?? DefaultTimeCodesPerSecond;
    if (layer.timeCodesPerSecond === undefined) {
        return fallback;
    }
    if (IsValidRate(layer.timeCodesPerSecond)) {
        return layer.timeCodesPerSecond;
    }
    diagnostics.push({
        severity: "warning",
        message: `Ignoring non-positive or non-finite timeCodesPerSecond (${layer.timeCodesPerSecond}); using ${fallback} time codes per second instead.`,
    });
    return fallback;
}

function MapPrim(
    primSpec: ISdfPrimSpec,
    parentVisible: boolean,
    metadata: IStageMetadata,
    context: StageMapperContext,
    inheritedMaterialPath: string | undefined,
    inheritedPrimvars: IInheritedPrimvars
): IResolvedPrim {
    const visible = parentVisible && ResolveVisibility(primSpec);
    DiagnoseUnsupportedPurpose(primSpec, context.diagnostics);
    const prim: IResolvedPrim = {
        path: primSpec.path,
        name: primSpec.name,
        kind: "transform",
        transform: ResolveTransform(primSpec, context.diagnostics),
        visible,
        children: [],
    };

    // USD direct material bindings inherit down namespace, so a prim's own binding (when authored)
    // overrides the inherited one and becomes the binding seen by its whole subtree.
    const effectiveMaterialPath = GetMaterialBindingPath(primSpec) ?? inheritedMaterialPath;

    ApplySchemaPayload(prim, primSpec, metadata, context, effectiveMaterialPath, inheritedPrimvars);
    const animation = ResolvePrimAnimation(primSpec, context.layer, metadata, context.diagnostics);
    if (animation) {
        const tracks = animation.tracks.filter((track) => track.target !== "visibility" || prim.kind === "mesh");
        if (tracks.length !== animation.tracks.length) {
            context.diagnostics.push({ severity: "info", path: primSpec.path, message: "Animated visibility on non-mesh prims is not supported by the direct Babylon adapter." });
        }
        if (tracks.length > 0) {
            prim.animation = { tracks };
        }
    }
    // Constant primvars inherit down namespace, so descendants that omit them fall back to this
    // subtree's authored constants merged over the set inherited from ancestors.
    const childPrimvars = CollectInheritablePrimvars(primSpec, inheritedPrimvars);
    prim.children = MapPrims(primSpec.children, visible, metadata, context, effectiveMaterialPath, childPrimvars);
    return prim;
}

function ApplySchemaPayload(
    prim: IResolvedPrim,
    primSpec: ISdfPrimSpec,
    metadata: IStageMetadata,
    context: StageMapperContext,
    materialPath: string | undefined,
    inheritedPrimvars: IInheritedPrimvars
): void {
    const camera = ResolveCamera(primSpec);
    if (camera) {
        prim.kind = "camera";
        prim.camera = camera;
        if (camera.fStop !== undefined || camera.focusDistance !== undefined) {
            context.diagnostics.push({
                severity: "info",
                path: primSpec.path,
                message: "Camera depth-of-field settings are preserved in IResolvedCamera but are not applied by the direct Babylon adapter.",
            });
        }
        return;
    }

    if (primSpec.typeName === "Skeleton") {
        ResolveSkeletonIndex(primSpec.path, context, metadata.timeCodesPerSecond);
        return;
    }

    // Only polygonal UsdGeomMesh is in profile. Implicit gprims, point instancers, lights, curves,
    // points and volumes are diagnosed and skipped at this schema seam rather than mapped.
    const mesh = primSpec.typeName === "Mesh" ? ResolveMesh(primSpec, context, inheritedPrimvars) : undefined;
    if (!mesh) {
        ApplyUnsupportedSchemaDiagnostics(primSpec, context);
        return;
    }

    prim.kind = "mesh";
    prim.meshIndex = PoolMesh(mesh, context);
    if (materialPath) {
        prim.materialBinding = { materialIndex: ResolveMaterialIndex(materialPath, context, GetDisplayColorFallback(primSpec)) };
    }
    prim.skinning = ResolveSkinning(primSpec, context, metadata.timeCodesPerSecond, mesh);
}

function PoolMesh(mesh: NonNullable<ReturnType<typeof ResolveMesh>>, context: IStageMappingContext): number {
    const key = BuildMeshPoolKey(mesh);
    const existing = context.meshIndexByKey.get(key);
    if (existing !== undefined) {
        return existing;
    }
    const index = context.meshes.length;
    context.meshes.push(mesh);
    context.meshIndexByKey.set(key, index);
    return index;
}

function ResolveVisibility(primSpec: ISdfPrimSpec): boolean {
    return AsToken(GetAttributeValue(GetAttribute(primSpec, "visibility"))) !== "invisible";
}

// USD `purpose` (default/render/proxy/guide) is an inherited render-pass hint. This importer targets the
// default/glTF profile only, so it does not prune or reclassify geometry by purpose. A non-default authored
// purpose is diagnosed (rather than silently importing render/proxy/guide geometry as if it were default)
// so callers know the profile deviation. The opinion is inherited, so it is reported once at the prim that
// authors it and applies to that prim's whole subtree.
function DiagnoseUnsupportedPurpose(primSpec: ISdfPrimSpec, diagnostics: IResolvedDiagnostic[]): void {
    const purpose = AsToken(GetAttributeValue(GetAttribute(primSpec, "purpose")));
    if (purpose !== undefined && purpose !== "default") {
        diagnostics.push({
            severity: "warning",
            path: primSpec.path,
            message: `Prim purpose '${purpose}' is not supported; '${primSpec.path}' and its descendants are imported with default purpose.`,
        });
    }
}

function BuildPrimIndex(rootPrims: ISdfPrimSpec[]): ReadonlyMap<string, ISdfPrimSpec> {
    const primByPath = new Map<string, ISdfPrimSpec>();
    const visit = (prim: ISdfPrimSpec) => {
        primByPath.set(prim.path, prim);
        prim.children.forEach(visit);
    };
    rootPrims.forEach(visit);
    return primByPath;
}

function CollectPointInstancerPrototypePaths(rootPrims: ISdfPrimSpec[]): ReadonlySet<string> {
    const prototypePaths = new Set<string>();
    const visit = (prim: ISdfPrimSpec) => {
        if (prim.typeName === "PointInstancer") {
            for (const target of GetRelationshipTargets(GetRelationship(prim, "prototypes"))) {
                const prototypePath = ResolvePrimTargetPath(target, prim.path);
                if (prototypePath) {
                    prototypePaths.add(prototypePath);
                }
            }
        }
        prim.children.forEach(visit);
    };
    rootPrims.forEach(visit);
    return prototypePaths;
}

function ResolvePrimTargetPath(path: string, ownerPath: string): string {
    const leafStart = path.lastIndexOf("/") + 1;
    const leaf = path.slice(leafStart);
    const propertyIndex = leaf === "." || leaf === ".." ? -1 : path.indexOf(".", leafStart);
    const primPath = propertyIndex >= 0 ? path.slice(0, propertyIndex) : path;
    const segments = primPath.startsWith("/") ? [] : ownerPath.split("/").filter(Boolean);
    for (const segment of primPath.split("/")) {
        if (!segment || segment === ".") {
            continue;
        }
        if (segment === "..") {
            segments.pop();
        } else {
            segments.push(segment);
        }
    }
    return segments.length > 0 ? `/${segments.join("/")}` : "/";
}

function MapPrims(
    primSpecs: ISdfPrimSpec[],
    parentVisible: boolean,
    metadata: IStageMetadata,
    context: StageMapperContext,
    inheritedMaterialPath: string | undefined,
    inheritedPrimvars: IInheritedPrimvars
): IResolvedPrim[] {
    const prims: IResolvedPrim[] = [];
    for (const primSpec of primSpecs) {
        if (primSpec.typeName === "PointInstancer" || !context.pointInstancerPrototypePaths.has(primSpec.path)) {
            prims.push(MapPrim(primSpec, parentVisible, metadata, context, inheritedMaterialPath, inheritedPrimvars));
        }
    }
    return prims;
}

function ApplyUnsupportedSchemaDiagnostics(primSpec: ISdfPrimSpec, context: IStageMappingContext): void {
    if (IsUnsupportedLightSchema(primSpec.typeName)) {
        context.diagnostics.push({ severity: "info", path: primSpec.path, message: `Schema ${primSpec.typeName} mapping is not supported.` });
    } else if (primSpec.typeName === "PointInstancer") {
        context.diagnostics.push({
            severity: "info",
            path: primSpec.path,
            message: "PointInstancer prims are not supported by the USD loader; their prototype targets are also skipped.",
        });
    } else if (IsUnsupportedRenderableSchema(primSpec.typeName)) {
        context.diagnostics.push({ severity: "info", path: primSpec.path, message: `${primSpec.typeName} prims are not supported by the USD loader and were skipped.` });
    }
}

// Renderable USD schema types outside the polygonal-Mesh profile. They are skipped with a diagnostic
// rather than dropped silently or mapped into misleading geometry: implicit gprims, point instancers,
// curves, points, patches and volumes.
const UnsupportedRenderableSchemas = [
    "Cube",
    "Sphere",
    "Cylinder",
    "Cone",
    "Capsule",
    "Plane",
    "PointInstancer",
    "BasisCurves",
    "NurbsCurves",
    "HermiteCurves",
    "Points",
    "NurbsPatch",
    "TetMesh",
    "Volume",
];

function IsUnsupportedRenderableSchema(typeName: string | undefined): boolean {
    return typeName !== undefined && UnsupportedRenderableSchemas.includes(typeName);
}

// UsdLux lights are out of profile; every light schema is diagnosed and skipped.
function IsUnsupportedLightSchema(typeName: string | undefined): boolean {
    return typeName?.endsWith("Light") === true || typeName?.startsWith("UsdLux") === true;
}
