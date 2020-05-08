// Old Fashion Way for IE 11 Devs. Yes, that still exists ;-)

var BABYLONDEVTOOLS;
(function(BABYLONDEVTOOLS) {

    var ua = window.navigator.userAgent;
    var isIE = ua.indexOf("Trident") > 0;

    var getJson = function(url, callback, errorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function() {
            if (this.status >= 200 && this.status < 300) {
                var data = JSON.parse(xhr.response);
                callback(data)
            } else {
                errorCallback({
                    status: this.status,
                    statusText: xhr.statusText
                });
            }
        };
        xhr.onerror = function() {
            errorCallback({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    }

    var Loader = (function() {
        var queue;
        var esmQueue;
        var callback;
        var dependencies;
        var useDist;
        var testMode;
        var workerMode;
        var min;
        var babylonJSPath;

        var coreOnly;

        var localDevES6FolderName;
        var localDevUMDFolderName;

        function Loader() {
            queue = [];
            esmQueue = [];
            dependencies = [];
            callback = null;
            if (typeof document !== "undefined") {
                min = document.location.href.toLowerCase().indexOf('dist=min') > 0;
                useDist = (min || useDist || document.location.href.toLowerCase().indexOf('dist=true') > 0);
            } else {
                min = false;
                useDist = false;
                workerMode = true;
            }
            babylonJSPath = '';
            coreOnly = false;
        }

        Loader.prototype.debugShortcut = function(engine) {
            // Add inspector shortcut
            var map = {};
            var onkey = function(e) {
                e = e || event; // to deal with IE
                map[e.keyCode] = e.type == 'keydown';
                if (map[17] && map[16] && map[18] && map[73]) {
                    if (engine.scenes && engine.scenes.length > 0) {
                        for (var i = 0; i < engine.scenes.length; i++) {
                            if (engine.scenes[0].debugLayer.isVisible()) {
                                engine.scenes[0].debugLayer.hide();
                            }
                            else {
                                engine.scenes[0].debugLayer.show();
                            }
                        }
                    }
                    map = {};
                    return false;
                }
            };

            document.addEventListener("keydown", onkey);
            document.addEventListener("keyup", onkey);
        }

        Loader.prototype.root = function(newBabylonJSPath) {
            babylonJSPath = newBabylonJSPath;
            return this;
        }

        Loader.prototype.require = function(newDependencies) {
            if (typeof newDependencies === 'string') {
                dependencies.push(newDependencies);
            }
            else if (newDependencies) {
                for (var i = 0; i < newDependencies.length; i++) {
                    dependencies.push(newDependencies[i]);
                }
            }
            return this;
        }

        Loader.prototype.onReady = function(newCallback) {
            callback = newCallback;
            return this;
        }

        Loader.prototype.testMode = function() {
            testMode = true;
            return this;
        }

        Loader.prototype.useDist = function() {
            useDist = true;
            return this;
        }

        Loader.prototype.dequeue = function() {
            if (queue.length + esmQueue.length === 0) {
                console.log('Scripts loaded');

                if (BABYLON) {
                    BABYLON.Engine.ShadersRepository = "/src/Shaders/";
                }
                if (callback) {
                    callback();
                }
                return;
            }

            if (typeof document === "undefined") {
                let url = esmQueue.length ? esmQueue.shift() : queue.shift();
                console.log(url);
                importScripts(url);
                this.dequeue();    
                return;
            } 

            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');

            if (esmQueue.length) {
                script.type = 'module';
                script.src = esmQueue.shift();
            }
            else {
                script.type = 'text/javascript';
                script.src = queue.shift();
            }

            var self = this;
            if (isIE) { // I love you IE
                setTimeout(function() {
                    self.dequeue();
                }, 500);
            } else {
                script.onload = function() {
                    self.dequeue();
                };
            }
            head.appendChild(script);
        }

        Loader.prototype.loadScript = function(url) {
            queue.push(url);
        }

        Loader.prototype.loadESMScript = function(url) {
            esmQueue.push(url);
        }

        Loader.prototype.loadCss = function(url) {
            var style = document.createElement('link');
            style.href = url;
            style.rel = "stylesheet";
            style.type = "text/css";
            document.head.appendChild(style);
        }

        Loader.prototype.loadScripts = function(urls) {
            for (var i = 0; i < urls.length; i++) {
                this.loadScript(urls[i]);
            }
        }

        Loader.prototype.loadLibrary = function(moduleName, library, module) {
            if (library.preventLoadLibrary) {
                return;
            }

            var distFolder = (module.build.distOutputDirectory !== undefined) ?
                module.build.distOutputDirectory :
                "/" + moduleName;
            distFolder += "/";
            
            if (!useDist) {
                if (workerMode && module.build.ignoreInWorkerMode) {
                    return;
                }
                var tempDirectory = '/.temp/' + localDevUMDFolderName + distFolder;
                this.loadScript((babylonJSPath + tempDirectory + library.output)
                    .replace(".min.", ".")
                    .replace(".max.", "."));
            }
            else if (!testMode || !module.build.ignoreInTestMode) {
                if (min) {
                    this.loadScript(babylonJSPath + '/dist/preview release' + distFolder + library.output);
                }
                else {
                    var isMinOutputName = library.output.indexOf(".min.") > -1;
                    if (isMinOutputName) {
                        this.loadScript(babylonJSPath + '/dist/preview release' + distFolder + library.output.replace(".min", ""));
                    }
                    else {
                        this.loadScript(babylonJSPath + '/dist/preview release' + distFolder + library.output.replace(".js", ".max.js"));
                    }
                }
            }
        }

        Loader.prototype.loadCoreDev = function() {
            if (typeof document === "undefined" || isIE) {                
                this.loadScript(babylonJSPath + "/dist/preview release/babylon.max.js");
                return;
            }
            // Es6 core import
            this.loadESMScript(babylonJSPath + "/.temp/" + localDevES6FolderName + "/core/Legacy/legacy.js");
        }

        Loader.prototype.loadModule = function(moduleName, module) {
            for (var i = 0; i < module.libraries.length; i++) {
                if (!useDist && module.isCore) {
                    this.loadCoreDev();
                }
                else if (!coreOnly || module.isCore) {
                    this.loadLibrary(moduleName, module.libraries[i], module);
                }
                // Allow also loaders in CORE.
                else if (coreOnly && (moduleName === "loaders" ||
                    moduleName === "inspector" ||
                    moduleName === "nodeEditor" ||
                    moduleName === "materialsLibrary")) {
                    this.loadLibrary(moduleName, module.libraries[i], module);
                }
            }
        }

        Loader.prototype.processDependency = function(settings, dependency, filesToLoad) {
            if (dependency.dependUpon) {
                for (var i = 0; i < dependency.dependUpon.length; i++) {
                    var dependencyName = dependency.dependUpon[i];
                    var parent = settings.workloads[dependencyName];
                    this.processDependency(settings, parent, filesToLoad);
                }
            }

            for (var i = 0; i < dependency.files.length; i++) {
                var file = dependency.files[i];

                if (filesToLoad.indexOf(file) === -1) {
                    filesToLoad.push(file);
                }
            }
        }

        Loader.prototype.loadBJSScripts = function(settings) {
            // Load all the modules from the config.json.
            for (var i = 0; i < settings.modules.length; i++) {
                this.loadModule(settings.modules[i], settings[settings.modules[i]]);
            }
        }

        Loader.prototype.loadCoreOnly = function() {
            coreOnly = true;
            return this;
        }

        Loader.prototype.load = function(newCallback) {
            var self = this;
            if (newCallback) {
                callback = newCallback;
            }
            getJson('/Tools/Config/config.json',
                function(data) {
                    localDevES6FolderName = data.build.localDevES6FolderName;
                    localDevUMDFolderName = data.build.localDevUMDFolderName;

                    self.loadBJSScripts(data);
                    if (dependencies) {
                        self.loadScripts(dependencies);
                    }

                    self.dequeue();
                },
                function(reason) {
                    console.error(reason);
                }
            );
        };

        return Loader;
    }());

    var loader = new Loader();
    BABYLONDEVTOOLS.Loader = loader;

})(BABYLONDEVTOOLS || (BABYLONDEVTOOLS = {}))
