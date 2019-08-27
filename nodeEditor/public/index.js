if (BABYLON.Engine.isSupported()) {
    var engine = new BABYLON.Engine(canvas, false);

    BABYLONDEVTOOLS.Loader.debugShortcut(engine);

    var scene = new BABYLON.Scene(engine);

    var nodeMaterial = new BABYLON.NodeMaterial("node");
    nodeMaterial.setToDefault();
    nodeMaterial.build(true);

    BABYLON.NodeEditor.Show({nodeMaterial: nodeMaterial});
}
else {
    alert('Babylon.js is not supported.')
}