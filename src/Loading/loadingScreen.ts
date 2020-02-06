import { Nullable } from "../types";
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

    /** Gets or sets the logo url to use for the default loading screen */
    public static DefaultLogoUrl = "";

    /** Gets or sets the spinner url to use for the default loading screen */
    public static DefaultSpinnerUrl = "";

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

        const svgSupport = !!window.SVGSVGElement;
        // Loading img
        var imgBack = new Image();
        if (!DefaultLoadingScreen.DefaultLogoUrl) {
            imgBack.src = !svgSupport ? "https://cdn.babylonjs.com/Assets/babylonLogo.png" : `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODAuMTcgMjA4LjA0Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2UwNjg0Yjt9LmNscy0ze2ZpbGw6I2JiNDY0Yjt9LmNscy00e2ZpbGw6I2UwZGVkODt9LmNscy01e2ZpbGw6I2Q1ZDJjYTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkJhYnlsb25Mb2dvPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iUGFnZV9FbGVtZW50cyIgZGF0YS1uYW1lPSJQYWdlIEVsZW1lbnRzIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05MC4wOSwwLDAsNTJWMTU2bDkwLjA5LDUyLDkwLjA4LTUyVjUyWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxODAuMTcgNTIuMDEgMTUxLjk3IDM1LjczIDEyNC44NSA1MS4zOSAxNTMuMDUgNjcuNjcgMTgwLjE3IDUyLjAxIi8+PHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjI3LjEyIDY3LjY3IDExNy4yMSAxNS42NiA5MC4wOCAwIDAgNTIuMDEgMjcuMTIgNjcuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iNjEuODkgMTIwLjMgOTAuMDggMTM2LjU4IDExOC4yOCAxMjAuMyA5MC4wOCAxMDQuMDIgNjEuODkgMTIwLjMiLz48cG9seWdvbiBjbGFzcz0iY2xzLTMiIHBvaW50cz0iMTUzLjA1IDY3LjY3IDE1My4wNSAxNDAuMzcgOTAuMDggMTc2LjcyIDI3LjEyIDE0MC4zNyAyNy4xMiA2Ny42NyAwIDUyLjAxIDAgMTU2LjAzIDkwLjA4IDIwOC4wNCAxODAuMTcgMTU2LjAzIDE4MC4xNyA1Mi4wMSAxNTMuMDUgNjcuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTMiIHBvaW50cz0iOTAuMDggNzEuNDYgNjEuODkgODcuNzQgNjEuODkgMTIwLjMgOTAuMDggMTA0LjAyIDExOC4yOCAxMjAuMyAxMTguMjggODcuNzQgOTAuMDggNzEuNDYiLz48cG9seWdvbiBjbGFzcz0iY2xzLTQiIHBvaW50cz0iMTUzLjA1IDY3LjY3IDExOC4yOCA4Ny43NCAxMTguMjggMTIwLjMgOTAuMDggMTM2LjU4IDkwLjA4IDE3Ni43MiAxNTMuMDUgMTQwLjM3IDE1My4wNSA2Ny42NyIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtNSIgcG9pbnRzPSIyNy4xMiA2Ny42NyA2MS44OSA4Ny43NCA2MS44OSAxMjAuMyA5MC4wOCAxMzYuNTggOTAuMDggMTc2LjcyIDI3LjEyIDE0MC4zNyAyNy4xMiA2Ny42NyIvPjwvZz48L2c+PC9zdmc+`;
        } else {
            imgBack.src = DefaultLoadingScreen.DefaultLogoUrl;
        }

        imgBack.style.position = "absolute";
        imgBack.style.left = "40%";
        imgBack.style.top = "40%";
        imgBack.style.width = "20%";
        imgBack.style.height = "20%";

        // Loading spinner
        var imgSpinner = new Image();

        if (!DefaultLoadingScreen.DefaultSpinnerUrl) {
            imgSpinner.src = !svgSupport ? "https://cdn.babylonjs.com/Assets/loadingIcon.png" : `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzOTIgMzkyIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2UwNjg0Yjt9LmNscy0ye2ZpbGw6bm9uZTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlNwaW5uZXJJY29uPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iU3Bpbm5lciI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDAuMjEsMTI2LjQzYzMuNy03LjMxLDcuNjctMTQuNDQsMTItMjEuMzJsMy4zNi01LjEsMy41Mi01YzEuMjMtMS42MywyLjQxLTMuMjksMy42NS00LjkxczIuNTMtMy4yMSwzLjgyLTQuNzlBMTg1LjIsMTg1LjIsMCwwLDEsODMuNCw2Ny40M2EyMDgsMjA4LDAsMCwxLDE5LTE1LjY2YzMuMzUtMi40MSw2Ljc0LTQuNzgsMTAuMjUtN3M3LjExLTQuMjgsMTAuNzUtNi4zMmM3LjI5LTQsMTQuNzMtOCwyMi41My0xMS40OSwzLjktMS43Miw3Ljg4LTMuMywxMi00LjY0YTEwNC4yMiwxMDQuMjIsMCwwLDEsMTIuNDQtMy4yMyw2Mi40NCw2Mi40NCwwLDAsMSwxMi43OC0xLjM5QTI1LjkyLDI1LjkyLDAsMCwxLDE5NiwyMS40NGE2LjU1LDYuNTUsMCwwLDEsMi4wNSw5LDYuNjYsNi42NiwwLDAsMS0xLjY0LDEuNzhsLS40MS4yOWEyMi4wNywyMi4wNywwLDAsMS01Ljc4LDMsMzAuNDIsMzAuNDIsMCwwLDEtNS42NywxLjYyLDM3LjgyLDM3LjgyLDAsMCwxLTUuNjkuNzFjLTEsMC0xLjkuMTgtMi44NS4yNmwtMi44NS4yNHEtNS43Mi41MS0xMS40OCwxLjFjLTMuODQuNC03LjcxLjgyLTExLjU4LDEuNGExMTIuMzQsMTEyLjM0LDAsMCwwLTIyLjk0LDUuNjFjLTMuNzIsMS4zNS03LjM0LDMtMTAuOTQsNC42NHMtNy4xNCwzLjUxLTEwLjYsNS41MUExNTEuNiwxNTEuNiwwLDAsMCw2OC41Niw4N0M2Ny4yMyw4OC40OCw2Niw5MCw2NC42NCw5MS41NnMtMi41MSwzLjE1LTMuNzUsNC43M2wtMy41NCw0LjljLTEuMTMsMS42Ni0yLjIzLDMuMzUtMy4zMyw1YTEyNywxMjcsMCwwLDAtMTAuOTMsMjEuNDksMS41OCwxLjU4LDAsMSwxLTMtMS4xNVM0MC4xOSwxMjYuNDcsNDAuMjEsMTI2LjQzWiIvPjxyZWN0IGNsYXNzPSJjbHMtMiIgd2lkdGg9IjM5MiIgaGVpZ2h0PSIzOTIiLz48L2c+PC9nPjwvc3ZnPg==`;
        } else {
            imgSpinner.src = DefaultLoadingScreen.DefaultSpinnerUrl;
        }

        imgSpinner.style.position = "absolute";
        imgSpinner.style.left = "30%";
        imgSpinner.style.top = "30%";
        imgSpinner.style.width = "40%";
        imgSpinner.style.height = "40%";
        imgSpinner.style.animation = "spin1 0.75s infinite linear";
        imgSpinner.style.webkitAnimation = "spin1 0.75s infinite linear";
        imgSpinner.style.transformOrigin = "50% 50%";
        imgSpinner.style.webkitTransformOrigin = "50% 50%";

        if (!svgSupport) {
            const logoSize = { w: 16, h: 18.5 };
            const loadingSize = { w: 30, h: 30 };
            // set styling correctly
            imgBack.style.width = `${logoSize.w}vh`;
            imgBack.style.height = `${logoSize.h}vh`;
            imgBack.style.left = `calc(50% - ${logoSize.w / 2}vh)`;
            imgBack.style.top = `calc(50% - ${logoSize.h / 2}vh)`;

            imgSpinner.style.width = `${loadingSize.w}vh`;
            imgSpinner.style.height = `${loadingSize.h}vh`;
            imgSpinner.style.left = `calc(50% - ${loadingSize.w / 2}vh)`;
            imgSpinner.style.top = `calc(50% - ${loadingSize.h / 2}vh)`;
        }

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
