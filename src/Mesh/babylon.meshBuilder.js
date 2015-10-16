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
        MeshBuilder.CreateSphere = function (name, options, scene) {
            var sphere = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateSphere(options);
            vertexData.applyToMesh(sphere, options.updatable);
            return sphere;
        };
        MeshBuilder.CreateDisc = function (name, options, scene) {
            var disc = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateDisc(options);
            vertexData.applyToMesh(disc, options.updatable);
            return disc;
        };
        MeshBuilder.CreateRibbon = function (name, options, scene) {
            var pathArray = options.pathArray;
            var closeArray = options.closeArray;
            var closePath = options.closePath;
            var offset = options.offset;
            var sideOrientation = options.sideOrientation;
            var instance = options.instance;
            var updatable = options.updatable;
            if (instance) {
                // positionFunction : ribbon case
                // only pathArray and sideOrientation parameters are taken into account for positions update
                var positionFunction = function (positions) {
                    var minlg = pathArray[0].length;
                    var i = 0;
                    var ns = (instance.sideOrientation === BABYLON.Mesh.DOUBLESIDE) ? 2 : 1;
                    for (var si = 1; si <= ns; si++) {
                        for (var p = 0; p < pathArray.length; p++) {
                            var path = pathArray[p];
                            var l = path.length;
                            minlg = (minlg < l) ? minlg : l;
                            var j = 0;
                            while (j < minlg) {
                                positions[i] = path[j].x;
                                positions[i + 1] = path[j].y;
                                positions[i + 2] = path[j].z;
                                j++;
                                i += 3;
                            }
                            if (instance._closePath) {
                                positions[i] = path[0].x;
                                positions[i + 1] = path[0].y;
                                positions[i + 2] = path[0].z;
                                i += 3;
                            }
                        }
                    }
                };
                var positions = instance.getVerticesData(BABYLON.VertexBuffer.PositionKind);
                positionFunction(positions);
                instance.updateVerticesData(BABYLON.VertexBuffer.PositionKind, positions, false, false);
                if (!(instance.areNormalsFrozen)) {
                    var indices = instance.getIndices();
                    var normals = instance.getVerticesData(BABYLON.VertexBuffer.NormalKind);
                    BABYLON.VertexData.ComputeNormals(positions, indices, normals);
                    if (instance._closePath) {
                        var indexFirst = 0;
                        var indexLast = 0;
                        for (var p = 0; p < pathArray.length; p++) {
                            indexFirst = instance._idx[p] * 3;
                            if (p + 1 < pathArray.length) {
                                indexLast = (instance._idx[p + 1] - 1) * 3;
                            }
                            else {
                                indexLast = normals.length - 3;
                            }
                            normals[indexFirst] = (normals[indexFirst] + normals[indexLast]) * 0.5;
                            normals[indexFirst + 1] = (normals[indexFirst + 1] + normals[indexLast + 1]) * 0.5;
                            normals[indexFirst + 2] = (normals[indexFirst + 2] + normals[indexLast + 2]) * 0.5;
                            normals[indexLast] = normals[indexFirst];
                            normals[indexLast + 1] = normals[indexFirst + 1];
                            normals[indexLast + 2] = normals[indexFirst + 2];
                        }
                    }
                    instance.updateVerticesData(BABYLON.VertexBuffer.NormalKind, normals, false, false);
                }
                return instance;
            }
            else {
                var ribbon = new BABYLON.Mesh(name, scene);
                ribbon.sideOrientation = sideOrientation;
                var vertexData = BABYLON.VertexData.CreateRibbon(options);
                if (closePath) {
                    ribbon._idx = vertexData._idx;
                }
                ribbon._closePath = closePath;
                ribbon._closeArray = closeArray;
                vertexData.applyToMesh(ribbon, updatable);
                return ribbon;
            }
        };
        MeshBuilder.CreateCylinder = function (name, options, scene) {
            var cylinder = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateCylinder(options);
            vertexData.applyToMesh(cylinder, options.updatable);
            return cylinder;
        };
        return MeshBuilder;
    })();
    BABYLON.MeshBuilder = MeshBuilder;
})(BABYLON || (BABYLON = {}));
