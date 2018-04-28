

import { ViewerConfiguration, IModelConfiguration, ILightConfiguration } from './../configuration/configuration';
import { Template, EventCallback } from './../templateManager';
import { AbstractViewer } from './viewer';
import { SpotLight, MirrorTexture, Plane, ShadowGenerator, Texture, BackgroundMaterial, Observable, ShadowLight, CubeTexture, BouncingBehavior, FramingBehavior, Behavior, Light, Engine, Scene, AutoRotationBehavior, AbstractMesh, Quaternion, StandardMaterial, ArcRotateCamera, ImageProcessingConfiguration, Color3, Vector3, SceneLoader, Mesh, HemisphericLight } from 'babylonjs';
import { CameraBehavior } from '../interfaces';
import { ViewerModel } from '../model/viewerModel';
import { extendClassWithConfig } from '../helper';
import { IModelAnimation } from 'model/modelAnimation';

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
            this.onFrameRenderedObservable.add(this._updateProgressBar);
            this.templateManager.eventManager.registerCallback('navBar', this._handlePointerDown, 'pointerdown');
            // an example how to trigger the help button. publiclly available
            this.templateManager.eventManager.registerCallback("navBar", () => {
                // do your thing
            }, "pointerdown", "#help-button");
        }
    }

    private _animationList: string[];
    private _currentAnimation: IModelAnimation;
    private _isAnimationPaused: boolean;

    private _handlePointerDown = (event: EventCallback) => {

        let pointerDown = <PointerEvent>event.event;
        if (pointerDown.button !== 0) return;
        var element = (<HTMLElement>event.event.srcElement);

        if (!element) {
            return;
        }

        let parentClasses = element.parentElement!.classList;

        switch (element.id) {
            case "speed-button":
            case "types-button":
                if (parentClasses.contains("open")) {
                    parentClasses.remove("open");
                } else {
                    parentClasses.add("open");
                }
                break;
            case "play-pause-button":
                this._togglePlayPause();
                break;
            case "label-option-button":
                var label = element.dataset["value"];
                if (label) {
                    this._updateAnimationType(label);
                }
                break;
            case "speed-option-button":
                if (!this._currentAnimation) {
                    return;
                }
                var speed = element.dataset["value"];
                if (speed)
                    this._updateAnimationSpeed(speed);
                break;
            case "progress-bar-container":
                if (!this._currentAnimation) return;
                const gotoFrame = (pointerDown.offsetX / element.clientWidth) * this._currentAnimation.frames;
                if (isNaN(gotoFrame)) return;
                this._currentAnimation.goToFrame(gotoFrame);
                break;
            case "fullscreen-button":
                this.toggleFullscreen();
            default:
                return;
        }
    }

    /**
     * Plays or Pauses animation
     */
    private _togglePlayPause = () => {
        if (!this._currentAnimation) {
            return;
        }
        if (this._isAnimationPaused) {
            this._currentAnimation.restart();
        } else {
            this._currentAnimation.pause();
        }

        this._isAnimationPaused = !this._isAnimationPaused;

        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) return;

        navbar.updateParams({
            paused: this._isAnimationPaused,
        });
    }

    /**
     * Control progress bar position based on animation current frame
     */
    private _updateProgressBar = () => {
        var progressWrapper = document.getElementById("progress-wrapper");
        if (progressWrapper && this._currentAnimation) {
            const progress = this._currentAnimation.currentFrame / this._currentAnimation.frames * 100;
            if (isNaN(progress)) return;
            progressWrapper.style.transform = "translateX(" + progress + "%)";
        }
    }

    /** 
     * Update Current Animation Speed
     */
    private _updateAnimationSpeed = (speed: string) => {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) return;

        if (speed && this._currentAnimation) {
            this._currentAnimation.speedRatio = parseFloat(speed);
            if (!this._isAnimationPaused) {
                this._currentAnimation.restart();
            }
            navbar.updateParams({
                selectedSpeed: speed + "x",
            });
        }
    }

    /** 
     * Update Current Animation Type
     */
    private _updateAnimationType = (label: string) => {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) return;

        if (label) {
            this._currentAnimation = this.sceneManager.models[0].setCurrentAnimationByName(label);
        }

        navbar.updateParams({
            selectedAnimation: (this._animationList.indexOf(label) + 1),
        });

        // reset speed when a new animation is selected
        this._updateAnimationSpeed("1.0");
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

        if (model.getAnimationNames().length >= 1) {
            this._animationList = model.getAnimationNames(),
                navbar.updateParams({
                    animations: this._animationList,
                });

            // default animation & speed
            this._updateAnimationSpeed("1.0");
            this._isAnimationPaused = !!(model.configuration.animation && model.configuration.animation.autoStart);
            this._updateAnimationType(this._animationList[0]);
        }

        let modelConfiguration = model.configuration;
    }

    /**
     * This will load a new model to the default viewer
     * overriding the AbstractViewer's loadModel.
     * The scene will automatically be cleared of the old models, if exist.
     * @param model the configuration object (or URL) to load.
     */
    public loadModel(model?: string | IModelConfiguration): Promise<ViewerModel> {
        if (!model) {
            model = this.configuration.model;
        }
        this.showLoadingScreen();
        return super.loadModel(model!, true).catch((error) => {
            console.log(error);
            this.hideLoadingScreen();
            this.showOverlayScreen('error');
            return Promise.reject(error);
        });
    }

    private _onModelLoaded = (model: ViewerModel) => {
        this._configureTemplate(model);
        // with a short timeout, making sure everything is there already.
        let hideLoadingDelay = 20;
        if (this._configuration.lab && this._configuration.lab.hideLoadingDelay !== undefined) {
            hideLoadingDelay = this._configuration.lab.hideLoadingDelay;
        }
        setTimeout(() => {
            this.sceneManager.scene.executeWhenReady(() => {
                this.hideLoadingScreen();
            });
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