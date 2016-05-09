var BABYLON;
(function (BABYLON) {
    // Screenshots
    var screenshotCanvas;
    var cloneValue = function (source, destinationObject) {
        if (!source)
            return null;
        if (source instanceof BABYLON.Mesh) {
            return null;
        }
        if (source instanceof BABYLON.SubMesh) {
            return source.clone(destinationObject);
        }
        else if (source.clone) {
            return source.clone();
        }
        return null;
    };
    var Tools = (function () {
        function Tools() {
        }
        Tools.Instantiate = function (className) {
            var arr = className.split(".");
            var fn = (window || this);
            for (var i = 0, len = arr.length; i < len; i++) {
                fn = fn[arr[i]];
            }
            if (typeof fn !== "function") {
                return null;
            }
            return fn;
        };
        Tools.SetImmediate = function (action) {
            if (window.setImmediate) {
                window.setImmediate(action);
            }
            else {
                setTimeout(action, 1);
            }
        };
        Tools.IsExponentOfTwo = function (value) {
            var count = 1;
            do {
                count *= 2;
            } while (count < value);
            return count === value;
        };
        Tools.GetExponentOfTwo = function (value, max) {
            var count = 1;
            do {
                count *= 2;
            } while (count < value);
            if (count > max)
                count = max;
            return count;
        };
        Tools.GetFilename = function (path) {
            var index = path.lastIndexOf("/");
            if (index < 0)
                return path;
            return path.substring(index + 1);
        };
        Tools.GetDOMTextContent = function (element) {
            var result = "";
            var child = element.firstChild;
            while (child) {
                if (child.nodeType === 3) {
                    result += child.textContent;
                }
                child = child.nextSibling;
            }
            return result;
        };
        Tools.ToDegrees = function (angle) {
            return angle * 180 / Math.PI;
        };
        Tools.ToRadians = function (angle) {
            return angle * Math.PI / 180;
        };
        Tools.EncodeArrayBufferTobase64 = function (buffer) {
            var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
            var output = "";
            var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
            var i = 0;
            var bytes = new Uint8Array(buffer);
            while (i < bytes.length) {
                chr1 = bytes[i++];
                chr2 = i < bytes.length ? bytes[i++] : Number.NaN; // Not sure if the index 
                chr3 = i < bytes.length ? bytes[i++] : Number.NaN; // checks are needed here
                enc1 = chr1 >> 2;
                enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
                enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
                enc4 = chr3 & 63;
                if (isNaN(chr2)) {
                    enc3 = enc4 = 64;
                }
                else if (isNaN(chr3)) {
                    enc4 = 64;
                }
                output += keyStr.charAt(enc1) + keyStr.charAt(enc2) +
                    keyStr.charAt(enc3) + keyStr.charAt(enc4);
            }
            return "data:image/png;base64," + output;
        };
        Tools.ExtractMinAndMaxIndexed = function (positions, indices, indexStart, indexCount, bias) {
            if (bias === void 0) { bias = null; }
            var minimum = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var maximum = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = indexStart; index < indexStart + indexCount; index++) {
                var current = new BABYLON.Vector3(positions[indices[index] * 3], positions[indices[index] * 3 + 1], positions[indices[index] * 3 + 2]);
                minimum = BABYLON.Vector3.Minimize(current, minimum);
                maximum = BABYLON.Vector3.Maximize(current, maximum);
            }
            if (bias) {
                minimum.x -= minimum.x * bias.x + bias.y;
                minimum.y -= minimum.y * bias.x + bias.y;
                minimum.z -= minimum.z * bias.x + bias.y;
                maximum.x += maximum.x * bias.x + bias.y;
                maximum.y += maximum.y * bias.x + bias.y;
                maximum.z += maximum.z * bias.x + bias.y;
            }
            return {
                minimum: minimum,
                maximum: maximum
            };
        };
        Tools.ExtractMinAndMax = function (positions, start, count, bias) {
            if (bias === void 0) { bias = null; }
            var minimum = new BABYLON.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
            var maximum = new BABYLON.Vector3(-Number.MAX_VALUE, -Number.MAX_VALUE, -Number.MAX_VALUE);
            for (var index = start; index < start + count; index++) {
                var current = new BABYLON.Vector3(positions[index * 3], positions[index * 3 + 1], positions[index * 3 + 2]);
                minimum = BABYLON.Vector3.Minimize(current, minimum);
                maximum = BABYLON.Vector3.Maximize(current, maximum);
            }
            if (bias) {
                minimum.x -= minimum.x * bias.x + bias.y;
                minimum.y -= minimum.y * bias.x + bias.y;
                minimum.z -= minimum.z * bias.x + bias.y;
                maximum.x += maximum.x * bias.x + bias.y;
                maximum.y += maximum.y * bias.x + bias.y;
                maximum.z += maximum.z * bias.x + bias.y;
            }
            return {
                minimum: minimum,
                maximum: maximum
            };
        };
        Tools.MakeArray = function (obj, allowsNullUndefined) {
            if (allowsNullUndefined !== true && (obj === undefined || obj == null))
                return undefined;
            return Array.isArray(obj) ? obj : [obj];
        };
        // Misc.
        Tools.GetPointerPrefix = function () {
            var eventPrefix = "pointer";
            // Check if pointer events are supported
            if (!window.PointerEvent && !navigator.pointerEnabled) {
                eventPrefix = "mouse";
            }
            return eventPrefix;
        };
        Tools.QueueNewFrame = function (func) {
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
        };
        Tools.RequestFullscreen = function (element) {
            if (element.requestFullscreen)
                element.requestFullscreen();
            else if (element.msRequestFullscreen)
                element.msRequestFullscreen();
            else if (element.webkitRequestFullscreen)
                element.webkitRequestFullscreen();
            else if (element.mozRequestFullScreen)
                element.mozRequestFullScreen();
        };
        Tools.ExitFullscreen = function () {
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
        };
        // External files
        Tools.CleanUrl = function (url) {
            url = url.replace(/#/mg, "%23");
            return url;
        };
        Tools.LoadImage = function (url, onload, onerror, database) {
            if (url instanceof ArrayBuffer) {
                url = Tools.EncodeArrayBufferTobase64(url);
            }
            url = Tools.CleanUrl(url);
            var img = new Image();
            if (url.substr(0, 5) !== "data:") {
                if (Tools.CorsBehavior) {
                    switch (typeof (Tools.CorsBehavior)) {
                        case "function":
                            var result = Tools.CorsBehavior(url);
                            if (result) {
                                img.crossOrigin = result;
                            }
                            break;
                        case "string":
                        default:
                            img.crossOrigin = Tools.CorsBehavior;
                            break;
                    }
                }
            }
            img.onload = function () {
                onload(img);
            };
            img.onerror = function (err) {
                Tools.Error("Error while trying to load texture: " + url);
                if (Tools.UseFallbackTexture) {
                    img.src = "data:image/jpg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/4QBmRXhpZgAATU0AKgAAAAgABAEaAAUAAAABAAAAPgEbAAUAAAABAAAARgEoAAMAAAABAAIAAAExAAIAAAAQAAAATgAAAAAAAABgAAAAAQAAAGAAAAABcGFpbnQubmV0IDQuMC41AP/bAEMABAIDAwMCBAMDAwQEBAQFCQYFBQUFCwgIBgkNCw0NDQsMDA4QFBEODxMPDAwSGBITFRYXFxcOERkbGRYaFBYXFv/bAEMBBAQEBQUFCgYGChYPDA8WFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFhYWFv/AABEIAQABAAMBIgACEQEDEQH/xAAfAAABBQEBAQEBAQAAAAAAAAAAAQIDBAUGBwgJCgv/xAC1EAACAQMDAgQDBQUEBAAAAX0BAgMABBEFEiExQQYTUWEHInEUMoGRoQgjQrHBFVLR8CQzYnKCCQoWFxgZGiUmJygpKjQ1Njc4OTpDREVGR0hJSlNUVVZXWFlaY2RlZmdoaWpzdHV2d3h5eoOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4eLj5OXm5+jp6vHy8/T19vf4+fr/xAAfAQADAQEBAQEBAQEBAAAAAAAAAQIDBAUGBwgJCgv/xAC1EQACAQIEBAMEBwUEBAABAncAAQIDEQQFITEGEkFRB2FxEyIygQgUQpGhscEJIzNS8BVictEKFiQ04SXxFxgZGiYnKCkqNTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqCg4SFhoeIiYqSk5SVlpeYmZqio6Slpqeoqaqys7S1tre4ubrCw8TFxsfIycrS09TV1tfY2dri4+Tl5ufo6ery8/T19vf4+fr/2gAMAwEAAhEDEQA/APH6KKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76CiiigD5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BQooooA+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/voKKKKAPl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FCiiigD6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++gooooA+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gUKKKKAPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76Pl+iiivuj+BT6gooor4U/vo+X6KKK+6P4FPqCiiivhT++j5fooor7o/gU+oKKKK+FP76P//Z";
                    onload(img);
                }
                else {
                    onerror();
                }
            };
            var noIndexedDB = function () {
                img.src = url;
            };
            var loadFromIndexedDB = function () {
                database.loadImageFromDB(url, img);
            };
            //ANY database to do!
            if (url.substr(0, 5) !== "data:" && database && database.enableTexturesOffline && BABYLON.Database.IsUASupportingBlobStorage) {
                database.openAsync(loadFromIndexedDB, noIndexedDB);
            }
            else {
                if (url.indexOf("file:") === -1) {
                    noIndexedDB();
                }
                else {
                    try {
                        var textureName = url.substring(5).toLowerCase();
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
                        img.src = null;
                    }
                }
            }
            return img;
        };
        //ANY
        Tools.LoadFile = function (url, callback, progressCallBack, database, useArrayBuffer, onError) {
            url = Tools.CleanUrl(url);
            var noIndexedDB = function () {
                var request = new XMLHttpRequest();
                var loadUrl = Tools.BaseUrl + url;
                request.open('GET', loadUrl, true);
                if (useArrayBuffer) {
                    request.responseType = "arraybuffer";
                }
                request.onprogress = progressCallBack;
                request.onreadystatechange = function () {
                    if (request.readyState === 4) {
                        if (request.status === 200 || Tools.ValidateXHRData(request, !useArrayBuffer ? 1 : 6)) {
                            callback(!useArrayBuffer ? request.responseText : request.response);
                        }
                        else {
                            if (onError) {
                                onError();
                            }
                            else {
                                throw new Error("Error status: " + request.status + " - Unable to load " + loadUrl);
                            }
                        }
                    }
                };
                request.send(null);
            };
            var loadFromIndexedDB = function () {
                database.loadFileFromDB(url, callback, progressCallBack, noIndexedDB, useArrayBuffer);
            };
            if (url.indexOf("file:") !== -1) {
                var fileName = url.substring(5).toLowerCase();
                Tools.ReadFile(BABYLON.FilesInput.FilesToLoad[fileName], callback, progressCallBack, useArrayBuffer);
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
        };
        Tools.ReadFileAsDataURL = function (fileToLoad, callback, progressCallback) {
            var reader = new FileReader();
            reader.onload = function (e) {
                //target doesn't have result from ts 1.3
                callback(e.target['result']);
            };
            reader.onprogress = progressCallback;
            reader.readAsDataURL(fileToLoad);
        };
        Tools.ReadFile = function (fileToLoad, callback, progressCallBack, useArrayBuffer) {
            var reader = new FileReader();
            reader.onerror = function (e) {
                Tools.Log("Error while reading file: " + fileToLoad.name);
                callback(JSON.stringify({ autoClear: true, clearColor: [1, 0, 0], ambientColor: [0, 0, 0], gravity: [0, -9.807, 0], meshes: [], cameras: [], lights: [] }));
            };
            reader.onload = function (e) {
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
        };
        //returns a downloadable url to a file content.
        Tools.FileAsURL = function (content) {
            var fileBlob = new Blob([content]);
            var url = window.URL || window.webkitURL;
            var link = url.createObjectURL(fileBlob);
            return link;
        };
        // Misc.
        Tools.Format = function (value, decimals) {
            if (decimals === void 0) { decimals = 2; }
            return value.toFixed(decimals);
        };
        Tools.CheckExtends = function (v, min, max) {
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
        };
        Tools.DeepCopy = function (source, destination, doNotCopyList, mustCopyList) {
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
                                    if (destination[prop].indexOf(clonedValue) === -1) {
                                        destination[prop].push(clonedValue);
                                    }
                                }
                            }
                            else {
                                destination[prop] = sourceValue.slice(0);
                            }
                        }
                    }
                    else {
                        destination[prop] = cloneValue(sourceValue, destination);
                    }
                }
                else {
                    destination[prop] = sourceValue;
                }
            }
        };
        Tools.IsEmpty = function (obj) {
            for (var i in obj) {
                return false;
            }
            return true;
        };
        Tools.RegisterTopRootEvents = function (events) {
            for (var index = 0; index < events.length; index++) {
                var event = events[index];
                window.addEventListener(event.name, event.handler, false);
                try {
                    if (window.parent) {
                        window.parent.addEventListener(event.name, event.handler, false);
                    }
                }
                catch (e) {
                }
            }
        };
        Tools.UnregisterTopRootEvents = function (events) {
            for (var index = 0; index < events.length; index++) {
                var event = events[index];
                window.removeEventListener(event.name, event.handler);
                try {
                    if (window.parent) {
                        window.parent.removeEventListener(event.name, event.handler);
                    }
                }
                catch (e) {
                }
            }
        };
        Tools.DumpFramebuffer = function (width, height, engine, successCallback) {
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
            var castData = imageData.data;
            castData.set(data);
            context.putImageData(imageData, 0, 0);
            var base64Image = screenshotCanvas.toDataURL();
            if (successCallback) {
                successCallback(base64Image);
            }
            else {
                //Creating a link if the browser have the download attribute on the a tag, to automatically start download generated image.
                if (("download" in document.createElement("a"))) {
                    var a = window.document.createElement("a");
                    a.href = base64Image;
                    var date = new Date();
                    var stringDate = (date.getFullYear() + "-" + (date.getMonth() + 1)).slice(-2) + "-" + date.getDate() + "_" + date.getHours() + "-" + ('0' + date.getMinutes()).slice(-2);
                    a.setAttribute("download", "screenshot_" + stringDate + ".png");
                    window.document.body.appendChild(a);
                    a.addEventListener("click", function () {
                        a.parentElement.removeChild(a);
                    });
                    a.click();
                }
                else {
                    var newWindow = window.open("");
                    var img = newWindow.document.createElement("img");
                    img.src = base64Image;
                    newWindow.document.body.appendChild(img);
                }
            }
        };
        Tools.CreateScreenshot = function (engine, camera, size, successCallback) {
            var width;
            var height;
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
            else if (size.width && !size.height) {
                width = size.width;
                height = Math.round(width / engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            else if (size.height && !size.width) {
                height = size.height;
                width = Math.round(height * engine.getAspectRatio(camera));
                size = { width: width, height: height };
            }
            else if (!isNaN(size)) {
                height = size;
                width = size;
            }
            else {
                Tools.Error("Invalid 'size' parameter !");
                return;
            }
            var scene = camera.getScene();
            var previousCamera = null;
            if (scene.activeCamera !== camera) {
                previousCamera = scene.activeCamera;
                scene.activeCamera = camera;
            }
            //At this point size can be a number, or an object (according to engine.prototype.createRenderTargetTexture method)
            var texture = new BABYLON.RenderTargetTexture("screenShot", size, scene, false, false);
            texture.renderList = scene.meshes;
            texture.onAfterRender = function () {
                Tools.DumpFramebuffer(width, height, engine, successCallback);
            };
            scene.incrementRenderId();
            texture.render(true);
            texture.dispose();
            if (previousCamera) {
                scene.activeCamera = previousCamera;
            }
            camera.getProjectionMatrix(true); // Force cache refresh;
        };
        // XHR response validator for local file scenario
        Tools.ValidateXHRData = function (xhr, dataType) {
            // 1 for text (.babylon, manifest and shaders), 2 for TGA, 4 for DDS, 7 for all
            if (dataType === void 0) { dataType = 7; }
            try {
                if (dataType & 1) {
                    if (xhr.responseText && xhr.responseText.length > 0) {
                        return true;
                    }
                    else if (dataType === 1) {
                        return false;
                    }
                }
                if (dataType & 2) {
                    // Check header width and height since there is no "TGA" magic number
                    var tgaHeader = BABYLON.Internals.TGATools.GetTGAHeader(xhr.response);
                    if (tgaHeader.width && tgaHeader.height && tgaHeader.width > 0 && tgaHeader.height > 0) {
                        return true;
                    }
                    else if (dataType === 2) {
                        return false;
                    }
                }
                if (dataType & 4) {
                    // Check for the "DDS" magic number
                    var ddsHeader = new Uint8Array(xhr.response, 0, 3);
                    if (ddsHeader[0] === 68 && ddsHeader[1] === 68 && ddsHeader[2] === 83) {
                        return true;
                    }
                    else {
                        return false;
                    }
                }
            }
            catch (e) {
            }
            return false;
        };
        Object.defineProperty(Tools, "NoneLogLevel", {
            get: function () {
                return Tools._NoneLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "MessageLogLevel", {
            get: function () {
                return Tools._MessageLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "WarningLogLevel", {
            get: function () {
                return Tools._WarningLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "ErrorLogLevel", {
            get: function () {
                return Tools._ErrorLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "AllLogLevel", {
            get: function () {
                return Tools._MessageLogLevel | Tools._WarningLogLevel | Tools._ErrorLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Tools._AddLogEntry = function (entry) {
            Tools._LogCache = entry + Tools._LogCache;
            if (Tools.OnNewCacheEntry) {
                Tools.OnNewCacheEntry(entry);
            }
        };
        Tools._FormatMessage = function (message) {
            var padStr = function (i) { return (i < 10) ? "0" + i : "" + i; };
            var date = new Date();
            return "[" + padStr(date.getHours()) + ":" + padStr(date.getMinutes()) + ":" + padStr(date.getSeconds()) + "]: " + message;
        };
        Tools._LogDisabled = function (message) {
            // nothing to do
        };
        Tools._LogEnabled = function (message) {
            var formattedMessage = Tools._FormatMessage(message);
            console.log("BJS - " + formattedMessage);
            var entry = "<div style='color:white'>" + formattedMessage + "</div><br>";
            Tools._AddLogEntry(entry);
        };
        Tools._WarnDisabled = function (message) {
            // nothing to do
        };
        Tools._WarnEnabled = function (message) {
            var formattedMessage = Tools._FormatMessage(message);
            console.warn("BJS - " + formattedMessage);
            var entry = "<div style='color:orange'>" + formattedMessage + "</div><br>";
            Tools._AddLogEntry(entry);
        };
        Tools._ErrorDisabled = function (message) {
            // nothing to do
        };
        Tools._ErrorEnabled = function (message) {
            Tools.errorsCount++;
            var formattedMessage = Tools._FormatMessage(message);
            console.error("BJS - " + formattedMessage);
            var entry = "<div style='color:red'>" + formattedMessage + "</div><br>";
            Tools._AddLogEntry(entry);
        };
        Object.defineProperty(Tools, "LogCache", {
            get: function () {
                return Tools._LogCache;
            },
            enumerable: true,
            configurable: true
        });
        Tools.ClearLogCache = function () {
            Tools._LogCache = "";
            Tools.errorsCount = 0;
        };
        Object.defineProperty(Tools, "LogLevels", {
            set: function (level) {
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
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "PerformanceNoneLogLevel", {
            get: function () {
                return Tools._PerformanceNoneLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "PerformanceUserMarkLogLevel", {
            get: function () {
                return Tools._PerformanceUserMarkLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "PerformanceConsoleLogLevel", {
            get: function () {
                return Tools._PerformanceConsoleLogLevel;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Tools, "PerformanceLogLevel", {
            set: function (level) {
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
            },
            enumerable: true,
            configurable: true
        });
        Tools._StartPerformanceCounterDisabled = function (counterName, condition) {
        };
        Tools._EndPerformanceCounterDisabled = function (counterName, condition) {
        };
        Tools._StartUserMark = function (counterName, condition) {
            if (condition === void 0) { condition = true; }
            if (!condition || !Tools._performance.mark) {
                return;
            }
            Tools._performance.mark(counterName + "-Begin");
        };
        Tools._EndUserMark = function (counterName, condition) {
            if (condition === void 0) { condition = true; }
            if (!condition || !Tools._performance.mark) {
                return;
            }
            Tools._performance.mark(counterName + "-End");
            Tools._performance.measure(counterName, counterName + "-Begin", counterName + "-End");
        };
        Tools._StartPerformanceConsole = function (counterName, condition) {
            if (condition === void 0) { condition = true; }
            if (!condition) {
                return;
            }
            Tools._StartUserMark(counterName, condition);
            if (console.time) {
                console.time(counterName);
            }
        };
        Tools._EndPerformanceConsole = function (counterName, condition) {
            if (condition === void 0) { condition = true; }
            if (!condition) {
                return;
            }
            Tools._EndUserMark(counterName, condition);
            if (console.time) {
                console.timeEnd(counterName);
            }
        };
        Object.defineProperty(Tools, "Now", {
            get: function () {
                if (window.performance && window.performance.now) {
                    return window.performance.now();
                }
                return new Date().getTime();
            },
            enumerable: true,
            configurable: true
        });
        /**
         * This method will return the name of the class used to create the instance of the given object.
         * It will works only on Javascript basic data types (number, string, ...) and instance of class declared with the @className decorator.
         * @param object the object to get the class name from
         * @return the name of the class, will be "object" for a custom data type not using the @className decorator
         */
        Tools.getClassName = function (object, isType) {
            if (isType === void 0) { isType = false; }
            var name = null;
            if (object instanceof Object) {
                var classObj = isType ? object : Object.getPrototypeOf(object);
                name = classObj.constructor["__bjsclassName__"];
            }
            if (!name) {
                name = typeof object;
            }
            return name;
        };
        Tools.first = function (array, predicate) {
            for (var _i = 0; _i < array.length; _i++) {
                var el = array[_i];
                if (predicate(el)) {
                    return el;
                }
            }
        };
        Tools.BaseUrl = "";
        Tools.CorsBehavior = "anonymous";
        Tools.UseFallbackTexture = true;
        // Logs
        Tools._NoneLogLevel = 0;
        Tools._MessageLogLevel = 1;
        Tools._WarningLogLevel = 2;
        Tools._ErrorLogLevel = 4;
        Tools._LogCache = "";
        Tools.errorsCount = 0;
        Tools.Log = Tools._LogEnabled;
        Tools.Warn = Tools._WarnEnabled;
        Tools.Error = Tools._ErrorEnabled;
        // Performances
        Tools._PerformanceNoneLogLevel = 0;
        Tools._PerformanceUserMarkLogLevel = 1;
        Tools._PerformanceConsoleLogLevel = 2;
        Tools._performance = window.performance;
        Tools.StartPerformanceCounter = Tools._StartPerformanceCounterDisabled;
        Tools.EndPerformanceCounter = Tools._EndPerformanceCounterDisabled;
        return Tools;
    })();
    BABYLON.Tools = Tools;
    /**
     * Use this className as a decorator on a given class definition to add it a name.
     * You can then use the Tools.getClassName(obj) on an instance to retrieve its class name.
     * This method is the only way to get it done in all cases, even if the .js file declaring the class is minified
     * @param name
     */
    function className(name) {
        return function (target) {
            target["__bjsclassName__"] = name;
        };
    }
    BABYLON.className = className;
    /**
     * An implementation of a loop for asynchronous functions.
     */
    var AsyncLoop = (function () {
        /**
         * Constroctor.
         * @param iterations the number of iterations.
         * @param _fn the function to run each iteration
         * @param _successCallback the callback that will be called upon succesful execution
         * @param offset starting offset.
         */
        function AsyncLoop(iterations, _fn, _successCallback, offset) {
            if (offset === void 0) { offset = 0; }
            this.iterations = iterations;
            this._fn = _fn;
            this._successCallback = _successCallback;
            this.index = offset - 1;
            this._done = false;
        }
        /**
         * Execute the next iteration. Must be called after the last iteration was finished.
         */
        AsyncLoop.prototype.executeNext = function () {
            if (!this._done) {
                if (this.index + 1 < this.iterations) {
                    ++this.index;
                    this._fn(this);
                }
                else {
                    this.breakLoop();
                }
            }
        };
        /**
         * Break the loop and run the success callback.
         */
        AsyncLoop.prototype.breakLoop = function () {
            this._done = true;
            this._successCallback();
        };
        /**
         * Helper function
         */
        AsyncLoop.Run = function (iterations, _fn, _successCallback, offset) {
            if (offset === void 0) { offset = 0; }
            var loop = new AsyncLoop(iterations, _fn, _successCallback, offset);
            loop.executeNext();
            return loop;
        };
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
        AsyncLoop.SyncAsyncForLoop = function (iterations, syncedIterations, fn, callback, breakFunction, timeout) {
            if (timeout === void 0) { timeout = 0; }
            AsyncLoop.Run(Math.ceil(iterations / syncedIterations), function (loop) {
                if (breakFunction && breakFunction())
                    loop.breakLoop();
                else {
                    setTimeout(function () {
                        for (var i = 0; i < syncedIterations; ++i) {
                            var iteration = (loop.index * syncedIterations) + i;
                            if (iteration >= iterations)
                                break;
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
        };
        return AsyncLoop;
    })();
    BABYLON.AsyncLoop = AsyncLoop;
})(BABYLON || (BABYLON = {}));
