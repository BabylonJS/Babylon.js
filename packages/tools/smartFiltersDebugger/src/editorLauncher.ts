/* eslint-disable no-console */
import { SmartFilterEditorControl } from "@babylonjs/smart-filters-editor-control";

const filter = (window as any).currentSmartFilter;
const engine = (window as any).thinEngine;

if (filter) {
    console.log("A SmartFilter was found in the page, launching the editor");
    // Display the editor
    SmartFilterEditorControl.Show({
        engine,
        filter,
    });
} else {
    console.log("No SmartFilter was found in the page");
}
