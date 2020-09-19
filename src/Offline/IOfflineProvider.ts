/**
 * Class used to enable access to offline support
 * @see https://doc.babylonjs.com/how_to/caching_resources_in_indexeddb
 */
export interface IOfflineProvider {
    /**
     * Gets a boolean indicating if scene must be saved in the database
     */
    enableSceneOffline: boolean;

    /**
     * Gets a boolean indicating if textures must be saved in the database
     */
    enableTexturesOffline: boolean;

    /**
     * Open the offline support and make it available
     * @param successCallback defines the callback to call on success
     * @param errorCallback defines the callback to call on error
     */
    open(successCallback: () => void, errorCallback: () => void): void;

    /**
     * Loads an image from the offline support
     * @param url defines the url to load from
     * @param image defines the target DOM image
     */
    loadImage(url: string, image: HTMLImageElement): void;

    /**
     * Loads a file from offline support
     * @param url defines the URL to load from
     * @param sceneLoaded defines a callback to call on success
     * @param progressCallBack defines a callback to call when progress changed
     * @param errorCallback defines a callback to call on error
     * @param useArrayBuffer defines a boolean to use array buffer instead of text string
     */
    loadFile(url: string, sceneLoaded: (data: any) => void, progressCallBack?: (data: any) => void, errorCallback?: () => void, useArrayBuffer?: boolean): void;
}
