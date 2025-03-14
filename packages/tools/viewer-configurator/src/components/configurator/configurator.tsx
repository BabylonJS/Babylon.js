import "./configurator.scss";
// eslint-disable-next-line import/no-internal-modules
import type { IDisposable, IInspectableOptions, Nullable, Observable } from "core/index";
// eslint-disable-next-line import/no-internal-modules
import type { HotSpot, PostProcessing, ToneMapping, Viewer, ViewerDetails, ViewerElement } from "viewer/index";
import type { DragEndEvent } from "@dnd-kit/core";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { faQuestionCircle } from "@fortawesome/free-regular-svg-icons";
import { faBullseye, faCamera, faCheck, faCopy, faGripVertical, faRotateLeft, faSquarePlus, faTrashCan, faUpload } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCallback, useEffect, useMemo, useRef, useState, type FunctionComponent } from "react";

import { restrictToParentElement, restrictToVerticalAxis } from "@dnd-kit/modifiers";
import { ButtonLineComponent } from "shared-ui-components/lines/buttonLineComponent";
import { CheckBoxLineComponent } from "shared-ui-components/lines/checkBoxLineComponent";
import { Color4LineComponent } from "shared-ui-components/lines/color4LineComponent";
import { LineContainerComponent } from "shared-ui-components/lines/lineContainerComponent";
import { OptionsLine } from "shared-ui-components/lines/optionsLineComponent";
import { SliderLineComponent } from "shared-ui-components/lines/sliderLineComponent";
import { TextInputLineComponent } from "shared-ui-components/lines/textInputLineComponent";
import { LockObject } from "shared-ui-components/tabs/propertyGrids/lockObject";

import { HTML3DAnnotationElement } from "viewer/viewerAnnotationElement";

import { PointerEventTypes } from "core/Events/pointerEvents";
import { Epsilon } from "core/Maths/math.constants";
import { WithinEpsilon } from "core/Maths/math.scalar.functions";
import { CreateHotSpotQueryForPickingInfo } from "core/Meshes/abstractMesh.hotSpot";

import { useObservableState } from "../../hooks/observableHooks";
import { LoadModel, PickModel } from "../../modelLoader";

import { ExpandableMessageLineComponent } from "../misc/ExpandableMessageLineComponent";
import { FontAwesomeIconButton } from "../misc/FontAwesomeIconButton";

const defaultModelUrl = "https://assets.babylonjs.com/meshes/Demos/optimized/acrobaticPlane_variants.glb";

type HotSpotInfo = { name: string; id: string; data: HotSpot };

const toneMappingOptions = [
    { label: "Standard", value: "standard" },
    { label: "None", value: "none" },
    { label: "Aces", value: "aces" },
    { label: "Neutral", value: "neutral" },
] as const satisfies IInspectableOptions[] & { label: string; value: ToneMapping }[];

const hotSpotTypeOptions = [{ label: "Surface", value: "surface" }] as const satisfies IInspectableOptions[];

const hotSpotsDndModifers = [restrictToVerticalAxis, restrictToParentElement];

function useConfiguration<T>(
    defaultState: T,
    get: () => T,
    set: ((data: T) => void) | undefined,
    equals: (left: T, right: T) => boolean = (left, right) => left === right,
    observables: Observable<any>[] = [],
    dependencies?: unknown[]
) {
    const memoDefaultState = useMemo(() => defaultState, dependencies ?? []);
    const memoSet = useCallback(set ?? (() => {}), dependencies ?? []);
    const memoGet = useCallback(get, dependencies ?? []);
    const memoEquals = useCallback(equals, []);
    const [configuredState, setConfiguredState] = useState(memoDefaultState);
    const liveState = useObservableState(memoGet, ...observables);
    const [isConfigured, setIsConfigured] = useState(false);

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
        };
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

export const Configurator: FunctionComponent<{ viewerElement: ViewerElement; viewerDetails: ViewerDetails; viewer: Viewer }> = (props) => {
    const { viewerElement, viewerDetails, viewer } = props;
    const model = useObservableState(() => viewerDetails.model, viewer.onModelChanged, viewer.onModelError);
    const lockObject = useMemo(() => new LockObject(), []);

    // Allow models to be dragged and dropped into the viewer.
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

    const [modelUrl, setModelUrl] = useState(defaultModelUrl);

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

    const lightingUrlConfig = useConfiguration("", () => viewerElement.environment.lighting ?? "", undefined, undefined, [viewer.onEnvironmentChanged], [viewerElement]);
    const skyboxUrlConfig = useConfiguration("", () => viewerElement.environment.skybox ?? "", undefined, undefined, [viewer.onEnvironmentChanged], [viewerElement]);

    const [syncEnvironment, setSyncEnvironment] = useState(false);
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
        viewer.environmentConfig.blur,
        () => viewer.environmentConfig.blur,
        (blur) => (viewer.environmentConfig = { blur }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const environmentIntensityConfig = useConfiguration(
        viewer.environmentConfig.intensity,
        () => viewer.environmentConfig.intensity,
        (intensity) => (viewer.environmentConfig = { intensity }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const environmentRotationConfig = useConfiguration(
        viewer.environmentConfig.rotation,
        () => viewer.environmentConfig.rotation,
        (rotation) => (viewer.environmentConfig = { rotation }),
        undefined,
        [viewer.onEnvironmentConfigurationChanged],
        [viewer]
    );

    const clearColorConfig = useConfiguration(
        viewerDetails.scene.clearColor,
        () => viewerDetails.scene.clearColor,
        (color) => (viewerDetails.scene.clearColor = color),
        (left, right) => left.equals(right),
        [viewerDetails.scene.onClearColorChangedObservable],
        [viewerDetails.scene]
    );
    // This is only needed because the color picker expects to "bind" to an object and a property.
    const clearColorWrapper = useMemo(() => {
        return { clearColor: clearColorConfig.configuredState };
    }, [clearColorConfig.configuredState]);

    const cameraConfig = useConfiguration(
        undefined,
        () => {
            return {
                alpha: viewerDetails.camera.alpha,
                beta: viewerDetails.camera.beta,
                radius: viewerDetails.camera.radius,
                target: viewerDetails.camera.target.clone(),
            };
        },
        (cameraState) => {
            if (cameraState) {
                viewerDetails.camera.interpolateTo(cameraState.alpha, cameraState.beta, cameraState.radius, cameraState.target);
            } else {
                viewer.resetCamera();
            }
        },
        (left, right) => {
            return (
                left == right ||
                (!!left &&
                    !!right &&
                    // TODO: Figure out why the final alpha/beta are as far from the goal value as they are.
                    WithinEpsilon(left.alpha, right.alpha, Epsilon * 10) &&
                    WithinEpsilon(left.beta, right.beta, Epsilon * 10) &&
                    WithinEpsilon(left.radius, right.radius, Epsilon) &&
                    left.target.equalsWithEpsilon(right.target, Epsilon))
            );
        },
        [viewerDetails.camera.onViewMatrixChangedObservable],
        [viewer, viewerDetails.camera, model]
    );

    const toneMappingConfig = useConfiguration(
        viewer.postProcessing.toneMapping,
        () => viewer.postProcessing.toneMapping,
        (toneMapping) => (viewer.postProcessing = { toneMapping }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );
    // This is only needed because the select expects to "bind" to an object and a property.
    const toneMappingWrapper = useMemo(() => {
        return { toneMapping: toneMappingConfig.configuredState };
    }, [toneMappingConfig.configuredState]);

    const contrastConfig = useConfiguration(
        viewer.postProcessing.contrast,
        () => viewer.postProcessing.contrast,
        (contrast) => (viewer.postProcessing = { contrast }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const exposureConfig = useConfiguration(
        viewer.postProcessing.exposure,
        () => viewer.postProcessing.exposure,
        (exposure) => (viewer.postProcessing = { exposure }),
        undefined,
        [viewer.onPostProcessingChanged],
        [viewer]
    );

    const autoOrbitConfig = useConfiguration(
        // TODO: Viewer should have autoOrbit false by default at the Viewer layer.
        false,
        () => viewer.cameraAutoOrbit.enabled,
        (enabled) => (viewer.cameraAutoOrbit = { enabled }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const autoOrbitSpeedConfig = useConfiguration(
        viewer.cameraAutoOrbit.speed,
        () => viewer.cameraAutoOrbit.speed,
        (speed) => (viewer.cameraAutoOrbit = { speed }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const autoOrbitDelayConfig = useConfiguration(
        viewer.cameraAutoOrbit.delay,
        () => viewer.cameraAutoOrbit.delay,
        (delay) => (viewer.cameraAutoOrbit = { delay }),
        undefined,
        [viewer.onCameraAutoOrbitChanged],
        [viewer]
    );

    const animationStateConfig = useConfiguration(
        undefined,
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
        (left, right) => {
            return left == right || (!!left && !!right && WithinEpsilon(left.animationSpeed, right.animationSpeed, Epsilon) && left.selectedAnimation === right.selectedAnimation);
        },
        [viewer.onAnimationSpeedChanged, viewer.onSelectedAnimationChanged],
        [viewer]
    );

    const animationAutoPlayConfig = useConfiguration(
        false,
        () => viewerElement.animationAutoPlay,
        (autoPlay) => {
            viewerElement.animationAutoPlay = autoPlay;
            autoPlay ? viewer.playAnimation() : viewer.pauseAnimation();
        },
        undefined,
        [viewer.onIsAnimationPlayingChanged],
        [viewer, viewerElement]
    );

    const selectedMaterialVariantConfig = useConfiguration(
        "",
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

    const [hotspots, setHotspots] = useState<HotSpotInfo[]>([]);

    useEffect(() => {
        setHotspots([]);
    }, [model]);

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

    // This is all the configured attributes, as an array of strings.
    const attributes = useMemo(() => {
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
            if (environmentIntensityConfig.canReset) {
                attributes.push(`skybox-intensity="${environmentIntensityConfig.configuredState}"`);
            }
            if (environmentRotationConfig.canReset) {
                attributes.push(`skybox-rotation="${environmentRotationConfig.configuredState}"`);
            }
        } else {
            if (clearColorConfig.canReset) {
                attributes.push(`clear-color="${clearColorConfig.configuredState.toHexString()}"`);
            }
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

        if (cameraConfig.configuredState) {
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
        lightingUrlConfig.configuredState,
        skyboxUrlConfig.configuredState,
        hasSkybox,
        skyboxBlurConfig.configuredState,
        environmentIntensityConfig.configuredState,
        environmentRotationConfig.configuredState,
        clearColorConfig.configuredState,
        toneMappingConfig.configuredState,
        contrastConfig.configuredState,
        exposureConfig.configuredState,
        cameraConfig.configuredState,
        autoOrbitConfig.configuredState,
        autoOrbitSpeedConfig.configuredState,
        autoOrbitDelayConfig.configuredState,
        hasAnimations,
        animationStateConfig.configuredState,
        animationAutoPlayConfig.configuredState,
        hasMaterialVariants,
        selectedMaterialVariantConfig.configuredState,
        hotspots,
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
        return !lightingUrlConfig.configuredState || URL.canParse(lightingUrlConfig.configuredState) || lightingUrlConfig.configuredState === "auto";
    }, [lightingUrlConfig.configuredState]);

    const onEnvironmentLightingUrlChange = useCallback(
        (value: string) => {
            lightingUrlConfig.update(value);
        },
        [lightingUrlConfig.update]
    );

    const isEnvironmentSkyboxUrlValid = useMemo(() => {
        return !skyboxUrlConfig.configuredState || URL.canParse(skyboxUrlConfig.configuredState);
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

    const onToneMappingChange = useCallback(
        (value: string | number) => {
            toneMappingConfig.update(value as PostProcessing["toneMapping"]);
        },
        [toneMappingConfig.update]
    );

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

    return (
        <div className="configurator">
            <div className="stickyContainer">
                <div className="configuratorHeader">
                    <img className="logo" src="https://www.babylonjs.com/Assets/logo-babylonjs-social-twitter.png" />
                    <div className="title">VIEWER CONFIGURATOR</div>
                    <FontAwesomeIconButton className="docs" title="Documentation" icon={faQuestionCircle} onClick={openDocumentation} />
                </div>
                <LineContainerComponent title="HTML SNIPPET">
                    <div className="flexColumn">
                        <TextInputLineComponent multilines={true} value={htmlSnippet} disabled={true} />
                        <div className="flexRow">
                            <div style={{ flex: 1 }}>
                                <ButtonLineComponent label="Reset" onClick={resetAll} />
                            </div>
                            <FontAwesomeIconButton title="Revert all state to snippet" icon={faRotateLeft} onClick={revertAll} disabled={!canRevertAll} />
                            <FontAwesomeIconButton title="Copy html to clipboard" icon={faCopy} onClick={copyToClipboard} />
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
            <LineContainerComponent title="POST PROCESSING">
                <div>
                    <div style={{ flex: 1 }}>
                        <OptionsLine
                            label="Tone Mapping"
                            valuesAreStrings={true}
                            options={toneMappingOptions}
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
                                options={hotSpotTypeOptions}
                                target={hotSpotTypeOptions}
                                propertyName=""
                                noDirectUpdate={true}
                            />
                        </div>
                        <FontAwesomeIconButton title="Add Hot Spot" icon={faSquarePlus} onClick={onAddHotspotClick} />
                    </div>
                    <DndContext sensors={dndSensors} modifiers={hotSpotsDndModifers} collisionDetection={closestCenter} onDragEnd={onHotSpotsReorder}>
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
