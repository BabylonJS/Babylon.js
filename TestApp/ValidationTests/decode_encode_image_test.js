function DecodeEncodeImage(url)
{
    let onLoadFileError = function(request, exception) {
        console.log("Failed to retrieve " + url + ".", exception);
    };
    var onload = function(data, responseURL) {
        if (typeof (data) === "string") {
            throw new Error("Decode Image from string data not yet implemented.");
        }
        var image = engine._native.decodeImage(data);
        var imageData = engine._native.getImageData(image);
        console.log("Image data length is " + imageData.length);
        var encoded = engine._native.encodeImage(image);
        console.log("Encoded Image data length is " + encoded.length);
    }
    BABYLON.Tools.LoadFile(url, onload, undefined, undefined, /*useArrayBuffer*/true, onLoadFileError);
}

var engine = new BABYLON.NativeEngine();

DecodeEncodeImage("https://github.com/BabylonJS/Babylon.js/raw/master/tests/validation/ReferenceImages/Billboard.png");
