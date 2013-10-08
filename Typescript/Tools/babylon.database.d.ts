/// <reference path="../babylon.d.ts" />

declare module BABYLON {
    class Database {
        currentSceneUrl: string;
        db: Database;
        enableSceneOffline: boolean;
        enableTexturesOffline: boolean;
        manifestVersionFound: number;
        mustUpdateRessources: boolean;
        hasReachedQuota: boolean;

        constructor(urlToScene: string);

        isUASupportingBlobStorage: boolean;

        parseURL(url: string): string;
        ReturnFullUrlLocation(url: string): string;
        checkManifestFile(): void;
        openAsync(successCallback: Function, errorCallback: Function): void;
        loadImageFromDB(url: string, image: HTMLImageElement): void;
        _loadImageFromDBAsync(url: string, image: HTMLImageElement, notInDBCallback: Function);
        _saveImageIntoDBAsync(url: string, image: HTMLImageElement): void;
        _checkVersionFromDB(url: string, versionLoaded: number): void;
        _loadVersionFromDBAsync(url: string, callback, updateInDBCallback: Function): void;
        _saveVersionIntoDBAsync(url: string, callback: Function): void;
        loadSceneFromDB(url: string, sceneLoaded: Scene, progressCallBack: Function): void;
        _loadSceneFromDBAsync(url: string, callback: Function, notInDBCallback: Function): void;
        _saveSceneFromDBAsync(url: string, callback: Function, progressCallback: Function): void;
    }
}