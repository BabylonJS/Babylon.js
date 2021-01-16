import { TransformNode } from "babylonjs";
import { Camera } from "babylonjs/Cameras/camera";
import { DirectionalLight } from "babylonjs/Lights/directionalLight";
import { StandardMaterial } from "babylonjs/Materials/standardMaterial";
import { Color3, Matrix, Vector3 } from "babylonjs/Maths/math";
import { Mesh } from "babylonjs/Meshes/mesh";
import { VertexData } from "babylonjs/Meshes/mesh.vertexData";
import { MeshBuilder } from "babylonjs/Meshes/meshBuilder";
import { Scene } from "babylonjs/scene";

export class DirectionalLightHelper {

    private _scene: Scene;
    private _light: DirectionalLight;
    private _camera: Camera;
    private _viewMatrix: Matrix;
    private _lightHelperFrustumLines: TransformNode[];
    private _oldPosition: Vector3;
    private _oldDirection: Vector3;
    private _oldAutoCalc: boolean;
    private _oldMinZ: number;
    private _oldMaxZ: number;

    constructor(light: DirectionalLight, camera: Camera) {
        this._scene = light.getScene();
        this._light = light;
        this._camera = camera;
        this._viewMatrix = Matrix.Identity();
        this._lightHelperFrustumLines = [];
    }

    public hide() {
        this._hide();
        this._oldPosition = null as any;
    }

    public show() {
        if (this._oldPosition 
            && this._oldPosition.equals(this._light.position) 
            && this._oldDirection.equals(this._light.direction) 
            && this._oldAutoCalc === this._light.autoCalcShadowZBounds
            && this._oldMinZ === this._light.shadowMinZ
            && this._oldMaxZ === this._light.shadowMaxZ
        ) {
            return;
        }

        this._oldPosition = this._light.position.clone();
        this._oldDirection = this._light.direction.clone();
        this._oldAutoCalc = this._light.autoCalcShadowZBounds;
        this._oldMinZ = this._light.shadowMinZ;
        this._oldMaxZ = this._light.shadowMaxZ;

        this._hide();

        const lightExtents = this._getLightExtents();
        const lightView = this._getViewMatrix();

        if (!lightExtents || !lightView) {
            return;
        }

        const invLightView = Matrix.Invert(lightView);

        const n1 = new Vector3(lightExtents.max.x, lightExtents.max.y, lightExtents.min.z);
        const n2 = new Vector3(lightExtents.max.x, lightExtents.min.y, lightExtents.min.z);
        const n3 = new Vector3(lightExtents.min.x, lightExtents.min.y, lightExtents.min.z);
        const n4 = new Vector3(lightExtents.min.x, lightExtents.max.y, lightExtents.min.z);

        const near1 = Vector3.TransformCoordinates(n1, invLightView);
        const near2 = Vector3.TransformCoordinates(n2, invLightView);
        const near3 = Vector3.TransformCoordinates(n3, invLightView);
        const near4 = Vector3.TransformCoordinates(n4, invLightView);

        const f1 = new Vector3(lightExtents.max.x, lightExtents.max.y, lightExtents.max.z);
        const f2 = new Vector3(lightExtents.max.x, lightExtents.min.y, lightExtents.max.z);
        const f3 = new Vector3(lightExtents.min.x, lightExtents.min.y, lightExtents.max.z);
        const f4 = new Vector3(lightExtents.min.x, lightExtents.max.y, lightExtents.max.z);

        const far1 = Vector3.TransformCoordinates(f1, invLightView);
        const far2 = Vector3.TransformCoordinates(f2, invLightView);
        const far3 = Vector3.TransformCoordinates(f3, invLightView);
        const far4 = Vector3.TransformCoordinates(f4, invLightView);

        const rootNode = new TransformNode("directionalLightHelperRoot_" + this._light.name, this._scene);
        rootNode.parent = this._light;

        const nearLines = MeshBuilder.CreateLines("nearlines", { points: [near1, near2, near3, near4, near1] }, this._scene);
        nearLines.parent = rootNode;

        const farLines = MeshBuilder.CreateLines("farlines",  { points: [far1, far2, far3, far4, far1] }, this._scene);
        farLines.parent = rootNode;

        const trLines = MeshBuilder.CreateLines("trlines", { points: [ near1, far1 ] }, this._scene);
        trLines.parent = rootNode;

        const brLines = MeshBuilder.CreateLines("brlines", { points: [ near2, far2 ] }, this._scene);
        brLines.parent = rootNode;

        const tlLines = MeshBuilder.CreateLines("tllines", { points: [ near3, far3 ] }, this._scene);
        tlLines.parent = rootNode;

        const blLines = MeshBuilder.CreateLines("bllines", { points: [ near4, far4 ] }, this._scene);
        blLines.parent = rootNode;

        this._lightHelperFrustumLines.push(rootNode, nearLines, farLines, trLines, brLines, tlLines, blLines);

        const makePlane = (name: string, color: Color3, positions: number[]) => {
            const plane = new Mesh(name + "plane", this._scene);
            const mat = new StandardMaterial(name + "PlaneMat", this._scene);

            plane.material = mat;
            plane.parent = rootNode;

            mat.emissiveColor = color;
            mat.alpha = 0.3;
            mat.backFaceCulling = false;
            mat.disableLighting = true;

            const indices = [0, 1, 2, 0, 2, 3];

            const vertexData = new VertexData();

            vertexData.positions = positions;
            vertexData.indices = indices;

            vertexData.applyToMesh(plane);

            this._lightHelperFrustumLines.push(plane);
        };

        makePlane("near",   new Color3(1, 0, 0),    [near1.x, near1.y, near1.z, near2.x, near2.y, near2.z, near3.x, near3.y, near3.z, near4.x, near4.y, near4.z ]);
        makePlane("far",    new Color3(0.3, 0, 0),  [far1.x, far1.y, far1.z, far2.x, far2.y, far2.z, far3.x, far3.y, far3.z, far4.x, far4.y, far4.z ]);
        makePlane("right",  new Color3(0, 1, 0),    [near1.x, near1.y, near1.z, far1.x, far1.y, far1.z, far2.x, far2.y, far2.z, near2.x, near2.y, near2.z ]);
        makePlane("left",   new Color3(0, 0.3, 0),  [near4.x, near4.y, near4.z, far4.x, far4.y, far4.z, far3.x, far3.y, far3.z, near3.x, near3.y, near3.z ]);
        makePlane("top",    new Color3(0, 0, 1),    [near1.x, near1.y, near1.z, far1.x, far1.y, far1.z, far4.x, far4.y, far4.z, near4.x, near4.y, near4.z ]);
        makePlane("bottom", new Color3(0, 0, 0.3),  [near2.x, near2.y, near2.z, far2.x, far2.y, far2.z, far3.x, far3.y, far3.z, near3.x, near3.y, near3.z ]);
    }

    protected _hide() {
        this._lightHelperFrustumLines.forEach((t) => {
            if (t instanceof Mesh) {
                t.material?.dispose();
            }
            t.dispose();
        });

        this._lightHelperFrustumLines.length = 0;
    }

    protected _getLightExtents() {
        const light = this._light;

        return {
            "min": new Vector3(light.orthoLeft, light.orthoBottom, light.shadowMinZ !== undefined ? light.shadowMinZ : this._camera.minZ),
            "max": new Vector3(light.orthoRight, light.orthoTop, light.shadowMaxZ !== undefined ? light.shadowMaxZ : this._camera.maxZ)
        };
    }

    protected _getViewMatrix() {
        // same computation here than in the shadow generator
        Matrix.LookAtLHToRef(this._light.position, this._light.position.add(this._light.direction), Vector3.Up(), this._viewMatrix);
        return this._viewMatrix;
    }
}
