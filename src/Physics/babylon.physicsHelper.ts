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

            return event;
        }

    }

    /**
     * All the stuff related to the radial explosion.
     */
    export class PhysicsRadialExplosionEvent {
        
        private _scene: Scene;
        private _radialSphere: Mesh; // create a sphere, so we can get the intersecting meshes inside
        private _rays: Array<Ray> = [];
        private _rayHelpers: Array<RayHelper> = [];

        constructor(scene: Scene) {
            this._scene = scene;
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

        /***** Debug *****/

        /**
         * Will show the radial sphere & rays.
         * @param rayColor
         */
        public showDebug(rayColor: Color3 = new BABYLON.Color3(1, 1, 0)) {
            if (this._radialSphere) {
                this._radialSphere.isVisible = true;
            }

            if (this._rays.length) {
                this._rayHelpers = [];
                for (var i = 0; i < this._rays.length; i++) {
                    var rayHelper = new RayHelper(this._rays[i]);
                    rayHelper.show(this._scene, rayColor);
                    this._rayHelpers.push(rayHelper);
                }
            }

            return true;
        }

        public hideDebug() {
            if (this._radialSphere) {
                this._radialSphere.isVisible = false;
            }

            if (this._rayHelpers.length) {
                for (var i = 0; i < this._rayHelpers.length; i++) {
                    this._rayHelpers[i].hide();
                }
            }

            return true;
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

            if (!this._radialSphere.material) {
                var radialSphereMaterial = new BABYLON.StandardMaterial("radialSphereMaterial", this._scene);
                radialSphereMaterial.alpha = 0.5;
                this._radialSphere.material = radialSphereMaterial;
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
    
}
