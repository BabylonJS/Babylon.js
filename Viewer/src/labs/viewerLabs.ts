import { PBREnvironment, EnvironmentDeserializer } from "./environmentSerializer";
import { SceneManager } from '../viewer/sceneManager';

import { Tools } from 'babylonjs';
import { ViewerConfiguration } from "../configuration/configuration";

export class ViewerLabs {

    public environmentAssetsRootURL: string;
    public environment: PBREnvironment;

    /**
         * Loads an environment map from a given URL
         * @param url URL of environment map
         * @param onSuccess Callback fired after environment successfully applied to the scene
         * @param onProgress Callback fired at progress events while loading the environment map
         * @param onError Callback fired when the load fails
         */
    public loadEnvironment(sceneManager: SceneManager, url: string, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Loads an environment map from a given URL
     * @param buffer ArrayBuffer containing environment map
     * @param onSuccess Callback fired after environment successfully applied to the scene
     * @param onProgress Callback fired at progress events while loading the environment map
     * @param onError Callback fired when the load fails
     */
    public loadEnvironment(sceneManager: SceneManager, buffer: ArrayBuffer, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Sets the environment to an already loaded environment
     * @param env PBREnvironment instance
     * @param onSuccess Callback fired after environment successfully applied to the scene
     * @param onProgress Callback fired at progress events while loading the environment map
     * @param onError Callback fired when the load fails
     */
    public loadEnvironment(sceneManager: SceneManager, env: PBREnvironment, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    public loadEnvironment(sceneManager: SceneManager, data: string | ArrayBuffer | PBREnvironment, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void {
        //@! todo: should loadEnvironment cancel any currently loading environments?
        if (data instanceof ArrayBuffer) {
            this.environment = EnvironmentDeserializer.Parse(data);
            if (onSuccess) onSuccess(this.environment);
        } else if (typeof data === 'string') {
            let url = this.getEnvironmentAssetUrl(data);
            sceneManager.scene._loadFile(
                url,
                (arrayBuffer: ArrayBuffer) => {
                    this.environment = EnvironmentDeserializer.Parse(arrayBuffer);
                    if (onSuccess) onSuccess(this.environment);
                },
                (progressEvent) => { if (onProgress) onProgress(progressEvent.loaded, progressEvent.total); },
                false,
                true,
                (r, e) => {
                    if (onError) {
                        onError(e);
                    }
                }
            );
        } else {
            //data assumed to be PBREnvironment object
            this.environment = data;
            if (onSuccess) onSuccess(data);
        }
    }

    /**
     * Get an environment asset url by using the configuration if the path is not absolute.
     * @param url Asset url
     * @returns The Asset url using the `environmentAssetsRootURL` if the url is not an absolute path.
     */
    public getEnvironmentAssetUrl(url: string): string {
        let returnUrl = url;
        if (url && url.toLowerCase().indexOf("//") === -1) {
            if (!this.environmentAssetsRootURL) {
                Tools.Warn("Please, specify the root url of your assets before loading the configuration (labs.environmentAssetsRootURL) or disable the background through the viewer options.");
                return url;
            }

            returnUrl = this.environmentAssetsRootURL + returnUrl;
        }

        return returnUrl;
    }

}