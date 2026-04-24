import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { type Engine, NullEngine } from "core/Engines";
import { type FlowGraph, type FlowGraphContext, FlowGraphCoordinator, FlowGraphGetVariableBlock } from "core/FlowGraph";
import { FlowGraphSetVariableBlock } from "core/FlowGraph/Blocks/Execution/flowGraphSetVariableBlock";
import { Scene } from "core/scene";
import { Vector2, Vector3 } from "core/Maths/math.vector";
import { Color3, Color4 } from "core/Maths/math.color";
import {
    GatherVariables,
    GatherVariableNames,
    RenameVariable,
    DeleteVariable,
    FormatVariableValue,
    FilterSuggestions,
    ParseVariableValue,
    IsSceneObjectType,
    IsVectorOrColorType,
    GetComponentCount,
    GetComponentLabels,
    GetComponents,
    BuildFromComponents,
    GetDefaultValueForType,
    InferVariableType,
    type IVariableEntry,
    type VariableTypeName,
} from "flow-graph-editor/variableUtils";
import { CONSTRUCTOR_CONFIG } from "flow-graph-editor/graphSystem/properties/constructorConfigRegistry";

describe("Flow Graph Variable Utils", () => {
    let engine: Engine;
    let scene: Scene;
    let flowGraphCoordinator: FlowGraphCoordinator;
    let flowGraph: FlowGraph;
    let flowGraphContext: FlowGraphContext;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });

        scene = new Scene(engine);
        flowGraphCoordinator = new FlowGraphCoordinator({ scene });
        flowGraph = flowGraphCoordinator.createGraph();
        flowGraphContext = flowGraph.createContext();
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // --------------------------------------------------------
    // gatherVariables
    // --------------------------------------------------------
    describe("gatherVariables", () => {
        it("returns empty array for a graph with no variable blocks", () => {
            const result = GatherVariables(flowGraph);
            expect(result).toEqual([]);
        });

        it("finds a single GetVariable block", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "myVar" });
            flowGraph.addBlock(get);

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "myVar", getCount: 1, setCount: 0 });
        });

        it("finds a single SetVariable block", () => {
            const set = new FlowGraphSetVariableBlock({ variable: "myVar" });
            flowGraph.addBlock(set);

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "myVar", getCount: 0, setCount: 1 });
        });

        it("counts multiple GetVariable blocks for the same variable", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "x" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "x" }));

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0].getCount).toBe(2);
            expect(result[0].setCount).toBe(0);
        });

        it("aggregates Get and Set counts for the same variable", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "counter" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "counter" }));
            flowGraph.addBlock(new FlowGraphSetVariableBlock({ variable: "counter" }));

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "counter", getCount: 2, setCount: 1 });
        });

        it("handles SetVariable in multi-variable mode", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["a", "b", "c"] });
            flowGraph.addBlock(set);

            const result = GatherVariables(flowGraph);
            const names = result.map((v) => v.name);
            expect(names).toContain("a");
            expect(names).toContain("b");
            expect(names).toContain("c");
            for (const entry of result) {
                expect(entry.setCount).toBe(1);
            }
        });

        it("includes context user variables not referenced by blocks", () => {
            flowGraphContext.setVariable("orphanVar", 42);

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "orphanVar", getCount: 0, setCount: 0 });
        });

        it("merges block-referenced and context-only variables", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "fromBlock" }));
            flowGraphContext.setVariable("fromContext", "hello");

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(2);
            const names = result.map((v) => v.name);
            expect(names).toContain("fromBlock");
            expect(names).toContain("fromContext");
        });

        it("returns variables sorted alphabetically", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "zebra" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "apple" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "mango" }));

            const result = GatherVariables(flowGraph);
            expect(result.map((v) => v.name)).toEqual(["apple", "mango", "zebra"]);
        });

        it("does not double-count a variable that exists in both blocks and context", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "shared" }));
            flowGraphContext.setVariable("shared", 10);

            const result = GatherVariables(flowGraph);
            expect(result).toHaveLength(1);
            expect(result[0]).toEqual({ name: "shared", getCount: 1, setCount: 0 });
        });
    });

    // --------------------------------------------------------
    // gatherVariableNames
    // --------------------------------------------------------
    describe("gatherVariableNames", () => {
        it("returns empty array for graph with no variable blocks", () => {
            expect(GatherVariableNames(flowGraph)).toEqual([]);
        });

        it("returns sorted unique variable names", () => {
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "b" }));
            flowGraph.addBlock(new FlowGraphSetVariableBlock({ variable: "a" }));
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "b" }));

            expect(GatherVariableNames(flowGraph)).toEqual(["a", "b"]);
        });

        it("excludes variables from the excluded block", () => {
            const excluded = new FlowGraphGetVariableBlock({ variable: "private" });
            flowGraph.addBlock(excluded);
            flowGraph.addBlock(new FlowGraphGetVariableBlock({ variable: "shared" }));

            const result = GatherVariableNames(flowGraph, excluded);
            expect(result).toEqual(["shared"]);
        });

        it("includes context user variables", () => {
            flowGraphContext.setVariable("contextVar", true);

            const result = GatherVariableNames(flowGraph);
            expect(result).toEqual(["contextVar"]);
        });
    });

    // --------------------------------------------------------
    // renameVariable
    // --------------------------------------------------------
    describe("renameVariable", () => {
        it("renames a GetVariable block's config", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "old" });
            flowGraph.addBlock(get);

            RenameVariable(flowGraph, "old", "new");
            expect((get.config as any).variable).toBe("new");
        });

        it("renames a SetVariable block's config", () => {
            const set = new FlowGraphSetVariableBlock({ variable: "old" });
            flowGraph.addBlock(set);

            RenameVariable(flowGraph, "old", "new");
            expect((set.config as any).variable).toBe("new");
        });

        it("renames in SetVariable multi-variable mode", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["alpha", "old", "gamma"] });
            flowGraph.addBlock(set);

            RenameVariable(flowGraph, "old", "new");
            expect((set.config as any).variables).toEqual(["alpha", "new", "gamma"]);
        });

        it("renames the data input port in SetVariable multi-variable mode", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["alpha", "old", "gamma"] });
            flowGraph.addBlock(set);

            // Before rename, port should be named "old"
            expect(set.getDataInput("old")).toBeDefined();

            RenameVariable(flowGraph, "old", "renamed");

            // After rename, port should be found by new name
            expect(set.getDataInput("old")).toBeUndefined();
            expect(set.getDataInput("renamed")).toBeDefined();
        });

        it("renames in context user variables", () => {
            flowGraphContext.setVariable("old", 123);

            RenameVariable(flowGraph, "old", "new");
            expect(flowGraphContext.hasVariable("old")).toBe(false);
            expect(flowGraphContext.hasVariable("new")).toBe(true);
            expect(flowGraphContext.getVariable("new")).toBe(123);
        });

        it("does nothing when old and new names are the same", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "same" });
            flowGraph.addBlock(get);

            RenameVariable(flowGraph, "same", "same");
            expect((get.config as any).variable).toBe("same");
        });

        it("does nothing when new name is empty", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "existing" });
            flowGraph.addBlock(get);

            RenameVariable(flowGraph, "existing", "");
            expect((get.config as any).variable).toBe("existing");
        });

        it("only renames matching variables, leaves others untouched", () => {
            const get1 = new FlowGraphGetVariableBlock({ variable: "target" });
            const get2 = new FlowGraphGetVariableBlock({ variable: "other" });
            flowGraph.addBlock(get1);
            flowGraph.addBlock(get2);

            RenameVariable(flowGraph, "target", "renamed");
            expect((get1.config as any).variable).toBe("renamed");
            expect((get2.config as any).variable).toBe("other");
        });
    });

    // --------------------------------------------------------
    // deleteVariable
    // --------------------------------------------------------
    describe("deleteVariable", () => {
        it("removes a GetVariable block referencing the deleted variable", () => {
            const get = new FlowGraphGetVariableBlock({ variable: "toDelete" });
            flowGraph.addBlock(get);

            DeleteVariable(flowGraph, "toDelete");
            expect(flowGraph.getAllBlocks()).toHaveLength(0);
        });

        it("removes a SetVariable block referencing the deleted variable", () => {
            const set = new FlowGraphSetVariableBlock({ variable: "toDelete" });
            flowGraph.addBlock(set);

            DeleteVariable(flowGraph, "toDelete");
            expect(flowGraph.getAllBlocks()).toHaveLength(0);
        });

        it("removes variable from multi-variable SetVariable without removing block", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["keep", "toDelete"] });
            flowGraph.addBlock(set);

            DeleteVariable(flowGraph, "toDelete");
            expect(flowGraph.getAllBlocks()).toHaveLength(1);
            expect((set.config as any).variables).toEqual(["keep"]);
        });

        it("removes the data input port when deleting from multi-variable SetVariable", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["keep", "toDelete"] });
            flowGraph.addBlock(set);

            // Before delete, both ports exist
            expect(set.getDataInput("keep")).toBeDefined();
            expect(set.getDataInput("toDelete")).toBeDefined();
            const portCountBefore = set.dataInputs.length;

            DeleteVariable(flowGraph, "toDelete");

            // After delete, the port for "toDelete" should be gone
            expect(set.getDataInput("toDelete")).toBeUndefined();
            expect(set.dataInputs.length).toBe(portCountBefore - 1);
        });

        it("removes multi-variable SetVariable block when last variable is deleted", () => {
            const set = new FlowGraphSetVariableBlock({ variables: ["only"] });
            flowGraph.addBlock(set);

            DeleteVariable(flowGraph, "only");
            expect(flowGraph.getAllBlocks()).toHaveLength(0);
        });

        it("removes variable from context", () => {
            flowGraphContext.setVariable("toDelete", "value");

            DeleteVariable(flowGraph, "toDelete");
            expect(flowGraphContext.hasVariable("toDelete")).toBe(false);
        });

        it("does not affect unrelated blocks or variables", () => {
            const keep = new FlowGraphGetVariableBlock({ variable: "keep" });
            const del = new FlowGraphGetVariableBlock({ variable: "del" });
            flowGraph.addBlock(keep);
            flowGraph.addBlock(del);
            flowGraphContext.setVariable("keep", 1);
            flowGraphContext.setVariable("del", 2);

            DeleteVariable(flowGraph, "del");
            expect(flowGraph.getAllBlocks()).toHaveLength(1);
            expect((flowGraph.getAllBlocks()[0].config as any).variable).toBe("keep");
            expect(flowGraphContext.hasVariable("keep")).toBe(true);
        });
    });

    // --------------------------------------------------------
    // formatVariableValue
    // --------------------------------------------------------
    describe("formatVariableValue", () => {
        it("formats undefined", () => {
            expect(FormatVariableValue(undefined)).toBe("undefined");
        });

        it("formats null", () => {
            expect(FormatVariableValue(null)).toBe("null");
        });

        it("formats numbers", () => {
            expect(FormatVariableValue(42)).toBe("42");
            expect(FormatVariableValue(3.14)).toBe("3.14");
            expect(FormatVariableValue(0)).toBe("0");
            expect(FormatVariableValue(-1)).toBe("-1");
        });

        it("formats booleans", () => {
            expect(FormatVariableValue(true)).toBe("true");
            expect(FormatVariableValue(false)).toBe("false");
        });

        it("formats strings", () => {
            expect(FormatVariableValue("hello")).toBe("hello");
            expect(FormatVariableValue("")).toBe("");
        });

        it("truncates long strings to 60 chars", () => {
            const long = "a".repeat(100);
            const result = FormatVariableValue(long);
            expect(result.length).toBe(60);
            expect(result).toBe("a".repeat(57) + "...");
        });

        it("formats objects with custom toString", () => {
            const obj = { toString: () => "Vector3(1, 2, 3)" };
            expect(FormatVariableValue(obj)).toBe("Vector3(1, 2, 3)");
        });

        it("formats plain objects as JSON", () => {
            expect(FormatVariableValue({ x: 1, y: 2 })).toBe('{"x":1,"y":2}');
        });

        it("truncates long JSON objects", () => {
            const obj: Record<string, number> = {};
            for (let i = 0; i < 20; i++) {
                obj[`longPropertyName${i}`] = i;
            }
            const result = FormatVariableValue(obj);
            expect(result.length).toBe(60);
            expect(result.endsWith("...")).toBe(true);
        });

        it("formats arrays via their toString", () => {
            expect(FormatVariableValue([1, 2, 3])).toBe("1,2,3");
        });

        it("handles circular references gracefully", () => {
            const obj: any = {};
            obj.self = obj;
            expect(FormatVariableValue(obj)).toBe("[object]");
        });

        it("does not use Object.prototype.toString for plain objects", () => {
            const plain = { a: 1 };
            // plain.toString() === "[object Object]" — should use JSON instead
            expect(FormatVariableValue(plain)).toBe('{"a":1}');
        });
    });

    // --------------------------------------------------------
    // filterSuggestions
    // --------------------------------------------------------
    describe("filterSuggestions", () => {
        const suggestions = ["playerHealth", "playerName", "enemyCount", "score", "isAlive"];

        it("returns all suggestions when query is empty", () => {
            expect(FilterSuggestions(suggestions, "")).toEqual(suggestions);
        });

        it("filters case-insensitively", () => {
            expect(FilterSuggestions(suggestions, "PLAYER")).toEqual(["playerHealth", "playerName"]);
        });

        it("matches substring anywhere in the string", () => {
            expect(FilterSuggestions(suggestions, "count")).toEqual(["enemyCount"]);
        });

        it("returns empty array when nothing matches", () => {
            expect(FilterSuggestions(suggestions, "xyz")).toEqual([]);
        });

        it("preserves order of original suggestions", () => {
            expect(FilterSuggestions(suggestions, "e")).toEqual(["playerHealth", "playerName", "enemyCount", "score", "isAlive"]);
        });

        it("handles empty suggestions array", () => {
            expect(FilterSuggestions([], "test")).toEqual([]);
        });
    });

    // --------------------------------------------------------
    // Constructor config registry (variable-picker kind)
    // --------------------------------------------------------
    describe("Constructor Config Registry", () => {
        it("registers FlowGraphGetVariableBlock with variable-picker kind", () => {
            const fields = CONSTRUCTOR_CONFIG.get("FlowGraphGetVariableBlock");
            expect(fields).toBeDefined();
            expect(fields).toHaveLength(1);
            expect(fields![0].key).toBe("variable");
            expect(fields![0].kind).toBe("variable-picker");
        });

        it("registers FlowGraphSetVariableBlock with variable-picker kind", () => {
            const fields = CONSTRUCTOR_CONFIG.get("FlowGraphSetVariableBlock");
            expect(fields).toBeDefined();
            expect(fields).toHaveLength(1);
            expect(fields![0].key).toBe("variable");
            expect(fields![0].kind).toBe("variable-picker");
        });
    });

    // --------------------------------------------------------
    // Integration: context persistence (the bug fix for issue #1)
    // --------------------------------------------------------
    describe("Context persistence", () => {
        it("variables added to context via createContext persist across gatherVariables calls", () => {
            const ctx = flowGraph.getContext(0) ?? flowGraph.createContext();
            ctx.setVariable("myNewVar", undefined);

            const result1 = GatherVariables(flowGraph);
            expect(result1.map((v) => v.name)).toContain("myNewVar");

            // Call again — should still be there
            const result2 = GatherVariables(flowGraph);
            expect(result2.map((v) => v.name)).toContain("myNewVar");
        });

        it("context variables survive after renaming", () => {
            flowGraphContext.setVariable("original", 100);

            RenameVariable(flowGraph, "original", "renamed");

            const result = GatherVariables(flowGraph);
            expect(result.map((v) => v.name)).toContain("renamed");
            expect(result.map((v) => v.name)).not.toContain("original");
        });

        it("context variables are removed after deleteVariable", () => {
            flowGraphContext.setVariable("toGo", "bye");

            DeleteVariable(flowGraph, "toGo");

            const result = GatherVariables(flowGraph);
            expect(result.map((v) => v.name)).not.toContain("toGo");
        });
    });

    // --------------------------------------------------------
    // ParseVariableValue
    // --------------------------------------------------------
    describe("ParseVariableValue", () => {
        it("parses boolean true", () => {
            expect(ParseVariableValue("true", false)).toBe(true);
        });

        it("parses boolean false", () => {
            expect(ParseVariableValue("false", true)).toBe(false);
        });

        it("parses null", () => {
            expect(ParseVariableValue("null", "anything")).toBe(null);
        });

        it("parses undefined", () => {
            expect(ParseVariableValue("undefined", 42)).toBe(undefined);
        });

        it("parses number when current value is number", () => {
            expect(ParseVariableValue("42.5", 10)).toBe(42.5);
        });

        it("parses number when current value is undefined", () => {
            expect(ParseVariableValue("7", undefined)).toBe(7);
        });

        it("returns string when number parse fails and current is number", () => {
            expect(ParseVariableValue("hello", 10)).toBe("hello");
        });

        it("parses JSON object", () => {
            expect(ParseVariableValue('{"a":1}', "x")).toEqual({ a: 1 });
        });

        it("parses JSON array", () => {
            expect(ParseVariableValue("[1,2,3]", "x")).toEqual([1, 2, 3]);
        });

        it("returns string for invalid JSON starting with {", () => {
            expect(ParseVariableValue("{bad", "x")).toBe("{bad");
        });

        it("returns plain string for regular text", () => {
            expect(ParseVariableValue("hello world", "prev")).toBe("hello world");
        });

        it("trims whitespace", () => {
            expect(ParseVariableValue("  42  ", 0)).toBe(42);
        });

        it("handles negative numbers", () => {
            expect(ParseVariableValue("-3.14", 0)).toBe(-3.14);
        });
    });

    // -------------------------------------------------------
    // Type system helpers
    // -------------------------------------------------------

    describe("IsSceneObjectType", () => {
        it("returns true for scene object types", () => {
            const sceneTypes: VariableTypeName[] = ["Mesh", "TransformNode", "Camera", "Light", "Material", "AnimationGroup"];
            for (const t of sceneTypes) {
                expect(IsSceneObjectType(t)).toBe(true);
            }
        });

        it("returns false for non-scene types", () => {
            const nonScene: VariableTypeName[] = ["any", "string", "number", "boolean", "FlowGraphInteger", "Vector2", "Vector3", "Vector4", "Color3", "Color4"];
            for (const t of nonScene) {
                expect(IsSceneObjectType(t)).toBe(false);
            }
        });
    });

    describe("IsVectorOrColorType", () => {
        it("returns true for vector and color types", () => {
            const vecColor: VariableTypeName[] = ["Vector2", "Vector3", "Vector4", "Color3", "Color4"];
            for (const t of vecColor) {
                expect(IsVectorOrColorType(t)).toBe(true);
            }
        });

        it("returns false for non-vector types", () => {
            expect(IsVectorOrColorType("number")).toBe(false);
            expect(IsVectorOrColorType("Mesh")).toBe(false);
            expect(IsVectorOrColorType("any")).toBe(false);
        });
    });

    describe("GetComponentCount", () => {
        it("returns correct counts", () => {
            expect(GetComponentCount("Vector2")).toBe(2);
            expect(GetComponentCount("Vector3")).toBe(3);
            expect(GetComponentCount("Vector4")).toBe(4);
            expect(GetComponentCount("Color3")).toBe(3);
            expect(GetComponentCount("Color4")).toBe(4);
        });

        it("returns 0 for non-vector types", () => {
            expect(GetComponentCount("number")).toBe(0);
            expect(GetComponentCount("Mesh")).toBe(0);
        });
    });

    describe("GetComponentLabels", () => {
        it("returns xyz labels for vectors", () => {
            expect(GetComponentLabels("Vector2")).toEqual(["x", "y"]);
            expect(GetComponentLabels("Vector3")).toEqual(["x", "y", "z"]);
            expect(GetComponentLabels("Vector4")).toEqual(["x", "y", "z", "w"]);
        });

        it("returns rgba labels for colors", () => {
            expect(GetComponentLabels("Color3")).toEqual(["r", "g", "b"]);
            expect(GetComponentLabels("Color4")).toEqual(["r", "g", "b", "a"]);
        });

        it("returns empty array for non-vector types", () => {
            expect(GetComponentLabels("number")).toEqual([]);
        });
    });

    describe("GetComponents", () => {
        it("extracts components from a Vector3", () => {
            const v = new Vector3(1, 2, 3);
            expect(GetComponents(v, "Vector3")).toEqual([1, 2, 3]);
        });

        it("extracts components from a Color4", () => {
            const c = new Color4(0.1, 0.2, 0.3, 0.4);
            expect(GetComponents(c, "Color4")).toEqual([0.1, 0.2, 0.3, 0.4]);
        });

        it("returns zeros for null value", () => {
            expect(GetComponents(null, "Vector3")).toEqual([0, 0, 0]);
        });

        it("returns zeros for non-object value", () => {
            expect(GetComponents(42, "Vector2")).toEqual([0, 0]);
        });

        it("returns empty array for non-vector type", () => {
            expect(GetComponents({}, "number")).toEqual([]);
        });
    });

    describe("BuildFromComponents", () => {
        it("builds a Vector2", () => {
            const v = BuildFromComponents([3, 4], "Vector2") as Vector2;
            expect(v.x).toBe(3);
            expect(v.y).toBe(4);
        });

        it("builds a Vector3", () => {
            const v = BuildFromComponents([1, 2, 3], "Vector3") as Vector3;
            expect(v.x).toBe(1);
            expect(v.y).toBe(2);
            expect(v.z).toBe(3);
        });

        it("builds a Color3", () => {
            const c = BuildFromComponents([0.5, 0.6, 0.7], "Color3") as Color3;
            expect(c.r).toBe(0.5);
            expect(c.g).toBe(0.6);
            expect(c.b).toBe(0.7);
        });

        it("builds a Color4", () => {
            const c = BuildFromComponents([0.1, 0.2, 0.3, 1], "Color4") as Color4;
            expect(c.r).toBe(0.1);
            expect(c.g).toBe(0.2);
            expect(c.b).toBe(0.3);
            expect(c.a).toBe(1);
        });

        it("returns undefined for non-vector type", () => {
            expect(BuildFromComponents([1], "number")).toBeUndefined();
        });
    });

    describe("GetDefaultValueForType", () => {
        it("returns 0 for number", () => {
            expect(GetDefaultValueForType("number")).toBe(0);
        });

        it("returns empty string for string", () => {
            expect(GetDefaultValueForType("string")).toBe("");
        });

        it("returns false for boolean", () => {
            expect(GetDefaultValueForType("boolean")).toBe(false);
        });

        it("returns a FlowGraphInteger for FlowGraphInteger", () => {
            const val = GetDefaultValueForType("FlowGraphInteger") as { value: number; getClassName: () => string };
            expect(val.getClassName()).toBe("FlowGraphInteger");
            expect(val.value).toBe(0);
        });

        it("returns Vector3.Zero for Vector3", () => {
            const v = GetDefaultValueForType("Vector3") as Vector3;
            expect(v.x).toBe(0);
            expect(v.y).toBe(0);
            expect(v.z).toBe(0);
        });

        it("returns Color3.Black for Color3", () => {
            const c = GetDefaultValueForType("Color3") as Color3;
            expect(c.r).toBe(0);
            expect(c.g).toBe(0);
            expect(c.b).toBe(0);
        });

        it("returns Color4(0,0,0,1) for Color4", () => {
            const c = GetDefaultValueForType("Color4") as Color4;
            expect(c.r).toBe(0);
            expect(c.g).toBe(0);
            expect(c.b).toBe(0);
            expect(c.a).toBe(1);
        });

        it("returns undefined for scene object types", () => {
            expect(GetDefaultValueForType("Mesh")).toBeUndefined();
            expect(GetDefaultValueForType("Camera")).toBeUndefined();
        });

        it("returns undefined for any", () => {
            expect(GetDefaultValueForType("any")).toBeUndefined();
        });
    });

    describe("InferVariableType", () => {
        it("infers string", () => {
            expect(InferVariableType("hello")).toBe("string");
        });

        it("infers number", () => {
            expect(InferVariableType(42)).toBe("number");
        });

        it("infers boolean", () => {
            expect(InferVariableType(true)).toBe("boolean");
        });

        it("returns any for null/undefined", () => {
            expect(InferVariableType(null)).toBe("any");
            expect(InferVariableType(undefined)).toBe("any");
        });

        it("infers Vector3 from object with getClassName", () => {
            expect(InferVariableType(new Vector3(1, 2, 3))).toBe("Vector3");
        });

        it("infers Color3 from object with getClassName", () => {
            expect(InferVariableType(new Color3(1, 0, 0))).toBe("Color3");
        });

        it("returns any for unknown objects", () => {
            expect(InferVariableType({ foo: "bar" })).toBe("any");
        });

        it("returns any for objects with unrecognized className", () => {
            const obj = { getClassName: () => "SomeUnknownType" };
            expect(InferVariableType(obj)).toBe("any");
        });
    });
});
