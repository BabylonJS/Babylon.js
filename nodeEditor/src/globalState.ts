import { NodeMaterial } from "babylonjs/Materials/Node/nodeMaterial"
import { Nullable } from "babylonjs/types"
import { Observable } from 'babylonjs/Misc/observable';
import { DefaultNodeModel } from './components/diagram/defaultNodeModel';
import { LogEntry } from './components/log/logComponent';
import { NodeModel } from 'storm-react-diagrams';
import { INodeLocationInfo } from './nodeLocationInfo';
import { NodeMaterialBlock } from 'babylonjs/Materials/Node/nodeMaterialBlock';
import { PreviewMeshType } from './components/preview/previewMeshType';
import { DataStorage } from './dataStorage';

export class GlobalState {
    nodeMaterial: NodeMaterial;
    hostElement: HTMLElement;
    hostDocument: HTMLDocument;
    onSelectionChangedObservable = new Observable<Nullable<DefaultNodeModel>>();
    onRebuildRequiredObservable = new Observable<void>();
    onResetRequiredObservable = new Observable<Nullable<INodeLocationInfo[]>>();
    onUpdateRequiredObservable = new Observable<void>();
    onZoomToFitRequiredObservable = new Observable<void>();
    onReOrganizedRequiredObservable = new Observable<void>();
    onLogRequiredObservable = new Observable<LogEntry>();
    onErrorMessageDialogRequiredObservable = new Observable<string>();
    onPreviewMeshTypeChanged = new Observable<void>();
    onGetNodeFromBlock: (block: NodeMaterialBlock) => NodeModel;
    previewMeshType: PreviewMeshType;
    blockKeyboardEvents = false;

    customSave?: {label: string, callback: (nodeMaterial: NodeMaterial) => void};

    public constructor() {
        this.previewMeshType = DataStorage.ReadNumber("PreviewMeshType", PreviewMeshType.Box);
    }
}