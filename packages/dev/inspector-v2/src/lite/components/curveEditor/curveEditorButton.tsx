import { type AnimationGroup, type EngineContext } from "@babylonjs/lite";
import { EditRegular } from "@fluentui/react-icons";
import { type FunctionComponent, useRef } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { ChildWindow } from "shared-ui-components/fluent/hoc/childWindow";
import { GetEntityId } from "../../../components/explorer/explorerModel";
import { LiteCurveEditor } from "./curveEditor";

type LiteAnimationCurveEditorProps = {
    engine: EngineContext;
    group: AnimationGroup;
};

/**
 * Opens the shared curve editor for a Lite animation group.
 * @param props The engine and animation group.
 * @returns The curve-editor button and child window.
 */
export const LiteAnimationCurveEditor: FunctionComponent<LiteAnimationCurveEditorProps> = (props) => {
    const { engine, group } = props;
    const childWindow = useRef<ChildWindow>(null);

    return (
        <>
            <ButtonLine
                label="Edit Animation Curves"
                icon={EditRegular}
                onClick={() =>
                    childWindow.current?.open({
                        defaultWidth: 1024,
                        defaultHeight: 512,
                        title: "Animation Curve Editor",
                    })
                }
            />
            <ChildWindow id={`Lite Animation Curve Editor-${GetEntityId(group)}`} imperativeRef={childWindow}>
                <LiteCurveEditor engine={engine} group={group} title={group.name || "Animation Group"} />
            </ChildWindow>
        </>
    );
};
