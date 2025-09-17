/**
 * Encodes an object as a base64 string suitable for URL parameters
 * @param obj Object with string key-value pairs
 * @returns Base64 encoded string
 */
export function EncodeObjectToBase64(obj: Record<string, string>): string {
    const jsonString = JSON.stringify(obj);
    const base64String = btoa(jsonString);

    // Make it URL-safe by replacing characters that can cause issues in URLs
    return base64String
        .replace(/\+/g, "-") // Replace + with -
        .replace(/\//g, "_") // Replace / with _
        .replace(/=/g, ""); // Remove padding =
}

/**
 * Decodes a base64 string into an object
 * @param base64String Base64 encoded string
 * @returns Decoded object
 */
export function DecodeBase64ToObject(base64String: string): Record<string, string> {
    // Restore URL-safe characters back to standard base64
    let standardBase64 = base64String
        .replace(/-/g, "+") // Replace - with +
        .replace(/_/g, "/"); // Replace _ with /

    // Add padding if needed
    while (standardBase64.length % 4) {
        standardBase64 += "=";
    }

    const jsonString = atob(standardBase64);
    return JSON.parse(jsonString);
}
