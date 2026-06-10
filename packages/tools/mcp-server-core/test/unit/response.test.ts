import { CreateErrorResponse, CreateTextContent, CreateTextResponse, CreateTextResponses } from "../../src/index";

describe("response helpers", () => {
    it("creates a text content block", () => {
        expect(CreateTextContent("hello")).toEqual({ type: "text", text: "hello" });
    });

    it("creates a success text response", () => {
        expect(CreateTextResponse("done")).toEqual({
            content: [{ type: "text", text: "done" }],
        });
    });

    it("creates an error response", () => {
        expect(CreateErrorResponse("bad")).toEqual({
            content: [{ type: "text", text: "bad" }],
            isError: true,
        });
    });

    it("creates multi-block responses", () => {
        expect(CreateTextResponses(["first", "second"])).toEqual({
            content: [
                { type: "text", text: "first" },
                { type: "text", text: "second" },
            ],
        });
    });
});
