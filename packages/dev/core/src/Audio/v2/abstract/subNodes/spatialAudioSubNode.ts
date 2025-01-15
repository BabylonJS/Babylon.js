import { Quaternion, Vector3 } from "../../../../Maths/math.vector";
import type { TransformNode } from "../../../../Meshes/transformNode";
import type { Nullable } from "../../../../types";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export class _SpatialAudioDefaults {
    /** @internal */
    public static readonly ConeInnerAngle = 2 * Math.PI;
    /** @internal */
    public static readonly ConeOuterAngle = 2 * Math.PI;
    /** @internal */
    public static readonly ConeOuterVolume = 0;
    /** @internal */
    public static readonly DistanceModel = "inverse";
    /** @internal */
    public static readonly MaxDistance = 10000;
    /** @internal */
    public static readonly PanningModel = "equalpower";
    /** @internal */
    public static readonly Position = Vector3.Zero();
    /** @internal */
    public static readonly ReferenceDistance = 1;
    /** @internal */
    public static readonly RolloffFactor = 1;
    /** @internal */
    public static readonly Rotation = Vector3.Zero();
    /** @internal */
    public static readonly RotationQuaternion = Quaternion.FromEulerVector(_SpatialAudioDefaults.Rotation);
}

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioOptions {
    /**
     * The spatial cone inner angle, in radians. Defaults to 2π.
     * - When the listener is inside the cone inner angle, the volume is at its maximum.
     */
    spatialConeInnerAngle: number;
    /**
     * The spatial cone outer angle, in radians. Defaults to 2π.
     * - When the listener is between the the cone inner and outer angles, the volume fades to its minimum as the listener approaches the outer angle.
     * - When the listener is outside the cone outer angle, the volume is at its minimum.
     */
    spatialConeOuterAngle: number;
    /**
     * The amount of volume reduction outside the {@link spatialConeOuterAngle}. Defaults to 0.
     */
    spatialConeOuterVolume: number;
    /**
     * The algorithm to use to reduce the volume of the audio source as it moves away from the listener. Defaults to "inverse".
     * @see {@link spatialMaxDistance}
     * @see {@link spatialReferenceDistance}
     * @see {@link spatialRolloffFactor}
     */
    spatialDistanceModel: "linear" | "inverse" | "exponential";
    /**
     * Enable spatial audio. Defaults to false.
     *
     * When set to `true`, the audio node's spatial properties will be initialized on creation and there will be no
     * delay when setting the first spatial value.
     *
     * When not specified, or set to `false`, the audio node's spatial properties will not be initialized on creation
     * and there will be a small delay when setting the first spatial value.
     *
     * - This option is ignored if any other spatial options are set.
     */
    spatialEnabled: boolean;
    /**
     * The maximum distance between the audio source and the listener, after which the volume is not reduced any further. Defaults to 10000.
     * - This value is used only when the {@link spatialDistanceModel} is set to `"linear"`.
     * @see {@link spatialDistanceModel}
     */
    spatialMaxDistance: number;
    /**
     * The spatial panning model. Defaults to "equalpower".
     * - "equalpower" requires less CPU than "HRTF" but is less realistic for listeners with headphones or speakers close to the ears.
     * - "HRTF" requires more CPU but is more realistic for listeners with headphones or speakers close to the ears.
     */
    spatialPanningModel: "equalpower" | "HRTF";
    /**
     * The spatial position. Defaults to (0, 0, 0).
     */
    spatialPosition: Vector3;
    /**
     * The distance for reducing volume as the audio source moves away from the listener – i.e. the distance the volume reduction starts at. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link spatialDistanceModel}
     */
    spatialReferenceDistance: number;
    /**
     * How quickly the volume is reduced as the source moves away from the listener. Defaults to 1.
     * - This value is used by all distance models.
     * @see {@link spatialDistanceModel}
     */
    spatialRolloffFactor: number;
    /**
     * The spatial rotation.
     */
    spatialRotation: Vector3;
    /**
     * The spatial rotation quaternion.
     */
    spatialRotationQuaternion: Quaternion;
    /**
     * The transform node to track spatially.
     */
    spatialTransformNode: TransformNode;
}

/**
 * @param options The spatial audio options to check.
 * @returns `true` if spatial audio options are defined, otherwise `false`.
 */
export function _HasSpatialAudioOptions(options: Partial<ISpatialAudioOptions>): boolean {
    return (
        options.spatialEnabled ||
        options.spatialConeInnerAngle !== undefined ||
        options.spatialConeOuterAngle !== undefined ||
        options.spatialConeOuterVolume !== undefined ||
        options.spatialDistanceModel !== undefined ||
        options.spatialMaxDistance !== undefined ||
        options.spatialPanningModel !== undefined ||
        options.spatialPosition !== undefined ||
        options.spatialReferenceDistance !== undefined ||
        options.spatialRolloffFactor !== undefined ||
        options.spatialRotation !== undefined ||
        options.spatialRotationQuaternion !== undefined ||
        options.spatialTransformNode !== undefined
    );
}

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.Spatial, engine);
    }

    public abstract get coneInnerAngle(): number;
    public abstract set coneInnerAngle(value: number);

    public abstract get coneOuterAngle(): number;
    public abstract set coneOuterAngle(value: number);

    public abstract get coneOuterVolume(): number;
    public abstract set coneOuterVolume(value: number);

    public abstract get distanceModel(): "linear" | "inverse" | "exponential";
    public abstract set distanceModel(value: "linear" | "inverse" | "exponential");

    public abstract get maxDistance(): number;
    public abstract set maxDistance(value: number);

    public abstract get panningModel(): "equalpower" | "HRTF";
    public abstract set panningModel(value: "equalpower" | "HRTF");

    public abstract get position(): Vector3;
    public abstract set position(value: Vector3);

    public abstract get referenceDistance(): number;
    public abstract set referenceDistance(value: number);

    public abstract get rolloffFactor(): number;
    public abstract set rolloffFactor(value: number);

    public abstract get rotation(): Vector3;
    public abstract set rotation(value: Vector3);

    public abstract get rotationQuaternion(): Quaternion;
    public abstract set rotationQuaternion(value: Quaternion);

    public abstract get transformNode(): Nullable<TransformNode>;
    public abstract set transformNode(value: Nullable<TransformNode>);

    public abstract get inNode(): AudioNode;
    public abstract get outNode(): AudioNode;

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioOptions>): void {
        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefaults.ConeInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefaults.ConeOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefaults.ConeOuterVolume;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefaults.DistanceModel;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefaults.MaxDistance;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefaults.PanningModel;
        this.referenceDistance = options.spatialReferenceDistance ?? _SpatialAudioDefaults.ReferenceDistance;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefaults.RolloffFactor;

        if (options.spatialPosition !== undefined) {
            this.position = options.spatialPosition.clone();
        }

        if (options.spatialRotationQuaternion !== undefined) {
            this.rotationQuaternion = options.spatialRotationQuaternion.clone();
        } else if (options.spatialRotation !== undefined) {
            this.rotation = options.spatialRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioDefaults.RotationQuaternion.clone();
        }

        this.transformNode = options.spatialTransformNode ?? null;
    }
}
