import "./configurator.scss";
// eslint-disable-next-line import/no-internal-modules
import type { ViewerElement, ViewerDetails, Viewer, PostProcessing, CameraAutoOrbit, HotSpot } from "viewer/index";
// eslint-disable-next-line import/no-internal-modules
import type { Color3, Nullable, Vector3 } from "core/index";
import type { DragEndEvent } from "@dnd-kit/core";

import { useCallback, useEffect, useMemo, useState, type FunctionComponent } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

import { restrictToVerticalAxis, restrictToParentElement } from "@dnd-kit/modifiers";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { ColorPicker } from "shared-ui-components/colorPicker/colorPicker";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

import { HTML3DAnnotationElement } from "viewer/viewerAnnotationElement";

import { Color4 } from "core/Maths/math.color";
import { WithinEpsilon } from "core/Maths/math.scalar.functions";
import { Epsilon } from "core/Maths/math.constants";
import { useObservableState } from "../../hooks/observableHooks";
import { LoadModel, PickModel } from "../../modelLoader";

import { useEventfulState } from "../../hooks/observableHooks";
import deleteIcon from "shared-ui-components/imgs/deleteGridElementDark.svg";

type HotSpotInfo = { name: string; id: string; data: HotSpot };

function createDefaultAnnotation(hotSpotName: string) {
    return `
    <div style="display: flex">
      <svg style="width: 20px; height: 20px; transform: translate(-50%, -50%)">
        <ellipse cx="10" cy="10" rx="8" ry="8" fill="red" stroke="white" stroke-width="3" />
      </svg>
      <span style="color: black; background: white; border-radius: 6px; padding: 0px 3px; transform: translate(0%, -50%)">${hotSpotName}</span>
    </div>`;
}

function useConfiguration<DataType>(defaultValue: DataType) {
    const [value, setValue] = useState(defaultValue);
    const isDefaultValue = useMemo(() => value === defaultValue, [value, defaultValue]);
    const resetValue = useCallback(() => {
        setValue(defaultValue);
    }, [defaultValue]);
    return [value, setValue, resetValue, isDefaultValue] as const;
}

export const Configurator: FunctionComponent<{ viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerElement, viewerDetails, viewer } = props;
    const lockObject = useMemo(() => new LockObject(), []);

    useEffect(() => {
        const onDragOver = (event: DragEvent) => event.preventDefault();
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

    const originalSkyboxBlur = useMemo(() => viewer?.environmentConfig.blur, [viewer]);
    const originalClearColor = useMemo(() => viewerDetails?.scene.clearColor, [viewerDetails]);
    const originalToneMapping = useMemo(() => viewer?.postProcessing.toneMapping, [viewer]);
    const originalContrast = useMemo(() => viewer?.postProcessing.contrast, [viewer]);
    const originalExposure = useMemo(() => viewer?.postProcessing.exposure, [viewer]);
    // TODO: Viewer should have autoOrbit false by default at the Viewer layer.
    //const originalAutoOrbit = useMemo(() => viewer?.cameraAutoOrbit.enabled, [viewer]);
    const originalAutoOrbit = false;
    const originalAutoOrbitSpeed = useMemo(() => viewer?.cameraAutoOrbit.speed, [viewer]);
    const originalAutoOrbitDelay = useMemo(() => viewer?.cameraAutoOrbit.delay, [viewer]);

    const model = useObservableState(() => viewerDetails?.model, viewer?.onModelChanged);
    const hasAnimations = useMemo(() => viewer && viewer.animations.length > 0, [viewer?.animations]);
    const hasMaterialVariants = useMemo(() => viewer && viewer.materialVariants.length > 0, [viewer?.materialVariants]);

    const [modelUrl, setModelUrl] = useState("https://assets.babylonjs.com/meshes/ufo.glb");
    const [syncEnvironment, setSyncEnvironment] = useState(true);
    const [environmentLightingUrl, setEnvironmentLightingUrl, , isEnvironmentLightingUrlDefault] = useConfiguration("");
    const [environmentSkyboxUrl, setEnvironmentSkyboxUrl, , isEnvironmentSkyboxUrlDefault] = useConfiguration("");
    const [needsEnvironmentUpdate, setNeedsEnvironmentUpdate] = useState(false);
    const hasSkybox = useMemo(() => {
        if (syncEnvironment) {
            return !!environmentLightingUrl;
        }
        return !!environmentSkyboxUrl;
    }, [syncEnvironment, environmentLightingUrl, environmentSkyboxUrl]);
    const [skyboxBlur, setSkyboxBlur, resetSkyboxBlur, isSkyboxBlurDefault] = useConfiguration(originalSkyboxBlur);
    const [clearColor, setClearColor] = useState(originalClearColor);
    const [cameraState, setCameraState] = useState<Readonly<{ alpha: number; beta: number; radius: number; target: Vector3 }>>();
    const isCameraStateDefault = useMemo(() => cameraState == null, [cameraState]);
    const [canRevertCameraState, setCanRevertCameraState] = useState(false);
    useEffect(() => {
        const disposeActions: (() => void)[] = [];
        setCanRevertCameraState(false);
        if (cameraState) {
            setCanRevertCameraState(false);
            const observer = viewerDetails.camera.onViewMatrixChangedObservable.add(() => {
                // TODO: Figure out why the final alpha/beta are as far from the goal value as they are.
                setCanRevertCameraState(
                    !WithinEpsilon(viewerDetails.camera.alpha, cameraState.alpha, Epsilon * 10) ||
                        !WithinEpsilon(viewerDetails.camera.beta, cameraState.beta, Epsilon * 10) ||
                        !WithinEpsilon(viewerDetails.camera.radius, cameraState.radius, Epsilon) ||
                        !viewerDetails.camera.target.equalsWithEpsilon(cameraState.target, Epsilon)
                );
            });
            disposeActions.push(() => observer.remove());
        }
        return () => disposeActions.forEach((dispose) => dispose());
    }, [viewerDetails, cameraState]);
    const [postProcessingState, setPostProcessingState] = useState<Readonly<PostProcessing>>({
        toneMapping: originalToneMapping,
        contrast: originalContrast,
        exposure: originalExposure,
    });
    const isPostProcessingDefaultState = useMemo(() => {
        return {
            toneMapping: postProcessingState.toneMapping === originalToneMapping,
            contrast: postProcessingState.contrast === originalContrast,
            exposure: postProcessingState.exposure === originalExposure,
        };
    }, [postProcessingState]);
    const [autoOrbitState, setAutoOrbitState] = useState<Readonly<CameraAutoOrbit>>({ enabled: originalAutoOrbit, speed: originalAutoOrbitSpeed, delay: originalAutoOrbitDelay });
    const [animationState, setAnimationState] = useState<Readonly<{ animationSpeed: number; selectedAnimation: number }>>();
    const isAnimationStateDefault = useMemo(() => animationState == null, [animationState]);
    const [canRevertAnimationState, setCanRevertAnimationState] = useState(false);
    useEffect(() => {
        const disposeActions: (() => void)[] = [];
        setCanRevertAnimationState(false);
        if (animationState) {
            setCanRevertAnimationState(false);

            const updateCanResetAnimationState = () => {
                setCanRevertAnimationState(animationState.animationSpeed !== viewer.animationSpeed || animationState.selectedAnimation !== viewer.selectedAnimation);
            };

            const selectedAnimationObserver = viewer.onSelectedAnimationChanged.add(updateCanResetAnimationState);
            disposeActions.push(() => selectedAnimationObserver.remove());

            const animationSpeedObserver = viewer.onAnimationSpeedChanged.add(updateCanResetAnimationState);
            disposeActions.push(() => animationSpeedObserver.remove());
        }
        return () => disposeActions.forEach((dispose) => dispose());
    }, [viewer, animationState]);
    const [animationAutoPlay, setAnimationAutoPlay] = useState(false);
    const [selectedMaterialVariant, setSelectedMaterialVariant] = useState<string>();

    const [hotspots, setHotspots] = useState<HotSpotInfo[]>([]);

    const dndSensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

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

    useEffect(() => {
        setHotspots([]);
    }, [model]);

    useEffect(() => {
        viewerElement.hotSpots = hotspots.reduce<Record<string, HotSpot>>((hotspots, { name, data }) => {
            hotspots[name] = data;
            return hotspots;
        }, {});
    }, [viewerElement, hotspots]);

    const attributes = useMemo(() => {
        const attributes: string[] = [`source="${modelUrl || "[model url]"}"`];

        if (syncEnvironment) {
            if (environmentLightingUrl) {
                attributes.push(`environment="${environmentLightingUrl}"`);
            }
        } else {
            if (environmentLightingUrl) {
                attributes.push(`environment-lighting="${environmentLightingUrl}"`);
            }

            if (environmentSkyboxUrl) {
                attributes.push(`environment-skybox="${environmentSkyboxUrl}"`);
            }
        }

        if (hasSkybox) {
            if (!isSkyboxBlurDefault) {
                attributes.push(`skybox-blur="${skyboxBlur}"`);
            }
        } else {
            if (!clearColor.equals(originalClearColor)) {
                attributes.push(`clear-color="${clearColor.toHexString()}"`);
            }
        }

        if (postProcessingState.toneMapping !== originalToneMapping) {
            attributes.push(`tone-mapping="${postProcessingState.toneMapping}"`);
        }

        if (postProcessingState.contrast !== originalContrast) {
            attributes.push(`contrast="${postProcessingState.contrast.toFixed(1)}"`);
        }

        if (postProcessingState.exposure !== originalExposure) {
            attributes.push(`exposure="${postProcessingState.exposure.toFixed(1)}"`);
        }

        if (cameraState) {
            const { alpha, beta, radius, target } = cameraState;
            attributes.push(`camera-orbit="${alpha.toFixed(3)} ${beta.toFixed(3)} ${radius.toFixed(3)}"`);
            attributes.push(`camera-target="${target.x.toFixed(3)} ${target.y.toFixed(3)} ${target.z.toFixed(3)}"`);
        }

        if (autoOrbitState.enabled !== originalAutoOrbit) {
            attributes.push(`camera-auto-orbit`);
        }

        if (autoOrbitState.enabled && autoOrbitState.speed !== originalAutoOrbitSpeed) {
            attributes.push(`camera-auto-orbit-speed="${autoOrbitState.speed.toFixed(3)}"`);
        }

        if (autoOrbitState.enabled && autoOrbitState.delay !== originalAutoOrbitDelay) {
            attributes.push(`camera-auto-orbit-delay="${autoOrbitState.delay.toFixed(0)}"`);
        }

        if (hasAnimations) {
            if (animationState) {
                const { animationSpeed, selectedAnimation } = animationState;
                attributes.push(`animation-speed="${animationSpeed}"`);
                attributes.push(`selected-animation="${selectedAnimation}"`);
            }

            if (animationAutoPlay) {
                attributes.push(`animation-auto-play`);
            }
        }

        if (hasMaterialVariants && selectedMaterialVariant != null) {
            attributes.push(`material-variant="${selectedMaterialVariant}"`);
        }

        if (hotspots.length > 0) {
            let hotspotsAttribute = `hotspots='{\n`;
            hotspotsAttribute += hotspots
                .map((hotspot) => {
                    let hotspotJson = `    "${hotspot.name}": {\n`;
                    const hotspotAttributes: string[] = [];
                    if (hotspot.data.type === "surface") {
                        hotspotAttributes.push(
                            ...[
                                `      "type": "surface"`,
                                `      "meshIndex": ${hotspot.data.meshIndex}`,
                                `      "pointIndex": [${hotspot.data.pointIndex.join(", ")}]`,
                                `      "barycentric": [${hotspot.data.barycentric.map((value) => value.toFixed(3)).join(", ")}]`,
                            ]
                        );
                    } else {
                        hotspotAttributes.push(
                            ...[
                                `      "type": "world"`,
                                `      "position": [${hotspot.data.position.map((value) => value.toFixed(3)).join(", ")}]`,
                                `      "normal": [${hotspot.data.normal.map((value) => value.toFixed(3)).join(", ")}]`,
                            ]
                        );
                    }
                    if (hotspot.data.cameraOrbit) {
                        const [alpha, beta, radius] = hotspot.data.cameraOrbit;
                        hotspotAttributes.push(`      "cameraOrbit": [${alpha.toFixed(3)}, ${beta.toFixed(3)}, ${radius.toFixed(3)}]`);
                    }
                    hotspotJson += hotspotAttributes.join(",\n");
                    hotspotJson += `\n    }`;
                    return hotspotJson;
                })
                .join(",\n");
            hotspotsAttribute += `\n  }'`;
            attributes.push(hotspotsAttribute);
        }

        return attributes;
    }, [
        modelUrl,
        syncEnvironment,
        environmentLightingUrl,
        environmentSkyboxUrl,
        hasSkybox,
        skyboxBlur,
        clearColor,
        postProcessingState,
        cameraState,
        autoOrbitState,
        hasAnimations,
        animationState,
        animationAutoPlay,
        hasMaterialVariants,
        selectedMaterialVariant,
        hotspots,
    ]);

    const children = useMemo(() => {
        if (hotspots.length === 0) {
            return "";
        }
        const annotations = hotspots
            .map((hotspot) => `  <babylon-viewer-annotation hotSpot="${hotspot.name}">${createDefaultAnnotation(hotspot.name)}  </babylon-viewer-annotation>`)
            .join("\n");
        return `\n  <!-- Annotations are optional HTML child elements that track hot spots. -->\n${annotations}`;
    }, [hotspots]);

    const htmlSnippet = useMemo(() => {
        const formattedAttributes = attributes.map((attribute) => `\n  ${attribute}`).join("");
        const snippet = `<babylon-viewer ${formattedAttributes}\n>${children}\n</babylon-viewer>`;
        return snippet;
    }, [attributes, children]);

    const isModelUrlValid = useMemo(() => {
        return URL.canParse(modelUrl);
    }, [modelUrl]);

    const onModelUrlChange = useCallback(
        (value: string) => {
            setModelUrl(value);
        },
        [setModelUrl]
    );

    const onModelUrlBlur = useCallback(
        (event?: React.FocusEvent<HTMLInputElement>) => {
            if (isModelUrlValid) {
                viewerElement.source = modelUrl;
            }
        },
        [viewerElement, isModelUrlValid, modelUrl]
    );

    const onLoadModelClick = useCallback(() => {
        (async () => {
            try {
                await PickModel(viewerElement);
            } catch (error: unknown) {
                if ("message" in (error as Error)) {
                    alert(error);
                }
            }
        })();
    }, []);

    const onModelUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                onModelUrlBlur();
            }
        },
        [onLoadModelClick, onModelUrlBlur]
    );

    const isEnvironmentLightingUrlValid = useMemo(() => {
        return !environmentLightingUrl || URL.canParse(environmentLightingUrl);
    }, [environmentLightingUrl]);

    const onEnvironmentLightingUrlChange = useCallback(
        (value: string) => {
            setEnvironmentLightingUrl(value);
        },
        [setEnvironmentLightingUrl]
    );

    const isEnvironmentSkyboxUrlValid = useMemo(() => {
        return !environmentSkyboxUrl || URL.canParse(environmentSkyboxUrl);
    }, [environmentSkyboxUrl]);

    const onEnvironmentSkyboxUrlChange = useCallback(
        (value: string) => {
            setEnvironmentSkyboxUrl(value);
        },
        [setEnvironmentSkyboxUrl]
    );

    useEffect(() => {
        if (needsEnvironmentUpdate) {
            if (syncEnvironment) {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environment = environmentLightingUrl;
                }
            } else {
                if (isEnvironmentLightingUrlValid) {
                    viewerElement.environmentLighting = environmentLightingUrl;
                }
                if (isEnvironmentSkyboxUrlValid) {
                    viewerElement.environmentSkybox = environmentSkyboxUrl;
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
        environmentLightingUrl,
        isEnvironmentSkyboxUrlValid,
        environmentSkyboxUrl,
    ]);

    const onEnvironmentLightingUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentLightingResetClick = useCallback(() => {
        setEnvironmentLightingUrl("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, setEnvironmentLightingUrl]);

    const onEnvironmentSkyboxUrlKeyDown = useCallback(
        (event: React.KeyboardEvent<HTMLInputElement>) => {
            if (event.key === "Enter") {
                setNeedsEnvironmentUpdate(true);
            }
        },
        [setNeedsEnvironmentUpdate]
    );

    const onEnvironmentSkyboxResetClick = useCallback(() => {
        setEnvironmentSkyboxUrl("");
        setNeedsEnvironmentUpdate(true);
    }, [setNeedsEnvironmentUpdate, setEnvironmentSkyboxUrl]);

    const onSyncEnvironmentChanged = useCallback(
        (value?: boolean) => {
            setSyncEnvironment(value ?? true);
            setNeedsEnvironmentUpdate(true);
        },
        [setNeedsEnvironmentUpdate, setSyncEnvironment]
    );

    const onSkyboxBlurChange = useCallback(
        (value?: number) => {
            setSkyboxBlur(value ?? originalSkyboxBlur);
        },
        [setSkyboxBlur]
    );

    useEffect(() => {
        viewerElement.skyboxBlur = skyboxBlur;
    }, [viewerElement, skyboxBlur]);

    const onClearColorChange = useCallback(
        (color?: Color3 | Color4) => {
            let clearColor = originalClearColor;
            if (color) {
                if ("a" in color) {
                    clearColor = color;
                } else {
                    clearColor = Color4.FromColor3(color);
                }
            }

            setClearColor((previous) => {
                if (previous.equals(clearColor)) {
                    return previous;
                }
                return clearColor;
            });
        },
        [setClearColor]
    );

    useEffect(() => {
        viewerElement.clearColor = clearColor;
    }, [viewerElement, clearColor]);

    const onToneMappingChange = useCallback(
        (event?: unknown, data?: { optionValue: string | undefined; optionText: string | undefined }) => {
            setPostProcessingState((postProcessingState) => {
                return { ...postProcessingState, toneMapping: (data?.optionValue as PostProcessing["toneMapping"]) ?? originalToneMapping };
            });
        },
        [setPostProcessingState]
    );

    const onContrastChange = useCallback(
        (value?: number) => {
            setPostProcessingState((postProcessingState) => {
                return { ...postProcessingState, contrast: value ?? originalContrast };
            });
        },
        [setPostProcessingState]
    );

    const onExposureChange = useCallback(
        (value?: number) => {
            setPostProcessingState((postProcessingState) => {
                return { ...postProcessingState, exposure: value ?? originalExposure };
            });
        },
        [setPostProcessingState]
    );

    useEffect(() => {
        viewer.postProcessing = postProcessingState;
    }, [viewer, postProcessingState]);

    const onCameraSnapshotClick = useCallback(() => {
        const { alpha, beta, radius, target } = viewerDetails.camera;
        setCameraState({ alpha, beta, radius, target });
    }, [viewerDetails]);

    const onCameraRevertClick = useCallback(() => {
        if (cameraState) {
            viewerDetails.camera.interpolateTo(cameraState.alpha, cameraState.beta, cameraState.radius, cameraState.target);
            setCanRevertCameraState(false);
        }
    }, [viewerDetails, cameraState]);

    const onCameraResetClick = useCallback(() => {
        setCameraState(undefined);
    }, []);

    const onAutoOrbitChanged = useCallback(
        (value?: boolean) => {
            setAutoOrbitState((autoOrbitState) => {
                return { ...autoOrbitState, enabled: value ?? originalAutoOrbit };
            });
        },
        [setAutoOrbitState]
    );

    const onAutoOrbitSpeedChange = useCallback(
        (value?: number) => {
            setAutoOrbitState((autoOrbitState) => {
                return { ...autoOrbitState, speed: value ?? originalAutoOrbitSpeed };
            });
        },
        [setAutoOrbitState]
    );

    const onAutoOrbitDelayChange = useCallback(
        (value?: number) => {
            setAutoOrbitState((autoOrbitState) => {
                return { ...autoOrbitState, delay: value ?? originalAutoOrbitDelay };
            });
        },
        [setAutoOrbitState]
    );

    useEffect(() => {
        viewer.cameraAutoOrbit = autoOrbitState;
    }, [viewer, autoOrbitState]);

    const onAnimationSnapshotClick = useCallback(() => {
        setAnimationState({ animationSpeed: viewer.animationSpeed, selectedAnimation: viewer.selectedAnimation });
    }, [viewer]);

    const onAnimationAutoPlayChanged = useCallback(
        (value?: boolean) => {
            setAnimationAutoPlay(value ?? false);
        },
        [setAutoOrbitState]
    );

    const onAnimationRevertClick = useCallback(() => {
        if (animationState) {
            viewer.selectedAnimation = animationState.selectedAnimation;
            viewer.animationSpeed = animationState.animationSpeed;
        }
    }, [viewer, animationState]);

    const onAnimationResetClick = useCallback(() => {
        setAnimationState(undefined);
    }, []);

    const onMaterialVariantsSnapshotClick = useCallback(() => {
        setSelectedMaterialVariant(viewer.selectedMaterialVariant ?? undefined);
    }, [viewer]);

    const onMaterialVariantsResetClick = useCallback(() => {
        setSelectedMaterialVariant(undefined);
    }, []);

    useEffect(() => {
        animationAutoPlay ? viewer.playAnimation() : viewer.pauseAnimation();
    }, [viewer, animationAutoPlay]);

    const onAddHotspotClick = useCallback(() => {
        setHotspots((hotspots) => {
            return [
                ...hotspots,
                {
                    name: `HotSpot ${hotspots.length + 1}`,
                    id: performance.now().toString(),
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

    useEffect(() => {
        viewerElement.innerHTML = "";
        for (const hotspot of hotspots) {
            const annotation = new HTML3DAnnotationElement();
            annotation.hotSpot = hotspot.name;
            annotation.innerHTML = createDefaultAnnotation(hotspot.name);
            viewerElement.appendChild(annotation);
        }
    }, [viewerElement, hotspots]);

    const copyToClipboard = useCallback(() => {
        navigator.clipboard.writeText(htmlSnippet);
    }, [htmlSnippet]);

    const canRevertAll = useMemo(() => canRevertAnimationState || canRevertCameraState, [canRevertAnimationState, canRevertCameraState]);

    const onRevertAllClick = useCallback(() => {
        onAnimationRevertClick();
        onCameraRevertClick();
    }, [onCameraRevertClick, onAnimationRevertClick]);

    const onResetAllClick = useCallback(() => {
        onSyncEnvironmentChanged();
        onSkyboxBlurChange();
        onToneMappingChange();
        onContrastChange();
        onExposureChange();
        onCameraResetClick();
        onAutoOrbitChanged();
        onAutoOrbitSpeedChange();
        onAutoOrbitDelayChange();
        onAnimationResetClick();
        onAnimationAutoPlayChanged();
        onMaterialVariantsResetClick();
        setHotspots([]);
    }, [
        onSyncEnvironmentChanged,
        onToneMappingChange,
        onContrastChange,
        onExposureChange,
        onCameraResetClick,
        onAutoOrbitChanged,
        onAutoOrbitSpeedChange,
        onAutoOrbitDelayChange,
        onAnimationResetClick,
        onAnimationAutoPlayChanged,
        onMaterialVariantsResetClick,
    ]);

    return (
        <div className={"ConfiguratorContainer"}>
            <LineContainerComponent title="HTML SNIPPET">
                <div className="FlexLine" style={{ height: "auto" }}>
                    <div className="FlexItem" style={{ flex: 1 }}>
                        <TextInputLineComponent multilines={true} value={htmlSnippet} disabled={true} />
                        <div className="FlexLine" style={{ paddingLeft: 0, paddingRight: 0, paddingBottom: 0 }}>
                            <div className="FlexItem" style={{ flex: 5 }}>
                                <ButtonLineComponent label="Reset" onClick={onResetAllClick} />
                            </div>
                            <img className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={onRevertAllClick} />
                            <img className="ImageButton FlexItem" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={copyToClipboard} />
                        </div>
                    </div>
                </div>
            </LineContainerComponent>
            <div>
                <LineContainerComponent title="MODEL">
                    {/* <TextInputLineComponent placeholder="Model url" value={modelUrl} onChange={onModelUrlChange} />
                            <ButtonLineComponent label="Load Url" onClick={onModelUrlBlur} />
                            <ButtonLineComponent label="Load File" onClick={onLoadModelClick} /> */}
                    <div className="FlexLine">
                        <div className="FlexItem" style={{ flex: 5 }}>
                            <TextInputLineComponent placeholder="Model url" value={modelUrl} onChange={onModelUrlChange} />
                        </div>
                        <img className="FlexItem ImageButton" style={{ alignSelf: "flex-end" }} src={deleteIcon} onClick={onLoadModelClick} />
                    </div>
                </LineContainerComponent>
                <LineContainerComponent title="ENVIRONMENT">
                    <CheckBoxLineComponent label="Sync Lighting & Skybox" isSelected={() => syncEnvironment} onSelect={onSyncEnvironmentChanged} />
                    <TextInputLineComponent
                        placeholder={syncEnvironment ? "Environment url" : "Lighting url"}
                        value={environmentLightingUrl}
                        onChange={onEnvironmentLightingUrlChange}
                    />
                    <ButtonLineComponent label="Load Url" isDisabled={isEnvironmentLightingUrlValid} onClick={() => setNeedsEnvironmentUpdate(true)} />
                    <ButtonLineComponent label="Reset" isDisabled={isEnvironmentLightingUrlDefault} onClick={onEnvironmentLightingResetClick} />
                    {!syncEnvironment && (
                        <>
                            <TextInputLineComponent placeholder="Skybox url" value={environmentSkyboxUrl} onChange={onEnvironmentSkyboxUrlChange} />
                            <ButtonLineComponent label="Load Url" isDisabled={isEnvironmentSkyboxUrlValid} onClick={() => setNeedsEnvironmentUpdate(true)} />
                            <ButtonLineComponent label="Reset" isDisabled={isEnvironmentSkyboxUrlDefault} onClick={onEnvironmentSkyboxResetClick} />
                        </>
                    )}
                    {hasSkybox && (
                        <SliderLineComponent
                            label="Skybox Blur"
                            directValue={skyboxBlur}
                            minimum={0}
                            maximum={1}
                            step={0.01}
                            decimalCount={2}
                            target={viewerDetails.scene}
                            onChange={onSkyboxBlurChange}
                            lockObject={lockObject}
                        />
                    )}
                    {!hasSkybox && <ColorPicker color={clearColor} onColorChanged={onClearColorChange} lockObject={lockObject} />}
                </LineContainerComponent>
            </div>
            <LineContainerComponent title="WIP COMPONENTS">
                {/** Checkbox WIP */}
                <div className="FlexLine">
                    <div className="FlexItem" style={{ flex: 5 }}>
                        <CheckBoxLineComponent
                            label="Checkbox"
                            isSelected={() => {
                                return true;
                            }}
                            onSelect={(value: boolean) => {}}
                        />
                    </div>
                    <div className="FlexItem" style={{ alignSelf: "flex-end" }}>
                        <img className="ImageButton" src={deleteIcon} />
                    </div>
                </div>
                {/** Slider WIP*/}
                <SliderLineComponent label="Slider" minimum={0} maximum={1} step={0.05} decimalCount={0} target={viewerDetails.scene} lockObject={new LockObject()} />
            </LineContainerComponent>
        </div>
    );
};
