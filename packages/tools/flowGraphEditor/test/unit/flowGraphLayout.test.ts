import { describe, it, expect } from "vitest";
import { ComputeFlowGraphLayout, type IFlowLayoutNode } from "flow-graph-editor/graphSystem/flowGraphLayout";

/**
 * Helper to build a layout node with sane defaults so each test only declares what it cares about.
 */
function MakeNode(id: number, overrides: Partial<IFlowLayoutNode> = {}): IFlowLayoutNode {
    return {
        id,
        width: 100,
        height: 50,
        isEvent: false,
        signalOut: [],
        dataOut: [],
        ...overrides,
    };
}

const Options = { horizontalGap: 80, verticalGap: 40, startX: 0, startY: 0 };

describe("ComputeFlowGraphLayout", () => {
    it("returns an empty map for no nodes", () => {
        expect(ComputeFlowGraphLayout([]).size).toBe(0);
    });

    it("places an event before the block it triggers (left-to-right)", () => {
        const nodes = [MakeNode(1, { isEvent: true, signalOut: [2] }), MakeNode(2)];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        const event = positions.get(1)!;
        const target = positions.get(2)!;
        expect(event.x).toBeLessThan(target.x);
        // Both start at the same top because each occupies its own column.
        expect(event.y).toBe(0);
        expect(target.y).toBe(0);
    });

    it("tiles independent flows side by side instead of one tall column", () => {
        // Two unrelated event chains: 1 -> 10 and 2 -> 20.
        const nodes = [MakeNode(1, { isEvent: true, signalOut: [10] }), MakeNode(2, { isEvent: true, signalOut: [20] }), MakeNode(10), MakeNode(20)];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        const e1 = positions.get(1)!;
        const e2 = positions.get(2)!;
        // The two flows are tiled into a grid (here, side by side on the same row) rather than
        // stacked into a single column.
        expect(e1.y).toBe(e2.y);
        expect(e1.x).toBeLessThan(e2.x);
        // Each event still starts (is left of) the block it triggers.
        expect(e1.x).toBeLessThan(positions.get(10)!.x);
        expect(e2.x).toBeLessThan(positions.get(20)!.x);
    });

    it("stacks diverging branches vertically and pushes downstream blocks rightward", () => {
        // event -> branch -> { a, b }
        const nodes = [MakeNode(1, { isEvent: true, signalOut: [2] }), MakeNode(2, { signalOut: [3, 4] }), MakeNode(3), MakeNode(4)];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        const branch = positions.get(2)!;
        const a = positions.get(3)!;
        const b = positions.get(4)!;
        // a and b share a column to the right of the branch.
        expect(a.x).toBe(b.x);
        expect(a.x).toBeGreaterThan(branch.x);
        // First branch above the second.
        expect(a.y).toBeLessThan(b.y);
    });

    it("places a join node to the right of both incoming branches", () => {
        // event -> branch -> { a, b } -> join
        const nodes = [
            MakeNode(1, { isEvent: true, signalOut: [2] }),
            MakeNode(2, { signalOut: [3, 4] }),
            MakeNode(3, { signalOut: [5] }),
            MakeNode(4, { signalOut: [5] }),
            MakeNode(5),
        ];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        const join = positions.get(5)!;
        expect(join.x).toBeGreaterThan(positions.get(3)!.x);
        expect(join.x).toBeGreaterThan(positions.get(4)!.x);
    });

    it("does not run away on a loop back-edge", () => {
        // event -> body -> back to body (self/loop). The body must still get a finite column.
        const nodes = [MakeNode(1, { isEvent: true, signalOut: [2] }), MakeNode(2, { signalOut: [3] }), MakeNode(3, { signalOut: [2] })];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        // Three distinct columns at most; back-edge from 3 -> 2 is dropped.
        const xs = [positions.get(1)!.x, positions.get(2)!.x, positions.get(3)!.x];
        expect(xs[0]).toBeLessThan(xs[1]);
        expect(xs[1]).toBeLessThan(xs[2]);
    });

    it("parks a pure data provider one column left of the block it feeds", () => {
        // event -> consumer ; const(10) feeds consumer via a data wire only.
        const nodes = [MakeNode(1, { isEvent: true, signalOut: [2] }), MakeNode(2), MakeNode(10, { dataOut: [2] })];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        const provider = positions.get(10)!;
        const consumer = positions.get(2)!;
        expect(provider.x).toBeLessThan(consumer.x);
    });

    it("never overlaps two nodes within the same column", () => {
        const nodes = [MakeNode(1, { isEvent: true, signalOut: [2, 3, 4] }), MakeNode(2), MakeNode(3), MakeNode(4)];
        const positions = ComputeFlowGraphLayout(nodes, Options);
        const ys = [positions.get(2)!.y, positions.get(3)!.y, positions.get(4)!.y].sort((a, b) => a - b);
        // Each node is 50 tall with a 40 gap, so consecutive tops differ by at least 90.
        expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(90);
        expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(90);
    });
});
