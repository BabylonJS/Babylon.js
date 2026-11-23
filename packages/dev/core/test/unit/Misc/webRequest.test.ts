import { WebRequest } from "core/Misc/webRequest";
import { afterEach, describe, expect, it } from "vitest";

describe("WebRequest customizations", () => {
    afterEach(() => {
        WebRequest.CustomRequestHeaders = {};
        WebRequest.CustomRequestModifiers.length = 0;
        WebRequest.SkipRequestModificationForBabylonCDN = true;
    });

    it("skips exact Babylon.js CDN hosts but not lookalike hosts", () => {
        WebRequest.CustomRequestHeaders.Authorization = "test";

        expect(WebRequest._CollectCustomizations("https://cdn.babylonjs.com/file.bin").headers).toEqual({});
        expect(WebRequest._CollectCustomizations("https://preview.babylonjs.com/file.bin").headers).toEqual({});
        expect(WebRequest._CollectCustomizations("https://cdn.babylonjs.com.example.com/file.bin").headers).toEqual({ Authorization: "test" });
        expect(WebRequest._CollectCustomizations("https://example.com/cdn.babylonjs.com/file.bin").headers).toEqual({ Authorization: "test" });
    });

    it.each([
        ["with", false],
        ["without", true],
    ])("applies the request URL normalization %s a URL constructor", (_label, useShim) => {
        WebRequest.CustomRequestHeaders.Authorization = "test";
        const originalUrl = globalThis.URL;
        if (useShim) {
            (globalThis as any).URL = { createObjectURL: () => "", revokeObjectURL: () => {} };
        }
        try {
            expect(WebRequest._CollectCustomizations(" https://cdn.babylonjs.com/file.bin ").headers).toEqual({});
            expect(WebRequest._CollectCustomizations("\u0001https://cdn.babylon\tjs.com/file.bin").headers).toEqual({});
            expect(WebRequest._CollectCustomizations("https://preview.babylon\njs.com\r/file.bin").headers).toEqual({});
            expect(WebRequest._CollectCustomizations(" https://cdn.babylonjs.com.example.com/file.bin").headers).toEqual({ Authorization: "test" });
        } finally {
            globalThis.URL = originalUrl;
        }
    });

    it("matches CDN hosts without a URL constructor and through the file: wrapper", () => {
        WebRequest.CustomRequestHeaders.Authorization = "test";
        const originalUrl = globalThis.URL;
        (globalThis as any).URL = { createObjectURL: () => "", revokeObjectURL: () => {} };
        try {
            expect(WebRequest._CollectCustomizations("https://cdn.babylonjs.com/file.bin").headers).toEqual({});
            expect(WebRequest._CollectCustomizations("file:https://CDN.babylonjs.com:443/file.bin").headers).toEqual({});
            expect(WebRequest._CollectCustomizations("//preview.babylonjs.com/file.bin").headers).toEqual({});
            expect(WebRequest._CollectCustomizations("https://user@example.com/cdn.babylonjs.com").headers).toEqual({ Authorization: "test" });
            expect(WebRequest._CollectCustomizations("https://cdn.babylonjs.com@example.com/file.bin").headers).toEqual({ Authorization: "test" });
            expect(WebRequest._CollectCustomizations("scenes/cdn.babylonjs.com.glb").headers).toEqual({ Authorization: "test" });
        } finally {
            globalThis.URL = originalUrl;
        }
    });
});
