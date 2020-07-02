import { Nullable } from "babylonjs/types";
import { Observable } from 'babylonjs/Misc/observable';
import { DataStorage } from 'babylonjs/Misc/dataStorage';
import { Color4 } from 'babylonjs/Maths/math.color';
import { Vector2 } from 'babylonjs/Maths/math.vector';
import { BaseTexture } from 'babylonjs/Materials/Textures/baseTexture';

export class GlobalState {
    texture: BaseTexture;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    hostWindow: Window;
    onRebuildRequiredObservable = new Observable<void>();
    onBuiltObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<void>();
    onUpdateRequiredObservable = new Observable<void>();
    onZoomToFitRequiredObservable = new Observable<void>();
    onReOrganizedRequiredObservable = new Observable<void>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onIsLoadingChanged = new Observable<boolean>();
    onPreviewCommandActivated = new Observable<boolean>();
    onCandidateLinkMoved = new Observable<Nullable<Vector2>>();
    onSelectionBoxMoved = new Observable<ClientRect | DOMRect>();
    onImportFrameObservable = new Observable<any>();
    onGridSizeChanged = new Observable<void>();
    backgroundColor: Color4;
    blockKeyboardEvents = false;

    customSave?: {label: string, action: (data: string) => Promise<void>};

    public constructor() {
        let r = DataStorage.ReadNumber("BackgroundColorR", 0.8);
        let g = DataStorage.ReadNumber("BackgroundColorG", 0.8);
        let b = DataStorage.ReadNumber("BackgroundColorB", 0.8);
        this.backgroundColor = new Color4(r, g, b, 1.0);
    }
}