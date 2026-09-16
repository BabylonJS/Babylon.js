import { describe, expect, it } from "vitest";
import { blockFactory } from "core/FlowGraph/Blocks/flowGraphBlockFactory";
import { FlowGraphBlockNames } from "core/FlowGraph/Blocks/flowGraphBlockNames";
import { GetClass } from "core/Misc/typeStore";

describe("FlowGraph block factory", () => {
    it("loads a pure module and runs its explicit registration", async () => {
        expect(GetClass(FlowGraphBlockNames.Add)).toBeUndefined();
        expect(GetClass(FlowGraphBlockNames.Subtract)).toBeUndefined();

        const block = await blockFactory(FlowGraphBlockNames.Add)();

        expect(GetClass(FlowGraphBlockNames.Add)).toBe(block);
        expect(GetClass(FlowGraphBlockNames.Subtract)).toBeTypeOf("function");
    });

    it.each([FlowGraphBlockNames.KeyDownEvent, FlowGraphBlockNames.KeyUpEvent, FlowGraphBlockNames.IsKeyPressed])(
        "loads and registers the pure keyboard block %s",
        async (blockName) => {
            expect(GetClass(blockName)).toBeUndefined();

            const block = await blockFactory(blockName)();

            expect(GetClass(blockName)).toBe(block);
        }
    );
});
