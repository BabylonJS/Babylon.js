import { Template } from './../templateManager';
import { AbstractViewer } from './viewer';
import { Observable, ShadowLight, BouncingBehavior, FramingBehavior, Behavior, Light, Engine, Scene, AutoRotationBehavior, AbstractMesh, Quaternion, StandardMaterial, ShadowOnlyMaterial, ArcRotateCamera, ImageProcessingConfiguration, Color3, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';
import { CameraBehavior } from '../interfaces';

// A small hack for the inspector. to be removed!
import * as BABYLON from 'babylonjs';
window['BABYLON'] = BABYLON;

export class DefaultViewer extends AbstractViewer {

    private camera: ArcRotateCamera;

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

    public loadModel(model: any = this.configuration.model): Promise<Scene> {
        this.showLoadingScreen();
        return super.loadModel(model, true);
    }

    public onModelLoaded(meshes: Array<AbstractMesh>) {

        this.hideLoadingScreen();

        // recreate the camera
        this.scene.createDefaultCameraOrLight(true, true, true);
        this.camera = <ArcRotateCamera>this.scene.activeCamera;

        meshes[0].rotation.y += Math.PI;

        this.setupCamera(meshes);
        this.setupLights(meshes);

        var ground = Mesh.CreatePlane('ground', 100, this.scene)
        ground.rotation.x = Math.PI / 2
        ground.receiveShadows = true;
        ground.material = new ShadowOnlyMaterial('shadow-only-mat', this.scene)
        ground.material.alpha = 0.4;

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

        /**/

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

    private setupLights(focusMeshes: Array<AbstractMesh> = []) {
        if (!this.configuration.scene.defaultLight && (this.configuration.lights && this.configuration.lights.length)) {
            // remove old lights
            this.scene.lights.forEach(l => {
                l.dispose();
            });

            this.configuration.lights.forEach((lightConfig, idx) => {
                lightConfig.name = lightConfig.name || 'light-' + idx;
                let constructor = Light.GetConstructorFromName(lightConfig.type, lightConfig.name, this.scene);
                let light = constructor();

                //enabled
                if (light.isEnabled() !== !lightConfig.disabled) {
                    light.setEnabled(!lightConfig.disabled);
                }

                light.intensity = lightConfig.intensity || light.intensity;

                //position. Some lights don't have position!!
                if (light instanceof ShadowLight) {
                    if (lightConfig.position && light.position) {
                        this.extendClassWithConfig(light.position, lightConfig.position);
                    }

                    if (lightConfig.direction) {
                        this.extendClassWithConfig(light.direction, lightConfig.direction);
                    }

                    if (lightConfig.enableShadows) {
                        var shadowGenerator = new BABYLON.ShadowGenerator(512, light)
                        this.extendClassWithConfig(shadowGenerator, lightConfig.shadowConfig || {});
                        // add the focues meshes to the shadow list
                        for (var index = 0; index < focusMeshes.length; index++) {
                            shadowGenerator.getShadowMap().renderList.push(focusMeshes[index]);
                        }
                        console.log("shadows enabled");
                    }
                }

                console.log(light);
            });
        }
    }

    private setupCamera(focusMeshes: Array<AbstractMesh> = []) {
        if (this.configuration.scene.defaultCamera) {
            return;
        }

        let cameraConfig = this.configuration.camera || {};

        if (cameraConfig.position) {
            this.camera.position.copyFromFloats(cameraConfig.position.x || 0, cameraConfig.position.y || 0, cameraConfig.position.z || 0);
        }

        if (cameraConfig.rotation) {
            this.camera.rotationQuaternion = new Quaternion(cameraConfig.rotation.x || 0, cameraConfig.rotation.y || 0, cameraConfig.rotation.z || 0, cameraConfig.rotation.w || 0)
        }

        this.camera.minZ = cameraConfig.minZ || this.camera.minZ;
        this.camera.maxZ = cameraConfig.maxZ || this.camera.maxZ;

        if (cameraConfig.behaviors) {
            cameraConfig.behaviors.forEach((behaviorConfig) => {
                this.setCameraBehavior(behaviorConfig, focusMeshes);
            });
        };

        if (this.configuration.scene.autoRotate) {
            this.camera.useAutoRotationBehavior = true;
        }
    }

    private setCameraBehavior(behaviorConfig: number | {
        type: number;
        [propName: string]: any;
    }, payload: any) {

        let behavior: Behavior<ArcRotateCamera>;
        let type = (typeof behaviorConfig !== "object") ? behaviorConfig : behaviorConfig.type;

        let config: { [propName: string]: any } = (typeof behaviorConfig === "object") ? behaviorConfig : {};

        // constructing behavior
        switch (type) {
            case CameraBehavior.AUTOROTATION:
                behavior = new AutoRotationBehavior();
                break;
            case CameraBehavior.BOUNCING:
                behavior = new BouncingBehavior();
                break;
            case CameraBehavior.FRAMING:
                behavior = new FramingBehavior();
                break;
        }

        if (behavior) {
            if (typeof behaviorConfig === "object") {
                this.extendClassWithConfig(behavior, behaviorConfig);
            }
            this.camera.addBehavior(behavior);
        }

        // post attach configuration. Some functionalities require the attached camera.
        switch (type) {
            case CameraBehavior.AUTOROTATION:
                break;
            case CameraBehavior.BOUNCING:
                break;
            case CameraBehavior.FRAMING:
                if (config.zoomOnBoundingInfo) {
                    //payload is an array of meshes
                    let meshes = <Array<AbstractMesh>>payload;
                    let bounding = meshes[0].getHierarchyBoundingVectors();
                    console.log(bounding);
                    (<FramingBehavior>behavior).zoomOnBoundingInfo(bounding.min, bounding.max);
                }
                break;
        }
    }

    private extendClassWithConfig(object: any, config: any) {
        Object.keys(config).forEach(key => {
            if (key in object && typeof object[key] !== 'function') {
                object[key] = config[key];
            }
        });
    }
}