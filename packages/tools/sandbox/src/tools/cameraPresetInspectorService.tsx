import { type Camera } from "core/Cameras/camera";
import { Logger } from "core/Misc/logger";
import { createElement, type ComponentProps, type FunctionComponent } from "react";
import { type IPropertiesService, type WeaklyTypedServiceDefinition } from "inspector/index";
import { type InspectorV2Module } from "../globalState";
import { CameraPresetNameMaxLength, type CameraPresetManager } from "./cameraPresetManager";

const CameraPresetNames = new WeakMap<Camera, string>();
const CameraPresetSectionOrder = Number.MAX_VALUE / 2;
const CameraMetadataSectionOrder = Number.MAX_VALUE;
const NoopDisposable = { dispose: () => {} };

interface IDisposableRegistration {
    dispose(): void;
}

interface IRemovableRegistration {
    remove(): void;
}

interface ICompatiblePropertiesService {
    addSection: IPropertiesService["addSection"];
    addSectionContent: IPropertiesService["addSectionContent"];
}

interface ICompatibleSelectionService {
    selectedEntity: unknown;
    onSelectedEntityChanged: {
        add(callback: () => void): unknown;
    };
}

function IsObject(value: unknown): value is Record<PropertyKey, unknown> {
    return typeof value === "object" && value !== null;
}

function IsDisposableRegistration(value: unknown): value is IDisposableRegistration {
    return IsObject(value) && typeof value.dispose === "function";
}

function IsRemovableRegistration(value: unknown): value is IRemovableRegistration {
    return IsObject(value) && typeof value.remove === "function";
}

function IsCompatiblePropertiesService(value: unknown): value is ICompatiblePropertiesService {
    return IsObject(value) && typeof value.addSection === "function" && typeof value.addSectionContent === "function";
}

function IsCompatibleSelectionService(value: unknown): value is ICompatibleSelectionService {
    return IsObject(value) && "selectedEntity" in value && IsObject(value.onSelectedEntityChanged) && typeof value.onSelectedEntityChanged.add === "function";
}

function DisposeRegistration(registration: IDisposableRegistration | undefined): void {
    try {
        registration?.dispose();
    } catch {
        // Compatibility cleanup must not prevent the Inspector from opening.
    }
}

function RemoveRegistration(registration: IRemovableRegistration | undefined): void {
    try {
        registration?.remove();
    } catch {
        // Compatibility cleanup must not prevent the Inspector from opening.
    }
}

export function IsCamera(entity: unknown): entity is Camera {
    const candidate = entity as Partial<Camera> | null;
    if (!candidate || typeof candidate.getScene !== "function") {
        return false;
    }

    const scene = candidate.getScene();
    return !!scene && scene.cameras.includes(entity as Camera);
}

function IsCameraPresetInspectorModule(inspectorModule: unknown): inspectorModule is InspectorV2Module {
    if (!IsObject(inspectorModule)) {
        return false;
    }

    return (
        typeof inspectorModule.ShowInspector === "function" &&
        typeof inspectorModule.PropertiesServiceIdentity === "symbol" &&
        typeof inspectorModule.SelectionServiceIdentity === "symbol" &&
        typeof inspectorModule.TextInputPropertyLine === "function" &&
        typeof inspectorModule.ButtonLine === "function"
    );
}

interface ICameraPresetEditorProps {
    camera: Camera;
    cameraPresetManager: CameraPresetManager;
    inspectorModule: InspectorV2Module;
}

type CameraPresetTextInputPropertyLineProps = ComponentProps<InspectorV2Module["TextInputPropertyLine"]> & { maxLength?: number };

const CameraPresetEditor: FunctionComponent<ICameraPresetEditorProps> = (props) => {
    const { camera, cameraPresetManager, inspectorModule } = props;
    const textInputPropertyLine = inspectorModule.TextInputPropertyLine as FunctionComponent<CameraPresetTextInputPropertyLineProps>;

    return (
        <>
            {createElement(textInputPropertyLine, {
                label: "Name",
                value: CameraPresetNames.get(camera) ?? "",
                maxLength: CameraPresetNameMaxLength,
                onChange: (value) => CameraPresetNames.set(camera, value),
            })}
            <inspectorModule.ButtonLine
                uniqueId="sandbox-save-camera-preset"
                label="Save"
                onClick={() => cameraPresetManager.saveCamera(camera, CameraPresetNames.get(camera) ?? "")}
            />
        </>
    );
};

function MakeCameraPresetInspectorServiceDefinition(cameraPresetManager: CameraPresetManager, inspectorModule: InspectorV2Module): WeaklyTypedServiceDefinition {
    let compatibilityWarningLogged = false;
    const warnOfIncompatibility = (reason: unknown) => {
        if (!compatibilityWarningLogged) {
            compatibilityWarningLogged = true;
            const detail = reason instanceof Error ? reason.message : String(reason);
            Logger.Warn(`Unable to add Sandbox camera preset controls to the Inspector: ${detail}`);
        }
    };

    return {
        friendlyName: "Sandbox Camera Preset Properties",
        consumes: [inspectorModule.PropertiesServiceIdentity, inspectorModule.SelectionServiceIdentity],
        factory: (propertiesService: unknown, selectionService: unknown) => {
            let presetSectionRegistration: IDisposableRegistration | undefined;
            let metadataSectionRegistration: IDisposableRegistration | undefined;
            let selectionObserver: IRemovableRegistration | undefined;
            let contentRegistration: IDisposableRegistration | undefined;
            let isDisposed = false;

            const dispose = () => {
                if (isDisposed) {
                    return;
                }

                isDisposed = true;
                const observer = selectionObserver;
                const content = contentRegistration;
                const metadataSection = metadataSectionRegistration;
                const presetSection = presetSectionRegistration;
                selectionObserver = undefined;
                contentRegistration = undefined;
                metadataSectionRegistration = undefined;
                presetSectionRegistration = undefined;
                RemoveRegistration(observer);
                DisposeRegistration(content);
                DisposeRegistration(metadataSection);
                DisposeRegistration(presetSection);
            };

            const fail = (reason: unknown) => {
                dispose();
                warnOfIncompatibility(reason);
                return NoopDisposable;
            };

            try {
                if (!IsCompatiblePropertiesService(propertiesService) || !IsCompatibleSelectionService(selectionService)) {
                    return fail("the loaded Inspector services do not expose the required APIs");
                }

                const presetSection = propertiesService.addSection({
                    identity: "Save Camera Preset",
                    order: CameraPresetSectionOrder,
                });
                if (!IsDisposableRegistration(presetSection)) {
                    return fail("addSection did not return a disposable registration");
                }
                presetSectionRegistration = presetSection;

                // The Inspector never registers "Metadata", so it is an implicit section that sorts above every explicitly ordered one.
                // Claim it while a camera is selected to keep the preset section above it, and release it so other entities keep their usual layout.
                const updateMetadataSectionRegistration = () => {
                    if (isDisposed) {
                        return;
                    }

                    try {
                        if (IsCamera(selectionService.selectedEntity)) {
                            if (!metadataSectionRegistration) {
                                const metadataSection = propertiesService.addSection({
                                    identity: "Metadata",
                                    order: CameraMetadataSectionOrder,
                                });
                                if (!IsDisposableRegistration(metadataSection)) {
                                    fail("addSection did not return a disposable metadata registration");
                                    return;
                                }
                                metadataSectionRegistration = metadataSection;
                            }
                        } else if (metadataSectionRegistration) {
                            const metadataSection = metadataSectionRegistration;
                            metadataSectionRegistration = undefined;
                            metadataSection.dispose();
                        }
                    } catch (error) {
                        fail(error);
                    }
                };

                const observer = selectionService.onSelectedEntityChanged.add(updateMetadataSectionRegistration);
                if (!IsRemovableRegistration(observer)) {
                    return fail("the selection observable did not return a removable observer");
                }
                if (isDisposed) {
                    RemoveRegistration(observer);
                    return NoopDisposable;
                }
                selectionObserver = observer;
                updateMetadataSectionRegistration();
                if (isDisposed) {
                    return NoopDisposable;
                }

                const cameraPresetSection: FunctionComponent<{ context: Camera }> = (props) => {
                    const { context } = props;
                    return <CameraPresetEditor camera={context} cameraPresetManager={cameraPresetManager} inspectorModule={inspectorModule} />;
                };
                const content = propertiesService.addSectionContent({
                    key: "Sandbox Camera Preset Properties",
                    predicate: IsCamera,
                    content: [
                        {
                            section: "Save Camera Preset",
                            component: cameraPresetSection,
                        },
                    ],
                });
                if (!IsDisposableRegistration(content)) {
                    return fail("addSectionContent did not return a disposable registration");
                }
                contentRegistration = content;

                return { dispose };
            } catch (error) {
                return fail(error);
            }
        },
    };
}

export function TryMakeCameraPresetInspectorServiceDefinition(cameraPresetManager: CameraPresetManager, inspectorModule: unknown): WeaklyTypedServiceDefinition | undefined {
    return IsCameraPresetInspectorModule(inspectorModule) ? MakeCameraPresetInspectorServiceDefinition(cameraPresetManager, inspectorModule) : undefined;
}
