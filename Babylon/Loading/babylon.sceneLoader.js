"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.SceneLoader = {
        _registeredPlugins: [],

        _getPluginForFilename: function(sceneFilename) {
            var dotPosition = sceneFilename.lastIndexOf(".");
            var extension = sceneFilename.substring(dotPosition).toLowerCase();

            for (var index = 0; index < this._registeredPlugins.length; index++) {
                var plugin = this._registeredPlugins[index];

                if (plugin.extensions.indexOf(extension) !== -1) {
                    return plugin;
                }
            }

            return this._registeredPlugins[this._registeredPlugins.length - 1];
        },

        // Flags
        ForceFullSceneLoadingForIncremental: false,

        // Public functions
        RegisterPlugin: function (plugin) {
            plugin.extensions = plugin.extensions.toLowerCase();
            this._registeredPlugins.push(plugin);
        },

        ImportMesh: function (meshesNames, rootUrl, sceneFilename, scene, onsuccess, progressCallBack, onerror) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            var database = new BABYLON.Database(rootUrl + sceneFilename);
            scene.database = database;

            var plugin = this._getPluginForFilename(sceneFilename);

            var importMeshFromData = function(data) {
                var meshes = [];
                var particleSystems = [];
                var skeletons = [];

                if (!plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons)) {
                    if (onerror) {
                        onerror(scene);
                    }

                    return;
                }

                if (onsuccess) {
                    scene.importedMeshesFiles.push(rootUrl + sceneFilename);
                    onsuccess(meshes, particleSystems, skeletons);
                }
            };

            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                // Direct load
                importMeshFromData(sceneFilename.substr(5));
                return;
            }

            BABYLON.Tools.LoadFile(rootUrl + sceneFilename, function (data) {
                importMeshFromData(data);
            }, progressCallBack, database);
        },

        /**
        * Load a scene
        * @param rootUrl a string that defines the root url for scene and resources
        * @param sceneFilename a string that defines the name of the scene file. can start with "data:" following by the stringified version of the scene
        * @param engine is the instance of BABYLON.Engine to use to create the scene
        */
        Load: function (rootUrl, sceneFilename, engine, onsuccess, progressCallBack, onerror) {

            var plugin = this._getPluginForFilename(sceneFilename.name || sceneFilename);
            var database;

            var loadSceneFromData = function (data) {
                var scene = new BABYLON.Scene(engine);
                scene.database = database;

                if (!plugin.load(scene, data, rootUrl)) {
                    if (onerror) {
                        onerror(scene);
                    }

                    return;
                }

                if (onsuccess) {
                    onsuccess(scene);
                }
            };

            if (sceneFilename.substr && sceneFilename.substr(0, 5) === "data:") {
                // Direct load
                loadSceneFromData(sceneFilename.substr(5));
                return;
            }

            if (rootUrl.indexOf("file:") === -1) {
                // Checking if a manifest file has been set for this scene and if offline mode has been requested
                database = new BABYLON.Database(rootUrl + sceneFilename);

                BABYLON.Tools.LoadFile(rootUrl + sceneFilename, loadSceneFromData, progressCallBack, database);
            }
                // Loading file from disk via input file or drag'n'drop
            else {
                BABYLON.Tools.ReadFile(sceneFilename, loadSceneFromData, progressCallBack);
            }
        }
    };
})();