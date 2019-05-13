import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from './globalState';
import { GraphEditor } from './components/graphEditor';
import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial"
import { Popup } from "../src/sharedComponents/popup"
/**
 * Interface used to specify creation options for the node editor
 */
export interface INodeEditorOptions {
    /**
     * Defines the DOM element that will host the node editor
     */
    hostElement?: HTMLDivElement
    nodeMaterial?: NodeMaterial
}

/**
 * Class used to create a node editor
 */
export class NodeEditor {
    /**
     * Show the node editor
     * @param options defines the options to use to configure the node editor
     */
    public static Show(options: INodeEditorOptions) {
        if (!options.hostElement) {
            options.hostElement = Popup.CreatePopup("BABYLON.JS NODE EDITOR", "node-editor", 1000, 800)!;
        }
        let globalState = new GlobalState();
        globalState.nodeMaterial = options.nodeMaterial
        globalState.hostDocument = options.hostElement.ownerDocument

        const graphEditor = React.createElement(GraphEditor, {
            globalState: globalState
        });

        ReactDOM.render(graphEditor, options.hostElement);

        // Close the popup window when the page is refreshed or scene is disposed
        var popupWindow = (Popup as any)["node-editor"];
        if (globalState.nodeMaterial && popupWindow) {
            globalState.nodeMaterial.getScene().onDisposeObservable.addOnce(() => {
                if (popupWindow) {
                    popupWindow.close();
                }
            })
            window.onbeforeunload = function(event) {
                var popupWindow = (Popup as any)["node-editor"];
                if (popupWindow) {
                    popupWindow.close();
                }
            };
        }
    }
}

