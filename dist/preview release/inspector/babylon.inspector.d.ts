/*Babylon.js Inspector*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
declare module INSPECTOR {
}
declare module INSPECTOR {
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
        embedMode?: boolean;
        handleResize?: boolean;
        enablePopup?: boolean;
        explorerExtensibility?: IExtensibilityGroup[];
    }
    export class Inspector {
        static OnSelectionChangeObservable: BABYLON.Observable<string>;
        static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        static readonly IsVisible: boolean;
        static Show(scene: BABYLON.Scene, userOptions: Partial<IInspectorOptions>): void;
        static Hide(): void;
    }
}
declare module INSPECTOR {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}