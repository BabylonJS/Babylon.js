module BABYLON {
    export interface IAnimatable {
        animations: Array<Animation>;
    }

    export interface ISize {
        width: number;
        height: number;
    }

    // Screenshots
    var screenshotCanvas: HTMLCanvasElement;

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

        public static SetImmediate(action: () => void) {
            if (window.setImmediate) {
                window.setImmediate(action);
            } else {
                setTimeout(action, 1);
            }
        }

        public static IsExponantOfTwo(value: number): boolean {
            var count = 1;

            do {
                count *= 2;
            } while (count < value);

            return count === value;
        }

        public static GetExponantOfTwo(value: number, max: number): number {
            var count = 1;

            do {
                count *= 2;
            } while (count < value);

            if (count > max)
                count = max;

            return count;
        }

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
                if (child.nodeType === 3) {
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

        public static ExtractMinAndMaxIndexed(positions: number[], indices: number[], indexStart: number, indexCount: number): { minimum: Vector3; maximum: Vector3 } {
            var minimum = new Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var maximum = new Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);

            for (var index = indexStart; index < indexStart + indexCount; index++) {
                var current = new Vector3(positions[indices[index] * 3], positions[indices[index] * 3 + 1], positions[indices[index] * 3 + 2]);

                minimum = Vector3.Minimize(current, minimum);
                maximum = Vector3.Maximize(current, maximum);
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

                minimum = Vector3.Minimize(current, minimum);
                maximum = Vector3.Maximize(current, maximum);
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

            if (url.substr(0, 5) !== "data:")
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
            if (database && database.enableTexturesOffline && Database.IsUASupportingBlobStorage) {
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
                            blobURL = URL.createObjectURL(FilesInput.FilesTextures[textureName], { oneTimeOnly: true });
                        }
                        catch (ex) {
                            // Chrome doesn't support oneTimeOnly parameter
                            blobURL = URL.createObjectURL(FilesInput.FilesTextures[textureName]);
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
        public static LoadFile(url: string, callback: (data: any) => void, progressCallBack?: () => void, database?, useArrayBuffer?: boolean, onError?: () => void): void {
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
                    if (request.readyState === 4) {
                        if (request.status === 200 || Tools.ValidateXHRData(request, !useArrayBuffer ? 1 : 6)) {
                            callback(!useArrayBuffer ? request.responseText : request.response);
                        } else { // Failed
                            if (onError) {
                                onError();
                            } else {

                                throw new Error("Error status: " + request.status + " - Unable to load " + loadUrl);
                            }
                        }
                    }
                };

                request.send(null);
            };

            var loadFromIndexedDB = () => {
                database.loadFileFromDB(url, callback, progressCallBack, noIndexedDB, useArrayBuffer);
            };

            if (url.indexOf("file:") !== -1) {
                var fileName = url.substring(5);
                Tools.ReadFile(FilesInput.FilesToLoad[fileName], callback, progressCallBack, true);
            }
            else {
                // Caching all files
                if (database && database.enableSceneOffline) {
                    database.openAsync(loadFromIndexedDB, noIndexedDB);
                }
                else {
                    noIndexedDB();
                }
            }
        }

        public static ReadFileAsDataURL(fileToLoad, callback, progressCallback): void {
            var reader = new FileReader();
            reader.onload = e => {
                //target doesn't have result from ts 1.3
                callback(e.target['result']);
            };
            reader.onprogress = progressCallback;
            reader.readAsDataURL(fileToLoad);
        }

        public static ReadFile(fileToLoad, callback, progressCallBack, useArrayBuffer?: boolean): void {
            var reader = new FileReader();
            reader.onerror = e => {
                Tools.Log("Error while reading file: " + fileToLoad.name);
                callback(JSON.stringify({ autoClear: true, clearColor: [1, 0, 0], ambientColor: [0, 0, 0], gravity: [0, -9.807, 0], meshes: [], cameras: [], lights: []}));
            };
            reader.onload = e => {
                //target doesn't have result from ts 1.3
                callback(e.target['result']);
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
        public static Clamp(value: number, min = 0, max = 1): number {
            return Math.min(max, Math.max(min, value));
        }

        // Returns -1 when value is a negative number and
        // +1 when value is a positive number. 
        public static Sign(value: number): number {
            value = +value; // convert to a number

            if (value === 0 || isNaN(value))
                return value;

            return value > 0 ? 1 : -1;
        }

        public static Format(value: number, decimals: number = 2): string {
            return value.toFixed(decimals);
        }

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

        public static WithinEpsilon(a: number, b: number, epsilon: number = 1.401298E-45): boolean {
            var num = a - b;
            return -epsilon <= num && num <= epsilon;
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

                if (typeOfSourceValue === "function") {
                    continue;
                }

                if (typeOfSourceValue === "object") {
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

        public static DumpFramebuffer(width: number, height: number, engine: Engine): void {
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
            //cast is due to ts error in lib.d.ts, see here - https://github.com/Microsoft/TypeScript/issues/949
            var castData = <Uint8Array> (<any> imageData.data);
            castData.set(data);
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

                a.addEventListener("click",() => {
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
        }

        public static CreateScreenshot(engine: Engine, camera: Camera, size: any): void {
            var width: number;
            var height: number;

            var scene = camera.getScene();
            var previousCamera: Camera = null;

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
            var texture = new RenderTargetTexture("screenShot", size, scene, false, false);
            texture.renderList = scene.meshes;

            texture.onAfterRender = () => {
                Tools.DumpFramebuffer(width, height, engine);
            };

            scene.incrementRenderId();
            texture.render(true);
            texture.dispose();

            if (previousCamera) {
                scene.activeCamera = previousCamera;
            }
        }

        // XHR response validator for local file scenario
        public static ValidateXHRData(xhr: XMLHttpRequest, dataType = 7): boolean {
            // 1 for text (.babylon, manifest and shaders), 2 for TGA, 4 for DDS, 7 for all

            try {
                if (dataType & 1) {
                    if (xhr.responseText && xhr.responseText.length > 0) {
                        return true;
                    } else if (dataType === 1) {
                        return false;
                    }
                }

                if (dataType & 2) {
                    // Check header width and height since there is no "TGA" magic number
                    var tgaHeader = Internals.TGATools.GetTGAHeader(xhr.response);

                    if (tgaHeader.width && tgaHeader.height && tgaHeader.width > 0 && tgaHeader.height > 0) {
                        return true;
                    } else if (dataType === 2) {
                        return false;
                    }
                }

                if (dataType & 4) {
                    // Check for the "DDS" magic number
                    var ddsHeader = new Uint8Array(xhr.response, 0, 3);

                    if (ddsHeader[0] === 68 && ddsHeader[1] === 68 && ddsHeader[2] === 83) {
                        return true;
                    } else {
                        return false;
                    }
                }

            } catch (e) {
                // Global protection
            }

            return false;
        }

        // Logs
        private static _NoneLogLevel = 0;
        private static _MessageLogLevel = 1;
        private static _WarningLogLevel = 2;
        private static _ErrorLogLevel = 4;
        private static _LogCache = "";

        public static OnNewCacheEntry: (entry: string) => void;

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
            return Tools._MessageLogLevel | Tools._WarningLogLevel | Tools._ErrorLogLevel;
        }

        private static _AddLogEntry(entry: string) {
            Tools._LogCache = entry + Tools._LogCache;

            if (Tools.OnNewCacheEntry) {
                Tools.OnNewCacheEntry(entry);
            }
        }

        private static _FormatMessage(message: string): string {
            var padStr = i => (i < 10) ? "0" + i : "" + i;

            var date = new Date();
            return "[" + padStr(date.getHours()) + ":" + padStr(date.getMinutes()) + ":" + padStr(date.getSeconds()) + "]: " + message;
        }

        public static Log: (message: string) => void = Tools._LogEnabled;

        private static _LogDisabled(message: string): void {
            // nothing to do
        }
        private static _LogEnabled(message: string): void {
            var formattedMessage = Tools._FormatMessage(message);
            console.log("BJS - " + formattedMessage);

            var entry = "<div style='color:white'>" + formattedMessage + "</div><br>";
            Tools._AddLogEntry(entry);
        }

        public static Warn: (message: string) => void = Tools._WarnEnabled;

        private static _WarnDisabled(message: string): void {
            // nothing to do
        }
        private static _WarnEnabled(message: string): void {
            var formattedMessage = Tools._FormatMessage(message);
            console.warn("BJS - " + formattedMessage);

            var entry = "<div style='color:orange'>" + formattedMessage + "</div><br>";
            Tools._AddLogEntry(entry);
        }

        public static Error: (message: string) => void = Tools._ErrorEnabled;

        private static _ErrorDisabled(message: string): void {
            // nothing to do
        }
        private static _ErrorEnabled(message: string): void {
            var formattedMessage = Tools._FormatMessage(message);
            console.error("BJS - " + formattedMessage);

            var entry = "<div style='color:red'>" + formattedMessage + "</div><br>";
            Tools._AddLogEntry(entry);
        }

        public static get LogCache(): string {
            return Tools._LogCache;
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

        // Performances
        private static _PerformanceNoneLogLevel = 0;
        private static _PerformanceUserMarkLogLevel = 1;
        private static _PerformanceConsoleLogLevel = 2;

        private static _performance: Performance = window.performance;

        static get PerformanceNoneLogLevel(): number {
            return Tools._PerformanceNoneLogLevel;
        }

        static get PerformanceUserMarkLogLevel(): number {
            return Tools._PerformanceUserMarkLogLevel;
        }

        static get PerformanceConsoleLogLevel(): number {
            return Tools._PerformanceConsoleLogLevel;
        }

        public static set PerformanceLogLevel(level: number) {
            if ((level & Tools.PerformanceUserMarkLogLevel) === Tools.PerformanceUserMarkLogLevel) {
                Tools.StartPerformanceCounter = Tools._StartUserMark;
                Tools.EndPerformanceCounter = Tools._EndUserMark;
                return;
            }

            if ((level & Tools.PerformanceConsoleLogLevel) === Tools.PerformanceConsoleLogLevel) {
                Tools.StartPerformanceCounter = Tools._StartPerformanceConsole;
                Tools.EndPerformanceCounter = Tools._EndPerformanceConsole;
                return;
            }

            Tools.StartPerformanceCounter = Tools._StartPerformanceCounterDisabled;
            Tools.EndPerformanceCounter = Tools._EndPerformanceCounterDisabled;
        }

        static _StartPerformanceCounterDisabled(counterName: string, condition?: boolean): void {
        }

        static _EndPerformanceCounterDisabled(counterName: string, condition?: boolean): void {
        }

        static _StartUserMark(counterName: string, condition = true): void {
            if (!condition || !Tools._performance.mark) {
                return;
            }
            Tools._performance.mark(counterName + "-Begin");
        }

        static _EndUserMark(counterName: string, condition = true): void {
            if (!condition || !Tools._performance.mark) {
                return;
            }
            Tools._performance.mark(counterName + "-End");
            Tools._performance.measure(counterName, counterName + "-Begin", counterName + "-End");
        }

        static _StartPerformanceConsole(counterName: string, condition = true): void {
            if (!condition) {
                return;
            }

            Tools._StartUserMark(counterName, condition);

            if (console.time) {
                console.time(counterName);
            }
        }

        static _EndPerformanceConsole(counterName: string, condition = true): void {
            if (!condition) {
                return;
            }

            Tools._EndUserMark(counterName, condition);

            if (console.time) {
                console.timeEnd(counterName);
            }
        }

        public static StartPerformanceCounter: (counterName: string, condition?: boolean) => void = Tools._StartPerformanceCounterDisabled;
        public static EndPerformanceCounter: (counterName: string, condition?: boolean) => void = Tools._EndPerformanceCounterDisabled;

        public static get Now(): number {
            if (window.performance && window.performance.now) {
                return window.performance.now();
            }

            return new Date().getTime();
        }

        // Deprecated

        public static GetFps(): number {
            Tools.Warn("Tools.GetFps() is deprecated. Please use engine.getFps() instead");
            return 0;
        }


    }

    /**
     * An implementation of a loop for asynchronous functions.
     */
    export class AsyncLoop {
        public index: number;
        private _done: boolean;

        /**
         * Constroctor.
         * @param iterations the number of iterations.
         * @param _fn the function to run each iteration
         * @param _successCallback the callback that will be called upon succesful execution
         * @param offset starting offset.
         */
        constructor(public iterations: number, private _fn: (asyncLoop: AsyncLoop) => void, private _successCallback: () => void, offset: number = 0) {
            this.index = offset - 1;
            this._done = false;
        }

        /**
         * Execute the next iteration. Must be called after the last iteration was finished.
         */
        public executeNext(): void {
            if (!this._done) {
                if (this.index + 1 < this.iterations) {
                    ++this.index;
                    this._fn(this);
                } else {
                    this.breakLoop();
                }
            }
        }

        /**
         * Break the loop and run the success callback.
         */
        public breakLoop(): void {
            this._done = true;
            this._successCallback();
        }

        /**
         * Helper function
         */
        public static Run(iterations: number, _fn: (asyncLoop: AsyncLoop) => void, _successCallback: () => void, offset: number = 0): AsyncLoop {
            var loop = new AsyncLoop(iterations, _fn, _successCallback, offset);

            loop.executeNext();

            return loop;
        }


        /**
         * A for-loop that will run a given number of iterations synchronous and the rest async.
         * @param iterations total number of iterations
         * @param syncedIterations number of synchronous iterations in each async iteration.
         * @param fn the function to call each iteration.
         * @param callback a success call back that will be called when iterating stops.
         * @param breakFunction a break condition (optional)
         * @param timeout timeout settings for the setTimeout function. default - 0.
         * @constructor
         */
        public static SyncAsyncForLoop(iterations: number, syncedIterations: number, fn: (iteration: number) => void, callback: () => void, breakFunction?: () => boolean, timeout: number = 0) {
            AsyncLoop.Run(Math.ceil(iterations / syncedIterations),(loop: AsyncLoop) => {
                if (breakFunction && breakFunction()) loop.breakLoop();
                else {
                    setTimeout(() => {
                        for (var i = 0; i < syncedIterations; ++i) {
                            var iteration = (loop.index * syncedIterations) + i;
                            if (iteration >= iterations) break;
                            fn(iteration);
                            if (breakFunction && breakFunction()) {
                                loop.breakLoop();
                                break;
                            }
                        }
                        loop.executeNext();
                    }, timeout);
                }
            }, callback);
        }
    }
} 