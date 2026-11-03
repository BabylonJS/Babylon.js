import { type Mesh, type MorphTargetData, type SceneContext } from "@babylonjs/lite";
import { type FunctionComponent, useCallback } from "react";

import { SyncedSliderPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/syncedSliderPropertyLine";

import { DerivedProperty } from "../../../components/properties/boundProperty";
import { useWatchedValue, useWatcher } from "../../../contexts/watcherContext";
import { GetMeshMorphTargets, GetMorphTargetDisplayName, SetMorphTargetWeight } from "../../morphTargetUtils";

const MorphTargetWeight: FunctionComponent<{ scene: SceneContext; data: MorphTargetData; index: number }> = (props) => {
    const { scene, data, index } = props;
    const watcher = useWatcher();
    const getWeight = useCallback((targets: MorphTargetData) => targets.weights[index], [index]);
    const setWeight = useCallback(
        (targets: MorphTargetData, weight: number) => {
            SetMorphTargetWeight(scene, targets, index, weight);
            watcher.refresh();
        },
        [scene, index, watcher]
    );
    return (
        <DerivedProperty
            component={SyncedSliderPropertyLine}
            label={GetMorphTargetDisplayName(data, index)}
            uniqueId={`MorphTarget-${index}`}
            description="Overwritten each frame while a morph animation plays. Shared by all meshes using this morph data."
            target={data}
            getValue={getWeight}
            setValue={setWeight}
            min={0}
            max={1}
            step={0.01}
            unboundedInput
        />
    );
};

/**
 * Renders named, watched weights using Lite's full-copy morph setter.
 * @param props The scene and mesh whose morph data is inspected.
 * @returns One slider for each target, when present.
 */
export const MeshMorphTargetProperties: FunctionComponent<{ scene: SceneContext; mesh: Mesh }> = (props) => {
    const { scene, mesh } = props;
    const data = useWatchedValue(mesh, GetMeshMorphTargets);
    return <>{data && Array.from({ length: data.count }, (_, index) => <MorphTargetWeight key={index} scene={scene} data={data} index={index} />)}</>;
};
