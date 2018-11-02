
import * as React from "react";
import * as ReactDOM from "react-dom";
import { ActionTabsComponent } from "./components/actionTabs/actionTabsComponent";
import { SceneExplorerComponent } from "./components/sceneExplorer/sceneExplorerComponent";
import { Scene, Observable, Observer, Nullable } from "babylonjs";
import { EmbedHostComponent } from "./components/embedHost/embedHostComponent";
import { PropertyChangedEvent } from "./components/propertyChangedEvent";

export interface IExtensibilityOption {
    label: string;
    action: (entity: any) => void;
}

export interface IExtensibilityGroup {
    predicate: (entity: any) => boolean;
    entries: IExtensibilityOption[];
}

export interface IInspectorOptions {
    overlay?: boolean;
    sceneExplorerRoot?: HTMLElement;
    actionTabsRoot?: HTMLElement;
    embedHostRoot?: HTMLElement;
    showExplorer?: boolean;
    showInspector?: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
    embedMode?: boolean;
    handleResize?: boolean;
    enablePopup?: boolean;
    explorerExtensibility?: IExtensibilityGroup[];
}

interface IInternalInspectorOptions extends IInspectorOptions {
    popup: boolean;
    original: boolean;
}

export class Inspector {
    private static _SceneExplorerHost: Nullable<HTMLElement>;
    private static _ActionTabsHost: Nullable<HTMLElement>;
    private static _EmbedHost: Nullable<HTMLElement>;
    private static _NewCanvasContainer: HTMLElement;

    private static _SceneExplorerWindow: Window;
    private static _ActionTabsWindow: Window;
    private static _EmbedHostWindow: Window;

    private static _Scene: Scene;
    private static _OpenedPane = 0;
    private static _OnBeforeRenderObserver: Nullable<Observer<Scene>>;

    public static OnSelectionChangeObservable = new BABYLON.Observable<string>();
    public static OnPropertyChangedObservable = new BABYLON.Observable<PropertyChangedEvent>();

    private static _CopyStyles(sourceDoc: HTMLDocument, targetDoc: HTMLDocument) {
        for (var index = 0; index < sourceDoc.styleSheets.length; index++) {
            var styleSheet: any = sourceDoc.styleSheets[index];
            if (styleSheet.cssRules) { // for <style> elements
                const newStyleEl = sourceDoc.createElement('style');

                for (var cssRule of styleSheet.cssRules) {
                    // write the text of each rule into the body of the style element
                    newStyleEl.appendChild(sourceDoc.createTextNode(cssRule.cssText));
                }

                targetDoc.head!.appendChild(newStyleEl);
            } else if (styleSheet.href) { // for <link> elements loading CSS from a URL
                const newLinkEl = sourceDoc.createElement('link');

                newLinkEl.rel = 'stylesheet';
                newLinkEl.href = styleSheet.href;
                targetDoc.head!.appendChild(newLinkEl);
            }
        }
    }

    private static _CreateSceneExplorer(scene: Scene, options: IInternalInspectorOptions, parentControlExplorer: Nullable<HTMLElement>, onSelectionChangeObservable: Observable<string>) {
        // Duplicating the options as they can be different for each pane
        if (options.original) {
            options = {
                original: false,
                popup: options.popup,
                overlay: options.overlay,
                showExplorer: options.showExplorer,
                showInspector: options.showInspector,
                embedMode: options.embedMode,
                handleResize: options.handleResize,
                enablePopup: options.enablePopup,
                explorerExtensibility: options.explorerExtensibility
            };
        }

        if (!options.sceneExplorerRoot || options.popup) {
            // Prepare the scene explorer host
            if (parentControlExplorer) {
                this._SceneExplorerHost = parentControlExplorer.ownerDocument!.createElement("div");

                this._SceneExplorerHost.id = "scene-explorer-host";
                this._SceneExplorerHost.style.width = options.explorerWidth || "300px";

                parentControlExplorer.appendChild(this._SceneExplorerHost);

                if (!options.overlay) {
                    this._SceneExplorerHost.style.gridColumn = "1";
                    this._SceneExplorerHost.style.position = "relative";

                    if (!options.popup) {
                        options.sceneExplorerRoot = this._SceneExplorerHost;
                    }
                }
            }
        } else {
            this._SceneExplorerHost = options.sceneExplorerRoot;
        }

        // Scene
        if (this._SceneExplorerHost) {
            Inspector._OpenedPane++;
            const sceneExplorerElement = React.createElement(SceneExplorerComponent, {
                scene, onSelectionChangeObservable: onSelectionChangeObservable,
                extensibilityGroups: options.explorerExtensibility,
                noExpand: !options.enablePopup, popupMode: options.popup, onPopup: () => {
                    ReactDOM.unmountComponentAtNode(this._SceneExplorerHost!);

                    if (options.popup) {
                        this._SceneExplorerWindow.close();
                    }

                    options.popup = !options.popup;
                    options.showExplorer = true;
                    options.showInspector = false;
                    options.explorerWidth = options.popup ? "100%" : "300px";
                    Inspector.Show(scene, options);
                }, onClose: () => {
                    ReactDOM.unmountComponentAtNode(this._SceneExplorerHost!);
                    Inspector._OpenedPane--;
                    this._Cleanup();

                    if (options.popup) {
                        this._SceneExplorerWindow.close();
                    } else if (!options.overlay) {
                        if (this._SceneExplorerHost) {
                            this._SceneExplorerHost.style.width = "0";
                        }
                    }
                }
            });
            ReactDOM.render(sceneExplorerElement, this._SceneExplorerHost);
        }
    }

    private static _CreateActionTabs(scene: Scene, options: IInternalInspectorOptions, parentControlActions: Nullable<HTMLElement>, onSelectionChangeObservable: Observable<string>) {

        if (!options.actionTabsRoot || options.popup) {
            // Prepare the inspector host
            if (parentControlActions) {
                const host = parentControlActions.ownerDocument!.createElement("div");

                host.id = "inspector-host";
                host.style.width = options.inspectorWidth || "300px";

                parentControlActions.appendChild(host);

                this._ActionTabsHost = host;

                if (!options.overlay) {
                    this._ActionTabsHost.style.gridColumn = "3";
                    this._ActionTabsHost.style.position = "relative";

                    if (!options.popup) {
                        options.actionTabsRoot = this._ActionTabsHost;
                    }
                }
            }
        } else {
            this._ActionTabsHost = options.actionTabsRoot;
        }

        if (this._ActionTabsHost) {
            Inspector._OpenedPane++;
            const actionTabsElement = React.createElement(ActionTabsComponent, {
                onSelectionChangeObservable: onSelectionChangeObservable, scene: scene, noExpand: !options.enablePopup, popupMode: options.popup, onPopup: () => {
                    ReactDOM.unmountComponentAtNode(this._ActionTabsHost!);

                    if (options.popup) {
                        this._ActionTabsWindow.close();
                    }

                    options.popup = !options.popup;
                    options.showExplorer = false;
                    options.showInspector = true;
                    options.inspectorWidth = options.popup ? "100%" : "300px";
                    Inspector.Show(scene, options);
                }, onClose: () => {
                    ReactDOM.unmountComponentAtNode(this._ActionTabsHost!);
                    Inspector._OpenedPane--;
                    this._Cleanup();
                    if (options.popup) {
                        this._ActionTabsWindow.close();
                    } else if (!options.overlay) {
                        if (this._ActionTabsHost) {
                            this._ActionTabsHost.style.width = "0";
                        }
                    }

                }, onPropertyChangedObservable: Inspector.OnPropertyChangedObservable
            });
            ReactDOM.render(actionTabsElement, this._ActionTabsHost);
        }
    }

    private static _CreateEmbedHost(scene: Scene, options: IInternalInspectorOptions, parentControl: Nullable<HTMLElement>, onSelectionChangeObservable: Observable<string>) {


        if (!options.embedHostRoot) {
            // Prepare the inspector host
            if (parentControl) {
                const host = parentControl.ownerDocument!.createElement("div");

                host.id = "embed-host";
                host.style.width = options.embedHostWidth || "300px";

                parentControl.appendChild(host);

                this._EmbedHost = host;
            }
        } else {
            this._EmbedHost = options.embedHostRoot;
        }

        if (this._EmbedHost) {
            const embedHostElement = React.createElement(EmbedHostComponent, {
                onSelectionChangeObservable: onSelectionChangeObservable, scene: scene, popupMode: options.popup, onPopup: () => {
                    ReactDOM.unmountComponentAtNode(this._EmbedHost!);

                    if (options.popup) {
                        this._EmbedHostWindow.close();
                    }

                    options.popup = !options.popup;
                    options.embedMode = true;
                    options.showExplorer = true;
                    options.showInspector = true;
                    options.embedHostWidth = options.popup ? "100%" : "auto";
                    Inspector.Show(scene, options);
                }, onClose: () => {
                    ReactDOM.unmountComponentAtNode(this._EmbedHost!);

                    this._OpenedPane = 0;
                    this._Cleanup();
                    if (options.popup) {
                        this._EmbedHostWindow.close();
                    }
                }
            });
            ReactDOM.render(embedHostElement, this._EmbedHost);
        }
    }
    private static _CreatePopup(title: string, windowVariableName: string) {
        const windowCreationOptionsList = {
            width: 300,
            height: 800,
            top: (window.innerHeight - 800) / 2 + window.screenY,
            left: (window.innerWidth - 300) / 2 + window.screenX
        };

        var windowCreationOptions = Object.keys(windowCreationOptionsList)
            .map(
                (key) => key + '=' + (windowCreationOptionsList as any)[key]
            )
            .join(',');

        const popupWindow = window.open("", title, windowCreationOptions);
        if (!popupWindow) {
            return null;
        }

        const parentDocument = popupWindow.document;

        parentDocument.title = title;
        parentDocument.body.style.width = "100%";
        parentDocument.body.style.height = "100%";
        parentDocument.body.style.margin = "0";
        parentDocument.body.style.padding = "0";

        let parentControl = parentDocument.createElement("div");
        parentControl.style.width = "100%";
        parentControl.style.height = "100%";
        parentControl.style.margin = "0";
        parentControl.style.padding = "0";

        popupWindow.document.body.appendChild(parentControl);

        this._CopyStyles(window.document, parentDocument);

        (this as any)[windowVariableName] = popupWindow;

        return parentControl;
    }

    public static Show(scene: Scene, userOptions: Partial<IInspectorOptions>) {

        const options: IInternalInspectorOptions = {
            original: true,
            popup: false,
            overlay: false,
            showExplorer: true,
            showInspector: true,
            embedMode: false,
            handleResize: true,
            enablePopup: true,
            inspectorWidth: "auto",
            explorerWidth: "auto",
            embedHostWidth: "auto",
            ...userOptions
        };

        if (!scene) {
            scene = BABYLON.Engine.LastCreatedScene!;
        }

        this._Scene = scene;

        var canvas = scene ? scene.getEngine().getRenderingCanvas() : BABYLON.Engine.LastCreatedEngine!.getRenderingCanvas();

        if (options.embedMode && options.showExplorer && options.showInspector) {
            if (options.popup) {
                this._CreateEmbedHost(scene, options, this._CreatePopup("INSPECTOR", "_EmbedHostWindow"), Inspector.OnSelectionChangeObservable);
            }
            else {
                let parentControl = options.embedHostRoot ? options.embedHostRoot.parentElement : canvas!.parentElement;
                this._CreateEmbedHost(scene, options, parentControl, Inspector.OnSelectionChangeObservable);
            }
        }
        else if (options.popup) {
            if (options.showExplorer) {
                if (this._SceneExplorerHost) {
                    this._SceneExplorerHost.style.width = "0";
                }
                this._CreateSceneExplorer(scene, options, this._CreatePopup("SCENE EXPLORER", "_SceneExplorerWindow"), Inspector.OnSelectionChangeObservable);
            }
            if (options.showInspector) {
                if (this._ActionTabsHost) {
                    this._ActionTabsHost.style.width = "0";
                }
                this._CreateActionTabs(scene, options, this._CreatePopup("INSPECTOR", "_ActionTabsWindow"), Inspector.OnSelectionChangeObservable);
            }
        } else {
            let parentControl = (options.actionTabsRoot ? options.actionTabsRoot.parentElement : canvas!.parentElement) as HTMLElement;

            if (!options.overlay && !this._NewCanvasContainer) {

                // Create a container for previous elements
                parentControl.style.display = "grid";
                parentControl.style.gridTemplateColumns = "auto 1fr auto";
                parentControl.style.gridTemplateRows = "100%";

                this._NewCanvasContainer = parentControl.ownerDocument!.createElement("div");

                while (parentControl.childElementCount > 0) {
                    var child = parentControl.childNodes[0];
                    parentControl.removeChild(child);
                    this._NewCanvasContainer.appendChild(child);
                }

                parentControl.appendChild(this._NewCanvasContainer);

                this._NewCanvasContainer.style.gridRow = "1";
                this._NewCanvasContainer.style.gridColumn = "2";
                this._NewCanvasContainer.style.width = "100%";
                this._NewCanvasContainer.style.height = "100%";

                if (options.handleResize && scene) {
                    this._OnBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
                        scene.getEngine().resize();
                    });
                }
            }

            if (options.showExplorer) {
                if (options.sceneExplorerRoot && !options.overlay) {
                    options.sceneExplorerRoot.style.width = "auto";
                }

                this._CreateSceneExplorer(scene, options, parentControl, Inspector.OnSelectionChangeObservable);
            }

            if (options.showInspector) {
                if (options.actionTabsRoot && !options.overlay) {
                    options.actionTabsRoot.style.width = "auto";
                }

                this._CreateActionTabs(scene, options, parentControl, Inspector.OnSelectionChangeObservable);
            }
        }
    }

    private static _Cleanup() {
        if (Inspector._OpenedPane === 0 && this._OnBeforeRenderObserver && this._Scene) {
            this._Scene.onBeforeRenderObservable.remove(this._OnBeforeRenderObserver);
            this._OnBeforeRenderObserver = null;

            this._Scene.getEngine().resize();
        }
    }

    public static Hide() {
        if (this._ActionTabsHost) {
            ReactDOM.unmountComponentAtNode(this._ActionTabsHost);
            this._ActionTabsHost = null;
        }

        if (this._SceneExplorerHost) {
            ReactDOM.unmountComponentAtNode(this._SceneExplorerHost);
            this._SceneExplorerHost = null;
        }

        if (this._EmbedHost) {
            ReactDOM.unmountComponentAtNode(this._EmbedHost);
            this._EmbedHost = null;
        }

        Inspector._OpenedPane = 0;
        this._Cleanup();
    }
}