import { type Observable } from "core/Misc/observable.js";
import { MetadataSymbol } from "core/Misc/decorators.functions.js";

/**
 * Enum defining the type of properties that can be edited in the property pages in the node editor
 */
export enum PropertyTypeForEdition {
    /** property is a boolean */
    Boolean,
    /** property is a float */
    Float,
    /** property is a int */
    Int,
    /** property is a Vector2 */
    Vector2,
    /** property is a list of values */
    List,
}

/**
 * Interface that defines an option in a variable of type list
 */
export interface IEditablePropertyListOption {
    /** label of the option */
    label: string;
    /** value of the option */
    value: number | string;
}

/**
 * Interface that defines the options available for an editable property
 */
export interface IEditablePropertyOption {
    /** min value */
    min?: number;
    /** max value */
    max?: number;
    /** notifiers: indicates which actions to take when the property is changed */
    notifiers?: {
        /** the entity should be rebuilt */
        rebuild?: boolean;
        /** the preview should be updated */
        update?: boolean;
        /** the onPreviewCommandActivated observer of the preview manager should be triggered */
        activatePreviewCommand?: boolean;
        /** a callback to trigger */
        callback?: () => boolean | undefined | void;
        /** a callback to validate the property. Returns true if the property is ok, else false. If false, the rebuild/update/callback events won't be called */
        onValidation?: (block: any, propertyName: string) => boolean;
    };
    /** a list of the options for a property of type list */
    options?: IEditablePropertyListOption[] | Observable<IEditablePropertyListOption[]>;
    /** whether the options' values should be treated as strings */
    valuesAreStrings?: boolean;
    /** If supplied, the sub property to read/write */
    subPropertyName?: string;
    /**
     * If supplied, scope this to a specific block type - useful for the
     * CustomShaderBlock where multiple block types are implemented with the same class
     */
    blockType?: string;
}

/**
 * Interface that describes an editable property
 */
export interface IPropertyDescriptionForEdition {
    /** name of the property */
    propertyName: string;
    /** display name of the property */
    displayName: string;
    /** type of the property */
    type: PropertyTypeForEdition;
    /** group of the property - all properties with the same group value will be displayed in a specific section */
    groupName: string;
    /** options for the property */
    options: IEditablePropertyOption;
    /** name of the class that contains the property */
    className: string;
}

/** @internal */
// eslint-disable-next-line @typescript-eslint/naming-convention
const __bjsSmartFilterPropStoreKey = "__bjs_sf_prop_store__";

/**
 * Decorator that flags a property in a node block as being editable
 * @param displayName - the display name of the property
 * @param propertyType - the type of the property
 * @param groupName - the group name of the property
 * @param options - the options of the property
 * @returns the decorator
 */
export function EditableInPropertyPage(
    displayName: string,
    propertyType: PropertyTypeForEdition = PropertyTypeForEdition.Boolean,
    groupName: string = "PROPERTIES",
    options?: IEditablePropertyOption
) {
    return (_value: unknown, context: { name: string | symbol; metadata: DecoratorMetadataObject }) => {
        const meta = context.metadata as DecoratorMetadataObject | undefined;
        if (!meta) {
            // `context.metadata` is `void 0` when `Symbol.metadata` was not installed before this class
            // was evaluated. Importing `MetadataSymbol` from core runs the polyfill at module load (before
            // this class body), so this should never happen; referencing it here also keeps that
            // module-load polyfill anchored against bundler tree-shaking.
            throw new Error(
                `EditableInPropertyPage: decorator metadata is unavailable; the Symbol.metadata (${String(MetadataSymbol)}) polyfill must run before decorated classes are evaluated.`
            );
        }
        let propStore: IPropertyDescriptionForEdition[];
        if (Object.prototype.hasOwnProperty.call(meta, __bjsSmartFilterPropStoreKey)) {
            propStore = meta[__bjsSmartFilterPropStoreKey] as IPropertyDescriptionForEdition[];
        } else {
            propStore = [];
            meta[__bjsSmartFilterPropStoreKey] = propStore;
        }

        const propertyKey = String(context.name);

        const propToAdd: IPropertyDescriptionForEdition = {
            propertyName: propertyKey,
            displayName: displayName,
            type: propertyType,
            groupName: groupName,
            options: options ?? {},
            className: "",
        };

        // If the property already exists, overwrite it, otherwise add it
        // Note: It may have been redefined since the application started
        const existingIndex = propStore.findIndex((p) => p.propertyName === propertyKey && options?.blockType === p.options?.blockType);
        if (existingIndex !== -1) {
            propStore[existingIndex] = propToAdd;
        } else {
            propStore.push(propToAdd);
        }
    };
}

/**
 * Gets the editable properties for a given target using TC39 decorator metadata.
 * Walks the metadata prototype chain to include properties from parent classes.
 * @param target - the target object (instance or constructor)
 * @returns array of property descriptions
 */
export function GetSmartFilterEditableProperties(target: any): IPropertyDescriptionForEdition[] {
    const ctor = typeof target === "function" ? target : target?.constructor;
    const metadata: DecoratorMetadataObject | undefined = ctor?.[MetadataSymbol];
    if (!metadata) {
        return [];
    }

    const result: IPropertyDescriptionForEdition[] = [];
    let currentMeta: any = metadata;
    while (currentMeta) {
        if (Object.prototype.hasOwnProperty.call(currentMeta, __bjsSmartFilterPropStoreKey)) {
            const store = currentMeta[__bjsSmartFilterPropStoreKey] as IPropertyDescriptionForEdition[];
            result.push(...store);
        }
        currentMeta = Object.getPrototypeOf(currentMeta);
    }
    return result;
}
