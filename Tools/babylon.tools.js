var BABYLON = BABYLON || {};

(function () {
    BABYLON.Tools = {};
    BABYLON.Tools.QueueNewFrame = function (func) {
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

    BABYLON.Tools.RequestFullscreen = function (element) {
        if (element.requestFullscreen)
            element.requestFullscreen();
        else if (element.msRequestFullscreen)
            element.msRequestFullscreen();
        else if (element.webkitRequestFullscreen)
            element.webkitRequestFullscreen();
        else if (element.mozRequestFullscreen)
            element.mozRequestFullscreen();
    };

    BABYLON.Tools.ExitFullscreen = function () {
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
    BABYLON.Tools.BaseUrl = "";
    
    BABYLON.Tools.LoadFile = function (url, callback, progressCallBack) {
        var request = new XMLHttpRequest();
        var loadUrl = BABYLON.Tools.BaseUrl + url;
        request.open('GET', loadUrl, true);

        request.onprogress = progressCallBack;

        request.onreadystatechange = function () {
            if (request.readyState == 4) {
                if (request.status == 200) {
                    callback(request.responseText);
                } else { // Failed
                    throw new Error(request.status, "Unable to load " + loadUrl);
                }
            }
        };

        request.send(null);
    };

    // Misc.    
    BABYLON.Tools.WithinEpsilon = function (a, b) {
        var num = a - b;
        return -1.401298E-45 <= num && num <= 1.401298E-45;
    };

    var cloneValue = function (source, destinationObject) {
        if (!source)
            return null;

        if (source instanceof BABYLON.Mesh) {
            return null;
        }

        if (source instanceof BABYLON.SubMesh) {
            return source.clone(destinationObject);
        } else if (source.clone) {
            return source.clone();
        }
        return null;
    };

    BABYLON.Tools.DeepCopy = function (source, destination, doNotCopyList, mustCopyList) {
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
    };

    // FPS
    var fpsRange = 60;
    var previousFramesDuration = [];
    var fps = 60;
    var deltaTime = 0;

    BABYLON.Tools.GetFps = function () {
        return fps;
    };

    BABYLON.Tools.GetDeltaTime = function () {
        return deltaTime;
    };

    BABYLON.Tools._MeasureFps = function () {
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
    };

})();