import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _SpatialAudioDefaults, type ISpatialAudioOptions } from "../subProperties/abstractSpatialAudio";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { _AudioSubNode } from "./audioSubNode";

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
    }
}
