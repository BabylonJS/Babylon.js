import type { GlobalState } from "../../globalState";
import type { Nullable } from "core/types";
import type { Observer } from "core/Misc/observable";
import { Engine } from "core/Engines/engine";
import { Scene } from "core/scene";
import { Matrix, Vector3 } from "core/Maths/math.vector";
import { ArcRotateCamera } from "core/Cameras/arcRotateCamera";
import { Color3 } from "core/Maths/math.color";
import { SceneLoaderFlags } from "core/Loading/sceneLoaderFlags";
import type { NodeParticleSystemSet } from "core/Particles/Node/nodeParticleSystemSet";
import { LogEntry } from "../log/logComponent";
import { GridMaterial } from "materials/grid/gridMaterial";
import { MeshBuilder } from "core/Meshes/meshBuilder";
import type { AbstractMesh } from "core/Meshes/abstractMesh";
import { SceneInstrumentation } from "core/Instrumentation/sceneInstrumentation";
import type { ThinParticleSystem } from "core/Particles/thinParticleSystem";
import type { ParticleSystemSet } from "core/Particles/particleSystemSet";
import { EngineStore } from "core/Engines";
import type { ParticleSystem } from "core/Particles";
import { AxesViewer } from "core/Debug/axesViewer";
import { TransformNode } from "core/Meshes/transformNode";
import { DynamicTexture } from "core/Materials/Textures/dynamicTexture";
import { StandardMaterial } from "core/Materials/standardMaterial";

export class PreviewManager {
    private _nodeParticleSystemSet: NodeParticleSystemSet;
    private _onBuildObserver: Nullable<Observer<void>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _camera: ArcRotateCamera;
    private _globalState: GlobalState;
    private _particleSystemSet: ParticleSystemSet;
    private _callId: number = 0;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeParticleSystemSet = globalState.nodeParticleSet;
        this._globalState = globalState;

        globalState.onBuildRequiredObservable.add(() => {
            this._refreshPreview();
        });

        globalState.stateManager.onRebuildRequiredObservable.add(() => {
            this._refreshPreview();
        });

        this._onPreviewBackgroundChangedObserver = globalState.onPreviewBackgroundChanged.add(() => {
            this._scene.clearColor = this._globalState.backgroundColor;
        });

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = this._globalState.backgroundColor;
        this._scene.ambientColor = new Color3(1, 1, 1);
        this._camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), this._scene);

        this._camera.doNotSerialize = true;
        this._camera.lowerRadiusLimit = 3;
        this._camera.upperRadiusLimit = 100;
        this._camera.wheelPrecision = 20;
        this._camera.minZ = 0.001;
        this._camera.attachControl(false);
        this._camera.useFramingBehavior = true;
        this._camera.wheelDeltaPercentage = 0.01;
        this._camera.pinchDeltaPercentage = 0.01;

        this._refreshPreview();

        const sceneInstrumentation = new SceneInstrumentation(this._scene);
        sceneInstrumentation.captureParticlesRenderTime = true;

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
            let totalParticleCount = 0;
            (this._scene.particleSystems as ThinParticleSystem[]).forEach((ps) => {
                totalParticleCount += ps.particles.length;
            });
            if (globalState.updateState) {
                globalState.updateState(
                    "Update loop: " + sceneInstrumentation.particlesRenderTimeCounter.lastSecAverage.toFixed(2) + " ms",
                    "Total particles: " + totalParticleCount
                );
            }
        });

        const groundMaterial = new GridMaterial("groundMaterial", this._scene);
        groundMaterial.majorUnitFrequency = 2;
        groundMaterial.minorUnitVisibility = 0.1;
        groundMaterial.gridRatio = 0.5;
        groundMaterial.backFaceCulling = false;
        groundMaterial.mainColor = new Color3(1, 1, 1);
        groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
        groundMaterial.lineColor = new Color3(1.0, 1.0, 1.0);
        groundMaterial.opacity = 0.5;

        const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, this._scene);
        ground.material = groundMaterial;

        // Axis
        const generateTextPlane = function (text: string, color: string, size: number, scene: Scene, parent: TransformNode) {
            const dynamicTexture = new DynamicTexture("DynamicTexture", 50, scene, true);
            dynamicTexture.hasAlpha = true;
            dynamicTexture.drawText(text, 14, 35, "bold 40px Arial", color, "transparent", true);
            const plane = MeshBuilder.CreatePlane("TextPlane", { size: size }, scene);
            const material = new StandardMaterial("TextPlaneMaterial", scene);
            material.backFaceCulling = false;
            material.disableLighting = true;
            material.emissiveTexture = dynamicTexture;
            material.diffuseTexture = dynamicTexture;

            plane.material = material;
            plane.billboardMode = TransformNode.BILLBOARDMODE_ALL;
            plane.renderingGroupId = 2;
            plane.setParent(parent);

            return plane;
        };

        const axis = new AxesViewer(this._scene, 1, 2, undefined, undefined, undefined, 3);
        const dummy = new TransformNode("Dummy", this._scene);
        dummy.doNotSerialize = true;
        axis.xAxis.setParent(dummy);
        axis.xAxis.doNotSerialize = true;
        axis.yAxis.setParent(dummy);
        axis.yAxis.doNotSerialize = true;
        axis.zAxis.setParent(dummy);
        axis.zAxis.doNotSerialize = true;

        (axis.xAxis.getChildMeshes()[0].material as StandardMaterial).emissiveColor.scaleInPlace(2);
        (axis.yAxis.getChildMeshes()[0].material as StandardMaterial).emissiveColor.scaleInPlace(2);
        (axis.zAxis.getChildMeshes()[0].material as StandardMaterial).emissiveColor.scaleInPlace(2);

        const xPlane = generateTextPlane("x", "red", 0.5, this._scene, dummy);
        xPlane.position.x = 1;
        xPlane.position.y = 0.3;

        const yPlane = generateTextPlane("y", "#0F0", 0.5, this._scene, dummy);
        yPlane.position.y = 1.55;

        const zPlane = generateTextPlane("z", "blue", 0.5, this._scene, dummy);
        zPlane.position.z = 1;
        zPlane.position.y = 0.3;

        const targetPosition = new Vector3(3.5, 3.6, 13);
        const tempMat = Matrix.Identity();

        this._scene.onBeforeCameraRenderObservable.add(() => {
            this._scene.getViewMatrix().invertToRef(tempMat);
            Vector3.TransformCoordinatesToRef(targetPosition, tempMat, dummy.position);
        });
    }

    private _refreshPreview() {
        SceneLoaderFlags.ShowLoadingScreen = false;

        this._globalState.onIsLoadingChanged.notifyObservers(true);

        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        this._updatePreviewAsync();
    }

    private async _updatePreviewAsync() {
        try {
            this._callId++;
            const callId = this._callId;
            if (this._particleSystemSet) {
                this._particleSystemSet.dispose();
            }

            try {
                const particleSystemSet = await this._nodeParticleSystemSet.buildAsync(this._scene);
                if (callId !== this._callId) {
                    // If the callId has changed, we ignore this result because that function was called again
                    particleSystemSet.dispose();
                    return;
                }
                this._particleSystemSet = particleSystemSet;
                this._particleSystemSet.start();
                this._globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Node Particle System Set build successful", false));
            } catch (err) {
                this._globalState.onLogRequiredObservable.notifyObservers(new LogEntry(err, true));
            }

            this._globalState.onIsLoadingChanged.notifyObservers(false);
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }

        // Synchronize with main
        for (const engine of EngineStore.Instances) {
            for (const scene of engine.scenes) {
                if (scene === this._scene) {
                    continue;
                }

                void this._reconnectEmittersAsync(scene);
            }
        }
    }

    private async _reconnectEmittersAsync(scene: Scene) {
        const systemsToReplace: ParticleSystem[] = [];
        const map = new Map<number, Nullable<AbstractMesh | Vector3>>();

        for (const ps of scene.particleSystems) {
            const particleSystem = ps as ParticleSystem;
            const source = particleSystem.source;
            if (source === this._nodeParticleSystemSet) {
                // Keep track of particle system reference and emitter
                const reference = particleSystem._blockReference;
                const emitter = particleSystem.emitter;

                systemsToReplace.push(particleSystem);
                map.set(reference, emitter);
            }
        }

        // Only build new systems if we found matching ones to replace
        if (map.size === 0) {
            return;
        }

        // Build new systems first - if this fails, we keep the old systems intact
        let newSet: ParticleSystemSet;
        try {
            newSet = await this._nodeParticleSystemSet.buildAsync(scene);
        } catch {
            // Build failed, keep old systems in their current state
            return;
        }

        // Only dispose old systems after successful build
        for (const particleSystem of systemsToReplace) {
            particleSystem.dispose();
        }

        for (const [reference, emitter] of map) {
            const particleSystem = (newSet.systems as ParticleSystem[]).find((ps) => ps._blockReference === reference);
            if (particleSystem) {
                particleSystem.emitter = emitter;
            }
        }

        newSet.start();
    }

    public dispose() {
        this._globalState.onBuildRequiredObservable.remove(this._onBuildObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);

        if (this._particleSystemSet) {
            this._particleSystemSet.dispose();
        }

        if (this._globalState.disposeOnClose && this._nodeParticleSystemSet) {
            this._nodeParticleSystemSet.dispose();
        }

        this._camera.dispose();

        this._scene.dispose();
        this._engine.dispose();
    }
}
