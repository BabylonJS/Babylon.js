import { ParseJsonText } from "../../src/index";

describe("json validation helpers", () => {
    it("parses valid JSON text", () => {
        const parsed = ParseJsonText<{ enabled: boolean }>({
            jsonText: '{"enabled":true}',
            jsonLabel: "test JSON",
        });

        expect(parsed).toEqual({ enabled: true });
    });

    it("throws a consistent parse error by default", () => {
        expect(() =>
            ParseJsonText({
                jsonText: "not-json",
                jsonLabel: "GUI JSON",
            })
        ).toThrow("Invalid GUI JSON: parse error.");
    });

    it("includes an input preview when requested", () => {
        expect(() =>
            ParseJsonText({
                jsonText: "{bad json payload}",
                jsonLabel: "GUI JSON",
                includePreviewInError: true,
                previewLength: 8,
            })
        ).toThrow("Invalid GUI JSON: {bad jso...");
    });

    it("preserves the original parse error as the cause", () => {
        try {
            ParseJsonText({
                jsonText: "nope",
                jsonLabel: "GUI JSON",
            });
            fail("Expected ParseJsonText to throw.");
        } catch (error) {
            expect((error as Error).cause).toBeInstanceOf(Error);
        }
    });
});
