/**
 * Vite dev server entry point for the GUI Editor.
 *
 * Uses dynamic import so the editor module graph (which contains
 * `const { X } = window.BABYLON ?? {}` bindings) loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./guiEditor"))["GUIEditor"]["Show"]>;

async function StartEditor(args: ShowArgs) {
    const { GUIEditor } = await import("./guiEditor");
    void GUIEditor.Show(...args);
}

const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__viteGuiEditorArgs"])) {
    void StartEditor(Win["__viteGuiEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonGuiEditorReady",
        (e: Event) => {
            void StartEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
