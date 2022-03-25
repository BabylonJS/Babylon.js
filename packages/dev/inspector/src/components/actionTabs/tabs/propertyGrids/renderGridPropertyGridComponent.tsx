import * as React from "react";

import type { Nullable } from "core/types";
import { Color3 } from "core/Maths/math.color";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { Texture } from "core/Materials/Textures/texture";
import { UtilityLayerRenderer } from "core/Rendering/utilityLayerRenderer";
import type { Scene } from "core/scene";
import { GridMaterial } from "materials/grid/gridMaterial";

import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import type { GlobalState } from "../../../globalState";
import { CreateGround } from "core/Meshes/Builders/groundBuilder";

interface IRenderGridPropertyGridComponentProps {
    globalState: GlobalState;
    scene: Scene;
}

export class RenderGridPropertyGridComponent extends React.Component<IRenderGridPropertyGridComponentProps, { isEnabled: boolean }> {
    private _gridMesh: Nullable<AbstractMesh>;

    constructor(props: IRenderGridPropertyGridComponentProps) {
        super(props);
        this.state = { isEnabled: false };
    }

    componentDidMount() {
        const scene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;

        for (const mesh of scene.meshes) {
            if (mesh.reservedDataStore && mesh.reservedDataStore.isInspectorGrid) {
                this._gridMesh = mesh;
                this.setState({ isEnabled: true });
                return;
            }
        }
    }

    addOrRemoveGrid() {
        const scene = UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;

        if (!this._gridMesh) {
            const extend = this.props.scene.getWorldExtends();
            const width = (extend.max.x - extend.min.x) * 5.0;
            const depth = (extend.max.z - extend.min.z) * 5.0;

            this._gridMesh = CreateGround("grid", { width: 1.0, height: 1.0, subdivisions: 1 }, scene);
            if (!this._gridMesh.reservedDataStore) {
                this._gridMesh.reservedDataStore = {};
            }
            this._gridMesh.scaling.x = Math.max(width, depth);
            this._gridMesh.scaling.z = this._gridMesh.scaling.x;
            this._gridMesh.reservedDataStore.isInspectorGrid = true;
            this._gridMesh.isPickable = false;

            const groundMaterial = new GridMaterial("GridMaterial", scene);
            groundMaterial.majorUnitFrequency = 10;
            groundMaterial.minorUnitVisibility = 0.3;
            groundMaterial.gridRatio = 0.01;
            groundMaterial.backFaceCulling = false;
            groundMaterial.mainColor = new Color3(1, 1, 1);
            groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
            groundMaterial.opacity = 0.8;
            groundMaterial.zOffset = 1.0;
            groundMaterial.opacityTexture = new Texture("https://assets.babylonjs.com/environments/backgroundGround.png", scene);

            this._gridMesh.material = groundMaterial;

            this.setState({ isEnabled: true });
            return;
        }

        this.setState({ isEnabled: !this.state.isEnabled });
        this._gridMesh.dispose(true, true);
        this._gridMesh = null;
    }

    render() {
        return (
            <div>
                <CheckBoxLineComponent label="Render grid" isSelected={() => this.state.isEnabled} onSelect={() => this.addOrRemoveGrid()} />
            </div>
        );
    }
}
