import type { IDisposable, IInspectorOptions as InspectorV1Options, Nullable, Scene } from "core/index";
import type { InspectorOptions as InspectorV2Options } from "./inspector";

import { EngineStore } from "core/Engines/engineStore";
import { Observable } from "core/Misc/observable";
import { ShowInspector } from "./inspector";

type PropertyChangedEvent = {
    object: any;
    property: string;
    value: any;
    initialValue: any;
    allowNullValue?: boolean;
};

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

    public static Show(scene: Nullable<Scene>, userOptions: Partial<InspectorV1Options>) {
        this._Show(scene, userOptions);
    }

    private static _Show(scene: Nullable<Scene>, userOptions: Partial<InspectorV1Options>) {
        if (!scene) {
            scene = EngineStore.LastCreatedScene;
        }

        if (!scene || scene.isDisposed) {
            return;
        }

        userOptions = {
            overlay: false,
            showExplorer: true,
            showInspector: true,
            embedMode: false,
            enableClose: true,
            handleResize: true,
            enablePopup: true,
            ...userOptions,
        };

        const options: Partial<InspectorV2Options> = {
            containerElement: userOptions.globalRoot,
            layoutMode: userOptions.overlay ? "overlay" : "inline",
            autoResizeEngine: userOptions.handleResize,
            sidePaneRemapper: (sidePane) => {
                if (userOptions.showExplorer === false && sidePane.key === "Scene Explorer") {
                    return null;
                }

                if (
                    userOptions.showInspector === false &&
                    (sidePane.key === "Properties" || sidePane.key === "Debug" || sidePane.key === "Statistics" || sidePane.key === "Settings" || sidePane.key === "Tools")
                ) {
                    return null;
                }

                if (userOptions.embedMode) {
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
        };
        this._CurrentInspectorToken = ShowInspector(scene, options);
    }

    public static Hide() {
        this._CurrentInspectorToken?.dispose();
        this._CurrentInspectorToken = null;
    }
}
