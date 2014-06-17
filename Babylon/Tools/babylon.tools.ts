// ANY
declare module BABYLON {
    export class Database {
        static isUASupportingBlobStorage: boolean;
    }
}

module BABYLON {

    //class FilesTextures { } //ANY

    export interface IAnimatable {
        animations: Array<Animation>;
    }

    export interface ISize {
        width: number;
        height: number;
    }

    // Screenshots
    var screenshotCanvas: HTMLCanvasElement;

    // FPS
    var fpsRange = 60;
    var previousFramesDuration = [];
    var fps = 60;
    var deltaTime = 0;

    var cloneValue = (source, destinationObject) => {
        if (!source)
            return null;

        if (source instanceof Mesh) {
            return null;
        }

        if (source instanceof SubMesh) {
            return source.clone(destinationObject);
        } else if (source.clone) {
            return source.clone();
        }
        return null;
    };

    export class Tools {
        public static BaseUrl = "";

        public static GetFilename(path: string): string {
            var index = path.lastIndexOf("/");
            if (index < 0)
                return path;

            return path.substring(index + 1);
        }

        public static GetDOMTextContent(element: HTMLElement): string {
            var result = "";
            var child = element.firstChild;

            while (child) {
                if (child.nodeType == 3) {
                    result += child.textContent;
                }
                child = child.nextSibling;
            }

            return result;
        }

        public static ToDegrees(angle: number): number {
            return angle * 180 / Math.PI;
        }

        public static ToRadians(angle: number): number {
            return angle * Math.PI / 180;
        }

        public static ExtractMinAndMaxIndexed(positions: number[], indices: number[], indexStart:number, indexCount: number): { minimum: Vector3; maximum: Vector3 } {
            var minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            for (var index = indexStart; index < indexStart + indexCount; index ++) {
                var current = new Vector3(positions[indices[index] * 3], positions[indices[index] * 3 + 1], positions[indices[index] * 3 + 2]);

                minimum = BABYLON.Vector3.Minimize(current, minimum);
                maximum = BABYLON.Vector3.Maximize(current, maximum);
            }

            return {
                minimum: minimum,
                maximum: maximum
            };
        }

        public static ExtractMinAndMax(positions: number[], start: number, count: number): { minimum: Vector3; maximum: Vector3 } {
            var minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            for (var index = start; index < start + count; index++) {
                var current = new Vector3(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);

                minimum = BABYLON.Vector3.Minimize(current, minimum);
                maximum = BABYLON.Vector3.Maximize(current, maximum);
            }

            return {
                minimum: minimum,
                maximum: maximum
            };
        }

        public static MakeArray(obj, allowsNullUndefined?: boolean): Array<any> {
            if (allowsNullUndefined !== true && (obj === undefined || obj == null))
                return undefined;

            return Array.isArray(obj) ? obj : [obj];
        }

        // Misc.
        public static GetPointerPrefix(): string {
            var eventPrefix = "pointer";

            // Check if hand.js is referenced or if the browser natively supports pointer events
            if (!navigator.pointerEnabled) {
                eventPrefix = "mouse";
            }

            return eventPrefix;
        }

        public static QueueNewFrame(func): void {
            if (window.requestAnimationFrame)
                window.requestAnimationFrame(func);
            else if (window.msRequestAnimationFrame)
                window.msRequestAnimationFrame(func);
            else if (window.webkitRequestAnimationFrame)
                window.webkitRequestAnimationFrame(func);
            else if (window.mozRequestAnimationFrame)
                window.mozRequestAnimationFrame(func);
            else if (window.oRequestAnimationFrame)
                window.oRequestAnimationFrame(func);
            else {
                window.setTimeout(func, 16);
            }
        }

        public static RequestFullscreen(element): void {
            if (element.requestFullscreen)
                element.requestFullscreen();
            else if (element.msRequestFullscreen)
                element.msRequestFullscreen();
            else if (element.webkitRequestFullscreen)
                element.webkitRequestFullscreen();
            else if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();
        }

        public static ExitFullscreen(): void {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
            else if (document.msCancelFullScreen) {
                document.msCancelFullScreen();
            }
        }

        // External files
        public static CleanUrl(url: string): string {
            url = url.replace(/#/mg, "%23");
            return url;
        }

        public static LoadImage(url: string, onload, onerror, database): HTMLImageElement {
            url = Tools.CleanUrl(url);

            var img = new Image();
            img.crossOrigin = 'anonymous';

            img.onload = () => {
                onload(img);
            };

            img.onerror = err => {
                onerror(img, err);
            };

            var noIndexedDB = () => {
                img.src = url;
            };

            var loadFromIndexedDB = () => {
                database.loadImageFromDB(url, img);
            };


            //ANY database to do!
            if (database && database.enableTexturesOffline && BABYLON.Database.isUASupportingBlobStorage) {
                database.openAsync(loadFromIndexedDB, noIndexedDB);
            }
            else {
                if (url.indexOf("file:") === -1) {
                    noIndexedDB();
                }
                else {
                    try {
                        var textureName = url.substring(5);
                        var blobURL;
                        try {
                            blobURL = URL.createObjectURL(BABYLON.FilesInput.FilesTextures[textureName], { oneTimeOnly: true });
                        }
                        catch (ex) {
                            // Chrome doesn't support oneTimeOnly parameter
                            blobURL = URL.createObjectURL(BABYLON.FilesInput.FilesTextures[textureName]);
                        }
                        img.src = blobURL;
                    }
                    catch (e) {
                        Tools.Log("Error while trying to load texture: " + textureName);
                        img.src = null;
                    }
                }
            }

            return img;
        }

        //ANY
        public static LoadFile(url: string, callback: (data: any) => void, progressCallBack?: () => void, database?, useArrayBuffer?: boolean): void {
            url = Tools.CleanUrl(url);

            var noIndexedDB = () => {
                var request = new XMLHttpRequest();
                var loadUrl = Tools.BaseUrl + url;
                request.open('GET', loadUrl, true);

                if (useArrayBuffer) {
                    request.responseType = "arraybuffer";
                }

                request.onprogress = progressCallBack;

                request.onreadystatechange = () => {
                    if (request.readyState == 4) {
                        if (request.status == 200) {
                            callback(!useArrayBuffer ? request.responseText : request.response);
                        } else { // Failed
                            throw new Error("Error status: " + request.status + " - Unable to load " + loadUrl);
                        }
                    }
                };

                request.send(null);
            };

            var loadFromIndexedDB = () => {
                database.loadSceneFromDB(url, callback, progressCallBack, noIndexedDB);
            };

            if (url.indexOf("file:") !== -1) {
                var fileName = url.substring(5);
                BABYLON.Tools.ReadFile(BABYLON.FilesInput.FilesToLoad[fileName], callback, progressCallBack, true);
            }
            else {
                // Caching only scenes files
                if (database && url.indexOf(".babylon") !== -1 && (database.enableSceneOffline)) {
                    database.openAsync(loadFromIndexedDB, noIndexedDB);
                }
                else {
                    noIndexedDB();
                }
            }
        }

        public static ReadFile(fileToLoad, callback, progressCallBack, useArrayBuffer?: boolean): void {
            var reader = new FileReader();
            reader.onload = e => {
                callback(e.target.result);
            };
            reader.onprogress = progressCallBack;
            if (!useArrayBuffer) {
                // Asynchronous read
                reader.readAsText(fileToLoad);
            }
            else {
                reader.readAsArrayBuffer(fileToLoad);
            }
        }

        // Misc.        

        public static CheckExtends(v: Vector3, min: Vector3, max: Vector3): void {
            if (v.x < min.x)
                min.x = v.x;
            if (v.y < min.y)
                min.y = v.y;
            if (v.z < min.z)
                min.z = v.z;

            if (v.x > max.x)
                max.x = v.x;
            if (v.y > max.y)
                max.y = v.y;
            if (v.z > max.z)
                max.z = v.z;
        }

        public static WithinEpsilon(a: number, b: number): boolean {
            var num = a - b;
            return -1.401298E-45 <= num && num <= 1.401298E-45;
        }

        public static DeepCopy(source, destination, doNotCopyList?: string[], mustCopyList?: string[]): void {
            for (var prop in source) {

                if (prop[0] === "_" && (!mustCopyList || mustCopyList.indexOf(prop) === -1)) {
                    continue;
                }

                if (doNotCopyList && doNotCopyList.indexOf(prop) !== -1) {
                    continue;
                }
                var sourceValue = source[prop];
                var typeOfSourceValue = typeof sourceValue;

                if (typeOfSourceValue == "function") {
                    continue;
                }

                if (typeOfSourceValue == "object") {
                    if (sourceValue instanceof Array) {
                        destination[prop] = [];

                        if (sourceValue.length > 0) {
                            if (typeof sourceValue[0] == "object") {
                                for (var index = 0; index < sourceValue.length; index++) {
                                    var clonedValue = cloneValue(sourceValue[index], destination);

                                    if (destination[prop].indexOf(clonedValue) === -1) { // Test if auto inject was not done
                                        destination[prop].push(clonedValue);
                                    }
                                }
                            } else {
                                destination[prop] = sourceValue.slice(0);
                            }
                        }
                    } else {
                        destination[prop] = cloneValue(sourceValue, destination);
                    }
                } else {
                    destination[prop] = sourceValue;
                }
            }
        }

        public static IsEmpty(obj): boolean {
            for (var i in obj) {
                return false;
            }
            return true;
        }

        public static RegisterTopRootEvents(events: { name: string; handler: EventListener }[]): void {
            for (var index = 0; index < events.length; index++) {
                var event = events[index];
                window.addEventListener(event.name, event.handler, false);

                try {
                    if (window.parent) {
                        window.parent.addEventListener(event.name, event.handler, false);
                    }
                } catch (e) {
                    // Silently fails...
                }
            }
        }

        public static UnregisterTopRootEvents(events: { name: string; handler: EventListener }[]): void {
            for (var index = 0; index < events.length; index++) {
                var event = events[index];
                window.removeEventListener(event.name, event.handler);

                try {
                    if (window.parent) {
                        window.parent.removeEventListener(event.name, event.handler);
                    }
                } catch (e) {
                    // Silently fails...
                }
            }
        }

        public static GetFps(): number {
            return fps;
        }

        public static GetDeltaTime(): number {
            return deltaTime;
        }

        public static _MeasureFps(): void {
            previousFramesDuration.push((new Date).getTime());
            var length = previousFramesDuration.length;

            if (length >= 2) {
                deltaTime = previousFramesDuration[length - 1] - previousFramesDuration[length - 2];
            }

            if (length >= fpsRange) {

                if (length > fpsRange) {
                    previousFramesDuration.splice(0, 1);
                    length = previousFramesDuration.length;
                }

                var sum = 0;
                for (var id = 0; id < length - 1; id++) {
                    sum += previousFramesDuration[id + 1] - previousFramesDuration[id];
                }

                fps = 1000.0 / (sum / (length - 1));
            }
        }

        public static CreateScreenshot(engine: Engine, camera: Camera, size: any): void {
            var width: number;
            var height: number;

            var scene = camera.getScene();
            var previousCamera: BABYLON.Camera = null;

            if (scene.activeCamera !== camera) {
                previousCamera = scene.activeCamera;
                scene.activeCamera = camera;
            }

            //If a precision value is specified
            if (size.precision) {
                width = Math.round(engine.getRenderWidth() * size.precision);
                height = Math.round(width / engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            else if (size.width && size.height) {
                width = size.width;
                height = size.height;
            }
            //If passing only width, computing height to keep display canvas ratio.
            else if (size.width && !size.height) {
                width = size.width;
                height = Math.round(width / engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            //If passing only height, computing width to keep display canvas ratio.
            else if (size.height && !size.width) {
                height = size.height;
                width = Math.round(height * engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            //Assuming here that "size" parameter is a number
            else if (!isNaN(size)) {
                height = size;
                width = size;
            }
            else {
                Tools.Error("Invalid 'size' parameter !");
                return;
            }

            //At this point size can be a number, or an object (according to engine.prototype.createRenderTargetTexture method)
            var texture = new RenderTargetTexture("screenShot", size, engine.scenes[0], false, false);
            texture.renderList = engine.scenes[0].meshes;

            texture.onAfterRender = () => {
                // Read the contents of the framebuffer
                var numberOfChannelsByLine = width * 4;
                var halfHeight = height / 2;

                //Reading datas from WebGL
                var data = engine.readPixels(0, 0, width, height);


                //To flip image on Y axis.
                for (var i = 0; i < halfHeight; i++) {
                    for (var j = 0; j < numberOfChannelsByLine; j++) {
                        var currentCell = j + i * numberOfChannelsByLine;
                        var targetLine = height - i - 1;
                        var targetCell = j + targetLine * numberOfChannelsByLine;

                        var temp = data[currentCell];
                        data[currentCell] = data[targetCell];
                        data[targetCell] = temp;
                    }
                }

                // Create a 2D canvas to store the result
                if (!screenshotCanvas) {
                    screenshotCanvas = document.createElement('canvas');
                }
                screenshotCanvas.width = width;
                screenshotCanvas.height = height;
                var context = screenshotCanvas.getContext('2d');

                // Copy the pixels to a 2D canvas
                var imageData = context.createImageData(width, height);
                imageData.data.set(data);
                context.putImageData(imageData, 0, 0);

                var base64Image = screenshotCanvas.toDataURL();

                //Creating a link if the browser have the download attribute on the a tag, to automatically start download generated image.
                if (("download" in document.createElement("a"))) {
                    var a = window.document.createElement("a");
                    a.href = base64Image;
                    var date = new Date();
                    var stringDate = date.getFullYear() + "/" + date.getMonth() + "/" + date.getDate() + "-" + date.getHours() + ":" + date.getMinutes();
                    a.setAttribute("download", "screenshot-" + stringDate + ".png");

                    window.document.body.appendChild(a);

                    a.addEventListener("click", () => {
                        a.parentElement.removeChild(a);
                    });
                    a.click();

                    //Or opening a new tab with the image if it is not possible to automatically start download.
                } else {
                    var newWindow = window.open("");
                    var img = newWindow.document.createElement("img");
                    img.src = base64Image;
                    newWindow.document.body.appendChild(img);
                }

            };

            texture.render(true);
            texture.dispose();

            if (previousCamera) {
                scene.activeCamera = previousCamera;
            }
        }

        // Logs
        private static _NoneLogLevel = 0;
        private static _MessageLogLevel = 1;
        private static _WarningLogLevel = 2;
        private static _ErrorLogLevel = 4;

        static get NoneLogLevel(): number {
            return Tools._NoneLogLevel;
        }

        static get MessageLogLevel(): number {
            return Tools._MessageLogLevel;
        }

        static get WarningLogLevel(): number {
            return Tools._WarningLogLevel;
        }

        static get ErrorLogLevel(): number {
            return Tools._ErrorLogLevel;
        }

        static get AllLogLevel(): number {
            return Tools._MessageLogLevel | Tools._WarningLogLevel | Tools._ErrorLogLevel;;
        }

        private static _FormatMessage(message: string): string {
            var padStr = i => (i < 10) ? "0" + i : "" + i;

            var date = new Date();
            return "BJS - [" + padStr(date.getHours()) + ":" + padStr(date.getMinutes()) + ":" + padStr(date.getSeconds()) + "]: " + message;
        }

        public static Log: (message: string) => void = Tools._LogEnabled;

        private static _LogDisabled(message: string): void {
            // nothing to do
        }
        private static _LogEnabled(message: string): void {
            console.log(Tools._FormatMessage(message));
        }

        public static Warn: (message: string) => void = Tools._WarnEnabled;

        private static _WarnDisabled(message: string): void {
            // nothing to do
        }
        private static _WarnEnabled(message: string): void {
            console.warn(Tools._FormatMessage(message));
        }

        public static Error: (message: string) => void = Tools._ErrorEnabled;

        private static _ErrorDisabled(message: string): void {
            // nothing to do
        }
        private static _ErrorEnabled(message: string): void {
            console.error(Tools._FormatMessage(message));
        }

        public static set LogLevels(level: number) {
            if ((level & Tools.MessageLogLevel) === Tools.MessageLogLevel) {
                Tools.Log = Tools._LogEnabled;
            }
            else {
                Tools.Log = Tools._LogDisabled;
            }

            if ((level & Tools.WarningLogLevel) === Tools.WarningLogLevel) {
                Tools.Warn = Tools._WarnEnabled;
            }
            else {
                Tools.Warn = Tools._WarnDisabled;
            }

            if ((level & Tools.ErrorLogLevel) === Tools.ErrorLogLevel) {
                Tools.Error = Tools._ErrorEnabled;
            }
            else {
                Tools.Error = Tools._ErrorDisabled;
            }
        }
    }
} 