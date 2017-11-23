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
        combineRatio: 1.0 // Ratio of the combine post-process (combines the SSAO and the scene)
    };

    var ssao = new BABYLON.SSAORenderingPipeline("ssao", scene, ssaoRatio);
    ssao.fallOff = 0.000001;
    ssao.area = 1;
    ssao.radius = 0.0001;
    ssao.totalStrength = 1.0;
    ssao.base = 0.5;

    // Attach camera to the SSAO render pipeline
    scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);

    // Manage SSAO
    var isAttached = true;
    window.addEventListener("keydown", function (evt) {
        // draw SSAO with scene when pressed "1"
        if (evt.keyCode === 49) {
            if (!isAttached) {
                isAttached = true;
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
            }
            scene.postProcessRenderPipelineManager.enableEffectInPipeline("ssao", ssao.SSAOCombineRenderEffect, camera);
        }
            // draw without SSAO when pressed "2"
        else if (evt.keyCode === 50) {
            isAttached = false;
            scene.postProcessRenderPipelineManager.detachCamerasFromRenderPipeline("ssao", camera);
        }
            // draw only SSAO when pressed "2"
        else if (evt.keyCode === 51) {
            if (!isAttached) {
                isAttached = true;
                scene.postProcessRenderPipelineManager.attachCamerasToRenderPipeline("ssao", camera);
            }
            scene.postProcessRenderPipelineManager.disableEffectInPipeline("ssao", ssao.SSAOCombineRenderEffect, camera);
        }
    });

	return scene;
}
