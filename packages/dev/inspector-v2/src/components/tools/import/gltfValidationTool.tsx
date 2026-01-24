import { useCallback } from "react";
import type { FunctionComponent } from "react";
import { ButtonLine } from "shared-ui-components/fluent/hoc/buttonLine";
import { StringifiedPropertyLine } from "shared-ui-components/fluent/hoc/propertyLines/stringifiedPropertyLine";
import { MessageBar } from "shared-ui-components/fluent/primitives/messageBar";
import type { IGLTFValidationResults } from "babylonjs-gltf2interface";

export const GLTFValidationTool: FunctionComponent<{ validationResults: IGLTFValidationResults }> = ({ validationResults }) => {
    const openValidationDetails = useCallback(() => {
        const win = window.open("", "gltfValidationResults");
        if (win) {
            // TODO: format this better and use generator registry (https://github.com/KhronosGroup/glTF-Generator-Registry)
            win.document.title = `${validationResults.uri} - glTF Validation Results`;
            win.document.body.style.backgroundColor = "#322e2eff";
            win.document.body.style.color = "#fff";
            win.document.body.style.padding = "1rem";
            const pre = win.document.createElement("pre");
            const code = win.document.createElement("code");
            const textNode = win.document.createTextNode(JSON.stringify(validationResults, null, 2));
            code.append(textNode);
            pre.append(code);
            win.document.body.innerHTML = ""; // Clear previous content when reusing window
            win.document.body.append(pre);
            win.focus();
        }
    }, [validationResults]);

    const issues = validationResults.issues;
    const hasErrors = issues.numErrors > 0;

    return (
        <>
            <MessageBar intent={hasErrors ? "error" : "success"} message={hasErrors ? "Your file has validation issues" : "Your file is a valid glTF file"} />
            <StringifiedPropertyLine key="NumErrors" label="Errors" value={issues.numErrors} />
            <StringifiedPropertyLine key="NumWarnings" label="Warnings" value={issues.numWarnings} />
            <StringifiedPropertyLine key="NumInfos" label="Infos" value={issues.numInfos} />
            <StringifiedPropertyLine key="NumHints" label="Hints" value={issues.numHints} />
            <ButtonLine label="View Report Details" onClick={openValidationDetails} />
        </>
    );
};
