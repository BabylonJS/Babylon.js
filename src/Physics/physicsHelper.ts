import { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { Vector3 } from "../Maths/math.vector";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { SphereBuilder } from "../Meshes/Builders/sphereBuilder";
import { CylinderBuilder } from "../Meshes/Builders/cylinderBuilder";
import { Ray } from "../Culling/ray";
import { Scene } from "../scene";
import { IPhysicsEngine } from "./IPhysicsEngine";
import { PhysicsEngine } from "./physicsEngine";
import { PhysicsImpostor } from "./physicsImpostor";

/**
 * A helper for physics simulations
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export class PhysicsHelper {

    private _scene: Scene;
    private _physicsEngine: Nullable<IPhysicsEngine>;

    /**
     * Initializes the Physics helper
     * @param scene Babylon.js scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._physicsEngine = this._scene.getPhysicsEngine();

        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you can use the methods.');
            return;
        }
    }

    /**
     * Applies a radial explosion impulse
     * @param origin the origin of the explosion
     * @param radiusOrEventOptions the radius or the options of radial explosion
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics radial explosion event, or null
     */
    public applyRadialExplosionImpulse(origin: Vector3, radiusOrEventOptions: number | PhysicsRadialExplosionEventOptions, strength?: number, falloff?: PhysicsRadialImpulseFalloff): Nullable<PhysicsRadialExplosionEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call this method.');
            return null;
        }

        var impostors = this._physicsEngine.getImpostors();
        if (impostors.length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === 'number') {
            radiusOrEventOptions = new PhysicsRadialExplosionEventOptions();
            radiusOrEventOptions.radius = <number><any>radiusOrEventOptions;
            radiusOrEventOptions.strength = strength || radiusOrEventOptions.strength;
            radiusOrEventOptions.falloff = falloff || radiusOrEventOptions.falloff;
        }

        var event = new PhysicsRadialExplosionEvent(this._scene, radiusOrEventOptions);
        var affectedImpostorsWithData = Array<PhysicsAffectedImpostorWithData>();

        impostors.forEach((impostor) => {
            var impostorHitData = event.getImpostorHitData(impostor, origin);
            if (!impostorHitData) {
                return;
            }

            impostor.applyImpulse(impostorHitData.force, impostorHitData.contactPoint);

            affectedImpostorsWithData.push({
                impostor: impostor,
                hitData: impostorHitData,
            });
        });

        event.triggerAffectedImpostorsCallback(affectedImpostorsWithData);

        event.dispose(false);

        return event;
    }

    /**
     * Applies a radial explosion force
     * @param origin the origin of the explosion
     * @param radiusOrEventOptions the radius or the options of radial explosion
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics radial explosion event, or null
     */
    public applyRadialExplosionForce(origin: Vector3, radiusOrEventOptions: number | PhysicsRadialExplosionEventOptions, strength?: number, falloff?: PhysicsRadialImpulseFalloff): Nullable<PhysicsRadialExplosionEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        var impostors = this._physicsEngine.getImpostors();
        if (impostors.length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === 'number') {
            radiusOrEventOptions = new PhysicsRadialExplosionEventOptions();
            radiusOrEventOptions.radius = <number><any>radiusOrEventOptions;
            radiusOrEventOptions.strength = strength || radiusOrEventOptions.strength;
            radiusOrEventOptions.falloff = falloff || radiusOrEventOptions.falloff;
        }

        var event = new PhysicsRadialExplosionEvent(this._scene, radiusOrEventOptions);
        var affectedImpostorsWithData = Array<PhysicsAffectedImpostorWithData>();

        impostors.forEach((impostor) => {
            var impostorHitData = event.getImpostorHitData(impostor, origin);
            if (!impostorHitData) {
                return;
            }

            impostor.applyForce(impostorHitData.force, impostorHitData.contactPoint);

            affectedImpostorsWithData.push({
                impostor: impostor,
                hitData: impostorHitData,
            });
        });

        event.triggerAffectedImpostorsCallback(affectedImpostorsWithData);

        event.dispose(false);

        return event;
    }

    /**
     * Creates a gravitational field
     * @param origin the origin of the explosion
     * @param radiusOrEventOptions the radius or the options of radial explosion
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics gravitational field event, or null
     */
    public gravitationalField(origin: Vector3, radiusOrEventOptions: number | PhysicsRadialExplosionEventOptions, strength?: number, falloff?: PhysicsRadialImpulseFalloff): Nullable<PhysicsGravitationalFieldEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        var impostors = this._physicsEngine.getImpostors();
        if (impostors.length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === 'number') {
            radiusOrEventOptions = new PhysicsRadialExplosionEventOptions();
            radiusOrEventOptions.radius = <number><any>radiusOrEventOptions;
            radiusOrEventOptions.strength = strength || radiusOrEventOptions.strength;
            radiusOrEventOptions.falloff = falloff || radiusOrEventOptions.falloff;
        }

        var event = new PhysicsGravitationalFieldEvent(this, this._scene, origin, radiusOrEventOptions);

        event.dispose(false);

        return event;
    }

    /**
     * Creates a physics updraft event
     * @param origin the origin of the updraft
     * @param radiusOrEventOptions the radius or the options of the updraft
     * @param strength the strength of the updraft
     * @param height the height of the updraft
     * @param updraftMode possible options: Center & Perpendicular. Defaults to Center
     * @returns A physics updraft event, or null
     */
    public updraft(origin: Vector3, radiusOrEventOptions: number | PhysicsUpdraftEventOptions, strength?: number, height?: number, updraftMode?: PhysicsUpdraftMode): Nullable<PhysicsUpdraftEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        if (this._physicsEngine.getImpostors().length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === 'number') {
            radiusOrEventOptions = new PhysicsUpdraftEventOptions();
            radiusOrEventOptions.radius = <number><any>radiusOrEventOptions;
            radiusOrEventOptions.strength = strength || radiusOrEventOptions.strength;
            radiusOrEventOptions.height = height || radiusOrEventOptions.height;
            radiusOrEventOptions.updraftMode = updraftMode || radiusOrEventOptions.updraftMode;
        }

        var event = new PhysicsUpdraftEvent(this._scene, origin, radiusOrEventOptions);

        event.dispose(false);

        return event;
    }

    /**
     * Creates a physics vortex event
     * @param origin the of the vortex
     * @param radiusOrEventOptions the radius or the options of the vortex
     * @param strength the strength of the vortex
     * @param height   the height of the vortex
     * @returns a Physics vortex event, or null
     * A physics vortex event or null
     */
    public vortex(origin: Vector3, radiusOrEventOptions: number | PhysicsVortexEventOptions, strength?: number, height?: number): Nullable<PhysicsVortexEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        if (this._physicsEngine.getImpostors().length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === 'number') {
            radiusOrEventOptions = new PhysicsVortexEventOptions();
            radiusOrEventOptions.radius = <number><any>radiusOrEventOptions;
            radiusOrEventOptions.strength = strength || radiusOrEventOptions.strength;
            radiusOrEventOptions.height = height || radiusOrEventOptions.height;
        }

        var event = new PhysicsVortexEvent(this._scene, origin, radiusOrEventOptions);

        event.dispose(false);

        return event;
    }
}

/**
 * Represents a physics radial explosion event
 */
class PhysicsRadialExplosionEvent {

    private _sphere: Mesh; // create a sphere, so we can get the intersecting meshes inside
    private _dataFetched: boolean = false; // check if the data has been fetched. If not, do cleanup

    /**
     * Initializes a radial explosion event
     * @param _scene BabylonJS scene
     * @param _options The options for the vortex event
     */
    constructor(private _scene: Scene, private _options: PhysicsRadialExplosionEventOptions) {
        this._options = { ...(new PhysicsRadialExplosionEventOptions()), ...this._options };
    }

    /**
     * Returns the data related to the radial explosion event (sphere).
     * @returns The radial explosion event data
     */
    public getData(): PhysicsRadialExplosionEventData {
        this._dataFetched = true;

        return {
            sphere: this._sphere,
        };
    }

    /**
     * Returns the force and contact point of the impostor or false, if the impostor is not affected by the force/impulse.
     * @param impostor A physics imposter
     * @param origin the origin of the explosion
     * @returns {Nullable<PhysicsHitData>} A physics force and contact point, or null
     */
    public getImpostorHitData(impostor: PhysicsImpostor, origin: Vector3): Nullable<PhysicsHitData> {
        if (impostor.mass === 0) {
            return null;
        }

        if (!this._intersectsWithSphere(impostor, origin, this._options.radius)) {
            return null;
        }

        if (impostor.object.getClassName() !== 'Mesh' && impostor.object.getClassName() !== 'InstancedMesh') {
            return null;
        }

        var impostorObjectCenter = impostor.getObjectCenter();
        var direction = impostorObjectCenter.subtract(origin);

        var ray = new Ray(origin, direction, this._options.radius);
        var hit = ray.intersectsMesh(<AbstractMesh>impostor.object);

        var contactPoint = hit.pickedPoint;
        if (!contactPoint) {
            return null;
        }

        var distanceFromOrigin = Vector3.Distance(origin, contactPoint);

        if (distanceFromOrigin > this._options.radius) {
            return null;
        }

        var multiplier = this._options.falloff === PhysicsRadialImpulseFalloff.Constant
            ? this._options.strength
            : this._options.strength * (1 - (distanceFromOrigin / this._options.radius));

        var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

        return { force: force, contactPoint: contactPoint, distanceFromOrigin: distanceFromOrigin };
    }

    /**
     * Triggers affected impostors callbacks
     * @param affectedImpostorsWithData defines the list of affected impostors (including associated data)
     */
    public triggerAffectedImpostorsCallback(affectedImpostorsWithData: Array<PhysicsAffectedImpostorWithData>) {
        if (this._options.affectedImpostorsCallback) {
            this._options.affectedImpostorsCallback(affectedImpostorsWithData);
        }
    }

    /**
     * Disposes the sphere.
     * @param force Specifies if the sphere should be disposed by force
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
            this._sphere = SphereBuilder.CreateSphere("radialExplosionEventSphere", this._options.sphere, this._scene);
            this._sphere.isVisible = false;
        }
    }

    private _intersectsWithSphere(impostor: PhysicsImpostor, origin: Vector3, radius: number): boolean {
        var impostorObject = <AbstractMesh>impostor.object;

        this._prepareSphere();

        this._sphere.position = origin;
        this._sphere.scaling = new Vector3(radius * 2, radius * 2, radius * 2);
        this._sphere._updateBoundingInfo();
        this._sphere.computeWorldMatrix(true);

        return this._sphere.intersectsMesh(impostorObject, true);
    }

}

/**
 * Represents a gravitational field event
 */
class PhysicsGravitationalFieldEvent {

    private _tickCallback: any;
    private _sphere: Mesh;
    private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

    /**
     * Initializes the physics gravitational field event
     * @param _physicsHelper A physics helper
     * @param _scene BabylonJS scene
     * @param _origin The origin position of the gravitational field event
     * @param _options The options for the vortex event
     */
    constructor(private _physicsHelper: PhysicsHelper, private _scene: Scene, private _origin: Vector3, private _options: PhysicsRadialExplosionEventOptions) {
        this._options = { ...(new PhysicsRadialExplosionEventOptions()), ...this._options };

        this._tickCallback = this._tick.bind(this);

        this._options.strength = this._options.strength * -1;
    }

    /**
     * Returns the data related to the gravitational field event (sphere).
     * @returns A gravitational field event
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
     * @param force The force to dispose from the gravitational field event
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
            this._physicsHelper.applyRadialExplosionForce(this._origin, this._options);
        } else {
            var radialExplosionEvent = this._physicsHelper.applyRadialExplosionForce(this._origin, this._options);
            if (radialExplosionEvent) {
                this._sphere = <Mesh>radialExplosionEvent.getData().sphere.clone('radialExplosionEventSphereClone');
            }
        }
    }

}

/**
 * Represents a physics updraft event
 */
class PhysicsUpdraftEvent {

    private _physicsEngine: PhysicsEngine;
    private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
    private _originDirection: Vector3 = Vector3.Zero(); // used if the updraftMode is perpendicular
    private _tickCallback: any;
    private _cylinder: Mesh;
    private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
    private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

    /**
     * Initializes the physics updraft event
     * @param _scene BabylonJS scene
     * @param _origin The origin position of the updraft
     * @param _options The options for the updraft event
     */
    constructor(private _scene: Scene, private _origin: Vector3, private _options: PhysicsUpdraftEventOptions) {
        this._physicsEngine = <PhysicsEngine>this._scene.getPhysicsEngine();
        this._options = { ...(new PhysicsUpdraftEventOptions()), ...this._options };

        this._origin.addToRef(new Vector3(0, this._options.height / 2, 0), this._cylinderPosition);
        this._origin.addToRef(new Vector3(0, this._options.height, 0), this._originTop);

        if (this._options.updraftMode === PhysicsUpdraftMode.Perpendicular) {
            this._originDirection = this._origin.subtract(this._originTop).normalize();
        }

        this._tickCallback = this._tick.bind(this);

        this._prepareCylinder();
    }

    /**
     * Returns the data related to the updraft event (cylinder).
     * @returns A physics updraft event
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
     * Disables the updraft.
     */
    public disable() {
        this._scene.unregisterBeforeRender(this._tickCallback);
    }

    /**
     * Disposes the cylinder.
     * @param force Specifies if the updraft should be disposed by force
     */
    public dispose(force: boolean = true) {
        if (!this._cylinder) {
            return;
        }
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

    private getImpostorHitData(impostor: PhysicsImpostor): Nullable<PhysicsHitData> {
        if (impostor.mass === 0) {
            return null;
        }

        if (!this._intersectsWithCylinder(impostor)) {
            return null;
        }

        var impostorObjectCenter = impostor.getObjectCenter();

        if (this._options.updraftMode === PhysicsUpdraftMode.Perpendicular) {
            var direction = this._originDirection;
        } else {
            var direction = impostorObjectCenter.subtract(this._originTop);
        }

        var distanceFromOrigin = Vector3.Distance(this._origin, impostorObjectCenter);

        var multiplier = this._options.strength * -1;

        var force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

        return { force: force, contactPoint: impostorObjectCenter, distanceFromOrigin: distanceFromOrigin };
    }

    private _tick() {
        this._physicsEngine.getImpostors().forEach((impostor) => {
            var impostorHitData = this.getImpostorHitData(impostor);
            if (!impostorHitData) {
                return;
            }

            impostor.applyForce(impostorHitData.force, impostorHitData.contactPoint);
        });
    }

    /*** Helpers ***/

    private _prepareCylinder(): void {
        if (!this._cylinder) {
            this._cylinder = CylinderBuilder.CreateCylinder("updraftEventCylinder", {
                height: this._options.height,
                diameter: this._options.radius * 2,
            }, this._scene);
            this._cylinder.isVisible = false;
        }
    }

    private _intersectsWithCylinder(impostor: PhysicsImpostor): boolean {
        var impostorObject = <AbstractMesh>impostor.object;

        this._cylinder.position = this._cylinderPosition;

        return this._cylinder.intersectsMesh(impostorObject, true);
    }

}

/**
 * Represents a physics vortex event
 */
class PhysicsVortexEvent {

    private _physicsEngine: PhysicsEngine;
    private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
    private _tickCallback: any;
    private _cylinder: Mesh;
    private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
    private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

    /**
     * Initializes the physics vortex event
     * @param _scene The BabylonJS scene
     * @param _origin The origin position of the vortex
     * @param _options The options for the vortex event
     */
    constructor(private _scene: Scene, private _origin: Vector3, private _options: PhysicsVortexEventOptions) {
        this._physicsEngine = <PhysicsEngine>this._scene.getPhysicsEngine();
        this._options = { ...(new PhysicsVortexEventOptions()), ...this._options };

        this._origin.addToRef(new Vector3(0, this._options.height / 2, 0), this._cylinderPosition);
        this._origin.addToRef(new Vector3(0, this._options.height, 0), this._originTop);

        this._tickCallback = this._tick.bind(this);

        this._prepareCylinder();
    }

    /**
     * Returns the data related to the vortex event (cylinder).
     * @returns The physics vortex event data
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
     * @param force
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

    private getImpostorHitData(impostor: PhysicsImpostor): Nullable<PhysicsHitData> {
        if (impostor.mass === 0) {
            return null;
        }

        if (!this._intersectsWithCylinder(impostor)) {
            return null;
        }

        if (impostor.object.getClassName() !== 'Mesh' && impostor.object.getClassName() !== 'InstancedMesh') {
            return null;
        }

        var impostorObjectCenter = impostor.getObjectCenter();
        var originOnPlane = new Vector3(this._origin.x, impostorObjectCenter.y, this._origin.z); // the distance to the origin as if both objects were on a plane (Y-axis)
        var originToImpostorDirection = impostorObjectCenter.subtract(originOnPlane);

        var ray = new Ray(originOnPlane, originToImpostorDirection, this._options.radius);
        var hit = ray.intersectsMesh(<AbstractMesh>impostor.object);
        var contactPoint = hit.pickedPoint;
        if (!contactPoint) {
            return null;
        }
        var absoluteDistanceFromOrigin = hit.distance / this._options.radius;

        var directionToOrigin = contactPoint.normalize();
        if (absoluteDistanceFromOrigin > this._options.centripetalForceThreshold) {
            directionToOrigin = directionToOrigin.negate();
        }

        if (absoluteDistanceFromOrigin > this._options.centripetalForceThreshold) {
            var forceX = directionToOrigin.x * this._options.centripetalForceMultiplier;
            var forceY = directionToOrigin.y * this._options.updraftForceMultiplier;
            var forceZ = directionToOrigin.z * this._options.centripetalForceMultiplier;
        } else {
            var perpendicularDirection = Vector3.Cross(originOnPlane, impostorObjectCenter).normalize();

            var forceX = (perpendicularDirection.x + directionToOrigin.x) * this._options.centrifugalForceMultiplier;
            var forceY = this._originTop.y * this._options.updraftForceMultiplier;
            var forceZ = (perpendicularDirection.z + directionToOrigin.z) * this._options.centrifugalForceMultiplier;
        }

        var force = new Vector3(forceX, forceY, forceZ);
        force = force.multiplyByFloats(this._options.strength, this._options.strength, this._options.strength);

        return { force: force, contactPoint: impostorObjectCenter, distanceFromOrigin: absoluteDistanceFromOrigin };
    }

    private _tick() {
        this._physicsEngine.getImpostors().forEach((impostor) => {
            var impostorHitData = this.getImpostorHitData(impostor);
            if (!impostorHitData) {
                return;
            }

            impostor.applyForce(impostorHitData.force, impostorHitData.contactPoint);
        });
    }

    /*** Helpers ***/

    private _prepareCylinder(): void {
        if (!this._cylinder) {
            this._cylinder = CylinderBuilder.CreateCylinder("vortexEventCylinder", {
                height: this._options.height,
                diameter: this._options.radius * 2,
            }, this._scene);
            this._cylinder.isVisible = false;
        }
    }

    private _intersectsWithCylinder(impostor: PhysicsImpostor): boolean {
        var impostorObject = <AbstractMesh>impostor.object;

        this._cylinder.position = this._cylinderPosition;

        return this._cylinder.intersectsMesh(impostorObject, true);
    }

}

/**
 * Options fot the radial explosion event
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export class PhysicsRadialExplosionEventOptions {
    /**
     * The radius of the sphere for the radial explosion.
     */
    radius: number = 5;

    /**
     * The strength of the explosion.
     */
    strength: number = 10;

    /**
     * The strength of the force in correspondence to the distance of the affected object
     */
    falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant;

    /**
     * Sphere options for the radial explosion.
     */
    sphere: { segments: number, diameter: number } = { segments: 32, diameter: 1 };

    /**
     * Sphere options for the radial explosion.
     */
    affectedImpostorsCallback: (affectedImpostorsWithData: Array<PhysicsAffectedImpostorWithData>) => void;
}

/**
 * Options fot the updraft event
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export class PhysicsUpdraftEventOptions {
    /**
     * The radius of the cylinder for the vortex
     */
    radius: number = 5;

    /**
     * The strength of the updraft.
     */
    strength: number = 10;

    /**
     * The height of the cylinder for the updraft.
     */
    height: number = 10;

    /**
     * The mode for the the updraft.
     */
    updraftMode: PhysicsUpdraftMode = PhysicsUpdraftMode.Center;
}

/**
 * Options fot the vortex event
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export class PhysicsVortexEventOptions {
    /**
     * The radius of the cylinder for the vortex
     */
    radius: number = 5;

    /**
     * The strength of the vortex.
     */
    strength: number = 10;

    /**
     * The height of the cylinder for the vortex.
     */
    height: number = 10;

    /**
     * At which distance, relative to the radius the centripetal forces should kick in? Range: 0-1
     */
    centripetalForceThreshold: number = 0.7;

    /**
     * This multiplier determines with how much force the objects will be pushed sideways/around the vortex, when below the threshold.
     */
    centripetalForceMultiplier: number = 5;

    /**
     * This multiplier determines with how much force the objects will be pushed sideways/around the vortex, when above the threshold.
     */
    centrifugalForceMultiplier: number = 0.5;

    /**
     * This multiplier determines with how much force the objects will be pushed upwards, when in the vortex.
     */
    updraftForceMultiplier: number = 0.02;
}

/**
* The strength of the force in correspondence to the distance of the affected object
* @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
*/
export enum PhysicsRadialImpulseFalloff {
    /** Defines that impulse is constant in strength across it's whole radius */
    Constant,
    /** Defines that impulse gets weaker if it's further from the origin */
    Linear
}

/**
 * The strength of the force in correspondence to the distance of the affected object
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export enum PhysicsUpdraftMode {
    /** Defines that the upstream forces will pull towards the top center of the cylinder */
    Center,
    /** Defines that once a impostor is inside the cylinder, it will shoot out perpendicular from the ground of the cylinder */
    Perpendicular
}

/**
 * Interface for a physics hit data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export interface PhysicsHitData {
    /**
     * The force applied at the contact point
     */
    force: Vector3;
    /**
     * The contact point
     */
    contactPoint: Vector3;
    /**
     * The distance from the origin to the contact point
     */
    distanceFromOrigin: number;
}

/**
 * Interface for radial explosion event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export interface PhysicsRadialExplosionEventData {
    /**
     * A sphere used for the radial explosion event
     */
    sphere: Mesh;
}

/**
 * Interface for gravitational field event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export interface PhysicsGravitationalFieldEventData {
    /**
     * A sphere mesh used for the gravitational field event
     */
    sphere: Mesh;
}

/**
 * Interface for updraft event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export interface PhysicsUpdraftEventData {
    /**
     * A cylinder used for the updraft event
     */
    cylinder: Mesh;
}

/**
 * Interface for vortex event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export interface PhysicsVortexEventData {
    /**
     * A cylinder used for the vortex event
     */
    cylinder: Mesh;
}

/**
 * Interface for an affected physics impostor
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine#further-functionality-of-the-impostor-class
 */
export interface PhysicsAffectedImpostorWithData {
    /**
     * The impostor affected by the effect
     */
    impostor: PhysicsImpostor;

    /**
     * The data about the hit/force from the explosion
     */
    hitData: PhysicsHitData;
}
