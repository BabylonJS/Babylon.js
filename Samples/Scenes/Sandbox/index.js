/// <reference path="../../babylon.js" />

document.addEventListener("DOMContentLoaded", startGame, false);

function startGame() {
    if (BABYLON.Engine.isSupported()) {
        var canvas = document.getElementById("renderCanvas");
        var engine = new BABYLON.Engine(canvas, true);
        var divFps = document.getElementById("fps");
        var htmlInput = document.getElementById("files");
        var btnFullScreen = document.getElementById("btnFullscreen");
        var btnDownArrow = document.getElementById("btnDownArrow");
        var perffooter = document.getElementById("perf");
        var btnPerf = document.getElementById("btnPerf");
        var miscCounters = document.getElementById("miscCounters");
        var help01 = document.getElementById("help01");
        var help02 = document.getElementById("help02");
        var loadingText = document.getElementById("loadingText");
        var filesInput;
        var currentHelpCounter;
        var currentScene;
        var perffooterEnable = false;

        currentHelpCounter = localStorage.getItem("helpcounter");

        if (!currentHelpCounter) currentHelpCounter = 0;

        // Resize
        window.addEventListener("resize", function () {
            engine.resize();
        });

        var sceneLoaded = function (sceneFile, babylonScene) {
            currentScene = babylonScene;
            document.title = "BabylonJS - " + sceneFile.name;
            // Fix for IE, otherwise it will change the default filter for files selection after first use
            htmlInput.value = "";
            document.getElementById("logo").className = "hidden";
            loadingText.className = "loadingText";
        };

        var progressCallback = function (evt) {
                if (evt.lengthComputable) {
                    loadingText.innerHTML = "Loading, please wait..." + (evt.loaded * 100 / evt.total).toFixed() + "%";
                } else {
                    dlCount = evt.loaded / (1024 * 1024);
                    loadingText.innerHTML = "Loading, please wait..." + Math.floor(dlCount * 100.0) / 100.0 + " MB already loaded.";
                }
        };

        var textureLoadingCallback = function (remainingTextures) {
            loadingText.innerHTML = "Streaming items..." + (remainingTextures ? (remainingTextures + " remaining") : "");
        };

        var startingProcessingFilesCallback = function () {
            loadingText.className = "";
            loadingText.innerHTML = "Loading, please wait...";
        };

        var additionnalRenderLoopLogic = function () {
            divFps.innerHTML = BABYLON.Tools.GetFps().toFixed() + " fps";
            if (currentScene) {
                miscCounters.innerHTML = "Total vertices: " + currentScene.getTotalVertices() + " <br />"
                    + "Active vertices: " + currentScene.getActiveVertices() + " <br />"
                    + "Active particles: " + currentScene.getActiveParticles() + " <br />"
                    + "Frame duration: " + currentScene.getLastFrameDuration() + " ms" + " <br />"
                    + "Evaluate Active Meshes duration: " + currentScene.getEvaluateActiveMeshesDuration() + " ms" + " <br />"
                    + "Render Targets duration: " + currentScene.getRenderTargetsDuration() + " ms" + " <br />"
                    + "Particles duration: " + currentScene.getParticlesDuration() + " ms" + " <br />"
                    + "Sprites duration: " + currentScene.getSpritesDuration() + " ms" + " <br />"
                    + "Render duration: " + currentScene.getRenderDuration() + " ms";
            }
        };

        filesInput = new BABYLON.FilesInput(engine, null, canvas, sceneLoaded, progressCallback, additionnalRenderLoopLogic, textureLoadingCallback, startingProcessingFilesCallback);
        filesInput.monitorElementForDragNDrop(canvas);

        htmlInput.addEventListener('change', filesInput.loadFiles, false);
        btnFullScreen.addEventListener('click', function () {
            engine.switchFullscreen(true);
        }, false);
        btnPerf.addEventListener('click', function () {
            perffooter.className = "perffooter shown";
        }, false);
        btnDownArrow.addEventListener('click', function () {
            perffooter.className = "perffooter";
        }, false);

        // The help tips will be displayed only 5 times
        if (currentHelpCounter < 5) {
            help01.className = "help shown";

            setTimeout(function () {
                help01.className = "help";
                help02.className = "help2 shown";
                setTimeout(function () {
                    help02.className = "help2";
                    localStorage.setItem("helpcounter", currentHelpCounter + 1);
                }, 5000);
            }, 5000);
        }
    }
}