import type { Nullable } from "../types";
import type { Scene } from "../scene";

/**
 * Enum defining the type of properties that can be edited in the property pages in the node editor
 */
export const enum PropertyTypeForEdition {
    /** property is a boolean */
    Boolean,
    /** property is a float */
    Float,
    /** property is a int */
    Int,
    /** property is a Vector2 */
    Vector2,
    /** property is a Vector3 */
    Vector3,
    /** property is a list of values */
    List,
    /** property is a Color3 */
    Color3,
    /** property is a Color4 */
    Color4,
    /** property (int) should be edited as a combo box with a list of sampling modes */
    SamplingMode,
    /** property (int) should be edited as a combo box with a list of texture formats */
    TextureFormat,
    /** property (int) should be edited as a combo box with a list of texture types */
    TextureType,
    /** property is a string */
    String,
    /** property is a matrix */
    Matrix,
    /** property is a viewport */
    Viewport,
}

/**
 * Interface that defines an option in a variable of type list
 */
export interface IEditablePropertyListOption {
    /** label of the option */
    label: string;
    /** value of the option */
    value: number;
}

/**
 * Interface that defines the options available for an editable property
 */
export interface IEditablePropertyOption {
    /**
     * Define if the property is displayed inside the source block or in a separate property tab
     */
    embedded?: boolean;
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
        callback?: (scene: Nullable<Scene>, block: any) => boolean | undefined | void;
        /** a callback to validate the property. Returns true if the property is ok, else false. If false, the rebuild/update/callback events won't be called */
        onValidation?: (block: any, propertyName: string) => boolean;
    };
    /** list of the options for a variable of type list */
    options?: IEditablePropertyListOption[];
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

/**
 * Decorator that flags a property in a node block as being editable
 * @param displayName the display name of the property
 * @param propertyType the type of the property
 * @param groupName the group name of the property
 * @param options the options of the property
 * @returns the decorator
 */
// eslint-disable-next-line @typescript-eslint/naming-convention
export function editableInPropertyPage(
    displayName: string,
    propertyType: PropertyTypeForEdition = PropertyTypeForEdition.Boolean,
    groupName: string = "PROPERTIES",
    options?: IEditablePropertyOption
) {
    return (_value: unknown, context: { name: string | symbol; metadata: DecoratorMetadataObject }) => {
        const meta = context.metadata;
        let propStore: IPropertyDescriptionForEdition[];
        if (Object.hasOwn(meta, __bjsPropStoreKey)) {
            propStore = meta[__bjsPropStoreKey] as IPropertyDescriptionForEdition[];
        } else {
            propStore = [];
            meta[__bjsPropStoreKey] = propStore;
        }
        propStore.push({
            propertyName: String(context.name),
            displayName: displayName,
            type: propertyType,
            groupName: groupName,
            options: options ?? {},
            className: "",
        });
    };
}

/** @internal */
export const __bjsPropStoreKey = "__bjs_prop_store__";

/**
 * Gets the editable properties for a given target using TC39 decorator metadata.
 * Walks the metadata prototype chain to include properties from parent classes.
 * @param target - the target object (instance or constructor)
 * @returns array of property descriptions
 */
export function getEditableProperties(target: any): IPropertyDescriptionForEdition[] {
    const ctor = typeof target === "function" ? target : target?.constructor;
    const metadata: DecoratorMetadataObject | undefined = ctor?.[Symbol.metadata];
    if (!metadata) {
        return [];
    }

    const result: IPropertyDescriptionForEdition[] = [];
    let currentMeta: any = metadata;
    while (currentMeta) {
        if (Object.hasOwn(currentMeta, __bjsPropStoreKey)) {
            const store = currentMeta[__bjsPropStoreKey] as IPropertyDescriptionForEdition[];
            result.push(...store);
        }
        currentMeta = Object.getPrototypeOf(currentMeta);
    }
    return result;
}
