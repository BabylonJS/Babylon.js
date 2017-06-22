var createScene = function () {
    // Create scene
    var scene = new BABYLON.Scene(engine);
    scene.clearColor = BABYLON.Color3.Black();

    // Create camera
    var camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(29, 13, 23), scene);
    camera.setTarget(new BABYLON.Vector3(0, 0, 0));
    camera.attachControl(canvas);

    // Create some boxes and deactivate lighting (specular color and back faces)
    var boxMaterial = new BABYLON.StandardMaterial("boxMaterail", scene);
    boxMaterial.diffuseTexture = new BABYLON.Texture("textures/ground.jpg", scene);
    boxMaterial.specularColor = BABYLON.Color3.Black();
    boxMaterial.emissiveColor = BABYLON.Color3.White();

    for (var i = 0; i < 10; i++) {
        for (var j = 0; j < 10; j++) {
            var box = BABYLON.Mesh.CreateBox("box" + i + " - " + j, 5, scene);
            box.position = new BABYLON.Vector3(i * 5, 2.5, j * 5);
            box.rotation = new BABYLON.Vector3(i, i * j, j);
            box.material = boxMaterial;
        }
    }

    // Create SSAO and configure all properties (for the example)
    var ssaoRatio = {
        ssaoRatio: 0.5, // Ratio of the SSAO post-process, in a lower resolution
        blurRatio: 0.5// Ratio of the combine post-process (combines the SSAO and the scene)
    };

    if (BABYLON.SSAO2RenderingPipeline.IsSupported) {
        var ssao = new BABYLON.SSAO2RenderingPipeline("ssao", scene, ssaoRatio);
        ssao.radius = 3.5;
        ssao.totalStrength = 1.3;
        ssao.expensiveBlur = true;
        ssao.samples = 16;
        ssao.maxZ = 250;
        // Attach camera to the SSAO render pipeline
        scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);

        // Manage SSAO
        window.addEventListener("keydown", function (evt) {
            // draw SSAO with scene when pressed "1"
            if (evt.keyCode === 49) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
                scene.postProcessRenderPipelineManager.enableEffectInPipeline("ssao", ssao.SSAOCombineRenderEffect, camera);
            }
                // draw without SSAO when pressed "2"
            else if (evt.keyCode === 50) {
                scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera);
            }
                // draw only SSAO when pressed "2"
            else if (evt.keyCode === 51) {
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
                scene.postProcessRenderPipelineManager.disableEffectInPipeline("ssao", ssao.SSAOCombineRenderEffect, camera);
            }
        });
    } else {
        alert("WebGL2 is required to use SSAO2 effect");
    }

    return scene;
}