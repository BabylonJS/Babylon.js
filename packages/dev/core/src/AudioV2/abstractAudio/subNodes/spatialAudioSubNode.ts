import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _SpatialAudioDefaults, type ISpatialAudioOptions } from "../subProperties/abstractSpatialAudio";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.SPATIAL, engine);
    }

    public abstract coneInnerAngle: number;
    public abstract coneOuterAngle: number;
    public abstract coneOuterVolume: number;
    public abstract distanceModel: "linear" | "inverse" | "exponential";
    public abstract maxDistance: number;
    public abstract panningModel: "equalpower" | "HRTF";
    public abstract position: Vector3;
    public abstract referenceDistance: number;
    public abstract rolloffFactor: number;
    public abstract rotation: Vector3;
    public abstract rotationQuaternion: Quaternion;
    public abstract inNode: AudioNode;

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioOptions>): void {
        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefaults.CONE_INNER_ANGLE;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefaults.CONE_OUTER_ANGLE;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefaults.CONE_OUTER_VOLUME;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefaults.DISTANCE_MODEL;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefaults.MAX_DISTANCE;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefaults.PANNING_MODEL;
        this.referenceDistance = options.spatialReferenceDistance ?? _SpatialAudioDefaults.REFERENCE_DISTANCE;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefaults.ROLLOFF_FACTOR;

        if (options.spatialPosition !== undefined) {
            this.position = options.spatialPosition.clone();
        }

        if (options.spatialRotationQuaternion !== undefined) {
            this.rotationQuaternion = options.spatialRotationQuaternion.clone();
        } else if (options.spatialRotation !== undefined) {
            this.rotation = options.spatialRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioDefaults.ROTATION_QUATERNION.clone();
        }
    }
}
