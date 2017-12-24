/// <reference path="../../../../dist/preview release/babylon.d.ts"/>
var BABYLON;
(function (BABYLON) {
    var GLTF2;
    (function (GLTF2) {
        /**
        * Enums
        */
        var EComponentType;
        (function (EComponentType) {
            EComponentType[EComponentType["BYTE"] = 5120] = "BYTE";
            EComponentType[EComponentType["UNSIGNED_BYTE"] = 5121] = "UNSIGNED_BYTE";
            EComponentType[EComponentType["SHORT"] = 5122] = "SHORT";
            EComponentType[EComponentType["UNSIGNED_SHORT"] = 5123] = "UNSIGNED_SHORT";
            EComponentType[EComponentType["UNSIGNED_INT"] = 5125] = "UNSIGNED_INT";
            EComponentType[EComponentType["FLOAT"] = 5126] = "FLOAT";
        })(EComponentType = GLTF2.EComponentType || (GLTF2.EComponentType = {}));
        var EMeshPrimitiveMode;
        (function (EMeshPrimitiveMode) {
            EMeshPrimitiveMode[EMeshPrimitiveMode["POINTS"] = 0] = "POINTS";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINES"] = 1] = "LINES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_LOOP"] = 2] = "LINE_LOOP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["LINE_STRIP"] = 3] = "LINE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLES"] = 4] = "TRIANGLES";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_STRIP"] = 5] = "TRIANGLE_STRIP";
            EMeshPrimitiveMode[EMeshPrimitiveMode["TRIANGLE_FAN"] = 6] = "TRIANGLE_FAN";
        })(EMeshPrimitiveMode = GLTF2.EMeshPrimitiveMode || (GLTF2.EMeshPrimitiveMode = {}));
        var ETextureMagFilter;
        (function (ETextureMagFilter) {
            ETextureMagFilter[ETextureMagFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMagFilter[ETextureMagFilter["LINEAR"] = 9729] = "LINEAR";
        })(ETextureMagFilter = GLTF2.ETextureMagFilter || (GLTF2.ETextureMagFilter = {}));
        var ETextureMinFilter;
        (function (ETextureMinFilter) {
            ETextureMinFilter[ETextureMinFilter["NEAREST"] = 9728] = "NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR"] = 9729] = "LINEAR";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_NEAREST"] = 9984] = "NEAREST_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_NEAREST"] = 9985] = "LINEAR_MIPMAP_NEAREST";
            ETextureMinFilter[ETextureMinFilter["NEAREST_MIPMAP_LINEAR"] = 9986] = "NEAREST_MIPMAP_LINEAR";
            ETextureMinFilter[ETextureMinFilter["LINEAR_MIPMAP_LINEAR"] = 9987] = "LINEAR_MIPMAP_LINEAR";
        })(ETextureMinFilter = GLTF2.ETextureMinFilter || (GLTF2.ETextureMinFilter = {}));
        var ETextureWrapMode;
        (function (ETextureWrapMode) {
            ETextureWrapMode[ETextureWrapMode["CLAMP_TO_EDGE"] = 33071] = "CLAMP_TO_EDGE";
            ETextureWrapMode[ETextureWrapMode["MIRRORED_REPEAT"] = 33648] = "MIRRORED_REPEAT";
            ETextureWrapMode[ETextureWrapMode["REPEAT"] = 10497] = "REPEAT";
        })(ETextureWrapMode = GLTF2.ETextureWrapMode || (GLTF2.ETextureWrapMode = {}));
    })(GLTF2 = BABYLON.GLTF2 || (BABYLON.GLTF2 = {}));
})(BABYLON || (BABYLON = {}));

//# sourceMappingURL=babylon.glTFLoaderInterfaces.js.map
