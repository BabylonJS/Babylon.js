import { GlobalState } from '../../globalState';
import { NodeMaterial } from 'babylonjs/Materials/Node/nodeMaterial';
import { Nullable } from 'babylonjs/types';
import { Observer } from 'babylonjs/Misc/observable';
import { Engine } from 'babylonjs/Engines/engine';
import { Scene } from 'babylonjs/scene';
import { Mesh } from 'babylonjs/Meshes/mesh';
import { Vector3 } from 'babylonjs/Maths/math.vector';
import { HemisphericLight } from 'babylonjs/Lights/hemisphericLight';
import { ArcRotateCamera } from 'babylonjs/Cameras/arcRotateCamera';
import { PreviewType } from './previewType';
import { Animation } from 'babylonjs/Animations/animation';
import { SceneLoader } from 'babylonjs/Loading/sceneLoader';
import { TransformNode } from 'babylonjs/Meshes/transformNode';
import { AbstractMesh } from 'babylonjs/Meshes/abstractMesh';
import { FramingBehavior } from 'babylonjs/Behaviors/Cameras/framingBehavior';
import { DirectionalLight } from 'babylonjs/Lights/directionalLight';
import { LogEntry } from '../log/logComponent';
import { PointerEventTypes } from 'babylonjs/Events/pointerEvents';
import { Color3, Color4 } from 'babylonjs/Maths/math.color';
import { PostProcess } from 'babylonjs/PostProcesses/postProcess';
import { Constants } from 'babylonjs/Engines/constants';
import { CurrentScreenBlock } from 'babylonjs/Materials/Node/Blocks/Dual/currentScreenBlock';
import { NodeMaterialModes } from 'babylonjs/Materials/Node/Enums/nodeMaterialModes';
import { ParticleSystem } from 'babylonjs/Particles/particleSystem';
import { IParticleSystem } from 'babylonjs/Particles/IParticleSystem';
import { ParticleHelper } from 'babylonjs/Particles/particleHelper';
import { Texture } from 'babylonjs/Materials/Textures/texture';
import { ParticleTextureBlock } from 'babylonjs/Materials/Node/Blocks/Particle/particleTextureBlock';
import { FileTools } from 'babylonjs/Misc/fileTools';

export class PreviewManager {
    private _nodeMaterial: NodeMaterial;
    private _onBuildObserver: Nullable<Observer<NodeMaterial>>;
    private _onPreviewCommandActivatedObserver: Nullable<Observer<boolean>>;
    private _onAnimationCommandActivatedObserver: Nullable<Observer<void>>;
    private _onUpdateRequiredObserver: Nullable<Observer<void>>;
    private _onPreviewBackgroundChangedObserver: Nullable<Observer<void>>;
    private _onBackFaceCullingChangedObserver: Nullable<Observer<void>>;
    private _onDepthPrePassChangedObserver: Nullable<Observer<void>>;
    private _onLightUpdatedObserver: Nullable<Observer<void>>;
    private _engine: Engine;
    private _scene: Scene;
    private _meshes: AbstractMesh[];
    private _camera: ArcRotateCamera;
    private _material: NodeMaterial;
    private _globalState: GlobalState;
    private _currentType: number;
    private _lightParent: TransformNode;
    private _postprocess: Nullable<PostProcess>;
    private _particleSystem: Nullable<IParticleSystem>;

    public constructor(targetCanvas: HTMLCanvasElement, globalState: GlobalState) {
        this._nodeMaterial = globalState.nodeMaterial;
        this._globalState = globalState;

        this._onBuildObserver = this._nodeMaterial.onBuildObservable.add((nodeMaterial) => {
            let serializationObject = nodeMaterial.serialize();
            this._updatePreview(serializationObject);
        });

        this._onPreviewCommandActivatedObserver = globalState.onPreviewCommandActivated.add((forceRefresh: boolean) => {
            if (forceRefresh) {
                this._currentType = -1;
            }
            this._refreshPreviewMesh();
        });

        this._onLightUpdatedObserver = globalState.onLightUpdated.add(() => {
            this._prepareLights();
        });

        this._onUpdateRequiredObserver = globalState.onUpdateRequiredObservable.add(() => {
            let serializationObject = this._nodeMaterial.serialize();
            this._updatePreview(serializationObject);
        });

        this._onPreviewBackgroundChangedObserver = globalState.onPreviewBackgroundChanged.add(() => {
            this._scene.clearColor = this._globalState.backgroundColor;
        });

        this._onAnimationCommandActivatedObserver = globalState.onAnimationCommandActivated.add(() => {
            this._handleAnimations();
        });

        this._onBackFaceCullingChangedObserver = globalState.onBackFaceCullingChanged.add(() => {
            this._material.backFaceCulling = this._globalState.backFaceCulling;
        });

        this._onDepthPrePassChangedObserver = globalState.onDepthPrePassChanged.add(() => {
            this._material.needDepthPrePass = this._globalState.depthPrePass;
        });

        this._engine = new Engine(targetCanvas, true);
        this._scene = new Scene(this._engine);
        this._scene.clearColor = this._globalState.backgroundColor;
        this._camera = new ArcRotateCamera("Camera", 0, 0.8, 4, Vector3.Zero(), this._scene);

        this._camera.lowerRadiusLimit = 3;
        this._camera.upperRadiusLimit = 10;
        this._camera.wheelPrecision = 20;
        this._camera.minZ = 0.1;
        this._camera.attachControl(targetCanvas, false);

        this._lightParent = new TransformNode("LightParent", this._scene);

        this._refreshPreviewMesh();

        this._engine.runRenderLoop(() => {
            this._engine.resize();
            this._scene.render();
        });

        let lastOffsetX: number | undefined = undefined;
        const lightRotationSpeed = 0.01;

        this._scene.onPointerObservable.add((evt) => {
            if (this._globalState.controlCamera) {
                return;
            }

            if (evt.type === PointerEventTypes.POINTERUP) {
                lastOffsetX = undefined;
                return;
            }

            if (evt.event.buttons !== 1) {
                return;
            }

            if (lastOffsetX === undefined) {
                lastOffsetX = evt.event.offsetX;
            }

            var rotateLighting = (lastOffsetX - evt.event.offsetX) * lightRotationSpeed;
            this._lightParent.rotation.y += rotateLighting;
            lastOffsetX = evt.event.offsetX;
        });

        // this._scene.registerBeforeRender(() => {
        //     if (this._camera.alpha === cameraLastRotation) {
        //         return;
        //     }
        //     if (!this._globalState.controlCamera) {
        //         return;
        //     }
        //     var rotateLighting = (this._camera.alpha - cameraLastRotation) * lightRotationParallaxSpeed;
        //     this._lightParent.rotate(Vector3.Up(), rotateLighting);
        //     cameraLastRotation = this._camera.alpha;
        // });
    }

    private _handleAnimations() {
        this._scene.stopAllAnimations();

        if (this._globalState.rotatePreview) {
            for (var root of this._scene.rootNodes) {
                let transformNode = root as TransformNode;

                if (transformNode.getClassName() === "TransformNode" || transformNode.getClassName() === "Mesh" || transformNode.getClassName() === "GroundMesh") {
                    if (transformNode.rotationQuaternion) {
                        transformNode.rotation = transformNode.rotationQuaternion.toEulerAngles();
                        transformNode.rotationQuaternion = null;
                    }
                    Animation.CreateAndStartAnimation("turnTable", root, "rotation.y", 60, 1200, transformNode.rotation.y, transformNode.rotation.y + 2 * Math.PI, 1);
                }
            }
        }
    }

    private _prepareLights() {
        // Remove current lights
        let currentLights = this._scene.lights.slice(0);

        for (var light of currentLights) {
            light.dispose();
        }

        // Create new lights based on settings
        if (this._globalState.hemisphericLight) {
            new HemisphericLight("Hemispheric light", new Vector3(0, 1, 0), this._scene);
        }

        if (this._globalState.directionalLight0) {
            let dir0 = new DirectionalLight("Directional light #0", new Vector3(0.841626576496605, -0.2193391004130599, -0.49351298337996535), this._scene);
            dir0.intensity = 0.9;
            dir0.diffuse = new Color3(0.9294117647058824, 0.9725490196078431, 0.996078431372549);
            dir0.specular = new Color3(0.9294117647058824, 0.9725490196078431, 0.996078431372549);
            dir0.parent = this._lightParent;
        }

        if (this._globalState.directionalLight1) {
            let dir1 = new DirectionalLight("Directional light #1", new Vector3(-0.9519937437504213, -0.24389315636999764, -0.1849974057546125), this._scene);
            dir1.intensity = 1.2;
            dir1.specular = new Color3(0.9803921568627451, 0.9529411764705882, 0.7725490196078432);
            dir1.diffuse = new Color3(0.9803921568627451, 0.9529411764705882, 0.7725490196078432);
            dir1.parent = this._lightParent;
        }
    }

    private _prepareScene() {
        this._camera.useFramingBehavior = this._globalState.mode === NodeMaterialModes.Material;

        switch (this._globalState.mode) {
            case NodeMaterialModes.Material: {
                this._prepareLights();

                var framingBehavior = this._camera.getBehaviorByName("Framing") as FramingBehavior;

                setTimeout(() => { // Let the behavior activate first
                    framingBehavior.framingTime = 0;
                    framingBehavior.elevationReturnTime = -1;

                    if (this._scene.meshes.length) {
                        var worldExtends = this._scene.getWorldExtends();
                        this._camera.lowerRadiusLimit = null;
                        this._camera.upperRadiusLimit = null;
                        framingBehavior.zoomOnBoundingInfo(worldExtends.min, worldExtends.max);
                    }

                    this._camera.pinchPrecision = 200 / this._camera.radius;
                    this._camera.upperRadiusLimit = 5 * this._camera.radius;
                });

                this._camera.wheelDeltaPercentage = 0.01;
                this._camera.pinchDeltaPercentage = 0.01;

                // Animations
                this._handleAnimations();
                break;
            }
            case NodeMaterialModes.PostProcess: 
            case NodeMaterialModes.ProceduralTexture: {
                this._camera.radius = 4;
                this._camera.upperRadiusLimit = 10;
                break;
            }
            case NodeMaterialModes.Particle: {
                this._camera.radius = this._globalState.previewType === PreviewType.Explosion ? 50 : this._globalState.previewType === PreviewType.DefaultParticleSystem ? 6 : 20;
                this._camera.upperRadiusLimit = 5000;
                break;
            }
        }

        // Material
        let serializationObject = this._nodeMaterial.serialize();
        this._updatePreview(serializationObject);
    }

    private _refreshPreviewMesh() {
        if (this._currentType !== this._globalState.previewType || this._currentType === PreviewType.Custom) {
            this._currentType = this._globalState.previewType;
            if (this._meshes && this._meshes.length) {
                for (var mesh of this._meshes) {
                    mesh.dispose();
                }
            }
            this._meshes = [];

            let lights = this._scene.lights.slice(0);
            for (var light of lights) {
                light.dispose();
            }

            this._engine.releaseEffects();

            if (this._particleSystem) {
                this._particleSystem.onBeforeDrawParticlesObservable.clear();
                this._particleSystem.onDisposeObservable.clear();
                this._particleSystem.stop();
                this._particleSystem.dispose();
                this._particleSystem = null;
            }

            SceneLoader.ShowLoadingScreen = false;

            this._globalState.onIsLoadingChanged.notifyObservers(true);

            if (this._globalState.mode === NodeMaterialModes.Material) {
                switch (this._globalState.previewType) {
                    case PreviewType.Box:
                        SceneLoader.AppendAsync("https://models.babylonjs.com/", "roundedCube.glb", this._scene).then(() => {
                            this._meshes.push(...this._scene.meshes);
                            this._prepareScene();
                        });
                        return;
                    case PreviewType.Sphere:
                        this._meshes.push(Mesh.CreateSphere("dummy-sphere", 32, 2, this._scene));
                        break;
                    case PreviewType.Torus:
                        this._meshes.push(Mesh.CreateTorus("dummy-torus", 2, 0.5, 32, this._scene));
                        break;
                    case PreviewType.Cylinder:
                        SceneLoader.AppendAsync("https://models.babylonjs.com/", "roundedCylinder.glb", this._scene).then(() => {
                            this._meshes.push(...this._scene.meshes);
                            this._prepareScene();
                        });
                        return;
                    case PreviewType.Plane:
                        let plane = Mesh.CreateGround("dummy-plane", 2, 2, 128, this._scene);
                        plane.scaling.y = -1;
                        plane.rotation.x = Math.PI;
                        this._meshes.push(plane);
                        break;
                    case PreviewType.ShaderBall:
                        SceneLoader.AppendAsync("https://models.babylonjs.com/", "shaderBall.glb", this._scene).then(() => {
                            this._meshes.push(...this._scene.meshes);
                            this._prepareScene();
                        });
                        return;
                    case PreviewType.Custom:
                        SceneLoader.AppendAsync("file:", this._globalState.previewFile, this._scene).then(() => {
                            this._meshes.push(...this._scene.meshes);
                            this._prepareScene();
                        });
                        return;
                }
            } else if (this._globalState.mode === NodeMaterialModes.Particle) {
                switch (this._globalState.previewType) {
                    case PreviewType.DefaultParticleSystem:
                        this._particleSystem = ParticleHelper.CreateDefault(new Vector3(0, 0, 0), 500, this._scene);
                        this._particleSystem.start();
                        break;
                    case PreviewType.Bubbles:
                        this._particleSystem = new ParticleSystem("particles", 4000, this._scene);
                        this._particleSystem.particleTexture = new Texture("https://assets.babylonjs.com/particles/textures/explosion/Flare.png", this._scene);
                        this._particleSystem.minSize = 0.1;
                        this._particleSystem.maxSize = 1.0;
                        this._particleSystem.minLifeTime = 0.5;
                        this._particleSystem.maxLifeTime = 5.0;
                        this._particleSystem.minEmitPower = 0.5;
                        this._particleSystem.maxEmitPower = 3.0;
                        this._particleSystem.createBoxEmitter(new Vector3(-1, 1, -1), new Vector3(1, 1, 1), new Vector3(-0.1, -0.1, -0.1), new Vector3(0.1, 0.1, 0.1));
                        this._particleSystem.emitRate = 100;
                        this._particleSystem.blendMode = ParticleSystem.BLENDMODE_ONEONE;
                        this._particleSystem.color1 = new Color4(1, 1, 0, 1);
                        this._particleSystem.color2 = new Color4(1, 0.5, 0, 1);
                        this._particleSystem.gravity = new Vector3(0, -1.0, 0);
                        this._particleSystem.start();
                        break;
                    case PreviewType.Explosion:
                        this._loadParticleSystem(this._globalState.previewType, 1);
                        return;
                    case PreviewType.Fire:
                    case PreviewType.Rain:
                    case PreviewType.Smoke:
                        this._loadParticleSystem(this._globalState.previewType);
                        return;
                    case PreviewType.Custom:
                        FileTools.ReadFile(this._globalState.previewFile, (json) =>  {
                            this._particleSystem = ParticleSystem.Parse(JSON.parse(json), this._scene, "");
                            this._particleSystem.start();
                            this._prepareScene();
                        }, undefined, false, (error) => {
                            console.log(error);
                        });
                        return;
                }
            }

            this._prepareScene();
        }
    }

    private _loadParticleSystem(particleNumber: number, systemIndex = 0, prepareScene = true) {
        let name = "";

        switch (particleNumber) {
            case PreviewType.Explosion:
                name = "explosion";
                break;
            case PreviewType.Fire:
                name = "fire";
                break;
            case PreviewType.Rain:
                name = "rain";
                break;
            case PreviewType.Smoke:
                name = "smoke";
                break;
        }

        ParticleHelper.CreateAsync(name, this._scene).then((set) => {
            for (let i = 0; i < set.systems.length; ++i) {
                if (i == systemIndex) {
                    this._particleSystem = set.systems[i];
                    this._particleSystem.disposeOnStop = true;
                    this._particleSystem.onDisposeObservable.add(() => {
                        this._loadParticleSystem(particleNumber, systemIndex, false);
                    });
                    this._particleSystem.start();
                } else {
                    set.systems[i].dispose();
                }
            }
            if (prepareScene) {
                this._prepareScene();
            } else {
                let serializationObject = this._nodeMaterial.serialize();
                this._updatePreview(serializationObject);
            }
        });
    }

    private _forceCompilationAsync(material: NodeMaterial, mesh: AbstractMesh): Promise<void> {
        return material.forceCompilationAsync(mesh);
    }

    private _updatePreview(serializationObject: any) {
        try {
            let store = NodeMaterial.IgnoreTexturesAtLoadTime;
            NodeMaterial.IgnoreTexturesAtLoadTime = false;
            let tempMaterial = NodeMaterial.Parse(serializationObject, this._scene);
            NodeMaterial.IgnoreTexturesAtLoadTime = store;

            tempMaterial.backFaceCulling = this._globalState.backFaceCulling;
            tempMaterial.needDepthPrePass = this._globalState.depthPrePass;

            if (this._postprocess) {
                this._postprocess.dispose(this._camera);
                this._postprocess = null;
            }

            switch (this._globalState.mode) {
                case NodeMaterialModes.PostProcess: 
                case NodeMaterialModes.ProceduralTexture: {
                    this._globalState.onIsLoadingChanged.notifyObservers(false);

                    this._postprocess = tempMaterial.createPostProcess(this._camera, 1.0, Constants.TEXTURE_NEAREST_SAMPLINGMODE, this._engine);

                    const currentScreen = tempMaterial.getBlockByPredicate((block) => block instanceof CurrentScreenBlock);
                    if (currentScreen) {
                        this._postprocess.onApplyObservable.add((effect) => {
                            effect.setTexture("textureSampler", (currentScreen as CurrentScreenBlock).texture);
                        });
                    }

                    if (this._material) {
                        this._material.dispose();
                    }
                    this._material = tempMaterial;
                    break;
                }

                case NodeMaterialModes.Particle: {
                    this._globalState.onIsLoadingChanged.notifyObservers(false);

                    this._particleSystem!.onBeforeDrawParticlesObservable.clear();

                    this._particleSystem!.onBeforeDrawParticlesObservable.add((effect) => {
                        const textureBlock = tempMaterial.getBlockByPredicate((block) => block instanceof ParticleTextureBlock);
                        if (textureBlock && (textureBlock as ParticleTextureBlock).texture && effect) {
                            effect.setTexture("diffuseSampler", (textureBlock as ParticleTextureBlock).texture);
                        }
                    });
                    tempMaterial.createEffectForParticles(this._particleSystem!);

                    if (this._material) {
                        this._material.dispose();
                    }
                    this._material = tempMaterial;
                    break;
                }

                default: {
                    if (this._meshes.length) {
                        let tasks = this._meshes.map((m) => this._forceCompilationAsync(tempMaterial, m));

                        Promise.all(tasks).then(() => {
                            for (var mesh of this._meshes) {
                                mesh.material = tempMaterial;
                            }

                            if (this._material) {
                                this._material.dispose();
                            }

                            this._material = tempMaterial;
                            this._globalState.onIsLoadingChanged.notifyObservers(false);
                        }).catch((reason) => {
                            this._globalState.onLogRequiredObservable.notifyObservers(new LogEntry("Shader compilation error:\r\n" + reason, true));
                            this._globalState.onIsLoadingChanged.notifyObservers(false);
                        });
                    } else {
                        this._material = tempMaterial;
                    }
                    break;
                }
            }
        } catch (err) {
            // Ignore the error
            this._globalState.onIsLoadingChanged.notifyObservers(false);
        }
    }

    public dispose() {
        this._nodeMaterial.onBuildObservable.remove(this._onBuildObserver);
        this._globalState.onPreviewCommandActivated.remove(this._onPreviewCommandActivatedObserver);
        this._globalState.onUpdateRequiredObservable.remove(this._onUpdateRequiredObserver);
        this._globalState.onAnimationCommandActivated.remove(this._onAnimationCommandActivatedObserver);
        this._globalState.onPreviewBackgroundChanged.remove(this._onPreviewBackgroundChangedObserver);
        this._globalState.onBackFaceCullingChanged.remove(this._onBackFaceCullingChangedObserver);
        this._globalState.onDepthPrePassChanged.remove(this._onDepthPrePassChangedObserver);
        this._globalState.onLightUpdated.remove(this._onLightUpdatedObserver);

        if (this._material) {
            this._material.dispose();
        }

        this._camera.dispose();
        for (var mesh of this._meshes) {
            mesh.dispose();
        }

        this._scene.dispose();
        this._engine.dispose();
    }
}