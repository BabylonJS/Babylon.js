var engine = null;

/**
 * Compile the script in the editor, and run the preview in the canvas
 */
compileAndRun = function(parent, fpsLabel) {
    // If we need to change the version, don't do this
    if (parent.settingsPG.mustModifyBJSversion()) return;

    try {
        parent.menuPG.hideWaitDiv();

        if (!BABYLON.Engine.isSupported()) {
            parent.utils.showError("Your browser does not support WebGL. Please, try to update it, or install a compatible one.", null);
            return;
        }

        var showInspector = false;
        parent.menuPG.showBJSPGMenu();
        parent.monacoCreator.JsEditor.updateOptions({ readOnly: false });

        if (BABYLON.Engine.LastCreatedScene && BABYLON.Engine.LastCreatedScene.debugLayer.isVisible()) {
            showInspector = true;
        }

        if (engine) {
            try {
                engine.dispose();
            }
            catch (ex) { }
            engine = null;
        }

        var canvas = document.getElementById("renderCanvas");
        document.getElementById("errorZone").style.display = 'none';
        document.getElementById("errorZone").innerHTML = "";
        document.getElementById("statusBar").innerHTML = "Loading assets... Please wait.";
        var checkCamera = true;
        var checkSceneCount = true;
        var createEngineFunction = "createDefaultEngine";
        var createSceneFunction;

        if (!navigator.gpu) {
            parent.utils.showError("WebGPU is not supported on your platform.");
            return;
        }

        parent.monacoCreator.getRunCode().then(async code => {
            try {
                var createDefaultEngine = function () {
                    return new BABYLON.WebGPUEngine(canvas);
                };

                var scene;
                var defaultEngineZip = "new BABYLON.WebGPUEngine(canvas)";

                if (code.indexOf("createEngine") !== -1) {
                    createEngineFunction = "createEngine";
                }

                // Check for different typos
                if (code.indexOf("delayCreateScene") !== -1) { // delayCreateScene
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
                    // Just pasted code.
                    engine = createDefaultEngine();
                    await engine.initAsync(window.glslangOptions).catch((e) => {
                        showparent.utils.showErrorError(e);
                
                        // Also log error in console to help debug playgrounds
                        console.error(e);
                    });
                    scene = new BABYLON.Scene(engine);
                    var runScript = null;
                    eval("runScript = function(scene, canvas) {" + code + "}");
                    runScript(scene, canvas);

                    parent.zipTool.ZipCode = "var engine = " + defaultEngineZip + ";\r\nvar scene = new BABYLON.Scene(engine);\r\n\r\n" + code;
                } else {
                    var __createScene = null;
                    if (parent.settingsPG.ScriptLanguage == "JS") {
                        code += "\n" + "__createScene = " + createSceneFunction + ";";
                    }
                    else {
                        __createScene = createSceneFunction;
                        var startCar = code.search('var ' + createSceneFunction);
                        code = code.substr(0, startCar) + code.substr(startCar + 4);
                    }

                    // Execute the code
                    eval(code);

                    // Create engine
                    eval("engine = " + createEngineFunction + "()");
                    if (!engine) {
                        parent.utils.showError("createEngine function must return an engine.", null);
                        return;
                    }
                    await engine.initAsync(window.glslangOptions).catch((e) => {
                        parent.utils.showError(e);
                
                        // Also log error in console to help debug playgrounds
                        console.error(e);
                    });

                    // Create scene
                    eval("scene = " + __createScene + "()");

                    if (!scene) {
                        parent.utils.showError(createSceneFunction + " function must return a scene.", null);
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

                    parent.zipTool.zipCode =
                        code + "\r\n\r\n" +
                        "var engine = " + createEngineZip + ";\r\n" +
                        "var scene = " + createSceneFunction + "();";

                }

                engine = engine;
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

                    // Update FPS if camera is not a webxr camera
                    if(!(scene.activeCamera && 
                        scene.activeCamera.getClassName && 
                        scene.activeCamera.getClassName() === 'WebXRCamera')) {
                        fpsLabel.innerHTML = engine.getFps().toFixed() + " fps";
                    }
                }.bind(this));

                if (checkSceneCount && engine.scenes.length === 0) {
                    parent.utils.showError("You must at least create a scene.", null);
                    return;
                }

                if (checkCamera && engine.scenes[0].activeCamera == null) {
                    parent.utils.showError("You must at least create a camera.", null);
                    return;
                } else if (scene.then) {
                    scene.then(function () {
                        document.getElementById("statusBar").innerHTML = "";
                    });
                } else {
                    engine.scenes[0].executeWhenReady(function () {
                        document.getElementById("statusBar").innerHTML = "";
                    });
                }

                if (scene) {
                    if (showInspector) {
                        if (scene.then) {
                            // Handle if scene is a promise
                            scene.then(function (s) {
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
            }
            catch (e) {
                parent.utils.showError(e.message, e);
                // Also log error in console to help debug playgrounds
                console.error(e);
            }
        });
    } catch (e) {
        parent.utils.showError(e.message, e);
        // Also log error in console to help debug playgrounds
        console.error(e);
    }
};

/**
 * This JS file contains the main function
 */
class Main {
    constructor(parent) {
        this.parent = parent;

        BABYLON.Engine.ShadersRepository = "/src/Shaders/";
        this.snippetV3Url = "https://snippet.babylonjs.com"
        this.currentSnippetToken;
        this.currentSnippetTitle = null;
        this.currentSnippetDescription = null;
        this.currentSnippetTags = null;
        this.fpsLabel = document.getElementById("fpsLabel");
        this.scripts;
        this.previousHash = "";
    }

    /**
     * First function to initialize the script
     */
    initialize() {
        this.parent.monacoCreator.loadMonaco("babylonWebGPU.d.txt");
    };

    /**
     * Main function of the app
     */
    run() {
        document.getElementById("saveFormButtonOk").addEventListener("click", function () {
            document.getElementById("saveLayer").style.display = "none";
            this.save();
        }.bind(this));
        document.getElementById("saveFormButtonCancel").addEventListener("click", function () {
            document.getElementById("saveLayer").style.display = "none";
        });

        // Resize the render view when resizing the window
        window.addEventListener("resize",
            function () {
                if (engine) {
                    engine.resize();
                }
            }.bind(this)
        );

        // Restore BJS version if needed
        var restoreVersionResult = true;
        if (this.parent.settingsPG.restoreVersion() == false) {
            // Check if there a hash in the URL
            this.checkHash();
            restoreVersionResult = false;
        }

        // Load scripts list
        this.loadScriptsList(restoreVersionResult);

        // -------------------- UI --------------------
        var handleRun = () => compileAndRun(this.parent, this.fpsLabel);
        var handleSave = () => this.askForSave();
        var handleGetZip = () => this.parent.zipTool.getZip(engine);

        // Display BJS version
        if (BABYLON) this.parent.utils.setToMultipleID("mainTitle", "innerHTML", "v" + BABYLON.Engine.Version);
        // Run
        this.parent.utils.setToMultipleID("runButton", "click", handleRun);
        // New
        this.parent.utils.setToMultipleID("newButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.createNewScript.call(this);
        }.bind(this));
        // Clear 
        this.parent.utils.setToMultipleID("clearButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.clear.call(this);
        }.bind(this));
        // Save
        this.parent.utils.setToMultipleID("saveButton", "click", handleSave);
        // Zip
        this.parent.utils.setToMultipleID("zipButton", "click", handleGetZip);
        // Themes
        this.parent.utils.setToMultipleID("darkTheme", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.parent.settingsPG.setTheme.call(this.parent.settingsPG, 'dark');
        }.bind(this));
        this.parent.utils.setToMultipleID("lightTheme", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.parent.settingsPG.setTheme.call(this.parent.settingsPG, 'light');
        }.bind(this));
        // Size
        var displayFontSize = document.getElementsByClassName('displayFontSize');
        for (var i = 0; i < displayFontSize.length; i++) {
            var options = displayFontSize[i].querySelectorAll('.option');
            for (var j = 0; j < options.length; j++) {
                options[j].addEventListener('click', function (evt) {
                    this.parent.menuPG.removeAllOptions();
                    this.parent.settingsPG.setFontSize.call(this.parent.settingsPG, evt.target.innerText)
                }.bind(this));
            }
        }
        // Footer links
        var displayFontSize = document.getElementsByClassName('displayFooterLinks');
        for (var i = 0; i < displayFontSize.length; i++) {
            var options = displayFontSize[i].querySelectorAll('.option');
            for (var j = 0; j < options.length; j++) {
                options[j].addEventListener('click', this.parent.menuPG.clickOptionSub.bind(this));
            }
        }
        // Language (JS / TS)
        this.parent.utils.setToMultipleID("toTSbutton", "click", function () {
            if(location.hash != null && location.hash != ""){
                this.parent.settingsPG.ScriptLanguage = "TS";
                window.location = "./";
            }else{
                if (this.parent.settingsPG.ScriptLanguage == "JS") {
                    //revert in case the reload is cancel due to safe mode
                    if(document.getElementById("safemodeToggle" + this.parent.utils.getCurrentSize()).classList.contains('checked')){
                        // Message before unload
                        var languageTSswapper =  function () {
                            this.parent.settingsPG.ScriptLanguage = "TS";
                            window.removeEventListener('unload', languageTSswapper.bind(this));
                        };
                        window.addEventListener('unload',languageTSswapper.bind(this));
                        
                        location.reload();
                    }
                    else {
                        this.parent.settingsPG.ScriptLanguage = "TS";
                        location.reload();
                    }
                }
            }
           
        }.bind(this));
        this.parent.utils.setToMultipleID("toJSbutton", "click", function () {
            if(location.hash != null && location.hash != ""){
                this.parent.settingsPG.ScriptLanguage = "JS";
                window.location = "./";
            }else{
                if (this.parent.settingsPG.ScriptLanguage == "TS") {
                    //revert in case the reload is cancel due to safe mode
                    if(document.getElementById("safemodeToggle" + this.parent.utils.getCurrentSize()).classList.contains('checked')){
                        // Message before unload
                        var LanguageJSswapper =  function () {
                            this.parent.settingsPG.ScriptLanguage = "JS";
                            window.removeEventListener('unload', LanguageJSswapper.bind(this));
                        };
                        window.addEventListener('unload',LanguageJSswapper.bind(this));
                        
                        location.reload();
                    }
                    else {
                        this.parent.settingsPG.ScriptLanguage = "JS";
                        location.reload();
                    }
                }
            }
        }.bind(this));
        // Safe mode
        this.parent.utils.setToMultipleID("safemodeToggle", 'click', function () {
            document.getElementById("safemodeToggle1280").classList.toggle('checked');
            if (document.getElementById("safemodeToggle1280").classList.contains('checked')) {
                this.parent.utils.setToMultipleID("safemodeToggle", "innerHTML", 'Safe mode <i class="fa fa-check-square" aria-hidden="true"></i>');
            } else {
                this.parent.utils.setToMultipleID("safemodeToggle", "innerHTML", 'Safe mode <i class="fa fa-square" aria-hidden="true"></i>');
            }
        }.bind(this));
        // Editor
        this.parent.utils.setToMultipleID("editorButton", "click", this.toggleEditor.bind(this));
        // FullScreen
        this.parent.utils.setToMultipleID("fullscreenButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.parent.menuPG.goFullscreen(engine);
        }.bind(this));
        // Editor fullScreen
        this.parent.utils.setToMultipleID("editorFullscreenButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.parent.menuPG.editorGoFullscreen.call(this.parent.menuPG)
        }.bind(this));
        // Format
        this.parent.utils.setToMultipleID("formatButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.parent.monacoCreator.formatCode.call(this.parent.monacoCreator)
        }.bind(this));
        // Minimap
        this.parent.utils.setToMultipleID("minimapToggle", "click", this.parent.monacoCreator.toggleMinimap.bind(this.parent.monacoCreator));
        // Inspector
        this.parent.utils.setToMultipleID("debugButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.toggleDebug.call(this);
        }.bind(this));
        // Metadata
        this.parent.utils.setToMultipleID("metadataButton", "click", function () {
            this.parent.menuPG.removeAllOptions();
            this.parent.menuPG.displayMetadata.call(this.parent.menuPG)
        }.bind(this));
        // Initialize the metadata form
        this.showNoMetadata();

        // Restore theme
        this.parent.settingsPG.restoreTheme();
        // Restore font size
        this.parent.settingsPG.restoreFont();
        // Restore language
        this.parent.settingsPG.setScriptLanguage();
        // Check if it's mobile mode. If true, switch to full canvas by default
        this.parent.menuPG.resizeBigCanvas();

        // HotKeys
        document.onkeydown = function (e) {
            // Alt+Enter to Run
            if (e.altKey && (e.key === 'Enter' || event.which === 13)) {
                handleRun();
            }
            // Ctrl+Shift+S to Download Zip
            else if (
              (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
              e.shiftKey &&
              (e.key === 'S' || event.which === 83)
            ) {
                handleGetZip();
            }
            // Ctrl+S to Save
            else if (
              (window.navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey) &&
              (e.key === 'S' || event.which === 83)
            ) {
                e.preventDefault();
                if (!this.checkCTRLSMode()) {
                    return;
                }
                handleSave();
            }
        };
    };

    /**
     * Check if we're in the correct language for the selected script
     * @param {*} xhr 
     */
    checkTypescriptSupport(xhr) {
        // If we're loading TS content and it's JS page
        if (xhr.responseText.indexOf("class Playground") !== -1) {
            if (this.parent.settingsPG.ScriptLanguage == "JS") {
                this.parent.settingsPG.ScriptLanguage = "TS";
                location.reload();
                return false;
            }
        } else { // If we're loading JS content and it's TS page
            if (this.parent.settingsPG.ScriptLanguage == "TS") {
                this.parent.settingsPG.ScriptLanguage = "JS";
                location.reload();
                return false;
            }
        }
        return true;
    };

    /**
     * Load a script in the database
     * @param {*} scriptURL 
     * @param {*} title 
     */
    loadScript(scriptURL, title) {
        var xhr = new XMLHttpRequest();

        xhr.open('GET', scriptURL, true);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {

                    if (!this.checkTypescriptSupport(xhr)) return;

                    xhr.onreadystatechange = null;
                    this.parent.monacoCreator.BlockEditorChange = true;
                    this.parent.monacoCreator.JsEditor.setValue(xhr.responseText);
                    this.parent.monacoCreator.JsEditor.setPosition({ lineNumber: 0, column: 0 });
                    this.parent.monacoCreator.BlockEditorChange = false;
                    compileAndRun(this.parent, this.fpsLabel);

                    this.currentSnippetToken = null;
                }
            }
        }.bind(this);

        xhr.send(null);
    };
    /**
     * Load the examples scripts list in the database
     */
    loadScriptsList(restoreVersionResult) {
        var exampleList = document.getElementById("exampleList");

        var xhr = new XMLHttpRequest();
        // Open Typescript or Javascript examples
        if (exampleList.className != 'typescript') {
            xhr.open('GET', 'https://raw.githubusercontent.com/BabylonJS/Documentation/master/examples/list.json', true);
        }
        else {
            xhr.open('GET', 'https://raw.githubusercontent.com/BabylonJS/Documentation/master/examples/list_ts.json', true);
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                if (xhr.status === 200) {
                    this.scripts = JSON.parse(xhr.response)["examples"];

                    function sortScriptsList(a, b) {
                        if (a.title < b.title) return -1;
                        else return 1;
                    }
                    this.scripts.sort(sortScriptsList);

                    if (exampleList) {
                        for (var i = 0; i < this.scripts.length; i++) {
                            this.scripts[i].samples.sort(sortScriptsList);

                            var exampleCategory = document.createElement("div");
                            exampleCategory.classList.add("categoryContainer");

                            var exampleCategoryTitle = document.createElement("p");
                            exampleCategoryTitle.innerText = this.scripts[i].title;
                            exampleCategory.appendChild(exampleCategoryTitle);

                            for (var ii = 0; ii < this.scripts[i].samples.length; ii++) {
                                var example = document.createElement("div");
                                example.classList.add("itemLine");
                                example.id = ii;

                                var exampleImg = document.createElement("img");
                                exampleImg.src = this.scripts[i].samples[ii].icon.replace("icons", "https://doc.babylonjs.com/examples/icons");
                                exampleImg.setAttribute("onClick", "document.getElementById('PGLink_" + this.scripts[i].samples[ii].PGID + "').click();");

                                var exampleContent = document.createElement("div");
                                exampleContent.classList.add("itemContent");
                                exampleContent.setAttribute("onClick", "document.getElementById('PGLink_" + this.scripts[i].samples[ii].PGID + "').click();");

                                var exampleContentLink = document.createElement("div");
                                exampleContentLink.classList.add("itemContentLink");

                                var exampleTitle = document.createElement("h3");
                                exampleTitle.classList.add("exampleCategoryTitle");
                                exampleTitle.innerText = this.scripts[i].samples[ii].title;
                                var exampleDescr = document.createElement("div");
                                exampleDescr.classList.add("itemLineChild");
                                exampleDescr.innerText = this.scripts[i].samples[ii].description;

                                var exampleDocLink = document.createElement("a");
                                exampleDocLink.classList.add("itemLineDocLink");
                                exampleDocLink.innerText = "Documentation";
                                exampleDocLink.href = this.scripts[i].samples[ii].doc;
                                exampleDocLink.target = "_blank";

                                var examplePGLink = document.createElement("a");
                                examplePGLink.id = "PGLink_" + this.scripts[i].samples[ii].PGID;
                                examplePGLink.classList.add("itemLinePGLink");
                                examplePGLink.innerText = "Display";
                                examplePGLink.href = this.scripts[i].samples[ii].PGID;
                                examplePGLink.addEventListener("click", function() {
                                    location.href = this.href;
                                    location.reload();
                                });

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

                    if (!location.hash && restoreVersionResult == false) {
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
                                this.loadScript("scripts/" + query + ".js", query);
                            } else {
                                this.loadScript(this.parent.settingsPG.DefaultScene, "Basic scene");
                            }
                        } else {
                            this.loadScript(this.parent.settingsPG.DefaultScene, "Basic scene");
                        }
                    }

                    // Restore language
                    this.parent.settingsPG.setScriptLanguage();
                }
            }
        }.bind(this);

        xhr.send(null);
    };

    createNewScript() {
        // Check if safe mode is on, and ask if it is
        if (!this.checkSafeMode("Are you sure you want to create a new playground?")) return;
        location.hash = "";
        this.currentSnippetToken = null;
        this.currentSnippetTitle = null;
        this.currentSnippetDescription = null;
        this.currentSnippetTags = null;
        this.showNoMetadata();
        if (this.parent.monacoCreator.monacoMode === "javascript") {
            this.parent.monacoCreator.JsEditor.setValue('// You have to create a function called createScene. This function must return a BABYLON.Scene object\r\n// You can reference the following variables: scene, canvas\r\n// You must at least define a camera\r\n\r\nvar createScene = function() {\r\n\tvar scene = new BABYLON.Scene(engine);\r\n\tvar camera = new BABYLON.ArcRotateCamera("Camera", -Math.PI / 2, Math.PI / 2, 12, BABYLON.Vector3.Zero(), scene);\r\n\tcamera.attachControl(canvas, true);\r\n\r\n\r\n\r\n\treturn scene;\r\n};');
        } else {
            this.parent.monacoCreator.JsEditor.setValue('// You have to create a class called Playground. This class must provide a static function named CreateScene(engine, canvas) which must return a BABYLON.Scene object\r\n// You must at least define a camera inside the CreateScene function\r\n\r\nclass Playground {\r\n\tpublic static CreateScene(engine: BABYLON.Engine, canvas: HTMLCanvasElement): BABYLON.Scene {\r\n\t\tvar scene = new BABYLON.Scene(engine);\r\n\r\n\t\tvar camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -10), scene);\r\n\t\tcamera.setTarget(BABYLON.Vector3.Zero());\r\n\t\tcamera.attachControl(canvas, true);\r\n\r\n\t\treturn scene;\r\n\t}\r\n}');
        }
        this.parent.monacoCreator.JsEditor.setPosition({ lineNumber: 11, column: 0 });
        this.parent.monacoCreator.JsEditor.focus();
        compileAndRun(this.parent, this.fpsLabel);
    };

    clear() {
        // Check if safe mode is on, and ask if it is
        if (!this.checkSafeMode("Are you sure you want to clear the playground?")) return;
        location.hash = "";
        this.currentSnippetToken = null;
        this.parent.monacoCreator.JsEditor.setValue('');
        this.parent.monacoCreator.JsEditor.setPosition({ lineNumber: 0, column: 0 });
        this.parent.monacoCreator.JsEditor.focus();
    };

    compileAndRunFromOutside() {
        compileAndRun(this.parent, this.fpsLabel);
    };

    checkSafeMode(message) {
        if (document.getElementById("safemodeToggle" + this.parent.utils.getCurrentSize()) &&
            document.getElementById("safemodeToggle" + this.parent.utils.getCurrentSize()).classList.contains('checked')) {
            let confirm = window.confirm(message);
            if (!confirm) {
                return false;
            } else {
                for (var i = 0; i < this.parent.utils.multipleSize.length; i++) {
                    document.getElementById("safemodeToggle" + this.parent.utils.multipleSize[i]).classList.toggle('checked');
                }
                return true;
            }
        } else {
            return true;
        }
    };

    checkCTRLSMode() {
        if (document.getElementById("ctrlsToggle" + this.parent.utils.getCurrentSize()) &&
            document.getElementById("ctrlsToggle" + this.parent.utils.getCurrentSize()).classList.contains('checked')) {
            return true;
        }
        return false;
    };    

    /**
     * Metadatas form
     */
    showNoMetadata() {
        if (this.currentSnippetTitle) {
            document.getElementById("saveFormTitle").value = this.currentSnippetTitle;
            document.getElementById("saveFormTitle").readOnly = true;
        }
        else {
            document.getElementById("saveFormTitle").value = '';
            document.getElementById("saveFormTitle").readOnly = false;
        }
        if (this.currentSnippetDescription) {
            document.getElementById("saveFormDescription").value = this.currentSnippetDescription;
            document.getElementById("saveFormDescription").readOnly = true;
        }
        else {
            document.getElementById("saveFormDescription").value = '';
            document.getElementById("saveFormDescription").readOnly = false;
        }
        if (this.currentSnippetTags) {
            document.getElementById("saveFormTags").value = this.currentSnippetTags;
            document.getElementById("saveFormTags").readOnly = true;
        }
        else {
            document.getElementById("saveFormTags").value = '';
            document.getElementById("saveFormTags").readOnly = false;
        }
        document.getElementById("saveFormButtons").style.display = "block";
        document.getElementById("saveFormButtonOk").style.display = "inline-block";
    };
    hideNoMetadata() {
        document.getElementById("saveFormTitle").readOnly = true;
        document.getElementById("saveFormDescription").readOnly = true;
        document.getElementById("saveFormTags").readOnly = true;
        document.getElementById("saveFormButtonOk").style.display = "none";
    };

    /*
    * Metadatas save
    */
    save() {

        // Retrieve title if necessary
        if (document.getElementById("saveLayer")) {
            this.currentSnippetTitle = document.getElementById("saveFormTitle").value;
            this.currentSnippetDescription = document.getElementById("saveFormDescription").value;
            this.currentSnippetTags = document.getElementById("saveFormTags").value;
        }

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function () {
            if (xmlHttp.readyState === 4) {
                if (xmlHttp.status === 200) {
                    var baseUrl = location.href.replace(location.hash, "").replace(location.search, "");
                    var snippet = JSON.parse(xmlHttp.responseText);
                    var newUrl = baseUrl + "#" + snippet.id;
                    this.currentSnippetToken = snippet.id;
                    if (snippet.version && snippet.version !== "0") {
                        newUrl += "#" + snippet.version;
                    }
                    location.href = newUrl;
                    // Hide the complete title & co message
                    this.hideNoMetadata();
                    compileAndRun(this.parent, this.fpsLabel);
                } else {
                    this.parent.utils.showError("Unable to save your code. It may be too long.", null);
                }
            }
        }.bind(this);

        xmlHttp.open("POST", this.snippetV3Url + (this.currentSnippetToken ? "/" + this.currentSnippetToken : ""), true);
        xmlHttp.setRequestHeader("Content-Type", "application/json");

        var dataToSend = {
            payload: JSON.stringify({
                code: this.parent.monacoCreator.JsEditor.getValue()
            }),
            name: this.currentSnippetTitle,
            description: this.currentSnippetDescription,
            tags: this.currentSnippetTags
        };

        xmlHttp.send(JSON.stringify(dataToSend));
    };
    askForSave() {
        if (this.currentSnippetTitle == null
            || this.currentSnippetDescription == null
            || this.currentSnippetTags == null) {

            document.getElementById("saveLayer").style.display = "block";
        }
        else {
            this.save();
        }
    };



    /**
         * Toggle the code editor
         */
    toggleEditor() {
        var editorButton = document.getElementById("editorButton1280");
        var scene = engine.scenes[0];

        // If the editor is present
        if (editorButton.classList.contains('checked')) {
            this.parent.utils.setToMultipleID("editorButton", "removeClass", 'checked');
            this.parent.splitInstance.collapse(0);
            this.parent.utils.setToMultipleID("editorButton", "innerHTML", 'Editor <i class="fa fa-square" aria-hidden="true"></i>');
        } else {
            this.parent.utils.setToMultipleID("editorButton", "addClass", 'checked');
            this.parent.splitInstance.setSizes([50, 50]);  // Reset
            this.parent.utils.setToMultipleID("editorButton", "innerHTML", 'Editor <i class="fa fa-check-square" aria-hidden="true"></i>');
        }
        engine.resize();

        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.show({ embedMode: true });
        }
    };

    /**
     * Toggle the BJS debug layer
     */
    toggleDebug() {
        // Always showing the debug layer, because you can close it by itself
        var scene = engine.scenes[0];
        if (scene.debugLayer.isVisible()) {
            scene.debugLayer.hide();
        }
        else {
            scene.debugLayer.show({ embedMode: true });
        }
    };

    /**
     * HASH part
     */
    cleanHash() {
        var splits = decodeURIComponent(location.hash.substr(1)).split("#");

        if (splits.length > 2) {
            splits.splice(2, splits.length - 2);
        }

        location.hash = splits.join("#");
    };
    checkHash() {
        if (location.hash) {
            if (this.previousHash !== location.hash) {
                this.cleanHash();

                this.previousHash = location.hash;

                try {
                    var xmlHttp = new XMLHttpRequest();
                    xmlHttp.onreadystatechange = function () {
                        if (xmlHttp.readyState === 4) {
                            if (xmlHttp.status === 200) {

                                if (!this.checkTypescriptSupport(xmlHttp)) {
                                    return;
                                }

                                var snippet = JSON.parse(xmlHttp.responseText);

                                this.parent.monacoCreator.BlockEditorChange = true;
                                this.parent.monacoCreator.JsEditor.setValue(JSON.parse(snippet.jsonPayload).code.toString());

                                // Check if title / descr / tags are already set
                                if (snippet.name != null && snippet.name != "") {
                                    this.currentSnippetTitle = snippet.name;
                                }
                                else this.currentSnippetTitle = null;

                                if (snippet.description != null && snippet.description != "") {
                                    this.currentSnippetDescription = snippet.description;
                                }
                                else this.currentSnippetDescription = null;

                                if (snippet.tags != null && snippet.tags != "") {
                                    this.currentSnippetTags = snippet.tags;
                                }
                                else this.currentSnippetTags = null;

                                if (this.currentSnippetTitle != null && this.currentSnippetTags != null && this.currentSnippetDescription) {
                                    if (document.getElementById("saveLayer")) {

                                        document.getElementById("saveFormTitle").value = this.currentSnippetTitle;
                                        document.getElementById("saveFormDescription").value = this.currentSnippetDescription;
                                        document.getElementById("saveFormTags").value = this.currentSnippetTags;

                                        this.hideNoMetadata();
                                    }
                                }
                                else {
                                    this.showNoMetadata();
                                }

                                this.parent.monacoCreator.JsEditor.setPosition({ lineNumber: 0, column: 0 });
                                this.parent.monacoCreator.BlockEditorChange = false;
                                compileAndRun(this.parent, this.fpsLabel);
                            }
                        }
                    }.bind(this);

                    var hash = location.hash.substr(1);
                    this.currentSnippetToken = hash.split("#")[0];
                    if (!hash.split("#")[1]) hash += "#0";


                    xmlHttp.open("GET", this.snippetV3Url + "/" + hash.replace("#", "/"));
                    xmlHttp.send();
                } catch (e) {

                }
            }
        }
        setTimeout(this.checkHash.bind(this), 200);
    };
}
