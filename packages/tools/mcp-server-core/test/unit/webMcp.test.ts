import { AssertWebMcpMutationAllowed, IsWebMcpSupported, RegisterWebMcpToolsAsync, type IWebMcpTool } from "../../src/webMcp";

describe("WebMCP helpers", () => {
    it("detects and registers the imperative WebMCP API", async () => {
        const registrations: Array<{ tool: IWebMcpTool; signal?: AbortSignal }> = [];
        const document = {
            modelContext: {
                registerTool: async (tool: IWebMcpTool, options?: { signal?: AbortSignal }) => {
                    registrations.push({ tool, signal: options?.signal });
                },
            },
        } as unknown as Document;
        const controller = new AbortController();
        const tool: IWebMcpTool = {
            name: "read",
            description: "Read the current value.",
            execute: () => ({ value: 1 }),
        };

        expect(IsWebMcpSupported(document)).toBe(true);
        await expect(RegisterWebMcpToolsAsync(document, [tool], controller.signal)).resolves.toBe(true);
        expect(registrations).toEqual([{ tool, signal: controller.signal }]);
    });

    it("reports unsupported documents without registering tools", async () => {
        const document = {} as Document;
        const controller = new AbortController();

        expect(IsWebMcpSupported(document)).toBe(false);
        await expect(RegisterWebMcpToolsAsync(document, [], controller.signal)).resolves.toBe(false);
    });

    it("blocks WebMCP mutations only while a legacy session is connected", () => {
        expect(() => AssertWebMcpMutationAllowed(false)).not.toThrow();
        expect(() => AssertWebMcpMutationAllowed(true)).toThrow("connected to a legacy MCP session");
    });
});
