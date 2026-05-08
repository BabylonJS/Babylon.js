import { type FlowGraph } from "core/FlowGraph/flowGraph";
import { type Observable } from "core/Misc/observable";
import { type Scene } from "core/scene";
import { CreatePopup } from "shared-ui-components/popupHelper";
import { MakeModularTool } from "shared-ui-components/modularTool/modularTool";

import { RegisterToDisplayManagers } from "./graphSystem/registerToDisplayLedger";
import { RegisterToPropertyTabManagers } from "./graphSystem/registerToPropertyLedger";
import { RegisterTypeLedger } from "./graphSystem/registerToTypeLedger";

import { CentralGraphServiceDefinition } from "./services/centralGraphService";
import { DialogBridgeServiceDefinition } from "./services/dialogBridgeService";
import { MakeGlobalStateService } from "./services/globalStateService";
import { NodeListServiceDefinition } from "./services/nodeListService";
import { PropertyTabServiceDefinition } from "./services/propertyTabService";
import { ScenePreviewServiceDefinition } from "./services/scenePreviewService";
import { ToastBridgeServiceDefinition } from "./services/toastBridgeService";
import { ToolbarServiceDefinition } from "./services/toolbarService";
import { VariablesServiceDefinition } from "./services/variablesService";

/**
 * Interface used to specify creation options for the flow graph editor
 */
export interface IFlowGraphEditorOptions {
    /** The flow graph to edit */
    flowGraph: FlowGraph;
    /** Optional host scene (defaults to the flow graph's scene) */
    hostScene?: Scene;
    /** Optional host element to render the editor into (a popup is created if omitted) */
    hostElement?: HTMLElement;
    /** Optional custom save configuration with a label and async action */
    customSave?: { label: string; action: (data: string) => Promise<void> };
    /** Optional observable that provides data to load into the editor */
    customLoadObservable?: Observable<any>;
}

/**
 * Class used to create a flow graph editor
 */
export class FlowGraphEditor {
    private static _CurrentDisposer: { dispose: () => Promise<void> } | undefined;
    private static _PopupWindow: Window | null = null;

    /**
     * Show the flow graph editor
     * @param options defines the options to use to configure the editor
     */
    public static Show(options: IFlowGraphEditorOptions) {
        // Initial setup
        RegisterToDisplayManagers();
        RegisterToPropertyTabManagers();
        RegisterTypeLedger();

        // Tear down any previously shown editor (and its popup window).
        if (this._CurrentDisposer) {
            void this._CurrentDisposer.dispose();
            this._CurrentDisposer = undefined;
        }
        const previousPopup = this._PopupWindow;
        this._PopupWindow = null;
        if (previousPopup && !previousPopup.closed) {
            previousPopup.close();
        }

        let hostElement = options.hostElement;
        let popupWindow: Window | null = null;

        if (!hostElement) {
            // Use the legacy CreatePopup which copies stylesheets from the main window into the
            // popup. The graph canvas (shared `nodeGraphSystem/`) still ships traditional CSS,
            // so without CopyStyles its visuals would be unstyled in the popup. Fluent / Griffel /
            // makeStaticStyles work alongside it because MakeModularTool derives `targetDocument`
            // from `containerElement.ownerDocument` (see Theme.tsx / modularTool.tsx).
            //
            // TODO: when the graph canvas is migrated off SCSS, switch this to OpenPopupWindow
            // (in `shared-ui-components/fluent/hoc/popupWindow.ts`) for a fully Fluent-native flow.
            hostElement = CreatePopup("BABYLON.JS FLOW GRAPH EDITOR", {
                onWindowCreateCallback: (w) => {
                    popupWindow = w;
                    this._PopupWindow = w;
                },
                width: 1000,
                height: 800,
            })!;
        }

        // Bootstrap the modular tool. The framework derives `targetDocument` from
        // `hostElement.ownerDocument`, so popup-window hosting and main-window hosting
        // both work without any additional plumbing here.
        const tool = MakeModularTool({
            namespace: "FlowGraphEditor",
            containerElement: hostElement,
            serviceDefinitions: [
                MakeGlobalStateService(options, hostElement),
                CentralGraphServiceDefinition,
                DialogBridgeServiceDefinition,
                NodeListServiceDefinition,
                PropertyTabServiceDefinition,
                ScenePreviewServiceDefinition,
                ToastBridgeServiceDefinition,
                ToolbarServiceDefinition,
                VariablesServiceDefinition,
            ],
            toolbarMode: "full",
            showThemeSelector: true,
        });

        this._CurrentDisposer = tool;

        // Close the popup window when the page is refreshed or scene is disposed.
        if (options.hostScene && popupWindow) {
            const capturedPopup: Window = popupWindow;
            options.hostScene.onDisposeObservable.addOnce(() => {
                if (!capturedPopup.closed) {
                    capturedPopup.close();
                }
            });
            const onBeforeUnload = () => {
                if (!capturedPopup.closed) {
                    capturedPopup.close();
                }
            };
            window.addEventListener("beforeunload", onBeforeUnload);

            const onPopupUnload = () => {
                window.removeEventListener("beforeunload", onBeforeUnload);
                if (FlowGraphEditor._PopupWindow === capturedPopup) {
                    FlowGraphEditor._PopupWindow = null;
                }
            };
            capturedPopup.addEventListener("unload", onPopupUnload, { once: true });
        }
    }
}
