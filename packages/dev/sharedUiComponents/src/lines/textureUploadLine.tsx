import * as React from "react";
import { Tools } from "core/Misc/tools";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import { Texture } from "core/Materials/Textures/texture";
import type { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { FileButtonLine } from "shared-ui-components/lines/fileButtonLineComponent";

interface ITextureUploadLineProps {
    texture: BaseTexture;
    label?: string;
    accept?: string;
    onTextureUpdated?: () => void;
}

/**
 * Component for uploading and updating a texture from a file
 * Handles both regular textures and cube textures
 */
export class TextureUploadLine extends React.Component<ITextureUploadLineProps> {
    static defaultProps = {
        label: "Load texture from file",
        accept: ".jpg, .png, .tga, .dds, .env, .exr",
    };

    updateTexture = (file: File) => {
        const texture = this.props.texture;
        Tools.ReadFile(
            file,
            (data) => {
                const blob = new Blob([data], { type: "octet/stream" });

                const reader = new FileReader();
                reader.readAsDataURL(blob);
                reader.onloadend = () => {
                    const base64data = reader.result as string;

                    if (texture.isCube) {
                        let extension: string | undefined = undefined;
                        if (file.name.toLowerCase().indexOf(".dds") > 0) {
                            extension = ".dds";
                        } else if (file.name.toLowerCase().indexOf(".env") > 0) {
                            extension = ".env";
                        }

                        (texture as CubeTexture).updateURL(base64data, extension, () => this.props.onTextureUpdated?.());
                    } else {
                        (texture as Texture).updateURL(base64data, null, () => this.props.onTextureUpdated?.());
                    }
                };
            },
            undefined,
            true
        );
    };

    override render() {
        return <FileButtonLine label={this.props.label!} onClick={this.updateTexture} accept={this.props.accept!} />;
    }
}
