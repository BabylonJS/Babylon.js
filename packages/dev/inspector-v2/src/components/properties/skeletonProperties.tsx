import type { ISkeletonViewerDisplayOptions, Skeleton } from "core/index";
import { SkeletonViewer } from "core/Debug/skeletonViewer";

import type { FunctionComponent } from "react";
import { TextPropertyLine } from "shared-ui-components/fluent/hoc/textPropertyLine";
import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/switchPropertyLine";
import { ButtonLine } from "shared-ui-components/fluent/hoc/ButtonLine";
import { DropdownPropertyLine } from "shared-ui-components/fluent/hoc/dropDownPropertyLine";
import { FloatInputPropertyLine } from "shared-ui-components/fluent/hoc/inputPropertyLine";

import { Collapse } from "@fluentui/react-motion-components-preview";
import { useState, useReducer } from "react";

export const SkeletonGeneralProperties: FunctionComponent<{ skeleton: Skeleton }> = (props) => {
    const { skeleton } = props;
    return (
        <>
            <TextPropertyLine key="SkeletonBoneCount" label="Bone count" description="The number of bones of the skeleton." value={skeleton.bones.length.toString()} />
            <SwitchPropertyLine
                key="SkeletonUseTextureToStoreBoneMatrices"
                label="Use texture to store bone matrices"
                description="Whether to use texture to store bone matrices or not."
                value={skeleton.useTextureToStoreBoneMatrices}
                onChange={(checked) => (skeleton.useTextureToStoreBoneMatrices = checked)}
            />
            <ButtonLine key="SkeletonReturnToRest" label="Return to rest" onClick={() => skeleton.returnToRest()} />
        </>
    );
};

const ViewerDisplayModes = [
    { label: "Lines", value: SkeletonViewer.DISPLAY_LINES },
    { label: "Spheres", value: SkeletonViewer.DISPLAY_SPHERES },
    { label: "Sphere and Spurs", value: SkeletonViewer.DISPLAY_SPHERE_AND_SPURS },
];

interface IViewerOptions extends Required<ISkeletonViewerDisplayOptions> {
    displayMode: number;
}

export const SkeletonViewerProperties: FunctionComponent<{ skeleton: Skeleton }> = (props) => {
    const { skeleton } = props;
    const scene = skeleton.getScene();

    const viewers = scene.meshes
        .filter((mesh) => mesh.skeleton === skeleton && mesh.reservedDataStore?.skeletonViewer)
        .map((mesh) => mesh.reservedDataStore!.skeletonViewer as SkeletonViewer);

    const [enabled, setEnabled] = useState(viewers.length > 0);

    const initialState = {
        displayMode: SkeletonViewer.DISPLAY_LINES,
        midStep: 0.235,
        midStepFactor: 0.155,
        sphereBaseSize: 0.15,
        sphereScaleUnit: 2,
        sphereFactor: 0.865,
        spurFollowsChild: false,
        showLocalAxes: false,
        localAxesSize: 0.075,
    };

    if (viewers.length > 0) {
        initialState.displayMode = viewers[0].displayMode;
        if (viewers[0].options.displayOptions) {
            Object.assign(initialState, viewers[0].options.displayOptions);
        }
    }

    const [options, updateOptions] = useReducer((options: IViewerOptions, deltaOptions: Partial<IViewerOptions>) => {
        const mergedOptions = { ...options, ...deltaOptions } as IViewerOptions;

        for (const viewer of viewers) {
            viewer.changeDisplayMode(mergedOptions.displayMode);
            viewer.changeDisplayOptions("midStep", mergedOptions.midStep);
            viewer.changeDisplayOptions("midStepFactor", mergedOptions.midStepFactor);
            viewer.changeDisplayOptions("sphereBaseSize", mergedOptions.sphereBaseSize);
            viewer.changeDisplayOptions("sphereScaleUnit", mergedOptions.sphereScaleUnit);
            viewer.changeDisplayOptions("sphereFactor", mergedOptions.sphereFactor);
            viewer.changeDisplayOptions("spurFollowsChild", mergedOptions.spurFollowsChild);
            viewer.changeDisplayOptions("showLocalAxes", mergedOptions.showLocalAxes);
            viewer.changeDisplayOptions("localAxesSize", mergedOptions.localAxesSize);
        }

        return mergedOptions;
    }, initialState);

    return (
        <>
            <SwitchPropertyLine
                key="SkeletonViewerEnabled"
                label="Enabled"
                description="Whether skeleton viewer is enabled or not."
                value={enabled}
                onChange={(checked) => {
                    if (checked) {
                        for (const mesh of scene.meshes) {
                            if (mesh.skeleton === skeleton && !mesh.reservedDataStore?.skeletonViewer) {
                                mesh.reservedDataStore ||= {};
                                mesh.reservedDataStore.skeletonViewer = new SkeletonViewer(skeleton, mesh, scene);
                            }
                        }
                    } else {
                        for (const mesh of scene.meshes) {
                            if (mesh.skeleton === skeleton && mesh.reservedDataStore?.skeletonViewer) {
                                mesh.reservedDataStore.skeletonViewer.dispose();
                                delete mesh.reservedDataStore.skeletonViewer;
                            }
                        }
                    }

                    setEnabled(checked);
                    updateOptions({});
                }}
            />

            <Collapse visible={enabled}>
                <div>
                    <DropdownPropertyLine
                        key="SkeletonViewerDisplayMode"
                        label="Display Mode"
                        options={ViewerDisplayModes}
                        description="Show lines, spheres, or sphere and spurs."
                        value={ViewerDisplayModes.find((value) => value.value === options.displayMode) || ViewerDisplayModes[0]}
                        onChange={(value) => updateOptions({ displayMode: value.value as number })}
                    />
                    <Collapse visible={options.displayMode !== SkeletonViewer.DISPLAY_LINES}>
                        <div>
                            <FloatInputPropertyLine
                                key="SkeletonViewerDisplayOptionsMidStep"
                                label="Mid Step"
                                value={options.midStep}
                                description="How far down to start tapering the bone spurs."
                                onChange={(value) => updateOptions({ midStep: value })}
                            />
                            <FloatInputPropertyLine
                                key="SkeletonViewerDisplayOptionsMidStepFactor"
                                label="Mid Step Factor"
                                value={options.midStepFactor}
                                description="How big is the midStep?"
                                onChange={(value) => updateOptions({ midStepFactor: value })}
                            />
                            <FloatInputPropertyLine
                                key="SkeletonViewerDisplayOptionsSphereBaseSize"
                                label="Sphere Base Size"
                                value={options.sphereBaseSize}
                                description="Base for the Sphere Size."
                                onChange={(value) => updateOptions({ sphereBaseSize: value })}
                            />
                            <FloatInputPropertyLine
                                key="SkeletonViewerDisplayOptionsSphereScaleUnit"
                                label="Sphere Scale Unit"
                                value={options.sphereScaleUnit}
                                description="The ratio of the sphere to the longest bone in units."
                                onChange={(value) => updateOptions({ sphereScaleUnit: value })}
                            />
                            <FloatInputPropertyLine
                                key="SkeletonViewerDisplayOptionsSphereFactor"
                                label="Sphere Factor"
                                value={options.sphereFactor}
                                description="Ratio for the Sphere Size."
                                onChange={(value) => updateOptions({ sphereFactor: value })}
                            />
                            <SwitchPropertyLine
                                key="SkeletonViewerDisplayOptionsSpurFollowsChild"
                                label="Spur Follows Child"
                                value={options.spurFollowsChild}
                                description="Whether a spur should attach its far end to the child bone position."
                                onChange={(checked) => updateOptions({ spurFollowsChild: checked })}
                            />
                            <SwitchPropertyLine
                                key="SkeletonViewerDisplayOptionsShowLocalAxes"
                                label="Show Local Axes"
                                value={options.showLocalAxes}
                                description="Whether to show local axes or not."
                                onChange={(checked) => updateOptions({ showLocalAxes: checked })}
                            />
                            <FloatInputPropertyLine
                                key="SkeletonViewerDisplayOptionsLocalAxesSize"
                                label="Local Axes Size"
                                value={options.localAxesSize}
                                description="Length of each local axis."
                                onChange={(value) => updateOptions({ localAxesSize: value })}
                            />
                        </div>
                    </Collapse>
                </div>
            </Collapse>
        </>
    );
};
