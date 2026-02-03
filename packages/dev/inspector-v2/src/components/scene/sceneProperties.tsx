import { Scene } from "core/scene";
import type { FunctionComponent } from "react";
import { Color3PropertyLine, Color4PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/colorPropertyLine";
import { NumberDropdownPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/dropdownPropertyLine";
import { BoundProperty } from "../properties/boundProperty";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";
import type { BaseTexture } from "core/Materials/Textures/baseTexture";
import type { Nullable } from "core/types";
import { LinkPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/linkPropertyLine";
import type { ISelectionService } from "../../services/selectionService";
import { FileUploadLine } from "shared-ui-components/fluent/hoc/fileUploadLine";
import { Logger } from "core/Misc/logger";
import { Tools } from "core/Misc/tools";
import { CubeTexture } from "core/Materials/Textures/cubeTexture";
import { useProperty } from "../../hooks/compoundPropertyHooks";
import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";
import { NumberInputPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/inputPropertyLine";
import { ImageProcessingConfiguration } from "core/Materials/imageProcessingConfiguration";
import { Vector3PropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/vectorPropertyLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { Collapse } from "shared-ui-components/fluent/primitives/collapse";

let StoredEnvironmentTexture: Nullable<BaseTexture>;

export const SceneMaterialImageProcessingProperties: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;
    const imageProcessing = scene.imageProcessingConfiguration;

    return (
        <>
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Contrast"
                min={0}
                max={4}
                step={0.1}
                target={imageProcessing}
                propertyKey="contrast"
                propertyPath="imageProcessingConfiguration.contrast"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Exposure"
                min={0}
                max={4}
                step={0.1}
                target={imageProcessing}
                propertyKey="exposure"
                propertyPath="imageProcessingConfiguration.exposure"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Tone Mapping"
                target={imageProcessing}
                propertyKey="toneMappingEnabled"
                propertyPath="imageProcessingConfiguration.toneMappingEnabled"
            />
            <Collapse visible={imageProcessing.toneMappingEnabled}>
                <BoundProperty
                    component={NumberDropdownPropertyLine}
                    options={
                        [
                            { label: "Standard", value: ImageProcessingConfiguration.TONEMAPPING_STANDARD },
                            { label: "ACES", value: ImageProcessingConfiguration.TONEMAPPING_ACES },
                            { label: "Khronos PBR Neutral", value: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL },
                        ] as const
                    }
                    label="Tone Mapping Type"
                    target={imageProcessing}
                    propertyKey="toneMappingType"
                    propertyPath="imageProcessingConfiguration.toneMappingType"
                />
            </Collapse>
            <BoundProperty
                component={SwitchPropertyLine}
                label="Vignette"
                target={imageProcessing}
                propertyKey="vignetteEnabled"
                propertyPath="imageProcessingConfiguration.vignetteEnabled"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Vignette FOV"
                min={0}
                max={Math.PI}
                step={0.1}
                target={imageProcessing}
                propertyKey="vignetteCameraFov"
                propertyPath="imageProcessingConfiguration.vignetteCameraFov"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Vignette Center X"
                min={0}
                max={1}
                step={0.1}
                target={imageProcessing}
                propertyKey="vignetteCenterX"
                propertyPath="imageProcessingConfiguration.vignetteCenterX"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Vignette Center Y"
                min={0}
                max={1}
                step={0.1}
                target={imageProcessing}
                propertyKey="vignetteCenterY"
                propertyPath="imageProcessingConfiguration.vignetteCenterY"
            />
            <BoundProperty
                component={Color4PropertyLine}
                label="Vignette Color"
                target={imageProcessing}
                propertyKey="vignetteColor"
                propertyPath="imageProcessingConfiguration.vignetteColor"
            />
            <BoundProperty
                component={NumberDropdownPropertyLine}
                options={
                    [
                        { label: "Multiply", value: ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY },
                        { label: "Opaque", value: ImageProcessingConfiguration.VIGNETTEMODE_OPAQUE },
                    ] as const
                }
                label="Vignette Blend Mode"
                target={imageProcessing}
                propertyKey="vignetteBlendMode"
                propertyPath="imageProcessingConfiguration.vignetteBlendMode"
            />
            <BoundProperty
                component={SwitchPropertyLine}
                label="Dithering"
                target={imageProcessing}
                propertyKey="ditheringEnabled"
                propertyPath="imageProcessingConfiguration.ditheringEnabled"
            />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Dithering Intensity"
                min={0}
                max={1}
                step={0.5 / 255.0}
                target={imageProcessing}
                propertyKey="ditheringIntensity"
                propertyPath="imageProcessingConfiguration.ditheringIntensity"
            />
        </>
    );
};

export const ScenePhysicsProperties: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;

    const physicsEngine = scene.getPhysicsEngine();

    return (
        <>
            {physicsEngine ? (
                <>
                    <NumberInputPropertyLine
                        label="Time Step"
                        value={physicsEngine.getTimeStep()}
                        onChange={(value) => {
                            physicsEngine.setTimeStep(value);
                        }}
                    />
                    <Vector3PropertyLine
                        label="Gravity"
                        value={physicsEngine.gravity}
                        onChange={(value) => {
                            physicsEngine.setGravity(value);
                        }}
                    />
                </>
            ) : (
                <MessageBar
                    intent="info"
                    title="No physics engine"
                    message="There is no physics engine enabled on this scene."
                    docLink="https://doc.babylonjs.com/communityExtensions/editor/physics/usingPhysics/"
                />
            )}
        </>
    );
};

export const SceneCollisionsProperties: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;

    return (
        <>
            <BoundProperty component={Vector3PropertyLine} label="Gravity" target={scene} propertyKey="gravity" />
        </>
    );
};

export const SceneShadowsProperties: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;

    return (
        <>
            <ButtonLine
                label={"Normalize Scene"}
                onClick={() => {
                    for (const mesh of scene.meshes) {
                        mesh.normalizeToUnitCube(true);
                        mesh.computeWorldMatrix(true);
                    }
                }}
            />
        </>
    );
};

export const SceneRenderingProperties: FunctionComponent<{ scene: Scene; selectionService: ISelectionService }> = (props) => {
    const { scene, selectionService } = props;

    const envTexture = useProperty(scene, "environmentTexture");
    const fogMode = useProperty(scene, "fogMode");

    return (
        <>
            <NumberDropdownPropertyLine
                options={
                    [
                        { label: "Point", value: 0 },
                        { label: "Wireframe", value: 1 },
                        { label: "Solid", value: 2 },
                    ] as const
                }
                label="Rendering Mode"
                value={scene.forcePointsCloud ? 0 : scene.forceWireframe ? 1 : 2}
                onChange={(value) => {
                    switch (value) {
                        case 0:
                            scene.forcePointsCloud = true;
                            scene.forceWireframe = false;
                            break;
                        case 1:
                            scene.forcePointsCloud = false;
                            scene.forceWireframe = true;
                            break;
                        case 2:
                            scene.forcePointsCloud = false;
                            scene.forceWireframe = false;
                            break;
                    }
                }}
            />

            <BoundProperty component={Color4PropertyLine} label="Clear Color" target={scene} propertyKey="clearColor" />

            <BoundProperty component={SwitchPropertyLine} label="Clear Color Enabled" target={scene} propertyKey="autoClear" />

            <BoundProperty component={Color3PropertyLine} label="Ambient Color" target={scene} propertyKey="ambientColor" />

            <SwitchPropertyLine
                label="Environment Texture (IBL)"
                value={envTexture ? true : false}
                onChange={() => {
                    if (envTexture) {
                        StoredEnvironmentTexture = envTexture;
                        scene.environmentTexture = null;
                    } else {
                        scene.environmentTexture = StoredEnvironmentTexture;
                        StoredEnvironmentTexture = null;
                    }
                }}
            />

            {scene.environmentTexture && (
                <LinkPropertyLine label="Env. Texture" value={scene.environmentTexture.name} onLink={() => (selectionService.selectedEntity = scene.environmentTexture)} />
            )}

            <FileUploadLine
                label="Update Environment Texture"
                accept=".dds, .env"
                onClick={(files) => {
                    if (files.length > 0) {
                        const file = files[0];
                        const isFileDDS = file.name.toLowerCase().indexOf(".dds") > 0;
                        const isFileEnv = file.name.toLowerCase().indexOf(".env") > 0;
                        if (!isFileDDS && !isFileEnv) {
                            Logger.Error("Unable to update environment texture. Please select a dds or env file.");
                            return;
                        }

                        Tools.ReadFile(
                            file,
                            (data) => {
                                const blob = new Blob([data], { type: "octet/stream" });
                                const url = URL.createObjectURL(blob);
                                if (isFileDDS) {
                                    scene.environmentTexture = CubeTexture.CreateFromPrefilteredData(url, scene, ".dds");
                                } else {
                                    scene.environmentTexture = new CubeTexture(
                                        url,
                                        scene,
                                        undefined,
                                        undefined,
                                        undefined,
                                        () => {},
                                        (message) => {
                                            if (message) {
                                                Logger.Error(message);
                                            }
                                        },
                                        undefined,
                                        undefined,
                                        ".env"
                                    );
                                }
                            },
                            undefined,
                            true
                        );
                    }
                }}
            />

            <BoundProperty component={SyncedSliderPropertyLine} label="IBL Intensity" min={0} max={2} step={0.01} target={scene} propertyKey="iblIntensity" />

            <BoundProperty
                component={NumberDropdownPropertyLine}
                options={
                    [
                        { label: "None", value: Scene.FOGMODE_NONE },
                        { label: "Linear", value: Scene.FOGMODE_LINEAR },
                        { label: "Exp", value: Scene.FOGMODE_EXP },
                        { label: "Exp2", value: Scene.FOGMODE_EXP2 },
                    ] as const
                }
                label="Fog Mode"
                target={scene}
                propertyKey="fogMode"
            />
            <Collapse visible={fogMode !== Scene.FOGMODE_NONE}>
                <>
                    {fogMode !== Scene.FOGMODE_NONE && <BoundProperty component={Color3PropertyLine} label="Fog Color" target={scene} propertyKey="fogColor" />}
                    {(fogMode === Scene.FOGMODE_EXP || fogMode === Scene.FOGMODE_EXP2) && (
                        <BoundProperty component={NumberInputPropertyLine} label="Fog Density" target={scene} propertyKey="fogDensity" step={0.1} />
                    )}
                    {fogMode === Scene.FOGMODE_LINEAR && <BoundProperty component={NumberInputPropertyLine} label="Fog Start" target={scene} propertyKey="fogStart" step={0.1} />}
                    {fogMode === Scene.FOGMODE_LINEAR && <BoundProperty component={NumberInputPropertyLine} label="Fog End" target={scene} propertyKey="fogEnd" step={0.1} />}
                </>
            </Collapse>
        </>
    );
};
