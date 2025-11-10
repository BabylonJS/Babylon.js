import type { IDisposable, IInspectorOptions as InspectorV1Options, Nullable, Scene } from "core/index";
import type { InspectorOptions as InspectorV2Options } from "./inspector";
import type { WeaklyTypedServiceDefinition } from "./modularity/serviceContainer";
import type { ServiceDefinition } from "./modularity/serviceDefinition";
import type { IShellService } from "./services/shellService";

import { DebugLayerTab } from "core/Debug/debugLayer";
import { EngineStore } from "core/Engines/engineStore";
import { Observable } from "core/Misc/observable";
import { ShowInspector } from "./inspector";
import { ShellServiceIdentity } from "./services/shellService";

type PropertyChangedEvent = {
    object: any;
    property: string;
    value: any;
    initialValue: any;
    allowNullValue?: boolean;
};

export function ConvertOptions(v1Options: Partial<InspectorV1Options>): Partial<InspectorV2Options> {
    // Options not currently handled:
    // • enablePopup: Do users care about this one?
    // • enableClose: Currently Inspector v2 does not allow panes/tabs to be closed.
    // • gizmoCamera: Do users care about this one?
    // • skipDefaultFontLoading: Probably doesn't make sense for Inspector v2 using Fluent.

    // TODO:
    // • explorerExtensibility
    // • additionalNodes
    // • contextMenu
    // • contextMenuOverride

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
            friendlyName: "Initial Tab Selector",
            consumes: [ShellServiceIdentity],
            factory: (shellService) => {
                // Just find and select the requested initial tab.
                shellService.sidePanes.find((pane) => pane.key === paneKey)?.select();
            },
        };
        serviceDefinitions.push(initialTabServiceDefinition);
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
    private static _CurrentInspectorToken: Nullable<IDisposable> = null;

    public static readonly OnSelectionChangeObservable = new Observable<any>();
    public static readonly OnPropertyChangedObservable = new Observable<PropertyChangedEvent>();

    public static MarkLineContainerTitleForHighlighting(title: string) {
        throw new Error("Not Implemented");
    }

    public static MarkMultipleLineContainerTitlesForHighlighting(titles: string[]) {
        throw new Error("Not Implemented");
    }

    public static PopupEmbed() {
        // Show with embed mode on (stacked right panes) and undocked?
        throw new Error("Not Implemented");
    }

    public static PopupSceneExplorer() {
        // Show with all right panes (not stacked), scene explorer tab selected, and undocked?
        throw new Error("Not Implemented");
    }

    public static PopupInspector() {
        // Show with all right panes (not stacked), properties tab selected, and undocked?
        throw new Error("Not Implemented");
    }

    public static get IsVisible(): boolean {
        return !this._CurrentInspectorToken;
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

        this._CurrentInspectorToken = ShowInspector(scene, ConvertOptions(userOptions));
    }

    public static Hide() {
        this._CurrentInspectorToken?.dispose();
        this._CurrentInspectorToken = null;
    }
}
