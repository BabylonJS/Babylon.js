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
        optimizeMesh?: boolean;
    }

    export class SimplificationSettings implements ISimplificationSettings {
        constructor(public quality: number, public distance: number, public optimizeMesh?: boolean) {
        }
    }

    export interface ISimplificationTask {
        settings: Array<ISimplificationSettings>;
        simplificationType: SimplificationType;
        mesh: Mesh;
        successCallback?: () => void;
        parallelProcessing: boolean;
    }

    export class SimplificationQueue {
        private _simplificationArray: Array<ISimplificationTask>;
        public running;

        constructor() {
            this.running = false;
            this._simplificationArray = [];
        }

        public addTask(task: ISimplificationTask) {
            this._simplificationArray.push(task);
        }

        public executeNext() {
            var task = this._simplificationArray.pop();
            if (task) {
                this.running = true;
                this.runSimplification(task);
            } else {
                this.running = false;
            }
        }

        public runSimplification(task: ISimplificationTask) {
            if (task.parallelProcessing) {
                //parallel simplifier
                task.settings.forEach((setting) => {
                    var simplifier = this.getSimplifier(task);
                    simplifier.simplify(setting,(newMesh) => {
                        task.mesh.addLODLevel(setting.distance, newMesh);
                        newMesh.isVisible = true;
                        //check if it is the last
                        if (setting.quality === task.settings[task.settings.length - 1].quality && task.successCallback) {
                            //all done, run the success callback.
                            task.successCallback();
                        }
                        this.executeNext();
                    });
                });
            } else {
                //single simplifier.
                var simplifier = this.getSimplifier(task);

                var runDecimation = (setting: ISimplificationSettings, callback: () => void) => {
                    simplifier.simplify(setting,(newMesh) => {
                        task.mesh.addLODLevel(setting.distance, newMesh);
                        newMesh.isVisible = true;
                        //run the next quality level
                        callback();
                    });
                }

                AsyncLoop.Run(task.settings.length,(loop: AsyncLoop) => {
                    runDecimation(task.settings[loop.index],() => {
                        loop.executeNext();
                    });
                },() => {
                        //execution ended, run the success callback.
                        if (task.successCallback) {
                            task.successCallback();
                        }
                        this.executeNext();
                    });
            }
        }

        private getSimplifier(task: ISimplificationTask): ISimplifier {
            switch (task.simplificationType) {
                case SimplificationType.QUADRATIC:
                default:
                    return new QuadraticErrorSimplification(task.mesh);
            }
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
        public deletePending: boolean;

        public originalOffset: number;

        constructor(public vertices: Array<DecimationVertex>) {
            this.error = new Array<number>(4);
            this.deleted = false;
            this.isDirty = false;
            this.deletePending = false;
            this.borderFactor = 0;
        }
    }

    export class DecimationVertex {
        public q: QuadraticMatrix;
        public isBorder: boolean;

        public triangleStart: number;
        public triangleCount: number;

        public originalOffsets: Array<number>;

        constructor(public position: Vector3, public id) {
            this.isBorder = true;
            this.q = new QuadraticMatrix();
            this.triangleCount = 0;
            this.triangleStart = 0;
            this.originalOffsets = [];
        }

        public updatePosition(newPosition: Vector3) {
            this.position.copyFrom(newPosition);
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

        private initialized: boolean = false;

        private _reconstructedMesh: Mesh;

        public syncIterations = 5000;

        public aggressiveness: number;
        public decimationIterations: number;

        public boundingBoxEpsilon: number;

        constructor(private _mesh: Mesh) {
            this.aggressiveness = 7;
            this.decimationIterations = 100;
            this.boundingBoxEpsilon = Engine.Epsilon;
        }

        public simplify(settings: ISimplificationSettings, successCallback: (simplifiedMesh: Mesh) => void) {
            this.initDecimatedMesh();
            //iterating through the submeshes array, one after the other.
            AsyncLoop.Run(this._mesh.subMeshes.length,(loop: AsyncLoop) => {
                this.initWithMesh(loop.index,() => {
                    this.runDecimation(settings, loop.index,() => {
                        loop.executeNext();
                    });
                }, settings.optimizeMesh);
            },() => {
                    setTimeout(() => {
                        successCallback(this._reconstructedMesh);
                    }, 0);
                });
        }

        private isTriangleOnBoundingBox(triangle: DecimationTriangle): boolean {
            var gCount = 0;
            triangle.vertices.forEach((vertex) => {
                var count = 0;
                var vPos = vertex.position;
                var bbox = this._mesh.getBoundingInfo().boundingBox;

                if (bbox.maximum.x - vPos.x < this.boundingBoxEpsilon || vPos.x - bbox.minimum.x > this.boundingBoxEpsilon)
                    ++count;

                if (bbox.maximum.y === vPos.y || vPos.y === bbox.minimum.y)
                    ++count;

                if (bbox.maximum.z === vPos.z || vPos.z === bbox.minimum.z)
                    ++count;

                if (count > 1) {
                    ++gCount;
                };
            });
            if (gCount > 1) {
                console.log(triangle, gCount);
            }
            return gCount > 1;

        }

        private runDecimation(settings: ISimplificationSettings, submeshIndex: number, successCallback: () => void) {
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

                                var v0 = t.vertices[j];
                                var v1 = t.vertices[(j + 1) % 3];

                                if (v0.isBorder !== v1.isBorder) continue;

                                var p = Vector3.Zero();
                                var n = Vector3.Zero();
                                var uv = Vector2.Zero();
                                var color = new Color4(0, 0, 0, 1);

                                this.calculateError(v0, v1, p, n, uv, color);

                                var delTr = [];

                                if (this.isFlipped(v0, v1, p, deleted0, t.borderFactor, delTr)) continue;
                                if (this.isFlipped(v1, v0, p, deleted1, t.borderFactor, delTr)) continue;

                                if (deleted0.indexOf(true) < 0 || deleted1.indexOf(true) < 0)
                                    continue;

                                var uniqueArray = [];
                                delTr.forEach(deletedT => {
                                    if (uniqueArray.indexOf(deletedT) === -1) {
                                        deletedT.deletePending = true;
                                        uniqueArray.push(deletedT);
                                    }
                                });

                                if (uniqueArray.length % 2 !== 0) {
                                    continue;
                                }

                                v0.q = v1.q.add(v0.q);

                                v0.updatePosition(p);

                                var tStart = this.references.length;

                                deletedTriangles = this.updateTriangles(v0, v0, deleted0, deletedTriangles);
                                deletedTriangles = this.updateTriangles(v0, v1, deleted1, deletedTriangles);

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
                        //reconstruct this part of the mesh
                        this.reconstructMesh(submeshIndex);
                        successCallback();
                    }, 0);
                });
        }

        private initWithMesh(submeshIndex: number, callback: Function, optimizeMesh?: boolean) {

            this.vertices = [];
            this.triangles = [];

            var positionData = this._mesh.getVerticesData(VertexBuffer.PositionKind);

            var indices = this._mesh.getIndices();
            var submesh = this._mesh.subMeshes[submeshIndex];

            var findInVertices = (positionToSearch: Vector3) => {
                if (optimizeMesh) {
                    for (var ii = 0; ii < this.vertices.length; ++ii) {
                        if (this.vertices[ii].position.equals(positionToSearch)) {
                            return this.vertices[ii];
                        }
                    }
                }
                return null;
            }

            var vertexReferences: Array<number> = [];

            var vertexInit = (i) => {
                var offset = i + submesh.verticesStart;
                var position = Vector3.FromArray(positionData, offset * 3);

                var vertex = findInVertices(position) || new DecimationVertex(position, this.vertices.length);
                vertex.originalOffsets.push(offset);
                if (vertex.id === this.vertices.length) {
                    this.vertices.push(vertex);
                }
                vertexReferences.push(vertex.id);
            };
            //var totalVertices = mesh.getTotalVertices();
            var totalVertices = submesh.verticesCount;
            AsyncLoop.SyncAsyncForLoop(totalVertices,(this.syncIterations / 4) >> 0, vertexInit,() => {

                var indicesInit = (i) => {
                    var offset = (submesh.indexStart / 3) + i;
                    var pos = (offset * 3);
                    var i0 = indices[pos + 0];
                    var i1 = indices[pos + 1];
                    var i2 = indices[pos + 2];
                    var v0: DecimationVertex = this.vertices[vertexReferences[i0 - submesh.verticesStart]];
                    var v1: DecimationVertex = this.vertices[vertexReferences[i1 - submesh.verticesStart]];
                    var v2: DecimationVertex = this.vertices[vertexReferences[i2 - submesh.verticesStart]];
                    var triangle = new DecimationTriangle([v0, v1, v2]);
                    triangle.originalOffset = pos;
                    this.triangles.push(triangle);
                };
                AsyncLoop.SyncAsyncForLoop(submesh.indexCount / 3, this.syncIterations, indicesInit,() => {
                    this.init(callback);
                });
            });
        }

        private init(callback: Function) {
            var triangleInit1 = (i) => {
                var t = this.triangles[i];
                t.normal = Vector3.Cross(t.vertices[1].position.subtract(t.vertices[0].position), t.vertices[2].position.subtract(t.vertices[0].position)).normalize();
                for (var j = 0; j < 3; j++) {
                    t.vertices[j].q.addArrayInPlace(QuadraticMatrix.DataFromNumbers(t.normal.x, t.normal.y, t.normal.z, -(Vector3.Dot(t.normal, t.vertices[0].position))));
                }
            };
            AsyncLoop.SyncAsyncForLoop(this.triangles.length, this.syncIterations, triangleInit1,() => {

                var triangleInit2 = (i) => {
                    var t = this.triangles[i];
                    for (var j = 0; j < 3; ++j) {
                        t.error[j] = this.calculateError(t.vertices[j], t.vertices[(j + 1) % 3]);
                    }
                    t.error[3] = Math.min(t.error[0], t.error[1], t.error[2]);
                };
                AsyncLoop.SyncAsyncForLoop(this.triangles.length, this.syncIterations, triangleInit2,() => {
                    this.initialized = true;
                    callback();
                });
            });
        }

        private reconstructMesh(submeshIndex: number) {

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
                        t.vertices[j].triangleCount = 1;
                    }
                    newTriangles.push(t);
                }
            }

            var newPositionData = <number[]>(this._reconstructedMesh.getVerticesData(VertexBuffer.PositionKind) || []);
            var newNormalData = <number[]>(this._reconstructedMesh.getVerticesData(VertexBuffer.NormalKind) || []);
            var newUVsData = <number[]>(this._reconstructedMesh.getVerticesData(VertexBuffer.UVKind) || []);
            var newColorsData = <number[]>(this._reconstructedMesh.getVerticesData(VertexBuffer.ColorKind) || []);

            var normalData = this._mesh.getVerticesData(VertexBuffer.NormalKind);
            var uvs = this._mesh.getVerticesData(VertexBuffer.UVKind);
            var colorsData = this._mesh.getVerticesData(VertexBuffer.ColorKind);

            var vertexCount = 0;
            for (i = 0; i < this.vertices.length; ++i) {
                var vertex = this.vertices[i];
                vertex.id = vertexCount;
                if (vertex.triangleCount) {
                    vertex.originalOffsets.forEach(originalOffset => {
                        newPositionData.push(vertex.position.x);
                        newPositionData.push(vertex.position.y);
                        newPositionData.push(vertex.position.z);
                        newNormalData.push(normalData[originalOffset * 3]);
                        newNormalData.push(normalData[(originalOffset * 3) + 1]);
                        newNormalData.push(normalData[(originalOffset * 3) + 2]);
                        if (uvs && uvs.length) {
                            newUVsData.push(uvs[(originalOffset * 2)]);
                            newUVsData.push(uvs[(originalOffset * 2) + 1]);
                        } else if (colorsData && colorsData.length) {
                            newColorsData.push(colorsData[(originalOffset * 4)]);
                            newColorsData.push(colorsData[(originalOffset * 4) + 1]);
                            newColorsData.push(colorsData[(originalOffset * 4) + 2]);
                            newColorsData.push(colorsData[(originalOffset * 4) + 3]);
                        }
                        ++vertexCount;
                    });
                }
            }

            var startingIndex = this._reconstructedMesh.getTotalIndices();
            var startingVertex = this._reconstructedMesh.getTotalVertices();

            var submeshesArray = this._reconstructedMesh.subMeshes;
            this._reconstructedMesh.subMeshes = [];

            var newIndicesArray: number[] = <number[]>this._reconstructedMesh.getIndices(); //[];
            var originalIndices = this._mesh.getIndices();
            for (i = 0; i < newTriangles.length; ++i) {
                t = newTriangles[i]; //now get the new referencing point for each vertex
                [0, 1, 2].forEach(idx => {
                    var id = originalIndices[t.originalOffset + idx]
                    var offset = t.vertices[idx].originalOffsets.indexOf(id);
                    if (offset < 0) offset = 0;
                    newIndicesArray.push(t.vertices[idx].id + offset + startingVertex);
                });
            }

            //overwriting the old vertex buffers and indices.

            this._reconstructedMesh.setIndices(newIndicesArray);
            this._reconstructedMesh.setVerticesData(VertexBuffer.PositionKind, newPositionData);
            this._reconstructedMesh.setVerticesData(VertexBuffer.NormalKind, newNormalData);
            if (newUVsData.length > 0)
                this._reconstructedMesh.setVerticesData(VertexBuffer.UVKind, newUVsData);
            if (newColorsData.length > 0)
                this._reconstructedMesh.setVerticesData(VertexBuffer.ColorKind, newColorsData);
            
            //create submesh
            var originalSubmesh = this._mesh.subMeshes[submeshIndex];
            if (submeshIndex > 0) {
                this._reconstructedMesh.subMeshes = [];
                submeshesArray.forEach(submesh => {
                    new SubMesh(submesh.materialIndex, submesh.verticesStart, submesh.verticesCount,/* 0, newPositionData.length/3, */submesh.indexStart, submesh.indexCount, submesh.getMesh());
                });
                var newSubmesh = new SubMesh(originalSubmesh.materialIndex, startingVertex, vertexCount,/* 0, newPositionData.length / 3, */startingIndex, newTriangles.length * 3, this._reconstructedMesh);
            }
        }

        private initDecimatedMesh() {
            this._reconstructedMesh = new Mesh(this._mesh.name + "Decimated", this._mesh.getScene());
            this._reconstructedMesh.material = this._mesh.material;
            this._reconstructedMesh.parent = this._mesh.parent;
            this._reconstructedMesh.isVisible = false;
        }

        private isFlipped(vertex1: DecimationVertex, vertex2: DecimationVertex, point: Vector3, deletedArray: Array<boolean>, borderFactor: number, delTr: Array<DecimationTriangle>): boolean {

            for (var i = 0; i < vertex1.triangleCount; ++i) {
                var t = this.triangles[this.references[vertex1.triangleStart + i].triangleId];
                if (t.deleted) continue;

                var s = this.references[vertex1.triangleStart + i].vertexId;

                var v1 = t.vertices[(s + 1) % 3];
                var v2 = t.vertices[(s + 2) % 3];

                if ((v1 === vertex2 || v2 === vertex2)/* && !this.isTriangleOnBoundingBox(t)*/) {
                    deletedArray[i] = true;
                    delTr.push(t);
                    continue;
                }

                var d1 = v1.position.subtract(point);
                d1 = d1.normalize();
                var d2 = v2.position.subtract(point);
                d2 = d2.normalize();
                if (Math.abs(Vector3.Dot(d1, d2)) > 0.999) return true;
                var normal = Vector3.Cross(d1, d2).normalize();
                deletedArray[i] = false;
                if (Vector3.Dot(normal, t.normal) < 0.2) return true;
            }

            return false;
        }

        private updateTriangles(origVertex: DecimationVertex, vertex: DecimationVertex, deletedArray: Array<boolean>, deletedTriangles: number): number {
            var newDeleted = deletedTriangles;
            for (var i = 0; i < vertex.triangleCount; ++i) {
                var ref = this.references[vertex.triangleStart + i];
                var t = this.triangles[ref.triangleId];
                if (t.deleted) continue;
                if (deletedArray[i] && t.deletePending) {
                    t.deleted = true;
                    newDeleted++;
                    continue;
                }
                t.vertices[ref.vertexId] = origVertex;
                t.isDirty = true;
                t.error[0] = this.calculateError(t.vertices[0], t.vertices[1]) + (t.borderFactor / 2);
                t.error[1] = this.calculateError(t.vertices[1], t.vertices[2]) + (t.borderFactor / 2);
                t.error[2] = this.calculateError(t.vertices[2], t.vertices[0]) + (t.borderFactor / 2);
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
                        var vv = triangle.vertices[ii];
                        while (ofs < vCount.length) {
                            if (vId[ofs] === vv.id) break;
                            ++ofs;
                        }
                        if (ofs === vCount.length) {
                            vCount.push(1);
                            vId.push(vv.id);
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
                    v = t.vertices[j];
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
                    v = t.vertices[j];
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
                    }
                } else if (error === error2) {
                    if (pointResult) {
                        pointResult.copyFrom(vertex2.position);
                    }
                } else {
                    if (pointResult) {
                        pointResult.copyFrom(p3);
                    }
                }
            }
            return error;
        }
    }
} 