

import { ViewerConfiguration, IModelConfiguration, ILightConfiguration } from './../configuration/configuration';
import { Template, EventCallback } from './../templateManager';
import { AbstractViewer } from './viewer';
import { SpotLight, MirrorTexture, Plane, ShadowGenerator, Texture, BackgroundMaterial, Observable, ShadowLight, CubeTexture, BouncingBehavior, FramingBehavior, Behavior, Light, Engine, Scene, AutoRotationBehavior, AbstractMesh, Quaternion, StandardMaterial, ArcRotateCamera, ImageProcessingConfiguration, Color3, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';
import { CameraBehavior } from '../interfaces';
import { ViewerModel } from '../model/viewerModel';
import { extendClassWithConfig } from '../helper';

/**
 * The Default viewer is the default implementation of the AbstractViewer.
 * It uses the templating system to render a new canvas and controls.
 */
export class DefaultViewer extends AbstractViewer {

    /**
     * Create a new default viewer
     * @param containerElement the element in which the templates will be rendered
     * @param initialConfiguration the initial configuration. Defaults to extending the default configuration
     */
    constructor(public containerElement: HTMLElement, initialConfiguration: ViewerConfiguration = { extends: 'default' }) {
        super(containerElement, initialConfiguration);
        this.onModelLoadedObservable.add(this._onModelLoaded);
        this.sceneManager.onSceneInitObservable.add(() => {
            // extendClassWithConfig(this.sceneManager.scene, this._configuration.scene);
            return this.sceneManager.scene;
        });

        this.sceneManager.onLightsConfiguredObservable.add((data) => {
            this._configureLights(data.newConfiguration, data.model!);
        })
    }

    /**
     * This will be executed when the templates initialize.
     */
    protected _onTemplatesLoaded() {
        this.showLoadingScreen();

        // navbar
        this._initNavbar();

        // close overlay button
        let closeButton = document.getElementById('close-button');
        if (closeButton) {
            closeButton.addEventListener('pointerdown', () => {
                this.hideOverlayScreen();
            })
        }

        return super._onTemplatesLoaded();
    }

    private _initNavbar() {
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

            this.templateManager.eventManager.registerCallback('navBar', this.toggleFullscreen, 'pointerdown', '#fullscreen-button');
            this.templateManager.eventManager.registerCallback('navBar', (data) => {
                if (data && data.event && data.event.target)
                    this.sceneManager.models[0].playAnimation(data.event.target['value']);
            }, 'change', '#animation-selector');
        }
    }

    /**
     * Toggle fullscreen of the entire viewer
     */
    public toggleFullscreen = () => {
        let viewerTemplate = this.templateManager.getTemplate('viewer');
        let viewerElement = viewerTemplate && viewerTemplate.parent;

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

    /**
     * Preparing the container element to present the viewer
     */
    protected _prepareContainerElement() {
        this.containerElement.style.position = 'relative';
        this.containerElement.style.display = 'flex';
    }

    /**
     * This function will configure the templates and update them after a model was loaded
     * It is mainly responsible to changing the title and subtitle etc'.
     * @param model the model to be used to configure the templates by
     */
    protected _configureTemplate(model: ViewerModel) {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) return;

        if (model.getAnimationNames().length > 1) {
            navbar.updateParams({ animations: model.getAnimationNames() });
        }

        let modelConfiguration = model.configuration;

        let metadataContainer = navbar.parent.querySelector('#model-metadata');
        if (metadataContainer) {
            if (modelConfiguration.title !== undefined) {
                let element = metadataContainer.querySelector('span.model-title');
                if (element) {
                    element.innerHTML = modelConfiguration.title;
                }
            }

            if (modelConfiguration.subtitle !== undefined) {
                let element = metadataContainer.querySelector('span.model-subtitle');
                if (element) {
                    element.innerHTML = modelConfiguration.subtitle;
                }
            }

            if (modelConfiguration.thumbnail !== undefined) {
                (<HTMLDivElement>metadataContainer.querySelector('.thumbnail')).style.backgroundImage = `url('${modelConfiguration.thumbnail}')`;
            }
        }
    }

    /**
     * This will load a new model to the default viewer
     * overriding the AbstractViewer's loadModel.
     * The scene will automatically be cleared of the old models, if exist.
     * @param model the configuration object (or URL) to load.
     */
    public loadModel(model: any = this._configuration.model): Promise<ViewerModel> {
        this.showLoadingScreen();
        return super.loadModel(model, true).catch((error) => {
            console.log(error);
            this.hideLoadingScreen();
            this.showOverlayScreen('error');
            return Promise.reject(error);
        });
    }

    private _onModelLoaded = (model: ViewerModel) => {
        this._configureTemplate(model);
        // with a short timeout, making sure everything is there already.
        let hideLoadingDelay = 500;
        if (this._configuration.lab && this._configuration.lab.hideLoadingDelay !== undefined) {
            hideLoadingDelay = this._configuration.lab.hideLoadingDelay;
        }
        setTimeout(() => {
            this.hideLoadingScreen();
        }, hideLoadingDelay);

        return;
    }

    /**
     * Show the overlay and the defined sub-screen.
     * Mainly used for help and errors
     * @param subScreen the name of the subScreen. Those can be defined in the configuration object
     */
    public showOverlayScreen(subScreen: string) {
        let template = this.templateManager.getTemplate('overlay');
        if (!template) return Promise.resolve('Overlay template not found');

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

    /**
     * Hide the overlay screen.
     */
    public hideOverlayScreen() {
        let template = this.templateManager.getTemplate('overlay');
        if (!template) return Promise.resolve('Overlay template not found');

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
            return Promise.resolve(template);
        }));
    }

    /**
     * show the viewer (in case it was hidden)
     * 
     * @param visibilityFunction an optional function to execute in order to show the container
     */
    public show(visibilityFunction?: ((template: Template) => Promise<Template>)): Promise<Template> {
        let template = this.templateManager.getTemplate('main');
        //not possible, but yet:
        if (!template) return Promise.reject('Main template not found');
        return template.show(visibilityFunction);
    }

    /**
     * hide the viewer (in case it is visible)
     * 
     * @param visibilityFunction an optional function to execute in order to hide the container
     */
    public hide(visibilityFunction?: ((template: Template) => Promise<Template>)) {
        let template = this.templateManager.getTemplate('main');
        //not possible, but yet:
        if (!template) return Promise.reject('Main template not found');
        return template.hide(visibilityFunction);
    }

    /**
     * Show the loading screen.
     * The loading screen can be configured using the configuration object
     */
    public showLoadingScreen() {
        let template = this.templateManager.getTemplate('loadingScreen');
        if (!template) return Promise.resolve('Loading Screen template not found');

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

    /**
     * Hide the loading screen
     */
    public hideLoadingScreen() {
        let template = this.templateManager.getTemplate('loadingScreen');
        if (!template) return Promise.resolve('Loading Screen template not found');

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

    /**
     * An extension of the light configuration of the abstract viewer.
     * @param lightsConfiguration the light configuration to use
     * @param model the model that will be used to configure the lights (if the lights are model-dependant)
     */
    private _configureLights(lightsConfiguration: { [name: string]: ILightConfiguration | boolean } = {}, model?: ViewerModel) {
        // labs feature - flashlight
        if (this._configuration.lab && this._configuration.lab.flashlight) {
            let pointerPosition = Vector3.Zero();
            let lightTarget;
            let angle = 0.5;
            let exponent = Math.PI / 2;
            if (typeof this._configuration.lab.flashlight === "object") {
                exponent = this._configuration.lab.flashlight.exponent || exponent;
                angle = this._configuration.lab.flashlight.angle || angle;
            }
            var flashlight = new SpotLight("flashlight", Vector3.Zero(),
                Vector3.Zero(), exponent, angle, this.sceneManager.scene);
            if (typeof this._configuration.lab.flashlight === "object") {
                flashlight.intensity = this._configuration.lab.flashlight.intensity || flashlight.intensity;
                if (this._configuration.lab.flashlight.diffuse) {
                    flashlight.diffuse.r = this._configuration.lab.flashlight.diffuse.r;
                    flashlight.diffuse.g = this._configuration.lab.flashlight.diffuse.g;
                    flashlight.diffuse.b = this._configuration.lab.flashlight.diffuse.b;
                }
                if (this._configuration.lab.flashlight.specular) {
                    flashlight.specular.r = this._configuration.lab.flashlight.specular.r;
                    flashlight.specular.g = this._configuration.lab.flashlight.specular.g;
                    flashlight.specular.b = this._configuration.lab.flashlight.specular.b;
                }

            }
            this.sceneManager.scene.constantlyUpdateMeshUnderPointer = true;
            this.sceneManager.scene.onPointerObservable.add((eventData, eventState) => {
                if (eventData.type === 4 && eventData.pickInfo) {
                    lightTarget = (eventData.pickInfo.pickedPoint);
                } else {
                    lightTarget = undefined;
                }
            });
            let updateFlashlightFunction = () => {
                if (this.sceneManager.camera && flashlight) {
                    flashlight.position.copyFrom(this.sceneManager.camera.position);
                    if (lightTarget) {
                        lightTarget.subtractToRef(flashlight.position, flashlight.direction);
                    }
                }
            }
            this.sceneManager.scene.registerBeforeRender(updateFlashlightFunction);
            this._registeredOnBeforeRenderFunctions.push(updateFlashlightFunction);
        }
    }
}