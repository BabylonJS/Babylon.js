import { Camera } from "../Cameras/camera";
import { DirectionalLight } from "../Lights/directionalLight";
import { StandardMaterial } from "../Materials/standardMaterial";
import { Color3 } from "../Maths/math.color";
import { Matrix, TmpVectors, Vector3 } from "../Maths/math.vector";
import { LinesBuilder } from "../Meshes/Builders/linesBuilder";
import { LinesMesh } from "../Meshes/linesMesh";
import { Mesh } from "../Meshes/mesh";
import { VertexData } from "../Meshes/mesh.vertexData";
import { TransformNode } from "../Meshes/transformNode";
import { Scene } from "../scene";

/**
 * Class used to render a debug view of the frustum for a directional light
 * @see https://playground.babylonjs.com/#7EFGSG#3
 */
export class DirectionalLightFrustumViewer {
    private _scene: Scene;
    private _light: DirectionalLight;
    private _camera: Camera;
    private _inverseViewMatrix: Matrix;
    private _visible: boolean;

    private _rootNode: TransformNode;
    private _lightHelperFrustumMeshes: Mesh[];

    private _nearLinesPoints: Vector3[];
    private _farLinesPoints: Vector3[];
    private _trLinesPoints: Vector3[];
    private _brLinesPoints: Vector3[];
    private _tlLinesPoints: Vector3[];
    private _blLinesPoints: Vector3[];

    private _nearPlaneVertices: number[];
    private _farPlaneVertices: number[];
    private _rightPlaneVertices: number[];
    private _leftPlaneVertices: number[];
    private _topPlaneVertices: number[];
    private _bottomPlaneVertices: number[];

    private _oldPosition: Vector3 = new Vector3(Number.NaN, Number.NaN, Number.NaN);
    private _oldDirection: Vector3 = new Vector3(Number.NaN, Number.NaN, Number.NaN);
    private _oldAutoCalc: boolean;
    private _oldMinZ: number;
    private _oldMaxZ: number;

    private _transparency = 0.3;
    /**
     * Gets or sets the transparency of the frustum planes
     */
    public get transparency(): number {
        return this._transparency;
    }

    public set transparency(alpha: number) {
        this._transparency = alpha;
        for (let i = 6; i < 12; ++i) {
            this._lightHelperFrustumMeshes[i].material!.alpha = alpha;
        }
    }

    private _showLines = true;
    /**
     * true to display the edges of the frustum
     */
    public get showLines(): boolean {
        return this._showLines;
    }

    public set showLines(show: boolean) {
        if (this._showLines === show) {
            return;
        }
        this._showLines = show;
        for (let i = 0; i < 6; ++i) {
            this._lightHelperFrustumMeshes[i].setEnabled(show);
        }
    }

    private _showPlanes = true;
    /**
     * true to display the planes of the frustum
     */
    public get showPlanes(): boolean {
        return this._showPlanes;
    }

    public set showPlanes(show: boolean) {
        if (this._showPlanes === show) {
            return;
        }
        this._showPlanes = show;
        for (let i = 6; i < 12; ++i) {
            this._lightHelperFrustumMeshes[i].setEnabled(show);
        }
    }

    /**
     * Creates a new frustum viewer
     * @param light directional light to display the frustum for
     * @param camera camera used to retrieve the minZ / maxZ values if the shadowMinZ/shadowMaxZ values of the light are not setup
     */
    constructor(light: DirectionalLight, camera: Camera) {
        this._scene = light.getScene();
        this._light = light;
        this._camera = camera;
        this._inverseViewMatrix = Matrix.Identity();
        this._lightHelperFrustumMeshes = [];
        this._createGeometry();
        this.show();
        this.update();
    }

    /**
     * Shows the frustum
     */
    public show() {
        this._lightHelperFrustumMeshes.forEach((mesh, index) => {
            mesh.setEnabled(index < 6 && this._showLines || index >= 6 && this._showPlanes);
        });
        this._oldPosition.set(Number.NaN, Number.NaN, Number.NaN);
        this._visible = true;
    }

    /**
     * Hides the frustum
     */
    public hide() {
        this._lightHelperFrustumMeshes.forEach((mesh) => {
            mesh.setEnabled(false);
        });
        this._visible = false;
    }

    /**
     * Updates the frustum.
     * Call this method to update the frustum view if the light has changed position/direction
     */
    public update() {
        if (!this._visible) {
            return;
        }

        if (this._oldPosition.equals(this._light.position)
            && this._oldDirection.equals(this._light.direction)
            && this._oldAutoCalc === this._light.autoCalcShadowZBounds
            && this._oldMinZ === this._light.shadowMinZ
            && this._oldMaxZ === this._light.shadowMaxZ
        ) {
            return;
        }

        this._oldPosition.copyFrom(this._light.position);
        this._oldDirection.copyFrom(this._light.direction);
        this._oldAutoCalc = this._light.autoCalcShadowZBounds;
        this._oldMinZ = this._light.shadowMinZ;
        this._oldMaxZ = this._light.shadowMaxZ;

        TmpVectors.Vector3[0].set(this._light.orthoLeft, this._light.orthoBottom, this._light.shadowMinZ !== undefined ? this._light.shadowMinZ : this._camera.minZ); // min light extents
        TmpVectors.Vector3[1].set(this._light.orthoRight, this._light.orthoTop, this._light.shadowMaxZ !== undefined ? this._light.shadowMaxZ : this._camera.maxZ); // max light extents

        const invLightView = this._getInvertViewMatrix();

        TmpVectors.Vector3[2].copyFromFloats(TmpVectors.Vector3[1].x, TmpVectors.Vector3[1].y, TmpVectors.Vector3[0].z); // n1
        TmpVectors.Vector3[3].copyFromFloats(TmpVectors.Vector3[1].x, TmpVectors.Vector3[0].y, TmpVectors.Vector3[0].z); // n2
        TmpVectors.Vector3[4].copyFromFloats(TmpVectors.Vector3[0].x, TmpVectors.Vector3[0].y, TmpVectors.Vector3[0].z); // n3
        TmpVectors.Vector3[5].copyFromFloats(TmpVectors.Vector3[0].x, TmpVectors.Vector3[1].y, TmpVectors.Vector3[0].z); // n4

        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[2], invLightView, TmpVectors.Vector3[2]); // near1
        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[3], invLightView, TmpVectors.Vector3[3]); // near2
        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[4], invLightView, TmpVectors.Vector3[4]); // near3
        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[5], invLightView, TmpVectors.Vector3[5]); // near4

        TmpVectors.Vector3[6].copyFromFloats(TmpVectors.Vector3[1].x, TmpVectors.Vector3[1].y, TmpVectors.Vector3[1].z); // f1
        TmpVectors.Vector3[7].copyFromFloats(TmpVectors.Vector3[1].x, TmpVectors.Vector3[0].y, TmpVectors.Vector3[1].z); // f2
        TmpVectors.Vector3[8].copyFromFloats(TmpVectors.Vector3[0].x, TmpVectors.Vector3[0].y, TmpVectors.Vector3[1].z); // f3
        TmpVectors.Vector3[9].copyFromFloats(TmpVectors.Vector3[0].x, TmpVectors.Vector3[1].y, TmpVectors.Vector3[1].z); // f4

        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[6], invLightView, TmpVectors.Vector3[6]); // far1
        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[7], invLightView, TmpVectors.Vector3[7]); // far2
        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[8], invLightView, TmpVectors.Vector3[8]); // far3
        Vector3.TransformCoordinatesToRef(TmpVectors.Vector3[9], invLightView, TmpVectors.Vector3[9]); // far4

        LinesBuilder.CreateLines("nearlines", { updatable: true, points: this._nearLinesPoints, instance: this._lightHelperFrustumMeshes[0] as LinesMesh }, this._scene);

        LinesBuilder.CreateLines("farlines",  { updatable: true, points: this._farLinesPoints, instance: this._lightHelperFrustumMeshes[1] as LinesMesh }, this._scene);

        LinesBuilder.CreateLines("trlines", { updatable: true, points: this._trLinesPoints, instance: this._lightHelperFrustumMeshes[2] as LinesMesh }, this._scene);

        LinesBuilder.CreateLines("brlines", { updatable: true, points: this._brLinesPoints, instance: this._lightHelperFrustumMeshes[3] as LinesMesh }, this._scene);

        LinesBuilder.CreateLines("tllines", { updatable: true, points: this._tlLinesPoints, instance: this._lightHelperFrustumMeshes[4] as LinesMesh }, this._scene);

        LinesBuilder.CreateLines("bllines", { updatable: true, points: this._blLinesPoints, instance: this._lightHelperFrustumMeshes[5] as LinesMesh }, this._scene);

        TmpVectors.Vector3[2].toArray(this._nearPlaneVertices, 0);
        TmpVectors.Vector3[3].toArray(this._nearPlaneVertices, 3);
        TmpVectors.Vector3[4].toArray(this._nearPlaneVertices, 6);
        TmpVectors.Vector3[5].toArray(this._nearPlaneVertices, 9);
        this._lightHelperFrustumMeshes[6].geometry?.updateVerticesDataDirectly("position", this._nearPlaneVertices, 0);

        TmpVectors.Vector3[6].toArray(this._farPlaneVertices, 0);
        TmpVectors.Vector3[7].toArray(this._farPlaneVertices, 3);
        TmpVectors.Vector3[8].toArray(this._farPlaneVertices, 6);
        TmpVectors.Vector3[9].toArray(this._farPlaneVertices, 9);
        this._lightHelperFrustumMeshes[7].geometry?.updateVerticesDataDirectly("position", this._farPlaneVertices, 0);

        TmpVectors.Vector3[2].toArray(this._rightPlaneVertices, 0);
        TmpVectors.Vector3[6].toArray(this._rightPlaneVertices, 3);
        TmpVectors.Vector3[7].toArray(this._rightPlaneVertices, 6);
        TmpVectors.Vector3[3].toArray(this._rightPlaneVertices, 9);
        this._lightHelperFrustumMeshes[8].geometry?.updateVerticesDataDirectly("position", this._rightPlaneVertices, 0);

        TmpVectors.Vector3[5].toArray(this._leftPlaneVertices, 0);
        TmpVectors.Vector3[9].toArray(this._leftPlaneVertices, 3);
        TmpVectors.Vector3[8].toArray(this._leftPlaneVertices, 6);
        TmpVectors.Vector3[4].toArray(this._leftPlaneVertices, 9);
        this._lightHelperFrustumMeshes[9].geometry?.updateVerticesDataDirectly("position", this._leftPlaneVertices, 0);

        TmpVectors.Vector3[2].toArray(this._topPlaneVertices, 0);
        TmpVectors.Vector3[6].toArray(this._topPlaneVertices, 3);
        TmpVectors.Vector3[9].toArray(this._topPlaneVertices, 6);
        TmpVectors.Vector3[5].toArray(this._topPlaneVertices, 9);
        this._lightHelperFrustumMeshes[10].geometry?.updateVerticesDataDirectly("position", this._topPlaneVertices, 0);

        TmpVectors.Vector3[3].toArray(this._bottomPlaneVertices, 0);
        TmpVectors.Vector3[7].toArray(this._bottomPlaneVertices, 3);
        TmpVectors.Vector3[8].toArray(this._bottomPlaneVertices, 6);
        TmpVectors.Vector3[4].toArray(this._bottomPlaneVertices, 9);
        this._lightHelperFrustumMeshes[11].geometry?.updateVerticesDataDirectly("position", this._bottomPlaneVertices, 0);
    }

    /**
     * Dispose of the class / remove the frustum view
     */
    public dispose() {
        this._lightHelperFrustumMeshes.forEach((mesh) => {
            mesh.material?.dispose();
            mesh.dispose();
        });
        this._rootNode.dispose();
    }

    protected _createGeometry() {
        this._rootNode = new TransformNode("directionalLightHelperRoot_" + this._light.name, this._scene);
        this._rootNode.parent = this._light.parent;

        this._nearLinesPoints = [Vector3.ZeroReadOnly, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly];
        const nearLines = LinesBuilder.CreateLines("nearlines", { updatable: true, points: this._nearLinesPoints }, this._scene);
        nearLines.parent = this._rootNode;
        nearLines.alwaysSelectAsActiveMesh = true;

        this._farLinesPoints = [Vector3.ZeroReadOnly, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly, Vector3.ZeroReadOnly];
        const farLines = LinesBuilder.CreateLines("farlines",  { updatable: true, points: this._farLinesPoints }, this._scene);
        farLines.parent = this._rootNode;
        farLines.alwaysSelectAsActiveMesh = true;

        this._trLinesPoints = [Vector3.ZeroReadOnly, Vector3.ZeroReadOnly];
        const trLines = LinesBuilder.CreateLines("trlines", { updatable: true, points: this._trLinesPoints }, this._scene);
        trLines.parent = this._rootNode;
        trLines.alwaysSelectAsActiveMesh = true;

        this._brLinesPoints = [Vector3.ZeroReadOnly, Vector3.ZeroReadOnly];
        const brLines = LinesBuilder.CreateLines("brlines", { updatable: true, points: this._brLinesPoints }, this._scene);
        brLines.parent = this._rootNode;
        brLines.alwaysSelectAsActiveMesh = true;

        this._tlLinesPoints = [Vector3.ZeroReadOnly, Vector3.ZeroReadOnly];
        const tlLines = LinesBuilder.CreateLines("tllines", { updatable: true, points: this._tlLinesPoints }, this._scene);
        tlLines.parent = this._rootNode;
        tlLines.alwaysSelectAsActiveMesh = true;

        this._blLinesPoints = [Vector3.ZeroReadOnly, Vector3.ZeroReadOnly];
        const blLines = LinesBuilder.CreateLines("bllines", { updatable: true, points: this._blLinesPoints }, this._scene);
        blLines.parent = this._rootNode;
        blLines.alwaysSelectAsActiveMesh = true;

        this._lightHelperFrustumMeshes.push(nearLines, farLines, trLines, brLines, tlLines, blLines);

        const makePlane = (name: string, color: Color3, positions: number[]) => {
            const plane = new Mesh(name + "plane", this._scene);
            const mat = new StandardMaterial(name + "PlaneMat", this._scene);

            plane.material = mat;
            plane.parent = this._rootNode;
            plane.alwaysSelectAsActiveMesh = true;

            mat.emissiveColor = color;
            mat.alpha = this.transparency;
            mat.backFaceCulling = false;
            mat.disableLighting = true;

            const indices = [0, 1, 2, 0, 2, 3];

            const vertexData = new VertexData();

            vertexData.positions = positions;
            vertexData.indices = indices;

            vertexData.applyToMesh(plane, true);

            this._lightHelperFrustumMeshes.push(plane);
        };

        this._nearPlaneVertices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._farPlaneVertices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._rightPlaneVertices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._leftPlaneVertices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._topPlaneVertices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        this._bottomPlaneVertices = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

        makePlane("near",   new Color3(1, 0, 0),    this._nearPlaneVertices);
        makePlane("far",    new Color3(0.3, 0, 0),  this._farPlaneVertices);
        makePlane("right",  new Color3(0, 1, 0),    this._rightPlaneVertices);
        makePlane("left",   new Color3(0, 0.3, 0),  this._leftPlaneVertices);
        makePlane("top",    new Color3(0, 0, 1),    this._topPlaneVertices);
        makePlane("bottom", new Color3(0, 0, 0.3),  this._bottomPlaneVertices);

        this._nearLinesPoints[0] = TmpVectors.Vector3[2];
        this._nearLinesPoints[1] = TmpVectors.Vector3[3];
        this._nearLinesPoints[2] = TmpVectors.Vector3[4];
        this._nearLinesPoints[3] = TmpVectors.Vector3[5];
        this._nearLinesPoints[4] = TmpVectors.Vector3[2];

        this._farLinesPoints[0] = TmpVectors.Vector3[6];
        this._farLinesPoints[1] = TmpVectors.Vector3[7];
        this._farLinesPoints[2] = TmpVectors.Vector3[8];
        this._farLinesPoints[3] = TmpVectors.Vector3[9];
        this._farLinesPoints[4] = TmpVectors.Vector3[6];

        this._trLinesPoints[0] = TmpVectors.Vector3[2];
        this._trLinesPoints[1] = TmpVectors.Vector3[6];

        this._brLinesPoints[0] = TmpVectors.Vector3[3];
        this._brLinesPoints[1] = TmpVectors.Vector3[7];

        this._tlLinesPoints[0] = TmpVectors.Vector3[4];
        this._tlLinesPoints[1] = TmpVectors.Vector3[8];

        this._blLinesPoints[0] = TmpVectors.Vector3[5];
        this._blLinesPoints [1] = TmpVectors.Vector3[9];
    }

    protected _getInvertViewMatrix(): Matrix {
        Matrix.LookAtLHToRef(this._light.position, this._light.position.add(this._light.direction), Vector3.UpReadOnly, this._inverseViewMatrix);
        this._inverseViewMatrix.invertToRef(this._inverseViewMatrix);
        return this._inverseViewMatrix;
    }
}
