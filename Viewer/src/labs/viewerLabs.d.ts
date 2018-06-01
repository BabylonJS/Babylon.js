import { PBREnvironment } from "./environmentSerializer";
import { SceneManager } from '../viewer/sceneManager';
import { ShadowLight, Vector3 } from 'babylonjs';
/**
 * The ViewerLabs class will hold functions that are not (!) backwards compatible.
 * The APIs in all labs-related classes and configuration  might change.
 * Once stable, lab features will be moved to the publis API and configuration object.
 */
export declare class ViewerLabs {
    private _sceneManager;
    constructor(_sceneManager: SceneManager);
    assetsRootURL: string;
    environment: PBREnvironment;
    /**
         * Loads an environment map from a given URL
         * @param url URL of environment map
         * @param onSuccess Callback fired after environment successfully applied to the scene
         * @param onProgress Callback fired at progress events while loading the environment map
         * @param onError Callback fired when the load fails
         */
    loadEnvironment(url: string, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Loads an environment map from a given URL
     * @param buffer ArrayBuffer containing environment map
     * @param onSuccess Callback fired after environment successfully applied to the scene
     * @param onProgress Callback fired at progress events while loading the environment map
     * @param onError Callback fired when the load fails
     */
    loadEnvironment(buffer: ArrayBuffer, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Sets the environment to an already loaded environment
     * @param env PBREnvironment instance
     * @param onSuccess Callback fired after environment successfully applied to the scene
     * @param onProgress Callback fired at progress events while loading the environment map
     * @param onError Callback fired when the load fails
     */
    loadEnvironment(env: PBREnvironment, onSuccess?: (env: PBREnvironment) => void, onProgress?: (bytesLoaded: number, bytesTotal: number) => void, onError?: (e: any) => void): void;
    /**
     * Applies an `EnvironmentMapConfiguration` to the scene
     * @param environmentMapConfiguration Environment map configuration to apply
     */
    applyEnvironmentMapConfiguration(rotationY?: number): void;
    /**
     * Get an environment asset url by using the configuration if the path is not absolute.
     * @param url Asset url
     * @returns The Asset url using the `environmentAssetsRootURL` if the url is not an absolute path.
     */
    getAssetUrl(url: string): string;
    rotateShadowLight(shadowLight: ShadowLight, amount: number, point?: Vector3, axis?: Vector3, target?: Vector3): void;
}
