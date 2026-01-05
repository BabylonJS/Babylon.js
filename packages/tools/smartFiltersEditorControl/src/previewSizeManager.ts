import { ObservableProperty, type ReadOnlyObservableProperty } from "./helpers/observableProperty.js";

const PreviewAspectRatioKey = "PreviewAspectRatio";
const PreviewSizeModeKey = "PreviewSizeMode";
const PreviewFixedWidthKey = "PreviewFixedWidth";
const PreviewFixedHeightKey = "PreviewFixedHeight";
const OldPreviewFillContainerKey = "PreviewFillContainer";

const DefaultPreviewAspectRatio = "1.33333";
const DefaultPreviewFixedWidth = "400";
const DefaultPreviewFixedHeight = "300";

export type PreviewSizeMode = "aspectRatio" | "fixed" | "fill";

export const FixedMode = "fixed";
export const FillMode = "fill";
const AspectRatioMode = "aspectRatio";

/**
 * Manages the size mode of the preview window, including loading and saving settings to local storage.
 */
export class PreviewSizeManager {
    private _mode: ObservableProperty<PreviewSizeMode>;
    private _selectedModeOption: string;

    /**
     * The currently selected mode (e.g. aspectRatio, fixed, fill)
     */
    public get mode(): ReadOnlyObservableProperty<PreviewSizeMode> {
        return this._mode;
    }

    /**
     * The option selected in the UI, which could be a specific aspect ratio or one of the modes (fill, fixed)
     */
    public get selectedModeOption(): string {
        return this._selectedModeOption;
    }

    /**
     * The options selected in the UI, which could be a specific aspect ratio or one of the modes (fill, fixed)
     */
    public set selectedModeOption(value: string) {
        this._selectedModeOption = value;

        // Interpret mode
        if (value === FillMode) {
            this._mode.value = FillMode;
        } else if (value === FixedMode) {
            this._mode.value = FixedMode;
        } else if (!isNaN(Number(value))) {
            this._mode.value = AspectRatioMode;
            this.aspectRatio.value = value;
        }
    }

    /**
     * If the mode is "fixed", the width to use for preview
     */
    public fixedWidth: ObservableProperty<number>;

    /**
     * If the mode is "fixed", the height to use for preview
     */
    public fixedHeight: ObservableProperty<number>;

    /**
     * If the mode is "aspectRatio", the aspect ratio to use for preview
     */
    public aspectRatio: ObservableProperty<string>;

    /**
     * Creates a new PreviewSizeManager instance.
     */
    constructor() {
        // Read current storage keys
        this.aspectRatio = new ObservableProperty<string>(localStorage.getItem(PreviewAspectRatioKey) ?? DefaultPreviewAspectRatio);
        this.fixedWidth = new ObservableProperty<number>(Number.parseInt(localStorage.getItem(PreviewFixedWidthKey) || DefaultPreviewFixedWidth));
        this.fixedHeight = new ObservableProperty<number>(Number.parseInt(localStorage.getItem(PreviewFixedHeightKey) || DefaultPreviewFixedHeight));
        let modeFromStorage = localStorage.getItem(PreviewSizeModeKey);

        // Upgrade from old storage keys
        const oldFillContainer = localStorage.getItem(OldPreviewFillContainerKey);
        if (oldFillContainer !== null) {
            localStorage.removeItem(OldPreviewFillContainerKey);
            if (oldFillContainer) {
                modeFromStorage = FillMode;
            }
        }

        // Convert to a type union with a default
        if (modeFromStorage === null || (modeFromStorage !== AspectRatioMode && modeFromStorage !== FillMode && modeFromStorage !== FixedMode)) {
            modeFromStorage = AspectRatioMode;
        }
        const initialMode = modeFromStorage as PreviewSizeMode;

        // Set remaining properties
        this._mode = new ObservableProperty<PreviewSizeMode>(initialMode);
        this._selectedModeOption = initialMode === AspectRatioMode ? this.aspectRatio.value : initialMode;

        // Set up observers to update local storage and dependent properties
        this._mode.onChangedObservable.add((newMode) => {
            localStorage.setItem(PreviewSizeModeKey, newMode);
        });
        this.aspectRatio.onChangedObservable.add((newAspectRatio) => {
            localStorage.setItem(PreviewAspectRatioKey, newAspectRatio);
        });
        this.fixedWidth.onChangedObservable.add((newFixedWidth) => {
            localStorage.setItem(PreviewFixedWidthKey, newFixedWidth.toString());
        });
        this.fixedHeight.onChangedObservable.add((newFixedHeight) => {
            localStorage.setItem(PreviewFixedHeightKey, newFixedHeight.toString());
        });
    }
}
