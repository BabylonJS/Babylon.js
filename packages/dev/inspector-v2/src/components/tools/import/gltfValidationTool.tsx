import type { FunctionComponent } from "react";

import type { IGLTFValidationResults } from "babylonjs-gltf2interface";

import { useRef } from "react";

import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { ChildWindow } from "shared-ui-components/fluent/hoc/childWindow";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";

export const GLTFValidationTool: FunctionComponent<{ validationResults: IGLTFValidationResults }> = ({ validationResults }) => {
    const childWindow = useRef<ChildWindow>(null);

    const issues = validationResults.issues;
    const hasErrors = issues.numErrors > 0;

    return (
        <>
            <MessageBar intent={hasErrors ? "error" : "success"} message={hasErrors ? "Your file has validation issues" : "Your file is a valid glTF file"} />
            <StringifiedPropertyLine key="NumErrors" label="Errors" value={issues.numErrors} />
            <StringifiedPropertyLine key="NumWarnings" label="Warnings" value={issues.numWarnings} />
            <StringifiedPropertyLine key="NumInfos" label="Infos" value={issues.numInfos} />
            <StringifiedPropertyLine key="NumHints" label="Hints" value={issues.numHints} />
            <ButtonLine label="View Report Details" onClick={() => childWindow.current?.open()} />
            <ChildWindow id="gltfValidationResults" imperativeRef={childWindow}>
                <pre style={{ margin: 0, overflow: "auto" }}>
                    <code>{JSON.stringify(validationResults, null, 2)}</code>
                </pre>
            </ChildWindow>
        </>
    );
};
