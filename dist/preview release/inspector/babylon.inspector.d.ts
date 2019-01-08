/*Babylon.js Inspector*/
// Dependencies for this module:
//   ../../../../tools/gulp/babylonjs
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
