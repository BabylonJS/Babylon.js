import { GLTFFileLoader, IGLTFLoaderExtension } from "babylonjs-loaders/glTF/index";
import { IGLTFValidationResults } from "babylonjs-gltf2interface";

import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs/Loading/sceneLoader";
import { Scene } from "babylonjs/scene";
import { Light } from "babylonjs/Lights/light";
import { LightGizmo } from "babylonjs/Gizmos/lightGizmo";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { ReplayRecorder } from './replayRecorder';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { CodeChangedEvent } from './codeChangedEvent';

export class GlobalState {
    public onSelectionChangedObservable: Observable<any>;
    public onPropertyChangedObservable: Observable<PropertyChangedEvent>;
    public onCodeChangedObservable = new Observable<CodeChangedEvent>();
    public onInspectorClosedObservable = new Observable<Scene>();
    public onTabChangedObservable = new Observable<number>();
    public onSelectionRenamedObservable = new Observable<void>();
    public onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;
    public onNewSceneObservable = new Observable<Scene>();
    public sceneImportDefaults: { [key: string]: any } = {};

    public validationResults: Nullable<IGLTFValidationResults> = null;
    public onValidationResultsUpdatedObservable = new Observable<Nullable<IGLTFValidationResults>>();

    public onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
    public glTFLoaderExtensionDefaults: { [name: string]: { [key: string]: any } } = {};
    public glTFLoaderDefaults: { [key: string]: any } = { "validate": true };

    public blockMutationUpdates = false;
    public selectedLineContainerTitles:Array<string> = [];

    public recorder = new ReplayRecorder();

    private _onlyUseEulers: Nullable<boolean> = null;

    public get onlyUseEulers(): boolean {
        if (this._onlyUseEulers === null) {
            this._onlyUseEulers = DataStorage.ReadBoolean("settings_onlyUseEulers", true);
        }

        return this._onlyUseEulers!;
    }

    public set onlyUseEulers(value: boolean) {
        this._onlyUseEulers = value;

        DataStorage.WriteBoolean("settings_onlyUseEulers", value);
    }

    private _ignoreBackfacesForPicking: Nullable<boolean> = null;

    public get ignoreBackfacesForPicking(): boolean {
        if (this._ignoreBackfacesForPicking === null) {
            this._ignoreBackfacesForPicking = DataStorage.ReadBoolean("settings_ignoreBackfacesForPicking", false);
        }

        return this._ignoreBackfacesForPicking!;
    }

    public set ignoreBackfacesForPicking(value: boolean) {
        this._ignoreBackfacesForPicking = value;

        DataStorage.WriteBoolean("settings_ignoreBackfacesForPicking", value);
    }

    public init(propertyChangedObservable: Observable<PropertyChangedEvent>) {
        this.onPropertyChangedObservable = propertyChangedObservable;

        propertyChangedObservable.add(event => {
            this.recorder.record(event);

            if (event.property === "name") {
                this.onSelectionRenamedObservable.notifyObservers();
            }
        });

        this.onCodeChangedObservable.add(code => {
            this.recorder.recordCode(code);
        });
    }

    public prepareGLTFPlugin(loader: GLTFFileLoader) {
        var loaderState = this.glTFLoaderDefaults;
        if (loaderState !== undefined) {
            for (const key in loaderState) {
                (loader as any)[key] = loaderState[key];
            }
        }

        loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {
            var extensionState = this.glTFLoaderExtensionDefaults[extension.name];
            if (extensionState !== undefined) {
                for (const key in extensionState) {
                    (extension as any)[key] = extensionState[key];
                }
            }
        });

        if (this.validationResults) {
            this.validationResults = null;
            this.onValidationResultsUpdatedObservable.notifyObservers(null);
        }

        loader.onValidatedObservable.add((results: IGLTFValidationResults) => {
            this.validationResults = results;
            this.onValidationResultsUpdatedObservable.notifyObservers(results);

            if (results.issues.numErrors || results.issues.numWarnings) {
                this.onTabChangedObservable.notifyObservers(3);
            }
        });
    }

    // Light gizmos
    public lightGizmos: Array<LightGizmo> = [];
    public enableLightGizmo(light: Light, enable = true) {
        if (enable) {
            if (!light.reservedDataStore) {
                light.reservedDataStore = {}
            }
            if (!light.reservedDataStore.lightGizmo) {
                light.reservedDataStore.lightGizmo = new LightGizmo();
                this.lightGizmos.push(light.reservedDataStore.lightGizmo)
                light.reservedDataStore.lightGizmo.light = light;
                light.reservedDataStore.lightGizmo.material.reservedDataStore = {hidden: true};
            }
        } else if (light.reservedDataStore && light.reservedDataStore.lightGizmo) {
            this.lightGizmos.splice(this.lightGizmos.indexOf(light.reservedDataStore.lightGizmo), 1);
            light.reservedDataStore.lightGizmo.dispose();
            light.reservedDataStore.lightGizmo = null;
        }
    }
}