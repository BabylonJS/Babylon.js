module BABYLON {

    export interface ILoadingScreen {
        displayLoadingUI: () => void;
        hideLoadingUI: () => void;
        //default loader support
        loadingUIBackgroundColor: string;
        loadingUIText: string;

    }

    export class DefaultLoadingScreen implements ILoadingScreen {

        private _loadingDiv: Nullable<HTMLDivElement>;
        private _loadingTextDiv: HTMLDivElement;

        constructor(private _renderingCanvas: HTMLCanvasElement, private _loadingText = "", private _loadingDivBackgroundColor = "black") {

        }

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
            imgBack.src = "data:image/png;base64,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";

            imgBack.style.position = "absolute";
            imgBack.style.left = "50%";
            imgBack.style.top = "50%";
            imgBack.style.marginLeft = "-60px";
            imgBack.style.marginTop = "-60px";
            imgBack.style.animation = "spin1 2s infinite ease-in-out";
            imgBack.style.webkitAnimation = "spin1 2s infinite ease-in-out";
            imgBack.style.transformOrigin = "50% 50%";
            imgBack.style.webkitTransformOrigin = "50% 50%";
            
            this._loadingDiv.appendChild(imgBack);

            this._resizeLoadingUI();

            window.addEventListener("resize", this._resizeLoadingUI);

            this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
            document.body.appendChild(this._loadingDiv);

            this._loadingDiv.style.opacity = "1";
        }

        public hideLoadingUI(): void {
            if (!this._loadingDiv) {
                return;
            }

            var onTransitionEnd = () => {
                if (!this._loadingDiv) {
                    return;
                }
                document.body.removeChild(this._loadingDiv);
                window.removeEventListener("resize", this._resizeLoadingUI);

                this._loadingDiv = null;
            }

            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.addEventListener("transitionend", onTransitionEnd);
        }

        public set loadingUIText(text: string) {
            this._loadingText = text;

            if (this._loadingTextDiv) {
                this._loadingTextDiv.innerHTML = this._loadingText;
            }
        }

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

}