/*BabylonJS Inspector*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs

declare module 'babylonjs-inspector' {
    export * from 'babylonjs-inspector/adapters';
    export * from 'babylonjs-inspector/details';
    export * from 'babylonjs-inspector/gui';
    export * from 'babylonjs-inspector/helpers';
    export * from 'babylonjs-inspector/scheduler';
    export * from 'babylonjs-inspector/tabs';
    export * from 'babylonjs-inspector/tools';
    export * from 'babylonjs-inspector/tree';
    export * from 'babylonjs-inspector/treetools';
    export * from 'babylonjs-inspector/Inspector';
    export * from 'babylonjs-inspector/properties';
    export * from 'babylonjs-inspector/properties_gui';
}

declare module 'babylonjs-inspector/adapters' {
    export * from 'babylonjs-inspector/adapters/Adapter';
    export * from 'babylonjs-inspector/adapters/CameraAdapter';
    export * from 'babylonjs-inspector/adapters/GUIAdapter';
    export * from 'babylonjs-inspector/adapters/LightAdapter';
    export * from 'babylonjs-inspector/adapters/MaterialAdapter';
    export * from 'babylonjs-inspector/adapters/MeshAdapter';
    export * from 'babylonjs-inspector/adapters/PhysicsImpostorAdapter';
    export * from 'babylonjs-inspector/adapters/SoundAdapter';
    export * from 'babylonjs-inspector/adapters/TextureAdapter';
}

declare module 'babylonjs-inspector/details' {
    export * from 'babylonjs-inspector/details/DetailPanel';
    export * from 'babylonjs-inspector/details/Property';
    export * from 'babylonjs-inspector/details/PropertyLine';
}

declare module 'babylonjs-inspector/gui' {
    export * from 'babylonjs-inspector/gui/BasicElement';
    export * from 'babylonjs-inspector/gui/ColorElement';
    export * from 'babylonjs-inspector/gui/ColorPickerElement';
    export * from 'babylonjs-inspector/gui/CubeTextureElement';
    export * from 'babylonjs-inspector/gui/HDRCubeTextureElement';
    export * from 'babylonjs-inspector/gui/SearchBar';
    export * from 'babylonjs-inspector/gui/TextureElement';
    export * from 'babylonjs-inspector/gui/Tooltip';
}

declare module 'babylonjs-inspector/helpers' {
    export * from 'babylonjs-inspector/helpers/Helpers';
}

declare module 'babylonjs-inspector/scheduler' {
    export * from 'babylonjs-inspector/scheduler/Scheduler';
}

declare module 'babylonjs-inspector/tabs' {
    export * from 'babylonjs-inspector/tabs/CameraTab';
    export * from 'babylonjs-inspector/tabs/ConsoleTab';
    export * from 'babylonjs-inspector/tabs/GLTFTab';
    export * from 'babylonjs-inspector/tabs/GUITab';
    export * from 'babylonjs-inspector/tabs/LightTab';
    export * from 'babylonjs-inspector/tabs/MaterialTab';
    export * from 'babylonjs-inspector/tabs/MeshTab';
    export * from 'babylonjs-inspector/tabs/PhysicsTab';
    export * from 'babylonjs-inspector/tabs/PropertyTab';
    export * from 'babylonjs-inspector/tabs/SceneTab';
    export * from 'babylonjs-inspector/tabs/SoundTab';
    export * from 'babylonjs-inspector/tabs/StatsTab';
    export * from 'babylonjs-inspector/tabs/Tab';
    export * from 'babylonjs-inspector/tabs/TabBar';
    export * from 'babylonjs-inspector/tabs/TextureTab';
    export * from 'babylonjs-inspector/tabs/ToolsTab';
}

declare module 'babylonjs-inspector/tools' {
    export * from 'babylonjs-inspector/tools/AbstractTool';
    export * from 'babylonjs-inspector/tools/DisposeTool';
    export * from 'babylonjs-inspector/tools/FullscreenTool';
    export * from 'babylonjs-inspector/tools/LabelTool';
    export * from 'babylonjs-inspector/tools/PauseScheduleTool';
    export * from 'babylonjs-inspector/tools/PickTool';
    export * from 'babylonjs-inspector/tools/PopupTool';
    export * from 'babylonjs-inspector/tools/RefreshTool';
    export * from 'babylonjs-inspector/tools/Toolbar';
}

declare module 'babylonjs-inspector/tree' {
    export * from 'babylonjs-inspector/tree/TreeItem';
}

declare module 'babylonjs-inspector/treetools' {
    export * from 'babylonjs-inspector/treetools/AbstractTreeTool';
    export * from 'babylonjs-inspector/treetools/BoundingBox';
    export * from 'babylonjs-inspector/treetools/CameraPOV';
    export * from 'babylonjs-inspector/treetools/Checkbox';
    export * from 'babylonjs-inspector/treetools/DebugArea';
    export * from 'babylonjs-inspector/treetools/Info';
    export * from 'babylonjs-inspector/treetools/SoundInteractions';
}

declare module 'babylonjs-inspector/Inspector' {
    import { AbstractMesh, Nullable, Scene, Observable } from "babylonjs";
    
    export class Inspector {
            /** The HTML document relative to this inspector (the window or the popup depending on its mode) */
            static DOCUMENT: HTMLDocument;
            /** The HTML window. In popup mode, it's the popup itself. Otherwise, it's the current tab */
            static WINDOW: Window;
            onGUILoaded: Observable<any>;
            static GUIObject: any;
            /** The inspector is created with the given engine.
                * If the parameter 'popup' is false, the inspector is created as a right panel on the main window.
                * If the parameter 'popup' is true, the inspector is created in another popup.
                */
            constructor(scene: Scene, popup?: boolean, initialTab?: number | string, parentElement?: Nullable<HTMLElement>, newColors?: {
                    backgroundColor?: string;
                    backgroundColorLighter?: string;
                    backgroundColorLighter2?: string;
                    backgroundColorLighter3?: string;
                    color?: string;
                    colorTop?: string;
                    colorBot?: string;
            });
            readonly scene: Scene;
            readonly popupMode: boolean;
            /**
                * Filter the list of item present in the tree.
                * All item returned should have the given filter contained in the item id.
             */
            filterItem(filter: string): void;
            /** Display the mesh tab on the given object */
            displayObjectDetails(mesh: AbstractMesh): void;
            /** Clean the whole tree of item and rebuilds it */
            refresh(): void;
            /** Remove the inspector panel when it's built as a right panel:
                * remove the right panel and remove the wrapper
                */
            dispose(): void;
            /** Open the inspector in a new popup
                * Set 'firstTime' to true if there is no inspector created beforehands
                */
            openPopup(firstTime?: boolean): void;
            getActiveTabIndex(): number;
    }
}

declare module 'babylonjs-inspector/properties' {
    import { Vector2, Vector3, Color3, Color4, Quaternion, Size, Texture, RenderTargetTexture, DynamicTexture, BaseTexture, CubeTexture, HDRCubeTexture, Sound, ArcRotateCamera, FreeCamera, Scene, TransformNode, AbstractMesh, Mesh, StandardMaterial, PBRMaterial, PhysicsImpostor, ImageProcessingConfiguration, ColorCurves } from "babylonjs";
    export const PROPERTIES: {
        /** Format the given object :
          * If a format function exists, returns the result of this function.
          * If this function doesn't exists, return the object type instead
          */
        format: (obj: any) => any;
        'type_not_defined': {
            properties: any[];
            format: () => string;
        };
        'Vector2': {
            type: typeof Vector2;
            format: (vec: Vector2) => string;
        };
        'Vector3': {
            type: typeof Vector3;
            format: (vec: Vector3) => string;
        };
        'Color3': {
            type: typeof Color3;
            format: (color: Color3) => string;
            slider: {
                r: {
                    min: number;
                    max: number;
                    step: number;
                };
                g: {
                    min: number;
                    max: number;
                    step: number;
                };
                b: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'Color4': {
            type: typeof Color4;
            format: (color: Color4) => string;
            slider: {
                r: {
                    min: number;
                    max: number;
                    step: number;
                };
                g: {
                    min: number;
                    max: number;
                    step: number;
                };
                b: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'Quaternion': {
            type: typeof Quaternion;
        };
        'Size': {
            type: typeof Size;
            format: (size: Size) => string;
        };
        'Texture': {
            type: typeof Texture;
            format: (tex: Texture) => string;
        };
        'RenderTargetTexture': {
            type: typeof RenderTargetTexture;
        };
        'DynamicTexture': {
            type: typeof DynamicTexture;
        };
        'BaseTexture': {
            type: typeof BaseTexture;
        };
        'CubeTexture': {
            type: typeof CubeTexture;
        };
        'HDRCubeTexture': {
            type: typeof HDRCubeTexture;
        };
        'Sound': {
            type: typeof Sound;
        };
        'ArcRotateCamera': {
            type: typeof ArcRotateCamera;
            slider: {
                alpha: {
                    min: number;
                    max: number;
                    step: number;
                };
                beta: {
                    min: number;
                    max: number;
                    step: number;
                };
                fov: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'FreeCamera': {
            type: typeof FreeCamera;
            slider: {
                fov: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'Scene': {
            type: typeof Scene;
        };
        'TransformNode': {
            type: typeof TransformNode;
            format: (m: TransformNode) => string;
        };
        'AbstractMesh': {
            type: typeof AbstractMesh;
            format: (m: AbstractMesh) => string;
        };
        'Mesh': {
            type: typeof Mesh;
            format: (m: Mesh) => string;
            slider: {
                visibility: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'StandardMaterial': {
            type: typeof StandardMaterial;
            format: (mat: StandardMaterial) => string;
            slider: {
                alpha: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'PBRMaterial': {
            type: typeof PBRMaterial;
            slider: {
                alpha: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'PhysicsImpostor': {
            type: typeof PhysicsImpostor;
        };
        'ImageProcessingConfiguration': {
            type: typeof ImageProcessingConfiguration;
        };
        'ColorCurves': {
            type: typeof ColorCurves;
        };
    };
}

declare module 'babylonjs-inspector/properties_gui' {
    export type GUITyping = any;
    export let guiLoaded: boolean;
    /**
       * Function that add gui objects properties to the variable PROPERTIES
       */
    export function loadGUIProperties(GUI: GUITyping): void;
}

declare module 'babylonjs-inspector/adapters/Adapter' {
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    export abstract class Adapter {
            protected _obj: any;
            constructor(obj: any);
            /** Returns the name displayed in the tree */
            abstract id(): string;
            /** Returns the type of this object - displayed in the tree */
            abstract type(): string;
            /** Returns the list of properties to be displayed for this adapter */
            abstract getProperties(): Array<PropertyLine>;
            /** Returns true if the given object correspond to this  */
            correspondsTo(obj: any): boolean;
            /** Returns the adapter unique name */
            readonly name: string;
            /**
                * Returns the actual object used for this adapter
                */
            readonly object: any;
            /** Returns the list of tools available for this adapter */
            abstract getTools(): Array<AbstractTreeTool>;
    }
}

declare module 'babylonjs-inspector/adapters/CameraAdapter' {
    import { Camera } from "babylonjs";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { ICameraPOV } from "babylonjs-inspector/treetools/CameraPOV";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class CameraAdapter extends Adapter implements ICameraPOV {
        constructor(obj: Camera);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setPOV(): void;
        getCurrentActiveCamera(): string;
    }
}

declare module 'babylonjs-inspector/adapters/GUIAdapter' {
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { IToolVisible } from "babylonjs-inspector/treetools/Checkbox";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class GUIAdapter extends Adapter implements IToolVisible {
        constructor(obj: any);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
    }
}

declare module 'babylonjs-inspector/adapters/LightAdapter' {
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { IToolVisible } from "babylonjs-inspector/treetools/Checkbox";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class LightAdapter extends Adapter implements IToolVisible {
        constructor(obj: BABYLON.Light);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
    }
}

declare module 'babylonjs-inspector/adapters/MaterialAdapter' {
    import { Material } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class MaterialAdapter extends Adapter {
        constructor(obj: Material);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        /** No tools for a material adapter */
        getTools(): Array<AbstractTreeTool>;
    }
}

declare module 'babylonjs-inspector/adapters/MeshAdapter' {
    import { Node } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { IToolBoundingBox } from "babylonjs-inspector/treetools/BoundingBox";
    import { IToolVisible } from "babylonjs-inspector/treetools/Checkbox";
    import { IToolDebug } from "babylonjs-inspector/treetools/DebugArea";
    import { IToolInfo } from "babylonjs-inspector/treetools/Info";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class MeshAdapter extends Adapter implements IToolVisible, IToolDebug, IToolBoundingBox, IToolInfo {
            constructor(mesh: Node);
            /** Returns the name displayed in the tree */
            id(): string;
            /** Returns the type of this object - displayed in the tree */
            type(): string;
            /** Returns the list of properties to be displayed for this adapter */
            getProperties(): Array<PropertyLine>;
            getTools(): Array<AbstractTreeTool>;
            setVisible(b: boolean): void;
            isVisible(): boolean;
            isBoxVisible(): boolean;
            setBoxVisible(b: boolean): boolean;
            debug(enable: boolean): void;
            /** Returns some information about this mesh */
            getInfo(): string;
    }
}

declare module 'babylonjs-inspector/adapters/PhysicsImpostorAdapter' {
    import { PhysicsImpostor } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { IToolVisible } from "babylonjs-inspector/treetools/Checkbox";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class PhysicsImpostorAdapter extends Adapter implements IToolVisible {
        constructor(obj: PhysicsImpostor, viewer: any);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
    }
}

declare module 'babylonjs-inspector/adapters/SoundAdapter' {
    import { Sound } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    import { ISoundInteractions } from "babylonjs-inspector/treetools/SoundInteractions";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    export class SoundAdapter extends Adapter implements ISoundInteractions {
        constructor(obj: Sound);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setPlaying(callback: Function): void;
    }
}

declare module 'babylonjs-inspector/adapters/TextureAdapter' {
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    import { BaseTexture } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    export class TextureAdapter extends Adapter {
        constructor(obj: BaseTexture);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
    }
}

declare module 'babylonjs-inspector/details/DetailPanel' {
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    export interface SortDirection {
            [property: string]: number;
    }
    export class DetailPanel extends BasicElement {
            constructor(dr?: Array<PropertyLine>);
            details: Array<PropertyLine>;
            protected _build(): void;
            /** Updates the HTML of the detail panel */
            update(_items?: Array<PropertyLine>): void;
            /** Search an element by name  */
            searchByName(searchName: string): void;
            /**
                * Removes all data in the detail panel but keep the header row
                */
            clean(): void;
            /**
                * Clean the rows only
                */
            cleanRow(): void;
            /** Overrides basicelement.dispose */
            dispose(): void;
    }
}

declare module 'babylonjs-inspector/details/Property' {
    /**
      * A property is a link between a data (string) and an object.
      */
    export class Property {
        constructor(prop: string, obj: any, parentObj?: any);
        readonly name: string;
        value: any;
        readonly type: string;
        obj: any;
    }
}

declare module 'babylonjs-inspector/details/PropertyLine' {
    import { Nullable } from "babylonjs";
    import { Property } from "babylonjs-inspector/details/Property";
    export class PropertyFormatter {
            /**
                * Format the value of the given property of the given object.
                */
            static format(obj: any, prop: string): string;
    }
    /**
        * A property line represents a line in the detail panel. This line is composed of :
        * - a name (the property name)
        * - a value if this property is of a type 'simple' : string, number, boolean, color, texture
        * - the type of the value if this property is of a complex type (Vector2, Size, ...)
        * - a ID if defined (otherwise an empty string is displayed)
        * The original object is sent to the value object who will update it at will.
        *
        * A property line can contain OTHER property line objects in the case of a complex type.
        * If this instance has no link to other instances, its type is ALWAYS a simple one (see above).
        *
        */
    export class PropertyLine {
            constructor(prop: Property, parent?: Nullable<PropertyLine>, level?: number);
            validateInput(value: any, forceupdate?: boolean): void;
            /** Retrieve the correct object from its parent.
                * If no parent exists, returns the property value.
                * This method is used at each update in case the property object is removed from the original object
                * (example : mesh.position = new Vector3 ; the original vector3 object is deleted from the mesh).
             */
            updateObject(): any;
            readonly name: string;
            readonly value: any;
            readonly type: string;
            /** Delete properly this property line.
                * Removes itself from the scheduler.
                * Dispose all viewer element (color, texture...)
                */
            dispose(): void;
            /**
                * Update the property division with the new property value.
                * If this property is complex, update its child, otherwise update its text content
                */
            update(): void;
            toHtml(): HTMLElement;
            closeDetails(): void;
    }
}

declare module 'babylonjs-inspector/gui/BasicElement' {
    /**
        * Represents a html div element.
        * The div is built when an instance of BasicElement is created.
        */
    export abstract class BasicElement {
            protected _div: HTMLDivElement;
            constructor();
            /**
                * Returns the div element
                */
            toHtml(): HTMLDivElement;
            /**
                * Build the html element
                */
            protected _build(): void;
            abstract update(data?: any): void;
            /** Default dispose method if needed */
            dispose(): void;
    }
}

declare module 'babylonjs-inspector/gui/ColorElement' {
    import { Color3, Color4 } from "babylonjs";
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    /**
     * Display a very small div corresponding to the given color
     */
    export class ColorElement extends BasicElement {
        constructor(color: Color4 | Color3);
        update(color?: Color4 | Color3): void;
    }
}

declare module 'babylonjs-inspector/gui/ColorPickerElement' {
    import { Color3, Color4 } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    /**
      * Represents a html div element.
      * The div is built when an instance of BasicElement is created.
      */
    export class ColorPickerElement extends BasicElement {
        protected _input: HTMLInputElement;
        constructor(color: Color4 | Color3, propertyLine: PropertyLine);
        update(color?: Color4 | Color3): void;
    }
}

declare module 'babylonjs-inspector/gui/CubeTextureElement' {
    import { Mesh, Scene, Texture } from "babylonjs";
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    /**
     * Display a very small div. A new canvas is created, with a new js scene, containing only the
     * cube texture in a cube
     */
    export class CubeTextureElement extends BasicElement {
        protected _scene: Scene;
        protected _cube: Mesh;
        protected _textureUrl: string;
        /** The texture given as a parameter should be cube. */
        constructor(tex: Texture);
        update(tex?: Texture): void;
        /** Creates the box  */
        protected _populateScene(): void;
        /** Removes properly the babylon engine */
        dispose(): void;
    }
}

declare module 'babylonjs-inspector/gui/HDRCubeTextureElement' {
    import { Texture } from "babylonjs";
    import { CubeTextureElement } from "babylonjs-inspector/gui/CubeTextureElement";
    /**
     * Display a very small div. A new canvas is created, with a new js scene, containing only the
     * cube texture in a cube
     */
    export class HDRCubeTextureElement extends CubeTextureElement {
        /** The texture given as a parameter should be cube. */
        constructor(tex: Texture);
        /** Creates the box  */
        protected _populateScene(): void;
    }
}

declare module 'babylonjs-inspector/gui/SearchBar' {
    import { DetailPanel } from "babylonjs-inspector/details/DetailPanel";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    /**
      * A search bar can be used to filter elements in the tree panel.
      * At each keypress on the input, the treepanel will be filtered.
      */
    export class SearchBar extends BasicElement {
        constructor(tab: PropertyTab);
        /** Delete all characters typped in the input element */
        reset(): void;
        update(): void;
    }
    export class SearchBarDetails extends BasicElement {
        constructor(tab: DetailPanel);
        /** Delete all characters typped in the input element */
        reset(): void;
        update(): void;
    }
}

declare module 'babylonjs-inspector/gui/TextureElement' {
    import { Texture } from "babylonjs";
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    /**
     * Display a very small div corresponding to the given texture. On mouse over, display the full image
     */
    export class TextureElement extends BasicElement {
        constructor(tex: Texture);
        update(tex?: Texture): void;
    }
}

declare module 'babylonjs-inspector/gui/Tooltip' {
    import { Nullable } from "babylonjs";
    /**
      * Creates a tooltip for the parent of the given html element
      */
    export class Tooltip {
        constructor(elem: HTMLElement, tip: string, attachTo?: Nullable<HTMLElement>);
    }
}

declare module 'babylonjs-inspector/helpers/Helpers' {
    import { Nullable } from "babylonjs";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    export class Helpers {
            /**
                * Returns the type of the given object. First
                * uses getClassName. If nothing is returned, used the type of the constructor
                */
            static GET_TYPE(obj: any): string;
            /**
                * Returns true if the user browser is edge.
                */
            static IsBrowserEdge(): boolean;
            /**
                * Returns true if the user browser is IE.
                */
            static IsBrowserIE(): boolean;
            /** Send the event which name is given in parameter to the window */
            static SEND_EVENT(eventName: string): void;
            /** Returns the given number with 2 decimal number max if a decimal part exists */
            static Trunc(nb: number): number;
            /**
                * Useful function used to create a div
                */
            static CreateDiv(className?: Nullable<string>, parent?: HTMLElement, tooltip?: string): HTMLDivElement;
            /**
                * Useful function used to create a input
                */
            static CreateInput(className?: string, parent?: HTMLElement, tooltip?: string): HTMLInputElement;
            static CreateElement(element: string, className?: Nullable<string>, parent?: HTMLElement, tooltip?: string): HTMLElement;
            /**
                * Removes all children of the given div.
                */
            static CleanDiv(div: HTMLElement): void;
            /**
                * Returns the true value of the given CSS Attribute from the given element (in percentage or in pixel, as it was specified in the css)
                */
            static Css(elem: HTMLElement, cssAttribute: string): string;
            static LoadScript(): void;
            static IsSystemName(name: string): boolean;
            /**
                * Return an array of PropertyLine for an obj
                * @param obj
                */
            static GetAllLinesProperties(obj: any): Array<PropertyLine>;
            /**
                * Returns an array of string corresponding to tjhe list of properties of the object to be displayed
                * @param obj
                */
            static GetAllLinesPropertiesAsString(obj: any, dontTakeThis?: Array<string>): Array<string>;
            static Capitalize(str: string): string;
    }
}

declare module 'babylonjs-inspector/scheduler/Scheduler' {
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    export class Scheduler {
        /** Is this scheduler in pause ? */
        pause: boolean;
        /** All properties are refreshed every 250ms */
        static REFRESH_TIME: number;
        constructor();
        static getInstance(): Scheduler;
        /** Add a property line to be updated every X ms */
        add(prop: PropertyLine): void;
        /** Removes the given property from the list of properties to update */
        remove(prop: PropertyLine): void;
        dispose(): void;
    }
}

declare module 'babylonjs-inspector/tabs/CameraTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class CameraTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/ConsoleTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    /**
      * The console tab will have two features :
      * - hook all console.log call and display them in this panel (and in the browser console as well)
      * - display all Babylon logs (called with Tools.Log...)
      */
    export class ConsoleTab extends Tab {
        constructor(tabbar: TabBar, insp: Inspector);
        /** Overrides super.dispose */
        dispose(): void;
        active(b: boolean): void;
    }
}

declare module 'babylonjs-inspector/tabs/GLTFTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class GLTFTab extends Tab {
        static readonly IsSupported: boolean;
        /** @hidden */
        static _Initialize(): void;
        constructor(tabbar: TabBar, inspector: Inspector);
        dispose(): void;
        /** @hidden */
        static _GetLoaderDefaultsAsync(): Promise<any>;
    }
}

declare module 'babylonjs-inspector/tabs/GUITab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class GUITab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/LightTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class LightTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/MaterialTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class MaterialTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/MeshTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class MeshTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/PhysicsTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class PhysicsTab extends PropertyTab {
        viewer: any;
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/PropertyTab' {
    import { Nullable } from "babylonjs";
    import { DetailPanel } from "babylonjs-inspector/details/DetailPanel";
    import { SearchBar } from "babylonjs-inspector/gui/SearchBar";
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    /**
      * A Property tab can creates two panels:
      * a tree panel and a detail panel,
      * in which properties will be displayed.
      * Both panels are separated by a resize bar
      */
    export abstract class PropertyTab extends Tab {
        protected _inspector: Inspector;
        /** The panel containing a list of items */
        protected _treePanel: HTMLDivElement;
        /** The panel containing a list if properties corresponding to an item */
        protected _detailsPanel: DetailPanel;
        protected _treeItems: Array<TreeItem>;
        protected _searchBar: SearchBar;
        constructor(tabbar: TabBar, name: string, insp: Inspector);
        /** Overrides dispose */
        dispose(): void;
        update(_items?: Array<TreeItem>): void;
        /** Display the details of the given item */
        displayDetails(item: TreeItem): void;
        /** Select an item in the tree */
        select(item: TreeItem): void;
        /** Set the given item as active in the tree */
        activateNode(item: TreeItem): void;
        /** Returns the treeitem corersponding to the given obj, null if not found */
        getItemFor(_obj: any): Nullable<TreeItem>;
        filter(filter: string): void;
        /** Builds the tree panel */
        protected abstract _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/SceneTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class SceneTab extends Tab {
            constructor(tabbar: TabBar, insp: Inspector);
            /** Overrides super.dispose */
            dispose(): void;
    }
}

declare module 'babylonjs-inspector/tabs/SoundTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { PropertyTab } from "babylonjs-inspector/tabs/PropertyTab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class SoundTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}

declare module 'babylonjs-inspector/tabs/StatsTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class StatsTab extends Tab {
        constructor(tabbar: TabBar, insp: Inspector);
        dispose(): void;
        active(b: boolean): void;
    }
}

declare module 'babylonjs-inspector/tabs/Tab' {
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export abstract class Tab extends BasicElement {
            protected _tabbar: TabBar;
            name: string;
            protected _isActive: boolean;
            protected _panel: HTMLDivElement;
            constructor(tabbar: TabBar, name: string);
            /** True if the tab is active, false otherwise */
            isActive(): boolean;
            protected _build(): void;
            /** Set this tab as active or not, depending on the current state */
            active(b: boolean): void;
            update(): void;
            /** Creates the tab panel for this tab. */
            getPanel(): HTMLElement;
            /** Add this in the propertytab with the searchbar */
            filter(str: string): void;
            /** Dispose properly this tab */
            abstract dispose(): void;
            /** Select an item in the tree */
            select(item: TreeItem): void;
            /**
                * Returns the total width in pixel of this tab, 0 by default
             */
            getPixelWidth(): number;
    }
}

declare module 'babylonjs-inspector/tabs/TabBar' {
    import { AbstractMesh, Nullable } from "babylonjs";
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    /**
        * A tab bar will contains each view the inspector can have : Canvas2D, Meshes...
        * The default active tab is the first one of the list.
        */
    export class TabBar extends BasicElement {
            constructor(inspector: Inspector, initialTab?: number | string);
            update(): void;
            protected _build(): void;
            /** Dispose the current tab, set the given tab as active, and refresh the treeview */
            switchTab(tab: Tab): void;
            /** Display the mesh tab.
                * If a parameter is given, the given mesh details are displayed
                */
            switchMeshTab(mesh?: AbstractMesh): void;
            /** Returns the active tab */
            getActiveTab(): Nullable<Tab>;
            getActiveTabIndex(): number;
            getTabIndex(name: string): number;
            readonly inspector: Inspector;
            /**
                * Returns the total width in pixel of the tabbar,
                * that corresponds to the sum of the width of each visible tab + toolbar width
             */
            getPixelWidth(): number;
            /** Display the remaining icon or not depending on the tabbar width.
                * This function should be called each time the inspector width is updated
                */
            updateWidth(): void;
    }
}

declare module 'babylonjs-inspector/tabs/TextureTab' {
    import { TextureAdapter } from "babylonjs-inspector/adapters/TextureAdapter";
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { TreeItem } from "babylonjs-inspector/tree/TreeItem";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class TextureTab extends Tab {
        static DDSPreview: DDSPreview;
        /** The panel containing a list of items */
        protected _treePanel: HTMLElement;
        protected _treeItems: Array<TreeItem>;
        constructor(tabbar: TabBar, inspector: Inspector);
        dispose(): void;
        update(_items?: Array<TreeItem>): void;
        /** Display the details of the given item */
        displayDetails(item: TreeItem): void;
        /** Select an item in the tree */
        select(item: TreeItem): void;
        /** Set the given item as active in the tree */
        activateNode(item: TreeItem): void;
    }
    class DDSPreview {
        canvas: HTMLCanvasElement | null;
        constructor(AdapterItem: TextureAdapter);
        insertPreview(AdapterItem: TextureAdapter): void;
        dispose(): void;
    }
    export {};
}

declare module 'babylonjs-inspector/tabs/ToolsTab' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { TabBar } from "babylonjs-inspector/tabs/TabBar";
    export class ToolsTab extends Tab {
        constructor(tabbar: TabBar, insp: Inspector);
        dispose(): void;
    }
}

declare module 'babylonjs-inspector/tools/AbstractTool' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    export abstract class AbstractTool {
            protected _inspector: Inspector;
            constructor(iconSet: string, icon: string, parent: HTMLElement, inspector: Inspector, tooltip: string);
            toHtml(): HTMLElement;
            /**
                * Returns the total width in pixel of this tool, 0 by default
             */
            getPixelWidth(): number;
            /**
                * Updates the icon of this tool with the given string
                */
            protected _updateIcon(icon: string): void;
            abstract action(): void;
    }
}

declare module 'babylonjs-inspector/tools/DisposeTool' {
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    import { Inspector } from "babylonjs-inspector/Inspector";
    /**
      * Removes the inspector panel
      */
    export class DisposeTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/FullscreenTool' {
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    import { Inspector } from "babylonjs-inspector/Inspector";
    export class FullscreenTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/LabelTool' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    export class LabelTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        dispose(): void;
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/PauseScheduleTool' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    export class PauseScheduleTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/PickTool' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    export class PickTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/PopupTool' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    export class PopupTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/RefreshTool' {
    import { Inspector } from "babylonjs-inspector/Inspector";
    import { AbstractTool } from "babylonjs-inspector/tools/AbstractTool";
    export class RefreshTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}

declare module 'babylonjs-inspector/tools/Toolbar' {
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    import { Inspector } from "babylonjs-inspector/Inspector";
    export class Toolbar extends BasicElement {
        constructor(inspector: Inspector);
        update(): void;
        protected _build(): void;
        /**
          * Returns the total width in pixel of the tabbar,
          * that corresponds to the sum of the width of each tab + toolbar width
         */
        getPixelWidth(): number;
    }
}

declare module 'babylonjs-inspector/tree/TreeItem' {
    import { BasicElement } from "babylonjs-inspector/gui/BasicElement";
    import { Tab } from "babylonjs-inspector/tabs/Tab";
    import { Adapter } from "babylonjs-inspector/adapters/Adapter";
    import { PropertyLine } from "babylonjs-inspector/details/PropertyLine";
    export class TreeItem extends BasicElement {
            children: Array<TreeItem>;
            constructor(tab: Tab, obj: Adapter);
            /** Returns the item ID == its adapter ID */
            readonly id: string;
            /** Add the given item as a child of this one */
            add(child: TreeItem): void;
            /**
                * Returns the original adapter
                */
            readonly adapter: Adapter;
            /**
                * Function used to compare this item to another tree item.
                * Returns the alphabetical sort of the adapter ID
                */
            compareTo(item: TreeItem): number;
            /** Returns true if the given obj correspond to the adapter linked to this tree item */
            correspondsTo(obj: any): boolean;
            /** hide all children of this item */
            fold(): void;
            /** Show all children of this item */
            unfold(): void;
            /** Build the HTML of this item */
            protected _build(): void;
            /**
                * Returns one HTML element (.details) containing all  details of this primitive
                */
            getDetails(): Array<PropertyLine>;
            update(): void;
            /**
                * Add an event listener on the item :
                * - one click display details
                */
            protected _addEvent(): void;
            /** Set this item as active (background lighter) in the tree panel */
            active(b: boolean): void;
            getDiv(): HTMLDivElement;
    }
}

declare module 'babylonjs-inspector/treetools/AbstractTreeTool' {
    export abstract class AbstractTreeTool {
            protected _elem: HTMLElement;
            /** Is the tool enabled ? */
            protected _on: boolean;
            constructor();
            toHtml(): HTMLElement;
            protected _addEvents(): void;
            /**
                * Action launched when clicked on this element
                * Should be overrided
                */
            protected action(): void;
    }
}

declare module 'babylonjs-inspector/treetools/BoundingBox' {
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    /** Any object implementing this interface should
        * provide methods to toggle its bounding box
        */
    export interface IToolBoundingBox {
            isBoxVisible: () => boolean;
            setBoxVisible: (b: boolean) => void;
    }
    /**
        * Checkbox to display/hide the primitive
        */
    export class BoundingBox extends AbstractTreeTool {
            constructor(obj: IToolBoundingBox);
            protected action(): void;
    }
}

declare module 'babylonjs-inspector/treetools/CameraPOV' {
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    export interface ICameraPOV {
        setPOV: () => void;
        getCurrentActiveCamera: () => string;
        id: () => string;
    }
    /**
      *
      */
    export class CameraPOV extends AbstractTreeTool {
        constructor(camera: ICameraPOV);
        protected action(): void;
    }
}

declare module 'babylonjs-inspector/treetools/Checkbox' {
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    /** Any object implementing this interface should
        * provide methods to toggle its visibility
        */
    export interface IToolVisible {
            isVisible: () => boolean;
            setVisible: (b: boolean) => void;
    }
    /**
        * Checkbox to display/hide the primitive
        */
    export class Checkbox extends AbstractTreeTool {
            constructor(obj: IToolVisible);
            protected action(): void;
    }
}

declare module 'babylonjs-inspector/treetools/DebugArea' {
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    /** Any object implementing this interface should
      * provide methods to toggle a debug area
      */
    export interface IToolDebug {
        debug: (b: boolean) => void;
    }
    export class DebugArea extends AbstractTreeTool {
        constructor(obj: IToolDebug);
        protected action(): void;
    }
}

declare module 'babylonjs-inspector/treetools/Info' {
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    /** Any object implementing this interface should
        * provide methods to retrieve its info
        */
    export interface IToolInfo {
            getInfo: () => string;
    }
    /**
        * Checkbox to display/hide the primitive
        */
    export class Info extends AbstractTreeTool {
            constructor(obj: IToolInfo);
            protected action(): void;
    }
}

declare module 'babylonjs-inspector/treetools/SoundInteractions' {
    import { AbstractTreeTool } from "babylonjs-inspector/treetools/AbstractTreeTool";
    export interface ISoundInteractions {
        setPlaying: (callback: Function) => void;
    }
    /**
      *
      */
    export class SoundInteractions extends AbstractTreeTool {
        constructor(playSound: ISoundInteractions);
        protected action(): void;
    }
}


/*BabylonJS Inspector*/
// Dependencies for this module:
//   ../../../../Tools/Gulp/babylonjs
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
}
declare module INSPECTOR {
    export class Inspector {
            /** The HTML document relative to this inspector (the window or the popup depending on its mode) */
            static DOCUMENT: HTMLDocument;
            /** The HTML window. In popup mode, it's the popup itself. Otherwise, it's the current tab */
            static WINDOW: Window;
            onGUILoaded: BABYLON.Observable<any>;
            static GUIObject: any;
            /** The inspector is created with the given engine.
                * If the parameter 'popup' is false, the inspector is created as a right panel on the main window.
                * If the parameter 'popup' is true, the inspector is created in another popup.
                */
            constructor(scene: BABYLON.Scene, popup?: boolean, initialTab?: number | string, parentElement?: BABYLON.Nullable<HTMLElement>, newColors?: {
                    backgroundColor?: string;
                    backgroundColorLighter?: string;
                    backgroundColorLighter2?: string;
                    backgroundColorLighter3?: string;
                    color?: string;
                    colorTop?: string;
                    colorBot?: string;
            });
            readonly scene: BABYLON.Scene;
            readonly popupMode: boolean;
            /**
                * Filter the list of item present in the tree.
                * All item returned should have the given filter contained in the item id.
             */
            filterItem(filter: string): void;
            /** Display the mesh tab on the given object */
            displayObjectDetails(mesh: BABYLON.AbstractMesh): void;
            /** Clean the whole tree of item and rebuilds it */
            refresh(): void;
            /** Remove the inspector panel when it's built as a right panel:
                * remove the right panel and remove the wrapper
                */
            dispose(): void;
            /** Open the inspector in a new popup
                * Set 'firstTime' to true if there is no inspector created beforehands
                */
            openPopup(firstTime?: boolean): void;
            getActiveTabIndex(): number;
    }
}
declare module INSPECTOR {
    export const PROPERTIES: {
        /** Format the given object :
          * If a format function exists, returns the result of this function.
          * If this function doesn't exists, return the object type instead
          */
        format: (obj: any) => any;
        'type_not_defined': {
            properties: any[];
            format: () => string;
        };
        'Vector2': {
            type: typeof BABYLON.Vector2;
            format: (vec: BABYLON.Vector2) => string;
        };
        'Vector3': {
            type: typeof BABYLON.Vector3;
            format: (vec: BABYLON.Vector3) => string;
        };
        'Color3': {
            type: typeof BABYLON.Color3;
            format: (color: BABYLON.Color3) => string;
            slider: {
                r: {
                    min: number;
                    max: number;
                    step: number;
                };
                g: {
                    min: number;
                    max: number;
                    step: number;
                };
                b: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'Color4': {
            type: typeof BABYLON.Color4;
            format: (color: BABYLON.Color4) => string;
            slider: {
                r: {
                    min: number;
                    max: number;
                    step: number;
                };
                g: {
                    min: number;
                    max: number;
                    step: number;
                };
                b: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'Quaternion': {
            type: typeof BABYLON.Quaternion;
        };
        'Size': {
            type: typeof BABYLON.Size;
            format: (size: BABYLON.Size) => string;
        };
        'Texture': {
            type: typeof BABYLON.Texture;
            format: (tex: BABYLON.Texture) => string;
        };
        'RenderTargetTexture': {
            type: typeof BABYLON.RenderTargetTexture;
        };
        'DynamicTexture': {
            type: typeof BABYLON.DynamicTexture;
        };
        'BaseTexture': {
            type: typeof BABYLON.BaseTexture;
        };
        'CubeTexture': {
            type: typeof BABYLON.CubeTexture;
        };
        'HDRCubeTexture': {
            type: typeof BABYLON.HDRCubeTexture;
        };
        'Sound': {
            type: typeof BABYLON.Sound;
        };
        'ArcRotateCamera': {
            type: typeof BABYLON.ArcRotateCamera;
            slider: {
                alpha: {
                    min: number;
                    max: number;
                    step: number;
                };
                beta: {
                    min: number;
                    max: number;
                    step: number;
                };
                fov: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'FreeCamera': {
            type: typeof BABYLON.FreeCamera;
            slider: {
                fov: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'Scene': {
            type: typeof BABYLON.Scene;
        };
        'TransformNode': {
            type: typeof BABYLON.TransformNode;
            format: (m: BABYLON.TransformNode) => string;
        };
        'AbstractMesh': {
            type: typeof BABYLON.AbstractMesh;
            format: (m: BABYLON.AbstractMesh) => string;
        };
        'Mesh': {
            type: typeof BABYLON.Mesh;
            format: (m: BABYLON.Mesh) => string;
            slider: {
                visibility: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'StandardMaterial': {
            type: typeof BABYLON.StandardMaterial;
            format: (mat: BABYLON.StandardMaterial) => string;
            slider: {
                alpha: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'PBRMaterial': {
            type: typeof BABYLON.PBRMaterial;
            slider: {
                alpha: {
                    min: number;
                    max: number;
                    step: number;
                };
            };
        };
        'PhysicsImpostor': {
            type: typeof BABYLON.PhysicsImpostor;
        };
        'ImageProcessingConfiguration': {
            type: typeof BABYLON.ImageProcessingConfiguration;
        };
        'ColorCurves': {
            type: typeof BABYLON.ColorCurves;
        };
    };
}
declare module INSPECTOR {
    export type GUITyping = any;
    export let guiLoaded: boolean;
    /**
       * Function that add gui objects properties to the variable PROPERTIES
       */
    export function loadGUIProperties(GUI: GUITyping): void;
}
declare module INSPECTOR {
    export abstract class Adapter {
            protected _obj: any;
            constructor(obj: any);
            /** Returns the name displayed in the tree */
            abstract id(): string;
            /** Returns the type of this object - displayed in the tree */
            abstract type(): string;
            /** Returns the list of properties to be displayed for this adapter */
            abstract getProperties(): Array<PropertyLine>;
            /** Returns true if the given object correspond to this  */
            correspondsTo(obj: any): boolean;
            /** Returns the adapter unique name */
            readonly name: string;
            /**
                * Returns the actual object used for this adapter
                */
            readonly object: any;
            /** Returns the list of tools available for this adapter */
            abstract getTools(): Array<AbstractTreeTool>;
    }
}
declare module INSPECTOR {
    export class CameraAdapter extends Adapter implements ICameraPOV {
        constructor(obj: BABYLON.Camera);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setPOV(): void;
        getCurrentActiveCamera(): string;
    }
}
declare module INSPECTOR {
    export class GUIAdapter extends Adapter implements IToolVisible {
        constructor(obj: any);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
    }
}
declare module INSPECTOR {
    export class LightAdapter extends Adapter implements IToolVisible {
        constructor(obj: BABYLON.Light);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
    }
}
declare module INSPECTOR {
    export class MaterialAdapter extends Adapter {
        constructor(obj: BABYLON.Material);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        /** No tools for a material adapter */
        getTools(): Array<AbstractTreeTool>;
    }
}
declare module INSPECTOR {
    export class MeshAdapter extends Adapter implements IToolVisible, IToolDebug, IToolBoundingBox, IToolInfo {
            constructor(mesh: BABYLON.Node);
            /** Returns the name displayed in the tree */
            id(): string;
            /** Returns the type of this object - displayed in the tree */
            type(): string;
            /** Returns the list of properties to be displayed for this adapter */
            getProperties(): Array<PropertyLine>;
            getTools(): Array<AbstractTreeTool>;
            setVisible(b: boolean): void;
            isVisible(): boolean;
            isBoxVisible(): boolean;
            setBoxVisible(b: boolean): boolean;
            debug(enable: boolean): void;
            /** Returns some information about this mesh */
            getInfo(): string;
    }
}
declare module INSPECTOR {
    export class PhysicsImpostorAdapter extends Adapter implements IToolVisible {
        constructor(obj: BABYLON.PhysicsImpostor, viewer: any);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setVisible(b: boolean): void;
        isVisible(): boolean;
    }
}
declare module INSPECTOR {
    export class SoundAdapter extends Adapter implements ISoundInteractions {
        constructor(obj: BABYLON.Sound);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
        setPlaying(callback: Function): void;
    }
}
declare module INSPECTOR {
    export class TextureAdapter extends Adapter {
        constructor(obj: BABYLON.BaseTexture);
        /** Returns the name displayed in the tree */
        id(): string;
        /** Returns the type of this object - displayed in the tree */
        type(): string;
        /** Returns the list of properties to be displayed for this adapter */
        getProperties(): Array<PropertyLine>;
        getTools(): Array<AbstractTreeTool>;
    }
}
declare module INSPECTOR {
    export interface SortDirection {
            [property: string]: number;
    }
    export class DetailPanel extends BasicElement {
            constructor(dr?: Array<PropertyLine>);
            details: Array<PropertyLine>;
            protected _build(): void;
            /** Updates the HTML of the detail panel */
            update(_items?: Array<PropertyLine>): void;
            /** Search an element by name  */
            searchByName(searchName: string): void;
            /**
                * Removes all data in the detail panel but keep the header row
                */
            clean(): void;
            /**
                * Clean the rows only
                */
            cleanRow(): void;
            /** Overrides basicelement.dispose */
            dispose(): void;
    }
}
declare module INSPECTOR {
    /**
      * A property is a link between a data (string) and an object.
      */
    export class Property {
        constructor(prop: string, obj: any, parentObj?: any);
        readonly name: string;
        value: any;
        readonly type: string;
        obj: any;
    }
}
declare module INSPECTOR {
    export class PropertyFormatter {
            /**
                * Format the value of the given property of the given object.
                */
            static format(obj: any, prop: string): string;
    }
    /**
        * A property line represents a line in the detail panel. This line is composed of :
        * - a name (the property name)
        * - a value if this property is of a type 'simple' : string, number, boolean, color, texture
        * - the type of the value if this property is of a complex type (Vector2, BABYLON.Size, ...)
        * - a ID if defined (otherwise an empty string is displayed)
        * The original object is sent to the value object who will update it at will.
        *
        * A property line can contain OTHER property line objects in the case of a complex type.
        * If this instance has no link to other instances, its type is ALWAYS a simple one (see above).
        *
        */
    export class PropertyLine {
            constructor(prop: Property, parent?: BABYLON.Nullable<PropertyLine>, level?: number);
            validateInput(value: any, forceupdate?: boolean): void;
            /** Retrieve the correct object from its parent.
                * If no parent exists, returns the property value.
                * This method is used at each update in case the property object is removed from the original object
                * (example : mesh.position = new BABYLON.Vector3 ; the original vector3 object is deleted from the mesh).
             */
            updateObject(): any;
            readonly name: string;
            readonly value: any;
            readonly type: string;
            /** Delete properly this property line.
                * Removes itself from the scheduler.
                * Dispose all viewer element (color, texture...)
                */
            dispose(): void;
            /**
                * Update the property division with the new property value.
                * If this property is complex, update its child, otherwise update its text content
                */
            update(): void;
            toHtml(): HTMLElement;
            closeDetails(): void;
    }
}
declare module INSPECTOR {
    /**
        * Represents a html div element.
        * The div is built when an instance of BasicElement is created.
        */
    export abstract class BasicElement {
            protected _div: HTMLDivElement;
            constructor();
            /**
                * Returns the div element
                */
            toHtml(): HTMLDivElement;
            /**
                * Build the html element
                */
            protected _build(): void;
            abstract update(data?: any): void;
            /** Default dispose method if needed */
            dispose(): void;
    }
}
declare module INSPECTOR {
    /**
     * Display a very small div corresponding to the given color
     */
    export class ColorElement extends BasicElement {
        constructor(color: BABYLON.Color4 | BABYLON.Color3);
        update(color?: BABYLON.Color4 | BABYLON.Color3): void;
    }
}
declare module INSPECTOR {
    /**
      * Represents a html div element.
      * The div is built when an instance of BasicElement is created.
      */
    export class ColorPickerElement extends BasicElement {
        protected _input: HTMLInputElement;
        constructor(color: BABYLON.Color4 | BABYLON.Color3, propertyLine: PropertyLine);
        update(color?: BABYLON.Color4 | BABYLON.Color3): void;
    }
}
declare module INSPECTOR {
    /**
     * Display a very small div. A new canvas is created, with a new js scene, containing only the
     * cube texture in a cube
     */
    export class CubeTextureElement extends BasicElement {
        protected _scene: BABYLON.Scene;
        protected _cube: BABYLON.Mesh;
        protected _textureUrl: string;
        /** The texture given as a parameter should be cube. */
        constructor(tex: BABYLON.Texture);
        update(tex?: BABYLON.Texture): void;
        /** Creates the box  */
        protected _populateScene(): void;
        /** Removes properly the babylon engine */
        dispose(): void;
    }
}
declare module INSPECTOR {
    /**
     * Display a very small div. A new canvas is created, with a new js scene, containing only the
     * cube texture in a cube
     */
    export class HDRCubeTextureElement extends CubeTextureElement {
        /** The texture given as a parameter should be cube. */
        constructor(tex: BABYLON.Texture);
        /** Creates the box  */
        protected _populateScene(): void;
    }
}
declare module INSPECTOR {
    /**
      * A search bar can be used to filter elements in the tree panel.
      * At each keypress on the input, the treepanel will be filtered.
      */
    export class SearchBar extends BasicElement {
        constructor(tab: PropertyTab);
        /** Delete all characters typped in the input element */
        reset(): void;
        update(): void;
    }
    export class SearchBarDetails extends BasicElement {
        constructor(tab: DetailPanel);
        /** Delete all characters typped in the input element */
        reset(): void;
        update(): void;
    }
}
declare module INSPECTOR {
    /**
     * Display a very small div corresponding to the given texture. On mouse over, display the full image
     */
    export class TextureElement extends BasicElement {
        constructor(tex: BABYLON.Texture);
        update(tex?: BABYLON.Texture): void;
    }
}
declare module INSPECTOR {
    /**
      * Creates a tooltip for the parent of the given html element
      */
    export class Tooltip {
        constructor(elem: HTMLElement, tip: string, attachTo?: BABYLON.Nullable<HTMLElement>);
    }
}
declare module INSPECTOR {
    export class Helpers {
            /**
                * Returns the type of the given object. First
                * uses getClassName. If nothing is returned, used the type of the constructor
                */
            static GET_TYPE(obj: any): string;
            /**
                * Returns true if the user browser is edge.
                */
            static IsBrowserEdge(): boolean;
            /**
                * Returns true if the user browser is IE.
                */
            static IsBrowserIE(): boolean;
            /** Send the event which name is given in parameter to the window */
            static SEND_EVENT(eventName: string): void;
            /** Returns the given number with 2 decimal number max if a decimal part exists */
            static Trunc(nb: number): number;
            /**
                * Useful function used to create a div
                */
            static CreateDiv(className?: BABYLON.Nullable<string>, parent?: HTMLElement, tooltip?: string): HTMLDivElement;
            /**
                * Useful function used to create a input
                */
            static CreateInput(className?: string, parent?: HTMLElement, tooltip?: string): HTMLInputElement;
            static CreateElement(element: string, className?: BABYLON.Nullable<string>, parent?: HTMLElement, tooltip?: string): HTMLElement;
            /**
                * Removes all children of the given div.
                */
            static CleanDiv(div: HTMLElement): void;
            /**
                * Returns the true value of the given CSS Attribute from the given element (in percentage or in pixel, as it was specified in the css)
                */
            static Css(elem: HTMLElement, cssAttribute: string): string;
            static LoadScript(): void;
            static IsSystemName(name: string): boolean;
            /**
                * Return an array of PropertyLine for an obj
                * @param obj
                */
            static GetAllLinesProperties(obj: any): Array<PropertyLine>;
            /**
                * Returns an array of string corresponding to tjhe list of properties of the object to be displayed
                * @param obj
                */
            static GetAllLinesPropertiesAsString(obj: any, dontTakeThis?: Array<string>): Array<string>;
            static Capitalize(str: string): string;
    }
}
declare module INSPECTOR {
    export class Scheduler {
        /** Is this scheduler in pause ? */
        pause: boolean;
        /** All properties are refreshed every 250ms */
        static REFRESH_TIME: number;
        constructor();
        static getInstance(): Scheduler;
        /** Add a property line to be updated every X ms */
        add(prop: PropertyLine): void;
        /** Removes the given property from the list of properties to update */
        remove(prop: PropertyLine): void;
        dispose(): void;
    }
}
declare module INSPECTOR {
    export class CameraTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    /**
      * The console tab will have two features :
      * - hook all console.log call and display them in this panel (and in the browser console as well)
      * - display all Babylon logs (called with Tools.Log...)
      */
    export class ConsoleTab extends Tab {
        constructor(tabbar: TabBar, insp: Inspector);
        /** Overrides super.dispose */
        dispose(): void;
        active(b: boolean): void;
    }
}
declare module INSPECTOR {
    export class GLTFTab extends Tab {
        static readonly IsSupported: boolean;
        /** @hidden */
        static _Initialize(): void;
        constructor(tabbar: TabBar, inspector: Inspector);
        dispose(): void;
        /** @hidden */
        static _GetLoaderDefaultsAsync(): Promise<any>;
    }
}
declare module INSPECTOR {
    export class GUITab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    export class LightTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    export class MaterialTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    export class MeshTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    export class PhysicsTab extends PropertyTab {
        viewer: any;
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    /**
      * A Property tab can creates two panels:
      * a tree panel and a detail panel,
      * in which properties will be displayed.
      * Both panels are separated by a resize bar
      */
    export abstract class PropertyTab extends Tab {
        protected _inspector: Inspector;
        /** The panel containing a list of items */
        protected _treePanel: HTMLDivElement;
        /** The panel containing a list if properties corresponding to an item */
        protected _detailsPanel: DetailPanel;
        protected _treeItems: Array<TreeItem>;
        protected _searchBar: SearchBar;
        constructor(tabbar: TabBar, name: string, insp: Inspector);
        /** Overrides dispose */
        dispose(): void;
        update(_items?: Array<TreeItem>): void;
        /** Display the details of the given item */
        displayDetails(item: TreeItem): void;
        /** Select an item in the tree */
        select(item: TreeItem): void;
        /** Set the given item as active in the tree */
        activateNode(item: TreeItem): void;
        /** Returns the treeitem corersponding to the given obj, null if not found */
        getItemFor(_obj: any): BABYLON.Nullable<TreeItem>;
        filter(filter: string): void;
        /** Builds the tree panel */
        protected abstract _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    export class SceneTab extends Tab {
            constructor(tabbar: TabBar, insp: Inspector);
            /** Overrides super.dispose */
            dispose(): void;
    }
}
declare module INSPECTOR {
    export class SoundTab extends PropertyTab {
        constructor(tabbar: TabBar, inspector: Inspector);
        protected _getTree(): Array<TreeItem>;
    }
}
declare module INSPECTOR {
    export class StatsTab extends Tab {
        constructor(tabbar: TabBar, insp: Inspector);
        dispose(): void;
        active(b: boolean): void;
    }
}
declare module INSPECTOR {
    export abstract class Tab extends BasicElement {
            protected _tabbar: TabBar;
            name: string;
            protected _isActive: boolean;
            protected _panel: HTMLDivElement;
            constructor(tabbar: TabBar, name: string);
            /** True if the tab is active, false otherwise */
            isActive(): boolean;
            protected _build(): void;
            /** Set this tab as active or not, depending on the current state */
            active(b: boolean): void;
            update(): void;
            /** Creates the tab panel for this tab. */
            getPanel(): HTMLElement;
            /** Add this in the propertytab with the searchbar */
            filter(str: string): void;
            /** Dispose properly this tab */
            abstract dispose(): void;
            /** Select an item in the tree */
            select(item: TreeItem): void;
            /**
                * Returns the total width in pixel of this tab, 0 by default
             */
            getPixelWidth(): number;
    }
}
declare module INSPECTOR {
    /**
        * A tab bar will contains each view the inspector can have : Canvas2D, Meshes...
        * The default active tab is the first one of the list.
        */
    export class TabBar extends BasicElement {
            constructor(inspector: Inspector, initialTab?: number | string);
            update(): void;
            protected _build(): void;
            /** Dispose the current tab, set the given tab as active, and refresh the treeview */
            switchTab(tab: Tab): void;
            /** Display the mesh tab.
                * If a parameter is given, the given mesh details are displayed
                */
            switchMeshTab(mesh?: BABYLON.AbstractMesh): void;
            /** Returns the active tab */
            getActiveTab(): BABYLON.Nullable<Tab>;
            getActiveTabIndex(): number;
            getTabIndex(name: string): number;
            readonly inspector: Inspector;
            /**
                * Returns the total width in pixel of the tabbar,
                * that corresponds to the sum of the width of each visible tab + toolbar width
             */
            getPixelWidth(): number;
            /** Display the remaining icon or not depending on the tabbar width.
                * This function should be called each time the inspector width is updated
                */
            updateWidth(): void;
    }
}
declare module INSPECTOR {
    export class TextureTab extends Tab {
        static DDSPreview: DDSPreview;
        /** The panel containing a list of items */
        protected _treePanel: HTMLElement;
        protected _treeItems: Array<TreeItem>;
        constructor(tabbar: TabBar, inspector: Inspector);
        dispose(): void;
        update(_items?: Array<TreeItem>): void;
        /** Display the details of the given item */
        displayDetails(item: TreeItem): void;
        /** Select an item in the tree */
        select(item: TreeItem): void;
        /** Set the given item as active in the tree */
        activateNode(item: TreeItem): void;
    }
    class DDSPreview {
        canvas: HTMLCanvasElement | null;
        constructor(AdapterItem: TextureAdapter);
        insertPreview(AdapterItem: TextureAdapter): void;
        dispose(): void;
    }
}
declare module INSPECTOR {
    export class ToolsTab extends Tab {
        constructor(tabbar: TabBar, insp: Inspector);
        dispose(): void;
    }
}
declare module INSPECTOR {
    export abstract class AbstractTool {
            protected _inspector: Inspector;
            constructor(iconSet: string, icon: string, parent: HTMLElement, inspector: Inspector, tooltip: string);
            toHtml(): HTMLElement;
            /**
                * Returns the total width in pixel of this tool, 0 by default
             */
            getPixelWidth(): number;
            /**
                * Updates the icon of this tool with the given string
                */
            protected _updateIcon(icon: string): void;
            abstract action(): void;
    }
}
declare module INSPECTOR {
    /**
      * Removes the inspector panel
      */
    export class DisposeTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
declare module INSPECTOR {
    export class FullscreenTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
declare module INSPECTOR {
    export class LabelTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        dispose(): void;
        action(): void;
    }
}
declare module INSPECTOR {
    export class PauseScheduleTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
declare module INSPECTOR {
    export class PickTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
declare module INSPECTOR {
    export class PopupTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
declare module INSPECTOR {
    export class RefreshTool extends AbstractTool {
        constructor(parent: HTMLElement, inspector: Inspector);
        action(): void;
    }
}
declare module INSPECTOR {
    export class Toolbar extends BasicElement {
        constructor(inspector: Inspector);
        update(): void;
        protected _build(): void;
        /**
          * Returns the total width in pixel of the tabbar,
          * that corresponds to the sum of the width of each tab + toolbar width
         */
        getPixelWidth(): number;
    }
}
declare module INSPECTOR {
    export class TreeItem extends BasicElement {
            children: Array<TreeItem>;
            constructor(tab: Tab, obj: Adapter);
            /** Returns the item ID == its adapter ID */
            readonly id: string;
            /** Add the given item as a child of this one */
            add(child: TreeItem): void;
            /**
                * Returns the original adapter
                */
            readonly adapter: Adapter;
            /**
                * Function used to compare this item to another tree item.
                * Returns the alphabetical sort of the adapter ID
                */
            compareTo(item: TreeItem): number;
            /** Returns true if the given obj correspond to the adapter linked to this tree item */
            correspondsTo(obj: any): boolean;
            /** hide all children of this item */
            fold(): void;
            /** Show all children of this item */
            unfold(): void;
            /** Build the HTML of this item */
            protected _build(): void;
            /**
                * Returns one HTML element (.details) containing all  details of this primitive
                */
            getDetails(): Array<PropertyLine>;
            update(): void;
            /**
                * Add an event listener on the item :
                * - one click display details
                */
            protected _addEvent(): void;
            /** Set this item as active (background lighter) in the tree panel */
            active(b: boolean): void;
            getDiv(): HTMLDivElement;
    }
}
declare module INSPECTOR {
    export abstract class AbstractTreeTool {
            protected _elem: HTMLElement;
            /** Is the tool enabled ? */
            protected _on: boolean;
            constructor();
            toHtml(): HTMLElement;
            protected _addEvents(): void;
            /**
                * Action launched when clicked on this element
                * Should be overrided
                */
            protected action(): void;
    }
}
declare module INSPECTOR {
    /** Any object implementing this interface should
        * provide methods to toggle its bounding box
        */
    export interface IToolBoundingBox {
            isBoxVisible: () => boolean;
            setBoxVisible: (b: boolean) => void;
    }
    /**
        * Checkbox to display/hide the primitive
        */
    export class BoundingBox extends AbstractTreeTool {
            constructor(obj: IToolBoundingBox);
            protected action(): void;
    }
}
declare module INSPECTOR {
    export interface ICameraPOV {
        setPOV: () => void;
        getCurrentActiveCamera: () => string;
        id: () => string;
    }
    /**
      *
      */
    export class CameraPOV extends AbstractTreeTool {
        constructor(camera: ICameraPOV);
        protected action(): void;
    }
}
declare module INSPECTOR {
    /** Any object implementing this interface should
        * provide methods to toggle its visibility
        */
    export interface IToolVisible {
            isVisible: () => boolean;
            setVisible: (b: boolean) => void;
    }
    /**
        * Checkbox to display/hide the primitive
        */
    export class Checkbox extends AbstractTreeTool {
            constructor(obj: IToolVisible);
            protected action(): void;
    }
}
declare module INSPECTOR {
    /** Any object implementing this interface should
      * provide methods to toggle a debug area
      */
    export interface IToolDebug {
        debug: (b: boolean) => void;
    }
    export class DebugArea extends AbstractTreeTool {
        constructor(obj: IToolDebug);
        protected action(): void;
    }
}
declare module INSPECTOR {
    /** Any object implementing this interface should
        * provide methods to retrieve its info
        */
    export interface IToolInfo {
            getInfo: () => string;
    }
    /**
        * Checkbox to display/hide the primitive
        */
    export class Info extends AbstractTreeTool {
            constructor(obj: IToolInfo);
            protected action(): void;
    }
}
declare module INSPECTOR {
    export interface ISoundInteractions {
        setPlaying: (callback: Function) => void;
    }
    /**
      *
      */
    export class SoundInteractions extends AbstractTreeTool {
        constructor(playSound: ISoundInteractions);
        protected action(): void;
    }
}