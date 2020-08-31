import { Nullable } from "../types";

export namespace Levenshtein {
    export class Alphabet<T> {
        private _characterToIdx: Map<T, number>;
        private _insertionCosts: number[];
        private _deletionCosts: number[];
        private _substitutionCosts: number[][];

        public serialize(): string {
            let jsonObject: any = {};
            
            let characters = new Array<T>(this._characterToIdx.size);
            this._characterToIdx.forEach((v, k) => {
                characters[v] = k;
            });
            jsonObject["characters"] = characters;
            
            jsonObject["insertionCosts"] = this._insertionCosts;
            jsonObject["deletionCosts"] = this._deletionCosts;
            jsonObject["substitutionCosts"] = this._substitutionCosts;
            
            return JSON.stringify(jsonObject);
        }
        
        public static Deserialize<T>(json: string): Alphabet<T> {
            let jsonObject = JSON.parse(json);
            let alphabet = new Alphabet(jsonObject["characters"] as T[]);
            alphabet._insertionCosts = jsonObject["insertionCosts"];
            alphabet._deletionCosts = jsonObject["deletionCosts"];
            alphabet._substitutionCosts = jsonObject["substitutionCosts"];
            return alphabet;
        }
        
        public constructor(
            characters: Array<T>,
            charToInsertionCost: Nullable<(char: T) => number> = null,
            charToDeletionCost: Nullable<(char: T) => number> = null,
            charsToSubstitutionCost: Nullable<(outChar: T, inChar: T) => number> = null) {

            charToInsertionCost = charToInsertionCost ?? (() => 1);
            charToDeletionCost = charToDeletionCost ?? (() => 1);
            charsToSubstitutionCost = charsToSubstitutionCost ?? ((a: T, b: T) => a === b ? 0 : 1);

            this._characterToIdx = new Map<T, number>();
            this._insertionCosts = new Array<number>(characters.length);
            this._deletionCosts = new Array<number>(characters.length);
            this._substitutionCosts = new Array<Array<number>>(characters.length);

            let c: T;
            for (let outerIdx = 0; outerIdx < characters.length; ++outerIdx) {
                c = characters[outerIdx];
                this._characterToIdx.set(c, outerIdx);
                this._insertionCosts[outerIdx] = charToInsertionCost(c);
                this._deletionCosts[outerIdx] = charToDeletionCost(c);
                
                this._substitutionCosts[outerIdx] = new Array<number>(characters.length);
                for (let innerIdx = outerIdx; innerIdx < characters.length; ++innerIdx) {
                    this._substitutionCosts[outerIdx][innerIdx] = charsToSubstitutionCost(c, characters[innerIdx]);
                }
            }
        }

        public getCharacterIdx(char: T): number {
            return this._characterToIdx.get(char)!;
        }

        public getInsertionCost(idx: number): number {
            return this._insertionCosts[idx];
        }

        public getDeletionCost(idx: number): number {
            return this._deletionCosts[idx];
        }

        public getSubstitutionCost(idx1: number, idx2: number): number {
            let min = Math.min(idx1, idx2);
            let max = Math.max(idx1, idx2);

            return this._substitutionCosts[min][max];
        }
    };
    
    export class Sequence<T> {
        private _alphabet: Alphabet<T>;
        private _characters: number[];

        // Scratch values
        private static readonly MAX_SEQUENCE_LENGTH = 256;
        private static _costMatrix = 
            [...Array(Sequence.MAX_SEQUENCE_LENGTH + 1)].map(n => new Array<number>(Sequence.MAX_SEQUENCE_LENGTH + 1));
        private static _insertionCost: number;
        private static _deletionCost: number;
        private static _substitutionCost: number;

        public serialize(): string {
            return JSON.stringify(this._characters);
        }

        public static Deserialize<T>(json: string, alphabet: Alphabet<T>): Sequence<T> {
            let sequence = new Sequence([], alphabet);
            sequence._characters = JSON.parse(json);
            return sequence;
        }

        public constructor(characters: T[], alphabet: Alphabet<T>) {
            if (characters.length > Sequence.MAX_SEQUENCE_LENGTH) {
                throw new Error("Sequences longer than " + Sequence.MAX_SEQUENCE_LENGTH + " not supported.");
            }
            this._alphabet = alphabet;
            this._characters = characters.map(c => this._alphabet.getCharacterIdx(c));
        }

        public distance(other: Sequence<T>): number {
            return Sequence._distance<T>(this, other);
        }

        private static _distance<T>(a: Sequence<T>, b: Sequence<T>): number {
            const alphabet = a._alphabet;
            if (alphabet !== b._alphabet) {
                throw new Error("Cannot Levenshtein compare Sequences built from different alphabets.");
            }
            const aChars = a._characters;
            const bChars = b._characters;
            const aLength = aChars.length;
            const bLength = bChars.length;

            let costMatrix = Sequence._costMatrix;
            costMatrix[0][0] = 0;
            for (let idx = 0; idx < aLength; ++idx) {
                costMatrix[idx + 1][0] = costMatrix[idx][0] + alphabet.getInsertionCost(aChars[idx]);
            }
            for (let idx = 0; idx < bLength; ++idx) {
                costMatrix[0][idx + 1] = costMatrix[0][idx] + alphabet.getInsertionCost(bChars[idx]);
            }

            for (let aIdx = 0; aIdx < aLength; ++aIdx) {
                for (let bIdx = 0; bIdx < bLength; ++bIdx) {
                    Sequence._insertionCost = costMatrix[aIdx + 1][bIdx] + alphabet.getInsertionCost(bChars[bIdx]);
                    Sequence._deletionCost = costMatrix[aIdx][bIdx + 1] + alphabet.getDeletionCost(aChars[aIdx]);
                    Sequence._substitutionCost = costMatrix[aIdx][bIdx] + alphabet.getSubstitutionCost(aChars[aIdx], bChars[bIdx]);

                    costMatrix[aIdx + 1][bIdx + 1] = Math.min(
                        Sequence._insertionCost, 
                        Sequence._deletionCost, 
                        Sequence._substitutionCost);
                }
            }

            return costMatrix[aLength][bLength];
        }
    }
}
