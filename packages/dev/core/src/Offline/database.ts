import type { Nullable } from "../types";
import { Tools } from "../Misc/tools";
import { Logger } from "../Misc/logger";
import { GetTGAHeader } from "../Misc/tga";
import type { IOfflineProvider } from "./IOfflineProvider";
import { WebRequest } from "../Misc/webRequest";
import { AbstractEngine } from "core/Engines/abstractEngine";

// Sets the default offline provider to Babylon.js
AbstractEngine.OfflineProviderFactory = (urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck = false) => {
    return new Database(urlToScene, callbackManifestChecked, disableManifestCheck);
};

/**
 * Class used to enable access to IndexedDB
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/optimizeCached
 */
export class Database implements IOfflineProvider {
    private _currentSceneUrl: string;
    private _db: Nullable<IDBDatabase>;
    private _enableSceneOffline: boolean;
    private _enableTexturesOffline: boolean;
    private _manifestVersionFound: number;
    private _mustUpdateRessources: boolean;
    private _hasReachedQuota: boolean;
    private _isSupported: boolean;

    // Handling various flavors of prefixed version of IndexedDB
    private _idbFactory = <IDBFactory>(typeof indexedDB !== "undefined" ? indexedDB : undefined);

    /** Gets a boolean indicating if the user agent supports blob storage (this value will be updated after creating the first Database object) */
    private static _IsUASupportingBlobStorage = true;

    /**
     * Gets a boolean indicating if Database storage is enabled (off by default)
     */
    static IDBStorageEnabled = false;

    /**
     * Gets a boolean indicating if scene must be saved in the database
     */
    public get enableSceneOffline(): boolean {
        return this._enableSceneOffline;
    }

    /**
     * Gets a boolean indicating if textures must be saved in the database
     */
    public get enableTexturesOffline(): boolean {
        return this._enableTexturesOffline;
    }

    /**
     * Creates a new Database
     * @param urlToScene defines the url to load the scene
     * @param callbackManifestChecked defines the callback to use when manifest is checked
     * @param disableManifestCheck defines a boolean indicating that we want to skip the manifest validation (it will be considered validated and up to date)
     */
    constructor(urlToScene: string, callbackManifestChecked: (checked: boolean) => any, disableManifestCheck = false) {
        this._currentSceneUrl = Database._ReturnFullUrlLocation(urlToScene);
        this._db = null;
        this._enableSceneOffline = false;
        this._enableTexturesOffline = false;
        this._manifestVersionFound = 0;
        this._mustUpdateRessources = false;
        this._hasReachedQuota = false;

        if (!Database.IDBStorageEnabled) {
            callbackManifestChecked(true);
        } else {
            if (disableManifestCheck) {
                this._enableSceneOffline = true;
                this._enableTexturesOffline = true;
                this._manifestVersionFound = 1;
                Tools.SetImmediate(() => {
                    callbackManifestChecked(true);
                });
            } else {
                this._checkManifestFile(callbackManifestChecked);
            }
        }
    }

    private static _ParseURL = (url: string) => {
        const a = document.createElement("a");
        a.href = url;
        const urlWithoutHash = url.substring(0, url.lastIndexOf("#"));
        const fileName = url.substring(urlWithoutHash.lastIndexOf("/") + 1, url.length);
        const absLocation = url.substring(0, url.indexOf(fileName, 0));
        return absLocation;
    };

    private static _ReturnFullUrlLocation = (url: string): string => {
        if (url.indexOf("http:/") === -1 && url.indexOf("https:/") === -1 && typeof window !== "undefined") {
            return Database._ParseURL(window.location.href) + url;
        } else {
            return url;
        }
    };

    private _checkManifestFile(callbackManifestChecked: (checked: boolean) => any) {
        const noManifestFile = () => {
            this._enableSceneOffline = false;
            this._enableTexturesOffline = false;
            callbackManifestChecked(false);
        };

        const createManifestURL = (): string => {
            try {
                // make sure we have a valid URL.
                if (typeof URL === "function" && this._currentSceneUrl.indexOf("http") === 0) {
                    // we don't have the base url, so the URL string must have a protocol
                    const url = new URL(this._currentSceneUrl);
                    url.pathname += ".manifest";
                    return url.toString();
                }
            } catch (e) {
                // defensive - if this fails for any reason, fall back to the older method
            }

            return `${this._currentSceneUrl}.manifest`;
        };

        let timeStampUsed = false;
        let manifestURL = createManifestURL();

        const xhr = new WebRequest();

        if (navigator.onLine) {
            // Adding a timestamp to by-pass browsers' cache
            timeStampUsed = true;
            manifestURL = manifestURL + (manifestURL.match(/\?/) == null ? "?" : "&") + Date.now();
        }
        xhr.open("GET", manifestURL);

        xhr.addEventListener(
            "load",
            () => {
                if (xhr.status === 200 || Database._ValidateXHRData(xhr, 1)) {
                    try {
                        const manifestFile = JSON.parse(xhr.response);
                        this._enableSceneOffline = manifestFile.enableSceneOffline;
                        this._enableTexturesOffline = manifestFile.enableTexturesOffline && Database._IsUASupportingBlobStorage;
                        if (manifestFile.version && !isNaN(parseInt(manifestFile.version))) {
                            this._manifestVersionFound = manifestFile.version;
                        }
                        callbackManifestChecked(true);
                    } catch (ex) {
                        noManifestFile();
                    }
                } else {
                    noManifestFile();
                }
            },
            false
        );

        xhr.addEventListener(
            "error",
            () => {
                if (timeStampUsed) {
                    timeStampUsed = false;
                    // Let's retry without the timeStamp
                    // It could fail when coupled with HTML5 Offline API
                    const retryManifestURL = createManifestURL();
                    xhr.open("GET", retryManifestURL);
                    xhr.send();
                } else {
                    noManifestFile();
                }
            },
            false
        );

        try {
            xhr.send();
        } catch (ex) {
            Logger.Error("Error on XHR send request.");
            callbackManifestChecked(false);
        }
    }

    /**
     * Open the database and make it available
     * @param successCallback defines the callback to call on success
     * @param errorCallback defines the callback to call on error
     */
    public open(successCallback: () => void, errorCallback: () => void): void {
        const handleError = () => {
            this._isSupported = false;
            if (errorCallback) {
                errorCallback();
            }
        };

        if (!this._idbFactory || !(this._enableSceneOffline || this._enableTexturesOffline)) {
            // Your browser doesn't support IndexedDB
            this._isSupported = false;
            if (errorCallback) {
                errorCallback();
            }
        } else {
            // If the DB hasn't been opened or created yet
            if (!this._db) {
                this._hasReachedQuota = false;
                this._isSupported = true;

                const request: IDBOpenDBRequest = this._idbFactory.open("babylonjs", 1);

                // Could occur if user is blocking the quota for the DB and/or doesn't grant access to IndexedDB
                request.onerror = () => {
                    handleError();
                };

                // executes when a version change transaction cannot complete due to other active transactions
                request.onblocked = () => {
                    Logger.Error("IDB request blocked. Please reload the page.");
                    handleError();
                };

                // DB has been opened successfully
                request.onsuccess = () => {
                    this._db = request.result;
                    successCallback();
                };

                // Initialization of the DB. Creating Scenes & Textures stores
                request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
                    this._db = (<any>event.target).result;
                    if (this._db) {
                        try {
                            this._db.createObjectStore("scenes", { keyPath: "sceneUrl" });
                            this._db.createObjectStore("versions", { keyPath: "sceneUrl" });
                            this._db.createObjectStore("textures", { keyPath: "textureUrl" });
                        } catch (ex) {
                            Logger.Error("Error while creating object stores. Exception: " + ex.message);
                            handleError();
                        }
                    }
                };
            }
            // DB has already been created and opened
            else {
                if (successCallback) {
                    successCallback();
                }
            }
        }
    }

    /**
     * Loads an image from the database
     * @param url defines the url to load from
     * @param image defines the target DOM image
     */
    public loadImage(url: string, image: HTMLImageElement) {
        const completeURL = Database._ReturnFullUrlLocation(url);

        const saveAndLoadImage = () => {
            if (!this._hasReachedQuota && this._db !== null) {
                // the texture is not yet in the DB, let's try to save it
                this._saveImageIntoDBAsync(completeURL, image);
            }
            // If the texture is not in the DB and we've reached the DB quota limit
            // let's load it directly from the web
            else {
                image.src = url;
            }
        };

        if (!this._mustUpdateRessources) {
            this._loadImageFromDBAsync(completeURL, image, saveAndLoadImage);
        }
        // First time we're download the images or update requested in the manifest file by a version change
        else {
            saveAndLoadImage();
        }
    }

    private _loadImageFromDBAsync(url: string, image: HTMLImageElement, notInDBCallback: () => any) {
        if (this._isSupported && this._db !== null) {
            let texture: any;
            const transaction: IDBTransaction = this._db.transaction(["textures"]);

            transaction.onabort = () => {
                image.src = url;
            };

            transaction.oncomplete = () => {
                let blobTextureURL: string;
                if (texture && typeof URL === "function") {
                    blobTextureURL = URL.createObjectURL(texture.data);
                    image.onerror = () => {
                        Logger.Error("Error loading image from blob URL: " + blobTextureURL + " switching back to web url: " + url);
                        image.src = url;
                    };
                    image.src = blobTextureURL;
                } else {
                    notInDBCallback();
                }
            };

            const getRequest: IDBRequest = transaction.objectStore("textures").get(url);

            getRequest.onsuccess = (event) => {
                texture = (<any>event.target).result;
            };
            getRequest.onerror = () => {
                Logger.Error("Error loading texture " + url + " from DB.");
                image.src = url;
            };
        } else {
            Logger.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            image.src = url;
        }
    }

    private _saveImageIntoDBAsync(url: string, image: HTMLImageElement) {
        let blob: Blob;

        if (this._isSupported) {
            // In case of error (type not supported or quota exceeded), we're at least sending back XHR data to allow texture loading later on
            const generateBlobUrl = () => {
                let blobTextureURL;

                if (blob && typeof URL === "function") {
                    try {
                        blobTextureURL = URL.createObjectURL(blob);
                    } catch (ex) {
                        // Chrome is raising a type error if we're setting the oneTimeOnly parameter
                        blobTextureURL = URL.createObjectURL(blob);
                    }
                }

                if (blobTextureURL) {
                    image.src = blobTextureURL;
                }
            };

            if (Database._IsUASupportingBlobStorage) {
                // Create XHR
                const xhr = new WebRequest();

                xhr.open("GET", url);
                xhr.responseType = "blob";

                xhr.addEventListener(
                    "load",
                    () => {
                        if (xhr.status === 200 && this._db) {
                            // Blob as response
                            blob = xhr.response;

                            const transaction = this._db.transaction(["textures"], "readwrite");

                            // the transaction could abort because of a QuotaExceededError error
                            transaction.onabort = (event) => {
                                try {
                                    //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                                    const srcElement = <any>event.target;
                                    const error = srcElement.error;
                                    if (error && error.name === "QuotaExceededError") {
                                        this._hasReachedQuota = true;
                                    }
                                } catch (ex) {}
                                generateBlobUrl();
                            };

                            transaction.oncomplete = () => {
                                generateBlobUrl();
                            };

                            const newTexture = { textureUrl: url, data: blob };

                            try {
                                // Put the blob into the dabase
                                const addRequest = transaction.objectStore("textures").put(newTexture);
                                addRequest.onsuccess = () => {};
                                addRequest.onerror = () => {
                                    generateBlobUrl();
                                };
                            } catch (ex) {
                                // "DataCloneError" generated by Chrome when you try to inject blob into IndexedDB
                                if (ex.code === 25) {
                                    Database._IsUASupportingBlobStorage = false;
                                    this._enableTexturesOffline = false;
                                }
                                image.src = url;
                            }
                        } else {
                            image.src = url;
                        }
                    },
                    false
                );

                xhr.addEventListener(
                    "error",
                    () => {
                        Logger.Error("Error in XHR request in BABYLON.Database.");
                        image.src = url;
                    },
                    false
                );

                xhr.send();
            } else {
                image.src = url;
            }
        } else {
            Logger.Error("Error: IndexedDB not supported by your browser or Babylon.js database is not open.");
            image.src = url;
        }
    }

    private _checkVersionFromDB(url: string, versionLoaded: (version: number) => void) {
        const updateVersion = () => {
            // the version is not yet in the DB or we need to update it
            this._saveVersionIntoDBAsync(url, versionLoaded);
        };
        this._loadVersionFromDBAsync(url, versionLoaded, updateVersion);
    }

    private _loadVersionFromDBAsync(url: string, callback: (version: number) => void, updateInDBCallback: () => void) {
        if (this._isSupported && this._db) {
            let version: any;
            try {
                const transaction = this._db.transaction(["versions"]);

                transaction.oncomplete = () => {
                    if (version) {
                        // If the version in the JSON file is different from the version in DB
                        if (this._manifestVersionFound !== version.data) {
                            this._mustUpdateRessources = true;
                            updateInDBCallback();
                        } else {
                            callback(version.data);
                        }
                    }
                    // version was not found in DB
                    else {
                        this._mustUpdateRessources = true;
                        updateInDBCallback();
                    }
                };

                transaction.onabort = () => {
                    callback(-1);
                };

                const getRequest = transaction.objectStore("versions").get(url);

                getRequest.onsuccess = (event) => {
                    version = (<any>event.target).result;
                };
                getRequest.onerror = () => {
                    Logger.Error("Error loading version for scene " + url + " from DB.");
                    callback(-1);
                };
            } catch (ex) {
                Logger.Error("Error while accessing 'versions' object store (READ OP). Exception: " + ex.message);
                callback(-1);
            }
        } else {
            Logger.Error("Error: IndexedDB not supported by your browser or Babylon.js database is not open.");
            callback(-1);
        }
    }

    private _saveVersionIntoDBAsync(url: string, callback: (version: number) => void) {
        if (this._isSupported && !this._hasReachedQuota && this._db) {
            try {
                // Open a transaction to the database
                const transaction = this._db.transaction(["versions"], "readwrite");

                // the transaction could abort because of a QuotaExceededError error
                transaction.onabort = (event) => {
                    try {
                        //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                        const error = (<any>event.target)["error"];
                        if (error && error.name === "QuotaExceededError") {
                            this._hasReachedQuota = true;
                        }
                    } catch (ex) {}
                    callback(-1);
                };

                transaction.oncomplete = () => {
                    callback(this._manifestVersionFound);
                };

                const newVersion = { sceneUrl: url, data: this._manifestVersionFound };

                // Put the scene into the database
                const addRequest = transaction.objectStore("versions").put(newVersion);
                addRequest.onsuccess = () => {};
                addRequest.onerror = () => {
                    Logger.Error("Error in DB add version request in BABYLON.Database.");
                };
            } catch (ex) {
                Logger.Error("Error while accessing 'versions' object store (WRITE OP). Exception: " + ex.message);
                callback(-1);
            }
        } else {
            callback(-1);
        }
    }

    /**
     * Loads a file from database
     * @param url defines the URL to load from
     * @param sceneLoaded defines a callback to call on success
     * @param progressCallBack defines a callback to call when progress changed
     * @param errorCallback defines a callback to call on error
     * @param useArrayBuffer defines a boolean to use array buffer instead of text string
     */
    public loadFile(url: string, sceneLoaded: (data: any) => void, progressCallBack?: (data: any) => void, errorCallback?: () => void, useArrayBuffer?: boolean): void {
        const completeUrl = Database._ReturnFullUrlLocation(url);

        const saveAndLoadFile = () => {
            // the scene is not yet in the DB, let's try to save it
            this._saveFileAsync(completeUrl, sceneLoaded, progressCallBack, useArrayBuffer, errorCallback);
        };

        this._checkVersionFromDB(completeUrl, (version) => {
            if (version !== -1) {
                if (!this._mustUpdateRessources) {
                    this._loadFileAsync(completeUrl, sceneLoaded, saveAndLoadFile, progressCallBack);
                } else {
                    this._saveFileAsync(completeUrl, sceneLoaded, progressCallBack, useArrayBuffer, errorCallback);
                }
            } else {
                if (errorCallback) {
                    errorCallback();
                }
            }
        });
    }

    private _loadFileAsync(url: string, callback: (data?: any) => void, notInDBCallback: () => void, progressCallBack?: (data: any) => void) {
        if (this._isSupported && this._db) {
            let targetStore: string;
            if (url.indexOf(".babylon") !== -1) {
                targetStore = "scenes";
            } else {
                targetStore = "textures";
            }

            let file: any;
            const transaction = this._db.transaction([targetStore]);

            transaction.oncomplete = () => {
                if (file) {
                    if (progressCallBack) {
                        const numberToLoad = file.data?.byteLength || 0;
                        progressCallBack({
                            total: numberToLoad,
                            loaded: numberToLoad,
                            lengthComputable: true,
                        });
                    }
                    callback(file.data);
                }
                // file was not found in DB
                else {
                    notInDBCallback();
                }
            };

            transaction.onabort = () => {
                notInDBCallback();
            };

            const getRequest = transaction.objectStore(targetStore).get(url);

            getRequest.onsuccess = (event) => {
                file = (<any>event.target).result;
            };
            getRequest.onerror = () => {
                Logger.Error("Error loading file " + url + " from DB.");
                notInDBCallback();
            };
        } else {
            Logger.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            callback();
        }
    }

    private _saveFileAsync(
        url: string,
        callback: (data?: any) => void,
        progressCallback?: (this: XMLHttpRequestEventTarget, ev: ProgressEvent) => any,
        useArrayBuffer?: boolean,
        errorCallback?: (data?: any) => void
    ) {
        if (this._isSupported) {
            let targetStore: string;
            if (url.indexOf(".babylon") !== -1) {
                targetStore = "scenes";
            } else {
                targetStore = "textures";
            }

            // Create XHR
            const xhr = new WebRequest();
            let fileData: any;
            xhr.open("GET", url + (url.match(/\?/) == null ? "?" : "&") + Date.now());

            if (useArrayBuffer) {
                xhr.responseType = "arraybuffer";
            }

            if (progressCallback) {
                xhr.onprogress = progressCallback;
            }

            xhr.addEventListener(
                "load",
                () => {
                    if (xhr.status === 200 || (xhr.status < 400 && Database._ValidateXHRData(xhr, !useArrayBuffer ? 1 : 6))) {
                        // Blob as response
                        fileData = !useArrayBuffer ? xhr.responseText : xhr.response;

                        if (!this._hasReachedQuota && this._db) {
                            // Open a transaction to the database
                            const transaction = this._db.transaction([targetStore], "readwrite");

                            // the transaction could abort because of a QuotaExceededError error
                            transaction.onabort = (event) => {
                                try {
                                    //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                                    const error = (<any>event.target)["error"];
                                    if (error && error.name === "QuotaExceededError") {
                                        this._hasReachedQuota = true;
                                    }
                                } catch (ex) {}
                                callback(fileData);
                            };

                            transaction.oncomplete = () => {
                                callback(fileData);
                            };

                            let newFile;
                            if (targetStore === "scenes") {
                                newFile = { sceneUrl: url, data: fileData, version: this._manifestVersionFound };
                            } else {
                                newFile = { textureUrl: url, data: fileData };
                            }

                            try {
                                // Put the scene into the database
                                const addRequest = transaction.objectStore(targetStore).put(newFile);
                                addRequest.onsuccess = () => {};
                                addRequest.onerror = () => {
                                    Logger.Error("Error in DB add file request in BABYLON.Database.");
                                };
                            } catch (ex) {
                                callback(fileData);
                            }
                        } else {
                            callback(fileData);
                        }
                    } else {
                        if (xhr.status >= 400 && errorCallback) {
                            errorCallback(xhr);
                        } else {
                            callback();
                        }
                    }
                },
                false
            );

            xhr.addEventListener(
                "error",
                () => {
                    Logger.Error("error on XHR request.");
                    errorCallback && errorCallback();
                },
                false
            );

            xhr.send();
        } else {
            Logger.Error("Error: IndexedDB not supported by your browser or Babylon.js database is not open.");
            errorCallback && errorCallback();
        }
    }

    /**
     * Validates if xhr data is correct
     * @param xhr defines the request to validate
     * @param dataType defines the expected data type
     * @returns true if data is correct
     */
    private static _ValidateXHRData(xhr: WebRequest, dataType = 7): boolean {
        // 1 for text (.babylon, manifest and shaders), 2 for TGA, 4 for DDS, 7 for all

        try {
            if (dataType & 1) {
                if (xhr.responseText && xhr.responseText.length > 0) {
                    return true;
                } else if (dataType === 1) {
                    return false;
                }
            }

            if (dataType & 2) {
                // Check header width and height since there is no "TGA" magic number
                const tgaHeader = GetTGAHeader(xhr.response);

                if (tgaHeader.width && tgaHeader.height && tgaHeader.width > 0 && tgaHeader.height > 0) {
                    return true;
                } else if (dataType === 2) {
                    return false;
                }
            }

            if (dataType & 4) {
                // Check for the "DDS" magic number
                const ddsHeader = new Uint8Array(xhr.response, 0, 3);

                if (ddsHeader[0] === 68 && ddsHeader[1] === 68 && ddsHeader[2] === 83) {
                    return true;
                } else {
                    return false;
                }
            }
        } catch (e) {
            // Global protection
        }

        return false;
    }
}
