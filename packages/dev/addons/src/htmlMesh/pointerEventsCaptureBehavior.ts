import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { Behavior } from "core/Behaviors/behavior";
import type { Scene } from "core/scene";
import { Logger } from "core/Misc/logger";
import { requestCapture, requestRelease, releaseCurrent, getCapturingId } from "./pointerEventsCapture";

// Module level variable for holding the current scene
let _scene: Scene | null = null;

// Module level variable to hold the count of behavior instances that are currently capturing pointer events
// on entry.  This is used to determine if we need to start or stop observing pointer movement.
let captureOnEnterCount = 0;

// Map used to store instance of the PointerEventsCaptureBehavior for a mesh
// We do this because this gets checked on pointer move and we don't want to
// use getBehaviorByName() because that is a linear search
const meshToBehaviorMap = new WeakMap<AbstractMesh, PointerEventsCaptureBehavior>();

const startCaptureOnEnter = (scene: Scene) => {
    // If we are not in a browser, do nothing
    if (typeof document === "undefined") {
        return;
    }
    if (captureOnEnterCount === 0) {
        document.addEventListener("pointermove", onPointerMove);
        document.addEventListener("touchstart", onPointerMove);
        _scene = _scene ?? scene;
        Logger.Log("PointerEventsCaptureBehavior: Starting observation of pointer move events.");
        _scene.onDisposeObservable.add(doStopCaptureOnEnter);
    }
    captureOnEnterCount++;
};

const doStopCaptureOnEnter = () => {
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("touchstart", onPointerMove);
    _scene = null;
    Logger.Log("PointerEventsCaptureBehavior: Stopping observation of pointer move events.");
    captureOnEnterCount = 0;
};

const stopCaptureOnEnter = () => {
    // If we are not in a browser, do nothing
    if (typeof document === "undefined") {
        return;
    }

    // If we are not observing pointer movement, do nothing
    if (!_scene) {
        return;
    }

    captureOnEnterCount--;
    if (captureOnEnterCount <= 0) {
        doStopCaptureOnEnter();
    }
};

// Module level function used to determine if an entered mesh should capture pointer events
const onPointerMove = (evt: PointerEvent | TouchEvent) => {
    if (!_scene) {
        return;
    }

    const canvasRect = _scene.getEngine().getRenderingCanvasClientRect();
    if (!canvasRect) {
        return;
    }

    // Get the object that contains the client X and Y from either the pointer event or from the
    // TouchEvent touch
    const { clientX, clientY } = "touches" in evt ? evt.touches[0] : evt;

    // get the picked mesh, if any
    const pointerScreenX = clientX - canvasRect.left;
    const pointerScreenY = clientY - canvasRect.top;

    let pointerCaptureBehavior: PointerEventsCaptureBehavior | undefined;
    const pickResult = _scene.pick(pointerScreenX, pointerScreenY, (mesh) => {
        // If the mesh has an instance of PointerEventsCaptureBehavior attached to it,
        // and capture on pointer enter is true, then we want to pick it
        const pointerCaptureBehavior = meshToBehaviorMap.get(mesh);
        return mesh.isEnabled() && typeof pointerCaptureBehavior !== "undefined" && pointerCaptureBehavior._captureOnPointerEnter;
    });

    let pickedMesh: AbstractMesh | null;
    if (pickResult.hit) {
        pickedMesh = pickResult.pickedMesh;
    } else {
        pickedMesh = null;
    }

    const capturingIdAsInt = parseInt(getCapturingId() || "");

    // if the picked mesh is the current capturing mesh, do nothing
    if (pickedMesh && pickedMesh.uniqueId === capturingIdAsInt) {
        return;
    }

    // If there is a capturing mesh and it is not the current picked mesh, or no
    // mesh is picked, release the capturing mesh
    if (capturingIdAsInt && (!pickedMesh || pickedMesh.uniqueId !== capturingIdAsInt)) {
        releaseCurrent();
    }

    // If there is a picked mesh and it is not the current capturing mesh, capture
    // the pointer events.  Note that the current capturing mesh has already been
    // released above
    if (pickedMesh) {
        pointerCaptureBehavior = meshToBehaviorMap.get(pickedMesh);
        pointerCaptureBehavior!.capturePointerEvents();
    }
};

/**
 * Behavior for any content that can capture pointer events, i.e. bypass the Babylon pointer event handling
 * and receive pointer events directly.  It will register the capture triggers and negotiate the capture and
 * release of pointer events.  Curerntly this applies only to HtmlMesh
 */
export class PointerEventsCaptureBehavior implements Behavior<AbstractMesh> {
    /** gets or sets behavior's name */
    public name = "PointerEventsCaptureBehavior";

    private _attachedMesh: AbstractMesh | null;
    /** @internal */
    public _captureOnPointerEnter: boolean;

    /**
     * Gets or sets the mesh that the behavior is attached to
     */
    public get attachedMesh() {
        return this._attachedMesh;
    }

    public set attachedMesh(value: AbstractMesh | null) {
        this._attachedMesh = value;
    }

    constructor(
        private _captureCallback: () => void,
        private _releaseCallback: () => void,
        { captureOnPointerEnter = true } = {}
    ) {
        this._attachedMesh = null;
        this._captureOnPointerEnter = captureOnPointerEnter;

        // Warn if we are not in a browser
        if (typeof document === "undefined") {
            Logger.Warn(`Creating an instance of PointerEventsCaptureBehavior outside of a browser.  The behavior will not work.`);
        }
    }

    /**
     * Set if the behavior should capture pointer events when the pointer enters the mesh
     */
    public set captureOnPointerEnter(captureOnPointerEnter: boolean) {
        if (this._captureOnPointerEnter === captureOnPointerEnter) {
            return;
        }
        this._captureOnPointerEnter = captureOnPointerEnter;
        if (this._attachedMesh) {
            if (this._captureOnPointerEnter) {
                startCaptureOnEnter(this._attachedMesh.getScene()!);
            } else {
                stopCaptureOnEnter();
            }
        }
    }

    /**
     * Function called when the behavior needs to be initialized (before attaching it to a target)
     */
    public init() {}

    /**
     * Called when the behavior is attached to a target
     * @param mesh defines the target where the behavior is attached to
     */
    public attach(mesh: AbstractMesh) {
        // Add a reference to this behavior on the mesh.  We do this so we can get a
        // reference to the behavior in the onPointerMove function without relying on
        // getBehaviorByName(), which does a linear search of the behaviors array.
        this.attachedMesh = mesh;
        meshToBehaviorMap.set(mesh, this);
        if (this._captureOnPointerEnter) {
            startCaptureOnEnter(mesh.getScene()!);
        }
    }

    /**
     * Called when the behavior is detached from its target
     */
    public detach() {
        if (!this.attachedMesh) {
            return;
        }
        // Remove the reference to this behavior from the mesh
        meshToBehaviorMap.delete(this.attachedMesh);
        if (this._captureOnPointerEnter) {
            stopCaptureOnEnter();
        }
        this.attachedMesh = null;
    }

    /**
     * Dispose the behavior
     */
    public dispose() {
        this.detach();
    }

    // Release pointer events
    public releasePointerEvents() {
        if (!this.attachedMesh) {
            return;
        }
        requestRelease(this.attachedMesh.uniqueId.toString());
    }

    // Capture pointer events
    public capturePointerEvents() {
        if (!this.attachedMesh) {
            return;
        }
        requestCapture(this.attachedMesh.uniqueId.toString(), this._captureCallback, this._releaseCallback);
    }
}
