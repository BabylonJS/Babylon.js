import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { Popup } from "../sharedComponents/popup";
import { Observable } from 'babylonjs/Misc/observable';
import { renderSSE, ShaderSourceRecompileCallback, HistoryDataSource } from './shaderSourceEditorUI';

class SSEState {
    shaderMaterial: ShaderMaterial;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    customSave?: {label: string, action: (data: string) => Promise<void>};

    public constructor() {
    }
}

/**
 * Interface used to specify creation options for the node editor
 */
export interface IShaderSourceEditorOptions {
    shaderMaterial: ShaderMaterial;
    hostElement?: HTMLElement;
    customSave?: {label: string, action: (data: string) => Promise<void>};
    customLoadObservable?: Observable<any>;
}

/**
 * Class used to create a shader source editor
 */
export class ShaderSourceEditor {
    private static _CurrentState: SSEState;

    /**
     * Show the node editor
     * @param options defines the options to use to configure the node editor
     */
    public static Show(options: IShaderSourceEditorOptions) {
        if (this._CurrentState) {
            var popupWindow = (Popup as any)["shader-source-editor"];
            if (popupWindow) {
                popupWindow.close();
            }
        }

        let hostElement = options.hostElement;

        if (!hostElement) {
            hostElement = Popup.CreatePopup("BABYLON.JS SHADER SOURCE EDITOR", "shader-source-editor", 1000, 800, false)!;
        }

        let globalState = new SSEState();
        globalState.shaderMaterial = options.shaderMaterial;
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.customSave = options.customSave;
        globalState.hostWindow =  hostElement.ownerDocument!.defaultView!;

        // ReactDOM.render(graphEditor, hostElement);
        this.render(hostElement, options);

        // Close the popup window when the page is refreshed or scene is disposed
        var popupWindow = (Popup as any)["shader-source-editor"];
        if (globalState.shaderMaterial && popupWindow) {
            globalState.shaderMaterial.getScene().onDisposeObservable.addOnce(() => {
                if (popupWindow) {
                    popupWindow.close();
                }
            });
            window.onbeforeunload = () => {
                var popupWindow = (Popup as any)["shader-source-editor"];
                if (popupWindow) {
                    popupWindow.close();
                }
            };
        }
    }

    static keyForMaterial(mat: ShaderMaterial): string[] {
        let path = '_';
        try {
            path = JSON.stringify(mat.shaderPath);
        } catch {
        }
        return [ mat.name, path ];
    }

    static render(hostElement: HTMLElement, options: IShaderSourceEditorOptions) {
        const material = options.shaderMaterial;
        const effect = material.getEffect();
        const fragSource = (effect as any)?.originalFragmentSourceCode || '';
        const vertexSource = (effect as any)?.originalVertexSourceCode || '';
        const dataSource = new HistoryDataSource(this.keyForMaterial(material));
        const delegate = {
            recompile(fragSource: string, vertexSource: string, callback: ShaderSourceRecompileCallback) {
                effect?._rebuildProgram(vertexSource, fragSource, (piplineContext) => {
                    // on compiled
                    console.log('SUCCESS SHADER', piplineContext);
                    callback(true, '');
                }, (message) => {
                    // on error
                    console.log('ERROR SHADER', message);
                    // processErrors(message);
                    callback(false, message);
                });
            }
        };
        renderSSE(hostElement, dataSource, delegate, {
            fragSource, vertexSource
        });
    }
}
