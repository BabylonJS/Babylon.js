// Production shim for babylon.playground.js
//
// Architecture: public/index.js (CDN bootstrap) loads all Babylon bundles from
// CDN (or snapshot), then fetches this file and calls BABYLON.Playground.Show().
//
// In Vite dev mode this file is served by the playground-dev-shims middleware.
// In production this static file is served from the dist/ directory.
//
// This shim captures the Show() call and relays it to main.ts (already loaded
// as a <script type="module">) via a CustomEvent. main.ts handles both orderings:
// if it runs before the event fires it adds a listener; if it runs after it reads
// window.__vitePlaygroundArgs directly.
(function () {
    var BABYLON = window.BABYLON;
    if (!BABYLON) {
        return;
    }
    BABYLON.Playground = {
        Show: function (hostElement, mode, version, bundles) {
            var args = [hostElement, mode, version, bundles];
            window.__vitePlaygroundArgs = args;
            window.dispatchEvent(new CustomEvent("babylonPlaygroundReady", { detail: { args: args } }));
        },
    };
})();
