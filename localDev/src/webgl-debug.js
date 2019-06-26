

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
  

  // Must test:
  - fog
  - morph
  - bones
  - multi textures