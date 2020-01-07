
function CreatePlane(width, height, uvScale) {
    var positions = [];
    var normals = [];
    var uvs = [];

    var halfWidth = width / 2.0;
    var halfHeight = height / 2.0;

    // face A
    positions.push(-halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1);
    uvs.push(uvScale, 0.0);

    positions.push(-halfWidth, halfHeight, 0);
    normals.push(0, 0, -1);
    uvs.push(uvScale, uvScale);

    positions.push(halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, uvScale);

    // face B
    positions.push(-halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(uvScale, 0.0);

    positions.push(halfWidth, halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, uvScale);

    positions.push(halfWidth, -halfHeight, 0);
    normals.push(0, 0, -1.0);
    uvs.push(0.0, 0.0);
    
    var vertexData = new BABYLON.VertexData();

    vertexData.positions = positions;
    vertexData.normals = normals;
    vertexData.uvs = uvs;
    
    var plane = new BABYLON.Mesh("Plane01", scene);
    vertexData.applyToMesh(plane, false);
    
    return plane;
}

function CreatePlanesAddressMode()
{
    let width = 5;
    let height = 5;

    let mode = [BABYLON.Texture.CLAMP_ADDRESSMODE, BABYLON.Texture.WRAP_ADDRESSMODE, BABYLON.Texture.MIRROR_ADDRESSMODE];
    for (var y = 0; y < 3; y++) {
        for (var x = 0; x < 3; x++) {
            var plane = CreatePlane(width, height, 3);
            plane.position.x = -6.0 + x * 6.0;
            plane.position.y = -6.0 + y * 6.0;

            var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
            myMaterial.diffuseTexture = new BABYLON.Texture("https://github.com/CedricGuillemet/dump/raw/master/Custom_UV_Checker.png", scene);
            myMaterial.diffuseTexture.wrapU = mode[x];
            myMaterial.diffuseTexture.wrapV = mode[y];

            plane.material = myMaterial;
        }
    }

    return Promise.resolve();
}

function CreatePlanesFiltering()
{
    let width = 5;
    let height = 5;

    let mode = [BABYLON.Texture.CLAMP_ADDRESSMODE, BABYLON.Texture.WRAP_ADDRESSMODE, BABYLON.Texture.MIRROR_ADDRESSMODE];
    for (var y = 0; y < 2; y++) {
        for (var x = 0; x < 12; x++) {
            var plane = CreatePlane(width, height, y?0.5:2.0);
            plane.position.x = -6.0 + x * 6.0;
            plane.position.y = -6.0 + y * 6.0;

            var myMaterial = new BABYLON.StandardMaterial("myMaterial", scene);
            myMaterial.diffuseTexture = new BABYLON.Texture("https://github.com/CedricGuillemet/dump/raw/master/Custom_UV_Checker.png", scene);
            myMaterial.diffuseTexture.samplingmode  = x;

            plane.material = myMaterial;
        }
    }

    return Promise.resolve();
}

function CreateInputHandling(scene) {
    var inputManager = new InputManager();
    var priorX = inputManager.pointerX;
    var priorY = inputManager.pointerY;
    var x = 0;
    var y = 0;
    scene.onBeforeRenderObservable.add(function () {
        x = inputManager.pointerX;
        y = inputManager.pointerY;

        if (inputManager.isPointerDown) {
            scene.activeCamera.alpha += 0.01 * (priorX - x);
            scene.activeCamera.beta += 0.01 * (priorY - y);
        }

        priorX = x;
        priorY = y;
    });
}

var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);

CreatePlanesAddressMode().then(function () {
//CreatePlanesFiltering().then(function () {
	scene.createDefaultCamera(true);
	scene.activeCamera.alpha += Math.PI;
	CreateInputHandling(scene);
	scene.createDefaultLight(true);
	engine.runRenderLoop(function () {
        scene.render();
    });
	
}, function (ex) {
    console.log(ex.message, ex.stack);
});
