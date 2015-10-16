module BABYLON {
    export class MeshBuilder {
        public static CreateBox(name: string, options: { width?: number, height?: number, depth?: number, faceUV?: Vector4[], faceColors?: Color4[], sideOrientation?: number, updatable?: boolean }, scene: Scene): Mesh {
            var box = new Mesh(name, scene);
            var vertexData = VertexData.CreateBox(options);

            vertexData.applyToMesh(box, options.updatable);

            return box;
        }

        public static CreateSphere(name: string, options: { segments?: number, diameter?: number, diameterX?: number, diameterY?: number, diameterZ?: number, arc?: number, slice?: number, sideOrientation?: number, updatable?: boolean }, scene: any): Mesh {
            var sphere = new Mesh(name, scene);
            var vertexData = VertexData.CreateSphere(options);

            vertexData.applyToMesh(sphere, options.updatable);

            return sphere;
        }

        public static CreateDisc(name: string, options: { radius: number, tessellation: number, updatable?: boolean, sideOrientation?: number }, scene: Scene): Mesh {

            var disc = new Mesh(name, scene);
            var vertexData = VertexData.CreateDisc(options);

            vertexData.applyToMesh(disc, options.updatable);

            return disc;
        }

        public static CreateRibbon(name: string, options: { pathArray: Vector3[][], closeArray?: boolean, closePath?: boolean, offset?: number, updatable?: boolean, sideOrientation?: number, instance?: Mesh }, scene?: Scene): Mesh {
            var pathArray = options.pathArray;
            var closeArray = options.closeArray;
            var closePath = options.closePath;
            var offset = options.offset;
            var sideOrientation = options.sideOrientation;
            var instance = options.instance;
            var updatable = options.updatable;

            if (instance) {   // existing ribbon instance update
                // positionFunction : ribbon case
                // only pathArray and sideOrientation parameters are taken into account for positions update
                var positionFunction = positions => {
                    var minlg = pathArray[0].length;
                    var i = 0;
                    var ns = (instance.sideOrientation === Mesh.DOUBLESIDE) ? 2 : 1;
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
                            if ((<any>instance)._closePath) {
                                positions[i] = path[0].x;
                                positions[i + 1] = path[0].y;
                                positions[i + 2] = path[0].z;
                                i += 3;
                            }
                        }
                    }
                };
                var positions = instance.getVerticesData(VertexBuffer.PositionKind);
                positionFunction(positions);
                instance.updateVerticesData(VertexBuffer.PositionKind, positions, false, false);
                if (!(instance.areNormalsFrozen)) {
                    var indices = instance.getIndices();
                    var normals = instance.getVerticesData(VertexBuffer.NormalKind);
                    VertexData.ComputeNormals(positions, indices, normals);

                    if ((<any>instance)._closePath) {
                        var indexFirst: number = 0;
                        var indexLast: number = 0;
                        for (var p = 0; p < pathArray.length; p++) {
                            indexFirst = (<any>instance)._idx[p] * 3;
                            if (p + 1 < pathArray.length) {
                                indexLast = ((<any>instance)._idx[p + 1] - 1) * 3;
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

                    instance.updateVerticesData(VertexBuffer.NormalKind, normals, false, false);
                }

                return instance;
            }
            else {  // new ribbon creation

                var ribbon = new Mesh(name, scene);
                ribbon.sideOrientation = sideOrientation;

                var vertexData = VertexData.CreateRibbon(options);
                if (closePath) {
                    (<any>ribbon)._idx = (<any>vertexData)._idx;
                }
                (<any>ribbon)._closePath = closePath;
                (<any>ribbon)._closeArray = closeArray;

                vertexData.applyToMesh(ribbon, updatable);

                return ribbon;
            }
        }

        public static CreateCylinder(name: string, options: { height?: number, diameterTop?: number, diameterBottom?: number, diameter?: number, tessellation?: number, subdivisions?: number, arc?: number, faceColors?: Color4[], faceUV?: Vector4[], updatable?: boolean, sideOrientation?: number }, scene: any): Mesh {
            var cylinder = new Mesh(name, scene);
            var vertexData = VertexData.CreateCylinder(options);

            vertexData.applyToMesh(cylinder, options.updatable);

            return cylinder;
        }

        public static CreateTorus(name: string, options: { diameter?: number, thickness?: number, tessellation?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh {
            var torus = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorus(options);

            vertexData.applyToMesh(torus, options.updatable);

            return torus;
        }

        public static CreateTorusKnot(name: string, options: { radius?: number, tube?: number, radialSegments?: number, tubularSegments?: number, p?: number, q?: number, updatable?: boolean, sideOrientation?: number }, scene: any): Mesh {
            var torusKnot = new Mesh(name, scene);
            var vertexData = VertexData.CreateTorusKnot(options);

            vertexData.applyToMesh(torusKnot, options.updatable);

            return torusKnot;
        }

        public static CreateLines(name: string, options: { points: Vector3[], updatable?: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh {
            var instance = options.instance;
            var points = options.points;

            if (instance) { // lines update
                var positionFunction = positions => {
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
            var lines = new LinesMesh(name, scene);
            var vertexData = VertexData.CreateLines(options);
            vertexData.applyToMesh(lines, options.updatable);
            return lines;
        }

        public static CreateDashedLines(name: string, options: { points: Vector3[], dashSize?: number, gapSize?: number, dashNb?: number, updatable?: boolean, instance?: LinesMesh }, scene: Scene): LinesMesh {
            var points = options.points;
            var instance = options.instance;
            var gapSize = options.gapSize;
            var dashNb = options.dashNb;
            var dashSize = options.dashSize;

            if (instance) {  //  dashed lines update
                var positionFunction = (positions: number[]): void => {
                    var curvect = Vector3.Zero();
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
                    dashshft = (<any>instance).dashSize * shft / ((<any>instance).dashSize + (<any>instance).gapSize);
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
            var dashedLines = new LinesMesh(name, scene);
            var vertexData = VertexData.CreateDashedLines(options);
            vertexData.applyToMesh(dashedLines, options.updatable);
            (<any>dashedLines).dashSize = dashSize;
            (<any>dashedLines).gapSize = gapSize;
            return dashedLines;
        }
    }
}