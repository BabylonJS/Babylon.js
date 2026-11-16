import { describe, expect, it } from "vitest";

import { CreateExistingEventReactionTemplate, CreateIntersectionPlaySoundTemplate, CreatePickPlaySoundTemplate } from "flow-graph-editor/compositeTemplates";

describe("sound reaction templates", () => {
    it("creates a parameterized pick to play-sound graph from plain blocks", () => {
        const mesh = { name: "button" };
        const template = CreatePickPlaySoundTemplate({ targetMesh: mesh, soundAssetName: "click" });

        expect(template.blocks.map((block) => block.className)).toEqual(["FlowGraphMeshPickEventBlock", "FlowGraphPlaySoundBlock"]);
        expect(template.blocks[0].inputValues).toEqual({ asset: mesh });
        expect(template.blocks[1].inputValues).toEqual({ sound: "click" });
        expect(template.connections).toEqual([{ fromBlock: 0, fromPort: "out", toBlock: 1, toPort: "in", isSignal: true }]);
    });

    it("creates a parameterized intersection to play-sound graph", () => {
        const sourceMesh = { name: "tool" };
        const targetMeshes = [{ name: "socket-a" }, { name: "socket-b" }];
        const template = CreateIntersectionPlaySoundTemplate({ sourceMesh, targetMeshes, soundAssetName: "snap" });

        expect(template.blocks[0]).toMatchObject({
            className: "FlowGraphMeshIntersectionEventBlock",
            inputValues: { sourceMesh, targetMeshes },
        });
        expect(template.blocks[1].inputValues).toEqual({ sound: "snap" });
        expect(template.connections[0]).toMatchObject({ fromPort: "onEnter", toPort: "in" });
    });

    it("adds a sound reaction to a named existing custom event", () => {
        const template = CreateExistingEventReactionTemplate({ eventId: "inspectionComplete", soundAssetName: "success" });

        expect(template.blocks[0]).toMatchObject({
            className: "FlowGraphReceiveCustomEventBlock",
            config: { eventId: "inspectionComplete" },
        });
        expect(template.blocks[1].inputValues).toEqual({ sound: "success" });
    });

    it("can parameterize the existing-event reaction with another event block", () => {
        const template = CreateExistingEventReactionTemplate({
            eventBlockClassName: "FlowGraphMeshIntersectionEventBlock",
            eventOutputPort: "onExit",
            eventConfig: { name: "separation" },
            soundAssetName: "release",
        });

        expect(template.blocks[0]).toMatchObject({
            className: "FlowGraphMeshIntersectionEventBlock",
            config: { name: "separation" },
        });
        expect(template.connections[0]).toMatchObject({ fromPort: "onExit", toPort: "in" });
    });
});
