import { describe, expect, it } from "vitest";
import { ResolveAssetIdentifier } from "loaders/USD/resolution/assetPath";

describe("USD asset path resolution", () => {
    it("preserves URL scheme and authority when resolving relative assets", () => {
        expect(ResolveAssetIdentifier("../textures/albedo.png", "https://example.com/models/scenes/root.usda")).toBe("https://example.com/models/textures/albedo.png");
    });

    it("resolves root-relative URL assets against the URL authority", () => {
        expect(ResolveAssetIdentifier("/shared/material.usda", "https://example.com/models/root.usda")).toBe("https://example.com/shared/material.usda");
    });

    it("preserves data URIs without path normalization", () => {
        const uri = "data:application/octet-stream;base64,AA//BB==";
        expect(ResolveAssetIdentifier(uri, "https://example.com/models/root.usda")).toBe(uri);
    });
});
