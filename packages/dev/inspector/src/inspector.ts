import * as React from "react";
import type { Root } from "react-dom/client";
import { createRoot } from "react-dom/client";

import type { IInspectorOptions } from "core/Debug/debugLayer";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Observable } from "core/Misc/observable";
import { EngineStore } from "core/Engines/engineStore";
import type { Scene } from "core/scene";
import { SceneLoader } from "core/Loading/sceneLoader";

import { ActionTabsComponent } from "./components/actionTabs/actionTabsComponent";
import { SceneExplorerComponent } from "./components/sceneExplorer/sceneExplorerComponent";
import { EmbedHostComponent } from "./components/embedHost/embedHostComponent";
import type { PropertyChangedEvent } from "./components/propertyChangedEvent";
import { GlobalState } from "./components/globalState";
import type { IPopupComponentProps } from "./components/popupComponent";
import { PopupComponent } from "./components/popupComponent";
import { CopyStyles } from "shared-ui-components/styleHelper";
import { CreatePopup } from "shared-ui-components/popupHelper";

interface IInternalInspectorOptions extends IInspectorOptions {
    popup: boolean;
    original: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
}

export interface IPersistentPopupConfiguration {
    props: IPopupComponentProps;
    children: React.ReactNode;
    closeWhenSceneExplorerCloses?: boolean;
    closeWhenActionTabsCloses?: boolean;
}

export class Inspector {
    private static _SceneExplorerHost: Nullable<HTMLElement>;
    private static _ActionTabsHost: Nullable<HTMLElement>;
    private static _EmbedHost: Nullable<HTMLElement>;
    private static _PersistentPopupHost: Nullable<HTMLElement>;
    private static _SceneExplorerRoot: Nullable<Root>;
    private static _ActionTabsRoot: Nullable<Root>;
    private static _EmbedHostRoot: Nullable<Root>;
    private static _PersistentPopupRoot: Nullable<Root>;
    private static _NewCanvasContainer: Nullable<HTMLElement>;
    private static _SceneExplorerWindow: Window;
    private static _ActionTabsWindow: Window;
    private static _EmbedHostWindow: Window;

    private static _Scene: Scene;
    private static _OpenedPane = 0;
    private static _OnBeforeRenderObserver: Nullable<Observer<Scene>>;

    private static _OnSceneExplorerClosedObserver: Nullable<Observer<void>>;
    private static _OnActionTabsClosedObserver: Nullable<Observer<void>>;

    public static OnSelectionChangeObservable = new Observable<any>();
    public static OnPropertyChangedObservable = new Observable<PropertyChangedEvent>();
    private static _GlobalState = new GlobalState();

    public static MarkLineContainerTitleForHighlighting(title: string) {
        this._GlobalState.selectedLineContainerTitles = [];
        this._GlobalState.selectedLineContainerTitles.push(title);
    }

    public static MarkMultipleLineContainerTitlesForHighlighting(titles: string[]) {
        this._GlobalState.selectedLineContainerTitles = [];
        this._GlobalState.selectedLineContainerTitles.push(...titles);
    }

    private static _SceneExplorerOptions: Nullable<IInternalInspectorOptions> = null;
    private static _InspectorOptions: Nullable<IInternalInspectorOptions> = null;
    private static _EmbedOptions: Nullable<IInternalInspectorOptions> = null;

    public static PopupEmbed() {
        const scene = this._Scene;
        const options = this._EmbedOptions;

        if (!options) {
            return;
        }
        this._EmbedHostRoot?.unmount();

        if (options.popup) {
            this._EmbedHostWindow.close();
        }

        this._RemoveElementFromDOM(this._EmbedHost);

        options.popup = !options.popup;
        options.embedMode = true;
        options.showExplorer = true;
        options.showInspector = true;
        options.embedHostWidth = options.popup ? "100%" : "auto";
        Inspector.Show(scene, options);
    }

    public static PopupSceneExplorer() {
        const scene = this._Scene;
        const options = this._SceneExplorerOptions;

        if (!options) {
            return;
        }

        this._SceneExplorerRoot?.unmount();

        this._RemoveElementFromDOM(this._SceneExplorerHost);

        if (options.popup) {
            this._SceneExplorerWindow.close();
        }

        options.popup = !options.popup;
        options.showExplorer = true;
        options.showInspector = false;
        options.explorerWidth = options.popup ? "100%" : "300px";
        Inspector.Show(scene, options);
    }

    public static PopupInspector() {
        const scene = this._Scene;
        const options = this._InspectorOptions;

        if (!options) {
            return;
        }

        this._ActionTabsRoot?.unmount();

        this._RemoveElementFromDOM(this._ActionTabsHost);

        if (options.popup) {
            this._ActionTabsWindow.close();
        }

        options.popup = !options.popup;
        options.showExplorer = false;
        options.showInspector = true;
        options.inspectorWidth = options.popup ? "100%" : "300px";
        Inspector.Show(scene, options);
    }

    private static _CreateSceneExplorer(scene: Scene, options: IInternalInspectorOptions, parentControlExplorer: Nullable<HTMLElement>) {
        // Duplicating the options as they can be different for each pane
        if (options.original) {
            options = {
                original: false,
                popup: options.popup,
                overlay: options.overlay,
                showExplorer: options.showExplorer,
                showInspector: options.showInspector,
                additionalNodes: options.additionalNodes,
                embedMode: options.embedMode,
                handleResize: options.handleResize,
                enablePopup: options.enablePopup,
                enableClose: options.enableClose,
                explorerExtensibility: options.explorerExtensibility,
                gizmoCamera: options.gizmoCamera,
                contextMenu: options.contextMenu,
                contextMenuOverride: options.contextMenuOverride,
            };
        }
        this._EmbedOptions = null;
        this._SceneExplorerOptions = options;

        // Prepare the scene explorer host
        if (parentControlExplorer) {
            this._SceneExplorerHost = parentControlExplorer.ownerDocument!.createElement("div");

            this._SceneExplorerHost.id = "scene-explorer-host";
            this._SceneExplorerHost.style.width = options.explorerWidth || "auto";

            if (!options.popup) {
                parentControlExplorer.insertBefore(this._SceneExplorerHost, this._NewCanvasContainer);
            } else {
                parentControlExplorer.appendChild(this._SceneExplorerHost);
            }

            if (!options.overlay) {
                this._SceneExplorerHost.style.position = "relative";
            }
        }

        // Scene
        if (this._SceneExplorerHost) {
            this._SceneExplorerRoot = createRoot(this._SceneExplorerHost);
            const sceneExplorerElement = React.createElement(SceneExplorerComponent, {
                scene,
                contextMenu: options.contextMenu,
                contextMenuOverride: options.contextMenuOverride,
                gizmoCamera: options.gizmoCamera,
                globalState: this._GlobalState,
                extensibilityGroups: options.explorerExtensibility,
                additionalNodes: options.additionalNodes,
                noClose: !options.enableClose,
                noExpand: !options.enablePopup,
                popupMode: options.popup,
                onPopup: () => {
                    this.PopupSceneExplorer();
                },
                onClose: () => {
                    this._SceneExplorerRoot!.unmount();
                    Inspector._OpenedPane--;

                    this._RemoveElementFromDOM(this._SceneExplorerHost);

                    this._Cleanup();

                    if (options.popup) {
                        this._SceneExplorerWindow.close();
                    }

                    this._GlobalState.onSceneExplorerClosedObservable.notifyObservers();
                },
            });
            this._SceneExplorerRoot.render(sceneExplorerElement);
            setTimeout(() => {
                this._OpenedPane++;
            });
        }
    }

    private static _CreateActionTabs(scene: Scene, options: IInternalInspectorOptions, parentControlActions: Nullable<HTMLElement>) {
        options.original = false;

        this._EmbedOptions = null;
        this._InspectorOptions = options;

        // Prepare the inspector host
        if (parentControlActions) {
            const host = parentControlActions.ownerDocument!.createElement("div");

            host.id = "inspector-host";
            host.style.width = options.inspectorWidth || "auto";

            parentControlActions.appendChild(host);

            this._ActionTabsHost = host;

            if (!options.overlay) {
                this._ActionTabsHost.style.position = "relative";
            }
        }

        if (this._ActionTabsHost) {
            this._ActionTabsRoot = createRoot(this._ActionTabsHost);
            const actionTabsElement = React.createElement(ActionTabsComponent, {
                globalState: this._GlobalState,
                scene: scene,
                noClose: !options.enableClose,
                noExpand: !options.enablePopup,
                popupMode: options.popup,
                onPopup: () => {
                    this.PopupInspector();
                },
                onClose: () => {
                    this._ActionTabsRoot!.unmount();
                    Inspector._OpenedPane--;
                    this._Cleanup();

                    this._RemoveElementFromDOM(this._ActionTabsHost);

                    if (options.popup) {
                        this._ActionTabsWindow.close();
                    }

                    this._GlobalState.onActionTabsClosedObservable.notifyObservers();
                },
                initialTab: options.initialTab,
            });
            this._ActionTabsRoot.render(actionTabsElement);
            setTimeout(() => {
                this._OpenedPane++;
            });
        }
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private static _CreateEmbedHost(scene: Scene, options: IInternalInspectorOptions, parentControl: Nullable<HTMLElement>, onSelectionChangedObservable: Observable<string>) {
        this._EmbedOptions = options;
        this._SceneExplorerOptions = null;
        this._InspectorOptions = null;
        // Prepare the inspector host
        if (parentControl) {
            const host = parentControl.ownerDocument!.createElement("div");

            host.id = "embed-host";
            host.style.width = options.embedHostWidth || "auto";

            parentControl.appendChild(host);

            this._EmbedHost = host;

            if (!options.overlay) {
                this._EmbedHost.style.position = "relative";
            }
        }

        if (this._EmbedHost) {
            this._EmbedHostRoot = createRoot(this._EmbedHost);
            const embedHostElement = React.createElement(EmbedHostComponent, {
                globalState: this._GlobalState,
                scene: scene,
                extensibilityGroups: options.explorerExtensibility,
                additionalNodes: options.additionalNodes,
                noExpand: !options.enablePopup,
                noClose: !options.enableClose,
                popupMode: options.popup,
                onPopup: () => {
                    this.PopupEmbed();
                },
                onClose: () => {
                    this._EmbedHostRoot!.unmount();

                    this._OpenedPane = 0;
                    this._Cleanup();

                    this._RemoveElementFromDOM(this._EmbedHost);

                    if (options.popup) {
                        this._EmbedHostWindow.close();
                    }

                    this._GlobalState.onSceneExplorerClosedObservable.notifyObservers();
                    this._GlobalState.onActionTabsClosedObservable.notifyObservers();
                },
                initialTab: options.initialTab,
            });
            this._EmbedHostRoot.render(embedHostElement);
            setTimeout(() => {
                this._OpenedPane++;
            });
        }
    }

    public static get IsVisible(): boolean {
        return this._OpenedPane > 0;
    }

    public static EarlyAttachToLoader() {
        if (!this._GlobalState.onPluginActivatedObserver) {
            this._GlobalState.onPluginActivatedObserver = SceneLoader.OnPluginActivatedObservable.add((rawLoader) => {
                this._GlobalState.resetGLTFValidationResults();

                const loader = rawLoader as import("loaders/glTF/index").GLTFFileLoader;
                if (loader.name === "gltf") {
                    this._GlobalState.prepareGLTFPlugin(loader);
                }
            });
        }
    }

    public static Show(scene: Scene, userOptions: Partial<IInspectorOptions>) {
        const options: IInternalInspectorOptions = {
            original: true,
            popup: false,
            overlay: false,
            showExplorer: true,
            showInspector: true,
            embedMode: false,
            enableClose: true,
            handleResize: true,
            enablePopup: true,
            ...userOptions,
        };

        // load the font, unless asked to skip it
        if (!options.skipDefaultFontLoading && !(globalThis as any)?.BABYLON_SKIP_FONT_LOADING) {
            const font = document.createElement("link");
            font.rel = "stylesheet";
            font.href = "https://use.typekit.net/cta4xsb.css";
            document.head.appendChild(font);
        }

        // Prepare state
        if (!this._GlobalState.onPropertyChangedObservable) {
            this._GlobalState.init(this.OnPropertyChangedObservable);
        }
        if (!this._GlobalState.onSelectionChangedObservable) {
            this._GlobalState.onSelectionChangedObservable = this.OnSelectionChangeObservable;
        }

        // Make sure it is not already opened
        if (this.IsVisible && options.original) {
            this.Hide();
        }

        if (!scene) {
            scene = EngineStore.LastCreatedScene!;
        }

        this._Scene = scene;

        const rootElement = scene ? scene.getEngine().getInputElement() : EngineStore.LastCreatedEngine!.getInputElement();

        if (options.embedMode && options.showExplorer && options.showInspector) {
            if (options.popup) {
                this._CreateEmbedHost(
                    scene,
                    options,
                    CreatePopup("INSPECTOR", { onWindowCreateCallback: (w) => (this._EmbedHostWindow = w) }),
                    Inspector.OnSelectionChangeObservable
                );
                this._EmbedHostWindow.addEventListener("beforeunload", () => this._GlobalState.onSceneExplorerClosedObservable.notifyObservers());
                this._EmbedHostWindow.addEventListener("beforeunload", () => this._GlobalState.onActionTabsClosedObservable.notifyObservers());
            } else {
                if (!rootElement) {
                    return;
                }
                let parentControl = (options.globalRoot ? options.globalRoot : rootElement.parentElement) as HTMLElement;

                if (!options.overlay && !this._NewCanvasContainer) {
                    this._CreateCanvasContainer(parentControl);
                } else if (!options.overlay && this._NewCanvasContainer && this._NewCanvasContainer.parentElement) {
                    // the root is now the parent of the canvas container
                    parentControl = this._NewCanvasContainer.parentElement;
                }

                if (this._NewCanvasContainer) {
                    // If we move things around, let's control the resize
                    if (options.handleResize && scene) {
                        this._OnBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
                            scene.getEngine().resize();
                        });
                    }
                }

                this._CreateEmbedHost(scene, options, parentControl, Inspector.OnSelectionChangeObservable);
            }
        } else if (options.popup) {
            if (options.showExplorer) {
                if (this._SceneExplorerHost) {
                    this._SceneExplorerHost.style.width = "0";
                }
                this._CreateSceneExplorer(scene, options, CreatePopup("SCENE EXPLORER", { onWindowCreateCallback: (w) => (this._SceneExplorerWindow = w) }));
                this._SceneExplorerWindow.addEventListener("beforeunload", () => this._GlobalState.onSceneExplorerClosedObservable.notifyObservers());
            }
            if (options.showInspector) {
                if (this._ActionTabsHost) {
                    this._ActionTabsHost.style.width = "0";
                }
                this._CreateActionTabs(scene, options, CreatePopup("INSPECTOR", { onWindowCreateCallback: (w) => (this._ActionTabsWindow = w) }));
                this._ActionTabsWindow.addEventListener("beforeunload", () => this._GlobalState.onActionTabsClosedObservable.notifyObservers());
            }
        } else {
            let parentControl = (options.globalRoot ? options.globalRoot : rootElement!.parentElement) as HTMLElement;

            if (!options.overlay && !this._NewCanvasContainer) {
                this._CreateCanvasContainer(parentControl);
            } else if (!options.overlay && this._NewCanvasContainer && this._NewCanvasContainer.parentElement) {
                // the root is now the parent of the canvas container
                parentControl = this._NewCanvasContainer.parentElement;
            }

            if (this._NewCanvasContainer) {
                // If we move things around, let's control the resize
                if (options.handleResize && scene) {
                    this._OnBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
                        scene.getEngine().resize();
                    });
                }
            }

            if (options.showExplorer) {
                this._CreateSceneExplorer(scene, options, parentControl);
            }

            if (options.showInspector) {
                this._CreateActionTabs(scene, options, parentControl);
            }
        }
    }

    public static _SetNewScene(scene: Scene) {
        this._Scene = scene;
        this._GlobalState.onNewSceneObservable.notifyObservers(scene);
    }

    public static _CreateCanvasContainer(parentControl: HTMLElement) {
        // If the parent control element's root is not the document (such as the ShadowRoot of the Babylon Viewer),
        // we need to copy the styles from the document to the parent control's root.
        if (parentControl.getRootNode() !== window.document) {
            setTimeout(() => {
                CopyStyles(window.document, parentControl.getRootNode() as unknown as DocumentOrShadowRoot);
            }, 0);
        }

        // Create a container for previous elements
        this._NewCanvasContainer = parentControl.ownerDocument!.createElement("div");
        this._NewCanvasContainer.style.display = parentControl.style.display;
        parentControl.style.display = "flex";

        while (parentControl.childElementCount > 0) {
            const child = parentControl.childNodes[0];
            parentControl.removeChild(child);
            this._NewCanvasContainer.appendChild(child);
        }

        parentControl.appendChild(this._NewCanvasContainer);

        this._NewCanvasContainer.style.width = "100%";
        this._NewCanvasContainer.style.height = "100%";
    }

    private static _DestroyCanvasContainer() {
        if (!this._NewCanvasContainer) {
            return;
        }
        const parentControl = this._NewCanvasContainer.parentElement!;

        while (this._NewCanvasContainer.childElementCount > 0) {
            const child = this._NewCanvasContainer.childNodes[0];
            this._NewCanvasContainer.removeChild(child);
            parentControl.appendChild(child);
        }

        parentControl.removeChild(this._NewCanvasContainer);
        parentControl.style.display = this._NewCanvasContainer.style.display;
        this._NewCanvasContainer = null;
    }

    private static _Cleanup() {
        if (Inspector._OpenedPane !== 0) {
            return;
        }

        // Gizmo disposal
        for (const g of this._GlobalState.lightGizmos) {
            if (g.light) {
                this._GlobalState.enableLightGizmo(g.light, false);
            }
        }
        for (const g of this._GlobalState.cameraGizmos) {
            if (g.camera) {
                this._GlobalState.enableCameraGizmo(g.camera, false);
            }
        }
        if (this._Scene && this._Scene.reservedDataStore && this._Scene.reservedDataStore.gizmoManager) {
            this._Scene.reservedDataStore.gizmoManager.dispose();
            this._Scene.reservedDataStore.gizmoManager = null;
        }

        if (this._NewCanvasContainer) {
            this._DestroyCanvasContainer();
        }

        if (this._OnBeforeRenderObserver && this._Scene) {
            this._Scene.onBeforeRenderObservable.remove(this._OnBeforeRenderObserver);
            this._OnBeforeRenderObserver = null;

            this._Scene.getEngine().resize();
        }

        this._GlobalState.onInspectorClosedObservable.notifyObservers(this._Scene);
    }

    private static _RemoveElementFromDOM(element: Nullable<HTMLElement>) {
        if (element && element.parentElement) {
            element.parentElement.removeChild(element);
        }
    }

    public static Hide() {
        if (this._ActionTabsHost && this._ActionTabsRoot) {
            this._ActionTabsRoot.unmount();

            this._RemoveElementFromDOM(this._ActionTabsHost);

            this._ActionTabsHost = null;
            this._ActionTabsRoot = null;
            this._GlobalState.onActionTabsClosedObservable.notifyObservers();
        }

        if (this._SceneExplorerHost && this._SceneExplorerRoot) {
            this._SceneExplorerRoot.unmount();

            if (this._SceneExplorerHost.parentElement) {
                this._SceneExplorerHost.parentElement.removeChild(this._SceneExplorerHost);
            }

            this._SceneExplorerHost = null;
            this._SceneExplorerRoot = null;
            this._GlobalState.onSceneExplorerClosedObservable.notifyObservers();
        }

        if (this._EmbedHost && this._EmbedHostRoot) {
            this._EmbedHostRoot.unmount();

            if (this._EmbedHost.parentElement) {
                this._EmbedHost.parentElement.removeChild(this._EmbedHost);
            }
            this._EmbedHost = null;
            this._EmbedHostRoot = null;
            this._GlobalState.onActionTabsClosedObservable.notifyObservers();
            this._GlobalState.onSceneExplorerClosedObservable.notifyObservers();
        }

        if (this._EmbedHostWindow && !this._EmbedHostWindow.closed) {
            this._EmbedHostWindow.close();
        }

        Inspector._OpenedPane = 0;
        this._Cleanup();

        if (!this._GlobalState.onPluginActivatedObserver) {
            SceneLoader.OnPluginActivatedObservable.remove(this._GlobalState.onPluginActivatedObserver);
            this._GlobalState.onPluginActivatedObserver = null;
        }
    }

    public static _CreatePersistentPopup(config: IPersistentPopupConfiguration, hostElement: HTMLElement) {
        if (this._PersistentPopupHost) {
            this._ClosePersistentPopup();
        }

        this._PersistentPopupHost = hostElement.ownerDocument.createElement("div");
        this._PersistentPopupRoot = createRoot(this._PersistentPopupHost);
        const popupElement = React.createElement(PopupComponent, config.props, config.children);
        this._PersistentPopupRoot.render(popupElement);

        if (config.closeWhenSceneExplorerCloses) {
            this._OnSceneExplorerClosedObserver = this._GlobalState.onSceneExplorerClosedObservable.add(() => this._ClosePersistentPopup());
        }
        if (config.closeWhenActionTabsCloses) {
            this._OnActionTabsClosedObserver = this._GlobalState.onActionTabsClosedObservable.add(() => this._ClosePersistentPopup());
        }
    }

    public static _ClosePersistentPopup() {
        if (this._PersistentPopupHost && this._PersistentPopupRoot) {
            this._PersistentPopupRoot.unmount();
            this._PersistentPopupHost.remove();
            this._PersistentPopupHost = null;
            this._PersistentPopupRoot = null;
        }
        if (this._OnSceneExplorerClosedObserver) {
            this._GlobalState.onSceneExplorerClosedObservable.remove(this._OnSceneExplorerClosedObserver);
            this._OnSceneExplorerClosedObserver = null;
        }
        if (this._OnActionTabsClosedObserver) {
            this._GlobalState.onActionTabsClosedObservable.remove(this._OnActionTabsClosedObserver);
            this._OnActionTabsClosedObserver = null;
        }
    }
}

Inspector.EarlyAttachToLoader();
