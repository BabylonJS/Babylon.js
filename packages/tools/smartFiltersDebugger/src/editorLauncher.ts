/* eslint-disable no-console */
import { SmartFilterEditorControl } from "smart-filters-editor-control";
import { GetSmartFilterEditorOptions } from "./smartFilterCompatibility.js";

const Options = GetSmartFilterEditorOptions(window as Window & { currentSmartFilter?: unknown; thinEngine?: unknown });

if (Options) {
    console.log("A SmartFilter was found in the page, launching the editor");
    // Display the editor
    SmartFilterEditorControl.Show(Options);
} else {
    console.log("No SmartFilter was found in the page");
}
