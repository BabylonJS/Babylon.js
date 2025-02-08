import type { AbstractMesh } from "core/Meshes/abstractMesh";
import type { TransformNode } from "core/Meshes/transformNode";
import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Nullable } from "../../../types";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _SpatialAudioAttacher } from "../spatialAttachers/spatialAudioAttacher";
import type { SpatialAudioAttachmentType } from "../spatialAttachers/spatialAudioAttacher";
import type { ISpatialAudioOptions } from "../subProperties/abstractSpatialAudio";
import { _SpatialAudioDefaults } from "../subProperties/abstractSpatialAudio";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    private _attacher: _SpatialAudioAttacher;

    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.SPATIAL, engine);

        this._attacher = new _SpatialAudioAttacher(this);
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

    /** @internal */
    public get isAttached(): boolean {
        return this._attacher.isAttached;
    }

    /** @internal */
    public get minUpdateTime(): number {
        return this._attacher.minUpdateTime;
    }

    public set minUpdateTime(value: number) {
        this._attacher.minUpdateTime = value;
    }

    /** @internal */
    public detach(): void {
        this._attacher.detach();
    }

    /** @internal */
    public async setOptions(options: Partial<ISpatialAudioOptions>): Promise<void> {
        this.attachedMesh = options.spatialAttachedMesh ?? null;
        this.attachedTransformNode = options.spatialAttachedTransformNode ?? null;
        this.attachmentType = options.spatialAttachmentType ?? _SpatialAudioDefaults.attachmentType;
        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefaults.coneInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefaults.coneOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefaults.coneOuterVolume;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefaults.distanceModel;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefaults.maxDistance;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefaults.panningModel;
        this.referenceDistance = options.spatialReferenceDistance ?? _SpatialAudioDefaults.referenceDistance;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefaults.rolloffFactor;

        await this._attacher.isReadyPromise;

        if (!this._attacher.isAttachedToPosition && options.spatialPosition !== undefined) {
            this.position = options.spatialPosition.clone();
        }

        if (!this._attacher.isAttachedToRotation) {
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
    public updateAttached(): void {
        this._attacher.update();
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
