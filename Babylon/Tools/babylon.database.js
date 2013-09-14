var BABYLON = BABYLON || {};

(function () {
    BABYLON.Database = {};
    var db = null;

    BABYLON.Database.enableSceneOffline = false;
    BABYLON.Database.enableTexturesOffline = false;
    BABYLON.Database.sceneToLoad = "";
    BABYLON.Database.currentSceneVersion = 0;
    BABYLON.Database.isUASupportingBlobStorage = true;
    BABYLON.Database.mustUpdateRessources = false;

    // Handling various flavors of prefixed version of IndexedDB
    window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB ||
        window.msIndexedDB;
    window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction ||
        window.msIDBTransaction;
    window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

    function parseURL(url) {
        var a = document.createElement('a');
        a.href = url;
        var fileName = url.substring(url.lastIndexOf("/") + 1, url.length);
        var absLocation = url.substring(0, url.indexOf(fileName, 0));
        return absLocation;
    }

    BABYLON.Database.CheckManifestFile = function (rootUrl, sceneFilename) {
        var absLocation = parseURL(window.location.href);
        BABYLON.Database.sceneToLoad = absLocation + rootUrl + sceneFilename;
        var manifestURL = BABYLON.Database.sceneToLoad + ".manifest";

        var xhr = new XMLHttpRequest();

        xhr.open("GET", manifestURL, false);

        xhr.addEventListener("load", function () {
            if (xhr.status === 200) {
                try {
                    manifestFile = JSON.parse(xhr.response);
                    BABYLON.Database.enableSceneOffline = manifestFile.enableSceneOffline;
                    BABYLON.Database.enableTexturesOffline = manifestFile.enableTexturesOffline;
                    if (manifestFile.version && !isNaN(parseInt(manifestFile.version))) {
                        BABYLON.Database.currentSceneVersion = manifestFile.version;
                    }
                }
                catch (ex) {
                    BABYLON.Database.enableSceneOffline = false;
                    BABYLON.Database.enableTexturesOffline = false;
                }
            }
            else {
                BABYLON.Database.enableSceneOffline = false;
                BABYLON.Database.enableTexturesOffline = false;
            }
        }, false);

        xhr.addEventListener("error", function (event) {
            BABYLON.Database.enableSceneOffline = false;
            BABYLON.Database.enableTexturesOffline = false;
        }, false);

        xhr.send();
    };

    BABYLON.Database.OpenAsync = function (successCallback, errorCallback) {
        if (!window.indexedDB || !(BABYLON.Database.enableSceneOffline || BABYLON.Database.enableTexturesOffline)) {
            // Your browser doesn't support IndexedDB
            BABYLON.Database.isSupported = false;
            if (errorCallback) errorCallback();
        }
        else {
            // If the DB hasn't been opened or created yet
            if (!db) {
                BABYLON.Database.hasReachedQuota = false;
                BABYLON.Database.isSupported = true;

                var request = window.indexedDB.open("babylonjs", 1.0);

                // Could occur if user is blocking the quota for the DB and/or doesn't grant access to IndexedDB
                request.onerror = function (event) {
                    BABYLON.Database.isSupported = false;
                    if (errorCallback) errorCallback();
                };

                // executes when a version change transaction cannot complete due to other active transactions
                request.onblocked = function (event) {
                    console.log("IDB request blocked. Please reload the page.");
                    if (errorCallback) errorCallback();
                };

                // DB has been opened successfully
                request.onsuccess = function (event) {
                    db = request.result;
                    isOpeningDB = false;
                    console.log("DB opened.");
                    successCallback();
                };

                // Initialization of the DB. Creating Scenes & Textures stores
                request.onupgradeneeded = function (event) {
                    db = event.target.result;
                    var scenesStore = db.createObjectStore("scenes", { keyPath: "sceneUrl" });
                    var scenesStore = db.createObjectStore("versions", { keyPath: "sceneUrl" });
                    var texturesStore = db.createObjectStore("textures", { keyPath: "textureUrl" });
                };
            }
            // DB has already been created and opened
            else {
                if (successCallback) successCallback();
            }
        }
    };

    BABYLON.Database.LoadImageFromDB = function (url, image) {
        var saveAndLoadImage = function (event) {
            if (!BABYLON.Database.hasReachedQuota && db !== null) {
                console.log("Saving into DB: " + url);
                // the texture is not yet in the DB, let's try to save it
                BABYLON.Database._saveImageIntoDBAsync(url, image);
            }
            // If the texture is not in the DB and we've reached the DB quota limit
            // let's load it directly from the web
            else {
                console.log("Image loaded directly from the web: " + url);
                image.src = url;
            }
        };
        console.log("Currently working on: " + url);

        if (!BABYLON.Database.mustUpdateRessources) {
            BABYLON.Database._loadImageFromDBAsync(url, image, saveAndLoadImage);
        }
        else {
            saveAndLoadImage();
        }
    };

    BABYLON.Database._loadImageFromDBAsync = function (url, image, notInDBCallback) {
        if (BABYLON.Database.isSupported && db !== null) {
            var indexeddbUrl = BABYLON.Database.sceneToLoad + "/" + url;
            var texture;
            var transaction = db.transaction(["textures"]);

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

            var getRequest = transaction.objectStore("textures").get(indexeddbUrl);

            getRequest.onsuccess = function (event) {
                texture = event.target.result;
            };
            getRequest.onerror = function (event) {
                console.log("error loading texture " + indexeddbUrl + " from DB.");
                image.src = url;
            };
        }
        else {
            console.log("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            image.src = url;
        }
    };

    BABYLON.Database._saveImageIntoDBAsync = function (url, image) {
        if (BABYLON.Database.isSupported) {
            var indexeddbUrl = BABYLON.Database.sceneToLoad + "/" + url;

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
                // Create XHR
                var xhr = new XMLHttpRequest(),
                    blob;

                xhr.open("GET", url, true);
                xhr.responseType = "blob";

                xhr.addEventListener("load", function () {
                    if (xhr.status === 200) {
                        // Blob as response (XHR2)
                        blob = xhr.response;

                        // Open a transaction to the database
                        var transaction = db.transaction(["textures"], "readwrite");

                        // the transaction could abort because of a QuotaExceededError error
                        transaction.onabort = function (event) {
                            try {
                                if (event.srcElement.error.name === "QuotaExceededError") {
                                    console.log("QUOTA EXCEEDED ERROR.");
                                    BABYLON.Database.hasReachedQuota = true;
                                }
                            }
                            catch (ex) { }
                            generateBlobUrl();
                        };

                        transaction.oncomplete = function (event) {
                            generateBlobUrl();
                            console.log("Saved into DB successfully.");
                        };

                        var newTexture = {};
                        newTexture.textureUrl = indexeddbUrl;
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
                                console.log("Exception. Returning URL because UA doesn't support Blob in IDB.");
                            }
                            image.src = url;
                        }
                    }
                    else {
                        image.src = url;
                    }
                }, false);

                xhr.addEventListener("error", function (event) {
                    console.log("error on XHR request.");
                    image.src = url;
                }, false);

                xhr.send();
            }
            else {
                console.log("Directly returning URL because UA doesn't support Blob in IDB.");
                image.src = url;
            }
        }
        else {
            console.log("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            image.src = url;
        }
    };

    BABYLON.Database._checkVersionFromDB = function (versionLoaded) {
        var updateVersion = function (event) {
            // the version is not yet in the DB or we need to update it
            BABYLON.Database._saveVersionIntoDBAsync(versionLoaded);
        };
        BABYLON.Database._loadVersionFromDBAsync(versionLoaded, updateVersion);
    };

    BABYLON.Database._loadVersionFromDBAsync = function (callback, updateInDBCallback) {
        if (BABYLON.Database.isSupported) {
            var version;
            var transaction = db.transaction(["versions"]);

            transaction.oncomplete = function (event) {
                if (version) {
                    // If the version in the JSON file is > than the version in DB
                    if (BABYLON.Database.currentSceneVersion > version.data) {
                        console.log("Version change detected. Need to update DB with new ressources.");
                        BABYLON.Database.mustUpdateRessources = true;
                        updateInDBCallback();
                    }
                    else {
                        callback(version.data);
                    }
                }
                // version was not found in DB
                else {
                    BABYLON.Database.mustUpdateRessources = true;
                    updateInDBCallback();
                }
            };

            transaction.onabort = function (event) {
                callback(-1);
            };

            var getRequest = transaction.objectStore("versions").get(BABYLON.Database.sceneToLoad);

            getRequest.onsuccess = function (event) {
                version = event.target.result;
            };
            getRequest.onerror = function (event) {
                console.log("error loading version for scene " + BABYLON.Database.sceneToLoad + " from DB.");
                callback(-1);
            };
        }
        else {
            console.log("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            callback(-1);
        }
    };

    BABYLON.Database._saveVersionIntoDBAsync = function (callback) {
        if (BABYLON.Database.isSupported && !BABYLON.Database.hasReachedQuota) {
            // Open a transaction to the database
            var transaction = db.transaction(["versions"], "readwrite");

            // the transaction could abort because of a QuotaExceededError error
            transaction.onabort = function (event) {
                try {
                    if (event.srcElement.error.name === "QuotaExceededError") {
                        BABYLON.Database.hasReachedQuota = true;
                    }
                }
                catch (ex) { }
                callback(-1);
            };

            transaction.oncomplete = function (event) {
                callback(BABYLON.Database.currentSceneVersion);
            };

            var newVersion = {};
            newVersion.sceneUrl = BABYLON.Database.sceneToLoad;
            newVersion.data = BABYLON.Database.currentSceneVersion;

            try {
                // Put the scene into the database
                var addRequest = transaction.objectStore("versions").put(newVersion);
                addRequest.onsuccess = function (event) {

                };
                addRequest.onerror = function (event) {
                    console.log("error add request");
                };
            }
            catch (ex) {
                callback(-1);
            }
        }
        else {
            callback(-1);
        }
    };

    BABYLON.Database.LoadSceneFromDB = function (sceneLoaded, progressCallBack) {
        var saveAndLoadScene = function (event) {
            // the scene is not yet in the DB, let's try to save it
            BABYLON.Database._saveSceneIntoDBAsync(sceneLoaded, progressCallBack);
        };

        BABYLON.Database._checkVersionFromDB(function (version) {
            console.log("Version: " + version);
            if (!BABYLON.Database.mustUpdateRessources) {
                BABYLON.Database._loadSceneFromDBAsync(sceneLoaded, saveAndLoadScene);
            }
            else {
                BABYLON.Database._saveSceneIntoDBAsync(sceneLoaded, progressCallBack);
            }
        });
    };

    BABYLON.Database._loadSceneFromDBAsync = function (callback, notInDBCallback) {
        if (BABYLON.Database.isSupported) {
            var scene;
            var transaction = db.transaction(["scenes"]);

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

            var getRequest = transaction.objectStore("scenes").get(BABYLON.Database.sceneToLoad);

            getRequest.onsuccess = function (event) {
                scene = event.target.result;
            };
            getRequest.onerror = function (event) {
                console.log("error loading scene " + BABYLON.Database.sceneToLoad + " from DB.");
                notInDBCallback();
            };
        }
        else {
            console.log("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            callback();
        }
    };

    BABYLON.Database._saveSceneIntoDBAsync = function (callback, progressCallback) {
        if (BABYLON.Database.isSupported) {
            // Create XHR
            var xhr = new XMLHttpRequest(), sceneText;

            xhr.open("GET", BABYLON.Database.sceneToLoad, true);

            xhr.onprogress = progressCallback;

            xhr.addEventListener("load", function () {
                if (xhr.status === 200) {
                    // Blob as response (XHR2)
                    sceneText = xhr.responseText;

                    if (!BABYLON.Database.hasReachedQuota) {
                        // Open a transaction to the database
                        var transaction = db.transaction(["scenes"], "readwrite");

                        // the transaction could abort because of a QuotaExceededError error
                        transaction.onabort = function (event) {
                            try {
                                if (event.srcElement.error.name === "QuotaExceededError") {
                                    BABYLON.Database.hasReachedQuota = true;
                                }
                            }
                            catch (ex) { }
                            callback(sceneText);
                        };

                        transaction.oncomplete = function (event) {
                            callback(sceneText);
                        };

                        var newScene = {};
                        newScene.sceneUrl = BABYLON.Database.sceneToLoad;
                        newScene.data = sceneText;
                        newScene.version = BABYLON.Database.currentSceneVersion;

                        try {
                            // Put the scene into the database
                            var addRequest = transaction.objectStore("scenes").put(newScene);
                            addRequest.onsuccess = function (event) {

                            };
                            addRequest.onerror = function (event) {
                                console.log("error add request");
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
                console.log("error on XHR request.");
                callback();
            }, false);

            xhr.send();
        }
        else {
            console.log("Error: IndexedDB not supported by your browser or BabylonJS Database is not open.");
            callback();
        }
    };

    // Called to close the db and reset the objects
    BABYLON.Database.Release = function () {
        if (db) {
            db.close();
            db = null;
            console.log("DB closed.");
            BABYLON.Database.hasReachedQuota = false;
            BABYLON.Database.mustUpdateRessources = false;
            BABYLON.Database.enableSceneOffline = false;
            BABYLON.Database.enableTexturesOffline = false;
            BABYLON.Database.sceneToLoad = "";
            BABYLON.Database.currentSceneVersion = 0;
        }
    };
})();
