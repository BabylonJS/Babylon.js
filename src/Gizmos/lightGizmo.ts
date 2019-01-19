import { Nullable } from "../types";
import { Color3 } from "../Maths/math";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { Gizmo } from "./gizmo";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";

import { StandardMaterial } from '../Materials/standardMaterial';
import { Light } from '../Lights/light';

/**
 * Gizmo that enables viewing a light
 */
export class LightGizmo extends Gizmo {
    private _box: Mesh;

    /**
     * Creates a LightGizmo
     * @param gizmoLayer The utility layer the gizmo will be added to
     */
    constructor(gizmoLayer?: UtilityLayerRenderer) {
        super(gizmoLayer);
        this._box = Mesh.CreateCylinder("light", 0.02, 0, 0.02, 16, 1, this.gizmoLayer.utilityLayerScene);
        this._box.rotation.x = Math.PI / 2;
        this._box.bakeCurrentTransformIntoVertices();
        this._box.material = new StandardMaterial("", this.gizmoLayer.utilityLayerScene);
        (this._box.material as StandardMaterial).emissiveColor = new Color3(1, 1, 1);
        this._rootMesh.addChild(this._box);
        this.attachedMesh = new AbstractMesh("", this.gizmoLayer.utilityLayerScene);
    }
    private _light: Nullable<Light> = null;

    /**
     * The light that the gizmo is attached to
     */
    public set light(light: Nullable<Light>) {
        this._light = light;
        if ((light as any).position) {
        this.attachedMesh!.position.copyFrom((light as any).position);
        }
        if ((light as any).direction) {
            this._box.setDirection((light as any).direction);
        }
    }
    public get light() {
        return this._light;
    }

    /**
     * @hidden
     * Updates the gizmo to match the attached mesh's position/rotation
     */
    protected _update() {
        super._update();
        if (!this._light) {
            return;
        }
        if ((this._light as any).position) {
            (this._light as any).position.copyFrom(this.attachedMesh!.position);
        }
        if ((this._light as any).direction) {
            (this._light as any).direction.copyFrom(this._box.forward);
        }
        if (!this._light.isEnabled()) {
            (this._box.material as StandardMaterial).emissiveColor.set(0, 0, 0);
        }else {
            (this._box.material as StandardMaterial).emissiveColor.set(1, 1, 1);
        }
    }
}