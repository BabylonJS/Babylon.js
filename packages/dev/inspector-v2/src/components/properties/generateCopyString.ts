import { getClassNameWithNamespace } from "shared-ui-components/copyCommandToClipboard";

/**
 * Generates a string representation of a value for clipboard copy.
 * Handles primitives, vectors, colors, quaternions, and other Babylon.js types.
 * @param value - The value to convert to a string
 * @returns A string that can be used to recreate the value
 */
export function GenerateCopyString(value: unknown): string {
    if (value === null) {
        return "null";
    }
    if (value === undefined) {
        return "undefined";
    }

    // Primitives
    if (typeof value === "string") {
        return `"${value}"`;
    }
    if (typeof value === "number" || typeof value === "boolean") {
        return String(value);
    }

    // Objects with getClassName (Babylon types like Vector3, Color3, Quaternion, etc.)
    if (typeof value === "object" && value !== null) {
        const obj = value as Record<string, unknown>;

        // Check for Babylon.js types with getClassName
        if (typeof obj.getClassName === "function") {
            const className = obj.getClassName() as string;
            const { babylonNamespace } = getClassNameWithNamespace(value);

            // Vector2, Vector3, Vector4
            if (className === "Vector2") {
                return `new ${babylonNamespace}Vector2(${obj.x}, ${obj.y})`;
            }
            if (className === "Vector3") {
                return `new ${babylonNamespace}Vector3(${obj.x}, ${obj.y}, ${obj.z})`;
            }
            if (className === "Vector4") {
                return `new ${babylonNamespace}Vector4(${obj.x}, ${obj.y}, ${obj.z}, ${obj.w})`;
            }

            // Quaternion
            if (className === "Quaternion") {
                return `new ${babylonNamespace}Quaternion(${obj.x}, ${obj.y}, ${obj.z}, ${obj.w})`;
            }

            // Color3, Color4
            if (className === "Color3") {
                const hexString = ColorToHex(obj.r as number, obj.g as number, obj.b as number, 1);
                return `new ${babylonNamespace}Color3(${obj.r}, ${obj.g}, ${obj.b}) // (HEX: ${hexString})`;
            }
            if (className === "Color4") {
                const hexString = ColorToHex(obj.r as number, obj.g as number, obj.b as number, obj.a as number);
                return `new ${babylonNamespace}Color4(${obj.r}, ${obj.g}, ${obj.b}, ${obj.a}) // (HEX: ${hexString})`;
            }

            // Matrix - output as array
            if (className === "Matrix" && typeof obj.toArray === "function") {
                const arr = obj.toArray() as number[];
                return `${babylonNamespace}Matrix.FromArray([${arr.join(", ")}])`;
            }

            // For other Babylon types with a name property (like nodes, materials, etc.)
            if (typeof obj.name === "string") {
                return `"${obj.name}"`;
            }

            // Fallback: use className
            return `[${className}]`;
        }

        // Plain objects or arrays
        if (Array.isArray(value)) {
            return `[${value.map(GenerateCopyString).join(", ")}]`;
        }

        // Fallback for other objects
        return JSON.stringify(value);
    }

    return String(value);
}

/**
 * Converts linear color values (0-1) to a hex string with alpha.
 * @param r - Red component (0-1, linear)
 * @param g - Green component (0-1, linear)
 * @param b - Blue component (0-1, linear)
 * @param a - Alpha component (0-1)
 * @returns Hex string in format #RRGGBBAA
 */
function ColorToHex(r: number, g: number, b: number, a: number): string {
    // Convert linear to sRGB and then to 0-255 range
    const toSRGB = (c: number) => Math.round(Math.min(255, Math.max(0, Math.pow(c, 1 / 2.2) * 255)));
    const rHex = toSRGB(r).toString(16).padStart(2, "0").toUpperCase();
    const gHex = toSRGB(g).toString(16).padStart(2, "0").toUpperCase();
    const bHex = toSRGB(b).toString(16).padStart(2, "0").toUpperCase();
    const aHex = Math.round(Math.min(255, Math.max(0, a * 255)))
        .toString(16)
        .padStart(2, "0")
        .toUpperCase();
    return `#${rHex}${gHex}${bHex}${aHex}`;
}
