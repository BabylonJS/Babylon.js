import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import * as react from "react";
import * as reactDOM from "react-dom";
import { GlobalState, type TexturePreset } from "./globalState.js";
import { GraphEditor } from "./graphEditor.js";
import { RegisterToDisplayManagers } from "./graphSystem/registerToDisplayLedger.js";
import { RegisterToPropertyTabManagers } from "./graphSystem/registerToPropertyLedger.js";
import { RegisterTypeLedger } from "./graphSystem/registerToTypeLedger.js";
import type { SmartFilter } from "@babylonjs/smart-filters";
import type { Nullable } from "@babylonjs/core/types.js";
import type { Observable } from "@babylonjs/core/Misc/observable.js";
import { CreatePopup } from "@babylonjs/shared-ui-components/popupHelper.js";
import type { IBlockRegistration } from "@babylonjs/smart-filters-blocks";
import type { LogEntry } from "./components/log/logComponent.js";
import type { BlockEditorRegistration } from "./configuration/blockEditorRegistration.js";
import type { ObservableProperty } from "./helpers/observableProperty.js";

/**
 * Options to configure the Smart Filter Editor
 */
export type SmartFilterEditorOptions = {
    /**
     * The ThinEngine to use if the host is controlling the engine.
     * If this is not supplied, the editor will draw a preview and support a popup window,
     * and will expect onNewEngine and onSmartFilterLoadedObservable to be supplied.
     */
    engine?: ThinEngine;

    /**
     * If supplied, the editor will host the preview, and this will be called when the editor creates a new engine connected
     * to that canvas, or a preview popup window is opened or closed.
     * @param engine - The new engine
     */
    onNewEngine?: (engine: ThinEngine) => void;

    /**
     * If supplied, the editor will subscribe to this observable to be notified when a new Smart Filter should be displayed
     */
    onSmartFilterLoadedObservable?: Observable<SmartFilter>;

    /**
     * If supplied, the editor will display a toggle to enable or disable the optimizer, and update this property when it changes.
     */
    optimizerEnabled?: ObservableProperty<boolean>;

    /**
     * A BlockEditorRegistration object which is responsible for providing the information
     * required for the Editor to be able to display and work with the Smart Filter
     * blocks the application uses. Note that each application may have its own set
     * of blocks, so this information must be passed in and not baked into the editor.
     * If not supplied, the editor will not allow the user to add blocks.
     */
    blockEditorRegistration?: BlockEditorRegistration;

    /**
     * The Smart Filter to edit
     */
    filter?: SmartFilter;

    /**
     * The host element to draw the editor in. If undefined, a popup window will be used.
     */
    hostElement?: HTMLElement;

    /**
     * A callback that is responsible for doing the work of initiating a download of the
     * serialized version of the Smart Filter. If not supplied, the save button will not appear
     * in the editor.
     */
    downloadSmartFilter?: () => void;

    /**
     * A callback that is responsible for loading a serialized Smart Filter from the provided file,
     * and should then call SmartFilterEditor.Show with the loaded Smart Filter. If not supplied,
     * the load button will not appear in the editor.
     */
    loadSmartFilter?: (file: File, engine: ThinEngine) => Promise<Nullable<SmartFilter>> /**
     * A callback that is responsible for copying a serialized version of the Smart Filter to
     * the clipboard. If not supplied, the copy button will not appear in the editor.
     */;
    copySmartFilter?: () => void;

    /**
     * A callback that is responsible for pasting a serialized Smart Filter from the clipboard.
     * If not supplied, the paste button will not appear in the editor.
     */
    pasteSmartFilter?: () => Promise<Nullable<SmartFilter>>;

    /**
     * An optional callback to save the current Smart Filter to the snippet server.
     * If not supplied, the button will not appear in the editor.
     */
    saveToSnippetServer?: () => void;

    /**
     * An optional array of texture presets to display in the editor.
     */
    texturePresets?: TexturePreset[];

    /**
     * An observable that is called before rendering the filter every frame.
     * Required if the editor is going to load video textures or animate time blocks.
     */
    beforeRenderObservable?: Observable<void>;

    /**
     * Called when the editor determines that the graph has changed and the runtime needs to be rebuilt.
     * If not supplied, the editor will not be able to rebuild the runtime, and will not allow changes to the
     * structure of the smart filter.
     */
    rebuildRuntime?: () => void;

    /**
     * Called when the editor determines that the assets (images or videos) need to be reloaded.
     */
    reloadAssets?: () => void;

    /**
     * If supplied, the editor will call this function when the user tries to add a custom block
     * @param serializedData - The serialized data of the custom block
     */
    addCustomBlock?: (serializedData: string) => void;

    /**
     * If supplied, the editor will call this function when the user tries to delete a custom block
     * @param blockEditorRegistration - The block editor registration of the custom block to delete
     */
    deleteCustomBlock?: (blockRegistration: IBlockRegistration) => void;

    /**
     * An observable that is called when the editor needs to log a message
     */
    onLogRequiredObservable?: Observable<LogEntry>;

    /**
     * An observable that is called when the editor needs to save editorData to the current Smart Filter
     */
    onSaveEditorDataRequiredObservable?: Observable<void>;
};

/**
 * Class used to create the Smart Filter Editor control
 */
export class SmartFilterEditorControl {
    private static _CurrentState: GlobalState;
    private static _PopupWindow: Window | null;

    /**
     * Show the node editor
     * @param options - defines the options to use to configure the node editor
     */
    public static Show(options: SmartFilterEditorOptions) {
        if (this._CurrentState) {
            if (this._PopupWindow) {
                this._PopupWindow.close();
            }
        }

        // Initial setup
        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = CreatePopup("BABYLON.JS SMART FILTER EDITOR", {
                onWindowCreateCallback: (w) => (this._PopupWindow = w),
                width: 1500,
                height: 800,
            })!;
        }

        const globalState = new GlobalState(
            options.engine ?? null,
            options.onNewEngine ?? null,
            options.onSmartFilterLoadedObservable ?? null,
            options.optimizerEnabled ?? null,
            options.filter ?? null,
            options.blockEditorRegistration ?? null,
            hostElement,
            options.beforeRenderObservable ?? null,
            options.rebuildRuntime ?? null,
            options.reloadAssets ?? null,
            options.texturePresets ?? null,
            options.downloadSmartFilter,
            options.loadSmartFilter,
            options.copySmartFilter,
            options.pasteSmartFilter,
            options.saveToSnippetServer,
            options.addCustomBlock,
            options.deleteCustomBlock,
            options.onLogRequiredObservable,
            options.onSaveEditorDataRequiredObservable
        );

        RegisterToDisplayManagers(globalState);
        RegisterToPropertyTabManagers();
        RegisterTypeLedger();

        const graphEditor = react.createElement(GraphEditor, {
            globalState: globalState,
        });

        reactDOM.render(graphEditor, hostElement);

        this._CurrentState = globalState;

        globalState.hostWindow.addEventListener("beforeunload", () => {
            globalState.onPopupClosedObservable.notifyObservers();
        });

        // Close the popup window when the page is refreshed or scene is disposed
        if (globalState.smartFilter && options.engine && this._PopupWindow) {
            options.engine.onDisposeObservable.addOnce(() => {
                if (this._PopupWindow) {
                    this._PopupWindow.close();
                }
            });
            window.onbeforeunload = () => {
                if (this._PopupWindow) {
                    this._PopupWindow.close();
                }
            };
        }
    }

    public static Hide() {
        if (this._PopupWindow) {
            this._PopupWindow.close();
        }
    }
}
