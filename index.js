var onload = function () {
    var canvas = document.getElementById("renderCanvas");

    // Demos
    var demos = [
        { title: "HEART", scene: "heart", screenshot: "heart.jpg", size: "14 MB" },
        { title: "ESPILIT", scene: "Espilit", screenshot: "espilit.jpg", size: "50 MB" },
        { title: "WINDOWS CAFE", scene: "WCafe", screenshot: "wcafe.jpg", size: "28 MB" },
        { title: "FLAT 2009", scene: "Flat2009", screenshot: "flat2009.jpg", size: "44 MB" },
        { title: "THE CAR", scene: "theCar", screenshot: "thecar.jpg", size: "100 MB" },
        { title: "VIPER", scene: "Viper", screenshot: "viper.jpg", size: "18 MB" },
        { title: "SPACESHIP", scene: "spaceship", screenshot: "spaceship.jpg", size: "1 MB" },
        { title: "OMEGA CRUSHER", scene: "SpaceDek", screenshot: "omegacrusher.jpg", size: "10 MB" },
        { title: "TEST SCENE #1", id: 0, screenshot: "testscene.jpg", size: "10 MB" },
        { title: "TEST LIGHTS", id: 1, screenshot: "testlight.jpg", size: "0.1 MB" },
        { title: "TEST BLENDER", scene: "blender", screenshot: "blender.jpg", size: "0.2 MB" }
    ];

    // UI
    var opacityMask = document.getElementById("opacityMask");
    var menuPanel = document.getElementById("screen1");
    var items = document.getElementById("items");
    var renderZone = document.getElementById("renderZone");
    var controlPanel = document.getElementById("controlPanel");
    var wireframe = document.getElementById("wireframe");
    var divFps = document.getElementById("fps");
    var stats = document.getElementById("stats");
    var enableStats = document.getElementById("enableStats");
    var loadingBack = document.getElementById("loadingBack");
    var loadingText = document.getElementById("loadingText");
    var hardwareScalingLevel = document.getElementById("hardwareScalingLevel");
    var collisions = document.getElementById("collisions");
    var status = document.getElementById("status");
    var fullscreen = document.getElementById("fullscreen");

    var itemClick = function (demo) {
        return function () {
            loadScene(demo.id !== undefined ? demo.id : demo.scene, function() {
                if (demo.collisions !== undefined) {
                    scene.collisionsEnabled = demo.collisions;
                }
            });
        };
    };

    for (var index = 0; index < demos.length; index++) {
        var demo = demos[index];
        var span = document.createElement("span");
        var img = document.createElement("img");
        var div = document.createElement("div");
        var label2 = document.createElement("label");

        if (index == 0) {
            span.className = "big-item";
            var newImg = document.createElement("img");
            var newText = document.createElement("div");
            newImg.id = "newImg";
            newImg.src = "Assets/SpotLast.png";
            newText.innerHTML = "LAST<br>UPDATE";
            newText.id = "newText";
            span.appendChild(newImg);
            span.appendChild(newText);            
        } else {
            span.className = "item";
        }

        img.className = "item-image";
        img.src = "Screenshots/" + demo.screenshot;
        span.appendChild(img);

        div.className = "item-text";
        div.innerHTML = demo.title;
        span.appendChild(div);
        
        label2.className = "item-text-right";
        label2.innerHTML = demo.size;
        span.appendChild(label2);

        span.onclick = itemClick(demo);

        items.appendChild(span);
    }

    // Go Back
    var goBack = function () {
        if (scene) {
            scene.dispose();
            scene = null;
        }
        menuPanel.className = "";
        renderZone.className = "movedRight";
    };

    // History
    if (window.onpopstate !== undefined) {
        window.onpopstate = function () {
            goBack();
        };
    }

    // Check support
    if (!BABYLON.Engine.isSupported()) {
        document.getElementById("notSupported").className = "";
        opacityMask.className = "";
    } else {
        // Babylon
        var engine = new BABYLON.Engine(canvas, true);
        var scene;

        var restoreUI = function () {
            loadingBack.className = "loadingBack";
            loadingText.className = "loadingText";
            menuPanel.className = "movedLeft";
            renderZone.className = "";
            opacityMask.className = "hidden";
        };

        var loadScene = function (name, then) {
            // Cleaning
            if (scene) {
                scene.dispose();
                scene = null;
            }

            // History
            if (history.pushState) {
                history.pushState({}, name, "index.html");
            }

            // Loading
            var importScene = function () {
                loadingBack.removeEventListener("transitionend", importScene);
                loadingBack.removeEventListener("webkitTransitionend", importScene);

                engine.resize();

                if (name === 0) {
                    var newScene = CreateTestScene(engine);
                    newScene.activeCamera.attachControl(canvas);

                    scene = newScene;

                    if (then) {
                        then();
                    }

                    // UI
                    restoreUI();


                    return;
                }
                if (name === 1) {
                    var newScene = CreateLightsTestScene(engine);
                    newScene.activeCamera.attachControl(canvas);

                    scene = newScene;

                    if (then) {
                        then();
                    }

                    // UI
                    restoreUI();

                    return;
                }

                BABYLON.SceneLoader.Load("Scenes/" + name + "/", name + ".babylon", engine, function (newScene) {
                    scene = newScene;
                    loadingText.innerHTML = "Streaming textures...";
                    scene.executeWhenReady(function () {
                        if (scene.activeCamera) {
                            scene.activeCamera.attachControl(canvas);

                            if (newScene.activeCamera.keysUp) {
                                newScene.activeCamera.keysUp.push(90); // Z
                                newScene.activeCamera.keysDown.push(83); // S
                                newScene.activeCamera.keysLeft.push(65); // A
                                newScene.activeCamera.keysRight.push(69); // E
                            }
                        }

                        if (then) {
                            then();
                        }

                        // UI
                        restoreUI();

                    });

                }, function (evt) {
                    loadingText.innerHTML = "Loading, please wait..." + (evt.loaded * 100 / evt.total).toFixed() + "%";
                });
            };

            loadingBack.addEventListener("transitionend", importScene);
            loadingBack.addEventListener("webkitTransitionend", importScene);

            loadingBack.className = "";
            loadingText.className = "";
            opacityMask.className = "";
            loadingText.innerHTML = "Loading, please wait...";
        };

        // Render loop
        var renderLoop = function () {
            // Start new frame
            engine.beginFrame();

            // Fps
            divFps.innerHTML = BABYLON.Tools.GetFps().toFixed() + " fps";

            // Render scene
            if (scene) {
                scene.render();

                // Stats
                if (enableStats.checked) {
                    stats.innerHTML = "Total vertices: " + scene.getTotalVertices() + "<br>"
                        + "Active vertices: " + scene.getActiveVertices() + "<br>"
                        + "Active particles: " + scene.getActiveParticles() + "<br><br><br>"
                        + "Frame duration: " + scene.getLastFrameDuration() + " ms<br><br>"
                        + "<i>Evaluate Active Meshes duration:</i> " + scene.getEvaluateActiveMeshesDuration() + " ms<br>"
                        + "<i>Render Targets duration:</i> " + scene.getRenderTargetsDuration() + " ms<br>"
                        + "<i>Particles duration:</i> " + scene.getParticlesDuration() + " ms<br>"
                        + "<i>Sprites duration:</i> " + scene.getSpritesDuration() + " ms<br>"
                        + "<i>Render duration:</i> " + scene.getRenderDuration() + " ms";
                }
            }

            // Present
            engine.endFrame();

            // Register new frame
            BABYLON.Tools.QueueNewFrame(renderLoop);
        };

        BABYLON.Tools.QueueNewFrame(renderLoop);

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });


        // Caps
        var caps = engine.getCaps();
        document.getElementById("extensions").innerHTML =
                "Max textures image units: <b>" + caps.maxTexturesImageUnits + "</b><br>" +
                "Max texture size: <b>" + caps.maxTextureSize + "</b><br>" +
                "Max cubemap texture size: <b>" + caps.maxCubemapTextureSize + "</b><br>" +
                "Max render texture size: <b>" + caps.maxRenderTextureSize + "</b><br>";
    }

    // UI

    var panelIsClosed = true;
    var aboutIsClosed = true;
    document.getElementById("clickableTag").addEventListener("click", function () {
        if (panelIsClosed) {
            panelIsClosed = false;
            controlPanel.style.webkitTransform = "translateY(0px)";
            controlPanel.style.transform = "translateY(0px)";
        } else {
            panelIsClosed = true;
            controlPanel.style.webkitTransform = "translateY(250px)";
            controlPanel.style.transform = "translateY(250px)";
        }
    });
    
    document.getElementById("aboutLink").addEventListener("click", function () {
        if (aboutIsClosed) {
            aboutIsClosed = false;
            aboutPanel.style.webkitTransform = "translateX(0px)";
            aboutPanel.style.transform = "translateX(0px)";
        } else {
            aboutIsClosed = true;
            aboutPanel.style.webkitTransform = "translateX(-500px)";
            aboutPanel.style.transform = "translateX(-500px)";
        }
    });

    document.getElementById("aboutPanel").addEventListener("click", function (evt) {
        evt.cancelBubble = true;
    });

    document.getElementById("menuPanel").addEventListener("click", function (evt) {
        if (!aboutIsClosed) {
            aboutIsClosed = true;
            aboutPanel.style.webkitTransform = "translateX(-500px)";
            aboutPanel.style.transform = "translateX(-500px)";
        }
    });

    canvas.addEventListener("click", function (evt) {
        if (!panelIsClosed) {
            panelIsClosed = true;
            controlPanel.style.webkitTransform = "translateY(250px)";
            controlPanel.style.transform = "translateY(250px)";
        }
        
        if (evt.ctrlKey) {
            if (!scene)
                return;

            var pickResult = scene.pick(evt.clientX, evt.clientY);

            if (pickResult.hit) {
                status.innerHTML = "Selected object: " + pickResult.pickedMesh.name;

                // Animations
                scene.beginAnimation(pickResult.pickedMesh, 0, 100, true, 1.0);
                var material = pickResult.pickedMesh.material;
                if (material) {
                    scene.beginAnimation(material, 0, 100, true, 1.0);
                }

                // Emit particles
                var particleSystem = new BABYLON.ParticleSystem("particles", 400, scene);
                particleSystem.particleTexture = new BABYLON.Texture("Assets/Flare.png", scene);
                particleSystem.minAngularSpeed = -0.5;
                particleSystem.maxAngularSpeed = 0.5;
                particleSystem.minSize = 0.1;
                particleSystem.maxSize = 0.5;
                particleSystem.minLifeTime = 0.5;
                particleSystem.maxLifeTime = 2.0;
                particleSystem.minEmitPower = 0.5;
                particleSystem.maxEmitPower = 1.0;
                particleSystem.emitter = pickResult.pickedPoint;
                particleSystem.emitRate = 400;
                particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
                particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
                particleSystem.direction1 = new BABYLON.Vector3(-1, -1, -1);
                particleSystem.direction2 = new BABYLON.Vector3(1, 1, 1);
                particleSystem.color1 = new BABYLON.Color4(1, 0, 0, 1);
                particleSystem.color2 = new BABYLON.Color4(0, 1, 1, 1);
                particleSystem.gravity = new BABYLON.Vector3(0, -5, 0);
                particleSystem.disposeOnStop = true;
                particleSystem.targetStopDuration = 0.1;
                particleSystem.start();

            } else {
                status.innerHTML = "";
            }
        }
    });

    wireframe.addEventListener("change", function () {
        if (engine) {
            engine.forceWireframe = wireframe.checked;
        }
    });

    enableStats.addEventListener("change", function () {
        stats.className = enableStats.checked ? "" : "hidden";
    });

    fullscreen.addEventListener("click", function () {
        if (engine) {
            engine.switchFullscreen(document.getElementById("rootDiv"));
        }
    });

    hardwareScalingLevel.addEventListener("change", function () {
        if (!engine)
            return;
        engine.setHardwareScalingLevel(hardwareScalingLevel.selectedIndex + 1);
    });

    collisions.addEventListener("change", function () {
        if (scene) {
            scene.collisionsEnabled = collisions.checked;
        }
    });
};