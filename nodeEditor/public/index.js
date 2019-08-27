if (BABYLON.Engine.isSupported()) {
    var canvas = document.createElement("canvas");
    var engine = new BABYLON.Engine(canvas, false);

    BABYLONDEVTOOLS.Loader.debugShortcut(engine);

    var scene = new BABYLON.Scene(engine);

    var nodeMaterial = new BABYLON.NodeMaterial("node");
    nodeMaterial.setToDefault();
    nodeMaterial.build(true);

    var hostElement = document.getElementById("host-element");

    BABYLON.NodeEditor.Show({nodeMaterial: nodeMaterial, hostElement: hostElement});
}
else {
    alert('Babylon.js is not supported.')
}