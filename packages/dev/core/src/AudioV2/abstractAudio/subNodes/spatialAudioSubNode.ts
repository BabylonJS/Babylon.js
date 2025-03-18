import type { Quaternion, Vector3 } from "../../../Maths/math.vector";
import type { Node } from "../../../node";
import type { Nullable } from "../../../types";
import type { SpatialAudioAttachmentType } from "../../spatialAudioAttachmentType";
import type { AudioEngineV2 } from "../audioEngineV2";
import { _SpatialAudioAttacherComponent } from "../components/spatialAudioAttacherComponent";
import type { ISpatialAudioOptions } from "../subProperties/abstractSpatialAudio";
import { _SpatialAudioDefaults } from "../subProperties/abstractSpatialAudio";
import type { _AbstractAudioSubGraph } from "./abstractAudioSubGraph";
import { _AbstractAudioSubNode } from "./abstractAudioSubNode";
import { AudioSubNode } from "./audioSubNode";

/** @internal */
export abstract class _SpatialAudioSubNode extends _AbstractAudioSubNode {
    private _attacherComponent: Nullable<_SpatialAudioAttacherComponent> = null;

    protected constructor(engine: AudioEngineV2) {
        super(AudioSubNode.SPATIAL, engine);
    }

    public abstract coneInnerAngle: number;
    public abstract coneOuterAngle: number;
    public abstract coneOuterVolume: number;
    public abstract distanceModel: DistanceModelType;
    public abstract maxDistance: number;
    public abstract minDistance: number;
    public abstract panningModel: PanningModelType;
    public abstract position: Vector3;
    public abstract rolloffFactor: number;
    public abstract rotation: Vector3;
    public abstract rotationQuaternion: Quaternion;
    public abstract inNode: AudioNode;

    /** @internal */
    public get isAttached(): boolean {
        return this._attacherComponent !== null && this._attacherComponent.isAttached;
    }

    /** @internal */
    public attach(sceneNode: Nullable<Node>, useBoundingBox: boolean, attachmentType: SpatialAudioAttachmentType): void {
        this.detach();

        if (!this._attacherComponent) {
            this._attacherComponent = new _SpatialAudioAttacherComponent(this);
        }

        this._attacherComponent.attach(sceneNode, useBoundingBox, attachmentType);
    }

    /** @internal */
    public detach(): void {
        this._attacherComponent?.detach();
    }

    /** @internal */
    public override dispose(): void {
        super.dispose();

        this._attacherComponent?.dispose();
        this._attacherComponent = null;
    }

    /** @internal */
    public setOptions(options: Partial<ISpatialAudioOptions>): void {
        this.coneInnerAngle = options.spatialConeInnerAngle ?? _SpatialAudioDefaults.coneInnerAngle;
        this.coneOuterAngle = options.spatialConeOuterAngle ?? _SpatialAudioDefaults.coneOuterAngle;
        this.coneOuterVolume = options.spatialConeOuterVolume ?? _SpatialAudioDefaults.coneOuterVolume;
        this.distanceModel = options.spatialDistanceModel ?? _SpatialAudioDefaults.distanceModel;
        this.maxDistance = options.spatialMaxDistance ?? _SpatialAudioDefaults.maxDistance;
        this.minDistance = options.spatialMinDistance ?? _SpatialAudioDefaults.minDistance;
        this.panningModel = options.spatialPanningModel ?? _SpatialAudioDefaults.panningModel;
        this.rolloffFactor = options.spatialRolloffFactor ?? _SpatialAudioDefaults.rolloffFactor;

        if (options.spatialPosition) {
            this.position = options.spatialPosition.clone();
        }

        if (options.spatialRotationQuaternion) {
            this.rotationQuaternion = options.spatialRotationQuaternion.clone();
        } else if (options.spatialRotation) {
            this.rotation = options.spatialRotation.clone();
        } else {
            this.rotationQuaternion = _SpatialAudioDefaults.rotationQuaternion.clone();
        }

        this.update();
    }

    /** @internal */
    public update(): void {
        if (this.isAttached) {
            this._attacherComponent?.update();
        } else {
            this._updatePosition();
            this._updateRotation();
        }
    }

    public abstract _updatePosition(): void;
    public abstract _updateRotation(): void;
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
