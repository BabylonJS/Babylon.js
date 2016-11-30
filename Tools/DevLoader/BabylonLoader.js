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

        function Loader() {
            queue = [];
            dependencies = [];
            callback = null;
            min = (document.location.href.toLowerCase().indexOf('dist=min') > 0);
            useDist = (min || document.location.href.toLowerCase().indexOf('dist=true') > 0);
        }

        Loader.prototype.onReady = function (callback) {
            this.callback = callback;
        }

        Loader.prototype.require = function (dependencies) {
            this.dependencies = dependencies;
            return this;
        }

        Loader.prototype.dequeue = function () {
            if (queue.length == 0) {
                console.log('Scripts loaded');
                BABYLON.Engine.ShadersRepository = "/src/Shaders/"; 
                if (this.callback) {                    
                    this.callback();
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
                    file = file.replace('.ts', '.js');
                    this.loadScript(file);
                }

                if (library.shaderFiles && library.shaderFiles.length > 0) {
                    var shaderFile = library.shaderFiles[0];
                    var endDirectoryIndex = shaderFile.lastIndexOf('/');
                    shaderFile = shaderFile.substring(0, endDirectoryIndex + 1);
                    shaderFile += library.output.replace('.js', '.js.fx');
                    this.loadScript(shaderFile);
                }
            }
            else if (min) {
                this.loadScript('/dist/preview release' + module.build.distOutputDirectory + library.output.replace('.js', '.min.js'));
            }
            else {
                this.loadScript('/dist/preview release' + module.build.distOutputDirectory + library.output);
            }
        }

        Loader.prototype.loadModule = function (module) {
            for (var i = 0; i< module.libraries.length; i++) {
                this.loadLibrary(module.libraries[i], module);
            }
        }

        Loader.prototype.loadBJSScripts = function (settings) {

            if (!useDist) {
                this.loadScripts(settings.core.files);
                this.loadScripts(settings.extras.files);
            }
            else if (min) {
                this.loadScript('/dist/preview release/babylon.js');
            }
            else {
                this.loadScript('/dist/preview release/babylon.max.js');
            }

            for (var i = 0; i< settings.modules.length; i++) {
                this.loadModule(settings[settings.modules[i]]);
            }
        }

        Loader.prototype.load = function (callback) {
            var self = this;
            if (callback) {
                self.callback = callback;
            }
            getJson('/Tools/Gulp/config.json',
                function(data) {
                    self.loadBJSScripts(data);
                    
                    if (typeof self.dependencies === 'string') {
                        self.loadScript(self.dependencies);
                    }
                    else if (self.dependencies) {
                        self.loadScripts(self.dependencies);
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