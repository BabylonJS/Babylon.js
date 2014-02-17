"use strict";

var BABYLON = BABYLON || {};

(function () {
    BABYLON.SceneLoader = {
        _registeredPlugins: [],

        _getPluginForFilename: function (sceneFilename) {
            var dotPosition = sceneFilename.lastIndexOf(".");
            var extension = sceneFilename.substring(dotPosition).toLowerCase();

            for (var index = 0; index < this._registeredPlugins.length; index++) {
                var plugin = this._registeredPlugins[index];

                if (plugin.extensions.indexOf(extension) !== -1) {
                    return plugin;
                }
            }

            throw new Error("No plugin found to load this file: " + sceneFilename);
        },

        // Public functions
        RegisterPlugin: function (plugin) {
            plugin.extensions = plugin.extensions.toLowerCase();
            this._registeredPlugins.push(plugin);
        },

        ImportMesh: function (meshesNames, rootUrl, sceneFilename, scene, then, progressCallBack) {
            // Checking if a manifest file has been set for this scene and if offline mode has been requested
            var database = new BABYLON.Database(rootUrl + sceneFilename);
            scene.database = database;

            var plugin = this._getPluginForFilename(sceneFilename);

            BABYLON.Tools.LoadFile(rootUrl + sceneFilename, function (data) {
                var meshes = [];
                var particleSystems = [];
                var skeletons = [];

                plugin.importMesh(meshesNames, scene, data, rootUrl, meshes, particleSystems, skeletons);

                if (then) {
                    then(meshes, particleSystems, skeletons);
                }
            }, progressCallBack, database);
        },

        Load: function (rootUrl, sceneFilename, engine, then, progressCallBack) {

            var plugin = this._getPluginForFilename(sceneFilename);
            var database;

            var loadSceneFromData = function (data) {
                var scene = new BABYLON.Scene(engine);
                scene.database = database;
                plugin.load(scene, data, rootUrl);

                if (then) {
                    then(scene);
                }
            };

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