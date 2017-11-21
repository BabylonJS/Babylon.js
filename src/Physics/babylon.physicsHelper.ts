module BABYLON {

    /**
     * The strenght of the force in correspondence to the distance of the affected object
     */
    export enum PhysicsRadialImpulseFallof {
        Constant, // impulse is constant in strength across it's whole radius
        Linear // impulse gets weaker if it's further from the origin
    }

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
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public applyRadialExplosionImpulse(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant): Nullable<PhysicsRadialExplosionEvent> {
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

            event.cleanup(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public applyRadialExplosionForce(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant): Nullable<PhysicsRadialExplosionEvent> {
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
            })

            event.cleanup(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public gravitationalField(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant): Nullable<PhysicsGravitationalFieldEvent> {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }

            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            var event = new PhysicsGravitationalFieldEvent(this, this._scene, origin, radius, strength, falloff);

            event.cleanup(false);

            return event;
        }
    }

    /***** Radial explosion *****/

    export class PhysicsRadialExplosionEvent {

        private _scene: Scene;
        private _radialSphere: Mesh; // create a sphere, so we can get the intersecting meshes inside
        private _rays: Array<Ray> = [];
        private _dataFetched: boolean = false; // check if the data has been fetched. If not, do cleanup

        constructor(scene: Scene) {
            this._scene = scene;
        }

        /**
         * Returns the data related to the radial explosion event (radialSphere & rays).
         * @returns {PhysicsRadialExplosionEventData}
         */
        public getData(): PhysicsRadialExplosionEventData {
            this._dataFetched = true;

            return {
                radialSphere: this._radialSphere,
                rays: this._rays,
            };
        }

        /**
         * Returns the force and contact point of the impostor or false, if the impostor is not affected by the force/impulse.
         * @param impostor 
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear
         * @returns {Nullable<PhysicsForceAndContactPoint>}
         */
        public getImpostorForceAndContactPoint(impostor: PhysicsImpostor, origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFallof): Nullable<PhysicsForceAndContactPoint> {
            if (impostor.mass === 0) {
                return null;
            }

            if (!this._intersectsWithRadialSphere(impostor, origin, radius)) {
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

            var multiplier = falloff === PhysicsRadialImpulseFallof.Constant
                ? strength
                : strength * (1 - (distanceFromOrigin / radius));

            var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

            return { force: force, contactPoint: contactPoint };
        }

        /**
         * Disposes the radialSphere.
         * @param {bolean} force
         */
        public cleanup(force: boolean = true) {
            if (force) {
                this._radialSphere.dispose();
            } else {
                setTimeout(() => {
                    if (!this._dataFetched) {
                        this._radialSphere.dispose();
                    }
                }, 0);
            }
        }

        /*** Helpers ***/

        private _prepareRadialSphere(): void {
            if (!this._radialSphere) {
                this._radialSphere = MeshBuilder.CreateSphere("radialSphere", { segments: 32, diameter: 1 }, this._scene);
                this._radialSphere.isVisible = false;
            }
        }

        private _intersectsWithRadialSphere(impostor: PhysicsImpostor, origin: Vector3, radius: number): boolean {
            var impostorObject = <Mesh>impostor.object;

            this._prepareRadialSphere();

            this._radialSphere.position = origin;
            this._radialSphere.scaling = new Vector3(radius * 2, radius * 2, radius * 2);
            this._radialSphere._updateBoundingInfo();
            this._radialSphere.computeWorldMatrix(true);

            return this._radialSphere.intersectsMesh(impostorObject, true);
        }

    }

    export interface PhysicsRadialExplosionEventData {
        radialSphere: Mesh;
        rays: Array<Ray>;
    }

    export interface PhysicsForceAndContactPoint {
        force: Vector3;
        contactPoint: Vector3;
    }


    /***** Gravitational Field *****/

    export class PhysicsGravitationalFieldEvent {

        private _physicsHelper: PhysicsHelper;
        private _scene: Scene;
        private _origin: Vector3;
        private _radius: number;
        private _strength: number;
        private _falloff: PhysicsRadialImpulseFallof;
        private _tickCallback: any;
        private _radialSphere: Mesh;
        private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

        constructor(
            physicsHelper: PhysicsHelper,
            scene: Scene,
            origin: Vector3,
            radius: number,
            strength: number,
            falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant
        ) {
            this._physicsHelper = physicsHelper;
            this._scene = scene;
            this._origin = origin;
            this._radius = radius;
            this._strength = strength;
            this._falloff = falloff;
            this._tickCallback = this._tick.bind(this);
        }

        /**
         * Returns the data related to the gravitational field event (radialSphere).
         * @returns {PhysicsGravitationalFieldEventData}
         */
        public getData(): PhysicsGravitationalFieldEventData {
            this._dataFetched = true;

            return {
                radialSphere: this._radialSphere,
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
         * Disposes the radialSphere.
         * @param {bolean} force
         */
        public cleanup(force: boolean = true) {
            if (force) {
                this._radialSphere.dispose();
            } else {
                setTimeout(() => {
                    if (!this._dataFetched) {
                        this._radialSphere.dispose();
                    }
                }, 0);
            }
        }

        private _tick() {
            // Since the params won't change, we fetch the event only once
            if (this._radialSphere) {
                this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
            } else {
                var radialExplosionEvent = this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
                if (radialExplosionEvent) {
                    this._radialSphere = <Mesh>radialExplosionEvent.getData().radialSphere.clone('radialSphereClone');
                }
            }
        }

    }

    export interface PhysicsGravitationalFieldEventData {
        radialSphere: Mesh;
    }

}
