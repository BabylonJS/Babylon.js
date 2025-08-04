import { Scene } from "core/scene";
import { type FunctionComponent } from "react";
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

let StoredEnvironmentTexture: Nullable<BaseTexture>;

export const SceneMaterialImageProcessingProperties: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;
    const imageProcessing = scene.imageProcessingConfiguration;

    return (
        <>
            <BoundProperty component={SyncedSliderPropertyLine} label="Contrast" min={0} max={4} step={0.1} target={imageProcessing} propertyKey="contrast" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Exposure" min={0} max={4} step={0.1} target={imageProcessing} propertyKey="exposure" />
            <BoundProperty component={SwitchPropertyLine} label="Tone mapping" target={imageProcessing} propertyKey="toneMappingEnabled" />
            <NumberDropdownPropertyLine
                options={
                    [
                        { label: "Standard", value: ImageProcessingConfiguration.TONEMAPPING_STANDARD },
                        { label: "ACES", value: ImageProcessingConfiguration.TONEMAPPING_ACES },
                        { label: "Khronos PBR Neutral", value: ImageProcessingConfiguration.TONEMAPPING_KHR_PBR_NEUTRAL },
                    ] as const
                }
                label="Tone mapping type"
                value={imageProcessing.toneMappingType}
                onChange={(value) => {
                    imageProcessing.toneMappingType = value;
                }}
            />
            <BoundProperty component={SwitchPropertyLine} label="Vignette" target={imageProcessing} propertyKey="vignetteEnabled" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Vignette FOV" min={0} max={Math.PI} step={0.1} target={imageProcessing} propertyKey="vignetteCameraFov" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Vignette center X" min={0} max={1} step={0.1} target={imageProcessing} propertyKey="vignetteCenterX" />
            <BoundProperty component={SyncedSliderPropertyLine} label="Vignette center Y" min={0} max={1} step={0.1} target={imageProcessing} propertyKey="vignetteCenterY" />
            <Color4PropertyLine
                label="Vignette color"
                value={imageProcessing.vignetteColor}
                onChange={(value) => {
                    imageProcessing.vignetteColor = value;
                }}
            />
            <NumberDropdownPropertyLine
                options={
                    [
                        { label: "Multiply", value: ImageProcessingConfiguration.VIGNETTEMODE_MULTIPLY },
                        { label: "Opaque", value: ImageProcessingConfiguration.VIGNETTEMODE_OPAQUE },
                    ] as const
                }
                label="Vignette blend mode"
                value={imageProcessing.vignetteBlendMode}
                onChange={(value) => {
                    imageProcessing.vignetteBlendMode = value;
                }}
            />
            <BoundProperty component={SwitchPropertyLine} label="Dithering" target={imageProcessing} propertyKey="ditheringEnabled" />
            <BoundProperty
                component={SyncedSliderPropertyLine}
                label="Dithering intensity"
                min={0}
                max={1}
                step={0.5 / 255.0}
                target={imageProcessing}
                propertyKey="ditheringIntensity"
            />
        </>
    );
};

export const ScenePhysicsProperties: FunctionComponent<{ scene: Scene }> = (props) => {
    const { scene } = props;

    const physicsEngine = scene.getPhysicsEngine();

    return (
        <>
            {physicsEngine !== null ? (
                <>
                    <NumberInputPropertyLine
                        label="Time step"
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
                label={"Normalize scene"}
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
                label="Rendering mode"
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

            <Color4PropertyLine
                label="Clear color"
                value={scene.clearColor}
                onChange={(value) => {
                    scene.clearColor = value;
                }}
            />

            <BoundProperty component={SwitchPropertyLine} label="Clear color enabled" target={scene} propertyKey="autoClear" />

            <Color3PropertyLine
                label="Ambient color"
                value={scene.ambientColor}
                onChange={(value) => {
                    scene.ambientColor = value;
                }}
            />

            <SwitchPropertyLine
                label="Environment texture (IBL)"
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
                <LinkPropertyLine label="Env. texture" value={scene.environmentTexture.name} onLink={() => (selectionService.selectedEntity = scene.environmentTexture)} />
            )}

            <FileUploadLine
                label="Update environment texture"
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

            <NumberDropdownPropertyLine
                options={
                    [
                        { label: "None", value: Scene.FOGMODE_NONE },
                        { label: "Linear", value: Scene.FOGMODE_LINEAR },
                        { label: "Exp", value: Scene.FOGMODE_EXP },
                        { label: "Exp2", value: Scene.FOGMODE_EXP2 },
                    ] as const
                }
                label="Fog mode"
                value={fogMode}
                onChange={(value) => {
                    scene.fogMode = value;
                }}
            />
            {fogMode !== Scene.FOGMODE_NONE && (
                <Color3PropertyLine
                    label="Fog color"
                    value={scene.fogColor}
                    onChange={(value) => {
                        scene.fogColor = value;
                    }}
                />
            )}
            {(fogMode === Scene.FOGMODE_EXP || fogMode === Scene.FOGMODE_EXP2) && (
                <BoundProperty component={NumberInputPropertyLine} label="Fog density" target={scene} propertyKey="fogDensity" step={0.1} />
            )}
            {fogMode === Scene.FOGMODE_LINEAR && <BoundProperty component={NumberInputPropertyLine} label="Fog start" target={scene} propertyKey="fogStart" step={0.1} />}
            {fogMode === Scene.FOGMODE_LINEAR && <BoundProperty component={NumberInputPropertyLine} label="Fog end" target={scene} propertyKey="fogEnd" step={0.1} />}
        </>
    );
};
