var BABYLON;
(function (BABYLON) {
    var SimplificationSettings = (function () {
        function SimplificationSettings(quality, distance, optimizeMesh) {
            this.quality = quality;
            this.distance = distance;
            this.optimizeMesh = optimizeMesh;
        }
        return SimplificationSettings;
    })();
    BABYLON.SimplificationSettings = SimplificationSettings;
    var SimplificationQueue = (function () {
        function SimplificationQueue() {
            this.running = false;
            this._simplificationArray = [];
        }
        SimplificationQueue.prototype.addTask = function (task) {
            this._simplificationArray.push(task);
        };
        SimplificationQueue.prototype.executeNext = function () {
            var task = this._simplificationArray.pop();
            if (task) {
                this.running = true;
                this.runSimplification(task);
            }
            else {
                this.running = false;
            }
        };
        SimplificationQueue.prototype.runSimplification = function (task) {
            var _this = this;
            if (task.parallelProcessing) {
                //parallel simplifier
                task.settings.forEach(function (setting) {
                    var simplifier = _this.getSimplifier(task);
                    simplifier.simplify(setting, function (newMesh) {
                        task.mesh.addLODLevel(setting.distance, newMesh);
                        newMesh.isVisible = true;
                        //check if it is the last
                        if (setting.quality === task.settings[task.settings.length - 1].quality && task.successCallback) {
                            //all done, run the success callback.
                            task.successCallback();
                        }
                        _this.executeNext();
                    });
                });
            }
            else {
                //single simplifier.
                var simplifier = this.getSimplifier(task);
                var runDecimation = function (setting, callback) {
                    simplifier.simplify(setting, function (newMesh) {
                        task.mesh.addLODLevel(setting.distance, newMesh);
                        newMesh.isVisible = true;
                        //run the next quality level
                        callback();
                    });
                };
                BABYLON.AsyncLoop.Run(task.settings.length, function (loop) {
                    runDecimation(task.settings[loop.index], function () {
                        loop.executeNext();
                    });
                }, function () {
                    //execution ended, run the success callback.
                    if (task.successCallback) {
                        task.successCallback();
                    }
                    _this.executeNext();
                });
            }
        };
        SimplificationQueue.prototype.getSimplifier = function (task) {
            switch (task.simplificationType) {
                case SimplificationType.QUADRATIC:
                default:
                    return new QuadraticErrorSimplification(task.mesh);
            }
        };
        return SimplificationQueue;
    })();
    BABYLON.SimplificationQueue = SimplificationQueue;
    /**
     * The implemented types of simplification.
     * At the moment only Quadratic Error Decimation is implemented.
     */
    (function (SimplificationType) {
        SimplificationType[SimplificationType["QUADRATIC"] = 0] = "QUADRATIC";
    })(BABYLON.SimplificationType || (BABYLON.SimplificationType = {}));
    var SimplificationType = BABYLON.SimplificationType;
    var DecimationTriangle = (function () {
        function DecimationTriangle(vertices) {
            this.vertices = vertices;
            this.error = new Array(4);
            this.deleted = false;
            this.isDirty = false;
            this.deletePending = false;
            this.borderFactor = 0;
        }
        return DecimationTriangle;
    })();
    BABYLON.DecimationTriangle = DecimationTriangle;
    var DecimationVertex = (function () {
        function DecimationVertex(position, id) {
            this.position = position;
            this.id = id;
            this.isBorder = true;
            this.q = new QuadraticMatrix();
            this.triangleCount = 0;
            this.triangleStart = 0;
            this.originalOffsets = [];
        }
        DecimationVertex.prototype.updatePosition = function (newPosition) {
            this.position.copyFrom(newPosition);
        };
        return DecimationVertex;
    })();
    BABYLON.DecimationVertex = DecimationVertex;
    var QuadraticMatrix = (function () {
        function QuadraticMatrix(data) {
            this.data = new Array(10);
            for (var i = 0; i < 10; ++i) {
                if (data && data[i]) {
                    this.data[i] = data[i];
                }
                else {
                    this.data[i] = 0;
                }
            }
        }
        QuadraticMatrix.prototype.det = function (a11, a12, a13, a21, a22, a23, a31, a32, a33) {
            var det = this.data[a11] * this.data[a22] * this.data[a33] + this.data[a13] * this.data[a21] * this.data[a32] +
                this.data[a12] * this.data[a23] * this.data[a31] - this.data[a13] * this.data[a22] * this.data[a31] -
                this.data[a11] * this.data[a23] * this.data[a32] - this.data[a12] * this.data[a21] * this.data[a33];
            return det;
        };
        QuadraticMatrix.prototype.addInPlace = function (matrix) {
            for (var i = 0; i < 10; ++i) {
                this.data[i] += matrix.data[i];
            }
        };
        QuadraticMatrix.prototype.addArrayInPlace = function (data) {
            for (var i = 0; i < 10; ++i) {
                this.data[i] += data[i];
            }
        };
        QuadraticMatrix.prototype.add = function (matrix) {
            var m = new QuadraticMatrix();
            for (var i = 0; i < 10; ++i) {
                m.data[i] = this.data[i] + matrix.data[i];
            }
            return m;
        };
        QuadraticMatrix.FromData = function (a, b, c, d) {
            return new QuadraticMatrix(QuadraticMatrix.DataFromNumbers(a, b, c, d));
        };
        //returning an array to avoid garbage collection
        QuadraticMatrix.DataFromNumbers = function (a, b, c, d) {
            return [a * a, a * b, a * c, a * d, b * b, b * c, b * d, c * c, c * d, d * d];
        };
        return QuadraticMatrix;
    })();
    BABYLON.QuadraticMatrix = QuadraticMatrix;
    var Reference = (function () {
        function Reference(vertexId, triangleId) {
            this.vertexId = vertexId;
            this.triangleId = triangleId;
        }
        return Reference;
    })();
    BABYLON.Reference = Reference;
    /**
     * An implementation of the Quadratic Error simplification algorithm.
     * Original paper : http://www1.cs.columbia.edu/~cs4162/html05s/garland97.pdf
     * Ported mostly from QSlim and http://voxels.blogspot.de/2014/05/quadric-mesh-simplification-with-source.html to babylon JS
     * @author RaananW
     */
    var QuadraticErrorSimplification = (function () {
        function QuadraticErrorSimplification(_mesh) {
            this._mesh = _mesh;
            this.initialized = false;
            this.syncIterations = 5000;
            this.aggressiveness = 7;
            this.decimationIterations = 100;
            this.boundingBoxEpsilon = BABYLON.Epsilon;
        }
        QuadraticErrorSimplification.prototype.simplify = function (settings, successCallback) {
            var _this = this;
            this.initDecimatedMesh();
            //iterating through the submeshes array, one after the other.
            BABYLON.AsyncLoop.Run(this._mesh.subMeshes.length, function (loop) {
                _this.initWithMesh(loop.index, function () {
                    _this.runDecimation(settings, loop.index, function () {
                        loop.executeNext();
                    });
                }, settings.optimizeMesh);
            }, function () {
                setTimeout(function () {
                    successCallback(_this._reconstructedMesh);
                }, 0);
            });
        };
        QuadraticErrorSimplification.prototype.isTriangleOnBoundingBox = function (triangle) {
            var _this = this;
            var gCount = 0;
            triangle.vertices.forEach(function (vertex) {
                var count = 0;
                var vPos = vertex.position;
                var bbox = _this._mesh.getBoundingInfo().boundingBox;
                if (bbox.maximum.x - vPos.x < _this.boundingBoxEpsilon || vPos.x - bbox.minimum.x > _this.boundingBoxEpsilon)
                    ++count;
                if (bbox.maximum.y === vPos.y || vPos.y === bbox.minimum.y)
                    ++count;
                if (bbox.maximum.z === vPos.z || vPos.z === bbox.minimum.z)
                    ++count;
                if (count > 1) {
                    ++gCount;
                }
                ;
            });
            if (gCount > 1) {
                console.log(triangle, gCount);
            }
            return gCount > 1;
        };
        QuadraticErrorSimplification.prototype.runDecimation = function (settings, submeshIndex, successCallback) {
            var _this = this;
            var targetCount = ~~(this.triangles.length * settings.quality);
            var deletedTriangles = 0;
            var triangleCount = this.triangles.length;
            var iterationFunction = function (iteration, callback) {
                setTimeout(function () {
                    if (iteration % 5 === 0) {
                        _this.updateMesh(iteration === 0);
                    }
                    for (var i = 0; i < _this.triangles.length; ++i) {
                        _this.triangles[i].isDirty = false;
                    }
                    var threshold = 0.000000001 * Math.pow((iteration + 3), _this.aggressiveness);
                    var trianglesIterator = function (i) {
                        var tIdx = ~~(((_this.triangles.length / 2) + i) % _this.triangles.length);
                        var t = _this.triangles[tIdx];
                        if (!t)
                            return;
                        if (t.error[3] > threshold || t.deleted || t.isDirty) {
                            return;
                        }
                        for (var j = 0; j < 3; ++j) {
                            if (t.error[j] < threshold) {
                                var deleted0 = [];
                                var deleted1 = [];
                                var v0 = t.vertices[j];
                                var v1 = t.vertices[(j + 1) % 3];
                                if (v0.isBorder !== v1.isBorder)
                                    continue;
                                var p = BABYLON.Vector3.Zero();
                                var n = BABYLON.Vector3.Zero();
                                var uv = BABYLON.Vector2.Zero();
                                var color = new BABYLON.Color4(0, 0, 0, 1);
                                _this.calculateError(v0, v1, p, n, uv, color);
                                var delTr = [];
                                if (_this.isFlipped(v0, v1, p, deleted0, t.borderFactor, delTr))
                                    continue;
                                if (_this.isFlipped(v1, v0, p, deleted1, t.borderFactor, delTr))
                                    continue;
                                if (deleted0.indexOf(true) < 0 || deleted1.indexOf(true) < 0)
                                    continue;
                                var uniqueArray = [];
                                delTr.forEach(function (deletedT) {
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
                                var tStart = _this.references.length;
                                deletedTriangles = _this.updateTriangles(v0, v0, deleted0, deletedTriangles);
                                deletedTriangles = _this.updateTriangles(v0, v1, deleted1, deletedTriangles);
                                var tCount = _this.references.length - tStart;
                                if (tCount <= v0.triangleCount) {
                                    if (tCount) {
                                        for (var c = 0; c < tCount; c++) {
                                            _this.references[v0.triangleStart + c] = _this.references[tStart + c];
                                        }
                                    }
                                }
                                else {
                                    v0.triangleStart = tStart;
                                }
                                v0.triangleCount = tCount;
                                break;
                            }
                        }
                    };
                    BABYLON.AsyncLoop.SyncAsyncForLoop(_this.triangles.length, _this.syncIterations, trianglesIterator, callback, function () { return (triangleCount - deletedTriangles <= targetCount); });
                }, 0);
            };
            BABYLON.AsyncLoop.Run(this.decimationIterations, function (loop) {
                if (triangleCount - deletedTriangles <= targetCount)
                    loop.breakLoop();
                else {
                    iterationFunction(loop.index, function () {
                        loop.executeNext();
                    });
                }
            }, function () {
                setTimeout(function () {
                    //reconstruct this part of the mesh
                    _this.reconstructMesh(submeshIndex);
                    successCallback();
                }, 0);
            });
        };
        QuadraticErrorSimplification.prototype.initWithMesh = function (submeshIndex, callback, optimizeMesh) {
            var _this = this;
            this.vertices = [];
            this.triangles = [];
            var positionData = this._mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            var indices = this._mesh.getIndices();
            var submesh = this._mesh.subMeshes[submeshIndex];
            var findInVertices = function (positionToSearch) {
                if (optimizeMesh) {
                    for (var ii = 0; ii < _this.vertices.length; ++ii) {
                        if (_this.vertices[ii].position.equals(positionToSearch)) {
                            return _this.vertices[ii];
                        }
                    }
                }
                return null;
            };
            var vertexReferences = [];
            var vertexInit = function (i) {
                var offset = i + submesh.verticesStart;
                var position = BABYLON.Vector3.FromArray(positionData, offset * 3);
                var vertex = findInVertices(position) || new DecimationVertex(position, _this.vertices.length);
                vertex.originalOffsets.push(offset);
                if (vertex.id === _this.vertices.length) {
                    _this.vertices.push(vertex);
                }
                vertexReferences.push(vertex.id);
            };
            //var totalVertices = mesh.getTotalVertices();
            var totalVertices = submesh.verticesCount;
            BABYLON.AsyncLoop.SyncAsyncForLoop(totalVertices, (this.syncIterations / 4) >> 0, vertexInit, function () {
                var indicesInit = function (i) {
                    var offset = (submesh.indexStart / 3) + i;
                    var pos = (offset * 3);
                    var i0 = indices[pos + 0];
                    var i1 = indices[pos + 1];
                    var i2 = indices[pos + 2];
                    var v0 = _this.vertices[vertexReferences[i0 - submesh.verticesStart]];
                    var v1 = _this.vertices[vertexReferences[i1 - submesh.verticesStart]];
                    var v2 = _this.vertices[vertexReferences[i2 - submesh.verticesStart]];
                    var triangle = new DecimationTriangle([v0, v1, v2]);
                    triangle.originalOffset = pos;
                    _this.triangles.push(triangle);
                };
                BABYLON.AsyncLoop.SyncAsyncForLoop(submesh.indexCount / 3, _this.syncIterations, indicesInit, function () {
                    _this.init(callback);
                });
            });
        };
        QuadraticErrorSimplification.prototype.init = function (callback) {
            var _this = this;
            var triangleInit1 = function (i) {
                var t = _this.triangles[i];
                t.normal = BABYLON.Vector3.Cross(t.vertices[1].position.subtract(t.vertices[0].position), t.vertices[2].position.subtract(t.vertices[0].position)).normalize();
                for (var j = 0; j < 3; j++) {
                    t.vertices[j].q.addArrayInPlace(QuadraticMatrix.DataFromNumbers(t.normal.x, t.normal.y, t.normal.z, -(BABYLON.Vector3.Dot(t.normal, t.vertices[0].position))));
                }
            };
            BABYLON.AsyncLoop.SyncAsyncForLoop(this.triangles.length, this.syncIterations, triangleInit1, function () {
                var triangleInit2 = function (i) {
                    var t = _this.triangles[i];
                    for (var j = 0; j < 3; ++j) {
                        t.error[j] = _this.calculateError(t.vertices[j], t.vertices[(j + 1) % 3]);
                    }
                    t.error[3] = Math.min(t.error[0], t.error[1], t.error[2]);
                };
                BABYLON.AsyncLoop.SyncAsyncForLoop(_this.triangles.length, _this.syncIterations, triangleInit2, function () {
                    _this.initialized = true;
                    callback();
                });
            });
        };
        QuadraticErrorSimplification.prototype.reconstructMesh = function (submeshIndex) {
            var newTriangles = [];
            var i;
            for (i = 0; i < this.vertices.length; ++i) {
                this.vertices[i].triangleCount = 0;
            }
            var t;
            var j;
            for (i = 0; i < this.triangles.length; ++i) {
                if (!this.triangles[i].deleted) {
                    t = this.triangles[i];
                    for (j = 0; j < 3; ++j) {
                        t.vertices[j].triangleCount = 1;
                    }
                    newTriangles.push(t);
                }
            }
            var newPositionData = (this._reconstructedMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind) || []);
            var newNormalData = (this._reconstructedMesh.getVerticesData(BABYLON.VertexBuffer.NormalKind) || []);
            var newUVsData = (this._reconstructedMesh.getVerticesData(BABYLON.VertexBuffer.UVKind) || []);
            var newColorsData = (this._reconstructedMesh.getVerticesData(BABYLON.VertexBuffer.ColorKind) || []);
            var normalData = this._mesh.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            var uvs = this._mesh.getVerticesData(BABYLON.VertexBuffer.UVKind);
            var colorsData = this._mesh.getVerticesData(BABYLON.VertexBuffer.ColorKind);
            var vertexCount = 0;
            for (i = 0; i < this.vertices.length; ++i) {
                var vertex = this.vertices[i];
                vertex.id = vertexCount;
                if (vertex.triangleCount) {
                    vertex.originalOffsets.forEach(function (originalOffset) {
                        newPositionData.push(vertex.position.x);
                        newPositionData.push(vertex.position.y);
                        newPositionData.push(vertex.position.z);
                        newNormalData.push(normalData[originalOffset * 3]);
                        newNormalData.push(normalData[(originalOffset * 3) + 1]);
                        newNormalData.push(normalData[(originalOffset * 3) + 2]);
                        if (uvs && uvs.length) {
                            newUVsData.push(uvs[(originalOffset * 2)]);
                            newUVsData.push(uvs[(originalOffset * 2) + 1]);
                        }
                        else if (colorsData && colorsData.length) {
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
            var newIndicesArray = this._reconstructedMesh.getIndices(); //[];
            var originalIndices = this._mesh.getIndices();
            for (i = 0; i < newTriangles.length; ++i) {
                t = newTriangles[i]; //now get the new referencing point for each vertex
                [0, 1, 2].forEach(function (idx) {
                    var id = originalIndices[t.originalOffset + idx];
                    var offset = t.vertices[idx].originalOffsets.indexOf(id);
                    if (offset < 0)
                        offset = 0;
                    newIndicesArray.push(t.vertices[idx].id + offset + startingVertex);
                });
            }
            //overwriting the old vertex buffers and indices.
            this._reconstructedMesh.setIndices(newIndicesArray);
            this._reconstructedMesh.setVerticesData(BABYLON.VertexBuffer.PositionKind, newPositionData);
            this._reconstructedMesh.setVerticesData(BABYLON.VertexBuffer.NormalKind, newNormalData);
            if (newUVsData.length > 0)
                this._reconstructedMesh.setVerticesData(BABYLON.VertexBuffer.UVKind, newUVsData);
            if (newColorsData.length > 0)
                this._reconstructedMesh.setVerticesData(BABYLON.VertexBuffer.ColorKind, newColorsData);
            //create submesh
            var originalSubmesh = this._mesh.subMeshes[submeshIndex];
            if (submeshIndex > 0) {
                this._reconstructedMesh.subMeshes = [];
                submeshesArray.forEach(function (submesh) {
                    new BABYLON.SubMesh(submesh.materialIndex, submesh.verticesStart, submesh.verticesCount, /* 0, newPositionData.length/3, */ submesh.indexStart, submesh.indexCount, submesh.getMesh());
                });
                var newSubmesh = new BABYLON.SubMesh(originalSubmesh.materialIndex, startingVertex, vertexCount, /* 0, newPositionData.length / 3, */ startingIndex, newTriangles.length * 3, this._reconstructedMesh);
            }
        };
        QuadraticErrorSimplification.prototype.initDecimatedMesh = function () {
            this._reconstructedMesh = new BABYLON.Mesh(this._mesh.name + "Decimated", this._mesh.getScene());
            this._reconstructedMesh.material = this._mesh.material;
            this._reconstructedMesh.parent = this._mesh.parent;
            this._reconstructedMesh.isVisible = false;
            this._reconstructedMesh.renderingGroupId = this._mesh.renderingGroupId;
        };
        QuadraticErrorSimplification.prototype.isFlipped = function (vertex1, vertex2, point, deletedArray, borderFactor, delTr) {
            for (var i = 0; i < vertex1.triangleCount; ++i) {
                var t = this.triangles[this.references[vertex1.triangleStart + i].triangleId];
                if (t.deleted)
                    continue;
                var s = this.references[vertex1.triangleStart + i].vertexId;
                var v1 = t.vertices[(s + 1) % 3];
                var v2 = t.vertices[(s + 2) % 3];
                if ((v1 === vertex2 || v2 === vertex2) /* && !this.isTriangleOnBoundingBox(t)*/) {
                    deletedArray[i] = true;
                    delTr.push(t);
                    continue;
                }
                var d1 = v1.position.subtract(point);
                d1 = d1.normalize();
                var d2 = v2.position.subtract(point);
                d2 = d2.normalize();
                if (Math.abs(BABYLON.Vector3.Dot(d1, d2)) > 0.999)
                    return true;
                var normal = BABYLON.Vector3.Cross(d1, d2).normalize();
                deletedArray[i] = false;
                if (BABYLON.Vector3.Dot(normal, t.normal) < 0.2)
                    return true;
            }
            return false;
        };
        QuadraticErrorSimplification.prototype.updateTriangles = function (origVertex, vertex, deletedArray, deletedTriangles) {
            var newDeleted = deletedTriangles;
            for (var i = 0; i < vertex.triangleCount; ++i) {
                var ref = this.references[vertex.triangleStart + i];
                var t = this.triangles[ref.triangleId];
                if (t.deleted)
                    continue;
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
        };
        QuadraticErrorSimplification.prototype.identifyBorder = function () {
            for (var i = 0; i < this.vertices.length; ++i) {
                var vCount = [];
                var vId = [];
                var v = this.vertices[i];
                var j;
                for (j = 0; j < v.triangleCount; ++j) {
                    var triangle = this.triangles[this.references[v.triangleStart + j].triangleId];
                    for (var ii = 0; ii < 3; ii++) {
                        var ofs = 0;
                        var vv = triangle.vertices[ii];
                        while (ofs < vCount.length) {
                            if (vId[ofs] === vv.id)
                                break;
                            ++ofs;
                        }
                        if (ofs === vCount.length) {
                            vCount.push(1);
                            vId.push(vv.id);
                        }
                        else {
                            vCount[ofs]++;
                        }
                    }
                }
                for (j = 0; j < vCount.length; ++j) {
                    if (vCount[j] === 1) {
                        this.vertices[vId[j]].isBorder = true;
                    }
                    else {
                        this.vertices[vId[j]].isBorder = false;
                    }
                }
            }
        };
        QuadraticErrorSimplification.prototype.updateMesh = function (identifyBorders) {
            if (identifyBorders === void 0) { identifyBorders = false; }
            var i;
            if (!identifyBorders) {
                var newTrianglesVector = [];
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
            var t;
            var j;
            var v;
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
            var newReferences = new Array(this.triangles.length * 3);
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
        };
        QuadraticErrorSimplification.prototype.vertexError = function (q, point) {
            var x = point.x;
            var y = point.y;
            var z = point.z;
            return q.data[0] * x * x + 2 * q.data[1] * x * y + 2 * q.data[2] * x * z + 2 * q.data[3] * x + q.data[4] * y * y
                + 2 * q.data[5] * y * z + 2 * q.data[6] * y + q.data[7] * z * z + 2 * q.data[8] * z + q.data[9];
        };
        QuadraticErrorSimplification.prototype.calculateError = function (vertex1, vertex2, pointResult, normalResult, uvResult, colorResult) {
            var q = vertex1.q.add(vertex2.q);
            var border = vertex1.isBorder && vertex2.isBorder;
            var error = 0;
            var qDet = q.det(0, 1, 2, 1, 4, 5, 2, 5, 7);
            if (qDet !== 0 && !border) {
                if (!pointResult) {
                    pointResult = BABYLON.Vector3.Zero();
                }
                pointResult.x = -1 / qDet * (q.det(1, 2, 3, 4, 5, 6, 5, 7, 8));
                pointResult.y = 1 / qDet * (q.det(0, 2, 3, 1, 5, 6, 2, 7, 8));
                pointResult.z = -1 / qDet * (q.det(0, 1, 3, 1, 4, 6, 2, 5, 8));
                error = this.vertexError(q, pointResult);
            }
            else {
                var p3 = (vertex1.position.add(vertex2.position)).divide(new BABYLON.Vector3(2, 2, 2));
                //var norm3 = (vertex1.normal.add(vertex2.normal)).divide(new Vector3(2, 2, 2)).normalize();
                var error1 = this.vertexError(q, vertex1.position);
                var error2 = this.vertexError(q, vertex2.position);
                var error3 = this.vertexError(q, p3);
                error = Math.min(error1, error2, error3);
                if (error === error1) {
                    if (pointResult) {
                        pointResult.copyFrom(vertex1.position);
                    }
                }
                else if (error === error2) {
                    if (pointResult) {
                        pointResult.copyFrom(vertex2.position);
                    }
                }
                else {
                    if (pointResult) {
                        pointResult.copyFrom(p3);
                    }
                }
            }
            return error;
        };
        return QuadraticErrorSimplification;
    })();
    BABYLON.QuadraticErrorSimplification = QuadraticErrorSimplification;
})(BABYLON || (BABYLON = {}));
