/*BabylonJS Inspector*/
// Dependencies for this module:
//   ../../../../Tools/gulp/react
//   ../../../../Tools/gulp/babylonjs
interface IActionTabsComponentProps {
    onSelectionChangeObservable: BABYLON.Observable<any>;
    scene: BABYLON.Scene;
    onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
    selectedEntity: any;
    selectedIndex: number;
}> {
    constructor(props: IActionTabsComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    renderContent(): JSX.Element;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
interface ISceneExplorerFilterComponentProps {
    onFilter: (filter: string) => void;
}
export declare class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
    constructor(props: ISceneExplorerFilterComponentProps);
    render(): JSX.Element;
}
interface ISceneExplorerComponentProps {
    scene: BABYLON.Scene;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    extensibilityGroups?: IExtensibilityGroup[];
    onSelectionChangeObservable: BABYLON.Observable<any>;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, {
    filter: BABYLON.Nullable<string>;
    selectedEntity: any;
    scene: BABYLON.Scene;
}> {
    constructor(props: ISceneExplorerComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    filterContent(filter: string): void;
    findSiblings(items: any[], target: any, goNext: boolean, data: {
        previousOne?: any;
        found?: boolean;
    }): boolean;
    processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>): void;
    renderContent(): JSX.Element | null;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
export interface IExtensibilityOption {
    label: string;
    action: (entity: any) => void;
}
export interface IExtensibilityGroup {
    predicate: (entity: any) => boolean;
    entries: IExtensibilityOption[];
}
export interface IInspectorOptions {
    overlay?: boolean;
    sceneExplorerRoot?: HTMLElement;
    actionTabsRoot?: HTMLElement;
    embedHostRoot?: HTMLElement;
    showExplorer?: boolean;
    showInspector?: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
    embedMode?: boolean;
    handleResize?: boolean;
    enablePopup?: boolean;
    explorerExtensibility?: IExtensibilityGroup[];
}
export declare class Inspector {
    static OnSelectionChangeObservable: BABYLON.Observable<string>;
    static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
    static Show(scene: BABYLON.Scene, userOptions: Partial<IInspectorOptions>): void;
    static Hide(): void;
}
export declare class PropertyChangedEvent {
    object: any;
    property: string;
    value: any;
    initialValue: any;
}
/*BabylonJS Inspector*/
// Dependencies for this module:
//   ../../../../Tools/gulp/react
//   ../../../../Tools/gulp/babylonjs
interface IActionTabsComponentProps {
    onSelectionChangeObservable: BABYLON.Observable<any>;
    scene: BABYLON.Scene;
    onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
    selectedEntity: any;
    selectedIndex: number;
}> {
    constructor(props: IActionTabsComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    renderContent(): JSX.Element;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
interface ISceneExplorerFilterComponentProps {
    onFilter: (filter: string) => void;
}
export declare class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
    constructor(props: ISceneExplorerFilterComponentProps);
    render(): JSX.Element;
}
interface ISceneExplorerComponentProps {
    scene: BABYLON.Scene;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    extensibilityGroups?: IExtensibilityGroup[];
    onSelectionChangeObservable: BABYLON.Observable<any>;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, {
    filter: BABYLON.Nullable<string>;
    selectedEntity: any;
    scene: BABYLON.Scene;
}> {
    constructor(props: ISceneExplorerComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    filterContent(filter: string): void;
    findSiblings(items: any[], target: any, goNext: boolean, data: {
        previousOne?: any;
        found?: boolean;
    }): boolean;
    processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>): void;
    renderContent(): JSX.Element | null;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
export interface IExtensibilityOption {
    label: string;
    action: (entity: any) => void;
}
export interface IExtensibilityGroup {
    predicate: (entity: any) => boolean;
    entries: IExtensibilityOption[];
}
export interface IInspectorOptions {
    overlay?: boolean;
    sceneExplorerRoot?: HTMLElement;
    actionTabsRoot?: HTMLElement;
    embedHostRoot?: HTMLElement;
    showExplorer?: boolean;
    showInspector?: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
    embedMode?: boolean;
    handleResize?: boolean;
    enablePopup?: boolean;
    explorerExtensibility?: IExtensibilityGroup[];
}
export declare class Inspector {
    static OnSelectionChangeObservable: BABYLON.Observable<string>;
    static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
    static Show(scene: BABYLON.Scene, userOptions: Partial<IInspectorOptions>): void;
    static Hide(): void;
}
export declare class PropertyChangedEvent {
    object: any;
    property: string;
    value: any;
    initialValue: any;
}
/*BabylonJS Inspector*/
// Dependencies for this module:
//   ../../../../Tools/gulp/react
//   ../../../../Tools/gulp/babylonjs
interface IActionTabsComponentProps {
    onSelectionChangeObservable: BABYLON.Observable<any>;
    scene: BABYLON.Scene;
    onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
    selectedEntity: any;
    selectedIndex: number;
}> {
    constructor(props: IActionTabsComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    renderContent(): JSX.Element;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
interface ISceneExplorerFilterComponentProps {
    onFilter: (filter: string) => void;
}
export declare class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
    constructor(props: ISceneExplorerFilterComponentProps);
    render(): JSX.Element;
}
interface ISceneExplorerComponentProps {
    scene: BABYLON.Scene;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    extensibilityGroups?: IExtensibilityGroup[];
    onSelectionChangeObservable: BABYLON.Observable<any>;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, {
    filter: BABYLON.Nullable<string>;
    selectedEntity: any;
    scene: BABYLON.Scene;
}> {
    constructor(props: ISceneExplorerComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    filterContent(filter: string): void;
    findSiblings(items: any[], target: any, goNext: boolean, data: {
        previousOne?: any;
        found?: boolean;
    }): boolean;
    processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>): void;
    renderContent(): JSX.Element | null;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
export interface IExtensibilityOption {
    label: string;
    action: (entity: any) => void;
}
export interface IExtensibilityGroup {
    predicate: (entity: any) => boolean;
    entries: IExtensibilityOption[];
}
export interface IInspectorOptions {
    overlay?: boolean;
    sceneExplorerRoot?: HTMLElement;
    actionTabsRoot?: HTMLElement;
    embedHostRoot?: HTMLElement;
    showExplorer?: boolean;
    showInspector?: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
    embedMode?: boolean;
    handleResize?: boolean;
    enablePopup?: boolean;
    explorerExtensibility?: IExtensibilityGroup[];
}
export declare class Inspector {
    static OnSelectionChangeObservable: BABYLON.Observable<string>;
    static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
    static Show(scene: BABYLON.Scene, userOptions: Partial<IInspectorOptions>): void;
    static Hide(): void;
}
export declare class PropertyChangedEvent {
    object: any;
    property: string;
    value: any;
    initialValue: any;
}
/*BabylonJS Inspector*/
// Dependencies for this module:
//   ../../../../Tools/gulp/react
//   ../../../../Tools/gulp/babylonjs
interface IActionTabsComponentProps {
    onSelectionChangeObservable: BABYLON.Observable<any>;
    scene: BABYLON.Scene;
    onPropertyChangedObservable?: BABYLON.Observable<PropertyChangedEvent>;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class ActionTabsComponent extends React.Component<IActionTabsComponentProps, {
    selectedEntity: any;
    selectedIndex: number;
}> {
    constructor(props: IActionTabsComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    renderContent(): JSX.Element;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
interface ISceneExplorerFilterComponentProps {
    onFilter: (filter: string) => void;
}
export declare class SceneExplorerFilterComponent extends React.Component<ISceneExplorerFilterComponentProps> {
    constructor(props: ISceneExplorerFilterComponentProps);
    render(): JSX.Element;
}
interface ISceneExplorerComponentProps {
    scene: BABYLON.Scene;
    noCommands?: boolean;
    noHeader?: boolean;
    noExpand?: boolean;
    extensibilityGroups?: IExtensibilityGroup[];
    onSelectionChangeObservable: BABYLON.Observable<any>;
    popupMode?: boolean;
    onPopup?: () => void;
    onClose?: () => void;
}
export declare class SceneExplorerComponent extends React.Component<ISceneExplorerComponentProps, {
    filter: BABYLON.Nullable<string>;
    selectedEntity: any;
    scene: BABYLON.Scene;
}> {
    constructor(props: ISceneExplorerComponentProps);
    componentWillMount(): void;
    componentWillUnmount(): void;
    filterContent(filter: string): void;
    findSiblings(items: any[], target: any, goNext: boolean, data: {
        previousOne?: any;
        found?: boolean;
    }): boolean;
    processKeys(keyEvent: React.KeyboardEvent<HTMLDivElement>): void;
    renderContent(): JSX.Element | null;
    onClose(): void;
    onPopup(): void;
    render(): JSX.Element;
}
export interface IExtensibilityOption {
    label: string;
    action: (entity: any) => void;
}
export interface IExtensibilityGroup {
    predicate: (entity: any) => boolean;
    entries: IExtensibilityOption[];
}
export interface IInspectorOptions {
    overlay?: boolean;
    sceneExplorerRoot?: HTMLElement;
    actionTabsRoot?: HTMLElement;
    embedHostRoot?: HTMLElement;
    showExplorer?: boolean;
    showInspector?: boolean;
    explorerWidth?: string;
    inspectorWidth?: string;
    embedHostWidth?: string;
    embedMode?: boolean;
    handleResize?: boolean;
    enablePopup?: boolean;
    explorerExtensibility?: IExtensibilityGroup[];
}
export declare class Inspector {
    static OnSelectionChangeObservable: BABYLON.Observable<string>;
    static OnPropertyChangedObservable: BABYLON.Observable<PropertyChangedEvent>;
    static Show(scene: BABYLON.Scene, userOptions: Partial<IInspectorOptions>): void;
    static Hide(): void;
}
export declare class PropertyChangedEvent {
    object: any;
    property: string;
    value: any;