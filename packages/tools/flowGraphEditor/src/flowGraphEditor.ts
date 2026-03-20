import * as React from "react";
import { createRoot } from "react-dom/client";
import { GlobalState } from "./globalState";
import { GraphEditor } from "./graphEditor";
import type { FlowGraph } from "core/FlowGraph/flowGraph";
import { SerializationTools } from "./serializationTools";
import type { Observable } from "core/Misc/observable";
import { RegisterToDisplayManagers } from "./graphSystem/registerToDisplayLedger";
import { RegisterToPropertyTabManagers } from "./graphSystem/registerToPropertyLedger";
import { RegisterTypeLedger } from "./graphSystem/registerToTypeLedger";
import type { Scene } from "core/scene";
import { CreatePopup } from "shared-ui-components/popupHelper";

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
    private static _CurrentState: GlobalState;
    private static _PopupWindow: Window | null;

    /**
     * Show the flow graph editor
     * @param options defines the options to use to configure the editor
     */
    public static Show(options: IFlowGraphEditorOptions) {
        // Initial setup
        RegisterToDisplayManagers();
        RegisterToPropertyTabManagers();
        RegisterTypeLedger();

        if (this._CurrentState) {
            if (this._PopupWindow) {
                this._PopupWindow.close();
            }
        }

        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = CreatePopup("BABYLON.JS FLOW GRAPH EDITOR", {
                onWindowCreateCallback: (w) => (this._PopupWindow = w),
                width: 1000,
                height: 800,
            })!;
        }

        const scene = options.hostScene || options.flowGraph.scene;
        const globalState = new GlobalState(scene);
        globalState.flowGraph = options.flowGraph;
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.hostScene = options.hostScene;
        globalState.customSave = options.customSave;
        globalState.hostWindow = hostElement.ownerDocument.defaultView!;
        globalState.stateManager.hostDocument = globalState.hostDocument;

        const graphEditor = React.createElement(GraphEditor, {
            globalState: globalState,
        });

        const root = createRoot(hostElement);
        root.render(graphEditor);

        if (options.customLoadObservable) {
            options.customLoadObservable.add((data) => {
                const doLoadAsync = async () => {
                    await SerializationTools.DeserializeAsync(data, globalState);
                    globalState.onResetRequiredObservable.notifyObservers(false);
                    globalState.onBuiltObservable.notifyObservers();
                };
                void doLoadAsync();
            });
        }

        this._CurrentState = globalState;

        globalState.hostWindow.addEventListener("beforeunload", () => {
            globalState.onPopupClosedObservable.notifyObservers();
        });

        // Close the popup window when the page is refreshed or scene is disposed
        if (options.hostScene && this._PopupWindow) {
            options.hostScene.onDisposeObservable.addOnce(() => {
                if (this._PopupWindow) {
                    this._PopupWindow.close();
                }
            });
            const onBeforeUnload = () => {
                if (this._PopupWindow) {
                    this._PopupWindow.close();
                }
            };
            window.addEventListener("beforeunload", onBeforeUnload);
            // Clean up when popup closes
            globalState.onPopupClosedObservable.addOnce(() => {
                window.removeEventListener("beforeunload", onBeforeUnload);
            });
        }
    }
}
