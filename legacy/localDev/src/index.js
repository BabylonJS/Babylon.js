/// <reference path="../../dist/preview release/babylon.d.ts" />
/// <reference path="../../dist/preview release/loaders/babylonjs.loaders.d.ts" />

var createScene = async function () {
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // scene.useRightHandedSystem = true;

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", 0, 0, -10, BABYLON.Vector3.Zero(), scene);

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    camera.wheelPrecision *= 8;

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    const handsMeshes = [];

    // const leftHand = await BABYLON.SceneLoader.ImportMeshAsync('', 'data', leftHandData, scene, undefined, '.glb');
    // const leftHand = await BABYLON.SceneLoader.ImportMeshAsync('', 'https://patrickryanms.github.io/', 'BabylonJStextures/Demos/xrHandMesh/l_hand.glb', scene, undefined, '.glb');
    // const leftHand = await BABYLON.SceneLoader.ImportMeshAsync('', 'https://192.168.0.142:8080/', 'assets/testCubeHand_l.glb', scene, undefined, '.glb');
    const leftHand = await BABYLON.SceneLoader.ImportMeshAsync("", "https://192.168.0.233:8080/", "testCubeHand_l.glb", scene, undefined, ".glb");
    leftHand.meshes[0].alwaysSelectAsActiveMesh = true;
    leftHand.meshes[1].alwaysSelectAsActiveMesh = true;
    handsMeshes.push(leftHand.meshes[1]);

    // TODO - load right hand here
    const rightHand = await BABYLON.SceneLoader.ImportMeshAsync("", "https://192.168.0.233:8080/", "r_hand.glb", scene, undefined, ".glb");
    rightHand.meshes[0].alwaysSelectAsActiveMesh = true;
    rightHand.meshes[1].alwaysSelectAsActiveMesh = true;
    handsMeshes.push(rightHand.meshes[1]);

    // console.log(leftHand.meshes[0].rotation)
    // leftHand.meshes[0].rotate(BABYLON.Axis.Z, -Math.PI / 2);
    // leftHand.meshes[0].rotate(BABYLON.Axis.Y, Math.PI);
    leftHand.meshes[0].rotationQuaternion.set(0,0,0,1);
    rightHand.meshes[0].rotationQuaternion.set(0,0,0,1);
    // console.log(leftHand.meshes[0].rotationQuaternion)

    let promises = [];
    let handColors = {
        base: new BABYLON.Color3.FromInts(116, 63, 203),
        fresnel: new BABYLON.Color3.FromInts(149, 102, 229),
        fingerColor: new BABYLON.Color3.FromInts(177, 130, 255),
        tipFresnel: new BABYLON.Color3.FromInts(220, 200, 255),
    };
    const handsShader_L = new BABYLON.NodeMaterial("handsShader_L", scene, { emitComments: false });
    const handsShader_R = new BABYLON.NodeMaterial("handsShader_R", scene, { emitComments: false });
    promises.push(handsShader_L.loadAsync("https://192.168.0.233:8080/handsShader.json"), handsShader_R.loadAsync("https://192.168.0.233:8080/handsShader.json"));
    await Promise.all(promises).then(function () {
        // build node materials
        // [handsShader_L, handsShader_R].forEach((handsShader, idx) => {
        //     handsShader.build(false);

        //     // depth prepass and alpha mode
        //     handsShader.needDepthPrePass = true;
        //     handsShader.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        //     handsShader.alphaMode = BABYLON.Engine.ALPHA_COMBINE;

        //     const handNodes = {
        //         base: handsShader.getBlockByName("baseColor"),
        //         fresnel: handsShader.getBlockByName("fresnelColor"),
        //         fingerColor: handsShader.getBlockByName("fingerColor"),
        //         tipFresnel: handsShader.getBlockByName("tipFresnelColor"),
        //     };

        //     handNodes.base.value = handColors.base;
        //     handNodes.fresnel.value = handColors.fresnel;
        //     handNodes.fingerColor.value = handColors.fingerColor;
        //     handNodes.tipFresnel.value = handColors.tipFresnel;
        //     // handsMeshes[idx].material = handsShader;
        // });
    });

    const xrHelper = await scene.createDefaultXRExperienceAsync();

    const featureManager = xrHelper.baseExperience.featuresManager;

    const m = BABYLON.CylinderBuilder.CreateCylinder("jointParent", { diameterBottom: 1, diameterTop: 0.5, height: 1, tessellation: 5 });
    m.rotate(BABYLON.Axis.Z, Math.PI / 2);
    // m.position.x += 1;
    m.isVisible = false;
    m.bakeCurrentTransformIntoVertices();

    const handTracking = featureManager.enableFeature(
        BABYLON.WebXRFeatureName.HAND_TRACKING,
        "latest",
        {
            xrInput: xrHelper.input,
            jointMeshes: {
                sourceMesh: m,
            },
        },
        true,
        false
    );

    const mappingArray_L = [
        "wrist_L",
        "thumb_metacarpal_L",
        "thumb_proxPhalanx_L",
        "thumb_distPhalanx_L",
        "thumb_tip_L",
        "index_metacarpal_L",
        "index_proxPhalanx_L",
        "index_intPhalanx_L",
        "index_distPhalanx_L",
        "index_tip_L",
        "middle_metacarpal_L",
        "middle_proxPhalanx_L",
        "middle_intPhalanx_L",
        "middle_distPhalanx_L",
        "middle_tip_L",
        "ring_metacarpal_L",
        "ring_proxPhalanx_L",
        "ring_intPhalanx_L",
        "ring_distPhalanx_L",
        "ring_tip_L",
        "little_metacarpal_L",
        "little_proxPhalanx_L",
        "little_intPhalanx_L",
        "little_distPhalanx_L",
        "little_tip_L",
    ];

    const mappingArray_R = [
        "wrist_R",
        "thumb_metacarpal_R",
        "thumb_proxPhalanx_R",
        "thumb_distPhalanx_R",
        "thumb_tip_R",
        "index_metacarpal_R",
        "index_proxPhalanx_R",
        "index_intPhalanx_R",
        "index_distPhalanx_R",
        "index_tip_R",
        "middle_metacarpal_R",
        "middle_proxPhalanx_R",
        "middle_intPhalanx_R",
        "middle_distPhalanx_R",
        "middle_tip_R",
        "ring_metacarpal_R",
        "ring_proxPhalanx_R",
        "ring_intPhalanx_R",
        "ring_distPhalanx_R",
        "ring_tip_R",
        "little_metacarpal_R",
        "little_proxPhalanx_R",
        "little_intPhalanx_R",
        "little_distPhalanx_R",
        "little_tip_R",
    ];

    // if (scene.getTransformNodeByName("Armature")) {
    //     scene.getTransformNodeByName("Armature").rotationQuaternion.set(0, 0, 0, 1)
    // }

    // if (scene.getTransformNodeByName("root")) {
    //     alert(scene.getTransformNodeByName("root").rotationQuaternion.toString())
    //     scene.getTransformNodeByName("root").rotate(BABYLON.Axis.Z, -Math.PI / 2)
    //     alert(scene.getTransformNodeByName("root").rotationQuaternion.toString())
    // }

    let f = 0;
    handTracking.onHandAddedObservable.add((hand) => {
        const mappingArray = hand.xrController.inputSource.handedness === "left" ? mappingArray_L : mappingArray_R;
        xrHelper.baseExperience.sessionManager.onXRFrameObservable.add(() => {
            if (f++ > 500) {
                console.log(
                    hand.trackedMeshes.map((m) => {
                        return { rot: m.rotationQuaternion, pos: m.position };
                    })
                );
                f = 0;
            }
            hand.trackedMeshes.forEach((m, idx) => {
                if (!mappingArray[idx]) return;
                const node = scene.getTransformNodeByName(mappingArray[idx]);
                if (!node) return;
                m.isVisible = false;
                node.setAbsolutePosition(m.position);
                // node.position.z *= -1;
                node.rotationQuaternion.copyFrom(m.rotationQuaternion);
                // node.rotationQuaternion.multiplyInPlace(z90yMinus90);
                // node.rotationQuaternion.z *= -1;
                // node.rotationQuaternion.w *= -1;
                // node.rotationQuaternion.multiplyInPlace(rot);
                // node.rotationQuaternion.normalize();

                // rot.multiplyToRef(node.rotationQuaternion, node.rotationQuaternion);
                // node.rotationQuaternion.normalize();
            });
        });
    });

    return scene;
};
