// module BABYLON {
//     export class Promise<T> {
//         public constructor(resolver: (
//                 resolve:(value:T) => void, 
//                 reject: (reason: string) => void
//             ) => void) {

//             try {

//             } catch(e) {
//                 this._reject((<Error>e).message);
//             }
//         }

//         public catch(onRejected: (reason: string) => void): Promise<T> {
//             return this.then(undefined, onRejected);
//         }

//         public then(onFulfilled?: (fulfillment: T) => void, onRejected?: (reason: string) => void): Promise<T> {
//             return this;
//         }        

//         private _reject(reason: string): void {
            
//         }

//         // public static resolve(): Promise<T> {
            
//         // }
//         // public static reject(reason: string): Promise<T> {
//         //     let newPromise = 
//         // }
//     }
// }