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
    var ImageAssetTask = (function () {
        function ImageAssetTask(name, url) {
            this.name = name;
            this.url = url;
            this.isCompleted = false;
        }
        ImageAssetTask.prototype.run = function (scene, onSuccess, onError) {
            var _this = this;
            var img = new Image();
            img.onload = function () {
                _this.image = img;
                _this.isCompleted = true;
                if (_this.onSuccess) {
                    _this.onSuccess(_this);
                }
                onSuccess();
            };
            img.onerror = function () {
                if (_this.onError) {
                    _this.onError(_this);
                }
                onError();
            };
            img.src = this.url;
        };
        return ImageAssetTask;
    })();
    BABYLON.ImageAssetTask = ImageAssetTask;
    var TextureAssetTask = (function () {
        function TextureAssetTask(name, url, noMipmap, invertY, samplingMode) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            this.name = name;
            this.url = url;
            this.noMipmap = noMipmap;
            this.invertY = invertY;
            this.samplingMode = samplingMode;
            this.isCompleted = false;
        }
        TextureAssetTask.prototype.run = function (scene, onSuccess, onError) {
            var _this = this;
            var onload = function () {
                _this.isCompleted = true;
                if (_this.onSuccess) {
                    _this.onSuccess(_this);
                }
                onSuccess();
            };
            var onerror = function () {
                if (_this.onError) {
                    _this.onError(_this);
                }
                onError();
            };
            this.texture = new BABYLON.Texture(this.url, scene, this.noMipmap, this.invertY, this.samplingMode, onload, onerror);
        };
        return TextureAssetTask;
    })();
    BABYLON.TextureAssetTask = TextureAssetTask;
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
        AssetsManager.prototype.addImageTask = function (taskName, url) {
            var task = new ImageAssetTask(taskName, url);
            this._tasks.push(task);
            return task;
        };
        AssetsManager.prototype.addTextureTask = function (taskName, url, noMipmap, invertY, samplingMode) {
            if (samplingMode === void 0) { samplingMode = BABYLON.Texture.TRILINEAR_SAMPLINGMODE; }
            var task = new TextureAssetTask(taskName, url, noMipmap, invertY, samplingMode);
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
