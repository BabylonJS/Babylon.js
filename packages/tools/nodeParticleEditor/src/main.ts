/**
 * Vite dev server entry point for the Node Particle Editor.
 *
 * Uses dynamic import so the editor module graph loads only after
 * the CDN bootstrap has set window.BABYLON.
 */
type ShowArgs = Parameters<(typeof import("./nodeParticleEditor"))["NodeParticleEditor"]["Show"]>;

async function StartEditor(args: ShowArgs) {
    const { NodeParticleEditor } = await import("./nodeParticleEditor");
    NodeParticleEditor.Show(...args);
}

const Win = window as unknown as Record<string, unknown>;
if (Array.isArray(Win["__viteNodeParticleEditorArgs"])) {
    void StartEditor(Win["__viteNodeParticleEditorArgs"] as ShowArgs);
} else {
    window.addEventListener(
        "babylonNodeParticleEditorReady",
        (e: Event) => {
            void StartEditor((e as CustomEvent<{ args: ShowArgs }>).detail.args);
        },
        { once: true }
    );
}
