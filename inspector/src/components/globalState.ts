import { Observable, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Observer, Nullable } from "babylonjs";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import {IGLTFLoaderExtension, GLTFFileLoader} from "babylonjs-loaders"

export class GlobalState {
    public onSelectionChangeObservable: Observable<string>;
    public onPropertyChangedObservable: Observable<PropertyChangedEvent>;
    public onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;
    
    public validationResults: IGLTFValidationResults;
    public onValidationResultsUpdatedObservable = new Observable<IGLTFValidationResults>();

    public onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
    public glTFLoaderDefaults: {[key: string]: boolean} = {};

    public prepareGLTFPlugin(loader: GLTFFileLoader) {
        loader.onExtensionLoadedObservable.add((extension: IGLTFLoaderExtension) => {

            var extensionState = this.glTFLoaderDefaults[extension.name];
            if (extensionState !== undefined) {
                extension.enabled = extensionState;
            }
        });
    }
}