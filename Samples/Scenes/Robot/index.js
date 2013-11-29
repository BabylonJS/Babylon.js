var onload = function () {

    var scene = null;
    var messages = null;


    var demos = [
            { title: "Slide1", image: "Assets/Slides/Slide1.JPG", link: "" },
            { title: "Slide2", image: "Assets/Slides/Slide2.JPG", link: "" },
            { title: "Slide3", image: "Assets/Slides/Slide3.JPG", link: "" },
            { title: "Slide4", image: "Assets/Slides/Slide4.JPG", link: "" },
            { title: "Slide5", image: "Assets/Slides/Slide5.JPG", link: "" },
            { title: "Slide6", image: "Assets/Slides/Slide6.JPG", link: "http://david.blob.core.windows.net/html5/SoftEngineProgression/wireframe/index.html" },
            { title: "Slide7", image: "Assets/Slides/Slide7.JPG", link: "" },
            { title: "Slide8", image: "Assets/Slides/Slide8.JPG", link: "" },
            { title: "Slide9", image: "Assets/Slides/Slide9.JPG", link: "" },
            { title: "Slide10", image: "Assets/Slides/Slide10.JPG", link: "" },
            { title: "Slide11", image: "Assets/Slides/Slide11.JPG", link: "" },
            { title: "Slide12", image: "Assets/Slides/Slide12.JPG", link: "" },
            { title: "Slide13", image: "Assets/Slides/Slide13.JPG", link: "" },
            { title: "Slide14", image: "Assets/Slides/Slide14.JPG", link: "" },
            { title: "Slide15", image: "Assets/Slides/Slide15.JPG", link: "" },
            { title: "Slide16", image: "Assets/Slides/Slide16.JPG", link: "http://david.blob.core.windows.net/babylonjsoffline/index.html" },
            { title: "Slide17", image: "Assets/Slides/Slide17.JPG", link: "" },
            { title: "Slide18", image: "Assets/Slides/Slide18.JPG", link: "" },
            { title: "Slide19", image: "Assets/Slides/Slide19.JPG", link: ""  },
            { title: "Slide20", image: "Assets/Slides/Slide20.JPG", link: "" },
            { title: "Slide21", image: "Assets/Slides/Slide21.JPG", link: "" },
            { title: "Slide22", image: "Assets/Slides/Slide22.JPG", link: "" },
            { title: "Slide23", image: "Assets/Slides/Slide23.JPG", link: "" },
            { title: "Slide24", image: "Assets/Slides/Slide24.JPG", link: "" }];

    

    var slideid = 1;

    var canvas = document.getElementById("renderCanvas");
    var divFps = document.getElementById("fps");

    var loadingBack = document.getElementById("loadingBack");
    var loadingText = document.getElementById("loadingText");


    var next = document.getElementById("next");
    var preview = document.getElementById("preview");
    var slider = document.getElementById("slider");
    slider.valueAsNumber = slideid;

    $(slider).change(function () {
        slideid = slider.valueAsNumber;
        slide.material.diffuseTexture = new BABYLON.Texture(demos[slideid].image, scene);
    });

    preview.addEventListener("pointerdown", function () {
        if (slideid >= 0) {
            slideid--;
            slider.valueAsNumber = slideid;
            slide.material.diffuseTexture = new BABYLON.Texture(demos[slideid].image, scene);
        }
    });


    next.addEventListener("pointerdown", function () {
        if (slideid < demos.length) {
            slideid++;
            slider.valueAsNumber = slideid;
            if (slideid == demos.length) {
                for (var index = 0; index < scene.meshes.length; index++) {
                    scene.beginAnimation(scene.meshes[index], 354, 800, false, 1.0);
                }
            }
            else {
                scene.beginAnimation(scene.meshes[0], 266, 300, false, 1.0, function () {

                    slide.material.diffuseTexture = new BABYLON.Texture(demos[slideid].image, scene);

                    scene.beginAnimation(scene.meshes[0], 301, 354, false, 1.0, function() {

                    });

                });
                for (var index = 1; index < scene.meshes.length; index++) {
                    scene.beginAnimation(scene.meshes[index], 266, 354, false, 1.0);
                }
            }
        }
    });

    var mode = "CAMERA";
    
    if (!BABYLON.Engine.isSupported()) {
        document.getElementById("notSupported").className = "";
        return;
    }

    // Babylon
    var engine = new BABYLON.Engine(canvas, true);
    scene = new BABYLON.Scene(engine);
    var camera = new BABYLON.FreeCamera("Camera", new BABYLON.Vector3(-190, 120, -243), scene);
    camera.setTarget(new BABYLON.Vector3(-189, 120, -243));
    camera.rotation = new BABYLON.Vector3(0.30, 1.31, 0);

    camera.attachControl(canvas);

    // Loading
    var importScene = function () {
        loadingBack.removeEventListener("transitionend", importScene);
        loadingBack.removeEventListener("webkitTransitionEnd", importScene);

        BABYLON.SceneLoader.ImportMesh("", "/Scenes/Robot/Assets/", "Robot.babylon", scene, function () {
           
        for (var index = 0; index < scene.meshes.length; index++) {
            if (scene.meshes[index].name == "Slide") {
                slide = scene.meshes[index];
                slide.material.diffuseTexture = new BABYLON.Texture(demos[slideid].image, scene);
            }
            scene.stopAnimation(scene.meshes[index]);
            scene.beginAnimation(scene.meshes[index], 0, 265, false, 1.0);

        }
            

        // UI
        loadingBack.className = "loadingBack";
        loadingText.className = "loadingText";
        }, function (evt) {
            loadingText.innerHTML = "Loading, please wait..." + (evt.loaded * 100 / evt.total).toFixed() + "%";
        });
    };

    loadingBack.addEventListener("transitionend", importScene);
    loadingBack.addEventListener("webkitTransitionEnd", importScene);

    loadingBack.className = "";
    loadingText.className = "";
    loadingText.innerHTML = "Loading, please wait...";


    // Render loop
    var renderFunction = function () {
        // Fps
        divFps.innerHTML = BABYLON.Tools.GetFps().toFixed() + " fps";
        // Render scene
        scene.render();
    };

    // Launch render loop
    engine.runRenderLoop(renderFunction);

    // Resize
    window.addEventListener("resize", function () {
        engine.resize();
    });

    window.oncontextmenu = function () {
        return false;
    };

};