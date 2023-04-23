/* eslint-disable @typescript-eslint/naming-convention */
import * as KTX2 from "core/Materials/Textures/ktx2decoderTypes";

const DecisionTree: KTX2.IDecisionTree = {
    ETC1S: {
        option: "forceRGBA",
        yes: {
            transcodeFormat: KTX2.TranscodeTarget.RGBA32,
            engineFormat: KTX2.EngineFormat.RGBA8Format,
            roundToMultiple4: false,
        },
        no: {
            cap: "etc2",
            yes: {
                alpha: true,
                yes: {
                    transcodeFormat: KTX2.TranscodeTarget.ETC2_RGBA,
                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA8_ETC2_EAC,
                },
                no: {
                    transcodeFormat: KTX2.TranscodeTarget.ETC1_RGB,
                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGB8_ETC2,
                },
            },
            no: {
                cap: "etc1",
                alpha: false,
                yes: {
                    transcodeFormat: KTX2.TranscodeTarget.ETC1_RGB,
                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGB_ETC1_WEBGL,
                },
                no: {
                    cap: "bptc",
                    yes: {
                        transcodeFormat: KTX2.TranscodeTarget.BC7_RGBA,
                        engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_BPTC_UNORM_EXT,
                    },
                    no: {
                        cap: "s3tc",
                        yes: {
                            alpha: true,
                            yes: {
                                transcodeFormat: KTX2.TranscodeTarget.BC3_RGBA,
                                engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_S3TC_DXT5_EXT,
                            },
                            no: {
                                transcodeFormat: KTX2.TranscodeTarget.BC1_RGB,
                                engineFormat: KTX2.EngineFormat.COMPRESSED_RGB_S3TC_DXT1_EXT,
                            },
                        },
                        no: {
                            cap: "pvrtc",
                            needsPowerOfTwo: true,
                            yes: {
                                alpha: true,
                                yes: {
                                    transcodeFormat: KTX2.TranscodeTarget.PVRTC1_4_RGBA,
                                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                                },
                                no: {
                                    transcodeFormat: KTX2.TranscodeTarget.PVRTC1_4_RGB,
                                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
                                },
                            },
                            no: {
                                transcodeFormat: KTX2.TranscodeTarget.RGBA32,
                                engineFormat: KTX2.EngineFormat.RGBA8Format,
                                roundToMultiple4: false,
                            },
                        },
                    },
                },
            },
        },
    },

    UASTC: {
        option: "forceRGBA",
        yes: {
            transcodeFormat: KTX2.TranscodeTarget.RGBA32,
            engineFormat: KTX2.EngineFormat.RGBA8Format,
            roundToMultiple4: false,
        },
        no: {
            option: "forceR8",
            yes: {
                transcodeFormat: KTX2.TranscodeTarget.R8,
                engineFormat: KTX2.EngineFormat.R8Format,
                roundToMultiple4: false,
            },
            no: {
                option: "forceRG8",
                yes: {
                    transcodeFormat: KTX2.TranscodeTarget.RG8,
                    engineFormat: KTX2.EngineFormat.RG8Format,
                    roundToMultiple4: false,
                },
                no: {
                    cap: "astc",
                    yes: {
                        transcodeFormat: KTX2.TranscodeTarget.ASTC_4X4_RGBA,
                        engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_ASTC_4X4_KHR,
                    },
                    no: {
                        cap: "bptc",
                        yes: {
                            transcodeFormat: KTX2.TranscodeTarget.BC7_RGBA,
                            engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_BPTC_UNORM_EXT,
                        },
                        no: {
                            option: "useRGBAIfASTCBC7NotAvailableWhenUASTC",
                            yes: {
                                transcodeFormat: KTX2.TranscodeTarget.RGBA32,
                                engineFormat: KTX2.EngineFormat.RGBA8Format,
                                roundToMultiple4: false,
                            },
                            no: {
                                cap: "etc2",
                                yes: {
                                    alpha: true,
                                    yes: {
                                        transcodeFormat: KTX2.TranscodeTarget.ETC2_RGBA,
                                        engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA8_ETC2_EAC,
                                    },
                                    no: {
                                        transcodeFormat: KTX2.TranscodeTarget.ETC1_RGB,
                                        engineFormat: KTX2.EngineFormat.COMPRESSED_RGB8_ETC2,
                                    },
                                },
                                no: {
                                    cap: "etc1",
                                    yes: {
                                        transcodeFormat: KTX2.TranscodeTarget.ETC1_RGB,
                                        engineFormat: KTX2.EngineFormat.COMPRESSED_RGB_ETC1_WEBGL,
                                    },
                                    no: {
                                        cap: "s3tc",
                                        yes: {
                                            alpha: true,
                                            yes: {
                                                transcodeFormat: KTX2.TranscodeTarget.BC3_RGBA,
                                                engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_S3TC_DXT5_EXT,
                                            },
                                            no: {
                                                transcodeFormat: KTX2.TranscodeTarget.BC1_RGB,
                                                engineFormat: KTX2.EngineFormat.COMPRESSED_RGB_S3TC_DXT1_EXT,
                                            },
                                        },
                                        no: {
                                            cap: "pvrtc",
                                            needsPowerOfTwo: true,
                                            yes: {
                                                alpha: true,
                                                yes: {
                                                    transcodeFormat: KTX2.TranscodeTarget.PVRTC1_4_RGBA,
                                                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                                                },
                                                no: {
                                                    transcodeFormat: KTX2.TranscodeTarget.PVRTC1_4_RGB,
                                                    engineFormat: KTX2.EngineFormat.COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
                                                },
                                            },
                                            no: {
                                                transcodeFormat: KTX2.TranscodeTarget.RGBA32,
                                                engineFormat: KTX2.EngineFormat.RGBA8Format,
                                                roundToMultiple4: false,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                    },
                },
            },
        },
    },
};

export class TranscodeDecisionTree {
    private static _IsLeafNode(node: KTX2.INode | KTX2.ILeaf): node is KTX2.ILeaf {
        return (node as KTX2.ILeaf).engineFormat !== undefined;
    }

    private _textureFormat: KTX2.SourceTextureFormat;
    private _hasAlpha: boolean;
    private _isPowerOfTwo: boolean;
    private _caps: KTX2.ICompressedFormatCapabilities;
    private _options: KTX2.IKTX2DecoderOptions;
    private _transcodeFormat: number;
    private _engineFormat: number;
    private _roundToMultiple4: boolean;

    public get transcodeFormat() {
        return this._transcodeFormat;
    }

    public get engineFormat() {
        return this._engineFormat;
    }

    public get roundToMultiple4() {
        return this._roundToMultiple4;
    }

    constructor(textureFormat: KTX2.SourceTextureFormat, hasAlpha: boolean, isPowerOfTwo: boolean, caps: KTX2.ICompressedFormatCapabilities, options?: KTX2.IKTX2DecoderOptions) {
        this._textureFormat = textureFormat;
        this._hasAlpha = hasAlpha;
        this._isPowerOfTwo = isPowerOfTwo;
        this._caps = caps;
        this._options = options ?? {};

        this.parseTree(DecisionTree);
    }

    public parseTree(tree: KTX2.IDecisionTree): boolean {
        const node = this._textureFormat === KTX2.SourceTextureFormat.UASTC4x4 ? tree.UASTC : tree.ETC1S;
        if (node) {
            this._parseNode(node);
        }
        return node !== undefined;
    }

    private _parseNode(node: KTX2.INode | KTX2.ILeaf | undefined): void {
        if (!node) {
            return;
        }

        if (TranscodeDecisionTree._IsLeafNode(node)) {
            this._transcodeFormat = node.transcodeFormat;
            this._engineFormat = node.engineFormat;
            this._roundToMultiple4 = node.roundToMultiple4 ?? true;
        } else {
            let condition = true;

            if (node.cap !== undefined) {
                condition = condition && !!this._caps[node.cap as keyof typeof this._caps];
            }
            if (node.option !== undefined) {
                condition = condition && !!this._options[node.option as keyof typeof this._options];
            }
            if (node.alpha !== undefined) {
                condition = condition && this._hasAlpha === node.alpha;
            }
            if (node.needsPowerOfTwo !== undefined) {
                condition = condition && this._isPowerOfTwo === node.needsPowerOfTwo;
            }
            if (node.transcodeFormat !== undefined) {
                if (Array.isArray(node.transcodeFormat)) {
                    condition = condition && node.transcodeFormat.indexOf(this._transcodeFormat) !== -1;
                } else {
                    condition = condition && node.transcodeFormat === this._transcodeFormat;
                }
            }

            this._parseNode(condition ? node.yes! : node.no!);
        }
    }
}
