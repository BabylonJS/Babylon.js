/*Babylon.js Inspector*/
// Dependencies for this module:
//   ../../../../Tools/gulp/babylonjs

declare module 'babylonjs-inspector' {
    export * from "babylonjs-inspector/inspector";
}

declare module 'babylonjs-inspector/inspector' {
    import { Scene, Observable, IInspectorOptions } from "babylonjs";
    import { PropertyChangedEvent } from "babylonjs-inspector/components/propertyChangedEvent";
    export class Inspector {
        static OnSelectionChangeObservable: Observable<string>;
        static OnPropertyChangedObservable: Observable<PropertyChangedEvent>;
        static readonly IsVisible: boolean;
        static EarlyAttachToLoader(): void;
        static Show(scene: Scene, userOptions: Partial<IInspectorOptions>): void;
        static Hide(): void;
    }
}

declare module 'babylonjs-inspector/components/propertyChangedEvent' {
    export class PropertyChangedEvent {
        object: any;
        property: string;
        value: any;
        initialValue: any;
    }
}


/*Babylon.js Inspector*/
// Dependencies for this module:
//   ../../../../Tools/gulp/babylonjs
declare module INSPECTOR {
}
declare module INSPECTOR {
    export class Inspector {
        static OnSelectionChangeObservable: BABYLON.Observable<string>;
        static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
        static readonly IsVisible: boolean;
        static EarlyAttachToLoader(): void;
        static Show(scene: BABYLON.Scene, userOptions: Partial<BABYLON.IInspectorOptions>): void;
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