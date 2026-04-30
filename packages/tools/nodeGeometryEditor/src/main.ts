/**
 * Vite dev server entry point for the Node Geometry Editor.
 *
 * Uses dynamic import so the editor module graph loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./nodeGeometryEditor"))["NodeGeometryEditor"]["Show"]>;

async function StartEditor(args: ShowArgs) {
    const { NodeGeometryEditor } = await import("./nodeGeometryEditor");
    NodeGeometryEditor.Show(...args);
}

const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__viteNodeGeometryEditorArgs"])) {
    void StartEditor(Win["__viteNodeGeometryEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonNodeGeometryEditorReady",
        (e: Event) => {
            void StartEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
