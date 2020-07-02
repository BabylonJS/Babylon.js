import * as React from "react";
import * as ReactDOM from "react-dom";
import { GlobalState } from './globalState';
import { ImageEditor } from './imageEditor';
import { BaseTexture } from "babylonjs/Materials/Textures/baseTexture"
import { Popup } from "../src/sharedComponents/popup"
import { Observable } from 'babylonjs/Misc/observable';
/**
 * Interface used to specify creation options for the texture editor
 */
export interface ITextureEditorOptions {
    texture: BaseTexture,
    hostElement?: HTMLElement,
    customSave?: {label: string, action: (data: string) => Promise<void>};
    customLoadObservable?: Observable<any>
}

/**
 * Class used to create a texture editor
 */
export class TextureEditor {
    private static _CurrentState: GlobalState;

    public static Show(options: ITextureEditorOptions) {
        if (this._CurrentState) {
            var popupWindow = (Popup as any)["texture-editor"];
            if (popupWindow) {
                popupWindow.close();
            }
        }

        let hostElement = options.hostElement;
        if (!hostElement) {
            hostElement = Popup.CreatePopup("BABYLON.JS TEXTURE EDITOR", "texture-editor", 1000, 800)!;
        }

        let globalState = new GlobalState();
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.texture = options.texture;
        globalState.customSave = options.customSave;
        globalState.hostWindow =  hostElement.ownerDocument!.defaultView!;

        const imageEditor = React.createElement(ImageEditor, {
            globalState: globalState
        });
            
        ReactDOM.render(imageEditor, hostElement);

        this._CurrentState = globalState;

        var popupWindow = (Popup as any)["texture-editor"];
        if (globalState.texture && popupWindow) {
            if (globalState.texture.getScene()) {
                globalState.texture.getScene()?.onDisposeObservable.addOnce(() => {
                    if (popupWindow) {
                        popupWindow.close();
                    }
                })
            }
            window.onbeforeunload = () => {
                var popupWindow = (Popup as any)["texture-editor"];
                if (popupWindow) {
                    popupWindow.close();
                }

            };
        }

    }
}