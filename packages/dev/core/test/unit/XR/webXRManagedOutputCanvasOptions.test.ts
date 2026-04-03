/**
 * @vitest-environment jsdom
 */

import { NullEngine } from "core/Engines";
import { WebXRManagedOutputCanvasOptions } from "core/XR/webXRManagedOutputCanvas";
import { describe, it, expect } from "vitest";

describe("WebXRManagedOutputCanvasOptions", () => {
    describe("GetDefaults", () => {
        it("returns a valid options object without an engine", () => {
            const defaults = WebXRManagedOutputCanvasOptions.GetDefaults();

            expect(defaults).toBeInstanceOf(WebXRManagedOutputCanvasOptions);
            expect(defaults.canvasOptions).toBeDefined();
            expect(defaults.newCanvasCssStyle).toBeDefined();
        });

        it("has correct default canvas options", () => {
            const defaults = WebXRManagedOutputCanvasOptions.GetDefaults();

            expect(defaults.canvasOptions!.antialias).toBe(true);
            expect(defaults.canvasOptions!.depth).toBe(true);
            expect(defaults.canvasOptions!.alpha).toBe(true);
            expect(defaults.canvasOptions!.framebufferScaleFactor).toBe(1);
        });

        it("uses engine stencil setting when provided", () => {
            const engine = new NullEngine({
                renderHeight: 256,
                renderWidth: 256,
                textureSize: 256,
                deterministicLockstep: false,
                lockstepMaxSteps: 1,
            });

            const defaults = WebXRManagedOutputCanvasOptions.GetDefaults(engine);

            // NullEngine reports isStencilEnable based on its internal state
            expect(defaults.canvasOptions!.stencil).toBe(engine.isStencilEnable);

            engine.dispose();
        });

        it("defaults stencil to true when no engine provided", () => {
            const defaults = WebXRManagedOutputCanvasOptions.GetDefaults();

            expect(defaults.canvasOptions!.stencil).toBe(true);
        });

        it("has CSS style for positioning", () => {
            const defaults = WebXRManagedOutputCanvasOptions.GetDefaults();

            expect(defaults.newCanvasCssStyle).toContain("position:absolute");
            expect(defaults.newCanvasCssStyle).toContain("z-index:10");
        });
    });
});
