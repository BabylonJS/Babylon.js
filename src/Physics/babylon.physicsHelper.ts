module BABYLON {

    export class PhysicsHelper {

        private _scene: Scene;
        private _physicsEngine: Nullable<PhysicsEngine>;

        constructor(scene: Scene) {
            this._scene = scene;
            this._physicsEngine = this._scene.getPhysicsEngine();

            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you can use the methods.');
            }
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public applyRadialExplosionImpulse(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant): Nullable<PhysicsRadialExplosionEvent> {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call this method.');
                return null;
            }

            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            var event = new PhysicsRadialExplosionEvent(this._scene);

            impostors.forEach(impostor => {
                var impostorForceAndContactPoint = event.getImpostorForceAndContactPoint(impostor, origin, radius, strength, falloff);
                if (!impostorForceAndContactPoint) {
                    return;
                }

                impostor.applyImpulse(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });

            event.dispose(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public applyRadialExplosionForce(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant): Nullable<PhysicsRadialExplosionEvent> {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }

            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            var event = new PhysicsRadialExplosionEvent(this._scene);

            impostors.forEach(impostor => {
                var impostorForceAndContactPoint = event.getImpostorForceAndContactPoint(impostor, origin, radius, strength, falloff);
                if (!impostorForceAndContactPoint) {
                    return;
                }

                impostor.applyForce(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });

            event.dispose(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public gravitationalField(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant): Nullable<PhysicsGravitationalFieldEvent> {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }

            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            var event = new PhysicsGravitationalFieldEvent(this, this._scene, origin, radius, strength, falloff);

            event.dispose(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the updraft
         * @param {number} radius the radius of the updraft
         * @param {number} strength the strength of the updraft
         * @param {number} height the height of the updraft
         * @param {PhysicsUpdraftMode} updraftMode possible options: Center & Perpendicular. Defaults to Center
         */
        public updraft(origin: Vector3, radius: number, strength: number, height: number, updraftMode: PhysicsUpdraftMode = PhysicsUpdraftMode.Center): Nullable<PhysicsUpdraftEvent> {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }

            if (this._physicsEngine.getImpostors().length === 0) {
                return null;
            }

            var event = new PhysicsUpdraftEvent(this._physicsEngine, this._scene, origin, radius, strength, height, updraftMode);

            event.dispose(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the vortex
         * @param {number} radius the radius of the vortex
         * @param {number} strength the strength of the vortex
         * @param {number} height the height of the vortex
         * @param {number} angularVelocity the angularVelocity for the vortex
         */
        public vortex(origin: Vector3, radius: number, strength: number, height: number, angularVelocity: number): Nullable<PhysicsVortexEvent> {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }

            if (this._physicsEngine.getImpostors().length === 0) {
                return null;
            }

            var event = new PhysicsVortexEvent(this._physicsEngine, this._scene, origin, radius, strength, height, angularVelocity);

            event.dispose(false);

            return event;
        }
    }


    /***** Radial explosion *****/

    export class PhysicsRadialExplosionEvent {

        private _scene: Scene;
        private _sphere: Mesh; // create a sphere, so we can get the intersecting meshes inside
        private _sphereOptions: { segments: number, diameter: number } = { segments: 32, diameter: 1 }; // TODO: make configurable
        private _rays: Array<Ray> = [];
        private _dataFetched: boolean = false; // check if the data has been fetched. If not, do cleanup

        constructor(scene: Scene) {
            this._scene = scene;
        }

        /**
         * Returns the data related to the radial explosion event (sphere & rays).
         * @returns {PhysicsRadialExplosionEventData}
         */
        public getData(): PhysicsRadialExplosionEventData {
            this._dataFetched = true;

            return {
                sphere: this._sphere,
                rays: this._rays,
            };
        }

        /**
         * Returns the force and contact point of the impostor or false, if the impostor is not affected by the force/impulse.
         * @param impostor 
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFalloff} falloff possible options: Constant & Linear
         * @returns {Nullable<PhysicsForceAndContactPoint>}
         */
        public getImpostorForceAndContactPoint(impostor: PhysicsImpostor, origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff): Nullable<PhysicsForceAndContactPoint> {
            if (impostor.mass === 0) {
                return null;
            }

            if (!this._intersectsWithSphere(impostor, origin, radius)) {
                return null;
            }

            var impostorObject = (<Mesh>impostor.object);
            var impostorObjectCenter = impostor.getObjectCenter();
            var direction = impostorObjectCenter.subtract(origin);

            var ray = new Ray(origin, direction, radius);
            this._rays.push(ray);
            var hit = ray.intersectsMesh(impostorObject);

            var contactPoint = hit.pickedPoint;
            if (!contactPoint) {
                return null;
            }

            var distanceFromOrigin = Vector3.Distance(origin, contactPoint);
            if (distanceFromOrigin > radius) {
                return null;
            }

            var multiplier = falloff === PhysicsRadialImpulseFalloff.Constant
                ? strength
                : strength * (1 - (distanceFromOrigin / radius));

            var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

            return { force: force, contactPoint: contactPoint };
        }

        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        public dispose(force: boolean = true) {
            if (force) {
                this._sphere.dispose();
            } else {
                setTimeout(() => {
                    if (!this._dataFetched) {
                        this._sphere.dispose();
                    }
                }, 0);
            }
        }

        /*** Helpers ***/

        private _prepareSphere(): void {
            if (!this._sphere) {
                this._sphere = MeshBuilder.CreateSphere("radialExplosionEventSphere", this._sphereOptions, this._scene);
                this._sphere.isVisible = false;
            }
        }

        private _intersectsWithSphere(impostor: PhysicsImpostor, origin: Vector3, radius: number): boolean {
            var impostorObject = <Mesh>impostor.object;

            this._prepareSphere();

            this._sphere.position = origin;
            this._sphere.scaling = new Vector3(radius * 2, radius * 2, radius * 2);
            this._sphere._updateBoundingInfo();
            this._sphere.computeWorldMatrix(true);

            return this._sphere.intersectsMesh(impostorObject, true);
        }

    }


    /***** Gravitational Field *****/

    export class PhysicsGravitationalFieldEvent {

        private _physicsHelper: PhysicsHelper;
        private _scene: Scene;
        private _origin: Vector3;
        private _radius: number;
        private _strength: number;
        private _falloff: PhysicsRadialImpulseFalloff;
        private _tickCallback: any;
        private _sphere: Mesh;
        private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

        constructor(physicsHelper: PhysicsHelper, scene: Scene, origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant) {
            this._physicsHelper = physicsHelper;
            this._scene = scene;
            this._origin = origin;
            this._radius = radius;
            this._strength = strength;
            this._falloff = falloff;
            this._tickCallback = this._tick.bind(this);
        }

        /**
         * Returns the data related to the gravitational field event (sphere).
         * @returns {PhysicsGravitationalFieldEventData}
         */
        public getData(): PhysicsGravitationalFieldEventData {
            this._dataFetched = true;

            return {
                sphere: this._sphere,
            };
        }

        /**
         * Enables the gravitational field.
         */
        public enable() {
            this._tickCallback.call(this);
            this._scene.registerBeforeRender(this._tickCallback);
        }

        /**
         * Disables the gravitational field.
         */
        public disable() {
            this._scene.unregisterBeforeRender(this._tickCallback);
        }

        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        public dispose(force: boolean = true) {
            if (force) {
                this._sphere.dispose();
            } else {
                setTimeout(() => {
                    if (!this._dataFetched) {
                        this._sphere.dispose();
                    }
                }, 0);
            }
        }

        private _tick() {
            // Since the params won't change, we fetch the event only once
            if (this._sphere) {
                this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
            } else {
                var radialExplosionEvent = this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
                if (radialExplosionEvent) {
                    this._sphere = <Mesh>radialExplosionEvent.getData().sphere.clone('radialExplosionEventSphereClone');
                }
            }
        }

    }


    /***** Updraft *****/

    export class PhysicsUpdraftEvent {

        private _physicsEngine: PhysicsEngine;
        private _scene: Scene;
        private _origin: Vector3;
        private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
        private _originDirection: Vector3 = Vector3.Zero(); // used if the updraftMode is perpendicular
        private _radius: number;
        private _strength: number;
        private _height: number;
        private _updraftMode: PhysicsUpdraftMode;
        private _tickCallback: any;
        private _cylinder: Mesh;
        private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
        private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup
 
        constructor(physicsEngine: PhysicsEngine, scene: Scene, origin: Vector3, radius: number, strength: number, height: number, updraftMode: PhysicsUpdraftMode) {
            this._physicsEngine = physicsEngine;
            this._scene = scene;
            this._origin = origin;
            this._radius = radius;
            this._strength = strength;
            this._height = height;
            this._updraftMode = updraftMode;

            this._origin.addToRef(new Vector3(0, this._height / 2, 0), this._cylinderPosition);
            this._origin.addToRef(new Vector3(0, this._height, 0), this._originTop);

            if (this._updraftMode === PhysicsUpdraftMode.Perpendicular) {
                this._originDirection = this._origin.subtract(this._originTop).normalize();
            }
 
            this._tickCallback = this._tick.bind(this);
        }

        /**
         * Returns the data related to the updraft event (cylinder).
         * @returns {PhysicsUpdraftEventData}
         */
        public getData(): PhysicsUpdraftEventData {
            this._dataFetched = true;

            return {
                cylinder: this._cylinder,
            };
        }

        /**
         * Enables the updraft.
         */
        public enable() {
            this._tickCallback.call(this);
            this._scene.registerBeforeRender(this._tickCallback);
        }

        /**
         * Disables the cortex.
         */
        public disable() {
            this._scene.unregisterBeforeRender(this._tickCallback);
        }

        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        public dispose(force: boolean = true) {
            if (force) {
                this._cylinder.dispose();
            } else {
                setTimeout(() => {
                    if (!this._dataFetched) {
                        this._cylinder.dispose();
                    }
                }, 0);
            }
        }

        private getImpostorForceAndContactPoint(impostor: PhysicsImpostor): Nullable<PhysicsForceAndContactPoint> {
            if (impostor.mass === 0) {
                return null;
            }

            if (!this._intersectsWithCylinder(impostor)) {
                return null;
            }

            var impostorObjectCenter = impostor.getObjectCenter();

            if (this._updraftMode === PhysicsUpdraftMode.Perpendicular) {
                var direction = this._originDirection;
            } else {
                var direction = impostorObjectCenter.subtract(this._originTop);
            }

            var multiplier = this._strength * -1;

            var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

            return { force: force, contactPoint: impostorObjectCenter };
        }

        private _tick() {
            this._physicsEngine.getImpostors().forEach(impostor => {
                var impostorForceAndContactPoint = this.getImpostorForceAndContactPoint(impostor);
                if (!impostorForceAndContactPoint) {
                    return;
                }

                impostor.applyForce(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });
        }

        /*** Helpers ***/

        private _prepareCylinder(): void {
            if (!this._cylinder) {
                this._cylinder = MeshBuilder.CreateCylinder("updraftEventCylinder", {
                    height: this._height,
                    diameter: this._radius * 2,
                }, this._scene);
                this._cylinder.isVisible = false;
            }
        }

        private _intersectsWithCylinder(impostor: PhysicsImpostor): boolean {
            var impostorObject = <Mesh>impostor.object;

            this._prepareCylinder();

            this._cylinder.position = this._cylinderPosition;

            return this._cylinder.intersectsMesh(impostorObject, true);
        }

    }


    /***** Vortex *****/

    export class PhysicsVortexEvent {

        private _physicsEngine: PhysicsEngine;
        private _scene: Scene;
        private _origin: Vector3;
        private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
        private _radius: number;
        private _strength: number;
        private _height: number;
        private _angularVelocity: number;
        private _centripetalForceThreshold: number = 0.6;
        private _updraftMultiplier: number = 0.02;
        private _tickCallback: any;
        private _cylinder: Mesh;
        private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
        private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

        constructor(physicsEngine: PhysicsEngine, scene: Scene, origin: Vector3, radius: number, strength: number, height: number, angularVelocity: number) {
            this._physicsEngine = physicsEngine;
            this._scene = scene;
            this._origin = origin;
            this._radius = radius;
            this._strength = strength;
            this._height = height;
            this._angularVelocity = angularVelocity;

            this._origin.addToRef(new Vector3(0, this._height / 2, 0), this._cylinderPosition);
            this._origin.addToRef(new Vector3(0, this._height, 0), this._originTop);

            this._tickCallback = this._tick.bind(this);
        }

        /**
         * Returns the data related to the vortex event (cylinder).
         * @returns {PhysicsVortexEventData}
         */
        public getData(): PhysicsVortexEventData {
            this._dataFetched = true;

            return {
                cylinder: this._cylinder,
            };
        }

        /**
         * Enables the vortex.
         */
        public enable() {
            this._tickCallback.call(this);
            this._scene.registerBeforeRender(this._tickCallback);
        }

        /**
         * Disables the cortex.
         */
        public disable() {
            this._scene.unregisterBeforeRender(this._tickCallback);
        }

        /**
         * Disposes the sphere.
         * @param {bolean} force
         */
        public dispose(force: boolean = true) {
            if (force) {
                this._cylinder.dispose();
            } else {
                setTimeout(() => {
                    if (!this._dataFetched) {
                        this._cylinder.dispose();
                    }
                }, 0);
            }
        }

        private getImpostorForceAndContactPoint(impostor: PhysicsImpostor): Nullable<PhysicsForceAndContactPoint> {
            if (impostor.mass === 0) {
                return null;
            }

            if (!this._intersectsWithCylinder(impostor)) {
                return null;
            }

            var impostorObject = <Mesh>impostor.object;
            var impostorObjectCenter = impostor.getObjectCenter();
            var originOnPlane = new Vector3(this._origin.x, impostorObjectCenter.y, this._origin.z); // the distance to the origin as if both objects were on a plane (Y-axis)
            var originToImpostorDirection = impostorObjectCenter.subtract(originOnPlane);

            var ray = new Ray(originOnPlane, originToImpostorDirection, this._radius);
            var hit = ray.intersectsMesh(impostorObject);
            var contactPoint = hit.pickedPoint;
            if (!contactPoint) {
                return null;
            }

            var absoluteDistanceFromOrigin = hit.distance / this._radius;
            var perpendicularDirection = Vector3.Cross(originOnPlane, impostorObjectCenter).normalize();
            var directionToOrigin = contactPoint.normalize();
            if (absoluteDistanceFromOrigin > this._centripetalForceThreshold) {
                directionToOrigin = directionToOrigin.negate();
            }

            var forceX = (perpendicularDirection.x + directionToOrigin.x) / 2;
            var forceY = this._originTop.y * this._updraftMultiplier;
            var forceZ = (perpendicularDirection.z + directionToOrigin.z) / 2;

            // TODO: find a more physically based solution
            if (absoluteDistanceFromOrigin > 0.8) {
                forceX = directionToOrigin.x * this._strength / 8;
                forceY = directionToOrigin.y * this._updraftMultiplier;
                forceZ = directionToOrigin.z * this._strength / 8;
            }

            // TODO: implement angular velocity

            var force = new Vector3(forceX, forceY, forceZ);

            force = force.multiplyByFloats(this._strength, this._strength, this._strength);

            /*
            // DEBUG
                // Force - Red
                var debugForceRay = new Ray(impostorObjectCenter, force, 0.2);
                var debugForceRayHelper = new BABYLON.RayHelper(debugForceRay);
                debugForceRayHelper.show(this._scene, new BABYLON.Color3(1, 0, 0));
                setTimeout(function (debugForceRayHelper) { debugForceRayHelper.dispose() }, 20, debugForceRayHelper);


                // Direction to origin - Blue
                 var debugDirectionRay = new Ray(impostorObjectCenter, directionToOrigin, 2.5);
                var debugDirectionRayHelper = new BABYLON.RayHelper(debugDirectionRay);
                debugDirectionRayHelper.show(this._scene, new BABYLON.Color3(0, 0, 1));
                setTimeout(function (debugDirectionRayHelper) { debugDirectionRayHelper.dispose() }, 20, debugDirectionRayHelper);

                // Perpendicular direction - Green
                var debugPerpendicularDirectionRay = new Ray(impostorObjectCenter, perpendicularDirection, 2.5);
                var debugPerpendicularDirectionRayHelper = new BABYLON.RayHelper(debugPerpendicularDirectionRay);
                debugPerpendicularDirectionRayHelper.show(this._scene, new BABYLON.Color3(0, 1, 0));
                setTimeout(function (debugPerpendicularDirectionRayHelper) { debugPerpendicularDirectionRayHelper.dispose() }, 20, debugPerpendicularDirectionRayHelper);
            // DEBUG /END
            */

            return { force: force, contactPoint: impostorObjectCenter };
        }

        private _tick() {
            this._physicsEngine.getImpostors().forEach(impostor => {
                var impostorForceAndContactPoint = this.getImpostorForceAndContactPoint(impostor);
                if (!impostorForceAndContactPoint) {
                    return;
                }

                impostor.applyForce(impostorForceAndContactPoint.force, impostorForceAndContactPoint.contactPoint);
            });
        }

        /*** Helpers ***/

        private _prepareCylinder(): void {
            if (!this._cylinder) {
                this._cylinder = MeshBuilder.CreateCylinder("vortexEventCylinder", {
                    height: this._height,
                    diameter: this._radius * 2,
                }, this._scene);
                this._cylinder.isVisible = false;
            }
        }

        private _intersectsWithCylinder(impostor: PhysicsImpostor): boolean {
            var impostorObject = <Mesh>impostor.object;

            this._prepareCylinder();

            this._cylinder.position = this._cylinderPosition;

            return this._cylinder.intersectsMesh(impostorObject, true);
        }

    }


    /***** Enums *****/

    /**
    * The strenght of the force in correspondence to the distance of the affected object
    */
    export enum PhysicsRadialImpulseFalloff {
        Constant, // impulse is constant in strength across it's whole radius
        Linear // impulse gets weaker if it's further from the origin
    }

    /**
     * The strenght of the force in correspondence to the distance of the affected object
     */
    export enum PhysicsUpdraftMode {
        Center, // the upstream forces will pull towards the top center of the cylinder
        Perpendicular // once a impostor is inside the cylinder, it will shoot out perpendicular from the ground of the cylinder
    }


    /***** Data interfaces *****/

    export interface PhysicsForceAndContactPoint {
        force: Vector3;
        contactPoint: Vector3;
    }

    export interface PhysicsRadialExplosionEventData {
        sphere: Mesh;
        rays: Array<Ray>;
    }

    export interface PhysicsGravitationalFieldEventData {
        sphere: Mesh;
    }

    export interface PhysicsUpdraftEventData {
        cylinder: Mesh;
    }

    export interface PhysicsVortexEventData {
        cylinder: Mesh;
    }

}
