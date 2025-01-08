import { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export class _SpatialAudioDefault {
    /** @internal */
    public static readonly ConeInnerAngle = 360;
    /** @internal */
    public static readonly ConeOuterAngle = 360;
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
    public static readonly RotationQuaternion = Quaternion.FromEulerVector(_SpatialAudioDefault.Rotation);
}

/**
 * Options for spatial audio.
 */
export interface ISpatialAudioOptions {
    /**
     * The spatial cone inner angle. Default is 360.
     */
    spatialConeInnerAngle: number;
    /**
     * The spatial cone outer angle. Default is 360.
     */
    spatialConeOuterAngle: number;
    /**
     * The spatial cone outer gain. Default is 0.
     */
    spatialConeOuterVolume: number;
    /**
     * The spatial distance model. Default is "inverse".
     */
    spatialDistanceModel: "linear" | "inverse" | "exponential";
    /**
     * Enable spatial audio. Default is false.
     */
    spatialEnabled: boolean;
    /**
     * The spatial max distance. Default is 10000.
     */
    spatialMaxDistance: number;
    /**
     * The spatial panning model. Default is "equalpower".
     */
    spatialPanningModel: "equalpower" | "HRTF";
    /**
     * The spatial position. Default is (0, 0, 0).
     */
    spatialPosition: Vector3;
    /**
     * The spatial reference distance. Default is 1.
     */
    spatialReferenceDistance: number;
    /**
     * The spatial rolloff factor. Default is 1.
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
        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefault.ConeInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefault.ConeOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefault.ConeOuterVolume;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefault.DistanceModel;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefault.MaxDistance;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefault.PanningModel;
        this.referenceDistance = options.spatialReferenceDistance ?? _SpatialAudioDefault.ReferenceDistance;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefault.RolloffFactor;

        if (options.spatialPosition !== undefined) {
            this.position = options.spatialPosition.clone();
        }

        if (options.spatialRotationQuaternion !== undefined) {
            this.rotationQuaternion = options.spatialRotationQuaternion.clone();
        } else if (options.spatialRotation !== undefined) {
            this.rotation = options.spatialRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioDefault.RotationQuaternion.clone();
        }

        this.transformNode = options.spatialTransformNode ?? null;
    }
}
