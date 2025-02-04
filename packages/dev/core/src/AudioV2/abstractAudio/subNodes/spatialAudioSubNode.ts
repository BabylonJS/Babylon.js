import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { AbstractMesh } from "../../../Meshes/abstractMesh";
import type { TransformNode } from "../../../Meshes/transformNode";
import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _ExclusiveSpatialAudioAttacher } from "../spatial/exclusiveSpatialAudioAttacher";
import type { SpatialAudioAttachmentType } from "../spatial/spatialAudioAttacher";
import { _SpatialAudioDefaults, type ISpatialAudioOptions } from "../subProperties/abstractSpatialAudio";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { _AudioSubNode } from "./audioSubNode";

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    private _attacher: _ExclusiveSpatialAudioAttacher;

    /** @internal */
    public minUpdateTime: number = 0;

    protected constructor(engine: AudioEngineV2) {
        super(_AudioSubNode.SPATIAL, engine);

        this._attacher = new _ExclusiveSpatialAudioAttacher(this);
    }

    /** @internal */
    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attacher.attachedMesh;
    }

    public set attachedMesh(value: Nullable<AbstractMesh>) {
        this._attacher.attachedMesh = value;
    }

    /** @internal */
    public get attachedTransformNode(): Nullable<TransformNode> {
        return this._attacher.attachedTransformNode;
    }

    public set attachedTransformNode(value: Nullable<TransformNode>) {
        this._attacher.attachedTransformNode = value;
    }

    /** @internal */
    public get attachmentType(): SpatialAudioAttachmentType {
        return this._attacher.attachmentType;
    }

    public set attachmentType(value: SpatialAudioAttachmentType) {
        this._attacher.attachmentType = value;
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
    public async setOptions(options: Partial<ISpatialAudioOptions>): Promise<void> {
        if (options.spatialAttachedMesh !== undefined) {
            this.attachedMesh = options.spatialAttachedMesh;
        } else if (options.spatialAttachedTransformNode !== undefined) {
            this.attachedTransformNode = options.spatialAttachedTransformNode;
        }

        await this._attacher.isReadyPromise;

        if (options.spatialAttachmentType !== undefined) {
            this.attachmentType = options.spatialAttachmentType;
        }

        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefaults.CONE_INNER_ANGLE;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefaults.CONE_OUTER_ANGLE;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefaults.CONE_OUTER_VOLUME;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefaults.DISTANCE_MODEL;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefaults.MAX_DISTANCE;
        this.minUpdateTime = options.spatialMinUpdateTime ?? _SpatialAudioDefaults.MIN_UPDATE_TIME;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefaults.PANNING_MODEL;
        this.referenceDistance = options.spatialReferenceDistance ?? _SpatialAudioDefaults.REFERENCE_DISTANCE;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefaults.ROLLOFF_FACTOR;

        if (!this._attacher.isAttachedToPosition && options.spatialPosition !== undefined) {
            this.position = options.spatialPosition.clone();
        }

        if (!this._attacher.isAttachedToRotation) {
            if (options.spatialRotationQuaternion !== undefined) {
                this.rotationQuaternion = options.spatialRotationQuaternion.clone();
            } else if (options.spatialRotation !== undefined) {
                this.rotation = options.spatialRotation.clone();
            } else {
                this.rotationQuaternion = _SpatialAudioDefaults.ROTATION_QUATERNION.clone();
            }
        }
    }
}
