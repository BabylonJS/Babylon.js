import { Template } from './../templateManager';
import { AbstractViewer } from './viewer';
import { Observable, ShadowLight, CubeTexture, BouncingBehavior, FramingBehavior, Behavior, Light, Engine, Scene, AutoRotationBehavior, AbstractMesh, Quaternion, StandardMaterial, ShadowOnlyMaterial, ArcRotateCamera, ImageProcessingConfiguration, Color3, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';
import { CameraBehavior } from '../interfaces';

// A small hack for the inspector. to be removed!
import * as BABYLON from 'babylonjs';
window['BABYLON'] = BABYLON;

export class DefaultViewer extends AbstractViewer {

    private camera: ArcRotateCamera;

    public initScene(): Promise<Scene> {
        return super.initScene().then(() => {
            this.extendClassWithConfig(this.scene, this.configuration.scene);
            return this.scene;
        })
    }

    protected onTemplatesLoaded() {

        this.showLoadingScreen();

        // navbar
        let viewerElement = this.templateManager.getTemplate('viewer');
        let navbar = this.templateManager.getTemplate('navBar');

        let nextHeight: string = '0px';

        viewerElement.parent.addEventListener('pointerover', () => {
            let currentHeight = navbar.parent.clientHeight + 'px';
            navbar.parent.style.bottom = nextHeight;
            nextHeight = '-' + currentHeight;
            console.log(nextHeight, currentHeight);
        });

        viewerElement.parent.addEventListener('pointerout', () => {
            navbar.parent.style.bottom = nextHeight;
            nextHeight = '0px';
        });

        // events registration
        this.registerFullscreenMode();

        return super.onTemplatesLoaded();
    }

    private registerFullscreenMode() {
        let isFullscreen = false;

        let navbar = this.templateManager.getTemplate('navBar');
        let viewerElement = this.templateManager.getTemplate('viewer').parent;

        navbar.onEventTriggered.add((data) => {
            switch (data.event.type) {
                case 'pointerdown':
                    let event: PointerEvent = <PointerEvent>data.event;
                    if (event.button === 0) {
                        if (data.selector === '#fullscreen-button') {
                            //this.engine.switchFullscreen(false);
                            if (!isFullscreen) {
                                let requestFullScreen = viewerElement.requestFullscreen || /*viewerElement.parent.msRequestFullscreen || viewerElement.parent.mozRequestFullScreen ||*/ viewerElement.webkitRequestFullscreen;
                                requestFullScreen.call(viewerElement);
                            } else {
                                let exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen
                                exitFullscreen.call(document);
                            }

                            isFullscreen = !isFullscreen;

                        }

                    }
                    break;
            }
        });

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

        // here we could set the navbar's model information:
        this.setModelMetaData();

        this.hideLoadingScreen();

        // recreate the camera
        this.scene.createDefaultCameraOrLight(true, true, true);
        this.camera = <ArcRotateCamera>this.scene.activeCamera;

        meshes[0].rotation.y += Math.PI;

        this.setupCamera(meshes);
        this.setupLights(meshes);

        return this.initEnvironment();
    }

    private setModelMetaData() {
        let navbar = this.templateManager.getTemplate('navBar');

        let metadataContainer = navbar.parent.querySelector('#model-metadata');

        //title
        if (typeof this.configuration.model === 'object') {
            if (this.configuration.model.title) {
                metadataContainer.querySelector('span.model-title').innerHTML = this.configuration.model.title;
            }

            if (this.configuration.model.subtitle) {
                metadataContainer.querySelector('span.model-subtitle').innerHTML = this.configuration.model.subtitle;
            }

            if (this.configuration.model.thumbnail) {
                (<HTMLDivElement>metadataContainer.querySelector('.thumbnail')).style.backgroundImage = `url('${this.configuration.model.thumbnail}')`;
            }
        }

    }

    public initEnvironment(): Promise<Scene> {
        if (this.configuration.skybox) {
            // Define a general environment textue
            let texture;
            // this is obligatory, but still - making sure it is there.
            if (this.configuration.skybox.cubeTexture) {
                if (typeof this.configuration.skybox.cubeTexture.url === 'string') {
                    texture = CubeTexture.CreateFromPrefilteredData(this.configuration.skybox.cubeTexture.url, this.scene);
                } else {
                    texture = CubeTexture.CreateFromImages(this.configuration.skybox.cubeTexture.url, this.scene, this.configuration.skybox.cubeTexture.noMipMap);
                }
            }
            if (texture) {
                this.extendClassWithConfig(texture, this.configuration.skybox.cubeTexture);

                let scale = this.configuration.skybox.scale || (this.scene.activeCamera.maxZ - this.scene.activeCamera.minZ) / 2;

                let box = this.scene.createDefaultSkybox(texture, this.configuration.skybox.pbr, scale, this.configuration.skybox.blur);

                // before extending, set the material's imageprocessing configuration object, if needed:
                if (this.configuration.skybox.material && this.configuration.skybox.material.imageProcessingConfiguration) {
                    (<StandardMaterial>box.material).imageProcessingConfiguration = new ImageProcessingConfiguration();
                }

                this.extendClassWithConfig(box, this.configuration.skybox);
            }
        }

        if (this.configuration.ground) {
            let groundConfig = (typeof this.configuration.ground === 'boolean') ? {} : this.configuration.ground;

            var ground = Mesh.CreateGround('ground', groundConfig.size || 1000, groundConfig.size || 1000, 8, this.scene);
            if (this.configuration.ground === true || groundConfig.shadowOnly) {
                ground.material = new ShadowOnlyMaterial('groundmat', this.scene);
            } else {
                ground.material = new StandardMaterial('groundmat', this.scene);
            }
            //default configuration
            if (this.configuration.ground === true) {
                ground.receiveShadows = true;
                ground.material.alpha = 0.4;
            }


            this.extendClassWithConfig(ground, groundConfig);
        }

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

                this.extendClassWithConfig(light, lightConfig);

                //position. Some lights don't support shadows
                if (light instanceof ShadowLight) {
                    if (lightConfig.shadowEnabled) {
                        var shadowGenerator = new BABYLON.ShadowGenerator(512, light)
                        this.extendClassWithConfig(shadowGenerator, lightConfig.shadowConfig || {});
                        // add the focues meshes to the shadow list
                        for (var index = 0; index < focusMeshes.length; index++) {
                            shadowGenerator.getShadowMap().renderList.push(focusMeshes[index]);
                        }
                    }
                }
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
                    (<FramingBehavior>behavior).zoomOnBoundingInfo(bounding.min, bounding.max);
                }
                break;
        }
    }

    private extendClassWithConfig(object: any, config: any) {
        Object.keys(config).forEach(key => {
            if (key in object && typeof object[key] !== 'function') {
                if (typeof object[key] === 'function') return;
                // if it is an object, iterate internally until reaching basic types
                if (typeof object[key] === 'object') {
                    this.extendClassWithConfig(object[key], config[key]);
                } else {
                    object[key] = config[key];
                }
            }
        });
    }
}