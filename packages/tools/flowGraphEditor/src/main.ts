/**
 * Vite dev server entry point for the Flow Graph Editor.
 *
 * Uses dynamic import so the editor module graph loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./flowGraphEditor"))["FlowGraphEditor"]["Show"]>;

async function StartEditor(args: ShowArgs) {
    const { FlowGraphEditor } = await import("./flowGraphEditor");
    FlowGraphEditor.Show(...args);
}

const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__viteFlowGraphEditorArgs"])) {
    void StartEditor(Win["__viteFlowGraphEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonFlowGraphEditorReady",
        (e: Event) => {
            void StartEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
