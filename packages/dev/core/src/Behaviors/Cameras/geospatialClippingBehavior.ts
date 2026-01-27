import type { Behavior } from "../../Behaviors/behavior";
import type { GeospatialCamera } from "../../Cameras/geospatialCamera";
import type { Nullable } from "../../types";
import type { Observer } from "../../Misc/observable";
import type { Scene } from "../../scene";

/**
 * The GeospatialClippingBehavior automatically adjusts the near and far clip planes of a GeospatialCamera
 * based on altitude and viewing angle to optimize depth buffer precision for geospatial applications.
 *
 * When viewing from high altitudes looking down, a larger near plane can be used.
 * When viewing horizontally at ground level, a smaller near plane is needed to avoid clipping nearby terrain.
 * The far plane is calculated based on the visible horizon distance.
 */
export class GeospatialClippingBehavior implements Behavior<GeospatialCamera> {
    /**
     * Gets the name of the behavior.
     */
    public get name(): string {
        return "GeospatialClipping";
    }

    private _attachedCamera: Nullable<GeospatialCamera> = null;
    private _onBeforeRenderObserver: Nullable<Observer<Scene>> = null;

    /**
     * Gets the attached camera.
     */
    public get attachedNode(): Nullable<GeospatialCamera> {
        return this._attachedCamera;
    }

    /**
     * Initializes the behavior.
     */
    public init(): void {
        // Do nothing
    }

    /**
     * Attaches the behavior to its geospatial camera.
     * @param camera Defines the camera to attach the behavior to
     */
    public attach(camera: GeospatialCamera): void {
        this._attachedCamera = camera;
        const scene = camera.getScene();

        this._onBeforeRenderObserver = scene.onBeforeRenderObservable.add(() => {
            this._updateCameraClipPlanes();
        });
    }

    /**
     * Detaches the behavior from its current geospatial camera.
     */
    public detach(): void {
        if (this._attachedCamera) {
            const scene = this._attachedCamera.getScene();
            if (this._onBeforeRenderObserver) {
                scene.onBeforeRenderObservable.remove(this._onBeforeRenderObserver);
                this._onBeforeRenderObserver = null;
            }
        }
        this._attachedCamera = null;
    }

    /**
     * Updates the camera's near and far clip planes based on altitude and viewing angle.
     */
    private _updateCameraClipPlanes(): void {
        const camera = this._attachedCamera;
        if (!camera) {
            return;
        }

        const planetRadius = camera.limits.planetRadius;
        const altitude = Math.max(1, camera.radius);
        const pitch = camera.pitch; // 0 = looking down, π/2 = looking at horizon

        // Near plane calculation:
        // - When looking down (pitch ≈ 0): nearest visible point is roughly at altitude distance
        // - When looking at horizon (pitch ≈ π/2): nearby terrain can be much closer

        // Use pitch to blend between a small near (for horizontal view) and altitude-based near (for top-down)
        const pitchFactor = Math.sin(pitch); // 0 when looking down, 1 at horizon
        const minNearHorizontal = 1; // When looking horizontally, need small near plane
        const minNearVertical = Math.max(1, altitude * 0.01); // When looking down, can use larger near
        camera.minZ = minNearHorizontal + (minNearVertical - minNearHorizontal) * (1 - pitchFactor);

        // Far plane: see to the horizon and beyond
        const horizonDist = Math.sqrt(2 * planetRadius * altitude + altitude * altitude);
        camera.maxZ = horizonDist + planetRadius * 0.1;
    }
}
