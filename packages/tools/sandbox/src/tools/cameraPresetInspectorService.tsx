import { type Camera } from "core/Cameras/camera";
import { type FunctionComponent } from "react";
import { type IPropertiesService, type ISelectionService, type WeaklyTypedServiceDefinition } from "inspector/index";
import { type InspectorV2Module } from "../globalState";
import { type CameraPresetManager } from "./cameraPresetManager";

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
    cameraPresetManager: CameraPresetManager;
    inspectorModule: InspectorV2Module;
}

const CameraPresetEditor: FunctionComponent<ICameraPresetEditorProps> = (props) => {
    const { camera, cameraPresetManager, inspectorModule } = props;

    return (
        <>
            <inspectorModule.TextInputPropertyLine label="Name" value={CameraPresetNames.get(camera) ?? ""} onChange={(value) => CameraPresetNames.set(camera, value)} />
            <inspectorModule.ButtonLine
                uniqueId="sandbox-save-camera-preset"
                label="Save"
                onClick={() => cameraPresetManager.saveCamera(camera, CameraPresetNames.get(camera) ?? "")}
            />
        </>
    );
};

export function MakeCameraPresetInspectorServiceDefinition(cameraPresetManager: CameraPresetManager, inspectorModule: InspectorV2Module): WeaklyTypedServiceDefinition {
    return {
        friendlyName: "Sandbox Camera Preset Properties",
        consumes: [inspectorModule.PropertiesServiceIdentity, inspectorModule.SelectionServiceIdentity],
        factory: (propertiesService: IPropertiesService, selectionService: ISelectionService) => {
            const presetSectionRegistration = propertiesService.addSection({
                identity: "Save Camera Preset",
                order: CameraPresetSectionOrder,
            });
            let metadataSectionRegistration: ReturnType<IPropertiesService["addSection"]> | undefined;
            // The Inspector never registers "Metadata", so it is an implicit section that sorts above every explicitly ordered one.
            // Claim it while a camera is selected to keep the preset section above it, and release it so other entities keep their usual layout.
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
                return <CameraPresetEditor camera={context} cameraPresetManager={cameraPresetManager} inspectorModule={inspectorModule} />;
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
