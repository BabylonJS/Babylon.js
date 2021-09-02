import { Matrix, Vector2, Vector3 } from "../../Maths/math.vector";
import { TransformNode } from "../../Meshes";
import { Observable } from "../../Misc/observable";
import { Nullable } from "../../types";
import { WebXRCamera } from "../webXRCamera";
import { WebXRFeatureName, WebXRFeaturesManager } from "../webXRFeaturesManager";
import { WebXRSessionManager } from "../webXRSessionManager";
import { WebXRAbstractFeature } from "./WebXRAbstractFeature";

class CircleBuffer {
    private _samples: Array<Vector2> = [];
    private _idx: number = 0;

    constructor (numSamples: number, initializer: Nullable<() => Vector2> = null) {
        for (let idx = 0; idx < numSamples; ++idx) {
            this._samples.push(initializer ? initializer() : Vector2.Zero());
        }
    }

    get length() {
        return this._samples.length;
    }

    push(x: number, y: number) {
        this._idx = (this._idx + this._samples.length - 1) % this._samples.length;
        this.at(0).copyFromFloats(x, y);
    }

    at(idx: number) {
        if (idx >= this._samples.length) {
            throw new Error("Index out of bounds");
        }
        return this._samples[(this._idx + idx) % this._samples.length];
    }
}

interface IDetectedStep {
    leftApex: Vector2;
    rightApex: Vector2;
    currentPosition: Vector2;
    currentStepDirection: "left" | "right";
}

class FirstStepDetector {
    private _samples = new CircleBuffer(60);
    private _entropy = 0;

    public onFirstStepDetected: Observable<IDetectedStep> = new Observable<IDetectedStep>();

    public update(posX: number, posY: number, forwardX: number, forwardY: number) {
        this._samples.push(posX, posY);
        const origin = this._samples.at(0);

        this._entropy *= this._entropyDecayFactor;
        this._entropy += Vector2.Distance(origin, this._samples.at(1));
        if (this._entropy > this._entropyThreshold) {
            return;
        }

        let samePointIdx;
        for (samePointIdx = this._samePointCheckStartIdx; samePointIdx < this._samples.length; ++samePointIdx) {
            if (Vector2.DistanceSquared(origin, this._samples.at(samePointIdx)) < this._samePointSquaredDistanceThreshold) {
                break;
            }
        }

        if (samePointIdx === this._samples.length) {
            return;
        }

        let apexDistSquared = -1;
        let apexIdx = 0;
        for (let distSquared, idx = 1; idx < samePointIdx; ++idx) {
            distSquared = Vector2.DistanceSquared(origin, this._samples.at(idx));
            if (distSquared > apexDistSquared) {
                apexIdx = idx;
                apexDistSquared = distSquared;
            }
        }

        if (apexDistSquared < this._apexSquaredDistanceThreshold) {
            return;
        }

        const apex = this._samples.at(apexIdx);
        const axis = apex.subtract(origin);
        axis.normalize();

        const vec = new Vector2();
        let dot;
        let sample;
        let sumSquaredProjectionDistances = 0;
        for (let idx = 1; idx < samePointIdx; ++idx) {
            sample = this._samples.at(idx);
            sample.subtractToRef(origin, vec);
            dot = Vector2.Dot(axis, vec);
            sumSquaredProjectionDistances += vec.lengthSquared() - (dot * dot);
        }

        if (sumSquaredProjectionDistances > (samePointIdx * this._squaredProjectionDistanceThreshold)) {
            return;
        }

        const forwardVec = new Vector3(forwardX, forwardY, 0);
        const axisVec = new Vector3(axis.x, axis.y, 0);
        const isApexLeft = Vector3.Cross(forwardVec, axisVec).z > 0;
        const leftApex = origin.clone();
        const rightApex = origin.clone();
        apex.subtractToRef(origin, axis);
        if (isApexLeft) {
            axis.scaleAndAddToRef(this._axisToApexShrinkFactor, leftApex);
            axis.scaleAndAddToRef(this._axisToApexExtendFactor, rightApex);
        } else {
            axis.scaleAndAddToRef(this._axisToApexExtendFactor, leftApex);
            axis.scaleAndAddToRef(this._axisToApexShrinkFactor, rightApex);
        }
        this.onFirstStepDetected.notifyObservers({
            leftApex: leftApex,
            rightApex: rightApex,
            currentPosition: origin,
            currentStepDirection: isApexLeft ? "right" : "left"
         });
    }

    public reset() {
        for (let idx = 0; idx < this._samples.length; ++idx) {
            this._samples.at(idx).copyFromFloats(0, 0);
        }
    }

    private get _samePointCheckStartIdx() {
        return this._samples.length / 3;
    }

    private get _samePointSquaredDistanceThreshold() {
        return 0.03 * 0.03;
    }

    private get _apexSquaredDistanceThreshold() {
        return 0.09 * 0.09;
    }

    private get _squaredProjectionDistanceThreshold() {
        return 0.03 * 0.03;
    }

    private get _axisToApexShrinkFactor() {
        return 0.8;
    }

    private get _axisToApexExtendFactor() {
        return -1.6;
    }

    private get _entropyDecayFactor() {
        return 0.98;
    }

    private get _entropyThreshold() {
        return 0.25;
    }
}

class WalkingTracker {
    _leftApex = new Vector2();
    _rightApex = new Vector2();
    _currentPosition = new Vector2();
    _axis = new Vector2();
    _axisLength = -1;
    _forward = new Vector2();
    _steppingLeft = false;
    _t = -1;
    _maxT = -1;
    _maxTPosition = new Vector2();
    _vitality = 0;

    onMovement = new Observable<{ deltaT: number }>();
    onFootfall = new Observable<{ foot: "left" | "right" }>();

    constructor(leftApex: Vector2, rightApex: Vector2, currentPosition: Vector2, currentStepDirection: "left" | "right") {
        this._reset(leftApex, rightApex, currentPosition, currentStepDirection === "left");
    }

    _reset(leftApex: Vector2, rightApex: Vector2, currentPosition: Vector2, steppingLeft: boolean) {
        this._leftApex.copyFrom(leftApex);
        this._rightApex.copyFrom(rightApex);
        this._steppingLeft = steppingLeft;

        if (this._steppingLeft) {
            this._leftApex.subtractToRef(this._rightApex, this._axis);
            this._forward.copyFromFloats(-this._axis.y, this._axis.x);
        } else {
            this._rightApex.subtractToRef(this._leftApex, this._axis);
            this._forward.copyFromFloats(this._axis.y, -this._axis.x);
        }
        this._axisLength = this._axis.length();
        this._forward.scaleInPlace(1 / this._axisLength);

        this._updateTAndVitality(currentPosition.x, currentPosition.y);
        this._maxT = this._t;
        this._maxTPosition.copyFrom(currentPosition);

        this._vitality = 1;
    }

    _updateTAndVitality(x: number, y: number) {
        this._currentPosition.copyFromFloats(x, y);

        if (this._steppingLeft) {
            this._currentPosition.subtractInPlace(this._rightApex);
        } else {
            this._currentPosition.subtractInPlace(this._leftApex);
        }
        const priorT = this._t;
        const dot = Vector2.Dot(this._currentPosition, this._axis);
        this._t = dot / (this._axisLength * this._axisLength);
        const projDistSquared = this._currentPosition.lengthSquared() - (dot / this._axisLength) * (dot / this._axisLength);

        // TODO: Extricate the magic.
        this._vitality *= (0.95 - 100 * Math.max(projDistSquared - 0.0016, 0) + Math.max(this._t - priorT, 0));
    }

    update(x: number, y: number) {
        if (this._vitality < this._vitalityThreshold) {
            return false;
        }

        const priorT = this._t;
        this._updateTAndVitality(x, y);

        if (this._t > this._maxT) {
            this._maxT = this._t;
            this._maxTPosition.copyFromFloats(x, y);
        }

        if (this._vitality < this._vitalityThreshold) {
            return false;
        }

        if (this._t > priorT) {
            this.onMovement.notifyObservers({ deltaT: (this._t - priorT) });

            if (priorT < 0.5 && this._t >= 0.5) {
                this.onFootfall.notifyObservers({ foot: this._steppingLeft ? "left" : "right" });
            }
        }

        if (this._t < 0.95 * this._maxT) {
            this._currentPosition.copyFromFloats(x, y);
            if (this._steppingLeft) {
                this._leftApex.copyFrom(this._maxTPosition);
            } else {
                this._rightApex.copyFrom(this._maxTPosition);
            }
            this._reset(this._leftApex, this._rightApex, this._currentPosition, !this._steppingLeft);
        }

        if (this._axisLength < 0.03) {
            return false;
        }

        return true;
    }

    get _vitalityThreshold() {
        return 0.1;
    }

    get forward() {
        return this._forward;
    }
}

class Walker {
    private _detector = new FirstStepDetector();
    private _walker: Nullable<WalkingTracker> = null;
    private _movement = new Vector2();

    public movementThisFrame: Vector3 = Vector3.Zero();

    constructor() {
        this._detector.onFirstStepDetected.add((event) => {
            if (!this._walker) {
                this._walker = new WalkingTracker(event.leftApex, event.rightApex, event.currentPosition, event.currentStepDirection);
                this._walker.onFootfall.add(() => {
                    console.log("Footfall!");
                });
                this._walker.onMovement.add((event) => {
                    this._walker!.forward.scaleAndAddToRef(0.024 * event.deltaT, this._movement);
                });
            }
        });
    }

    update(position: Vector3, forward: Vector3) {
        forward.y = 0;
        forward.normalize();

        this._detector.update(position.x, position.z, forward.x, forward.z);
        if (this._walker) {
            const updated = this._walker.update(position.x, position.z);
            if (!updated) {
                this._walker = null;
            }
        }

        this.movementThisFrame.set(this._movement.x, 0, this._movement.y);
        this._movement.scaleInPlace(0.96);
    }
}

/**
 * Options for the walking locomotion feature.
 */
export interface IWebXRWalkingLocomotionOptions {
    locomotionTarget: WebXRCamera | TransformNode;
}

/**
 * A module that will enable VR locomotion by detecting when the user walks in place.
 */
export class WebXRWalkingLocomotion extends WebXRAbstractFeature {
    /**
     * The module's name.
     */
    public static get Name(): string {
        return WebXRFeatureName.WALKING_LOCOMOTION;
    }
    
    /**
     * The (Babylon) version of this module.
     * This is an integer representing the implementation version.
     * This number has no external basis.
     */
    public static get Version(): number {
        return 1;
    }

    private _sessionManager: WebXRSessionManager;
    private _up: Vector3 = new Vector3();
    private _forward: Vector3 = new Vector3();
    private _position: Vector3 = new Vector3();
    private _movement: Vector3 = new Vector3();
    private _walker: Nullable<Walker>;

    /**
     * The Vector3 to be articulated by walking locomotion.
     * When the walking locomotion feature detects walking in place, this vector's
     * X and Z coordinates will be modified to reflect locomotion. This vector is
     * assumed to be in the base XR space and will be articulated accordingly.
     */
    public locomotionTarget: WebXRCamera | TransformNode;

    /**
     * Construct a new Walking Locomotion feature.
     * @param sessionManager manager for the current XR session
     * @param options creation options, prominently including the vector target for locomotion
     */
    public constructor(sessionManager: WebXRSessionManager, options: IWebXRWalkingLocomotionOptions) {
        super(sessionManager);
        this._sessionManager = sessionManager;
        this.locomotionTarget = options.locomotionTarget ?? new Vector3();
    }

    /**
     * Attaches the feature.
     * Typically called automatically by the features manager.
     * @returns true if attach succeeded, false otherwise
     */
    public attach(): boolean {
        if (!super.attach()) {
            return false;
        }

        this._walker = new Walker();
        return true;
    }

    /**
     * Detaches the feature.
     * Typically called automatically by the features manager.
     * @returns true if detach succeeded, false otherwise
     */
    public detach(): boolean {
        if (!super.detach()) {
            return false;
        }

        this._walker = null;
        return true;
    }

    protected _onXRFrame(frame: XRFrame): void {
        const pose = frame.getViewerPose(this._sessionManager.baseReferenceSpace);
        if (!pose) {
            return;
        }

        const handednessScalar = this.locomotionTarget.getScene().useRightHandedSystem ? 1 : -1;
        
        const m = pose.transform.matrix;
        this._up.copyFromFloats(m[4], m[5], handednessScalar * m[6]);
        this._forward.copyFromFloats(m[8], m[9], handednessScalar * m[10]);
        this._position.copyFromFloats(m[12], m[13], handednessScalar * m[14]);

        // Compute the nape position
        this._forward.scaleAndAddToRef(0.05, this._position);
        this._up.scaleAndAddToRef(-0.05, this._position);
        this._walker!.update(this._position, this._forward);
        this._movement.copyFrom(this._walker!.movementThisFrame);
        if (this.locomotionTarget instanceof TransformNode) {
            Vector3.TransformNormalToRef(this._movement, this.locomotionTarget.getWorldMatrix(), this._movement);
        }
        this.locomotionTarget.position.addInPlace(this._movement);
    }
}

//register the plugin
WebXRFeaturesManager.AddWebXRFeature(
    WebXRWalkingLocomotion.Name,
    (xrSessionManager, options) => {
        return () => new WebXRWalkingLocomotion(xrSessionManager, options);
    },
    WebXRWalkingLocomotion.Version,
    false
);
