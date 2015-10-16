var BABYLON;
(function (BABYLON) {
    var MeshBuilder = (function () {
        function MeshBuilder() {
        }
        MeshBuilder.CreateBox = function (name, options, scene) {
            var box = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateBox(options);
            vertexData.applyToMesh(box, options.updatable);
            return box;
        };
        return MeshBuilder;
    })();
    BABYLON.MeshBuilder = MeshBuilder;
})(BABYLON || (BABYLON = {}));
