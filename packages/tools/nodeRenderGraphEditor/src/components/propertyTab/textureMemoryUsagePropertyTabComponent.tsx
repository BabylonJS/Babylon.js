import * as React from "react";
import type { GlobalState } from "../../globalState";
import { LineContainerComponent } from "../../sharedComponents/lineContainerComponent";

import "./propertyTab.scss";
import { TextLineComponent } from "shared-ui-components/lines/textLineComponent";

interface ITextureMemoryUsagePropertyTabComponentProps {
    globalState: GlobalState;
}

export class TextureMemoryUsagePropertyTabComponent extends React.Component<ITextureMemoryUsagePropertyTabComponentProps> {
    constructor(props: ITextureMemoryUsagePropertyTabComponentProps) {
        super(props);
    }

    private _formatMemorySize(value: number) {
        if (value < 1024) {
            return value + " B";
        } else if (value < 1024 * 1024) {
            return (value / 1024).toFixed(1) + " KB";
        } else if (value < 1024 * 1024 * 1024) {
            return (value / (1024 * 1024)).toFixed(2) + " MB";
        }
        return (value / (1024 * 1024 * 1024)).toFixed(3) + " GB";
    }

    override render() {
        const textureManager = this.props.globalState.nodeRenderGraph.frameGraph.textureManager;

        const totalSize = textureManager.computeTotalTextureSize(false, 1280, 960);
        const optimisedSize = textureManager.computeTotalTextureSize(true, 1280, 960);
        const saving = Math.round((100 * (totalSize - optimisedSize)) / totalSize);

        const optimizedTextures = [];

        if (saving > 0) {
            for (const textureHandle of textureManager._textures.keys()) {
                const textureEntry = textureManager._textures.get(textureHandle);
                if (textureEntry?.aliasHandle !== undefined) {
                    const aliasTextureEntry = textureManager._textures.get(textureEntry.aliasHandle);
                    if (aliasTextureEntry) {
                        optimizedTextures.push(<TextLineComponent key={textureHandle} ignoreValue={true} label={textureEntry.name + " reuses " + aliasTextureEntry.name} />);
                    }
                }
            }
        }

        return (
            <LineContainerComponent title="TEXTURE MEMORY USAGE">
                {totalSize !== 0 && (
                    <>
                        <TextLineComponent label="Total size" value={this._formatMemorySize(totalSize)} />
                        <TextLineComponent label="Optimized size" value={this._formatMemorySize(optimisedSize)} />
                        <TextLineComponent label="Saving" value={saving + "%"} />
                        <div style={{ fontSize: "10px", textAlign: "center" }}>
                            <TextLineComponent ignoreValue={true} label="(for calculation purposes, the output size is 1280p)" />
                        </div>
                        {saving > 0 && <>{optimizedTextures}</>}
                    </>
                )}
            </LineContainerComponent>
        );
    }
}
