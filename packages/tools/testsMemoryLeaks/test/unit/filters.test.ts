import { CreateBabylonLeakFilter } from "../../src/filters";

describe("createBabylonLeakFilter", () => {
    it("filters known noisy nodes", () => {
        const filter = CreateBabylonLeakFilter();

        expect(
            filter(
                {
                    name: "FontAwesomeConfig",
                    retainedSize: 90000,
                    type: "object",
                } as any,
                {} as any,
                new Set<number>()
            )
        ).toBe(false);
    });

    it("filters nodes below the retained size threshold", () => {
        const filter = CreateBabylonLeakFilter({ minRetainedSize: 50000 });

        expect(
            filter(
                {
                    name: "InterestingNode",
                    retainedSize: 49999,
                    type: "object",
                } as any,
                {} as any,
                new Set<number>()
            )
        ).toBe(false);
    });

    it("keeps large user objects that are not part of the ignore lists", () => {
        const filter = CreateBabylonLeakFilter();

        expect(
            filter(
                {
                    name: "RetainedTextureCache",
                    retainedSize: 120000,
                    type: "object",
                    pathEdge: { type: "property" },
                } as any,
                {} as any,
                new Set<number>()
            )
        ).toBe(true);
    });
});
