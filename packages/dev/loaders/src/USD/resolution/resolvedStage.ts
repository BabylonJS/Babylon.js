/**
 * The `ResolvedStage` contract: the single boundary between the USD *resolution layer*
 * (parsing + composition + stage/time evaluation) and the Babylon *adapter layer*.
 *
 * Design rules:
 * - Pure, plain data only. NO Babylon imports, NO USD-runtime objects, NO functions.
 * - Every USD semantic (composition arcs, variants, xformOp stacks, primvar interpolation,
 *   time samples, value clips, splines) is *already resolved* before objects of these types
 *   are produced. The adapter performs zero USD reasoning — it only maps this data onto
 *   Babylon nodes, meshes, materials, animations, lights and cameras.
 * - Coordinates are expressed in USD's native space (right-handed, units = `metersPerUnit`,
 *   up = `upAxis`). The adapter enables Babylon's right-handed scene mode and applies only
 *   up-axis / unit conversion; authored geometry buffers are not rewritten.
 *
 * Resource pooling: meshes, materials and skeletons live in flat arrays on `IResolvedStage`
 * and are referenced from prims by index, so that USD `instanceable` prims and `PointInstancer`
 * prototypes can share a single source without duplication.
 */

/** A 2-component vector `[x, y]`. */
export type Vec2 = [number, number];
/** A 3-component vector `[x, y, z]`. */
export type Vec3 = [number, number, number];
/** A 4-component vector `[x, y, z, w]`. */
export type Vec4 = [number, number, number, number];
/** A quaternion expressed as `[x, y, z, w]`. */
export type Quat = [number, number, number, number];
/** A 4x4 matrix as 16 numbers in USD `GfMatrix4d` flat layout (row-major, row-vector, translation in the last row), identical to Babylon's `Matrix.m`. */
export type Mat4 = number[];

/**
 * Fully-resolved stage handed from the resolution layer to the Babylon adapter.
 */
export interface IResolvedStage {
    /** Stage-level metadata (axes, units, time range). */
    metadata: IStageMetadata;
    /** The synthetic root prim. Its `children` are the stage's top-level prims; it carries no geometry. */
    root: IResolvedPrim;
    /** Shared mesh geometry pool. Prims and point-instancer prototypes reference entries by index. */
    meshes: IResolvedMesh[];
    /** Shared material pool. Mesh bindings reference entries by index. */
    materials: IResolvedMaterial[];
    /** Shared skeleton pool. Skinned meshes reference entries by index. */
    skeletons: IResolvedSkeleton[];
    /** Non-fatal diagnostics collected during resolution (composition warnings, skipped features, etc.). */
    diagnostics: IResolvedDiagnostic[];
}

/**
 * Deeply freezes the plain object/array graph of a resolved stage.
 *
 * Typed-array payloads stay readable and are intentionally not passed to `Object.freeze`, which
 * JavaScript rejects for non-empty views. Their containing objects and arrays are frozen, so the
 * resolution boundary cannot be structurally mutated or have buffers replaced.
 * @param stage the completed stage to freeze
 * @returns the same stage instance after freezing its plain-data graph
 */
export function FreezeResolvedStage(stage: IResolvedStage): IResolvedStage {
    FreezePlainData(stage, new Set<object>());
    return stage;
}

function FreezePlainData(value: unknown, visited: Set<object>): void {
    if (typeof value !== "object" || value === null || ArrayBuffer.isView(value) || visited.has(value)) {
        return;
    }

    visited.add(value);
    for (const child of Object.values(value)) {
        FreezePlainData(child, visited);
    }
    Object.freeze(value);
}

/** Severity of a resolution-time diagnostic. */
export type ResolvedDiagnosticSeverity = "info" | "warning" | "error";

/**
 * A structured, non-fatal diagnostic emitted while resolving the stage. Fatal problems
 * (invalid grammar, unsupported document version) are thrown instead of collected here.
 */
export interface IResolvedDiagnostic {
    /** Severity of the diagnostic. */
    severity: ResolvedDiagnosticSeverity;
    /** Human-readable message. */
    message: string;
    /** Optional USD prim/property path the diagnostic relates to. */
    path?: string;
}

/**
 * Stage-level metadata read from the root layer, used by the adapter for coordinate conversion
 * and animation timing.
 */
export interface IStageMetadata {
    /** Stage up axis. USD default is "Y". */
    upAxis: "Y" | "Z";
    /** Meters represented by one stage unit (USD `metersPerUnit`, default 0.01). */
    metersPerUnit: number;
    /** Time codes per second (USD `timeCodesPerSecond`, default 24). */
    timeCodesPerSecond: number;
    /** Start time code of the stage, in time codes. */
    startTimeCode: number;
    /** End time code of the stage, in time codes. */
    endTimeCode: number;
    /** Path of the stage `defaultPrim`, if authored. */
    defaultPrimPath?: string;
}

/** Discriminates the role a resolved prim plays in the Babylon scene graph. */
export type ResolvedPrimKind =
    /** Pure grouping/transform node (USD `Xform`, `Scope`, or any structural prim). */
    | "transform"
    /** A renderable mesh; `meshIndex` indexes `IResolvedStage.meshes`. */
    | "mesh"
    /** A USD `instanceable` instance sharing a prototype; `instanceSourceMeshIndex` indexes the shared mesh. */
    | "instance"
    /** A USD `PointInstancer`; `instancer` holds the per-instance data. */
    | "pointInstancer"
    /** A UsdLux light; `light` holds the resolved parameters. */
    | "light"
    /** A UsdGeomCamera; `camera` holds the resolved parameters. */
    | "camera";

/**
 * A node in the resolved prim tree. The discriminant is `kind`; the optional payload fields
 * that are populated depend on it (documented per field).
 */
export interface IResolvedPrim {
    /** Absolute USD prim path (e.g. `/World/Group/Mesh`). Used for node naming and diagnostics. */
    path: string;
    /** Leaf name of the prim (the last path component). */
    name: string;
    /** Role of this prim in the scene graph. */
    kind: ResolvedPrimKind;
    /** Resolved local transform relative to the parent prim. Always present (identity when none authored). */
    transform: IResolvedTransform;
    /** Resolved, inherited visibility. `false` produces a disabled Babylon node. */
    visible: boolean;
    /** Child prims. */
    children: IResolvedPrim[];

    /** `kind === "mesh"`: index into `IResolvedStage.meshes`. */
    meshIndex?: number;
    /** `kind === "mesh" | "instance"`: material binding for this prim. */
    materialBinding?: IResolvedMaterialBinding;
    /** `kind === "mesh"`: optional skinning data binding this mesh to a skeleton. */
    skinning?: IResolvedSkinning;

    /** `kind === "instance"`: index into `IResolvedStage.meshes` of the shared prototype mesh. */
    instanceSourceMeshIndex?: number;

    /** `kind === "pointInstancer"`: resolved point-instancer payload. */
    instancer?: IResolvedPointInstancer;

    /** `kind === "light"`: resolved light payload. */
    light?: IResolvedLight;

    /** `kind === "camera"`: resolved camera payload. */
    camera?: IResolvedCamera;

    /** Per-prim animation (animated transform and/or visibility). Joint animation lives on the skeleton. */
    animation?: IResolvedAnimation;
}

/**
 * Resolved local transform. The resolution layer collapses the ordered USD `xformOpOrder`
 * stack (translate/orient/scale/pivot/transform/resetXformStack) into a single TRS triple.
 * When the composed transform contains shear or otherwise cannot be represented losslessly by
 * TRS, `matrix` is also provided and the adapter should prefer it.
 */
export interface IResolvedTransform {
    /** Local translation. */
    translation: Vec3;
    /** Local rotation as a quaternion `[x, y, z, w]`. */
    rotation: Quat;
    /** Local scale. */
    scale: Vec3;
    /** Optional full local matrix in the same flat layout as {@link Mat4}. Present when TRS is lossy; adapter prefers this when set. */
    matrix?: Mat4;
}

/** USD primvar interpolation already expanded by the resolution layer to one value per mesh vertex. */
export interface IResolvedMesh {
    /** Flat vertex positions, 3 per vertex, in USD space. */
    positions: Float32Array;
    /** Triangulated indices (the resolution layer fans/triangulates arbitrary polygons). */
    indices: Uint32Array;
    /** Per-vertex normals (3 per vertex). Absent when not authored and not computed. */
    normals?: Float32Array;
    /** UV sets, each 2 per vertex, in authoring order. First entry maps to Babylon `uv`, second to `uv2`. */
    uvSets?: Float32Array[];
    /** Per-vertex linear RGBA colors (4 per vertex) from `displayColor`/`displayOpacity`. */
    colors?: Float32Array;
    /** Subdivision scheme authored on the mesh. The geometry adapter tessellates when not "none". */
    subdivisionScheme: "none" | "catmullClark" | "loop" | "bilinear";
    /**
     * Original pre-triangulation face vertex counts (verts per face), provided when
     * `subdivisionScheme !== "none"` so the geometry adapter can subdivide the true authored cage
     * (e.g. quads for Catmull-Clark) instead of the fan-triangulated approximation in `indices`.
     */
    faceVertexCounts?: Uint32Array;
    /** Original pre-triangulation face vertex indices, aligned with `faceVertexCounts`. */
    faceVertexIndices?: Uint32Array;
    /** Source point index for each resolved vertex, used to align point-domain payloads such as skinning after vertex splits. */
    sourcePointIndices?: Uint32Array;
    /** Resolved vertex index for each original face corner, aligned with `faceVertexIndices`. */
    faceVertexResolvedIndices?: Uint32Array;
    /** Whether the mesh is double-sided (USD `doubleSided`). */
    doubleSided: boolean;
    /** Authored orientation; combined with triangulation winding so the adapter can set side orientation. */
    orientation: "rightHanded" | "leftHanded";
    /** Optional geometry-subset ranges, used when a mesh binds multiple materials by face range. */
    geomSubsets?: IResolvedGeomSubset[];
}

/** A contiguous run of triangle indices bound to a specific material (resolved from a UsdGeomSubset). */
export interface IResolvedGeomSubset {
    /** Index into `IResolvedStage.materials`. */
    materialIndex: number;
    /** Offset (in indices) into the mesh's `indices` array where this subset begins. */
    indexOffset: number;
    /** Number of indices belonging to this subset. */
    indexCount: number;
}

/** Binds a prim (or its subsets) to one or more resolved materials. */
export interface IResolvedMaterialBinding {
    /** Index into `IResolvedStage.materials` for the whole-mesh binding, if any. */
    materialIndex?: number;
}

/**
 * A resolved material reduced from a UsdShade network (typically a UsdPreviewSurface) to flat
 * PBR parameters plus texture references. Authors map this onto a Babylon `PBRMaterial`
 * (preferred) or `StandardMaterial` (fallback).
 */
export interface IResolvedMaterial {
    /** Material name (from the UsdShade prim) for Babylon material naming. */
    name: string;
    /** Linear base/diffuse color. */
    baseColor: Vec3;
    /** Base opacity in [0,1]. */
    opacity: number;
    /** Metalness in [0,1] (metallic workflow). */
    metallic: number;
    /** Roughness in [0,1]. */
    roughness: number;
    /** Linear emissive color. */
    emissiveColor: Vec3;
    /** Index of refraction (UsdPreviewSurface `ior`, default 1.5). */
    ior: number;
    /** Occlusion strength in [0,1]. */
    occlusion: number;
    /** Clearcoat amount in [0,1]. */
    clearcoat: number;
    /** Clearcoat roughness in [0,1]. */
    clearcoatRoughness: number;
    /** When true, the surface uses the specular/diffuse workflow instead of metallic. */
    useSpecularWorkflow: boolean;
    /** Specular color used when `useSpecularWorkflow` is true. */
    specularColor: Vec3;
    /** Alpha cutoff threshold; when set, the material uses alpha testing. */
    opacityThreshold?: number;
    /** Texture inputs keyed by the PBR slot they drive. Any subset may be present. */
    textures: Partial<Record<ResolvedTextureSlot, IResolvedTexture>>;
}

/** The PBR slot a resolved texture drives. */
export type ResolvedTextureSlot = "baseColor" | "metallic" | "roughness" | "normal" | "emissive" | "occlusion" | "opacity" | "clearcoat" | "clearcoatRoughness";

/** A resolved texture reference with its sampling and color-management parameters. */
export interface IResolvedTexture {
    /** Fully-resolved asset locator: either an absolute/relative URL or a key into `IResolvedStage`-adjacent embedded assets. */
    uri: string;
    /** Pre-decoded bytes when the texture came from inside a USDZ archive; when present the adapter uses these instead of fetching `uri`. */
    data?: Uint8Array;
    /** MIME type for embedded `data` (e.g. "image/png"), when known. */
    mimeType?: string;
    /** Which UV set this texture samples (index into the mesh `uvSets`). */
    uvSet: number;
    /** Wrap mode along U. */
    wrapU: "repeat" | "clamp" | "mirror" | "black";
    /** Wrap mode along V. */
    wrapV: "repeat" | "clamp" | "mirror" | "black";
    /** Color space the texture is authored in; drives sRGB→linear handling on upload. */
    colorSpace: "sRGB" | "linear" | "raw";
    /** Per-channel scale applied to sampled values (UsdUVTexture `scale`). */
    scale?: Vec4;
    /** Per-channel bias applied to sampled values (UsdUVTexture `bias`). */
    bias?: Vec4;
    /** Single channel to read for scalar slots (e.g. "r", "g", "b", "a"). */
    channel?: "r" | "g" | "b" | "a";
}

/**
 * A resolved UsdGeomPointInstancer. All per-instance variability is pre-computed; the adapter
 * emits one Babylon `InstancedMesh` (or thin instance) per visible instance, drawing from the
 * `prototypeMeshIndices` pool.
 */
export interface IResolvedPointInstancer {
    /** Indices into `IResolvedStage.meshes` for each authored prototype slot; unsupported slots are `undefined`. */
    prototypeMeshIndices: (number | undefined)[];
    /** Material bindings aligned with `prototypeMeshIndices`, when authored on prototype meshes. */
    prototypeMaterialBindings?: (IResolvedMaterialBinding | undefined)[];
    /** Per-instance prototype selector (index into `prototypeMeshIndices`). */
    protoIndices: Int32Array;
    /** Optional authored instance ids aligned with `protoIndices`; array index is used when absent. */
    ids?: Int32Array;
    /** Per-instance translation (3 per instance), in the instancer's local space. */
    positions: Float32Array;
    /** Per-instance orientation quaternion (4 per instance). */
    orientations?: Float32Array;
    /** Per-instance scale (3 per instance). */
    scales?: Float32Array;
    /** Authored instance ids that are invisible and must be skipped. */
    invisibleIds?: Int32Array;
}

/** The kind of a resolved UsdLux light. */
export type ResolvedLightKind = "distant" | "sphere" | "rect" | "disk" | "dome" | "cylinder";

/**
 * A resolved UsdLux light reduced to parameters expressible via Babylon's existing light API.
 * Light kinds without a Babylon-core equivalent (e.g. true rect/disk area lights) are mapped to
 * the closest available light or recorded as a diagnostic by the adapter.
 */
export interface IResolvedLight {
    /** Light kind. */
    kind: ResolvedLightKind;
    /** Linear light color. */
    color: Vec3;
    /** Intensity (UsdLux `intensity`). */
    intensity: number;
    /** Exposure stops applied multiplicatively as `2^exposure`. */
    exposure: number;
    /** For `distant`: angular diameter in degrees. */
    angle?: number;
    /** For `sphere`/`disk`/`cylinder`: radius in stage units. */
    radius?: number;
    /** For `rect`: width in stage units. */
    width?: number;
    /** For `rect`: height in stage units. */
    height?: number;
    /** For `dome`: resolved environment texture reference (IBL). */
    domeTexture?: IResolvedTexture;
    /** Whether `normalize` is set (power independent of size). */
    normalize?: boolean;
}

/** A resolved UsdGeomCamera reduced to Babylon camera parameters. */
export interface IResolvedCamera {
    /** Projection type. */
    projection: "perspective" | "orthographic";
    /** Focal length in tenths of a stage unit (USD camera convention). */
    focalLength: number;
    /** Horizontal aperture (USD camera convention). */
    horizontalAperture: number;
    /** Vertical aperture (USD camera convention). */
    verticalAperture: number;
    /** Near/far clipping range `[near, far]`. */
    clippingRange: Vec2;
    /** f-stop for depth of field, when authored. */
    fStop?: number;
    /** Focus distance for depth of field, when authored. */
    focusDistance?: number;
}

/**
 * A resolved UsdSkel skeleton: the joint hierarchy plus bind/rest transforms. Joint animation
 * (if any) is carried on the matching joint tracks of `IResolvedAnimation` referenced from the
 * skinned mesh's owning prim.
 */
export interface IResolvedSkeleton {
    /** Skeleton name for Babylon `Skeleton` naming. */
    name: string;
    /** Joint paths in topological (UsdSkel) order. */
    joints: string[];
    /** Parent index for each joint (`-1` for roots), aligned with `joints`. */
    parentIndices: Int32Array;
    /** World-space bind transforms per joint (each a `Mat4` in the shared resolved layout). */
    bindTransforms: Mat4[];
    /** Local rest transforms per joint (each a `Mat4` in the shared resolved layout). */
    restTransforms: Mat4[];
    /** Optional resolved animation of joint local transforms, keyed by joint index. */
    animation?: IResolvedSkeletonAnimation;
}

/** Resolved per-joint local-transform animation for a skeleton. */
export interface IResolvedSkeletonAnimation {
    /** Sample times in seconds (resolution converts time codes using `timeCodesPerSecond`). */
    times: Float32Array;
    /** For each joint index, the TRS samples over `times`. */
    joints: IResolvedJointAnimation[];
}

/** Animated local TRS of a single joint across the shared sample `times`. */
export interface IResolvedJointAnimation {
    /** Joint index (aligned with `IResolvedSkeleton.joints`). */
    jointIndex: number;
    /** Translation samples (3 per time). */
    translations: Float32Array;
    /** Rotation quaternion samples (4 per time). */
    rotations: Float32Array;
    /** Scale samples (3 per time). */
    scales: Float32Array;
}

/** Per-mesh skinning data binding vertices to a skeleton. */
export interface IResolvedSkinning {
    /** Index into `IResolvedStage.skeletons`. */
    skeletonIndex: number;
    /** Number of joint influences stored per vertex. */
    influencesPerVertex: number;
    /** Flat joint indices (`influencesPerVertex` per vertex). */
    jointIndices: Uint32Array;
    /** Flat joint weights (`influencesPerVertex` per vertex). */
    jointWeights: Float32Array;
    /** Optional geom-bind transform (in the shared resolved `Mat4` layout) applied before skinning. */
    geomBindTransform?: Mat4;
}

/** The property a resolved animation track drives on its prim. */
export type ResolvedAnimationTargetKind = "translation" | "rotation" | "scale" | "visibility";

/** How samples between keyframes are interpolated. Splines carry tangents for exact reconstruction. */
export type ResolvedInterpolation = "held" | "linear" | "bezier" | "hermite";

/** A collection of resolved animation tracks for a single prim. */
export interface IResolvedAnimation {
    /** The tracks animating this prim. */
    tracks: IResolvedAnimationTrack[];
}

/**
 * A single resolved animation track. Time-sample, value-clip and spline resolution have all been
 * performed: `times` (seconds) and `values` are the final samples; `interpolation` (and optional
 * tangents) tell the adapter how to rebuild Babylon keyframes faithfully.
 */
export interface IResolvedAnimationTrack {
    /** Which prim property this track drives. */
    target: ResolvedAnimationTargetKind;
    /** Sample times in seconds. */
    times: Float32Array;
    /** Flattened sample values; stride is 3 for translation/scale, 4 for rotation, 1 for visibility. */
    values: Float32Array;
    /** Interpolation between samples. */
    interpolation: ResolvedInterpolation;
    /** Flattened in-tangents for `bezier`/`hermite`, matching `values` stride. */
    inTangents?: Float32Array;
    /** Flattened out-tangents for `bezier`/`hermite`, matching `values` stride. */
    outTangents?: Float32Array;
}
