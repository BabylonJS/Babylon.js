/**
 * Vite dev server entry point for the Node Material Editor.
 *
 * Architecture mirrors the playground:
 * - public/index.js loads babylon from babylonServer (port 1337) as UMD bundles,
 *   creates a NodeMaterial, and calls BABYLON.NodeEditor.Show(hostElement, …).
 * - The Vite middleware shim at /babylon.nodeEditor.js captures those args and
 *   fires a "babylonNodeEditorReady" CustomEvent.
 * - This module listens for that event and THEN dynamically imports the editor.
 *
 * The dynamic import is critical: all `import { X } from "core/…"` in the editor
 * source are rewritten by babylonDevExternalsPlugin to `const { X } = window.BABYLON ?? {}`.
 * Those bindings must be evaluated AFTER window.BABYLON is populated by the CDN
 * loader, otherwise they capture undefined. Dynamic import defers the module graph
 * evaluation until after the event fires (i.e. after BABYLON is ready).
 */
type ShowArgs = Parameters<(typeof import("./nodeEditor"))["NodeEditor"]["Show"]>;

async function StartEditor(args: ShowArgs) {
    const { NodeEditor } = await import("./nodeEditor");
    NodeEditor.Show(...args);
}

const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__viteNodeEditorArgs"])) {
    void StartEditor(Win["__viteNodeEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonNodeEditorReady",
        (e: Event) => {
            void StartEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
