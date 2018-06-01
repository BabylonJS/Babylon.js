import { ViewerConfiguration, IModelConfiguration } from './../configuration/configuration';
import { Template } from './../templateManager';
import { AbstractViewer } from './viewer';
import { ViewerModel } from '../model/viewerModel';
/**
 * The Default viewer is the default implementation of the AbstractViewer.
 * It uses the templating system to render a new canvas and controls.
 */
export declare class DefaultViewer extends AbstractViewer {
    containerElement: HTMLElement;
    /**
     * Create a new default viewer
     * @param containerElement the element in which the templates will be rendered
     * @param initialConfiguration the initial configuration. Defaults to extending the default configuration
     */
    constructor(containerElement: HTMLElement, initialConfiguration?: ViewerConfiguration);
    /**
     * This will be executed when the templates initialize.
     */
    protected _onTemplatesLoaded(): Promise<AbstractViewer>;
    private _dropped(evt);
    private _initNavbar();
    private _animationList;
    private _currentAnimation;
    private _isAnimationPaused;
    private _resumePlay;
    private _handlePointerDown;
    /**
     * Plays or Pauses animation
     */
    private _togglePlayPause;
    private _oldIdleRotationValue;
    /**
     * Control progress bar position based on animation current frame
     */
    private _updateProgressBar;
    /**
     * Update Current Animation Speed
     */
    private _updateAnimationSpeed;
    /**
     * Update Current Animation Type
     */
    private _updateAnimationType;
    /**
     * Toggle fullscreen of the entire viewer
     */
    toggleFullscreen: () => void;
    /**
     * Preparing the container element to present the viewer
     */
    protected _prepareContainerElement(): void;
    /**
     * This function will configure the templates and update them after a model was loaded
     * It is mainly responsible to changing the title and subtitle etc'.
     * @param model the model to be used to configure the templates by
     */
    protected _configureTemplate(model: ViewerModel): void;
    /**
     * This will load a new model to the default viewer
     * overriding the AbstractViewer's loadModel.
     * The scene will automatically be cleared of the old models, if exist.
     * @param model the configuration object (or URL) to load.
     */
    loadModel(model?: string | File | IModelConfiguration): Promise<ViewerModel>;
    private _onModelLoaded;
    /**
     * Show the overlay and the defined sub-screen.
     * Mainly used for help and errors
     * @param subScreen the name of the subScreen. Those can be defined in the configuration object
     */
    showOverlayScreen(subScreen: string): Promise<string> | Promise<Template>;
    /**
     * Hide the overlay screen.
     */
    hideOverlayScreen(): Promise<string> | Promise<Template>;
    /**
     * show the viewer (in case it was hidden)
     *
     * @param visibilityFunction an optional function to execute in order to show the container
     */
    show(visibilityFunction?: ((template: Template) => Promise<Template>)): Promise<Template>;
    /**
     * hide the viewer (in case it is visible)
     *
     * @param visibilityFunction an optional function to execute in order to hide the container
     */
    hide(visibilityFunction?: ((template: Template) => Promise<Template>)): Promise<Template>;
    /**
     * Show the loading screen.
     * The loading screen can be configured using the configuration object
     */
    showLoadingScreen(): Promise<string> | Promise<Template>;
    /**
     * Hide the loading screen
     */
    hideLoadingScreen(): Promise<string> | Promise<Template>;
    /**
     * An extension of the light configuration of the abstract viewer.
     * @param lightsConfiguration the light configuration to use
     * @param model the model that will be used to configure the lights (if the lights are model-dependant)
     */
    private _configureLights(lightsConfiguration?, model?);
}
