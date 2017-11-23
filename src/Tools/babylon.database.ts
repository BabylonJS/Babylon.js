module BABYLON {
    export class Database {
        private callbackManifestChecked: (check: boolean) => any;
        private currentSceneUrl: string;
        private db: Nullable<IDBDatabase>;
        private _enableSceneOffline: boolean;
        private _enableTexturesOffline: boolean;
        private manifestVersionFound: number;
        private mustUpdateRessources: boolean;
        private hasReachedQuota: boolean;
        private isSupported: boolean;

        // Handling various flavors of prefixed version of IndexedDB
        private idbFactory = <IDBFactory>(window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);

        static IsUASupportingBlobStorage = true;
        static IDBStorageEnabled = true;

        public get enableSceneOffline(): boolean {
            return this._enableSceneOffline;
        }

        public get enableTexturesOffline(): boolean {
            return this._enableTexturesOffline;
        }

        constructor(urlToScene: string, callbackManifestChecked: (checked: boolean) => any) {
            this.callbackManifestChecked = callbackManifestChecked;
            this.currentSceneUrl = Database.ReturnFullUrlLocation(urlToScene);
            this.db = null;
            this._enableSceneOffline = false;
            this._enableTexturesOffline = false;
            this.manifestVersionFound = 0;
            this.mustUpdateRessources = false;
            this.hasReachedQuota = false;

            if (!Database.IDBStorageEnabled) {
                this.callbackManifestChecked(true);
            } else {
                this.checkManifestFile();
            }
        }

        static parseURL = (url: string) => {
            var a = document.createElement('a');
            a.href = url;
            var urlWithoutHash = url.substring(0, url.lastIndexOf("#"));
            var fileName = url.substring(urlWithoutHash.lastIndexOf("/") + 1, url.length);
            var absLocation = url.substring(0, url.indexOf(fileName, 0));
            return absLocation;
        }

        static ReturnFullUrlLocation = (url: string): string => {
            if (url.indexOf("http:/") === -1 && url.indexOf("https:/") === -1) {
                return (Database.parseURL(window.location.href) + url);
            }
            else {
                return url;
            }
        }

        public checkManifestFile() {
            var noManifestFile = () => {
                this._enableSceneOffline = false;
                this._enableTexturesOffline = false;
                this.callbackManifestChecked(false);
            }

            var timeStampUsed = false;
            var manifestURL = this.currentSceneUrl + ".manifest";

            var xhr: XMLHttpRequest = new XMLHttpRequest();

            if (navigator.onLine) {
                // Adding a timestamp to by-pass browsers' cache
                timeStampUsed = true;
                manifestURL = manifestURL + (manifestURL.match(/\?/) == null ? "?" : "&") + (new Date()).getTime();
            }
            xhr.open("GET", manifestURL, true);

            xhr.addEventListener("load", () => {
                if (xhr.status === 200 || Tools.ValidateXHRData(xhr, 1)) {
                    try {
                        var manifestFile = JSON.parse(xhr.response);
                        this._enableSceneOffline = manifestFile.enableSceneOffline;
                        this._enableTexturesOffline = manifestFile.enableTexturesOffline;
                        if (manifestFile.version && !isNaN(parseInt(manifestFile.version))) {
                            this.manifestVersionFound = manifestFile.version;
                        }
                        if (this.callbackManifestChecked) {
                            this.callbackManifestChecked(true);
                        }
                    }
                    catch (ex) {
                        noManifestFile();
                    }
                }
                else {
                    noManifestFile();
                }
            }, false);

            xhr.addEventListener("error", event => {
                if (timeStampUsed) {
                    timeStampUsed = false;
                    // Let's retry without the timeStamp
                    // It could fail when coupled with HTML5 Offline API
                    var retryManifestURL = this.currentSceneUrl + ".manifest";
                    xhr.open("GET", retryManifestURL, true);
                    xhr.send();
                }
                else {
                    noManifestFile();
                }
            }, false);

            try {
                xhr.send();
            }
            catch (ex) {
                Tools.Error("Error on XHR send request.");
                this.callbackManifestChecked(false);
            }
        }

        public openAsync(successCallback: () => void, errorCallback: () => void) {
            let handleError = () => {
                this.isSupported = false;
                if (errorCallback) errorCallback();
            }

            if (!this.idbFactory || !(this._enableSceneOffline || this._enableTexturesOffline)) {
                // Your browser doesn't support IndexedDB
                this.isSupported = false;
                if (errorCallback) errorCallback();
            }
            else {
                // If the DB hasn't been opened or created yet
                if (!this.db) {
                    this.hasReachedQuota = false;
                    this.isSupported = true;

                    var request: IDBOpenDBRequest = this.idbFactory.open("babylonjs", 1);

                    // Could occur if user is blocking the quota for the DB and/or doesn't grant access to IndexedDB
                    request.onerror = event => {
                        handleError();
                    };

                    // executes when a version change transaction cannot complete due to other active transactions
                    request.onblocked = event => {
                        Tools.Error("IDB request blocked. Please reload the page.");
                        handleError();
                    };

                    // DB has been opened successfully
                    request.onsuccess = event => {
                        this.db = request.result;
                        successCallback();
                    };

                    // Initialization of the DB. Creating Scenes & Textures stores
                    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                        this.db = (<any>(event.target)).result;
                        if (this.db) {
                            try {
                                this.db.createObjectStore("scenes", { keyPath: "sceneUrl" });
                                this.db.createObjectStore("versions", { keyPath: "sceneUrl" });
                                this.db.createObjectStore("textures", { keyPath: "textureUrl" });
                            }
                            catch (ex) {
                                Tools.Error("Error while creating object stores. Exception: " + ex.message);
                                handleError();
                            }
                        }
                    };
                }
                // DB has already been created and opened
                else {
                    if (successCallback) successCallback();
                }
            }
        }

        public loadImageFromDB(url: string, image: HTMLImageElement) {
            var completeURL = Database.ReturnFullUrlLocation(url);

            var saveAndLoadImage = () => {
                if (!this.hasReachedQuota && this.db !== null) {
                    // the texture is not yet in the DB, let's try to save it
                    this._saveImageIntoDBAsync(completeURL, image);
                }
                // If the texture is not in the DB and we've reached the DB quota limit
                // let's load it directly from the web
                else {
                    image.src = url;
                }
            };

            if (!this.mustUpdateRessources) {
                this._loadImageFromDBAsync(completeURL, image, saveAndLoadImage);
            }
            // First time we're download the images or update requested in the manifest file by a version change
            else {
                saveAndLoadImage();
            }
        }

        private _loadImageFromDBAsync(url: string, image: HTMLImageElement, notInDBCallback: () => any) {
            if (this.isSupported && this.db !== null) {
                var texture: any;
                var transaction: IDBTransaction = this.db.transaction(["textures"]);

                transaction.onabort = event => {
                    image.src = url;
                };

                transaction.oncomplete = event => {
                    var blobTextureURL: string;
                    if (texture) {
                        var URL = window.URL || window.webkitURL;
                        blobTextureURL = URL.createObjectURL(texture.data, { oneTimeOnly: true });

                        image.onerror = () => {
                            Tools.Error("Error loading image from blob URL: " + blobTextureURL + " switching back to web url: " + url);
                            image.src = url;
                        };
                        image.src = blobTextureURL;
                    }
                    else {
                        notInDBCallback();
                    }
                };

                var getRequest: IDBRequest = transaction.objectStore("textures").get(url);

                getRequest.onsuccess = event => {
                    texture = (<any>(event.target)).result;
                };
                getRequest.onerror = event => {
                    Tools.Error("Error loading texture " + url + " from DB.");
                    image.src = url;
                };
            }
            else {
                Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                image.src = url;
            }
        }

        private _saveImageIntoDBAsync(url: string, image: HTMLImageElement) {
            if (this.isSupported) {
                // In case of error (type not supported or quota exceeded), we're at least sending back XHR data to allow texture loading later on
                var generateBlobUrl = () => {
                    var blobTextureURL;

                    if (blob) {
                        var URL = window.URL || window.webkitURL;
                        try {
                            blobTextureURL = URL.createObjectURL(blob, { oneTimeOnly: true });
                        }
                        // Chrome is raising a type error if we're setting the oneTimeOnly parameter
                        catch (ex) {
                            blobTextureURL = URL.createObjectURL(blob);
                        }
                    }

                    if (blobTextureURL) {
                        image.src = blobTextureURL;
                    }
                };

                if (Database.IsUASupportingBlobStorage) { // Create XHR
                    var xhr = new XMLHttpRequest(),
                        blob: Blob;

                    xhr.open("GET", url, true);
                    xhr.responseType = "blob";

                    xhr.addEventListener("load", () => {
                        if (xhr.status === 200 && this.db) {
                            // Blob as response (XHR2)
                            blob = xhr.response;

                            var transaction = this.db.transaction(["textures"], "readwrite");

                            // the transaction could abort because of a QuotaExceededError error
                            transaction.onabort = (event) => {
                                try {
                                    //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                                    let srcElement = <any>(event.srcElement || event.target);
                                    var error = srcElement.error;
                                    if (error && error.name === "QuotaExceededError") {
                                        this.hasReachedQuota = true;
                                    }
                                }
                                catch (ex) { }
                                generateBlobUrl();
                            };

                            transaction.oncomplete = event => {
                                generateBlobUrl();
                            };

                            var newTexture = { textureUrl: url, data: blob };

                            try {
                                // Put the blob into the dabase
                                var addRequest = transaction.objectStore("textures").put(newTexture);
                                addRequest.onsuccess = event => {
                                };
                                addRequest.onerror = event => {
                                    generateBlobUrl();
                                };
                            }
                            catch (ex) {
                                // "DataCloneError" generated by Chrome when you try to inject blob into IndexedDB
                                if (ex.code === 25) {
                                    Database.IsUASupportingBlobStorage = false;
                                }
                                image.src = url;
                            }
                        }
                        else {
                            image.src = url;
                        }
                    }, false);

                    xhr.addEventListener("error", event => {
                        Tools.Error("Error in XHR request in BABYLON.Database.");
                        image.src = url;
                    }, false);

                    xhr.send();
                }
                else {
                    image.src = url;
                }
            }
            else {
                Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                image.src = url;
            }
        }

        private _checkVersionFromDB(url: string, versionLoaded: (version: number) => void) {
            var updateVersion = () => {
                // the version is not yet in the DB or we need to update it
                this._saveVersionIntoDBAsync(url, versionLoaded);
            };
            this._loadVersionFromDBAsync(url, versionLoaded, updateVersion);
        }

        private _loadVersionFromDBAsync(url: string, callback: (version: number) => void, updateInDBCallback: () => void) {
            if (this.isSupported && this.db) {
                var version: any;
                try {
                    var transaction = this.db.transaction(["versions"]);

                    transaction.oncomplete = event => {
                        if (version) {
                            // If the version in the JSON file is > than the version in DB
                            if (this.manifestVersionFound > version.data) {
                                this.mustUpdateRessources = true;
                                updateInDBCallback();
                            }
                            else {
                                callback(version.data);
                            }
                        }
                        // version was not found in DB
                        else {
                            this.mustUpdateRessources = true;
                            updateInDBCallback();
                        }
                    };

                    transaction.onabort = event => {
                        callback(-1);
                    };

                    var getRequest = transaction.objectStore("versions").get(url);

                    getRequest.onsuccess = event => {
                        version = (<any>(event.target)).result;
                    };
                    getRequest.onerror = event => {
                        Tools.Error("Error loading version for scene " + url + " from DB.");
                        callback(-1);
                    };
                }
                catch (ex) {
                    Tools.Error("Error while accessing 'versions' object store (READ OP). Exception: " + ex.message);
                    callback(-1);
                }
            }
            else {
                Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                callback(-1);
            }
        }

        private _saveVersionIntoDBAsync(url: string, callback: (version: number) => void) {
            if (this.isSupported && !this.hasReachedQuota && this.db) {
                try {
                    // Open a transaction to the database
                    var transaction = this.db.transaction(["versions"], "readwrite");

                    // the transaction could abort because of a QuotaExceededError error
                    transaction.onabort = event => {
                        try {//backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                            var error = (<any>event.srcElement)['error'];
                            if (error && error.name === "QuotaExceededError") {
                                this.hasReachedQuota = true;
                            }
                        }
                        catch (ex) { }
                        callback(-1);
                    };

                    transaction.oncomplete = event => {
                        callback(this.manifestVersionFound);
                    };

                    var newVersion = { sceneUrl: url, data: this.manifestVersionFound };

                    // Put the scene into the database
                    var addRequest = transaction.objectStore("versions").put(newVersion);
                    addRequest.onsuccess = event => {
                    };
                    addRequest.onerror = event => {
                        Tools.Error("Error in DB add version request in BABYLON.Database.");
                    };
                }
                catch (ex) {
                    Tools.Error("Error while accessing 'versions' object store (WRITE OP). Exception: " + ex.message);
                    callback(-1);
                }
            }
            else {
                callback(-1);
            }
        }

        public loadFileFromDB(url: string, sceneLoaded: (data: any) => void, progressCallBack?: (data: any) => void, errorCallback?: () => void, useArrayBuffer?: boolean) {
            var completeUrl = Database.ReturnFullUrlLocation(url);

            var saveAndLoadFile = () => {
                // the scene is not yet in the DB, let's try to save it
                this._saveFileIntoDBAsync(completeUrl, sceneLoaded, progressCallBack);
            };

            this._checkVersionFromDB(completeUrl, version => {
                if (version !== -1) {
                    if (!this.mustUpdateRessources) {
                        this._loadFileFromDBAsync(completeUrl, sceneLoaded, saveAndLoadFile, useArrayBuffer);
                    }
                    else {
                        this._saveFileIntoDBAsync(completeUrl, sceneLoaded, progressCallBack, useArrayBuffer);
                    }
                }
                else {
                    if (errorCallback) {
                        errorCallback();
                    }
                }
            });
        }

        private _loadFileFromDBAsync(url: string, callback: (data?: any) => void, notInDBCallback: () => void, useArrayBuffer?: boolean) {
            if (this.isSupported && this.db) {
                var targetStore: string;
                if (url.indexOf(".babylon") !== -1) {
                    targetStore = "scenes";
                }
                else {
                    targetStore = "textures";
                }

                var file: any;
                var transaction = this.db.transaction([targetStore]);

                transaction.oncomplete = event => {
                    if (file) {
                        callback(file.data);
                    }
                    // file was not found in DB
                    else {
                        notInDBCallback();
                    }
                };

                transaction.onabort = event => {
                    notInDBCallback();
                };

                var getRequest = transaction.objectStore(targetStore).get(url);

                getRequest.onsuccess = event => {
                    file = (<any>(event.target)).result;
                };
                getRequest.onerror = event => {
                    Tools.Error("Error loading file " + url + " from DB.");
                    notInDBCallback();
                };
            }
            else {
                Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                callback();
            }
        }

        private _saveFileIntoDBAsync(url: string, callback: (data?: any) => void, progressCallback?: (this: XMLHttpRequestEventTarget, ev: ProgressEvent) => any, useArrayBuffer?: boolean) {
            if (this.isSupported) {
                var targetStore: string;
                if (url.indexOf(".babylon") !== -1) {
                    targetStore = "scenes";
                }
                else {
                    targetStore = "textures";
                }

                // Create XHR
                var xhr = new XMLHttpRequest();
                var fileData: any;
                xhr.open("GET", url, true);

                if (useArrayBuffer) {
                    xhr.responseType = "arraybuffer";
                }

                if (progressCallback) {
                    xhr.onprogress = progressCallback;
                }

                xhr.addEventListener("load", () => {
                    if (xhr.status === 200 || Tools.ValidateXHRData(xhr, !useArrayBuffer ? 1 : 6)) {
                        // Blob as response (XHR2)
                        //fileData = xhr.responseText;
                        fileData = !useArrayBuffer ? xhr.responseText : xhr.response;

                        if (!this.hasReachedQuota && this.db) {
                            // Open a transaction to the database
                            var transaction = this.db.transaction([targetStore], "readwrite");

                            // the transaction could abort because of a QuotaExceededError error
                            transaction.onabort = (event) => {
                                try {
                                    //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                                    var error = (<any>event.srcElement)['error'];
                                    if (error && error.name === "QuotaExceededError") {
                                        this.hasReachedQuota = true;
                                    }
                                }
                                catch (ex) { }
                                callback(fileData);
                            };

                            transaction.oncomplete = event => {
                                callback(fileData);
                            };

                            var newFile;
                            if (targetStore === "scenes") {
                                newFile = { sceneUrl: url, data: fileData, version: this.manifestVersionFound };
                            }
                            else {
                                newFile = { textureUrl: url, data: fileData };
                            }

                            try {
                                // Put the scene into the database
                                var addRequest = transaction.objectStore(targetStore).put(newFile);
                                addRequest.onsuccess = event => {
                                };
                                addRequest.onerror = event => {
                                    Tools.Error("Error in DB add file request in BABYLON.Database.");
                                };
                            }
                            catch (ex) {
                                callback(fileData);
                            }
                        }
                        else {
                            callback(fileData);
                        }
                    }
                    else {
                        callback();
                    }
                }, false);

                xhr.addEventListener("error", event => {
                    Tools.Error("error on XHR request.");
                    callback();
                }, false);

                xhr.send();
            }
            else {
                Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                callback();
            }
        }
    }
}
