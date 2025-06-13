import "@babylonjs/core/Engines/Extensions/engine.dynamicTexture";
import "@babylonjs/core/Engines/Extensions/engine.videoTexture";
import "@babylonjs/core/Engines/Extensions/engine.rawTexture";
import "@babylonjs/core/Misc/fileTools";
import { SmartFilterRenderer } from "./smartFilterRenderer";
import { inputBlockDeserializer, SmartFilterEditorControl } from "@babylonjs/smart-filters-editor-control";
import { createThinEngine } from "./helpers/createThinEngine";
import { SmartFilterLoader } from "./smartFilterLoader";
import { smartFilterManifests } from "./configuration/smartFilters";
import { blockFactory } from "./configuration/blockFactory";
import { TextureRenderHelper } from "./textureRenderHelper";
import { SmartFilterDeserializer, type ISerializedBlockV1, type SmartFilter, Logger } from "@babylonjs/smart-filters";
import { hookupBackgroundOption } from "./backgroundOption";
import type { ThinEngine } from "@babylonjs/core/Engines/thinEngine";
import { builtInBlockRegistrations } from "@babylonjs/smart-filters-blocks";

type CurrentSmartFilterState = {
    smartFilter: SmartFilter;
    optimizedSmartFilter?: SmartFilter;
};

// Hardcoded options there is no UI for
const renderToTextureInsteadOfCanvas: boolean = false;

// Constants
const LocalStorageSmartFilterName = "SmartFilterName";
const LocalStorageOptimizeName = "OptimizeSmartFilter";

// Manage our HTML elements
const editActionLink = document.getElementById("editActionLink")!;
const smartFilterSelect = document.getElementById("smartFilterSelect")! as HTMLSelectElement;
const canvas = document.getElementById("renderCanvas")! as unknown as HTMLCanvasElement;
const optimizeCheckbox = document.getElementById("optimizeCheckbox") as HTMLInputElement;
const errorContainer = document.getElementById("errorContainer")! as HTMLDivElement;
const errorMessage = document.getElementById("errorMessage")! as HTMLDivElement;
const errorCloseButton = document.getElementById("errorCloseButton")! as HTMLButtonElement;

// Background option
hookupBackgroundOption();

// Create our services
const engine = createThinEngine(canvas);
const renderer = new SmartFilterRenderer(engine, localStorage.getItem(LocalStorageOptimizeName) === "true");
const textureRenderHelper = renderToTextureInsteadOfCanvas ? new TextureRenderHelper(engine, renderer) : null;
const smartFilterDeserializer = new SmartFilterDeserializer(
    (
        smartFilter: SmartFilter,
        engine: ThinEngine,
        serializedBlock: ISerializedBlockV1,
        smartFilterDeserializer: SmartFilterDeserializer
    ) => {
        return blockFactory(smartFilter, engine, serializedBlock, smartFilterDeserializer, builtInBlockRegistrations);
    },
    inputBlockDeserializer
);

const smartFilterLoader = new SmartFilterLoader(
    engine,
    renderer,
    smartFilterManifests,
    smartFilterDeserializer,
    textureRenderHelper
);

// Track the current Smart Filter
let currentSmartFilterState: CurrentSmartFilterState | undefined;

// Init TextureRenderHelper if we are using one
if (textureRenderHelper) {
    textureRenderHelper.startAsync().catch((err: unknown) => {
        showError(`Could not start TextureRenderHelper: ${err}`);
    });
}

function renderCurrentSmartFilter(hideEditor: boolean = true) {
    if (hideEditor) {
        SmartFilterEditorControl.Hide();
    }

    const smartFilterState = currentSmartFilterState;
    if (!smartFilterState) {
        return;
    }

    Logger.Log(
        `Rendering SmartFilter "${smartFilterState.smartFilter.name}" ${renderer.optimize ? "[optimized]" : ""}`
    );

    renderer
        .startRendering(smartFilterState.smartFilter)
        .then((smartFilterRendered: SmartFilter) => {
            closeError();
            if (renderer.optimize) {
                smartFilterState.optimizedSmartFilter = smartFilterRendered;
            }
        })
        .catch((err: unknown) => {
            showError(`Could not start rendering: ${err}`);
        });

    // In case we fell back to the default SmartFilter, update the <select>
    if (smartFilterSelect.value !== smartFilterState.smartFilter.name) {
        localStorage.setItem(LocalStorageSmartFilterName, smartFilterState.smartFilter.name);
        smartFilterSelect.value = smartFilterState.smartFilter.name;
    }
}

// Whenever a new SmartFilter is loaded, update currentSmartFilter and start rendering
smartFilterLoader.onSmartFilterLoadedObservable.add((smartFilter: SmartFilter) => {
    currentSmartFilterState = {
        smartFilter,
    };
    renderCurrentSmartFilter();
});

// Populate the smart filter <select> list
smartFilterLoader.manifests.forEach((manifest) => {
    const option = document.createElement("option");
    option.value = manifest.name;
    option.innerText = manifest.name;
    option.selected = manifest.name === localStorage.getItem(LocalStorageSmartFilterName);
    smartFilterSelect?.appendChild(option);
});

// Set up SmartFilter <select> handler
smartFilterSelect.addEventListener("change", () => {
    localStorage.setItem(LocalStorageSmartFilterName, smartFilterSelect.value);
    try {
        smartFilterLoader.loadFromManifest(smartFilterSelect.value);
    } catch (e) {
        smartFilterLoader.loadFromManifest(smartFilterLoader.defaultSmartFilterName);
    }
});

// Set up editor button
editActionLink.onclick = async () => {
    if (currentSmartFilterState) {
        const module = await import(/* webpackChunkName: "smartFilterEditor" */ "./helpers/launchEditor");
        module.launchEditor(
            currentSmartFilterState.smartFilter,
            engine,
            renderer,
            showError,
            closeError,
            smartFilterDeserializer
        );
    }
};

// Set up the optimize checkbox
optimizeCheckbox.checked = renderer.optimize;
optimizeCheckbox.onchange = () => {
    localStorage.setItem(LocalStorageOptimizeName, optimizeCheckbox.checked.toString());
    renderer.optimize = optimizeCheckbox.checked;
    renderCurrentSmartFilter(false);
};

// Error handling
errorCloseButton.addEventListener("click", closeError);
function showError(message: string) {
    Logger.Error(message);
    errorMessage.textContent = message;
    errorContainer.style.display = "grid";
}
function closeError() {
    errorContainer.style.display = "none";
}

// Load the most recently selected SmartFilter
smartFilterLoader.loadFromManifest(
    localStorage.getItem(LocalStorageSmartFilterName) || smartFilterLoader.defaultSmartFilterName
);
