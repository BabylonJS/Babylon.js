/* eslint-disable @typescript-eslint/naming-convention */
import { NgeEnumCatalog } from "./referenceData.js";

/**
 * Complete registry of all Node Geometry block types available in Babylon.js.
 * Each entry describes the block's class name, category, target, and its inputs/outputs.
 */

/**
 * Describes a single input or output connection point on a block.
 */
export interface IConnectionPointInfo {
    /** Name of the connection point (e.g. "geometry", "output") */
    name: string;
    /** Data type of the connection point (e.g. "Float", "Vector3", "Geometry") */
    type: string;
    /** Whether the connection is optional */
    isOptional?: boolean;
    /** Additional concrete types accepted by this port */
    acceptedConnectionPointTypes?: string[];
    /** Concrete types explicitly rejected by this port */
    excludedConnectionPointTypes?: string[];
    /** Port on the same block that determines a BasedOnInput port's type */
    typeConnectionSource?: string;
    /** Port on the same block whose inferred AutoDetect type is linked to this port */
    linkedConnectionSource?: string;
    /** Whether this is the authoritative side of a linked AutoDetect pair */
    isMainLinkSource?: boolean;
    /** Concrete fallback for an unconnected BasedOnInput port */
    defaultConnectionPointType?: string;
}

/** Machine-readable validation metadata for a mutable block property. */
export interface IBlockPropertyInfo {
    /** The JSON-level value kind accepted by the shared graph API */
    type: "boolean" | "number" | "integer" | "string" | "enum" | "geometryInputValue" | "vector3Array";
    /** Enumeration name, when type is enum */
    enumName?: string;
    /** Valid enum names and their serialized numeric values */
    enumValues?: Record<string, number>;
    /** Inclusive numeric minimum */
    minimum?: number;
    /** Inclusive numeric maximum */
    maximum?: number;
}

/**
 * Describes a block type in the NGE catalog.
 */
export interface IBlockTypeInfo {
    /** The Babylon.js class name for this block */
    className: string;
    /** Category for grouping (e.g. "Source", "Math", "Set", "Instance") */
    category: string;
    /** Human-readable description of what this block does */
    description: string;
    /** List of input connection points */
    inputs: IConnectionPointInfo[];
    /** List of output connection points */
    outputs: IConnectionPointInfo[];
    /** Extra properties that can be configured on the block */
    properties?: Record<string, string>;
    /** Machine-readable schemas for properties accepted by add/set operations */
    propertyMetadata?: Record<string, IBlockPropertyInfo>;
    /**
     * Default property values to bake into newly created blocks of this type.
     * These are REQUIRED by the Babylon deserialiser – omitting them can cause
     * build-time crashes.
     */
    defaultSerializedProperties?: Record<string, unknown>;
}

/**
 * Full catalog of block types. This is the canonical reference an AI agent uses
 * to know which blocks exist and what ports they have.
 */
export const BlockRegistry: Record<string, IBlockTypeInfo> = {
    // ═══════════════════════════════════════════════════════════════════════
    //  Input
    // ═══════════════════════════════════════════════════════════════════════
    GeometryInputBlock: {
        className: "GeometryInputBlock",
        category: "Input",
        description:
            "Provides input values to the geometry graph. Can be configured as a contextual source " +
            "(Positions, Normals, UV, VertexID, etc.) or a constant value (Float, Int, Vector2, Vector3, Vector4, Matrix).",
        inputs: [],
        outputs: [{ name: "output", type: "AutoDetect" }],
        properties: {
            type: "NodeGeometryBlockConnectionPointTypes — the data type (Int, Float, Vector2, Vector3, Vector4, Matrix)",
            contextualValue:
                "NodeGeometryContextualSources — None, Positions, Normals, Tangents, UV, UV2, UV3, UV4, UV5, UV6, Colors, VertexID, FaceID, GeometryID, CollectionID, LoopID, InstanceID, LatticeID, LatticeControl",
            value: "The actual constant value (number, Vector2, Vector3, Vector4, Matrix)",
            min: "number — minimum value for inspector slider",
            max: "number — maximum value for inspector slider",
            groupInInspector: "string — group name in the inspector",
            displayInInspector: "boolean — whether to show in Inspector",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Output
    // ═══════════════════════════════════════════════════════════════════════
    GeometryOutputBlock: {
        className: "GeometryOutputBlock",
        category: "Output",
        description: "The final output block that produces the geometry. Every Node Geometry graph must have exactly one.",
        inputs: [{ name: "geometry", type: "Geometry" }],
        outputs: [],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Sources (Geometry Primitives)
    // ═══════════════════════════════════════════════════════════════════════
    BoxBlock: {
        className: "BoxBlock",
        category: "Source",
        description: "Generates box geometry with configurable size and subdivisions.",
        inputs: [
            { name: "size", type: "Float", isOptional: true },
            { name: "width", type: "Float", isOptional: true },
            { name: "height", type: "Float", isOptional: true },
            { name: "depth", type: "Float", isOptional: true },
            { name: "subdivisions", type: "Int", isOptional: true },
            { name: "subdivisionsX", type: "Int", isOptional: true },
            { name: "subdivisionsY", type: "Int", isOptional: true },
            { name: "subdivisionsZ", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    SphereBlock: {
        className: "SphereBlock",
        category: "Source",
        description: "Generates sphere geometry with configurable segments, diameter, arc, and slice.",
        inputs: [
            { name: "segments", type: "Int", isOptional: true },
            { name: "diameter", type: "Float", isOptional: true },
            { name: "diameterX", type: "Float", isOptional: true },
            { name: "diameterY", type: "Float", isOptional: true },
            { name: "diameterZ", type: "Float", isOptional: true },
            { name: "arc", type: "Float", isOptional: true },
            { name: "slice", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    CylinderBlock: {
        className: "CylinderBlock",
        category: "Source",
        description: "Generates cylinder geometry with configurable height, diameter, subdivisions, tessellation, and arc.",
        inputs: [
            { name: "height", type: "Float", isOptional: true },
            { name: "diameter", type: "Float", isOptional: true },
            { name: "diameterTop", type: "Float", isOptional: true },
            { name: "diameterBottom", type: "Float", isOptional: true },
            { name: "subdivisions", type: "Int", isOptional: true },
            { name: "tessellation", type: "Int", isOptional: true },
            { name: "arc", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    PlaneBlock: {
        className: "PlaneBlock",
        category: "Source",
        description: "Generates plane geometry with configurable size and subdivisions.",
        inputs: [
            { name: "size", type: "Float", isOptional: true },
            { name: "width", type: "Float", isOptional: true },
            { name: "height", type: "Float", isOptional: true },
            { name: "subdivisions", type: "Int", isOptional: true },
            { name: "subdivisionsX", type: "Int", isOptional: true },
            { name: "subdivisionsY", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    TorusBlock: {
        className: "TorusBlock",
        category: "Source",
        description: "Generates torus geometry with configurable diameter, thickness, and tessellation.",
        inputs: [
            { name: "diameter", type: "Float", isOptional: true },
            { name: "thickness", type: "Float", isOptional: true },
            { name: "tessellation", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    DiscBlock: {
        className: "DiscBlock",
        category: "Source",
        description: "Generates disc geometry with configurable radius, tessellation, and arc.",
        inputs: [
            { name: "radius", type: "Float", isOptional: true },
            { name: "tessellation", type: "Int", isOptional: true },
            { name: "arc", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    CapsuleBlock: {
        className: "CapsuleBlock",
        category: "Source",
        description: "Generates capsule geometry with configurable height, radius, tessellation, and subdivisions.",
        inputs: [
            { name: "height", type: "Float", isOptional: true },
            { name: "radius", type: "Float", isOptional: true },
            { name: "tessellation", type: "Int", isOptional: true },
            { name: "subdivisions", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    IcoSphereBlock: {
        className: "IcoSphereBlock",
        category: "Source",
        description: "Generates icosphere geometry with configurable radius and subdivisions.",
        inputs: [
            { name: "radius", type: "Float", isOptional: true },
            { name: "radiusX", type: "Float", isOptional: true },
            { name: "radiusY", type: "Float", isOptional: true },
            { name: "radiusZ", type: "Float", isOptional: true },
            { name: "subdivisions", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    GridBlock: {
        className: "GridBlock",
        category: "Source",
        description: "Generates a flat grid geometry with configurable width, height, and subdivisions.",
        inputs: [
            { name: "width", type: "Float", isOptional: true },
            { name: "height", type: "Float", isOptional: true },
            { name: "subdivisions", type: "Int", isOptional: true },
            { name: "subdivisionsX", type: "Int", isOptional: true },
            { name: "subdivisionsY", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    NullBlock: {
        className: "NullBlock",
        category: "Source",
        description: "Outputs a null (empty) geometry and a zero vector. Useful as a placeholder.",
        inputs: [],
        outputs: [
            { name: "geometry", type: "Geometry" },
            { name: "vector", type: "Vector3" },
        ],
    },

    MeshBlock: {
        className: "MeshBlock",
        category: "Source",
        description: "Provides geometry from an existing mesh. The mesh is set programmatically or via cached data.",
        inputs: [],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            serializedCachedData: "boolean — whether cached mesh data is embedded (default: false)",
            reverseWindingOrder: "boolean — whether to reverse face winding (default: false)",
        },
        defaultSerializedProperties: { serializedCachedData: false, reverseWindingOrder: false },
    },

    PointListBlock: {
        className: "PointListBlock",
        category: "Source",
        description: "Generates geometry from an explicit list of points.",
        inputs: [],
        outputs: [{ name: "geometry", type: "Geometry" }],
        properties: {
            points: "Vector3[] — array of 3D points, serialised as flat arrays",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Geometry Operations
    // ═══════════════════════════════════════════════════════════════════════
    GeometryTransformBlock: {
        className: "GeometryTransformBlock",
        category: "Geometry",
        description:
            "Transforms geometry or a vector using a matrix, or individual translation/rotation/scaling vectors. " +
            "When used per-vertex (evaluateContext=true), it transforms each vertex position.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "matrix", type: "Matrix", isOptional: true },
            { name: "translation", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
            { name: "pivot", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            evaluateContext: "boolean — re-evaluate per context/vertex (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    MergeGeometryBlock: {
        className: "MergeGeometryBlock",
        category: "Geometry",
        description: "Merges up to 5 geometry inputs into a single geometry.",
        inputs: [
            { name: "geometry0", type: "Geometry" },
            { name: "geometry1", type: "Geometry", isOptional: true },
            { name: "geometry2", type: "Geometry", isOptional: true },
            { name: "geometry3", type: "Geometry", isOptional: true },
            { name: "geometry4", type: "Geometry", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    BooleanGeometryBlock: {
        className: "BooleanGeometryBlock",
        category: "Geometry",
        description: "Performs CSG boolean operations (Intersect, Subtract, Union) between two geometries.",
        inputs: [
            { name: "geometry0", type: "Geometry" },
            { name: "geometry1", type: "Geometry" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            operation: "BooleanGeometryOperations — Intersect (0), Subtract (1), Union (2). Default: Intersect",
            evaluateContext: "boolean (default: false)",
            useOldCSGEngine: "boolean — use legacy CSG engine (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false, operation: 0, useOldCSGEngine: false },
    },

    ComputeNormalsBlock: {
        className: "ComputeNormalsBlock",
        category: "Geometry",
        description: "Recomputes normals for a geometry based on its face topology.",
        inputs: [{ name: "geometry", type: "Geometry" }],
        outputs: [{ name: "output", type: "Geometry" }],
    },

    CleanGeometryBlock: {
        className: "CleanGeometryBlock",
        category: "Geometry",
        description: "Cleans geometry by removing degenerate triangles, duplicates, etc.",
        inputs: [{ name: "geometry", type: "Geometry" }],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    ExtrudeGeometryBlock: {
        className: "ExtrudeGeometryBlock",
        category: "Geometry",
        description: "Extrudes a geometry along its average face normal by a given depth. Supports configurable cap modes (no cap, start, end, or both).",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "depth", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — re-evaluate per context/vertex (default: false)",
            cap: "ExtrudeGeometryCap — NoCap (0), CapStart (1), CapEnd (2), CapAll (3). Default: CapAll (3)",
        },
        defaultSerializedProperties: { evaluateContext: false, cap: 3 },
    },

    BevelBlock: {
        className: "BevelBlock",
        category: "Geometry",
        description: "Bevels geometry edges by a configurable amount, segment count, and angle threshold.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "amount", type: "Float", isOptional: true },
            { name: "segments", type: "Int", isOptional: true },
            { name: "angle", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean — whether to re-evaluate inputs per context (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: false },
    },

    SubdivideBlock: {
        className: "SubdivideBlock",
        category: "Geometry",
        description: "Subdivides geometry faces. Supports flat and Loop subdivision.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "level", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            flatOnly: "boolean — flat subdivision only (default: false)",
            loopWeight: "number — Loop subdivision weight 0-1 (default: 1.0)",
        },
        defaultSerializedProperties: { flatOnly: false, loopWeight: 1.0 },
    },

    GeometryOptimizeBlock: {
        className: "GeometryOptimizeBlock",
        category: "Geometry",
        description: "Optimizes geometry by merging close vertices and optionally removing duplicate faces.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "selector", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
            epsilon: "number — merge distance threshold",
            optimizeFaces: "boolean — also optimize faces (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: true, optimizeFaces: false },
    },

    BoundingBlock: {
        className: "BoundingBlock",
        category: "Geometry",
        description: "Computes the axis-aligned bounding box of a geometry, outputting min and max vectors.",
        inputs: [{ name: "geometry", type: "Geometry" }],
        outputs: [
            { name: "min", type: "Vector3" },
            { name: "max", type: "Vector3" },
        ],
    },

    GeometryInfoBlock: {
        className: "GeometryInfoBlock",
        category: "Geometry",
        description: "Provides metadata about a geometry: vertex count, face count, geometry ID, collection ID.",
        inputs: [{ name: "geometry", type: "Geometry" }],
        outputs: [
            { name: "output", type: "Geometry" },
            { name: "id", type: "Int" },
            { name: "collectionId", type: "Int" },
            { name: "verticesCount", type: "Int" },
            { name: "facesCount", type: "Int" },
        ],
    },

    GeometryCollectionBlock: {
        className: "GeometryCollectionBlock",
        category: "Geometry",
        description: "Collects up to 10 geometries into a collection, assigning each a unique collection ID.",
        inputs: [
            { name: "geometry0", type: "Geometry", isOptional: true },
            { name: "geometry1", type: "Geometry", isOptional: true },
            { name: "geometry2", type: "Geometry", isOptional: true },
            { name: "geometry3", type: "Geometry", isOptional: true },
            { name: "geometry4", type: "Geometry", isOptional: true },
            { name: "geometry5", type: "Geometry", isOptional: true },
            { name: "geometry6", type: "Geometry", isOptional: true },
            { name: "geometry7", type: "Geometry", isOptional: true },
            { name: "geometry8", type: "Geometry", isOptional: true },
            { name: "geometry9", type: "Geometry", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Set Blocks (attribute modification)
    // ═══════════════════════════════════════════════════════════════════════
    SetPositionsBlock: {
        className: "SetPositionsBlock",
        category: "Set",
        description: "Overrides vertex positions in a geometry. Runs per-vertex with contextual source access.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "positions", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    SetNormalsBlock: {
        className: "SetNormalsBlock",
        category: "Set",
        description: "Overrides vertex normals in a geometry.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "normals", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    SetColorsBlock: {
        className: "SetColorsBlock",
        category: "Set",
        description: "Overrides vertex colors in a geometry. Accepts Vector3 (RGB) or Vector4 (RGBA).",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "colors", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    SetUVsBlock: {
        className: "SetUVsBlock",
        category: "Set",
        description: "Overrides UV coordinates in a geometry. Can target UV1–UV6.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "uvs", type: "Vector2" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
            textureCoordinateIndex: "number — UV channel 0–5 (UV1–UV6). Default: 0",
        },
        defaultSerializedProperties: { evaluateContext: true, textureCoordinateIndex: 0 },
    },

    SetTangentsBlock: {
        className: "SetTangentsBlock",
        category: "Set",
        description: "Overrides vertex tangents in a geometry.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "tangents", type: "Vector4" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    SetMaterialIDBlock: {
        className: "SetMaterialIDBlock",
        category: "Set",
        description: "Assigns a material ID to each face in a geometry. Used for multi-material support.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "id", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    AggregatorBlock: {
        className: "AggregatorBlock",
        category: "Set",
        description: "Aggregates values across geometry vertices using Max, Min, or Sum operations.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "source", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            aggregation: "Aggregations — Max (0), Min (1), Sum (2). Default: Sum",
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true, aggregation: 2 },
    },

    LatticeBlock: {
        className: "LatticeBlock",
        category: "Set",
        description: "Applies a lattice deformation to geometry. Control points modify vertex positions.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "controls", type: "Vector3" },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
            resolutionX: "number — lattice resolution X (default: 3, range: 1–10)",
            resolutionY: "number — lattice resolution Y (default: 3, range: 1–10)",
            resolutionZ: "number — lattice resolution Z (default: 3, range: 1–10)",
        },
        defaultSerializedProperties: { evaluateContext: true, resolutionX: 3, resolutionY: 3, resolutionZ: 3 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Instancing
    // ═══════════════════════════════════════════════════════════════════════
    // InstantiateBaseBlock is abstract; expose only the concrete instancing blocks.
    InstantiateBlock: {
        className: "InstantiateBlock",
        category: "Instance",
        description: "Creates instances of geometry at specified positions with custom transform per instance.",
        inputs: [
            { name: "instance", type: "Geometry", isOptional: true },
            { name: "count", type: "Int", isOptional: true },
            { name: "matrix", type: "Matrix", isOptional: true },
            { name: "position", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    InstantiateLinearBlock: {
        className: "InstantiateLinearBlock",
        category: "Instance",
        description: "Creates instances arranged in a line along a direction vector.",
        inputs: [
            { name: "instance", type: "Geometry", isOptional: true },
            { name: "count", type: "Int", isOptional: true },
            { name: "direction", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    InstantiateRadialBlock: {
        className: "InstantiateRadialBlock",
        category: "Instance",
        description: "Creates instances arranged radially in a circle or arc.",
        inputs: [
            { name: "instance", type: "Geometry", isOptional: true },
            { name: "count", type: "Int", isOptional: true },
            { name: "radius", type: "Int", isOptional: true },
            { name: "angleStart", type: "Float", isOptional: true },
            { name: "angleEnd", type: "Float", isOptional: true },
            { name: "transform", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    InstantiateOnFacesBlock: {
        className: "InstantiateOnFacesBlock",
        category: "Instance",
        description: "Scatters instances randomly across the faces of a source geometry.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "instance", type: "Geometry", isOptional: true },
            { name: "count", type: "Int", isOptional: true },
            { name: "matrix", type: "Matrix", isOptional: true },
            { name: "offset", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true },
    },

    InstantiateOnVerticesBlock: {
        className: "InstantiateOnVerticesBlock",
        category: "Instance",
        description: "Places instances on the vertices of a source geometry with optional density filtering.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "instance", type: "Geometry", isOptional: true },
            { name: "density", type: "Float", isOptional: true },
            { name: "matrix", type: "Matrix", isOptional: true },
            { name: "offset", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
            removeDuplicatedPositions: "boolean — deduplicate vertices before instancing (default: true)",
        },
        defaultSerializedProperties: { evaluateContext: true, removeDuplicatedPositions: true },
    },

    InstantiateOnVolumeBlock: {
        className: "InstantiateOnVolumeBlock",
        category: "Instance",
        description: "Scatters instances inside the volume of a source geometry.",
        inputs: [
            { name: "geometry", type: "Geometry" },
            { name: "instance", type: "Geometry", isOptional: true },
            { name: "count", type: "Int", isOptional: true },
            { name: "matrix", type: "Matrix", isOptional: true },
            { name: "offset", type: "Vector3", isOptional: true },
            { name: "rotation", type: "Vector3", isOptional: true },
            { name: "scaling", type: "Vector3", isOptional: true },
            { name: "gridSize", type: "Int", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Geometry" }],
        properties: {
            evaluateContext: "boolean (default: true)",
            gridMode: "boolean — use grid-based placement (default: false)",
        },
        defaultSerializedProperties: { evaluateContext: true, gridMode: false },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Matrices
    // ═══════════════════════════════════════════════════════════════════════
    TranslationBlock: {
        className: "TranslationBlock",
        category: "Matrix",
        description: "Creates a translation matrix from a Vector3 input.",
        inputs: [{ name: "translation", type: "Vector3" }],
        outputs: [{ name: "matrix", type: "Matrix" }],
    },

    ScalingBlock: {
        className: "ScalingBlock",
        category: "Matrix",
        description: "Creates a scaling matrix from a Vector3 input.",
        inputs: [{ name: "scale", type: "Vector3" }],
        outputs: [{ name: "matrix", type: "Matrix" }],
    },

    RotationXBlock: {
        className: "RotationXBlock",
        category: "Matrix",
        description: "Creates a rotation matrix around the X axis from an angle (in radians).",
        inputs: [{ name: "angle", type: "Float", isOptional: true }],
        outputs: [{ name: "matrix", type: "Matrix" }],
    },

    RotationYBlock: {
        className: "RotationYBlock",
        category: "Matrix",
        description: "Creates a rotation matrix around the Y axis from an angle (in radians).",
        inputs: [{ name: "angle", type: "Float", isOptional: true }],
        outputs: [{ name: "matrix", type: "Matrix" }],
    },

    RotationZBlock: {
        className: "RotationZBlock",
        category: "Matrix",
        description: "Creates a rotation matrix around the Z axis from an angle (in radians).",
        inputs: [{ name: "angle", type: "Float", isOptional: true }],
        outputs: [{ name: "matrix", type: "Matrix" }],
    },

    AlignBlock: {
        className: "AlignBlock",
        category: "Matrix",
        description: "Creates a rotation matrix that aligns a source direction to a target direction.",
        inputs: [
            { name: "source", type: "Vector3", isOptional: true },
            { name: "target", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "matrix", type: "Matrix" }],
    },

    MatrixComposeBlock: {
        className: "MatrixComposeBlock",
        category: "Matrix",
        description: "Multiplies two matrices together (matrix0 × matrix1).",
        inputs: [
            { name: "matrix0", type: "Matrix" },
            { name: "matrix1", type: "Matrix" },
        ],
        outputs: [{ name: "output", type: "Matrix" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Math
    // ═══════════════════════════════════════════════════════════════════════
    MathBlock: {
        className: "MathBlock",
        category: "Math",
        description: "Performs basic math: Add, Subtract, Multiply, Divide, Max, Min. Works on scalars and vectors.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operation: "MathBlockOperations — Add (0), Subtract (1), Multiply (2), Divide (3), Max (4), Min (5). Default: Add",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    GeometryTrigonometryBlock: {
        className: "GeometryTrigonometryBlock",
        category: "Math",
        description:
            "Applies a trigonometric or unary math function: Cos, Sin, Abs, Exp, Round, Floor, Ceiling, Sqrt, Log, " +
            "Tan, ArcTan, ArcCos, ArcSin, Sign, Negate, OneMinus, Reciprocal, ToDegrees, ToRadians, Fract, Exp2.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            operation:
                "GeometryTrigonometryBlockOperations — Cos (0), Sin (1), Abs (2), Exp (3), Round (4), Floor (5), " +
                "Ceiling (6), Sqrt (7), Log (8), Tan (9), ArcTan (10), ArcCos (11), ArcSin (12), Sign (13), " +
                "Negate (14), OneMinus (15), Reciprocal (16), ToDegrees (17), ToRadians (18), Fract (19), Exp2 (20). Default: Cos",
        },
        defaultSerializedProperties: { operation: 0 },
    },

    ConditionBlock: {
        className: "ConditionBlock",
        category: "Math",
        description: "Conditional block: if left <test> right then ifTrue else ifFalse.",
        inputs: [
            { name: "left", type: "Float" },
            { name: "right", type: "Float", isOptional: true },
            { name: "ifTrue", type: "AutoDetect", isOptional: true },
            { name: "ifFalse", type: "AutoDetect", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            test: "ConditionBlockTests — Equal (0), NotEqual (1), LessThan (2), GreaterThan (3), LessOrEqual (4), GreaterOrEqual (5), Xor (6), Or (7), And (8). Default: Equal",
            epsilon: "number — comparison epsilon (default: 0)",
        },
        defaultSerializedProperties: { test: 0, epsilon: 0 },
    },

    RandomBlock: {
        className: "RandomBlock",
        category: "Math",
        description: "Generates random values between min and max. Supports scalars and vectors.",
        inputs: [
            { name: "min", type: "AutoDetect" },
            { name: "max", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            lockMode: "RandomBlockLocks — None (0), LoopID (1), InstanceID (2), Once (3). Default: None",
        },
        defaultSerializedProperties: { lockMode: 0 },
    },

    NoiseBlock: {
        className: "NoiseBlock",
        category: "Math",
        description: "Generates Perlin-like noise with configurable offset, scale, octaves, and roughness.",
        inputs: [
            { name: "offset", type: "Vector3", isOptional: true },
            { name: "scale", type: "Float", isOptional: true },
            { name: "octaves", type: "Float", isOptional: true },
            { name: "roughness", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Float" }],
    },

    GeometryClampBlock: {
        className: "GeometryClampBlock",
        category: "Math",
        description: "Clamps a value between min and max bounds.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "min", type: "Float", isOptional: true },
            { name: "max", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryLerpBlock: {
        className: "GeometryLerpBlock",
        category: "Math",
        description: "Linear interpolation between left and right using a gradient (0–1).",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
            { name: "gradient", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryNLerpBlock: {
        className: "GeometryNLerpBlock",
        category: "Math",
        description: "Normalised linear interpolation — same as lerp but normalizes the result (useful for vectors).",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
            { name: "gradient", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometrySmoothStepBlock: {
        className: "GeometrySmoothStepBlock",
        category: "Math",
        description: "Hermite smooth interpolation between edge0 and edge1.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "edge0", type: "Float", isOptional: true },
            { name: "edge1", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryStepBlock: {
        className: "GeometryStepBlock",
        category: "Math",
        description: "Step function: returns 0 if value < edge, else 1.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "edge", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Vector Math
    // ═══════════════════════════════════════════════════════════════════════
    GeometryDotBlock: {
        className: "GeometryDotBlock",
        category: "Vector",
        description: "Computes the dot product of two vectors.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Float" }],
    },

    GeometryCrossBlock: {
        className: "GeometryCrossBlock",
        category: "Vector",
        description: "Computes the cross product of two Vector3s.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Vector3" }],
    },

    GeometryLengthBlock: {
        className: "GeometryLengthBlock",
        category: "Vector",
        description: "Computes the length (magnitude) of a vector.",
        inputs: [{ name: "value", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "Float" }],
    },

    GeometryDistanceBlock: {
        className: "GeometryDistanceBlock",
        category: "Vector",
        description: "Computes the distance between two vectors.",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "Float" }],
    },

    NormalizeVectorBlock: {
        className: "NormalizeVectorBlock",
        category: "Vector",
        description: "Normalizes a vector to unit length.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryModBlock: {
        className: "GeometryModBlock",
        category: "Math",
        description: "Modulo operation (left % right).",
        inputs: [
            { name: "left", type: "AutoDetect" },
            { name: "right", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryPowBlock: {
        className: "GeometryPowBlock",
        category: "Math",
        description: "Power function (value ^ power).",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "power", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryArcTan2Block: {
        className: "GeometryArcTan2Block",
        category: "Math",
        description: "Computes atan2(x, y) — the two-argument arctangent.",
        inputs: [
            { name: "x", type: "AutoDetect" },
            { name: "y", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Color Operations
    // ═══════════════════════════════════════════════════════════════════════
    GeometryReplaceColorBlock: {
        className: "GeometryReplaceColorBlock",
        category: "Color",
        description: "Replaces values near a reference color with a replacement color.",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "reference", type: "AutoDetect" },
            { name: "distance", type: "Float", isOptional: true },
            { name: "replacement", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryPosterizeBlock: {
        className: "GeometryPosterizeBlock",
        category: "Color",
        description: "Reduces color to a set number of discrete steps (posterization effect).",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "steps", type: "AutoDetect" },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryDesaturateBlock: {
        className: "GeometryDesaturateBlock",
        category: "Color",
        description: "Desaturates a color by mixing it towards its luminance value.",
        inputs: [
            { name: "color", type: "Vector3" },
            { name: "level", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Vector3" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  UV / Mapping
    // ═══════════════════════════════════════════════════════════════════════
    MappingBlock: {
        className: "MappingBlock",
        category: "Mapping",
        description: "Generates UV coordinates from position and normal using Spherical, Cylindrical, or Cubic projection.",
        inputs: [
            { name: "position", type: "Vector3" },
            { name: "normal", type: "Vector3" },
            { name: "center", type: "Vector3", isOptional: true },
        ],
        outputs: [{ name: "uv", type: "Vector2" }],
        properties: {
            mapping: "MappingTypes — Spherical (0), Cylindrical (1), Cubic (2). Default: Spherical",
        },
        defaultSerializedProperties: { mapping: 0 },
    },

    MapRangeBlock: {
        className: "MapRangeBlock",
        category: "Math",
        description: "Remaps a value from one range [fromMin, fromMax] to another [toMin, toMax].",
        inputs: [
            { name: "value", type: "AutoDetect" },
            { name: "fromMin", type: "Float", isOptional: true },
            { name: "fromMax", type: "Float", isOptional: true },
            { name: "toMin", type: "Float", isOptional: true },
            { name: "toMax", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryRotate2dBlock: {
        className: "GeometryRotate2dBlock",
        category: "Math",
        description: "Rotates a Vector2 by an angle (in radians).",
        inputs: [
            { name: "input", type: "Vector2" },
            { name: "angle", type: "Float", isOptional: true },
        ],
        outputs: [{ name: "output", type: "Vector2" }],
    },

    GeometryEaseBlock: {
        className: "GeometryEaseBlock",
        category: "Math",
        description: "Applies an easing function to the input. Supports Sine, Quad, Cubic, Quart, Quint, Expo, Circ, Back, Elastic variants (In/Out/InOut).",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            type:
                "GeometryEaseBlockTypes — EaseInSine (0), EaseOutSine (1), EaseInOutSine (2), EaseInQuad (3), EaseOutQuad (4), " +
                "EaseInOutQuad (5), EaseInCubic (6), EaseOutCubic (7), EaseInOutCubic (8), EaseInQuart (9), EaseOutQuart (10), " +
                "EaseInOutQuart (11), EaseInQuint (12), EaseOutQuint (13), EaseInOutQuint (14), EaseInExpo (15), EaseOutExpo (16), " +
                "EaseInOutExpo (17), EaseInCirc (18), EaseOutCirc (19), EaseInOutCirc (20), EaseInBack (21), EaseOutBack (22), " +
                "EaseInOutBack (23), EaseInElastic (24), EaseOutElastic (25), EaseInOutElastic (26). Default: EaseInOutSine",
        },
        defaultSerializedProperties: { type: 2 },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Converters / Utility
    // ═══════════════════════════════════════════════════════════════════════
    VectorConverterBlock: {
        className: "VectorConverterBlock",
        category: "Converter",
        description: "Splits vectors into components and/or assembles components into vectors.",
        inputs: [
            { name: "xyzw ", type: "Vector4", isOptional: true },
            { name: "xyz ", type: "Vector3", isOptional: true },
            { name: "xy ", type: "Vector2", isOptional: true },
            { name: "zw ", type: "Vector2", isOptional: true },
            { name: "x ", type: "Float", isOptional: true },
            { name: "y ", type: "Float", isOptional: true },
            { name: "z ", type: "Float", isOptional: true },
            { name: "w ", type: "Float", isOptional: true },
        ],
        outputs: [
            { name: "xyzw", type: "Vector4" },
            { name: "xyz", type: "Vector3" },
            { name: "xy", type: "Vector2" },
            { name: "zw", type: "Vector2" },
            { name: "x", type: "Float" },
            { name: "y", type: "Float" },
            { name: "z", type: "Float" },
            { name: "w", type: "Float" },
        ],
    },

    IntFloatConverterBlock: {
        className: "IntFloatConverterBlock",
        category: "Converter",
        description: "Converts between Int and Float types.",
        inputs: [
            { name: "float ", type: "Float", isOptional: true },
            { name: "int ", type: "Int", isOptional: true },
        ],
        outputs: [
            { name: "float", type: "Float" },
            { name: "int", type: "Int" },
        ],
    },

    DebugBlock: {
        className: "DebugBlock",
        category: "Utility",
        description: "Pass-through block that logs values during graph evaluation. Useful for debugging.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryElbowBlock: {
        className: "GeometryElbowBlock",
        category: "Utility",
        description: "Simple pass-through (reroute) block. Useful for organizing graph layout.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    GeometryInterceptorBlock: {
        className: "GeometryInterceptorBlock",
        category: "Utility",
        description: "Pass-through that triggers an observable when traversed. Useful for runtime interception.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Teleport
    // ═══════════════════════════════════════════════════════════════════════
    TeleportInBlock: {
        className: "TeleportInBlock",
        category: "Teleport",
        description: "Teleport entry — sends data to linked TeleportOutBlock endpoints without visible wires.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [],
    },

    TeleportOutBlock: {
        className: "TeleportOutBlock",
        category: "Teleport",
        description: "Teleport exit — receives data from a linked TeleportInBlock.",
        inputs: [],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            entryPoint: "number — block ID of the linked TeleportInBlock",
        },
    },

    // ═══════════════════════════════════════════════════════════════════════
    //  Textures
    // ═══════════════════════════════════════════════════════════════════════
    GeometryTextureBlock: {
        className: "GeometryTextureBlock",
        category: "Texture",
        description: "Provides texture data for use with GeometryTextureFetchBlock. The texture is loaded programmatically.",
        inputs: [],
        outputs: [{ name: "texture", type: "Texture" }],
        properties: {
            serializedCachedData: "boolean — whether to embed cached pixel data (default: false)",
        },
        defaultSerializedProperties: { serializedCachedData: false },
    },

    GeometryCurveBlock: {
        className: "GeometryCurveBlock",
        category: "Math",
        description: "Applies an easing/curve function to the input. Same curves as GeometryEaseBlock but serialised as curveType.",
        inputs: [{ name: "input", type: "AutoDetect" }],
        outputs: [{ name: "output", type: "BasedOnInput" }],
        properties: {
            curveType:
                "GeometryCurveBlockTypes — EaseInSine (0), EaseOutSine (1), EaseInOutSine (2), EaseInQuad (3), EaseOutQuad (4), " +
                "EaseInOutQuad (5), EaseInCubic (6), EaseOutCubic (7), EaseInOutCubic (8), EaseInQuart (9), EaseOutQuart (10), " +
                "EaseInOutQuart (11), EaseInQuint (12), EaseOutQuint (13), EaseInOutQuint (14), EaseInExpo (15), EaseOutExpo (16), " +
                "EaseInOutExpo (17), EaseInCirc (18), EaseOutCirc (19), EaseInOutCirc (20), EaseInBack (21), EaseOutBack (22), " +
                "EaseInOutBack (23), EaseInElastic (24), EaseOutElastic (25), EaseInOutElastic (26). Default: EaseInOutSine",
        },
        defaultSerializedProperties: { curveType: 2 },
    },

    GeometryTextureFetchBlock: {
        className: "GeometryTextureFetchBlock",
        category: "Texture",
        description: "Samples a texture at given UV coordinates, outputting RGBA components.",
        inputs: [
            { name: "texture", type: "Texture" },
            { name: "coordinates", type: "Vector2" },
        ],
        outputs: [
            { name: "rgba", type: "Vector4" },
            { name: "rgb", type: "Vector3" },
            { name: "r", type: "Float" },
            { name: "g", type: "Float" },
            { name: "b", type: "Float" },
            { name: "a", type: "Float" },
        ],
        properties: {
            clampCoordinates: "boolean — clamp UV to 0-1 range (default: true)",
            interpolation: "boolean — bilinear interpolation (default: true)",
        },
        defaultSerializedProperties: { clampCoordinates: true, interpolation: true },
    },
};

// Connection constraints are copied from the Babylon block constructors so this
// package can enforce them without loading the Babylon runtime in a browser.
const NumericExcluded = ["Matrix", "Geometry", "Texture"];
const VectorExcluded = ["Int", "Float", "Matrix"];

function SetPortMetadata(blockType: string, direction: "inputs" | "outputs", portName: string, metadata: Omit<IConnectionPointInfo, "name" | "type" | "isOptional">): void {
    const port = BlockRegistry[blockType][direction].find((entry) => entry.name === portName);
    if (!port) {
        throw new Error(`Invalid static connection metadata: ${blockType}.${portName}`);
    }
    Object.assign(port, metadata);
}

SetPortMetadata("GeometryTransformBlock", "inputs", "value", { excludedConnectionPointTypes: ["Float", "Matrix", "Texture"] });
SetPortMetadata("GeometryTransformBlock", "outputs", "output", { typeConnectionSource: "value" });
SetPortMetadata("GeometryCollectionBlock", "inputs", "geometry0", { linkedConnectionSource: "geometry1" });
SetPortMetadata("GeometryCollectionBlock", "inputs", "geometry1", { linkedConnectionSource: "geometry0" });
SetPortMetadata("GeometryCollectionBlock", "outputs", "output", { typeConnectionSource: "geometry0" });
SetPortMetadata("SetColorsBlock", "inputs", "colors", { excludedConnectionPointTypes: ["Int", "Float", "Vector2", "Texture", "Texture"] });
SetPortMetadata("SetMaterialIDBlock", "inputs", "id", { acceptedConnectionPointTypes: ["Float"] });
SetPortMetadata("AggregatorBlock", "outputs", "output", { typeConnectionSource: "source" });

for (const blockType of [
    "InstantiateBlock",
    "InstantiateLinearBlock",
    "InstantiateRadialBlock",
    "InstantiateOnFacesBlock",
    "InstantiateOnVerticesBlock",
    "InstantiateOnVolumeBlock",
]) {
    SetPortMetadata(blockType, "inputs", "scaling", { acceptedConnectionPointTypes: ["Float"] });
}

for (const [blockType, inputName] of [
    ["GeometryTrigonometryBlock", "input"],
    ["GeometryClampBlock", "value"],
    ["GeometrySmoothStepBlock", "value"],
    ["GeometryStepBlock", "value"],
    ["NormalizeVectorBlock", "input"],
    ["GeometryEaseBlock", "input"],
] as const) {
    SetPortMetadata(blockType, "inputs", inputName, { excludedConnectionPointTypes: NumericExcluded });
    SetPortMetadata(blockType, "outputs", "output", { typeConnectionSource: inputName });
}

for (const [blockType, leftName, rightName] of [
    ["MathBlock", "left", "right"],
    ["RandomBlock", "min", "max"],
    ["GeometryLerpBlock", "left", "right"],
    ["GeometryNLerpBlock", "left", "right"],
    ["GeometryModBlock", "left", "right"],
    ["GeometryPowBlock", "value", "power"],
    ["GeometryArcTan2Block", "x", "y"],
] as const) {
    SetPortMetadata(blockType, "inputs", leftName, { excludedConnectionPointTypes: NumericExcluded, linkedConnectionSource: rightName });
    SetPortMetadata(blockType, "inputs", rightName, { linkedConnectionSource: leftName });
    SetPortMetadata(blockType, "outputs", "output", { typeConnectionSource: leftName });
}
SetPortMetadata("MathBlock", "inputs", "right", { excludedConnectionPointTypes: NumericExcluded });
SetPortMetadata("RandomBlock", "inputs", "max", { excludedConnectionPointTypes: NumericExcluded });

SetPortMetadata("ConditionBlock", "inputs", "left", { acceptedConnectionPointTypes: ["Int"] });
SetPortMetadata("ConditionBlock", "inputs", "right", { acceptedConnectionPointTypes: ["Int"] });
SetPortMetadata("ConditionBlock", "inputs", "ifTrue", { linkedConnectionSource: "ifFalse" });
SetPortMetadata("ConditionBlock", "inputs", "ifFalse", { linkedConnectionSource: "ifTrue" });
SetPortMetadata("ConditionBlock", "outputs", "output", { typeConnectionSource: "ifTrue", defaultConnectionPointType: "Float" });

for (const [blockType, leftName, rightName, rightExcluded] of [
    ["GeometryDotBlock", "left", "right", ["Float", "Matrix"]],
    ["GeometryDistanceBlock", "left", "right", ["Float", "Matrix"]],
    ["GeometryCrossBlock", "left", "right", ["Int", "Float", "Matrix", "Vector2"]],
] as const) {
    SetPortMetadata(blockType, "inputs", leftName, {
        excludedConnectionPointTypes: blockType === "GeometryCrossBlock" ? [...rightExcluded] : VectorExcluded,
        linkedConnectionSource: rightName,
    });
    SetPortMetadata(blockType, "inputs", rightName, { excludedConnectionPointTypes: [...rightExcluded], linkedConnectionSource: leftName });
}

SetPortMetadata("GeometryLengthBlock", "inputs", "value", { excludedConnectionPointTypes: VectorExcluded });
SetPortMetadata("NormalizeVectorBlock", "inputs", "input", { excludedConnectionPointTypes: ["Float", "Matrix", "Geometry", "Texture"] });
SetPortMetadata("GeometryReplaceColorBlock", "inputs", "value", { excludedConnectionPointTypes: ["Float", "Matrix"], linkedConnectionSource: "replacement" });
SetPortMetadata("GeometryReplaceColorBlock", "inputs", "reference", { excludedConnectionPointTypes: ["Float", "Matrix"], linkedConnectionSource: "value" });
SetPortMetadata("GeometryReplaceColorBlock", "inputs", "replacement", { excludedConnectionPointTypes: ["Float", "Matrix"], linkedConnectionSource: "value" });
SetPortMetadata("GeometryReplaceColorBlock", "outputs", "output", { typeConnectionSource: "value" });
SetPortMetadata("GeometryPosterizeBlock", "inputs", "value", { excludedConnectionPointTypes: ["Matrix"], linkedConnectionSource: "steps" });
SetPortMetadata("GeometryPosterizeBlock", "inputs", "steps", {
    acceptedConnectionPointTypes: ["Float"],
    excludedConnectionPointTypes: ["Matrix"],
    linkedConnectionSource: "value",
});
SetPortMetadata("GeometryPosterizeBlock", "outputs", "output", { typeConnectionSource: "value" });
SetPortMetadata("MapRangeBlock", "inputs", "value", { excludedConnectionPointTypes: ["Vector2", "Vector3", "Vector4", "Matrix", "Geometry", "Texture"] });
SetPortMetadata("MapRangeBlock", "outputs", "output", { typeConnectionSource: "value" });
SetPortMetadata("DebugBlock", "inputs", "input", { excludedConnectionPointTypes: ["Geometry", "Texture"] });
SetPortMetadata("DebugBlock", "outputs", "output", { typeConnectionSource: "input" });
SetPortMetadata("GeometryCurveBlock", "inputs", "input", { excludedConnectionPointTypes: ["Matrix", "Int"] });
SetPortMetadata("GeometryCurveBlock", "outputs", "output", { typeConnectionSource: "input" });
for (const blockType of ["GeometryElbowBlock", "GeometryInterceptorBlock"]) {
    SetPortMetadata(blockType, "outputs", "output", { typeConnectionSource: "input" });
}
for (const [blockType, inputName] of [
    ["GeometryCollectionBlock", "geometry0"],
    ["MathBlock", "left"],
    ["RandomBlock", "min"],
    ["GeometryLerpBlock", "left"],
    ["GeometryNLerpBlock", "left"],
    ["GeometryModBlock", "left"],
    ["GeometryPowBlock", "value"],
    ["GeometryArcTan2Block", "x"],
    ["ConditionBlock", "ifTrue"],
    ["GeometryDotBlock", "left"],
    ["GeometryDistanceBlock", "left"],
    ["GeometryCrossBlock", "left"],
    ["GeometryReplaceColorBlock", "value"],
    ["GeometryPosterizeBlock", "value"],
] as const) {
    SetPortMetadata(blockType, "inputs", inputName, { isMainLinkSource: true });
}

const BooleanProperty = { type: "boolean" } as const;
const NumberProperty = { type: "number" } as const;
const StringProperty = { type: "string" } as const;

for (const info of Object.values(BlockRegistry)) {
    info.propertyMetadata = {
        name: StringProperty,
        comments: StringProperty,
        visibleOnFrame: BooleanProperty,
    };
    if (info.properties?.evaluateContext) {
        info.propertyMetadata.evaluateContext = BooleanProperty;
    }
}

function SetPropertyMetadata(blockType: string, metadata: Record<string, IBlockPropertyInfo>): void {
    Object.assign(BlockRegistry[blockType].propertyMetadata!, metadata);
}

SetPropertyMetadata("GeometryInputBlock", {
    type: {
        type: "enum",
        enumName: "NodeGeometryBlockConnectionPointTypes",
        enumValues: Object.fromEntries(
            Object.entries(NgeEnumCatalog.NodeGeometryBlockConnectionPointTypes.values).filter(([name]) =>
                ["Int", "Float", "Vector2", "Vector3", "Vector4", "Matrix"].includes(name)
            )
        ),
    },
    contextualValue: {
        type: "enum",
        enumName: "NodeGeometryContextualSources",
        enumValues: NgeEnumCatalog.NodeGeometryContextualSources.values,
    },
    value: { type: "geometryInputValue" },
    min: NumberProperty,
    max: NumberProperty,
    groupInInspector: StringProperty,
    displayInInspector: BooleanProperty,
});
SetPropertyMetadata("MeshBlock", { serializedCachedData: BooleanProperty, reverseWindingOrder: BooleanProperty });
SetPropertyMetadata("PointListBlock", { points: { type: "vector3Array" } });
SetPropertyMetadata("BooleanGeometryBlock", {
    operation: { type: "enum", enumName: "BooleanGeometryOperations", enumValues: NgeEnumCatalog.BooleanGeometryOperations.values },
    useOldCSGEngine: BooleanProperty,
});
SetPropertyMetadata("ExtrudeGeometryBlock", {
    cap: { type: "enum", enumName: "ExtrudeGeometryCap", enumValues: { NoCap: 0, CapStart: 1, CapEnd: 2, CapAll: 3 } },
});
SetPropertyMetadata("SubdivideBlock", { flatOnly: BooleanProperty, loopWeight: { type: "number", minimum: 0, maximum: 1 } });
SetPropertyMetadata("GeometryOptimizeBlock", { epsilon: { type: "number", minimum: 0 }, optimizeFaces: BooleanProperty });
SetPropertyMetadata("SetUVsBlock", { textureCoordinateIndex: { type: "integer", minimum: 0, maximum: 5 } });
SetPropertyMetadata("InstantiateOnVerticesBlock", { removeDuplicatedPositions: BooleanProperty });
SetPropertyMetadata("InstantiateOnVolumeBlock", { gridMode: BooleanProperty });
SetPropertyMetadata("MathBlock", {
    operation: { type: "enum", enumName: "MathBlockOperations", enumValues: NgeEnumCatalog.MathBlockOperations.values },
});
SetPropertyMetadata("GeometryTrigonometryBlock", {
    operation: {
        type: "enum",
        enumName: "GeometryTrigonometryBlockOperations",
        enumValues: NgeEnumCatalog.GeometryTrigonometryBlockOperations.values,
    },
});
SetPropertyMetadata("ConditionBlock", {
    test: { type: "enum", enumName: "ConditionBlockTests", enumValues: NgeEnumCatalog.ConditionBlockTests.values },
    epsilon: { type: "number", minimum: 0 },
});
SetPropertyMetadata("RandomBlock", {
    lockMode: { type: "enum", enumName: "RandomBlockLocks", enumValues: NgeEnumCatalog.RandomBlockLocks.values },
});
SetPropertyMetadata("AggregatorBlock", {
    aggregation: { type: "enum", enumName: "Aggregations", enumValues: NgeEnumCatalog.Aggregations.values },
});
SetPropertyMetadata("LatticeBlock", {
    resolutionX: { type: "integer", minimum: 1, maximum: 10 },
    resolutionY: { type: "integer", minimum: 1, maximum: 10 },
    resolutionZ: { type: "integer", minimum: 1, maximum: 10 },
});
SetPropertyMetadata("MappingBlock", {
    mapping: { type: "enum", enumName: "MappingTypes", enumValues: NgeEnumCatalog.MappingTypes.values },
});
SetPropertyMetadata("GeometryEaseBlock", {
    type: { type: "enum", enumName: "GeometryEaseBlockTypes", enumValues: NgeEnumCatalog.GeometryEaseBlockTypes.values },
});
SetPropertyMetadata("TeleportOutBlock", { entryPoint: { type: "integer", minimum: 0 } });
SetPropertyMetadata("GeometryTextureBlock", { serializedCachedData: BooleanProperty });
SetPropertyMetadata("GeometryCurveBlock", {
    curveType: { type: "enum", enumName: "GeometryCurveBlockTypes", enumValues: NgeEnumCatalog.GeometryEaseBlockTypes.values },
});
SetPropertyMetadata("GeometryTextureFetchBlock", { clampCoordinates: BooleanProperty, interpolation: BooleanProperty });

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Return a Markdown-formatted summary of the block catalog, grouped by category.
 * @returns Markdown string summarizing available block types and their descriptions.
 */
export function GetBlockCatalogSummary(): string {
    const categories = new Map<string, string[]>();
    for (const [key, info] of Object.entries(BlockRegistry)) {
        const cat = info.category;
        if (!categories.has(cat)) {
            categories.set(cat, []);
        }
        categories.get(cat)!.push(`  ${key}: ${info.description.split(".")[0]}`);
    }

    const lines: string[] = [];
    for (const [cat, entries] of categories) {
        lines.push(`## ${cat}`);
        lines.push(...entries);
        lines.push("");
    }
    return lines.join("\n");
}

/**
 * Return the full info for a specific block type.
 * @param blockType The block type name (e.g., "SetPositionsBlock").
 * @returns The IBlockTypeInfo for the specified block type, or undefined if not found.
 */
export function GetBlockTypeDetails(blockType: string): IBlockTypeInfo | undefined {
    return BlockRegistry[blockType];
}
