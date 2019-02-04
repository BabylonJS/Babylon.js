import { Nullable } from "../types";
import { Scene } from "../scene";
import { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { BoxBuilder } from "../Meshes/Builders/boxBuilder";
import { SphereBuilder } from "../Meshes/Builders/sphereBuilder";
import { Quaternion, Color3 } from "../Maths/math";
import { Material } from "../Materials/material";
import { EngineStore } from "../Engines/engineStore";
import { StandardMaterial } from "../Materials/standardMaterial";
import { IPhysicsEnginePlugin } from "../Physics/IPhysicsEngine";
import { PhysicsImpostor } from "../Physics/physicsImpostor";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";

/**
     * Used to show the physics impostor around the specific mesh
     */
export class PhysicsViewer {

    /** @hidden */
    protected _impostors: Array<Nullable<PhysicsImpostor>> = [];
    /** @hidden */
    protected _meshes: Array<Nullable<AbstractMesh>> = [];
    /** @hidden */
    protected _scene: Nullable<Scene>;
    /** @hidden */
    protected _numMeshes = 0;
    /** @hidden */
    protected _physicsEnginePlugin: Nullable<IPhysicsEnginePlugin>;
    private _renderFunction: () => void;
    private _utilityLayer: Nullable<UtilityLayerRenderer>;

    private _debugBoxMesh: Mesh;
    private _debugSphereMesh: Mesh;
    private _debugMaterial: StandardMaterial;

    /**
     * Creates a new PhysicsViewer
     * @param scene defines the hosting scene
     */
    constructor(scene: Scene) {
        this._scene = scene || EngineStore.LastCreatedScene;
        let physicEngine = this._scene.getPhysicsEngine();

        if (physicEngine) {
            this._physicsEnginePlugin = physicEngine.getPhysicsPlugin();
        }

        this._utilityLayer = new UtilityLayerRenderer(this._scene, false);
        this._utilityLayer.pickUtilitySceneFirst = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = true;
    }

    /** @hidden */
    protected _updateDebugMeshes(): void {
        var plugin = this._physicsEnginePlugin;

        for (var i = 0; i < this._numMeshes; i++) {
            let impostor = this._impostors[i];

            if (!impostor) {
                continue;
            }

            if (impostor.isDisposed) {
                this.hideImpostor(this._impostors[i--]);
            } else {
                let mesh = this._meshes[i];

                if (mesh && plugin) {
                    plugin.syncMeshWithImpostor(mesh, impostor);
                }
            }
        }
    }

    /**
     * Renders a specified physic impostor
     * @param impostor defines the impostor to render
     * @returns the new debug mesh used to render the impostor
     */
    public showImpostor(impostor: PhysicsImpostor): Nullable<AbstractMesh> {

        if (!this._scene) {
            return null;
        }

        for (var i = 0; i < this._numMeshes; i++) {
            if (this._impostors[i] == impostor) {
                return null;
            }
        }

        var debugMesh = this._getDebugMesh(impostor);

        if (debugMesh) {
            this._impostors[this._numMeshes] = impostor;
            this._meshes[this._numMeshes] = debugMesh;

            if (this._numMeshes === 0) {
                this._renderFunction = this._updateDebugMeshes.bind(this);
                this._scene.registerBeforeRender(this._renderFunction);
            }

            this._numMeshes++;
        }

        return debugMesh;
    }

    /**
     * Hides a specified physic impostor
     * @param impostor defines the impostor to hide
     */
    public hideImpostor(impostor: Nullable<PhysicsImpostor>) {

        if (!impostor || !this._scene || !this._utilityLayer) {
            return;
        }

        var removed = false;
        const utilityLayerScene = this._utilityLayer.utilityLayerScene;

        for (var i = 0; i < this._numMeshes; i++) {
            if (this._impostors[i] == impostor) {
                let mesh = this._meshes[i];

                if (!mesh) {
                    continue;
                }

                utilityLayerScene.removeMesh(mesh);
                mesh.dispose();
                this._numMeshes--;
                if (this._numMeshes > 0) {
                    this._meshes[i] = this._meshes[this._numMeshes];
                    this._impostors[i] = this._impostors[this._numMeshes];
                    this._meshes[this._numMeshes] = null;
                    this._impostors[this._numMeshes] = null;
                } else {
                    this._meshes[0] = null;
                    this._impostors[0] = null;
                }
                removed = true;
                break;
            }
        }

        if (removed && this._numMeshes === 0) {
            this._scene.unregisterBeforeRender(this._renderFunction);
        }

    }

    private _getDebugMaterial(scene: Scene): Material {
        if (!this._debugMaterial) {
            this._debugMaterial = new StandardMaterial('', scene);
            this._debugMaterial.wireframe = true;
            this._debugMaterial.emissiveColor = Color3.White();
            this._debugMaterial.disableLighting = true;
        }

        return this._debugMaterial;
    }

    private _getDebugBoxMesh(scene: Scene): AbstractMesh {
        if (!this._debugBoxMesh) {
            this._debugBoxMesh = BoxBuilder.CreateBox('physicsBodyBoxViewMesh', { size: 1 }, scene);
            this._debugBoxMesh.rotationQuaternion = Quaternion.Identity();
            this._debugBoxMesh.material = this._getDebugMaterial(scene);
        }

        return this._debugBoxMesh.createInstance('physicsBodyBoxViewInstance');
    }

    private _getDebugSphereMesh(scene: Scene): AbstractMesh {
        if (!this._debugSphereMesh) {
            this._debugSphereMesh = SphereBuilder.CreateSphere('physicsBodySphereViewMesh', { diameter: 1 }, scene);
            this._debugSphereMesh.rotationQuaternion = Quaternion.Identity();
            this._debugSphereMesh.material = this._getDebugMaterial(scene);
        }

        return this._debugSphereMesh.createInstance('physicsBodyBoxViewInstance');
    }

    private _getDebugMesh(impostor: PhysicsImpostor): Nullable<AbstractMesh> {
        if (!this._utilityLayer) {
            return null;
        }

        var mesh: Nullable<AbstractMesh> = null;
        const utilityLayerScene = this._utilityLayer.utilityLayerScene;

        if (impostor.type == PhysicsImpostor.BoxImpostor) {
            mesh = this._getDebugBoxMesh(utilityLayerScene);
            impostor.getBoxSizeToRef(mesh.scaling);
        } else if (impostor.type == PhysicsImpostor.SphereImpostor) {
            mesh = this._getDebugSphereMesh(utilityLayerScene);
            var radius = impostor.getRadius();
            mesh.scaling.x = radius * 2;
            mesh.scaling.y = radius * 2;
            mesh.scaling.z = radius * 2;
        }

        return mesh;
    }

    /** Releases all resources */
    public dispose() {
        for (var i = 0; i < this._numMeshes; i++) {
            this.hideImpostor(this._impostors[i]);
        }

        if (this._debugBoxMesh) {
            this._debugBoxMesh.dispose();
        }
        if (this._debugSphereMesh) {
            this._debugSphereMesh.dispose();
        }
        if (this._debugMaterial) {
            this._debugMaterial.dispose();
        }

        this._impostors.length = 0;
        this._scene = null;
        this._physicsEnginePlugin = null;

        if (this._utilityLayer) {
            this._utilityLayer.dispose();
            this._utilityLayer = null;
        }
    }
}