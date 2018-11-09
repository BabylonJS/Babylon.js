import * as React from "react";
import { Scene } from "babylonjs";
import { LineContainerComponent } from "../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../lines/checkBoxLineComponent";
import { GlobalState } from "../../../globalState";

interface IGLTFComponentProps {
    scene: Scene,
    globalState: GlobalState
}

export class GLTFComponent extends React.Component<IGLTFComponentProps> {
    constructor(props: IGLTFComponentProps) {
        super(props);

        const extensionStates = this.props.globalState.glTFLoaderDefaults;
        extensionStates["MSFT_lod"] = extensionStates["MSFT_lod"] || { isEnabled: true };
    }

    render() {
        const extensionStates = this.props.globalState.glTFLoaderDefaults;
        return (
            <div>
                <LineContainerComponent title="GLTF EXTENSIONS">
                    <CheckBoxLineComponent label="MSFT_lod" isSelected={() => extensionStates["MSFT_lod"].isEnabled} onSelect={value => extensionStates["MSFT_lod"].isEnabled = value} />
                </LineContainerComponent>
                <LineContainerComponent title="GLTF VALIDATION RESULTS">
                </LineContainerComponent>
            </div>
        );
    }
}