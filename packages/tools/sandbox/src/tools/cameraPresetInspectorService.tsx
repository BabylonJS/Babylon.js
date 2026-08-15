import { type Camera } from "core/Cameras/camera";
import { Logger } from "core/Misc/logger";
import { type FunctionComponent } from "react";
import { type IPropertiesService, type ISelectionService, type WeaklyTypedServiceDefinition } from "inspector/index";
import { type GlobalState, type InspectorV2Module } from "../globalState";

const CameraPresetNames = new WeakMap<Camera, string>();
const CameraPresetSectionOrder = Number.MAX_VALUE / 2;
const CameraMetadataSectionOrder = Number.MAX_VALUE;

export function IsCamera(entity: unknown): entity is Camera {
    const candidate = entity as Partial<Camera> | null;
    if (!candidate || typeof candidate.getScene !== "function") {
        return false;
    }

    const scene = candidate.getScene();
    return !!scene && scene.cameras.includes(entity as Camera);
}

interface ICameraPresetEditorProps {
    camera: Camera;
    globalState: GlobalState;
    inspectorModule: InspectorV2Module;
}

const CameraPresetEditor: FunctionComponent<ICameraPresetEditorProps> = (props) => {
    const { camera, globalState, inspectorModule } = props;

    return (
        <>
            <inspectorModule.TextInputPropertyLine label="Name" value={CameraPresetNames.get(camera) ?? ""} onChange={(value) => CameraPresetNames.set(camera, value)} />
            <inspectorModule.ButtonLine
                uniqueId="sandbox-save-camera-preset"
                label="Save"
                onClick={() => {
                    try {
                        globalState.cameraPresetManager.saveCamera(camera, CameraPresetNames.get(camera) ?? "");
                    } catch (error) {
                        Logger.Warn(`Unable to save Sandbox camera preset: ${error instanceof Error ? error.message : String(error)}`);
                    }
                }}
            />
        </>
    );
};

export function MakeCameraPresetInspectorServiceDefinition(globalState: GlobalState, inspectorModule: InspectorV2Module): WeaklyTypedServiceDefinition {
    return {
        friendlyName: "Sandbox Camera Preset Properties",
        consumes: [inspectorModule.PropertiesServiceIdentity, inspectorModule.SelectionServiceIdentity],
        factory: (propertiesService: IPropertiesService, selectionService: ISelectionService) => {
            const presetSectionRegistration = propertiesService.addSection({
                identity: "Save Camera Preset",
                order: CameraPresetSectionOrder,
            });
            let metadataSectionRegistration: ReturnType<IPropertiesService["addSection"]> | undefined;
            const updateMetadataSectionRegistration = () => {
                if (IsCamera(selectionService.selectedEntity)) {
                    metadataSectionRegistration ??= propertiesService.addSection({
                        identity: "Metadata",
                        order: CameraMetadataSectionOrder,
                    });
                } else if (metadataSectionRegistration) {
                    metadataSectionRegistration.dispose();
                    metadataSectionRegistration = undefined;
                }
            };
            const selectionObserver = selectionService.onSelectedEntityChanged.add(updateMetadataSectionRegistration);
            updateMetadataSectionRegistration();
            const cameraPresetSection: FunctionComponent<{ context: Camera }> = (props) => {
                const { context } = props;
                return <CameraPresetEditor camera={context} globalState={globalState} inspectorModule={inspectorModule} />;
            };
            const contentRegistration = propertiesService.addSectionContent({
                key: "Sandbox Camera Preset Properties",
                predicate: IsCamera,
                content: [
                    {
                        section: "Save Camera Preset",
                        component: cameraPresetSection,
                    },
                ],
            });

            return {
                dispose: () => {
                    selectionObserver.remove();
                    contentRegistration.dispose();
                    metadataSectionRegistration?.dispose();
                    presetSectionRegistration.dispose();
                },
            };
        },
    };
}
