module BABYLON {
    /**
     * Interface to create your own Loader of Atlas Data file.
     * Call the AtlasPictureInfoFactory.addLoader to addd your loader instance
     */
    export interface IAtlasLoader {
        loadFile(content: any): { api: AtlasPictureInfo, errorMsg: string, errorCode: number };
    }

    // Proxy Class for the TexturePacker's JSON Array data format
    interface IFrame {
        filename: string;
        frame: { x: number, y: number, w: number, h: number };
        rotated: boolean;
        trimmed: boolean;
        srpiteSourceSize: { x: number, y: number, w: number, h: number };
        sourceSize: { x: number, y: number, w: number, h: number };
    }

    // Proxy Class for the TexturePacker's JSON Array data format
    interface IMeta {
        app: string;
        version: string;
        image: string;
        format: string;
        size: { w: number, h: number }
        scale: string;
        smartupdate: string;
    }

    // Loader class for the TexturePacker's JSON Array data format
    class JSONArrayLoader implements IAtlasLoader {

        loadFile(content): { api: AtlasPictureInfo, errorMsg: string, errorCode: number } {
            let errorMsg: string = null;
            let errorCode: number = 0;
            let root = null;
            let api: AtlasPictureInfo = null;
            try {
                try {
                    root = JSON.parse(content);
                    let frames = <Array<IFrame>>root.frames;
                    let meta = <IMeta>root.meta;

                    api = new AtlasPictureInfo();
                    api.atlasSize = new Size(meta.size.w, meta.size.h);
                    api.subPictures = new StringDictionary<AtlasSubPictureInfo>();

                    for (let f of frames) {
                        let aspi = new AtlasSubPictureInfo();
                        aspi.name = f.filename;
                        aspi.location = new Vector2(f.frame.x, api.atlasSize.height - (f.frame.y + f.frame.h));
                        aspi.size = new Size(f.frame.w, f.frame.h);

                        api.subPictures.add(aspi.name, aspi);
                    }

                } catch (ex1) {
                    errorMsg = "Invalid JSON file";
                    errorCode = -1;
                }                 
            } catch (ex2) {
                errorMsg = "Unknown Exception: " + ex2;
                errorCode = -2;
            } 
            return { api: api, errorMsg: errorMsg, errorCode: errorCode };
        }
    }

    /**
     * This class will contains information about a sub picture present in an Atlas Picture.
     */
    export class AtlasSubPictureInfo {
        /**
         * Name of the SubPicture, generally the filename of the initial picture file.
         */
        name: string;

        /**
         * Location of the bottom/left corner of the sub picture from the bottom/left corner the Atlas Picture
         */
        location: Vector2;

        /**
         * Size in pixel of the sub picture
         */
        size: Size;
    }

    /**
     * This class represent an Atlas Picture, it contains the information of all the sub pictures and the Texture that stores the bitmap.
     * You get an instance of this class using methods of the AtlasPictureInfoFactory
     */
    export class AtlasPictureInfo {
        /**
         * Creates many sprite from the Atlas Picture
         * @param filterCallback a predicate if true is returned then the corresponding sub picture will be used to create a sprite.
         * The Predicate has many parameters:
         *  - index: just an index incremented at each sub picture submitted for Sprite creation
         *  - name: the sub picture's name
         *  - aspi: the AtlasSubPictureInfo corresponding to the submitted sub picture
         *  - settings: the Sprite2D creation settings, you can alter this JSON object but BEWARE, the alterations will be kept for subsequent Sprite2D creations!
         * @param spriteSettings The Sprite2D settings to use for Sprite creation, this JSON object will be passed to the filterCallback for you to alter it, if needed.
         */
        createSprites(filterCallback: (index: number, name: string, aspi: AtlasSubPictureInfo, settings: any) => boolean,
            spriteSettings: {
                parent?: Prim2DBase,
                position?: Vector2,
                x?: number,
                y?: number,
                rotation?: number,
                size?: Size,
                scale?: number,
                scaleX?: number,
                scaleY?: number,
                dontInheritParentScale?: boolean,
                opacity?: number,
                zOrder?: number,
                origin?: Vector2,
                scale9?: Vector4,
                invertY?: boolean,
                alignToPixel?: boolean,
                isVisible?: boolean,
                isPickable?: boolean,
                isContainer?: boolean,
                childrenFlatZOrder?: boolean,
                marginTop?: number | string,
                marginLeft?: number | string,
                marginRight?: number | string,
                marginBottom?: number | string,
                margin?: number | string,
                marginHAlignment?: number,
                marginVAlignment?: number,
                marginAlignment?: string,
                paddingTop?: number | string,
                paddingLeft?: number | string,
                paddingRight?: number | string,
                paddingBottom?: number | string,
                padding?: string,
            }): Array<Sprite2D> {

            let res = new Array<Sprite2D>();

            let index = 0;
            this.subPictures.forEach((k, v) => {
                if (!filterCallback || filterCallback(index++, k, v, spriteSettings)) {
                    let s = this.createSprite(k, spriteSettings);
                    if (s) {
                        res.push(s);
                    }
                }
            });
            return res;
        }

        /**
         * Create one Sprite from a sub picture
         * @param subPictureName the name of the sub picture to use
         * @param spriteSettings the Sprite2D settings to use for the Sprite instance creation
         */
        createSprite(subPictureName: string, spriteSettings: {
            parent?: Prim2DBase,
            position?: Vector2,
            x?: number,
            y?: number,
            rotation?: number,
            size?: Size,
            scale?: number,
            scaleX?: number,
            scaleY?: number,
            dontInheritParentScale?: boolean,
            opacity?: number,
            zOrder?: number,
            origin?: Vector2,
            scale9?: Vector4,
            invertY?: boolean,
            alignToPixel?: boolean,
            isVisible?: boolean,
            isPickable?: boolean,
            isContainer?: boolean,
            childrenFlatZOrder?: boolean,
            marginTop?: number | string,
            marginLeft?: number | string,
            marginRight?: number | string,
            marginBottom?: number | string,
            margin?: number | string,
            marginHAlignment?: number,
            marginVAlignment?: number,
            marginAlignment?: string,
            paddingTop?: number | string,
            paddingLeft?: number | string,
            paddingRight?: number | string,
            paddingBottom?: number | string,
            padding?: string,
        }): Sprite2D {
            let spi = this.subPictures.get(subPictureName);
            if (!spi) {
                return null;
            }
            if (!spriteSettings) {
                spriteSettings = {};
            }
            let s = <any>spriteSettings;
            s.id = subPictureName;
            s.spriteLocation = spi.location;
            s.spriteSize = spi.size;

            let sprite = new Sprite2D(this.texture, spriteSettings);
            return sprite;
        }

        /**
         * Size of the Atlas Picture
         */
        atlasSize: Size;

        /**
         * String Dictionary of all the sub pictures, the key is the sub picture's name, the value is the info object
         */
        subPictures: StringDictionary<AtlasSubPictureInfo>;

        /**
         * The Texture associated to the Atlas Picture info
         */
        texture: Texture;
    }

    /**
     * This if the Factory class containing static method to create Atlas Pictures Info objects or add new loaders
     */
    export class AtlasPictureInfoFactory {
        /**
         * Add a custom loader
         * @param fileExtension must be the file extension (without the dot) of the file that is loaded by this loader (e.g.: json)
         * @param plugin the instance of the loader
         */
        public static addLoader(fileExtension: string, plugin: IAtlasLoader) {
            AtlasPictureInfoFactory._initialize();

            let a = AtlasPictureInfoFactory.plugins.getOrAddWithFactory(fileExtension.toLocaleLowerCase(), () => new Array<IAtlasLoader>());
            a.push(plugin);
        }

        /**
         * Load an Atlas Picture Info object from a data file at a given url and with a given texture
         * @param texture the texture containing the atlas bitmap
         * @param url the URL of the Atlas Info data file
         * @param loaded a callback that will be called when the AtlasPictureInfo object will be loaded and ready
         * @param error a callback that will be called in case of error
         */
        public static loadFromUrl(texture: Texture, url: string, loaded: (api: AtlasPictureInfo) => void, error: (msg: string, code: number) => void = null) {
            AtlasPictureInfoFactory._initialize();

            var xhr = new XMLHttpRequest();
            xhr.onreadystatechange = () => {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        let ext = url.split('.').pop().split(/\#|\?/)[0];
                        let plugins = AtlasPictureInfoFactory.plugins.get(ext.toLocaleLowerCase());
                        if (!plugins) {
                            if (error) {
                                error("couldn't find a plugin for this file extension", -1);
                            }
                            return;
                        }
                        for (let p of plugins) {
                            let ret = p.loadFile(xhr.response);
                            if (ret) {
                                if (ret.api && loaded) {
                                    ret.api.texture = texture;
                                    loaded(ret.api);
                                } else if (error) {
                                    error(ret.errorMsg, ret.errorCode);
                                }
                                break;
                            }
                        }
                    } else {
                        if (error) {
                            error("Couldn't load file through HTTP Request, HTTP Status " + xhr.status, xhr.status);
                        }
                    }
                }
            }
            xhr.open("GET", url, true);
            xhr.send();
            return null;
        }

        private static _initialize() {
            if (AtlasPictureInfoFactory.plugins !== null) {
                return;
            }

            AtlasPictureInfoFactory.plugins = new StringDictionary<Array<IAtlasLoader>>();
            AtlasPictureInfoFactory.addLoader("json", new JSONArrayLoader());

        }

        private static plugins: StringDictionary<Array<IAtlasLoader>> = null;
    }
}