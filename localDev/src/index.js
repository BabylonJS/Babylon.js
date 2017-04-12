

var globals = {};

var createScene = function()
{
    // This creates a basic Babylon Scene object (non-mesh)
    var scene = new BABYLON.Scene(engine);

    // This creates and positions a free camera (non-mesh)
    var camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 5, -5), scene);

    // This targets the camera to scene origin
    camera.setTarget(BABYLON.Vector3.Zero());

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    var material0 = new BABYLON.StandardMaterial("mat0", scene);
    material0.diffuseColor = new BABYLON.Color3(1, 0, 0);
    //material0.bumpTexture = new BABYLON.Texture("normalMap.jpg", scene);
   
    var material1 = new BABYLON.StandardMaterial("mat1", scene);
    material1.diffuseColor = new BABYLON.Color3(0, 0, 1);
    
    var material2 = new BABYLON.StandardMaterial("mat2", scene);
    material2.emissiveColor = new BABYLON.Color3(0.4, 0, 0.4);

    var multimat = new BABYLON.MultiMaterial("multi", scene);
    multimat.subMaterials.push(material0);
    multimat.subMaterials.push(material1);
    multimat.subMaterials.push(material2);

    globals.multimat = multimat;

    var sphere = BABYLON.Mesh.CreateSphere("Sphere0", 16, 3, scene);
    sphere.material = multimat;

    sphere.subMeshes = [];
    var verticesCount = sphere.getTotalVertices();

    sphere.subMeshes.push(new BABYLON.SubMesh(0, 0, verticesCount, 0, 900, sphere));
    sphere.subMeshes.push(new BABYLON.SubMesh(1, 0, verticesCount, 900, 900, sphere));
    sphere.subMeshes.push(new BABYLON.SubMesh(2, 0, verticesCount, 1800, 2088, sphere));

  //  material0.diffuseTexture = new BABYLON.Texture("textures/misc.jpg", scene, true, true, BABYLON.Texture.BILINEAR_SAMPLINGMODE); 

    scene.actionManager = new BABYLON.ActionManager(scene);
    scene.actionManager.registerAction(new BABYLON.ExecuteCodeAction(BABYLON.ActionManager.OnKeyUpTrigger, function (evt) {
        if (evt.sourceEvent.key == "t")
        {
          //  globals.multimat.subMaterials[0].diffuseColor = new BABYLON.Color3(1, 1, 1);
            globals.multimat.subMaterials[0].diffuseTexture = new BABYLON.Texture("/assets/textures/amiga.jpg", scene, true, true, BABYLON.Texture.BILINEAR_SAMPLINGMODE);
        }
        else if (evt.sourceEvent.key == "m")
        {
            var material0 = new BABYLON.StandardMaterial("mat0", scene);
          //  material0.diffuseColor = new BABYLON.Color3(0, 1, 0);
            material0.diffuseTexture = new BABYLON.Texture("/assets/textures/amiga.jpg", scene, true, true, BABYLON.Texture.BILINEAR_SAMPLINGMODE);

            globals.multimat.subMaterials[0] = material0; 
        }
    }));

    return scene;
};