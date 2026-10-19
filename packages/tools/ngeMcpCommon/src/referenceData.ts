/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Structured metadata for an NGE enumeration reference section.
 */
export interface INgeEnumCatalogEntry {
    /** Markdown heading text, excluding the heading marker. */
    heading: string;
    /** Named numeric values in display order. */
    values: Record<string, number>;
    /** Numeric display format. */
    valueFormat?: "decimal" | "hex4";
    /** Number of values shown in the markdown summary. */
    summaryValueCount?: number;
    /** Text appended directly after the formatted values. */
    summarySuffix?: string;
}

/**
 * NGE enumerations used by graph serialization and reference resources.
 */
export const NgeEnumCatalog = {
    NodeGeometryBlockConnectionPointTypes: {
        heading: "NodeGeometryBlockConnectionPointTypes",
        valueFormat: "hex4",
        values: {
            Int: 0x0001,
            Float: 0x0002,
            Vector2: 0x0004,
            Vector3: 0x0008,
            Vector4: 0x0010,
            Matrix: 0x0020,
            Geometry: 0x0040,
            Texture: 0x0080,
            AutoDetect: 0x0400,
            BasedOnInput: 0x0800,
            Undefined: 0x1000,
        },
    },
    NodeGeometryContextualSources: {
        heading: "NodeGeometryContextualSources (for GeometryInputBlock)",
        values: {
            None: 0,
            Positions: 1,
            Normals: 2,
            Tangents: 3,
            UV: 4,
            UV2: 5,
            UV3: 6,
            UV4: 7,
            UV5: 8,
            UV6: 9,
            Colors: 10,
            VertexID: 11,
            FaceID: 12,
            GeometryID: 13,
            CollectionID: 14,
            LoopID: 15,
            InstanceID: 16,
            LatticeID: 17,
            LatticeControl: 18,
        },
    },
    MathBlockOperations: {
        heading: "MathBlockOperations (for MathBlock)",
        values: {
            Add: 0,
            Subtract: 1,
            Multiply: 2,
            Divide: 3,
            Max: 4,
            Min: 5,
        },
    },
    GeometryTrigonometryBlockOperations: {
        heading: "GeometryTrigonometryBlockOperations (for GeometryTrigonometryBlock)",
        values: {
            Cos: 0,
            Sin: 1,
            Abs: 2,
            Exp: 3,
            Round: 4,
            Floor: 5,
            Ceiling: 6,
            Sqrt: 7,
            Log: 8,
            Tan: 9,
            ArcTan: 10,
            ArcCos: 11,
            ArcSin: 12,
            Sign: 13,
            Negate: 14,
            OneMinus: 15,
            Reciprocal: 16,
            ToDegrees: 17,
            ToRadians: 18,
            Fract: 19,
            Exp2: 20,
        },
    },
    ConditionBlockTests: {
        heading: "ConditionBlockTests (for ConditionBlock)",
        values: {
            Equal: 0,
            NotEqual: 1,
            LessThan: 2,
            GreaterThan: 3,
            LessOrEqual: 4,
            GreaterOrEqual: 5,
            Xor: 6,
            Or: 7,
            And: 8,
        },
    },
    BooleanGeometryOperations: {
        heading: "BooleanGeometryOperations (for BooleanGeometryBlock)",
        values: {
            Intersect: 0,
            Subtract: 1,
            Union: 2,
        },
    },
    RandomBlockLocks: {
        heading: "RandomBlockLocks (for RandomBlock)",
        values: {
            None: 0,
            LoopID: 1,
            InstanceID: 2,
            Once: 3,
        },
    },
    Aggregations: {
        heading: "Aggregations (for AggregatorBlock) — property name: aggregation",
        values: {
            Max: 0,
            Min: 1,
            Sum: 2,
        },
        summarySuffix: ". Default: Sum",
    },
    GeometryEaseBlockTypes: {
        heading: "GeometryEaseBlockTypes (for GeometryEaseBlock) — property name: type",
        values: {
            EaseInSine: 0,
            EaseOutSine: 1,
            EaseInOutSine: 2,
            EaseInQuad: 3,
            EaseOutQuad: 4,
            EaseInOutQuad: 5,
            EaseInCubic: 6,
            EaseOutCubic: 7,
            EaseInOutCubic: 8,
            EaseInQuart: 9,
            EaseOutQuart: 10,
            EaseInOutQuart: 11,
            EaseInQuint: 12,
            EaseOutQuint: 13,
            EaseInOutQuint: 14,
            EaseInExpo: 15,
            EaseOutExpo: 16,
            EaseInOutExpo: 17,
            EaseInCirc: 18,
            EaseOutCirc: 19,
            EaseInOutCirc: 20,
            EaseInBack: 21,
            EaseOutBack: 22,
            EaseInOutBack: 23,
            EaseInElastic: 24,
            EaseOutElastic: 25,
            EaseInOutElastic: 26,
        },
        summaryValueCount: 5,
        summarySuffix: ", ...",
    },
    MappingTypes: {
        heading: "MappingTypes (for MappingBlock) — property name: mapping",
        values: {
            Spherical: 0,
            Cylindrical: 1,
            Cubic: 2,
        },
    },
} satisfies Record<string, INgeEnumCatalogEntry>;

/**
 * Build the markdown returned by the standard NGE enums resource.
 * @returns The NGE enumeration reference.
 */
export function GetNgeEnumsReference(): string {
    const lines = ["# NGE Enumerations Reference"];

    for (const entry of Object.values(NgeEnumCatalog) as INgeEnumCatalogEntry[]) {
        const values = Object.entries(entry.values);
        const shownValues = values.slice(0, entry.summaryValueCount);
        const formattedValues = shownValues
            .map(([name, value]) => {
                const formattedValue = entry.valueFormat === "hex4" ? `0x${value.toString(16).padStart(4, "0")}` : value;
                return `${name} (${formattedValue})`;
            })
            .join(", ");

        lines.push("", `## ${entry.heading}`, `${formattedValues}${entry.summarySuffix ?? ""}`);
    }

    return lines.join("\n");
}

/**
 * Markdown returned by the standard NGE concepts resource.
 */
export const NgeConceptsMarkdown = [
    "# Node Geometry Concepts",
    "",
    "## What is a Node Geometry?",
    "A Node Geometry is a visual, graph-based procedural geometry builder in Babylon.js.",
    "Instead of creating meshes from code, you connect typed blocks that represent geometry",
    "operations. The graph evaluates at runtime to produce mesh vertex data.",
    "",
    "## Graph Structure — One Required Output",
    "Every Node Geometry graph MUST have exactly one output block:",
    "  • **GeometryOutputBlock** — receives the final Geometry output",
    "Without this block, the geometry cannot be built.",
    "",
    "## GeometryInputBlock — Contextual Sources & Constants",
    "GeometryInputBlock is the source of all external data entering the graph. It has two modes:",
    "",
    "### Mode 1: Contextual Source",
    "Reads per-vertex/per-face data from the geometry being processed.",
    "  • Set `contextualValue` to one of: Positions, Normals, Tangents, UV, UV2, UV3, UV4, UV5, UV6,",
    "    Colors, VertexID, FaceID, GeometryID, CollectionID, LoopID, InstanceID, LatticeID, LatticeControl",
    "  • The `type` is automatically derived from the contextual source:",
    "    - Positions/Normals/Tangents/LatticeControl → Vector3",
    "    - UV/UV2/UV3/UV4/UV5/UV6 → Vector2",
    "    - Colors → Vector4",
    "    - VertexID/FaceID/GeometryID/CollectionID/LoopID/InstanceID/LatticeID → Int",
    "",
    "### Mode 2: Constant Value",
    "Provides a fixed value of a specific type.",
    "  • Set `type` to: Int, Float, Vector2, Vector3, Vector4, Matrix",
    "  • Set `value` to the constant (number, or {x,y}, {x,y,z}, {x,y,z,w}, or flat array)",
    "",
    "## Source Blocks — Built-in Primitives",
    "These blocks generate mesh geometry directly without needing inputs:",
    "  • BoxBlock, SphereBlock, CylinderBlock, PlaneBlock, TorusBlock, DiscBlock",
    "  • CapsuleBlock, IcoSphereBlock, GridBlock, NullBlock, MeshBlock, PointListBlock",
    "All dimension inputs (size, width, height, diameter, segments, subdivisions, etc.) are OPTIONAL INPUT",
    "PORTS with sensible defaults. To override them, add a GeometryInputBlock (type Float or Int) with",
    "the desired constant value and connect it to that port:",
    "  Example: connect GeometryInputBlock(Float, value=10) → PlaneBlock.size",
    "  Example: connect GeometryInputBlock(Float, value=0.5) → SphereBlock.diameter",
    "You do NOT need to add inputs for dimensions you want to keep at their defaults.",
    "",
    "## The Simplest Geometry Graph",
    "```",
    "BoxBlock.geometry → GeometryOutputBlock.geometry",
    "```",
    "That's it — one source block connected to the output. This generates a default box.",
    "",
    "## Transforming Geometry",
    "Use GeometryTransformBlock to translate, rotate, or scale geometry.",
    "It accepts geometry on 'value' and has built-in translation/rotation/scaling inputs:",
    "```",
    "BoxBlock.geometry → GeometryTransformBlock.value",
    "GeometryInputBlock(Vector3, value={x:0,y:2,z:0}) → GeometryTransformBlock.translation",
    "GeometryTransformBlock.output → GeometryOutputBlock.geometry",
    "```",
    "Alternatively, wire a TranslationBlock (or RotationXBlock/ScalingBlock) to the 'matrix' input",
    "for more complex multi-step transforms:",
    "```",
    "GeometryInputBlock(Vector3, {x:0,y:2,z:0}) → TranslationBlock.translation",
    "TranslationBlock.matrix → GeometryTransformBlock.matrix",
    "```",
    "",
    "## Merging Geometries",
    "Use MergeGeometryBlock to combine multiple geometries:",
    "```",
    "BoxBlock.geometry → MergeGeometryBlock.geometry0",
    "SphereBlock.geometry → MergeGeometryBlock.geometry1",
    "MergeGeometryBlock.output → GeometryOutputBlock.geometry",
    "```",
    "",
    "## Boolean Operations",
    "Use BooleanGeometryBlock for CSG operations (Intersect, Subtract, Union):",
    "```",
    "BoxBlock.geometry → BooleanGeometryBlock.geometry0",
    "SphereBlock.geometry → BooleanGeometryBlock.geometry1",
    "BooleanGeometryBlock.output → GeometryOutputBlock.geometry",
    "```",
    "",
    "## Instancing / Scattering",
    "Create copies of geometry arranged in patterns:",
    "  • InstantiateLinearBlock — line of copies along a direction",
    "  • InstantiateRadialBlock — copies arranged in a circle",
    "  • InstantiateOnFacesBlock — scatter copies on faces of source geometry",
    "  • InstantiateOnVerticesBlock — place copies at vertices of source geometry",
    "  • InstantiateOnVolumeBlock — scatter copies inside a volume",
    "",
    "## Per-Vertex Modification",
    "Use Set blocks (evaluateContext=true, the default) to modify vertices individually:",
    "```",
    "BoxBlock.geometry → SetPositionsBlock.geometry",
    "GeometryInputBlock(contextualValue:'Positions') → MathBlock.left   (positions, Vector3)",
    "NoiseBlock.output → VectorConverterBlock['x '] → VectorConverterBlock.xyz → MathBlock.right",
    "MathBlock.output → SetPositionsBlock.positions",
    "SetPositionsBlock.output → GeometryOutputBlock.geometry",
    "```",
    "Notes:",
    "  • SetPositionsBlock.positions is a REQUIRED input (must be connected).",
    "  • NoiseBlock outputs a Float; use VectorConverterBlock to lift it to Vector3.",
    "  • The MathBlock operation should be set to Add (0) via properties: { operation: 0 }.",
    "",
    "## VectorConverterBlock — Important: Trailing-Space Input Names",
    "VectorConverterBlock input port names have a TRAILING SPACE to disambiguate from outputs:",
    "  Inputs:  'xyzw ' (Vector4), 'xyz ' (Vector3), 'xy ' (Vector2), 'zw ' (Vector2),",
    "           'x ' (Float), 'y ' (Float), 'z ' (Float), 'w ' (Float)",
    "  Outputs: 'xyzw'   (Vector4), 'xyz'   (Vector3), 'xy'   (Vector2), 'zw'   (Vector2),",
    "           'x'    (Float),   'y'    (Float),   'z'    (Float),   'w'    (Float)",
    "When calling connect_blocks to a VectorConverterBlock INPUT, you MUST include the trailing space:",
    "  connect_blocks(sourceId, 'output', vectorConverterId, 'x ')   ← note the space",
    "  connect_blocks(vectorConverterId, 'xyz', targetId, ...)        ← outputs have no space",
    "",
    "## IntFloatConverterBlock — Same Trailing-Space Pattern",
    "Inputs:  'float ' (Float), 'int ' (Int)",
    "Outputs: 'float'  (Float), 'int'  (Int)",
    "",
    "## Common Mistakes",
    "1. Forgetting GeometryOutputBlock → geometry cannot be built",
    "2. Creating GeometryInputBlock without contextualValue or value → no data provided",
    "3. Setting evaluateContext=false on Set blocks when per-vertex behaviour is needed",
    "4. Not connecting the geometry flow — every path must link back to GeometryOutputBlock",
    "5. Omitting trailing space on VectorConverterBlock / IntFloatConverterBlock inputs",
    "6. Leaving SetPositionsBlock.positions unconnected (required, not optional)",
].join("\n");
