/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, afterEach } from "vitest";

import { InstallHtmlInCanvasPolyfill, UninstallHtmlInCanvasPolyfill, IsHtmlInCanvasSupportedNatively } from "core/Materials/Textures/HTML/htmlInCanvasPolyfill";

afterEach(() => {
    // Remove any native-support stub added by individual tests.
    delete (HTMLCanvasElement.prototype as any).captureElementImage;
});

describe("IsHtmlInCanvasSupportedNatively", () => {
    it("returns false when the canvas does not expose captureElementImage", () => {
        expect(IsHtmlInCanvasSupportedNatively()).toBe(false);
    });

    it("returns true when the canvas exposes captureElementImage", () => {
        (HTMLCanvasElement.prototype as any).captureElementImage = () => {};
        expect(IsHtmlInCanvasSupportedNatively()).toBe(true);
    });
});

describe("InstallHtmlInCanvasPolyfill", () => {
    it("installs an injected polyfill module when native support is absent", async () => {
        const install = vi.fn();
        const installed = await InstallHtmlInCanvasPolyfill({ polyfillModule: { installHtmlInCanvasPolyfill: install } });

        expect(installed).toBe(true);
        expect(install).toHaveBeenCalledTimes(1);
        expect(install).toHaveBeenCalledWith(undefined);
    });

    it("is a no-op when the API is supported natively and force is not set", async () => {
        (HTMLCanvasElement.prototype as any).captureElementImage = () => {};
        const install = vi.fn();

        const installed = await InstallHtmlInCanvasPolyfill({ polyfillModule: { installHtmlInCanvasPolyfill: install } });

        expect(installed).toBe(false);
        expect(install).not.toHaveBeenCalled();
    });

    it("installs with force even when the API is supported natively", async () => {
        (HTMLCanvasElement.prototype as any).captureElementImage = () => {};
        const install = vi.fn();

        const installed = await InstallHtmlInCanvasPolyfill({ force: true, polyfillModule: { installHtmlInCanvasPolyfill: install } });

        expect(installed).toBe(true);
        expect(install).toHaveBeenCalledWith({ force: true });
    });

    it("returns false when the module does not expose an installer", async () => {
        const installed = await InstallHtmlInCanvasPolyfill({ polyfillModule: {} });
        expect(installed).toBe(false);
    });
});

describe("UninstallHtmlInCanvasPolyfill", () => {
    it("calls the installed module's uninstaller", async () => {
        const uninstall = vi.fn();
        await InstallHtmlInCanvasPolyfill({ polyfillModule: { installHtmlInCanvasPolyfill: vi.fn(), uninstallHtmlInCanvasPolyfill: uninstall } });

        UninstallHtmlInCanvasPolyfill();

        expect(uninstall).toHaveBeenCalledTimes(1);
    });

    it("does nothing when no polyfill is installed", () => {
        expect(() => UninstallHtmlInCanvasPolyfill()).not.toThrow();
    });
});
