/* eslint-disable @typescript-eslint/no-floating-promises */
import "./configurator.scss";
import type { IDisposable, IInspectableOptions, Nullable, Observable } from "core/index";
import type { HotSpot, ShadowQuality, ToneMapping, Viewer, ViewerDetails, ViewerElement, ViewerOptions } from "viewer/index";
import type { DragEndEvent } from "@dnd-kit/core";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faBullseye, faCamera, faCheck, faCopy, faGripVertical, faRotateLeft, faSave, faSquarePlus, faTrashCan, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";

import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { MessageLineComponent } from "shared-ui-components/lines/messageLineComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

import { DefaultViewerOptions, SSAOOptions } from "viewer/viewer";
import { HTML3DAnnotationElement } from "viewer/viewerAnnotationElement";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { Color4 } from "core/Maths/math.color";
import { Epsilon } from "core/Maths/math.constants";
import { Vector3 } from "core/Maths/math.vector";
import { WithinEpsilon } from "core/Maths/math.scalar.functions";
import { CreateHotSpotQueryForPickingInfo } from "core/Meshes/abstractMesh.hotSpot";
import { Logger } from "core/Misc/logger";

import { useObservableState } from "../../hooks/observableHooks";
import { LoadModel, PickModel } from "../../modelLoader";

import { ExpandableMessageLineComponent } from "../misc/ExpandableMessageLineComponent";
import { FontAwesomeIconButton } from "../misc/FontAwesomeIconButton";

const DefaultModelUrl = "https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb";

type HotSpotInfo = { name: string; id: string; data: HotSpot };

let CurrentHotSpotId = 0;
function CreateHotSpotId() {
    return (CurrentHotSpotId++).toString();
}

type OutputFormat = "html" | "json";

const OutputOptions = [
    { label: "HTML", value: "html" },
    { label: "JSON", value: "json" },
] as const satisfies IInspectableOptions[] & { label: string; value: OutputFormat }[];

const ShadowQualityOptions = [
    { label: "None", value: "none" },
    { label: "Normal", value: "normal" },
    { label: "High", value: "high" },
] as const satisfies IInspectableOptions[] & { label: string; value: ShadowQuality }[];

const SSAOOptions = [
    { label: "Disabled", value: "disabled" },
    { label: "Enabled", value: "enabled" },
    { label: "Auto", value: "auto" },
] as const satisfies IInspectableOptions[] & { label: string; value: SSAOOptions }[];

const ToneMappingOptions = [
    { label: "Standard", value: "standard" },
    { label: "None", value: "none" },
    { label: "Aces", value: "aces" },
    { label: "Neutral", value: "neutral" },
] as const satisfies IInspectableOptions[] & { label: string; value: ToneMapping }[];

const HotSpotTypeOptions = [{ label: "Surface", value: "surface" }] as const satisfies IInspectableOptions[];

const HotSpotsDndModifers = [restrictToVerticalAxis, restrictToParentElement];

// This helper function is used in functions that are naturally void returning, but need to call an async Promise returning function.
// If there is any error (other than AbortError) in the async function, it will be logged.
function ObservePromise(promise: Promise<unknown>): void {
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    (async () => {
        try {
            await promise;
        } catch (error) {
            Logger.Error([error]);
        }
    })();
}

// eslint-disable-next-line @typescript-eslint/naming-convention
function useConfiguration<T>(
    defaultState: T,
    initialConfiguredState: T,
    get: () => T,
    set: ((data: T) => void) | undefined,
    equals: (baseState: T, configuredState: T) => boolean = (baseState, configuredState) => baseState === configuredState,
    observables: Observable<any>[] = [],
    dependencies?: unknown[]
) {
    const memoDefaultState = useMemo(() => defaultState, dependencies ?? []);
    const memoInitialConfiguredState = useMemo(() => initialConfiguredState, dependencies ?? []);
    const memoSet = useCallback(set ?? (() => {}), dependencies ?? []);
    const memoGet = useCallback(get, dependencies ?? []);
    const memoEquals = useCallback(equals, []);
    const liveState = useObservableState(memoGet, ...observables);
    const [configuredState, setConfiguredState] = useState(initialConfiguredState);
    const [isConfigured, setIsConfigured] = useState(!memoEquals(memoDefaultState, memoInitialConfiguredState));

    useEffect(() => {
        memoSet?.(configuredState);
    }, [configuredState, memoSet]);

    // Indicates whether the live state of the viewer can be "reverted" to the configured state.
    const canRevert = useMemo(() => {
        return isConfigured && !memoEquals(liveState, configuredState);
    }, [isConfigured, liveState, configuredState, memoEquals]);

    // Indicates whether the configured state can be "reset" to the default state.
    const canReset = useMemo(() => {
        return isConfigured && !memoEquals(memoDefaultState, configuredState);
    }, [isConfigured, memoDefaultState, configuredState, memoEquals]);

    // Reverts the live state of the viewer to the configured state.
    const revert = useCallback(() => {
        memoSet?.(configuredState);
    }, [configuredState, memoSet]);

    // Resets the configured state to the default state.
    const reset = useCallback(() => {
        setConfiguredState(memoDefaultState);
        setIsConfigured(false);
    }, [memoDefaultState]);

    // Updates the configured state to the specified state.
    const update = useCallback(
        (data: T) => {
            setConfiguredState((previous) => {
                if (memoEquals(previous, data)) {
                    return previous;
                }
                setIsConfigured(true);
                return data;
            });
        },
        [memoEquals]
    );

    // Updates the configured tate to the live state of the viewer.
    const snapshot = useCallback(() => {
        setConfiguredState(liveState);
        setIsConfigured(true);
    }, [liveState]);

    return { canRevert, canReset, revert, reset, update, snapshot, configuredState } as const;
}

const HotSpotEntry: FunctionComponent<{
    id: string;
    hotspots: HotSpotInfo[];
    setHotspots: React.Dispatch<React.SetStateAction<HotSpotInfo[]>>;
    viewerElement: ViewerElement;
}> = ({ id, hotspots, setHotspots, viewerElement }) => {
    const index = useMemo(() => {
        return hotspots.findIndex((hotspot) => hotspot.id === id);
    }, [id, hotspots]);

    const hotspot = useMemo<HotSpotInfo | undefined>(() => {
        return hotspots[index];
    }, [index, hotspots]);

    const { attributes: dndAttributes, listeners: dndListeners, setNodeRef: setDndRefNode, transform: dndTransform, transition: dndTransition } = useSortable({ id });

    const dndStyle = useMemo(() => {
        return {
            transform: CSS.Transform.toString(dndTransform),
            transition: dndTransition,
        } as const;
    }, [dndTransform, dndTransition]);

    const rootDivRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (rootDivRef.current) {
            setDndRefNode(rootDivRef.current);
            rootDivRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
        }

        if (inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, []);

    const [isPicking, setIsPicking] = useState(false);
    const [hasPicked, setHasPicked] = useState(false);

    const pickingOperation = useRef<IDisposable>();

    useEffect(() => {
        return () => pickingOperation.current?.dispose();
    }, []);

    const onHotspotDeleteClick = useCallback(() => {
        if (index >= 0) {
            setHotspots((hotspots) => {
                const newHotspots = [...hotspots];
                newHotspots.splice(index, 1);
                return newHotspots;
            });
        }
    }, [index, setHotspots]);

    const onHotspotPickClick = useCallback(() => {
        if (isPicking) {
            pickingOperation.current?.dispose();
        } else if (viewerElement.viewerDetails?.model && hotspot) {
            const originalCursor = getComputedStyle(viewerElement).cursor;
            viewerElement.style.cursor = "crosshair";
            const { scene, model, viewer } = viewerElement.viewerDetails;

            const cleanupActions: (() => void)[] = [() => setIsPicking(false), () => (viewerElement.style.cursor = originalCursor), () => (pickingOperation.current = undefined)];

            const cleanup = () => {
                cleanupActions.forEach((action) => action());
            };
            pickingOperation.current = {
                dispose: () => {
                    cleanup();
                },
            };

            const pointerObserver = scene.onPointerObservable.add(async (pointerInfo) => {
                if (pointerInfo.type === PointerEventTypes.POINTERTAP) {
                    if (viewerElement.viewerDetails) {
                        const pickInfo = await viewerElement.viewerDetails.pick(pointerInfo.event.offsetX, pointerInfo.event.offsetY);
                        if (pickInfo?.pickedMesh) {
                            if (hotspot.data.type === "surface") {
                                hotspot.data.meshIndex = model.assetContainer.meshes.indexOf(pickInfo.pickedMesh);
                                const hotspotQuery = CreateHotSpotQueryForPickingInfo(pickInfo);
                                if (hotspotQuery) {
                                    hotspot.data.pointIndex = hotspotQuery.pointIndex;
                                    hotspot.data.barycentric = hotspotQuery.barycentric;
                                }
                            }

                            setHotspots((hotspots) => {
                                return [...hotspots];
                            });

                            if (pickInfo.hit && pickInfo.pickedPoint) {
                                const camera = viewerElement.viewerDetails.camera;
                                const distance = pickInfo.pickedPoint.subtract(camera.position).dot(camera.getForwardRay().direction);
                                // Immediately reset the target and the radius based on the distance to the picked point.
                                // This eliminates unnecessary camera movement on the local z-axis when interpolating.
                                camera.target = camera.position.add(camera.getForwardRay().direction.scale(distance));
                                camera.radius = distance;
                                viewerElement.focusHotSpot(hotspot.name);
                            }

                            setHasPicked(true);

                            cleanup();
                        }
                    }
                }
            });
            cleanupActions.push(() => scene.onPointerObservable.remove(pointerObserver));

            const handleKeyDown = (e: KeyboardEvent) => {
                if (e.key === "Escape") {
                    cleanup();
                }
            };
            document.addEventListener("keydown", handleKeyDown);
            cleanupActions.push(() => document.removeEventListener("keydown", handleKeyDown));

            const modelChangedObserver = viewer.onModelChanged.addOnce(() => {
                cleanup();
            });
            cleanupActions.push(() => viewer.onModelChanged.remove(modelChangedObserver));

            setIsPicking(true);
        }
    }, [isPicking, hotspot, setHotspots]);

    const onCameraSnapshotClick = useCallback(() => {
        if (hotspot) {
            const camera = viewerElement.viewerDetails?.camera;
            if (camera) {
                hotspot.data.cameraOrbit = [camera.alpha, camera.beta, camera.radius];
                setHotspots((hotspots) => {
                    return [...hotspots];
                });
            }
        }
    }, [hotspot, setHotspots]);

    const onHotSpotNameChange = useCallback(
        (value: string) => {
            if (hotspot) {
                setHotspots((hotspots) => {
                    hotspots = [...hotspots];
                    hotspots[index] = { ...hotspot, name: value };
                    return hotspots;
                });
            }
        },
        [index, hotspot]
    );

    return (
        <div ref={rootDivRef} className="flexRow" style={{ ...dndStyle }} {...dndAttributes}>
            <FontAwesomeIcon title="Drag to reorder" icon={faGripVertical} {...dndListeners} />
            <div style={{ flex: 1 }}>
                <TextInputLineComponent key={id} value={hotspot?.name} onChange={onHotSpotNameChange} />
            </div>
            <FontAwesomeIconButton title="Pick from model" icon={faBullseye} color={isPicking ? "rgb(51, 122, 183)" : undefined} onClick={onHotspotPickClick} />
            <FontAwesomeIconButton title="Snapshot current camera state" icon={faCamera} onClick={onCameraSnapshotClick} />
            <FontAwesomeIconButton title="Delete Hot Spot" icon={faTrashCan} onClick={onHotspotDeleteClick} />
        </div>
    );
};

export const Configurator: FunctionComponent<{ viewerOptions: ViewerOptions; viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerOptions, viewerElement, viewerDetails, viewer } = props;
    const model = useObservableState(() => viewerDetails.model, viewer.onModelChanged, viewer.onModelError);
    const lockObject = useMemo(() => new LockObject(), []);

    // Allow models to be dragged and dropped into the viewer.
    useEffect(() => {
        const onDragOver = (event: DragEvent) => event.preventDefault();
        // eslint-disable-next-line no-restricted-syntax
        const onDrop = async (event: DragEvent) => {
            const files = event.dataTransfer?.files;
            if (files) {
                event.preventDefault();
                await LoadModel(viewerElement, files);
            }
        };

        viewerElement.addEventListener("dragover", onDragOver);
        viewerElement.addEventListener("drop", onDrop);

        return () => {
            viewerElement.removeEventListener("dragover", onDragOver);
            viewerElement.removeEventListener("drop", onDrop);
        };
    }, [viewerElement]);

    const initialModelUrl = useMemo(() => viewerOptions.source ?? DefaultModelUrl, [viewerOptions.source]);
    const [modelUrl, setModelUrl] = useState(initialModelUrl);

    // Whenever the model changes, update the model URL.
    useEffect(() => {
        viewerElement.source = modelUrl;

        const onModelChange = (event: CustomEvent<Nullable<string | File | unknown>>) => {
            const source = event.detail;
            let sourceUrl = "";
            if (source) {
                if (typeof source === "string") {
                    sourceUrl = source;
                } else if (source instanceof File) {
                    sourceUrl = source.name;
                }
            }
            setModelUrl(sourceUrl);
        };

        const onModelError = () => {
            setModelUrl("");
        };

        viewerElement.addEventListener("modelchange", onModelChange);
        viewerElement.addEventListener("modelerror", onModelError);

        return () => {
            viewerElement.removeEventListener("modelchange", onModelChange);
            viewerElement.removeEventListener("modelerror", onModelError);
        };
    }, [viewerElement]);

    const [outputFormat, setOutputFormat] = useState<OutputFormat>("html");
    const onOutputFormatChange = useCallback((value: string | number) => {
        setOutputFormat(value as OutputFormat);
    }, []);
    // This is only needed because the select expects to "bind" to an object and a property.
    const outputFormatWrapper = useMemo(() => {
        return { outputFormat } as const;
    }, [outputFormat]);

    const lightingUrlConfig = useConfiguration(
        "",
        viewerOptions.environmentLighting ?? "",
        () => viewerElement.environment.lighting ?? "",
        undefined,
        undefined,
        [viewer.onEnvironmentChanged],
        [viewerElement]
    );
    const skyboxUrlConfig = useConfiguration(
        "",
        viewerOptions.environmentSkybox === viewerOptions.environmentLighting ? "" : (viewerOptions.environmentSkybox ?? ""),
        () => viewerElement.environment.skybox ?? "",
        undefined,
        undefined,
        [viewer.onEnvironmentChanged],
        [viewerElement]
    );

    const [syncEnvironment, setSyncEnvironment] = useState(!!viewerOptions.environmentLighting && viewerOptions.environmentLighting === viewerOptions.environmentSkybox);
    const [needsEnvironmentUpdate, setNeedsEnvironmentUpdate] = useState(false);

    const onEnvironmentUrlSubmit = useCallback(() => {
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate]);

    const hasSkybox = useMemo(() => {
        if (syncEnvironment) {
            return !!lightingUrlConfig.configuredState;
        }
        return !!skyboxUrlConfig.configuredState;
    }, [syncEnvironment, lightingUrlConfig.configuredState, skyboxUrlConfig.configuredState]);

    const skyboxBlurConfig = useConfiguration(
        DefaultViewerOptions.environmentConfig.blur,
        viewerOptions.environmentConfig?.blur ?? DefaultViewerOptions.environmentConfig.blur,
        () => viewer.environmentConfig.blur,
        (blur) => (viewer.environmentConfig = { blur }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const environmentIntensityConfig = useConfiguration(
        DefaultViewerOptions.environmentConfig.intensity,
        viewerOptions.environmentConfig?.intensity ?? DefaultViewerOptions.environmentConfig.intensity,
        () => viewer.environmentConfig.intensity,
        (intensity) => (viewer.environmentConfig = { intensity }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const environmentRotationConfig = useConfiguration(
        DefaultViewerOptions.environmentConfig.rotation,
        viewerOptions.environmentConfig?.rotation ?? DefaultViewerOptions.environmentConfig.rotation,
        () => viewer.environmentConfig.rotation,
        (rotation) => (viewer.environmentConfig = { rotation }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const clearColorConfig = useConfiguration(
        viewerDetails.scene.clearColor,
        new Color4(...(viewerOptions.clearColor ? viewerOptions.clearColor : DefaultViewerOptions.clearColor)),
        () => viewerDetails.scene.clearColor,
        (color) => (viewerDetails.scene.clearColor = color),
        (baseState, configuredState) => baseState.equals(configuredState),
        [viewerDetails.scene.onClearColorChangedObservable],
        [viewerDetails.scene]
    );
    // This is only needed because the color picker expects to "bind" to an object and a property.
    const clearColorWrapper = useMemo(() => {
        return { clearColor: clearColorConfig.configuredState } as const;
    }, [clearColorConfig.configuredState]);

    const shadowQualityConfig = useConfiguration(
        DefaultViewerOptions.shadowConfig.quality,
        viewerOptions.shadowConfig?.quality ?? DefaultViewerOptions.shadowConfig.quality,
        () => viewer.shadowConfig.quality,
        (quality) => ObservePromise(viewer.updateShadows({ quality })),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );
    // This is only needed because the select expects to "bind" to an object and a property.
    const shadowQualityWrapper = useMemo(() => {
        return { shadowQuality: shadowQualityConfig.configuredState } as const;
    }, [shadowQualityConfig.configuredState]);

    const cameraConfig = useConfiguration(
        {
            alpha: NaN,
            beta: NaN,
            radius: NaN,
            target: new Vector3(NaN, NaN, NaN),
        },
        {
            alpha: viewerOptions.cameraOrbit?.[0] ?? NaN,
            beta: viewerOptions.cameraOrbit?.[1] ?? NaN,
            radius: viewerOptions.cameraOrbit?.[2] ?? NaN,
            target: new Vector3(viewerOptions.cameraTarget?.[0] ?? NaN, viewerOptions.cameraTarget?.[1] ?? NaN, viewerOptions.cameraTarget?.[2] ?? NaN),
        },
        () => {
            return {
                alpha: viewerDetails.camera.alpha,
                beta: viewerDetails.camera.beta,
                radius: viewerDetails.camera.radius,
                target: viewerDetails.camera.target.clone(),
            };
        },
        (cameraState) => {
            if (!cameraState || (isNaN(cameraState.alpha) && isNaN(cameraState.beta) && isNaN(cameraState.radius))) {
                viewerElement.removeAttribute("camera-orbit");
                delete viewerOptions.cameraOrbit;
            } else {
                viewerElement.setAttribute("camera-orbit", `${cameraState.alpha} ${cameraState.beta} ${cameraState.radius}`);
            }

            if (!cameraState || (isNaN(cameraState.target.x) && isNaN(cameraState.target.y) && isNaN(cameraState.target.z))) {
                viewerElement.removeAttribute("camera-target");
                delete viewerOptions.cameraTarget;
            } else {
                viewerElement.setAttribute("camera-target", `${cameraState.target.x} ${cameraState.target.y} ${cameraState.target.z}`);
            }
        },
        (baseState, configuredState) => {
            const valueEquals = (baseState: number, configuredState: number) => {
                return isNaN(configuredState) || baseState === configuredState || WithinEpsilon(baseState, configuredState, Epsilon);
            };

            return (
                baseState == configuredState ||
                (!!baseState &&
                    !!configuredState &&
                    valueEquals(baseState.alpha, configuredState.alpha) &&
                    valueEquals(baseState.beta, configuredState.beta) &&
                    valueEquals(baseState.radius, configuredState.radius) &&
                    valueEquals(baseState.target.x, configuredState.target.x) &&
                    valueEquals(baseState.target.y, configuredState.target.y) &&
                    valueEquals(baseState.target.z, configuredState.target.z))
            );
        },
        [viewerDetails.camera.onViewMatrixChangedObservable],
        [viewer, viewerDetails.camera, model]
    );

    const toneMappingConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.toneMapping,
        viewerOptions.postProcessing?.toneMapping ?? DefaultViewerOptions.postProcessing.toneMapping,
        () => viewer.postProcessing.toneMapping,
        (toneMapping) => (viewer.postProcessing = { toneMapping }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );
    // This is only needed because the select expects to "bind" to an object and a property.
    const toneMappingWrapper = useMemo(() => {
        return { toneMapping: toneMappingConfig.configuredState } as const;
    }, [toneMappingConfig.configuredState]);

    const contrastConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.contrast,
        viewerOptions.postProcessing?.contrast ?? DefaultViewerOptions.postProcessing.contrast,
        () => viewer.postProcessing.contrast,
        (contrast) => (viewer.postProcessing = { contrast }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const exposureConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.exposure,
        viewerOptions.postProcessing?.exposure ?? DefaultViewerOptions.postProcessing.exposure,
        () => viewer.postProcessing.exposure,
        (exposure) => (viewer.postProcessing = { exposure }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const ssaoConfig = useConfiguration(
        DefaultViewerOptions.postProcessing.ssao,
        viewerOptions.postProcessing?.ssao ?? DefaultViewerOptions.postProcessing.ssao,
        () => viewer.postProcessing.ssao,
        (ssao) => (viewer.postProcessing = { ssao }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );
    // This is only needed because the select expects to "bind" to an object and a property.
    const ssaoOptionsWrapper = useMemo(() => {
        return { ssaoOptions: ssaoConfig.configuredState } as const;
    }, [ssaoConfig.configuredState]);

    const autoOrbitConfig = useConfiguration(
        DefaultViewerOptions.cameraAutoOrbit.enabled,
        viewerOptions.cameraAutoOrbit?.enabled ?? DefaultViewerOptions.cameraAutoOrbit.enabled,
        () => viewer.cameraAutoOrbit.enabled,
        (enabled) => (viewer.cameraAutoOrbit = { enabled }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const autoOrbitSpeedConfig = useConfiguration(
        DefaultViewerOptions.cameraAutoOrbit.speed,
        viewerOptions.cameraAutoOrbit?.speed ?? DefaultViewerOptions.cameraAutoOrbit.speed,
        () => viewer.cameraAutoOrbit.speed,
        (speed) => (viewer.cameraAutoOrbit = { speed }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const autoOrbitDelayConfig = useConfiguration(
        DefaultViewerOptions.cameraAutoOrbit.delay,
        viewerOptions.cameraAutoOrbit?.delay ?? DefaultViewerOptions.cameraAutoOrbit.delay,
        () => viewer.cameraAutoOrbit.delay,
        (delay) => (viewer.cameraAutoOrbit = { delay }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const animationStateConfig = useConfiguration(
        {
            animationSpeed: DefaultViewerOptions.animationSpeed,
            selectedAnimation: 0,
        },
        {
            animationSpeed: viewerOptions.animationSpeed ?? DefaultViewerOptions.animationSpeed,
            selectedAnimation: viewerOptions.selectedAnimation ?? 0,
        },
        () => {
            return {
                animationSpeed: viewer.animationSpeed,
                selectedAnimation: viewer.selectedAnimation,
            };
        },
        (animationState) => {
            if (animationState) {
                viewer.animationSpeed = animationState.animationSpeed;
                viewer.selectedAnimation = animationState.selectedAnimation;
            } else {
                viewer.animationSpeed = 1;
                viewer.selectedAnimation = 0;
            }
        },
        (baseState, configuredState) => {
            return (
                baseState == configuredState ||
                (!!baseState &&
                    !!configuredState &&
                    WithinEpsilon(baseState.animationSpeed, configuredState.animationSpeed, Epsilon) &&
                    baseState.selectedAnimation === configuredState.selectedAnimation)
            );
        },
        [viewer.onAnimationSpeedChanged, viewer.onSelectedAnimationChanged],
        [viewer]
    );

    const animationAutoPlayConfig = useConfiguration(
        DefaultViewerOptions.animationAutoPlay,
        viewerOptions.animationAutoPlay ?? DefaultViewerOptions.animationAutoPlay,
        () => viewerElement.animationAutoPlay,
        (autoPlay) => {
            if (autoPlay) {
                viewerElement.setAttribute("animation-auto-play", "");
            } else {
                viewerElement.removeAttribute("animation-auto-play");
            }
            autoPlay ? viewer.playAnimation() : viewer.pauseAnimation();
        },
        undefined,
        [viewer.onIsAnimationPlayingChanged],
        [viewer, viewerElement]
    );

    const selectedMaterialVariantConfig = useConfiguration(
        "",
        viewerOptions.selectedMaterialVariant ?? "",
        () => viewer.selectedMaterialVariant,
        (materialVariant) => {
            if (materialVariant) {
                viewer.selectedMaterialVariant = materialVariant;
            } else {
                viewer.selectedMaterialVariant = viewer.materialVariants[0];
            }
        },
        undefined,
        [viewer.onSelectedMaterialVariantChanged],
        [viewer]
    );

    const [hotspots, setHotspots] = useState<HotSpotInfo[]>(Object.entries(viewerOptions.hotSpots ?? {}).map(([name, data]) => ({ name, id: CreateHotSpotId(), data })));

    useEffect(() => {
        if (modelUrl !== initialModelUrl) {
            setHotspots([]);
        }
    }, [modelUrl, initialModelUrl]);

    useEffect(() => {
        viewerElement.hotSpots = hotspots.reduce<Record<string, HotSpot>>((hotspots, { name, data }) => {
            hotspots[name] = data;
            return hotspots;
        }, {});
    }, [viewerElement, hotspots]);

    // This is part of the drag and drop support for re-ordering hot spots.
    const dndSensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const hasAnimations = useMemo(() => viewer && viewer.animations.length > 0, [viewer.animations]);
    const hasMaterialVariants = useMemo(() => viewer && viewer.materialVariants.length > 0, [viewer.materialVariants]);

    const hotSpotsSnippet = useMemo(() => {
        if (hotspots.length > 0) {
            let hotSpotsJSON = `{\n`;
            hotSpotsJSON += hotspots
                .map((hotspot) => {
                    let hotspotJson = `    "${hotspot.name}": {\n`;
                    const hotspotProperties: string[] = [];
                    if (hotspot.data.type === "surface") {
                        hotspotProperties.push(
                            `      "type": "surface"`,
                            `      "meshIndex": ${hotspot.data.meshIndex}`,
                            `      "pointIndex": [${hotspot.data.pointIndex.join(", ")}]`,
                            `      "barycentric": [${hotspot.data.barycentric.map((value) => value.toFixed(3)).join(", ")}]`
                        );
                    } else {
                        hotspotProperties.push(
                            `      "type": "world"`,
                            `      "position": [${hotspot.data.position.map((value) => value.toFixed(3)).join(", ")}]`,
                            `      "normal": [${hotspot.data.normal.map((value) => value.toFixed(3)).join(", ")}]`
                        );
                    }
                    if (hotspot.data.cameraOrbit) {
                        const [alpha, beta, radius] = hotspot.data.cameraOrbit;
                        hotspotProperties.push(`      "cameraOrbit": [${alpha.toFixed(3)}, ${beta.toFixed(3)}, ${radius.toFixed(3)}]`);
                    }
                    hotspotJson += hotspotProperties.join(",\n");
                    hotspotJson += `\n    }`;
                    return hotspotJson;
                })
                .join(",\n");
            hotSpotsJSON += `\n  }`;

            return hotSpotsJSON;
        } else {
            return null;
        }
    }, [hotspots]);

    // This is all the configured attributes, as an array of strings.
    const attributes = useMemo<readonly string[]>(() => {
        const attributes: string[] = [`source="${modelUrl || "[model url]"}"`];

        if (syncEnvironment) {
            if (lightingUrlConfig.configuredState) {
                attributes.push(`environment="${lightingUrlConfig.configuredState}"`);
            }
        } else {
            if (lightingUrlConfig.configuredState) {
                attributes.push(`environment-lighting="${lightingUrlConfig.configuredState}"`);
            }

            if (skyboxUrlConfig.configuredState) {
                attributes.push(`environment-skybox="${skyboxUrlConfig.configuredState}"`);
            }
        }

        if (hasSkybox) {
            if (skyboxBlurConfig.canReset) {
                attributes.push(`skybox-blur="${skyboxBlurConfig.configuredState}"`);
            }
        } else {
            if (clearColorConfig.canReset) {
                attributes.push(`clear-color="${clearColorConfig.configuredState.toHexString()}"`);
            }
        }
        if (environmentIntensityConfig.canReset) {
            attributes.push(`skybox-intensity="${environmentIntensityConfig.configuredState}"`);
        }
        if (environmentRotationConfig.canReset) {
            attributes.push(`skybox-rotation="${environmentRotationConfig.configuredState}"`);
        }

        if (shadowQualityConfig.canReset) {
            attributes.push(`shadow-quality="${shadowQualityConfig.configuredState}"`);
        }

        if (toneMappingConfig.canReset) {
            attributes.push(`tone-mapping="${toneMappingConfig.configuredState}"`);
        }

        if (contrastConfig.canReset) {
            attributes.push(`contrast="${contrastConfig.configuredState.toFixed(1)}"`);
        }

        if (exposureConfig.canReset) {
            attributes.push(`exposure="${exposureConfig.configuredState.toFixed(1)}"`);
        }

        if (ssaoConfig.canReset) {
            attributes.push(`ssao="${ssaoConfig.configuredState}"`);
        }

        if (cameraConfig.canReset) {
            const { alpha, beta, radius, target } = cameraConfig.configuredState;
            attributes.push(`camera-orbit="${alpha.toFixed(3)} ${beta.toFixed(3)} ${radius.toFixed(3)}"`);
            attributes.push(`camera-target="${target.x.toFixed(3)} ${target.y.toFixed(3)} ${target.z.toFixed(3)}"`);
        }

        if (autoOrbitConfig.canReset) {
            attributes.push(`camera-auto-orbit`);
        }

        if (autoOrbitSpeedConfig.canReset) {
            attributes.push(`camera-auto-orbit-speed="${autoOrbitSpeedConfig.configuredState.toFixed(3)}"`);
        }

        if (autoOrbitDelayConfig.canReset) {
            attributes.push(`camera-auto-orbit-delay="${autoOrbitDelayConfig.configuredState.toFixed(0)}"`);
        }

        if (hasAnimations) {
            if (animationStateConfig.configuredState && animationStateConfig.canReset) {
                attributes.push(`selected-animation="${animationStateConfig.configuredState.selectedAnimation}"`);
                attributes.push(`animation-speed="${animationStateConfig.configuredState.animationSpeed}"`);
            }

            if (animationAutoPlayConfig.canReset) {
                attributes.push(`animation-auto-play`);
            }
        }

        if (hasMaterialVariants && selectedMaterialVariantConfig.configuredState) {
            attributes.push(`material-variant="${selectedMaterialVariantConfig.configuredState}"`);
        }

        if (hotSpotsSnippet) {
            attributes.push(`hotspots='${hotSpotsSnippet}'`);
        }

        return attributes;
    }, [
        modelUrl,
        syncEnvironment,
        lightingUrlConfig.configuredState,
        skyboxUrlConfig.configuredState,
        hasSkybox,
        skyboxBlurConfig.configuredState,
        environmentIntensityConfig.configuredState,
        environmentRotationConfig.configuredState,
        clearColorConfig.configuredState,
        shadowQualityConfig.configuredState,
        toneMappingConfig.configuredState,
        contrastConfig.configuredState,
        exposureConfig.configuredState,
        ssaoConfig.configuredState,
        cameraConfig.configuredState,
        autoOrbitConfig.configuredState,
        autoOrbitSpeedConfig.configuredState,
        autoOrbitDelayConfig.configuredState,
        hasAnimations,
        animationStateConfig.configuredState,
        animationAutoPlayConfig.configuredState,
        hasMaterialVariants,
        selectedMaterialVariantConfig.configuredState,
        hotSpotsSnippet,
    ]);

    // This is all the child annotation elements, as a single string.
    const children = useMemo(() => {
        if (hotspots.length === 0) {
            return "";
        }
        const annotations = hotspots.map((hotspot) => `  <babylon-viewer-annotation hotSpot="${hotspot.name}"></babylon-viewer-annotation>`).join("\n");
        return `\n  <!-- Annotations are optional HTML child elements that track hot spots. -->\n${annotations}`;
    }, [hotspots]);

    // This is the full html snippet (attributes and child elements).
    const htmlSnippet = useMemo(() => {
        const formattedAttributes = attributes.map((attribute) => `\n  ${attribute}`).join("");
        return `<babylon-viewer ${formattedAttributes}\n>${children}\n</babylon-viewer>`;
    }, [attributes, children]);

    // This is the full json snippet
    const jsonSnippet = useMemo(() => {
        const properties: string[] = [`"source": "${modelUrl || "[model url]"}"`];

        if (lightingUrlConfig.canReset) {
            properties.push(`"environmentLighting": "${lightingUrlConfig.configuredState}"`);
        }

        if (syncEnvironment && lightingUrlConfig.canReset) {
            properties.push(`"environmentSkybox": "${lightingUrlConfig.configuredState}"`);
        } else if (skyboxUrlConfig.canReset) {
            properties.push(`"environmentSkybox": "${skyboxUrlConfig.configuredState}"`);
        }

        const environmentConfigProperties: string[] = [];
        if (hasSkybox) {
            if (skyboxBlurConfig.canReset) {
                environmentConfigProperties.push(`"blur": ${skyboxBlurConfig.configuredState}`);
            }
        } else if (clearColorConfig.canReset) {
            properties.push(`"clearColor": "${clearColorConfig.configuredState.toHexString()}"`);
        }
        if (environmentIntensityConfig.canReset) {
            environmentConfigProperties.push(`"intensity": ${environmentIntensityConfig.configuredState}`);
        }
        if (environmentRotationConfig.canReset) {
            environmentConfigProperties.push(`"rotation": ${environmentRotationConfig.configuredState}`);
        }
        if (environmentConfigProperties.length > 0) {
            properties.push(`"environmentConfig": {${environmentConfigProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        const postProcessingProperties: string[] = [];
        if (toneMappingConfig.canReset) {
            postProcessingProperties.push(`"toneMapping": ${toneMappingConfig.configuredState}`);
        }
        if (contrastConfig.canReset) {
            postProcessingProperties.push(`"contrast": ${contrastConfig.configuredState.toFixed(1)}`);
        }
        if (exposureConfig.canReset) {
            postProcessingProperties.push(`"exposure": ${exposureConfig.configuredState.toFixed(1)}`);
        }
        if (ssaoConfig.canReset) {
            postProcessingProperties.push(`"ssao": "${ssaoConfig.configuredState}"`);
        }
        if (postProcessingProperties.length > 0) {
            properties.push(`"postProcessing": {${postProcessingProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        const shadowProperties: string[] = [];
        if (shadowQualityConfig.canReset) {
            shadowProperties.push(`"quality": "${shadowQualityConfig.configuredState}"`);
        }
        if (shadowProperties.length > 0) {
            properties.push(`"shadowConfig": {${shadowProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        if (cameraConfig.canReset) {
            const {
                alpha,
                beta,
                radius,
                target: { x: targetX, y: targetY, z: targetZ },
            } = cameraConfig.configuredState;
            properties.push(`"cameraOrbit": [${alpha.toFixed(3)}, ${beta.toFixed(3)}, ${radius.toFixed(3)}]`);
            properties.push(`"cameraTarget": [${targetX.toFixed(3)}, ${targetY.toFixed(3)}, ${targetZ.toFixed(3)}]`);
        }

        const autoOrbitProperties: string[] = [];
        if (autoOrbitConfig.canReset) {
            autoOrbitProperties.push(`"enabled": ${autoOrbitConfig.configuredState}`);
        }
        if (autoOrbitSpeedConfig.canReset) {
            autoOrbitProperties.push(`"speed": ${autoOrbitSpeedConfig.configuredState}`);
        }
        if (autoOrbitDelayConfig.canReset) {
            autoOrbitProperties.push(`"delay": ${autoOrbitDelayConfig.configuredState}`);
        }
        if (autoOrbitProperties.length > 0) {
            properties.push(`"cameraAutoOrbit": {${autoOrbitProperties.map((property) => `\n    ${property}`).join(",")}\n  }`);
        }

        if (animationStateConfig.canReset) {
            properties.push(`"animationSpeed": ${animationStateConfig.configuredState.animationSpeed}`);
            properties.push(`"selectedAnimation": ${animationStateConfig.configuredState.selectedAnimation}`);
        }

        if (animationAutoPlayConfig.canReset) {
            properties.push(`"animationAutoPlay": ${animationAutoPlayConfig.configuredState}`);
        }

        if (selectedMaterialVariantConfig.canReset) {
            properties.push(`"selectedMaterialVariant": "${selectedMaterialVariantConfig.configuredState}"`);
        }

        if (hotSpotsSnippet) {
            properties.push(`"hotSpots": ${hotSpotsSnippet}`);
        }

        return `{${properties.map((property) => `\n  ${property}`).join(",")}\n}`;
    }, [
        modelUrl,
        syncEnvironment,
        lightingUrlConfig.configuredState,
        skyboxUrlConfig.configuredState,
        hasSkybox,
        environmentIntensityConfig.configuredState,
        environmentRotationConfig.configuredState,
        skyboxBlurConfig.configuredState,
        clearColorConfig.configuredState,
        toneMappingConfig.configuredState,
        contrastConfig.configuredState,
        exposureConfig.configuredState,
        ssaoConfig.configuredState,
        shadowQualityConfig.configuredState,
        cameraConfig.configuredState,
        autoOrbitConfig.configuredState,
        autoOrbitSpeedConfig.configuredState,
        autoOrbitDelayConfig.configuredState,
        animationStateConfig.configuredState,
        animationAutoPlayConfig.configuredState,
        selectedMaterialVariantConfig.configuredState,
        hotSpotsSnippet,
    ]);

    const isModelUrlValid = useMemo(() => {
        return URL.canParse(modelUrl);
    }, [modelUrl]);

    const onModelUrlChange = useCallback(
        (value: string) => {
            setModelUrl(value);
        },
        [setModelUrl]
    );

    const onModelUrlBlur = useCallback(() => {
        if (isModelUrlValid) {
            viewerElement.source = modelUrl;
        }
    }, [viewerElement, isModelUrlValid, modelUrl]);

    const onLoadModelClick = useCallback(() => {
        PickModel(viewerElement);
    }, [viewerElement]);

    // TODO: Ideally we can handle keyboard events from the text input components.
    const onModelUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                onModelUrlBlur();
            }
        },
        [onLoadModelClick, onModelUrlBlur]
    );

    const isEnvironmentLightingUrlValid = useMemo(() => {
        return !lightingUrlConfig.configuredState || lightingUrlConfig.configuredState === "auto" || URL.canParse(lightingUrlConfig.configuredState);
    }, [lightingUrlConfig.configuredState]);

    const onEnvironmentLightingUrlChange = useCallback(
        (value: string) => {
            lightingUrlConfig.update(value);
        },
        [lightingUrlConfig.update]
    );

    const isEnvironmentSkyboxUrlValid = useMemo(() => {
        return !skyboxUrlConfig.configuredState || skyboxUrlConfig.configuredState === "auto" || URL.canParse(skyboxUrlConfig.configuredState);
    }, [skyboxUrlConfig.configuredState]);

    const onEnvironmentSkyboxUrlChange = useCallback(
        (value: string) => {
            skyboxUrlConfig.update(value);
        },
        [skyboxUrlConfig.update]
    );

    // This applies the configured environment (lighting and skybox) to the viewer element when needed.
    useEffect(() => {
        if (needsEnvironmentUpdate) {
            if (syncEnvironment) {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environment = lightingUrlConfig.configuredState;
                }
            } else {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environmentLighting = lightingUrlConfig.configuredState;
                }
                if (isEnvironmentSkyboxUrlValid) {
                    viewerElement.environmentSkybox = skyboxUrlConfig.configuredState;
                }
            }

            setNeedsEnvironmentUpdate(false);
        }
    }, [
        viewerElement,
        needsEnvironmentUpdate,
        setNeedsEnvironmentUpdate,
        syncEnvironment,
        isEnvironmentLightingUrlValid,
        lightingUrlConfig.configuredState,
        isEnvironmentSkyboxUrlValid,
        skyboxBlurConfig.configuredState,
    ]);

    // TODO: Ideally we can handle keyboard events from the text input components.
    const onEnvironmentLightingUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentLightingResetClick = useCallback(() => {
        lightingUrlConfig.update("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, lightingUrlConfig.update]);

    // TODO: Ideally we can handle keyboard events from the text input components.
    const onEnvironmentSkyboxUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentSkyboxResetClick = useCallback(() => {
        skyboxUrlConfig.update("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, skyboxUrlConfig.update]);

    const onSyncEnvironmentChanged = useCallback(
        (value: boolean = false) => {
            setSyncEnvironment(value);
            setNeedsEnvironmentUpdate(true);

            if (value && !lightingUrlConfig.canReset) {
                lightingUrlConfig.update("auto");
                return;
            }

            if (!value && lightingUrlConfig.configuredState === "auto") {
                lightingUrlConfig.reset();
            }
        },
        [setNeedsEnvironmentUpdate, lightingUrlConfig.configuredState, lightingUrlConfig.canReset, lightingUrlConfig.update, lightingUrlConfig.reset, setSyncEnvironment]
    );

    const onShadowQualityChange = useCallback(
        (value: string | number) => {
            shadowQualityConfig.update(value as ShadowQuality);
        },
        [shadowQualityConfig.update]
    );

    const onToneMappingChange = useCallback(
        (value: string | number) => {
            toneMappingConfig.update(value as ToneMapping);
        },
        [toneMappingConfig.update]
    );

    const onSSAOOptionChange = useCallback(
        (value: string | number) => {
            ssaoConfig.update(value as SSAOOptions);
        },
        [ssaoConfig.update]
    );

    const onAddHotspotClick = useCallback(() => {
        setHotspots((hotspots) => {
            return [
                ...hotspots,
                {
                    name: `HotSpot ${hotspots.length + 1}`,
                    id: CreateHotSpotId(),
                    data: { type: "surface", meshIndex: 0, pointIndex: [0, 0, 0], barycentric: [0, 0, 0] },
                },
            ];
        });
    }, [hotspots, setHotspots]);

    const onHotSpotsReorder = useCallback(
        (event: DragEndEvent) => {
            const { active, over } = event;

            if (over && active.id !== over.id) {
                setHotspots((hotspots) => {
                    const oldIndex = hotspots.findIndex((hotspot) => hotspot.id === active.id);
                    const newIndex = hotspots.findIndex((hotspot) => hotspot.id === over.id);

                    return arrayMove(hotspots, oldIndex, newIndex);
                });
            }
        },
        [setHotspots]
    );

    // This resets and adds <babylon-viewer-annotation> elements to the viewer element for each hot spot.
    useEffect(() => {
        viewerElement.innerHTML = "";
        for (const hotspot of hotspots) {
            const annotation = new HTML3DAnnotationElement();
            annotation.hotSpot = hotspot.name;
            viewerElement.appendChild(annotation);
        }
    }, [viewerElement, hotspots]);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(htmlSnippet);
    }, [htmlSnippet]);

    const [canSaveSnippet, setCanSaveSnippet] = useState(true);

    const saveSnippet = useCallback(async () => {
        if (canSaveSnippet) {
            setCanSaveSnippet(false);
            try {
                let url = "https://snippet.babylonjs.com";
                if (window.location.hash) {
                    url = `${url}/${window.location.hash.substring(1)}`;
                }

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        // eslint-disable-next-line @typescript-eslint/naming-convention
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        payload: jsonSnippet,
                    }),
                });

                const result = await response.json();
                let id = result.id;
                if (result.version) {
                    id = `${id}#${result.version}`;
                }
                window.location.hash = id;
            } catch (error: unknown) {
                alert(`Error saving snippet: ${error}`);
            } finally {
                setCanSaveSnippet(true);
            }
        }
    }, [canSaveSnippet, jsonSnippet]);

    const canRevertAll = useMemo(
        () => cameraConfig.canRevert || animationStateConfig.canRevert || selectedMaterialVariantConfig.canRevert,
        [cameraConfig.canRevert, animationStateConfig.canRevert, selectedMaterialVariantConfig.canRevert]
    );

    const revertAll = useCallback(() => {
        animationStateConfig.revert();
        cameraConfig.revert();
        selectedMaterialVariantConfig.revert();
    }, [animationStateConfig.revert, cameraConfig.revert, selectedMaterialVariantConfig.revert]);

    const resetAll = useCallback(() => {
        lightingUrlConfig.reset();
        skyboxUrlConfig.reset();
        onSyncEnvironmentChanged();
        skyboxBlurConfig.reset();
        environmentIntensityConfig.reset();
        environmentRotationConfig.reset();
        clearColorConfig.reset();
        shadowQualityConfig.reset();
        toneMappingConfig.reset();
        contrastConfig.reset();
        exposureConfig.reset();
        cameraConfig.reset();
        autoOrbitConfig.reset();
        autoOrbitSpeedConfig.reset();
        autoOrbitDelayConfig.reset();
        animationStateConfig.reset();
        animationAutoPlayConfig.reset();
        selectedMaterialVariantConfig.reset();
        setHotspots([]);
    }, [
        lightingUrlConfig.reset,
        skyboxUrlConfig.reset,
        onSyncEnvironmentChanged,
        skyboxBlurConfig.reset,
        environmentIntensityConfig.reset,
        environmentRotationConfig.reset,
        clearColorConfig.reset,
        shadowQualityConfig.reset,
        toneMappingConfig.reset,
        contrastConfig.reset,
        exposureConfig.reset,
        cameraConfig.reset,
        autoOrbitConfig.reset,
        autoOrbitSpeedConfig.reset,
        autoOrbitDelayConfig.reset,
        animationStateConfig.reset,
        animationAutoPlayConfig.reset,
        selectedMaterialVariantConfig.reset,
    ]);

    const openDocumentation = useCallback(() => {
        window.open("https://doc.babylonjs.com/toolsAndResources/viewerConfigurator");
    }, []);

    // SSAO is not supported when shadow quality is set to high (IBL).
    const validSSAOOptions = shadowQualityConfig.configuredState !== "high" ? SSAOOptions : SSAOOptions.filter((option) => option.value !== "enabled");
    const validShadowQualityOptions = ssaoConfig.configuredState !== "enabled" ? ShadowQualityOptions : ShadowQualityOptions.filter((option) => option.value !== "high");

    return (
        <div className="configurator">
            <div className="stickyContainer">
                <div className="configuratorHeader">
                    <img className="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div className="title">VIEWER CONFIGURATOR</div>
                    <FontAwesomeIconButton className="docs" title="Documentation" icon={faQuestionCircle} onClick={openDocumentation} />
                </div>
                <LineContainerComponent title="SNIPPET">
                    <div className="flexColumn">
                        <div style={{ flex: 1 }}>
                            <OptionsLine
                                label="Format"
                                valuesAreStrings={true}
                                options={OutputOptions}
                                target={outputFormatWrapper}
                                propertyName={"outputFormat"}
                                noDirectUpdate={true}
                                onSelect={onOutputFormatChange}
                            />
                        </div>
                        <MessageLineComponent
                            text={outputFormat === "html" ? "The HTML snippet can be used directly in a web page." : "The JSON snippet can be used as the Viewer options."}
                        />
                        <TextInputLineComponent multilines={true} value={outputFormat === "html" ? htmlSnippet : jsonSnippet} disabled={true} />
                        <div className="flexRow">
                            <div style={{ flex: 1 }}>
                                <ButtonLineComponent label="Reset" onClick={resetAll} />
                            </div>
                            <FontAwesomeIconButton title="Revert all state to snippet" icon={faRotateLeft} onClick={revertAll} disabled={!canRevertAll} />
                            <FontAwesomeIconButton title="Copy html to clipboard" icon={faCopy} onClick={copyToClipboard} />
                            <FontAwesomeIconButton title="Save as snippet" icon={faSave} onClick={saveSnippet} disabled={!canSaveSnippet} />
                        </div>
                    </div>
                </LineContainerComponent>
            </div>
            <LineContainerComponent title="MODEL">
                <div>
                    <div style={{ flex: 1 }}>
                        <TextInputLineComponent placeholder="Model url" value={modelUrl} onChange={onModelUrlChange} />
                    </div>
                    <FontAwesomeIconButton title="Load from model url" icon={faCheck} onClick={onModelUrlBlur} />
                    <FontAwesomeIconButton title="Load local model" icon={faUpload} onClick={onLoadModelClick} />
                </div>
            </LineContainerComponent>
            <LineContainerComponent title="ENVIRONMENT">
                <div style={{ height: "auto" }}>
                    <ExpandableMessageLineComponent text="The same environment can be used for both image based lighting (IBL) and the skybox, or different environments can be used for each." />
                </div>
                <div>
                    <CheckBoxLineComponent label="Sync Lighting & Skybox" isSelected={syncEnvironment} onSelect={onSyncEnvironmentChanged} />
                </div>
                <div>
                    <div style={{ flex: 1 }}>
                        <TextInputLineComponent
                            key={syncEnvironment ? "env-url" : "light-url"} // Workaround to force re-render TextInputLine (to update placeholder prop on syncEnvironment change)
                            placeholder={syncEnvironment ? "Environment url" : "Lighting url"}
                            value={lightingUrlConfig.configuredState}
                            onChange={onEnvironmentLightingUrlChange}
                        />
                    </div>
                    <FontAwesomeIconButton
                        title={syncEnvironment ? "Load environment url" : "Load lighting url"}
                        icon={faCheck}
                        disabled={!isEnvironmentLightingUrlValid}
                        onClick={onEnvironmentUrlSubmit}
                    />
                    <FontAwesomeIconButton
                        title={syncEnvironment ? "Reset environment" : "Reset lighting"}
                        icon={faTrashCan}
                        disabled={!lightingUrlConfig.canReset}
                        onClick={onEnvironmentLightingResetClick}
                    />
                </div>
                {!syncEnvironment && (
                    <div>
                        <div style={{ flex: 1 }}>
                            <TextInputLineComponent placeholder="Skybox url" value={skyboxUrlConfig.configuredState} onChange={onEnvironmentSkyboxUrlChange} />
                        </div>
                        <FontAwesomeIconButton title="Load skybox url" icon={faCheck} onClick={onEnvironmentUrlSubmit} />
                        <FontAwesomeIconButton title="Reset skybox" icon={faTrashCan} disabled={!skyboxUrlConfig.canReset} onClick={onEnvironmentSkyboxResetClick} />
                    </div>
                )}
                {hasSkybox && (
                    <>
                        <div>
                            <div style={{ flex: 1 }}>
                                <SliderLineComponent
                                    label="Blur"
                                    directValue={skyboxBlurConfig.configuredState}
                                    minimum={0}
                                    maximum={1}
                                    step={0.01}
                                    decimalCount={2}
                                    target={viewerDetails.scene}
                                    onChange={skyboxBlurConfig.update}
                                    lockObject={lockObject}
                                />
                            </div>
                            <FontAwesomeIconButton title="Reset skybox blur" icon={faTrashCan} disabled={!skyboxBlurConfig.canReset} onClick={skyboxBlurConfig.reset} />
                        </div>
                    </>
                )}
                <div>
                    <div style={{ flex: 1 }}>
                        <SliderLineComponent
                            label="Intensity"
                            directValue={environmentIntensityConfig.configuredState}
                            minimum={0}
                            maximum={5}
                            step={0.01}
                            decimalCount={2}
                            target={viewerDetails.scene}
                            onChange={environmentIntensityConfig.update}
                            lockObject={lockObject}
                        />
                    </div>
                    <FontAwesomeIconButton
                        title="Reset skybox intensity"
                        icon={faTrashCan}
                        disabled={!environmentIntensityConfig.canReset}
                        onClick={environmentIntensityConfig.reset}
                    />
                </div>
                <div>
                    <div style={{ flex: 1 }}>
                        <SliderLineComponent
                            label="Rotation"
                            directValue={environmentRotationConfig.configuredState}
                            minimum={0}
                            maximum={2 * Math.PI}
                            step={0.01}
                            decimalCount={2}
                            target={viewerDetails.scene}
                            onChange={environmentRotationConfig.update}
                            lockObject={lockObject}
                        />
                    </div>
                    <FontAwesomeIconButton
                        title="Reset skybox rotation"
                        icon={faTrashCan}
                        disabled={!environmentRotationConfig.canReset}
                        onClick={environmentRotationConfig.reset}
                    />
                </div>
                <div style={{ height: "auto" }}>
                    <div style={{ flex: 1 }}>
                        <Color4LineComponent
                            label="Clear color"
                            target={clearColorWrapper}
                            propertyName="clearColor"
                            onChange={() => clearColorConfig.update(clearColorWrapper.clearColor)}
                            lockObject={lockObject}
                        />
                    </div>
                    <FontAwesomeIconButton
                        title="Reset clear color"
                        style={{ alignSelf: "flex-start" }}
                        icon={faTrashCan}
                        disabled={!clearColorConfig.canReset}
                        onClick={clearColorConfig.reset}
                    />
                </div>
            </LineContainerComponent>
            <LineContainerComponent title="SHADOWS">
                <div>
                    <div style={{ flex: 1 }}>
                        <OptionsLine
                            label="Quality"
                            valuesAreStrings={true}
                            options={validShadowQualityOptions}
                            target={shadowQualityWrapper}
                            propertyName={"shadowQuality"}
                            noDirectUpdate={true}
                            onSelect={onShadowQualityChange}
                        />
                    </div>
                    <FontAwesomeIconButton title="Reset shadow quality" icon={faTrashCan} disabled={!shadowQualityConfig.canReset} onClick={shadowQualityConfig.reset} />
                </div>
            </LineContainerComponent>
            <LineContainerComponent title="POST PROCESSING">
                <div>
                    <div style={{ flex: 1 }}>
                        <OptionsLine
                            label="Tone Mapping"
                            valuesAreStrings={true}
                            options={ToneMappingOptions}
                            target={toneMappingWrapper}
                            propertyName={"toneMapping"}
                            noDirectUpdate={true}
                            onSelect={onToneMappingChange}
                        />
                    </div>
                    <FontAwesomeIconButton title="Reset tone mapping" icon={faTrashCan} disabled={!toneMappingConfig.canReset} onClick={toneMappingConfig.reset} />
                </div>
                <div>
                    <div style={{ flex: 1 }}>
                        <SliderLineComponent
                            label="Contrast"
                            directValue={contrastConfig.configuredState}
                            minimum={0}
                            maximum={5}
                            step={0.05}
                            lockObject={lockObject}
                            onChange={contrastConfig.update}
                        />
                    </div>
                    <FontAwesomeIconButton title="Reset contrast" icon={faTrashCan} disabled={!contrastConfig.canReset} onClick={contrastConfig.reset} />
                </div>
                <div>
                    <div style={{ flex: 1 }}>
                        <SliderLineComponent
                            label="Exposure"
                            directValue={exposureConfig.configuredState}
                            minimum={0}
                            maximum={5}
                            step={0.05}
                            lockObject={lockObject}
                            onChange={exposureConfig.update}
                        />
                    </div>
                    <FontAwesomeIconButton title="Reset exposure" icon={faTrashCan} disabled={!exposureConfig.canReset} onClick={exposureConfig.reset} />
                </div>
                <div>
                    <div style={{ flex: 1 }}>
                        <OptionsLine
                            label="SSAO (Ambient Occlusion)"
                            valuesAreStrings={true}
                            options={validSSAOOptions}
                            target={ssaoOptionsWrapper}
                            propertyName={"ssaoOptions"}
                            noDirectUpdate={true}
                            onSelect={onSSAOOptionChange}
                        />
                    </div>
                </div>
            </LineContainerComponent>
            <LineContainerComponent title="CAMERA">
                <div style={{ height: "auto" }}>
                    <ExpandableMessageLineComponent text="Position the camera in the viewer, and then click the button below to add the camera pose to the html snippet." />
                </div>
                <div>
                    <div style={{ flex: 1 }}>
                        <ButtonLineComponent label="Use Current Pose" onClick={cameraConfig.snapshot} />
                    </div>
                    <FontAwesomeIconButton title="Revert camera pose to snippet" disabled={!cameraConfig.canRevert} icon={faRotateLeft} onClick={cameraConfig.revert} />
                    <FontAwesomeIconButton title="Reset camera pose attributes" disabled={!cameraConfig.canReset} icon={faTrashCan} onClick={cameraConfig.reset} />
                </div>
                <div>
                    <CheckBoxLineComponent label="Auto Orbit" isSelected={autoOrbitConfig.configuredState} onSelect={autoOrbitConfig.update} />
                </div>
                {autoOrbitConfig.configuredState && (
                    <>
                        <div>
                            <div style={{ flex: 1 }}>
                                <SliderLineComponent
                                    label="Speed"
                                    directValue={autoOrbitSpeedConfig.configuredState}
                                    minimum={0}
                                    maximum={0.524}
                                    step={0.01}
                                    decimalCount={3}
                                    lockObject={lockObject}
                                    onChange={autoOrbitSpeedConfig.update}
                                />
                            </div>
                            <FontAwesomeIconButton
                                title="Reset auto orbit speed"
                                disabled={!autoOrbitSpeedConfig.canReset}
                                icon={faTrashCan}
                                onClick={autoOrbitSpeedConfig.reset}
                            />
                        </div>
                        <div>
                            <div style={{ flex: 1 }}>
                                <SliderLineComponent
                                    label="Delay"
                                    directValue={autoOrbitDelayConfig.configuredState}
                                    minimum={0}
                                    maximum={5000}
                                    step={1}
                                    lockObject={lockObject}
                                    onChange={autoOrbitDelayConfig.update}
                                />
                            </div>
                            <FontAwesomeIconButton
                                title="Reset auto orbit delay"
                                disabled={!autoOrbitDelayConfig.canReset}
                                icon={faTrashCan}
                                onClick={autoOrbitDelayConfig.reset}
                            />
                        </div>
                    </>
                )}
            </LineContainerComponent>
            {hasAnimations && (
                <LineContainerComponent title="ANIMATION">
                    <div style={{ height: "auto" }}>
                        <ExpandableMessageLineComponent text="Select the animation and animation speed in the viewer, and then click the button below to add those selections to the html snippet." />
                    </div>
                    <div>
                        <div style={{ flex: 1 }}>
                            <ButtonLineComponent label="Use Current Selections" onClick={animationStateConfig.snapshot} isDisabled={!hasAnimations} />
                        </div>
                        <FontAwesomeIconButton
                            title="Revert animation state to snippet"
                            disabled={!animationStateConfig.canRevert}
                            icon={faRotateLeft}
                            onClick={animationStateConfig.revert}
                        />
                        <FontAwesomeIconButton
                            title="Reset animation state attributes"
                            disabled={!animationStateConfig.canReset}
                            icon={faTrashCan}
                            onClick={animationStateConfig.reset}
                        />
                    </div>
                    <div>
                        <CheckBoxLineComponent label="Auto Play" isSelected={animationAutoPlayConfig.configuredState} onSelect={animationAutoPlayConfig.update} />
                    </div>
                </LineContainerComponent>
            )}
            {hasMaterialVariants && (
                <LineContainerComponent title="MATERIAL VARIANTS">
                    <div style={{ height: "auto" }}>
                        <ExpandableMessageLineComponent text="Select the material variant the viewer, and then click the button below to add that selection to the html snippet." />
                    </div>
                    <div>
                        <div style={{ flex: 1 }}>
                            <ButtonLineComponent label="Snapshot Current State" onClick={selectedMaterialVariantConfig.snapshot} isDisabled={!hasMaterialVariants} />
                        </div>
                        <FontAwesomeIconButton
                            title="Revert selected material variant to snippet"
                            disabled={!selectedMaterialVariantConfig.canRevert}
                            icon={faRotateLeft}
                            onClick={selectedMaterialVariantConfig.revert}
                        />
                        <FontAwesomeIconButton
                            title="Reset material variant attribute"
                            icon={faTrashCan}
                            disabled={!selectedMaterialVariantConfig.canReset}
                            onClick={selectedMaterialVariantConfig.reset}
                        />
                    </div>
                </LineContainerComponent>
            )}
            <LineContainerComponent title="HOT SPOTS">
                <div style={{ height: "auto" }}>
                    <ExpandableMessageLineComponent text="Surface hot spots track a point on the surface of a mesh. After adding a surface hot spot, click the target button and then click a point on the model to choose the surface point. After the hotspot point has been selected, optionally orbit the camera to the desired pose and then click the camera button. Annotations are optional child html elements that track a hotspot, and samples are included in the html snippet." />
                </div>
                <div className="flexColumn">
                    <div className="flexRow">
                        <div style={{ flex: 1 }}>
                            <OptionsLine
                                label="Hot Spot Type"
                                valuesAreStrings={true}
                                options={HotSpotTypeOptions}
                                target={HotSpotTypeOptions}
                                propertyName=""
                                noDirectUpdate={true}
                            />
                        </div>
                        <FontAwesomeIconButton title="Add Hot Spot" icon={faSquarePlus} onClick={onAddHotspotClick} />
                    </div>
                    <DndContext sensors={dndSensors} modifiers={HotSpotsDndModifers} collisionDetection={closestCenter} onDragEnd={onHotSpotsReorder}>
                        <SortableContext items={hotspots} strategy={verticalListSortingStrategy}>
                            {hotspots.map((hotspot) => (
                                <HotSpotEntry key={hotspot.id} id={hotspot.id} hotspots={hotspots} setHotspots={setHotspots} viewerElement={viewerElement} />
                            ))}
                        </SortableContext>
                    </DndContext>
                </div>
            </LineContainerComponent>
        </div>
    );
};
