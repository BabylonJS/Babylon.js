import { ConnectionPointTypes, ContextualSources, GetNgeEnumsReference, NgeConceptsMarkdown, NgeEnumCatalog } from "@tools/nge-mcp-common";

describe("NGE shared reference data", () => {
    it("uses the structured enum catalog for graph serialization values", () => {
        expect(ConnectionPointTypes).toBe(NgeEnumCatalog.NodeGeometryBlockConnectionPointTypes.values);
        expect(ContextualSources).toBe(NgeEnumCatalog.NodeGeometryContextualSources.values);
        expect(NgeEnumCatalog.GeometryEaseBlockTypes.values.EaseOutElastic).toBe(25);
    });

    it("preserves the standard MCP enums resource text", () => {
        expect(GetNgeEnumsReference()).toBe(
            [
                "# NGE Enumerations Reference",
                "",
                "## NodeGeometryBlockConnectionPointTypes",
                "Int (0x0001), Float (0x0002), Vector2 (0x0004), Vector3 (0x0008), Vector4 (0x0010), Matrix (0x0020), Geometry (0x0040), Texture (0x0080), AutoDetect (0x0400), BasedOnInput (0x0800), Undefined (0x1000)",
                "",
                "## NodeGeometryContextualSources (for GeometryInputBlock)",
                "None (0), Positions (1), Normals (2), Tangents (3), UV (4), UV2 (5), UV3 (6), UV4 (7), UV5 (8), UV6 (9), Colors (10), VertexID (11), FaceID (12), GeometryID (13), CollectionID (14), LoopID (15), InstanceID (16), LatticeID (17), LatticeControl (18)",
                "",
                "## MathBlockOperations (for MathBlock)",
                "Add (0), Subtract (1), Multiply (2), Divide (3), Max (4), Min (5)",
                "",
                "## GeometryTrigonometryBlockOperations (for GeometryTrigonometryBlock)",
                "Cos (0), Sin (1), Abs (2), Exp (3), Round (4), Floor (5), Ceiling (6), Sqrt (7), Log (8), Tan (9), ArcTan (10), ArcCos (11), ArcSin (12), Sign (13), Negate (14), OneMinus (15), Reciprocal (16), ToDegrees (17), ToRadians (18), Fract (19), Exp2 (20)",
                "",
                "## ConditionBlockTests (for ConditionBlock)",
                "Equal (0), NotEqual (1), LessThan (2), GreaterThan (3), LessOrEqual (4), GreaterOrEqual (5), Xor (6), Or (7), And (8)",
                "",
                "## BooleanGeometryOperations (for BooleanGeometryBlock)",
                "Intersect (0), Subtract (1), Union (2)",
                "",
                "## RandomBlockLocks (for RandomBlock)",
                "None (0), LoopID (1), InstanceID (2), Once (3)",
                "",
                "## Aggregations (for AggregatorBlock) — property name: aggregation",
                "Max (0), Min (1), Sum (2). Default: Sum",
                "",
                "## GeometryEaseBlockTypes (for GeometryEaseBlock) — property name: type",
                "EaseInSine (0), EaseOutSine (1), EaseInOutSine (2), EaseInQuad (3), EaseOutQuad (4), ...",
                "",
                "## MappingTypes (for MappingBlock) — property name: mapping",
                "Spherical (0), Cylindrical (1), Cubic (2)",
            ].join("\n")
        );
    });

    it("exports the standard MCP concepts resource text", () => {
        expect(NgeConceptsMarkdown).toContain("# Node Geometry Concepts");
        expect(NgeConceptsMarkdown).toContain("## VectorConverterBlock — Important: Trailing-Space Input Names");
        expect(NgeConceptsMarkdown).toContain("6. Leaving SetPositionsBlock.positions unconnected (required, not optional)");
    });
});
