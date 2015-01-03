declare module BABYLON {
    class Database {
        private callbackManifestChecked;
        private currentSceneUrl;
        private db;
        private enableSceneOffline;
        private enableTexturesOffline;
        private manifestVersionFound;
        private mustUpdateRessources;
        private hasReachedQuota;
        private isSupported;
        private idbFactory;
        static isUASupportingBlobStorage: boolean;
        constructor(urlToScene: string, callbackManifestChecked: (boolean: any) => any);
        static parseURL: (url: string) => string;
        static ReturnFullUrlLocation: (url: string) => string;
        public checkManifestFile(): void;
        public openAsync(successCallback: any, errorCallback: any): void;
        public loadImageFromDB(url: string, image: HTMLImageElement): void;
        private _loadImageFromDBAsync(url, image, notInDBCallback);
        private _saveImageIntoDBAsync(url, image);
        private _checkVersionFromDB(url, versionLoaded);
        private _loadVersionFromDBAsync(url, callback, updateInDBCallback);
        private _saveVersionIntoDBAsync(url, callback);
        private loadFileFromDB(url, sceneLoaded, progressCallBack, errorCallback, useArrayBuffer?);
        private _loadFileFromDBAsync(url, callback, notInDBCallback, useArrayBuffer?);
        private _saveFileIntoDBAsync(url, callback, progressCallback, useArrayBuffer?);
    }
}
