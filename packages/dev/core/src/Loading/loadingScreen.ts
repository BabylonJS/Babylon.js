import type { Nullable } from "../types";
import { AbstractEngine } from "../Engines/abstractEngine";
import { EngineStore } from "../Engines/engineStore";
import type { Observer } from "../Misc/observable";
/**
 * Interface used to present a loading screen while loading a scene
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
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
 * @see https://doc.babylonjs.com/features/featuresDeepDive/scene/customLoadingScreen
 */
export class DefaultLoadingScreen implements ILoadingScreen {
    private _engine: Nullable<AbstractEngine>;
    private _resizeObserver: Nullable<Observer<AbstractEngine>>;
    private _isLoading: boolean;
    /**
     * Maps a loading `HTMLDivElement` to a tuple containing the associated `HTMLCanvasElement`
     * and its `DOMRect` (or `null` if not yet available).
     */
    private _loadingDivToRenderingCanvasMap: Map<HTMLDivElement, [HTMLCanvasElement, DOMRect | null]> = new Map();
    private _loadingTextDiv: Nullable<HTMLDivElement>;
    private _style: Nullable<HTMLStyleElement>;

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
    constructor(
        private _renderingCanvas: HTMLCanvasElement,
        private _loadingText = "",
        private _loadingDivBackgroundColor = "black"
    ) {}

    /**
     * Function called to display the loading screen
     */
    public displayLoadingUI(): void {
        if (this._isLoading) {
            // Do not add a loading screen if it is already loading
            return;
        }

        this._isLoading = true;
        // get current engine by rendering canvas
        this._engine = EngineStore.Instances.find((engine) => engine.getRenderingCanvas() === this._renderingCanvas) as AbstractEngine;

        const loadingDiv = document.createElement("div");

        loadingDiv.id = "babylonjsLoadingDiv";
        loadingDiv.style.opacity = "0";
        loadingDiv.style.transition = "opacity 1.5s ease";
        loadingDiv.style.pointerEvents = "none";
        loadingDiv.style.display = "grid";
        loadingDiv.style.gridTemplateRows = "100%";
        loadingDiv.style.gridTemplateColumns = "100%";
        loadingDiv.style.justifyItems = "center";
        loadingDiv.style.alignItems = "center";

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
        this._loadingTextDiv.style.zIndex = "1";
        this._loadingTextDiv.innerHTML = "Loading";

        loadingDiv.appendChild(this._loadingTextDiv);

        //set the predefined text
        this._loadingTextDiv.innerHTML = this._loadingText;

        // Generating keyframes
        this._style = document.createElement("style");
        this._style.type = "text/css";
        const keyFrames = `@-webkit-keyframes spin1 {\
                            0% { -webkit-transform: rotate(0deg);}
                            100% { -webkit-transform: rotate(360deg);}
                        }\
                        @keyframes spin1 {\
                            0% { transform: rotate(0deg);}
                            100% { transform: rotate(360deg);}
                        }`;
        this._style.innerHTML = keyFrames;
        document.getElementsByTagName("head")[0].appendChild(this._style);

        const svgSupport = !!window.SVGSVGElement;
        // Loading img
        const imgBack = new Image();
        if (!DefaultLoadingScreen.DefaultLogoUrl) {
            imgBack.src = !svgSupport
                ? "https://cdn.babylonjs.com/Assets/babylonLogo.png"
                : `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxODAuMTcgMjA4LjA0Ij48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2ZmZjt9LmNscy0ye2ZpbGw6I2UwNjg0Yjt9LmNscy0ze2ZpbGw6I2JiNDY0Yjt9LmNscy00e2ZpbGw6I2UwZGVkODt9LmNscy01e2ZpbGw6I2Q1ZDJjYTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPkJhYnlsb25Mb2dvPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iUGFnZV9FbGVtZW50cyIgZGF0YS1uYW1lPSJQYWdlIEVsZW1lbnRzIj48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik05MC4wOSwwLDAsNTJWMTU2bDkwLjA5LDUyLDkwLjA4LTUyVjUyWiIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtMiIgcG9pbnRzPSIxODAuMTcgNTIuMDEgMTUxLjk3IDM1LjczIDEyNC44NSA1MS4zOSAxNTMuMDUgNjcuNjcgMTgwLjE3IDUyLjAxIi8+PHBvbHlnb24gY2xhc3M9ImNscy0yIiBwb2ludHM9IjI3LjEyIDY3LjY3IDExNy4yMSAxNS42NiA5MC4wOCAwIDAgNTIuMDEgMjcuMTIgNjcuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTIiIHBvaW50cz0iNjEuODkgMTIwLjMgOTAuMDggMTM2LjU4IDExOC4yOCAxMjAuMyA5MC4wOCAxMDQuMDIgNjEuODkgMTIwLjMiLz48cG9seWdvbiBjbGFzcz0iY2xzLTMiIHBvaW50cz0iMTUzLjA1IDY3LjY3IDE1My4wNSAxNDAuMzcgOTAuMDggMTc2LjcyIDI3LjEyIDE0MC4zNyAyNy4xMiA2Ny42NyAwIDUyLjAxIDAgMTU2LjAzIDkwLjA4IDIwOC4wNCAxODAuMTcgMTU2LjAzIDE4MC4xNyA1Mi4wMSAxNTMuMDUgNjcuNjciLz48cG9seWdvbiBjbGFzcz0iY2xzLTMiIHBvaW50cz0iOTAuMDggNzEuNDYgNjEuODkgODcuNzQgNjEuODkgMTIwLjMgOTAuMDggMTA0LjAyIDExOC4yOCAxMjAuMyAxMTguMjggODcuNzQgOTAuMDggNzEuNDYiLz48cG9seWdvbiBjbGFzcz0iY2xzLTQiIHBvaW50cz0iMTUzLjA1IDY3LjY3IDExOC4yOCA4Ny43NCAxMTguMjggMTIwLjMgOTAuMDggMTM2LjU4IDkwLjA4IDE3Ni43MiAxNTMuMDUgMTQwLjM3IDE1My4wNSA2Ny42NyIvPjxwb2x5Z29uIGNsYXNzPSJjbHMtNSIgcG9pbnRzPSIyNy4xMiA2Ny42NyA2MS44OSA4Ny43NCA2MS44OSAxMjAuMyA5MC4wOCAxMzYuNTggOTAuMDggMTc2LjcyIDI3LjEyIDE0MC4zNyAyNy4xMiA2Ny42NyIvPjwvZz48L2c+PC9zdmc+`;
        } else {
            imgBack.src = DefaultLoadingScreen.DefaultLogoUrl;
        }

        imgBack.style.width = "150px";
        imgBack.style.gridColumn = "1";
        imgBack.style.gridRow = "1";
        imgBack.style.top = "50%";
        imgBack.style.left = "50%";
        imgBack.style.transform = "translate(-50%, -50%)";
        imgBack.style.position = "absolute";

        const imageSpinnerContainer = document.createElement("div");
        imageSpinnerContainer.style.width = "300px";
        imageSpinnerContainer.style.gridColumn = "1";
        imageSpinnerContainer.style.gridRow = "1";
        imageSpinnerContainer.style.top = "50%";
        imageSpinnerContainer.style.left = "50%";
        imageSpinnerContainer.style.transform = "translate(-50%, -50%)";
        imageSpinnerContainer.style.position = "absolute";

        // Loading spinner
        const imgSpinner = new Image();

        if (!DefaultLoadingScreen.DefaultSpinnerUrl) {
            imgSpinner.src = !svgSupport
                ? "https://cdn.babylonjs.com/Assets/loadingIcon.png"
                : `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzOTIgMzkyIj48ZGVmcz48c3R5bGU+LmNscy0xe2ZpbGw6I2UwNjg0Yjt9LmNscy0ye2ZpbGw6bm9uZTt9PC9zdHlsZT48L2RlZnM+PHRpdGxlPlNwaW5uZXJJY29uPC90aXRsZT48ZyBpZD0iTGF5ZXJfMiIgZGF0YS1uYW1lPSJMYXllciAyIj48ZyBpZD0iU3Bpbm5lciI+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNNDAuMjEsMTI2LjQzYzMuNy03LjMxLDcuNjctMTQuNDQsMTItMjEuMzJsMy4zNi01LjEsMy41Mi01YzEuMjMtMS42MywyLjQxLTMuMjksMy42NS00LjkxczIuNTMtMy4yMSwzLjgyLTQuNzlBMTg1LjIsMTg1LjIsMCwwLDEsODMuNCw2Ny40M2EyMDgsMjA4LDAsMCwxLDE5LTE1LjY2YzMuMzUtMi40MSw2Ljc0LTQuNzgsMTAuMjUtN3M3LjExLTQuMjgsMTAuNzUtNi4zMmM3LjI5LTQsMTQuNzMtOCwyMi41My0xMS40OSwzLjktMS43Miw3Ljg4LTMuMywxMi00LjY0YTEwNC4yMiwxMDQuMjIsMCwwLDEsMTIuNDQtMy4yMyw2Mi40NCw2Mi40NCwwLDAsMSwxMi43OC0xLjM5QTI1LjkyLDI1LjkyLDAsMCwxLDE5NiwyMS40NGE2LjU1LDYuNTUsMCwwLDEsMi4wNSw5LDYuNjYsNi42NiwwLDAsMS0xLjY0LDEuNzhsLS40MS4yOWEyMi4wNywyMi4wNywwLDAsMS01Ljc4LDMsMzAuNDIsMzAuNDIsMCwwLDEtNS42NywxLjYyLDM3LjgyLDM3LjgyLDAsMCwxLTUuNjkuNzFjLTEsMC0xLjkuMTgtMi44NS4yNmwtMi44NS4yNHEtNS43Mi41MS0xMS40OCwxLjFjLTMuODQuNC03LjcxLjgyLTExLjU4LDEuNGExMTIuMzQsMTEyLjM0LDAsMCwwLTIyLjk0LDUuNjFjLTMuNzIsMS4zNS03LjM0LDMtMTAuOTQsNC42NHMtNy4xNCwzLjUxLTEwLjYsNS41MUExNTEuNiwxNTEuNiwwLDAsMCw2OC41Niw4N0M2Ny4yMyw4OC40OCw2Niw5MCw2NC42NCw5MS41NnMtMi41MSwzLjE1LTMuNzUsNC43M2wtMy41NCw0LjljLTEuMTMsMS42Ni0yLjIzLDMuMzUtMy4zMyw1YTEyNywxMjcsMCwwLDAtMTAuOTMsMjEuNDksMS41OCwxLjU4LDAsMSwxLTMtMS4xNVM0MC4xOSwxMjYuNDcsNDAuMjEsMTI2LjQzWiIvPjxyZWN0IGNsYXNzPSJjbHMtMiIgd2lkdGg9IjM5MiIgaGVpZ2h0PSIzOTIiLz48L2c+PC9nPjwvc3ZnPg==`;
        } else {
            imgSpinner.src = DefaultLoadingScreen.DefaultSpinnerUrl;
        }

        imgSpinner.style.animation = "spin1 0.75s infinite linear";
        imgSpinner.style.transformOrigin = "50% 50%";

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

        imageSpinnerContainer.appendChild(imgSpinner);

        loadingDiv.appendChild(imgBack);
        loadingDiv.appendChild(imageSpinnerContainer);
        loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
        loadingDiv.style.opacity = "1";

        const canvases: Array<HTMLCanvasElement> = [];
        const views = this._engine.views;
        if (views?.length) {
            for (const view of views) {
                if (view.enabled) {
                    canvases.push(view.target);
                }
            }
        } else {
            canvases.push(this._renderingCanvas);
        }
        for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const clonedLoadingDiv = loadingDiv!.cloneNode(true) as HTMLDivElement;
            clonedLoadingDiv.id += `-${i}`;
            this._loadingDivToRenderingCanvasMap.set(clonedLoadingDiv, [canvas, null]);
        }

        this._resizeLoadingUI();

        this._resizeObserver = this._engine.onResizeObservable.add(() => {
            this._resizeLoadingUI();
        });

        this._loadingDivToRenderingCanvasMap.forEach((_, loadingDiv) => {
            document.body.appendChild(loadingDiv);
        });
    }

    /**
     * Function called to hide the loading screen
     */
    public hideLoadingUI(): void {
        if (!this._isLoading) {
            return;
        }

        let completedTransitions = 0;

        const onTransitionEnd = (event: TransitionEvent) => {
            const loadingDiv = event.target as HTMLDivElement;
            // ensure that ending transition event is generated by one of the current loadingDivs
            const isTransitionEndOnLoadingDiv = this._loadingDivToRenderingCanvasMap.has(loadingDiv);

            if (isTransitionEndOnLoadingDiv) {
                completedTransitions++;
                loadingDiv.remove();

                const allTransitionsCompleted = completedTransitions === this._loadingDivToRenderingCanvasMap.size;
                if (allTransitionsCompleted) {
                    if (this._loadingTextDiv) {
                        this._loadingTextDiv.remove();
                        this._loadingTextDiv = null;
                    }
                    if (this._style) {
                        this._style.remove();
                        this._style = null;
                    }

                    window.removeEventListener("transitionend", onTransitionEnd);
                    this._engine!.onResizeObservable.remove(this._resizeObserver);
                    this._loadingDivToRenderingCanvasMap.clear();
                    this._engine = null;
                    this._isLoading = false;
                }
            }
        };

        this._loadingDivToRenderingCanvasMap.forEach((_, loadingDiv) => {
            loadingDiv.style.opacity = "0";
        });

        window.addEventListener("transitionend", onTransitionEnd);
    }

    /**
     * Gets or sets the text to display while loading
     */
    public set loadingUIText(text: string) {
        this._loadingText = text;

        if (this._loadingTextDiv) {
            this._loadingDivToRenderingCanvasMap.forEach((_, loadingDiv) => {
                // set loadingTextDiv of current loadingDiv
                loadingDiv.children[0].innerHTML = this._loadingText;
            });
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

        if (!this._isLoading) {
            return;
        }

        this._loadingDivToRenderingCanvasMap.forEach((_, loadingDiv) => {
            loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
        });
    }

    /**
     * Checks if the layout of the canvas has changed by comparing the current layout
     * rectangle with the previous one.
     *
     * This function compares of the two `DOMRect` objects to determine if any of the layout dimensions have changed.
     * If the layout has changed or if there is no previous layout (i.e., `previousCanvasRect` is `null`),
     * it returns `true`. Otherwise, it returns `false`.
     *
     * @param previousCanvasRect defines the previously recorded `DOMRect` of the canvas, or `null` if no previous state exists.
     * @param currentCanvasRect defines the current `DOMRect` of the canvas to compare against the previous layout.
     * @returns `true` if the layout has changed, otherwise `false`.
     */
    private _isCanvasLayoutChanged(previousCanvasRect: DOMRect | null, currentCanvasRect: DOMRect) {
        return (
            !previousCanvasRect ||
            previousCanvasRect.left !== currentCanvasRect.left ||
            previousCanvasRect.top !== currentCanvasRect.top ||
            previousCanvasRect.right !== currentCanvasRect.right ||
            previousCanvasRect.bottom !== currentCanvasRect.bottom ||
            previousCanvasRect.width !== currentCanvasRect.width ||
            previousCanvasRect.height !== currentCanvasRect.height ||
            previousCanvasRect.x !== currentCanvasRect.x ||
            previousCanvasRect.y !== currentCanvasRect.y
        );
    }

    // Resize
    private _resizeLoadingUI = () => {
        if (!this._isLoading) {
            return;
        }

        this._loadingDivToRenderingCanvasMap.forEach(([canvas, previousCanvasRect], loadingDiv) => {
            const currentCanvasRect = canvas.getBoundingClientRect();
            if (this._isCanvasLayoutChanged(previousCanvasRect, currentCanvasRect)) {
                const canvasPositioning = window.getComputedStyle(canvas).position;

                loadingDiv.style.position = canvasPositioning === "fixed" ? "fixed" : "absolute";
                loadingDiv.style.left = currentCanvasRect.left + window.scrollX + "px";
                loadingDiv.style.top = currentCanvasRect.top + window.scrollY + "px";
                loadingDiv.style.width = currentCanvasRect.width + "px";
                loadingDiv.style.height = currentCanvasRect.height + "px";

                this._loadingDivToRenderingCanvasMap.set(loadingDiv, [canvas, currentCanvasRect]);
            }
        });
    };
}

AbstractEngine.DefaultLoadingScreenFactory = (canvas: HTMLCanvasElement) => {
    return new DefaultLoadingScreen(canvas);
};
