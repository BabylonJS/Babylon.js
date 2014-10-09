var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var BABYLON;
(function (BABYLON) {
    var Automaton = (function (_super) {
        __extends(Automaton, _super);
        function Automaton(name, scene) {
            _super.call(this, name, scene);
            this.debug = false;
            this._shapeKeyGroups = new Array();
            // for normal processing
            this._vertexMemberOfFaces = new Array();
            // for passive detection of game pause
            this._lastResumeTime = 0;
            this._instancePaused = false;
            // tracking system members
            this._clockStart = -1;
            this._renderCPU = 0;
            this._totalDeformations = 0;
            this._totalFrames = 0;
            // pov orientation
            this._definedFacingForward = true;
            this._engine = scene.getEngine();

            // tricky registering a prototype as a callback in constructor; cannot say 'this.beforeRender()' & must be wrappered
            var ref = this;
            this.registerBeforeRender(function () {
                ref.beforeRender();
            });
        }
        // ============================ beforeRender callback & tracking =============================
        Automaton.prototype.beforeRender = function () {
            if (this._positions32F === null || this._normals32F === null || Automaton._systemPaused || this._instancePaused)
                return;
            var startTime = Automaton.now();

            // system resume test
            if (this._lastResumeTime < Automaton._systemResumeTime) {
                for (var g = this._shapeKeyGroups.length - 1; g >= 0; g--) {
                    this._shapeKeyGroups[g].resumePlay();
                }
                this._lastResumeTime = Automaton._systemResumeTime;
            }

            var changesMade = false;
            for (var g = this._shapeKeyGroups.length - 1; g >= 0; g--) {
                // do NOT combine these 2 lines or only 1 group will run!
                var changed = this._shapeKeyGroups[g].incrementallyDeform(this._positions32F, this._normals32F);
                changesMade = changesMade || changed;
            }

            if (changesMade) {
                if (this._clockStart < 0)
                    this._resetTracking(startTime); // delay tracking until the first change is made

                //recompute parts of normals where positions updated & resend
                this._engine.updateDynamicVertexBuffer(this._normalsVBO, this._normals32F);

                // resend positions
                this._engine.updateDynamicVertexBuffer(this._positionsVBO, this._positions32F);

                this._renderCPU += Automaton.now() - startTime;
                this._totalDeformations++;
            }

            this._totalFrames++;
        };

        Automaton.prototype.resetTracking = function () {
            this._resetTracking(Automaton.now());
        };
        Automaton.prototype._resetTracking = function (startTime) {
            this._clockStart = startTime;
            this._renderCPU = 0;
            this._totalDeformations = 0;
            this._totalFrames = 0;
        };

        Automaton.prototype.getTrackingReport = function (reset) {
            if (typeof reset === "undefined") { reset = false; }
            var totalWallClock = Automaton.now() - this._clockStart;
            var report = "\nNum Deformations: " + this._totalDeformations + "\nRender CPU milli: " + this._renderCPU.toFixed(2) + "\nRender CPU milli / Deformations: " + (this._renderCPU / this._totalDeformations).toFixed(2) + "\nWallclock milli / Deformations: " + (totalWallClock / this._totalDeformations).toFixed(2) + "\nMemo, Deformations / Sec: " + (this._totalDeformations / (totalWallClock / 1000)).toFixed(2) + "\nMemo, Frames with no deformation: " + (this._totalFrames - this._totalDeformations) + "\nMemo, Total vertices: " + this.getTotalVertices() + "\nShape keys:";
            for (var i = 0; i < this._shapeKeyGroups.length; i++)
                report += "\n" + this._shapeKeyGroups[i].toString();

            if (reset)
                this.resetTracking();
            return report;
        };

        // ======================================== Overrides ========================================
        Automaton.prototype.clone = function (name, newParent, doNotCloneChildren) {
            alert("Shared vertex instances not supported for Automatons");
            return null;
        };
        Automaton.prototype.createInstance = function (name) {
            alert("Shared vertex instances not supported for Automatons");
            return null;
        };
        Automaton.prototype.convertToFlatShadedMesh = function () {
            alert("Flat shading not supported for Automatons");
        };

        /* wrappered is so positions & normals vertex buffer & initial data can be captured */
        Automaton.prototype.setVerticesData = function (kind, data, updatable) {
            _super.prototype.setVerticesData.call(this, kind, data, updatable || kind === BABYLON.VertexBuffer.PositionKind || kind === BABYLON.VertexBuffer.NormalKind);

            var babylonVertexBuffer;
            if (kind === BABYLON.VertexBuffer.PositionKind) {
                babylonVertexBuffer = this.getVertexBuffer(BABYLON.VertexBuffer.PositionKind);

                this._positionsVBO = babylonVertexBuffer.getBuffer();
                this._positions32F = new Float32Array(babylonVertexBuffer.getData());
            } else if (kind === BABYLON.VertexBuffer.NormalKind) {
                babylonVertexBuffer = this.getVertexBuffer(BABYLON.VertexBuffer.NormalKind);

                this._normalsVBO = babylonVertexBuffer.getBuffer();
                this._normals32F = new Float32Array(babylonVertexBuffer.getData());
            }
        };

        /** wrappered so this._vertexMemberOfFaces can be built after super.setIndices() called */
        Automaton.prototype.setIndices = function (indices) {
            _super.prototype.setIndices.call(this, indices);

            // now determine _vertexMemberOfFaces, to improve normals performance
            var nFaces = indices.length / 3;
            var faceOffset;

            // _vertexMemberOfFaces:  outer array each vertex, inner array faces vertex is a member of
            var nVertices = _super.prototype.getTotalVertices.call(this);

            // possibly remove or comment out
            var nZeroAreaFaces = this.findZeroAreaFaces();
            if (nZeroAreaFaces > 0)
                console.warn("Automaton: Zero area faces found:  " + nZeroAreaFaces + ", nFaces: " + nFaces + ", nVert " + nVertices);

            for (var v = 0; v < nVertices; v++) {
                var memberOf = new Array();

                for (var f = 0; f < nFaces; f++) {
                    faceOffset = f * 3;
                    if (indices[faceOffset] === v || indices[faceOffset + 1] === v || indices[faceOffset + 2] === v) {
                        memberOf.push(f);
                    }
                }
                this._vertexMemberOfFaces.push(memberOf);
            }
        };

        /** bad things happen to normals when a face has no area.  Double check & put out warning in setIndices() if any found */
        Automaton.prototype.findZeroAreaFaces = function () {
            var indices = _super.prototype.getIndices.call(this);
            var nFaces = indices.length / 3;
            var positions = _super.prototype.getVerticesData.call(this, BABYLON.VertexBuffer.PositionKind);
            var nZeroAreaFaces = 0;
            var faceOffset;
            var p1 = BABYLON.Vector3.Zero();
            var p2 = BABYLON.Vector3.Zero();
            var p3 = BABYLON.Vector3.Zero();

            for (var f = 0; f < nFaces; f++) {
                faceOffset = f * 3;
                BABYLON.Vector3.FromArrayToRef(positions, 3 * indices[faceOffset], p1);
                BABYLON.Vector3.FromArrayToRef(positions, 3 * indices[faceOffset + 1], p2);
                BABYLON.Vector3.FromArrayToRef(positions, 3 * indices[faceOffset + 2], p3);

                if (p1.equals(p2) || p1.equals(p3) || p2.equals(p3))
                    nZeroAreaFaces++;
            }
            return nZeroAreaFaces;
        };

        // ==================================== Normals processing ===================================
        /**
        * based on http://stackoverflow.com/questions/18519586/calculate-normal-per-vertex-opengl
        * @param {Uint16Array} vertices - the vertices which need the normals calculated, so do not have to do the entire mesh
        * @param {Float32Array} normals - the array to place the results, size:  vertices.length * 3
        * @param {Float32Array} futurePos - value of positions on which to base normals, passing since so does not have to be set to in mesh yet
        */
        Automaton.prototype.normalsforVerticesInPlace = function (vertices, normals, futurePos) {
            var indices = _super.prototype.getIndices.call(this);
            var nVertices = vertices.length;

            // Define all the reusable objects outside the for loop, so ..ToRef() & ..InPlace() versions can be used,
            // avoiding many single use objects to garbage collect.
            var memberOfFaces;
            var nFaces;
            var faceOffset;
            var vertexID;
            var p1 = BABYLON.Vector3.Zero();
            var p2 = BABYLON.Vector3.Zero();
            var p3 = BABYLON.Vector3.Zero();
            var p1p2 = BABYLON.Vector3.Zero();
            var p3p2 = BABYLON.Vector3.Zero();

            var cross = BABYLON.Vector3.Zero();
            var normal = BABYLON.Vector3.Zero();
            var sinAlpha;
            var weightedAvgSum = BABYLON.Vector3.Zero();

            for (var v = 0; v < nVertices; v++) {
                memberOfFaces = this._vertexMemberOfFaces[vertices[v]];
                nFaces = memberOfFaces.length;
                BABYLON.Vector3.FromFloatsToRef(0, 0, 0, weightedAvgSum); // initialize reused vector to all zeros

                for (var f = 0; f < nFaces; f++) {
                    faceOffset = memberOfFaces[f] * 3;
                    vertexID = this.indexOfVertInFace(indices[faceOffset], indices[faceOffset + 1], indices[faceOffset + 2], vertices[v]);
                    if (vertexID === -1)
                        throw "Automaton: vertex not part of face";

                    // triangleNormalFromVertex() as from example noted above
                    BABYLON.Vector3.FromFloatArrayToRef(futurePos, 3 * indices[faceOffset + vertexID], p1);
                    BABYLON.Vector3.FromFloatArrayToRef(futurePos, 3 * indices[faceOffset + ((vertexID + 1) % 3)], p2);
                    BABYLON.Vector3.FromFloatArrayToRef(futurePos, 3 * indices[faceOffset + ((vertexID + 2) % 3)], p3);

                    p1.subtractToRef(p2, p1p2);
                    p3.subtractToRef(p2, p3p2);

                    BABYLON.Vector3.CrossToRef(p1p2, p3p2, cross);
                    BABYLON.Vector3.NormalizeToRef(cross, normal);

                    sinAlpha = cross.length() / (p1p2.length() * p3p2.length());

                    // due floating point, might not be -1 ≤ sinAlpha ≤ 1, e.g. 1.0000000000000002; fix to avoid Math.asin() from returning NaN
                    if (sinAlpha < -1)
                        sinAlpha = -1;
                    else if (sinAlpha > 1)
                        sinAlpha = 1;

                    normal.scaleInPlace(Math.asin(sinAlpha));
                    weightedAvgSum.addInPlace(normal);
                }
                weightedAvgSum.normalize();
                normals[v * 3] = weightedAvgSum.x;
                normals[(v * 3) + 1] = weightedAvgSum.y;
                normals[(v * 3) + 2] = weightedAvgSum.z;
            }
        };

        Automaton.prototype.indexOfVertInFace = function (idx0, idx1, idx2, vertIdx) {
            if (vertIdx === idx0)
                return 0;
            if (vertIdx === idx1)
                return 1;
            if (vertIdx === idx2)
                return 2;
            return -1;
        };

        // ================================== ShapeKeyGroup related ==================================
        Automaton.prototype.addShapeKeyGroup = function (shapeKeyGroup) {
            this._shapeKeyGroups.push(shapeKeyGroup);
        };

        Automaton.prototype.queueEventSeries = function (eSeries) {
            var groupFound = false;
            for (var g = this._shapeKeyGroups.length - 1; g >= 0; g--) {
                if (eSeries.isShapeKeyGroupParticipating(this._shapeKeyGroups[g].getName())) {
                    this._shapeKeyGroups[g].queueEventSeries(eSeries);
                    groupFound = true;
                }
            }
            if (this.debug && !groupFound)
                console.warn("no shape keys groups participating in event series");
        };

        Automaton.prototype.getShapeKeyGroup = function (groupName) {
            for (var g = this._shapeKeyGroups.length - 1; g >= 0; g--) {
                if (this._shapeKeyGroups[g].getName() === groupName) {
                    return this._shapeKeyGroups[g];
                }
            }
            return null;
        };

        // ================================== Point of View Movement =================================
        /**
        * When the mesh is defined facing forward, multipliers must be set so that movePOV() is
        * from the point of view of behind the front of the mesh.
        * @param {boolean} definedFacingForward - True is the default
        */
        Automaton.prototype.setDefinedFacingForward = function (definedFacingForward) {
            this._definedFacingForward = definedFacingForward;
        };

        /**
        * Perform relative position change from the point of view of behind the front of the mesh.
        * This is performed taking into account the meshes current rotation, so you do not have to care.
        * Supports definition of mesh facing forward or backward.
        * @param {number} amountRight
        * @param {number} amountUp
        * @param {number} amountForward
        */
        Automaton.prototype.movePOV = function (amountRight, amountUp, amountForward) {
            this.position.addInPlace(this.calcMovePOV(amountRight, amountUp, amountForward));
        };

        /**
        * Calculate relative position change from the point of view of behind the front of the mesh.
        * This is performed taking into account the meshes current rotation, so you do not have to care.
        * Supports definition of mesh facing forward or backward.
        * @param {number} amountRight
        * @param {number} amountUp
        * @param {number} amountForward
        */
        Automaton.prototype.calcMovePOV = function (amountRight, amountUp, amountForward) {
            var rotMatrix = new BABYLON.Matrix();
            var rotQuaternion = (this.rotationQuaternion) ? this.rotationQuaternion : BABYLON.Quaternion.RotationYawPitchRoll(this.rotation.y, this.rotation.x, this.rotation.z);
            rotQuaternion.toRotationMatrix(rotMatrix);

            var translationDelta = BABYLON.Vector3.Zero();
            var defForwardMult = this._definedFacingForward ? -1 : 1;
            BABYLON.Vector3.TransformCoordinatesFromFloatsToRef(amountRight * defForwardMult, amountUp, amountForward * defForwardMult, rotMatrix, translationDelta);
            return translationDelta;
        };

        // ================================== Point of View Rotation =================================
        /**
        * Perform relative rotation change from the point of view of behind the front of the mesh.
        * Supports definition of mesh facing forward or backward.
        * @param {number} flipBack
        * @param {number} twirlClockwise
        * @param {number} tiltRight
        */
        Automaton.prototype.rotatePOV = function (flipBack, twirlClockwise, tiltRight) {
            this.rotation.addInPlace(this.calcRotatePOV(flipBack, twirlClockwise, tiltRight));
        };

        /**
        * Calculate relative rotation change from the point of view of behind the front of the mesh.
        * Supports definition of mesh facing forward or backward.
        * @param {number} flipBack
        * @param {number} twirlClockwise
        * @param {number} tiltRight
        */
        Automaton.prototype.calcRotatePOV = function (flipBack, twirlClockwise, tiltRight) {
            var defForwardMult = this._definedFacingForward ? 1 : -1;
            return new BABYLON.Vector3(flipBack * defForwardMult, twirlClockwise, tiltRight * defForwardMult);
        };

        /** system could be paused at a higher up without notification; just by stop calling beforeRender() */
        Automaton.pauseSystem = function () {
            Automaton._systemPaused = true;
        };
        Automaton.isSystemPaused = function () {
            return Automaton._systemPaused;
        };

        Automaton.resumeSystem = function () {
            Automaton._systemPaused = false;
            Automaton._systemResumeTime = Automaton.now();
        };

        // instance level methods
        Automaton.prototype.pausePlay = function () {
            this._instancePaused = true;
        };
        Automaton.prototype.isPaused = function () {
            return this._instancePaused;
        };

        Automaton.prototype.resumePlay = function () {
            this._instancePaused = false;
            this._lastResumeTime = Automaton.now();

            for (var g = this._shapeKeyGroups.length - 1; g >= 0; g--) {
                this._shapeKeyGroups[g].resumePlay();
            }
        };

        // ========================================= Statics =========================================
        /** wrapper for window.performance.now, incase not implemented, e.g. Safari */
        Automaton.now = function () {
            return (typeof window.performance === "undefined") ? Date.now() : window.performance.now();
        };
        Automaton._systemPaused = false;
        Automaton._systemResumeTime = 0;
        return Automaton;
    })(BABYLON.Mesh);
    BABYLON.Automaton = Automaton;
})(BABYLON || (BABYLON = {}));
