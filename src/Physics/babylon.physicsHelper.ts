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

        public constructor(scene: Scene) {
            this._scene = scene;
            this._physicsEngine = this._scene.getPhysicsEngine();
            
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call this method.');
            }
        }
        
        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public applyRadialExplosionImpulse(
            origin: Vector3,
            radius: number,
            strength: number,
            falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant
        ) {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call this method.');
                return null;
            }
            
            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            var event = new PhysicsRadialExplosionEvent(this._scene);

            for (var i = 0; i < impostors.length; ++i) {
                var impostor = impostors[i];
                var impostorForceAndContactPoint = event.getImpostorForceAndContactPoint(
                    impostor,
                    origin,
                    radius,
                    strength,
                    falloff
                );
                if (impostorForceAndContactPoint === false) {
                    continue;
                }

                impostor.applyImpulse(
                    impostorForceAndContactPoint.force,
                    impostorForceAndContactPoint.contactPoint
                );
            }

            event.cleanup(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public applyRadialExplosionForce(
            origin: Vector3,
            radius: number,
            strength: number,
            falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant
        ) {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }
            
            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            var event = new PhysicsRadialExplosionEvent(this._scene);

            for (var i = 0; i < impostors.length; ++i) {
                var impostor = impostors[i];
                var impostorForceAndContactPoint = event.getImpostorForceAndContactPoint(
                    impostor,
                    origin,
                    radius,
                    strength,
                    falloff
                );
                if (impostorForceAndContactPoint === false) {
                    continue;
                }

                impostor.applyForce(
                    impostorForceAndContactPoint.force,
                    impostorForceAndContactPoint.contactPoint
                );
            }

            event.cleanup(false);

            return event;
        }

        /**
         * @param {Vector3} origin the origin of the explosion
         * @param {number} radius the explosion radius
         * @param {number} strength the explosion strength
         * @param {PhysicsRadialImpulseFallof} falloff possible options: Constant & Linear. Defaults to Constant
         */
        public gravitationalField(
            origin: Vector3,
            radius: number,
            strength: number,
            falloff: PhysicsRadialImpulseFallof = PhysicsRadialImpulseFallof.Constant
        ) {
            if (!this._physicsEngine) {
                Tools.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
                return null;
            }

            var impostors = this._physicsEngine.getImpostors();
            if (impostors.length === 0) {
                return null;
            }

            return new PhysicsGravitationalFieldEvent(
                this,
                this._scene,
                origin,
                radius,
                strength,
                falloff
            );
        }
    }

    /**
     * All the stuff related to the radial explosion.
     */
    export class PhysicsRadialExplosionEvent {
        
        private _scene: Scene;
        private _radialSphere: Mesh; // create a sphere, so we can get the intersecting meshes inside
        private _rays: Array<Ray> = [];
        private _dataFetched: boolean = false; // check if the has fetched the data. If not, do cleanup

        constructor(scene: Scene) {
            this._scene = scene;
        }

        public getData(): PhysicsRadialExplosionEventData {
            this._dataFetched = true;

            return {
                radialSphere: this._radialSphere,
                rays: this._rays,
            };
        }

        public getImpostorForceAndContactPoint(impostor: PhysicsImpostor, origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFallof) {
            if (impostor.mass === 0) {
                return false;
            }

            if (!this._intersectsWithRadialSphere(impostor, origin, radius)) {
                return false;
            }

            var impostorObject = (<Mesh>impostor.object);
            var impostorObjectCenter = impostor.getObjectCenter();
            var direction = impostorObjectCenter.subtract(origin);

            var ray = new Ray(origin, direction, radius);
            this._rays.push(ray);
            var hit = ray.intersectsMesh(impostorObject);

            var contactPoint = hit.pickedPoint;
            if (!contactPoint) {
                return false;
            }

            var distanceFromOrigin = BABYLON.Vector3.Distance(origin, contactPoint);
            if (distanceFromOrigin > radius) {
                return false;
            }

            var multiplier = falloff === PhysicsRadialImpulseFallof.Constant
                ? strength
                : strength * (1 - (distanceFromOrigin / radius));

            var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

            return { force: force, contactPoint: contactPoint };
        }

        /**
         * Cleanup
         */
        public cleanup(force: boolean = true) {
            if (force) {
                this._radialSphere.dispose();
            } else {
                var self = this;
                setTimeout(function () {
                    if (!self._dataFetched) {
                        self._radialSphere.dispose();
                    } else {
                        Tools.Warn('Could not dispose unused objects. Please call "myRadialExplosionEvent.cleanup()" manually after you do not need the data anymore.');
                    }
                }, 0);
            }
        }

        /***** Helpers *****/

        private _prepareRadialSphere() {
            if (!this._radialSphere) {
                this._radialSphere = BABYLON.Mesh.CreateSphere(
                    "radialSphere",
                    32,
                    1,
                    this._scene
                );
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

            return this._radialSphere.intersectsMesh(
                impostorObject,
                true
            );
        }

    }

    export interface PhysicsRadialExplosionEventData {
        radialSphere: Mesh;
        rays: Array<Ray>;
    }

    export class PhysicsGravitationalFieldEvent {

        private _physicsHelper: PhysicsHelper;
        private _scene: Scene;
        private _origin: Vector3;
        private _radius: number;
        private _strength: number;
        private _falloff: PhysicsRadialImpulseFallof;
        private _tickCallback: any;
        private _radialExplosionEvent: PhysicsRadialExplosionEvent;

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

        public getData(callback: (data: PhysicsGravitationalFieldEventData) => void) {
            var self = this;
            // wait until the first tick has ran, so we can the the radialExplosionEvent (& it's data)
            var interval = setInterval(function() {
                if (self._radialExplosionEvent) {
                    clearInterval(interval);
                    callback({
                        radialSphere: <Mesh>self._radialExplosionEvent.getData().radialSphere,
                    });
                }
            }, 16.66);
        }

        public enable() {
            this._scene.registerBeforeRender(this._tickCallback);
        }

        public disable() {
            this._scene.unregisterBeforeRender(this._tickCallback);
        }

        private _tick() {
            // Since the params won't change, we fetch the event only once
            if (this._radialExplosionEvent) {
                this._physicsHelper.applyRadialExplosionForce(
                    this._origin,
                    this._radius,
                    this._strength * -1,
                    this._falloff
                );
            } else {
                this._radialExplosionEvent = <PhysicsRadialExplosionEvent>this._physicsHelper.applyRadialExplosionForce(
                    this._origin,
                    this._radius,
                    this._strength * -1,
                    this._falloff
                );
            }
        }

    }

    export interface PhysicsGravitationalFieldEventData {
        radialSphere: Mesh;
    }

}
