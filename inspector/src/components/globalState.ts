import { GLTFFileLoader, IGLTFLoaderExtension } from "babylonjs-loaders/glTF/index";
import { IGLTFValidationResults } from "babylonjs-gltf2interface";

import { Nullable } from "babylonjs/types";
import { Observable, Observer } from "babylonjs/Misc/observable";
import { ISceneLoaderPlugin, ISceneLoaderPluginAsync } from "babylonjs/Loading/sceneLoader";
import { Scene } from "babylonjs/scene";
import { Light } from "babylonjs/Lights/light";
import { LightGizmo } from "babylonjs/Gizmos/lightGizmo";
import { GizmoManager } from 'babylonjs';
import { PropertyChangedEvent } from "./propertyChangedEvent";

export class GlobalState {
    public onSelectionChangedObservable: Observable<string>;
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

    // Gizmos
    public gizmoManager:Nullable<GizmoManager> = null;

    // Light gizmos
    public lightGizmos:Array<LightGizmo> = [];
    public enableLightGizmo(light:Light, enable = true){
        if(enable){
            if(!light.reservedDataStore){
                light.reservedDataStore = {}
            }
            if(!light.reservedDataStore.lightGizmo){
                light.reservedDataStore.lightGizmo = new LightGizmo();
                this.lightGizmos.push(light.reservedDataStore.lightGizmo)
                light.reservedDataStore.lightGizmo.light = light;
            }
        }else if(light.reservedDataStore && light.reservedDataStore.lightGizmo){
            this.lightGizmos.splice(this.lightGizmos.indexOf(light.reservedDataStore.lightGizmo),1);
            light.reservedDataStore.lightGizmo.dispose();
            light.reservedDataStore.lightGizmo=null;
        }
    }
}