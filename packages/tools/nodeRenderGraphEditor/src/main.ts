/**
 * Vite dev server entry point for the Node Render Graph Editor.
 *
 * Uses dynamic import so the editor module graph loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./nodeRenderGraphEditor"))["NodeRenderGraphEditor"]["Show"]>;

async function StartEditor(args: ShowArgs) {
    const { NodeRenderGraphEditor } = await import("./nodeRenderGraphEditor");
    NodeRenderGraphEditor.Show(...args);
}

const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__viteNodeRenderGraphEditorArgs"])) {
    void StartEditor(Win["__viteNodeRenderGraphEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonNodeRenderGraphEditorReady",
        (e: Event) => {
            void StartEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
