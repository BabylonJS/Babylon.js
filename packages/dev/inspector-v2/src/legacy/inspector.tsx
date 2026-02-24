import type { IInspectorContextMenuItem, IInspectorContextMenuType, IInspectorOptions as InspectorV1Options, Nullable, Scene } from "core/index";
import type { InspectorToken, InspectorOptions as InspectorV2Options } from "../inspector";
import type { WeaklyTypedServiceDefinition } from "../modularity/serviceContainer";
import type { ServiceDefinition } from "../modularity/serviceDefinition";
import type { IGizmoService } from "../services/gizmoService";
import type { IPropertiesService } from "../services/panes/properties/propertiesService";
import type { ISceneExplorerService } from "../services/panes/scene/sceneExplorerService";
import type { ISelectionService } from "../services/selectionService";
import type { IShellService } from "../services/shellService";
import type { IWatcherService } from "../services/watcherService";

import { BranchRegular } from "@fluentui/react-icons";

import { DebugLayerTab } from "core/Debug/debugLayer";
import { EngineStore } from "core/Engines/engineStore";
import { Observable } from "core/Misc/observable";
import { ShowInspector } from "../inspector";
import { GizmoServiceIdentity } from "../services/gizmoService";
import { PropertiesServiceIdentity } from "../services/panes/properties/propertiesService";
import { SceneExplorerServiceIdentity } from "../services/panes/scene/sceneExplorerService";
import { SelectionServiceIdentity } from "../services/selectionService";
import { ShellServiceIdentity } from "../services/shellService";
import { WatcherServiceIdentity } from "../services/watcherService";
import { LegacyPropertiesSectionMapping } from "./propertiesSectionMapping";

type PropertyChangedEvent = {
    object: any;
    property: string;
    value: any;
    initialValue: any;
    allowNullValue?: boolean;
};

/**
 * Converts Inspector v1 options to Inspector v2 options.
 * @param v1Options Inspector v1 options.
 * @returns Inspector v2 options.
 */
export function ConvertOptions(v1Options: Partial<InspectorV1Options>): Partial<InspectorV2Options> {
    // Options not currently handled:
    // • enablePopup: Do users care about this one?
    // • enableClose: Currently Inspector v2 does not allow panes/tabs to be closed.
    // • skipDefaultFontLoading: Probably doesn't make sense for Inspector v2 using Fluent.
    // • contextMenuOverride: Currently there are no default section context menu items to override.
    //                        If the create extension ends up adding context menu items to match v1
    //                        behavior, then it should only enable that feature if contextMenuOverride
    //                        is not set to true.

    v1Options = {
        overlay: false,
        showExplorer: true,
        showInspector: true,
        embedMode: false,
        enableClose: true,
        handleResize: true,
        enablePopup: true,
        ...v1Options,
    };

    const serviceDefinitions: WeaklyTypedServiceDefinition[] = [];

    if (v1Options.initialTab) {
        const paneKey: string = (() => {
            switch (v1Options.initialTab) {
                case DebugLayerTab.Debug:
                    return "Debug";
                case DebugLayerTab.Statistics:
                    return "Statistics";
                case DebugLayerTab.Settings:
                    return "Settings";
                case DebugLayerTab.Tools:
                    return "Tools";
            }
        })();

        const initialTabServiceDefinition: ServiceDefinition<[], [IShellService]> = {
            friendlyName: "Initial Tab Selector (Backward Compatibility)",
            consumes: [ShellServiceIdentity],
            factory: (shellService) => {
                // Just find and select the requested initial tab.
                shellService.sidePanes.find((pane) => pane.key === paneKey)?.select();
            },
        };
        serviceDefinitions.push(initialTabServiceDefinition);
    }

    if (v1Options.gizmoCamera) {
        const { gizmoCamera } = v1Options;
        const gizmoCameraServiceDefinition: ServiceDefinition<[], [IGizmoService]> = {
            friendlyName: "Gizmo Camera (Backward Compatibility)",
            consumes: [GizmoServiceIdentity],
            factory: (gizmoService) => {
                // As a simple back compat solution, just keep the utility layer alive until Inspector is unloaded.
                // This way we don't need to keep re-assigning the gizmo camera to the utility layer if it is recreated.
                const utilityLayerRef = gizmoService.getUtilityLayer(gizmoCamera.getScene());
                utilityLayerRef.value.setRenderCamera(gizmoCamera);
                return {
                    dispose: () => utilityLayerRef.dispose(),
                };
            },
        };
        serviceDefinitions.push(gizmoCameraServiceDefinition);
    }

    if (v1Options.additionalNodes && v1Options.additionalNodes.length > 0) {
        const { additionalNodes } = v1Options;
        const additionalNodesServiceDefinition: ServiceDefinition<[], [ISceneExplorerService, IWatcherService]> = {
            friendlyName: "Additional Nodes (Backward Compatibility)",
            consumes: [SceneExplorerServiceIdentity, WatcherServiceIdentity],
            factory: (sceneExplorerService, watcherService) => {
                const sceneExplorerSectionRegistrations = additionalNodes.map((node) =>
                    sceneExplorerService.addSection({
                        displayName: node.name,
                        order: Number.MAX_SAFE_INTEGER,
                        getRootEntities: () => node.getContent(),
                        getEntityDisplayInfo: (entity) => {
                            const onChangeObservable = new Observable<void>();

                            const nameHookToken = watcherService.watchProperty(entity, "name", () => onChangeObservable.notifyObservers());

                            return {
                                get name() {
                                    return entity.name;
                                },
                                onChange: onChangeObservable,
                                dispose: () => {
                                    nameHookToken.dispose();
                                    onChangeObservable.clear();
                                },
                            };
                        },
                        entityIcon: () => <BranchRegular />,
                        getEntityAddedObservables: () => [],
                        getEntityRemovedObservables: () => [],
                    })
                );

                return {
                    dispose: () => {
                        sceneExplorerSectionRegistrations.forEach((registration) => registration.dispose());
                    },
                };
            },
        };
        serviceDefinitions.push(additionalNodesServiceDefinition);
    }

    if (v1Options.explorerExtensibility && v1Options.explorerExtensibility.length > 0) {
        const { explorerExtensibility } = v1Options;
        const explorerExtensibilityServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
            friendlyName: "Explorer Extensibility (Backward Compatibility)",
            consumes: [SceneExplorerServiceIdentity],
            factory: (sceneExplorerService) => {
                const sceneExplorerCommandRegistrations = explorerExtensibility.flatMap((command) =>
                    command.entries.map((entry) =>
                        sceneExplorerService.addEntityCommand({
                            predicate: (entity): entity is object => typeof entity === "object" && command.predicate(entity),
                            getCommand: (entity) => {
                                return {
                                    displayName: entry.label,
                                    type: "action",
                                    mode: "contextMenu",
                                    execute: () => entry.action(entity),
                                };
                            },
                        })
                    )
                );

                return {
                    dispose: () => {
                        sceneExplorerCommandRegistrations.forEach((registration) => registration.dispose());
                    },
                };
            },
        };
        serviceDefinitions.push(explorerExtensibilityServiceDefinition);
    }

    if (v1Options.contextMenu) {
        const { contextMenu } = v1Options;
        const sections = Object.entries(contextMenu) as [IInspectorContextMenuType, IInspectorContextMenuItem[]][];
        if (sections.length > 0) {
            const legacySectionMapping = {
                pipeline: "Rendering Pipelines",
                node: "Nodes",
                materials: "Materials",
                spriteManagers: "Sprite Managers",
                particleSystems: "Particle Systems",
                frameGraphs: "Frame Graphs",
            } as const satisfies Record<IInspectorContextMenuType, string>;

            const sectionContextMenuServiceDefinition: ServiceDefinition<[], [ISceneExplorerService]> = {
                friendlyName: "Context Menu (Backward Compatibility)",
                consumes: [SceneExplorerServiceIdentity],
                factory: (sceneExplorerService) => {
                    const sceneExlplorerCommandRegistrations = sections.flatMap(([sectionName, entries]) =>
                        entries.map((entry) =>
                            sceneExplorerService.addSectionCommand({
                                predicate: (section): section is (typeof legacySectionMapping)[IInspectorContextMenuType] => legacySectionMapping[sectionName] === section,
                                getCommand: () => {
                                    return {
                                        displayName: entry.label,
                                        type: "action",
                                        mode: "contextMenu",
                                        execute: () => entry.action(),
                                    };
                                },
                            })
                        )
                    );

                    return {
                        dispose: () => {
                            sceneExlplorerCommandRegistrations.forEach((registration) => registration.dispose());
                        },
                    };
                },
            };
            serviceDefinitions.push(sectionContextMenuServiceDefinition);
        }
    }

    const v2Options: Partial<InspectorV2Options> = {
        containerElement: v1Options.globalRoot,
        layoutMode: v1Options.overlay ? "overlay" : "inline",
        autoResizeEngine: v1Options.handleResize,
        sidePaneRemapper: (sidePane) => {
            if (v1Options.showExplorer === false && sidePane.key === "Scene Explorer") {
                return null;
            }

            if (
                v1Options.showInspector === false &&
                (sidePane.key === "Properties" || sidePane.key === "Debug" || sidePane.key === "Statistics" || sidePane.key === "Settings" || sidePane.key === "Tools")
            ) {
                return null;
            }

            if (v1Options.embedMode) {
                if (sidePane.horizontalLocation === "right") {
                    // All right panes go to right bottom.
                    return {
                        horizontalLocation: "right",
                        verticalLocation: "bottom",
                    };
                } else {
                    // All left panes go to right top.
                    return {
                        horizontalLocation: "right",
                        verticalLocation: "top",
                    };
                }
            }

            return sidePane;
        },
        serviceDefinitions,
    };

    return v2Options;
}

/**
 * @deprecated This class only exists for backward compatibility. Use the module-level ShowInspector function instead.
 */
export class Inspector {
    private static _CurrentInstance: Nullable<{ scene: Scene; options: Partial<InspectorV2Options>; disposeToken: InspectorToken }> = null;
    private static _PopupToggler: Nullable<(side: "left" | "right") => void> = null;
    private static _SidePaneOpenCounter: Nullable<() => number> = null;

    // @ts-expect-error TS6133: This is private, but used by debugLayer (same as Inspector v1).
    private static get _OpenedPane() {
        return this._SidePaneOpenCounter?.() ?? 0;
    }

    public static readonly OnSelectionChangeObservable = new Observable<any>();
    public static readonly OnPropertyChangedObservable = new Observable<PropertyChangedEvent>();
    private static readonly _OnMarkLineContainerObservable = new Observable<string[]>(undefined, true);

    public static MarkLineContainerTitleForHighlighting(title: string) {
        this.MarkMultipleLineContainerTitlesForHighlighting([title]);
    }

    public static MarkMultipleLineContainerTitlesForHighlighting(titles: string[]) {
        this._OnMarkLineContainerObservable.notifyObservers(titles);
    }

    public static PopupEmbed() {
        this._PopupToggler?.("right");
    }

    public static PopupSceneExplorer() {
        this._PopupToggler?.("left");
    }

    public static PopupInspector() {
        this._PopupToggler?.("right");
    }

    public static get IsVisible(): boolean {
        return !!this._CurrentInstance;
    }

    public static Show(scene: Scene, userOptions: Partial<InspectorV1Options>) {
        this._Show(scene, userOptions);
    }

    private static _Show(scene: Nullable<Scene>, userOptions: Partial<InspectorV1Options>) {
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }

        if (!scene || scene.isDisposed) {
            return;
        }

        // Inspector setup is async, so we need to cache pending selection requests.
        // Additionally, we manually track this (rather than relying on the observable's notifyIfTriggered property)
        // for behavior backward compatibility.
        let pendingSelection: any = null;
        const pendingSelectionObserver = this.OnSelectionChangeObservable.add((entity) => {
            pendingSelection = entity;
        });

        let options = ConvertOptions(userOptions);
        const serviceDefinitions: WeaklyTypedServiceDefinition[] = [];

        const popupServiceDefinition: ServiceDefinition<[], [IShellService]> = {
            friendlyName: "Popup Service (Backward Compatibility)",
            consumes: [ShellServiceIdentity],
            factory: (shellService) => {
                this._PopupToggler = (side: "left" | "right") => {
                    const sidePaneContainer = side === "left" ? shellService.leftSidePaneContainer : shellService.rightSidePaneContainer;
                    if (sidePaneContainer) {
                        if (sidePaneContainer.isDocked) {
                            sidePaneContainer.undock();
                        } else {
                            sidePaneContainer.dock();
                        }
                    }
                };

                return {
                    dispose: () => (this._PopupToggler = null),
                };
            },
        };
        serviceDefinitions.push(popupServiceDefinition);

        const selectionChangedServiceDefinition: ServiceDefinition<[], [ISelectionService]> = {
            friendlyName: "Selection Changed Service (Backward Compatibility)",
            consumes: [SelectionServiceIdentity],
            factory: (selectionService) => {
                const selectionServiceObserver = selectionService.onSelectedEntityChanged.add(() => {
                    this.OnSelectionChangeObservable.notifyObservers(selectionService.selectedEntity);
                });

                const legacyObserver = this.OnSelectionChangeObservable.add((entity) => {
                    selectionService.selectedEntity = entity;
                });

                // If a selection was requested before async setup completed, apply it now.
                if (pendingSelection) {
                    selectionService.selectedEntity = pendingSelection;
                    pendingSelection = null;
                }

                // Now the service is alive so we don't need to track pending selection requests.
                pendingSelectionObserver.remove();

                return {
                    dispose: () => {
                        selectionServiceObserver.remove();
                        legacyObserver.remove();
                    },
                };
            },
        };
        serviceDefinitions.push(selectionChangedServiceDefinition);

        const propertyChangedServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
            friendlyName: "Property Changed Service (Backward Compatibility)",
            consumes: [PropertiesServiceIdentity],
            factory: (propertiesService) => {
                const observer = propertiesService.onPropertyChanged.add((changeInfo) => {
                    this.OnPropertyChangedObservable.notifyObservers({
                        object: changeInfo.entity,
                        property: changeInfo.propertyKey.toString(),
                        value: changeInfo.newValue,
                        initialValue: changeInfo.oldValue,
                    });
                });

                return {
                    dispose: () => {
                        observer.remove();
                    },
                };
            },
        };
        serviceDefinitions.push(propertyChangedServiceDefinition);

        const sectionHighlighterServiceDefinition: ServiceDefinition<[], [IPropertiesService]> = {
            friendlyName: "Section Highlighter Service (Backward Compatibility)",
            consumes: [PropertiesServiceIdentity],
            factory: (propertiesService) => {
                const markLineContainerObserver = this._OnMarkLineContainerObservable.add((sections) => {
                    propertiesService.highlightSections(sections.map((id) => (LegacyPropertiesSectionMapping as Record<string, string>)[id] ?? id));
                });

                // Now the service is alive so we don't need to track pending highlight requests.
                this._OnMarkLineContainerObservable.notifyIfTriggered = false;
                this._OnMarkLineContainerObservable.cleanLastNotifiedState();

                return {
                    dispose: () => {
                        // Service is being torn down, so start caching pending highlight requests again.
                        markLineContainerObserver.remove();
                        this._OnMarkLineContainerObservable.notifyIfTriggered = true;
                    },
                };
            },
        };
        serviceDefinitions.push(sectionHighlighterServiceDefinition);

        const openedPanesServiceDefinition: ServiceDefinition<[], [IShellService]> = {
            friendlyName: "Opened Panes Service (Backward Compatibility)",
            consumes: [ShellServiceIdentity],
            factory: (shellService) => {
                this._SidePaneOpenCounter = () => (shellService.leftSidePaneContainer ? 1 : 0) + (shellService.rightSidePaneContainer ? 1 : 0);

                return {
                    dispose: () => {
                        this._SidePaneOpenCounter = null;
                    },
                };
            },
        };
        serviceDefinitions.push(openedPanesServiceDefinition);

        options = {
            ...options,
            serviceDefinitions: [...(options.serviceDefinitions ?? []), ...serviceDefinitions],
        };

        this._CurrentInstance = {
            scene,
            options,
            disposeToken: ShowInspector(scene, options),
        };

        this._CurrentInstance.disposeToken.onDisposed.addOnce(() => (this._CurrentInstance = null));
    }

    public static Hide() {
        this._CurrentInstance?.disposeToken.dispose();
    }

    // @ts-expect-error TS6133: This is private, but used by debugLayer (same as Inspector v1).
    private static _SetNewScene(scene: Scene) {
        if (this._CurrentInstance && this._CurrentInstance.scene !== scene) {
            // TODO: For now, just hide and re-show the Inspector.
            // Need to think more about this when we work on multi-scene support in Inspector v2.
            const options = this._CurrentInstance.options;
            this.Hide();
            this._CurrentInstance = {
                scene,
                options,
                disposeToken: ShowInspector(scene, options),
            };
        }
    }
}
