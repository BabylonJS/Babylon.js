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
});
