"use strict";

var BABYLON = BABYLON || {};

(function () {
    function parseURL(url) {
        var a = document.createElement('a');
        a.href = url;
        var fileName = url.substring(url.lastIndexOf("/") + 1, url.length);
        var absLocation = url.substring(0, url.indexOf(fileName, 0));
        return absLocation;
    };

    // Handling various flavors of prefixed version of IndexedDB
    var indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB ||
        window.msIndexedDB;
    var IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
        window.msIDBTransaction;
    var IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    BABYLON.Database = function (urlToScene) {
        this.currentSceneUrl = BABYLON.Database.ReturnFullUrlLocation(urlToScene);
        this.db = null;
        this.enableSceneOffline = false;
        this.enableTexturesOffline = false;
        this.manifestVersionFound = 0;
        this.mustUpdateRessources = false;
        this.hasReachedQuota = false;
        this.checkManifestFile();
    };

    BABYLON.Database.isUASupportingBlobStorage = true;

    BABYLON.Database.ReturnFullUrlLocation = function (url) {
        if (url.indexOf("http:/") === -1) {
            return (parseURL(window.location.href) + url);
        }
        else {
            return url;
        }
    };

    BABYLON.Database.prototype.checkManifestFile = function () {
        function noManifestFile() {
            BABYLON.Tools.Log("Valid manifest file not found. Scene & textures will be loaded directly from the web server.");
            that.enableSceneOffline = false;
            that.enableTexturesOffline = false;
        };

        var that = this;
        var manifestURL = this.currentSceneUrl + ".manifest";

        var xhr = new XMLHttpRequest();

        xhr.open("GET", manifestURL, false);

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                try {
                    var manifestFile = JSON.parse(xhr.response);
                    that.enableSceneOffline = manifestFile.enableSceneOffline;
                    that.enableTexturesOffline = manifestFile.enableTexturesOffline;
                    if (manifestFile.version && !isNaN(parseInt(manifestFile.version))) {
                        that.manifestVersionFound = manifestFile.version;
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
        }
    };

    BABYLON.Database.prototype.openAsync = function (successCallback, errorCallback) {
        function handleError() {
            that.isSupported = false;
            if (errorCallback) errorCallback();
        }

        var that = this;
        if (!indexedDB || !(this.enableSceneOffline || this.enableTexturesOffline)) {
            // Your browser doesn't support IndexedDB
            this.isSupported = false;
            if (errorCallback) errorCallback();
        }
        else {
            // If the DB hasn't been opened or created yet
            if (!this.db) {
                this.hasReachedQuota = false;
                this.isSupported = true;

                var request = indexedDB.open("babylonjs", 1.0);

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
                    that.db = request.result;
                    successCallback();
                };

                // Initialization of the DB. Creating Scenes & Textures stores
                request.onupgradeneeded = function (event) {
                    that.db = event.target.result;
                    try {
                        var scenesStore = that.db.createObjectStore("scenes", { keyPath: "sceneUrl" });
                        var versionsStore = that.db.createObjectStore("versions", { keyPath: "sceneUrl" });
                        var texturesStore = that.db.createObjectStore("textures", { keyPath: "textureUrl" });
                    }
                    catch (ex) {
                        BABYLON.Tools.Error("Error while creating object stores. Exception: " + ex.message);
                        handleError();
                    }
                };
            }
            // DB has already been created and opened
            else {
                if (successCallback) successCallback();
            }
        }
    };

    BABYLON.Database.prototype.loadImageFromDB = function (url, image) {
        var that = this;
        var completeURL = BABYLON.Database.ReturnFullUrlLocation(url);

        var saveAndLoadImage = function (event) {
            if (!that.hasReachedQuota && that.db !== null) {
                // the texture is not yet in the DB, let's try to save it
                that._saveImageIntoDBAsync(completeURL, image);
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
    };

    BABYLON.Database.prototype._loadImageFromDBAsync = function (url, image, notInDBCallback) {
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
                    image.src = blobTextureURL;
                }
                else {
                    notInDBCallback();
                }
            };

            var getRequest = transaction.objectStore("textures").get(url);

            getRequest.onsuccess = function (event) {
                texture = event.target.result;
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

    BABYLON.Database.prototype._saveImageIntoDBAsync = function (url, image) {
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

            if (BABYLON.Database.isUASupportingBlobStorage) {
                var that = this;
                // Create XHR
                var xhr = new XMLHttpRequest(),
                    blob;

                xhr.open("GET", url, true);
                xhr.responseType = "blob";

                xhr.addEventListener("load", function () {
                    if (xhr.status === 200) {
                        // Blob as response (XHR2)
                        blob = xhr.response;

                        var transaction = that.db.transaction(["textures"], "readwrite");

                        // the transaction could abort because of a QuotaExceededError error
                        transaction.onabort = function (event) {
                            try {
                                if (event.srcElement.error.name === "QuotaExceededError") {
                                    that.hasReachedQuota = true;
                                }
                            }
                            catch (ex) { }
                            generateBlobUrl();
                        };

                        transaction.oncomplete = function (event) {
                            generateBlobUrl();
                        };

                        var newTexture = {};
                        newTexture.textureUrl = url;
                        newTexture.data = blob;

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
                                BABYLON.Database.isUASupportingBlobStorage = false;
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

    BABYLON.Database.prototype._checkVersionFromDB = function (url, versionLoaded) {
        var that = this;

        var updateVersion = function (event) {
            // the version is not yet in the DB or we need to update it
            that._saveVersionIntoDBAsync(url, versionLoaded);
        };
        this._loadVersionFromDBAsync(url, versionLoaded, updateVersion);
    };

    BABYLON.Database.prototype._loadVersionFromDBAsync = function (url, callback, updateInDBCallback) {
        if (this.isSupported) {
            var version;
            var that = this;
            try {
                var transaction = this.db.transaction(["versions"]);

                transaction.oncomplete = function (event) {
                    if (version) {
                        // If the version in the JSON file is > than the version in DB
                        if (that.manifestVersionFound > version.data) {
                            that.mustUpdateRessources = true;
                            updateInDBCallback();
                        }
                        else {
                            callback(version.data);
                        }
                    }
                        // version was not found in DB
                    else {
                        that.mustUpdateRessources = true;
                        updateInDBCallback();
                    }
                };

                transaction.onabort = function (event) {
                    callback(-1);
                };

                var getRequest = transaction.objectStore("versions").get(url);

                getRequest.onsuccess = function (event) {
                    version = event.target.result;
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

    BABYLON.Database.prototype._saveVersionIntoDBAsync = function (url, callback) {
        if (this.isSupported && !this.hasReachedQuota) {
            var that = this;
            try {
                // Open a transaction to the database
                var transaction = this.db.transaction(["versions"], "readwrite");

                // the transaction could abort because of a QuotaExceededError error
                transaction.onabort = function (event) {
                    try {
                        if (event.srcElement.error.name === "QuotaExceededError") {
                            that.hasReachedQuota = true;
                        }
                    }
                    catch (ex) { }
                    callback(-1);
                };

                transaction.oncomplete = function (event) {
                    callback(that.manifestVersionFound);
                };

                var newVersion = {};
                newVersion.sceneUrl = url;
                newVersion.data = this.manifestVersionFound;

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

    BABYLON.Database.prototype.loadSceneFromDB = function (url, sceneLoaded, progressCallBack, errorCallback) {
        var that = this;
        var completeUrl = BABYLON.Database.ReturnFullUrlLocation(url);
        
        var saveAndLoadScene = function (event) {
            // the scene is not yet in the DB, let's try to save it
            that._saveSceneIntoDBAsync(completeUrl, sceneLoaded, progressCallBack);
        };

        this._checkVersionFromDB(completeUrl, function (version) {
            if (version !== -1) {
                if (!that.mustUpdateRessources) {
                    that._loadSceneFromDBAsync(completeUrl, sceneLoaded, saveAndLoadScene);
                }
                else {
                    that._saveSceneIntoDBAsync(completeUrl, sceneLoaded, progressCallBack);
                }
            }
            else {
                errorCallback();
            }
        });
    };

    BABYLON.Database.prototype._loadSceneFromDBAsync = function (url, callback, notInDBCallback) {
        if (this.isSupported) {
            var scene;
            var transaction = this.db.transaction(["scenes"]);

            transaction.oncomplete = function (event) {
                if (scene) {
                    callback(scene.data);
                }
                // scene was not found in DB
                else {
                    notInDBCallback();
                }
            };

            transaction.onabort = function (event) {
                notInDBCallback();
            };

            var getRequest = transaction.objectStore("scenes").get(url);

            getRequest.onsuccess = function (event) {
                scene = event.target.result;
            };
            getRequest.onerror = function (event) {
                BABYLON.Tools.Error("Error loading scene " + url + " from DB.");
                notInDBCallback();
            };
        }
        else {
            BABYLON.Tools.Error("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            callback();
        }
    };

    BABYLON.Database.prototype._saveSceneIntoDBAsync = function (url, callback, progressCallback) {
        if (this.isSupported) {
            // Create XHR
            var xhr = new XMLHttpRequest(), sceneText;
            var that = this;

            xhr.open("GET", url, true);

            xhr.onprogress = progressCallback;
            
            xhr.addEventListener("load", function () {
                if (xhr.status === 200) {
                    // Blob as response (XHR2)
                    sceneText = xhr.responseText;

                    if (!that.hasReachedQuota) {
                        // Open a transaction to the database
                        var transaction = that.db.transaction(["scenes"], "readwrite");

                        // the transaction could abort because of a QuotaExceededError error
                        transaction.onabort = function (event) {
                            try {
                                if (event.srcElement.error.name === "QuotaExceededError") {
                                    that.hasReachedQuota = true;
                                }
                            }
                            catch (ex) { }
                            callback(sceneText);
                        };

                        transaction.oncomplete = function (event) {
                            callback(sceneText);
                        };

                        var newScene = {};
                        newScene.sceneUrl = url;
                        newScene.data = sceneText;
                        newScene.version = that.manifestVersionFound;

                        try {
                            // Put the scene into the database
                            var addRequest = transaction.objectStore("scenes").put(newScene);
                            addRequest.onsuccess = function (event) {
                            };
                            addRequest.onerror = function (event) {
                                BABYLON.Tools.Error("Error in DB add scene request in BABYLON.Database.");
                            };
                        }
                        catch (ex) {
                            callback(sceneText);
                        }
                    }
                    else {
                        callback(sceneText);
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
})();
