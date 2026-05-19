import { type Nullable } from "../types";
import { Quaternion, TmpVectors } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import { Mesh } from "../Meshes/mesh";
import { type IGizmo, Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { StandardMaterial } from "../Materials/standardMaterial";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder";
import { CreateSphere } from "../Meshes/Builders/sphereBuilder";
import { type PointerInfo, PointerEventTypes } from "../Events/pointerEvents";
import { type Observer, Observable } from "../Misc/observable";
import { type Scene } from "../scene";
import { type AbstractSoundSource } from "../AudioV2/abstractAudio/abstractSoundSource";

/**
 * Interface for a spatial audio gizmo.
 */
export interface ISpatialAudioGizmo extends IGizmo {
    /** Event that fires each time the gizmo is clicked. */
    onClickedObservable: Observable<AbstractSoundSource>;
    /** The sound source the gizmo is attached to. */
    soundSource: Nullable<AbstractSoundSource>;
    /** The material used to render the gizmo. */
    readonly material: StandardMaterial;
}

/**
 * Gizmo that visualizes the position and orientation of a v2 spatial sound source.
 */
export class SpatialAudioGizmo extends Gizmo implements ISpatialAudioGizmo {
    private static readonly _Scale = 0.035;

    protected _soundSource: Nullable<AbstractSoundSource> = null;
    protected _audioMesh: Mesh;
    protected _material: StandardMaterial;
    protected _pointerObserver: Nullable<Observer<PointerInfo>> = null;

    /** Event that fires each time the gizmo is clicked. */
    public readonly onClickedObservable = new Observable<AbstractSoundSource>();

    /**
     * Creates a SpatialAudioGizmo.
     * @param gizmoLayer The utility layer the gizmo will be added to.
     */
    constructor(gizmoLayer: UtilityLayerRenderer = UtilityLayerRenderer.DefaultUtilityLayer) {
        super(gizmoLayer);

        const utilityScene = this.gizmoLayer.utilityLayerScene;

        this.attachedMesh = new Mesh("spatialAudioGizmo", utilityScene);

        this._material = new StandardMaterial("spatialAudio", utilityScene);
        this._material.diffuseColor = new Color3(0.5, 0.5, 0.5);
        this._material.specularColor = new Color3(0.1, 0.1, 0.1);

        this._audioMesh = SpatialAudioGizmo._CreateSpeakerMesh(utilityScene);
        this._audioMesh.parent = this._rootMesh;
        for (const child of this._audioMesh.getChildMeshes(false)) {
            child.material = this._material;
        }

        const gizmoLight = this.gizmoLayer._getSharedGizmoLight();
        gizmoLight.includedOnlyMeshes = gizmoLight.includedOnlyMeshes.concat(this._audioMesh.getChildMeshes(false));

        this._pointerObserver = utilityScene.onPointerObservable.add((pointerInfo) => {
            if (!this._soundSource) {
                return;
            }
            const picked = pointerInfo.pickInfo?.pickedMesh;
            this._isHovered = !!picked && this._rootMesh.getChildMeshes().indexOf(picked as Mesh) !== -1;
            if (this._isHovered && pointerInfo.type === PointerEventTypes.POINTERDOWN && pointerInfo.event.button === 0) {
                this.onClickedObservable.notifyObservers(this._soundSource);
            }
        });
    }

    /**
     * The sound source the gizmo is attached to.
     */
    public get soundSource(): Nullable<AbstractSoundSource> {
        return this._soundSource;
    }

    public set soundSource(soundSource: Nullable<AbstractSoundSource>) {
        this._soundSource = soundSource;
        if (soundSource && this.attachedMesh) {
            if (!this.attachedMesh.reservedDataStore) {
                this.attachedMesh.reservedDataStore = {};
            }
            this.attachedMesh.reservedDataStore.spatialAudioGizmo = this;
            this.attachedMesh.rotationQuaternion ??= new Quaternion();
            this._update();
        }
    }

    /**
     * Gets the material used to render the gizmo.
     */
    public get material(): StandardMaterial {
        return this._material;
    }

    /**
     * @internal
     * Mirrors the attached mesh to the sound source's spatial position and rotation.
     */
    protected override _update(): void {
        super._update();

        const source = this._soundSource;
        const attachedMesh = this.attachedMesh;
        if (!source || !attachedMesh || !source._isSpatial) {
            return;
        }

        attachedMesh.rotationQuaternion ??= new Quaternion();

        // When the sound is attached to a scene node, the actual world transform is on the node;
        // the spatial facade only caches the most recent user-set position/rotation. Read from the
        // node directly so the gizmo tracks movement of the attached entity.
        const spatial = source.spatial;
        const attachedNode = spatial.attachedNode;
        if (attachedNode) {
            const worldMatrix = attachedNode.getWorldMatrix();
            const position = TmpVectors.Vector3[0];
            const rotation = TmpVectors.Quaternion[0];
            worldMatrix.decompose(undefined, rotation, position);
            attachedMesh.position.copyFrom(position);
            attachedMesh.rotationQuaternion.copyFrom(rotation);
        } else {
            attachedMesh.position.copyFrom(spatial.position);
            attachedMesh.rotationQuaternion.copyFrom(spatial.rotationQuaternion);
        }
    }

    /**
     * Disposes of the gizmo.
     */
    public override dispose(): void {
        this.onClickedObservable.clear();
        this.gizmoLayer.utilityLayerScene.onPointerObservable.remove(this._pointerObserver);
        this._material.dispose();
        this._audioMesh.dispose();
        super.dispose();
    }

    private static _CreateSpeakerMesh(scene: Scene): Mesh {
        const root = new Mesh("spatialAudioRoot", scene);

        // Spherical body for the source point.
        const body = CreateSphere("spatialAudioBody", { diameter: 1, segments: 8 }, scene);
        body.parent = root;

        // A flared cone pointing along +Z to indicate the sound's facing direction.
        const cone = CreateCylinder(
            "spatialAudioCone",
            {
                height: 1.4,
                diameterTop: 1.6,
                diameterBottom: 0.2,
                tessellation: 12,
                subdivisions: 1,
            },
            scene
        );
        cone.parent = root;
        cone.rotation.x = Math.PI / 2;
        cone.position.z = 0.9;

        root.scaling.scaleInPlace(SpatialAudioGizmo._Scale);
        return root;
    }
}
