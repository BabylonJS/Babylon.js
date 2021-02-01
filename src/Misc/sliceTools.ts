/**
 * Class used to provide helpers for slicing
 */
export class SliceTools {
    /**
     * Provides a slice function that will work even on IE
     * @param data defines the array to slice
     * @param start defines the start of the data (optional)
     * @param end defines the end of the data (optional)
     * @returns the new sliced array
     */
    public static Slice<T>(data: T, start?: number, end?: number): T {
        if ((data as any).slice) {
            return (data as any).slice(start, end);
        }

        return Array.prototype.slice.call(data, start, end);
    }

    /**
     * Provides a slice function that will work even on IE
     * The difference between this and Slice is that this will force-convert to array
     * @param data defines the array to slice
     * @param start defines the start of the data (optional)
     * @param end defines the end of the data (optional)
     * @returns the new sliced array
     */
    public static SliceToArray<T, P>(data: T, start?: number, end?: number): Array<P> {
        if (Array.isArray(data)) {
            return (data as Array<P>).slice(start, end);
        }

        return Array.prototype.slice.call(data, start, end);
    }
}