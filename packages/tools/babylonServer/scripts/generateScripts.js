const fs = require("fs");
const path = require("path");

if (!fs.existsSync(path.resolve("./src/createEngine.js"))) {
    fs.writeFileSync(
        path.resolve("./src/createEngine.js"),
        `
/* global BABYLON */
///<reference path="../declarations/core.d.ts"/>
///<reference path="../declarations/gui.d.ts"/>
///<reference path="../declarations/loaders.d.ts"/>
///<reference path="../declarations/serializers.d.ts"/>
///<reference path="../declarations/inspector.d.ts"/>
///<reference path="../declarations/materials.d.ts"/>
export const createEngine = () => {
    const canvas = document.getElementById("babylon-canvas"); // Get the canvas element
    const engine = new BABYLON.Engine(canvas, true, { preserveDrawingBuffer: true, stencil: true} );
    return engine;
}
`
    );
}

if (!fs.existsSync(path.resolve("./src/createScene.js"))) {
    fs.writeFileSync(
        path.resolve("./src/createScene.js"),
        `
/* global BABYLON */
export const createScene = function (engine, canvas) {
    // Model by Mixamo

    engine.enableOfflineSupport = false;

    // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
    BABYLON.Animation.AllowMatricesInterpolation = true;

    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new BABYLON.Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 10;
    camera.wheelDeltaPercentage = 0.01;

    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    light.specular = BABYLON.Color3.Black();

    const light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    light2.position = new BABYLON.Vector3(0, 5, 5);

    // Shadows
    const shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    engine.displayLoadingUI();

    BABYLON.SceneLoader.ImportMesh("", "https://playground.babylonjs.com/scenes/", "dummy3.babylon", scene, function (newMeshes, particleSystems, skeletons) {
        const skeleton = skeletons[0];

        shadowGenerator.addShadowCaster(scene.meshes[0], true);
        for (let index = 0; index < newMeshes.length; index++) {
            newMeshes[index].receiveShadows = false;
        }

        const helper = scene.createDefaultEnvironment({
            enableGroundShadow: true,
        });
        helper.setMainColor(BABYLON.Color3.Gray());
        helper.ground.position.y += 0.01;

        // ROBOT
        skeleton.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
        skeleton.animationPropertiesOverride.enableBlending = true;
        skeleton.animationPropertiesOverride.blendingSpeed = 0.05;
        skeleton.animationPropertiesOverride.loopMode = 1;

        const idleRange = skeleton.getAnimationRange("YBot_Idle");
        const walkRange = skeleton.getAnimationRange("YBot_Walk");
        const runRange = skeleton.getAnimationRange("YBot_Run");
        const leftRange = skeleton.getAnimationRange("YBot_LeftStrafeWalk");
        const rightRange = skeleton.getAnimationRange("YBot_RightStrafeWalk");

        // IDLE
        if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);

        // UI
        const advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        const uiPanel = new BABYLON.GUI.StackPanel();
        uiPanel.width = "220px";
        uiPanel.fontSize = "14px";
        uiPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        uiPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(uiPanel);
        // ..
        const button = BABYLON.GUI.Button.CreateSimpleButton("but1", "Play Idle");
        button.paddingTop = "10px";
        button.width = "100px";
        button.height = "50px";
        button.color = "white";
        button.background = "green";
        button.onPointerDownObservable.add(() => {
            if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);
        });
        uiPanel.addControl(button);
        // ..
        let button1 = BABYLON.GUI.Button.CreateSimpleButton("but2", "Play Walk");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (walkRange) scene.beginAnimation(skeleton, walkRange.from, walkRange.to, true);
        });
        uiPanel.addControl(button1);
        // ..
        button1 = BABYLON.GUI.Button.CreateSimpleButton("but3", "Play Run");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (runRange) scene.beginAnimation(skeleton, runRange.from, runRange.to, true);
        });
        uiPanel.addControl(button1);
        // ..
        button1 = BABYLON.GUI.Button.CreateSimpleButton("but4", "Play Left");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (leftRange) scene.beginAnimation(skeleton, leftRange.from, leftRange.to, true);
        });
        uiPanel.addControl(button1);
        // ..
        button1 = BABYLON.GUI.Button.CreateSimpleButton("but5", "Play Right");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (rightRange) scene.beginAnimation(skeleton, rightRange.from, rightRange.to, true);
        });
        uiPanel.addControl(button1);
        // ..
        button1 = BABYLON.GUI.Button.CreateSimpleButton("but6", "Play Blend");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (walkRange && leftRange) {
                scene.stopAnimation(skeleton);
                const walkAnim = scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 0.5, true);
                const leftAnim = scene.beginWeightedAnimation(skeleton, leftRange.from, leftRange.to, 0.5, true);

                // Note: Sync Speed Ratio With Master Walk Animation
                walkAnim.syncWith(null);
                leftAnim.syncWith(walkAnim);
            }
        });
        uiPanel.addControl(button1);

        engine.hideLoadingUI();
    });

    return scene;
};`
    );
}
