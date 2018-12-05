import * as React from "react";
import { Scene, AbstractMesh, Nullable } from "babylonjs";
import { CheckBoxLineComponent } from "../../lines/checkBoxLineComponent";

interface IRenderGridPropertyGridComponentProps {
    scene: Scene
}

export class RenderGridPropertyGridComponent extends React.Component<IRenderGridPropertyGridComponentProps, { isEnabled: boolean }> {
    private _gridMesh: Nullable<AbstractMesh>;

    constructor(props: IRenderGridPropertyGridComponentProps) {
        super(props);
        this.state = { isEnabled: false };
    }

    componentWillMount() {
        const scene = BABYLON.UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;

        for (var mesh of scene.meshes) {
            if (mesh.reservedDataStore && mesh.reservedDataStore.isInspectorGrid) {
                this._gridMesh = mesh;
                this.setState({ isEnabled: true });
                return;
            }
        }
    }

    addOrRemoveGrid() {
        const scene = BABYLON.UtilityLayerRenderer.DefaultKeepDepthUtilityLayer.utilityLayerScene;

        if (!(BABYLON as any).GridMaterial) {
            this.setState({ isEnabled: true });
            BABYLON.Tools.LoadScript("https://preview.babylonjs.com/materialsLibrary/babylonjs.materials.min.js", () => {
                this.addOrRemoveGrid();
            });
            return;
        }

        if (!this._gridMesh) {
            var extend = this.props.scene.getWorldExtends();
            var width = (extend.max.x - extend.min.x) * 5.0;
            var depth = (extend.max.z - extend.min.z) * 5.0;

            this._gridMesh = BABYLON.Mesh.CreateGround("grid", 1.0, 1.0, 1, scene);
            if (!this._gridMesh.reservedDataStore) {
                this._gridMesh.reservedDataStore = {};
            }
            this._gridMesh.scaling.x = Math.max(width, depth);
            this._gridMesh.scaling.z = this._gridMesh.scaling.x;
            this._gridMesh.reservedDataStore.isInspectorGrid = true;
            this._gridMesh.isPickable = false;

            var groundMaterial = new (BABYLON as any).GridMaterial("GridMaterial", scene);
            groundMaterial.majorUnitFrequency = 10;
            groundMaterial.minorUnitVisibility = 0.3;
            groundMaterial.gridRatio = 0.01;
            groundMaterial.backFaceCulling = false;
            groundMaterial.mainColor = new BABYLON.Color3(1, 1, 1);
            groundMaterial.lineColor = new BABYLON.Color3(1.0, 1.0, 1.0);
            groundMaterial.opacity = 0.8;
            groundMaterial.zOffset = 1.0;
            groundMaterial.opacityTexture = new BABYLON.Texture("https://assets.babylonjs.com/environments/backgroundGround.png", scene);

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