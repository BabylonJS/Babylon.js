var BABYLON;
(function (BABYLON) {
    var Database = (function () {
        function Database(urlToScene, callbackManifestChecked) {
            // Handling various flavors of prefixed version of IndexedDB
            this.idbFactory = (window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB);
            this.callbackManifestChecked = callbackManifestChecked;
            this.currentSceneUrl = Database.ReturnFullUrlLocation(urlToScene);
            this.db = null;
            this.enableSceneOffline = false;
            this.enableTexturesOffline = false;
            this.manifestVersionFound = 0;
            this.mustUpdateRessources = false;
            this.hasReachedQuota = false;
            if (!Database.IDBStorageEnabled) {
                this.callbackManifestChecked(true);
            }
            else {
                this.checkManifestFile();
            }
        }
        Database.prototype.checkManifestFile = function () {
            var _this = this;
            function noManifestFile() {
                that.enableSceneOffline = false;
                that.enableTexturesOffline = false;
                that.callbackManifestChecked(false);
            }
            var that = this;
            var manifestURL = this.currentSceneUrl + ".manifest";
            var xhr = new XMLHttpRequest();
            var manifestURLTimeStamped = manifestURL + (manifestURL.match(/\?/) == null ? "?" : "&") + (new Date()).getTime();
            xhr.open("GET", manifestURLTimeStamped, true);
            xhr.addEventListener("load", function () {
                if (xhr.status === 200 || BABYLON.Tools.ValidateXHRData(xhr, 1)) {
                    try {
                        var manifestFile = JSON.parse(xhr.response);
                        _this.enableSceneOffline = manifestFile.enableSceneOffline;
                        _this.enableTexturesOffline = manifestFile.enableTexturesOffline;
                        if (manifestFile.version && !isNaN(parseInt(manifestFile.version))) {
                            _this.manifestVersionFound = manifestFile.version;
                        }
                        if (_this.callbackManifestChecked) {
                            _this.callbackManifestChecked(true);
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
            xhr.addEventListener("error", function (event) {
                noManifestFile();
            }, false);
            try {
                xhr.send();
            }
            catch (ex) {
                BABYLON.Tools.Error("Error on XHR send request.");
                that.callbackManifestChecked(false);
            }
        };
        Database.prototype.openAsync = function (successCallback, errorCallback) {
            var _this = this;
            function handleError() {
                that.isSupported = false;
                if (errorCallback)
                    errorCallback();
            }
            var that = this;
            if (!this.idbFactory || !(this.enableSceneOffline || this.enableTexturesOffline)) {
                // Your browser doesn't support IndexedDB
                this.isSupported = false;
                if (errorCallback)
                    errorCallback();
            }
            else {
                // If the DB hasn't been opened or created yet
                if (!this.db) {
                    this.hasReachedQuota = false;
                    this.isSupported = true;
                    var request = this.idbFactory.open("babylonjs", 1);
                    // Could occur if user is blocking the quota for the DB and/or doesn't grant access to IndexedDB
                    request.onerror = function (event) {
                        handleError();
                    };
                    // executes when a version change transaction cannot complete due to other active transactions
                    request.onblocked = function (event) {
                        BABYLON.Tools.Error("IDB request blocked. Please reload the page.");
                        handleError();
                    };
                    // DB has been opened successfully
                    request.onsuccess = function (event) {
                        _this.db = request.result;
                        successCallback();
                    };
                    // Initialization of the DB. Creating Scenes & Textures stores
                    request.onupgradeneeded = function (event) {
                        _this.db = (event.target).result;
                        try {
                            var scenesStore = _this.db.createObjectStore("scenes", { keyPath: "sceneUrl" });
                            var versionsStore = _this.db.createObjectStore("versions", { keyPath: "sceneUrl" });
                            var texturesStore = _this.db.createObjectStore("textures", { keyPath: "textureUrl" });
                        }
                        catch (ex) {
                            BABYLON.Tools.Error("Error while creating object stores. Exception: " + ex.message);
                            handleError();
                        }
                    };
                }
                else {
                    if (successCallback)
                        successCallback();
                }
            }
        };
        Database.prototype.loadImageFromDB = function (url, image) {
            var _this = this;
            var completeURL = Database.ReturnFullUrlLocation(url);
            var saveAndLoadImage = function () {
                if (!_this.hasReachedQuota && _this.db !== null) {
                    // the texture is not yet in the DB, let's try to save it
                    _this._saveImageIntoDBAsync(completeURL, image);
                }
                else {
                    image.src = url;
                }
            };
            if (!this.mustUpdateRessources) {
                this._loadImageFromDBAsync(completeURL, image, saveAndLoadImage);
            }
            else {
                saveAndLoadImage();
            }
        };
        Database.prototype._loadImageFromDBAsync = function (url, image, notInDBCallback) {
            if (this.isSupported && this.db !== null) {
                var texture;
                var transaction = this.db.transaction(["textures"]);
                transaction.onabort = function (event) {
                    image.src = url;
                };
                transaction.oncomplete = function (event) {
                    var blobTextureURL;
                    if (texture) {
                        var URL = window.URL || window.webkitURL;
                        blobTextureURL = URL.createObjectURL(texture.data, { oneTimeOnly: true });
                        image.onerror = function () {
                            BABYLON.Tools.Error("Error loading image from blob URL: " + blobTextureURL + " switching back to web url: " + url);
                            image.src = url;
                        };
                        image.src = blobTextureURL;
                    }
                    else {
                        notInDBCallback();
                    }
                };
                var getRequest = transaction.objectStore("textures").get(url);
                getRequest.onsuccess = function (event) {
                    texture = (event.target).result;
                };
                getRequest.onerror = function (event) {
                    BABYLON.Tools.Error("Error loading texture " + url + " from DB.");
                    image.src = url;
                };
            }
            else {
                BABYLON.Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                image.src = url;
            }
        };
        Database.prototype._saveImageIntoDBAsync = function (url, image) {
            var _this = this;
            if (this.isSupported) {
                // In case of error (type not supported or quota exceeded), we're at least sending back XHR data to allow texture loading later on
                var generateBlobUrl = function () {
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
                    image.src = blobTextureURL;
                };
                if (Database.IsUASupportingBlobStorage) {
                    var xhr = new XMLHttpRequest(), blob;
                    xhr.open("GET", url, true);
                    xhr.responseType = "blob";
                    xhr.addEventListener("load", function () {
                        if (xhr.status === 200) {
                            // Blob as response (XHR2)
                            blob = xhr.response;
                            var transaction = _this.db.transaction(["textures"], "readwrite");
                            // the transaction could abort because of a QuotaExceededError error
                            transaction.onabort = function (event) {
                                try {
                                    //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                                    if (event.srcElement['error'] && event.srcElement['error'].name === "QuotaExceededError") {
                                        this.hasReachedQuota = true;
                                    }
                                }
                                catch (ex) { }
                                generateBlobUrl();
                            };
                            transaction.oncomplete = function (event) {
                                generateBlobUrl();
                            };
                            var newTexture = { textureUrl: url, data: blob };
                            try {
                                // Put the blob into the dabase
                                var addRequest = transaction.objectStore("textures").put(newTexture);
                                addRequest.onsuccess = function (event) {
                                };
                                addRequest.onerror = function (event) {
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
                    xhr.addEventListener("error", function (event) {
                        BABYLON.Tools.Error("Error in XHR request in BABYLON.Database.");
                        image.src = url;
                    }, false);
                    xhr.send();
                }
                else {
                    image.src = url;
                }
            }
            else {
                BABYLON.Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                image.src = url;
            }
        };
        Database.prototype._checkVersionFromDB = function (url, versionLoaded) {
            var _this = this;
            var updateVersion = function (event) {
                // the version is not yet in the DB or we need to update it
                _this._saveVersionIntoDBAsync(url, versionLoaded);
            };
            this._loadVersionFromDBAsync(url, versionLoaded, updateVersion);
        };
        Database.prototype._loadVersionFromDBAsync = function (url, callback, updateInDBCallback) {
            var _this = this;
            if (this.isSupported) {
                var version;
                try {
                    var transaction = this.db.transaction(["versions"]);
                    transaction.oncomplete = function (event) {
                        if (version) {
                            // If the version in the JSON file is > than the version in DB
                            if (_this.manifestVersionFound > version.data) {
                                _this.mustUpdateRessources = true;
                                updateInDBCallback();
                            }
                            else {
                                callback(version.data);
                            }
                        }
                        else {
                            _this.mustUpdateRessources = true;
                            updateInDBCallback();
                        }
                    };
                    transaction.onabort = function (event) {
                        callback(-1);
                    };
                    var getRequest = transaction.objectStore("versions").get(url);
                    getRequest.onsuccess = function (event) {
                        version = (event.target).result;
                    };
                    getRequest.onerror = function (event) {
                        BABYLON.Tools.Error("Error loading version for scene " + url + " from DB.");
                        callback(-1);
                    };
                }
                catch (ex) {
                    BABYLON.Tools.Error("Error while accessing 'versions' object store (READ OP). Exception: " + ex.message);
                    callback(-1);
                }
            }
            else {
                BABYLON.Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                callback(-1);
            }
        };
        Database.prototype._saveVersionIntoDBAsync = function (url, callback) {
            var _this = this;
            if (this.isSupported && !this.hasReachedQuota) {
                try {
                    // Open a transaction to the database
                    var transaction = this.db.transaction(["versions"], "readwrite");
                    // the transaction could abort because of a QuotaExceededError error
                    transaction.onabort = function (event) {
                        try {
                            if (event.srcElement['error'] && event.srcElement['error'].name === "QuotaExceededError") {
                                _this.hasReachedQuota = true;
                            }
                        }
                        catch (ex) { }
                        callback(-1);
                    };
                    transaction.oncomplete = function (event) {
                        callback(_this.manifestVersionFound);
                    };
                    var newVersion = { sceneUrl: url, data: this.manifestVersionFound };
                    // Put the scene into the database
                    var addRequest = transaction.objectStore("versions").put(newVersion);
                    addRequest.onsuccess = function (event) {
                    };
                    addRequest.onerror = function (event) {
                        BABYLON.Tools.Error("Error in DB add version request in BABYLON.Database.");
                    };
                }
                catch (ex) {
                    BABYLON.Tools.Error("Error while accessing 'versions' object store (WRITE OP). Exception: " + ex.message);
                    callback(-1);
                }
            }
            else {
                callback(-1);
            }
        };
        Database.prototype.loadFileFromDB = function (url, sceneLoaded, progressCallBack, errorCallback, useArrayBuffer) {
            var _this = this;
            var completeUrl = Database.ReturnFullUrlLocation(url);
            var saveAndLoadFile = function (event) {
                // the scene is not yet in the DB, let's try to save it
                _this._saveFileIntoDBAsync(completeUrl, sceneLoaded, progressCallBack);
            };
            this._checkVersionFromDB(completeUrl, function (version) {
                if (version !== -1) {
                    if (!_this.mustUpdateRessources) {
                        _this._loadFileFromDBAsync(completeUrl, sceneLoaded, saveAndLoadFile, useArrayBuffer);
                    }
                    else {
                        _this._saveFileIntoDBAsync(completeUrl, sceneLoaded, progressCallBack, useArrayBuffer);
                    }
                }
                else {
                    errorCallback();
                }
            });
        };
        Database.prototype._loadFileFromDBAsync = function (url, callback, notInDBCallback, useArrayBuffer) {
            if (this.isSupported) {
                var targetStore;
                if (url.indexOf(".babylon") !== -1) {
                    targetStore = "scenes";
                }
                else {
                    targetStore = "textures";
                }
                var file;
                var transaction = this.db.transaction([targetStore]);
                transaction.oncomplete = function (event) {
                    if (file) {
                        callback(file.data);
                    }
                    else {
                        notInDBCallback();
                    }
                };
                transaction.onabort = function (event) {
                    notInDBCallback();
                };
                var getRequest = transaction.objectStore(targetStore).get(url);
                getRequest.onsuccess = function (event) {
                    file = (event.target).result;
                };
                getRequest.onerror = function (event) {
                    BABYLON.Tools.Error("Error loading file " + url + " from DB.");
                    notInDBCallback();
                };
            }
            else {
                BABYLON.Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                callback();
            }
        };
        Database.prototype._saveFileIntoDBAsync = function (url, callback, progressCallback, useArrayBuffer) {
            var _this = this;
            if (this.isSupported) {
                var targetStore;
                if (url.indexOf(".babylon") !== -1) {
                    targetStore = "scenes";
                }
                else {
                    targetStore = "textures";
                }
                // Create XHR
                var xhr = new XMLHttpRequest(), fileData;
                xhr.open("GET", url, true);
                if (useArrayBuffer) {
                    xhr.responseType = "arraybuffer";
                }
                xhr.onprogress = progressCallback;
                xhr.addEventListener("load", function () {
                    if (xhr.status === 200 || BABYLON.Tools.ValidateXHRData(xhr, !useArrayBuffer ? 1 : 6)) {
                        // Blob as response (XHR2)
                        //fileData = xhr.responseText;
                        fileData = !useArrayBuffer ? xhr.responseText : xhr.response;
                        if (!_this.hasReachedQuota) {
                            // Open a transaction to the database
                            var transaction = _this.db.transaction([targetStore], "readwrite");
                            // the transaction could abort because of a QuotaExceededError error
                            transaction.onabort = function (event) {
                                try {
                                    //backwards compatibility with ts 1.0, srcElement doesn't have an "error" according to ts 1.3
                                    if (event.srcElement['error'] && event.srcElement['error'].name === "QuotaExceededError") {
                                        this.hasReachedQuota = true;
                                    }
                                }
                                catch (ex) { }
                                callback(fileData);
                            };
                            transaction.oncomplete = function (event) {
                                callback(fileData);
                            };
                            var newFile;
                            if (targetStore === "scenes") {
                                newFile = { sceneUrl: url, data: fileData, version: _this.manifestVersionFound };
                            }
                            else {
                                newFile = { textureUrl: url, data: fileData };
                            }
                            try {
                                // Put the scene into the database
                                var addRequest = transaction.objectStore(targetStore).put(newFile);
                                addRequest.onsuccess = function (event) {
                                };
                                addRequest.onerror = function (event) {
                                    BABYLON.Tools.Error("Error in DB add file request in BABYLON.Database.");
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
                xhr.addEventListener("error", function (event) {
                    BABYLON.Tools.Error("error on XHR request.");
                    callback();
                }, false);
                xhr.send();
            }
            else {
                BABYLON.Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
                callback();
            }
        };
        Database.IsUASupportingBlobStorage = true;
        Database.IDBStorageEnabled = true;
        Database.parseURL = function (url) {
            var a = document.createElement('a');
            a.href = url;
            var urlWithoutHash = url.substring(0, url.lastIndexOf("#"));
            var fileName = url.substring(urlWithoutHash.lastIndexOf("/") + 1, url.length);
            var absLocation = url.substring(0, url.indexOf(fileName, 0));
            return absLocation;
        };
        Database.ReturnFullUrlLocation = function (url) {
            if (url.indexOf("http:/") === -1) {
                return (Database.parseURL(window.location.href) + url);
            }
            else {
                return url;
            }
        };
        return Database;
    })();
    BABYLON.Database = Database;
})(BABYLON || (BABYLON = {}));
