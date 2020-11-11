import * as React from "react";
import { Scene } from "babylonjs/scene";
import { LineContainerComponent } from "../../lineContainerComponent";
import { CheckBoxLineComponent } from "../../lines/checkBoxLineComponent";
import { GlobalState } from "../../../globalState";
import { FloatLineComponent } from "../../lines/floatLineComponent";
import { OptionsLineComponent } from "../../lines/optionsLineComponent";
import { MessageLineComponent } from "../../lines/messageLineComponent";
import { faCheck, faTimesCircle } from "@fortawesome/free-solid-svg-icons";
import { TextLineComponent } from "../../lines/textLineComponent";
import { GLTFLoaderCoordinateSystemMode, GLTFLoaderAnimationStartMode } from "babylonjs-loaders/glTF/index";
import { Nullable } from "babylonjs/types";
import { Observer } from "babylonjs/Misc/observable";
import { IGLTFValidationResults } from "babylonjs-gltf2interface";

interface IGLTFComponentProps {
    scene: Scene;
    globalState: GlobalState;
}

export class GLTFComponent extends React.Component<IGLTFComponentProps> {
    private _onValidationResultsUpdatedObserver: Nullable<Observer<Nullable<IGLTFValidationResults>>> = null;

    openValidationDetails() {
        const validationResults = this.props.globalState.validationResults;
        const win = window.open("", "_blank");
        if (win) {
            // TODO: format this better and use generator registry (https://github.com/KhronosGroup/glTF-Generator-Registry)
            win.document.title = "glTF Validation Results";
            win.document.body.innerText = JSON.stringify(validationResults, null, 2);
            win.document.body.style.whiteSpace = "pre";
            win.document.body.style.fontFamily = `monospace`;
            win.document.body.style.fontSize = `14px`;
            win.focus();
        }
    }

    prepareText(singularForm: string, count: number) {
        if (count) {
            return `${count} ${singularForm}s`;
        }

        return `${singularForm}`;
    }

    componentDidMount() {
        if (this.props.globalState) {
            this._onValidationResultsUpdatedObserver = this.props.globalState.onValidationResultsUpdatedObservable.add(() => {
                this.forceUpdate();
            });
        }
    }

    componentWillUnmount() {
        if (this.props.globalState) {
            if (this._onValidationResultsUpdatedObserver) {
                this.props.globalState.onValidationResultsUpdatedObservable.remove(this._onValidationResultsUpdatedObserver);
            }
        }
    }

    renderValidation() {
        const validationResults = this.props.globalState.validationResults;
        if (!validationResults) {
            return null;
        }

        const issues = validationResults.issues;

        return (
            <LineContainerComponent globalState={this.props.globalState} title="GLTF VALIDATION" closed={!issues.numErrors && !issues.numWarnings}>
                {issues.numErrors !== 0 && <MessageLineComponent text="Your file has some validation issues" icon={faTimesCircle} color="Red" />}
                {issues.numErrors === 0 && <MessageLineComponent text="Your file is a valid glTF file" icon={faCheck} color="Green" />}
                <TextLineComponent label="Errors" value={issues.numErrors.toString()} />
                <TextLineComponent label="Warnings" value={issues.numWarnings.toString()} />
                <TextLineComponent label="Infos" value={issues.numInfos.toString()} />
                <TextLineComponent label="Hints" value={issues.numHints.toString()} />
                <TextLineComponent label="More details" value="Click here" onLink={() => this.openValidationDetails()} />
            </LineContainerComponent>
        );
    }

    render() {
        const extensionStates = this.props.globalState.glTFLoaderExtensionDefaults;
        const loaderState = this.props.globalState.glTFLoaderDefaults;

        var animationStartMode =
            (typeof GLTFLoaderAnimationStartMode !== "undefined"
                ? [
                      { label: "None", value: GLTFLoaderAnimationStartMode.NONE },
                      { label: "First", value: GLTFLoaderAnimationStartMode.FIRST },
                      { label: "ALL", value: GLTFLoaderAnimationStartMode.ALL },
                  ]
                : [
                    { label: "None", value: 0 },
                    { label: "First", value: 1 },
                    { label: "ALL", value: 2 },
                ]);

        var coordinateSystemMode =
            typeof GLTFLoaderCoordinateSystemMode !== "undefined"
                ? [
                      { label: "Auto", value: GLTFLoaderCoordinateSystemMode.AUTO },
                      { label: "Right handed", value: GLTFLoaderCoordinateSystemMode.FORCE_RIGHT_HANDED },
                  ]
                : [
                    { label: "Auto", value: 0 },
                    { label: "Right handed", value: 1 },
                ];

        return (
            <div>
                <LineContainerComponent globalState={this.props.globalState} title="GLTF LOADER" closed={true}>
                    <OptionsLineComponent label="Animation start mode" options={animationStartMode} target={loaderState} propertyName="animationStartMode" />
                    <CheckBoxLineComponent label="Capture performance counters" target={loaderState} propertyName="capturePerformanceCounters" />
                    <CheckBoxLineComponent label="Compile materials" target={loaderState} propertyName="compileMaterials" />
                    <CheckBoxLineComponent label="Compile shadow generators" target={loaderState} propertyName="compileShadowGenerators" />
                    <OptionsLineComponent label="Coordinate system" options={coordinateSystemMode} target={loaderState} propertyName="coordinateSystemMode" />
                    <CheckBoxLineComponent label="Enable logging" target={loaderState} propertyName="loggingEnabled" />
                    <CheckBoxLineComponent label="Transparency as coverage" target={loaderState} propertyName="transparencyAsCoverage" />
                    <CheckBoxLineComponent label="Use clip plane" target={loaderState} propertyName="useClipPlane" />
                    <CheckBoxLineComponent label="Validate" target={loaderState} propertyName="validate" />
                    <MessageLineComponent text="You need to reload your file to see these changes" />
                </LineContainerComponent>
                <LineContainerComponent globalState={this.props.globalState} title="GLTF EXTENSIONS" closed={true}>
                    <CheckBoxLineComponent label="MSFT_lod" isSelected={() => extensionStates["MSFT_lod"].enabled} onSelect={(value) => (extensionStates["MSFT_lod"].enabled = value)} />
                    <FloatLineComponent label="Maximum LODs" target={extensionStates["MSFT_lod"]} propertyName="maxLODsToLoad" additionalClass="gltf-extension-property" isInteger={true} />
                    <CheckBoxLineComponent label="MSFT_minecraftMesh" isSelected={() => extensionStates["MSFT_minecraftMesh"].enabled} onSelect={(value) => (extensionStates["MSFT_minecraftMesh"].enabled = value)} />
                    <CheckBoxLineComponent label="MSFT_sRGBFactors" isSelected={() => extensionStates["MSFT_sRGBFactors"].enabled} onSelect={(value) => (extensionStates["MSFT_sRGBFactors"].enabled = value)} />
                    <CheckBoxLineComponent label="MSFT_audio_emitter" isSelected={() => extensionStates["MSFT_audio_emitter"].enabled} onSelect={(value) => (extensionStates["MSFT_audio_emitter"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_draco_mesh_compression" isSelected={() => extensionStates["KHR_draco_mesh_compression"].enabled} onSelect={(value) => (extensionStates["KHR_draco_mesh_compression"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_mesh_quantization" isSelected={() => extensionStates["KHR_mesh_quantization"].enabled} onSelect={(value) => (extensionStates["KHR_mesh_quantization"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_pbrSpecularGloss..." isSelected={() => extensionStates["KHR_materials_pbrSpecularGlossiness"].enabled} onSelect={(value) => (extensionStates["KHR_materials_pbrSpecularGlossiness"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_clearcoat" isSelected={() => extensionStates["KHR_materials_clearcoat"].enabled} onSelect={(value) => (extensionStates["KHR_materials_clearcoat"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_ior" isSelected={() => extensionStates["KHR_materials_ior"].enabled} onSelect={(value) => (extensionStates["KHR_materials_ior"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_sheen" isSelected={() => extensionStates["KHR_materials_sheen"].enabled} onSelect={(value) => (extensionStates["KHR_materials_sheen"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_specular" isSelected={() => extensionStates["KHR_materials_specular"].enabled} onSelect={(value) => (extensionStates["KHR_materials_specular"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_unlit" isSelected={() => extensionStates["KHR_materials_unlit"].enabled} onSelect={(value) => (extensionStates["KHR_materials_unlit"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_variants" isSelected={() => extensionStates["KHR_materials_variants"].enabled} onSelect={(value) => (extensionStates["KHR_materials_variants"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_transmission" isSelected={() => extensionStates["KHR_materials_transmission"].enabled} onSelect={(value) => (extensionStates["KHR_materials_transmission"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_materials_translucency" isSelected={() => extensionStates["KHR_materials_translucency"].enabled} onSelect={(value) => (extensionStates["KHR_materials_translucency"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_lights_punctual" isSelected={() => extensionStates["KHR_lights_punctual"].enabled} onSelect={(value) => (extensionStates["KHR_lights_punctual"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_texture_basisu" isSelected={() => extensionStates["KHR_texture_basisu"].enabled} onSelect={(value) => (extensionStates["KHR_texture_basisu"].enabled = value)} />
                    <CheckBoxLineComponent label="KHR_texture_transform" isSelected={() => extensionStates["KHR_texture_transform"].enabled} onSelect={(value) => (extensionStates["KHR_texture_transform"].enabled = value)} />
                    <CheckBoxLineComponent label="EXT_lights_image_based" isSelected={() => extensionStates["EXT_lights_image_based"].enabled} onSelect={(value) => (extensionStates["EXT_lights_image_based"].enabled = value)} />
                    <CheckBoxLineComponent label="EXT_mesh_gpu_instancing" isSelected={() => extensionStates["EXT_mesh_gpu_instancing"].enabled} onSelect={(value) => (extensionStates["EXT_mesh_gpu_instancing"].enabled = value)} />
                    <CheckBoxLineComponent label="EXT_texture_webp" isSelected={() => extensionStates["EXT_texture_webp"].enabled} onSelect={(value) => (extensionStates["EXT_texture_webp"].enabled = value)} />
                    <MessageLineComponent text="You need to reload your file to see these changes" />
                </LineContainerComponent>
                {loaderState["validate"] && this.props.globalState.validationResults && this.renderValidation()}
            </div>
        );
    }
}
