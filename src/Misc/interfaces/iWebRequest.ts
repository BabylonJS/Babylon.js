
/**
 * Interface used to define the mechanism to get data from the network
 */
export interface IWebRequest {
    /**
     * Returns client's response url
     */
    responseURL: string;
    /**
     * Returns client's status
     */
    status: number;
    /**
     * Returns client's status as a text
     */
    statusText: string;
}