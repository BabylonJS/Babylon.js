(function () {
    var jsEditor;

    var run = function () {
        var blockEditorChange = false;

        jsEditor.onKeyDown(function (evt) {
        });

        jsEditor.onKeyUp(function (evt) {
            if (blockEditorChange) {
                return;
            }

            document.getElementById("currentScript").innerHTML = "Custom";
            document.getElementById('safemodeToggle').checked = true;
        });

        var snippetUrl = "http://babylonjs-api.azurewebsites.net/api/snippet";
        var currentSnippetToken;
        var engine;
        var fpsLabel = document.getElementById("fpsLabel");
        var scripts;
        var zipCode;
        BABYLON.Engine.ShadersRepository = "/src/Shaders/";
        var loadScript = function (scriptURL, title) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', scriptURL, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        blockEditorChange = true;
                        jsEditor.setValue(xhr.responseText);
                        jsEditor.setPosition({ lineNumber: 0, column: 0 });
                        blockEditorChange = false;
                        compileAndRun();

                        document.getElementById("currentScript").innerHTML = title;

                        currentSnippetToken = null;
                    }
                }
            };

            xhr.send(null);
        };

        var loadScriptFromIndex = function (index) {
            if (index === 0) {
                index = 1;
            }

            var script = scripts[index - 1].trim();
            loadScript("scripts/" + script + ".js", script);
        }

        var onScriptClick = function (evt) {
            loadScriptFromIndex(evt.target.scriptLinkIndex);
        }

        var loadScriptsList = function () {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', 'scripts/scripts.txt', true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        scripts = xhr.responseText.split("\n");
                        var ul = document.getElementById("scriptsList");
                        var index;
                        for (index = 0; index < scripts.length; index++) {
                            var li = document.createElement("li");
                            var a = document.createElement("a");

                            li.class = "scriptsListEntry";
                            a.href = "#";
                            a.innerHTML = (index + 1) + " - " + scripts[index];
                            a.scriptLinkIndex = index + 1;
                            a.onclick = onScriptClick;

                            li.appendChild(a);
                            ul.appendChild(li);
                        }

                        if (!location.hash) {
                            // Query string
                            var queryString = window.location.search;

                            if (queryString) {
                                var query = queryString.replace("?", "");
                                index = parseInt(query);
                                if (!isNaN(index)) {
                                    loadScriptFromIndex(index);
                                } else {
                                    loadScript("scripts/" + query + ".js", query);
                                }
                            } else {
                                loadScript("scripts/basic scene.js", "Basic scene");
                            }
                        }
                    }
                }
            };

            xhr.send(null);
        }

        var createNewScript = function () {
            location.hash = "";
            currentSnippetToken = null;
            jsEditor.setValue('// You have to create a function called createScene. This function must return a BABYLON.Scene object\r\n// You can reference the following variables: scene, canvas\r\n// You must at least define a camera\r\n// More info here: https://doc.babylonjs.com/generals/The_Playground_Tutorial\r\n\r\nvar createScene = function() {\r\n\tvar scene = new BABYLON.Scene(engine);\r\n\tvar camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);\r\n\tcamera.attachControl(canvas, true);\r\n\r\n\r\n\r\n\treturn scene;\r\n};');
            jsEditor.setPosition({ lineNumber: 11, column: 0 });
            jsEditor.focus();
            compileAndRun();
        }

        var clear = function () {
            location.hash = "";
            currentSnippetToken = null;
            jsEditor.setValue('');
            jsEditor.setPosition({ lineNumber: 0, column: 0 });
            jsEditor.focus();
        }

        var showError = function (errorMessage, errorEvent) {
            var errorContent =
                '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button><h4>Compilation error</h4>'
            if (errorEvent) {
                var regEx = /\(.+:(\d+):(\d+)\)\n/g;

                var match = regEx.exec(errorEvent.stack);
                if (match) {
                    errorContent += "Line ";
                    var lineNumber = match[1];
                    var columnNumber = match[2];

                    errorContent += lineNumber + ':' + columnNumber + ' - ';
                }
            }

            errorContent += errorMessage + '</div>';

            document.getElementById("errorZone").innerHTML = errorContent;
        }

        compileAndRun = function () {
            try {

                if (!BABYLON.Engine.isSupported()) {
                    showError("Your browser does not support WebGL", null);
                    return;
                }

                if (engine) {
                    engine.dispose();
                    engine = null;
                }

                var canvas = document.getElementById("renderCanvas");
                engine = new BABYLON.Engine(canvas, true, {preserveDrawingBuffer: true, stencil: true});
                document.getElementById("errorZone").innerHTML = "";
                document.getElementById("statusBar").innerHTML = "Loading assets...Please wait";

                engine.runRenderLoop(function () {
                    if (engine.scenes.length === 0) {
                        return;
                    }

                    if (canvas.width !== canvas.clientWidth) {
                        engine.resize();
                    }

                    var scene = engine.scenes[0];

                    if (scene.activeCamera || scene.activeCameras.length > 0) {
                        scene.render();
                    }

                    fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
                });

                var code = jsEditor.getValue();
                var scene;
                if (code.indexOf("createScene") !== -1) { // createScene
                    eval(code);
                    scene = createScene();
                    if (!scene) {
                        showError("createScene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = createScene();";
                } else if (code.indexOf("CreateScene") !== -1) { // CreateScene
                    eval(code);
                    scene = CreateScene();
                    if (!scene) {
                        showError("CreateScene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = CreateScene();";
                } else if (code.indexOf("createscene") !== -1) { // createscene
                    eval(code);
                    scene = createscene();
                    if (!scene) {
                        showError("createscene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = createscene();";
                } else { // Direct code
                    scene = new BABYLON.Scene(engine);
                    eval("runScript = function(scene, canvas) {" + code + "}");
                    runScript(scene, canvas);

                    zipCode = "var scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
                }

                if (engine.scenes.length === 0) {
                    showError("You must at least create a scene.", null);
                    return;
                }

                if (engine.scenes[0].activeCamera == null) {
                    showError("You must at least create a camera.", null);
                    return;
                }

                engine.scenes[0].executeWhenReady(function () {
                    document.getElementById("statusBar").innerHTML = "";
                });

            } catch (e) {
                showError(e.message, e);
            }
        };
        window.addEventListener("resize",
            function () {
                if (engine) {
                    engine.resize();
                }
            });

        // Load scripts list
        loadScriptsList();

        // Zip
        var addContentToZip = function (zip, name, url, replace, buffer, then) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);

            if (buffer) {
                xhr.responseType = "arraybuffer";
            }

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        var text;
                        if (!buffer) {
                            if (replace) {
                                var splits = replace.split("\r\n");
                                for (var index = 0; index < splits.length; index++) {
                                    splits[index] = "        " + splits[index];
                                }
                                replace = splits.join("\r\n");

                                text = xhr.responseText.replace("####INJECT####", replace);
                            } else {
                                text = xhr.responseText;
                            }
                        }

                        zip.file(name, buffer ? xhr.response : text);

                        then();
                    }
                }
            };

            xhr.send(null);
        }

        var addTexturesToZip = function (zip, index, textures, folder, then) {
            if (index === textures.length) {
                then();
                return;
            }

            if (textures[index].isRenderTarget || textures[index] instanceof BABYLON.DynamicTexture) {
                addTexturesToZip(zip, index + 1, textures, folder, then);
                return;
            }

            if (textures[index].isCube) {
                if (textures[index]._extensions) {
                    for (var i = 0; i < 6; i++) {
                        textures.push({ name: textures[index].name + textures[index]._extensions });
                    }
                }
                else {
                    textures.push({ name: textures[index].name });
                }
                addTexturesToZip(zip, index + 1, textures, folder, then);
                return;
            }


            if (folder == null) {
                folder = zip.folder("textures");
            }
            var url;

            if (textures[index].video) {
                url = textures[index].video.currentSrc;
            } else {
                url = textures[index].name;
            }

            var name = url.substr(url.lastIndexOf("/") + 1);


            addContentToZip(folder,
                name,
                url,
                null,
                true,
                function () {
                    addTexturesToZip(zip, index + 1, textures, folder, then);
                });
        }

        var addImportedFilesToZip = function (zip, index, importedFiles, folder, then) {
            if (index === importedFiles.length) {
                then();
                return;
            }

            if (!folder) {
                folder = zip.folder("scenes");
            }
            var url = importedFiles[index];

            var name = url.substr(url.lastIndexOf("/") + 1);

            addContentToZip(folder,
                name,
                url,
                null,
                true,
                function () {
                    addImportedFilesToZip(zip, index + 1, importedFiles, folder, then);
                });
        }

        var getZip = function () {
            if (engine.scenes.length === 0) {
                return;
            }

            var zip = new JSZip();

            var scene = engine.scenes[0];

            var textures = scene.textures;

            var importedFiles = scene.importedMeshesFiles;

            document.getElementById("statusBar").innerHTML = "Creating archive...Please wait";

            if (zipCode.indexOf("textures/worldHeightMap.jpg") !== -1) {
                textures.push({ name: "textures/worldHeightMap.jpg" });
            }

            addContentToZip(zip,
                "index.html",
                "zipContent/index.html",
                zipCode,
                false,
                function () {
                    addTexturesToZip(zip,
                        0,
                        textures,
                        null,
                        function () {
                            addImportedFilesToZip(zip,
                                0,
                                importedFiles,
                                null,
                                function () {
                                    var blob = zip.generate({ type: "blob" });
                                    saveAs(blob, "sample.zip");
                                    document.getElementById("statusBar").innerHTML = "";
                                });
                        });
                });
        }

        // Fonts
        setFontSize = function (size) {
            document.querySelector(".monaco-editor").style.fontSize = size + "px";
            document.getElementById("currentFontSize").innerHTML = "Font: " + size;
        };

        // Fullscreen
        var goFullscreen = function () {
            if (engine) {
                engine.switchFullscreen(true);
            }
        }

        var toggleEditor = function () {
            var editorButton = document.getElementById("editorButton");
            var scene = engine.scenes[0];

            if (editorButton.innerHTML === "-Editor") {
                editorButton.innerHTML = "+Editor";
                document.getElementById("jsEditor").style.display = "none";
                document.getElementById("canvasZone").style.flexBasis = "100%";
            } else {
                editorButton.innerHTML = "-Editor";
                document.getElementById("jsEditor").style.display = "block";
                document.getElementById("canvasZone").style.flexBasis = undefined;
            }
            engine.resize();

            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
                scene.debugLayer.show();
            }
        }

        var toggleDebug = function () {
            var debugButton = document.getElementById("debugButton");
            var scene = engine.scenes[0];

            if (debugButton.innerHTML === "+Debug layer") {
                debugButton.innerHTML = "-Debug layer";
                scene.debugLayer.show();
            } else {
                debugButton.innerHTML = "+Debug layer";
                scene.debugLayer.hide();
            }
        }

        // UI
        document.getElementById("runButton").addEventListener("click", compileAndRun);
        document.getElementById("zipButton").addEventListener("click", getZip);
        document.getElementById("fullscreenButton").addEventListener("click", goFullscreen);
        document.getElementById("newButton").addEventListener("click", createNewScript);
        document.getElementById("clearButton").addEventListener("click", clear);
        document.getElementById("editorButton").addEventListener("click", toggleEditor);
        document.getElementById("debugButton").addEventListener("click", toggleDebug);

        //Navigation Overwrites
        var exitPrompt = function (e) {
            var safeToggle = document.getElementById("safemodeToggle");
            if (safeToggle.checked) {
                e = e || window.event;
                var message =
                    'This page is asking you to confirm that you want to leave - data you have entered may not be saved.';
                if (e) {
                    e.returnValue = message;
                }
                return message;
            }
        };

        window.onbeforeunload = exitPrompt;

        // Snippet
        var save = function () {
            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 201) {
                        var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                        var snippet = JSON.parse(xmlHttp.responseText);
                        var newUrl = baseUrl + "#" + snippet.id;
                        currentSnippetToken = snippet.id;
                        if (snippet.version !== "0") {
                            newUrl += "#" + snippet.version;
                        }
                        location.href = newUrl;
                        compileAndRun();
                    } else {
                        showError("Unable to save your code. It may be too long.", null);
                    }
                }
            }

            xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
            xmlHttp.setRequestHeader("Content-Type", "application/json");

            var payload = {
                code: jsEditor.getValue()
            };

            xmlHttp.send(JSON.stringify(payload));
        }

        document.getElementById("saveButton").addEventListener("click", save);
        document.getElementById("mainTitle").innerHTML = "Babylon.js v" + BABYLON.Engine.Version + " Playground";

        var previousHash = "";

        var cleanHash = function () {
            var splits = decodeURIComponent(location.hash.substr(1)).split("#");

            if (splits.length > 2) {
                splits.splice(2, splits.length - 2);
            }

            location.hash = splits.join("#");
        }

        var checkHash = function (firstTime) {
            if (location.hash) {
                if (previousHash !== location.hash) {
                    cleanHash();

                    previousHash = location.hash;

                    try {
                        var xmlHttp = new XMLHttpRequest();
                        xmlHttp.onreadystatechange = function () {
                            if (xmlHttp.readyState === 4) {
                                if (xmlHttp.status === 200) {
                                    var snippet = JSON.parse(xmlHttp.responseText);
                                    blockEditorChange = true;
                                    jsEditor.setValue(snippet.code.toString());
                                    jsEditor.setPosition({ lineNumber: 0, column: 0 });
                                    blockEditorChange = false;
                                    compileAndRun();

                                    document.getElementById("currentScript").innerHTML = "Custom";
                                } else if (firstTime) {
                                    location.href = location.href.replace(location.hash, "");
                                    if (scripts) {
                                        loadScriptFromIndex(0);
                                    }
                                }
                            }
                        }

                        var hash = location.hash.substr(1);
                        currentSnippetToken = hash.split("#")[0];

                        xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                        xmlHttp.send();
                    } catch (e) {

                    }
                }
            }
            setTimeout(checkHash, 200);
        }

        checkHash(true);
    }

    // Monaco

    var xhr = new XMLHttpRequest();

    xhr.open('GET', "babylon.d.txt", true);

    xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
                require(['vs/editor/editor.main'], function () {
                    monaco.languages.typescript.javascriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');

                    jsEditor = monaco.editor.create(document.getElementById('jsEditor'), {
                        value: "",
                        language: "javascript",
                        lineNumbers: true,
                        tabSize: "auto",
                        insertSpaces: "auto",
                        roundedSelection: true,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        readOnly: false,
                        theme: "vs",
                        contextmenu: false
                    });

                    run();
                });
           }
        }
    };
    xhr.send(null);
})();