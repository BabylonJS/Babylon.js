var jsEditor;
var defaultScene = "scripts/basic scene.js";
var monacoMode = "javascript";

function getRunCode(jsEditor, callBack) {
    var code = jsEditor.getValue();
    callBack(code);
}


function showError(errorMessage, errorEvent) {
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
    document.getElementById("errorZone").querySelector('.close').addEventListener('click', function() {
        document.getElementById("errorZone").style.display = 'none';
    });
}

(function() {

    var multipleSize = [1600, 1475, 1030, 750];
    var setToMultipleID = function(id, thingToDo, param) {
        multipleSize.forEach(function(size) {

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

    var editorOptions;

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
        '.navbarBottom .links .link'];

    var run = function() {

        // #region - Examples playgrounds
        var examplesButton = document.getElementsByClassName("examplesButton");

        if (examplesButton && examplesButton.length > 0) {
            var isExamplesDisplayed = false;
            for (var i = 0; i < examplesButton.length; i++) {
                examplesButton[i].parentElement.onclick = function() {
                    isExamplesDisplayed = !isExamplesDisplayed;
                    if (isExamplesDisplayed) {
                        document.getElementById("exampleList").style.display = "block";
                        document.getElementsByClassName("wrapper")[0].style.width = "calc(100% - 400px)";
                    }
                    else {
                        document.getElementById("exampleList").style.display = "none";
                        document.getElementsByClassName("wrapper")[0].style.width = "100%";
                    }
                }
            }
        }


        var filterBar = document.getElementById("filterBar");
        if (filterBar) {
            var filterBarClear = document.getElementById("filterBarClear");
            var filter = function() {
                var filterText = filterBar.value.toLowerCase();
                if (filterText == "") filterBarClear.style.display = "none";
                else filterBarClear.style.display = "inline-block";

                var lines = document.getElementsByClassName("itemLine");
                for (var lineIndex = 0; lineIndex < lines.length; lineIndex++) {
                    var line = lines[lineIndex];
                    if (line.innerText.toLowerCase().indexOf(filterText) > -1) {
                        line.style.display = "";
                    } else {
                        line.style.display = "none";
                    }
                }

                var categories = document.getElementsByClassName("categoryContainer");
                var displayCount = categories.length;

                for (var categoryIndex = 0; categoryIndex < categories.length; categoryIndex++) {
                    var category = categories[categoryIndex];
                    category.style.display = "block";
                    if (category.clientHeight < 25) {
                        category.style.display = "none";
                        displayCount--;
                    }
                }

                if (displayCount == 0) document.getElementById("noResultsContainer").style.display = "block";
                else document.getElementById("noResultsContainer").style.display = "none";
            }
            filterBar.oninput = function() {
                filter();
            }
            filterBarClear.onclick = function() {
                filterBar.value = "";
                filter();
            }
        }
        // #endregion

        var blockEditorChange = false;

        var markDirty = function() {
            if (blockEditorChange) {
                return;
            }

            // setToMultipleID("currentScript", "innerHTML", "Custom");
            setToMultipleID("safemodeToggle", "addClass", "checked");
            // setToMultipleID("minimapToggle", "addClass", "checked"); // Why ?!
            setToMultipleID('safemodeToggle', 'innerHTML', 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
        }

        jsEditor.onKeyUp(function(evt) {
            markDirty();
        });

        var snippetV3Url = "https://snippet.babylonjs.com"
        var currentSnippetToken;
        var currentSnippetTitle = null;
        var currentSnippetDescription = null;
        var currentSnippetTags = null;
        var engine;
        var fpsLabel = document.getElementById("fpsLabel");
        var scripts;
        var zipCode;
        BABYLON.Engine.ShadersRepository = "/src/Shaders/";

        if (location.href.indexOf("indexStable") !== -1) {
            setToMultipleID("currentVersion", "innerHTML", "Version: Stable");
        } else {
            setToMultipleID("currentVersion", "innerHTML", "Version: Latest");
        }

        var checkTypescriptSupport = function(xhr) {
            var filename = location.pathname.substring(location.pathname.lastIndexOf('/') + 1);
            if (xhr.responseText.indexOf("class Playground") !== -1) {// Typescript content
                if (!filename) {
                    window.location.href = location.protocol + "//" + location.host + "/ts.html" + window.location.hash;
                    return false;
                }
                else if (filename !== "ts.html") {
                    window.location.href = location.protocol + "//" + location.host + location.pathname.replace(filename, "ts.html") + window.location.hash;
                    return false;
                }
            } else { // Javscript content
                if (filename === "ts.html") {
                    window.location.href = location.protocol + "//" + location.host + location.pathname.replace(filename, "index.html") + window.location.hash;
                    return false;
                }
            }

            return true;
        }

        var loadScript = function(scriptURL, title) {
            var xhr = new XMLHttpRequest();

            xhr.open('GET', scriptURL, true);

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {

                        if (!checkTypescriptSupport(xhr)) {
                            return;
                        }

                        xhr.onreadystatechange = null;
                        blockEditorChange = true;
                        jsEditor.setValue(xhr.responseText);
                        jsEditor.setPosition({ lineNumber: 0, column: 0 });
                        blockEditorChange = false;
                        compileAndRun();

                        // setToMultipleID("currentScript", "innerHTML", title);

                        currentSnippetToken = null;
                    }
                }
            };

            xhr.send(null);
        };

        var loadScriptsList = function() {

            var exampleList = document.getElementById("exampleList");

            var xhr = new XMLHttpRequest();
            //Open Typescript or Javascript examples
            if (exampleList.className != 'typescript') {
                xhr.open('GET', 'https://raw.githubusercontent.com/BabylonJS/Documentation/master/examples/list.json', true);
            }
            else {
                xhr.open('GET', 'https://raw.githubusercontent.com/BabylonJS/Documentation/master/examples/list_ts.json', true);
            }

            xhr.onreadystatechange = function() {
                if (xhr.readyState === 4) {
                    if (xhr.status === 200) {
                        scripts = JSON.parse(xhr.response)["examples"];

                        function sortScriptsList(a, b) {
                            if (a.title < b.title) return -1;
                            else return 1;
                            return 0;
                        }
                        scripts.sort(sortScriptsList);



                        if (exampleList) {
                            for (var i = 0; i < scripts.length; i++) {
                                scripts[i].samples.sort(sortScriptsList);

                                var exampleCategory = document.createElement("div");
                                exampleCategory.classList.add("categoryContainer");

                                var exampleCategoryTitle = document.createElement("p");
                                exampleCategoryTitle.innerText = scripts[i].title;
                                exampleCategory.appendChild(exampleCategoryTitle);

                                for (var ii = 0; ii < scripts[i].samples.length; ii++) {
                                    var example = document.createElement("div");
                                    example.classList.add("itemLine");
                                    example.id = ii;

                                    var exampleImg = document.createElement("img");
                                    exampleImg.src = scripts[i].samples[ii].icon.replace("icons", "https://doc.babylonjs.com/examples/icons");
                                    exampleImg.setAttribute("onClick", "document.getElementById('PGLink_" + scripts[i].samples[ii].PGID + "').click();");

                                    var exampleContent = document.createElement("div");
                                    exampleContent.classList.add("itemContent");
                                    exampleContent.setAttribute("onClick", "document.getElementById('PGLink_" + scripts[i].samples[ii].PGID + "').click();");

                                    var exampleContentLink = document.createElement("div");
                                    exampleContentLink.classList.add("itemContentLink");

                                    var exampleTitle = document.createElement("h3");
                                    exampleTitle.classList.add("exampleCategoryTitle");
                                    exampleTitle.innerText = scripts[i].samples[ii].title;
                                    var exampleDescr = document.createElement("div");
                                    exampleDescr.classList.add("itemLineChild");
                                    exampleDescr.innerText = scripts[i].samples[ii].description;

                                    var exampleDocLink = document.createElement("a");
                                    exampleDocLink.classList.add("itemLineDocLink");
                                    exampleDocLink.innerText = "Documentation";
                                    exampleDocLink.href = scripts[i].samples[ii].doc;
                                    exampleDocLink.target = "_blank";

                                    var examplePGLink = document.createElement("a");
                                    examplePGLink.id = "PGLink_" + scripts[i].samples[ii].PGID;
                                    examplePGLink.classList.add("itemLinePGLink");
                                    examplePGLink.innerText = "Display";
                                    examplePGLink.href = scripts[i].samples[ii].PGID;

                                    exampleContentLink.appendChild(exampleTitle);
                                    exampleContentLink.appendChild(exampleDescr);
                                    exampleContent.appendChild(exampleContentLink);
                                    exampleContent.appendChild(exampleDocLink);
                                    exampleContent.appendChild(examplePGLink);

                                    example.appendChild(exampleImg);
                                    example.appendChild(exampleContent);

                                    exampleCategory.appendChild(example);
                                }

                                exampleList.appendChild(exampleCategory);
                            }

                            var noResultContainer = document.createElement("div");
                            noResultContainer.id = "noResultsContainer";
                            noResultContainer.classList.add("categoryContainer");
                            noResultContainer.style.display = "none";
                            noResultContainer.innerHTML = "<p id='noResults'>No results found.</p>";
                            exampleList.appendChild(noResultContainer);
                        }

                        if (!location.hash) {
                            // Query string
                            var queryString = window.location.search;

                            if (queryString) {
                                var query = queryString.replace("?", "");
                                index = parseInt(query);
                                if (!isNaN(index)) {
                                    var newPG = "";
                                    switch (index) {
                                        case 1: newPG = "#TAZ2CB#0"; break; // Basic scene
                                        case 2: newPG = "#A1210C#0"; break; // Basic elements
                                        case 3: newPG = "#CURCZC#0"; break; // Rotation and scaling
                                        case 4: newPG = "#DXARSP#0"; break; // Materials
                                        case 5: newPG = "#1A3M5C#0"; break; // Cameras
                                        case 6: newPG = "#AQRDKW#0"; break; // Lights
                                        case 7: newPG = "#QYFDDP#1"; break; // Animations
                                        case 8: newPG = "#9RI8CG#0"; break; // Sprites
                                        case 9: newPG = "#U8MEB0#0"; break; // Collisions
                                        case 10: newPG = "#KQV9SA#0"; break; // Intersections
                                        case 11: newPG = "#NU4F6Y#0"; break; // Picking
                                        case 12: newPG = "#EF9X5R#0"; break; // Particles
                                        case 13: newPG = "#7G0IQW#0"; break; // Environment
                                        case 14: newPG = "#95PXRY#0"; break; // Height map
                                        case 15: newPG = "#IFYDRS#0"; break; // Shadows
                                        case 16: newPG = "#AQZJ4C#0"; break; // Import meshes
                                        case 17: newPG = "#J19GYK#0"; break; // Actions
                                        case 18: newPG = "#UZ23UH#0"; break; // Drag and drop
                                        case 19: newPG = "#AQZJ4C#0"; break; // Fresnel
                                        case 20: newPG = "#8ZNVGR#0"; break; // Easing functions
                                        case 21: newPG = "#B2ZXG6#0"; break; // Procedural texture
                                        case 22: newPG = "#DXAEUY#0"; break; // Basic sounds
                                        case 23: newPG = "#EDVU95#0"; break; // Sound on mesh
                                        case 24: newPG = "#N96NXC#0"; break; // SSAO rendering pipeline
                                        case 25: newPG = "#7D2QDD#0"; break; // SSAO 2
                                        case 26: newPG = "#V2DAKC#0"; break; // Volumetric light scattering
                                        case 27: newPG = "#XH85A9#0"; break; // Refraction and reflection
                                        case 28: newPG = "#8MGKWK#0"; break; // PBR
                                        case 29: newPG = "#0K8EYN#0"; break; // Instanced bones
                                        case 30: newPG = "#C245A1#0"; break; // Pointer events handling
                                        case 31: newPG = "#TAFSN0#2"; break; // WebVR
                                        case 32: newPG = "#3VMTI9#0"; break; // GUI
                                        case 33: newPG = "#7149G4#0"; break; // Physics

                                        default: newPG = ""; break;
                                    }
                                    window.location.href = location.protocol + "//" + location.host + location.pathname + "#" + newPG;
                                } else if (query.indexOf("=") === -1) {
                                    loadScript("scripts/" + query + ".js", query);
                                } else {
                                    loadScript(defaultScene, "Basic scene");
                                }
                            } else {
                                loadScript(defaultScene, "Basic scene");
                            }
                        }

                        // Restore theme
                        var theme = localStorage.getItem("bjs-playground-theme") || 'light';
                        toggleTheme(theme);

                        // Remove editor if window size is less than 850px
                        var removeEditorForSmallScreen = function() {
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

        var createNewScript = function() {
            // check if checked is on
            let iCanClear = checkSafeMode("Are you sure you want to create a new playground?");
            if (!iCanClear) return;
            location.hash = "";
            currentSnippetToken = null;
            currentSnippetTitle = null;
            currentSnippetDescription = null;
            currentSnippetTags = null;
            showNoMetadata();
            if (monacoMode === "javascript") {
                jsEditor.setValue('// You have to create a function called createScene. This function must return a BABYLON.Scene object\r\n// You can reference the following variables: scene, canvas\r\n// You must at least define a camera\r\n\r\nvar createScene = function() {\r\n\tvar scene = new BABYLON.Scene(engine);\r\n\tvar camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);\r\n\tcamera.attachControl(canvas, true);\r\n\r\n\r\n\r\n\treturn scene;\r\n};');
            } else {
                jsEditor.setValue('// You have to create a class called Playground. This class must provide a static function named CreateScene(engine, canvas) which must return a BABYLON.Scene object\r\n// You must at least define a camera inside the CreateScene function\r\n\r\nclass Playground {\r\n\tpublic static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {\r\n\t\tvar scene = new BABYLON.Scene(engine);\r\n\r\n\t\tvar camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);\r\n\t\tcamera.setTarget(BABYLON.Vector3.Zero());\r\n\t\tcamera.attachControl(canvas, true);\r\n\r\n\t\treturn scene;\r\n\t}\r\n}');
            }
            jsEditor.setPosition({ lineNumber: 11, column: 0 });
            jsEditor.focus();
            compileAndRun();
        }

        var clear = function() {
            // check if checked is on
            let iCanClear = checkSafeMode("Are you sure you want to clear the playground?");
            if (!iCanClear) return;
            location.hash = "";
            currentSnippetToken = null;
            jsEditor.setValue('');
            jsEditor.setPosition({ lineNumber: 0, column: 0 });
            jsEditor.focus();
        }

        var checkSafeMode = function(message) {
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

        var showNoMetadata = function() {
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
        };
        showNoMetadata();

        var hideNoMetadata = function() {
            document.getElementById("saveFormTitle").readOnly = true;
            document.getElementById("saveFormDescription").readOnly = true;
            document.getElementById("saveFormTags").readOnly = true;
            document.getElementById("saveFormButtonOk").style.display = "none";
            setToMultipleID("metadataButton", "display", "inline-block");
        };

        compileAndRun = function() {
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
                showBJSPGMenu();
                jsEditor.updateOptions({ readOnly: false });

                if (BABYLON.Engine.LastCreatedScene && BABYLON.Engine.LastCreatedScene.debugLayer.isVisible()) {
                    showInspector = true;
                }

                if (engine) {
                    engine.dispose();
                    engine = null;
                }

                var canvas = document.getElementById("renderCanvas");
                document.getElementById("errorZone").style.display = 'none';
                document.getElementById("errorZone").innerHTML = "";
                document.getElementById("statusBar").innerHTML = "Loading assets...Please wait";
                var checkCamera = true;
                var checkSceneCount = true;
                var wrappedEval = false;
                var createEngineFunction = "createDefaultEngine";
                var createSceneFunction;

                getRunCode(jsEditor, function(code) {
                    var createDefaultEngine = function() {
                        return new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true });
                    }

                    var scene;
                    var defaultEngineZip = "new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true })";

                    if (code.indexOf("createEngine") !== -1) {
                        createEngineFunction = "createEngine";
                    }

                    if (code.indexOf("delayCreateScene") !== -1) { // createScene
                        createSceneFunction = "delayCreateScene";
                        checkCamera = false;
                    } else if (code.indexOf("createScene") !== -1) { // createScene
                        createSceneFunction = "createScene";
                    } else if (code.indexOf("CreateScene") !== -1) { // CreateScene
                        createSceneFunction = "CreateScene";
                    } else if (code.indexOf("createscene") !== -1) { // createscene
                        createSceneFunction = "createscene";
                    }

                    if (!createSceneFunction) {
                        // just pasted code.
                        engine = createDefaultEngine();
                        scene = new BABYLON.Scene(engine);
                        eval("runScript = function(scene, canvas) {" + code + "}");
                        runScript(scene, canvas);

                        zipCode = "var engine = " + defaultEngineZip + ";\r\nvar scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
                    } else {
                        //execute the code
                        eval(code);
                        //create engine
                        eval("engine = " + createEngineFunction + "()");
                        if (!engine) {
                            showError("createEngine function must return an engine.", null);
                            return;
                        }

                        //create scene
                        eval("scene = " + createSceneFunction + "()");

                        if (!scene) {
                            showError(createSceneFunction + " function must return a scene.", null);
                            return;
                        }

                        // if scene returns a promise avoid checks
                        if (scene.then) {
                            checkCamera = false;
                            checkSceneCount = false;
                        }

                        var createEngineZip = (createEngineFunction === "createEngine")
                            ? "createEngine()"
                            : defaultEngineZip;

                        zipCode =
                            code + "\r\n\r\n" +
                            "var engine = " + createEngineZip + ";\r\n" +
                            "var scene = " + createSceneFunction + "();";

                    }

                    engine.runRenderLoop(function() {
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

                    if (checkSceneCount && engine.scenes.length === 0) {

                        showError("You must at least create a scene.", null);
                        return;
                    }

                    if (checkCamera && engine.scenes[0].activeCamera == null) {
                        showError("You must at least create a camera.", null);
                        return;
                    } else if (scene.then) {
                        scene.then(function() {
                            document.getElementById("statusBar").innerHTML = "";
                        });
                    } else {
                        engine.scenes[0].executeWhenReady(function() {
                            document.getElementById("statusBar").innerHTML = "";
                        });
                    }

                    if (scene) {
                        if (showInspector) {
                            if (scene.then) {
                                // Handle if scene is a promise
                                scene.then(function(s) {
                                    if (!s.debugLayer.isVisible()) {
                                        s.debugLayer.show({ embedMode: true });
                                    }
                                })
                            } else {
                                if (!scene.debugLayer.isVisible()) {
                                    scene.debugLayer.show({ embedMode: true });
                                }
                            }
                        }
                    }
                });

            } catch (e) {
                showError(e.message, e);
                // Also log error in console to help debug playgrounds
                console.error(e);
            }
        };
        window.addEventListener("resize",
            function() {
                if (engine) {
                    engine.resize();
                }
            });

        // Load scripts list
        loadScriptsList();

        // Zip
        var addContentToZip = function(zip, name, url, replace, buffer, then) {
            if (url.substring(0, 5) == "data:" || url.substring(0, 5) == "http:" || url.substring(0, 5) == "blob:" || url.substring(0, 6) == "https:") {
                then();
                return;
            }

            var xhr = new XMLHttpRequest();

            xhr.open('GET', url, true);

            if (buffer) {
                xhr.responseType = "arraybuffer";
            }

            xhr.onreadystatechange = function() {
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

        var addTexturesToZip = function(zip, index, textures, folder, then) {

            if (index === textures.length || !textures[index].name) {
                then();
                return;
            }

            if (textures[index].isRenderTarget || textures[index] instanceof BABYLON.DynamicTexture || textures[index].name.indexOf("data:") !== -1) {
                addTexturesToZip(zip, index + 1, textures, folder, then);
                return;
            }

            if (textures[index].isCube) {
                if (textures[index].name.indexOf("dds") === -1) {
                    if (textures[index]._extensions) {
                        for (var i = 0; i < 6; i++) {
                            textures.push({ name: textures[index].name + textures[index]._extensions[i] });
                        }
                    } else if (textures[index]._files) {
                        for (var i = 0; i < 6; i++) {
                            textures.push({ name: textures[index]._files[i] });
                        }
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
                    function() {
                        addTexturesToZip(zip, index + 1, textures, folder, then);
                    });
            }
            else {
                addTexturesToZip(zip, index + 1, textures, folder, then);
            }
        }

        var addImportedFilesToZip = function(zip, index, importedFiles, folder, then) {
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
                function() {
                    addImportedFilesToZip(zip, index + 1, importedFiles, folder, then);
                });
        }

        var getZip = function() {
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
                function() {
                    addTexturesToZip(zip,
                        0,
                        textures,
                        null,
                        function() {
                            addImportedFilesToZip(zip,
                                0,
                                importedFiles,
                                null,
                                function() {
                                    var blob = zip.generate({ type: "blob" });
                                    saveAs(blob, "sample.zip");
                                    document.getElementById("statusBar").innerHTML = "";
                                });
                        });
                });
        }

        // Versions
        setVersion = function(version) {
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
        setFontSize = function(size) {
            fontSize = size;
            jsEditor.updateOptions({ fontSize: size });
            setToMultipleID("currentFontSize", "innerHTML", "Font: " + size);
        };

        // Fullscreen
        document.getElementById("renderCanvas").addEventListener("webkitfullscreenchange", function() {
            if (document.webkitIsFullScreen) goFullPage();
            else exitFullPage();
        }, false);

        var goFullPage = function() {
            var canvasElement = document.getElementById("renderCanvas");
            canvasElement.style.position = "absolute";
            canvasElement.style.top = 0;
            canvasElement.style.left = 0;
            canvasElement.style.zIndex = 100;
        }
        var exitFullPage = function() {
            document.getElementById("renderCanvas").style.position = "relative";
            document.getElementById("renderCanvas").style.zIndex = 0;
        }
        var goFullscreen = function() {
            if (engine) {
                engine.switchFullscreen(true);
            }
        }
        var editorGoFullscreen = function() {
            var editorDiv = document.getElementById("jsEditor");
            if (editorDiv.requestFullscreen) {
                editorDiv.requestFullscreen();
            } else if (editorDiv.mozRequestFullScreen) {
                editorDiv.mozRequestFullScreen();
            } else if (editorDiv.webkitRequestFullscreen) {
                editorDiv.webkitRequestFullscreen();
            }

        }

        var toggleEditor = function() {
            var editorButton = document.getElementById("editorButton1600");
            var scene = engine.scenes[0];

            // If the editor is present
            if (editorButton.classList.contains('checked')) {
                setToMultipleID("editorButton", "removeClass", 'checked');
                splitInstance.collapse(0);
                setToMultipleID("editorButton", "innerHTML", 'Editor <i class="far fa-square" aria-hidden="true"></i>');
            } else {
                setToMultipleID("editorButton", "addClass", 'checked');
                splitInstance.setSizes([50, 50]);  // Reset
                setToMultipleID("editorButton", "innerHTML", 'Editor <i class="fa fa-check-square" aria-hidden="true"></i>');
            }
            engine.resize();

            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.show({ embedMode: true });
            }
        }

        /**
         * Toggle the dark theme
         */
        var toggleTheme = function(theme) {
            // Monaco
            var vsTheme;
            if (theme == 'dark') {
                vsTheme = 'vs-dark'
            } else {
                vsTheme = 'vs'
            }

            var oldCode = jsEditor.getValue();
            jsEditor.dispose();
            editorOptions = {
                value: "",
                language: monacoMode,
                lineNumbers: true,
                tabSize: "auto",
                insertSpaces: "auto",
                roundedSelection: true,
                automaticLayout: true,
                scrollBeyondLastLine: false,
                readOnly: false,
                theme: vsTheme,
                contextmenu: false,
                folding: true,
                showFoldingControls: "always",
                renderIndentGuides: true,
                minimap: {
                    enabled: true
                }
            };
            editorOptions.minimap.enabled = document.getElementById("minimapToggle1600").classList.contains('checked');
            jsEditor = monaco.editor.create(document.getElementById('jsEditor'), editorOptions);
            jsEditor.setValue(oldCode);
            setFontSize(fontSize);

            jsEditor.onKeyUp(function(evt) {
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

        var toggleDebug = function() {
            // Always showing the debug layer, because you can close it by itself
            var scene = engine.scenes[0];
            if (scene.debugLayer.isVisible()) {
                scene.debugLayer.hide();
            }
            else {
                scene.debugLayer.show({ embedMode: true });
            }
        }

        var toggleMetadata = function() {
            var scene = engine.scenes[0];
            document.getElementById("saveLayer").style.display = "block";
        }

        var formatCode = function() {
            jsEditor.getAction('editor.action.formatDocument').run();
        }

        var toggleMinimap = function() {
            var minimapToggle = document.getElementById("minimapToggle1600");
            if (minimapToggle.classList.contains('checked')) {
                jsEditor.updateOptions({ minimap: { enabled: false } });
                setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="far fa-square" aria-hidden="true"></i>');
            } else {
                jsEditor.updateOptions({ minimap: { enabled: true } });
                setToMultipleID("minimapToggle", "innerHTML", 'Minimap <i class="fa fa-check-square" aria-hidden="true"></i>');
            }
            minimapToggle.classList.toggle('checked');
        }


        //Navigation Overwrites
        var exitPrompt = function(e) {
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
        var save = function() {

            // Retrieve title if necessary
            if (document.getElementById("saveLayer")) {
                currentSnippetTitle = document.getElementById("saveFormTitle").value;
                currentSnippetDescription = document.getElementById("saveFormDescription").value;
                currentSnippetTags = document.getElementById("saveFormTags").value;
            }

            var xmlHttp = new XMLHttpRequest();
            xmlHttp.onreadystatechange = function() {
                if (xmlHttp.readyState === 4) {
                    if (xmlHttp.status === 200) {
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

            xmlHttp.open("POST", snippetV3Url + (currentSnippetToken ? "/" + currentSnippetToken : ""), true);
            xmlHttp.setRequestHeader("Content-Type", "application/json");

            var dataToSend = {
                payload: JSON.stringify({
                    code: jsEditor.getValue()
                }),
                name: currentSnippetTitle,
                description: currentSnippetDescription,
                tags: currentSnippetTags
            };

            xmlHttp.send(JSON.stringify(dataToSend));
        }

        var askForSave = function() {
            if (currentSnippetTitle == null
                || currentSnippetDescription == null
                || currentSnippetTags == null) {

                document.getElementById("saveLayer").style.display = "block";
            }
            else {
                save();
            }
        };
        document.getElementById("saveFormButtonOk").addEventListener("click", function() {
            document.getElementById("saveLayer").style.display = "none";
            save();
        });
        document.getElementById("saveFormButtonCancel").addEventListener("click", function() {
            document.getElementById("saveLayer").style.display = "none";
        });
        document.getElementById("mainTitle").innerHTML = "v" + BABYLON.Engine.Version;

        var previousHash = "";

        var cleanHash = function() {
            var splits = decodeURIComponent(location.hash.substr(1)).split("#");

            if (splits.length > 2) {
                splits.splice(2, splits.length - 2);
            }

            location.hash = splits.join("#");
        }

        var checkHash = function(firstTime) {
            if (location.hash) {
                if (previousHash !== location.hash) {
                    cleanHash();

                    previousHash = location.hash;

                    try {
                        var xmlHttp = new XMLHttpRequest();
                        xmlHttp.onreadystatechange = function() {
                            if (xmlHttp.readyState === 4) {
                                if (xmlHttp.status === 200) {

                                    if (!checkTypescriptSupport(xmlHttp)) {
                                        return;
                                    }

                                    var snippet = JSON.parse(xmlHttp.responseText);

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

                                    // setToMultipleID("currentScript", "innerHTML", "Custom");
                                }
                            }
                        };

                        var hash = location.hash.substr(1);
                        currentSnippetToken = hash.split("#")[0];
                        if (!hash.split("#")[1]) hash += "#0";


                        xmlHttp.open("GET", snippetV3Url + "/" + hash.replace("#", "/"));
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
        setToMultipleID("safemodeToggle", 'click', function() {
            document.getElementById("safemodeToggle1600").classList.toggle('checked');
            if (document.getElementById("safemodeToggle1600").classList.contains('checked')) {
                setToMultipleID("safemodeToggle", "innerHTML", 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
            } else {
                setToMultipleID("safemodeToggle", "innerHTML", 'Safe mode <i class="far fa-square" aria-hidden="true"></i>');
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
        toggleMinimap();
    }

    // Monaco

    var xhr = new XMLHttpRequest();

    xhr.open('GET', "babylon.d.txt", true);

    xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
            if (xhr.status === 200) {
                require.config({ paths: { 'vs': 'node_modules/monaco-editor/min/vs' } });
                require(['vs/editor/editor.main'], function() {
                    if (monacoMode === "javascript") {
                        monaco.languages.typescript.javascriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                    } else {
                        monaco.languages.typescript.typescriptDefaults.addExtraLib(xhr.responseText, 'babylon.d.ts');
                    }

                    jsEditor = monaco.editor.create(document.getElementById('jsEditor'), editorOptions);

                    run();
                });
            }
        }
    };
    xhr.send(null);
})();

