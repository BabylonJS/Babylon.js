var BABYLON;
(function (BABYLON) {
    var MeshAssetTask = (function () {
        function MeshAssetTask(name, meshesNames, rootUrl, sceneFilename) {
            this.name = name;
            this.meshesNames = meshesNames;
            this.rootUrl = rootUrl;
            this.sceneFilename = sceneFilename;
            this.isCompleted = false;
        }
        MeshAssetTask.prototype.run = function (scene, onSuccess, onError) {
            var _this = this;
            BABYLON.SceneLoader.ImportMesh(this.meshesNames, this.rootUrl, this.sceneFilename, scene, function (meshes, particleSystems, skeletons) {
                _this.loadedMeshes = meshes;
                _this.loadedParticleSystems = particleSystems;
                _this.loadedSkeletons = skeletons;

                _this.isCompleted = true;

                if (_this.onSuccess) {
                    _this.onSuccess(_this);
                }

                onSuccess();
            }, null, function () {
                if (_this.onError) {
                    _this.onError(_this);
                }

                onError();
            });
        };
        return MeshAssetTask;
    })();
    BABYLON.MeshAssetTask = MeshAssetTask;

    var TextFileAssetTask = (function () {
        function TextFileAssetTask(name, url) {
            this.name = name;
            this.url = url;
            this.isCompleted = false;
        }
        TextFileAssetTask.prototype.run = function (scene, onSuccess, onError) {
            var _this = this;
            BABYLON.Tools.LoadFile(this.url, function (data) {
                _this.text = data;
                _this.isCompleted = true;

                if (_this.onSuccess) {
                    _this.onSuccess(_this);
                }

                onSuccess();
            }, null, scene.database, false, function () {
                if (_this.onError) {
                    _this.onError(_this);
                }

                onError();
            });
        };
        return TextFileAssetTask;
    })();
    BABYLON.TextFileAssetTask = TextFileAssetTask;

    var BinaryFileAssetTask = (function () {
        function BinaryFileAssetTask(name, url) {
            this.name = name;
            this.url = url;
            this.isCompleted = false;
        }
        BinaryFileAssetTask.prototype.run = function (scene, onSuccess, onError) {
            var _this = this;
            BABYLON.Tools.LoadFile(this.url, function (data) {
                _this.data = data;
                _this.isCompleted = true;

                if (_this.onSuccess) {
                    _this.onSuccess(_this);
                }

                onSuccess();
            }, null, scene.database, true, function () {
                if (_this.onError) {
                    _this.onError(_this);
                }

                onError();
            });
        };
        return BinaryFileAssetTask;
    })();
    BABYLON.BinaryFileAssetTask = BinaryFileAssetTask;

    var AssetsManager = (function () {
        function AssetsManager(scene) {
            this._tasks = new Array();
            this._waitingTasksCount = 0;
            this.useDefaultLoadingScreen = true;
            this._scene = scene;
        }
        AssetsManager.prototype.addMeshTask = function (taskName, meshesNames, rootUrl, sceneFilename) {
            var task = new MeshAssetTask(taskName, meshesNames, rootUrl, sceneFilename);
            this._tasks.push(task);

            return task;
        };

        AssetsManager.prototype.addTextFileTask = function (taskName, url) {
            var task = new TextFileAssetTask(taskName, url);
            this._tasks.push(task);

            return task;
        };

        AssetsManager.prototype.addBinaryFileTask = function (taskName, url) {
            var task = new BinaryFileAssetTask(taskName, url);
            this._tasks.push(task);

            return task;
        };

        AssetsManager.prototype._decreaseWaitingTasksCount = function () {
            this._waitingTasksCount--;

            if (this._waitingTasksCount === 0) {
                if (this.onFinish) {
                    this.onFinish(this._tasks);
                }

                this._scene.getEngine().hideLoadingUI();
            }
        };

        AssetsManager.prototype._runTask = function (task) {
            var _this = this;
            task.run(this._scene, function () {
                if (_this.onTaskSuccess) {
                    _this.onTaskSuccess(task);
                }
                _this._decreaseWaitingTasksCount();
            }, function () {
                if (_this.onTaskError) {
                    _this.onTaskError(task);
                }
                _this._decreaseWaitingTasksCount();
            });
        };

        AssetsManager.prototype.reset = function () {
            this._tasks = new Array();
            return this;
        };

        AssetsManager.prototype.load = function () {
            this._waitingTasksCount = this._tasks.length;

            if (this._waitingTasksCount === 0) {
                if (this.onFinish) {
                    this.onFinish(this._tasks);
                }
                return this;
            }

            if (this.useDefaultLoadingScreen) {
                this._scene.getEngine().displayLoadingUI();
            }

            for (var index = 0; index < this._tasks.length; index++) {
                var task = this._tasks[index];
                this._runTask(task);
            }

            return this;
        };
        return AssetsManager;
    })();
    BABYLON.AssetsManager = AssetsManager;
})(BABYLON || (BABYLON = {}));
//# sourceMappingURL=babylon.assetsManager.js.map
