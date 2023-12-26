import { Logger } from "../../../Misc/logger";
import type { Scene } from "../../../scene";
import { Vector3, Vector2 } from "../../../Maths/math.vector";
import { Color4, Color3 } from "../../../Maths/math.color";
import { Texture } from "../../../Materials/Textures/texture";
import type { IProceduralTextureCreationOptions } from "./proceduralTexture";
import { ProceduralTexture } from "./proceduralTexture";
import { WebRequest } from "../../../Misc/webRequest";
import type { TextureSize } from "../../../Materials/Textures/textureCreationOptions";

/**
 * Options to create a Custom Procedural Texture.
 */
export interface ICustomProceduralTextureCreationOptions extends IProceduralTextureCreationOptions {
    /**
     * Define a boolena indicating that there is no json config file to load
     */
    skipJson?: boolean;
}

/**
 * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes called 'refMaps' or 'sampler' images.
 * Custom Procedural textures are the easiest way to create your own procedural in your application.
 * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures#creating-custom-procedural-textures
 */
export class CustomProceduralTexture extends ProceduralTexture {
    private _animate: boolean = true;
    private _time: number = 0;
    private _config: any;
    private _texturePath: string;

    /**
     * Instantiates a new Custom Procedural Texture.
     * Procedural texturing is a way to programmatically create a texture. There are 2 types of procedural textures: code-only, and code that references some classic 2D images, sometimes called 'refMaps' or 'sampler' images.
     * Custom Procedural textures are the easiest way to create your own procedural in your application.
     * @see https://doc.babylonjs.com/features/featuresDeepDive/materials/using/proceduralTextures#creating-custom-procedural-textures
     * @param name Define the name of the texture
     * @param texturePath Define the folder path containing all the custom texture related files (config, shaders...)
     * @param size Define the size of the texture to create
     * @param scene Define the scene the texture belongs to
     * @param fallbackTexture Define a fallback texture in case there were issues to create the custom texture
     * @param generateMipMaps Define if the texture should creates mip maps or not
     * @param skipJson Define a boolena indicating that there is no json config file to load
     */
    constructor(
        name: string,
        texturePath: string,
        size: TextureSize,
        scene: Scene,
        fallbackTexture?: Texture | ICustomProceduralTextureCreationOptions,
        generateMipMaps?: boolean,
        skipJson?: boolean
    ) {
        super(name, size, null, scene, fallbackTexture, generateMipMaps);
        this._texturePath = texturePath;

        if (fallbackTexture && !(fallbackTexture instanceof Texture)) {
            skipJson = !!fallbackTexture.skipJson;
        }

        if (!skipJson) {
            //Try to load json
            this._loadJson(texturePath);
        } else {
            this.setFragment(this._texturePath);
        }
        this.refreshRate = 1;
    }

    private _loadJson(jsonUrl: string): void {
        const noConfigFile = () => {
            try {
                this.setFragment(this._texturePath);
            } catch (ex) {
                Logger.Log("No json or ShaderStore or DOM element found for CustomProceduralTexture");
            }
        };

        const configFileUrl = jsonUrl + "/config.json";
        const xhr = new WebRequest();

        xhr.open("GET", configFileUrl);
        xhr.addEventListener(
            "load",
            () => {
                if (xhr.status === 200 || (xhr.responseText && xhr.responseText.length > 0)) {
                    try {
                        this._config = JSON.parse(xhr.response);

                        this.updateShaderUniforms();
                        this.updateTextures();
                        this.setFragment(this._texturePath + "/custom");

                        this._animate = this._config.animate;
                        this.refreshRate = this._config.refreshrate;
                    } catch (ex) {
                        noConfigFile();
                    }
                } else {
                    noConfigFile();
                }
            },
            false
        );

        xhr.addEventListener(
            "error",
            () => {
                noConfigFile();
            },
            false
        );

        try {
            xhr.send();
        } catch (ex) {
            Logger.Error("CustomProceduralTexture: Error on XHR send request.");
        }
    }

    /**
     * Is the texture ready to be used ? (rendered at least once)
     * @returns true if ready, otherwise, false.
     */
    public isReady(): boolean {
        if (!super.isReady()) {
            return false;
        }

        for (const name in this._textures) {
            const texture = this._textures[name];

            if (!texture.isReady()) {
                return false;
            }
        }

        return true;
    }

    /**
     * Render the texture to its associated render target.
     * @param useCameraPostProcess Define if camera post process should be applied to the texture
     */
    public render(useCameraPostProcess?: boolean): void {
        const scene = this.getScene();
        if (this._animate && scene) {
            this._time += scene.getAnimationRatio() * 0.03;
            this.updateShaderUniforms();
        }

        super.render(useCameraPostProcess);
    }

    /**
     * Update the list of dependant textures samplers in the shader.
     */
    public updateTextures(): void {
        for (let i = 0; i < this._config.sampler2Ds.length; i++) {
            this.setTexture(this._config.sampler2Ds[i].sample2Dname, new Texture(this._texturePath + "/" + this._config.sampler2Ds[i].textureRelativeUrl, this.getScene()));
        }
    }

    /**
     * Update the uniform values of the procedural texture in the shader.
     */
    public updateShaderUniforms(): void {
        if (this._config) {
            for (let j = 0; j < this._config.uniforms.length; j++) {
                const uniform = this._config.uniforms[j];

                switch (uniform.type) {
                    case "float":
                        this.setFloat(uniform.name, uniform.value);
                        break;
                    case "color3":
                        this.setColor3(uniform.name, new Color3(uniform.r, uniform.g, uniform.b));
                        break;
                    case "color4":
                        this.setColor4(uniform.name, new Color4(uniform.r, uniform.g, uniform.b, uniform.a));
                        break;
                    case "vector2":
                        this.setVector2(uniform.name, new Vector2(uniform.x, uniform.y));
                        break;
                    case "vector3":
                        this.setVector3(uniform.name, new Vector3(uniform.x, uniform.y, uniform.z));
                        break;
                }
            }
        }

        this.setFloat("time", this._time);
    }

    /**
     * Define if the texture animates or not.
     */
    public get animate(): boolean {
        return this._animate;
    }

    public set animate(value: boolean) {
        this._animate = value;
    }
}
