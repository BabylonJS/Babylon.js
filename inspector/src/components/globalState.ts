import { Observable, ISceneLoaderPlugin, ISceneLoaderPluginAsync, Observer, Nullable } from "babylonjs";
import { PropertyChangedEvent } from "./propertyChangedEvent";
import { IGLTFLoaderExtension, GLTFFileLoader } from "babylonjs-loaders";
import { } from "babylonjs-gltf2interface";

export class GlobalState {
    public onSelectionChangedObservable: Observable<string>;
    public onPropertyChangedObservable: Observable<PropertyChangedEvent>;
    public onTabChangedObservable = new Observable<number>();
    public onPluginActivatedObserver: Nullable<Observer<ISceneLoaderPlugin | ISceneLoaderPluginAsync>>;

    public validationResults: IGLTFValidationResults;
    public onValidationResultsUpdatedObservable = new Observable<IGLTFValidationResults>();

    public onExtensionLoadedObservable: Observable<IGLTFLoaderExtension>;
    public glTFLoaderExtensionDefaults: { [name: string]: { [key: string]: any } } = {};
    public glTFLoaderDefaults: { [key: string]: any } = { "validate": true };

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
}