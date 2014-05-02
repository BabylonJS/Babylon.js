module BABYLON {

    declare var FilesTextures; //ANY

    export interface IAnimatable {
        animations: Array<Animation>;
    }

    export interface ISize {
        width: number;
        height: number;
    }

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
        public static LoadImage(url: string, onload, onerror, database): HTMLImageElement {
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
            if (database && database.enableTexturesOffline) { //ANY } && BABYLON.Database.isUASupportingBlobStorage) {
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
                            blobURL = URL.createObjectURL(FilesTextures[textureName], { oneTimeOnly: true });
                        }
                        catch (ex) {
                            // Chrome doesn't support oneTimeOnly parameter
                            blobURL = URL.createObjectURL(FilesTextures[textureName]);
                        }
                        img.src = blobURL;
                    }
                    catch (e) {
                        console.log("Error while trying to load texture: " + textureName);
                        img.src = null;
                    }
                }
            }

            return img;
        }

        //ANY
        public static LoadFile(url: string, callback: (data: any) => void, progressCallBack?: () => void, database?, useArrayBuffer?: boolean): void {
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

            // Caching only scenes files
            if (database && url.indexOf(".babylon") !== -1 && (database.enableSceneOffline)) {
                database.openAsync(loadFromIndexedDB, noIndexedDB);
            }
            else {
                noIndexedDB();
            }
        }

        public static ReadFile(fileToLoad, callback, progressCallBack): void {
            var reader = new FileReader();
            reader.onload = e => {
                callback(e.target.result);
            };
            reader.onprogress = progressCallBack;
            // Asynchronous read
            reader.readAsText(fileToLoad);
        }

        // Misc.        
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
    }
} 