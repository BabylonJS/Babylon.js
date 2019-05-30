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
import { Tools } from '../tools';

export class GlobalState {
    public onSelectionChangedObservable: Observable<any>;
    public onPropertyChangedObservable: Observable<PropertyChangedEvent>;
    public onInspectorClosedObservable = new Observable<Scene>();
    public onTabChangedObservable = new Observable<number>();
    public onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;

    public validationResults: IGLTFValidationResults;
    public onValidationResultsUpdatedObservable = new Observable<IGLTFValidationResults>();

    public onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
    public glTFLoaderExtensionDefaults: { [name: string]: { [key: string]: any } } = {};
    public glTFLoaderDefaults: { [key: string]: any } = { "validate": true };

    public blockMutationUpdates = false;
    public selectedLineContainerTitle = "";

    public recorder = new ReplayRecorder();

    private _onlyUseEulers: Nullable<boolean> = null;

    public get onlyUseEulers(): boolean {
        if (this._onlyUseEulers === null) {
            this._onlyUseEulers = Tools.ReadLocalBooleanSettings("settings_onlyUseEulers", true);
        }

        return this._onlyUseEulers!;
    }

    public set onlyUseEulers(value: boolean) {
        this._onlyUseEulers = value;

        Tools.StoreLocalBooleanSettings("settings_onlyUseEulers", value);
    }

    public init(propertyChangedObservable: Observable<PropertyChangedEvent>) {
        this.onPropertyChangedObservable = propertyChangedObservable;

        propertyChangedObservable.add(event => {
            this.recorder.record(event);
        })
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
            }
        } else if (light.reservedDataStore && light.reservedDataStore.lightGizmo) {
            this.lightGizmos.splice(this.lightGizmos.indexOf(light.reservedDataStore.lightGizmo), 1);
            light.reservedDataStore.lightGizmo.dispose();
            light.reservedDataStore.lightGizmo = null;
        }
    }
}