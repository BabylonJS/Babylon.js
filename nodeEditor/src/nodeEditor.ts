import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from './globalState';
import { GraphEditor } from './graphEditor';
import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial"
import { Popup } from "../src/sharedComponents/popup"
import { SerializationTools } from './serializationTools';
import { Observable } from 'babylonjs/Misc/observable';
import { PreviewType } from './components/preview/previewType';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';
/**
 * Interface used to specify creation options for the node editor
 */
export interface INodeEditorOptions {
    nodeMaterial: NodeMaterial,
    hostElement?: HTMLElement,
    customSave?: {label: string, action: (data: string) => Promise<void>};
    customLoadObservable?: Observable<any>
}

/**
 * Class used to create a node editor
 */
export class NodeEditor {
    private static _CurrentState: GlobalState;

    /**
     * Show the node editor
     * @param options defines the options to use to configure the node editor
     */
    public static Show(options: INodeEditorOptions) {
        if (this._CurrentState) {
            var popupWindow = (Popup as any)["node-editor"];
            if (popupWindow) {
                popupWindow.close();
            }
        }

        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = Popup.CreatePopup("BABYLON.JS NODE EDITOR", "node-editor", 1000, 800)!;
        }

        let globalState = new GlobalState();
        globalState.nodeMaterial = options.nodeMaterial;
        globalState.mode = options.nodeMaterial.mode;
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.customSave = options.customSave;
        globalState.hostWindow =  hostElement.ownerDocument!.defaultView!;

        const graphEditor = React.createElement(GraphEditor, {
            globalState: globalState
        });

        ReactDOM.render(graphEditor, hostElement);

        if (options.customLoadObservable) {
            options.customLoadObservable.add(data => {
                SerializationTools.Deserialize(data, globalState);
                globalState.onBuiltObservable.notifyObservers();
            })
        }

        this._CurrentState = globalState;

        // Close the popup window when the page is refreshed or scene is disposed
        var popupWindow = (Popup as any)["node-editor"];
        if (globalState.nodeMaterial && popupWindow) {
            globalState.nodeMaterial.getScene().onDisposeObservable.addOnce(() => {
                if (popupWindow) {
                    popupWindow.close();
                }
            })
            window.onbeforeunload = () => {
                var popupWindow = (Popup as any)["node-editor"];
                if (popupWindow) {
                    popupWindow.close();
                }

            };
        }
        window.addEventListener('beforeunload', () => {
            if(DataStorage.ReadNumber("PreviewType", PreviewType.Box) === PreviewType.Custom){
                DataStorage.WriteNumber("PreviewType", globalState.mode === NodeMaterialModes.Material ? PreviewType.Box : PreviewType.Bubbles);
            }
        });
    }
}

