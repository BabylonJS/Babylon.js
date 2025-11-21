import * as React from "react";
import { createRoot } from "react-dom/client";
import { GlobalState } from "./globalState";
import { GraphEditor } from "./graphEditor";
import type { NodeRenderGraph } from "core/FrameGraph/Node/nodeRenderGraph";
import { SerializationTools } from "./serializationTools";
import type { Observable } from "core/Misc/observable";
import { RegisterToDisplayManagers } from "./graphSystem/registerToDisplayLedger";
import { RegisterToPropertyTabManagers } from "./graphSystem/registerToPropertyLedger";
import { RegisterTypeLedger } from "./graphSystem/registerToTypeLedger";
import type { Scene } from "core/scene";
import { CreatePopup } from "shared-ui-components/popupHelper";
import type { INodeRenderGraphCustomBlockDescription } from "core/FrameGraph/Node/Types/nodeRenderGraphTypes";

/**
 * Interface used to specify creation options for the node editor
 */
export interface INodeEditorOptions {
    nodeRenderGraph: NodeRenderGraph;
    hostScene?: Scene;
    hostElement?: HTMLElement;
    customSave?: { label: string; action: (data: string) => Promise<void> };
    customLoadObservable?: Observable<any>;
    customBlockDescriptions?: INodeRenderGraphCustomBlockDescription[];
}

/**
 * Class used to create a node editor
 */
export class NodeRenderGraphEditor {
    private static _CurrentState: GlobalState;
    private static _PopupWindow: Window | null;

    /**
     * Show the node editor
     * @param options defines the options to use to configure the node editor
     */
    public static Show(options: INodeEditorOptions) {
        // Initial setup
        RegisterToDisplayManagers();
        RegisterToPropertyTabManagers();
        RegisterTypeLedger();

        if (this._CurrentState) {
            if (this._PopupWindow) {
                this._PopupWindow.close();
            }
        }

        alert("Frame graph is currently in alpha phase, so don't use it in production code yet!");

        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = CreatePopup("BABYLON.JS NODE RENDER GRAPH EDITOR", {
                onWindowCreateCallback: (w) => (this._PopupWindow = w),
                width: 1000,
                height: 800,
            })!;
        }

        const globalState = new GlobalState(options.nodeRenderGraph.getScene());
        globalState.nodeRenderGraph = options.nodeRenderGraph;
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.hostScene = options.hostScene;
        globalState.customSave = options.customSave;
        globalState.hostWindow = hostElement.ownerDocument.defaultView!;
        globalState.stateManager.hostDocument = globalState.hostDocument;
        globalState.noAutoFillExternalInputs = options.hostScene !== undefined && options.hostScene !== null;
        globalState.customBlockDescriptions = options.customBlockDescriptions;

        const graphEditor = React.createElement(GraphEditor, {
            globalState: globalState,
        });

        const root = createRoot(hostElement);
        root.render(graphEditor);

        if (options.customLoadObservable) {
            options.customLoadObservable.add((data) => {
                SerializationTools.Deserialize(data, globalState);
                globalState.onResetRequiredObservable.notifyObservers(false);
                globalState.onBuiltObservable.notifyObservers();
            });
        }

        this._CurrentState = globalState;

        globalState.hostWindow.addEventListener("beforeunload", () => {
            globalState.onPopupClosedObservable.notifyObservers();
        });

        // Close the popup window when the page is refreshed or scene is disposed
        if (globalState.nodeRenderGraph && options.hostScene && this._PopupWindow) {
            options.hostScene.onDisposeObservable.addOnce(() => {
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
}
