/* eslint-disable no-console */
import { SmartFilterEditorControl } from "smart-filters-editor-control";

const Filter = (window as any).currentSmartFilter;
const Engine = (window as any).thinEngine;

if (Filter) {
    console.log("A SmartFilter was found in the page, launching the editor");
    // Display the editor
    SmartFilterEditorControl.Show({
        engine: Engine,
        filter: Filter,
    });
} else {
    console.log("No SmartFilter was found in the page");
}
