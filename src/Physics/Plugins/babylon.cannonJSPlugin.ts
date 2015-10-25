module BABYLON {
    declare var CANNON;

    export class CannonJSPlugin implements IPhysicsEnginePlugin {

        private _world: any;
        private _registeredMeshes = [];
        private _physicsMaterials = [];

        public initialize(iterations: number = 10): void {
            this._world = new CANNON.World();
            this._world.broadphase = new CANNON.NaiveBroadphase();
            this._world.solver.iterations = iterations;
        }

        private _checkWithEpsilon(value: number): number {
            return value < PhysicsEngine.Epsilon ? PhysicsEngine.Epsilon : value;
        }

        public runOneStep(delta: number): void {
            this._world.step(delta);

            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];

                if (registeredMesh.isChild) {
                    continue;
                }

                // Body position
                var bodyX = registeredMesh.body.position.x,
                    bodyY = registeredMesh.body.position.y,
                    bodyZ = registeredMesh.body.position.z;

                registeredMesh.mesh.position.x = bodyX + registeredMesh.delta.x;
                registeredMesh.mesh.position.y = bodyY + registeredMesh.delta.y;
                registeredMesh.mesh.position.z = bodyZ + registeredMesh.delta.z;

                registeredMesh.mesh.rotationQuaternion.copyFrom(registeredMesh.body.quaternion);
                if (registeredMesh.deltaRotation) {
                    registeredMesh.mesh.rotationQuaternion.multiplyInPlace(registeredMesh.deltaRotation);
                }
            }
        }

        public setGravity(gravity: Vector3): void {
            this._world.gravity.set(gravity.x, gravity.y, gravity.z);
        }

        public registerMesh(mesh: AbstractMesh, impostor: number, options?: PhysicsBodyCreationOptions): any {
            this.unregisterMesh(mesh);

            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }

            mesh.computeWorldMatrix(true);

            var shape = this._createShape(mesh, impostor);

            return this._createRigidBodyFromShape(shape, mesh, options);
        }

        private _createShape(mesh: AbstractMesh, impostor: number) {
		
            //get the correct bounding box
            var oldQuaternion = mesh.rotationQuaternion;
            mesh.rotationQuaternion = new Quaternion(0, 0, 0, 1);
            mesh.computeWorldMatrix(true);

            var returnValue;

            switch (impostor) {
                case PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;

                    returnValue = new CANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);

                    break;
                //TMP also for cylinder - TODO Cannon supports cylinder natively.
                case PhysicsEngine.CylinderImpostor:
                    Tools.Warn("CylinderImposter not yet implemented, using BoxImposter instead");
                case PhysicsEngine.BoxImpostor:
                    bbox = mesh.getBoundingInfo().boundingBox;
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min).scale(0.5);
                    returnValue = new CANNON.Box(new CANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z)));
                    break;
                case PhysicsEngine.PlaneImpostor:
                    Tools.Warn("Attention, Cannon.js PlaneImposter might not behave as you wish. Consider using BoxImposter instead");
                    returnValue = new CANNON.Plane();
                    break;
                case PhysicsEngine.MeshImpostor:
                    var rawVerts = mesh.getVerticesData(VertexBuffer.PositionKind);
                    var rawFaces = mesh.getIndices();

                    returnValue = this._createConvexPolyhedron(rawVerts, rawFaces, mesh);
                    break;
                case PhysicsEngine.HeightmapImpostor:
                    returnValue = this._createHeightmap(mesh);
                    break;

            }

            mesh.rotationQuaternion = oldQuaternion;

            return returnValue;
        }

        private _createConvexPolyhedron(rawVerts: number[] | Float32Array, rawFaces: number[], mesh: AbstractMesh): any {
            var verts = [], faces = [];

            mesh.computeWorldMatrix(true);

            // Get vertices
            for (var i = 0; i < rawVerts.length; i += 3) {
                var transformed = Vector3.Zero();

                Vector3.TransformNormalFromFloatsToRef(rawVerts[i], rawVerts[i + 1], rawVerts[i + 2], mesh.getWorldMatrix(), transformed);
                verts.push(new CANNON.Vec3(transformed.x, transformed.y, transformed.z));
            }

            // Get faces
            for (var j = 0; j < rawFaces.length; j += 3) {
                faces.push([rawFaces[j], rawFaces[j + 2], rawFaces[j + 1]]);
            }

            var shape = new CANNON.ConvexPolyhedron(verts, faces);

            return shape;
        }

        private _createHeightmap(mesh: AbstractMesh) {
            var pos = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);

            if (pos[0] !== pos[pos.length - 1]) {
                console.log("ERROR");
                return;
            }

            var matrix = [];
            
            //dimension
            var dim = -pos[0];

            //array size
            var arraySize = -1;
            for (var i = 0; i < pos.length; i = i + 3) {
                if (pos[i + 2] === pos[2]) {
                    arraySize++;
                } else {
                    break;
                }
            }

            //calculate element size
            var elementSize = dim * 2 / arraySize;
            
            //calculate the matrix for cannon's heightfield
            for (var i = 0; i < pos.length; i = i + 3) {
                var x = Math.round((pos[i + 0]) / elementSize + arraySize / 2);
                var z = Math.round(((pos[i + 2]) / elementSize - arraySize / 2) * -1);
                if (!matrix[x]) {
                    matrix[x] = [];
                }
                matrix[x][z] = pos[i + 1];
            }

            var shape = new CANNON.Heightfield(matrix, {
                elementSize: elementSize
            });
            
            //For future reference, needed for body transformation
            shape.dim = dim;

            return shape;
        }

        private _addMaterial(friction: number, restitution: number) {
            var index;
            var mat;

            for (index = 0; index < this._physicsMaterials.length; index++) {
                mat = this._physicsMaterials[index];

                if (mat.friction === friction && mat.restitution === restitution) {
                    return mat;
                }
            }

            var currentMat = new CANNON.Material("mat");
            this._physicsMaterials.push(currentMat);

            for (index = 0; index < this._physicsMaterials.length; index++) {
                mat = this._physicsMaterials[index];

                var contactMaterial = new CANNON.ContactMaterial(mat, currentMat, { friction: friction, restitution: restitution });

                this._world.addContactMaterial(contactMaterial);
            }

            return currentMat;
        }

        private _createRigidBodyFromShape(shape: any, mesh: AbstractMesh, options: PhysicsBodyCreationOptions): any {
            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
            
            // The delta between the mesh position and the mesh bounding box center
            var bbox = mesh.getBoundingInfo().boundingBox;
            var deltaPosition = mesh.position.subtract(bbox.center);
            var deltaRotation;

            var material = this._addMaterial(options.friction, options.restitution);
            var body = new CANNON.Body({
                mass: options.mass,
                material: material,
                position: new CANNON.Vec3(bbox.center.x, bbox.center.y, bbox.center.z)
            });

            body.quaternion = new CANNON.Quaternion(mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w);
            //is shape is a plane or a heightmap, it must be rotated 90 degs in the X axis.
            if (shape.type === CANNON.Shape.types.PLANE || shape.type === CANNON.Shape.types.HEIGHTFIELD) {
                //-90 DEG in X, precalculated
                var tmpQ = new CANNON.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
                body.quaternion = body.quaternion.mult(tmpQ);
                //Invert!
                deltaRotation = new Quaternion(0.7071067811865475, 0, 0, 0.7071067811865475);
            }
            
            //If it is a heightfield, if should be centered.
            if (shape.type === CANNON.Shape.types.HEIGHTFIELD) {
                body.position = new CANNON.Vec3(-shape.dim, 0, shape.dim).vadd(mesh.position);
                //add it inverted to the delta 
                deltaPosition = mesh.position.add(new BABYLON.Vector3(shape.dim, 0, -shape.dim));
            }
            
            //add the shape
            body.addShape(shape);

            this._world.add(body);

            this._registeredMeshes.push({ mesh: mesh, body: body, material: material, delta: deltaPosition, deltaRotation: deltaRotation });

            return body;
        }

        public registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any {

            var initialMesh = parts[0].mesh;

            this.unregisterMesh(initialMesh);

            initialMesh.computeWorldMatrix(true);

            var initialShape = this._createShape(initialMesh, parts[0].impostor);
            var body = this._createRigidBodyFromShape(initialShape, initialMesh, options);

            for (var index = 1; index < parts.length; index++) {
                var mesh = parts[index].mesh;
                mesh.computeWorldMatrix(true);
                var shape = this._createShape(mesh, parts[index].impostor);
                var localPosition = mesh.position;

                body.addShape(shape, new CANNON.Vec3(localPosition.x, localPosition.y, localPosition.z));
            }

            return body;
        }

        private _unbindBody(body): void {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];

                if (registeredMesh.body === body) {
                    this._world.remove(registeredMesh.body);
                    registeredMesh.body = null;
                    registeredMesh.delta = null;
                    registeredMesh.deltaRotation = null;
                }
            }
        }

        public unregisterMesh(mesh: AbstractMesh): void {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];

                if (registeredMesh.mesh === mesh) {
                    // Remove body
                    if (registeredMesh.body) {
                        this._unbindBody(registeredMesh.body);
                    }

                    this._registeredMeshes.splice(index, 1);
                    return;
                }
            }
        }

        public applyImpulse(mesh: AbstractMesh, force: Vector3, contactPoint: Vector3): void {
            var worldPoint = new CANNON.Vec3(contactPoint.x, contactPoint.y, contactPoint.z);
            var impulse = new CANNON.Vec3(force.x, force.y, force.z);

            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];

                if (registeredMesh.mesh === mesh) {
                    registeredMesh.body.applyImpulse(impulse, worldPoint);
                    return;
                }
            }
        }

        public updateBodyPosition = function (mesh: AbstractMesh): void {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh || registeredMesh.mesh === mesh.parent) {
                    var body = registeredMesh.body;

                    var center = mesh.getBoundingInfo().boundingBox.center;
                    body.position.set(center.x, center.y, center.z);

                    body.quaternion.copy(mesh.rotationQuaternion);

                    if (registeredMesh.deltaRotation) {
                        var tmpQ = new CANNON.Quaternion(-0.7071067811865475, 0, 0, 0.7071067811865475);
                        body.quaternion = body.quaternion.mult(tmpQ);
                    }
                    
                    //TODO - If the body is heightmap-based, this won't work correctly. find a good fix.
                    
                    return;
                }
            }
        }

        public createLink(mesh1: AbstractMesh, mesh2: AbstractMesh, pivot1: Vector3, pivot2: Vector3): boolean {
            var body1 = null, body2 = null;
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];

                if (registeredMesh.mesh === mesh1) {
                    body1 = registeredMesh.body;
                } else if (registeredMesh.mesh === mesh2) {
                    body2 = registeredMesh.body;
                }
            }

            if (!body1 || !body2) {
                return false;
            }

            var constraint = new CANNON.PointToPointConstraint(body1, new CANNON.Vec3(pivot1.x, pivot1.y, pivot1.z), body2, new CANNON.Vec3(pivot2.x, pivot2.y, pivot2.z));
            this._world.addConstraint(constraint);

            return true;
        }

        public dispose(): void {
            while (this._registeredMeshes.length) {
                this.unregisterMesh(this._registeredMeshes[0].mesh);
            }
        }

        public isSupported(): boolean {
            return window.CANNON !== undefined;
        }

        public getWorldObject(): any {
            return this._world;
        }

        public getPhysicsBodyOfMesh(mesh: AbstractMesh) {
            for (var index = 0; index < this._registeredMeshes.length; index++) {
                var registeredMesh = this._registeredMeshes[index];
                if (registeredMesh.mesh === mesh) {
                    return registeredMesh.body;
                }
            }
            return null;
        }
    }
}



