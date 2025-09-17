/**
 * Encodes an object to a string suitable for a QSP parameter
 * @param obj Object with string key-value pairs
 * @returns The encoded string that can be used as a QSP parameter
 */
export function EncodeObjectToQspString(obj: Record<string, string>): string {
    const jsonString = JSON.stringify(obj);
    const base64String = btoa(jsonString);

    // Make it URL-safe by replacing characters that can cause issues in URLs
    return base64String
        .replace(/\+/g, "-") // Replace + with -
        .replace(/\//g, "_") // Replace / with _
        .replace(/=/g, ""); // Remove padding =
}

/**
 * Decodes a QSP string encoded with EncodeObjectToQspString back to an object
 * @param qspString The encoded string
 * @returns Decoded object
 */
export function DecodeQspStringToObject(qspString: string): Record<string, string> {
    // Restore URL-safe characters back to standard base64
    let standardBase64 = qspString
        .replace(/-/g, "+") // Replace - with +
        .replace(/_/g, "/"); // Replace _ with /

    // Add padding if needed
    while (standardBase64.length % 4) {
        standardBase64 += "=";
    }

    const jsonString = atob(standardBase64);
    return JSON.parse(jsonString);
}
