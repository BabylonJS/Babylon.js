// Old Fashion Way for IE 11 Devs. Yes, that still exists ;-)

var BABYLONDEVTOOLS;
(function (BABYLONDEVTOOLS) {
    
    var getJson = function(url, callback, errorCallback) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = function () {
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
        xhr.onerror = function () {
            errorCallback({
                status: this.status,
                statusText: xhr.statusText
            });
        };
        xhr.send();
    }

    var Loader = (function () {
        var queue;
        var callback;
        var dependencies;
        var useDist;
        var min;
        var babylonJSPath;

        function Loader() {
            queue = [];
            dependencies = [];
            callback = null;
            min = (document.location.href.toLowerCase().indexOf('dist=min') > 0);
            useDist = (min || document.location.href.toLowerCase().indexOf('dist=true') > 0);            
            babylonJSPath = '';
        }

        Loader.prototype.debugShortcut = function(engine) {
            // Add inspector shortcut
            var map = {};
            var onkey = function(e){
                e = e || event; // to deal with IE
                map[e.keyCode] = e.type == 'keydown';
                if(map[17] && map[16] && map[18] && map[73]) {
                    if (engine.scenes && engine.scenes.length > 0) {
                        for (var i = 0; i < engine.scenes.length; i ++) {
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

        Loader.prototype.root = function (newBabylonJSPath) {
            babylonJSPath = newBabylonJSPath;
            return this;
        }

        Loader.prototype.require = function (newDependencies) {
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

        Loader.prototype.onReady = function (newCallback) {
            callback = newCallback;
            return this;
        }

        Loader.prototype.dequeue = function () {
            if (queue.length == 0) {
                console.log('Scripts loaded');
                BABYLON.Engine.ShadersRepository = "/src/Shaders/"; 
                if (callback) {                    
                    callback();
                }
                return;                
            }

            var url = queue.shift();
            
            var head = document.getElementsByTagName('head')[0];
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;

            var self = this;
            script.onload = function() {
                self.dequeue();
            };
            head.appendChild(script);
        }

        Loader.prototype.loadScript = function (url) {
            queue.push(url);
        }

        Loader.prototype.loadCss = function (url) {
            var head = document.getElementsByTagName('head')[0];

            var style = document.createElement('link');
            style.href = url;
            style.rel = "stylesheet";
            style.type = "text/css"
            document.head.appendChild(style);
        }

        Loader.prototype.loadScripts = function (urls) {
            for (var i = 0; i< urls.length; i++) {
                this.loadScript(urls[i]);
            }
        }

        Loader.prototype.loadLibrary = function (library, module) {
            if (!useDist) {
                var i = 0;
                for (; i < library.files.length; i++) {
                    var file = library.files[i];
                    if (file.indexOf('lib.d.ts') > 0) {
                        continue;
                    } 

                    file = file.replace('.ts', '.js');
                    file = file.replace('../', '');
                    file = babylonJSPath + '/' + file;
                    this.loadScript(file);
                }

                if (library.shaderFiles && library.shaderFiles.length > 0) {
                    var shaderFile = library.shaderFiles[0];
                    var endDirectoryIndex = shaderFile.lastIndexOf('/');
                    shaderFile = shaderFile.substring(0, endDirectoryIndex + 1);
                    shaderFile += library.output.replace('.js', '.js.fx');
                    this.loadScript(shaderFile);
                    if (library.shadersIncludeFiles) {
                        var includeShaderFile = shaderFile.replace('.js.fx', '.js.include.fx');
                        this.loadScript(includeShaderFile);
                    }
                }
            }
            else if (min) {
                if (library.webpack) {
                    this.loadScript(babylonJSPath + '/dist/preview release' + module.build.distOutputDirectory + library.output.replace('.js', '.bundle.js'));
                }
                else {
                    this.loadScript(babylonJSPath + '/dist/preview release' + module.build.distOutputDirectory + library.output.replace('.js', '.min.js'));
                }
            }
            else {
                this.loadScript(babylonJSPath + '/dist/preview release' + module.build.distOutputDirectory + library.output);
            }

            if (!min && library.sassFiles && library.sassFiles.length > 0) {
                var cssFile = library.output.replace('.js', '.css');
                cssFile = babylonJSPath + '/dist/preview release' +  module.build.distOutputDirectory + cssFile;
                this.loadCss(cssFile);
            }
        }

        Loader.prototype.loadModule = function (module) {
            for (var i = 0; i< module.libraries.length; i++) {
                this.loadLibrary(module.libraries[i], module);
            }
        }

        Loader.prototype.processDependency = function(settings, dependency, filesToLoad) {
            if (dependency.dependUpon) {
                for (var i = 0; i < dependency.dependUpon.length; i++ ) {
                    var dependencyName = dependency.dependUpon[i];
                    var parent = settings.workloads[dependencyName];
                    this.processDependency(settings, parent, filesToLoad);
                }
            }

            for (var i = 0; i< dependency.files.length; i++) {
                var file = dependency.files[i];

                if (filesToLoad.indexOf(file) === -1) {
                    filesToLoad.push(file);
                }
            }
        }

        Loader.prototype.loadBJSScripts = function (settings) {
            var loadModules = true;

            // Main bjs files
            if (!useDist) {
                var currentConfig = settings.build.currentConfig;
                var buildConfiguration = settings.buildConfigurations[currentConfig];
                var filesToLoad = [];

                for (var index = 0; index < buildConfiguration.length; index++) {
                    var dependencyName = buildConfiguration[index];
                    var dependency = settings.workloads[dependencyName];
                    this.processDependency(settings, dependency, filesToLoad);
                }

                this.loadScripts(filesToLoad);

                if (currentConfig !== "all") {
                    loadModules = false;
                }
            }
            else if (min) {
                this.loadScript('/dist/preview release/babylon.js');
            }
            else {
                this.loadScript('/dist/preview release/babylon.max.js');
            }

            // Modules
            if (loadModules) {
                for (var i = 0; i< settings.modules.length; i++) {
                    this.loadModule(settings[settings.modules[i]]);
                }
            }
        }

        Loader.prototype.load = function (newCallback) {
            var self = this;
            if (newCallback) {
                callback = newCallback;
            }
            getJson('/Tools/Gulp/config.json',
                function(data) {
                    if (!min) {
                        self.loadScript('/dist/preview release/split.js');
                    }

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