import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { renderSSE, ShaderSourceRecompileCallback, HistoryDataSource } from './shaderSourceEditorUI';

class Popup {
    public static CreatePopup(title: string, windowVariableName: string, width = 300, height = 800) {
        const windowCreationOptionsList = {
            width: width,
            height: height,
            top: (window.innerHeight - width) / 2 + window.screenY,
            left: (window.innerWidth - height) / 2 + window.screenX
        };

        const windowCreationOptions = Object.keys(windowCreationOptionsList)
            .map((key) => key + '=' + (windowCreationOptionsList as any)[key])
            .join(',');

        const popupWindow = window.open("", title, windowCreationOptions);
        if (!popupWindow) {
            return null;
        }

        (this as any)[windowVariableName] = popupWindow;

        const doc = popupWindow.document;
        doc.title = title;
        return doc.body;
    }
}

class SSEState {
    shaderMaterial: ShaderMaterial;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    customSave?: {label: string, action: (data: string) => Promise<void>};
}

/**
 * Interface used to specify creation options for the shader editor
 */
export interface IShaderSourceEditorOptions {
    shaderMaterial: ShaderMaterial;
}

/**
 * Class used to create a shader source editor
 */
export class ShaderSourceEditor {
    private static _CurrentState: SSEState;

    /**
     * Show the shader editor
     * @param options defines the options to use to configure the shader editor
     */
    public static Show(options: IShaderSourceEditorOptions) {
        if (this._CurrentState) {
            const popupWindow = (Popup as any)["shader-source-editor"];
            if (popupWindow) {
                popupWindow.close();
            }
        }

        let hostElement = Popup.CreatePopup(
            "Babylon.js Shader Source Editor",
            "shader-source-editor",
            1000,
            800
        )!;

        const globalState = new SSEState();
        globalState.shaderMaterial = options.shaderMaterial;
        globalState.hostElement = hostElement;
        globalState.hostDocument = hostElement.ownerDocument!;
        globalState.hostWindow =  hostElement.ownerDocument!.defaultView!;

        this.render(hostElement, options);

        // Close the popup window when the page is refreshed or scene is disposed
        const popupWindow = (Popup as any)["shader-source-editor"];
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
        const keys = [] as string[];
        const shaderPath = mat.shaderPath;
        if (typeof shaderPath === 'string') {
            keys.push(shaderPath);
        } else if (typeof shaderPath === 'object') {
            if (typeof shaderPath.vertex === 'string') {
                keys.push(shaderPath.vertex);
            }
            if (typeof shaderPath.fragment === 'string') {
                keys.push(shaderPath.fragment);
            }
            if (typeof shaderPath.vertexElement === 'string') {
                keys.push(shaderPath.vertexElement);
            }
            if (typeof shaderPath.fragmentElement === 'string') {
                keys.push(shaderPath.fragmentElement);
            }
        }
        return [ mat.name, ...keys ];
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
                    // On success
                    callback(true, '');
                }, (message) => {
                    // On error
                    callback(false, message);
                });
            }
        };
        hostElement.ownerDocument!.documentElement.id = 'sseRoot';
        renderSSE(hostElement, dataSource, delegate, {
            fragSource, vertexSource
        });
    }
}
