import { describe, expect, it } from "vitest";

import { getClassNameWithNamespace } from "../../src/copyCommandToClipboard";

describe("getClassNameWithNamespace", () => {
    it("returns Unknown for nullish and primitive inputs", () => {
        expect(getClassNameWithNamespace(null)).toEqual({ className: "Unknown", babylonNamespace: "" });
        expect(getClassNameWithNamespace(undefined)).toEqual({ className: "Unknown", babylonNamespace: "" });
        expect(getClassNameWithNamespace(42)).toEqual({ className: "Unknown", babylonNamespace: "" });
    });

    it("prefers getClassName and falls back to the constructor name", () => {
        expect(getClassNameWithNamespace({ getClassName: () => "BABYLON.CustomType" }).className).toBe("CustomType");
        expect(getClassNameWithNamespace(new (class CustomType {})()).className).toBe("CustomType");
    });
});
