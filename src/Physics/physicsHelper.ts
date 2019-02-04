import { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { Vector3 } from "../Maths/math";
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
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
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
        }
    }

    /**
     * Applies a radial explosion impulse
     * @param origin the origin of the explosion
     * @param radius the explosion radius
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics radial explosion event, or null
     */
    public applyRadialExplosionImpulse(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant): Nullable<PhysicsRadialExplosionEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call this method.');
            return null;
        }

        var impostors = this._physicsEngine.getImpostors();
        if (impostors.length === 0) {
            return null;
        }

        var event = new PhysicsRadialExplosionEvent(this._scene);

        impostors.forEach((impostor) => {
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
     * Applies a radial explosion force
     * @param origin the origin of the explosion
     * @param radius the explosion radius
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics radial explosion event, or null
     */
    public applyRadialExplosionForce(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant): Nullable<PhysicsRadialExplosionEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        var impostors = this._physicsEngine.getImpostors();
        if (impostors.length === 0) {
            return null;
        }

        var event = new PhysicsRadialExplosionEvent(this._scene);

        impostors.forEach((impostor) => {
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
     * Creates a gravitational field
     * @param origin the origin of the explosion
     * @param radius the explosion radius
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics gravitational field event, or null
     */
    public gravitationalField(origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff = PhysicsRadialImpulseFalloff.Constant): Nullable<PhysicsGravitationalFieldEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
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
     * Creates a physics updraft event
     * @param origin the origin of the updraft
     * @param radius the radius of the updraft
     * @param strength the strength of the updraft
     * @param height the height of the updraft
     * @param updraftMode possible options: Center & Perpendicular. Defaults to Center
     * @returns A physics updraft event, or null
     */
    public updraft(origin: Vector3, radius: number, strength: number, height: number, updraftMode: PhysicsUpdraftMode = PhysicsUpdraftMode.Center): Nullable<PhysicsUpdraftEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        if (this._physicsEngine.getImpostors().length === 0) {
            return null;
        }

        var event = new PhysicsUpdraftEvent(this._scene, origin, radius, strength, height, updraftMode);

        event.dispose(false);

        return event;
    }

    /**
     * Creates a physics vortex event
     * @param origin the of the vortex
     * @param radius the radius of the vortex
     * @param strength the strength of the vortex
     * @param height   the height of the vortex
     * @returns a Physics vortex event, or null
     * A physics vortex event or null
     */
    public vortex(origin: Vector3, radius: number, strength: number, height: number): Nullable<PhysicsVortexEvent> {
        if (!this._physicsEngine) {
            Logger.Warn('Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.');
            return null;
        }

        if (this._physicsEngine.getImpostors().length === 0) {
            return null;
        }

        var event = new PhysicsVortexEvent(this._scene, origin, radius, strength, height);

        event.dispose(false);

        return event;
    }
}

/**
 * Represents a physics radial explosion event
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class PhysicsRadialExplosionEvent {

    private _scene: Scene;
    private _sphere: Mesh; // create a sphere, so we can get the intersecting meshes inside
    private _sphereOptions: { segments: number, diameter: number } = { segments: 32, diameter: 1 }; // TODO: make configurable
    private _rays: Array<Ray> = [];
    private _dataFetched: boolean = false; // check if the data has been fetched. If not, do cleanup

    /**
     * Initializes a radial explosioin event
     * @param scene BabylonJS scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
    }

    /**
     * Returns the data related to the radial explosion event (sphere & rays).
     * @returns The radial explosion event data
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
     * @param impostor A physics imposter
     * @param origin the origin of the explosion
     * @param radius the explosion radius
     * @param strength the explosion strength
     * @param falloff possible options: Constant & Linear
     * @returns {Nullable<PhysicsForceAndContactPoint>} A physics force and contact point, or null
     */
    public getImpostorForceAndContactPoint(impostor: PhysicsImpostor, origin: Vector3, radius: number, strength: number, falloff: PhysicsRadialImpulseFalloff): Nullable<PhysicsForceAndContactPoint> {
        if (impostor.mass === 0) {
            return null;
        }

        if (!this._intersectsWithSphere(impostor, origin, radius)) {
            return null;
        }

        if (impostor.object.getClassName() !== 'Mesh' && impostor.object.getClassName() !== 'InstancedMesh') {
            return null;
        }

        var impostorObjectCenter = impostor.getObjectCenter();
        var direction = impostorObjectCenter.subtract(origin);

        var ray = new Ray(origin, direction, radius);
        this._rays.push(ray);
        var hit = ray.intersectsMesh(<AbstractMesh>impostor.object);

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
            this._sphere = SphereBuilder.CreateSphere("radialExplosionEventSphere", this._sphereOptions, this._scene);
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
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
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

    /**
     * Initializes the physics gravitational field event
     * @param physicsHelper A physics helper
     * @param scene BabylonJS scene
     * @param origin The origin position of the gravitational field event
     * @param radius The radius of the gravitational field event
     * @param strength The strength of the gravitational field event
     * @param falloff The falloff for the gravitational field event
     */
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
            this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
        } else {
            var radialExplosionEvent = this._physicsHelper.applyRadialExplosionForce(this._origin, this._radius, this._strength * -1, this._falloff);
            if (radialExplosionEvent) {
                this._sphere = <Mesh>radialExplosionEvent.getData().sphere.clone('radialExplosionEventSphereClone');
            }
        }
    }

}

/**
 * Represents a physics updraft event
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class PhysicsUpdraftEvent {

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
     * @param _radius The radius of the updraft
     * @param _strength The strength of the updraft
     * @param _height The height of the updraft
     * @param _updraftMode The mode of the updraft
     */
    constructor(private _scene: Scene, private _origin: Vector3, private _radius: number, private _strength: number, private _height: number, private _updraftMode: PhysicsUpdraftMode) {
        this._physicsEngine = <PhysicsEngine>this._scene.getPhysicsEngine();

        this._origin.addToRef(new Vector3(0, this._height / 2, 0), this._cylinderPosition);
        this._origin.addToRef(new Vector3(0, this._height, 0), this._originTop);

        if (this._updraftMode === PhysicsUpdraftMode.Perpendicular) {
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
     * Disables the cortex.
     */
    public disable() {
        this._scene.unregisterBeforeRender(this._tickCallback);
    }

    /**
     * Disposes the sphere.
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
        this._physicsEngine.getImpostors().forEach((impostor) => {
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
            this._cylinder = CylinderBuilder.CreateCylinder("updraftEventCylinder", {
                height: this._height,
                diameter: this._radius * 2,
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
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export class PhysicsVortexEvent {

    private _physicsEngine: PhysicsEngine;
    private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
    private _centripetalForceThreshold: number = 0.7; // at which distance, relative to the radius the centripetal forces should kick in
    private _updraftMultiplier: number = 0.02;
    private _tickCallback: any;
    private _cylinder: Mesh;
    private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
    private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup

    /**
     * Initializes the physics vortex event
     * @param _scene The BabylonJS scene
     * @param _origin The origin position of the vortex
     * @param _radius The radius of the vortex
     * @param _strength The strength of the vortex
     * @param _height The height of the vortex
     */
    constructor(private _scene: Scene, private _origin: Vector3, private _radius: number, private _strength: number, private _height: number) {
        this._physicsEngine = <PhysicsEngine>this._scene.getPhysicsEngine();

        this._origin.addToRef(new Vector3(0, this._height / 2, 0), this._cylinderPosition);
        this._origin.addToRef(new Vector3(0, this._height, 0), this._originTop);

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

    private getImpostorForceAndContactPoint(impostor: PhysicsImpostor): Nullable<PhysicsForceAndContactPoint> {
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

        var ray = new Ray(originOnPlane, originToImpostorDirection, this._radius);
        var hit = ray.intersectsMesh(<AbstractMesh>impostor.object);
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

        // TODO: find a more physically based solution
        if (absoluteDistanceFromOrigin > this._centripetalForceThreshold) {
            var forceX = directionToOrigin.x * this._strength / 8;
            var forceY = directionToOrigin.y * this._updraftMultiplier;
            var forceZ = directionToOrigin.z * this._strength / 8;
        } else {
            var forceX = (perpendicularDirection.x + directionToOrigin.x) / 2;
            var forceY = this._originTop.y * this._updraftMultiplier;
            var forceZ = (perpendicularDirection.z + directionToOrigin.z) / 2;
        }

        var force = new Vector3(forceX, forceY, forceZ);
        force = force.multiplyByFloats(this._strength, this._strength, this._strength);

        return { force: force, contactPoint: impostorObjectCenter };
    }

    private _tick() {
        this._physicsEngine.getImpostors().forEach((impostor) => {
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
            this._cylinder = CylinderBuilder.CreateCylinder("vortexEventCylinder", {
                height: this._height,
                diameter: this._radius * 2,
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
* The strenght of the force in correspondence to the distance of the affected object
* @see https://doc.babylonjs.com/how_to/using_the_physics_engine
*/
export enum PhysicsRadialImpulseFalloff {
    /** Defines that impulse is constant in strength across it's whole radius */
    Constant,
    /** DEfines that impulse gets weaker if it's further from the origin */
    Linear
}

/**
 * The strength of the force in correspondence to the distance of the affected object
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export enum PhysicsUpdraftMode {
    /** Defines that the upstream forces will pull towards the top center of the cylinder */
    Center,
    /** Defines that once a impostor is inside the cylinder, it will shoot out perpendicular from the ground of the cylinder */
    Perpendicular
}

/**
 * Interface for a physics force and contact point
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsForceAndContactPoint {
    /**
     * The force applied at the contact point
     */
    force: Vector3;
    /**
     * The contact point
     */
    contactPoint: Vector3;
}

/**
 * Interface for radial explosion event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsRadialExplosionEventData {
    /**
     * A sphere used for the radial explosion event
     */
    sphere: Mesh;
    /**
     * An array of rays for the radial explosion event
     */
    rays: Array<Ray>;
}

/**
 * Interface for gravitational field event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsGravitationalFieldEventData {
    /**
     * A sphere mesh used for the gravitational field event
     */
    sphere: Mesh;
}

/**
 * Interface for updraft event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsUpdraftEventData {
    /**
     * A cylinder used for the updraft event
     */
    cylinder: Mesh;
}

/**
 * Interface for vortex event data
 * @see https://doc.babylonjs.com/how_to/using_the_physics_engine
 */
export interface PhysicsVortexEventData {
    /**
     * A cylinder used for the vortex event
     */
    cylinder: Mesh;
}
