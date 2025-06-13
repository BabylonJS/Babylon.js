import { logCommands, type SmartFilterDeserializer, type SmartFilter } from "@babylonjs/smart-filters";
import {
    editorBlockRegistrations,
    getBlockEditorRegistration,
    SmartFilterEditorControl,
} from "@babylonjs/smart-filters-editor-control";
import { texturePresets } from "../configuration/texturePresets";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import type { SmartFilterRenderer } from "../smartFilterRenderer";
import { builtInBlockRegistrations } from "@babylonjs/smart-filters-blocks";

/**
 * Launches the editor - in a separate file so it can be dynamically imported
 * @param currentSmartFilter - The smart filter to edit
 * @param engine - The engine to use
 * @param renderer - The renderer to use
 */
export function launchEditor(
    currentSmartFilter: SmartFilter,
    engine: ThinEngine,
    renderer: SmartFilterRenderer,
    errorHandler: (message: string) => void,
    closeError: () => void,
    smartFilterDeserializer: SmartFilterDeserializer
) {
    if (!currentSmartFilter) {
        return;
    }

    // Set up block registration
    const allBlockRegistrations = [...editorBlockRegistrations, ...builtInBlockRegistrations];
    const blockRegistration = getBlockEditorRegistration(smartFilterDeserializer, allBlockRegistrations, false);

    // Function to rebuild the runtime
    function rebuildRuntime() {
        renderer
            .rebuildRuntime()
            .then(closeError)
            .catch((err: unknown) => {
                errorHandler(`Could not start rendering\n${err}`);
            });
    }

    // Display the editor
    SmartFilterEditorControl.Show({
        engine,
        blockEditorRegistration: blockRegistration,
        filter: currentSmartFilter,
        rebuildRuntime,
        reloadAssets: () => {
            renderer.reloadAssets().catch((err: unknown) => {
                errorHandler(`Could not reload assets:\n${err}`);
            });
        },
        texturePresets,
        beforeRenderObservable: renderer.beforeRenderObservable,
    });

    if (renderer.runtime) {
        // Display debug info in the console
        logCommands(renderer.runtime.commandBuffer);
    }
}
