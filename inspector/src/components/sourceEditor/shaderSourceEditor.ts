import { ShaderMaterial } from "babylonjs/Materials/shaderMaterial";
import { renderSSE, ShaderSourceRecompileCallback, HistoryDataSource } from './shaderSourceEditorUI';
import { Inspector } from '../../inspector';

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

    static popupWindow: Window;

    /**
     * Show the shader editor
     * @param options defines the options to use to configure the shader editor
     */
    public static Show(options: IShaderSourceEditorOptions) {
        if (this._CurrentState) {
            const popupWindow = this.popupWindow;
            if (popupWindow) {
                popupWindow.close();
            }
        }

        const hostDiv = Inspector._CreatePopup(
            "Babylon.js Shader Source Editor",
            "shader-source-editor",
            1000,
            800
        );
        if (!hostDiv) {
            return;
        }
        const hostDocument = hostDiv.ownerDocument!;
        const hostBody = hostDocument.body;
        hostBody.removeChild(hostDiv);

        const globalState = new SSEState();
        globalState.shaderMaterial = options.shaderMaterial;
        globalState.hostElement = hostBody;
        globalState.hostDocument = hostDocument;
        globalState.hostWindow = hostDocument.defaultView!;

        this.render(hostBody, options);

        // Close the popup window when the page is refreshed or scene is disposed
        const popupWindow = this.popupWindow;
        if (globalState.shaderMaterial && popupWindow) {
            globalState.shaderMaterial.getScene().onDisposeObservable.addOnce(() => {
                if (popupWindow) {
                    popupWindow.close();
                }
            });
            window.onbeforeunload = () => {
                var popupWindow = this.popupWindow;
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
