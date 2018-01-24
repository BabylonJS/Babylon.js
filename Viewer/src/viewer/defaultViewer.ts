

import { ViewerConfiguration } from './../configuration/configuration';
import { Template, EventCallback } from './../templateManager';
import { AbstractViewer } from './viewer';
import { MirrorTexture, Plane, ShadowGenerator, Texture, BackgroundMaterial, Observable, ShadowLight, CubeTexture, BouncingBehavior, FramingBehavior, Behavior, Light, Engine, Scene, AutoRotationBehavior, AbstractMesh, Quaternion, StandardMaterial, ArcRotateCamera, ImageProcessingConfiguration, Color3, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';
import { CameraBehavior } from '../interfaces';

export class DefaultViewer extends AbstractViewer {

    public camera: ArcRotateCamera;

    constructor(public containerElement: HTMLElement, initialConfiguration: ViewerConfiguration = { extends: 'default' }) {
        super(containerElement, initialConfiguration);
        this.onModelLoadedObservable.add(this.onModelLoaded);
    }

    public initScene(): Promise<Scene> {
        return super.initScene().then(() => {
            this.extendClassWithConfig(this.scene, this.configuration.scene);
            return this.scene;
        })
    }

    protected onTemplatesLoaded() {

        this.showLoadingScreen();

        // navbar
        this.initNavbar();

        // close overlay button
        let closeButton = document.getElementById('close-button');
        if (closeButton) {
            closeButton.addEventListener('pointerdown', () => {
                this.hideOverlayScreen();
            })
        }

        return super.onTemplatesLoaded();
    }

    private initNavbar() {
        let navbar = this.templateManager.getTemplate('navBar');
        if (navbar) {
            let navbarHeight = navbar.parent.clientHeight + 'px';

            let navbarShown: boolean = true;
            let timeoutCancel /*: number*/;

            let triggerNavbar = function (show: boolean = false, evt: PointerEvent) {
                // only left-click on no-button.
                if (!navbar || evt.button > 0) return;
                // clear timeout
                timeoutCancel && clearTimeout(timeoutCancel);
                // if state is the same, do nothing
                if (show === navbarShown) return;
                //showing? simply show it!
                if (show) {
                    navbar.parent.style.bottom = show ? '0px' : '-' + navbarHeight;
                    navbarShown = show;
                } else {
                    let visibilityTimeout = 2000;
                    if (navbar.configuration.params && navbar.configuration.params.visibilityTimeout !== undefined) {
                        visibilityTimeout = <number>navbar.configuration.params.visibilityTimeout;
                    }
                    // not showing? set timeout until it is removed.
                    timeoutCancel = setTimeout(function () {
                        if (navbar) {
                            navbar.parent.style.bottom = '-' + navbarHeight;
                        }
                        navbarShown = show;
                    }, visibilityTimeout);
                }
            }

            this.templateManager.eventManager.registerCallback('viewer', triggerNavbar.bind(this, false), 'pointerout');
            this.templateManager.eventManager.registerCallback('viewer', triggerNavbar.bind(this, true), 'pointerdown');
            this.templateManager.eventManager.registerCallback('viewer', triggerNavbar.bind(this, false), 'pointerup');
            this.templateManager.eventManager.registerCallback('navBar', triggerNavbar.bind(this, true), 'pointerover');

            // other events
            let viewerTemplate = this.templateManager.getTemplate('viewer');
            let viewerElement = viewerTemplate && viewerTemplate.parent;
            // full screen
            let triggerFullscren = (eventData: EventCallback) => {
                if (viewerElement) {
                    let fullscreenElement = document.fullscreenElement || document.webkitFullscreenElement || (<any>document).mozFullScreenElement || (<any>document).msFullscreenElement;
                    if (!fullscreenElement) {
                        let requestFullScreen = viewerElement.requestFullscreen || viewerElement.webkitRequestFullscreen || (<any>viewerElement).msRequestFullscreen || (<any>viewerElement).mozRequestFullScreen;
                        requestFullScreen.call(viewerElement);
                    } else {
                        let exitFullscreen = document.exitFullscreen || document.webkitExitFullscreen || (<any>document).msExitFullscreen || (<any>document).mozCancelFullScreen
                        exitFullscreen.call(document);
                    }
                }
            }

            this.templateManager.eventManager.registerCallback('navBar', triggerFullscren, 'pointerdown', '#fullscreen-button');
        }
    }

    protected prepareContainerElement() {
        this.containerElement.style.position = 'relative';
        this.containerElement.style.display = 'flex';
    }

    public loadModel(model: any = this.configuration.model): Promise<Scene> {
        this.showLoadingScreen();
        return super.loadModel(model, true).catch((error) => {
            console.log(error);
            this.hideLoadingScreen();
            this.showOverlayScreen('error');
            return this.scene;
        });
    }

    private onModelLoaded = (meshes: Array<AbstractMesh>) => {

        // here we could set the navbar's model information:
        this.setModelMetaData();

        // with a short timeout, making sure everything is there already.
        setTimeout(() => {
            this.hideLoadingScreen();
        }, 500);


        // recreate the camera
        this.scene.createDefaultCameraOrLight(true, true, true);
        this.camera = <ArcRotateCamera>this.scene.activeCamera;

        meshes[0].rotation.y += Math.PI;

        this.setupCamera(meshes);
        this.setupLights(meshes);

        return this.initEnvironment(meshes);
    }

    private setModelMetaData() {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) return;

        let metadataContainer = navbar.parent.querySelector('#model-metadata');

        //title
        if (metadataContainer && typeof this.configuration.model === 'object') {
            if (this.configuration.model.title) {
                let element = metadataContainer.querySelector('span.model-title');
                if (element) {
                    element.innerHTML = this.configuration.model.title;
                }
            }

            if (this.configuration.model.subtitle) {
                let element = metadataContainer.querySelector('span.model-subtitle');
                if (element) {
                    element.innerHTML = this.configuration.model.subtitle;
                }
            }

            if (this.configuration.model.thumbnail) {
                (<HTMLDivElement>metadataContainer.querySelector('.thumbnail')).style.backgroundImage = `url('${this.configuration.model.thumbnail}')`;
            }
        }

    }

    public initEnvironment(focusMeshes: Array<AbstractMesh> = []): Promise<Scene> {
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

                let scale = this.configuration.skybox.scale || this.scene.activeCamera && (this.scene.activeCamera.maxZ - this.scene.activeCamera.minZ) / 2 || 1;

                let box = this.scene.createDefaultSkybox(texture, this.configuration.skybox.pbr, scale, this.configuration.skybox.blur);

                // before extending, set the material's imageprocessing configuration object, if needed:
                if (this.configuration.skybox.material && this.configuration.skybox.material.imageProcessingConfiguration && box) {
                    (<StandardMaterial>box.material).imageProcessingConfiguration = new ImageProcessingConfiguration();
                }

                this.extendClassWithConfig(box, this.configuration.skybox);

                box && focusMeshes.push(box);
            }
        }

        if (this.configuration.ground) {
            let groundConfig = (typeof this.configuration.ground === 'boolean') ? {} : this.configuration.ground;

            let groundSize = groundConfig.size || (this.configuration.skybox && this.configuration.skybox.scale) || 3000;

            let ground = Mesh.CreatePlane("BackgroundPlane", groundSize, this.scene);
            let backgroundMaterial = new BackgroundMaterial('groundmat', this.scene);
            ground.rotation.x = Math.PI / 2; // Face up by default.
            ground.receiveShadows = groundConfig.receiveShadows || false;

            // position the ground correctly
            let groundPosition = focusMeshes[0].getHierarchyBoundingVectors().min.y;
            ground.position.y = groundPosition;

            // default values
            backgroundMaterial.alpha = 0.9;
            backgroundMaterial.alphaMode = Engine.ALPHA_PREMULTIPLIED_PORTERDUFF;
            backgroundMaterial.shadowLevel = 0.5;
            backgroundMaterial.primaryLevel = 1;
            backgroundMaterial.primaryColor = new Color3(0.2, 0.2, 0.3).toLinearSpace().scale(3);
            backgroundMaterial.secondaryLevel = 0;
            backgroundMaterial.tertiaryLevel = 0;
            backgroundMaterial.useRGBColor = false;
            backgroundMaterial.enableNoise = true;

            // if config provided, extend the default values
            if (groundConfig.material) {
                this.extendClassWithConfig(ground, ground.material);
            }

            ground.material = backgroundMaterial;
            if (this.configuration.ground === true || groundConfig.shadowOnly) {
                // shadow only:
                ground.receiveShadows = true;
                const diffuseTexture = new Texture("https://assets.babylonjs.com/environments/backgroundGround.png", this.scene);
                diffuseTexture.gammaSpace = false;
                diffuseTexture.hasAlpha = true;
                backgroundMaterial.diffuseTexture = diffuseTexture;
            } else if (groundConfig.mirror) {
                var mirror = new MirrorTexture("mirror", 512, this.scene);
                mirror.mirrorPlane = new Plane(0, -1, 0, 0);
                mirror.renderList = mirror.renderList || [];
                focusMeshes.length && focusMeshes.forEach(m => {
                    m && mirror.renderList && mirror.renderList.push(m);
                });

                backgroundMaterial.reflectionTexture = mirror;
            } else {
                if (groundConfig.material) {
                    if (groundConfig.material.diffuseTexture) {
                        const diffuseTexture = new Texture(groundConfig.material.diffuseTexture, this.scene);
                        backgroundMaterial.diffuseTexture = diffuseTexture;
                    }
                }
                // ground.material = new StandardMaterial('groundmat', this.scene);
            }
            //default configuration
            if (this.configuration.ground === true) {
                ground.receiveShadows = true;
                if (ground.material)
                    ground.material.alpha = 0.4;
            }




            this.extendClassWithConfig(ground, groundConfig);
        }

        return Promise.resolve(this.scene);
    }

    public showOverlayScreen(subScreen: string) {
        let template = this.templateManager.getTemplate('overlay');
        if (!template) return Promise.reject('Overlay template not found');

        return template.show((template => {

            var canvasRect = this.containerElement.getBoundingClientRect();
            var canvasPositioning = window.getComputedStyle(this.containerElement).position;

            template.parent.style.display = 'flex';
            template.parent.style.width = canvasRect.width + "px";
            template.parent.style.height = canvasRect.height + "px";
            template.parent.style.opacity = "1";

            let subTemplate = this.templateManager.getTemplate(subScreen);
            if (!subTemplate) {
                return Promise.reject(subScreen + ' template not found');
            }
            return subTemplate.show((template => {
                template.parent.style.display = 'flex';
                return Promise.resolve(template);
            }));
        }));
    }

    public hideOverlayScreen() {
        let template = this.templateManager.getTemplate('overlay');
        if (!template) return Promise.reject('Overlay template not found');

        return template.hide((template => {
            template.parent.style.opacity = "0";
            let onTransitionEnd = () => {
                template.parent.removeEventListener("transitionend", onTransitionEnd);
                template.parent.style.display = 'none';
            }
            template.parent.addEventListener("transitionend", onTransitionEnd);

            let overlays = template.parent.querySelectorAll('.overlay');
            if (overlays) {
                for (let i = 0; i < overlays.length; ++i) {
                    let htmlElement = <HTMLElement>overlays.item(i);
                    htmlElement.style.display = 'none';
                }
            }

            /*return this.templateManager.getTemplate(subScreen).show((template => {
                template.parent.style.display = 'none';
                return Promise.resolve(template);
            }));*/
            return Promise.resolve(template);
        }));
    }

    public showLoadingScreen() {
        let template = this.templateManager.getTemplate('loadingScreen');
        if (!template) return Promise.reject('oading Screen template not found');

        return template.show((template => {

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
        let template = this.templateManager.getTemplate('loadingScreen');
        if (!template) return Promise.reject('oading Screen template not found');

        return template.hide((template => {
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

        let sceneConfig = this.configuration.scene || { defaultLight: true };

        if (!sceneConfig.defaultLight && (this.configuration.lights && Object.keys(this.configuration.lights).length)) {
            // remove old lights
            this.scene.lights.forEach(l => {
                l.dispose();
            });

            Object.keys(this.configuration.lights).forEach((name, idx) => {
                let lightConfig = this.configuration.lights && this.configuration.lights[name] || { name: name, type: 0 };
                lightConfig.name = name;
                let constructor = Light.GetConstructorFromName(lightConfig.type, lightConfig.name, this.scene);
                if (!constructor) return;
                let light = constructor();

                //enabled
                if (light.isEnabled() !== !lightConfig.disabled) {
                    light.setEnabled(!lightConfig.disabled);
                }

                this.extendClassWithConfig(light, lightConfig);

                //position. Some lights don't support shadows
                if (light instanceof ShadowLight) {
                    if (lightConfig.shadowEnabled) {
                        var shadowGenerator = new ShadowGenerator(512, light);
                        this.extendClassWithConfig(shadowGenerator, lightConfig.shadowConfig || {});
                        // add the focues meshes to the shadow list
                        let shadownMap = shadowGenerator.getShadowMap();
                        if (!shadownMap) return;
                        let renderList = shadownMap.renderList;
                        for (var index = 0; index < focusMeshes.length; index++) {
                            renderList && renderList.push(focusMeshes[index]);
                        }
                    }
                }
            });
        }
    }

    private setupCamera(focusMeshes: Array<AbstractMesh> = []) {

        let cameraConfig = this.configuration.camera || {};
        let sceneConfig = this.configuration.scene || { autoRotate: false, defaultCamera: true };

        if (!this.configuration.camera && sceneConfig.defaultCamera) {
            if (sceneConfig.autoRotate) {
                this.camera.useAutoRotationBehavior = true;
            }
            return;
        }

        if (cameraConfig.position) {
            this.camera.position.copyFromFloats(cameraConfig.position.x || 0, cameraConfig.position.y || 0, cameraConfig.position.z || 0);
        }

        if (cameraConfig.rotation) {
            this.camera.rotationQuaternion = new Quaternion(cameraConfig.rotation.x || 0, cameraConfig.rotation.y || 0, cameraConfig.rotation.z || 0, cameraConfig.rotation.w || 0)
        }

        this.camera.minZ = cameraConfig.minZ || this.camera.minZ;
        this.camera.maxZ = cameraConfig.maxZ || this.camera.maxZ;

        if (cameraConfig.behaviors) {
            for (let name in cameraConfig.behaviors) {
                this.setCameraBehavior(cameraConfig.behaviors[name], focusMeshes);
            }
        };

        if (sceneConfig.autoRotate) {
            this.camera.useAutoRotationBehavior = true;
        }
    }

    private setCameraBehavior(behaviorConfig: number | {
        type: number;
        [propName: string]: any;
    }, payload: any) {

        let behavior: Behavior<ArcRotateCamera> | null;
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
            default:
                behavior = null;
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
        if (!config) return;
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