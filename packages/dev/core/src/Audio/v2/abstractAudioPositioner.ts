/* eslint-disable babylonjs/available */
/* eslint-disable jsdoc/require-jsdoc */

import { AbstractAudioNode, AudioNodeType } from "./abstractAudioNode";
import type { Vector3 } from "../../Maths/math.vector";
import type { AbstractMesh } from "../../Meshes";
import type { Nullable } from "../../types";

export abstract class AbstractAudioPositioner extends AbstractAudioNode {
    public constructor(parent: AbstractAudioNode) {
        super(parent.engine, AudioNodeType.InputOutput);

        this.setParent(parent);
    }

    private _spatializerGain: number = 1;
    private _spatializerPosition: Nullable<Vector3> = null;
    private _spatializerDirection: Nullable<Vector3> = null;
    // Cone angles and volumes, etc ...

    public get spatializerGain(): number {
        return this._spatializerGain;
    }

    public set spatializerGain(value: number) {
        this._spatializerGain = value;
    }

    public get spatializerPosition(): Nullable<Vector3> {
        return this._spatializerPosition;
    }

    public set spatializerPosition(value: Nullable<Vector3>) {
        this._spatializerPosition = value;
    }

    public get spatializerDirection(): Nullable<Vector3> {
        return this._spatializerDirection;
    }

    public set spatializerDirection(value: Nullable<Vector3>) {
        this._spatializerDirection = value;
    }

    private _attachedMesh: Nullable<AbstractMesh> = null;

    public get attachedMesh(): Nullable<AbstractMesh> {
        return this._attachedMesh;
    }

    public attachToMesh(mesh: AbstractMesh) {
        this._attachedMesh = mesh;
    }

    private _pannerGain: number = 1;

    public get pannerGain(): number {
        return this._pannerGain;
    }

    public set pannerGain(value: number) {
        this._pannerGain = value;
    }

    private _pannerPosition: Nullable<Vector3> = null;

    public get pannerPosition(): Nullable<Vector3> {
        return this._pannerPosition;
    }

    public set pannerPosition(value: Nullable<Vector3>) {
        this._pannerPosition = value;
    }
}
