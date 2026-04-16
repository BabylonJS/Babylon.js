const createScene = function () {
    const scene = new BABYLON.Scene(engine);

    const camera = new BABYLON.ArcRotateCamera("camera", -Math.PI / 2, Math.PI / 3, 10, BABYLON.Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    new BABYLON.HemisphericLight("light", new BABYLON.Vector3(0, 1, 0), scene);
    BABYLON.MeshBuilder.CreateGround("ground", { width: 10, height: 10 }, scene);
    const box = BABYLON.MeshBuilder.CreateBox("box", { size: 1 }, scene);
    box.position.y = 0.5;

    window.__getState = () => ({
        alpha: camera.alpha,
        beta: camera.beta,
        radius: camera.radius,
    });

    return scene;
};

export default createScene;
