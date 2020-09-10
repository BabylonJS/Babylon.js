import { DeepImmutable, Nullable } from "../types";
import { Matrix, Vector3 } from "../Maths/math.vector";

// This implementation was based on the original MIT-licensed TRACE repository
// from https://github.com/septagon/TRACE.

/**
 * Generic implementation of Levenshtein distance.
 */
namespace Levenshtein {
    /**
     * Alphabet from which to construct sequences to be compared using Levenshtein
     * distance.
     */
    export class Alphabet<T> {
        private _characterToIdx: Map<T, number>;
        private _insertionCosts: number[];
        private _deletionCosts: number[];
        private _substitutionCosts: number[][];

        /**
         * Serialize the Alphabet to JSON string.
         * @returns JSON serialization
         */
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

        /**
         * Parse an Alphabet from a JSON serialization.
         * @param json JSON string to deserialize
         * @returns deserialized Alphabet
         */
        public static Deserialize<T>(json: string): Alphabet<T> {
            let jsonObject = JSON.parse(json);
            let alphabet = new Alphabet(jsonObject["characters"] as T[]);
            alphabet._insertionCosts = jsonObject["insertionCosts"];
            alphabet._deletionCosts = jsonObject["deletionCosts"];
            alphabet._substitutionCosts = jsonObject["substitutionCosts"];
            return alphabet;
        }

        /**
         * Create a new Alphabet.
         * @param characters characters of the alphabet
         * @param charToInsertionCost function mapping characters to insertion costs
         * @param charToDeletionCost function mapping characters to deletion costs
         * @param charsToSubstitutionCost function mapping character pairs to substitution costs
         */
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

        /**
         * Get the index (internally-assigned number) for a character.
         * @param char character
         * @returns index
         */
        public getCharacterIdx(char: T): number {
            return this._characterToIdx.get(char)!;
        }

        /**
         * Get the insertion cost of a character from its index.
         * @param idx character index
         * @returns insertion cost
         */
        public getInsertionCost(idx: number): number {
            return this._insertionCosts[idx];
        }

        /**
         * Get the deletion cost of a character from its index.
         * @param idx character index
         * @returns deletion cost
         */
        public getDeletionCost(idx: number): number {
            return this._deletionCosts[idx];
        }

        /**
         * Gets the cost to substitute two characters. NOTE: this cost is
         * required to be bi-directional, meaning it cannot matter which of
         * the provided characters is being removed and which is being inserted.
         * @param idx1 the first character index
         * @param idx2 the second character index
         * @returns substitution cost
         */
        public getSubstitutionCost(idx1: number, idx2: number): number {
            let min = Math.min(idx1, idx2);
            let max = Math.max(idx1, idx2);

            return this._substitutionCosts[min][max];
        }
    }

    /**
     * Character sequence intended to be compared against other Sequences created
     * with the same Alphabet in order to compute Levenshtein distance.
     */
    export class Sequence<T> {
        private _alphabet: Alphabet<T>;
        private _characters: number[];

        // Scratch values
        private static readonly MAX_SEQUENCE_LENGTH = 256;
        private static _costMatrix =
            [...Array(Sequence.MAX_SEQUENCE_LENGTH + 1)].map((n) => new Array<number>(Sequence.MAX_SEQUENCE_LENGTH + 1));
        private static _insertionCost: number;
        private static _deletionCost: number;
        private static _substitutionCost: number;

        /**
         * Serialize to JSON string. JSON representation does NOT include the Alphabet
         * from which this Sequence was created; Alphabet must be independently
         * serialized.
         * @returns JSON string
         */
        public serialize(): string {
            return JSON.stringify(this._characters);
        }

        /**
         * Deserialize from JSON string and Alphabet. This should be the same Alphabet
         * from which the Sequence was originally created, which must be serialized and
         * deserialized independently so that it can be passed in here.
         * @param json JSON string representation of Sequence
         * @param alphabet Alphabet from which Sequence was originally created
         * @returns Sequence
         */
        public static Deserialize<T>(json: string, alphabet: Alphabet<T>): Sequence<T> {
            let sequence = new Sequence([], alphabet);
            sequence._characters = JSON.parse(json);
            return sequence;
        }

        /**
         * Create a new Sequence.
         * @param characters characters in the new Sequence
         * @param alphabet Alphabet, which must include all used characters
         */
        public constructor(characters: T[], alphabet: Alphabet<T>) {
            if (characters.length > Sequence.MAX_SEQUENCE_LENGTH) {
                throw new Error("Sequences longer than " + Sequence.MAX_SEQUENCE_LENGTH + " not supported.");
            }
            this._alphabet = alphabet;
            this._characters = characters.map((c) => this._alphabet.getCharacterIdx(c));
        }

        /**
         * Get the distance between this Sequence and another.
         * @param other sequence to compare to
         * @returns Levenshtein distance
         */
        public distance(other: Sequence<T>): number {
            return Sequence._distance<T>(this, other);
        }

        /**
         * Compute the Levenshtein distance between two Sequences.
         * @param a first Sequence
         * @param b second Sequence
         * @returns Levenshtein distance
         */
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

/**
 * A 3D trajectory consisting of an order list of vectors describing a
 * path of motion through 3D space.
 */
export class Trajectory {
    private _points: Vector3[];
    private readonly _segmentLength: number;

    /**
     * Serialize to JSON.
     * @returns serialized JSON string
     */
    public serialize(): string {
        return JSON.stringify(this);
    }

    /**
     * Deserialize from JSON.
     * @param json serialized JSON string
     * @returns deserialized Trajectory
     */
    public static Deserialize(json: string): Trajectory {
        let jsonObject = JSON.parse(json);
        let trajectory = new Trajectory(jsonObject["_segmentLength"]);
        trajectory._points = jsonObject["_points"].map((pt: any) => {
            return new Vector3(pt["_x"], pt["_y"], pt["_z"]);
        });
        return trajectory;
    }

    /**
     * Create a new empty Trajectory.
     * @param segmentLength radius of discretization for Trajectory points
     */
    public constructor(segmentLength: number = 0.01) {
        this._points = [];
        this._segmentLength = segmentLength;
    }

    /**
     * Get the length of the Trajectory.
     * @returns length of the Trajectory
     */
    public getLength(): number {
        return this._points.length * this._segmentLength;
    }

    /**
     * Append a new point to the Trajectory.
     * NOTE: This implementation has many allocations.
     * @param point point to append to the Trajectory
     */
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

    /**
     * Create a new Trajectory with a segment length chosen to make it
     * probable that the new Trajectory will have a specified number of
     * segments. This operation is imprecise.
     * @param targetResolution number of segments desired
     * @returns new Trajectory with approximately the requested number of segments
     */
    public resampleAtTargetResolution(targetResolution: number): Trajectory {
        var resampled = new Trajectory(this.getLength() / targetResolution);
        this._points.forEach((pt) => {
            resampled.add(pt);
        });
        return resampled;
    }

    /**
     * Convert Trajectory segments into tokenized representation. This
     * representation is an array of numbers where each nth number is the
     * index of the token which is most similar to the nth segment of the
     * Trajectory.
     * @param tokens list of vectors which serve as discrete tokens
     * @returns list of indices of most similar token per segment
     */
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
    private static _inverseFromVec = new Vector3();
    private static _upDir = new Vector3();
    private static _fromToVec = new Vector3();
    private static _lookMatrix = new Matrix();

    /**
     * Transform the rotation (i.e., direction) of a segment to isolate
     * the relative transformation represented by the segment. This operation
     * may or may not succeed due to singularities in the equations that define
     * motion relativity in this context.
     * @param priorVec the origin of the prior segment
     * @param fromVec the origin of the current segment
     * @param toVec the destination of the current segment
     * @param result reference to output variable
     * @returns whether or not transformation was successful
     */
    private static _transformSegmentDirToRef(
        priorVec: DeepImmutable<Vector3>,
        fromVec: DeepImmutable<Vector3>,
        toVec: DeepImmutable<Vector3>,
        result: Vector3): boolean {

        const DOT_PRODUCT_SAMPLE_REJECTION_THRESHOLD = 0.98;

        fromVec.subtractToRef(priorVec, Trajectory._forwardDir);
        Trajectory._forwardDir.normalize();
        fromVec.scaleToRef(-1, Trajectory._inverseFromVec);
        Trajectory._inverseFromVec.normalize();

        if (Math.abs(Vector3.Dot(Trajectory._forwardDir, Trajectory._inverseFromVec)) > DOT_PRODUCT_SAMPLE_REJECTION_THRESHOLD) {
            return false;
        }

        Vector3.CrossToRef(Trajectory._forwardDir, Trajectory._inverseFromVec, Trajectory._upDir);
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

    /**
     * Determine which token vector is most similar to the
     * segment vector.
     * @param segment segment vector
     * @param tokens token vector list
     * @returns index of the most similar token to the segment
     */
    private static _tokenizeSegment(
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

/**
 * Collection of vectors intended to be used as the basis of Trajectory
 * tokenization for Levenshtein distance comparison. Canonically, a
 * Vector3Alphabet will resemble a "spikeball" of vectors distributed
 * roughly evenly over the surface of the unit sphere.
 */
class Vector3Alphabet {

    /**
     * Characters in the alphabet.
     * NOTE: There is no reason for this property to exist and this class should just extend
     * Array<Vector3>, except that doing so produces bizarre build-time errors indicating that
     * the ES5 library itself fails its own TypeDoc validation.
     */
    public chars: Vector3[];

    /**
     * Helper method to create new "spikeball" Vector3Alphabets. Uses a naive
     * optimize-from-random strategy to space points around the unit sphere
     * surface as a simple alternative to really doing the math to tile the
     * sphere.
     * @param alphabetSize size of the desired alphabet
     * @param iterations number of iterations over which to optimize the "spikeball"
     * @param startingStepSize distance factor to move points in early optimization iterations
     * @param endingStepSize distance factor to move points in late optimization iterations
     * @param fixedValues alphabet "characters" that are required and cannot be moved by optimization
     * @returns a new randomly generated and optimized Vector3Alphabet of the specified size
     */
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
            alphabet.chars[idx] = new Vector3(
                Math.random() - 0.5,
                Math.random() - 0.5,
                Math.random() - 0.5);
            alphabet.chars[idx].normalize();
        }

        for (let idx = 0; idx < fixedValues.length; ++idx) {
            alphabet.chars[idx].copyFrom(fixedValues[idx]);
        }

        let stepSize: number;
        let distSq: number;
        let force = new Vector3();
        let scratch = new Vector3();
        const lerp = (l: number, r: number, t: number) => (1.0 - t) * l + t * r;
        for (let iteration = 0; iteration < iterations; ++iteration) {
            stepSize = lerp(startingStepSize, endingStepSize, iteration / (iterations - 1));
            for (let idx = fixedValues.length; idx < alphabet.chars.length; ++idx) {
                force.copyFromFloats(0, 0, 0);
                alphabet.chars.forEach((pt) => {
                    alphabet.chars[idx].subtractToRef(pt, scratch);
                    distSq = scratch.lengthSquared();
                    if (distSq > EPSILON_SQUARED) {
                        scratch.scaleAndAddToRef(1 / (scratch.lengthSquared() * distSq), force);
                    }
                });
                force.scaleInPlace(stepSize);
                alphabet.chars[idx].addInPlace(force);
                alphabet.chars[idx].normalize();
            }
        }

        return alphabet;
    }

    /**
     * Serialize to JSON.
     * @returns JSON serialization
     */
    public serialize(): string {
        return JSON.stringify(this.chars);
    }

    /**
     * Deserialize from JSON.
     * @param json JSON serialization
     * @returns deserialized Vector3Alphabet
     */
    public static Deserialize(json: string): Vector3Alphabet {
        let jsonObject = JSON.parse(json);
        let alphabet = new Vector3Alphabet(jsonObject.length);
        for (let idx = 0; idx < jsonObject.length; ++idx) {
            alphabet.chars[idx] = new Vector3(
                jsonObject[idx]["_x"],
                jsonObject[idx]["_y"],
                jsonObject[idx]["_z"]);
        }
        return alphabet;
    }

    private constructor(size: number) {
        this.chars = new Array(size);
    }
}

/**
 * Class which formalizes the manner in which a Vector3Alphabet is used to tokenize and
 * describe a Trajectory. This class houses the functionality which determines what
 * attributes of Trajectories are and are not considered important, such as scale.
 */
class TrajectoryDescriptor {
    private static readonly FINEST_DESCRIPTOR_RESOLUTION = 32;

    private _sequences: Levenshtein.Sequence<number>[];

    /**
     * Serialize to JSON.
     * @returns JSON serialization
     */
    public serialize(): string {
        return JSON.stringify(this._sequences.map((sequence) => sequence.serialize()));
    }

    /**
     * Deserialize from JSON string and Alphabet. This should be the same Alphabet
     * from which the descriptor was originally created, which must be serialized and
     * deserialized independently so that it can be passed in here.
     * @param json JSON serialization
     * @param alphabet Alphabet from which descriptor was originally created
     * @returns deserialized TrajectoryDescriptor
     */
    public static Deserialize(json: string, alphabet: Levenshtein.Alphabet<number>): TrajectoryDescriptor {
        let descriptor = new TrajectoryDescriptor();
        descriptor._sequences =
            (JSON.parse(json) as string[]).map(
                (s) => Levenshtein.Sequence.Deserialize(s, alphabet));
        return descriptor;
    }

    /**
     * Create a new TrajectoryDescriptor to describe a provided Trajectory according
     * to the provided alphabets.
     * @param trajectory Trajectory to be described
     * @param vector3Alphabet Vector3Alphabet to be used to tokenize the Trajectory
     * @param levenshteinAlphabet Levenshtein.Alphabet to be used as basis for comparison with other descriptors
     * @returns TrajectoryDescriptor describing provided Trajectory
     */
    public static CreateFromTrajectory(
        trajectory: Trajectory,
        vector3Alphabet: Vector3Alphabet,
        levenshteinAlphabet: Levenshtein.Alphabet<number>): TrajectoryDescriptor {

        return TrajectoryDescriptor.CreateFromTokenizationPyramid(
            TrajectoryDescriptor._getTokenizationPyramid(trajectory, vector3Alphabet),
            levenshteinAlphabet);
    }

    /**
     * Create a new TrajectoryDescriptor from a pre-existing pyramid of tokens.
     * NOTE: This function exists to support an outdated serialization mechanism and should
     * be deleted if it is no longer useful.
     * @param pyramid tokenization pyramid
     * @param levenshteinAlphabet Levenshtein.Alphabet to be uses as basis for comparison with other descriptors
     * @returns TrajectoryDescriptor describing the Trajectory from which the pyramid was built
     */
    public static CreateFromTokenizationPyramid(
        pyramid: number[][],
        levenshteinAlphabet: Levenshtein.Alphabet<number>) : TrajectoryDescriptor {

        let descriptor = new TrajectoryDescriptor();
        descriptor._sequences = pyramid.map((tokens) => new Levenshtein.Sequence<number>(tokens, levenshteinAlphabet));
        return descriptor;
    }

    private constructor() {
        this._sequences = [];
    }

    /**
     * Create the tokenization pyramid for the provided Trajectory according to the given
     * Vector3Alphabet.
     * @param trajectory Trajectory to be tokenized
     * @param alphabet Vector3Alphabet containing tokens
     * @param targetResolution finest resolution of descriptor
     * @returns tokenization pyramid for Trajectory
     */
    private static _getTokenizationPyramid(
        trajectory: Trajectory,
        alphabet: Vector3Alphabet,
        targetResolution: number = TrajectoryDescriptor.FINEST_DESCRIPTOR_RESOLUTION): number[][] {

        let pyramid: number[][] = [];
        for (let res = targetResolution; res > 4; res = Math.floor(res / 2)) {
            pyramid.push(trajectory.resampleAtTargetResolution(res).tokenize(alphabet.chars));
        }
        return pyramid;
    }

    /**
     * Calculate a distance metric between this TrajectoryDescriptor and another. This is
     * essentially a similarity score and does not directly represent Euclidean distance,
     * edit distance, or any other formal distance metric.
     * @param other TrajectoryDescriptor from which to determine distance
     * @returns distance, a nonnegative similarity score where larger values indicate dissimilarity
     */
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

/**
 * A set of TrajectoryDescriptors defined to be "the same." This is essentially a helper
 * class to facilitate methods of Trajectory clustering.
 */
class TrajectoryClass {
    private static readonly MIN_AVERAGE_DISTANCE = 1;

    private _descriptors: TrajectoryDescriptor[];
    private _centroidIdx: number;
    private _averageDistance: number;

    /**
     * Serialize to JSON.
     * @returns JSON serialization
     */
    public serialize(): string {
        let jsonObject: any = {};
        jsonObject.descriptors = this._descriptors.map((desc) => desc.serialize());
        jsonObject.centroidIdx = this._centroidIdx;
        jsonObject.averageDistance = this._averageDistance;
        return JSON.stringify(jsonObject);
    }

    /**
     * Deserialize from JSON string and Alphabet. This should be the same Alphabet
     * from which the descriptors were originally created, which must be serialized and
     * deserialized independently so that it can be passed in here.
     * @param json JSON string representation
     * @param alphabet Alphabet from which TrajectoryDescriptors were originally created
     * @returns deserialized TrajectoryDescriptor
     */
    public static Deserialize(json: string, alphabet: Levenshtein.Alphabet<number>): TrajectoryClass {
        let jsonObject = JSON.parse(json);
        let described = new TrajectoryClass();
        described._descriptors = jsonObject.descriptors.map((s: string) => TrajectoryDescriptor.Deserialize(s, alphabet));
        described._centroidIdx = jsonObject.centroidIdx;
        described._averageDistance = jsonObject.averageDistance;
        return described;
    }

    /**
     * Create a new DescribedTrajectory.
     * @param descriptors currently-known TrajectoryDescriptors, if any
     */
    public constructor(descriptors: TrajectoryDescriptor[] = []) {
        this._descriptors = descriptors;
        this._centroidIdx = -1;
        this._averageDistance = 0;

        this._refreshDescription();
    }

    /**
     * Add a new TrajectoryDescriptor to the list of descriptors known to describe
     * this same DescribedTrajectory.
     * @param descriptor descriptor to be added
     */
    public add(descriptor: TrajectoryDescriptor): void {
        this._descriptors.push(descriptor);
        this._refreshDescription();
    }

    /**
     * Compute the cost, which is inversely related to the likelihood that the provided
     * TrajectoryDescriptor describes a Trajectory that is considered to be the same as
     * the class represented by this DescribedTrajectory.
     * @param descriptor the descriptor to be costed
     * @returns cost of the match, which is a nonnegative similarity metric where larger values indicate dissimiliarity
     */
    public getMatchCost(descriptor: TrajectoryDescriptor): number {
        return descriptor.distance(this._descriptors[this._centroidIdx]) / this._averageDistance;
    }

    /**
     * Compute the minimum distance between the queried TrajectoryDescriptor and a
     * descriptor which is a member of this collection. This is an alternative way of
     * conceptualizing match cost from getMatchCost(), and it serves a different function.
     * @param descriptor the descriptor to find the minimum distance to
     * @returns minimum descriptor distance to a member descriptor of this DescribedTrajectory
     */
    public getMatchMinimumDistance(descriptor: TrajectoryDescriptor): number {
        return Math.min(...this._descriptors.map((desc) => desc.distance(descriptor)));
    }

    /**
     * Refreshes the internal representation of this DescribedTrajectory.
     */
    private _refreshDescription(): void {

        this._centroidIdx = -1;
        let sum: number;
        let distances = this._descriptors.map((a) => {
            sum = 0;
            this._descriptors.forEach((b) => {
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
        this._descriptors.forEach((desc) => {
            this._averageDistance += desc.distance(this._descriptors[this._centroidIdx]);
        });
        if (this._descriptors.length > 0) {
            this._averageDistance = Math.max(this._averageDistance / this._descriptors.length, TrajectoryClass.MIN_AVERAGE_DISTANCE);
        }
    }
}

/**
 * Class representing a set of known, named trajectories to which Trajectories can be
 * added and using which Trajectories can be recognized.
 */
export class TrajectoryClassifier {
    private _maximumAllowableMatchCost: number = 4;
    private _vector3Alphabet: Vector3Alphabet;
    private _levenshteinAlphabet: Levenshtein.Alphabet<number>;
    private _nameToDescribedTrajectory: Map<string, TrajectoryClass>;

    /**
     * Serialize to JSON.
     * @returns JSON serialization
     */
    public serialize(): string {
        let jsonObject: any = {};
        jsonObject.maximumAllowableMatchCost = this._maximumAllowableMatchCost;
        jsonObject.vector3Alphabet = this._vector3Alphabet.serialize();
        jsonObject.levenshteinAlphabet = this._levenshteinAlphabet.serialize();
        jsonObject.nameToDescribedTrajectory = [];
        this._nameToDescribedTrajectory.forEach((described, name) => {
            jsonObject.nameToDescribedTrajectory.push(name);
            jsonObject.nameToDescribedTrajectory.push(described.serialize());
        });
        return JSON.stringify(jsonObject);
    }

    /**
     * Deserialize from JSON.
     * @param json JSON serialization
     * @returns deserialized TrajectorySet
     */
    public static Deserialize(json: string): TrajectoryClassifier {
        let jsonObject = JSON.parse(json);
        let classifier = new TrajectoryClassifier();
        classifier._maximumAllowableMatchCost = jsonObject.maximumAllowableMatchCost;
        classifier._vector3Alphabet = Vector3Alphabet.Deserialize(jsonObject.vector3Alphabet);
        classifier._levenshteinAlphabet = Levenshtein.Alphabet.Deserialize<number>(jsonObject.levenshteinAlphabet);
        for (let idx = 0; idx < jsonObject.nameToDescribedTrajectory.length; idx += 2) {
            classifier._nameToDescribedTrajectory.set(
                jsonObject.nameToDescribedTrajectory[idx],
                TrajectoryClass.Deserialize(jsonObject.nameToDescribedTrajectory[idx + 1], classifier._levenshteinAlphabet));
        }
        return classifier;
    }

    /**
     * Initialize a new empty TrajectorySet with auto-generated Alphabets.
     * VERY naive, need to be generating these things from known
     * sets. Better version later, probably eliminating this one.
     * @returns auto-generated TrajectorySet
     */
    public static Generate(): TrajectoryClassifier {
        let vecs = Vector3Alphabet.Generate(64, 256, 0.1, 0.001, [Vector3.Forward()]);

        let alphabet = new Levenshtein.Alphabet<number>(
            Array.from(Array(vecs.chars.length), (_, idx) => idx),
            (idx) => idx === 0 ? 0 : 1,
            (idx) => idx === 0 ? 0 : 1,
            (a, b) => Math.min(1 - Vector3.Dot(vecs.chars[a], vecs.chars[b]), 1));

        let trajectorySet = new TrajectoryClassifier();
        trajectorySet._vector3Alphabet = vecs;
        trajectorySet._levenshteinAlphabet = alphabet;
        return trajectorySet;
    }

    private constructor() {
        this._nameToDescribedTrajectory = new Map<string, TrajectoryClass>();
    }

    /**
     * Add a new Trajectory to the set with a given name.
     * @param trajectory new Trajectory to be added
     * @param classification name to which to add the Trajectory
     */
    public addTrajectoryToClassification(trajectory: Trajectory, classification: string): void {
        if (!this._nameToDescribedTrajectory.has(classification)) {
            this._nameToDescribedTrajectory.set(classification, new TrajectoryClass());
        }

        this._nameToDescribedTrajectory.get(classification)!.add(
            TrajectoryDescriptor.CreateFromTrajectory(
                trajectory,
                this._vector3Alphabet,
                this._levenshteinAlphabet));
    }

    /**
     * Remove a known named trajectory and all Trajectories associated with it.
     * @param classification name to remove
     * @returns whether anything was removed
     */
    public deleteClassification(classification: string): boolean {
        return this._nameToDescribedTrajectory.delete(classification);
    }

    /**
     * Attempt to recognize a Trajectory from among all the classifications
     * already known to the classifier.
     * @param trajectory Trajectory to be recognized
     * @returns classification of Trajectory if recognized, null otherwise
     */
    public classifyTrajectory(trajectory: Trajectory): Nullable<string> {
        let descriptor = TrajectoryDescriptor.CreateFromTrajectory(
            trajectory,
            this._vector3Alphabet,
            this._levenshteinAlphabet);

        let allowableMatches: string[] = [];
        this._nameToDescribedTrajectory.forEach((trajectoryClass, classification) => {
            if (trajectoryClass.getMatchCost(descriptor) < this._maximumAllowableMatchCost) {
                allowableMatches.push(classification);
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
