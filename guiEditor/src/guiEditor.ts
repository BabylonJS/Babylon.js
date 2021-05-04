import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from "./globalState";
import { WorkbenchEditor } from "./workbenchEditor";
import { Popup } from "./sharedUiComponents/lines/popup";
import { Observable } from "babylonjs/Misc/observable";

/**
 * Interface used to specify creation options for the gui editor
 */
export interface IGUIEditorOptions {
    hostElement?: HTMLElement;
    customSave?: { label: string; action: (data: string) => Promise<void> };
    currentSnippetToken?: string;
    customLoadObservable?: Observable<any>;
}

/**
 * Class used to create a gui editor
 */
export class GUIEditor {
    private static _CurrentState: GlobalState;
    /**
     * Show the gui editor
     * @param options defines the options to use to configure the gui editor
     */
    public static Show(options: IGUIEditorOptions) {
        if (this._CurrentState) {
            var popupWindow = (Popup as any)["gui-editor"];
            if (popupWindow) {
                popupWindow.close();
            }
            if(options.currentSnippetToken) {
                try {
                    this._CurrentState.workbench.loadFromSnippet(options.currentSnippetToken);
                } catch (error) {
                    //swallow and continue
                }
            }
            return;
        }

        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = Popup.CreatePopup("BABYLON.JS GUI EDITOR", "gui-editor", 1000, 800)!;
        }

        let globalState = new GlobalState();
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.customSave = options.customSave;
        globalState.hostWindow = hostElement.ownerDocument!.defaultView!;

        const graphEditor = React.createElement(WorkbenchEditor, {
            globalState: globalState,
        });
    
        ReactDOM.render(graphEditor, hostElement);
        // create the middle workbench canvas
        if (!globalState.guiTexture) {
            globalState.workbench.createGUICanvas();
            if(options.currentSnippetToken) {
                try {
                    globalState.workbench.loadFromSnippet(options.currentSnippetToken);
                
                } catch (error) {
                    //swallow and continue
                }
            }
        }
                
        if (options.customLoadObservable) {
            options.customLoadObservable.add((data) => {
                globalState.onResetRequiredObservable.notifyObservers();
                globalState.onBuiltObservable.notifyObservers();
            });
        }

        this._CurrentState = globalState;

        // Close the popup window when the page is refreshed or scene is disposed
        var popupWindow = (Popup as any)["gui-editor"];
        if (popupWindow) {
            window.onbeforeunload = () => {
                var popupWindow = (Popup as any)["gui-editor"];
                if (popupWindow) {
                    popupWindow.close();
                }
            };
        }
        window.addEventListener("beforeunload", () => {});
    }
}
