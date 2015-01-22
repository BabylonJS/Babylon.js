module BABYLON {

    /**
     * A simplifier interface for future simplification implementations.
     */
    export interface ISimplifier {
        /**
         * Simplification of a given mesh according to the given settings.
         * Since this requires computation, it is assumed that the function runs async.
         * @param settings The settings of the simplification, including quality and distance
         * @param successCallback A callback that will be called after the mesh was simplified.
         * @param errorCallback in case of an error, this callback will be called. optional.
         */
        simplify(settings: ISimplificationSettings, successCallback: (simplifiedMeshes: Mesh) => void, errorCallback?: () => void): void;
    }


    /**
     * Expected simplification settings.
     * Quality should be between 0 and 1 (1 being 100%, 0 being 0%);
     */
    export interface ISimplificationSettings {
        quality: number;
        distance: number;
    }

    export class SimplificationSettings implements ISimplificationSettings {
        constructor(public quality: number, public distance: number) {
        }
    }

    /**
     * The implemented types of simplification.
     * At the moment only Quadratic Error Decimation is implemented.
     */
    export enum SimplificationType {
        QUADRATIC
    }

    export class DecimationTriangle {
        public normal: Vector3;
        public error: Array<number>;
        public deleted: boolean;
        public isDirty: boolean;
        public borderFactor: number;

        constructor(public vertices: Array<number>) {
            this.error = new Array<number>(4);
            this.deleted = false;
            this.isDirty = false;
            this.borderFactor = 0;
        }
    }

    export class DecimationVertex {
        public q: QuadraticMatrix;
        public isBorder: boolean;

        public triangleStart: number;
        public triangleCount: number;

        //if color is present instead of uvs.
        public color: Color4;

        constructor(public position: Vector3, public normal: Vector3, public uv: Vector2, public id) {
            this.isBorder = true;
            this.q = new QuadraticMatrix();
            this.triangleCount = 0;
            this.triangleStart = 0;
        }
    }

    export class QuadraticMatrix {
        public data: Array<number>;

        constructor(data?: Array<number>) {
            this.data = new Array(10);
            for (var i = 0; i < 10; ++i) {
                if (data && data[i]) {
                    this.data[i] = data[i];
                } else {
                    this.data[i] = 0;
                }
            }
        }

        public det(a11, a12, a13, a21, a22, a23, a31, a32, a33) {
            var det = this.data[a11] * this.data[a22] * this.data[a33] + this.data[a13] * this.data[a21] * this.data[a32] +
                this.data[a12] * this.data[a23] * this.data[a31] - this.data[a13] * this.data[a22] * this.data[a31] -
                this.data[a11] * this.data[a23] * this.data[a32] - this.data[a12] * this.data[a21] * this.data[a33];
            return det;
        }

        public addInPlace(matrix: QuadraticMatrix) {
            for (var i = 0; i < 10; ++i) {
                this.data[i] += matrix.data[i];
            }
        }

        public addArrayInPlace(data: Array<number>) {
            for (var i = 0; i < 10; ++i) {
                this.data[i] += data[i];
            }
        }

        public add(matrix: QuadraticMatrix): QuadraticMatrix {
            var m = new QuadraticMatrix();
            for (var i = 0; i < 10; ++i) {
                m.data[i] = this.data[i] + matrix.data[i];
            }
            return m;
        }

        public static FromData(a: number, b: number, c: number, d: number): QuadraticMatrix {
            return new QuadraticMatrix(QuadraticMatrix.DataFromNumbers(a, b, c, d));
        }

        //returning an array to avoid garbage collection
        public static DataFromNumbers(a: number, b: number, c: number, d: number) {
            return [a * a, a * b, a * c, a * d, b * b, b * c, b * d, c * c, c * d, d * d];
        }
    }

    export class Reference {
        constructor(public vertexId: number, public triangleId: number) { }
    }

    /**
     * An implementation of the Quadratic Error simplification algorithm.
     * Original paper : http://www1.cs.columbia.edu/~cs4162/html05s/garland97.pdf
     * Ported mostly from QSlim and http://voxels.blogspot.de/2014/05/quadric-mesh-simplification-with-source.html to babylon JS
     * @author RaananW
     */
    export class QuadraticErrorSimplification implements ISimplifier {

        private triangles: Array<DecimationTriangle>;
        private vertices: Array<DecimationVertex>;
        private references: Array<Reference>;

        private initialised: boolean = false;

        public syncIterations = 5000;

        public aggressiveness: number;
        public decimationIterations: number;

        constructor(private _mesh: Mesh) {
            this.aggressiveness = 7;
            this.decimationIterations = 100;
        }

        public simplify(settings: ISimplificationSettings, successCallback: (simplifiedMeshes: Mesh) => void) {
            this.initWithMesh(this._mesh,() => {
                this.runDecimation(settings, successCallback);
            });
        }

        private runDecimation(settings: ISimplificationSettings, successCallback: (simplifiedMeshes: Mesh) => void) {
            var targetCount = ~~(this.triangles.length * settings.quality);
            var deletedTriangles = 0;

            var triangleCount = this.triangles.length;

            var iterationFunction = (iteration: number, callback) => {
                setTimeout(() => {
                    if (iteration % 5 === 0) {
                        this.updateMesh(iteration === 0);
                    }

                    for (var i = 0; i < this.triangles.length; ++i) {
                        this.triangles[i].isDirty = false;
                    }

                    var threshold = 0.000000001 * Math.pow((iteration + 3), this.aggressiveness);

                    var trianglesIterator = (i) => {
                        var tIdx = ~~(((this.triangles.length / 2) + i) % this.triangles.length);
                        var t = this.triangles[tIdx];
                        if (!t) return;
                        if (t.error[3] > threshold || t.deleted || t.isDirty) { return }
                        for (var j = 0; j < 3; ++j) {
                            if (t.error[j] < threshold) {
                                var deleted0: Array<boolean> = [];
                                var deleted1: Array<boolean> = [];

                                var i0 = t.vertices[j];
                                var i1 = t.vertices[(j + 1) % 3];
                                var v0 = this.vertices[i0];
                                var v1 = this.vertices[i1];

                                if (v0.isBorder !== v1.isBorder) continue;

                                var p = Vector3.Zero();
                                var n = Vector3.Zero();
                                var uv = Vector2.Zero();
                                var color = new Color4(0, 0, 0, 1);

                                this.calculateError(v0, v1, p, n, uv, color);

                                var delTr = [];

                                if (this.isFlipped(v0, i1, p, deleted0, t.borderFactor, delTr)) continue;
                                if (this.isFlipped(v1, i0, p, deleted1, t.borderFactor, delTr)) continue;

                                if (delTr.length == 2 || delTr[0] === delTr[1]) {
                                    continue;
                                }

                                v0.normal = n;
                                if (v0.uv)
                                    v0.uv = uv;
                                else if (v0.color)
                                    v0.color = color;
                                v0.q = v1.q.add(v0.q);

                                if (deleted0.indexOf(true) < 0 || deleted1.indexOf(true) < 0) continue;

                                if (p.equals(v0.position)) continue;
                                v0.position = p;

                                var tStart = this.references.length;

                                deletedTriangles = this.updateTriangles(v0.id, v0, deleted0, deletedTriangles);
                                deletedTriangles = this.updateTriangles(v0.id, v1, deleted1, deletedTriangles);

                                var tCount = this.references.length - tStart;

                                if (tCount <= v0.triangleCount) {
                                    if (tCount) {
                                        for (var c = 0; c < tCount; c++) {
                                            this.references[v0.triangleStart + c] = this.references[tStart + c];
                                        }
                                    }
                                } else {
                                    v0.triangleStart = tStart;
                                }

                                v0.triangleCount = tCount;
                                break;
                            }
                        }
                    };
                    AsyncLoop.SyncAsyncForLoop(this.triangles.length, this.syncIterations, trianglesIterator, callback,() => { return (triangleCount - deletedTriangles <= targetCount) });
                }, 0);
            };

            AsyncLoop.Run(this.decimationIterations,(loop: AsyncLoop) => {
                if (triangleCount - deletedTriangles <= targetCount) loop.breakLoop();
                else {
                    iterationFunction(loop.index,() => {
                        loop.executeNext();
                    });
                }
            },() => {
                    setTimeout(() => {
                        successCallback(this.reconstructMesh());
                    }, 0);
                });
        }

        private initWithMesh(mesh: Mesh, callback: Function) {
            if (!mesh) return;

            this.vertices = [];
            this.triangles = [];

            this._mesh = mesh;
            //It is assumed that a mesh has positions, normals and either uvs or colors.
            var positionData = this._mesh.getVerticesData(VertexBuffer.PositionKind);
            var normalData = this._mesh.getVerticesData(VertexBuffer.NormalKind);
            var uvs = this._mesh.getVerticesData(VertexBuffer.UVKind);
            var colorsData = this._mesh.getVerticesData(VertexBuffer.ColorKind);
            var indices = mesh.getIndices();

            var vertexInit = (i) => {
                var vertex = new DecimationVertex(Vector3.FromArray(positionData, i * 3), Vector3.FromArray(normalData, i * 3), null, i);
                if (this._mesh.isVerticesDataPresent(VertexBuffer.UVKind)) {
                    vertex.uv = Vector2.FromArray(uvs, i * 2);
                } else if (this._mesh.isVerticesDataPresent(VertexBuffer.ColorKind)) {
                    vertex.color = Color4.FromArray(colorsData, i * 4);
                }
                this.vertices.push(vertex);
            };
            var totalVertices = mesh.getTotalVertices();
            AsyncLoop.SyncAsyncForLoop(totalVertices, this.syncIterations, vertexInit,() => {

                var indicesInit = (i) => {
                    var pos = i * 3;
                    var i0 = indices[pos + 0];
                    var i1 = indices[pos + 1];
                    var i2 = indices[pos + 2];
                    var triangle = new DecimationTriangle([this.vertices[i0].id, this.vertices[i1].id, this.vertices[i2].id]);
                    this.triangles.push(triangle);
                };
                AsyncLoop.SyncAsyncForLoop(indices.length / 3, this.syncIterations, indicesInit,() => {
                    this.init(callback);
                });
            });
        }

        private init(callback: Function) {
            var triangleInit1 = (i) => {
                var t = this.triangles[i];
                t.normal = Vector3.Cross(this.vertices[t.vertices[1]].position.subtract(this.vertices[t.vertices[0]].position), this.vertices[t.vertices[2]].position.subtract(this.vertices[t.vertices[0]].position)).normalize();
                for (var j = 0; j < 3; j++) {
                    this.vertices[t.vertices[j]].q.addArrayInPlace(QuadraticMatrix.DataFromNumbers(t.normal.x, t.normal.y, t.normal.z, -(Vector3.Dot(t.normal, this.vertices[t.vertices[0]].position))));
                }
            };
            AsyncLoop.SyncAsyncForLoop(this.triangles.length, this.syncIterations, triangleInit1,() => {

                var triangleInit2 = (i) => {
                    var t = this.triangles[i];
                    for (var j = 0; j < 3; ++j) {
                        t.error[j] = this.calculateError(this.vertices[t.vertices[j]], this.vertices[t.vertices[(j + 1) % 3]]);
                    }
                    t.error[3] = Math.min(t.error[0], t.error[1], t.error[2]);
                };
                AsyncLoop.SyncAsyncForLoop(this.triangles.length, this.syncIterations, triangleInit2,() => {
                    this.initialised = true;
                    callback();
                });
            });
        }

        private reconstructMesh(): Mesh {

            var newTriangles: Array<DecimationTriangle> = [];
            var i: number;
            for (i = 0; i < this.vertices.length; ++i) {
                this.vertices[i].triangleCount = 0;
            }
            var t: DecimationTriangle;
            var j: number;
            for (i = 0; i < this.triangles.length; ++i) {
                if (!this.triangles[i].deleted) {
                    t = this.triangles[i];
                    for (j = 0; j < 3; ++j) {
                        this.vertices[t.vertices[j]].triangleCount = 1;
                    }
                    newTriangles.push(t);
                }
            }

            var newVerticesOrder = [];

            //compact vertices, get the IDs of the vertices used.
            var dst = 0;
            for (i = 0; i < this.vertices.length; ++i) {
                if (this.vertices[i].triangleCount) {
                    this.vertices[i].triangleStart = dst;
                    this.vertices[dst].position = this.vertices[i].position;
                    this.vertices[dst].normal = this.vertices[i].normal;
                    this.vertices[dst].uv = this.vertices[i].uv;
                    this.vertices[dst].color = this.vertices[i].color;
                    newVerticesOrder.push(i);
                    dst++;
                }
            }

            for (i = 0; i < newTriangles.length; ++i) {
                t = newTriangles[i];
                for (j = 0; j < 3; ++j) {
                    t.vertices[j] = this.vertices[t.vertices[j]].triangleStart;
                }
            }
            this.vertices = this.vertices.slice(0, dst);

            var newPositionData = [];
            var newNormalData = [];
            var newUVsData = [];
            var newColorsData = [];

            for (i = 0; i < newVerticesOrder.length; ++i) {
                newPositionData.push(this.vertices[i].position.x);
                newPositionData.push(this.vertices[i].position.y);
                newPositionData.push(this.vertices[i].position.z);
                newNormalData.push(this.vertices[i].normal.x);
                newNormalData.push(this.vertices[i].normal.y);
                newNormalData.push(this.vertices[i].normal.z);
                if (this.vertices[i].uv) {
                    newUVsData.push(this.vertices[i].uv.x);
                    newUVsData.push(this.vertices[i].uv.y);
                } else if (this.vertices[i].color) {
                    newColorsData.push(this.vertices[i].color.r);
                    newColorsData.push(this.vertices[i].color.g);
                    newColorsData.push(this.vertices[i].color.b);
                    newColorsData.push(this.vertices[i].color.a);
                }
            }

            var newIndicesArray: Array<number> = [];
            for (i = 0; i < newTriangles.length; ++i) {
                newIndicesArray.push(newTriangles[i].vertices[0]);
                newIndicesArray.push(newTriangles[i].vertices[1]);
                newIndicesArray.push(newTriangles[i].vertices[2]);
            }

            //not cloning, to avoid geometry problems. Creating a whole new mesh.
            var newMesh = new Mesh(this._mesh.name + "Decimated", this._mesh.getScene());
            newMesh.material = this._mesh.material;
            newMesh.parent = this._mesh.parent;
            newMesh.setIndices(newIndicesArray);
            newMesh.setVerticesData(VertexBuffer.PositionKind, newPositionData);
            newMesh.setVerticesData(VertexBuffer.NormalKind, newNormalData);
            if (newUVsData.length > 0)
                newMesh.setVerticesData(VertexBuffer.UVKind, newUVsData);
            if (newColorsData.length > 0)
                newMesh.setVerticesData(VertexBuffer.ColorKind, newColorsData);

            //preparing the skeleton support
            if (this._mesh.skeleton) {
                //newMesh.skeleton = this._mesh.skeleton.clone("", "");
                //newMesh.getScene().beginAnimation(newMesh.skeleton, 0, 100, true, 1.0);
            }

            return newMesh;
        }

        private isFlipped(vertex1: DecimationVertex, index2: number, point: Vector3, deletedArray: Array<boolean>, borderFactor: number, delTr: Array<DecimationTriangle>): boolean {

            for (var i = 0; i < vertex1.triangleCount; ++i) {
                var t = this.triangles[this.references[vertex1.triangleStart + i].triangleId];
                if (t.deleted) continue;

                var s = this.references[vertex1.triangleStart + i].vertexId;

                var id1 = t.vertices[(s + 1) % 3];
                var id2 = t.vertices[(s + 2) % 3];

                if ((id1 === index2 || id2 === index2) && borderFactor < 2) {
                    deletedArray[i] = true;
                    delTr.push(t);
                    continue;
                }

                var d1 = this.vertices[id1].position.subtract(point);
                d1 = d1.normalize();
                var d2 = this.vertices[id2].position.subtract(point);
                d2 = d2.normalize();
                if (Math.abs(Vector3.Dot(d1, d2)) > 0.999) return true;
                var normal = Vector3.Cross(d1, d2).normalize();
                deletedArray[i] = false;
                if (Vector3.Dot(normal, t.normal) < 0.2) return true;
            }

            return false;
        }

        private updateTriangles(vertexId: number, vertex: DecimationVertex, deletedArray: Array<boolean>, deletedTriangles: number): number {
            var newDeleted = deletedTriangles;
            for (var i = 0; i < vertex.triangleCount; ++i) {
                var ref = this.references[vertex.triangleStart + i];
                var t = this.triangles[ref.triangleId];
                if (t.deleted) continue;
                if (deletedArray[i]) {
                    t.deleted = true;
                    newDeleted++;
                    continue;
                }
                t.vertices[ref.vertexId] = vertexId;
                t.isDirty = true;
                t.error[0] = this.calculateError(this.vertices[t.vertices[0]], this.vertices[t.vertices[1]]) + (t.borderFactor / 2);
                t.error[1] = this.calculateError(this.vertices[t.vertices[1]], this.vertices[t.vertices[2]]) + (t.borderFactor / 2);
                t.error[2] = this.calculateError(this.vertices[t.vertices[2]], this.vertices[t.vertices[0]]) + (t.borderFactor / 2);
                t.error[3] = Math.min(t.error[0], t.error[1], t.error[2]);
                this.references.push(ref);
            }
            return newDeleted;
        }

        private identifyBorder() {

            for (var i = 0; i < this.vertices.length; ++i) {
                var vCount: Array<number> = [];
                var vId: Array<number> = [];
                var v = this.vertices[i];
                var j: number;
                for (j = 0; j < v.triangleCount; ++j) {
                    var triangle = this.triangles[this.references[v.triangleStart + j].triangleId];
                    for (var ii = 0; ii < 3; ii++) {
                        var ofs = 0;
                        var id = triangle.vertices[ii];
                        while (ofs < vCount.length) {
                            if (vId[ofs] === id) break;
                            ++ofs;
                        }
                        if (ofs === vCount.length) {
                            vCount.push(1);
                            vId.push(id);
                        } else {
                            vCount[ofs]++;
                        }
                    }
                }

                for (j = 0; j < vCount.length; ++j) {
                    if (vCount[j] === 1) {
                        this.vertices[vId[j]].isBorder = true;
                    } else {
                        this.vertices[vId[j]].isBorder = false;
                    }
                }

            }
        }

        private updateMesh(identifyBorders: boolean = false) {
            var i: number;
            if (!identifyBorders) {
                var newTrianglesVector: Array<DecimationTriangle> = [];
                for (i = 0; i < this.triangles.length; ++i) {
                    if (!this.triangles[i].deleted) {
                        newTrianglesVector.push(this.triangles[i]);
                    }
                }
                this.triangles = newTrianglesVector;
            }

            for (i = 0; i < this.vertices.length; ++i) {
                this.vertices[i].triangleCount = 0;
                this.vertices[i].triangleStart = 0;
            }
            var t: DecimationTriangle;
            var j: number;
            var v: DecimationVertex;
            for (i = 0; i < this.triangles.length; ++i) {
                t = this.triangles[i];
                for (j = 0; j < 3; ++j) {
                    v = this.vertices[t.vertices[j]];
                    v.triangleCount++;
                }
            }

            var tStart = 0;

            for (i = 0; i < this.vertices.length; ++i) {
                this.vertices[i].triangleStart = tStart;
                tStart += this.vertices[i].triangleCount;
                this.vertices[i].triangleCount = 0;
            }

            var newReferences: Array<Reference> = new Array(this.triangles.length * 3);
            for (i = 0; i < this.triangles.length; ++i) {
                t = this.triangles[i];
                for (j = 0; j < 3; ++j) {
                    v = this.vertices[t.vertices[j]];
                    newReferences[v.triangleStart + v.triangleCount] = new Reference(j, i);
                    v.triangleCount++;
                }
            }
            this.references = newReferences;

            if (identifyBorders) {
                this.identifyBorder();
            }
        }


        private vertexError(q: QuadraticMatrix, point: Vector3): number {
            var x = point.x;
            var y = point.y;
            var z = point.z;
            return q.data[0] * x * x + 2 * q.data[1] * x * y + 2 * q.data[2] * x * z + 2 * q.data[3] * x + q.data[4] * y * y
                + 2 * q.data[5] * y * z + 2 * q.data[6] * y + q.data[7] * z * z + 2 * q.data[8] * z + q.data[9];
        }

        private calculateError(vertex1: DecimationVertex, vertex2: DecimationVertex, pointResult?: Vector3, normalResult?: Vector3, uvResult?: Vector2, colorResult?: Color4): number {
            var q = vertex1.q.add(vertex2.q);
            var border = vertex1.isBorder && vertex2.isBorder;
            var error: number = 0;
            var qDet = q.det(0, 1, 2, 1, 4, 5, 2, 5, 7);

            if (qDet !== 0 && !border) {
                if (!pointResult) {
                    pointResult = Vector3.Zero();
                }
                pointResult.x = -1 / qDet * (q.det(1, 2, 3, 4, 5, 6, 5, 7, 8));
                pointResult.y = 1 / qDet * (q.det(0, 2, 3, 1, 5, 6, 2, 7, 8));
                pointResult.z = -1 / qDet * (q.det(0, 1, 3, 1, 4, 6, 2, 5, 8));
                error = this.vertexError(q, pointResult);
                //TODO this should be correctly calculated
                if (normalResult) {
                    normalResult.copyFrom(vertex1.normal);
                    if (vertex1.uv)
                        uvResult.copyFrom(vertex1.uv);
                    else if (vertex1.color)
                        colorResult.copyFrom(vertex1.color);
                }
            } else {
                var p3 = (vertex1.position.add(vertex2.position)).divide(new Vector3(2, 2, 2));
                //var norm3 = (vertex1.normal.add(vertex2.normal)).divide(new Vector3(2, 2, 2)).normalize();
                var error1 = this.vertexError(q, vertex1.position);
                var error2 = this.vertexError(q, vertex2.position);
                var error3 = this.vertexError(q, p3);
                error = Math.min(error1, error2, error3);
                if (error === error1) {
                    if (pointResult) {
                        pointResult.copyFrom(vertex1.position);
                        normalResult.copyFrom(vertex1.normal);
                        if (vertex1.uv)
                            uvResult.copyFrom(vertex1.uv);
                        else if (vertex1.color)
                            colorResult.copyFrom(vertex1.color);
                    }
                } else if (error === error2) {
                    if (pointResult) {
                        pointResult.copyFrom(vertex2.position);
                        normalResult.copyFrom(vertex2.normal);
                        if (vertex2.uv)
                            uvResult.copyFrom(vertex2.uv);
                        else if (vertex2.color)
                            colorResult.copyFrom(vertex2.color);
                    }
                } else {
                    if (pointResult) {
                        pointResult.copyFrom(p3);
                        normalResult.copyFrom(vertex1.normal);
                        if (vertex1.uv)
                            uvResult.copyFrom(vertex1.uv);
                        else if (vertex1.color)
                            colorResult.copyFrom(vertex1.color);
                    }
                }
            }
            return error;
        }
    }
} 
