// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.

import { type Nullable } from "core/types";
import { Logger } from "core/Misc/logger";

// Attribution: the WICG HTML-in-Canvas polyfill is `three-html-render` by Palash Bansal (`repalash`),
// MIT. It is consumed as an optional, lazily-imported dependency and is never bundled into Babylon.

/**
 * Shape of the `three-html-render` polyfill module (only the parts this wrapper uses).
 */
export interface IHtmlInCanvasPolyfillModule {
    /** Installs the WICG HTML-in-Canvas polyfill onto the relevant DOM prototypes. */
    installHtmlInCanvasPolyfill?: (options?: { force?: boolean }) => void;
    /** Removes a previously installed polyfill. */
    uninstallHtmlInCanvasPolyfill?: () => void;
}

/**
 * Options for {@link InstallHtmlInCanvasPolyfill}.
 */
export interface IInstallHtmlInCanvasPolyfillOptions {
    /** Install the polyfill even when the browser already supports the API natively (default false). */
    force?: boolean;
    /** Module specifier to lazily import the polyfill from (default `"three-html-render"`). */
    moduleSpecifier?: string;
    /** A pre-imported polyfill module to use instead of dynamically importing one. */
    polyfillModule?: IHtmlInCanvasPolyfillModule;
}

let _InstalledModule: Nullable<IHtmlInCanvasPolyfillModule> = null;

/**
 * Detects whether the browser supports the WICG HTML-in-Canvas API natively (or already has it installed).
 * @returns true when an HTMLCanvasElement exposes `captureElementImage`
 */
export function IsHtmlInCanvasSupportedNatively(): boolean {
    if (typeof document === "undefined") {
        return false;
    }
    const canvas = document.createElement("canvas") as HTMLCanvasElement & { captureElementImage?: unknown };
    return typeof canvas.captureElementImage === "function";
}

/**
 * Lazily installs the WICG HTML-in-Canvas polyfill (`three-html-render`) so that {@link HtmlTexture} and the
 * interaction managers work in browsers that do not yet ship the native API.
 *
 * The polyfill is an optional dependency: it is imported on demand and never bundled into Babylon. When the
 * browser already supports the API natively, this is a no-op unless `force` is set or the `?polyfillHIC` URL
 * flag is present.
 * @param options optional installation configuration
 * @returns a promise that resolves to true when the polyfill was installed, false otherwise
 */
export async function InstallHtmlInCanvasPolyfill(options: IInstallHtmlInCanvasPolyfillOptions = {}): Promise<boolean> {
    const force = options.force ?? _HasPolyfillUrlFlag();

    if (!force && IsHtmlInCanvasSupportedNatively()) {
        return false;
    }

    const module = options.polyfillModule ?? (await _ImportPolyfill(options.moduleSpecifier ?? "three-html-render"));
    if (!module || typeof module.installHtmlInCanvasPolyfill !== "function") {
        Logger.Warn("HTML-in-Canvas: the polyfill module does not expose installHtmlInCanvasPolyfill; nothing was installed.");
        return false;
    }

    module.installHtmlInCanvasPolyfill(force ? { force: true } : undefined);
    _InstalledModule = module;
    return true;
}

/**
 * Removes a polyfill previously installed by {@link InstallHtmlInCanvasPolyfill}.
 */
export function UninstallHtmlInCanvasPolyfill(): void {
    if (_InstalledModule && typeof _InstalledModule.uninstallHtmlInCanvasPolyfill === "function") {
        _InstalledModule.uninstallHtmlInCanvasPolyfill();
    }
    _InstalledModule = null;
}

// Route the optional polyfill import through an indirectly-constructed function. A literal `import()` is
// ES2020 syntax that the UMD `es-check es6` gate rejects, and static bundlers (webpack/vite/rollup) would try
// to resolve the optional `three-html-render` package at build time. Hiding the `import` token inside a
// Function body keeps the UMD bundle es6-compliant and leaves the dependency unbundled, while ESM consumers
// still perform a genuine on-demand dynamic import at runtime. Apps under a strict CSP (no `unsafe-eval`) can
// avoid this path entirely by passing `polyfillModule` to InstallHtmlInCanvasPolyfill.
const _DynamicImport = new Function("specifier", "return import(specifier);") as (specifier: string) => Promise<IHtmlInCanvasPolyfillModule>;

async function _ImportPolyfill(specifier: string): Promise<Nullable<IHtmlInCanvasPolyfillModule>> {
    try {
        return await _DynamicImport(specifier);
    } catch {
        Logger.Warn(`HTML-in-Canvas: could not load polyfill module "${specifier}". Install three-html-render or pass a polyfillModule.`);
        return null;
    }
}

function _HasPolyfillUrlFlag(): boolean {
    return typeof window !== "undefined" && !!window.location && /[?&]polyfillHIC\b/i.test(window.location.search);
}
