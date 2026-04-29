/**
 * Vite entry point for the Babylon.js Playground.
 *
 * Architecture: this file is the Vite-served ES module counterpart to the
 * webpack-built babylon.playground.js UMD bundle. It does NOT import Babylon
 * directly — Babylon (babylon.js, loaders, inspector, etc.) is loaded as
 * pre-built UMD bundles from the CDN (or babylonServer on localhost:1337).
 * public/index.js handles that bootstrap.
 *
 * IMPORTANT: Playground source files import from `@dev/core` / `core/…` which
 * the `babylonDevExternalsPlugin` rewrites to `globalThis.BABYLON` accesses.
 * These top-level destructurings execute at module-evaluation time.  Because
 * this file is a `<script type="module">` (deferred), it evaluates after
 * document parsing — but BEFORE the dynamically-created CDN `<script>` tags
 * from index.js finish loading.  So `globalThis.BABYLON` may not exist yet.
 *
 * Solution: keep the static import of monacoWorkerSetup (no BABYLON deps),
 * but defer the import of ./playground (which transitively touches BABYLON)
 * behind a Promise that resolves once CDN scripts are loaded.
 */
import "./monacoWorkerSetup";

void (async () => {
    // Wait for CDN scripts to populate globalThis.BABYLON.
    // In dev mode BABYLON usually loads fast enough, but in production builds
    // the bundled ES module can evaluate before the dynamic CDN scripts finish.
    if (!(globalThis as Record<string, unknown>).BABYLON) {
        await new Promise<void>((resolve) => {
            // The CDN bootstrap (index.js) fires this event after all scripts load
            // and babylon.playground.js registers the Show() shim.
            window.addEventListener("babylonPlaygroundReady", () => resolve(), { once: true });
        });
    }

    // Now globalThis.BABYLON is available — safe to import playground code whose
    // modules destructure BABYLON globals at the top level.
    const { Playground } = await import("./playground");
    type ShowArgs = Parameters<typeof Playground.Show>;

    function startPlayground(args: ShowArgs) {
        Playground.Show(...args);
    }

    // The CDN bootstrap (public/index.js) calls BABYLON.Playground.Show after
    // loading all babylon bundles. The /babylon.playground.js shim captures those
    // args in window.__vitePlaygroundArgs and dispatches "babylonPlaygroundReady".
    const win = window as unknown as Record<string, unknown>;
    if (Array.isArray(win["__vitePlaygroundArgs"])) {
        startPlayground(win["__vitePlaygroundArgs"] as ShowArgs);
    } else {
        window.addEventListener(
            "babylonPlaygroundReady",
            (e: Event) => {
                startPlayground((e as CustomEvent<{ args: ShowArgs }>).detail.args);
            },
            { once: true }
        );
    }
})();
