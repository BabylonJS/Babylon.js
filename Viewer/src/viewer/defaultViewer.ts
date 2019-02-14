
import { ViewerConfiguration, IModelConfiguration, ILightConfiguration, ISceneConfiguration } from './../configuration';
import { Template, EventCallback } from '../templating/templateManager';
import { FilesInput } from 'babylonjs/Misc/filesInput';
import { SpotLight } from 'babylonjs/Lights/spotLight';
import { Vector3 } from 'babylonjs/Maths/math';
import { TemplateManager } from '../templating/templateManager';
import { AbstractViewerWithTemplate } from './viewerWithTemplate';
import { StandardMaterial } from 'babylonjs/Materials/standardMaterial';
import { PBRMaterial } from 'babylonjs/Materials/PBR/pbrMaterial';
import { extendClassWithConfig } from '../helper';
import { ViewerModel } from '../model/viewerModel';
import { IModelAnimation, AnimationState } from '../model/modelAnimation';
import { IViewerTemplatePlugin } from '../templating/viewerTemplatePlugin';
import { HDButtonPlugin } from '../templating/plugins/hdButtonPlugin';
import { PrintButtonPlugin } from '../templating/plugins/printButton';

/**
 * The Default viewer is the default implementation of the AbstractViewer.
 * It uses the templating system to render a new canvas and controls.
 */
export class DefaultViewer extends AbstractViewerWithTemplate {
    /**
     * The corresponsing template manager of this viewer.
     */
    public templateManager: TemplateManager;

    public fullscreenElement?: Element;

    /**
     * Create a new default viewer
     * @param containerElement the element in which the templates will be rendered
     * @param initialConfiguration the initial configuration. Defaults to extending the default configuration
     */
    constructor(public containerElement: Element, initialConfiguration: ViewerConfiguration = { extends: 'default' }) {
        super(containerElement, initialConfiguration);
        
        this.onModelLoadedObservable.add(this._onModelLoaded);
        this.onModelRemovedObservable.add(() => {
            this._configureTemplate();
        });

        this.onEngineInitObservable.add(() => {
            this.sceneManager.onLightsConfiguredObservable.add((data) => {
                this._configureLights();
            });
        });

        this.onInitDoneObservable.add(() => {
            this.sceneManager.setDefaultMaterial = function(sceneConfig: ISceneConfiguration){
                let conf = sceneConfig.defaultMaterial;
                if(!conf){
                    return;
                }
                if ((conf.materialType === 'standard' && this.scene.defaultMaterial.getClassName() !== 'StandardMaterial') ||
                    (conf.materialType === 'pbr' && this.scene.defaultMaterial.getClassName() !== 'PBRMaterial')) {
                    this.scene.defaultMaterial.dispose();
                    if (conf.materialType === 'standard') {
                        this.scene.defaultMaterial = new StandardMaterial("defaultMaterial", this.scene);
                    } else {
                        this.scene.defaultMaterial = new PBRMaterial("defaultMaterial", this.scene);
                    }
                }
                extendClassWithConfig(this.scene.defaultMaterial, conf);
            }
            if (!this.sceneManager.models.length) {
                this.hideLoadingScreen();
            }
        });
    }

    private _registeredPlugins: Array<IViewerTemplatePlugin> = [];

    public registerTemplatePlugin(plugin: IViewerTemplatePlugin) {
        //validate
        if (!plugin.templateName) {
            throw new Error("No template name provided");
        }
        this._registeredPlugins.push(plugin);
        let template = this.templateManager.getTemplate(plugin.templateName);
        if (!template) {
            throw new Error(`Template ${plugin.templateName} not found`);
        }
        if (plugin.addHTMLTemplate) {
            template.onHTMLRendered.add((tmpl) => {
                plugin.addHTMLTemplate!(tmpl);
            });
            template.redraw();
        }

        if (plugin.eventsToAttach) {
            plugin.eventsToAttach.forEach((eventName) => {
                plugin.onEvent && this.templateManager.eventManager.registerCallback(plugin.templateName, (event) => {
                    if (plugin.onEvent && plugin.interactionPredicate(event)) {
                        plugin.onEvent(event);
                    }
                }, eventName);
            });
        }
    }

    /**
     * This will be executed when the templates initialize.
     */
    protected _onTemplatesLoaded() {
        this.showLoadingScreen();

        // navbar
        this._initNavbar();

        // close overlay button
        let template = this.templateManager.getTemplate('overlay');
        if (template) {

            let closeButton = template.parent.querySelector('.close-button');
            if (closeButton) {
                closeButton.addEventListener('pointerdown', () => {
                    this.hideOverlayScreen();
                });
            }
        }

        if (this.configuration.templates && this.configuration.templates.viewer) {
            if (this.configuration.templates.viewer.params && this.configuration.templates.viewer.params.enableDragAndDrop) {
                this.onSceneInitObservable.addOnce(() => {
                    let filesInput = new FilesInput(this.engine, this.sceneManager.scene, () => {
                    }, () => {
                    }, () => {
                    }, () => {
                    }, function() {
                    }, (file: File) => {
                        this.loadModel(file);
                    }, () => {
                    });
                    filesInput.monitorElementForDragNDrop(this.templateManager.getCanvas()!);
                });
            }
        }

        return super._onTemplatesLoaded();
    }

    private _initNavbar() {
        let navbar = this.templateManager.getTemplate('navBar');
        if (navbar) {
            this.onFrameRenderedObservable.add(this._updateProgressBar);
            this.templateManager.eventManager.registerCallback('navBar', this._handlePointerClick, 'click');
            // an example how to trigger the help button. publiclly available
            this.templateManager.eventManager.registerCallback("navBar", () => {
                // do your thing
            }, "pointerdown", ".help-button");

            this.templateManager.eventManager.registerCallback("navBar", (event: EventCallback) => {
                const evt = event.event;
                const element = <HTMLInputElement>(evt.target);
                if (!this._currentAnimation) { return; }
                const gotoFrame = +element.value / 100 * this._currentAnimation.frames;
                if (isNaN(gotoFrame)) { return; }
                this._currentAnimation.goToFrame(gotoFrame);
            }, "input");

            this.templateManager.eventManager.registerCallback("navBar", () => {
                if (this._resumePlay) {
                    this._togglePlayPause(true);
                }
                this._resumePlay = false;
            }, "pointerup", ".progress-wrapper");

            if (window.devicePixelRatio === 1 && navbar.configuration.params && !navbar.configuration.params.hideHdButton) {
                navbar.updateParams({
                    hideHdButton: true
                });
            }

            this.registerTemplatePlugin(new HDButtonPlugin(this));
            this.registerTemplatePlugin(new PrintButtonPlugin(this));
        }
    }

    private _animationList: string[];
    private _currentAnimation: IModelAnimation;
    private _isAnimationPaused: boolean;
    private _resumePlay: boolean;

    private _handlePointerClick = (event: EventCallback) => {

        let pointerDown = <PointerEvent>event.event;
        if (pointerDown.button !== 0) { return; }
        var element = (<HTMLElement>event.event.target);

        if (!element) {
            return;
        }

        let parentClasses = element.parentElement!.classList;

        let elementClasses = element.classList;

        let elementName = "";

        for (let i = 0; i < elementClasses.length; ++i) {
            let className = elementClasses[i];
            if (className.indexOf("-button") !== -1 || className.indexOf("-wrapper") !== -1) {
                elementName = className;
                break;
            }
        }

        switch (elementName) {
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
                var value = element.dataset["value"];
                var label = element.querySelector("span.animation-label");
                if (label && value) {
                    this._updateAnimationType({ value: value.trim(), label: label.innerHTML });
                }
                break;
            case "speed-option-button":
                if (!this._currentAnimation) {
                    return;
                }
                var speed = element.dataset["value"];
                if (speed) {
                    this._updateAnimationSpeed(speed);
                }
                break;
            case "progress-wrapper":
                this._resumePlay = !this._isAnimationPaused;
                if (this._resumePlay) {
                    this._togglePlayPause(true);
                }
                break;
            case "fullscreen-button":
                this.toggleFullscreen();
                break;
            case "vr-button":
                this.toggleVR();
                break;
            default:
                return;
        }
    }

    /**
     * Plays or Pauses animation
     */
    private _togglePlayPause = (noUiUpdate?: boolean) => {
        if (!this._currentAnimation) {
            return;
        }
        if (this._isAnimationPaused) {
            this._currentAnimation.restart();
        } else {
            this._currentAnimation.pause();
        }

        this._isAnimationPaused = !this._isAnimationPaused;

        if (noUiUpdate) { return; }

        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) { return; }

        navbar.updateParams({
            paused: this._isAnimationPaused,
        });
    }

    private _oldIdleRotationValue: number;

    /**
     * Control progress bar position based on animation current frame
     */
    private _updateProgressBar = () => {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) { return; }
        var progressSlider = <HTMLInputElement>navbar.parent.querySelector("input.progress-wrapper");
        if (progressSlider && this._currentAnimation) {
            const progress = this._currentAnimation.currentFrame / this._currentAnimation.frames * 100;
            var currentValue = progressSlider.valueAsNumber;
            if (Math.abs(currentValue - progress) > 0.5) { // Only move if greater than a 1% change
                progressSlider.value = '' + progress;
            }

            if (this._currentAnimation.state === AnimationState.PLAYING) {
                if (this.sceneManager.camera.autoRotationBehavior && !this._oldIdleRotationValue) {
                    this._oldIdleRotationValue = this.sceneManager.camera.autoRotationBehavior.idleRotationSpeed;
                    this.sceneManager.camera.autoRotationBehavior.idleRotationSpeed = 0;
                }
            } else {
                if (this.sceneManager.camera.autoRotationBehavior && this._oldIdleRotationValue) {
                    this.sceneManager.camera.autoRotationBehavior.idleRotationSpeed = this._oldIdleRotationValue;
                    this._oldIdleRotationValue = 0;
                }
            }
        }
    }

    /**
     * Update Current Animation Speed
     */
    private _updateAnimationSpeed = (speed: string, paramsObject?: any) => {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) { return; }

        if (speed && this._currentAnimation) {
            this._currentAnimation.speedRatio = parseFloat(speed);
            if (!this._isAnimationPaused) {
                this._currentAnimation.restart();
            }

            if (paramsObject) {
                paramsObject.selectedSpeed = speed + "x";
            } else {
                navbar.updateParams({
                    selectedSpeed: speed + "x",
                });
            }
        }
    }

    /**
     * Update Current Animation Type
     */
    private _updateAnimationType = (data: { label: string, value: string }, paramsObject?: any) => {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) { return; }

        if (data) {
            this._currentAnimation = this.sceneManager.models[0].setCurrentAnimationByName(data.value);
        }

        if (paramsObject) {
            paramsObject.selectedAnimation = (this._animationList.indexOf(data.value) + 1);
            paramsObject.selectedAnimationName = data.label;
        } else {
            navbar.updateParams({
                selectedAnimation: (this._animationList.indexOf(data.value) + 1),
                selectedAnimationName: data.label
            });
        }

        this._updateAnimationSpeed("1.0", paramsObject);
    }

    protected _initVR() {
        this.engine.onVRDisplayChangedObservable.add(() => {
            let viewerTemplate = this.templateManager.getTemplate('viewer');
            let viewerElement = viewerTemplate && viewerTemplate.parent;

            if (viewerElement) {
                if (this.sceneManager.vrHelper!.isInVRMode) {
                    viewerElement.classList.add("in-vr");
                } else {
                    viewerElement.classList.remove("in-vr");
                }
            }
        });
        if (this.sceneManager.vrHelper) {
            // due to the way the experience helper is exisintg VR, this must be added.
            this.sceneManager.vrHelper.onExitingVR.add(() => {
                let viewerTemplate = this.templateManager.getTemplate('viewer');
                let viewerElement = viewerTemplate && viewerTemplate.parent;

                if (viewerElement) {
                    viewerElement.classList.remove("in-vr");
                }
            });
        }
        super._initVR();
    }

    /**
     * Toggle fullscreen of the entire viewer
     */
    public toggleFullscreen = () => {
        let viewerTemplate = this.templateManager.getTemplate('viewer');
        let viewerElement = viewerTemplate && viewerTemplate.parent;
        let fullscreenElement = this.fullscreenElement || viewerElement;

        if (fullscreenElement) {
            let currentElement = (<any>document).fullscreenElement || (<any>document).webkitFullscreenElement || (<any>document).mozFullScreenElement || (<any>document).msFullscreenElement;
            if (!currentElement) {
                let requestFullScreen = fullscreenElement.requestFullscreen || (<any>fullscreenElement).webkitRequestFullscreen || (<any>fullscreenElement).msRequestFullscreen || (<any>fullscreenElement).mozRequestFullScreen;
                requestFullScreen.call(fullscreenElement);
                if (viewerElement) {
                    viewerElement.classList.add("in-fullscreen");
                }
            } else {
                let exitFullscreen = document.exitFullscreen || (<any>document).webkitExitFullscreen || (<any>document).msExitFullscreen || (<any>document).mozCancelFullScreen;
                exitFullscreen.call(document);
                if (viewerElement) {
                    viewerElement.classList.remove("in-fullscreen");
                }
            }
        }
    }

    /**
     * Preparing the container element to present the viewer
     */
    protected _prepareContainerElement() {
        const htmlElement = this.containerElement as HTMLElement;
        if (htmlElement.style) {
            htmlElement.style.position = 'relative';
            htmlElement.style.height = '100%';
            htmlElement.style.display = 'flex';
        }
    }

    /**
     * This function will configure the templates and update them after a model was loaded
     * It is mainly responsible to changing the title and subtitle etc'.
     * @param model the model to be used to configure the templates by
     */
    protected _configureTemplate(model?: ViewerModel) {
        let navbar = this.templateManager.getTemplate('navBar');
        if (!navbar) { return; }

        let newParams: any = navbar.configuration.params || {};

        if (!model) {
            newParams.animations = null;
        } else {

            let animationNames = model.getAnimationNames();
            newParams.animations = animationNames.map((a) => { return { label: a, value: a }; });
            if (animationNames.length) {
                this._isAnimationPaused = (model.configuration.animation && !model.configuration.animation.autoStart) || !model.configuration.animation;
                this._animationList = animationNames;
                newParams.paused = this._isAnimationPaused;
                let animationIndex = 0;
                if (model.configuration.animation && typeof model.configuration.animation.autoStart === 'string') {
                    animationIndex = animationNames.indexOf(model.configuration.animation.autoStart);
                    if (animationIndex === -1) {
                        animationIndex = 0;
                    }
                }
                this._updateAnimationType(newParams.animations[animationIndex], newParams);
            } else {
                newParams.animations = null;
            }

            if (model.configuration.thumbnail) {
                newParams.logoImage = model.configuration.thumbnail;
            }
        }
        navbar.updateParams(newParams, false);
    }

    /**
     * This will load a new model to the default viewer
     * overriding the AbstractViewer's loadModel.
     * The scene will automatically be cleared of the old models, if exist.
     * @param model the configuration object (or URL) to load.
     */
    public loadModel(model?: string | File | IModelConfiguration): Promise<ViewerModel> {
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
        if (this.configuration.lab && this.configuration.lab.hideLoadingDelay !== undefined) {
            hideLoadingDelay = this.configuration.lab.hideLoadingDelay;
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
        if (!template) { return Promise.resolve('Overlay template not found'); }

        return template.show(((template) => {

            var canvasRect = this.containerElement.getBoundingClientRect();

            template.parent.style.display = 'flex';
            template.parent.style.width = canvasRect.width + "px";
            template.parent.style.height = canvasRect.height + "px";
            template.parent.style.opacity = "1";

            let subTemplate = this.templateManager.getTemplate(subScreen);
            if (!subTemplate) {
                return Promise.reject(subScreen + ' template not found');
            }
            return subTemplate.show(((template) => {
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
        if (!template) { return Promise.resolve('Overlay template not found'); }

        return template.hide(((template) => {
            template.parent.style.opacity = "0";
            let onTransitionEnd = () => {
                template.parent.removeEventListener("transitionend", onTransitionEnd);
                template.parent.style.display = 'none';
            };
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
        if (!template) { return Promise.reject('Main template not found'); }
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
        if (!template) { return Promise.reject('Main template not found'); }
        return template.hide(visibilityFunction);
    }

    /**
     * Show the loading screen.
     * The loading screen can be configured using the configuration object
     */
    public showLoadingScreen() {
        let template = this.templateManager.getTemplate('loadingScreen');
        if (!template) { return Promise.resolve('Loading Screen template not found'); }

        return template.show(((template) => {

            var canvasRect = this.containerElement.getBoundingClientRect();
            // var canvasPositioning = window.getComputedStyle(this.containerElement).position;

            template.parent.style.display = 'flex';
            template.parent.style.width = canvasRect.width + "px";
            template.parent.style.height = canvasRect.height + "px";
            template.parent.style.opacity = "1";
            // from the configuration!!!
            let color = "black";
            if (this.configuration.templates && this.configuration.templates.loadingScreen) {
                color = (this.configuration.templates.loadingScreen.params &&
                    <string>this.configuration.templates.loadingScreen.params.backgroundColor) || color;
            }
            template.parent.style.backgroundColor = color;
            return Promise.resolve(template);
        }));
    }

    /**
     * Hide the loading screen
     */
    public hideLoadingScreen() {
        let template = this.templateManager.getTemplate('loadingScreen');
        if (!template) { return Promise.resolve('Loading Screen template not found'); }

        return template.hide(((template) => {
            template.parent.style.opacity = "0";
            let onTransitionEnd = () => {
                template.parent.removeEventListener("transitionend", onTransitionEnd);
                template.parent.style.display = 'none';
            };
            template.parent.addEventListener("transitionend", onTransitionEnd);
            return Promise.resolve(template);
        }));
    }

    public dispose() {
        this.templateManager.dispose();
        super.dispose();
    }

    protected _onConfigurationLoaded(configuration: ViewerConfiguration) {

        super._onConfigurationLoaded(configuration);

        this.templateManager = new TemplateManager(this.containerElement);

        // initialize the templates
        let templateConfiguration = this.configuration.templates || {};

        this.templateManager.initTemplate(templateConfiguration);
        // when done, execute onTemplatesLoaded()
        this.templateManager.onAllLoaded.add(() => {
            let canvas = this.templateManager.getCanvas();
            if (canvas) {
                this._canvas = canvas;
            }
            this._onTemplateLoaded();
        });
    }

    /**
     * An extension of the light configuration of the abstract viewer.
     * @param lightsConfiguration the light configuration to use
     * @param model the model that will be used to configure the lights (if the lights are model-dependant)
     */
    private _configureLights() {
        // labs feature - flashlight
        if (this.configuration.lab && this.configuration.lab.flashlight) {
            let lightTarget;
            let angle = 0.5;
            let exponent = Math.PI / 2;
            if (typeof this.configuration.lab.flashlight === "object") {
                exponent = this.configuration.lab.flashlight.exponent || exponent;
                angle = this.configuration.lab.flashlight.angle || angle;
            }
            var flashlight = new SpotLight("flashlight", Vector3.Zero(),
                Vector3.Zero(), exponent, angle, this.sceneManager.scene);
            if (typeof this.configuration.lab.flashlight === "object") {
                flashlight.intensity = this.configuration.lab.flashlight.intensity || flashlight.intensity;
                if (this.configuration.lab.flashlight.diffuse) {
                    flashlight.diffuse.r = this.configuration.lab.flashlight.diffuse.r;
                    flashlight.diffuse.g = this.configuration.lab.flashlight.diffuse.g;
                    flashlight.diffuse.b = this.configuration.lab.flashlight.diffuse.b;
                }
                if (this.configuration.lab.flashlight.specular) {
                    flashlight.specular.r = this.configuration.lab.flashlight.specular.r;
                    flashlight.specular.g = this.configuration.lab.flashlight.specular.g;
                    flashlight.specular.b = this.configuration.lab.flashlight.specular.b;
                }

            }
            this.sceneManager.scene.constantlyUpdateMeshUnderPointer = true;
            this.sceneManager.scene.onPointerObservable.add((eventData) => {
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
            };
            this.sceneManager.scene.registerBeforeRender(updateFlashlightFunction);
            this._registeredOnBeforeRenderFunctions.push(updateFlashlightFunction);
        }
    }
}