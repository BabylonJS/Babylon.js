import { IsInputProvided, RequireAtLeastOneInput, ResolveDefinedInput } from "../../src/index";

describe("input validation helpers", () => {
    it("treats undefined, null, and empty strings as missing", () => {
        expect(IsInputProvided(undefined)).toBe(false);
        expect(IsInputProvided(null)).toBe(false);
        expect(IsInputProvided("")).toBe(false);
        expect(IsInputProvided("value")).toBe(true);
        expect(IsInputProvided(0)).toBe(true);
    });

    it("requires at least one present input", () => {
        expect(() =>
            RequireAtLeastOneInput({
                candidates: [
                    { label: "type", value: undefined },
                    { label: "cameraType", value: "" },
                ],
            })
        ).toThrow("Error: Either type or cameraType must be provided.");
    });

    it("allows a custom missing message", () => {
        expect(() =>
            RequireAtLeastOneInput({
                candidates: [{ label: "nmeJson", value: undefined }],
                missingMessage: "Error: NodeMaterial requires at least one source.",
            })
        ).toThrow("Error: NodeMaterial requires at least one source.");
    });

    it("resolves the first present alias value", () => {
        const resolved = ResolveDefinedInput({
            candidates: [
                { label: "graphName", value: undefined },
                { label: "name", value: "mainGraph" },
            ],
        });

        expect(resolved).toBe("mainGraph");
    });

    it("supports a custom presence predicate", () => {
        const resolved = ResolveDefinedInput<number>({
            candidates: [
                { label: "bodyType", value: 0 },
                { label: "type", value: 2 },
            ],
            isPresent: (value) => value !== undefined && value !== null,
        });

        expect(resolved).toBe(0);
    });
});
