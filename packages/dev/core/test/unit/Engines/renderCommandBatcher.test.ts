import { describe, expect, it, vi } from "vitest";
import { type IRenderCommandLowering, RenderCommandBatcher } from "core/Engines/renderCommandBatcher.pure";

interface ITestCommand {
    id: number;
}

function createLowering(appendResults: boolean[]): { lowering: IRenderCommandLowering<ITestCommand>; events: string[] } {
    const events: string[] = [];
    const lowering: IRenderCommandLowering<ITestCommand> = {
        tryAppend: (command) => {
            events.push(`try:${command.id}`);
            return appendResults.shift() ?? false;
        },
        flush: () => {
            events.push("flush");
            return true;
        },
        reset: () => {
            events.push("reset");
        },
    };

    return { lowering, events };
}

describe("RenderCommandBatcher", () => {
    it("replays when no lowering is installed", () => {
        const replay = vi.fn();
        const batcher = new RenderCommandBatcher<ITestCommand>(null, replay);

        expect(batcher.submit({ id: 1 })).toBe(false);
        expect(replay).toHaveBeenCalledExactlyOnceWith({ id: 1 });
        expect(batcher.flush()).toBe(false);

        expect(() => batcher.reset()).not.toThrow();
    });

    it("does not replay commands that lower successfully", () => {
        const { lowering, events } = createLowering([true]);
        const replay = vi.fn();
        const batcher = new RenderCommandBatcher(lowering, replay);

        expect(batcher.submit({ id: 1 })).toBe(true);

        expect(replay).not.toHaveBeenCalled();
        expect(events).toEqual(["try:1"]);
    });

    it("flushes lowered commands before replaying a command that cannot lower", () => {
        const { lowering, events } = createLowering([true, false]);
        const replay = vi.fn((command: ITestCommand) => events.push(`replay:${command.id}`));
        const batcher = new RenderCommandBatcher(lowering, replay);

        expect(batcher.submit({ id: 1 })).toBe(true);
        expect(batcher.submit({ id: 2 })).toBe(false);

        expect(events).toEqual(["try:1", "try:2", "flush", "replay:2"]);
    });

    it("handles zero, one, and many explicit flushes through the lowerer", () => {
        const { lowering, events } = createLowering([true, true]);
        const batcher = new RenderCommandBatcher(lowering, vi.fn());

        expect(batcher.flush()).toBe(true);
        expect(batcher.submit({ id: 1 })).toBe(true);
        expect(batcher.flush()).toBe(true);
        expect(batcher.submit({ id: 2 })).toBe(true);
        expect(batcher.flush()).toBe(true);

        expect(events).toEqual(["flush", "try:1", "flush", "try:2", "flush"]);
    });

    it("delegates reset only when a lowerer exists", () => {
        const { lowering, events } = createLowering([]);
        const batcher = new RenderCommandBatcher(lowering, vi.fn());

        batcher.reset();

        expect(events).toEqual(["reset"]);
    });
});
