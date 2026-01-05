import { Logger } from "./logger";

const CloneValue = (source: any, destinationObject: any, shallowCopyValues: boolean) => {
    if (!source) {
        return null;
    }

    if (source.getClassName && source.getClassName() === "Mesh") {
        return null;
    }

    if (source.getClassName && (source.getClassName() === "SubMesh" || source.getClassName() === "PhysicsBody")) {
        return source.clone(destinationObject);
    } else if (source.clone) {
        return source.clone();
    } else if (Array.isArray(source)) {
        return source.slice();
    } else if (shallowCopyValues && typeof source === "object") {
        return { ...source };
    }
    return null;
};

function GetAllPropertyNames(obj: any): string[] {
    const props: string[] = [];

    do {
        const propNames = Object.getOwnPropertyNames(obj);
        for (const prop of propNames) {
            if (props.indexOf(prop) === -1) {
                props.push(prop);
            }
        }
    } while ((obj = Object.getPrototypeOf(obj)));

    return props;
}

/**
 * Class containing a set of static utilities functions for deep copy.
 */
export class DeepCopier {
    /**
     * Tries to copy an object by duplicating every property
     * @param source defines the source object
     * @param destination defines the target object
     * @param doNotCopyList defines a list of properties to avoid
     * @param mustCopyList defines a list of properties to copy (even if they start with _)
     * @param shallowCopyValues defines wether properties referencing objects (none cloneable) must be shallow copied (false by default)
     * @remarks shallowCopyValues will not instantite the copied values which makes it only usable for "JSON objects"
     */
    public static DeepCopy(source: any, destination: any, doNotCopyList?: string[], mustCopyList?: string[], shallowCopyValues = false): void {
        const properties = GetAllPropertyNames(source);
        for (const prop of properties) {
            if (prop[0] === "_" && (!mustCopyList || mustCopyList.indexOf(prop) === -1)) {
                continue;
            }

            if (prop.endsWith("Observable")) {
                continue;
            }

            if (doNotCopyList && doNotCopyList.indexOf(prop) !== -1) {
                continue;
            }

            const sourceValue = source[prop];
            const typeOfSourceValue = typeof sourceValue;

            if (typeOfSourceValue === "function") {
                continue;
            }

            try {
                if (typeOfSourceValue === "object") {
                    if (sourceValue instanceof Uint8Array) {
                        destination[prop] = Uint8Array.from(sourceValue);
                    } else if (sourceValue instanceof Array) {
                        destination[prop] = [];

                        if (sourceValue.length > 0) {
                            if (typeof sourceValue[0] == "object") {
                                for (let index = 0; index < sourceValue.length; index++) {
                                    const clonedValue = CloneValue(sourceValue[index], destination, shallowCopyValues);

                                    if (destination[prop].indexOf(clonedValue) === -1) {
                                        // Test if auto inject was not done
                                        destination[prop].push(clonedValue);
                                    }
                                }
                            } else {
                                destination[prop] = sourceValue.slice(0);
                            }
                        }
                    } else {
                        destination[prop] = CloneValue(sourceValue, destination, shallowCopyValues);
                    }
                } else {
                    destination[prop] = sourceValue;
                }
            } catch (e) {
                // Log a warning (it could be because of a read-only property)
                Logger.Warn(e.message);
            }
        }
    }
}
