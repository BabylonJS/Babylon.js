import * as react from "react";
import { FileButtonLine } from "@babylonjs/shared-ui-components/lines/fileButtonLineComponent.js";
import { NumericInput } from "@babylonjs/shared-ui-components/lines/numericInputComponent.js";
import { type ConnectionPointType, type InputBlock } from "@babylonjs/smart-filters";
import { Tools } from "@babylonjs/core/Misc/tools.js";
import type { GlobalState, TexturePreset } from "../../../globalState.js";
import { OptionsLine } from "@babylonjs/shared-ui-components/lines/optionsLineComponent.js";
import type { IInspectableOptions } from "@babylonjs/core/Misc/iInspectable.js";
import { CheckBoxLineComponent } from "../../../sharedComponents/checkBoxLineComponent.js";

import type { Nullable } from "@babylonjs/core/types.js";
import { getTextureInputBlockEditorData } from "../../../graphSystem/getEditorData.js";
import { LazyTextInputLineComponent } from "../../../sharedComponents/lazyTextInputLineComponent.js";
import { debounce } from "../../../helpers/debounce.js";
import type { StateManager } from "@babylonjs/shared-ui-components/nodeGraphSystem/stateManager.js";

export interface ImageSourcePropertyTabComponentProps {
    stateManager: StateManager;
    inputBlock: InputBlock<ConnectionPointType.Texture>;
}

const CustomImageOption = -1;
const AssetTypeOptionArray = ["image", "video"];
const AssetTypeOptions: IInspectableOptions[] = AssetTypeOptionArray.map((value, index) => {
    return { label: value, value: index };
});
const DataUrlPlaceholder = "";

export class ImageSourcePropertyTabComponent extends react.Component<ImageSourcePropertyTabComponentProps> {
    private readonly _imageOptions: IInspectableOptions[];
    private readonly _texturePresets: TexturePreset[];

    constructor(props: ImageSourcePropertyTabComponentProps) {
        super(props);
        this._imageOptions = [{ label: "Custom", value: CustomImageOption }];
        this._texturePresets = (props.stateManager.data as GlobalState).texturePresets;

        let index = 0;
        this._texturePresets.forEach((preset: TexturePreset) => {
            this._imageOptions.push({
                label: preset.name,
                value: index++,
            });
        });

        this._imageOptions;
    }

    override componentDidMount() {}

    override componentWillUnmount() {}

    setDefaultValue() {}

    override render() {
        const editorData = getTextureInputBlockEditorData(this.props.inputBlock);

        // If the reloadAssets callback wasn't supplied, don't show any properties
        if (!(this.props.stateManager.data as GlobalState).reloadAssets) {
            return null;
        }

        // Don't read/write the url directly, it may be base64 encoded data and not a URL
        // In that case, we show a placeholder instead
        const urlTextInputTarget = {
            url: (editorData.url ?? "").indexOf("data:") === 0 ? DataUrlPlaceholder : editorData.url,
        };

        return (
            <div>
                <OptionsLine
                    label="Source"
                    target={{}}
                    propertyName="value"
                    options={this._imageOptions}
                    noDirectUpdate
                    extractValue={() => {
                        if (editorData.url?.startsWith("data:")) {
                            return CustomImageOption;
                        }
                        const url =
                            editorData.url || this.props.inputBlock.runtimeValue.value?.getInternalTexture()?.url;
                        if (!url) {
                            return CustomImageOption;
                        }
                        const texturePresetIndex = this._imageOptions.findIndex(
                            (c: IInspectableOptions) =>
                                (this._texturePresets[c.value as unknown as number]?.url || "") === url
                        );
                        return texturePresetIndex !== -1
                            ? this._imageOptions[texturePresetIndex]!.value
                            : CustomImageOption;
                    }}
                    onSelect={(newSelectionValue: string | number) => {
                        if (newSelectionValue === CustomImageOption || typeof newSelectionValue === "string") {
                            // Take no action, let the user click the Upload button
                            return;
                        }
                        editorData.url = this._texturePresets[newSelectionValue]?.url || "";
                        editorData.urlTypeHint = this._getUrlTypeHint(editorData.url);

                        this._triggerAssetUpdate(true);
                    }}
                />
                <FileButtonLine
                    label="Upload Custom Image"
                    onClick={(file: File) => {
                        Tools.ReadFile(
                            file,
                            (data) => {
                                const blob = new Blob([data], { type: "octet/stream" });
                                const reader = new FileReader();
                                reader.readAsDataURL(blob);
                                reader.onloadend = () => {
                                    const base64data = reader.result as string;
                                    let extension: Nullable<string> = null;
                                    if (file.name.toLowerCase().indexOf(".dds") > 0) {
                                        extension = ".dds";
                                    } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                                        extension = ".env";
                                    }

                                    editorData.url = base64data;
                                    editorData.forcedExtension = extension;
                                    editorData.urlTypeHint = this._getUrlTypeHint(file.name);
                                    this.forceUpdate();

                                    this._triggerAssetUpdate(true);
                                };
                            },
                            undefined,
                            true
                        );
                    }}
                    accept=".jpg, .jpeg, .png, .tga, .dds, .env"
                />
                <OptionsLine
                    label="Asset Type"
                    target={{}}
                    propertyName="value"
                    options={AssetTypeOptions}
                    noDirectUpdate
                    extractValue={() => {
                        const value = editorData.urlTypeHint ?? "image";
                        return AssetTypeOptionArray.indexOf(value);
                    }}
                    onSelect={(newSelectionValue: string | number) => {
                        if (typeof newSelectionValue === "number") {
                            editorData.urlTypeHint = AssetTypeOptionArray[newSelectionValue] as "image" | "video";
                            this._triggerAssetUpdate(true);
                        }
                    }}
                />
                <LazyTextInputLineComponent
                    key={this.props.inputBlock.uniqueId}
                    label="URL"
                    propertyName="url"
                    lockObject={this.props.stateManager.lockObject}
                    target={urlTextInputTarget}
                    onSubmit={() => {
                        if (urlTextInputTarget.url !== DataUrlPlaceholder) {
                            editorData.url = urlTextInputTarget.url;
                            editorData.urlTypeHint = this._getUrlTypeHint(editorData.url ?? "");
                            this._triggerAssetUpdate();
                        }
                    }}
                />
                <CheckBoxLineComponent
                    label="FlipY"
                    target={editorData}
                    propertyName="flipY"
                    onValueChanged={() => this._triggerAssetUpdate(true)}
                />
                <NumericInput
                    lockObject={(this.props.stateManager.data as GlobalState).lockObject}
                    label="AFL"
                    labelTooltip="anisotropicFilteringLevel"
                    precision={0}
                    value={editorData.anisotropicFilteringLevel ?? 4}
                    onChange={(value: number) => {
                        editorData.anisotropicFilteringLevel = value;
                        this._triggerAssetUpdate(true);
                    }}
                />
            </div>
        );
    }

    private _triggerAssetUpdate(instant: boolean = false) {
        this.props.stateManager.onUpdateRequiredObservable.notifyObservers(this.props.inputBlock);
        this.forceUpdate();

        const update = () => {
            const globalState = this.props.stateManager.data as GlobalState;
            globalState.reloadAssets?.();
        };

        if (instant) {
            update();
        } else {
            debounce(update, 1000)();
        }
    }

    private _getUrlTypeHint(url: string): "image" | "video" {
        const extension: Nullable<string> = url.toLowerCase().split(".").pop() ?? null;
        return extension === "mp4" ? "video" : "image";
    }
}
