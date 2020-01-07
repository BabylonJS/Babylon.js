var engine = new BABYLON.NativeEngine();
var scene = new BABYLON.Scene(engine);

function CreateBoxAsyncMat3x3() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat",scene);
    mat.AddUniform("ma", "mat4");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(ma[0].x, ma[1].y, ma[2].z);'
        );

    var ma3 = [1,0,0
             ,0,0.2,0
             ,0,0,0.8];
    var ma3a = new Float32Array(ma3);

    setTimeout(function(){
        mat.getEffect().setMatrix3x3("ma", ma3a); 
    }, 1000);
    
    box.material = mat;
    
    return Promise.resolve();
}

function CreateBoxAsyncMat2x2() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat",scene);
    mat.AddUniform("ma", "mat4");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(ma[0].x, ma[0].y, ma[1].x);'
        );

    var ma2 = [1,0.2
              ,0.8,1.];
    var ma2a = new Float32Array(ma2);

    setTimeout(function(){
        mat.getEffect().setMatrix2x2("ma", ma2a); 
    }, 1000);
    
    box.material = mat;
    
    return Promise.resolve();
}

function CreateBoxAsyncIntArray() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat",scene);
    mat.AddUniform("fa", "float[3]");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(fa[0], fa[1], fa[2]) / 255.;'
        );

    var ia = [255, 128, 200];
    var ia32 = new Int32Array(ia);

    setTimeout(function(){
        mat.getEffect().setIntArray("fa", ia32); 
    }, 1000);
    
    box.material = mat;
    
    return Promise.resolve();
}

function CreateBoxAsyncInt4Array() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat",scene);
    mat.AddUniform("fa", "vec4[3]");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(fa[0].x, fa[1].y, fa[2].z) / 255.;'
        );

    var ia = [255, 0, 0, 0,
              0, 128, 0, 0,
              0, 0, 200, 0];
    var ia32 = new Int32Array(ia);

    setTimeout(function(){
        mat.getEffect().setIntArray4("fa", ia32); 
    }, 1000);
    
    box.material = mat;
    
    return Promise.resolve();
}

function CreateBoxAsyncFloatArray() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat",scene);
    mat.AddUniform("fa", "float[3]");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(fa[0], fa[1], fa[2]);'
        );

    var fa = [1.0, 0.5, 0.8];
    var fa32 = new Float32Array(fa);

    setTimeout(function(){
        mat.getEffect().setFloatArray("fa", fa32); 
    }, 1000);
    
    box.material = mat;
    
    return Promise.resolve();
}

function CreateBoxAsyncVec4Array() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat",scene);
    mat.AddUniform("fa", "vec4[3]");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(fa[0].x, fa[1].y, fa[2].z);'
        );

    var fa = [1.0, 0.0, 0.0, 0.0,
              0.0, 0.5, 0.0, 0.0,
              0.0, 0.0, 0.8, 0.0];
    var fa32 = new Float32Array(fa);

    setTimeout(function(){
        mat.getEffect().setFloatArray4("fa", fa32); 
    }, 1000);
    
    box.material = mat;
    
    return Promise.resolve();
}

function CreateBoxAsyncBool() {
    var box = BABYLON.Mesh.CreateBox("box", 0.7);
    
    var mat = new BABYLON.CustomMaterial("boxMat1",scene);
    mat.AddUniform("hasRed", "float");
    mat.AddUniform("hasGreen", "float");
    mat.AddUniform("hasBlue", "float");

    mat.Fragment_Custom_Diffuse(' \
        \
            diffuseColor = vec3(hasRed, hasGreen, hasBlue);'
        );

    setTimeout(function(){
        mat.getEffect().setBool("hasRed", true); 
        mat.getEffect().setBool("hasGreen", false); 
        mat.getEffect().setBool("hasBlue", true); 
    }, 1000);
  
    box.material = mat;
    
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

//CreateBoxAsyncBool().then(function () {
//CreateBoxAsyncFloatArray().then(function () {
//CreateBoxAsyncVec4Array().then(function () {    
//CreateBoxAsyncInt4Array().then(function () {
//CreateBoxAsyncIntArray().then(function () {
//CreateBoxAsyncMat3x3().then(function () {
CreateBoxAsyncMat2x2().then(function () {
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