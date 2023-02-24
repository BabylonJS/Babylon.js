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
import type { IPhysicsEnginePlugin as IPhysicsEnginePluginV1 } from "../Physics/v1/IPhysicsEnginePlugin";
import type { IPhysicsEnginePluginV2 } from "../Physics/v2/IPhysicsEnginePlugin";
import { PhysicsImpostor } from "../Physics/v1/physicsImpostor";
import { UtilityLayerRenderer } from "../Rendering/utilityLayerRenderer";
import { CreateCylinder } from "../Meshes/Builders/cylinderBuilder";
import type { ICreateCapsuleOptions } from "../Meshes/Builders/capsuleBuilder";
import { CreateCapsule } from "../Meshes/Builders/capsuleBuilder";
import { Logger } from "../Misc/logger";
import type { PhysicsBody } from "../Physics/v2/physicsBody";
import { VertexData } from "../Meshes/mesh.vertexData";

/**
 * Used to show the physics impostor around the specific mesh
 */
export class PhysicsViewer {
    /** @internal */
    protected _impostors: Array<Nullable<PhysicsImpostor>> = [];
    /** @internal */
    protected _meshes: Array<Nullable<AbstractMesh>> = [];
    /** @internal */
    protected _bodies: Array<Nullable<PhysicsBody>> = [];
    /** @internal */
    protected _bodyMeshes: Array<Nullable<AbstractMesh>> = [];
    /** @internal */
    protected _scene: Nullable<Scene>;
    /** @internal */
    protected _numMeshes = 0;
    /** @internal */
    protected _numBodies = 0;
    /** @internal */
    protected _physicsEnginePlugin: IPhysicsEnginePluginV1 | IPhysicsEnginePluginV2 | null;
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

    /**
     * Updates the debug meshes of the physics engine.
     *
     * This code is useful for synchronizing the debug meshes of the physics engine with the physics impostor and mesh.
     * It checks if the impostor is disposed and if the plugin version is 1, then it syncs the mesh with the impostor.
     * This ensures that the debug meshes are up to date with the physics engine.
     */
    protected _updateDebugMeshes(): void {
        const plugin = this._physicsEnginePlugin;

        if (plugin?.getPluginVersion() === 1) {
            this._updateDebugMeshesV1();
        } else {
            this._updateDebugMeshesV2();
        }
    }

    /**
     * Updates the debug meshes of the physics engine.
     *
     * This method is useful for synchronizing the debug meshes with the physics impostors.
     * It iterates through the impostors and meshes, and if the plugin version is 1, it syncs the mesh with the impostor.
     * This ensures that the debug meshes accurately reflect the physics impostors, which is important for debugging the physics engine.
     */
    protected _updateDebugMeshesV1(): void {
        const plugin = this._physicsEnginePlugin as IPhysicsEnginePluginV1;
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
     * Updates the debug meshes of the physics engine for V2 plugin.
     *
     * This method is useful for synchronizing the debug meshes of the physics engine with the current state of the bodies.
     * It iterates through the bodies array and updates the debug meshes with the current transform of each body.
     * This ensures that the debug meshes accurately reflect the current state of the physics engine.
     */
    protected _updateDebugMeshesV2(): void {
        const plugin = this._physicsEnginePlugin as IPhysicsEnginePluginV2;
        for (let i = 0; i < this._numBodies; i++) {
            const body = this._bodies[i];
            const transform = this._bodyMeshes[i];
            if (body && transform) {
                plugin.syncTransform(body, transform);
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
     * Shows a debug mesh for a given physics body.
     * @param body The physics body to show.
     * @returns The debug mesh, or null if the body is already shown.
     *
     * This function is useful for visualizing the physics body in the scene.
     * It creates a debug mesh for the given body and adds it to the scene.
     * It also registers a before render function to update the debug mesh position and rotation.
     */
    public showBody(body: PhysicsBody): Nullable<AbstractMesh> {
        if (!this._scene) {
            return null;
        }

        for (let i = 0; i < this._numBodies; i++) {
            if (this._bodies[i] == body) {
                return null;
            }
        }

        const debugMesh = this._getDebugBodyMesh(body);

        if (debugMesh) {
            this._bodies[this._numBodies] = body;
            this._bodyMeshes[this._numBodies] = debugMesh;

            if (this._numBodies === 0) {
                this._renderFunction = this._updateDebugMeshes.bind(this);
                this._scene.registerBeforeRender(this._renderFunction);
            }

            this._numBodies++;
        }

        return debugMesh;
    }

    /**
     * Hides an impostor from the scene.
     * @param impostor - The impostor to hide.
     *
     * This method is useful for hiding an impostor from the scene. It removes the
     * impostor from the utility layer scene, disposes the mesh, and removes the
     * impostor from the list of impostors. If the impostor is the last one in the
     * list, it also unregisters the render function.
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

    /**
     * Hides a body from the physics engine.
     * @param body - The body to hide.
     *
     * This function is useful for hiding a body from the physics engine.
     * It removes the body from the utility layer scene and disposes the mesh associated with it.
     * It also unregisters the render function if the number of bodies is 0.
     * This is useful for hiding a body from the physics engine without deleting it.
     */
    public hideBody(body: Nullable<PhysicsBody>) {
        if (!body || !this._scene || !this._utilityLayer) {
            return;
        }

        let removed = false;
        const utilityLayerScene = this._utilityLayer.utilityLayerScene;

        for (let i = 0; i < this._numBodies; i++) {
            if (this._bodies[i] === body) {
                const mesh = this._bodyMeshes[i];

                if (!mesh) {
                    continue;
                }

                utilityLayerScene.removeMesh(mesh);
                mesh.dispose();

                this._numBodies--;
                if (this._numBodies > 0) {
                    this._bodyMeshes[i] = this._bodyMeshes[this._numBodies];
                    this._bodies[i] = this._bodies[this._numBodies];
                    this._bodyMeshes[this._numBodies] = null;
                    this._bodies[this._numBodies] = null;
                } else {
                    this._bodyMeshes[0] = null;
                    this._bodies[0] = null;
                }
                removed = true;
                break;
            }
        }

        if (removed && this._numBodies === 0) {
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

    /**
     * Creates a debug mesh for a given physics body
     * @param body The physics body to create the debug mesh for
     * @returns The created debug mesh or null if the utility layer is not available
     *
     * This code is useful for creating a debug mesh for a given physics body.
     * It creates a Mesh object with a VertexData object containing the positions and indices
     * of the geometry of the body. The mesh is then assigned a debug material from the utility layer scene.
     * This allows for visualizing the physics body in the scene.
     */
    private _getDebugBodyMesh(body: PhysicsBody): Nullable<AbstractMesh> {
        if (!this._utilityLayer) {
            return null;
        }

        const utilityLayerScene = this._utilityLayer.utilityLayerScene;

        const mesh = new Mesh("custom", utilityLayerScene);
        const vertexData = new VertexData();
        const geometry = body.getGeometry() as any;
        vertexData.positions = geometry.positions;
        vertexData.indices = geometry.indices;
        vertexData.applyToMesh(mesh);
        if (body._pluginDataInstances) {
            const instanceBuffer = new Float32Array(body._pluginDataInstances.length * 16);
            mesh.thinInstanceSetBuffer("matrix", instanceBuffer, 16);
        }
        mesh.material = this._getDebugMaterial(utilityLayerScene);
        return mesh;
    }

    /**
     * Clean up physics debug display
     */
    public dispose() {
        // impostors
        for (let index = this._numMeshes - 1; index >= 0; index--) {
            this.hideImpostor(this._impostors[0]);
        }
        // bodies
        for (let index = this._numBodies - 1; index >= 0; index--) {
            this.hideBody(this._bodies[0]);
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
