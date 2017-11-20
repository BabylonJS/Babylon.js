var jsEditor;
(function () {

    var multipleSize = [1600, 1475, 1030, 750];
    var setToMultipleID = function (id, thingToDo, param) {
        multipleSize.forEach(function (size) {

            if (thingToDo == "innerHTML") {
                document.getElementById(id + size).innerHTML = param
            }
            else if (thingToDo == "click") {
                document.getElementById(id + size).addEventListener("click", param);
            }
            else if (thingToDo == "addClass") {
                document.getElementById(id + size).classList.add(param);
            }
            else if (thingToDo == "removeClass") {
                document.getElementById(id + size).classList.remove(param);
            }
            else if (thingToDo == "display") {
                document.getElementById(id + size).style.display = param;
            }
        });
    };

    var editorOptions = {
        value: "",
        language: "javascript",
        lineNumbers: true,
        tabSize: "auto",
        insertSpaces: "auto",
        roundedSelection: true,
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly: false,
        theme: "vs",
        contextmenu: false,
        folding: true,
        showFoldingControls: "always",
        renderIndentGuides: true
    };

    var fontSize = 14;

    var splitInstance = Split(['#jsEditor', '#canvasZone']);

    var elementToTheme = [
        '.wrapper .gutter',
        '.wrapper #jsEditor',
        '.navbar',
        '.navbar .select .toDisplay .option',
        '.navbar .select .toDisplayBig',
        '.navbar .select .toDisplayBig a',
        '.navbar .select .toDisplayBig ul li',
        '.navbarBottom',
        '.navbarBottom .links .link',
        '.save-message'];

    var run = function () {
        var blockEditorChange = false;

        var markDirty = function () {
            if (blockEditorChange) {
                return;
            }


            setToMultipleID("currentScript", "innerHTML", "Custom");
            setToMultipleID("safemodeToggle", "addClass", "checked");
            setToMultipleID("minimapToggle", "addClass", "checked");

            setToMultipleID('safemodeToggle', 'innerHTML', 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
        }

        jsEditor.onKeyUp(function (evt) {
            markDirty();
        });

        var snippetUrl = "//babylonjs-api2.azurewebsites.net/snippets";
        var currentSnippetToken;
        var currentSnippetTitle = null;
        var currentSnippetDescription = null;
        var currentSnippetTags = null;
        var engine;
        var fpsLabel = document.getElementById("fpsLabel");
        var scripts;
        var zipCode;
        BABYLON.Engine.ShadersRepository = "/src/Shaders/";

        if (location.href.indexOf("Stable") !== -1) {
            setToMultipleID("currentVersion", "innerHTML", "Version: Stable");
        } else {
            setToMultipleID("currentVersion", "innerHTML", "Version: Latest");
        }

        var loadScript = function (scriptURL, title) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', scriptURL, true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        xhr.onreadystatechange = null;
                        blockEditorChange = true;
                        jsEditor.setValue(xhr.responseText);
                        jsEditor.setPosition({ lineNumber: 0, column: 0 });
                        blockEditorChange = false;
                        compileAndRun();

                        setToMultipleID("currentScript", "innerHTML", title);

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
        };

        var loadScriptsList = function () {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', 'scripts/scripts.txt', true);

            xhr.onreadystatechange = function () {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        scripts = xhr.responseText.split("\n");

                        for (var i = 0; i < multipleSize.length; i++) {
                            var ul = document.getElementById("scriptsList" + multipleSize[i]);

                            var index;
                            for (index = 0; index < scripts.length; index++) {
                                var option = document.createElement("li");
                                var a = document.createElement("a");
                                a.href = "#";
                                a.innerHTML = (index + 1) + " - " + scripts[index];
                                a.scriptLinkIndex = index + 1;
                                //a.onclick = onScriptClick;
                                option.scriptLinkIndex = index + 1;
                                option.onclick = onScriptClick;

                                option.appendChild(a);

                                ul.appendChild(option);
                            }
                        }

                        if (!location.hash) {
                            // Query string
                            var queryString = window.location.search;

                            if (queryString) {
                                var query = queryString.replace("?", "");
                                index = parseInt(query);
                                if (!isNaN(index)) {
                                    loadScriptFromIndex(index);
                                } else if (query.indexOf("=") === -1) {
                                    loadScript("scripts/" + query + ".js", query);
                                } else {
                                    loadScript("scripts/basic scene.js", "Basic scene");
                                }
                            } else {
                                loadScript("scripts/basic scene.js", "Basic scene");
                            }
                        }

                        // Restore theme
                        var theme = localStorage.getItem("bjs-playground-theme") || 'light';
                        toggleTheme(theme);

                        // Remove editor if window size is less than 850px
                        var removeEditorForSmallScreen = function () {
                            if (mq.matches) {
                                splitInstance.collapse(0);
                            } else {
                                splitInstance.setSizes([50, 50]);
                            }
                        }
                        var mq = window.matchMedia("(max-width: 850px)");
                        mq.addListener(removeEditorForSmallScreen);
                    }
                }
            };

            xhr.send(null);
        }

        var createNewScript = function () {
            // check if checked is on
            let iCanClear = checkSafeMode("Are you sure you want to create a new playground?");
            if (!iCanClear) return;
            location.hash = "";
            currentSnippetToken = null;
            currentSnippetTitle = null;
            currentSnippetDescription = null;
            currentSnippetTags = null;
            showNoMetadata();
            jsEditor.setValue('// You have to create a function called createScene. This function must return a BABYLON.Scene object\r\n// You can reference the following variables: scene, canvas\r\n// You must at least define a camera\r\n// More info here: https://doc.babylonjs.com/generals/The_Playground_Tutorial\r\n\r\nvar createScene = function() {\r\n\tvar scene = new BABYLON.Scene(engine);\r\n\tvar camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);\r\n\tcamera.attachControl(canvas, true);\r\n\r\n\r\n\r\n\treturn scene;\r\n};');
            jsEditor.setPosition({ lineNumber: 11, column: 0 });
            jsEditor.focus();
            compileAndRun();
        }

        var clear = function () {
            // check if checked is on
            let iCanClear = checkSafeMode("Are you sure you want to clear the playground?");
            if (!iCanClear) return;
            location.hash = "";
            currentSnippetToken = null;
            jsEditor.setValue('');
            jsEditor.setPosition({ lineNumber: 0, column: 0 });
            jsEditor.focus();
        }

        var checkSafeMode = function (message) {
            var safeToggle = document.getElementById("safemodeToggle1600");
            if (safeToggle.classList.contains('checked')) {
                let confirm = window.confirm(message);
                if (!confirm) {
                    return false;
                } else {
                    document.getElementById("safemodeToggle1600").classList.toggle('checked');
                    return true;
                }
            } else {
                return true;
            }
        }

        var showError = function (errorMessage, errorEvent) {
            var errorContent =
                '<div class="alert alert-error"><button type="button" class="close" data-dismiss="alert">&times;</button>';
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

            document.getElementById("errorZone").style.display = 'block';
            document.getElementById("errorZone").innerHTML = errorContent;

            // Close button error
            document.getElementById("errorZone").querySelector('.close').addEventListener('click', function () {
                document.getElementById("errorZone").style.display = 'none';
            });
        }

        var showNoMetadata = function () {
            if (currentSnippetTitle) {
                document.getElementById("saveFormTitle").value = currentSnippetTitle;
                document.getElementById("saveFormTitle").readOnly = true;
            }
            else {
                document.getElementById("saveFormTitle").value = '';
                document.getElementById("saveFormTitle").readOnly = false;
            }
            if (currentSnippetDescription) {
                document.getElementById("saveFormDescription").value = currentSnippetDescription;
                document.getElementById("saveFormDescription").readOnly = true;
            }
            else {
                document.getElementById("saveFormDescription").value = '';
                document.getElementById("saveFormDescription").readOnly = false;
            }
            if (currentSnippetTags) {
                document.getElementById("saveFormTags").value = currentSnippetTags;
                document.getElementById("saveFormTags").readOnly = true;
            }
            else {
                document.getElementById("saveFormTags").value = '';
                document.getElementById("saveFormTags").readOnly = false;
            }
            document.getElementById("saveFormButtons").style.display = "block";
            document.getElementById("saveFormButtonOk").style.display = "inline-block";
            document.getElementById("saveMessage").style.display = "block";
        };
        showNoMetadata();
        document.getElementById("saveMessage").style.display = "none";

        var hideNoMetadata = function () {
            document.getElementById("saveFormTitle").readOnly = true;
            document.getElementById("saveFormDescription").readOnly = true;
            document.getElementById("saveFormTags").readOnly = true;
            document.getElementById("saveFormButtonOk").style.display = "none";
            document.getElementById("saveMessage").style.display = "none";
            setToMultipleID("metadataButton", "display", "inline-block");
        };

        compileAndRun = function () {
            try {
                var waitRing = document.getElementById("waitDiv");
                if (waitRing) {
                    waitRing.style.display = "none";
                }

                if (!BABYLON.Engine.isSupported()) {
                    showError("Your browser does not support WebGL", null);
                    return;
                }

                var showInspector = false;
                var showDebugLayer = false;
                var initialTabIndex = 0;
                showBJSPGMenu();
                jsEditor.updateOptions({ readOnly: false });

                if (document.getElementsByClassName('insp-wrapper').length > 0) {
                    for (var i = 0; i < engine.scenes.length; i++) {
                        if (engine.scenes[i]._debugLayer) {
                            //TODO: once inspector is updated on netlify, use getActiveTabIndex instead of the following loop
                            //initialTabIndex = engine.scenes[i]._debugLayer._inspector.getActiveTabIndex();
                            var tabs = engine.scenes[i]._debugLayer._inspector._tabbar._tabs;
                            for (var j = 0; j < tabs.length; j++) {
                                if (tabs[j].isActive()) {
                                    initialTabIndex = j;
                                    break;
                                }
                            }
                            break;
                        }
                    }
                    showInspector = true;
                } else if (document.getElementById('DebugLayer')) {
                    showDebugLayer = true;
                }

                if (engine) {
                    engine.dispose();
                    engine = null;
                }

                var canvas = document.getElementById("renderCanvas");
                engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
                document.getElementById("errorZone").style.display = 'none';
                document.getElementById("errorZone").innerHTML = "";
                document.getElementById("statusBar").innerHTML = "Loading assets...Please wait";
                var checkCamera = true;

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

                    fpsLabel.style.right = document.body.clientWidth - (jsEditor.domElement.clientWidth + canvas.clientWidth) + "px";
                    fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
                });

                var code = jsEditor.getValue();
                var scene;
                if (code.indexOf("delayCreateScene") !== -1) { // createScene
                    eval(code);
                    scene = delayCreateScene();
                    checkCamera = false;
                    if (!scene) {
                        showError("delayCreateScene function must return a scene.", null);
                        return;
                    }

                    zipCode = code + "\r\n\r\nvar scene = createScene();";
                } else if (code.indexOf("createScene") !== -1) { // createScene
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

                if (checkCamera && engine.scenes[0].activeCamera == null) {
                    showError("You must at least create a camera.", null);
                    return;
                }

                engine.scenes[0].executeWhenReady(function () {
                    document.getElementById("statusBar").innerHTML = "";
                });

                if (scene) {
                    if (showInspector) {
                        scene.debugLayer.show({ initialTab: initialTabIndex });
                        scene.executeWhenReady(function () {
                            scene.debugLayer._inspector.refresh();
                        })
                    } else if (showDebugLayer) {
                        scene.debugLayer.show();
                    }
                }

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

            if (textures[index].isRenderTarget || textures[index] instanceof BABYLON.DynamicTexture || textures[index].name.indexOf("data:") !== -1) {
                addTexturesToZip(zip, index + 1, textures, folder, then);
                return;
            }

            if (textures[index].isCube) {
                if (textures[index]._extensions && textures[index].name.indexOf("dds") === -1) {
                    for (var i = 0; i < 6; i++) {
                        textures.push({ name: textures[index].name + textures[index]._extensions[i] });
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
                // url = textures[index].name;
                url = textures[index].url ? textures[index].url : textures[index].name;
            }

            var name = textures[index].name.replace("textures/", "");
            // var name = url.substr(url.lastIndexOf("/") + 1);

            if (url != null) {
                addContentToZip(folder,
                    name,
                    url,
                    null,
                    true,
                    function () {
                        addTexturesToZip(zip, index + 1, textures, folder, then);
                    });
            }
            else {
                addTexturesToZip(zip, index + 1, textures, folder, then);
            }
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

        // Versions
        setVersion = function (version) {
            switch (version) {
                case "stable":
                    location.href = "indexStable.html" + location.hash;
                    break;
                default:
                    location.href = "index.html" + location.hash;
                    break;
            }
        }

        // Fonts
        setFontSize = function (size) {
            fontSize = size;
            jsEditor.updateOptions({ fontSize: size });
            setToMultipleID("currentFontSize", "innerHTML", "Font: " + size);
        };

        // Fullscreen
        document.getElementById("renderCanvas").addEventListener("webkitfullscreenchange", function () {
            if (document.webkitIsFullScreen) goFullPage();
            else exitFullPage();
        }, false);

        var goFullPage = function () {
            var canvasElement = document.getElementById("renderCanvas");
            canvasElement.style.position = "absolute";
            canvasElement.style.top = 0;
            canvasElement.style.left = 0;
            canvasElement.style.zIndex = 100;
        }
        var exitFullPage = function () {
            document.getElementById("renderCanvas").style.position = "relative";
            document.getElementById("renderCanvas").style.zIndex = 0;
        }
        var goFullscreen = function () {
            if (engine) {
                engine.switchFullscreen(true);
            }
        }
        var editorGoFullscreen = function () {
            var editorDiv = document.getElementById("jsEditor");
            if (editorDiv.requestFullscreen) {
                editorDiv.requestFullscreen();
            } else if (editorDiv.mozRequestFullScreen) {
                editorDiv.mozRequestFullScreen();
            } else if (editorDiv.webkitRequestFullscreen) {
                editorDiv.webkitRequestFullscreen();
            }

        }

        var toggleEditor = function () {
            var editorButton = document.getElementById("editorButton1600");
            var scene = engine.scenes[0];

            // If the editor is present
            if (editorButton.classList.contains('checked')) {
                setToMultipleID("editorButton", "removeClass", 'checked');
                splitInstance.collapse(0);
                setToMultipleID("editorButton", "innerHTML", 'Editor <i class="fa fa-square-o" aria-hidden="true"></i>');
            } else {
                setToMultipleID("editorButton", "addClass", 'checked');
                splitInstance.setSizes([50, 50]);  // Reset
                setToMultipleID("editorButton", "innerHTML", 'Editor <i class="fa fa-check-square" aria-hidden="true"></i>');
            }
            engine.resize();

            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
                scene.debugLayer.show();
            }
        }

        /**
         * Toggle the dark theme
         */
        var toggleTheme = function (theme) {
            // Monaco
            var vsTheme;
            if (theme == 'dark') {
                vsTheme = 'vs-dark'
            } else {
                vsTheme = 'vs'
            }

            var oldCode = jsEditor.getValue();
            jsEditor.dispose();
            editorOptions.theme = vsTheme;
            jsEditor = monaco.editor.create(document.getElementById('jsEditor'), editorOptions);
            jsEditor.setValue(oldCode);
            setFontSize(fontSize);

            jsEditor.onKeyUp(function (evt) {
                markDirty();
            });

            for (var index = 0; index < elementToTheme.length; index++) {
                var obj = elementToTheme[index];
                var domObjArr = document.querySelectorAll(obj);
                for (var domObjIndex = 0; domObjIndex < domObjArr.length; domObjIndex++) {
                    var domObj = domObjArr[domObjIndex];
                    domObj.classList.remove('light');
                    domObj.classList.remove('dark');
                    domObj.classList.add(theme);
                }
            }

            localStorage.setItem("bjs-playground-theme", theme);

        }

        var toggleDebug = function () {
            var debugButton = document.getElementById("debugButton1600");
            var scene = engine.scenes[0];

            if (debugButton.classList.contains('uncheck')) {
                setToMultipleID("debugButton", "removeClass", 'uncheck');
                setToMultipleID("debugButton", "innerHTML", 'Debug layer<i class="fa fa-check-square" aria-hidden="true"></i>');
                scene.debugLayer.show();
            } else {
                setToMultipleID("debugButton", "addClass", 'uncheck');
                setToMultipleID("debugButton", "innerHTML", 'Debug layer<i class="fa fa-square-o" aria-hidden="true"></i>');
                scene.debugLayer.hide();
            }
        }

        var toggleMetadata = function () {
            var scene = engine.scenes[0];
            document.getElementById("saveLayer").style.display = "block";
        }

        var formatCode = function () {
            jsEditor.getAction('editor.action.format').run();
        }

        var toggleMinimap = function () {
            var minimapToggle = document.getElementById("minimapToggle1600");
            if (minimapToggle.classList.contains('checked')) {
                jsEditor.updateOptions({ minimap: { enabled: false } });
                setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="fa fa-square-o" aria-hidden="true"></i>');
            } else {
                jsEditor.updateOptions({ minimap: { enabled: true } });
                setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="fa fa-check-square" aria-hidden="true"></i>');
            }
            minimapToggle.classList.toggle('checked');
        }


        //Navigation Overwrites
        var exitPrompt = function (e) {
            var safeToggle = document.getElementById("safemodeToggle1600");
            if (safeToggle.classList.contains('checked')) {
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

            // Retrieve title if necessary
            if (document.getElementById("saveLayer")) {
                currentSnippetTitle = document.getElementById("saveFormTitle").value;
                currentSnippetDescription = document.getElementById("saveFormDescription").value;
                currentSnippetTags = document.getElementById("saveFormTags").value;
            }

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function () {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 201) {
                        var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                        var snippet = JSON.parse(xmlHttp.responseText);
                        var newUrl = baseUrl + "#" + snippet.id;
                        currentSnippetToken = snippet.id;
                        if (snippet.version && snippet.version !== "0") {
                            newUrl += "#" + snippet.version;
                        }
                        location.href = newUrl;
                        // Hide the complete title & co message
                        hideNoMetadata();
                        compileAndRun();
                    } else {
                        showError("Unable to save your code. It may be too long.", null);
                    }
                }
            }

            xmlHttp.open("POST", snippetUrl + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
            xmlHttp.setRequestHeader("Content-Type", "application/json");

            var dataToSend = {
                payload: {
                    code: jsEditor.getValue()
                },
                name: currentSnippetTitle,
                description: currentSnippetDescription,
                tags: currentSnippetTags
            };

            xmlHttp.send(JSON.stringify(dataToSend));
        }

        var askForSave = function () {
            if (currentSnippetTitle == null
                || currentSnippetDescription == null
                || currentSnippetTags == null) {

                document.getElementById("saveLayer").style.display = "block";
            }
            else {
                save();
            }
        };
        document.getElementById("saveFormButtonOk").addEventListener("click", function () {
            document.getElementById("saveLayer").style.display = "none";
            save();
        });
        document.getElementById("saveFormButtonCancel").addEventListener("click", function () {
            document.getElementById("saveLayer").style.display = "none";
        });
        document.getElementById("saveMessage").addEventListener("click", function () {
            document.getElementById("saveMessage").style.display = "none";
        });
        document.getElementById("mainTitle").innerHTML = "v" + BABYLON.Engine.Version;

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
                                    var snippet = JSON.parse(xmlHttp.responseText)[0];

                                    blockEditorChange = true;
                                    jsEditor.setValue(JSON.parse(snippet.jsonPayload).code.toString());

                                    // Check if title / descr / tags are already set
                                    if (snippet.name != null && snippet.name != "") {
                                        currentSnippetTitle = snippet.name;
                                    }
                                    else currentSnippetTitle = null;

                                    if (snippet.description != null && snippet.description != "") {
                                        currentSnippetDescription = snippet.description;
                                    }
                                    else currentSnippetDescription = null;

                                    if (snippet.tags != null && snippet.tags != "") {
                                        currentSnippetTags = snippet.tags;
                                    }
                                    else currentSnippetTags = null;

                                    if (currentSnippetTitle != null && currentSnippetTags != null && currentSnippetDescription) {
                                        if (document.getElementById("saveLayer")) {

                                            document.getElementById("saveFormTitle").value = currentSnippetTitle;
                                            document.getElementById("saveFormDescription").value = currentSnippetDescription;
                                            document.getElementById("saveFormTags").value = currentSnippetTags;

                                            hideNoMetadata();
                                        }
                                    }
                                    else {
                                        showNoMetadata();
                                    }

                                    jsEditor.setPosition({ lineNumber: 0, column: 0 });
                                    blockEditorChange = false;
                                    compileAndRun();

                                    setToMultipleID("currentScript", "innerHTML", "Custom");
                                } else if (firstTime) {
                                    location.href = location.href.replace(location.hash, "");
                                    if (scripts) {
                                        loadScriptFromIndex(0);
                                    }
                                }
                            }
                        };

                        var hash = location.hash.substr(1);
                        currentSnippetToken = hash.split("#")[0];
                        if (!hash.split("#")[1]) hash += "#0";


                        xmlHttp.open("GET", snippetUrl + "/" + hash.replace("#", "/"));
                        xmlHttp.send();
                    } catch (e) {

                    }
                }
            }
            setTimeout(checkHash, 200);
        }

        checkHash(true);


        // ---------- UI

        // Run
        setToMultipleID("runButton", "click", compileAndRun);
        // New
        setToMultipleID("newButton", "click", createNewScript);
        // Clear 
        setToMultipleID("clearButton", "click", clear);
        // Save
        setToMultipleID("saveButton", "click", askForSave);
        // Zip
        setToMultipleID("zipButton", "click", getZip);
        // Themes
        setToMultipleID("darkTheme", "click", toggleTheme.bind(this, 'dark'));
        setToMultipleID("lightTheme", "click", toggleTheme.bind(this, 'light'));
        // Safe mode
        setToMultipleID("safemodeToggle", 'click', function () {
            document.getElementById("safemodeToggle1600").classList.toggle('checked');
            if (document.getElementById("safemodeToggle1600").classList.contains('checked')) {
                setToMultipleID("safemodeToggle", "innerHTML", 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
            } else {
                setToMultipleID("safemodeToggle", "innerHTML", 'Safe mode <i class="fa fa-square-o" aria-hidden="true"></i>');
            }
        });
        // Editor
        setToMultipleID("editorButton", "click", toggleEditor);
        // FullScreen
        setToMultipleID("fullscreenButton", "click", goFullscreen);
        // Editor fullScreen
        setToMultipleID("editorFullscreenButton", "click", editorGoFullscreen);
        // Format
        setToMultipleID("formatButton", "click", formatCode);
        // Format
        setToMultipleID("minimapToggle", "click", toggleMinimap);
        // Debug
        setToMultipleID("debugButton", "click", toggleDebug);
        // Metadata
        setToMultipleID("metadataButton", "click", toggleMetadata);


        // Restore theme
        var theme = localStorage.getItem("bjs-playground-theme") || 'light';
        toggleTheme(theme);
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

                    jsEditor = monaco.editor.create(document.getElementById('jsEditor'), editorOptions);

                    run();
                });
            }
        }
    };
    xhr.send(null);
})();
