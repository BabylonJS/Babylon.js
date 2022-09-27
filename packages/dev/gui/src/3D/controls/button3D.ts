import { Vector4 } from "core/Maths/math.vector";
import type { TransformNode } from "core/Meshes/transformNode";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { CreateBox } from "core/Meshes/Builders/boxBuilder";
import type { Material } from "core/Materials/material";
import { StandardMaterial } from "core/Materials/standardMaterial";
import type { Scene } from "core/scene";

import { AbstractButton3D } from "./abstractButton3D";
import type { AdvancedDynamicTexture } from "../../2D/advancedDynamicTexture";
import { Color3 } from "core/Maths/math.color";

/**
 * Class used to create a button in 3D
 */
export class Button3D extends AbstractButton3D {
    /** @internal */
    protected _currentMaterial: Material;

    /**
     * Creates a new button
     * @param name defines the control name
     */
    constructor(name?: string) {
        super(name);

        // Default animations

        this.pointerEnterAnimation = () => {
            if (!this.mesh) {
                return;
            }
            (<StandardMaterial>this._currentMaterial).emissiveColor = Color3.Red();
        };

        this.pointerOutAnimation = () => {
            (<StandardMaterial>this._currentMaterial).emissiveColor = Color3.Black();
        };

        this.pointerDownAnimation = () => {
            if (!this.mesh) {
                return;
            }

            this.mesh.scaling.scaleInPlace(0.95);
        };

        this.pointerUpAnimation = () => {
            if (!this.mesh) {
                return;
            }

            this.mesh.scaling.scaleInPlace(1.0 / 0.95);
        };
    }

    /**
     * Apply the facade texture (created from the content property).
     * @param facadeTexture defines the AdvancedDynamicTexture to use
     */
    protected _applyFacade(facadeTexture: AdvancedDynamicTexture) {
        (<any>this._currentMaterial).emissiveTexture = facadeTexture;
    }

    protected _getTypeName(): string {
        return "Button3D";
    }

    // Mesh association
    protected _createNode(scene: Scene): TransformNode {
        const faceUV = new Array(6);

        for (let i = 0; i < 6; i++) {
            faceUV[i] = new Vector4(0, 0, 0, 0);
        }
        if (scene.useRightHandedSystem) {
            // Flip the u on the texture
            faceUV[0].copyFromFloats(1, 0, 0, 1);
        } else {
            faceUV[1].copyFromFloats(0, 0, 1, 1);
        }

        const mesh = CreateBox(
            this.name + "_rootMesh",
            {
                width: 1.0,
                height: 1.0,
                depth: 0.08,
                faceUV: faceUV,
                wrap: true,
            },
            scene
        );

        return mesh;
    }

    protected _affectMaterial(mesh: AbstractMesh) {
        const material = new StandardMaterial(this.name + "Material", mesh.getScene());
        material.specularColor = Color3.Black();

        mesh.material = material;
        this._currentMaterial = material;

        this._resetContent();
    }

    /**
     * Releases all associated resources
     */
    public dispose() {
        super.dispose();

        this._disposeFacadeTexture();

        if (this._currentMaterial) {
            this._currentMaterial.dispose();
        }
    }
}
