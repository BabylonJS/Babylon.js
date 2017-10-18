import { Template } from './../templateManager';
import { AbstractViewer } from './viewer';
import { Observable, Engine, Scene, StandardMaterial, ShadowOnlyMaterial, ArcRotateCamera, ImageProcessingConfiguration, Color3, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';

// A small hack for the inspector. to be removed!
import * as BABYLON from 'babylonjs';
window['BABYLON'] = BABYLON;

export class DefaultViewer extends AbstractViewer {

    protected initScene() {
        return super.initScene().then(() => {
            this.scene.createDefaultCameraOrLight(true, true, true);
            return this.scene;
        });
    }

    protected onTemplatesLoaded() {

        this.showLoadingScreen();

        // navbar
        let viewerElement = this.templateManager.getTemplate('viewer');
        let navbar = this.templateManager.getTemplate('navBar');

        viewerElement.parent.addEventListener('pointerover', () => {
            navbar.parent.style.bottom = '0px';
        });

        viewerElement.parent.addEventListener('pointerout', () => {
            navbar.parent.style.bottom = '-80px';
        });

        return super.onTemplatesLoaded();
    }

    protected prepareContainerElement() {
        this.containerElement.style.position = 'relative';
        this.containerElement.style.display = 'flex';
    }

    protected initCameras(): Promise<Scene> {
        return Promise.resolve(this.scene);
    }

    protected initLights(): Promise<Scene> {
        var light = new HemisphericLight("light1", new Vector3(0, 1, 0), this.scene);
        return Promise.resolve(this.scene);
    }

    public loadModel(model: any = this.configuration.model): Promise<Scene> {
        this.showLoadingScreen();

        //TODO should the scene be cleared?

        let modelUrl = (typeof model === 'string') ? model : model.url;
        let parts = modelUrl.split('/');
        let filename = parts.pop();
        let base = parts.join('/') + '/';

        return new Promise((resolve, reject) => {
            SceneLoader.ImportMesh(undefined, base, filename, this.scene, (meshes) => {
                console.log("model loaded");

                this.onModelLoaded(meshes).then(() => {
                    resolve(this.scene);
                });

            }, undefined, (e, m, exception) => {
                console.log(m, exception);
                reject(m);
            });
        })
    }

    public onModelLoaded(meshes) {
        this.hideLoadingScreen();

        this.scene.createDefaultCameraOrLight(true, true, true);

        // TODO do it better, no casting!
        let camera: ArcRotateCamera = <ArcRotateCamera>this.scene.activeCamera;

        // We want framing to move the camera at the best spot
        camera.useFramingBehavior = true;
        camera.useAutoRotationBehavior = true;

        // Get the bounding vectors of the mesh hierarchy (meshes[0] = root node in gltf)
        meshes[0].rotation.y += Math.PI;
        var bounding = meshes[0].getHierarchyBoundingVectors();
        camera.framingBehavior.zoomOnBoundingInfo(bounding.min, bounding.max);

        // Remove default light and create a new one to have a dynamic shadow                            
        this.scene.lights[0].dispose();
        var light = new BABYLON.DirectionalLight('light', new BABYLON.Vector3(-0.2, -1, 0), this.scene)
        light.position = new BABYLON.Vector3(bounding.max.x * 0.2, bounding.max.y * 2, 0)
        light.intensity = 4.5;

        // TODO - move it away from here.

        let ground = this.scene.getMeshByName('ground');
        ground.position.y = bounding.min.y;

        var shadowGenerator = new BABYLON.ShadowGenerator(512, light)
        shadowGenerator.useBlurExponentialShadowMap = true;
        shadowGenerator.useKernelBlur = true;
        shadowGenerator.blurKernel = 64;
        shadowGenerator.blurScale = 4;

        // Add the bus in the casters
        for (var index = 0; index < meshes.length; index++) {
            shadowGenerator.getShadowMap().renderList.push(meshes[index]);
        }

        return Promise.resolve(this.scene);
    }

    public initEnvironment(): Promise<Scene> {
        this.scene.imageProcessingConfiguration.exposure = 1.4;
        this.scene.imageProcessingConfiguration.contrast = 1.66;
        this.scene.imageProcessingConfiguration.toneMappingEnabled = true;

        // Define a general environment textue
        /*var hdrTexture = BABYLON.CubeTexture.CreateFromPrefilteredData("https://playground.babylonjs.com/textures/environment.dds", this.scene);
        hdrTexture.gammaSpace = false;

        // Let's create a color curve to play with background color
        var curve = new BABYLON.ColorCurves();
        curve.globalHue = 58.88;
        curve.globalDensity = 89;
        curve.globalSaturation = 94;

        // Create a dedicated background configuration 
        var backgroundImageProcessingConfiguration = new ImageProcessingConfiguration();
        backgroundImageProcessingConfiguration.exposure = 1.5;
        backgroundImageProcessingConfiguration.contrast = 1.66;
        backgroundImageProcessingConfiguration.toneMappingEnabled = true;
        backgroundImageProcessingConfiguration.vignetteEnabled = true;
        //backgroundImageProcessingConfiguration.vignetteM = true;
        backgroundImageProcessingConfiguration.vignetteWeight = 5;
        //backgroundImageProcessingConfiguration.vignetteColor = new Color3(0.8, 0.6, 0.4);
        backgroundImageProcessingConfiguration.colorCurves = curve;
        backgroundImageProcessingConfiguration.colorCurvesEnabled = true;*/

        var ground = Mesh.CreatePlane('ground', 100, this.scene)
        ground.rotation.x = Math.PI / 2
        ground.receiveShadows = true;
        ground.material = new ShadowOnlyMaterial('shadow-only-mat', this.scene)
        ground.material.alpha = 0.4;

        // Our skybox with the color curve
        /*var box = this.scene.createDefaultSkybox(hdrTexture, true, (this.scene.activeCamera.maxZ - this.scene.activeCamera.minZ) / 2, 0.7);
        box.infiniteDistance = false;
        (<StandardMaterial>box.material).imageProcessingConfiguration = backgroundImageProcessingConfiguration;*/

        return Promise.resolve(this.scene);
    }

    public showLoadingScreen() {
        return this.templateManager.getTemplate('loadingScreen').show((template => {

            var canvasRect = this.containerElement.getBoundingClientRect();
            var canvasPositioning = window.getComputedStyle(this.containerElement).position;

            template.parent.style.display = 'flex';
            template.parent.style.width = canvasRect.width + "px";
            template.parent.style.height = canvasRect.height + "px";
            template.parent.style.opacity = "1";
            // from the configuration!!!
            template.parent.style.backgroundColor = "black";
            return Promise.resolve(template);
        }));
    }

    public hideLoadingScreen() {
        return this.templateManager.getTemplate('loadingScreen').hide((template => {
            template.parent.style.opacity = "0";
            let onTransitionEnd = () => {
                template.parent.removeEventListener("transitionend", onTransitionEnd);
                template.parent.style.display = 'none';
            }
            template.parent.addEventListener("transitionend", onTransitionEnd);
            return Promise.resolve(template);
        }));
    }
}