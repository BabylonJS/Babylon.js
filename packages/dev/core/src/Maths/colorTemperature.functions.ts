import { Clamp } from "./math.scalar.functions";
import { Matrix, Vector2, Vector3 } from "./math.vector.pure";

/**
 * Tabulated approximation of the Planckian locus in the CIE 1960 UCS (u, v) chromaticity diagram, together with
 * the local isotherm slope `t` used to offset a chromaticity away from the locus (the "tint" axis).
 * Source: Wyszecki, G. &amp; Stiles, W.S., "Color Science: Concepts and Methods, Quantitative Data and Formulae",
 * 2nd edition, John Wiley &amp; Sons, 1982, pp. 227-228.
 * Each row is [reciprocal megakelvin ("mired"), u, v, t].
 */
const PlanckianLocusTable: ReadonlyArray<readonly [number, number, number, number]> = [
    [0, 0.18006, 0.26352, -0.24341],
    [10, 0.18066, 0.26589, -0.25479],
    [20, 0.18133, 0.26846, -0.26876],
    [30, 0.18208, 0.27119, -0.28539],
    [40, 0.18293, 0.27407, -0.3047],
    [50, 0.18388, 0.27709, -0.32675],
    [60, 0.18494, 0.28021, -0.35156],
    [70, 0.18611, 0.28342, -0.37915],
    [80, 0.1874, 0.28668, -0.40955],
    [90, 0.1888, 0.28997, -0.44278],
    [100, 0.19032, 0.29326, -0.47888],
    [125, 0.19462, 0.30141, -0.58204],
    [150, 0.19962, 0.30921, -0.70471],
    [175, 0.20525, 0.31647, -0.84901],
    [200, 0.21142, 0.32312, -1.0182],
    [225, 0.21807, 0.32909, -1.2168],
    [250, 0.22511, 0.33439, -1.4512],
    [275, 0.23247, 0.33904, -1.7298],
    [300, 0.2401, 0.34308, -2.0637],
    [325, 0.24792, 0.34655, -2.4681],
    [350, 0.25591, 0.34951, -2.9641],
    [375, 0.264, 0.352, -3.5814],
    [400, 0.27218, 0.35407, -4.3633],
    [425, 0.28039, 0.35577, -5.3762],
    [450, 0.28863, 0.35714, -6.7262],
    [475, 0.29685, 0.35823, -8.5955],
    [500, 0.30505, 0.35907, -11.324],
    [525, 0.3132, 0.35968, -15.628],
    [550, 0.32129, 0.36011, -23.325],
    [575, 0.32931, 0.36038, -40.77],
    [600, 0.33724, 0.36051, -116.45],
];

// `Matrix.FromArray` reads its 16 values column-major, so each 3x3 (translation-free, identity in the last
// row/column) matrix below is written out column-by-column rather than row-by-row.

/**
 * The Bradford cone-response matrix used for chromatic adaptation.
 */
// prettier-ignore
const BradfordMatrix = Matrix.FromArray([
    0.8951, -0.7502, 0.0389, 0,
    0.2664, 1.7135, -0.0685, 0,
    -0.1614, 0.0367, 1.0296, 0,
    0, 0, 0, 1,
]);

const InverseBradfordMatrix = Matrix.Invert(BradfordMatrix);

/**
 * The sRGB / Rec.709 (D65) linear RGB to CIE XYZ matrix.
 */
// prettier-ignore
const RgbToXyzD65 = Matrix.FromArray([
    0.4124564, 0.2126729, 0.0193339, 0,
    0.3575761, 0.7151522, 0.119192, 0,
    0.1804375, 0.072175, 0.9503041, 0,
    0, 0, 0, 1,
]);

/**
 * The CIE XYZ to sRGB / Rec.709 (D65) linear RGB matrix.
 */
// prettier-ignore
const XyzToRgbD65 = Matrix.FromArray([
    3.2404542, -0.969266, 0.0556434, 0,
    -1.5371385, 1.8760108, -0.2040259, 0,
    -0.4985314, 0.041556, 1.0572252, 0,
    0, 0, 0, 1,
]);

/**
 * Computes the Bradford chromatic-adaptation matrix that maps CIE XYZ tristimulus values referenced to
 * `sourceWhiteXYZ` onto the equivalent values referenced to `destWhiteXYZ`.
 * @param sourceWhiteXYZ The CIE XYZ (Y = 1) coordinates of the source reference white
 * @param destWhiteXYZ The CIE XYZ (Y = 1) coordinates of the destination reference white
 * @returns A matrix mapping source-referenced XYZ to destination-referenced XYZ
 */
function BradfordAdapt(sourceWhiteXYZ: Vector3, destWhiteXYZ: Vector3): Matrix {
    const sourceLMS = Vector3.TransformNormal(sourceWhiteXYZ, BradfordMatrix);
    const destLMS = Vector3.TransformNormal(destWhiteXYZ, BradfordMatrix);

    // prettier-ignore
    const scale = Matrix.FromArray([
        destLMS.x / sourceLMS.x, 0, 0, 0,
        0, destLMS.y / sourceLMS.y, 0, 0,
        0, 0, destLMS.z / sourceLMS.z, 0,
        0, 0, 0, 1,
    ]);

    // Conventional adapt = InverseBradfordMatrix * scale * BradfordMatrix. Matrix.multiply composes in the
    // opposite order to conventional matrix notation (`A.multiply(B)` computes `B x A`), so the calls below are
    // deliberately written back-to-front relative to how the product reads mathematically.
    const scaledByBradford = BradfordMatrix.multiply(scale);
    return scaledByBradford.multiply(InverseBradfordMatrix);
}

/**
 * Converts a correlated color temperature and tint offset into the CIE XYZ (Y = 1) coordinates of the
 * corresponding illuminant white point, using a tabulated approximation of the Planckian locus in CIE 1960 UCS
 * (u, v) space.
 * @param temperatureKelvin The correlated color temperature of the illuminant, in Kelvin
 * @param tint An offset perpendicular to the Planckian locus (the green/magenta axis), in the range [-150, 150]
 * @returns The CIE XYZ (Y = 1) coordinates of the illuminant white point
 */
export function TemperatureTintToXyz(temperatureKelvin: number, tint: number): Vector3 {
    const mired = Clamp(1e6 / temperatureKelvin, PlanckianLocusTable[0][0], PlanckianLocusTable[PlanckianLocusTable.length - 1][0]);

    // Binary search for the table row pair bracketing `mired` (the table is sorted ascending by mired).
    let low = 0;
    let high = PlanckianLocusTable.length - 1;
    while (high - low > 1) {
        const mid = (low + high) >> 1;
        if (PlanckianLocusTable[mid][0] <= mired) {
            low = mid;
        } else {
            high = mid;
        }
    }
    const index = low;

    const [lowMired, lowU, lowV, lowT] = PlanckianLocusTable[index];
    const [highMired, highU, highV, highT] = PlanckianLocusTable[index + 1];
    const f = (mired - lowMired) / (highMired - lowMired);

    const uv = Vector2.Lerp(new Vector2(lowU, lowV), new Vector2(highU, highV), f);

    const isothermLow = Vector2.Normalize(new Vector2(1, lowT));
    const isothermHigh = Vector2.Normalize(new Vector2(1, highT));
    const isotherm = Vector2.Normalize(Vector2.Lerp(isothermLow, isothermHigh, f));

    const clampedTint = Clamp(tint, -150, 150);
    uv.subtractInPlace(isotherm.scale(clampedTint / 3000));

    // CIE 1960 (u, v) -> CIE xyY (Y = 1) -> CIE XYZ.
    const denom = 2 * uv.x - 8 * uv.y + 4;
    const x = (3 * uv.x) / denom;
    const y = (2 * uv.y) / denom;

    return new Vector3(x / y, 1, (1 - x - y) / y);
}

/**
 * The working color space's reference white, expressed as the CIE XYZ (Y = 1) point that this module's own
 * Planckian-locus approximation assigns to 6500 K with no tint offset. Using this (rather than the separately
 * standardized CIE Standard Illuminant D65 chromaticity, which is a daylight-locus point and not exactly on the
 * Planckian locus) guarantees that `GetWhiteBalanceMatrix(6500, 0)` is the identity matrix - i.e. that the default
 * "no adjustment" temperature/tint values are a true no-op - and keeps the whole computation self-consistent.
 */
const ReferenceWhiteXyz = TemperatureTintToXyz(6500, 0);

/**
 * Computes the linear RGB (sRGB / Rec.709 primaries) color-correction matrix that performs white balance for the
 * given illuminant, by chromatically adapting its white point (see {@link TemperatureTintToXyz}) onto the working
 * color space's reference white using the Bradford transform.
 * @param temperatureKelvin The correlated color temperature of the illuminant to neutralize, in Kelvin
 * @param tint An offset perpendicular to the Planckian locus (the green/magenta axis), in the range [-150, 150]
 * @returns A column-major 3x3 matrix (9 values), ready to be bound as a `mat3` shader uniform
 */
export function GetWhiteBalanceMatrix(temperatureKelvin: number, tint: number): Float32Array {
    const targetWhiteXYZ = TemperatureTintToXyz(temperatureKelvin, tint);
    const adapt = BradfordAdapt(targetWhiteXYZ, ReferenceWhiteXyz);

    // Conventional finalMatrix = XyzToRgbD65 * adapt * RgbToXyzD65 (see the note in BradfordAdapt about the
    // reversed argument order Matrix.multiply expects).
    const adaptedFromRgb = RgbToXyzD65.multiply(adapt);
    const finalMatrix = adaptedFromRgb.multiply(XyzToRgbD65);

    // `Matrix` stores its values column-major, which is exactly the layout GLSL/WGSL `mat3` uniforms expect;
    // extract the upper-left 3x3 block directly, no transpose needed.
    const m = finalMatrix.m;
    return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
}
