/**
 * Monaco Editor web worker setup.
 *
 * webpack's MonacoWebpackPlugin bundled each worker into a single file automatically.
 * For Vite dev mode we use a custom esbuild-backed middleware that bundles each worker
 * into a single IIFE served at /__monaco-worker-{editor,ts}.js — avoiding the
 * 500-1000+ individual monaco-editor/esm/* requests that module workers cause.
 *
 * NOTE: `?worker` imports in Vite DEV mode do NOT bundle — they create module workers
 * that still crawl all ESM dependencies. That is why we use the middleware approach.
 *
 * IMPORTANT: This file must be imported as a side-effect BEFORE any monaco-editor
 * imports so that MonacoEnvironment is set up before Monaco initialises its workers.
 *
 * We use getWorker (not getWorkerUrl) because Monaco passes { type: 'module' } when
 * using getWorkerUrl, but our esbuild-bundled workers are IIFE format (classic scripts).
 */

(self as typeof globalThis).MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
        if (import.meta.env.DEV) {
            // Dev mode: served by the Vite configureServer middleware
            if (label === "typescript" || label === "javascript") {
                return new Worker("/__monaco-worker-ts.js");
            }
            return new Worker("/__monaco-worker-editor.js");
        }
        // Production: pre-built worker files emitted by the Vite build plugin
        if (label === "typescript" || label === "javascript") {
            return new Worker("./ts.worker.js");
        }
        return new Worker("./editor.worker.js");
    },
};
