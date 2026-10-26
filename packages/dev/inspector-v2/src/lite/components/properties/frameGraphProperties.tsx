import { getFrameGraphTasks, type FrameGraph } from "@babylonjs/lite";
import { type FunctionComponent } from "react";

import { SwitchPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/switchPropertyLine";

import { GetEntityId } from "../../../components/explorer/explorerModel";
import { BoundProperty } from "../../../components/properties/boundProperty";
import { useWatchedValue } from "../../../contexts/watcherContext";

const GetTaskIdentities = (frameGraph: FrameGraph) =>
    getFrameGraphTasks(frameGraph)
        .map((task) => GetEntityId(task))
        .join(",");

/**
 * Renders execution switches for every task in a Lite frame graph.
 * @param props The frame graph being inspected.
 * @returns Task switches in execution order, or an empty fragment for an empty graph.
 */
export const FrameGraphTaskProperties: FunctionComponent<{ frameGraph: FrameGraph }> = (props) => {
    const { frameGraph } = props;
    useWatchedValue(frameGraph, GetTaskIdentities);
    const tasks = getFrameGraphTasks(frameGraph);

    return (
        <>
            {tasks.map((task, index) => (
                <BoundProperty
                    key={GetEntityId(task)}
                    component={SwitchPropertyLine}
                    label={`${index + 1}. ${task.name}`}
                    target={task}
                    propertyKey="executionEnabled"
                    defaultValue={null}
                    convertTo={(value) => value !== false}
                    convertFrom={(value) => value}
                />
            ))}
        </>
    );
};
