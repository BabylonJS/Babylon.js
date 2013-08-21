var WORLDMONGER = WORLDMONGER || {};

(function () {
    WORLDMONGER.ElevationControl = function (ground) {
        this._ground = ground;
        this.radius = 5.0;
        this._invertDirection = 1.0;
        this.heightMin = 0;
        this.heightMax = 11.0;
        
        // Particle system
        var scene = ground.getScene();
        var particleSystem = new BABYLON.ParticleSystem("particles", 4000, scene);
        particleSystem.particleTexture = new BABYLON.Texture("Assets/Flare.png", scene);
        particleSystem.minAngularSpeed = -4.5;
        particleSystem.maxAngularSpeed = 4.5;
        particleSystem.minSize = 0.5;
        particleSystem.maxSize = 4.0;
        particleSystem.minLifeTime = 0.5;
        particleSystem.maxLifeTime = 2.0;
        particleSystem.minEmitPower = 0.5;
        particleSystem.maxEmitPower = 1.0;
        particleSystem.emitRate = 400;
        particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        particleSystem.minEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.maxEmitBox = new BABYLON.Vector3(0, 0, 0);
        particleSystem.direction1 = new BABYLON.Vector3(0, 1, 0);
        particleSystem.direction2 = new BABYLON.Vector3(0, 1, 0);
        particleSystem.color1 = new BABYLON.Color4(0, 0, 1, 1);
        particleSystem.color2 = new BABYLON.Color4(1, 1, 1, 1);
        particleSystem.gravity = new BABYLON.Vector3(0, 5, 0);
        particleSystem.manualEmitCount = 0;
        particleSystem.emitter = new BABYLON.Vector3(0, 0, 0);
        particleSystem.start();

        this._particleSystem = particleSystem;
    };

    WORLDMONGER.ElevationControl.prototype.direction = 1;

    WORLDMONGER.ElevationControl.prototype.attachControl = function (canvas) {
        var currentPosition;
        var that = this;

        this._onBeforeRender = function () {
            if (!currentPosition) {
                return;
            }

            var pickInfo = that._ground.getScene().pick(currentPosition.x, currentPosition.y);

            if (!pickInfo.hit)
                return;

            if (pickInfo.pickedMesh != that._ground)
                return;

            that._particleSystem.emitter = pickInfo.pickedPoint.add(new BABYLON.Vector3(0, 3, 0));
            that._particleSystem.manualEmitCount += 400;

            that._elevateFaces(pickInfo, that.radius, 0.2);
        };


        this._onPointerDown = function (evt) {
            evt.preventDefault();

            currentPosition = {
                x: evt.clientX,
                y: evt.clientY
            };            
        };

        this._onPointerUp = function (evt) {
            evt.preventDefault();

            currentPosition = null;
        };

        this._onPointerMove = function (evt) {
            evt.preventDefault();

            if (!currentPosition) {
                return;
            }

            that._invertDirection = evt.button == 2 ? -1 : 1;

            currentPosition = {
                x: evt.clientX,
                y: evt.clientY
            };
        };

        this._onLostFocus = function () {
            currentPosition = null;
        };

        canvas.addEventListener("pointerdown", this._onPointerDown, true);
        canvas.addEventListener("pointerup", this._onPointerUp, true);
        canvas.addEventListener("pointerout", this._onPointerUp, true);
        canvas.addEventListener("pointermove", this._onPointerMove, true);
        window.addEventListener("blur", this._onLostFocus, true);

        this._ground.getScene().registerBeforeRender(this._onBeforeRender);
    };

    WORLDMONGER.ElevationControl.prototype.detachControl = function (canvas) {
        canvas.removeEventListener("pointerdown", this._onPointerDown);
        canvas.removeEventListener("pointerup", this._onPointerUp);
        canvas.removeEventListener("pointerout", this._onPointerUp);
        canvas.removeEventListener("pointermove", this._onPointerMove);
        window.removeEventListener("blur", this._onLostFocus);

        this._ground.getScene().unregisterBeforeRender(this._onBeforeRender);
    };

    WORLDMONGER.ElevationControl.prototype._prepareDataModelForElevation = function () {
        if (this._facesOfVertices == null) {
            this._facesOfVertices = [];

            this._groundVerticesPositions = this._ground.getVerticesData(BABYLON.VertexBuffer.PositionKind);
            this._groundVerticesNormals = this._ground.getVerticesData(BABYLON.VertexBuffer.NormalKind);
            this._groundIndices = this._ground.getIndices();

            this._groundPositions = [];
            var index;
            for (index = 0; index < this._groundVerticesPositions.length; index += 3) {
                this._groundPositions.push(new BABYLON.Vector3(this._groundVerticesPositions[index], this._groundVerticesPositions[index + 1], this._groundVerticesPositions[index + 2]));
            }

            this._groundFacesNormals = [];
            for (index = 0; index < this._ground.getTotalIndices() / 3; index++) {
                this._computeFaceNormal(index);
            }

            this._getFacesOfVertices();
        }
    };

    WORLDMONGER.ElevationControl.prototype._getFaceVerticesIndex = function (faceID) {
        return {
            v1: this._groundIndices[faceID * 3],
            v2: this._groundIndices[faceID * 3 + 1],
            v3: this._groundIndices[faceID * 3 + 2]
        };
    };

    WORLDMONGER.ElevationControl.prototype._computeFaceNormal = function (face) {
        var faceInfo = this._getFaceVerticesIndex(face);

        var v1v2 = this._groundPositions[faceInfo.v1].subtract(this._groundPositions[faceInfo.v2]);
        var v3v2 = this._groundPositions[faceInfo.v3].subtract(this._groundPositions[faceInfo.v2]);

        this._groundFacesNormals[face] = BABYLON.Vector3.Normalize(BABYLON.Vector3.Cross(v1v2, v3v2));
    };

    WORLDMONGER.ElevationControl.prototype._getFacesOfVertices = function () {
        this._facesOfVertices = [];
        this._subdivisionsOfVertices = [];
        var index;

        for (index = 0; index < this._groundPositions.length; index++) {
            this._facesOfVertices[index] = [];
            this._subdivisionsOfVertices[index] = [];
        }

        for (index = 0; index < this._groundIndices.length; index++) {
            this._facesOfVertices[this._groundIndices[index]].push((index / 3) | 0);
        }

        for (var subIndex = 0; subIndex < this._ground.subMeshes.length; subIndex++) {
            var subMesh = this._ground.subMeshes[subIndex];
            for (index = subMesh.verticesStart; index < subMesh.verticesStart + subMesh.verticesCount; index++) {
                this._subdivisionsOfVertices[index].push(subMesh);
            }
        }
    };

    WORLDMONGER.ElevationControl.prototype._isBoxSphereIntersected = function(box, sphereCenter, sphereRadius) {
        var vector = BABYLON.Vector3.Clamp(sphereCenter, box.minimumWorld, box.maximumWorld);
        var num = BABYLON.Vector3.DistanceSquared(sphereCenter, vector);
        return (num <= (sphereRadius * sphereRadius));
    };

    WORLDMONGER.ElevationControl.prototype._elevateFaces = function (pickInfo, radius, height) {
        this._prepareDataModelForElevation();
        this._selectedVertices = [];

        // Impact zone
        var sphereCenter = pickInfo.pickedPoint;
        sphereCenter.y = 0;
        var index;

        // Determine list of vertices
        for (var subIndex = 0; subIndex < this._ground.subMeshes.length; subIndex++) {
            var subMesh = this._ground.subMeshes[subIndex];

            if (!this._isBoxSphereIntersected(subMesh.getBoundingInfo().boundingBox, sphereCenter, radius)) {
                continue;
            }

            for (index = subMesh.verticesStart; index < subMesh.verticesStart + subMesh.verticesCount; index++) {
                var position = this._groundPositions[index];
                sphereCenter.y = position.y;

                var distance = BABYLON.Vector3.Distance(position, sphereCenter);

                if (distance < radius) {
                    this._selectedVertices[index] = distance;
                }
            }
        }

        // Elevate vertices
        for (var selectedVertice in this._selectedVertices) {
            var position = this._groundPositions[selectedVertice];
            var distance = this._selectedVertices[selectedVertice];

            var fullHeight = height * this.direction * this._invertDirection;
            if (distance < radius * 0.3) {
                position.y += fullHeight;
            } else {
                position.y += fullHeight * (1.0 - (distance - radius * 0.3) / (radius * 0.7));
            }

            if (position.y > this.heightMax)
                position.y = this.heightMax;
            else if (position.y < this.heightMin)
                position.y = this.heightMin;

            this._groundVerticesPositions[selectedVertice * 3 + 1] = position.y;

            this._updateSubdivisions(selectedVertice);
        }

        // Normals
        this._reComputeNormals();

        // Update vertex buffer
        this._ground.updateVerticesData(BABYLON.VertexBuffer.PositionKind, this._groundVerticesPositions);
        this._ground.updateVerticesData(BABYLON.VertexBuffer.NormalKind,this._groundVerticesNormals);        
    };

    WORLDMONGER.ElevationControl.prototype._reComputeNormals = function () {
        var faces = [];
        var face;

        for (var selectedVertice in this._selectedVertices) {
            var faceOfVertices = this._facesOfVertices[selectedVertice];
            for (var index = 0; index < faceOfVertices.length; index++) {
                faces[faceOfVertices[index]] = true;
            }
        }

        for (face in faces) {
            this._computeFaceNormal(face);
        }

        for (face in faces) {
            var faceInfo = this._getFaceVerticesIndex(face);
            this._computeNormal(faceInfo.v1);
            this._computeNormal(faceInfo.v2);
            this._computeNormal(faceInfo.v3);
        }
    };

    WORLDMONGER.ElevationControl.prototype._computeNormal = function(vertexIndex) {
        var faces = this._facesOfVertices[vertexIndex];

        var normal = BABYLON.Vector3.Zero();
        for (var index = 0; index < faces.length; index++) {
            normal = normal.add(this._groundFacesNormals[faces[index]]);
        }

        normal = BABYLON.Vector3.Normalize(normal.scale(1.0 / faces.length));

        this._groundVerticesNormals[vertexIndex * 3] = normal.x;
        this._groundVerticesNormals[vertexIndex * 3 + 1] = normal.y;
        this._groundVerticesNormals[vertexIndex * 3 + 2] = normal.z;
    };

    WORLDMONGER.ElevationControl.prototype._updateSubdivisions = function (vertexIndex) {
        for (var index = 0; index < this._subdivisionsOfVertices[vertexIndex].length; index++) {
            var sub = this._subdivisionsOfVertices[vertexIndex][index];
            var boundingBox = sub.getBoundingInfo().boundingBox;
            var boundingSphere = sub.getBoundingInfo().boundingSphere;

            if (this._groundPositions[vertexIndex].y < boundingBox.minimum.y) {
                boundingSphere.radius += Math.abs(this._groundPositions[vertexIndex].y - boundingBox.minimum.y);
                boundingBox.minimum.y = this._groundPositions[vertexIndex].y;
            } else if (this._groundPositions[vertexIndex].y > boundingBox.maximum.y) {
                boundingBox.maximum.y = this._groundPositions[vertexIndex].y;
            }
        }

        var boundingBox = this._ground.getBoundingInfo().boundingBox;
        var boundingSphere = this._ground.getBoundingInfo().boundingSphere;
        if (this._groundPositions[vertexIndex].y < boundingBox.minimum.y) {
            boundingSphere.Radius += Math.abs(this._groundPositions[vertexIndex].y - boundingBox.minimum.y);
            boundingBox.minimum.y = this._groundPositions[vertexIndex].y;
        } else if (this._groundPositions[vertexIndex].y > boundingBox.maximum.y) {
            boundingBox.maximum.y = this._groundPositions[vertexIndex].y;
        }
    };
})();