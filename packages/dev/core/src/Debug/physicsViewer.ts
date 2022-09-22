import type { Nullable } from "../types";
import type { Scene } from "../scene";
import type { AbstractMesh } from "../Meshes/abstractMesh";
import { Mesh } from "../Meshes/mesh";
import { CreateBox } from "../Meshes/Builders/boxBuilder";
import { CreateSphere } from "../Meshes/Builders/sphereBuilder";
import { Quaternion, Vector3 } from "../Maths/math.vector";
import { Color3 } from "../Maths/math.color";
import type { Material } from "../Materials/material";
import { EngineStore } from "../Engines/engineStore";
import { StandardMaterial } from "../Materials/standardMaterial";
import type { IPhysicsEnginePlugin } from "../Physics/IPhysicsEngine";
import { PhysicsImpostor } from "../Physics/physicsImpostor";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder";
import type { ICreateCapsuleOptions } from "../Meshes/Builders/capsuleBuilder";
import { CreateCapsule } from "../Meshes/Builders/capsuleBuilder";
import { Logger } from "../Misc/logger";

/**
 * Used to show the physics impostor around the specific mesh
 */
export class PhysicsViewer {
    /** @internal */
    protected _impostors: Array<Nullable<PhysicsImpostor>> = [];
    /** @internal */
    protected _meshes: Array<Nullable<AbstractMesh>> = [];
    /** @internal */
    protected _scene: Nullable<Scene>;
    /** @internal */
    protected _numMeshes = 0;
    /** @internal */
    protected _physicsEnginePlugin: Nullable<IPhysicsEnginePlugin>;
    private _renderFunction: () => void;
    private _utilityLayer: Nullable<UtilityLayerRenderer>;

    private _debugBoxMesh: Mesh;
    private _debugSphereMesh: Mesh;
    private _debugCapsuleMesh: Mesh;
    private _debugCylinderMesh: Mesh;
    private _debugMaterial: StandardMaterial;
    private _debugMeshMeshes = new Array<Mesh>();

    /**
     * Creates a new PhysicsViewer
     * @param scene defines the hosting scene
     */
    constructor(scene?: Scene) {
        this._scene = scene || EngineStore.LastCreatedScene;
        if (!this._scene) {
            return;
        }
        const physicEngine = this._scene.getPhysicsEngine();

        if (physicEngine) {
            this._physicsEnginePlugin = physicEngine.getPhysicsPlugin();
        }

        this._utilityLayer = new UtilityLayerRenderer(this._scene, false);
        this._utilityLayer.pickUtilitySceneFirst = false;
        this._utilityLayer.utilityLayerScene.autoClearDepthAndStencil = true;
    }

    /** @internal */
    protected _updateDebugMeshes(): void {
        const plugin = this._physicsEnginePlugin;

        for (let i = 0; i < this._numMeshes; i++) {
            const impostor = this._impostors[i];

            if (!impostor) {
                continue;
            }

            if (impostor.isDisposed) {
                this.hideImpostor(this._impostors[i--]);
            } else {
                if (impostor.type === PhysicsImpostor.MeshImpostor) {
                    continue;
                }
                const mesh = this._meshes[i];

                if (mesh && plugin) {
                    plugin.syncMeshWithImpostor(mesh, impostor);
                }
            }
        }
    }

    /**
     * Renders a specified physic impostor
     * @param impostor defines the impostor to render
     * @param targetMesh defines the mesh represented by the impostor
     * @returns the new debug mesh used to render the impostor
     */
    public showImpostor(impostor: PhysicsImpostor, targetMesh?: Mesh): Nullable<AbstractMesh> {
        if (!this._scene) {
            return null;
        }

        for (let i = 0; i < this._numMeshes; i++) {
            if (this._impostors[i] == impostor) {
                return null;
            }
        }

        const debugMesh = this._getDebugMesh(impostor, targetMesh);

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

        let removed = false;
        const utilityLayerScene = this._utilityLayer.utilityLayerScene;

        for (let i = 0; i < this._numMeshes; i++) {
            if (this._impostors[i] == impostor) {
                const mesh = this._meshes[i];

                if (!mesh) {
                    continue;
                }

                utilityLayerScene.removeMesh(mesh);
                mesh.dispose();

                const index = this._debugMeshMeshes.indexOf(mesh as Mesh);
                if (index > -1) {
                    this._debugMeshMeshes.splice(index, 1);
                }

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
            this._debugMaterial = new StandardMaterial("", scene);
            this._debugMaterial.wireframe = true;
            this._debugMaterial.emissiveColor = Color3.White();
            this._debugMaterial.disableLighting = true;
        }

        return this._debugMaterial;
    }

    private _getDebugBoxMesh(scene: Scene): AbstractMesh {
        if (!this._debugBoxMesh) {
            this._debugBoxMesh = CreateBox("physicsBodyBoxViewMesh", { size: 1 }, scene);
            this._debugBoxMesh.rotationQuaternion = Quaternion.Identity();
            this._debugBoxMesh.material = this._getDebugMaterial(scene);
            this._debugBoxMesh.setEnabled(false);
        }

        return this._debugBoxMesh.createInstance("physicsBodyBoxViewInstance");
    }

    private _getDebugSphereMesh(scene: Scene): AbstractMesh {
        if (!this._debugSphereMesh) {
            this._debugSphereMesh = CreateSphere("physicsBodySphereViewMesh", { diameter: 1 }, scene);
            this._debugSphereMesh.rotationQuaternion = Quaternion.Identity();
            this._debugSphereMesh.material = this._getDebugMaterial(scene);
            this._debugSphereMesh.setEnabled(false);
        }

        return this._debugSphereMesh.createInstance("physicsBodySphereViewInstance");
    }

    private _getDebugCapsuleMesh(scene: Scene): AbstractMesh {
        if (!this._debugCapsuleMesh) {
            this._debugCapsuleMesh = CreateCapsule("physicsBodyCapsuleViewMesh", { height: 1 } as ICreateCapsuleOptions, scene);
            this._debugCapsuleMesh.rotationQuaternion = Quaternion.Identity();
            this._debugCapsuleMesh.material = this._getDebugMaterial(scene);
            this._debugCapsuleMesh.setEnabled(false);
        }

        return this._debugCapsuleMesh.createInstance("physicsBodyCapsuleViewInstance");
    }

    private _getDebugCylinderMesh(scene: Scene): AbstractMesh {
        if (!this._debugCylinderMesh) {
            this._debugCylinderMesh = CreateCylinder("physicsBodyCylinderViewMesh", { diameterTop: 1, diameterBottom: 1, height: 1 }, scene);
            this._debugCylinderMesh.rotationQuaternion = Quaternion.Identity();
            this._debugCylinderMesh.material = this._getDebugMaterial(scene);
            this._debugCylinderMesh.setEnabled(false);
        }

        return this._debugCylinderMesh.createInstance("physicsBodyCylinderViewInstance");
    }

    private _getDebugMeshMesh(mesh: Mesh, scene: Scene): AbstractMesh {
        const wireframeOver = new Mesh(mesh.name, scene, null, mesh);
        wireframeOver.setParent(mesh);
        wireframeOver.position = Vector3.Zero();
        wireframeOver.material = this._getDebugMaterial(scene);

        this._debugMeshMeshes.push(wireframeOver);

        return wireframeOver;
    }

    private _getDebugMesh(impostor: PhysicsImpostor, targetMesh?: Mesh): Nullable<AbstractMesh> {
        if (!this._utilityLayer) {
            return null;
        }

        // Only create child impostor debug meshes when evaluating the parent
        if (targetMesh && targetMesh.parent && (targetMesh.parent as Mesh).physicsImpostor) {
            return null;
        }

        let mesh: Nullable<AbstractMesh> = null;
        const utilityLayerScene = this._utilityLayer.utilityLayerScene;
        if (!impostor.physicsBody) {
            Logger.Warn("Unable to get physicsBody of impostor. It might be initialized later by its parent's impostor.");
            return null;
        }
        switch (impostor.type) {
            case PhysicsImpostor.BoxImpostor:
                mesh = this._getDebugBoxMesh(utilityLayerScene);
                impostor.getBoxSizeToRef(mesh.scaling);
                break;
            case PhysicsImpostor.SphereImpostor: {
                mesh = this._getDebugSphereMesh(utilityLayerScene);
                const radius = impostor.getRadius();
                mesh.scaling.x = radius * 2;
                mesh.scaling.y = radius * 2;
                mesh.scaling.z = radius * 2;
                break;
            }
            case PhysicsImpostor.CapsuleImpostor: {
                mesh = this._getDebugCapsuleMesh(utilityLayerScene);
                const bi = impostor.object.getBoundingInfo();
                mesh.scaling.x = (bi.boundingBox.maximum.x - bi.boundingBox.minimum.x) * 2 * impostor.object.scaling.x;
                mesh.scaling.y = (bi.boundingBox.maximum.y - bi.boundingBox.minimum.y) * impostor.object.scaling.y;
                mesh.scaling.z = (bi.boundingBox.maximum.z - bi.boundingBox.minimum.z) * 2 * impostor.object.scaling.z;
                break;
            }
            case PhysicsImpostor.MeshImpostor:
                if (targetMesh) {
                    mesh = this._getDebugMeshMesh(targetMesh, utilityLayerScene);
                }
                break;
            case PhysicsImpostor.NoImpostor:
                if (targetMesh) {
                    // Handle compound impostors
                    const childMeshes = targetMesh.getChildMeshes().filter((c) => {
                        return c.physicsImpostor ? 1 : 0;
                    });
                    childMeshes.forEach((m) => {
                        if (m.physicsImpostor && m.getClassName() === "Mesh") {
                            const boundingInfo = m.getBoundingInfo();
                            const min = boundingInfo.boundingBox.minimum;
                            const max = boundingInfo.boundingBox.maximum;
                            switch (m.physicsImpostor.type) {
                                case PhysicsImpostor.BoxImpostor:
                                    mesh = this._getDebugBoxMesh(utilityLayerScene);
                                    mesh.position.copyFrom(min);
                                    mesh.position.addInPlace(max);
                                    mesh.position.scaleInPlace(0.5);
                                    break;
                                case PhysicsImpostor.SphereImpostor:
                                    mesh = this._getDebugSphereMesh(utilityLayerScene);
                                    break;
                                case PhysicsImpostor.CylinderImpostor:
                                    mesh = this._getDebugCylinderMesh(utilityLayerScene);
                                    break;
                                default:
                                    mesh = null;
                                    break;
                            }
                            if (mesh) {
                                mesh.scaling.x = max.x - min.x;
                                mesh.scaling.y = max.y - min.y;
                                mesh.scaling.z = max.z - min.z;
                                mesh.parent = m;
                            }
                        }
                    });
                } else {
                    Logger.Warn("No target mesh parameter provided for NoImpostor. Skipping.");
                }
                mesh = null;
                break;
            case PhysicsImpostor.CylinderImpostor: {
                mesh = this._getDebugCylinderMesh(utilityLayerScene);
                const bi = impostor.object.getBoundingInfo();
                mesh.scaling.x = (bi.boundingBox.maximum.x - bi.boundingBox.minimum.x) * impostor.object.scaling.x;
                mesh.scaling.y = (bi.boundingBox.maximum.y - bi.boundingBox.minimum.y) * impostor.object.scaling.y;
                mesh.scaling.z = (bi.boundingBox.maximum.z - bi.boundingBox.minimum.z) * impostor.object.scaling.z;
                break;
            }
        }
        return mesh;
    }

    /** Releases all resources */
    public dispose() {
        const count = this._numMeshes;
        for (let index = 0; index < count; index++) {
            this.hideImpostor(this._impostors[0]);
        }

        if (this._debugBoxMesh) {
            this._debugBoxMesh.dispose();
        }
        if (this._debugSphereMesh) {
            this._debugSphereMesh.dispose();
        }
        if (this._debugCylinderMesh) {
            this._debugCylinderMesh.dispose();
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
