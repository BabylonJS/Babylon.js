// Old Fashion Way for IE 11 Devs. Yes, that still exists ;-)

var BABYLONDEVTOOLS;
(function(BABYLONDEVTOOLS) {

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
        var min;
        var babylonJSPath;

        function Loader() {
            queue = [];
            esmQueue = [];
            dependencies = [];
            callback = null;
            min = (document.location.href.toLowerCase().indexOf('dist=min') > 0);
            useDist = (min || useDist || document.location.href.toLowerCase().indexOf('dist=true') > 0);
            babylonJSPath = '';
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
            if (queue.length + esmQueue.length == 0) {
                console.log('Scripts loaded');
                BABYLON.Engine.ShadersRepository = "/src/Shaders/";
                if (callback) {
                    callback();
                }
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
            script.onload = function() {
                self.dequeue();
            };
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

        Loader.prototype.loadLibrary = function(library, module) {
            if (library.preventLoadLibrary) {
                return;
            }

            if (!useDist) {
                var tempDirectory = '/.temp' + module.build.distOutputDirectory;
                this.loadScript(babylonJSPath + tempDirectory + library.output);
            }
            else if (module.build.distOutputDirectory && (!testMode || !module.build.ignoreInTestMode)) {
                if (min) {
                    this.loadScript(babylonJSPath + '/dist/preview release' + module.build.distOutputDirectory + library.output);
                }
                else {
                    this.loadScript(babylonJSPath + '/dist/preview release' + module.build.distOutputDirectory + (library.maxOutput || library.output.replace(".min", "")));
                }
            }
        }

        Loader.prototype.loadCoreDev = function() {
            // Es6 core import
            this.loadESMScript("/.temp/es6LocalDev/core/legacy/legacy.js");
        }

        Loader.prototype.loadModule = function(module) {
            for (var i = 0; i < module.libraries.length; i++) {
                if (!useDist && module.isCore) {
                    this.loadCoreDev();
                }
                else {
                    this.loadLibrary(module.libraries[i], module);
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
                this.loadModule(settings[settings.modules[i]]);
            }
        }

        Loader.prototype.load = function(newCallback) {
            var self = this;
            if (newCallback) {
                callback = newCallback;
            }
            getJson('/Tools/Gulp/config.json',
                function(data) {
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