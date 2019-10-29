var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);

function CreateBoxAsync() {
    var box1 = BABYLON.Mesh.CreateBox("box1", 0.7);
	
	var mat1 = new BABYLON.CustomMaterial("boxMat1",scene);
    mat1.AddUniform("fa", "float[3]");

    mat1.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(fa[0], fa[1], fa[2]);'
        );

    var fa = [1.0, 0.0, 1.0];
    var fa32 = new Float32Array(fa);

    setTimeout(function(){
        mat1.getEffect().setFloatArray("fa", fa32); 
    }, 1000);
	
	box1.material = mat1;
	
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

CreateBoxAsync().then(function () {
	scene.createDefaultCamera(true);
	scene.activeCamera.alpha += Math.PI;
	CreateInputHandling(scene);
	
    var light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
	
	engine.runRenderLoop(function () {
        scene.render();
    });
    
}, function (ex) {
    console.log(ex.message, ex.stack);
});