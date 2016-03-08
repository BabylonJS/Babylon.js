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
        MeshBuilder.CreateIcoSphere = function (name, options, scene) {
            var sphere = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateIcoSphere(options);
            vertexData.applyToMesh(sphere, options.updatable);
            return sphere;
        };
        ;
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
        MeshBuilder.CreateLineSystem = function (name, options, scene) {
            var instance = options.instance;
            var lines = options.lines;
            if (instance) {
                var positionFunction = function (positions) {
                    var i = 0;
                    for (var l = 0; l < lines.length; l++) {
                        var points = lines[l];
                        for (var p = 0; p < points.length; p++) {
                            positions[i] = points[p].x;
                            positions[i + 1] = points[p].y;
                            positions[i + 2] = points[p].z;
                            i += 3;
                        }
                    }
                };
                instance.updateMeshPositions(positionFunction, false);
                return instance;
            }
            // line system creation
            var lineSystem = new BABYLON.LinesMesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateLineSystem(options);
            vertexData.applyToMesh(lineSystem, options.updatable);
            return lineSystem;
        };
        MeshBuilder.CreateLines = function (name, options, scene) {
            var lines = MeshBuilder.CreateLineSystem(name, { lines: [options.points], updatable: options.updatable, instance: options.instance }, scene);
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
        MeshBuilder.ExtrudeShape = function (name, options, scene) {
            var path = options.path;
            var shape = options.shape;
            var scale = options.scale || 1;
            var rotation = options.rotation || 0;
            var cap = (options.cap === 0) ? 0 : options.cap || BABYLON.Mesh.NO_CAP;
            var updatable = options.updatable;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var instance = options.instance;
            return MeshBuilder._ExtrudeShapeGeneric(name, shape, path, scale, rotation, null, null, false, false, cap, false, scene, updatable, sideOrientation, instance);
        };
        MeshBuilder.ExtrudeShapeCustom = function (name, options, scene) {
            var path = options.path;
            var shape = options.shape;
            var scaleFunction = options.scaleFunction || (function () { return 1; });
            var rotationFunction = options.rotationFunction || (function () { return 0; });
            var ribbonCloseArray = options.ribbonCloseArray || false;
            var ribbonClosePath = options.ribbonClosePath || false;
            var cap = (options.cap === 0) ? 0 : options.cap || BABYLON.Mesh.NO_CAP;
            var updatable = options.updatable;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var instance = options.instance;
            return MeshBuilder._ExtrudeShapeGeneric(name, shape, path, null, null, scaleFunction, rotationFunction, ribbonCloseArray, ribbonClosePath, cap, true, scene, updatable, sideOrientation, instance);
        };
        MeshBuilder.CreateLathe = function (name, options, scene) {
            var arc = (options.arc <= 0 || options.arc > 1) ? 1.0 : options.arc || 1.0;
            var closed = (options.closed === undefined) ? true : options.closed;
            var shape = options.shape;
            var radius = options.radius || 1;
            var tessellation = options.tessellation || 64;
            var updatable = options.updatable;
            var sideOrientation = (options.sideOrientation === 0) ? 0 : options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var cap = options.cap || BABYLON.Mesh.NO_CAP;
            var pi2 = Math.PI * 2;
            var paths = new Array();
            var i = 0;
            var p = 0;
            var step = pi2 / tessellation * arc;
            var rotated;
            var path = new Array();
            ;
            for (i = 0; i <= tessellation; i++) {
                var path = [];
                if (cap == BABYLON.Mesh.CAP_START || cap == BABYLON.Mesh.CAP_ALL) {
                    path.push(new BABYLON.Vector3(0, shape[0].y, 0));
                    path.push(new BABYLON.Vector3(Math.cos(i * step) * shape[0].x * radius, shape[0].y, Math.sin(i * step) * shape[0].x * radius));
                }
                for (p = 0; p < shape.length; p++) {
                    rotated = new BABYLON.Vector3(Math.cos(i * step) * shape[p].x * radius, shape[p].y, Math.sin(i * step) * shape[p].x * radius);
                    path.push(rotated);
                }
                if (cap == BABYLON.Mesh.CAP_END || cap == BABYLON.Mesh.CAP_ALL) {
                    path.push(new BABYLON.Vector3(Math.cos(i * step) * shape[shape.length - 1].x * radius, shape[shape.length - 1].y, Math.sin(i * step) * shape[shape.length - 1].x * radius));
                    path.push(new BABYLON.Vector3(0, shape[shape.length - 1].y, 0));
                }
                paths.push(path);
            }
            // lathe ribbon
            var lathe = MeshBuilder.CreateRibbon(name, { pathArray: paths, closeArray: closed, sideOrientation: sideOrientation, updatable: updatable }, scene);
            return lathe;
        };
        MeshBuilder.CreatePlane = function (name, options, scene) {
            var plane = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePlane(options);
            vertexData.applyToMesh(plane, options.updatable);
            if (options.sourcePlane) {
                plane.translate(options.sourcePlane.normal, options.sourcePlane.d);
                var product = Math.acos(BABYLON.Vector3.Dot(options.sourcePlane.normal, BABYLON.Axis.Z));
                var vectorProduct = BABYLON.Vector3.Cross(BABYLON.Axis.Z, options.sourcePlane.normal);
                plane.rotate(vectorProduct, product);
            }
            return plane;
        };
        MeshBuilder.CreateGround = function (name, options, scene) {
            var ground = new BABYLON.GroundMesh(name, scene);
            ground._setReady(false);
            ground._subdivisions = options.subdivisions || 1;
            ground._width = options.width || 1;
            ground._height = options.height || 1;
            ground._maxX = ground._width / 2;
            ground._maxZ = ground._height / 2;
            ground._minX = -ground._maxX;
            ground._minZ = -ground._maxZ;
            var vertexData = BABYLON.VertexData.CreateGround(options);
            vertexData.applyToMesh(ground, options.updatable);
            ground._setReady(true);
            return ground;
        };
        MeshBuilder.CreateTiledGround = function (name, options, scene) {
            var tiledGround = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreateTiledGround(options);
            vertexData.applyToMesh(tiledGround, options.updatable);
            return tiledGround;
        };
        MeshBuilder.CreateGroundFromHeightMap = function (name, url, options, scene) {
            var width = options.width || 10;
            var height = options.height || 10;
            var subdivisions = options.subdivisions || 1;
            var minHeight = options.minHeight;
            var maxHeight = options.maxHeight || 10;
            var updatable = options.updatable;
            var onReady = options.onReady;
            var ground = new BABYLON.GroundMesh(name, scene);
            ground._subdivisions = subdivisions;
            ground._width = width;
            ground._height = height;
            ground._maxX = ground._width / 2;
            ground._maxZ = ground._height / 2;
            ground._minX = -ground._maxX;
            ground._minZ = -ground._maxZ;
            ground._setReady(false);
            var onload = function (img) {
                // Getting height map data
                var canvas = document.createElement("canvas");
                var context = canvas.getContext("2d");
                var bufferWidth = img.width;
                var bufferHeight = img.height;
                canvas.width = bufferWidth;
                canvas.height = bufferHeight;
                context.drawImage(img, 0, 0);
                // Create VertexData from map data
                // Cast is due to wrong definition in lib.d.ts from ts 1.3 - https://github.com/Microsoft/TypeScript/issues/949
                var buffer = context.getImageData(0, 0, bufferWidth, bufferHeight).data;
                var vertexData = BABYLON.VertexData.CreateGroundFromHeightMap({
                    width: width, height: height,
                    subdivisions: subdivisions,
                    minHeight: minHeight, maxHeight: maxHeight,
                    buffer: buffer, bufferWidth: bufferWidth, bufferHeight: bufferHeight
                });
                vertexData.applyToMesh(ground, updatable);
                ground._setReady(true);
                //execute ready callback, if set
                if (onReady) {
                    onReady(ground);
                }
            };
            BABYLON.Tools.LoadImage(url, onload, function () { }, scene.database);
            return ground;
        };
        MeshBuilder.CreateTube = function (name, options, scene) {
            var path = options.path;
            var radius = options.radius || 1;
            var tessellation = options.tessellation || 64;
            var radiusFunction = options.radiusFunction;
            var cap = options.cap || BABYLON.Mesh.NO_CAP;
            var updatable = options.updatable;
            var sideOrientation = options.sideOrientation || BABYLON.Mesh.DEFAULTSIDE;
            var instance = options.instance;
            options.arc = (options.arc <= 0 || options.arc > 1) ? 1 : options.arc || 1;
            // tube geometry
            var tubePathArray = function (path, path3D, circlePaths, radius, tessellation, radiusFunction, cap, arc) {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var distances = path3D.getDistances();
                var pi2 = Math.PI * 2;
                var step = pi2 / tessellation * arc;
                var returnRadius = function () { return radius; };
                var radiusFunctionFinal = radiusFunction || returnRadius;
                var circlePath;
                var rad;
                var normal;
                var rotated;
                var rotationMatrix = BABYLON.Tmp.Matrix[0];
                var index = (cap === BABYLON.Mesh._NO_CAP || cap === BABYLON.Mesh.CAP_END) ? 0 : 2;
                for (var i = 0; i < path.length; i++) {
                    rad = radiusFunctionFinal(i, distances[i]); // current radius
                    circlePath = Array(); // current circle array
                    normal = normals[i]; // current normal
                    for (var t = 0; t < tessellation; t++) {
                        BABYLON.Matrix.RotationAxisToRef(tangents[i], step * t, rotationMatrix);
                        rotated = circlePath[t] ? circlePath[t] : BABYLON.Vector3.Zero();
                        BABYLON.Vector3.TransformCoordinatesToRef(normal, rotationMatrix, rotated);
                        rotated.scaleInPlace(rad).addInPlace(path[i]);
                        circlePath[t] = rotated;
                    }
                    circlePaths[index] = circlePath;
                    index++;
                }
                // cap
                var capPath = function (nbPoints, pathIndex) {
                    var pointCap = Array();
                    for (var i = 0; i < nbPoints; i++) {
                        pointCap.push(path[pathIndex]);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case BABYLON.Mesh.NO_CAP:
                        break;
                    case BABYLON.Mesh.CAP_START:
                        circlePaths[0] = capPath(tessellation, 0);
                        circlePaths[1] = circlePaths[2].slice(0);
                        break;
                    case BABYLON.Mesh.CAP_END:
                        circlePaths[index] = circlePaths[index - 1].slice(0);
                        circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                        break;
                    case BABYLON.Mesh.CAP_ALL:
                        circlePaths[0] = capPath(tessellation, 0);
                        circlePaths[1] = circlePaths[2].slice(0);
                        circlePaths[index] = circlePaths[index - 1].slice(0);
                        circlePaths[index + 1] = capPath(tessellation, path.length - 1);
                        break;
                    default:
                        break;
                }
                return circlePaths;
            };
            var path3D;
            var pathArray;
            if (instance) {
                var arc = options.arc || instance.arc;
                path3D = (instance.path3D).update(path);
                pathArray = tubePathArray(path, path3D, instance.pathArray, radius, instance.tessellation, radiusFunction, instance.cap, arc);
                instance = MeshBuilder.CreateRibbon(null, { pathArray: pathArray, instance: instance });
                instance.path3D = path3D;
                instance.pathArray = pathArray;
                instance.arc = arc;
                return instance;
            }
            // tube creation
            path3D = new BABYLON.Path3D(path);
            var newPathArray = new Array();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = tubePathArray(path, path3D, newPathArray, radius, tessellation, radiusFunction, cap, options.arc);
            var tube = MeshBuilder.CreateRibbon(name, { pathArray: pathArray, closePath: true, closeArray: false, updatable: updatable, sideOrientation: sideOrientation }, scene);
            tube.pathArray = pathArray;
            tube.path3D = path3D;
            tube.tessellation = tessellation;
            tube.cap = cap;
            tube.arc = options.arc;
            return tube;
        };
        MeshBuilder.CreatePolyhedron = function (name, options, scene) {
            var polyhedron = new BABYLON.Mesh(name, scene);
            var vertexData = BABYLON.VertexData.CreatePolyhedron(options);
            vertexData.applyToMesh(polyhedron, options.updatable);
            return polyhedron;
        };
        MeshBuilder.CreateDecal = function (name, sourceMesh, options) {
            var indices = sourceMesh.getIndices();
            var positions = sourceMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var normals = sourceMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var position = options.position || BABYLON.Vector3.Zero();
            var normal = options.normal || BABYLON.Vector3.Up();
            var size = options.size || new BABYLON.Vector3(1, 1, 1);
            var angle = options.angle || 0;
            // Getting correct rotation
            if (!normal) {
                var target = new BABYLON.Vector3(0, 0, 1);
                var camera = sourceMesh.getScene().activeCamera;
                var cameraWorldTarget = BABYLON.Vector3.TransformCoordinates(target, camera.getWorldMatrix());
                normal = camera.globalPosition.subtract(cameraWorldTarget);
            }
            var yaw = -Math.atan2(normal.z, normal.x) - Math.PI / 2;
            var len = Math.sqrt(normal.x * normal.x + normal.z * normal.z);
            var pitch = Math.atan2(normal.y, len);
            // Matrix
            var decalWorldMatrix = BABYLON.Matrix.RotationYawPitchRoll(yaw, pitch, angle).multiply(BABYLON.Matrix.Translation(position.x, position.y, position.z));
            var inverseDecalWorldMatrix = BABYLON.Matrix.Invert(decalWorldMatrix);
            var meshWorldMatrix = sourceMesh.getWorldMatrix();
            var transformMatrix = meshWorldMatrix.multiply(inverseDecalWorldMatrix);
            var vertexData = new BABYLON.VertexData();
            vertexData.indices = [];
            vertexData.positions = [];
            vertexData.normals = [];
            vertexData.uvs = [];
            var currentVertexDataIndex = 0;
            var extractDecalVector3 = function (indexId) {
                var vertexId = indices[indexId];
                var result = new BABYLON.PositionNormalVertex();
                result.position = new BABYLON.Vector3(positions[vertexId * 3], positions[vertexId * 3 + 1], positions[vertexId * 3 + 2]);
                // Send vector to decal local world
                result.position = BABYLON.Vector3.TransformCoordinates(result.position, transformMatrix);
                // Get normal
                result.normal = new BABYLON.Vector3(normals[vertexId * 3], normals[vertexId * 3 + 1], normals[vertexId * 3 + 2]);
                return result;
            }; // Inspired by https://github.com/mrdoob/three.js/blob/eee231960882f6f3b6113405f524956145148146/examples/js/geometries/DecalGeometry.js
            var clip = function (vertices, axis) {
                if (vertices.length === 0) {
                    return vertices;
                }
                var clipSize = 0.5 * Math.abs(BABYLON.Vector3.Dot(size, axis));
                var clipVertices = function (v0, v1) {
                    var clipFactor = BABYLON.Vector3.GetClipFactor(v0.position, v1.position, axis, clipSize);
                    return new BABYLON.PositionNormalVertex(BABYLON.Vector3.Lerp(v0.position, v1.position, clipFactor), BABYLON.Vector3.Lerp(v0.normal, v1.normal, clipFactor));
                };
                var result = new Array();
                for (var index = 0; index < vertices.length; index += 3) {
                    var v1Out;
                    var v2Out;
                    var v3Out;
                    var total = 0;
                    var nV1, nV2, nV3, nV4;
                    var d1 = BABYLON.Vector3.Dot(vertices[index].position, axis) - clipSize;
                    var d2 = BABYLON.Vector3.Dot(vertices[index + 1].position, axis) - clipSize;
                    var d3 = BABYLON.Vector3.Dot(vertices[index + 2].position, axis) - clipSize;
                    v1Out = d1 > 0;
                    v2Out = d2 > 0;
                    v3Out = d3 > 0;
                    total = (v1Out ? 1 : 0) + (v2Out ? 1 : 0) + (v3Out ? 1 : 0);
                    switch (total) {
                        case 0:
                            result.push(vertices[index]);
                            result.push(vertices[index + 1]);
                            result.push(vertices[index + 2]);
                            break;
                        case 1:
                            if (v1Out) {
                                nV1 = vertices[index + 1];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index], nV1);
                                nV4 = clipVertices(vertices[index], nV2);
                            }
                            if (v2Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 2];
                                nV3 = clipVertices(vertices[index + 1], nV1);
                                nV4 = clipVertices(vertices[index + 1], nV2);
                                result.push(nV3);
                                result.push(nV2.clone());
                                result.push(nV1.clone());
                                result.push(nV2.clone());
                                result.push(nV3.clone());
                                result.push(nV4);
                                break;
                            }
                            if (v3Out) {
                                nV1 = vertices[index];
                                nV2 = vertices[index + 1];
                                nV3 = clipVertices(vertices[index + 2], nV1);
                                nV4 = clipVertices(vertices[index + 2], nV2);
                            }
                            result.push(nV1.clone());
                            result.push(nV2.clone());
                            result.push(nV3);
                            result.push(nV4);
                            result.push(nV3.clone());
                            result.push(nV2.clone());
                            break;
                        case 2:
                            if (!v1Out) {
                                nV1 = vertices[index].clone();
                                nV2 = clipVertices(nV1, vertices[index + 1]);
                                nV3 = clipVertices(nV1, vertices[index + 2]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v2Out) {
                                nV1 = vertices[index + 1].clone();
                                nV2 = clipVertices(nV1, vertices[index + 2]);
                                nV3 = clipVertices(nV1, vertices[index]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            if (!v3Out) {
                                nV1 = vertices[index + 2].clone();
                                nV2 = clipVertices(nV1, vertices[index]);
                                nV3 = clipVertices(nV1, vertices[index + 1]);
                                result.push(nV1);
                                result.push(nV2);
                                result.push(nV3);
                            }
                            break;
                        case 3:
                            break;
                    }
                }
                return result;
            };
            for (var index = 0; index < indices.length; index += 3) {
                var faceVertices = new Array();
                faceVertices.push(extractDecalVector3(index));
                faceVertices.push(extractDecalVector3(index + 1));
                faceVertices.push(extractDecalVector3(index + 2));
                // Clip
                faceVertices = clip(faceVertices, new BABYLON.Vector3(1, 0, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(-1, 0, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, 1, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, -1, 0));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, 0, 1));
                faceVertices = clip(faceVertices, new BABYLON.Vector3(0, 0, -1));
                if (faceVertices.length === 0) {
                    continue;
                }
                // Add UVs and get back to world
                for (var vIndex = 0; vIndex < faceVertices.length; vIndex++) {
                    var vertex = faceVertices[vIndex];
                    //TODO check for Int32Array
                    vertexData.indices.push(currentVertexDataIndex);
                    vertex.position.toArray(vertexData.positions, currentVertexDataIndex * 3);
                    vertex.normal.toArray(vertexData.normals, currentVertexDataIndex * 3);
                    vertexData.uvs.push(0.5 + vertex.position.x / size.x);
                    vertexData.uvs.push(0.5 + vertex.position.y / size.y);
                    currentVertexDataIndex++;
                }
            }
            // Return mesh
            var decal = new BABYLON.Mesh(name, sourceMesh.getScene());
            vertexData.applyToMesh(decal);
            decal.position = position.clone();
            decal.rotation = new BABYLON.Vector3(pitch, yaw, angle);
            return decal;
        };
        // Privates
        MeshBuilder._ExtrudeShapeGeneric = function (name, shape, curve, scale, rotation, scaleFunction, rotateFunction, rbCA, rbCP, cap, custom, scene, updtbl, side, instance) {
            // extrusion geometry
            var extrusionPathArray = function (shape, curve, path3D, shapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom) {
                var tangents = path3D.getTangents();
                var normals = path3D.getNormals();
                var binormals = path3D.getBinormals();
                var distances = path3D.getDistances();
                var angle = 0;
                var returnScale = function () { return scale; };
                var returnRotation = function () { return rotation; };
                var rotate = custom ? rotateFunction : returnRotation;
                var scl = custom ? scaleFunction : returnScale;
                var index = (cap === BABYLON.Mesh.NO_CAP || cap === BABYLON.Mesh.CAP_END) ? 0 : 2;
                var rotationMatrix = BABYLON.Tmp.Matrix[0];
                for (var i = 0; i < curve.length; i++) {
                    var shapePath = new Array();
                    var angleStep = rotate(i, distances[i]);
                    var scaleRatio = scl(i, distances[i]);
                    for (var p = 0; p < shape.length; p++) {
                        BABYLON.Matrix.RotationAxisToRef(tangents[i], angle, rotationMatrix);
                        var planed = ((tangents[i].scale(shape[p].z)).add(normals[i].scale(shape[p].x)).add(binormals[i].scale(shape[p].y)));
                        var rotated = shapePath[p] ? shapePath[p] : BABYLON.Vector3.Zero();
                        BABYLON.Vector3.TransformCoordinatesToRef(planed, rotationMatrix, rotated);
                        rotated.scaleInPlace(scaleRatio).addInPlace(curve[i]);
                        shapePath[p] = rotated;
                    }
                    shapePaths[index] = shapePath;
                    angle += angleStep;
                    index++;
                }
                // cap
                var capPath = function (shapePath) {
                    var pointCap = Array();
                    var barycenter = BABYLON.Vector3.Zero();
                    var i;
                    for (i = 0; i < shapePath.length; i++) {
                        barycenter.addInPlace(shapePath[i]);
                    }
                    barycenter.scaleInPlace(1 / shapePath.length);
                    for (i = 0; i < shapePath.length; i++) {
                        pointCap.push(barycenter);
                    }
                    return pointCap;
                };
                switch (cap) {
                    case BABYLON.Mesh.NO_CAP:
                        break;
                    case BABYLON.Mesh.CAP_START:
                        shapePaths[0] = capPath(shapePaths[2]);
                        shapePaths[1] = shapePaths[2].slice(0);
                        break;
                    case BABYLON.Mesh.CAP_END:
                        shapePaths[index] = shapePaths[index - 1];
                        shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                        break;
                    case BABYLON.Mesh.CAP_ALL:
                        shapePaths[0] = capPath(shapePaths[2]);
                        shapePaths[1] = shapePaths[2].slice(0);
                        shapePaths[index] = shapePaths[index - 1];
                        shapePaths[index + 1] = capPath(shapePaths[index - 1]);
                        break;
                    default:
                        break;
                }
                return shapePaths;
            };
            var path3D;
            var pathArray;
            if (instance) {
                path3D = (instance.path3D).update(curve);
                pathArray = extrusionPathArray(shape, curve, instance.path3D, instance.pathArray, scale, rotation, scaleFunction, rotateFunction, instance.cap, custom);
                instance = BABYLON.Mesh.CreateRibbon(null, pathArray, null, null, null, null, null, null, instance);
                return instance;
            }
            // extruded shape creation
            path3D = new BABYLON.Path3D(curve);
            var newShapePaths = new Array();
            cap = (cap < 0 || cap > 3) ? 0 : cap;
            pathArray = extrusionPathArray(shape, curve, path3D, newShapePaths, scale, rotation, scaleFunction, rotateFunction, cap, custom);
            var extrudedGeneric = BABYLON.Mesh.CreateRibbon(name, pathArray, rbCA, rbCP, 0, scene, updtbl, side);
            extrudedGeneric.pathArray = pathArray;
            extrudedGeneric.path3D = path3D;
            extrudedGeneric.cap = cap;
            return extrudedGeneric;
        };
        return MeshBuilder;
    }());
    BABYLON.MeshBuilder = MeshBuilder;
})(BABYLON || (BABYLON = {}));
