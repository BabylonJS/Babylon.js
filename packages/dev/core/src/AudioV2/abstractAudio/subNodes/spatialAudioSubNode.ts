import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../audioEngineV2";
import type { ISpatialAudioOptions } from "../subProperties";
import { _SpatialAudioDefaults } from "../subProperties/abstractSpatialAudio";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.SPATIAL, engine);
    }

    public abstract coneInnerAngle: number;
    public abstract coneOuterAngle: number;
    public abstract coneOuterVolume: number;
    public abstract distanceModel: DistanceModelType;
    public abstract maxDistance: number;
    public abstract panningModel: PanningModelType;
    public abstract position: Vector3;
    public abstract referenceDistance: number;
    public abstract rolloffFactor: number;
    public abstract rotation: Vector3;
    public abstract rotationQuaternion: Quaternion;
    public abstract inNode: AudioNode;

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioOptions>): void {
        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefaults.coneInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefaults.coneOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefaults.coneOuterVolume;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefaults.distanceModel;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefaults.maxDistance;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefaults.panningModel;
        this.referenceDistance = options.spatialReferenceDistance ?? _SpatialAudioDefaults.referenceDistance;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefaults.rolloffFactor;

        if (options.spatialPosition !== undefined) {
            this.position = options.spatialPosition.clone();
        }

        if (options.spatialRotationQuaternion !== undefined) {
            this.rotationQuaternion = options.spatialRotationQuaternion.clone();
        } else if (options.spatialRotation !== undefined) {
            this.rotation = options.spatialRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioDefaults.rotationQuaternion.clone();
        }
    }
}

/** @internal */
export function _GetSpatialAudioSubNode(subGraph: _AbstractAudioSubGraph): Nullable<_SpatialAudioSubNode> {
    return subGraph.getSubNode<_SpatialAudioSubNode>(AudioSubNode.SPATIAL);
}

/** @internal */
export function _GetSpatialAudioProperty<K extends keyof typeof _SpatialAudioDefaults>(subGraph: _AbstractAudioSubGraph, property: K): (typeof _SpatialAudioDefaults)[K] {
    return _GetSpatialAudioSubNode(subGraph)?.[property] ?? _SpatialAudioDefaults[property];
}

/** @internal */
export function _SetSpatialAudioProperty<K extends keyof typeof _SpatialAudioDefaults>(subGraph: _AbstractAudioSubGraph, property: K, value: _SpatialAudioSubNode[K]): void {
    subGraph.callOnSubNode<_SpatialAudioSubNode>(AudioSubNode.SPATIAL, (node) => {
        node[property] = value;
    });
}
