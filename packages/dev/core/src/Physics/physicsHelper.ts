import type { Nullable } from "../types";
import { Logger } from "../Misc/logger";
import { TmpVectors, Vector3 } from "../Maths/math.vector";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import type { Mesh } from "../Meshes/mesh";
import { CreateSphere } from "../Meshes/Builders/sphereBuilder";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder";
import { Ray } from "../Culling/ray";
import type { Scene } from "../scene";
import type { PhysicsEngine as PhysicsEngineV1 } from "./physicsEngine";
import type { PhysicsEngine as PhysicsEngineV2 } from "./v2/physicsEngine";
import type { IPhysicsEngine } from "./IPhysicsEngine";
import type { PhysicsImpostor } from "./v1/physicsImpostor";
import type { PhysicsBody } from "./v2/physicsBody";
import { PhysicsMotionType } from "./v2/IPhysicsEnginePlugin";

class HelperTools {
    /*
     * Gets the hit contact point between a mesh and a ray. The method varies between
     * the different plugin versions; V1 uses a mesh intersection, V2 uses the physics body instance/object center (to avoid a raycast and improve perf).
     */
    static GetContactPointToRef(mesh: AbstractMesh, origin: Vector3, direction: Vector3, result: Vector3, instanceIndex?: number): boolean {
        const engine = mesh.getScene().getPhysicsEngine();
        const pluginVersion = engine?.getPluginVersion();
        if (pluginVersion === 1) {
            const ray = new Ray(origin, direction);
            const hit = ray.intersectsMesh(mesh);
            if (hit.hit && hit.pickedPoint) {
                result.copyFrom(hit.pickedPoint);
                return true;
            }
        } else if (pluginVersion === 2) {
            mesh.physicsBody!.getObjectCenterWorldToRef(result, instanceIndex);
            return true;
        }
        return false;
    }

    /**
     * Checks if a body will be affected by forces
     * @param body the body to check
     * @param instanceIndex for instanced bodies, the index of the instance to check
     * @returns
     */
    static HasAppliedForces(body: PhysicsBody, instanceIndex?: number) {
        return (
            body.getMotionType(instanceIndex) === PhysicsMotionType.STATIC ||
            (body.getMassProperties(instanceIndex)?.mass ?? 0) === 0 ||
            (body.transformNode as Mesh)?.getTotalVertices() === 0
        );
    }

    /**
     * Checks if a point is inside a cylinder
     * @param point point to check
     * @param origin cylinder origin on the bottom
     * @param radius cylinder radius
     * @param height cylinder height
     * @returns
     */
    static IsInsideCylinder(point: Vector3, origin: Vector3, radius: number, height: number): boolean {
        const distance = TmpVectors.Vector3[0];
        point.subtractToRef(origin, distance);
        return Math.abs(distance.x) <= radius && Math.abs(distance.z) <= radius && distance.y >= 0 && distance.y <= height;
    }
}

/**
 * A helper for physics simulations
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export class PhysicsHelper {
    private _scene: Scene;
    private _physicsEngine: Nullable<IPhysicsEngine>;
    private _hitData: PhysicsHitData = { force: new Vector3(), contactPoint: new Vector3(), distanceFromOrigin: 0 };

    /**
     * Initializes the Physics helper
     * @param scene Babylon.js scene
     */
    constructor(scene: Scene) {
        this._scene = scene;
        this._physicsEngine = this._scene.getPhysicsEngine();

        if (!this._physicsEngine) {
            Logger.Warn("Physics engine not enabled. Please enable the physics before you can use the methods.");
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
    public applyRadialExplosionImpulse(
        origin: Vector3,
        radiusOrEventOptions: number | PhysicsRadialExplosionEventOptions,
        strength?: number,
        falloff?: PhysicsRadialImpulseFalloff
    ): Nullable<PhysicsRadialExplosionEvent> {
        if (!this._physicsEngine) {
            Logger.Warn("Physics engine not enabled. Please enable the physics before you call this method.");
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 1 && (<PhysicsEngineV1>this._physicsEngine).getImpostors().length === 0) {
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 2 && (<PhysicsEngineV2>this._physicsEngine).getBodies().length === 0) {
            return null;
        }

        let useCallback = false;
        if (typeof radiusOrEventOptions === "number") {
            const r = radiusOrEventOptions;
            radiusOrEventOptions = new PhysicsRadialExplosionEventOptions();
            radiusOrEventOptions.radius = r;
            radiusOrEventOptions.strength = strength ?? radiusOrEventOptions.strength;
            radiusOrEventOptions.falloff = falloff ?? radiusOrEventOptions.falloff;
        } else {
            useCallback = !!(radiusOrEventOptions.affectedImpostorsCallback || radiusOrEventOptions.affectedBodiesCallback);
        }

        const event = new PhysicsRadialExplosionEvent(this._scene, radiusOrEventOptions);

        const hitData = this._hitData;
        if (this._physicsEngine.getPluginVersion() === 1) {
            const affectedImpostorsWithData = Array<PhysicsAffectedImpostorWithData>();
            const impostors = (<PhysicsEngineV1>this._physicsEngine).getImpostors();
            impostors.forEach((impostor: PhysicsImpostor) => {
                if (!event.getImpostorHitData(impostor, origin, hitData)) {
                    return;
                }

                impostor.applyImpulse(hitData.force, hitData.contactPoint);

                if (useCallback) {
                    affectedImpostorsWithData.push({
                        impostor: impostor,
                        hitData: this._copyPhysicsHitData(hitData),
                    });
                }
            });

            event.triggerAffectedImpostorsCallback(affectedImpostorsWithData);
        } else {
            this._applicationForBodies(event, origin, hitData, useCallback, (body: PhysicsBody, hitData: PhysicsHitData) => {
                body.applyImpulse(hitData.force, hitData.contactPoint, hitData.instanceIndex);
            });
        }

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
    public applyRadialExplosionForce(
        origin: Vector3,
        radiusOrEventOptions: number | PhysicsRadialExplosionEventOptions,
        strength?: number,
        falloff?: PhysicsRadialImpulseFalloff
    ): Nullable<PhysicsRadialExplosionEvent> {
        if (!this._physicsEngine) {
            Logger.Warn("Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.");
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 1 && (<PhysicsEngineV1>this._physicsEngine).getImpostors().length === 0) {
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 2 && (<PhysicsEngineV2>this._physicsEngine).getBodies().length === 0) {
            return null;
        }

        let useCallback = false;
        if (typeof radiusOrEventOptions === "number") {
            const r = radiusOrEventOptions;
            radiusOrEventOptions = new PhysicsRadialExplosionEventOptions();
            radiusOrEventOptions.radius = r;
            radiusOrEventOptions.strength = strength ?? radiusOrEventOptions.strength;
            radiusOrEventOptions.falloff = falloff ?? radiusOrEventOptions.falloff;
        } else {
            useCallback = !!(radiusOrEventOptions.affectedImpostorsCallback || radiusOrEventOptions.affectedBodiesCallback);
        }

        const event = new PhysicsRadialExplosionEvent(this._scene, radiusOrEventOptions);

        const hitData = this._hitData;
        if (this._physicsEngine.getPluginVersion() === 1) {
            const affectedImpostorsWithData = Array<PhysicsAffectedImpostorWithData>();
            const impostors = (<PhysicsEngineV1>this._physicsEngine).getImpostors();
            impostors.forEach((impostor: PhysicsImpostor) => {
                if (!event.getImpostorHitData(impostor, origin, hitData)) {
                    return;
                }

                impostor.applyForce(hitData.force, hitData.contactPoint);

                if (useCallback) {
                    affectedImpostorsWithData.push({
                        impostor: impostor,
                        hitData: this._copyPhysicsHitData(hitData),
                    });
                }
            });

            event.triggerAffectedImpostorsCallback(affectedImpostorsWithData);
        } else {
            this._applicationForBodies(event, origin, hitData, useCallback, (body: PhysicsBody, hitData: PhysicsHitData) => {
                body.applyForce(hitData.force, hitData.contactPoint, hitData.instanceIndex);
            });
        }

        event.dispose(false);

        return event;
    }

    private _applicationForBodies(
        event: PhysicsRadialExplosionEvent,
        origin: Vector3,
        hitData: PhysicsHitData,
        useCallback: boolean,
        fnApplication: (body: PhysicsBody, hitData: PhysicsHitData, instanceIndex?: number) => void
    ) {
        const affectedBodiesWithData = Array<PhysicsAffectedBodyWithData>();
        const bodies = (<PhysicsEngineV2>this._physicsEngine).getBodies();
        for (const body of bodies) {
            body.iterateOverAllInstances((body, instanceIndex) => {
                if (!event.getBodyHitData(body, origin, hitData, instanceIndex)) {
                    return;
                }
                fnApplication(body, hitData);

                if (useCallback) {
                    affectedBodiesWithData.push({
                        body: body,
                        hitData: this._copyPhysicsHitData(hitData),
                    });
                }
            });
        }

        event.triggerAffectedBodiesCallback(affectedBodiesWithData);
    }

    /**
     * Creates a gravitational field
     * @param origin the origin of the gravitational field
     * @param radiusOrEventOptions the radius or the options of radial gravitational field
     * @param strength the gravitational field strength
     * @param falloff possible options: Constant & Linear. Defaults to Constant
     * @returns A physics gravitational field event, or null
     */
    public gravitationalField(
        origin: Vector3,
        radiusOrEventOptions: number | PhysicsRadialExplosionEventOptions,
        strength?: number,
        falloff?: PhysicsRadialImpulseFalloff
    ): Nullable<PhysicsGravitationalFieldEvent> {
        if (!this._physicsEngine) {
            Logger.Warn("Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.");
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 1 && (<PhysicsEngineV1>this._physicsEngine).getImpostors().length === 0) {
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 2 && (<PhysicsEngineV2>this._physicsEngine).getBodies().length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === "number") {
            const r = radiusOrEventOptions;
            radiusOrEventOptions = new PhysicsRadialExplosionEventOptions();
            radiusOrEventOptions.radius = r;
            radiusOrEventOptions.strength = strength ?? radiusOrEventOptions.strength;
            radiusOrEventOptions.falloff = falloff ?? radiusOrEventOptions.falloff;
        }

        const event = new PhysicsGravitationalFieldEvent(this, this._scene, origin, radiusOrEventOptions);

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
    public updraft(
        origin: Vector3,
        radiusOrEventOptions: number | PhysicsUpdraftEventOptions,
        strength?: number,
        height?: number,
        updraftMode?: PhysicsUpdraftMode
    ): Nullable<PhysicsUpdraftEvent> {
        if (!this._physicsEngine) {
            Logger.Warn("Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.");
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 1 && (<PhysicsEngineV1>this._physicsEngine).getImpostors().length === 0) {
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 2 && (<PhysicsEngineV2>this._physicsEngine).getBodies().length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === "number") {
            const r = radiusOrEventOptions;
            radiusOrEventOptions = new PhysicsUpdraftEventOptions();
            radiusOrEventOptions.radius = r;
            radiusOrEventOptions.strength = strength ?? radiusOrEventOptions.strength;
            radiusOrEventOptions.height = height ?? radiusOrEventOptions.height;
            radiusOrEventOptions.updraftMode = updraftMode ?? radiusOrEventOptions.updraftMode;
        }

        const event = new PhysicsUpdraftEvent(this._scene, origin, radiusOrEventOptions);

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
            Logger.Warn("Physics engine not enabled. Please enable the physics before you call the PhysicsHelper.");
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 1 && (<PhysicsEngineV1>this._physicsEngine).getImpostors().length === 0) {
            return null;
        }

        if (this._physicsEngine.getPluginVersion() === 2 && (<PhysicsEngineV2>this._physicsEngine).getBodies().length === 0) {
            return null;
        }

        if (typeof radiusOrEventOptions === "number") {
            const r = radiusOrEventOptions;
            radiusOrEventOptions = new PhysicsVortexEventOptions();
            radiusOrEventOptions.radius = r;
            radiusOrEventOptions.strength = strength ?? radiusOrEventOptions.strength;
            radiusOrEventOptions.height = height ?? radiusOrEventOptions.height;
        }

        const event = new PhysicsVortexEvent(this._scene, origin, radiusOrEventOptions);

        event.dispose(false);

        return event;
    }

    private _copyPhysicsHitData(data: PhysicsHitData): PhysicsHitData {
        return { force: data.force.clone(), contactPoint: data.contactPoint.clone(), distanceFromOrigin: data.distanceFromOrigin, instanceIndex: data.instanceIndex };
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
    constructor(
        private _scene: Scene,
        private _options: PhysicsRadialExplosionEventOptions
    ) {
        this._options = { ...new PhysicsRadialExplosionEventOptions(), ...this._options };
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

    private _getHitData(mesh: AbstractMesh, center: Vector3, origin: Vector3, data: PhysicsHitData): boolean {
        const direction = TmpVectors.Vector3[0];
        direction.copyFrom(center).subtractInPlace(origin);

        const contactPoint = TmpVectors.Vector3[1];
        const hasContactPoint = HelperTools.GetContactPointToRef(mesh, origin, direction, contactPoint, data.instanceIndex);

        if (!hasContactPoint) {
            return false;
        }

        const distanceFromOrigin = Vector3.Distance(origin, contactPoint);
        if (distanceFromOrigin > this._options.radius) {
            return false;
        }

        const multiplier =
            this._options.falloff === PhysicsRadialImpulseFalloff.Constant ? this._options.strength : this._options.strength * (1 - distanceFromOrigin / this._options.radius);

        // Direction x multiplier equals force
        direction.scaleInPlace(multiplier);

        data.force.copyFrom(direction);
        data.contactPoint.copyFrom(contactPoint);
        data.distanceFromOrigin = distanceFromOrigin;
        return true;
    }

    /**
     * Returns the force and contact point of the body or false, if the body is not affected by the force/impulse.
     * @param body A physics body where the transform node is an AbstractMesh
     * @param origin the origin of the explosion
     * @param data the data of the hit
     * @param instanceIndex the instance index of the body
     * @returns if there was a hit
     */
    public getBodyHitData(body: PhysicsBody, origin: Vector3, data: PhysicsHitData, instanceIndex?: number): boolean {
        // No force will be applied in these cases, so we skip calculation
        if (HelperTools.HasAppliedForces(body, instanceIndex)) {
            return false;
        }

        const mesh = body.transformNode as AbstractMesh;
        const bodyObjectCenter = body.getObjectCenterWorld(instanceIndex);
        data.instanceIndex = instanceIndex;
        return this._getHitData(mesh, bodyObjectCenter, origin, data);
    }
    /**
     * Returns the force and contact point of the impostor or false, if the impostor is not affected by the force/impulse.
     * @param impostor A physics imposter
     * @param origin the origin of the explosion
     * @param data the data of the hit
     * @returns A physics force and contact point, or null
     */
    public getImpostorHitData(impostor: PhysicsImpostor, origin: Vector3, data: PhysicsHitData): boolean {
        if (impostor.mass === 0) {
            return false;
        }

        if (impostor.object.getClassName() !== "Mesh" && impostor.object.getClassName() !== "InstancedMesh") {
            return false;
        }

        const mesh = impostor.object as AbstractMesh;
        if (!this._intersectsWithSphere(mesh, origin, this._options.radius)) {
            return false;
        }

        const impostorObjectCenter = impostor.getObjectCenter();

        this._getHitData(mesh, impostorObjectCenter, origin, data);
        return true;
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
     * Triggers affected bodies callbacks
     * @param affectedBodiesWithData defines the list of affected bodies (including associated data)
     */
    public triggerAffectedBodiesCallback(affectedBodiesWithData: Array<PhysicsAffectedBodyWithData>) {
        if (this._options.affectedBodiesCallback) {
            this._options.affectedBodiesCallback(affectedBodiesWithData);
        }
    }
    /**
     * Disposes the sphere.
     * @param force Specifies if the sphere should be disposed by force
     */
    public dispose(force: boolean = true) {
        if (this._sphere) {
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
    }

    /*** Helpers ***/

    private _prepareSphere(): void {
        if (!this._sphere) {
            this._sphere = CreateSphere("radialExplosionEventSphere", this._options.sphere, this._scene);
            this._sphere.isVisible = false;
        }
    }

    private _intersectsWithSphere(mesh: AbstractMesh, origin: Vector3, radius: number): boolean {
        this._prepareSphere();

        this._sphere.position = origin;
        this._sphere.scaling.setAll(radius * 2);
        this._sphere._updateBoundingInfo();
        this._sphere.computeWorldMatrix(true);

        return this._sphere.intersectsMesh(mesh, true);
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
    constructor(
        private _physicsHelper: PhysicsHelper,
        private _scene: Scene,
        private _origin: Vector3,
        private _options: PhysicsRadialExplosionEventOptions
    ) {
        this._options = { ...new PhysicsRadialExplosionEventOptions(), ...this._options };

        this._tickCallback = () => this._tick();

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
        if (!this._sphere) {
            return;
        }
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
            const radialExplosionEvent = this._physicsHelper.applyRadialExplosionForce(this._origin, this._options);
            if (radialExplosionEvent) {
                this._sphere = <Mesh>radialExplosionEvent.getData().sphere?.clone("radialExplosionEventSphereClone");
            }
        }
    }
}

/**
 * Represents a physics updraft event
 */
class PhysicsUpdraftEvent {
    private _physicsEngine: PhysicsEngineV1 | PhysicsEngineV2;
    private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
    private _originDirection: Vector3 = Vector3.Zero(); // used if the updraftMode is perpendicular
    private _tickCallback: any;
    private _cylinder: Mesh | undefined;
    private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
    private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup
    private static _HitData: PhysicsHitData = { force: new Vector3(), contactPoint: new Vector3(), distanceFromOrigin: 0 };
    /**
     * Initializes the physics updraft event
     * @param _scene BabylonJS scene
     * @param _origin The origin position of the updraft
     * @param _options The options for the updraft event
     */
    constructor(
        private _scene: Scene,
        private _origin: Vector3,
        private _options: PhysicsUpdraftEventOptions
    ) {
        this._physicsEngine = this._scene.getPhysicsEngine() as PhysicsEngineV1 | PhysicsEngineV2;
        this._options = { ...new PhysicsUpdraftEventOptions(), ...this._options };

        this._origin.addToRef(new Vector3(0, this._options.height / 2, 0), this._cylinderPosition);
        this._origin.addToRef(new Vector3(0, this._options.height, 0), this._originTop);

        if (this._options.updraftMode === PhysicsUpdraftMode.Perpendicular) {
            this._originDirection = this._origin.subtract(this._originTop).normalize();
        }

        this._tickCallback = () => this._tick();

        if (this._physicsEngine.getPluginVersion() === 1) {
            this._prepareCylinder();
        }
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
            this._cylinder = undefined;
        } else {
            setTimeout(() => {
                if (!this._dataFetched && this._cylinder) {
                    this._cylinder.dispose();
                    this._cylinder = undefined;
                }
            }, 0);
        }
    }

    private _getHitData(center: Vector3, data: PhysicsHitData): void {
        let direction: Vector3;
        if (this._options.updraftMode === PhysicsUpdraftMode.Perpendicular) {
            direction = this._originDirection;
        } else {
            direction = center.subtract(this._originTop);
        }

        const distanceFromOrigin = Vector3.Distance(this._origin, center);

        const multiplier = this._options.strength * -1;

        const force = direction.multiplyByFloats(multiplier, multiplier, multiplier);

        data.force.copyFrom(force);
        data.contactPoint.copyFrom(center);
        data.distanceFromOrigin = distanceFromOrigin;
    }

    private _getBodyHitData(body: PhysicsBody, data: PhysicsHitData, instanceIndex?: number): boolean {
        if (HelperTools.HasAppliedForces(body)) {
            return false;
        }

        const center = body.getObjectCenterWorld(instanceIndex);

        if (!HelperTools.IsInsideCylinder(center, this._origin, this._options.radius, this._options.height)) {
            return false;
        }

        data.instanceIndex = instanceIndex;
        this._getHitData(center, data);
        return true;
    }

    private _getImpostorHitData(impostor: PhysicsImpostor, data: PhysicsHitData): boolean {
        if (impostor.mass === 0) {
            return false;
        }

        const impostorObject = <AbstractMesh>impostor.object;
        if (!this._intersectsWithCylinder(impostorObject)) {
            return false;
        }

        const center = impostor.getObjectCenter();
        this._getHitData(center, data);
        return true;
    }

    private _tick() {
        const hitData = PhysicsUpdraftEvent._HitData;
        if (this._physicsEngine.getPluginVersion() === 1) {
            (<PhysicsEngineV1>this._physicsEngine).getImpostors().forEach((impostor: PhysicsImpostor) => {
                if (!this._getImpostorHitData(impostor, hitData)) {
                    return;
                }

                impostor.applyForce(hitData.force, hitData.contactPoint);
            });
        } else {
            // V2
            (<PhysicsEngineV2>this._physicsEngine).getBodies().forEach((body: PhysicsBody) => {
                body.iterateOverAllInstances((body, instanceIndex) => {
                    if (!this._getBodyHitData(body, hitData, instanceIndex)) {
                        return;
                    }

                    body.applyForce(hitData.force, hitData.contactPoint, hitData.instanceIndex);
                });
            });
        }
    }

    /*** Helpers ***/

    private _prepareCylinder(): void {
        if (!this._cylinder) {
            this._cylinder = CreateCylinder(
                "updraftEventCylinder",
                {
                    height: this._options.height,
                    diameter: this._options.radius * 2,
                },
                this._scene
            );
            this._cylinder.isVisible = false;
        }
    }

    private _intersectsWithCylinder(mesh: AbstractMesh): boolean {
        if (!this._cylinder) {
            return false;
        }
        this._cylinder.position = this._cylinderPosition;
        return this._cylinder.intersectsMesh(mesh, true);
    }
}

/**
 * Represents a physics vortex event
 */
class PhysicsVortexEvent {
    private _physicsEngine: PhysicsEngineV1 | PhysicsEngineV2;
    private _originTop: Vector3 = Vector3.Zero(); // the most upper part of the cylinder
    private _tickCallback: any;
    private _cylinder: Mesh;
    private _cylinderPosition: Vector3 = Vector3.Zero(); // to keep the cylinders position, because normally the origin is in the center and not on the bottom
    private _dataFetched: boolean = false; // check if the has been fetched the data. If not, do cleanup
    private static _OriginOnPlane: Vector3 = Vector3.Zero();
    private static _HitData: PhysicsHitData = { force: new Vector3(), contactPoint: new Vector3(), distanceFromOrigin: 0 };

    /**
     * Initializes the physics vortex event
     * @param _scene The BabylonJS scene
     * @param _origin The origin position of the vortex
     * @param _options The options for the vortex event
     */
    constructor(
        private _scene: Scene,
        private _origin: Vector3,
        private _options: PhysicsVortexEventOptions
    ) {
        this._physicsEngine = this._scene.getPhysicsEngine() as PhysicsEngineV1 | PhysicsEngineV2;
        this._options = { ...new PhysicsVortexEventOptions(), ...this._options };

        this._origin.addToRef(new Vector3(0, this._options.height / 2, 0), this._cylinderPosition);
        this._origin.addToRef(new Vector3(0, this._options.height, 0), this._originTop);

        this._tickCallback = () => this._tick();

        if (this._physicsEngine.getPluginVersion() === 1) {
            this._prepareCylinder();
        }
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

    private _getHitData(mesh: AbstractMesh, center: Vector3, data: PhysicsHitData): boolean {
        const originOnPlane = PhysicsVortexEvent._OriginOnPlane;
        originOnPlane.set(this._origin.x, center.y, this._origin.z); // the distance to the origin as if both objects were on a plane (Y-axis)
        const originToImpostorDirection = TmpVectors.Vector3[0];
        center.subtractToRef(originOnPlane, originToImpostorDirection);

        const contactPoint = TmpVectors.Vector3[1];
        const hasContactPoint = HelperTools.GetContactPointToRef(mesh, originOnPlane, originToImpostorDirection, contactPoint, data.instanceIndex);
        if (!hasContactPoint) {
            return false;
        }
        const distance = Vector3.Distance(contactPoint, originOnPlane);
        const absoluteDistanceFromOrigin = distance / this._options.radius;

        const directionToOrigin = TmpVectors.Vector3[2];
        contactPoint.normalizeToRef(directionToOrigin);
        if (absoluteDistanceFromOrigin > this._options.centripetalForceThreshold) {
            directionToOrigin.negateInPlace();
        }

        let forceX: number;
        let forceY: number;
        let forceZ: number;

        if (absoluteDistanceFromOrigin > this._options.centripetalForceThreshold) {
            forceX = directionToOrigin.x * this._options.centripetalForceMultiplier;
            forceY = directionToOrigin.y * this._options.updraftForceMultiplier;
            forceZ = directionToOrigin.z * this._options.centripetalForceMultiplier;
        } else {
            const perpendicularDirection = Vector3.Cross(originOnPlane, center).normalize();

            forceX = (perpendicularDirection.x + directionToOrigin.x) * this._options.centrifugalForceMultiplier;
            forceY = this._originTop.y * this._options.updraftForceMultiplier;
            forceZ = (perpendicularDirection.z + directionToOrigin.z) * this._options.centrifugalForceMultiplier;
        }

        const force = TmpVectors.Vector3[3];
        force.set(forceX, forceY, forceZ);
        force.scaleInPlace(this._options.strength);

        data.force.copyFrom(force);
        data.contactPoint.copyFrom(center);
        data.distanceFromOrigin = absoluteDistanceFromOrigin;
        return true;
    }

    private _getBodyHitData(body: PhysicsBody, data: PhysicsHitData, instanceIndex?: number): boolean {
        if (HelperTools.HasAppliedForces(body, instanceIndex)) {
            return false;
        }

        const bodyObject = body.transformNode as AbstractMesh;
        const bodyCenter = body.getObjectCenterWorld(instanceIndex);

        if (!HelperTools.IsInsideCylinder(bodyCenter, this._origin, this._options.radius, this._options.height)) {
            return false;
        }

        data.instanceIndex = instanceIndex;
        return this._getHitData(bodyObject, bodyCenter, data);
    }

    private _getImpostorHitData(impostor: PhysicsImpostor, data: PhysicsHitData): boolean {
        if (impostor.mass === 0) {
            return false;
        }

        if (impostor.object.getClassName() !== "Mesh" && impostor.object.getClassName() !== "InstancedMesh") {
            return false;
        }

        const impostorObject = impostor.object as AbstractMesh;
        if (!this._intersectsWithCylinder(impostorObject)) {
            return false;
        }

        const impostorObjectCenter = impostor.getObjectCenter();
        this._getHitData(impostorObject, impostorObjectCenter, data);
        return true;
    }

    private _tick() {
        const hitData = PhysicsVortexEvent._HitData;
        if (this._physicsEngine.getPluginVersion() === 1) {
            (<PhysicsEngineV1>this._physicsEngine).getImpostors().forEach((impostor: PhysicsImpostor) => {
                if (!this._getImpostorHitData(impostor, hitData)) {
                    return;
                }

                impostor.applyForce(hitData.force, hitData.contactPoint);
            });
        } else {
            (<PhysicsEngineV2>this._physicsEngine).getBodies().forEach((body: PhysicsBody) => {
                body.iterateOverAllInstances((body: PhysicsBody, instanceIndex?: number) => {
                    if (!this._getBodyHitData(body, hitData, instanceIndex)) {
                        return;
                    }

                    body.applyForce(hitData.force, hitData.contactPoint, hitData.instanceIndex);
                });
            });
        }
    }

    /*** Helpers ***/

    private _prepareCylinder(): void {
        if (!this._cylinder) {
            this._cylinder = CreateCylinder(
                "vortexEventCylinder",
                {
                    height: this._options.height,
                    diameter: this._options.radius * 2,
                },
                this._scene
            );
            this._cylinder.isVisible = false;
        }
    }

    private _intersectsWithCylinder(mesh: AbstractMesh): boolean {
        this._cylinder.position = this._cylinderPosition;

        return this._cylinder.intersectsMesh(mesh, true);
    }
}

/**
 * Options fot the radial explosion event
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
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
    sphere: { segments: number; diameter: number } = { segments: 32, diameter: 1 };

    /**
     * Sphere options for the radial explosion.
     */
    affectedImpostorsCallback: (affectedImpostorsWithData: Array<PhysicsAffectedImpostorWithData>) => void;

    /**
     * Sphere options for the radial explosion.
     */
    affectedBodiesCallback: (affectedBodiesWithData: Array<PhysicsAffectedBodyWithData>) => void;
}

/**
 * Options fot the updraft event
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
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
     * The mode for the updraft.
     */
    updraftMode: PhysicsUpdraftMode = PhysicsUpdraftMode.Center;
}

/**
 * Options fot the vortex event
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
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
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export enum PhysicsRadialImpulseFalloff {
    /** Defines that impulse is constant in strength across it's whole radius */
    Constant,
    /** Defines that impulse gets weaker if it's further from the origin */
    Linear,
}

/**
 * The strength of the force in correspondence to the distance of the affected object
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export enum PhysicsUpdraftMode {
    /** Defines that the upstream forces will pull towards the top center of the cylinder */
    Center,
    /** Defines that once a impostor is inside the cylinder, it will shoot out perpendicular from the ground of the cylinder */
    Perpendicular,
}

/**
 * Interface for a physics hit data
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
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
    /**
     * For an instanced physics body (mesh with thin instances), the index of the thin instance the hit applies to
     */
    instanceIndex?: number;
}

/**
 * Interface for radial explosion event data
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export interface PhysicsRadialExplosionEventData {
    /**
     * A sphere used for the radial explosion event
     */
    sphere: Mesh;
}

/**
 * Interface for gravitational field event data
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export interface PhysicsGravitationalFieldEventData {
    /**
     * A sphere mesh used for the gravitational field event
     */
    sphere: Mesh;
}

/**
 * Interface for updraft event data
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export interface PhysicsUpdraftEventData {
    /**
     * A cylinder used for the updraft event
     */
    cylinder?: Mesh;
}

/**
 * Interface for vortex event data
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
 */
export interface PhysicsVortexEventData {
    /**
     * A cylinder used for the vortex event
     */
    cylinder: Mesh;
}

/**
 * Interface for an affected physics impostor
 * @see https://doc.babylonjs.com/features/featuresDeepDive/physics/usingPhysicsEngine#further-functionality-of-the-impostor-class
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

/**
 * Interface for an affected physics body
 * @see
 */
export interface PhysicsAffectedBodyWithData {
    /**
     * The impostor affected by the effect
     */
    body: PhysicsBody;

    /**
     * The data about the hit/force from the explosion
     */
    hitData: PhysicsHitData;
}
