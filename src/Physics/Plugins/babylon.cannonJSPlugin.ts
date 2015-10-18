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

                if(!registeredMesh.delta) {
                    registeredMesh.delta = Vector3.Zero();
                }

                registeredMesh.mesh.position.x = bodyX + registeredMesh.delta.x;
                registeredMesh.mesh.position.y = bodyY + registeredMesh.delta.y;
                registeredMesh.mesh.position.z = bodyZ + registeredMesh.delta.z;

                registeredMesh.mesh.rotationQuaternion.x = registeredMesh.body.quaternion.x;
                registeredMesh.mesh.rotationQuaternion.y = registeredMesh.body.quaternion.y;
                registeredMesh.mesh.rotationQuaternion.z = registeredMesh.body.quaternion.z;
                registeredMesh.mesh.rotationQuaternion.w = registeredMesh.body.quaternion.w;
            }
        }

        public setGravity(gravity: Vector3): void {
            this._world.gravity.set(gravity.x, gravity.y, gravity.z);
        }

        public registerMesh(mesh: AbstractMesh, impostor: number, options?: PhysicsBodyCreationOptions): any {
            this.unregisterMesh(mesh);

            mesh.computeWorldMatrix(true);

            var shape = this._createShape(mesh, impostor, options);

            return this._createRigidBodyFromShape(shape, mesh, options.mass, options.friction, options.restitution);
        }

        private _createShape(mesh: AbstractMesh, impostor: number, options?: PhysicsBodyCreationOptions) {
            switch (impostor) {
                case PhysicsEngine.SphereImpostor:
                    var bbox = mesh.getBoundingInfo().boundingBox;
                    var radiusX = bbox.maximumWorld.x - bbox.minimumWorld.x;
                    var radiusY = bbox.maximumWorld.y - bbox.minimumWorld.y;
                    var radiusZ = bbox.maximumWorld.z - bbox.minimumWorld.z;

                    return new CANNON.Sphere(Math.max(this._checkWithEpsilon(radiusX), this._checkWithEpsilon(radiusY), this._checkWithEpsilon(radiusZ)) / 2);
                //TMP also for cylinder - TODO Cannon supports cylinder natively.
                case PhysicsEngine.CylinderImpostor:
                    Tools.Warn("CylinderImposter not yet implemented, using BoxImposter instead");
                case PhysicsEngine.BoxImpostor:
                    bbox = mesh.getBoundingInfo().boundingBox;
                    var min = bbox.minimumWorld;
                    var max = bbox.maximumWorld;
                    var box = max.subtract(min).scale(0.5);
                    return new CANNON.Box(new CANNON.Vec3(this._checkWithEpsilon(box.x), this._checkWithEpsilon(box.y), this._checkWithEpsilon(box.z)));
                case PhysicsEngine.PlaneImpostor:
                    Tools.Warn("Attention, Cannon.js PlaneImposter might not behave as you wish. Consider using BoxImposter instead");
                    return new CANNON.Plane();
                case PhysicsEngine.MeshImpostor:
                    var rawVerts = mesh.getVerticesData(VertexBuffer.PositionKind);
                    var rawFaces = mesh.getIndices();

                    return this._createConvexPolyhedron(rawVerts, rawFaces, mesh, options);
            }
        }

        private _createConvexPolyhedron(rawVerts: number[] | Float32Array, rawFaces: number[], mesh: AbstractMesh, options?: PhysicsBodyCreationOptions): any {
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

        private _createRigidBodyFromShape(shape: any, mesh: AbstractMesh, mass: number, friction: number, restitution: number): any {
            if (!mesh.rotationQuaternion) {
                mesh.rotationQuaternion = Quaternion.RotationYawPitchRoll(mesh.rotation.y, mesh.rotation.x, mesh.rotation.z);
            }
            
            // The delta between the mesh position and the mesh bounding box center
            var bbox = mesh.getBoundingInfo().boundingBox;
            var deltaPosition = mesh.position.subtract(bbox.center);

            var material = this._addMaterial(friction, restitution);
            var body = new CANNON.Body({
                mass: mass,
                material: material,
                position: new CANNON.Vec3(bbox.center.x, bbox.center.y, bbox.center.z)
            });

            body.quaternion = new CANNON.Quaternion(mesh.rotationQuaternion.x, mesh.rotationQuaternion.y, mesh.rotationQuaternion.z, mesh.rotationQuaternion.w);
            //is shape is a plane, it must be rotated 90 degs in the X axis.
            if (shape.type === CANNON.Shape.types.PLANE) {
                var tmpQ = new CANNON.Quaternion();
                tmpQ.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
                body.quaternion = body.quaternion.mult(tmpQ);
            }
            
            //add the shape
            body.addShape(shape);

            this._world.add(body);

            this._registeredMeshes.push({ mesh: mesh, body: body, material: material, delta: deltaPosition });

            return body;
        }

        public registerMeshesAsCompound(parts: PhysicsCompoundBodyPart[], options: PhysicsBodyCreationOptions): any {

            var initialMesh = parts[0].mesh;

            this.unregisterMesh(initialMesh);

            initialMesh.computeWorldMatrix(true);

            var initialShape = this._createShape(initialMesh, parts[0].impostor);
            var body = this._createRigidBodyFromShape(initialShape, initialMesh, options.mass, options.friction, options.restitution);

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

                    body.quaternion.x = mesh.rotationQuaternion.x;
                    body.quaternion.z = mesh.rotationQuaternion.z;
                    body.quaternion.y = mesh.rotationQuaternion.y;
                    body.quaternion.w = mesh.rotationQuaternion.w;
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
        
        public getWorldObject() : any {
            return this._world;
        }
    }
}

