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
    /**
     * When true, the editor attaches directly to {@link hostScene} as a live application scene:
     * it catalogs that scene, drives the flow graph against it, and never creates a throwaway
     * preview scene or disposes the host. Set by `FlowGraph.edit()` and the Inspector. The
     * standalone editor leaves this unset and keeps its own editable preview scene, even though it
     * passes a `hostScene` to own the coordinator.
     */
    attachToLiveScene?: boolean;
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
            leftPaneMinWidth: 250,
            leftPaneDefaultWidth: 250,
            rightPaneMinWidth: 250,
            rightPaneDefaultWidth: 300,
        });

        this._CurrentDisposer = tool;

        // Whenever the editor is hosted in a popup window, wire teardown so the modular
        // tool (React root + observers) is disposed when the user closes the popup or
        // the parent page is refreshed — even if no hostScene was supplied.
        if (popupWindow) {
            const capturedPopup: Window = popupWindow;
            const capturedTool = tool;

            // Close the popup if the parent page is being unloaded.
            const onBeforeUnload = () => {
                if (!capturedPopup.closed) {
                    capturedPopup.close();
                }
            };
            window.addEventListener("beforeunload", onBeforeUnload);

            // When the popup itself unloads (user closed it, navigated away, etc.),
            // dispose the modular tool and clear the static references so we don't
            // leak observers / React root.
            const onPopupUnload = () => {
                window.removeEventListener("beforeunload", onBeforeUnload);
                if (FlowGraphEditor._PopupWindow === capturedPopup) {
                    FlowGraphEditor._PopupWindow = null;
                }
                if (FlowGraphEditor._CurrentDisposer === capturedTool) {
                    void capturedTool.dispose();
                    FlowGraphEditor._CurrentDisposer = undefined;
                }
            };
            capturedPopup.addEventListener("unload", onPopupUnload, { once: true });

            // Close the popup window when a live host scene is disposed. Only applies to
            // attach-to-live-scene launches; the standalone editor's throwaway hostScene must not
            // tear down the editor.
            if (options.attachToLiveScene && options.hostScene) {
                options.hostScene.onDisposeObservable.addOnce(() => {
                    if (!capturedPopup.closed) {
                        capturedPopup.close();
                    }
                });
            }
        }
    }
}
