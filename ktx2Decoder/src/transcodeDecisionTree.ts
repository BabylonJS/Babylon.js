import { sourceTextureFormat, transcodeTarget } from './transcoder';

const COMPRESSED_RGBA_BPTC_UNORM_EXT = 0x8E8C;
const COMPRESSED_RGBA_ASTC_4x4_KHR = 0x93B0;
const COMPRESSED_RGB_S3TC_DXT1_EXT  = 0x83F1;
const COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;
const COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
const COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
const COMPRESSED_RGBA8_ETC2_EAC = 0x9278;
const COMPRESSED_RGB8_ETC2 = 0x9274;
const COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;
const RGBA8Format = 0x8058;

interface ILeaf {
    transcodeFormat: number;
    engineFormat: number;
    roundToMultiple4?: boolean;
}

interface INode {
    cap?: string;
    option?: string;
    alpha?: boolean;
    needsPowerOfTwo?: boolean;
    yes?: INode | ILeaf;
    no?: INode | ILeaf;
}

interface IDecisionTree {
    [textureFormat: string]: INode;
}

const DecisionTree: IDecisionTree = {
    
    ETC1S: {
        option: "forceRGBA",
        yes: {
            transcodeFormat: transcodeTarget.RGBA32,
            engineFormat: RGBA8Format,
            roundToMultiple4: false,
        },
        no: {
            cap: "etc2",
            yes: {
                alpha: true,
                yes: {
                    transcodeFormat: transcodeTarget.ETC2_RGBA,
                    engineFormat: COMPRESSED_RGBA8_ETC2_EAC,
                },
                no: {
                    transcodeFormat: transcodeTarget.ETC1_RGB,
                    engineFormat: COMPRESSED_RGB8_ETC2,
                },
            },
            no : {
                cap: "etc1",
                yes: {
                    transcodeFormat: transcodeTarget.ETC1_RGB,
                    engineFormat: COMPRESSED_RGB_ETC1_WEBGL,
                },
                no: {
                    cap: "bptc",
                    yes: {
                        transcodeFormat: transcodeTarget.BC7_RGBA,
                        engineFormat: COMPRESSED_RGBA_BPTC_UNORM_EXT,
                    },
                    no: {
                        cap: "s3tc",
                        yes: {
                            alpha: true,
                            yes: {
                                transcodeFormat: transcodeTarget.BC3_RGBA,
                                engineFormat: COMPRESSED_RGBA_S3TC_DXT5_EXT,
                            },
                            no: {
                                transcodeFormat: transcodeTarget.BC1_RGB,
                                engineFormat: COMPRESSED_RGB_S3TC_DXT1_EXT,
                            },
                        },
                        no: {
                            cap: "pvrtc",
                            needsPowerOfTwo: true,
                            yes: {
                                alpha: true,
                                yes: {
                                    transcodeFormat: transcodeTarget.PVRTC1_4_RGBA,
                                    engineFormat: COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                                },
                                no: {
                                    transcodeFormat: transcodeTarget.PVRTC1_4_RGB,
                                    engineFormat: COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
                                },
                            },
                            no: {
                                transcodeFormat: transcodeTarget.RGBA32,
                                engineFormat: RGBA8Format,
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
            transcodeFormat: transcodeTarget.RGBA32,
            engineFormat: RGBA8Format,
            roundToMultiple4: false,
        },
        no: {
            cap: "astc",
            yes: {
                transcodeFormat: transcodeTarget.ASTC_4x4_RGBA,
                engineFormat: COMPRESSED_RGBA_ASTC_4x4_KHR,
            },
            no : {
                cap: "bptc",
                yes: {
                    transcodeFormat: transcodeTarget.BC7_RGBA,
                    engineFormat: COMPRESSED_RGBA_BPTC_UNORM_EXT,
                },
                no: {
                    option: "useRGBAIfASTCBC7NotAvailableWhenUASTC",
                    yes: {
                        transcodeFormat: transcodeTarget.RGBA32,
                        engineFormat: RGBA8Format,
                        roundToMultiple4: false,
                    },
                    no: {
                        cap: "etc2",
                        yes: {
                            alpha: true,
                            yes: {
                                transcodeFormat: transcodeTarget.ETC2_RGBA,
                                engineFormat: COMPRESSED_RGBA8_ETC2_EAC,
                            },
                            no: {
                                transcodeFormat: transcodeTarget.ETC1_RGB,
                                engineFormat: COMPRESSED_RGB8_ETC2,
                            },
                        },
                        no : {
                            cap: "etc1",
                            yes: {
                                transcodeFormat: transcodeTarget.ETC1_RGB,
                                engineFormat: COMPRESSED_RGB_ETC1_WEBGL,
                            },
                            no: {
                                cap: "s3tc",
                                yes: {
                                    alpha: true,
                                    yes: {
                                        transcodeFormat: transcodeTarget.BC3_RGBA,
                                        engineFormat: COMPRESSED_RGBA_S3TC_DXT5_EXT,
                                    },
                                    no: {
                                        transcodeFormat: transcodeTarget.BC1_RGB,
                                        engineFormat: COMPRESSED_RGB_S3TC_DXT1_EXT,
                                    },
                                },
                                no: {
                                    cap: "pvrtc",
                                    needsPowerOfTwo: true,
                                    yes: {
                                        alpha: true,
                                        yes: {
                                            transcodeFormat: transcodeTarget.PVRTC1_4_RGBA,
                                            engineFormat: COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
                                        },
                                        no: {
                                            transcodeFormat: transcodeTarget.PVRTC1_4_RGB,
                                            engineFormat: COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
                                        },
                                    },
                                    no: {
                                        transcodeFormat: transcodeTarget.RGBA32,
                                        engineFormat: RGBA8Format,
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
};

export class TranscodeDecisionTree {

    private static _IsLeafNode(node: INode | ILeaf): node is ILeaf {
        return (node as ILeaf).transcodeFormat !== undefined;
    }

    private _hasAlpha: boolean;
    private _isPowerOfTwo: boolean;
    private _caps: any;
    private _options: any;
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

    constructor(textureFormat: sourceTextureFormat, hasAlpha: boolean, isPowerOfTwo: boolean, caps: any, options?: any) {
        this._hasAlpha = hasAlpha;
        this._isPowerOfTwo = isPowerOfTwo;
        this._caps = caps;
        this._options = options ?? {};

        this._parseNode(textureFormat === sourceTextureFormat.UASTC4x4 ? DecisionTree.UASTC : DecisionTree.ETC1S);
    }

    private _parseNode(node: INode | ILeaf): void {
        if (TranscodeDecisionTree._IsLeafNode(node)) {
            this._transcodeFormat = node.transcodeFormat;
            this._engineFormat = node.engineFormat;
            this._roundToMultiple4 = node.roundToMultiple4 ?? true;
        } else {
            let condition = true;

            if (node.cap !== undefined) {
                condition = condition && this._caps[node.cap];
            }
            if (node.option !== undefined) {
                condition = condition && this._options[node.option];
            }
            if (node.alpha !== undefined) {
                condition = condition && this._hasAlpha;
            }
            if (node.needsPowerOfTwo !== undefined) {
                condition = condition && this._isPowerOfTwo;
            }

            this._parseNode(condition ? node.yes! : node.no!);
        }
    }
}
