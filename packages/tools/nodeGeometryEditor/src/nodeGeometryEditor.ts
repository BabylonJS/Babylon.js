import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from "./globalState";
import { GraphEditor } from "./graphEditor";
import type { NodeGeometry } from "core/Meshes/Node/nodeGeometry";
import { Popup } from "./sharedComponents/popup";
import { SerializationTools } from "./serializationTools";
import type { Observable } from "core/Misc/observable";
import { RegisterToDisplayManagers } from "./graphSystem/registerToDisplayLedger";
import { RegisterToPropertyTabManagers } from "./graphSystem/registerToPropertyLedger";
import { RegisterTypeLedger } from "./graphSystem/registerToTypeLedger";
import type { Color4 } from "core/Maths/math.color";
import type { Scene } from "core/scene";

/**
 * Interface used to specify creation options for the node editor
 */
export interface INodeEditorOptions {
    nodeGeometry: NodeGeometry;
    hostScene: Scene;
    hostElement?: HTMLElement;
    customSave?: { label: string; action: (data: string) => Promise<void> };
    customLoadObservable?: Observable<any>;
    backgroundColor?: Color4;
}

/**
 * Class used to create a node editor
 */
export class NodeGeometryEditor {
    private static _CurrentState: GlobalState;

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
            const popupWindow = (Popup as any)["node-geometry-editor"];
            if (popupWindow) {
                popupWindow.close();
            }
        }

        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = Popup.CreatePopup("BABYLON.JS NODE GEOMETRY EDITOR", "node-geometry-editor", 1000, 800)!;
        }

        const globalState = new GlobalState();
        globalState.nodeGeometry = options.nodeGeometry;
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.customSave = options.customSave;
        globalState.hostWindow = hostElement.ownerDocument!.defaultView!;
        globalState.stateManager.hostDocument = globalState.hostDocument;
        if (options.backgroundColor) {
            globalState.backgroundColor = options.backgroundColor;
        }

        const graphEditor = React.createElement(GraphEditor, {
            globalState: globalState,
        });

        ReactDOM.render(graphEditor, hostElement);

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
        const popupWindow = (Popup as any)["node-geometry-editor"];
        if (globalState.nodeGeometry && options.hostScene && popupWindow) {
            options.hostScene.onDisposeObservable.addOnce(() => {
                if (popupWindow) {
                    popupWindow.close();
                }
            });
            window.onbeforeunload = () => {
                const popupWindow = (Popup as any)["node-geometry-editor"];
                if (popupWindow) {
                    popupWindow.close();
                }
            };
        }
    }
}
