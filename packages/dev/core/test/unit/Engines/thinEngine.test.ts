import { Engine, ThinEngine } from "core/Engines";

describe("ThinEngine", () => {
    describe("getTexImageParametersForCreateTexture", () => {
        let thinEngine: ThinEngine;
        
        beforeEach(() => {
            const fakeConstProvider: any = new Proxy({}, {
                get: (_, propertyName) => {
                    return propertyName;
                }
            });
            thinEngine = new ThinEngine(null);
            thinEngine._gl = fakeConstProvider;
            thinEngine._glSRGBExtensionValues = fakeConstProvider;
        });
        
        it("gets tex image parameters for WebGL 1", () => {
            test([
                "<undefined>",
                "TEXTUREFORMAT_ALPHA",
                "TEXTUREFORMAT_LUMINANCE",
                "TEXTUREFORMAT_LUMINANCE_ALPHA",
                "TEXTUREFORMAT_RGB",
                "TEXTUREFORMAT_RGBA"
            ], `
Babylon format                Ext. SRGB  Int. format     Format          Type
==============                ==== ====  ===========     ======          ====
<undefined>                   .jpg false RGB             RGB             UNSIGNED_BYTE
<undefined>                   .jpg true  SRGB8_ALPHA8    SRGB8_ALPHA8    UNSIGNED_BYTE
<undefined>                   .png false RGBA            RGBA            UNSIGNED_BYTE
<undefined>                   .png true  SRGB8_ALPHA8    SRGB8_ALPHA8    UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .jpg false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .jpg true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .png false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .png true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .jpg false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .jpg true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .png false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .png true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .jpg false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .jpg true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .png false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .png true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .jpg false RGB             RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .jpg true  SRGB            SRGB            UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .png false RGB             RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .png true  SRGB            SRGB            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .jpg false RGBA            RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .jpg true  SRGB8_ALPHA8    SRGB8_ALPHA8    UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .png false RGBA            RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .png true  SRGB8_ALPHA8    SRGB8_ALPHA8    UNSIGNED_BYTE`.trimStart());
        });

        it("gets tex image parameters for WebGL 2", () => {
            thinEngine._webGLVersion = 2;
            test([
                "<undefined>",
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
                "TEXTUREFORMAT_RGBA_INTEGER"
            ], `
Babylon format                Ext. SRGB  Int. format     Format          Type
==============                ==== ====  ===========     ======          ====
<undefined>                   .jpg false RGB8            RGB             UNSIGNED_BYTE
<undefined>                   .jpg true  SRGB8_ALPHA8    RGBA            UNSIGNED_BYTE
<undefined>                   .png false RGBA8           RGBA            UNSIGNED_BYTE
<undefined>                   .png true  SRGB8_ALPHA8    RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .jpg false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .jpg true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .png false ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_ALPHA           .png true  ALPHA           ALPHA           UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .jpg false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .jpg true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .png false LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE       .png true  LUMINANCE       LUMINANCE       UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .jpg false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .jpg true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .png false LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_LUMINANCE_ALPHA .png true  LUMINANCE_ALPHA LUMINANCE_ALPHA UNSIGNED_BYTE
TEXTUREFORMAT_R               .jpg false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_R               .jpg true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_R               .png false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_R               .png true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             .jpg false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             .jpg true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             .png false R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RED             .png true  R8              RED             UNSIGNED_BYTE
TEXTUREFORMAT_RG              .jpg false RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RG              .jpg true  RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RG              .png false RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RG              .png true  RG8             RG              UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .jpg false RGB8            RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .jpg true  SRGB8           RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .png false RGB8            RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGB             .png true  SRGB8           RGB             UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .jpg false RGBA8           RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .jpg true  SRGB8_ALPHA8    RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .png false RGBA8           RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_RGBA            .png true  SRGB8_ALPHA8    RGBA            UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       .jpg false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       .jpg true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       .png false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_R_INTEGER       .png true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      .jpg false RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      .jpg true  RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      .png false RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RG_INTEGER      .png true  RG8UI           RG_INTEGER      UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     .jpg false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     .jpg true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     .png false R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RED_INTEGER     .png true  R8UI            RED_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     .jpg false RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     .jpg true  RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     .png false RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGB_INTEGER     .png true  RGB8UI          RGB_INTEGER     UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    .jpg false RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    .jpg true  RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    .png false RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE
TEXTUREFORMAT_RGBA_INTEGER    .png true  RGBA8UI         RGBA_INTEGER    UNSIGNED_BYTE`.trimStart());
        });

        function test(formatStrs: string[], expected: string) {
            const results = [
                "Babylon format                Ext. SRGB  Int. format     Format          Type",
                "==============                ==== ====  ===========     ======          ===="
            ];
            for (const formatStr of formatStrs) {
                const format = formatStr === "<undefined>" ? undefined : (Engine as any)[formatStr];
                for (const fileExtension of [".jpg", ".png"]) {
                    for (const useSRGBBuffer of [false, true]) {
                        const texImageParams = thinEngine._getTexImageParametersForCreateTexture(format, fileExtension, useSRGBBuffer);
                        results.push(
                            formatStr.padEnd(30) +
                            fileExtension.padEnd(5) +
                            useSRGBBuffer.toString().padEnd(6) +
                            (texImageParams.internalFormat as any).padEnd(16) +
                            (texImageParams.format as any).padEnd(16) +
                            texImageParams.type
                        );
                    }
                }
            }
            expect(results.join("\n")).toEqual(expected);
        }
    });
});