import { describe, expect, it } from "vitest";

import { GetClass } from "core/Misc/typeStore";

/**
 * Tree-shaking guard for the gui package.
 *
 * Validates the two halves of the side-effect split introduced by the
 * pure-architecture migration:
 *  - Back-compat: importing the side-effect wrapper still auto-registers the
 *    control with the type store (legacy full-package side-effect import).
 *  - Purity: importing the `.pure` implementation performs no registration, so
 *    unused controls can be tree-shaken; the registration only happens when the
 *    explicit `Register*` opt-in is called.
 */
describe("gui tree-shaking side effects", () => {
    it("does not register the control when importing the pure module (opt-in only)", async () => {
        expect(GetClass("BABYLON.GUI.Button")).toBeUndefined();

        const pure = await import("gui/2D/controls/button.pure");
        expect(GetClass("BABYLON.GUI.Button")).toBeUndefined();

        pure.RegisterButton();
        expect(GetClass("BABYLON.GUI.Button")).toBe(pure.Button);
    });

    it("auto-registers the control when importing the side-effect wrapper (back-compat)", async () => {
        expect(GetClass("BABYLON.GUI.Checkbox")).toBeUndefined();

        const wrapper = await import("gui/2D/controls/checkbox");
        expect(GetClass("BABYLON.GUI.Checkbox")).toBe(wrapper.Checkbox);
    });
});
