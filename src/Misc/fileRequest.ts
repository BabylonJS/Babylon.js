import { Observable } from './observable';

/**
 * File request interface
 */
export interface IFileRequest {
    /**
     * Raised when the request is complete (success or error).
     */
    onCompleteObservable: Observable<IFileRequest>;

    /**
     * Aborts the request for a file.
     */
    abort: () => void;
}
