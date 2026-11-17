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
