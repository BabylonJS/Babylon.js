

var createNodeMaterial = function(scene) {
    var nodeMaterial = new BABYLON.NodeMaterial("node", scene, { emitComments: true });
    // nodeMaterial.setToDefault();
    // Blocks

    // Vertex
    var positionInput = new BABYLON.InputBlock("position");
    positionInput.setAsAttribute("position");

    var worldInput = new BABYLON.InputBlock("world");
    worldInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.World);

    var worldPos = new BABYLON.Vector4TransformBlock("worldPos");
    positionInput.connectTo(worldPos);
    worldInput.connectTo(worldPos);

    var normalInput = new BABYLON.InputBlock("normal");
    normalInput.setAsAttribute("normal");

    var worldNormal = new BABYLON.Vector4TransformBlock("worldNormal");
    normalInput.connectTo(worldNormal);
    worldInput.connectTo(worldNormal);

    var viewProjectionInput = new BABYLON.InputBlock("viewProjection");
    viewProjectionInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.ViewProjection);

    var worldPosdMultipliedByViewProjection = new BABYLON.Vector4TransformBlock("worldPos * viewProjectionTransform");
    worldPos.connectTo(worldPosdMultipliedByViewProjection);
    viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

    var vertexOutput = new BABYLON.VertexOutputBlock("vertexOutput");
    worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

    // Pixel
    var colorInput = new BABYLON.InputBlock("color");
    colorInput.value = new BABYLON.Color3(1, 0, 0);

    var colorMultiplier = new BABYLON.MultiplyBlock("color multiplier");
    colorInput.connectTo(colorMultiplier);

    var lightNode = new BABYLON.LightBlock("All Lights");
    worldPos.output.connectTo(lightNode.worldPosition);
    worldNormal.output.connectTo(lightNode.worldNormal);
    lightNode.diffuseOutput.connectTo(colorMultiplier.right);

    var pixelOutput = new BABYLON.FragmentOutputBlock("pixelOutput");
    colorMultiplier.connectTo(pixelOutput);

    // Add to nodes
    nodeMaterial.addOutputNode(vertexOutput);
    nodeMaterial.addOutputNode(pixelOutput);

    // Build
    nodeMaterial.build(true);

    scene.debugLayer.show();
    scene.debugLayer.select(nodeMaterial);

    return nodeMaterial;
}

var createScene = function() {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", 1.14, 1.13, 10, BABYLON.Vector3.Zero(), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, -11, 5), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light2.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

    sphere.material = createNodeMaterial(scene);


    return scene;

};

/////////////////////////


var createNodeMaterial = function(scene) {
    var nodeMaterial = new BABYLON.NodeMaterial("node", scene, { emitComments: true });
    // nodeMaterial.setToDefault();
    // Blocks

    // Vertex
    var positionInput = new BABYLON.InputBlock("position");
    positionInput.setAsAttribute("position");

    var worldInput = new BABYLON.InputBlock("world");
    worldInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.World);

    var worldPos = new BABYLON.Vector4TransformBlock("worldPos");
    positionInput.connectTo(worldPos);
    worldInput.connectTo(worldPos);

    var normalInput = new BABYLON.InputBlock("normal");
    normalInput.setAsAttribute("normal");

    var worldNormal = new BABYLON.Vector4TransformBlock("worldNormal");
    normalInput.connectTo(worldNormal);
    worldInput.connectTo(worldNormal);

    var viewProjectionInput = new BABYLON.InputBlock("viewProjection");
    viewProjectionInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.ViewProjection);

    var worldPosdMultipliedByViewProjection = new BABYLON.Vector4TransformBlock("worldPos * viewProjectionTransform");
    worldPos.connectTo(worldPosdMultipliedByViewProjection);
    viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

    var vertexOutput = new BABYLON.VertexOutputBlock("vertexOutput");
    worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

    // Pixel
    var colorInput = new BABYLON.InputBlock("color");
    colorInput.value = new BABYLON.Color4(1, 0, 0, 1);

    var colorMultiplier2 = new BABYLON.MultiplyBlock("color multiplier2");

    var diffuseTextureBlock = new BABYLON.TextureBlock("diffuseTexture");
    diffuseTextureBlock.texture = new BABYLON.Texture("/playground/textures/bloc.jpg");

    diffuseTextureBlock.connectTo(colorMultiplier2);
    colorInput.connectTo(colorMultiplier2);

    var pixelOutput = new BABYLON.FragmentOutputBlock("pixelOutput");
    colorMultiplier2.connectTo(pixelOutput);

    // Add to nodes
    nodeMaterial.addOutputNode(vertexOutput);
    nodeMaterial.addOutputNode(pixelOutput);

    // Build
    nodeMaterial.build(true);

    scene.debugLayer.show();
    scene.debugLayer.select(nodeMaterial);

    return nodeMaterial;
}

var createScene = function() {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", 1.14, 1.13, 10, BABYLON.Vector3.Zero(), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, -11, 5), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light2.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

    sphere.material = createNodeMaterial(scene);


    return scene;

};


/*
    - bones
    */


var createNodeMaterial = function(scene) {
    var nodeMaterial = new BABYLON.NodeMaterial("node", scene, { emitComments: true });
    // nodeMaterial.setToDefault();
    // Blocks

    // Vertex
    var positionInput = new BABYLON.InputBlock("position");
    positionInput.setAsAttribute("position");

    var worldInput = new BABYLON.InputBlock("world");
    worldInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.World);

    var worldPos = new BABYLON.Vector4TransformBlock("worldPos");
    positionInput.connectTo(worldPos);
    worldInput.connectTo(worldPos);

    var normalInput = new BABYLON.InputBlock("normal");
    normalInput.setAsAttribute("normal");

    var worldNormal = new BABYLON.Vector4TransformBlock("worldNormal");
    normalInput.connectTo(worldNormal);
    worldInput.connectTo(worldNormal);

    var viewProjectionInput = new BABYLON.InputBlock("viewProjection");
    viewProjectionInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.ViewProjection);

    var worldPosdMultipliedByViewProjection = new BABYLON.Vector4TransformBlock("worldPos * viewProjectionTransform");
    worldPos.connectTo(worldPosdMultipliedByViewProjection);
    viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

    var vertexOutput = new BABYLON.VertexOutputBlock("vertexOutput");
    worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

    // Pixel
    var colorInput = new BABYLON.InputBlock("color");
    colorInput.value = new BABYLON.Color4(1, 0, 0, 1);

    var colorMultiplier = new BABYLON.MultiplyBlock("color multiplier");

    var diffuseTextureBlock = new BABYLON.TextureBlock("diffuseTexture");
    diffuseTextureBlock.texture = new BABYLON.Texture("/playground/textures/bloc.jpg");

    var diffuse2TextureBlock = new BABYLON.TextureBlock("diffuseTexture2");
    diffuse2TextureBlock.texture = new BABYLON.Texture("/playground/textures/crate.png");

    diffuseTextureBlock.connectTo(colorMultiplier);
    diffuse2TextureBlock.connectTo(colorMultiplier);

    var colorMultiplier2 = new BABYLON.MultiplyBlock("color multiplier2");

    colorMultiplier.connectTo(colorMultiplier2);
    colorInput.connectTo(colorMultiplier2);

    var fog = new BABYLON.FogBlock("fog");
    worldPos.connectTo(fog);
    colorMultiplier2.connectTo(fog);

    var pixelOutput = new BABYLON.FragmentOutputBlock("pixelOutput");
    fog.connectTo(pixelOutput);

    // Add to nodes
    nodeMaterial.addOutputNode(vertexOutput);
    nodeMaterial.addOutputNode(pixelOutput);

    // Build
    nodeMaterial.build(true);

    scene.debugLayer.show();
    scene.debugLayer.select(nodeMaterial);

    return nodeMaterial;
}

var createScene = function() {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", 1.14, 1.13, 10, BABYLON.Vector3.Zero(), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, -11, 5), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light2.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

    sphere.material = createNodeMaterial(scene);

    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = scene.clearColor.clone();
    scene.fogStart = 2.0;
    scene.fogEnd = 40.0;

    return scene;

};


////////////////////


var createNodeMaterial = function(scene) {
    var nodeMaterial = new BABYLON.NodeMaterial("node", scene, { emitComments: true });
    // nodeMaterial.setToDefault();
    // Blocks

    // Vertex

    var morphTargets = new BABYLON.MorphTargetsBlock("morphTargets");

    var worldInput = new BABYLON.InputBlock("world");
    worldInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.World);

    var worldPos = new BABYLON.Vector4TransformBlock("worldPos");
    morphTargets.connectTo(worldPos);
    worldInput.connectTo(worldPos);

    var normalInput = new BABYLON.InputBlock("normal");
    normalInput.setAsAttribute("normal");

    var worldNormal = new BABYLON.Vector4TransformBlock("worldNormal");
    normalInput.connectTo(worldNormal);
    worldInput.connectTo(worldNormal);

    var viewProjectionInput = new BABYLON.InputBlock("viewProjection");
    viewProjectionInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.ViewProjection);

    var worldPosdMultipliedByViewProjection = new BABYLON.Vector4TransformBlock("worldPos * viewProjectionTransform");
    worldPos.connectTo(worldPosdMultipliedByViewProjection);
    viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

    var vertexOutput = new BABYLON.VertexOutputBlock("vertexOutput");
    worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

    // Pixel
    var colorInput = new BABYLON.InputBlock("color");
    colorInput.value = new BABYLON.Color4(1, 0, 0, 1);

    var colorMultiplier = new BABYLON.MultiplyBlock("color multiplier");

    var diffuseTextureBlock = new BABYLON.TextureBlock("diffuseTexture");
    diffuseTextureBlock.texture = new BABYLON.Texture("/playground/textures/bloc.jpg");

    var diffuse2TextureBlock = new BABYLON.TextureBlock("diffuseTexture2");
    diffuse2TextureBlock.texture = new BABYLON.Texture("/playground/textures/crate.png");

    diffuseTextureBlock.connectTo(colorMultiplier);
    diffuse2TextureBlock.connectTo(colorMultiplier);

    var colorMultiplier2 = new BABYLON.MultiplyBlock("color multiplier2");

    colorMultiplier.connectTo(colorMultiplier2);
    colorInput.connectTo(colorMultiplier2);

    var fog = new BABYLON.FogBlock("fog");
    worldPos.connectTo(fog);
    colorMultiplier2.connectTo(fog);

    var pixelOutput = new BABYLON.FragmentOutputBlock("pixelOutput");
    fog.connectTo(pixelOutput);

    // Add to nodes
    nodeMaterial.addOutputNode(vertexOutput);
    nodeMaterial.addOutputNode(pixelOutput);

    // Build
    nodeMaterial.build(true);

    scene.debugLayer.show();
    scene.debugLayer.select(nodeMaterial);

    return nodeMaterial;
}

var addSpike = function(mesh) {
    var positions = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    var normals = mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
    var indices = mesh.getIndices();

    for (var index = 0; index < 5; index++) {
        var randomVertexID = (mesh.getTotalVertices() * Math.random()) | 0;
        var position = BABYLON.Vector3.FromArray(positions, randomVertexID * 3);
        var normal = BABYLON.Vector3.FromArray(normals, randomVertexID * 3);

        position.addInPlace(normal);

        position.toArray(positions, randomVertexID * 3);
    }

    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
    mesh.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
    mesh.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false);
}

var createScene = function() {

    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.ArcRotateCamera("camera1", 1.14, 1.13, 10, BABYLON.Vector3.Zero(), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var light2 = new BABYLON.PointLight("light2", new BABYLON.Vector3(0, -11, 5), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light2.intensity = 0.7;

    // Our built-in 'sphere' shape. Params: name, subdivs, size, scene
    var sphere = BABYLON.Mesh.CreateSphere("sphere1", 16, 2, scene);

    sphere.material = createNodeMaterial(scene);

    scene.fogMode = BABYLON.Scene.FOGMODE_LINEAR;
    scene.fogColor = scene.clearColor.clone();
    scene.fogStart = 2.0;
    scene.fogEnd = 40.0;

    var sphere2 = BABYLON.Mesh.CreateSphere("sphere2", 16, 2, scene);
    sphere2.setEnabled(false);
    addSpike(sphere2);

    var sphere3 = BABYLON.Mesh.CreateSphere("sphere3", 16, 2, scene);
    sphere3.setEnabled(false);
    addSpike(sphere3);

    var sphere4 = BABYLON.Mesh.CreateSphere("sphere4", 16, 2, scene);
    sphere4.setEnabled(false);
    addSpike(sphere4);

    var sphere5 = BABYLON.Mesh.CreateSphere("sphere5", 16, 2, scene);
    sphere5.setEnabled(false);
    addSpike(sphere5);

    var manager = new BABYLON.MorphTargetManager();
    sphere.morphTargetManager = manager;

    var target0 = BABYLON.MorphTarget.FromMesh(sphere2, "sphere2", 0.25);
    manager.addTarget(target0);

    var target1 = BABYLON.MorphTarget.FromMesh(sphere3, "sphere3", 0.25);
    manager.addTarget(target1);

    var target2 = BABYLON.MorphTarget.FromMesh(sphere4, "sphere4", 0.25);
    manager.addTarget(target2);

    var target3 = BABYLON.MorphTarget.FromMesh(sphere5, "sphere5", 0.25);
    manager.addTarget(target3);

    // GUI
    var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");

    var panel = new BABYLON.GUI.StackPanel();
    panel.width = "220px";
    panel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
    panel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
    advancedTexture.addControl(panel);

    var addSlider = function(text, callback) {
        var header = new BABYLON.GUI.TextBlock();
        header.text = text;
        header.height = "30px";
        header.color = "white";
        panel.addControl(header);

        var slider = new BABYLON.GUI.Slider();
        slider.minimum = 0;
        slider.maximum = 1;
        slider.value = 0;
        slider.height = "20px";
        slider.width = "200px";
        slider.onValueChangedObservable.add(function(value) {
            callback(value);
        });
        panel.addControl(slider);
    }

    addSlider("Influence #1", (value) => {
        target0.influence = value;
    });

    addSlider("Influence #2", (value) => {
        target1.influence = value;
    });

    addSlider("Influence #3", (value) => {
        target2.influence = value;
    });

    addSlider("Influence #4", (value) => {
        target3.influence = value;
    });

    return scene;

};

//////


var createNodeMaterial = function(scene) {
    var nodeMaterial = new BABYLON.NodeMaterial("node", scene, { emitComments: true });
    // nodeMaterial.setToDefault();
    // Blocks

    // Vertex

    var morphTargets = new BABYLON.MorphTargetsBlock("morphTargets");
    var bonesBlock = new BABYLON.BonesBlock("bonesBlock");

    var worldPos = new BABYLON.Vector4TransformBlock("worldPos");
    morphTargets.connectTo(worldPos);
    bonesBlock.connectTo(worldPos);

    var normalInput = new BABYLON.InputBlock("normal");
    normalInput.setAsAttribute("normal");

    var worldNormal = new BABYLON.Vector4TransformBlock("worldNormal");
    normalInput.connectTo(worldNormal);
    bonesBlock.connectTo(worldNormal);

    var viewProjectionInput = new BABYLON.InputBlock("viewProjection");
    viewProjectionInput.setAsWellKnownValue(BABYLON.NodeMaterialWellKnownValues.ViewProjection);

    var worldPosdMultipliedByViewProjection = new BABYLON.Vector4TransformBlock("worldPos * viewProjectionTransform");
    worldPos.connectTo(worldPosdMultipliedByViewProjection);
    viewProjectionInput.connectTo(worldPosdMultipliedByViewProjection);

    var vertexOutput = new BABYLON.VertexOutputBlock("vertexOutput");
    worldPosdMultipliedByViewProjection.connectTo(vertexOutput);

    // Pixel
    var colorInput = new BABYLON.InputBlock("color");
    colorInput.value = new BABYLON.Color4(1, 0, 0, 1);

    var colorMultiplier = new BABYLON.MultiplyBlock("color multiplier");

    var diffuseTextureBlock = new BABYLON.TextureBlock("diffuseTexture");
    diffuseTextureBlock.texture = new BABYLON.Texture("/playground/textures/bloc.jpg");

    var diffuse2TextureBlock = new BABYLON.TextureBlock("diffuseTexture2");
    diffuse2TextureBlock.texture = new BABYLON.Texture("/playground/textures/crate.png");

    diffuseTextureBlock.connectTo(colorMultiplier);
    diffuse2TextureBlock.connectTo(colorMultiplier);

    var colorMultiplier2 = new BABYLON.MultiplyBlock("color multiplier2");

    colorMultiplier.connectTo(colorMultiplier2);
    colorInput.connectTo(colorMultiplier2);

    var fog = new BABYLON.FogBlock("fog");
    worldPos.connectTo(fog);
    colorMultiplier2.connectTo(fog);

    var pixelOutput = new BABYLON.FragmentOutputBlock("pixelOutput");
    fog.connectTo(pixelOutput);

    // Add to nodes
    nodeMaterial.addOutputNode(vertexOutput);
    nodeMaterial.addOutputNode(pixelOutput);

    // Build
    nodeMaterial.build(true);

    scene.debugLayer.show();
    scene.debugLayer.select(nodeMaterial);

    return nodeMaterial;
}

var delayCreateScene = function() {

    // Model by Mixamo

    engine.enableOfflineSupport = false;

    // This is really important to tell Babylon.js to use decomposeLerp and matrix interpolation
    BABYLON.Animation.AllowMatricesInterpolation = true;

    var scene = new BABYLON.Scene(engine);

    var camera = new BABYLON.ArcRotateCamera("camera1", Math.PI / 2, Math.PI / 4, 3, new BABYLON.Vector3(0, 1, 0), scene);
    camera.attachControl(canvas, true);

    camera.lowerRadiusLimit = 2;
    camera.upperRadiusLimit = 10;
    camera.wheelDeltaPercentage = 0.01;

    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 0.6;
    light.specular = BABYLON.Color3.Black();

    var light2 = new BABYLON.DirectionalLight("dir01", new BABYLON.Vector3(0, -0.5, -1.0), scene);
    light2.position = new BABYLON.Vector3(0, 5, 5);

    // Shadows
    var shadowGenerator = new BABYLON.ShadowGenerator(1024, light2);
    shadowGenerator.useBlurExponentialShadowMap = true;
    shadowGenerator.blurKernel = 32;

    engine.displayLoadingUI();

    BABYLON.SceneLoader.ImportMesh("", "/playground/scenes/", "dummy3.babylon", scene, function(newMeshes, particleSystems, skeletons) {
        var skeleton = skeletons[0];

        shadowGenerator.addShadowCaster(scene.meshes[0], true);
        for (var index = 0; index < newMeshes.length; index++) {
            newMeshes[index].receiveShadows = false;;
        }

        newMeshes[0].material = createNodeMaterial(scene);

        var helper = scene.createDefaultEnvironment({
            enableGroundShadow: true
        });
        helper.setMainColor(BABYLON.Color3.Gray());
        helper.ground.position.y += 0.01;

        // ROBOT
        skeleton.animationPropertiesOverride = new BABYLON.AnimationPropertiesOverride();
        skeleton.animationPropertiesOverride.enableBlending = true;
        skeleton.animationPropertiesOverride.blendingSpeed = 0.05;
        skeleton.animationPropertiesOverride.loopMode = 1;

        var idleRange = skeleton.getAnimationRange("YBot_Idle");
        var walkRange = skeleton.getAnimationRange("YBot_Walk");
        var runRange = skeleton.getAnimationRange("YBot_Run");
        var leftRange = skeleton.getAnimationRange("YBot_LeftStrafeWalk");
        var rightRange = skeleton.getAnimationRange("YBot_RightStrafeWalk");

        // IDLE
        if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);

        // UI
        var advancedTexture = BABYLON.GUI.AdvancedDynamicTexture.CreateFullscreenUI("UI");
        var UiPanel = new BABYLON.GUI.StackPanel();
        UiPanel.width = "220px";
        UiPanel.fontSize = "14px";
        UiPanel.horizontalAlignment = BABYLON.GUI.Control.HORIZONTAL_ALIGNMENT_RIGHT;
        UiPanel.verticalAlignment = BABYLON.GUI.Control.VERTICAL_ALIGNMENT_CENTER;
        advancedTexture.addControl(UiPanel);
        // ..
        var button = BABYLON.GUI.Button.CreateSimpleButton("but1", "Play Idle");
        button.paddingTop = "10px";
        button.width = "100px";
        button.height = "50px";
        button.color = "white";
        button.background = "green";
        button.onPointerDownObservable.add(() => {
            if (idleRange) scene.beginAnimation(skeleton, idleRange.from, idleRange.to, true);
        });
        UiPanel.addControl(button);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but2", "Play Walk");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (walkRange) scene.beginAnimation(skeleton, walkRange.from, walkRange.to, true);
        });
        UiPanel.addControl(button1);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but3", "Play Run");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (runRange) scene.beginAnimation(skeleton, runRange.from, runRange.to, true);
        });
        UiPanel.addControl(button1);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but4", "Play Left");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (leftRange) scene.beginAnimation(skeleton, leftRange.from, leftRange.to, true);
        });
        UiPanel.addControl(button1);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but5", "Play Right");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (rightRange) scene.beginAnimation(skeleton, rightRange.from, rightRange.to, true);
        });
        UiPanel.addControl(button1);
        // ..
        var button1 = BABYLON.GUI.Button.CreateSimpleButton("but6", "Play Blend");
        button1.paddingTop = "10px";
        button1.width = "100px";
        button1.height = "50px";
        button1.color = "white";
        button1.background = "green";
        button1.onPointerDownObservable.add(() => {
            if (walkRange && leftRange) {
                scene.stopAnimation(skeleton);
                var walkAnim = scene.beginWeightedAnimation(skeleton, walkRange.from, walkRange.to, 0.5, true);
                var leftAnim = scene.beginWeightedAnimation(skeleton, leftRange.from, leftRange.to, 0.5, true);

                // Note: Sync Speed Ratio With Master Walk Animation
                walkAnim.syncWith(null);
                leftAnim.syncWith(walkAnim);
            }
        });
        UiPanel.addControl(button1);

        engine.hideLoadingUI();
    });

    return scene;
};
