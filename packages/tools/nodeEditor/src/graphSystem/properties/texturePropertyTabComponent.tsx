import * as React from "react";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";
import { Tools } from "core/Misc/tools";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { CheckBoxLineComponent } from "../../sharedComponents/checkBoxLineComponent";
import { Texture } from "core/Materials/Textures/texture";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { ReflectionTextureBlock } from "core/Materials/Node/Blocks/Dual/reflectionTextureBlock";
import { ReflectionBlock } from "core/Materials/Node/Blocks/PBR/reflectionBlock";
import { RefractionBlock } from "core/Materials/Node/Blocks/PBR/refractionBlock";
import type { TextureBlock } from "core/Materials/Node/Blocks/Dual/textureBlock";
import { CurrentScreenBlock } from "core/Materials/Node/Blocks/Dual/currentScreenBlock";
import { ParticleTextureBlock } from "core/Materials/Node/Blocks/Particle/particleTextureBlock";
import { GeneralPropertyTabComponent, GenericPropertyTabComponent } from "./genericNodePropertyComponent";
import { NodeMaterialModes } from "core/Materials/Node/Enums/nodeMaterialModes";
import type { NodeMaterialBlock } from "core/Materials/Node/nodeMaterialBlock";
import type { GlobalState } from "../../globalState";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import type { IPropertyComponentProps } from "shared-ui-components/nodeGraphSystem/interfaces/propertyComponentProps";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { FloatLineComponent } from "shared-ui-components/lines/floatLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import type { TriPlanarBlock } from "core/Materials/Node/Blocks/triPlanarBlock";

type ReflectionTexture = ReflectionTextureBlock | ReflectionBlock | RefractionBlock;

type AnyTexture = TextureBlock | ReflectionTexture | CurrentScreenBlock | ParticleTextureBlock | TriPlanarBlock;

export class TexturePropertyTabComponent extends React.Component<IPropertyComponentProps, { isEmbedded: boolean; loadAsCubeTexture: boolean; textureIsPrefiltered: boolean }> {
    get textureBlock(): AnyTexture {
        return this.props.nodeData.data as AnyTexture;
    }

    constructor(props: IPropertyComponentProps) {
        super(props);

        const texture = this.textureBlock.texture as BaseTexture;

        this.state = { isEmbedded: !texture || texture.name.substring(0, 4) === "data", loadAsCubeTexture: texture && texture.isCube, textureIsPrefiltered: true };
    }

    // eslint-disable-next-line @typescript-eslint/naming-convention
    override UNSAFE_componentWillUpdate(nextProps: IPropertyComponentProps, nextState: { isEmbedded: boolean; loadAsCubeTexture: boolean }) {
        if (nextProps.nodeData.data !== this.props.nodeData.data) {
            const texture = (nextProps.nodeData.data as AnyTexture).texture as BaseTexture;

            nextState.isEmbedded = !texture || texture.name.substring(0, 4) === "data";
            nextState.loadAsCubeTexture = texture && texture.isCube;
        }
    }

    private _generateRandomForCache() {
        return "xxxxxxxxxxxxxxxxxxxx".replace(/[x]/g, () => {
            const r = (Math.random() * 10) | 0;
            return r.toString();
        });
    }

    updateAfterTextureLoad() {
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.nodeData.data as NodeMaterialBlock);
        this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
        this.forceUpdate();
    }

    removeTexture() {
        let texture = this.textureBlock.texture as BaseTexture;

        if (texture) {
            texture.dispose();
            (texture as any) = null;
            this.textureBlock.texture = null;
        }

        this.updateAfterTextureLoad();
    }

    _prepareTexture() {
        let texture = this.textureBlock.texture as BaseTexture;

        if (texture && texture.isCube !== this.state.loadAsCubeTexture) {
            texture.dispose();
            (texture as any) = null;
        }

        if (!texture) {
            const globalState = this.props.stateManager.data as GlobalState;
            if (!this.state.loadAsCubeTexture) {
                this.textureBlock.texture = new Texture(
                    null,
                    globalState.nodeMaterial.getScene(),
                    false,
                    this.textureBlock instanceof ReflectionTextureBlock ||
                        this.textureBlock instanceof ReflectionBlock ||
                        this.textureBlock instanceof RefractionBlock ||
                        globalState.mode === NodeMaterialModes.PostProcess ||
                        globalState.mode === NodeMaterialModes.SFE
                );
                texture = this.textureBlock.texture;
                texture.coordinatesMode = Texture.EQUIRECTANGULAR_MODE;
            } else {
                this.textureBlock.texture = new CubeTexture("", globalState.nodeMaterial.getScene());
                texture = this.textureBlock.texture;
                texture.coordinatesMode = Texture.CUBIC_MODE;
            }
        }
    }

    /**
     * Replaces the texture of the node
     * @param file the file of the texture to use
     */
    replaceTexture(file: File) {
        this._prepareTexture();

        const texture = this.textureBlock.texture as BaseTexture;
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });

                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;

                    let extension: string | undefined = undefined;
                    if (file.name.toLowerCase().indexOf(".dds") > 0) {
                        extension = ".dds";
                    } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                        extension = ".env";
                    }
                    if (texture.isCube) {
                        (texture as CubeTexture).updateURL(base64data, extension, () => this.updateAfterTextureLoad(), this.state.textureIsPrefiltered);
                    } else {
                        (texture as Texture).updateURL(base64data, extension, () => this.updateAfterTextureLoad());
                    }
                };
            },
            undefined,
            true
        );
    }

    replaceTextureWithUrl(url: string) {
        this._prepareTexture();

        const texture = this.textureBlock.texture as BaseTexture;
        // We need to update the texture name with the url so later on the render
        // doesn't overwrite the url texture with the name of the texture.
        texture.name = url;
        if (texture.isCube || this.textureBlock instanceof ReflectionTextureBlock || this.textureBlock instanceof ReflectionBlock || this.textureBlock instanceof RefractionBlock) {
            let extension: string | undefined = undefined;
            if (url.toLowerCase().indexOf(".dds") > 0) {
                extension = ".dds";
            } else if (url.toLowerCase().indexOf(".env") > 0) {
                extension = ".env";
            }

            (texture as CubeTexture).updateURL(url, extension, () => this.updateAfterTextureLoad(), this.state.textureIsPrefiltered);
        } else {
            (texture as Texture).updateURL(url, null, () => this.updateAfterTextureLoad());
        }
    }

    override render() {
        let url = "";
        const block = this.props.nodeData.data as NodeMaterialBlock;

        const texture = (this.textureBlock as TextureBlock).hasImageSource ? null : (this.textureBlock.texture as BaseTexture);
        if (texture && texture.name && texture.name.substring(0, 4) !== "data") {
            url = texture.name;
        }

        url = url.replace(/\?nocache=\d+/, "");

        const isInReflectionMode =
            this.textureBlock instanceof ReflectionTextureBlock || this.textureBlock instanceof ReflectionBlock || this.textureBlock instanceof RefractionBlock;
        const isFrozenTexture = this.textureBlock instanceof CurrentScreenBlock || this.textureBlock instanceof ParticleTextureBlock;
        const showIsInGammaSpace = this.textureBlock instanceof ReflectionBlock;

        const reflectionModeOptions: { label: string; value: number }[] = [
            {
                label: "Cubic",
                value: Texture.CUBIC_MODE,
            },
            {
                label: "Equirectangular",
                value: Texture.EQUIRECTANGULAR_MODE,
            },
            {
                label: "Explicit",
                value: Texture.EXPLICIT_MODE,
            },
            {
                label: "Fixed equirectangular",
                value: Texture.FIXED_EQUIRECTANGULAR_MODE,
            },
            {
                label: "Fixed mirrored equirectangular",
                value: Texture.FIXED_EQUIRECTANGULAR_MIRRORED_MODE,
            },
            {
                label: "Planar",
                value: Texture.PLANAR_MODE,
            },
            {
                label: "Projection",
                value: Texture.PROJECTION_MODE,
            },
            {
                label: "Skybox",
                value: Texture.SKYBOX_MODE,
            },
            {
                label: "Spherical",
                value: Texture.SPHERICAL_MODE,
            },
        ];

        const samplingMode = [
            { label: "Nearest", value: Texture.NEAREST_NEAREST }, // 1
            { label: "Linear", value: Texture.LINEAR_LINEAR }, // 2

            { label: "Linear & linear mip", value: Texture.LINEAR_LINEAR_MIPLINEAR }, // 3
            { label: "Linear & nearest mip", value: Texture.LINEAR_LINEAR_MIPNEAREST }, // 11

            { label: "Nearest & linear mip", value: Texture.NEAREST_NEAREST_MIPLINEAR }, // 8
            { label: "Nearest & nearest mip", value: Texture.NEAREST_NEAREST_MIPNEAREST }, // 4

            { label: "Nearest/Linear", value: Texture.NEAREST_LINEAR }, // 7
            { label: "Nearest/Linear & linear mip", value: Texture.NEAREST_LINEAR_MIPLINEAR }, // 6
            { label: "Nearest/Linear & nearest mip", value: Texture.NEAREST_LINEAR_MIPNEAREST }, // 5

            { label: "Linear/Nearest", value: Texture.LINEAR_NEAREST }, // 12
            { label: "Linear/Nearest & linear mip", value: Texture.LINEAR_NEAREST_MIPLINEAR }, // 10
            { label: "Linear/Nearest & nearest mip", value: Texture.LINEAR_NEAREST_MIPNEAREST }, // 9
        ];

        return (
            <div>
                <GeneralPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
                <LineContainerComponent title="PROPERTIES">
                    <CheckBoxLineComponent
                        label="Auto select UV"
                        propertyName="autoSelectUV"
                        target={block}
                        onValueChanged={() => {
                            this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                        }}
                    />
                    {!isInReflectionMode && (
                        <CheckBoxLineComponent
                            label="Convert to gamma space"
                            propertyName="convertToGammaSpace"
                            target={block}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {!isInReflectionMode && (
                        <CheckBoxLineComponent
                            label="Convert to linear space"
                            propertyName="convertToLinearSpace"
                            target={block}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && showIsInGammaSpace && (
                        <CheckBoxLineComponent
                            label="Is in gamma space"
                            propertyName="gammaSpace"
                            target={texture}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {
                        <CheckBoxLineComponent
                            label="Disable multiplying by level"
                            propertyName="disableLevelMultiplication"
                            target={block}
                            onValueChanged={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    }
                    {texture && texture.updateSamplingMode && (
                        <OptionsLine
                            label="Sampling"
                            options={samplingMode}
                            target={texture}
                            noDirectUpdate={true}
                            propertyName="samplingMode"
                            onSelect={(value) => {
                                texture!.updateSamplingMode(value as number);
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && isInReflectionMode && (
                        <OptionsLine
                            label="Reflection mode"
                            options={reflectionModeOptions}
                            target={texture}
                            propertyName="coordinatesMode"
                            onSelect={(value: any) => {
                                texture!.coordinatesMode = value;
                                this.forceUpdate();
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <CheckBoxLineComponent
                            label="Clamp U"
                            isSelected={() => texture!.wrapU === Texture.CLAMP_ADDRESSMODE}
                            onSelect={(value) => {
                                texture!.wrapU = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <CheckBoxLineComponent
                            label="Clamp V"
                            isSelected={() => texture!.wrapV === Texture.CLAMP_ADDRESSMODE}
                            onSelect={(value) => {
                                texture!.wrapV = value ? Texture.CLAMP_ADDRESSMODE : Texture.WRAP_ADDRESSMODE;
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                                this.props.stateManager.onRebuildRequiredObservable.notifyObservers();
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Offset U"
                            target={texture}
                            propertyName="uOffset"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Offset V"
                            target={texture}
                            propertyName="vOffset"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Scale U"
                            target={texture}
                            propertyName="uScale"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <FloatLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Scale V"
                            target={texture}
                            propertyName="vScale"
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <SliderLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Rotation U"
                            target={texture}
                            propertyName="uAng"
                            minimum={0}
                            maximum={Math.PI * 2}
                            useEuler={true}
                            step={0.1}
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <SliderLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Rotation V"
                            target={texture}
                            propertyName="vAng"
                            minimum={0}
                            maximum={Math.PI * 2}
                            useEuler={true}
                            step={0.1}
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                    {texture && !isInReflectionMode && !isFrozenTexture && (
                        <SliderLineComponent
                            lockObject={this.props.stateManager.lockObject}
                            label="Rotation W"
                            target={texture}
                            propertyName="wAng"
                            minimum={0}
                            maximum={Math.PI * 2}
                            useEuler={true}
                            step={0.1}
                            onChange={() => {
                                this.props.stateManager.onUpdateRequiredObservable.notifyObservers(block);
                            }}
                        />
                    )}
                </LineContainerComponent>
                {!(this.textureBlock as TextureBlock).hasImageSource && (
                    <LineContainerComponent title="SOURCE">
                        <CheckBoxLineComponent
                            label="Embed static texture"
                            isSelected={() => this.state.isEmbedded}
                            onSelect={(value) => {
                                this.setState({ isEmbedded: value });
                                this.textureBlock.texture = null;
                                this.updateAfterTextureLoad();
                            }}
                        />
                        {isInReflectionMode && (
                            <CheckBoxLineComponent
                                label="Load as cube texture"
                                isSelected={() => this.state.loadAsCubeTexture}
                                onSelect={(value) => this.setState({ loadAsCubeTexture: value })}
                            />
                        )}
                        {isInReflectionMode && this.state.loadAsCubeTexture && (
                            <CheckBoxLineComponent
                                label="&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Texture is prefiltered"
                                isSelected={() => this.state.textureIsPrefiltered}
                                onSelect={(value) => this.setState({ textureIsPrefiltered: value })}
                            />
                        )}
                        {this.state.isEmbedded && <FileButtonLine label="Upload" onClick={(file) => this.replaceTexture(file)} accept=".jpg, .png, .tga, .dds, .env, .exr" />}
                        {!this.state.isEmbedded && (
                            <TextInputLineComponent
                                lockObject={this.props.stateManager.lockObject}
                                label="Link"
                                value={url}
                                onChange={(newUrl) => this.replaceTextureWithUrl(newUrl)}
                            />
                        )}
                        {!this.state.isEmbedded && url && (
                            <ButtonLineComponent label="Refresh" onClick={() => this.replaceTextureWithUrl(url + "?nocache=" + this._generateRandomForCache())} />
                        )}
                        {texture && <ButtonLineComponent label="Remove" onClick={() => this.removeTexture()} />}
                    </LineContainerComponent>
                )}
                <GenericPropertyTabComponent stateManager={this.props.stateManager} nodeData={this.props.nodeData} />
            </div>
        );
    }
}
