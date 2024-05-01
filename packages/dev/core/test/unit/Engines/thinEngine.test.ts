import { Engine, ThinEngine } from "core/Engines";

describe("ThinEngine", () => {
    describe("getTexImageParametersForCreateTexture", () => {
        let thinEngine: ThinEngine;

        beforeEach(() => {
            const fakeConstProvider: any = new Proxy(
                {},
                {
                    get: (_, propertyName) => {
                        return propertyName;
                    },
                }
            );
            thinEngine = new ThinEngine(null);
            thinEngine._gl = fakeConstProvider;
            thinEngine._glSRGBExtensionValues = fakeConstProvider;
        });

        it("gets tex image parameters for WebGL 1", () => {
            test(
                ["TEXTUREFORMAT_ALPHA", "TEXTUREFORMAT_LUMINANCE", "TEXTUREFORMAT_LUMINANCE_ALPHA", "TEXTUREFORMAT_RGB", "TEXTUREFORMAT_RGBA"],
                `
Babylon format                SRGB  Int. format     Format          Type
==============                ====  ===========     ======          ====
TEXTUREFORMAT_ALPHA           false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_RGB             false RGB             RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             true  SRGB            SRGB            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            false RGBA            RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            true  SRGB8_ALPHA8    SRGB8_ALPHA8    UNSIGNED_BYTE`.trimStart()
            );
        });

        it("gets tex image parameters for WebGL 2", () => {
            thinEngine._webGLVersion = 2;
            test(
                [
                    "TEXTUREFORMAT_ALPHA",
                    "TEXTUREFORMAT_LUMINANCE",
                    "TEXTUREFORMAT_LUMINANCE_ALPHA",
                    "TEXTUREFORMAT_R",
                    "TEXTUREFORMAT_RED",
                    "TEXTUREFORMAT_RG",
                    "TEXTUREFORMAT_RGB",
                    "TEXTUREFORMAT_RGBA",
                    "TEXTUREFORMAT_R_INTEGER",
                    "TEXTUREFORMAT_RG_INTEGER",
                    "TEXTUREFORMAT_RED_INTEGER",
                    "TEXTUREFORMAT_RGB_INTEGER",
                    "TEXTUREFORMAT_RGBA_INTEGER",
                ],
                `
Babylon format                SRGB  Int. format     Format          Type
==============                ====  ===========     ======          ====
TEXTUREFORMAT_ALPHA           false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_R               false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_R               true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RG              false RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RG              true  RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RGB             false RGB8            RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             true  SRGB8           RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            false RGBA8           RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            true  SRGB8_ALPHA8    RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      false RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      true  RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     false RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     true  RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    false RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    true  RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE`.trimStart()
            );
        });

        function test(formatStrs: string[], expected: string) {
            const results = [
                "Babylon format                SRGB  Int. format     Format          Type",
                "==============                ====  ===========     ======          ====",
            ];
            for (const formatStr of formatStrs) {
                const format = (Engine as any)[formatStr];
                for (const useSRGBBuffer of [false, true]) {
                    const texImageParams = thinEngine._getTexImageParametersForCreateTexture(format, useSRGBBuffer);
                    results.push(
                        formatStr.padEnd(30) +
                            useSRGBBuffer.toString().padEnd(6) +
                            (texImageParams.internalFormat as any).padEnd(16) +
                            (texImageParams.format as any).padEnd(16) +
                            texImageParams.type
                    );
                }
            }
            expect(results.join("\n")).toEqual(expected);
        }
    });
});
