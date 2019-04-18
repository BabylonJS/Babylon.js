import { Nullable } from "../types";
import { _TimeToken } from "../Instrumentation/timeToken";
import { _DepthCullingState, _StencilState, _AlphaState } from "../States/index";
import { Engine } from "../Engines/engine";
/**
 * Interface used to present a loading screen while loading a scene
 * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
 */
export interface ILoadingScreen {
    /**
     * Function called to display the loading screen
     */
    displayLoadingUI: () => void;
    /**
     * Function called to hide the loading screen
     */
    hideLoadingUI: () => void;
    /**
     * Gets or sets the color to use for the background
     */
    loadingUIBackgroundColor: string;
    /**
     * Gets or sets the text to display while loading
     */
    loadingUIText: string;

}

/**
 * Class used for the default loading screen
 * @see http://doc.babylonjs.com/how_to/creating_a_custom_loading_screen
 */
export class DefaultLoadingScreen implements ILoadingScreen {

    private _loadingDiv: Nullable<HTMLDivElement>;
    private _loadingTextDiv: HTMLDivElement;

    public static DefaultLogoUrl = "https://assets.babylonjs.com/identity/v4.svg";
    public static DefaultSpinnerUrl = "https://assets.babylonjs.com/identity/spinner.svg";

    /**
     * Creates a new default loading screen
     * @param _renderingCanvas defines the canvas used to render the scene
     * @param _loadingText defines the default text to display
     * @param _loadingDivBackgroundColor defines the default background color
     */
    constructor(private _renderingCanvas: HTMLCanvasElement, private _loadingText = "", private _loadingDivBackgroundColor = "black") {

    }

    /**
     * Function called to display the loading screen
     */
    public displayLoadingUI(): void {
        if (this._loadingDiv) {
            // Do not add a loading screen if there is already one
            return;
        }

        this._loadingDiv = document.createElement("div");

        this._loadingDiv.id = "babylonjsLoadingDiv";
        this._loadingDiv.style.opacity = "0";
        this._loadingDiv.style.transition = "opacity 1.5s ease";
        this._loadingDiv.style.pointerEvents = "none";

        // Loading text
        this._loadingTextDiv = document.createElement("div");
        this._loadingTextDiv.style.position = "absolute";
        this._loadingTextDiv.style.left = "0";
        this._loadingTextDiv.style.top = "50%";
        this._loadingTextDiv.style.marginTop = "80px";
        this._loadingTextDiv.style.width = "100%";
        this._loadingTextDiv.style.height = "20px";
        this._loadingTextDiv.style.fontFamily = "Arial";
        this._loadingTextDiv.style.fontSize = "14px";
        this._loadingTextDiv.style.color = "white";
        this._loadingTextDiv.style.textAlign = "center";
        this._loadingTextDiv.innerHTML = "Loading";

        this._loadingDiv.appendChild(this._loadingTextDiv);

        //set the predefined text
        this._loadingTextDiv.innerHTML = this._loadingText;

        // Generating keyframes
        var style = document.createElement('style');
        style.type = 'text/css';
        var keyFrames =
            `@-webkit-keyframes spin1 {\
                    0% { -webkit-transform: rotate(0deg);}
                    100% { -webkit-transform: rotate(360deg);}
                }\
                @keyframes spin1 {\
                    0% { transform: rotate(0deg);}
                    100% { transform: rotate(360deg);}
                }`;
        style.innerHTML = keyFrames;
        document.getElementsByTagName('head')[0].appendChild(style);

        // Loading img
        var imgBack = new Image();
        imgBack.src = DefaultLoadingScreen.DefaultLogoUrl;

        imgBack.style.position = "absolute";
        imgBack.style.left = "50%";
        imgBack.style.top = "50%";
        imgBack.style.width = "10vw";
        imgBack.style.height = "10vw";
        imgBack.style.marginLeft = "-5vw";
        imgBack.style.marginTop = "-5vw";

        // Loading spinner
        var imgSpinner = new Image();
        imgSpinner.src = DefaultLoadingScreen.DefaultSpinnerUrl;

        imgSpinner.style.position = "absolute";
        imgSpinner.style.left = "50%";
        imgSpinner.style.top = "50%";
        imgSpinner.style.width = "18vw";
        imgSpinner.style.height = "18vw";
        imgSpinner.style.marginLeft = "-9vw";
        imgSpinner.style.marginTop = "-9vw";
        imgSpinner.style.animation = "spin1 0.75s infinite linear";
        imgSpinner.style.webkitAnimation = "spin1 0.75s infinite linear";
        imgSpinner.style.transformOrigin = "50% 50%";
        imgSpinner.style.webkitTransformOrigin = "50% 50%";

        this._loadingDiv.appendChild(imgBack);
        this._loadingDiv.appendChild(imgSpinner);

        this._resizeLoadingUI();

        window.addEventListener("resize", this._resizeLoadingUI);

        this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
        document.body.appendChild(this._loadingDiv);

        this._loadingDiv.style.opacity = "1";
    }

    /**
     * Function called to hide the loading screen
     */
    public hideLoadingUI(): void {
        if (!this._loadingDiv) {
            return;
        }

        var onTransitionEnd = () => {
            if (!this._loadingDiv) {
                return;
            }
            if (this._loadingDiv.parentElement) {
                this._loadingDiv.parentElement.removeChild(this._loadingDiv);
            }
            window.removeEventListener("resize", this._resizeLoadingUI);

            this._loadingDiv = null;
        };

        this._loadingDiv.style.opacity = "0";
        this._loadingDiv.addEventListener("transitionend", onTransitionEnd);
    }

    /**
     * Gets or sets the text to display while loading
     */
    public set loadingUIText(text: string) {
        this._loadingText = text;

        if (this._loadingTextDiv) {
            this._loadingTextDiv.innerHTML = this._loadingText;
        }
    }

    public get loadingUIText(): string {
        return this._loadingText;
    }

    /**
     * Gets or sets the color to use for the background
     */
    public get loadingUIBackgroundColor(): string {
        return this._loadingDivBackgroundColor;
    }

    public set loadingUIBackgroundColor(color: string) {
        this._loadingDivBackgroundColor = color;

        if (!this._loadingDiv) {
            return;
        }

        this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
    }

    // Resize
    private _resizeLoadingUI = () => {
        var canvasRect = this._renderingCanvas.getBoundingClientRect();
        var canvasPositioning = window.getComputedStyle(this._renderingCanvas).position;

        if (!this._loadingDiv) {
            return;
        }

        this._loadingDiv.style.position = (canvasPositioning === "fixed") ? "fixed" : "absolute";
        this._loadingDiv.style.left = canvasRect.left + "px";
        this._loadingDiv.style.top = canvasRect.top + "px";
        this._loadingDiv.style.width = canvasRect.width + "px";
        this._loadingDiv.style.height = canvasRect.height + "px";
    }
}

Engine.DefaultLoadingScreenFactory = (canvas: HTMLCanvasElement) => { return new DefaultLoadingScreen(canvas); };
