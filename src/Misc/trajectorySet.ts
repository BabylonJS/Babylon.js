import { DeepImmutable, Nullable } from "../types";
import { Matrix, Vector3 } from "../Maths/math.vector";

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

export class Trajectory {
    private _points: Vector3[];
    private readonly _segmentLength: number;

    public serialize(): string {
        return JSON.stringify(this);
    }
    
    public static Deserialize(json: string): Trajectory {
        let jsonObject = JSON.parse(json);
        let trajectory = new Trajectory(jsonObject["_segmentLength"]);
        trajectory._points = jsonObject["_points"].map((pt: any) => {
            return new Vector3(pt["_x"], pt["_y"], pt["_z"]);
        });
        return trajectory;
    }

    public constructor(segmentLength: number = 0.01) {
        this._points = [];
        this._segmentLength = segmentLength;
    }

    public getLength(): number {
        return this._points.length * this._segmentLength;
    }

    // TODO: Reduce allocations
    public add(point: DeepImmutable<Vector3>): void {
        let numPoints = this._points.length;
        if (numPoints === 0) {
            this._points.push(point.clone());
        } else {
            const getT = () =>
                this._segmentLength / Vector3.Distance(this._points[numPoints - 1], point);
            for (let t = getT(); t <= 1.0; t = getT()) {
                let newPoint = this._points[numPoints - 1].scale(1.0 - t);
                point.scaleAndAddToRef(t, newPoint);
                this._points.push(newPoint);
                ++numPoints;
            }
        }
    }

    public resampleAtTargetResolution(targetResolution: number): Trajectory {
        var resampled = new Trajectory(this.getLength() / targetResolution);
        this._points.forEach(pt => {
            resampled.add(pt);
        });
        return resampled;
    }

    public tokenize(tokens: DeepImmutable<Vector3[]>): number[] {
        let tokenization: number[] = [];

        let segmentDir = new Vector3();
        for (let idx = 2; idx < this._points.length; ++idx) {
            if (Trajectory._transformSegmentDirToRef(
                    this._points[idx - 2],
                    this._points[idx - 1],
                    this._points[idx],
                    segmentDir)) {

                tokenization.push(Trajectory._tokenizeSegment(segmentDir, tokens));
            }
        }

        return tokenization;
    }

    private static _forwardDir = new Vector3();
    private static _inverseFromDir = new Vector3();
    private static _upDir = new Vector3();
    private static _fromToVec = new Vector3();
    private static _lookMatrix = new Matrix();
    public/*private*/ static _transformSegmentDirToRef(
        priorVec: DeepImmutable<Vector3>,
        fromVec: DeepImmutable<Vector3>,
        toVec: DeepImmutable<Vector3>,
        result: Vector3): boolean {
        
        const DOT_PRODUCT_SAMPLE_REJECTION_THRESHOLD = 0.98;

        fromVec.subtractToRef(priorVec, Trajectory._forwardDir);
        Trajectory._forwardDir.normalize();
        fromVec.scaleToRef(-1, Trajectory._inverseFromDir);
        Trajectory._inverseFromDir.normalize();

        if (Math.abs(Vector3.Dot(Trajectory._forwardDir, Trajectory._inverseFromDir)) > DOT_PRODUCT_SAMPLE_REJECTION_THRESHOLD) {
            return false;
        }

        Vector3.CrossToRef(Trajectory._forwardDir, Trajectory._inverseFromDir, Trajectory._upDir);
        Trajectory._upDir.normalize();
        Matrix.LookAtLHToRef(priorVec, fromVec, Trajectory._upDir, Trajectory._lookMatrix);
        toVec.subtractToRef(fromVec, Trajectory._fromToVec);
        Trajectory._fromToVec.normalize();
        Vector3.TransformNormalToRef(Trajectory._fromToVec, Trajectory._lookMatrix, result);
        return true;
    }

    private static _bestMatch: number;
    private static _score: number;
    private static _bestScore: number;
    public/*private*/ static _tokenizeSegment(
        segment: DeepImmutable<Vector3>,
        tokens: DeepImmutable<Vector3[]>): number {
        
        Trajectory._bestMatch = 0;
        Trajectory._score = Vector3.Dot(segment, tokens[0]);
        Trajectory._bestScore = Trajectory._score;
        for (let idx = 1; idx < tokens.length; ++idx) {
            Trajectory._score = Vector3.Dot(segment, tokens[idx]);
            if (Trajectory._score > Trajectory._bestScore) {
                Trajectory._bestMatch = idx;
                Trajectory._bestScore = Trajectory._score;
            }
        }

        return Trajectory._bestMatch;
    }
}

export class Vector3Alphabet extends Array<Vector3> {
    public static Generate(
        alphabetSize: number = 64,
        iterations: number = 256,
        startingStepSize: number = 0.1,
        endingStepSize: number = 0.001,
        fixedValues: DeepImmutable<Vector3[]> = []): Vector3Alphabet {
        
        const EPSILON = 0.001;
        const EPSILON_SQUARED = EPSILON * EPSILON;
        
        let alphabet = new Vector3Alphabet(alphabetSize);
        for (let idx = 0; idx < alphabetSize; ++idx) {
            alphabet[idx] = new Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5);
            alphabet[idx].normalize();
        }

        for (let idx = 0; idx < fixedValues.length; ++idx) {
            alphabet[idx].copyFrom(fixedValues[idx]);
        }

        let stepSize: number;
        let distSq: number;
        let force = new Vector3();
        let scratch = new Vector3();
        const lerp = (l: number, r: number, t: number) => (1.0 - t) * l + t * r;
        for (let iteration = 0; iteration < iterations; ++iteration) {
            stepSize = lerp(startingStepSize, endingStepSize, iteration / (iterations - 1));
            for (let idx = fixedValues.length; idx < alphabet.length; ++idx) {
                force.copyFromFloats(0, 0, 0);
                alphabet.forEach(pt => {
                    alphabet[idx].subtractToRef(pt, scratch);
                    distSq = scratch.lengthSquared();
                    if (distSq > EPSILON_SQUARED) {
                        scratch.scaleAndAddToRef(1 / (scratch.lengthSquared() * distSq), force);
                    }
                });
                force.scaleInPlace(stepSize);
                alphabet[idx].addInPlace(force);
                alphabet[idx].normalize();
            }
        }

        return alphabet;
    }

    public serialize(): string {
        return JSON.stringify(this);
    }

    public static Deserialize(json: string): Vector3Alphabet {
        let jsonObject = JSON.parse(json);
        let alphabet = new Vector3Alphabet(jsonObject.length);
        for (let idx = 0; idx < jsonObject.length; ++idx) {
            alphabet[idx] = new Vector3(
                jsonObject[idx]["_x"],
                jsonObject[idx]["_y"],
                jsonObject[idx]["_z"]);
        }
        return alphabet;
    }

    private constructor(size: number) {
        super(size);
    }
}

export class TrajectoryDescriptor {
    public static readonly FINEST_DESCRIPTOR_RESOLUTION = 32;

    private _sequences: Levenshtein.Sequence<number>[];

    public serialize(): string {
        return JSON.stringify(this._sequences.map(sequence => sequence.serialize()));
    }

    public static Deserialize(json: string, alphabet: Levenshtein.Alphabet<number>): TrajectoryDescriptor {
        let descriptor = new TrajectoryDescriptor();
        descriptor._sequences = 
            (JSON.parse(json) as string[]).map(
                s => Levenshtein.Sequence.Deserialize(s, alphabet));
        return descriptor;
    }

    public static CreateFromTrajectory(
        trajectory: Trajectory,
        vector3Alphabet: Vector3Alphabet,
        levenshteinAlphabet: Levenshtein.Alphabet<number>): TrajectoryDescriptor {
        
        return TrajectoryDescriptor.CreateFromTokenizationPyramid(
            TrajectoryDescriptor._getTokenizationPyramid(trajectory, vector3Alphabet),
            levenshteinAlphabet);
    }

    public static CreateFromTokenizationPyramid(
        pyramid: number[][],
        levenshteinAlphabet: Levenshtein.Alphabet<number>) : TrajectoryDescriptor {
        
        let descriptor = new TrajectoryDescriptor();
        descriptor._sequences = pyramid.map(tokens => new Levenshtein.Sequence<number>(tokens, levenshteinAlphabet));
        return descriptor;
    }

    private constructor() {
        this._sequences = [];
    }

    private static _getTokenizationPyramid(
        trajectory: Trajectory,
        alphabet: Vector3Alphabet,
        targetResolution: number = TrajectoryDescriptor.FINEST_DESCRIPTOR_RESOLUTION): number[][] {
        
        let pyramid: number[][] = [];
        for (let res = targetResolution; res > 2; res = Math.floor(res / 2)) {
            pyramid.push(trajectory.resampleAtTargetResolution(res).tokenize(alphabet));
        }
        return pyramid;
    }

    public distance(other: TrajectoryDescriptor): number {
        let totalDistance = 0;
        let weight: number;
        for (let idx = 0; idx < this._sequences.length; ++idx) {
            weight = Math.pow(2, idx);
            totalDistance += (weight * this._sequences[idx].distance(other._sequences[idx]));
        }
        return totalDistance;
    }
}

export class DescribedTrajectory {
    private static readonly MIN_AVERAGE_DISTANCE = 1;

    private _descriptors: TrajectoryDescriptor[];
    private _centroidIdx: number;
    private _averageDistance: number;

    public serialize(): string {
        let jsonObject: any = {};
        jsonObject.descriptors = this._descriptors.map(desc => desc.serialize());
        jsonObject.centroidIdx = this._centroidIdx;
        jsonObject.averageDistance = this._averageDistance;
        return JSON.stringify(jsonObject);
    }

    public static Deserialize(json: string, alphabet: Levenshtein.Alphabet<number>): DescribedTrajectory {
        let jsonObject = JSON.parse(json);
        let described = new DescribedTrajectory();
        described._descriptors = jsonObject.descriptors.map((s: string) => TrajectoryDescriptor.Deserialize(s, alphabet));
        described._centroidIdx = jsonObject.centroidIdx;
        described._averageDistance = jsonObject.averageDistance;
        return described;
    }

    public constructor(descriptors: TrajectoryDescriptor[] = []) {
        this._descriptors = descriptors;
        this._centroidIdx = -1;
        this._averageDistance = 0;

        this._refreshDescription();
    }

    public add(descriptor: TrajectoryDescriptor): void {
        this._descriptors.push(descriptor);
        this._refreshDescription();
    }

    public getMatchCost(descriptor: TrajectoryDescriptor): number {
        return descriptor.distance(this._descriptors[this._centroidIdx]) / this._averageDistance;
    }

    public getMatchMinimumDistance(descriptor: TrajectoryDescriptor): number {
        return Math.min(...this._descriptors.map(desc => desc.distance(descriptor)));
    }

    private _refreshDescription(): void {
        
        this._centroidIdx = -1;
        let sum: number;
        let distances = this._descriptors.map(a => {
            sum = 0;
            this._descriptors.forEach(b => {
                sum += a.distance(b);
            });
            return sum;
        });
        for (let idx = 0; idx < distances.length; ++idx) {
            if (this._centroidIdx < 0 || distances[idx] < distances[this._centroidIdx]) {
                this._centroidIdx = idx;
            }
        }

        this._averageDistance = 0;
        this._descriptors.forEach(desc => {
            this._averageDistance += desc.distance(this._descriptors[this._centroidIdx]);
        });
        if (this._descriptors.length > 0) {
            this._averageDistance = Math.min(this._averageDistance / this._descriptors.length, DescribedTrajectory.MIN_AVERAGE_DISTANCE);
        }
    }
}

export class TrajectorySet {
    private static readonly MAXIMUM_ALLOWABLE_MATCH_COST = 4;

    private _vector3Alphabet: Vector3Alphabet;
    private _levenshteinAlphabet: Levenshtein.Alphabet<number>;
    private _nameToDescribedTrajectory: Map<string, DescribedTrajectory>;

    public serialize(): string {
        let jsonObject: any = {};
        jsonObject.vector3Alphabet = this._vector3Alphabet.serialize();
        jsonObject.levenshteinAlphabet = this._levenshteinAlphabet.serialize();
        jsonObject.nameToDescribedTrajectory = [];
        this._nameToDescribedTrajectory.forEach((described, name) => {
            jsonObject.nameToDescribedTrajectory.push(name);
            jsonObject.nameToDescribedTrajectory.push(described.serialize());
        });
        return JSON.stringify(jsonObject);
    }

    public static Deserialize(json: string): TrajectorySet {
        let jsonObject = JSON.parse(json);
        let trajectorySet = new TrajectorySet();
        trajectorySet._vector3Alphabet = Vector3Alphabet.Deserialize(jsonObject.vector3Alphabet);
        trajectorySet._levenshteinAlphabet = Levenshtein.Alphabet.Deserialize<number>(jsonObject.levenshteinAlphabet);
        for (let idx = 0; idx < jsonObject.nameToDescribedTrajectory.length; idx += 2) {
            trajectorySet._nameToDescribedTrajectory.set(
                jsonObject.nameToDescribedTrajectory[idx], 
                jsonObject.nameToDescribedTrajectory[idx + 1]);
        }
        return trajectorySet;
    }
    
    // VERY naive, need to be generating these things from known
    // sets. Better version later, probably eliminating this one.
    public static Generate(): TrajectorySet {
        let vecs = Vector3Alphabet.Generate(64, 256, 0.1, 0.001, [Vector3.Forward()]);

        let alphabet = new Levenshtein.Alphabet<number>(
            Array.from(Array(vecs.length), (_, idx) => idx),
            _ => 1,
            _ => 1,
            (a, b) => Math.min(1.1 - Vector3.Dot(vecs[a], vecs[b]), 1)
        );

        let trajectorySet = new TrajectorySet();
        trajectorySet._vector3Alphabet = vecs;
        trajectorySet._levenshteinAlphabet = alphabet;
        return trajectorySet;
    }

    private constructor() {
        this._nameToDescribedTrajectory = new Map<string, DescribedTrajectory>();
    }

    public addTrajectoryWithName(trajectory: Trajectory, name: string): void {
        if (!this._nameToDescribedTrajectory.has(name)) {
            this._nameToDescribedTrajectory.set(name, new DescribedTrajectory());
        }

        this._nameToDescribedTrajectory.get(name)!.add(
            TrajectoryDescriptor.CreateFromTrajectory(
                trajectory,
                this._vector3Alphabet,
                this._levenshteinAlphabet));
    }

    public recognizeTrajectory(trajectory: Trajectory): Nullable<string> {
        let descriptor = TrajectoryDescriptor.CreateFromTrajectory(
            trajectory, 
            this._vector3Alphabet, 
            this._levenshteinAlphabet);
        
        let allowableMatches: string[] = [];
        this._nameToDescribedTrajectory.forEach((described, name) => {
            if (described.getMatchCost(descriptor) < TrajectorySet.MAXIMUM_ALLOWABLE_MATCH_COST) {
                allowableMatches.push(name);
            }
        });

        if (allowableMatches.length == 0) {
            return null;
        }

        let bestIdx = 0;
        let bestMatch = this._nameToDescribedTrajectory.get(allowableMatches[bestIdx])!.getMatchMinimumDistance(descriptor);
        let match: number;
        for (let idx = 0; idx < allowableMatches.length; ++idx) {
            match = this._nameToDescribedTrajectory.get(allowableMatches[idx])!.getMatchMinimumDistance(descriptor);
            if (match < bestMatch) {
                bestMatch = match;
                bestIdx = idx;
            }
        }
        return allowableMatches[bestIdx];
    }
}
