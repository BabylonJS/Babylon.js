import { EventEmitter } from "node:events";
import { type ClientRequest, type IncomingMessage, type RequestOptions } from "node:http";
import { afterEach, describe, expect, it, vi } from "vitest";

const https = require("node:https") as typeof import("node:https");
const { parseExistingId, saveSnippet } = require("../../../../../.github/scripts/visual-testing/save-snippet.js") as {
    parseExistingId: (args: string[]) => string | undefined;
    saveSnippet: (code: string, codeFile: string, name?: string, description?: string, tags?: string, existingId?: string) => Promise<{
        id: string;
        version: number;
    }>;
};

function mockSnippetResponse(result: { id: string; version: number }) {
    let requestBody = "";
    const requestSpy = vi.spyOn(https, "request").mockImplementation(
        ((options: RequestOptions, callback: (response: IncomingMessage) => void) => {
            const request = new EventEmitter() as EventEmitter & {
                write: (data: string) => boolean;
                end: () => void;
            };
            request.write = vi.fn((data: string) => {
                requestBody = data;
                return true;
            });
            request.end = vi.fn(() => {
                const response = new EventEmitter() as EventEmitter & { statusCode: number };
                response.statusCode = 200;
                callback(response as IncomingMessage);
                response.emit("data", JSON.stringify(result));
                response.emit("end");
            });
            return request as unknown as ClientRequest;
        }) as typeof https.request
    );

    return {
        requestSpy,
        getRequestBody: () => requestBody,
    };
}

afterEach(() => {
    vi.restoreAllMocks();
});

describe("save-snippet helper", () => {
    it("canonicalizes a lowercase existing ID before posting and validating the response", async () => {
        const args = ["snippet.ts", "--id", "#pvk3rv#2"];
        const existingId = parseExistingId(args);
        const { requestSpy } = mockSnippetResponse({ id: "PVK3RV", version: 3 });
        vi.spyOn(console, "log").mockImplementation(() => {});

        await expect(saveSnippet("const value = 1;", "snippet.ts", "Test", "", "", existingId)).resolves.toEqual({ id: "PVK3RV", version: 3 });

        expect(existingId).toBe("PVK3RV");
        expect(args).toEqual(["snippet.ts"]);
        expect(requestSpy.mock.calls[0][0]).toMatchObject({ path: "/PVK3RV", method: "POST" });
    });

    it("preserves an uppercase existing ID", async () => {
        const args = ["snippet.js", "--id", "PVK3RV"];
        const existingId = parseExistingId(args);
        const { requestSpy } = mockSnippetResponse({ id: "PVK3RV", version: 4 });
        vi.spyOn(console, "log").mockImplementation(() => {});

        await saveSnippet("const value = 1;", "snippet.js", "Test", "", "", existingId);

        expect(existingId).toBe("PVK3RV");
        expect(requestSpy.mock.calls[0][0]).toMatchObject({ path: "/PVK3RV", method: "POST" });
    });

    it("uses the collection endpoint and metadata defaults when creating a new snippet", async () => {
        const args = ["snippet.js"];
        const existingId = parseExistingId(args);
        const { requestSpy, getRequestBody } = mockSnippetResponse({ id: "NEW123", version: 0 });
        vi.spyOn(console, "log").mockImplementation(() => {});

        await saveSnippet("const value = 1;", "snippet.js", undefined, undefined, undefined, existingId);

        expect(existingId).toBeUndefined();
        expect(args).toEqual(["snippet.js"]);
        expect(requestSpy.mock.calls[0][0]).toMatchObject({ path: "/", method: "POST" });
        expect(JSON.parse(getRequestBody())).toMatchObject({
            name: "Visual Test",
            description: "",
            tags: "",
        });
    });

    it.each([
        {
            label: "missing",
            args: ["snippet.js", "--id"],
            message: "--id requires a snippet ID or playgroundId",
        },
        {
            label: "malformed",
            args: ["snippet.js", "--id", "#BAD-ID#0"],
            message: "--id requires a snippet ID or playgroundId",
        },
        {
            label: "duplicate",
            args: ["snippet.js", "--id", "ABC123", "--id", "ABC123"],
            message: "--id can only be specified once",
        },
    ])("rejects a $label ID argument", ({ args, message }) => {
        expect(() => parseExistingId(args)).toThrow(message);
    });
});
