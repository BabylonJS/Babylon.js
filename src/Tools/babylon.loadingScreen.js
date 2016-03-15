var BABYLON;
(function (BABYLON) {
    var DefaultLoadingScreen = (function () {
        function DefaultLoadingScreen(_renderingCanvas, _loadingText, _loadingDivBackgroundColor) {
            var _this = this;
            if (_loadingText === void 0) { _loadingText = ""; }
            if (_loadingDivBackgroundColor === void 0) { _loadingDivBackgroundColor = "black"; }
            this._renderingCanvas = _renderingCanvas;
            this._loadingText = _loadingText;
            this._loadingDivBackgroundColor = _loadingDivBackgroundColor;
            // Resize
            this._resizeLoadingUI = function () {
                var canvasRect = _this._renderingCanvas.getBoundingClientRect();
                _this._loadingDiv.style.position = "absolute";
                _this._loadingDiv.style.left = canvasRect.left + "px";
                _this._loadingDiv.style.top = canvasRect.top + "px";
                _this._loadingDiv.style.width = canvasRect.width + "px";
                _this._loadingDiv.style.height = canvasRect.height + "px";
            };
        }
        DefaultLoadingScreen.prototype.displayLoadingUI = function () {
            var _this = this;
            if (this._loadingDiv) {
                // Do not add a loading screen if there is already one  
                return;
            }
            this._loadingDiv = document.createElement("div");
            this._loadingDiv.id = "babylonjsLoadingDiv";
            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.style.transition = "opacity 1.5s ease";
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
            // Loading img
            var imgBack = new Image();
            imgBack.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjAuM4zml1AAAARbSURBVHhe7Z09aFNRFMc716kuLrq4FdyLq4Wi4CAoRQcR0UJBUBdRiuLSIYMo6CA4FF2sgw6CFAdFUOpSQYcWO4hD26UQCfXrIQrx/JJzw1OSWq3NPeL/B4Fy+0jg/HO+7j3vpUcI8b/Q39+/49ihfWdPHT94Yf/e3Se3bd263f8lus218TPn6vV6Ya8Wi/MzNRNmj18iusX9W1evmP1/EKNEIVG6CMbG6E3bt+fT++pHha8NoHdT72bLE8NDg7tGU64gLLndV4Wc4m8j/pS+vr4tGB/DT16v3Fyr8dvBe/jbit8BL0AES9LX1iPAz+BR/hFiLVCynj95dPzNy6fv3IZ/k4L3948Sq7FzYGBg4vLFGxitabuOFCbWNKGrMnbiUuo18KaV6tIHv6YtvL9/nOgE31jCktmrY7k6+/zhE4yP4Vf7hiNqh/BWWEl8mzDol4p22Lf7cIdvdUMEvv0Y2S9fE5S1hLzpqTsPkiep//gFGPnR3Yl7GL5p/xYFBrTwM+iXio3GqpwDGL5p/xYNIX7XG8Q6IJRgdIzf1KBBgafII7oMidhyQtVFaMA2Bt7il4huQRhaXphbcR2g4RXqBzKAGHiCCwGFVUAj/m/RTRDj29cvn10I0PZ3LghH5f4CL1EFlQmqqXK3jDDKFxmhQ3Yt6oQseUZGKmMnTpsOqc8o1F9kBOMjQlOLeqEeIyOc6JV6jYLJD/+XyIFvnzdgl9aXRQ5I2qZDK1SpospMqaoqON/wZZGDciLnMMiXRS7IF4hhqMTNTdk7CFu+LHLhR7BQqBvPDJUUQqCGvCMATHUgBmhWNgApmdOda9YpM+VwRYfuyyIXDK8hBlilNerLIheMZCKGwlUAyru6GlwOgPUbRxADdJ9FAChxXY864viyyEXqPxhc0M2TAfAbatSdRyHtXymhByEdRnE3ky+JnHAIhSA0h74kckETmHoQbSgGwJrCIRMEPSRIBCRIMAhZaYhaggQhJXUJEoRU9mofKwh+F22dLRRfEjlJM7w6KQwCoQpBOKTyJZETjmwRxKqtGV8SOSkNOGjKPQppBEgDDkFgpxdBVGkFgaYQQXRIFQSObk0P5ZFIpAZRHXsQ0r0hCluBWKkuvVbYCkQaCdL5ehBScudJP4yY+rLISdps1NBDEJKXMMmoSfggWC4ZQRR17oFYXph7hSiquIKQ+hJGTX1J5MYSPD/GVdNzsgLBwZVCVyAQAkF0ohiI/c1fS6tNXq9UfEnkhudmIQolsS+J3Hh/UtNDzQLhj42VKJFInqLwFYiUU5ToA+HdfI0JevUpQUAIn+vSz2lHIuUV/dJOIHhOY/IWVWGBIHQtzs88s9zyWBuTgcBLzGOmeNnfF/QslSDgMeQW85i3DOQxuipxAkCyZ8SIm4Omp+7MMlCB59j6sKZcMoM4iIEoeI2J9AKxrFobZx0v4vYInuHFS4J1GQRCAGaLEYQXfyMML5XSQgghhBBCCCH+cXp6vgNhKpSKX/XdOAAAAABJRU5ErkJggg==";
            imgBack.style.position = "absolute";
            imgBack.style.left = "50%";
            imgBack.style.top = "50%";
            imgBack.style.marginLeft = "-50px";
            imgBack.style.marginTop = "-50px";
            imgBack.style.transition = "transform 1.0s ease";
            imgBack.style.webkitTransition = "-webkit-transform 1.0s ease";
            var deg = 360;
            var onTransitionEnd = function () {
                deg += 360;
                imgBack.style.transform = "rotateZ(" + deg + "deg)";
                imgBack.style.webkitTransform = "rotateZ(" + deg + "deg)";
            };
            imgBack.addEventListener("transitionend", onTransitionEnd);
            imgBack.addEventListener("webkitTransitionEnd", onTransitionEnd);
            this._loadingDiv.appendChild(imgBack);
            // front image
            var imgFront = new Image();
            imgFront.src = "data:image/png;base64,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";
            imgFront.style.position = "absolute";
            imgFront.style.left = "50%";
            imgFront.style.top = "50%";
            imgFront.style.marginLeft = "-50px";
            imgFront.style.marginTop = "-50px";
            this._loadingDiv.appendChild(imgFront);
            this._resizeLoadingUI();
            window.addEventListener("resize", this._resizeLoadingUI);
            this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
            document.body.appendChild(this._loadingDiv);
            setTimeout(function () {
                _this._loadingDiv.style.opacity = "1";
                imgBack.style.transform = "rotateZ(360deg)";
                imgBack.style.webkitTransform = "rotateZ(360deg)";
            }, 0);
        };
        DefaultLoadingScreen.prototype.hideLoadingUI = function () {
            var _this = this;
            if (!this._loadingDiv) {
                return;
            }
            var onTransitionEnd = function () {
                if (!_this._loadingDiv) {
                    return;
                }
                document.body.removeChild(_this._loadingDiv);
                window.removeEventListener("resize", _this._resizeLoadingUI);
                _this._loadingDiv = null;
            };
            this._loadingDiv.style.opacity = "0";
            this._loadingDiv.addEventListener("transitionend", onTransitionEnd);
        };
        Object.defineProperty(DefaultLoadingScreen.prototype, "loadingUIText", {
            set: function (text) {
                this._loadingText = text;
                if (this._loadingTextDiv) {
                    this._loadingTextDiv.innerHTML = this._loadingText;
                }
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(DefaultLoadingScreen.prototype, "loadingUIBackgroundColor", {
            get: function () {
                return this._loadingDivBackgroundColor;
            },
            set: function (color) {
                this._loadingDivBackgroundColor = color;
                if (!this._loadingDiv) {
                    return;
                }
                this._loadingDiv.style.backgroundColor = this._loadingDivBackgroundColor;
            },
            enumerable: true,
            configurable: true
        });
        return DefaultLoadingScreen;
    })();
    BABYLON.DefaultLoadingScreen = DefaultLoadingScreen;
})(BABYLON || (BABYLON = {}));
