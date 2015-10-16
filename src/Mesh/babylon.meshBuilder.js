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
        MeshBuilder.CreateTorus = function (name, options, scene) {
            var torus = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorus(options);
            vertexData.applyToMesh(torus, options.updatable);
            return torus;
        };
        MeshBuilder.CreateTorusKnot = function (name, options, scene) {
            var torusKnot = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTorusKnot(options);
            vertexData.applyToMesh(torusKnot, options.updatable);
            return torusKnot;
        };
        MeshBuilder.CreateLines = function (name, options, scene) {
            var instance = options.instance;
            var points = options.points;
            if (instance) {
                var positionFunction = function (positions) {
                    var i = 0;
                    for (var p = 0; p < points.length; p++) {
                        positions[i] = points[p].x;
                        positions[i + 1] = points[p].y;
                        positions[i + 2] = points[p].z;
                        i += 3;
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }
            // lines creation
            var lines = new BABYLON.LinesMesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateLines(options);
            vertexData.applyToMesh(lines, options.updatable);
            return lines;
        };
        MeshBuilder.CreateDashedLines = function (name, options, scene) {
            var points = options.points;
            var instance = options.instance;
            var gapSize = options.gapSize;
            var dashNb = options.dashNb;
            var dashSize = options.dashSize;
            if (instance) {
                var positionFunction = function (positions) {
                    var curvect = BABYLON.Vector3.Zero();
                    var nbSeg = positions.length / 6;
                    var lg = 0;
                    var nb = 0;
                    var shft = 0;
                    var dashshft = 0;
                    var curshft = 0;
                    var p = 0;
                    var i = 0;
                    var j = 0;
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        lg += curvect.length();
                    }
                    shft = lg / nbSeg;
                    dashshft = instance.dashSize * shft / (instance.dashSize + instance.gapSize);
                    for (i = 0; i < points.length - 1; i++) {
                        points[i + 1].subtractToRef(points[i], curvect);
                        nb = Math.floor(curvect.length() / shft);
                        curvect.normalize();
                        j = 0;
                        while (j < nb && p < positions.length) {
                            curshft = shft * j;
                            positions[p] = points[i].x + curshft * curvect.x;
                            positions[p + 1] = points[i].y + curshft * curvect.y;
                            positions[p + 2] = points[i].z + curshft * curvect.z;
                            positions[p + 3] = points[i].x + (curshft + dashshft) * curvect.x;
                            positions[p + 4] = points[i].y + (curshft + dashshft) * curvect.y;
                            positions[p + 5] = points[i].z + (curshft + dashshft) * curvect.z;
                            p += 6;
                            j++;
                        }
                    }
                    while (p < positions.length) {
                        positions[p] = points[i].x;
                        positions[p + 1] = points[i].y;
                        positions[p + 2] = points[i].z;
                        p += 3;
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }
            // dashed lines creation
            var dashedLines = new BABYLON.LinesMesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateDashedLines(options);
            vertexData.applyToMesh(dashedLines, options.updatable);
            dashedLines.dashSize = dashSize;
            dashedLines.gapSize = gapSize;
            return dashedLines;
        };
        return MeshBuilder;
    })();
    BABYLON.MeshBuilder = MeshBuilder;
})(BABYLON || (BABYLON = {}));
