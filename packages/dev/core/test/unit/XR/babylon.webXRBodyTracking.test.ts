/**
 * @vitest-environment jsdom
 *
 * Offline tests for WebXR Body Tracking bone-local computation.
 *
 * Uses a full 83-joint snapshot captured on Quest 3 with a Mixamo model.
 * The snapshot includes both RHS and LHS matrices, the real meshWorldMatrix,
 * and the actual jointHasBone / jointParentJointIdx arrays from setBodyMesh.
 */
import { type Engine } from "core/Engines/engine";
import { NullEngine } from "core/Engines/nullEngine";
import { Matrix, Quaternion, Vector3 } from "core/Maths/math.vector";
import { Scene } from "core/scene";
import { Skeleton } from "core/Bones/skeleton";
import { Bone } from "core/Bones/bone";
import { TransformNode } from "core/Meshes/transformNode";
import { Mesh } from "core/Meshes/mesh";
import { MixamoRigMapping, MixamoAimChildOverrides, WebXRBodyJoint, BodyJointParentIndex, WebXRBodyTracking, _ResolveMixamoRigMapping } from "core/XR/features/WebXRBodyTracking";
import { WebXRFeatureName, WebXRFeaturesManager } from "core/XR/webXRFeaturesManager";
import { WebXRSessionManager } from "core/XR/webXRSessionManager";
import { beforeAll, beforeEach, afterEach, describe, it, expect, vi } from "vitest";

// ────────────────────────────────────────────────────────────────────────────
// Full snapshot from Quest 3 (captured via snapshotFrameToClipboard)
// ────────────────────────────────────────────────────────────────────────────

const BODY_JOINT_COUNT = 83;

// prettier-ignore
const JOINT_NAMES = ["hips","spine-lower","spine-middle","spine-upper","chest","neck","head","left-shoulder","left-scapula","left-arm-upper","left-arm-lower","left-hand-wrist-twist","right-shoulder","right-scapula","right-arm-upper","right-arm-lower","right-hand-wrist-twist","left-hand-palm","left-hand-wrist","left-hand-thumb-metacarpal","left-hand-thumb-phalanx-proximal","left-hand-thumb-phalanx-distal","left-hand-thumb-tip","left-hand-index-metacarpal","left-hand-index-phalanx-proximal","left-hand-index-phalanx-intermediate","left-hand-index-phalanx-distal","left-hand-index-tip","left-hand-middle-metacarpal","left-hand-middle-phalanx-proximal","left-hand-middle-phalanx-intermediate","left-hand-middle-phalanx-distal","left-hand-middle-tip","left-hand-ring-metacarpal","left-hand-ring-phalanx-proximal","left-hand-ring-phalanx-intermediate","left-hand-ring-phalanx-distal","left-hand-ring-tip","left-hand-little-metacarpal","left-hand-little-phalanx-proximal","left-hand-little-phalanx-intermediate","left-hand-little-phalanx-distal","left-hand-little-tip","right-hand-palm","right-hand-wrist","right-hand-thumb-metacarpal","right-hand-thumb-phalanx-proximal","right-hand-thumb-phalanx-distal","right-hand-thumb-tip","right-hand-index-metacarpal","right-hand-index-phalanx-proximal","right-hand-index-phalanx-intermediate","right-hand-index-phalanx-distal","right-hand-index-tip","right-hand-middle-metacarpal","right-hand-middle-phalanx-proximal","right-hand-middle-phalanx-intermediate","right-hand-middle-phalanx-distal","right-hand-middle-tip","right-hand-ring-metacarpal","right-hand-ring-phalanx-proximal","right-hand-ring-phalanx-intermediate","right-hand-ring-phalanx-distal","right-hand-ring-tip","right-hand-little-metacarpal","right-hand-little-phalanx-proximal","right-hand-little-phalanx-intermediate","right-hand-little-phalanx-distal","right-hand-little-tip","left-upper-leg","left-lower-leg","left-foot-ankle-twist","left-foot-ankle","left-foot-subtalar","left-foot-transverse","left-foot-ball","right-upper-leg","right-lower-leg","right-foot-ankle-twist","right-foot-ankle","right-foot-subtalar","right-foot-transverse","right-foot-ball"];

// prettier-ignore
const SNAPSHOT_RHS = new Float32Array([-0.036,-0.985,-0.168,0,-0.113,0.171,-0.979,0,0.993,-0.016,-0.117,0,0.006,0.586,2.035,1,-0.029,-0.988,-0.153,0,-0.111,0.155,-0.982,0,0.993,-0.011,-0.114,0,0.009,0.596,2.058,1,-0.014,-0.997,-0.074,0,-0.093,0.075,-0.993,0,0.996,-0.007,-0.093,0,0.01,0.67,2.06,1,-0.006,-0.996,-0.094,0,-0.111,0.094,-0.989,0,0.994,0.005,-0.111,0,0.012,0.743,2.08,1,0.001,-0.995,-0.098,0,-0.142,0.097,-0.985,0,0.99,0.015,-0.141,0,0.012,0.867,2.079,1,-0.008,-0.993,0.117,0,0.066,-0.117,-0.991,0,0.998,0,0.066,0,0.006,0.951,2.049,1,0.005,-0.996,-0.084,0,0.066,0.084,-0.994,0,0.998,0,0.066,0,0.007,0.998,2.044,1,0.844,0.26,-0.469,0,-0.493,0.03,-0.87,0,-0.212,0.965,0.153,0,-0.017,0.909,2.017,1,0.933,0.27,-0.238,0,-0.292,0.181,-0.939,0,-0.211,0.946,0.248,0,-0.107,0.905,2.086,1,0.434,0.775,0.46,0,-0.166,0.571,-0.804,0,-0.886,0.273,0.376,0,-0.112,0.883,2.082,1,0.298,-0.288,0.91,0,0.357,0.918,0.173,0,-0.886,0.273,0.376,0,-0.19,0.744,2,1,0.226,-0.223,0.948,0,-0.427,0.852,0.303,0,-0.876,-0.473,0.098,0,-0.24,0.789,1.852,1,0.948,-0.177,0.265,0,-0.281,-0.069,0.957,0,-0.151,-0.982,-0.115,0,0.021,0.91,2.012,1,0.982,-0.187,0.019,0,-0.057,-0.201,0.978,0,-0.179,-0.962,-0.208,0,0.124,0.914,2.059,1,0.362,-0.591,-0.721,0,0.017,-0.769,0.639,0,-0.932,-0.243,-0.269,0,0.13,0.893,2.054,1,0.216,0.222,-0.951,0,0.291,-0.944,-0.154,0,-0.932,-0.243,-0.269,0,0.195,0.787,1.925,1,0.138,0.16,-0.977,0,-0.552,-0.807,-0.21,0,-0.823,0.568,-0.023,0,0.232,0.822,1.77,1,0.229,-0.364,0.903,0,0.971,0.15,-0.186,0,-0.068,0.919,0.388,0,-0.254,0.814,1.817,1,0.229,-0.364,0.903,0,0.971,0.15,-0.186,0,-0.068,0.919,0.388,0,-0.247,0.804,1.84,1,-0.253,-0.809,0.531,0,0.155,-0.575,-0.803,0,0.955,-0.121,0.271,0,-0.246,0.831,1.824,1,-0.064,-0.896,0.438,0,0.34,-0.433,-0.835,0,0.938,0.096,0.332,0,-0.24,0.849,1.813,1,-0.158,-0.941,0.298,0,0.192,-0.325,-0.926,0,0.969,-0.089,0.232,0,-0.239,0.87,1.803,1,-0.158,-0.941,0.298,0,0.192,-0.325,-0.926,0,0.969,-0.089,0.232,0,-0.238,0.88,1.798,1,0.229,-0.364,0.903,0,0.971,0.15,-0.186,0,-0.068,0.919,0.388,0,-0.25,0.825,1.822,1,0.098,-0.34,0.935,0,0.995,0.047,-0.087,0,-0.015,0.939,0.343,0,-0.263,0.842,1.788,1,0.047,-0.331,0.942,0,0.997,0.079,-0.021,0,-0.067,0.94,0.334,0,-0.265,0.851,1.764,1,0.141,-0.27,0.953,0,0.984,0.141,-0.105,0,-0.106,0.953,0.285,0,-0.266,0.856,1.749,1,0.141,-0.27,0.953,0,0.984,0.141,-0.105,0,-0.106,0.953,0.285,0,-0.266,0.859,1.741,1,0.229,-0.364,0.903,0,0.971,0.15,-0.186,0,-0.068,0.919,0.388,0,-0.251,0.818,1.821,1,-0.282,-0.312,0.907,0,0.954,0.011,0.301,0,-0.104,0.95,0.294,0,-0.265,0.828,1.783,1,-0.634,-0.292,0.716,0,0.764,-0.089,0.639,0,-0.123,0.952,0.28,0,-0.256,0.837,1.757,1,-0.784,-0.277,0.556,0,0.596,-0.086,0.798,0,-0.173,0.957,0.233,0,-0.245,0.843,1.744,1,-0.784,-0.277,0.556,0,0.596,-0.086,0.798,0,-0.173,0.957,0.233,0,-0.239,0.845,1.737,1,0.229,-0.364,0.903,0,0.971,0.15,-0.186,0,-0.068,0.919,0.388,0,-0.251,0.803,1.815,1,-0.272,-0.334,0.902,0,0.915,0.199,0.35,0,-0.296,0.921,0.252,0,-0.26,0.815,1.782,1,-0.615,-0.407,0.675,0,0.703,0.103,0.703,0,-0.355,0.908,0.223,0,-0.253,0.824,1.758,1,-0.802,-0.468,0.371,0,0.448,-0.06,0.892,0,-0.395,0.882,0.258,0,-0.242,0.831,1.746,1,-0.802,-0.468,0.371,0,0.448,-0.06,0.892,0,-0.395,0.882,0.258,0,-0.236,0.835,1.74,1,0.129,-0.15,0.98,0,0.854,0.519,-0.033,0,-0.503,0.842,0.195,0,-0.249,0.798,1.813,1,-0.241,-0.403,0.883,0,0.842,0.367,0.397,0,-0.484,0.838,0.251,0,-0.253,0.803,1.783,1,-0.55,-0.463,0.695,0,0.65,0.285,0.705,0,-0.524,0.839,0.144,0,-0.248,0.811,1.765,1,-0.686,-0.607,0.402,0,0.448,0.083,0.89,0,-0.573,0.791,0.214,0,-0.241,0.818,1.755,1,-0.686,-0.607,0.402,0,0.448,0.083,0.89,0,-0.573,0.791,0.214,0,-0.237,0.821,1.751,1,0.326,0.204,-0.923,0,0.942,-0.15,0.299,0,-0.077,-0.967,-0.241,0,0.247,0.841,1.733,1,0.326,0.204,-0.923,0,0.942,-0.15,0.299,0,-0.077,-0.967,-0.241,0,0.237,0.835,1.757,1,-0.299,0.448,-0.842,0,-0.246,0.817,0.522,0,0.922,0.364,-0.134,0,0.235,0.858,1.734,1,-0.14,0.241,-0.96,0,-0.117,0.959,0.258,0,0.983,0.148,-0.106,0,0.228,0.868,1.716,1,-0.109,-0.201,-0.973,0,-0.366,0.919,-0.149,0,0.924,0.34,-0.174,0,0.225,0.873,1.694,1,-0.109,-0.201,-0.973,0,-0.366,0.919,-0.149,0,0.924,0.34,-0.174,0,0.223,0.876,1.683,1,0.326,0.204,-0.923,0,0.942,-0.15,0.299,0,-0.077,-0.967,-0.241,0,0.24,0.852,1.734,1,-0.21,0.133,-0.969,0,0.974,0.111,-0.197,0,0.081,-0.985,-0.153,0,0.259,0.864,1.7,1,-0.886,0.03,-0.463,0,0.462,0.129,-0.877,0,0.034,-0.991,-0.128,0,0.254,0.867,1.676,1,-0.998,-0.063,-0.005,0,0.001,0.073,-0.997,0,0.063,-0.995,-0.073,0,0.239,0.868,1.668,1,-0.998,-0.063,-0.005,0,0.001,0.073,-0.997,0,0.063,-0.995,-0.073,0,0.232,0.868,1.664,1,0.326,0.204,-0.923,0,0.942,-0.15,0.299,0,-0.077,-0.967,-0.241,0,0.243,0.844,1.735,1,-0.185,0.169,-0.968,0,0.975,-0.091,-0.202,0,-0.122,-0.981,-0.148,0,0.261,0.849,1.698,1,-0.553,0.192,-0.811,0,0.821,-0.041,-0.569,0,-0.143,-0.981,-0.135,0,0.255,0.854,1.67,1,-0.717,0.209,-0.665,0,0.669,-0.065,-0.741,0,-0.198,-0.976,-0.093,0,0.245,0.858,1.655,1,-0.717,0.209,-0.665,0,0.669,-0.065,-0.741,0,-0.198,-0.976,-0.093,0,0.24,0.86,1.648,1,0.326,0.204,-0.923,0,0.942,-0.15,0.299,0,-0.077,-0.967,-0.241,0,0.243,0.831,1.732,1,-0.175,0.192,-0.966,0,0.954,-0.209,-0.214,0,-0.243,-0.959,-0.147,0,0.256,0.836,1.699,1,-0.543,0.281,-0.791,0,0.782,-0.173,-0.599,0,-0.305,-0.944,-0.126,0,0.251,0.841,1.673,1,-0.765,0.377,-0.522,0,0.546,-0.048,-0.836,0,-0.341,-0.925,-0.169,0,0.241,0.846,1.659,1,-0.765,0.377,-0.522,0,0.546,-0.048,-0.836,0,-0.341,-0.925,-0.169,0,0.237,0.849,1.652,1,0.223,-0.016,-0.975,0,0.822,-0.534,0.197,0,-0.524,-0.845,-0.106,0,0.242,0.825,1.731,1,-0.141,0.262,-0.955,0,0.855,-0.454,-0.251,0,-0.499,-0.852,-0.16,0,0.248,0.825,1.701,1,-0.463,0.362,-0.809,0,0.696,-0.417,-0.585,0,-0.549,-0.834,-0.058,0,0.245,0.83,1.681,1,-0.618,0.555,-0.557,0,0.521,-0.242,-0.819,0,-0.589,-0.796,-0.14,0,0.239,0.835,1.67,1,-0.618,0.555,-0.557,0,0.521,-0.242,-0.819,0,-0.589,-0.796,-0.14,0,0.236,0.838,1.665,1,0.132,0.87,0.475,0,0.151,-0.492,0.858,0,0.98,-0.042,-0.196,0,-0.048,0.569,2.042,1,-0.051,0.9,-0.434,0,0.191,0.435,0.88,0,0.98,-0.038,-0.194,0,-0.083,0.339,1.915,1,-0.145,0.895,-0.421,0,0.138,0.44,0.888,0,0.98,0.07,-0.187,0,-0.068,0.084,2.037,1,-0.329,-0.124,-0.936,0,-0.257,0.966,-0.038,0,0.909,0.228,-0.35,0,-0.068,0.084,2.037,1,-0.492,0.534,-0.688,0,0.086,0.816,0.572,0,0.866,0.223,-0.447,0,-0.073,0.061,2.038,1,-0.396,0.129,-0.909,0,-0.019,0.989,0.149,0,0.918,0.076,-0.389,0,-0.083,0.063,1.998,1,-0.452,-0.115,-0.885,0,-0.075,0.993,-0.091,0,0.889,0.026,-0.457,0,-0.097,0.038,1.954,1,-0.008,-0.853,-0.523,0,-0.085,0.521,-0.849,0,0.996,0.038,-0.077,0,0.059,0.568,2.029,1,0.063,-0.912,0.406,0,-0.058,-0.409,-0.911,0,0.996,0.034,-0.078,0,0.057,0.342,1.89,1,-0.03,-0.907,0.419,0,-0.069,-0.416,-0.907,0,0.997,-0.056,-0.05,0,0.075,0.084,2.004,1,-0.094,0.131,0.987,0,-0.232,-0.967,0.106,0,0.968,-0.219,0.121,0,0.075,0.084,2.004,1,-0.306,-0.531,0.79,0,-0.047,-0.821,-0.569,0,0.951,-0.211,0.227,0,0.08,0.061,2.004,1,-0.164,-0.123,0.979,0,-0.05,-0.99,-0.133,0,0.985,-0.071,0.156,0,0.08,0.062,1.963,1,-0.227,0.06,0.972,0,-0.033,-0.998,0.054,0,0.973,-0.02,0.229,0,0.083,0.036,1.917,1]);

// prettier-ignore
const SNAPSHOT_LHS = new Float32Array([-0.036,-0.985,0.168,0,-0.113,0.171,0.979,0,-0.993,0.016,-0.117,0,0.006,0.586,-2.035,1,-0.029,-0.988,0.153,0,-0.111,0.155,0.982,0,-0.993,0.011,-0.114,0,0.009,0.596,-2.058,1,-0.014,-0.997,0.074,0,-0.093,0.075,0.993,0,-0.996,0.007,-0.093,0,0.01,0.67,-2.06,1,-0.006,-0.996,0.094,0,-0.111,0.094,0.989,0,-0.994,-0.005,-0.111,0,0.012,0.743,-2.08,1,0.001,-0.995,0.098,0,-0.142,0.097,0.985,0,-0.99,-0.015,-0.141,0,0.012,0.867,-2.079,1,-0.008,-0.993,-0.117,0,0.066,-0.117,0.991,0,-0.998,0,0.066,0,0.006,0.951,-2.049,1,0.005,-0.996,0.084,0,0.066,0.084,0.994,0,-0.998,0,0.066,0,0.007,0.998,-2.044,1,0.844,0.26,0.469,0,-0.493,0.03,0.87,0,0.212,-0.965,0.153,0,-0.017,0.909,-2.017,1,0.933,0.27,0.238,0,-0.292,0.181,0.939,0,0.211,-0.946,0.248,0,-0.107,0.905,-2.086,1,0.434,0.775,-0.46,0,-0.166,0.571,0.804,0,0.886,-0.273,0.376,0,-0.112,0.883,-2.082,1,0.298,-0.288,-0.91,0,0.357,0.918,-0.173,0,0.886,-0.273,0.376,0,-0.19,0.744,-2,1,0.226,-0.223,-0.948,0,-0.427,0.852,-0.303,0,0.876,0.473,0.098,0,-0.24,0.789,-1.852,1,0.948,-0.177,-0.265,0,-0.281,-0.069,-0.957,0,0.151,0.982,-0.115,0,0.021,0.91,-2.012,1,0.982,-0.187,-0.019,0,-0.057,-0.201,-0.978,0,0.179,0.962,-0.208,0,0.124,0.914,-2.059,1,0.362,-0.591,0.721,0,0.017,-0.769,-0.639,0,0.932,0.243,-0.269,0,0.13,0.893,-2.054,1,0.216,0.222,0.951,0,0.291,-0.944,0.154,0,0.932,0.243,-0.269,0,0.195,0.787,-1.925,1,0.138,0.16,0.977,0,-0.552,-0.807,0.21,0,0.823,-0.568,-0.023,0,0.232,0.822,-1.77,1,0.229,-0.364,-0.903,0,0.971,0.15,0.186,0,0.068,-0.919,0.388,0,-0.254,0.814,-1.817,1,0.229,-0.364,-0.903,0,0.971,0.15,0.186,0,0.068,-0.919,0.388,0,-0.247,0.804,-1.84,1,-0.253,-0.809,-0.531,0,0.155,-0.575,0.803,0,-0.955,0.121,0.271,0,-0.246,0.831,-1.824,1,-0.064,-0.896,-0.438,0,0.34,-0.433,0.835,0,-0.938,-0.096,0.332,0,-0.24,0.849,-1.813,1,-0.158,-0.941,-0.298,0,0.192,-0.325,0.926,0,-0.969,0.089,0.232,0,-0.239,0.87,-1.803,1,-0.158,-0.941,-0.298,0,0.192,-0.325,0.926,0,-0.969,0.089,0.232,0,-0.238,0.88,-1.798,1,0.229,-0.364,-0.903,0,0.971,0.15,0.186,0,0.068,-0.919,0.388,0,-0.25,0.825,-1.822,1,0.098,-0.34,-0.935,0,0.995,0.047,0.087,0,0.015,-0.939,0.343,0,-0.263,0.842,-1.788,1,0.047,-0.331,-0.942,0,0.997,0.079,0.021,0,0.067,-0.94,0.334,0,-0.265,0.851,-1.764,1,0.141,-0.27,-0.953,0,0.984,0.141,0.105,0,0.106,-0.953,0.285,0,-0.266,0.856,-1.749,1,0.141,-0.27,-0.953,0,0.984,0.141,0.105,0,0.106,-0.953,0.285,0,-0.266,0.859,-1.741,1,0.229,-0.364,-0.903,0,0.971,0.15,0.186,0,0.068,-0.919,0.388,0,-0.251,0.818,-1.821,1,-0.282,-0.312,-0.907,0,0.954,0.011,-0.301,0,0.104,-0.95,0.294,0,-0.265,0.828,-1.783,1,-0.634,-0.292,-0.716,0,0.764,-0.089,-0.639,0,0.123,-0.952,0.28,0,-0.256,0.837,-1.757,1,-0.784,-0.277,-0.556,0,0.596,-0.086,-0.798,0,0.173,-0.957,0.233,0,-0.245,0.843,-1.744,1,-0.784,-0.277,-0.556,0,0.596,-0.086,-0.798,0,0.173,-0.957,0.233,0,-0.239,0.845,-1.737,1,0.229,-0.364,-0.903,0,0.971,0.15,0.186,0,0.068,-0.919,0.388,0,-0.251,0.803,-1.815,1,-0.272,-0.334,-0.902,0,0.915,0.199,-0.35,0,0.296,-0.921,0.252,0,-0.26,0.815,-1.782,1,-0.615,-0.407,-0.675,0,0.703,0.103,-0.703,0,0.355,-0.908,0.223,0,-0.253,0.824,-1.758,1,-0.802,-0.468,-0.371,0,0.448,-0.06,-0.892,0,0.395,-0.882,0.258,0,-0.242,0.831,-1.746,1,-0.802,-0.468,-0.371,0,0.448,-0.06,-0.892,0,0.395,-0.882,0.258,0,-0.236,0.835,-1.74,1,0.129,-0.15,-0.98,0,0.854,0.519,0.033,0,0.503,-0.842,0.195,0,-0.249,0.798,-1.813,1,-0.241,-0.403,-0.883,0,0.842,0.367,-0.397,0,0.484,-0.838,0.251,0,-0.253,0.803,-1.783,1,-0.55,-0.463,-0.695,0,0.65,0.285,-0.705,0,0.524,-0.839,0.144,0,-0.248,0.811,-1.765,1,-0.686,-0.607,-0.402,0,0.448,0.083,-0.89,0,0.573,-0.791,0.214,0,-0.241,0.818,-1.755,1,-0.686,-0.607,-0.402,0,0.448,0.083,-0.89,0,0.573,-0.791,0.214,0,-0.237,0.821,-1.751,1,0.326,0.204,0.923,0,0.942,-0.15,-0.299,0,0.077,0.967,-0.241,0,0.247,0.841,-1.733,1,0.326,0.204,0.923,0,0.942,-0.15,-0.299,0,0.077,0.967,-0.241,0,0.237,0.835,-1.757,1,-0.299,0.448,0.842,0,-0.246,0.817,-0.522,0,-0.922,-0.364,-0.134,0,0.235,0.858,-1.734,1,-0.14,0.241,0.96,0,-0.117,0.959,-0.258,0,-0.983,-0.148,-0.106,0,0.228,0.868,-1.716,1,-0.109,-0.201,0.973,0,-0.366,0.919,0.149,0,-0.924,-0.34,-0.174,0,0.225,0.873,-1.694,1,-0.109,-0.201,0.973,0,-0.366,0.919,0.149,0,-0.924,-0.34,-0.174,0,0.223,0.876,-1.683,1,0.326,0.204,0.923,0,0.942,-0.15,-0.299,0,0.077,0.967,-0.241,0,0.24,0.852,-1.734,1,-0.21,0.133,0.969,0,0.974,0.111,0.197,0,-0.081,0.985,-0.153,0,0.259,0.864,-1.7,1,-0.886,0.03,0.463,0,0.462,0.129,0.877,0,-0.034,0.991,-0.128,0,0.254,0.867,-1.676,1,-0.998,-0.063,0.005,0,0.001,0.073,0.997,0,-0.063,0.995,-0.073,0,0.239,0.868,-1.668,1,-0.998,-0.063,0.005,0,0.001,0.073,0.997,0,-0.063,0.995,-0.073,0,0.232,0.868,-1.664,1,0.326,0.204,0.923,0,0.942,-0.15,-0.299,0,0.077,0.967,-0.241,0,0.243,0.844,-1.735,1,-0.185,0.169,0.968,0,0.975,-0.091,0.202,0,0.122,0.981,-0.148,0,0.261,0.849,-1.698,1,-0.553,0.192,0.811,0,0.821,-0.041,0.569,0,0.143,0.981,-0.135,0,0.255,0.854,-1.67,1,-0.717,0.209,0.665,0,0.669,-0.065,0.741,0,0.198,0.976,-0.093,0,0.245,0.858,-1.655,1,-0.717,0.209,0.665,0,0.669,-0.065,0.741,0,0.198,0.976,-0.093,0,0.24,0.86,-1.648,1,0.326,0.204,0.923,0,0.942,-0.15,-0.299,0,0.077,0.967,-0.241,0,0.243,0.831,-1.732,1,-0.175,0.192,0.966,0,0.954,-0.209,0.214,0,0.243,0.959,-0.147,0,0.256,0.836,-1.699,1,-0.543,0.281,0.791,0,0.782,-0.173,0.599,0,0.305,0.944,-0.126,0,0.251,0.841,-1.673,1,-0.765,0.377,0.522,0,0.546,-0.048,0.836,0,0.341,0.925,-0.169,0,0.241,0.846,-1.659,1,-0.765,0.377,0.522,0,0.546,-0.048,0.836,0,0.341,0.925,-0.169,0,0.237,0.849,-1.652,1,0.223,-0.016,0.975,0,0.822,-0.534,-0.197,0,0.524,0.845,-0.106,0,0.242,0.825,-1.731,1,-0.141,0.262,0.955,0,0.855,-0.454,0.251,0,0.499,0.852,-0.16,0,0.248,0.825,-1.701,1,-0.463,0.362,0.809,0,0.696,-0.417,0.585,0,0.549,0.834,-0.058,0,0.245,0.83,-1.681,1,-0.618,0.555,0.557,0,0.521,-0.242,0.819,0,0.589,0.796,-0.14,0,0.239,0.835,-1.67,1,-0.618,0.555,0.557,0,0.521,-0.242,0.819,0,0.589,0.796,-0.14,0,0.236,0.838,-1.665,1,0.132,0.87,-0.475,0,0.151,-0.492,-0.858,0,-0.98,0.042,-0.196,0,-0.048,0.569,-2.042,1,-0.051,0.9,0.434,0,0.191,0.435,-0.88,0,-0.98,0.038,-0.194,0,-0.083,0.339,-1.915,1,-0.145,0.895,0.421,0,0.138,0.44,-0.888,0,-0.98,-0.07,-0.187,0,-0.068,0.084,-2.037,1,-0.329,-0.124,0.936,0,-0.257,0.966,0.038,0,-0.909,-0.228,-0.35,0,-0.068,0.084,-2.037,1,-0.492,0.534,0.688,0,0.086,0.816,-0.572,0,-0.866,-0.223,-0.447,0,-0.073,0.061,-2.038,1,-0.396,0.129,0.909,0,-0.019,0.989,-0.149,0,-0.918,-0.076,-0.389,0,-0.083,0.063,-1.998,1,-0.452,-0.115,0.885,0,-0.075,0.993,0.091,0,-0.889,-0.026,-0.457,0,-0.097,0.038,-1.954,1,-0.008,-0.853,0.523,0,-0.085,0.521,0.849,0,-0.996,-0.038,-0.077,0,0.059,0.568,-2.029,1,0.063,-0.912,-0.406,0,-0.058,-0.409,0.911,0,-0.996,-0.034,-0.078,0,0.057,0.342,-1.89,1,-0.03,-0.907,-0.419,0,-0.069,-0.416,0.907,0,-0.997,0.056,-0.05,0,0.075,0.084,-2.004,1,-0.094,0.131,-0.987,0,-0.232,-0.967,-0.106,0,-0.968,0.219,0.121,0,0.075,0.084,-2.004,1,-0.306,-0.531,-0.79,0,-0.047,-0.821,0.569,0,-0.951,0.211,0.227,0,0.08,0.061,-2.004,1,-0.164,-0.123,-0.979,0,-0.05,-0.99,0.133,0,-0.985,0.071,0.156,0,0.08,0.062,-1.963,1,-0.227,0.06,-0.972,0,-0.033,-0.998,-0.054,0,-0.973,0.02,0.229,0,0.083,0.036,-1.917,1]);

// Real mesh world matrix from the snapshot (Mixamo model with __root__ node)
// prettier-ignore
const MESH_WORLD_MATRIX = Matrix.FromArray([-0.01,0,0,0, 0,0,-0.01,0, 0,-0.01,0,0, 0,0,0,1]);

// Real jointHasBone from setBodyMesh (Mixamo rig mapping)
// prettier-ignore
const JOINT_HAS_BONE: boolean[] = [true,true,true,true,false,true,true,true,false,true,true,false,true,false,true,true,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,false,true,true,false,true,false,false,false,true,true,false,true,false,false,false];

// Real jointParentJointIdx from setBodyMesh (ancestor walk through skeleton hierarchy)
// prettier-ignore
const JOINT_PARENT_IDX: number[] = [-1,0,1,2,-1,3,5,3,-1,7,9,-1,3,-1,12,14,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,-1,0,69,-1,70,-1,-1,-1,0,76,-1,77,-1,-1,-1];

/** Indices of all mapped joints (where jointHasBone is true) */
const MAPPED_JOINTS = JOINT_HAS_BONE.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);

// ────────────────────────────────────────────────────────────────────────────
// Helpers — replicate step 4b math from WebXRTrackedBody.updateFromXRFrame
// ────────────────────────────────────────────────────────────────────────────

interface BoneLocalResult {
    positions: (Vector3 | null)[];
    rotations: (Quaternion | null)[];
    scales: (Vector3 | null)[];
}

// Compute bone-local transforms matching production step 4b (desiredFinals).
// Every mapped joint's desiredFinal = strip(xrLHS × inv(meshWorld)).
// Non-root locals are computed as desiredFinal_child × inv(desiredFinal_parent).
// Root locals equal the desiredFinal directly.
// The strip (decompose → scale to ±1 → recompose) removes the ~100× parasitic
// scale introduced by inv(meshWorld) while preserving rotation and position.

function computeBoneLocals(lhsMatrices: Float32Array, meshWorldMatrix: Matrix): BoneLocalResult {
    const positions: (Vector3 | null)[] = new Array(BODY_JOINT_COUNT).fill(null);
    const rotations: (Quaternion | null)[] = new Array(BODY_JOINT_COUNT).fill(null);
    const scales: (Vector3 | null)[] = new Array(BODY_JOINT_COUNT).fill(null);

    const tempJoint = new Matrix();
    const meshWorldInverse = new Matrix();
    meshWorldMatrix.invertToRef(meshWorldInverse);

    // Pass 1: compute desiredFinals for all mapped joints.
    // desiredFinal[i] = strip(xrWorld[i] × inv(meshWorld))
    const desiredFinals: (Matrix | null)[] = new Array(BODY_JOINT_COUNT).fill(null);
    const tempScale = new Vector3();
    const tempRot = new Quaternion();
    const tempPos = new Vector3();

    for (let i = 0; i < BODY_JOINT_COUNT; i++) {
        if (!JOINT_HAS_BONE[i]) {
            continue;
        }
        Matrix.FromArrayToRef(lhsMatrices, i * 16, tempJoint);
        const desiredFinal = new Matrix();
        tempJoint.multiplyToRef(meshWorldInverse, desiredFinal);
        // Strip parasitic scale to ±1
        desiredFinal.decompose(tempScale, tempRot, tempPos);
        tempScale.set(Math.sign(tempScale.x) || 1, Math.sign(tempScale.y) || 1, Math.sign(tempScale.z) || 1);
        Matrix.ComposeToRef(tempScale, tempRot, tempPos, desiredFinal);
        desiredFinals[i] = desiredFinal;
    }

    // Pass 2: compute bone locals.
    // local = desiredFinal × inv(parentDesiredFinal) for children with mapped parent
    // local = desiredFinal for roots or children with unmapped parent
    const tempParentInv = new Matrix();

    for (let i = 0; i < BODY_JOINT_COUNT; i++) {
        if (!desiredFinals[i]) {
            continue;
        }

        const parentIdx = JOINT_PARENT_IDX[i];

        let local: Matrix;
        if (parentIdx >= 0 && desiredFinals[parentIdx]) {
            desiredFinals[parentIdx]!.invertToRef(tempParentInv);
            local = new Matrix();
            desiredFinals[i]!.multiplyToRef(tempParentInv, local);
        } else {
            local = desiredFinals[i]!;
        }

        const scale = new Vector3();
        const pos = new Vector3();
        const rot = new Quaternion();
        local.decompose(scale, rot, pos);

        scales[i] = scale;
        positions[i] = pos;
        rotations[i] = rot;
    }

    return { positions, rotations, scales };
}

function reconstructLhsWorldForJoint(jointIdx: number, boneLocals: BoneLocalResult): Matrix {
    const chain: number[] = [];
    let cur = jointIdx;
    while (cur >= 0) {
        chain.unshift(cur);
        cur = JOINT_PARENT_IDX[cur];
    }

    let current = MESH_WORLD_MATRIX.clone();
    for (const jIdx of chain) {
        const local = Matrix.Compose(boneLocals.scales[jIdx]!, boneLocals.rotations[jIdx]!, boneLocals.positions[jIdx]!);
        const next = new Matrix();
        local.multiplyToRef(current, next);
        current = next;
    }

    return current;
}

function buildMatchedExpectedFromDirections(rawWorldPos: Map<number, Vector3>, parentIdxByJoint: number[], segmentLengthByJoint: Map<number, number>): Map<number, Vector3> {
    const matched = new Map<number, Vector3>();
    const ordered = [...rawWorldPos.keys()].sort((a, b) => {
        const depth = (j: number): number => {
            let d = 0;
            let p = parentIdxByJoint[j];
            while (p >= 0) {
                d++;
                p = parentIdxByJoint[p];
            }
            return d;
        };
        return depth(a) - depth(b);
    });

    for (const idx of ordered) {
        const raw = rawWorldPos.get(idx)!;
        const parentIdx = parentIdxByJoint[idx];
        if (parentIdx < 0 || !matched.has(parentIdx) || !rawWorldPos.has(parentIdx)) {
            matched.set(idx, raw.clone());
            continue;
        }

        const rawParent = rawWorldPos.get(parentIdx)!;
        const dir = raw.subtract(rawParent);
        if (dir.lengthSquared() <= 1e-12) {
            matched.set(idx, raw.clone());
            continue;
        }
        dir.normalize();
        const segLen = segmentLengthByJoint.get(idx) ?? Vector3.Distance(raw, rawParent);
        matched.set(idx, matched.get(parentIdx)!.add(dir.scale(segLen)));
    }

    return matched;
}

function testIterativeBlendAlpha(jointName: string, baseAlpha: number): number {
    void jointName;
    return Math.min(1, Math.max(0, baseAlpha));
}

function testIterativeRotationBlendAlpha(jointName: string, baseAlpha: number): number {
    const clampedBase = Math.min(1, Math.max(0, baseAlpha));
    const name = jointName.toLowerCase();

    if (name.includes("spine") || name === "neck" || name === "head") {
        return clampedBase * 0.45;
    }
    if (name.includes("shoulder") || name.includes("arm-upper") || name.includes("arm-lower")) {
        return clampedBase * 0.5;
    }
    if (name.includes("leg") || name.includes("foot")) {
        return clampedBase * 0.75;
    }

    return clampedBase;
}

function testIterativeUnmappedBlendAlpha(
    baseAlpha: number,
    depthFromMapped: number,
    depthPower: number,
    bindTranslationLength: number,
    referenceLength: number,
    lengthPower: number,
    alphaCutoff: number
): number {
    const clampedBase = Math.min(1, Math.max(0, baseAlpha));
    const depth = Math.max(1, depthFromMapped);
    const power = Math.max(0, depthPower);
    const depthAttenuated = clampedBase / Math.pow(depth, power);

    const ref = Math.max(1e-6, referenceLength);
    const lenRatio = Math.max(0, bindTranslationLength) / ref;
    const lenGate = Math.min(1, Math.pow(lenRatio, Math.max(0, lengthPower)));

    const effective = Math.min(1, Math.max(0, depthAttenuated * lenGate));
    return effective < Math.max(0, alphaCutoff) ? 0 : effective;
}

function testIterativeBlendedLocalPosition(
    bindPos: Vector3,
    trackedPos: Vector3,
    directionBlendAlpha: number,
    lengthBlendAlpha: number,
    minLengthRatio: number = 0.75,
    maxLengthRatio: number = 1.25
): Vector3 {
    const bindLen = bindPos.length();
    const trackedLen = trackedPos.length();

    const bindDir = bindLen > 1e-8 ? bindPos.scale(1 / bindLen) : null;
    const trackedDir = trackedLen > 1e-8 ? trackedPos.scale(1 / trackedLen) : null;

    let fromDir = bindDir;
    let toDir = trackedDir;

    if (!fromDir && toDir) {
        fromDir = toDir;
    }
    if (!toDir && fromDir) {
        toDir = fromDir;
    }
    if (!fromDir || !toDir) {
        return Vector3.Zero();
    }

    const blendedDir = Vector3.Lerp(fromDir, toDir, directionBlendAlpha);
    if (blendedDir.lengthSquared() <= 1e-12) {
        blendedDir.copyFrom(toDir);
    }
    blendedDir.normalize();

    let blendedLen = bindLen + (trackedLen - bindLen) * lengthBlendAlpha;
    if (bindLen > 1e-8) {
        const minLen = bindLen * Math.max(0, minLengthRatio);
        const maxLen = bindLen * Math.max(minLengthRatio, maxLengthRatio);
        blendedLen = Math.min(maxLen, Math.max(minLen, blendedLen));
    }
    return blendedDir.scale(Math.max(0, blendedLen));
}

function testIterativeBlendedLocalRotation(bindRot: Quaternion, trackedRot: Quaternion, alpha: number): Quaternion {
    const t = Math.min(1, Math.max(0, alpha));
    const tracked = trackedRot.clone();
    if (Quaternion.Dot(bindRot, tracked) < 0) {
        tracked.scaleInPlace(-1);
    }
    const blended = Quaternion.Slerp(bindRot, tracked, t);
    blended.normalize();
    return blended;
}

function testIterativeClampedRotationFromBind(bindRot: Quaternion, candidateRot: Quaternion, maxRadians: number): Quaternion {
    const out = candidateRot.clone();
    const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, out)));
    const angle = 2 * Math.acos(dot);
    const maxAngle = Math.max(0, maxRadians);
    if (angle > maxAngle && angle > 1e-8) {
        Quaternion.SlerpToRef(bindRot, out, maxAngle / angle, out);
    }
    out.normalize();
    return out;
}

function testIterativeBlendedLocalMatrix(
    bindLocal: Matrix,
    coherentLocal: Matrix,
    alpha: number,
    maxRotationRadians: number = Math.PI,
    minRotationDeltaRadians: number = 0,
    minTranslationLengthRatio: number = 0,
    maxTranslationLengthRatio: number = Number.POSITIVE_INFINITY,
    maxTranslationDirectionRadians: number = Math.PI,
    maxTranslationDeltaRatio: number = Number.POSITIVE_INFINITY,
    rotationAlpha: number = alpha
): Matrix {
    const t = Math.min(1, Math.max(0, alpha));
    const tRot = Math.min(1, Math.max(0, rotationAlpha));

    const bindScale = new Vector3();
    const bindRot = new Quaternion();
    const bindPos = new Vector3();
    bindLocal.decompose(bindScale, bindRot, bindPos);

    const coherentScale = new Vector3();
    const coherentRot = new Quaternion();
    const coherentPos = new Vector3();
    coherentLocal.decompose(coherentScale, coherentRot, coherentPos);

    if (Quaternion.Dot(bindRot, coherentRot) < 0) {
        coherentRot.scaleInPlace(-1);
    }

    const outScale = bindScale;
    const outPos = Vector3.Lerp(bindPos, coherentPos, t);
    const bindPosLen = bindPos.length();
    if (bindPosLen > 1e-8) {
        const minLen = bindPosLen * Math.max(0, minTranslationLengthRatio);
        const maxLen = bindPosLen * Math.max(minTranslationLengthRatio, maxTranslationLengthRatio);
        const outLen = outPos.length();
        if (outLen > 1e-8) {
            outPos.scaleInPlace(Math.min(maxLen, Math.max(minLen, outLen)) / outLen);
        }

        const clampedMaxDirectionRadians = Math.max(0, maxTranslationDirectionRadians);
        if (clampedMaxDirectionRadians < Math.PI) {
            const currentOutLen = outPos.length();
            if (currentOutLen > 1e-8) {
                const bindDir = bindPos.scale(1 / bindPosLen);
                const outDir = outPos.scale(1 / currentOutLen);
                const dot = Math.min(1, Math.max(-1, Vector3.Dot(bindDir, outDir)));
                const dirAngle = Math.acos(dot);
                if (dirAngle > clampedMaxDirectionRadians && dirAngle > 1e-8) {
                    const clampedDir = Vector3.Lerp(bindDir, outDir, clampedMaxDirectionRadians / dirAngle);
                    if (clampedDir.lengthSquared() > 1e-12) {
                        clampedDir.normalize();
                        outPos.copyFrom(clampedDir.scale(currentOutLen));
                    } else {
                        outPos.copyFrom(bindDir.scale(currentOutLen));
                    }
                }
            }
        }

        const clampedDeltaRatio = Math.max(0, maxTranslationDeltaRatio);
        if (Number.isFinite(clampedDeltaRatio)) {
            const maxDelta = bindPosLen * clampedDeltaRatio;
            if (maxDelta > 0) {
                const delta = outPos.subtract(bindPos);
                const deltaLen = delta.length();
                if (deltaLen > maxDelta && deltaLen > 1e-8) {
                    outPos.copyFrom(bindPos.add(delta.scale(maxDelta / deltaLen)));
                }
            }
        }
    } else {
        outPos.copyFrom(bindPos);
    }
    const clampedMaxRadians = Math.max(0, maxRotationRadians);
    const absDot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, coherentRot)));
    const angle = 2 * Math.acos(absDot);
    let coherentRotForBlend = coherentRot;
    if (clampedMaxRadians < Math.PI && angle > clampedMaxRadians && angle > 1e-8) {
        coherentRotForBlend = Quaternion.Slerp(bindRot, coherentRot, clampedMaxRadians / angle);
        coherentRotForBlend.normalize();
    }

    const minDelta = Math.max(0, minRotationDeltaRadians);
    const clampedDot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, coherentRotForBlend)));
    const clampedAngle = 2 * Math.acos(clampedDot);
    if (clampedAngle < minDelta) {
        coherentRotForBlend = bindRot;
    }

    const outRot = Quaternion.Slerp(bindRot, coherentRotForBlend, tRot);
    outRot.normalize();

    return Matrix.Compose(outScale, outRot, outPos);
}

// ────────────────────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────────────────────

describe("WebXRBodyTracking - bone-local computation (full Quest 3 snapshot)", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({
            renderHeight: 256,
            renderWidth: 256,
            textureSize: 256,
            deterministicLockstep: false,
            lockstepMaxSteps: 1,
        });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    // ── Raw data sanity ──────────────────────────────────────────────────

    describe("Snapshot data sanity", () => {
        it("should have correct array lengths (83 joints × 16 floats)", () => {
            expect(SNAPSHOT_RHS.length).toBe(83 * 16);
            expect(SNAPSHOT_LHS.length).toBe(83 * 16);
        });

        it("should have valid rotation sub-matrices (orthogonal columns, det ≈ ±1)", () => {
            for (let j = 0; j < BODY_JOINT_COUNT; j++) {
                const o = j * 16;
                const m = Matrix.FromArray(SNAPSHOT_RHS, o);
                const col0 = new Vector3(SNAPSHOT_RHS[o], SNAPSHOT_RHS[o + 1], SNAPSHOT_RHS[o + 2]);
                const col1 = new Vector3(SNAPSHOT_RHS[o + 4], SNAPSHOT_RHS[o + 5], SNAPSHOT_RHS[o + 6]);
                const col2 = new Vector3(SNAPSHOT_RHS[o + 8], SNAPSHOT_RHS[o + 9], SNAPSHOT_RHS[o + 10]);

                expect(Math.abs(col0.length() - 1)).toBeLessThan(0.02);
                expect(Math.abs(col1.length() - 1)).toBeLessThan(0.02);
                expect(Math.abs(col2.length() - 1)).toBeLessThan(0.02);
                expect(Math.abs(m.determinant() - 1)).toBeLessThan(0.05);
            }
        });

        it("LHS Z components should be negated from RHS", () => {
            for (let j = 0; j < BODY_JOINT_COUNT; j++) {
                const o = j * 16;
                // Negated indices: 2, 6, 8, 9, 14
                expect(SNAPSHOT_LHS[o + 2]).toBeCloseTo(-SNAPSHOT_RHS[o + 2], 2);
                expect(SNAPSHOT_LHS[o + 6]).toBeCloseTo(-SNAPSHOT_RHS[o + 6], 2);
                expect(SNAPSHOT_LHS[o + 8]).toBeCloseTo(-SNAPSHOT_RHS[o + 8], 2);
                expect(SNAPSHOT_LHS[o + 9]).toBeCloseTo(-SNAPSHOT_RHS[o + 9], 2);
                expect(SNAPSHOT_LHS[o + 14]).toBeCloseTo(-SNAPSHOT_RHS[o + 14], 2);
                // Non-negated
                expect(SNAPSHOT_LHS[o + 0]).toBeCloseTo(SNAPSHOT_RHS[o + 0], 2);
                expect(SNAPSHOT_LHS[o + 5]).toBeCloseTo(SNAPSHOT_RHS[o + 5], 2);
                expect(SNAPSHOT_LHS[o + 12]).toBeCloseTo(SNAPSHOT_RHS[o + 12], 2);
                expect(SNAPSHOT_LHS[o + 13]).toBeCloseTo(SNAPSHOT_RHS[o + 13], 2);
            }
        });

        it("meshWorldMatrix should be a uniform -0.01 scale with axis swaps", () => {
            const arr = MESH_WORLD_MATRIX.toArray();
            // Column 0: (-0.01, 0, 0, 0) → X axis
            expect(arr[0]).toBeCloseTo(-0.01, 4);
            expect(arr[1]).toBeCloseTo(0, 4);
            // Column 1: (0, 0, -0.01, 0) → Y mapped to Z
            expect(arr[5]).toBeCloseTo(0, 4);
            expect(arr[6]).toBeCloseTo(-0.01, 4);
            // Column 2: (0, -0.01, 0, 0) → Z mapped to Y
            expect(arr[9]).toBeCloseTo(-0.01, 4);
            expect(arr[10]).toBeCloseTo(0, 4);
        });

        it("mapped joints should include torso, arms, and legs", () => {
            // torso: 0-3, 5, 6
            expect(JOINT_HAS_BONE[0]).toBe(true); // hips
            expect(JOINT_HAS_BONE[5]).toBe(true); // neck
            expect(JOINT_HAS_BONE[6]).toBe(true); // head
            // arms
            expect(JOINT_HAS_BONE[9]).toBe(true); // left-arm-upper
            expect(JOINT_HAS_BONE[14]).toBe(true); // right-arm-upper
            // legs
            expect(JOINT_HAS_BONE[69]).toBe(true); // left-upper-leg
            expect(JOINT_HAS_BONE[76]).toBe(true); // right-upper-leg
            // hands should NOT be mapped
            expect(JOINT_HAS_BONE[17]).toBe(false);
            expect(JOINT_HAS_BONE[43]).toBe(false);
        });
    });

    // ── Bone-local computation ───────────────────────────────────────────

    describe("Step 4b bone-local computation", () => {
        let result: BoneLocalResult;

        beforeAll(() => {
            result = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);
        });

        it("should produce non-null results for all mapped joints", () => {
            for (const idx of MAPPED_JOINTS) {
                expect(result.positions[idx]).not.toBeNull();
                expect(result.rotations[idx]).not.toBeNull();
                expect(result.scales[idx]).not.toBeNull();
            }
        });

        it("should compute unit-length quaternions for all mapped joints", () => {
            for (const idx of MAPPED_JOINTS) {
                const q = result.rotations[idx]!;
                const len = Math.sqrt(q.x * q.x + q.y * q.y + q.z * q.z + q.w * q.w);
                expect(Math.abs(len - 1)).toBeLessThan(0.01);
            }
        });

        it("non-root bone locals should have det ≈ +1 (no reflection)", () => {
            for (const idx of MAPPED_JOINTS) {
                if (JOINT_PARENT_IDX[idx] < 0) {
                    continue;
                }
                const s = result.scales[idx]!;
                // Unit scale → det = sx*sy*sz ≈ 1
                expect(Math.abs(s.x * s.y * s.z - 1)).toBeLessThan(0.05);
            }
        });

        it("root bone locals should have unit scale (±1) after 3×3 normalization", () => {
            const rootJoints = MAPPED_JOINTS.filter((i) => JOINT_PARENT_IDX[i] < 0);
            expect(rootJoints.length).toBeGreaterThan(0);
            for (const idx of rootJoints) {
                const s = result.scales[idx]!;
                // After normalizing the 3×3 rotation block, root locals
                // have ±1 scale (rotation preserved, parasitic scale removed).
                expect(Math.abs(s.x)).toBeCloseTo(1, 1);
                expect(Math.abs(s.y)).toBeCloseTo(1, 1);
                expect(Math.abs(s.z)).toBeCloseTo(1, 1);
            }
        });

        it("non-root: local × parentWorld position should reconstruct child XR world position", () => {
            // The chain of locals, when multiplied through parent worlds,
            // should reconstruct the XR joint positions (this is tested
            // more thoroughly by the full-chain test below).
            for (const idx of MAPPED_JOINTS) {
                const parentIdx = JOINT_PARENT_IDX[idx];
                if (parentIdx < 0) {
                    continue;
                }

                const local = Matrix.Compose(result.scales[idx]!, result.rotations[idx]!, result.positions[idx]!);

                // Build parent's world: chain from root
                const chain: number[] = [];
                let cur = parentIdx;
                while (cur >= 0) {
                    chain.unshift(cur);
                    cur = JOINT_PARENT_IDX[cur];
                }
                let parentWorld = MESH_WORLD_MATRIX.clone();
                for (const jIdx of chain) {
                    const jLocal = Matrix.Compose(result.scales[jIdx]!, result.rotations[jIdx]!, result.positions[jIdx]!);
                    const next = new Matrix();
                    jLocal.multiplyToRef(parentWorld, next);
                    parentWorld = next;
                }

                // Reconstruct child world
                const childWorld = new Matrix();
                local.multiplyToRef(parentWorld, childWorld);

                // Check position matches XR joint LHS position
                const expected = Matrix.FromArray(SNAPSHOT_LHS, idx * 16);
                const rArr = childWorld.toArray();
                const eArr = expected.toArray();
                for (let c = 12; c <= 14; c++) {
                    expect(rArr[c]).toBeCloseTo(eArr[c], 2);
                }
            }
        });

        it("root: local × meshWorld position should match root's LHS world position", () => {
            const rootJoints = MAPPED_JOINTS.filter((i) => JOINT_PARENT_IDX[i] < 0);
            for (const idx of rootJoints) {
                const local = Matrix.Compose(result.scales[idx]!, result.rotations[idx]!, result.positions[idx]!);
                const reconstructed = new Matrix();
                local.multiplyToRef(MESH_WORLD_MATRIX, reconstructed);

                const expected = Matrix.FromArray(SNAPSHOT_LHS, idx * 16);
                // Position should match.  The 3×3 carries a 0.01× mesh-world
                // scale factor (unit-scale local × 0.01× meshWorld), which is
                // correct for the skeleton pipeline but differs from the
                // unit-scale LHS world matrix.
                const rArr = reconstructed.toArray();
                const eArr = expected.toArray();
                for (let c = 12; c <= 14; c++) {
                    expect(rArr[c]).toBeCloseTo(eArr[c], 3);
                }
            }
        });

        it("full chain: meshWorld × root.local × … × joint.local position ≈ joint_LHS position", () => {
            for (const idx of MAPPED_JOINTS) {
                // Build the chain from root to this joint
                const chain: number[] = [];
                let cur = idx;
                while (cur >= 0) {
                    chain.unshift(cur);
                    cur = JOINT_PARENT_IDX[cur];
                }

                let current = MESH_WORLD_MATRIX.clone();
                for (const jIdx of chain) {
                    const local = Matrix.Compose(result.scales[jIdx]!, result.rotations[jIdx]!, result.positions[jIdx]!);
                    const next = new Matrix();
                    local.multiplyToRef(current, next);
                    current = next;
                }

                const expected = Matrix.FromArray(SNAPSHOT_LHS, idx * 16);
                const rArr = current.toArray();
                const eArr = expected.toArray();
                // Position (elements 12-14) should match.  The 3×3 carries
                // an additional 0.01× mesh-world scale factor, which is
                // correct for the skeleton pipeline but differs from the
                // unit-scale XR world matrices.
                for (let c = 12; c <= 14; c++) {
                    expect(rArr[c]).toBeCloseTo(eArr[c], 2);
                }
            }
        });

        it("reconstructed world positions (RHS meters) should match snapshot input within 1 mm", () => {
            // After applying the full chain of bone-locals and converting back
            // to RHS world space, the positions should match the original XR
            // joint positions from the device.
            //
            // LHS→RHS conversion: negate Z. The RHS snapshot positions (in meters)
            // are columns 12,13,14 of each joint's 4×4 matrix.
            for (const idx of MAPPED_JOINTS) {
                // Reconstruct the LHS world matrix via the bone-local chain
                const chain: number[] = [];
                let cur = idx;
                while (cur >= 0) {
                    chain.unshift(cur);
                    cur = JOINT_PARENT_IDX[cur];
                }

                let lhsWorld = MESH_WORLD_MATRIX.clone();
                for (const jIdx of chain) {
                    const local = Matrix.Compose(result.scales[jIdx]!, result.rotations[jIdx]!, result.positions[jIdx]!);
                    const next = new Matrix();
                    local.multiplyToRef(lhsWorld, next);
                    lhsWorld = next;
                }

                // Extract LHS position and convert to RHS
                const lhsArr = lhsWorld.toArray();
                const reconstructedX = lhsArr[12];
                const reconstructedY = lhsArr[13];
                const reconstructedZ = -lhsArr[14]; // LHS→RHS: negate Z

                // Expected RHS positions from the original snapshot
                const expectedX = SNAPSHOT_RHS[idx * 16 + 12];
                const expectedY = SNAPSHOT_RHS[idx * 16 + 13];
                const expectedZ = SNAPSHOT_RHS[idx * 16 + 14];

                // 1 mm tolerance in world space
                const dx = reconstructedX - expectedX;
                const dy = reconstructedY - expectedY;
                const dz = reconstructedZ - expectedZ;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                expect(dist).toBeLessThan(0.001);
            }
        });

        it("reconstructed parent-child deltas should match snapshot skeleton deltas", () => {
            // This is the core retargeting math invariant:
            // parent->child vector from reconstructed joints must match the snapshot vector.
            // We check both length and direction for every mapped child with mapped parent.
            for (const idx of MAPPED_JOINTS) {
                const parentIdx = JOINT_PARENT_IDX[idx];
                if (parentIdx < 0 || !JOINT_HAS_BONE[parentIdx]) {
                    continue;
                }

                const childWorld = reconstructLhsWorldForJoint(idx, result);
                const parentWorld = reconstructLhsWorldForJoint(parentIdx, result);

                const cArr = childWorld.toArray();
                const pArr = parentWorld.toArray();
                const reconstructedDelta = new Vector3(cArr[12] - pArr[12], cArr[13] - pArr[13], cArr[14] - pArr[14]);

                const childSnap = Matrix.FromArray(SNAPSHOT_LHS, idx * 16).toArray();
                const parentSnap = Matrix.FromArray(SNAPSHOT_LHS, parentIdx * 16).toArray();
                const snapshotDelta = new Vector3(childSnap[12] - parentSnap[12], childSnap[13] - parentSnap[13], childSnap[14] - parentSnap[14]);

                const reconstructedLen = reconstructedDelta.length();
                const snapshotLen = snapshotDelta.length();

                // Absolute segment length should match at sub-millimeter tolerance.
                expect(Math.abs(reconstructedLen - snapshotLen)).toBeLessThan(0.001);

                if (snapshotLen > 1e-6 && reconstructedLen > 1e-6) {
                    reconstructedDelta.scaleInPlace(1 / reconstructedLen);
                    snapshotDelta.scaleInPlace(1 / snapshotLen);
                    // Direction vectors should be nearly identical.
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(Vector3.Dot(reconstructedDelta, snapshotDelta)).toBeGreaterThan(0.999);
                }
            }
        });

        it("matched expected skeleton should preserve direction and use target segment lengths", () => {
            const rawWorldPos = new Map<number, Vector3>();
            for (const idx of MAPPED_JOINTS) {
                rawWorldPos.set(idx, new Vector3(SNAPSHOT_LHS[idx * 16 + 12], SNAPSHOT_LHS[idx * 16 + 13], SNAPSHOT_LHS[idx * 16 + 14]));
            }

            // Use synthetic target lengths that differ from raw so we can validate
            // that matched construction follows direction while enforcing length.
            const targetLengths = new Map<number, number>();
            for (const idx of MAPPED_JOINTS) {
                const parentIdx = JOINT_PARENT_IDX[idx];
                if (parentIdx < 0 || !rawWorldPos.has(parentIdx)) {
                    continue;
                }
                const rawLen = Vector3.Distance(rawWorldPos.get(idx)!, rawWorldPos.get(parentIdx)!);
                const scale = 0.65 + (idx % 4) * 0.15;
                targetLengths.set(idx, rawLen * scale);
            }

            const matched = buildMatchedExpectedFromDirections(rawWorldPos, JOINT_PARENT_IDX, targetLengths);

            for (const idx of MAPPED_JOINTS) {
                const parentIdx = JOINT_PARENT_IDX[idx];
                if (parentIdx < 0 || !matched.has(parentIdx) || !rawWorldPos.has(parentIdx)) {
                    continue;
                }

                const rawDelta = rawWorldPos.get(idx)!.subtract(rawWorldPos.get(parentIdx)!);
                const matchedDelta = matched.get(idx)!.subtract(matched.get(parentIdx)!);

                const rawLen = rawDelta.length();
                const matchedLen = matchedDelta.length();
                const expectedLen = targetLengths.get(idx)!;

                if (rawLen > 1e-8 && matchedLen > 1e-8) {
                    rawDelta.scaleInPlace(1 / rawLen);
                    matchedDelta.scaleInPlace(1 / matchedLen);
                    // eslint-disable-next-line vitest/no-conditional-expect
                    expect(Vector3.Dot(rawDelta, matchedDelta)).toBeGreaterThan(0.999999);
                }

                expect(Math.abs(matchedLen - expectedLen)).toBeLessThan(1e-6);
            }
        });

        it("deformation-safe chain should keep parent-child distances constant under rotation", () => {
            const skeleton = new Skeleton("no-stretch", "no-stretch", scene);
            const root = new Bone("root", skeleton, null, Matrix.Identity(), null, Matrix.Identity(), 0);
            const childA = new Bone("childA", skeleton, root, Matrix.Translation(0, 1, 0), null, Matrix.Translation(0, 1, 0), 1);
            const childB = new Bone("childB", skeleton, childA, Matrix.Translation(0, 0.75, 0), null, Matrix.Translation(0, 0.75, 0), 2);

            const tnRoot = new TransformNode("tn-root", scene);
            const tnA = new TransformNode("tn-a", scene);
            const tnB = new TransformNode("tn-b", scene);
            tnRoot.rotationQuaternion = new Quaternion();
            tnA.rotationQuaternion = new Quaternion();
            tnB.rotationQuaternion = new Quaternion();
            root.linkTransformNode(tnRoot);
            childA.linkTransformNode(tnA);
            childB.linkTransformNode(tnB);

            // Deformation-safe mode: keep bind local positions/scales; rotate freely.
            tnRoot.position.set(0, 0, 0);
            tnRoot.scaling.set(1, 1, 1);
            tnRoot.rotationQuaternion!.set(0, 0, 0, 1);
            tnA.position.set(0, 1, 0);
            tnA.scaling.set(1, 1, 1);
            tnA.rotationQuaternion = Quaternion.FromEulerAngles(0.9, -0.4, 0.5);
            tnB.position.set(0, 0.75, 0);
            tnB.scaling.set(1, 1, 1);
            tnB.rotationQuaternion = Quaternion.FromEulerAngles(-0.3, 0.7, -0.2);

            skeleton.prepare(true);

            const pRoot = new Vector3();
            const pA = new Vector3();
            const pB = new Vector3();
            root.getFinalMatrix().decompose(undefined, undefined, pRoot);
            childA.getFinalMatrix().decompose(undefined, undefined, pA);
            childB.getFinalMatrix().decompose(undefined, undefined, pB);

            expect(Math.abs(Vector3.Distance(pRoot, pA) - 1)).toBeLessThan(1e-6);
            expect(Math.abs(Vector3.Distance(pA, pB) - 0.75)).toBeLessThan(1e-6);
        });

        it("unmapped intermediary bind-local should remain stable under mapped motion", () => {
            const skeleton = new Skeleton("unmapped-stability", "unmapped-stability", scene);
            const root = new Bone("root", skeleton, null, Matrix.Identity(), null, Matrix.Identity(), 0);
            const midUnmapped = new Bone("midUnmapped", skeleton, root, Matrix.Translation(0, 0.6, 0), null, Matrix.Translation(0, 0.6, 0), 1);
            const endMapped = new Bone("endMapped", skeleton, midUnmapped, Matrix.Translation(0, 0.5, 0), null, Matrix.Translation(0, 0.5, 0), 2);

            const tnRoot = new TransformNode("tn-root-u", scene);
            const tnMid = new TransformNode("tn-mid-u", scene);
            const tnEnd = new TransformNode("tn-end-u", scene);
            tnRoot.rotationQuaternion = new Quaternion();
            tnMid.rotationQuaternion = new Quaternion();
            tnEnd.rotationQuaternion = new Quaternion();

            // Simulate mapped/unmapped behavior in iterfit:
            // mapped bones are driven, unmapped keeps bind local.
            root.linkTransformNode(tnRoot);
            midUnmapped.linkTransformNode(tnMid);
            endMapped.linkTransformNode(tnEnd);

            tnRoot.position.set(0.15, -0.02, 0.1);
            tnRoot.scaling.set(1, 1, 1);
            tnRoot.rotationQuaternion = Quaternion.FromEulerAngles(0.5, -0.3, 0.2);

            tnMid.position.set(0, 0.6, 0);
            tnMid.scaling.set(1, 1, 1);
            tnMid.rotationQuaternion!.set(0, 0, 0, 1);

            tnEnd.position.set(0.22, 0.44, 0.08);
            tnEnd.scaling.set(1, 1, 1);
            tnEnd.rotationQuaternion = Quaternion.FromEulerAngles(-0.2, 0.7, -0.4);

            skeleton.prepare(true);

            // Unmapped local should remain at bind translation.
            const midLocalPos = new Vector3();
            midUnmapped.getLocalMatrix().decompose(undefined, undefined, midLocalPos);
            expect(Vector3.Distance(midLocalPos, new Vector3(0, 0.6, 0))).toBeLessThan(1e-6);

            // World-space distance root->mid should stay at bind segment length.
            const pRoot = new Vector3();
            const pMid = new Vector3();
            root.getFinalMatrix().decompose(undefined, undefined, pRoot);
            midUnmapped.getFinalMatrix().decompose(undefined, undefined, pMid);
            expect(Math.abs(Vector3.Distance(pRoot, pMid) - 0.6)).toBeLessThan(1e-6);
        });

        it("iterative blend policy should apply a uniform alpha", () => {
            const base = 0.2;
            const spine = testIterativeBlendAlpha("spine-upper", base);
            const shoulder = testIterativeBlendAlpha("left-shoulder", base);
            const arm = testIterativeBlendAlpha("left-arm-lower", base);
            const leg = testIterativeBlendAlpha("left-lower-leg", base);

            expect(spine).toBeCloseTo(base, 6);
            expect(shoulder).toBeCloseTo(base, 6);
            expect(arm).toBeCloseTo(base, 6);
            expect(leg).toBeCloseTo(base, 6);
        });

        it("iterative unmapped blend alpha should keep base alpha at depth=1", () => {
            const base = 0.35;
            const alpha = testIterativeUnmappedBlendAlpha(base, 1, 1, 0.2, 0.06, 1, 0.05);
            expect(alpha).toBeCloseTo(base, 6);
        });

        it("iterative unmapped blend alpha should attenuate with depth", () => {
            const base = 0.36;
            const alphaDepth2 = testIterativeUnmappedBlendAlpha(base, 2, 1, 0.2, 0.06, 1, 0.05);
            const alphaDepth3 = testIterativeUnmappedBlendAlpha(base, 3, 1, 0.2, 0.06, 1, 0.05);

            expect(alphaDepth2).toBeCloseTo(0.18, 6);
            expect(alphaDepth3).toBeCloseTo(0.12, 6);
        });

        it("iterative unmapped blend alpha should apply depth power", () => {
            const base = 0.5;
            const alphaPow1 = testIterativeUnmappedBlendAlpha(base, 2, 1, 0.2, 0.06, 1, 0.05);
            const alphaPow2 = testIterativeUnmappedBlendAlpha(base, 2, 2, 0.2, 0.06, 1, 0.05);

            expect(alphaPow1).toBeCloseTo(0.25, 6);
            expect(alphaPow2).toBeCloseTo(0.125, 6);
        });

        it("iterative unmapped blend alpha should attenuate for short bind-local offsets", () => {
            const base = 0.4;
            const alpha = testIterativeUnmappedBlendAlpha(base, 1, 1, 0.015, 0.06, 1, 0.05);
            expect(alpha).toBeCloseTo(0.1, 6);
        });

        it("iterative unmapped blend alpha should zero for zero bind-local offset", () => {
            const base = 0.4;
            const alpha = testIterativeUnmappedBlendAlpha(base, 1, 1, 0, 0.06, 1, 0.05);
            expect(alpha).toBeCloseTo(0, 6);
        });

        it("iterative unmapped blend alpha should apply cutoff", () => {
            const base = 0.2;
            const alpha = testIterativeUnmappedBlendAlpha(base, 4, 1, 0.06, 0.06, 1, 0.06);
            expect(alpha).toBeCloseTo(0, 6);
        });

        it("iterative rotation blend alpha should reduce torso and arm joints", () => {
            const base = 0.8;
            expect(testIterativeRotationBlendAlpha("spine-upper", base)).toBeCloseTo(0.36, 6);
            expect(testIterativeRotationBlendAlpha("neck", base)).toBeCloseTo(0.36, 6);
            expect(testIterativeRotationBlendAlpha("left-shoulder", base)).toBeCloseTo(0.4, 6);
            expect(testIterativeRotationBlendAlpha("left-arm-lower", base)).toBeCloseTo(0.4, 6);
        });

        it("iterative rotation blend alpha should keep legs closer to base", () => {
            const base = 0.8;
            expect(testIterativeRotationBlendAlpha("left-lower-leg", base)).toBeCloseTo(0.6, 6);
            expect(testIterativeRotationBlendAlpha("right-foot-ankle", base)).toBeCloseTo(0.6, 6);
            expect(testIterativeRotationBlendAlpha("hips", base)).toBeCloseTo(base, 6);
        });

        it("iterative local position blend should return bind position when alpha=0", () => {
            const bindPos = new Vector3(0, 0.8, 0.2);
            const trackedPos = new Vector3(0.45, 0.5, 0.1);
            const blended = testIterativeBlendedLocalPosition(bindPos, trackedPos, 0, 0);

            expect(Vector3.Distance(blended, bindPos)).toBeLessThan(1e-6);
        });

        it("iterative local position blend should return tracked position when alpha=1", () => {
            const bindPos = new Vector3(0, 0.8, 0.2);
            const trackedPos = new Vector3(0.45, 0.5, 0.1);
            const blended = testIterativeBlendedLocalPosition(bindPos, trackedPos, 1, 1);

            expect(Vector3.Distance(blended, trackedPos)).toBeLessThan(1e-6);
        });

        it("iterative local position blend should preserve bind length when iterlenalpha=0", () => {
            const bindPos = new Vector3(0, 0.8, 0);
            const trackedPos = new Vector3(0.45, 0.5, 0.1);
            const blended = testIterativeBlendedLocalPosition(bindPos, trackedPos, 0.35, 0);

            expect(Math.abs(blended.length() - bindPos.length())).toBeLessThan(1e-6);
        });

        it("iterative local position blend should interpolate segment length when iterlenalpha>0", () => {
            const bindPos = new Vector3(0, 1, 0);
            const trackedPos = new Vector3(0.6, 0.2, 0);
            const blended = testIterativeBlendedLocalPosition(bindPos, trackedPos, 0.5, 0.25);

            const expectedLen = bindPos.length() + (trackedPos.length() - bindPos.length()) * 0.25;
            expect(Math.abs(blended.length() - expectedLen)).toBeLessThan(1e-6);
        });

        it("iterative local rotation blend should return bind rotation when alpha=0", () => {
            const bindRot = Quaternion.FromEulerAngles(0.1, -0.2, 0.3);
            const trackedRot = Quaternion.FromEulerAngles(-0.4, 0.6, -0.1);
            const blended = testIterativeBlendedLocalRotation(bindRot, trackedRot, 0);

            expect(Math.abs(Quaternion.Dot(blended, bindRot))).toBeCloseTo(1, 6);
        });

        it("iterative local rotation blend should return tracked rotation when alpha=1", () => {
            const bindRot = Quaternion.FromEulerAngles(0.1, -0.2, 0.3);
            const trackedRot = Quaternion.FromEulerAngles(-0.4, 0.6, -0.1);
            const blended = testIterativeBlendedLocalRotation(bindRot, trackedRot, 1);

            expect(Math.abs(Quaternion.Dot(blended, trackedRot))).toBeCloseTo(1, 6);
        });

        it("iterative local rotation blend should interpolate angle at alpha=0.5", () => {
            const bindRot = Quaternion.Identity();
            const trackedRot = Quaternion.FromEulerAngles(0, Math.PI / 2, 0);
            const blended = testIterativeBlendedLocalRotation(bindRot, trackedRot, 0.5);

            const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, blended)));
            const angle = 2 * Math.acos(dot);
            expect(angle).toBeCloseTo(Math.PI / 4, 6);
        });

        it("iterative mapped rotation clamp should limit delta from bind", () => {
            const bindRot = Quaternion.Identity();
            const candidate = Quaternion.FromEulerAngles(0, (120 * Math.PI) / 180, 0);
            const clamped = testIterativeClampedRotationFromBind(bindRot, candidate, (55 * Math.PI) / 180);

            const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, clamped)));
            const angleDeg = (2 * Math.acos(dot) * 180) / Math.PI;
            expect(angleDeg).toBeLessThanOrEqual(55 + 1e-5);
        });

        it("iterative mapped rotation clamp should keep candidate when under cap", () => {
            const bindRot = Quaternion.Identity();
            const candidate = Quaternion.FromEulerAngles(0, (20 * Math.PI) / 180, 0);
            const clamped = testIterativeClampedRotationFromBind(bindRot, candidate, (55 * Math.PI) / 180);

            expect(Math.abs(Quaternion.Dot(candidate, clamped))).toBeCloseTo(1, 6);
        });

        it("iterative local position blend should clamp extreme stretch by max ratio", () => {
            const bindPos = new Vector3(0, 1, 0);
            const trackedPos = new Vector3(0, 4, 0);
            const blended = testIterativeBlendedLocalPosition(bindPos, trackedPos, 1, 1, 0.75, 1.25);

            expect(blended.length()).toBeCloseTo(1.25, 6);
        });

        it("iterative local position blend should clamp extreme shrink by min ratio", () => {
            const bindPos = new Vector3(0, 1, 0);
            const trackedPos = new Vector3(0, 0.05, 0);
            const blended = testIterativeBlendedLocalPosition(bindPos, trackedPos, 1, 1, 0.75, 1.25);

            expect(blended.length()).toBeCloseTo(0.75, 6);
        });

        it("iterative unmapped local blend should return bind local when alpha=0", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0.1, -0.2, 0.15), new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(-0.4, 0.3, -0.1), new Vector3(0.15, 0.45, 0.12));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 0);

            const outPos = new Vector3();
            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, outPos);

            const expectedPos = new Vector3();
            const expectedRot = new Quaternion();
            bindLocal.decompose(undefined, expectedRot, expectedPos);

            expect(Vector3.Distance(outPos, expectedPos)).toBeLessThan(1e-6);
            expect(Math.abs(Quaternion.Dot(outRot, expectedRot))).toBeCloseTo(1, 6);
        });

        it("iterative unmapped local blend should return coherent local when alpha=1", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0.1, -0.2, 0.15), new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(-0.4, 0.3, -0.1), new Vector3(0.15, 0.45, 0.12));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1);

            const outPos = new Vector3();
            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, outPos);

            const expectedPos = new Vector3();
            const expectedRot = new Quaternion();
            coherentLocal.decompose(undefined, expectedRot, expectedPos);

            expect(Vector3.Distance(outPos, expectedPos)).toBeLessThan(1e-6);
            expect(Math.abs(Quaternion.Dot(outRot, expectedRot))).toBeCloseTo(1, 6);
        });

        it("iterative unmapped local blend should interpolate position between bind and coherent", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0, 0, 0), new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.FromEulerAngles(0, Math.PI / 2, 0), new Vector3(0.2, 0.4, 0.1));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 0.5);

            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            expect(outPos.x).toBeCloseTo(0.1, 6);
            expect(outPos.y).toBeCloseTo(0.5, 6);
            expect(outPos.z).toBeCloseTo(0.05, 6);
        });

        it("iterative unmapped local blend should preserve bind scale", () => {
            const bindScale = new Vector3(0.8, 1.2, 1.1);
            const bindLocal = Matrix.Compose(bindScale, Quaternion.FromEulerAngles(0.1, 0.2, -0.05), new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1.7, 0.4, 0.9), Quaternion.FromEulerAngles(-0.3, 0.6, 0.25), new Vector3(0.25, 0.35, 0.12));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 0.6);

            const outScale = new Vector3();
            blended.decompose(outScale, undefined, undefined);

            expect(outScale.x).toBeCloseTo(bindScale.x, 6);
            expect(outScale.y).toBeCloseTo(bindScale.y, 6);
            expect(outScale.z).toBeCloseTo(bindScale.z, 6);
        });

        it("iterative unmapped local blend should clamp max rotation from bind", () => {
            const bindRot = Quaternion.FromEulerAngles(0, 0, 0);
            const coherentRot = Quaternion.FromEulerAngles(0, Math.PI, 0);
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), bindRot, new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), coherentRot, new Vector3(0.2, 0.4, 0.1));

            const maxDeg = 35;
            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, (maxDeg * Math.PI) / 180, 0);

            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, undefined);

            const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, outRot)));
            const angleDeg = (2 * Math.acos(dot) * 180) / Math.PI;
            expect(angleDeg).toBeLessThanOrEqual(maxDeg + 1e-5);
        });

        it("iterative unmapped local blend should ignore tiny rotation deltas under threshold", () => {
            const bindRot = Quaternion.Identity();
            const coherentRot = Quaternion.FromEulerAngles(0, (1 * Math.PI) / 180, 0);
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), bindRot, new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), coherentRot, new Vector3(0.1, 0.55, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, (2 * Math.PI) / 180);
            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, undefined);

            const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, outRot)));
            const angleDeg = (2 * Math.acos(dot) * 180) / Math.PI;
            expect(angleDeg).toBeLessThan(1e-4);
        });

        it("iterative unmapped local blend should keep larger rotation deltas above threshold", () => {
            const bindRot = Quaternion.Identity();
            const coherentRot = Quaternion.FromEulerAngles(0, (5 * Math.PI) / 180, 0);
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), bindRot, new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), coherentRot, new Vector3(0.1, 0.55, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, (2 * Math.PI) / 180);
            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, undefined);

            const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, outRot)));
            const angleDeg = (2 * Math.acos(dot) * 180) / Math.PI;
            expect(angleDeg).toBeGreaterThan(1);
        });

        it("iterative unmapped local blend should be stable for opposite-sign equivalent quaternions", () => {
            const bindRot = Quaternion.FromEulerAngles(0.2, -0.1, 0.3);
            const coherentRot = bindRot.clone();
            coherentRot.scaleInPlace(-1);

            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), bindRot, new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), coherentRot, new Vector3(0.1, 0.55, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0.8, 1.2, Math.PI);
            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, undefined);

            const dot = Math.min(1, Math.abs(Quaternion.Dot(bindRot, outRot)));
            expect(dot).toBeCloseTo(1, 6);
        });

        it("iterative unmapped local blend should allow translation follow with reduced rotation follow", () => {
            const bindRot = Quaternion.Identity();
            const coherentRot = Quaternion.FromEulerAngles(0, Math.PI / 3, 0);
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), bindRot, new Vector3(0, 0.6, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), coherentRot, new Vector3(0.2, 0.4, 0.1));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0, Number.POSITIVE_INFINITY, Math.PI, Number.POSITIVE_INFINITY, 0);

            const outPos = new Vector3();
            const outRot = new Quaternion();
            blended.decompose(undefined, outRot, outPos);

            const expectedPos = new Vector3(0.2, 0.4, 0.1);
            expect(Vector3.Distance(outPos, expectedPos)).toBeLessThan(1e-6);
            expect(Math.abs(Quaternion.Dot(outRot, bindRot))).toBeCloseTo(1, 6);
        });

        it("iterative unmapped local blend should clamp extreme translation stretch", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 1, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 4, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0.8, 1.2);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            expect(outPos.length()).toBeCloseTo(1.2, 6);
        });

        it("iterative unmapped local blend should clamp extreme translation shrink", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 1, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 0.05, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0.8, 1.2);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            expect(outPos.length()).toBeCloseTo(0.8, 6);
        });

        it("iterative unmapped local blend should keep zero bind translation anchored", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), Vector3.Zero());
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0.3, 0.2, -0.4));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0.8, 1.2);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            expect(outPos.lengthSquared()).toBeLessThan(1e-12);
        });

        it("iterative unmapped local blend should clamp translation direction from bind", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 1, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(1, 0, 0));

            const maxDeg = 35;
            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0.8, 1.2, (maxDeg * Math.PI) / 180);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            const bindDir = new Vector3(0, 1, 0);
            const outDir = outPos.normalizeToNew();
            const dot = Math.min(1, Math.max(-1, Vector3.Dot(bindDir, outDir)));
            const angleDeg = (Math.acos(dot) * 180) / Math.PI;
            expect(angleDeg).toBeLessThanOrEqual(maxDeg + 1e-5);
        });

        it("iterative unmapped local blend should preserve coherent direction when max direction is unrestricted", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 1, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(1, 0, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0.8, 1.2, Math.PI, Number.POSITIVE_INFINITY);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            const outDir = outPos.normalizeToNew();
            expect(outDir.x).toBeCloseTo(1, 6);
            expect(outDir.y).toBeCloseTo(0, 6);
            expect(outDir.z).toBeCloseTo(0, 6);
        });

        it("iterative unmapped local blend should clamp absolute translation delta from bind", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 1, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(1.5, 0, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0, Number.POSITIVE_INFINITY, Math.PI, 0.5);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            const delta = outPos.subtract(new Vector3(0, 1, 0));
            expect(delta.length()).toBeLessThanOrEqual(0.5 + 1e-6);
        });

        it("iterative unmapped local blend should not clamp translation delta when ratio is infinite", () => {
            const bindLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(0, 1, 0));
            const coherentLocal = Matrix.Compose(new Vector3(1, 1, 1), Quaternion.Identity(), new Vector3(1.5, 0, 0));

            const blended = testIterativeBlendedLocalMatrix(bindLocal, coherentLocal, 1, Math.PI, 0, 0, Number.POSITIVE_INFINITY, Math.PI, Number.POSITIVE_INFINITY);
            const outPos = new Vector3();
            blended.decompose(undefined, undefined, outPos);

            const expected = new Vector3(1.5, 0, 0);
            expect(Vector3.Distance(outPos, expected)).toBeLessThan(1e-6);
        });
    });

    // ── Skin matrix pipeline with real bind matrices ────────────────────

    describe("Skin matrix pipeline (non-identity bind)", () => {
        // Simulate a real glTF model where bones have non-identity bind matrices.
        // The skin matrix = absInvBind × final must produce correct vertex transforms.

        // Helper: build a map from joint index to a sequential bone index for MAPPED_JOINTS
        const jointToBoneIdx = new Map<number, number>();
        MAPPED_JOINTS.forEach((jIdx, bIdx) => jointToBoneIdx.set(jIdx, bIdx));

        it("tracked = bind ⇒ skinMatrix should be identity (skinMat × meshWorld ≈ meshWorld)", () => {
            // When tracked pose equals bind pose, every skin matrix should be identity.
            const result = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);

            const skeleton = new Skeleton("test", "test-id", scene);
            const mesh = new Mesh("mesh", scene);
            mesh.skeleton = skeleton;

            const mScale = new Vector3();
            const mRot = new Quaternion();
            const mPos = new Vector3();
            MESH_WORLD_MATRIX.decompose(mScale, mRot, mPos);
            mesh.position = mPos;
            mesh.rotationQuaternion = mRot;
            mesh.scaling = mScale;
            mesh.computeWorldMatrix(true);

            const meshWorldInverse = new Matrix();
            MESH_WORLD_MATRIX.invertToRef(meshWorldInverse);

            const tempJoint = new Matrix();
            const tempScale = new Vector3();
            const tempRot = new Quaternion();
            const tempPos = new Vector3();

            // Compute bind-pose desiredFinals (skeleton-space finals for each mapped joint)
            const bindFinals = new Map<number, Matrix>();
            for (const jIdx of MAPPED_JOINTS) {
                Matrix.FromArrayToRef(SNAPSHOT_LHS, jIdx * 16, tempJoint);
                const df = new Matrix();
                tempJoint.multiplyToRef(meshWorldInverse, df);
                df.decompose(tempScale, tempRot, tempPos);
                tempScale.set(Math.sign(tempScale.x) || 1, Math.sign(tempScale.y) || 1, Math.sign(tempScale.z) || 1);
                Matrix.ComposeToRef(tempScale, tempRot, tempPos, df);
                bindFinals.set(jIdx, df);
            }

            // Compute bind locals
            const bindLocals = new Map<number, Matrix>();
            const tempInv = new Matrix();
            for (const jIdx of MAPPED_JOINTS) {
                const parentJIdx = JOINT_PARENT_IDX[jIdx];
                if (parentJIdx >= 0 && bindFinals.has(parentJIdx)) {
                    bindFinals.get(parentJIdx)!.invertToRef(tempInv);
                    const local = new Matrix();
                    bindFinals.get(jIdx)!.multiplyToRef(tempInv, local);
                    bindLocals.set(jIdx, local);
                } else {
                    bindLocals.set(jIdx, bindFinals.get(jIdx)!.clone());
                }
            }

            // Create bones in MAPPED_JOINTS order
            const bones: Bone[] = [];
            for (let b = 0; b < MAPPED_JOINTS.length; b++) {
                const jIdx = MAPPED_JOINTS[b];
                const parentJIdx = JOINT_PARENT_IDX[jIdx];
                const parentBoneIdx = parentJIdx >= 0 ? jointToBoneIdx.get(parentJIdx) : undefined;
                const parentBone = parentBoneIdx !== undefined ? bones[parentBoneIdx] : null;
                const bl = bindLocals.get(jIdx)!;
                const bone = new Bone(JOINT_NAMES[jIdx], skeleton, parentBone, bl, null, bl, b);
                bones.push(bone);
            }

            // Link TNs and apply tracked locals (= same as bind → skinMatrix should be identity)
            for (let b = 0; b < MAPPED_JOINTS.length; b++) {
                const jIdx = MAPPED_JOINTS[b];
                const tf = new TransformNode("tf-" + JOINT_NAMES[jIdx], scene);
                tf.rotationQuaternion = new Quaternion();
                bones[b].linkTransformNode(tf);

                tf.position.copyFrom(result.positions[jIdx]!);
                tf.rotationQuaternion!.copyFrom(result.rotations[jIdx]!);
                tf.scaling.copyFrom(result.scales[jIdx]!);
            }

            skeleton.prepare(true);

            const meshWorld = mesh.getWorldMatrix();
            const skinMatrices = skeleton.getTransformMatrices(null);

            for (let b = 0; b < MAPPED_JOINTS.length; b++) {
                const bone = bones[b];
                const skinIdx = (bone as any)._index as number;
                const off = skinIdx * 16;

                const skinMat = Matrix.FromArray(skinMatrices, off);
                const skinTimesWorld = new Matrix();
                skinMat.multiplyToRef(meshWorld, skinTimesWorld);
                const stw = skinTimesWorld.toArray();

                const mw = meshWorld.toArray();
                let maxDiff = 0;
                for (let k = 0; k < 16; k++) {
                    maxDiff = Math.max(maxDiff, Math.abs(stw[k] - mw[k]));
                }

                if (maxDiff > 0.01) {
                    // eslint-disable-next-line no-console
                    console.log(
                        `SKIN MATRIX MISMATCH [${JOINT_NAMES[MAPPED_JOINTS[b]]}]: maxDiff=${maxDiff.toFixed(6)}\n` +
                            `  skinMW: [${Array.from(stw)
                                .map((v: number) => v.toFixed(4))
                                .join(", ")}]\n` +
                            `  meshW:  [${Array.from(mw)
                                .map((v: number) => v.toFixed(4))
                                .join(", ")}]`
                    );
                }
                expect(maxDiff).toBeLessThan(0.01);
            }
        });

        it("identity bind: skinMatrix × meshWorld rotation columns should match XR world rotation", () => {
            // With identity bind matrices, the skin matrix = absInvBind × final = I × final = final.
            // So skinMatrix × meshWorld should reconstruct the XR LHS world matrix (position matches,
            // rotation columns should be proportional to the XR world rotation columns).
            const result = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);

            const skeleton = new Skeleton("test", "test-id", scene);
            const mesh = new Mesh("mesh", scene);
            mesh.skeleton = skeleton;

            const mScale = new Vector3();
            const mRot = new Quaternion();
            const mPos = new Vector3();
            MESH_WORLD_MATRIX.decompose(mScale, mRot, mPos);
            mesh.position = mPos;
            mesh.rotationQuaternion = mRot;
            mesh.scaling = mScale;
            mesh.computeWorldMatrix(true);

            const bones: Bone[] = [];
            for (let b = 0; b < MAPPED_JOINTS.length; b++) {
                const jIdx = MAPPED_JOINTS[b];
                const parentJIdx = JOINT_PARENT_IDX[jIdx];
                const parentBoneIdx = parentJIdx >= 0 ? jointToBoneIdx.get(parentJIdx) : undefined;
                const parentBone = parentBoneIdx !== undefined ? bones[parentBoneIdx] : null;
                const bone = new Bone(JOINT_NAMES[jIdx], skeleton, parentBone, Matrix.Identity(), null, Matrix.Identity(), b);
                bones.push(bone);
            }

            for (let b = 0; b < MAPPED_JOINTS.length; b++) {
                const jIdx = MAPPED_JOINTS[b];
                const tf = new TransformNode("tf-" + JOINT_NAMES[jIdx], scene);
                tf.rotationQuaternion = new Quaternion();
                bones[b].linkTransformNode(tf);

                tf.position.copyFrom(result.positions[jIdx]!);
                tf.rotationQuaternion!.copyFrom(result.rotations[jIdx]!);
                tf.scaling.copyFrom(result.scales[jIdx]!);
            }

            skeleton.prepare(true);

            const meshWorld = mesh.getWorldMatrix();
            const skinMatrices = skeleton.getTransformMatrices(null);

            for (let b = 0; b < MAPPED_JOINTS.length; b++) {
                const jIdx = MAPPED_JOINTS[b];
                const bone = bones[b];
                const skinIdx = (bone as any)._index as number;
                const off = skinIdx * 16;

                const skinMat = Matrix.FromArray(skinMatrices, off);
                const skinTimesWorld = new Matrix();
                skinMat.multiplyToRef(meshWorld, skinTimesWorld);
                const stw = skinTimesWorld.toArray();

                const expected = Matrix.FromArray(SNAPSHOT_LHS, jIdx * 16);
                const eArr = expected.toArray();

                // Position should match
                for (let c = 12; c <= 14; c++) {
                    expect(stw[c]).toBeCloseTo(eArr[c], 2);
                }

                // Rotation columns: normalized directions should match
                for (let col = 0; col < 3; col++) {
                    const sCol = new Vector3(stw[col * 4], stw[col * 4 + 1], stw[col * 4 + 2]);
                    const eCol = new Vector3(eArr[col * 4], eArr[col * 4 + 1], eArr[col * 4 + 2]);

                    const sLen = sCol.length();
                    const eLen = eCol.length();
                    if (sLen > 0.001 && eLen > 0.001) {
                        sCol.scaleInPlace(1 / sLen);
                        eCol.scaleInPlace(1 / eLen);
                        const dot = Vector3.Dot(sCol, eCol);
                        if (Math.abs(dot) < 0.95) {
                            // eslint-disable-next-line no-console
                            console.log(
                                `ROTATION MISMATCH [${JOINT_NAMES[jIdx]}] col${col}: dot=${dot.toFixed(4)}` +
                                    `\n  stw col: (${stw[col * 4].toFixed(4)}, ${stw[col * 4 + 1].toFixed(4)}, ${stw[col * 4 + 2].toFixed(4)}) len=${sLen.toFixed(4)}` +
                                    `\n  exp col: (${eArr[col * 4].toFixed(4)}, ${eArr[col * 4 + 1].toFixed(4)}, ${eArr[col * 4 + 2].toFixed(4)}) len=${eLen.toFixed(4)}`
                            );
                        }
                        // eslint-disable-next-line vitest/no-conditional-expect
                        expect(Math.abs(dot)).toBeGreaterThan(0.95);
                    }
                }
            }
        });
    });

    // ── Anatomical sanity ────────────────────────────────────────────────

    describe("Anatomical sanity checks", () => {
        it("spine joints should have monotonically increasing Y (standing pose)", () => {
            const spineIndices = [0, 1, 2, 3, 4, 5, 6];
            for (let i = 1; i < spineIndices.length; i++) {
                const yPrev = SNAPSHOT_RHS[spineIndices[i - 1] * 16 + 13];
                const yCurr = SNAPSHOT_RHS[spineIndices[i] * 16 + 13];
                expect(yCurr).toBeGreaterThanOrEqual(yPrev - 0.02);
            }
        });

        it("left and right shoulders should be on opposite sides in X", () => {
            const leftX = SNAPSHOT_RHS[7 * 16 + 12]; // left-shoulder
            const rightX = SNAPSHOT_RHS[12 * 16 + 12]; // right-shoulder
            expect(Math.sign(leftX)).not.toBe(Math.sign(rightX));
        });

        it("left and right legs should be on opposite sides in X", () => {
            const leftX = SNAPSHOT_RHS[69 * 16 + 12]; // left-upper-leg
            const rightX = SNAPSHOT_RHS[76 * 16 + 12]; // right-upper-leg
            expect(Math.sign(leftX)).not.toBe(Math.sign(rightX));
        });

        it("torso bone-local offsets should be small (< 0.5m each)", () => {
            const result = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);
            for (const idx of [1, 2, 3, 5, 6]) {
                const p = result.positions[idx]!;
                expect(p.length()).toBeLessThan(50); // in mesh space (scale 0.01 → 100× larger coords)
            }
        });
    });

    // ── Debug output ─────────────────────────────────────────────────────

    describe("Debug output (visual inspection)", () => {
        it("should log computed bone-local data for all mapped joints", () => {
            const result = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);

            // eslint-disable-next-line no-console
            console.log("\n=== Computed bone-local transforms (step 4b, LHS-based) ===");
            // eslint-disable-next-line no-console
            console.log(`meshWorldMatrix det = ${MESH_WORLD_MATRIX.determinant().toFixed(6)}`);
            for (const idx of MAPPED_JOINTS) {
                const p = result.positions[idx]!;
                const q = result.rotations[idx]!;
                const s = result.scales[idx]!;
                const euler = q.toEulerAngles();
                const parentIdx = JOINT_PARENT_IDX[idx];
                // eslint-disable-next-line no-console
                console.log(
                    `[${String(idx).padStart(2)}] ${JOINT_NAMES[idx].padEnd(20)} ` +
                        `parent=${String(parentIdx).padStart(2)}  ` +
                        `pos=(${p.x.toFixed(2)}, ${p.y.toFixed(2)}, ${p.z.toFixed(2)})  ` +
                        `scale=(${s.x.toFixed(3)}, ${s.y.toFixed(3)}, ${s.z.toFixed(3)})  ` +
                        `euler=(${((euler.x * 180) / Math.PI).toFixed(1)}°, ${((euler.y * 180) / Math.PI).toFixed(1)}°, ${((euler.z * 180) / Math.PI).toFixed(1)}°)`
                );
            }

            // Also log raw RHS world positions for reference
            // eslint-disable-next-line no-console
            console.log("\n=== Raw RHS world positions ===");
            for (const idx of MAPPED_JOINTS) {
                const x = SNAPSHOT_RHS[idx * 16 + 12];
                const y = SNAPSHOT_RHS[idx * 16 + 13];
                const z = SNAPSHOT_RHS[idx * 16 + 14];
                // eslint-disable-next-line no-console
                console.log(`[${String(idx).padStart(2)}] ${JOINT_NAMES[idx].padEnd(20)} world=(${x.toFixed(4)}, ${y.toFixed(4)}, ${z.toFixed(4)})`);
            }

            expect(true).toBe(true);
        });
    });

    // ── Bone parenting pipeline ──────────────────────────────────────────

    describe("Skeleton/Bone pipeline (real Babylon objects)", () => {
        // This section creates actual Skeleton + Bone objects, links them
        // to TransformNodes via linkTransformNode (exactly as setBodyMesh does),
        // applies the body-tracking-computed locals, calls skeleton.prepare(),
        // and checks that the bones end up at the correct world positions.

        // The Mixamo bone hierarchy for the mapped joints (no unmapped intermediaries):
        //   Hips (joint 0)
        //   ├── Spine (joint 1)
        //   │   └── Spine1 (joint 2)
        //   │       └── Spine2 (joint 3)
        //   │           ├── Neck (joint 5) ← joint 4/chest skipped (not in Mixamo)
        //   │           │   └── Head (joint 6)
        //   │           ├── LeftShoulder (joint 7)
        //   │           │   └── LeftArm (joint 9)
        //   │           │       └── LeftForeArm (joint 10)
        //   │           └── RightShoulder (joint 12)
        //   │               └── RightArm (joint 14)
        //   │                   └── RightForeArm (joint 15)
        //   ├── LeftUpLeg (joint 69)
        //   │   └── LeftLeg (joint 70)
        //   │       └── LeftFoot (joint 72)
        //   └── RightUpLeg (joint 76)
        //       └── RightLeg (joint 77)
        //           └── RightFoot (joint 79)

        // Bone definitions: [boneName, xrJointIndex, parentBoneArrayIndex]
        // parentBoneArrayIndex = -1 for root bones
        const BONE_DEFS: [string, number, number][] = [
            ["Hips", 0, -1],
            ["Spine", 1, 0],
            ["Spine1", 2, 1],
            ["Spine2", 3, 2],
            ["Neck", 5, 3],
            ["Head", 6, 4],
            ["LeftShoulder", 7, 3],
            ["LeftArm", 9, 6],
            ["LeftForeArm", 10, 7],
            ["RightShoulder", 12, 3],
            ["RightArm", 14, 9],
            ["RightForeArm", 15, 10],
            ["LeftUpLeg", 69, 0],
            ["LeftLeg", 70, 12],
            ["LeftFoot", 72, 13],
            ["RightUpLeg", 76, 0],
            ["RightLeg", 77, 15],
            ["RightFoot", 79, 16],
        ];

        // Helper: build skeleton, link TFs, apply body-tracking locals, prepare.
        // Returns the bones array and mesh.
        function buildAndPrepare(
            scn: Scene,
            boneDefs: [string, number, number][],
            boneLocals: BoneLocalResult,
            meshWorldMatrix: Matrix
        ): { bones: Bone[]; mesh: Mesh; skeleton: Skeleton; transformNodes: TransformNode[] } {
            const skeleton = new Skeleton("test-skeleton", "test-skeleton-id", scn);
            const mesh = new Mesh("skinned-mesh", scn);
            mesh.skeleton = skeleton;

            // Set the mesh world matrix to match the snapshot.
            // Decompose into TRS so the mesh computes the correct world matrix.
            const mScale = new Vector3();
            const mRot = new Quaternion();
            const mPos = new Vector3();
            meshWorldMatrix.decompose(mScale, mRot, mPos);
            mesh.position = mPos;
            mesh.rotationQuaternion = mRot;
            mesh.scaling = mScale;
            mesh.computeWorldMatrix(true);

            // Create bones in order (parents before children).
            const bones: Bone[] = [];
            const transformNodes: TransformNode[] = [];

            for (const [boneName, _xrIdx, parentBoneIdx] of boneDefs) {
                const parentBone = parentBoneIdx >= 0 ? bones[parentBoneIdx] : null;
                // Use identity bind matrix — rest pose at origin.
                const bone = new Bone(boneName, skeleton, parentBone, Matrix.Identity(), Matrix.Identity(), Matrix.Identity());
                bones.push(bone);
            }

            // Link TransformNodes to bones (exactly as setBodyMesh does).
            for (let b = 0; b < boneDefs.length; b++) {
                const [, xrJointIdx] = boneDefs[b];
                const tf = new TransformNode("tf-" + JOINT_NAMES[xrJointIdx], scn);
                tf.rotationQuaternion = new Quaternion();
                bones[b].linkTransformNode(tf);
                transformNodes.push(tf);

                // Apply body-tracking-computed local TRS.
                const pos = boneLocals.positions[xrJointIdx]!;
                const rot = boneLocals.rotations[xrJointIdx]!;
                const scl = boneLocals.scales[xrJointIdx]!;
                tf.position.copyFrom(pos);
                tf.rotationQuaternion!.copyFrom(rot);
                tf.scaling.copyFrom(scl);
            }

            // Call prepare (this is what the renderer calls each frame).
            skeleton.prepare(true);

            return { bones, mesh, skeleton, transformNodes };
        }

        it("all bones mapped (no intermediaries): skeleton.prepare → correct world positions within 1mm", () => {
            const boneLocals = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);
            const { bones, mesh } = buildAndPrepare(scene, BONE_DEFS, boneLocals, MESH_WORLD_MATRIX);

            const meshWorld = mesh.getWorldMatrix();

            for (let b = 0; b < BONE_DEFS.length; b++) {
                const [, xrJointIdx] = BONE_DEFS[b];
                const bone = bones[b];

                // bone.getFinalMatrix() is in skeleton-space.
                // Multiply by meshWorld to get Babylon world-space (LHS).
                const boneWorld = new Matrix();
                bone.getFinalMatrix().multiplyToRef(meshWorld, boneWorld);

                // Extract LHS position and convert to RHS (negate Z).
                const bArr = boneWorld.toArray();
                const rx = bArr[12];
                const ry = bArr[13];
                const rz = -bArr[14]; // LHS → RHS

                // Expected: the original RHS world pos from the XR device.
                const ex = SNAPSHOT_RHS[xrJointIdx * 16 + 12];
                const ey = SNAPSHOT_RHS[xrJointIdx * 16 + 13];
                const ez = SNAPSHOT_RHS[xrJointIdx * 16 + 14];

                const dx = rx - ex;
                const dy = ry - ey;
                const dz = rz - ez;
                const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

                if (dist >= 0.001) {
                    // eslint-disable-next-line no-console
                    console.log(
                        `MISMATCH [${String(xrJointIdx).padStart(2)}] ${JOINT_NAMES[xrJointIdx].padEnd(20)} ` +
                            `got=(${rx.toFixed(4)}, ${ry.toFixed(4)}, ${rz.toFixed(4)}) ` +
                            `expected=(${ex.toFixed(4)}, ${ey.toFixed(4)}, ${ez.toFixed(4)}) ` +
                            `dist=${dist.toFixed(6)}`
                    );
                }
                expect(dist).toBeLessThan(0.001);
            }
        });

        it("unmapped intermediate bone: skeleton chain breaks world positions", () => {
            // Insert an unmapped bone "FakeChest" between Spine2 (idx 3)
            // and Neck (idx 4 in BONE_DEFS). In the real skeleton, this bone
            // is NOT linked to a TransformNode, so it retains its local matrix.
            // Body tracking's parentJointIdx still says Neck's parent is
            // spine-upper (joint 3), skipping the unmapped bone.
            //
            // This test proves that unmapped intermediaries corrupt the chain.

            // Modified bone defs: insert FakeChest after Spine2 (array idx 3)
            const DEFS_WITH_GAP: [string, number, number][] = [
                ["Hips", 0, -1], // 0
                ["Spine", 1, 0], // 1
                ["Spine1", 2, 1], // 2
                ["Spine2", 3, 2], // 3
                ["FakeChest", -1, 3], // 4 ← UNMAPPED, parent is Spine2
                ["Neck", 5, 4], // 5 ← parent is now FakeChest, not Spine2!
                ["Head", 6, 5], // 6
                ["LeftShoulder", 7, 4], // 7 ← also child of FakeChest
                ["LeftArm", 9, 7], // 8
                ["LeftForeArm", 10, 8], // 9
                ["RightShoulder", 12, 4], // 10 ← also child of FakeChest
                ["RightArm", 14, 10], // 11
                ["RightForeArm", 15, 11], // 12
                ["LeftUpLeg", 69, 0], // 13
                ["LeftLeg", 70, 13], // 14
                ["LeftFoot", 72, 14], // 15
                ["RightUpLeg", 76, 0], // 16
                ["RightLeg", 77, 16], // 17
                ["RightFoot", 79, 17], // 18
            ];

            const boneLocals = computeBoneLocals(SNAPSHOT_LHS, MESH_WORLD_MATRIX);

            // We can't use buildAndPrepare directly because the FakeChest
            // bone (xrJointIdx = -1) should NOT be linked.
            const skeleton = new Skeleton("test-skeleton", "test-skeleton-id", scene);
            const mesh = new Mesh("skinned-mesh", scene);
            mesh.skeleton = skeleton;

            const mScale = new Vector3();
            const mRot = new Quaternion();
            const mPos = new Vector3();
            MESH_WORLD_MATRIX.decompose(mScale, mRot, mPos);
            mesh.position = mPos;
            mesh.rotationQuaternion = mRot;
            mesh.scaling = mScale;
            mesh.computeWorldMatrix(true);

            const bones: Bone[] = [];
            for (const [boneName, , parentBoneIdx] of DEFS_WITH_GAP) {
                const parentBone = parentBoneIdx >= 0 ? bones[parentBoneIdx] : null;
                const bone = new Bone(boneName, skeleton, parentBone, Matrix.Identity(), Matrix.Identity(), Matrix.Identity());
                bones.push(bone);
            }

            // Give FakeChest a non-identity local (simulating a real rest offset).
            const fakeChestLocal = Matrix.Translation(0, 5, 0);
            bones[4].setBindMatrix(fakeChestLocal);
            // We override the bone's local matrix directly via the _matrix setter.
            // When skeleton.prepare() runs, since FakeChest has no linked
            // TransformNode, it will keep this local.
            const fakeChestScaling = new Vector3();
            const fakeChestRotation = new Quaternion();
            const fakeChestPosition = new Vector3();
            fakeChestLocal.decompose(fakeChestScaling, fakeChestRotation, fakeChestPosition);
            bones[4].position = fakeChestPosition;
            bones[4].rotationQuaternion = fakeChestRotation;
            bones[4].scaling = fakeChestScaling;

            // Link all MAPPED bones (skip FakeChest at idx 4).
            for (let b = 0; b < DEFS_WITH_GAP.length; b++) {
                const [, xrJointIdx] = DEFS_WITH_GAP[b];
                if (xrJointIdx < 0) {
                    continue;
                }
                const tf = new TransformNode("tf-" + JOINT_NAMES[xrJointIdx], scene);
                tf.rotationQuaternion = new Quaternion();
                bones[b].linkTransformNode(tf);

                const pos = boneLocals.positions[xrJointIdx]!;
                const rot = boneLocals.rotations[xrJointIdx]!;
                const scl = boneLocals.scales[xrJointIdx]!;
                tf.position.copyFrom(pos);
                tf.rotationQuaternion!.copyFrom(rot);
                tf.scaling.copyFrom(scl);
            }

            skeleton.prepare(true);

            const meshWorld = mesh.getWorldMatrix();

            // Check Neck (joint 5) — it's a child of FakeChest in the skeleton.
            // With the unmapped intermediate, its world position should be WRONG.
            const neckBone = bones[5]; // Neck
            const neckWorld = new Matrix();
            neckBone.getFinalMatrix().multiplyToRef(meshWorld, neckWorld);
            const nArr = neckWorld.toArray();
            const neckRx = nArr[12];
            const neckRy = nArr[13];
            const neckRz = -nArr[14];

            const neckEx = SNAPSHOT_RHS[5 * 16 + 12];
            const neckEy = SNAPSHOT_RHS[5 * 16 + 13];
            const neckEz = SNAPSHOT_RHS[5 * 16 + 14];

            const neckDist = Math.sqrt((neckRx - neckEx) ** 2 + (neckRy - neckEy) ** 2 + (neckRz - neckEz) ** 2);

            // eslint-disable-next-line no-console
            console.log(
                `\nUnmapped intermediate test: Neck world pos` +
                    `\n  got=(${neckRx.toFixed(4)}, ${neckRy.toFixed(4)}, ${neckRz.toFixed(4)})` +
                    `\n  expected=(${neckEx.toFixed(4)}, ${neckEy.toFixed(4)}, ${neckEz.toFixed(4)})` +
                    `\n  distance=${neckDist.toFixed(6)}m`
            );

            // Expect the Neck position to be WRONG (> 1mm off) because of
            // the unmapped FakeChest bone with non-identity local.
            expect(neckDist).toBeGreaterThan(0.001);

            // Meanwhile, bones below the gap (e.g., Hips, Spine chain) should
            // still be correct since they're above the unmapped bone.
            const hipsBone = bones[0];
            const hipsWorld = new Matrix();
            hipsBone.getFinalMatrix().multiplyToRef(meshWorld, hipsWorld);
            const hArr = hipsWorld.toArray();
            const hipsRx = hArr[12];
            const hipsRy = hArr[13];
            const hipsRz = -hArr[14];
            const hipsEx = SNAPSHOT_RHS[0 * 16 + 12];
            const hipsEy = SNAPSHOT_RHS[0 * 16 + 13];
            const hipsEz = SNAPSHOT_RHS[0 * 16 + 14];
            const hipsDist = Math.sqrt((hipsRx - hipsEx) ** 2 + (hipsRy - hipsEy) ** 2 + (hipsRz - hipsEz) ** 2);
            expect(hipsDist).toBeLessThan(0.001);
        });

        it("unmapped root-bone parent (Armature): corrected formula restores world positions", () => {
            // Simulates a glTF model where an unmapped "Armature" bone sits
            // between the skeleton root and the first mapped bone (Hips).
            // The Armature has a 100× scale (cm→m conversion).
            // We pass armatureWorld (= armatureLocal × meshWorld) as the base
            // meshWorldMatrix so desiredFinals are computed relative to the
            // Armature's space, matching the skeleton chain.

            // Bone defs: Armature (unmapped, idx 0) → Hips (mapped, idx 1) → ...
            const DEFS_WITH_ARMATURE: [string, number, number][] = [
                ["Armature", -1, -1], // 0 ← UNMAPPED, skeleton root
                ["Hips", 0, 0], // 1 ← parent is Armature
                ["Spine", 1, 1], // 2
                ["Spine1", 2, 2], // 3
                ["Spine2", 3, 3], // 4
                ["Neck", 5, 4], // 5
                ["Head", 6, 5], // 6
                ["LeftShoulder", 7, 4], // 7
                ["LeftArm", 9, 7], // 8
                ["LeftForeArm", 10, 8], // 9
                ["RightShoulder", 12, 4], // 10
                ["RightArm", 14, 10], // 11
                ["RightForeArm", 15, 11], // 12
                ["LeftUpLeg", 69, 1], // 13 ← parent is Hips (idx 1)
                ["LeftLeg", 70, 13], // 14
                ["LeftFoot", 72, 14], // 15
                ["RightUpLeg", 76, 1], // 16 ← parent is Hips (idx 1)
                ["RightLeg", 77, 16], // 17
                ["RightFoot", 79, 17], // 18
            ];

            // Compute bone locals with the Armature's world as the base.
            // Passing armatureWorld (= Scaling(100) × meshWorld) makes all
            // desiredFinals relative to the Armature bone, so when
            // skeleton.prepare() chains through Armature → Hips → ...,
            // the finals reconstruct correct world positions.
            const armatureLocal = Matrix.Scaling(100, 100, 100);
            const armatureWorld = new Matrix();
            armatureLocal.multiplyToRef(MESH_WORLD_MATRIX, armatureWorld);
            const boneLocals = computeBoneLocals(SNAPSHOT_LHS, armatureWorld);

            const skeleton = new Skeleton("test-skeleton", "test-skeleton-id", scene);
            const mesh = new Mesh("skinned-mesh", scene);
            mesh.skeleton = skeleton;

            const mScale = new Vector3();
            const mRot = new Quaternion();
            const mPos = new Vector3();
            MESH_WORLD_MATRIX.decompose(mScale, mRot, mPos);
            mesh.position = mPos;
            mesh.rotationQuaternion = mRot;
            mesh.scaling = mScale;
            mesh.computeWorldMatrix(true);

            const bones: Bone[] = [];
            for (const [boneName, , parentBoneIdx] of DEFS_WITH_ARMATURE) {
                const parentBone = parentBoneIdx >= 0 ? bones[parentBoneIdx] : null;
                const bone = new Bone(boneName, skeleton, parentBone, Matrix.Identity(), Matrix.Identity(), Matrix.Identity());
                bones.push(bone);
            }

            // Give Armature its 100× scale.
            const aScl = new Vector3();
            const aRot = new Quaternion();
            const aPos = new Vector3();
            armatureLocal.decompose(aScl, aRot, aPos);
            bones[0].position = aPos;
            bones[0].rotationQuaternion = aRot;
            bones[0].scaling = aScl;

            // Link TNs and apply body-tracking locals for mapped bones.
            for (let b = 0; b < DEFS_WITH_ARMATURE.length; b++) {
                const [, xrJointIdx] = DEFS_WITH_ARMATURE[b];
                if (xrJointIdx < 0) {
                    continue; // skip Armature
                }

                const tf = new TransformNode("tf-" + JOINT_NAMES[xrJointIdx], scene);
                tf.rotationQuaternion = new Quaternion();
                bones[b].linkTransformNode(tf);

                const pos = boneLocals.positions[xrJointIdx]!;
                const rot = boneLocals.rotations[xrJointIdx]!;
                const scl = boneLocals.scales[xrJointIdx]!;
                tf.position.copyFrom(pos);
                tf.rotationQuaternion!.copyFrom(rot);
                tf.scaling.copyFrom(scl);
            }

            skeleton.prepare(true);

            const meshWorld = mesh.getWorldMatrix();

            // Verify ALL mapped bones produce correct world positions.
            let maxDist = 0;
            for (let b = 0; b < DEFS_WITH_ARMATURE.length; b++) {
                const [boneName, xrJointIdx] = DEFS_WITH_ARMATURE[b];
                if (xrJointIdx < 0) {
                    continue;
                }

                const boneWorld = new Matrix();
                bones[b].getFinalMatrix().multiplyToRef(meshWorld, boneWorld);
                const bArr = boneWorld.toArray();
                const rx = bArr[12];
                const ry = bArr[13];
                const rz = -bArr[14]; // LHS → RHS

                const ex = SNAPSHOT_RHS[xrJointIdx * 16 + 12];
                const ey = SNAPSHOT_RHS[xrJointIdx * 16 + 13];
                const ez = SNAPSHOT_RHS[xrJointIdx * 16 + 14];

                const dist = Math.sqrt((rx - ex) ** 2 + (ry - ey) ** 2 + (rz - ez) ** 2);
                maxDist = Math.max(maxDist, dist);

                if (dist >= 0.001) {
                    // eslint-disable-next-line no-console
                    console.log(
                        `Armature fix MISMATCH [${String(xrJointIdx).padStart(2)}] ${boneName.padEnd(20)} ` +
                            `got=(${rx.toFixed(4)}, ${ry.toFixed(4)}, ${rz.toFixed(4)}) ` +
                            `expected=(${ex.toFixed(4)}, ${ey.toFixed(4)}, ${ez.toFixed(4)}) ` +
                            `dist=${dist.toFixed(6)}`
                    );
                }
                expect(dist).toBeLessThan(0.001);
            }

            // eslint-disable-next-line no-console
            console.log(`Armature fix test: max positional error = ${maxDist.toFixed(6)}m (should be < 0.001)`);
        });
    });
});

// ────────────────────────────────────────────────────────────────────────────
// Public API surface
// ────────────────────────────────────────────────────────────────────────────

describe("WebXRBodyTracking - static data", () => {
    describe("BodyJointParentIndex", () => {
        it("should have one entry per XR body joint", () => {
            expect(BodyJointParentIndex.length).toBe(83);
        });

        it("root (hips) should have parent -1", () => {
            expect(BodyJointParentIndex[0]).toBe(-1);
        });

        it("every non-root parent index should reference an earlier joint (topologically ordered)", () => {
            for (let i = 0; i < BodyJointParentIndex.length; i++) {
                const p = BodyJointParentIndex[i];
                if (p === -1) {
                    continue;
                }
                expect(p).toBeGreaterThanOrEqual(0);
                expect(p).toBeLessThan(i);
            }
        });
    });

    describe("MixamoRigMapping", () => {
        it("should map all core humanoid joints (torso + arms + legs)", () => {
            const required: WebXRBodyJoint[] = [
                WebXRBodyJoint.HIPS,
                WebXRBodyJoint.SPINE_LOWER,
                WebXRBodyJoint.HEAD,
                WebXRBodyJoint.LEFT_SHOULDER,
                WebXRBodyJoint.LEFT_ARM_UPPER,
                WebXRBodyJoint.LEFT_ARM_LOWER,
                WebXRBodyJoint.LEFT_HAND_WRIST,
                WebXRBodyJoint.RIGHT_SHOULDER,
                WebXRBodyJoint.RIGHT_ARM_UPPER,
                WebXRBodyJoint.RIGHT_ARM_LOWER,
                WebXRBodyJoint.RIGHT_HAND_WRIST,
                WebXRBodyJoint.LEFT_UPPER_LEG,
                WebXRBodyJoint.LEFT_LOWER_LEG,
                WebXRBodyJoint.LEFT_FOOT_ANKLE,
                WebXRBodyJoint.RIGHT_UPPER_LEG,
                WebXRBodyJoint.RIGHT_LOWER_LEG,
                WebXRBodyJoint.RIGHT_FOOT_ANKLE,
            ];
            for (const j of required) {
                expect(MixamoRigMapping[j]).toBeTruthy();
            }
        });

        it("should use un-prefixed Mixamo bone names by default", () => {
            expect(MixamoRigMapping[WebXRBodyJoint.HIPS]).toBe("Hips");
            expect(MixamoRigMapping[WebXRBodyJoint.LEFT_HAND_WRIST]).toBe("LeftHand");
        });
    });

    describe("MixamoAimChildOverrides", () => {
        it("should reroute short spine segments to longer stable targets", () => {
            // Hips and lower-spine joints aim at spine-upper or neck for stable torso orientation.
            expect(MixamoAimChildOverrides[WebXRBodyJoint.HIPS]).toBeDefined();
            expect(MixamoAimChildOverrides[WebXRBodyJoint.SPINE_LOWER]).toBeDefined();
        });

        it("should redirect wrists to a finger joint for stable hand orientation", () => {
            expect(MixamoAimChildOverrides[WebXRBodyJoint.LEFT_HAND_WRIST]).toBe(WebXRBodyJoint.LEFT_HAND_MIDDLE_METACARPAL);
            expect(MixamoAimChildOverrides[WebXRBodyJoint.RIGHT_HAND_WRIST]).toBe(WebXRBodyJoint.RIGHT_HAND_MIDDLE_METACARPAL);
        });

        it("every override target should be a valid WebXRBodyJoint value", () => {
            const allJoints = new Set<string>(WebXRBodyTracking.AllBodyJoints);
            for (const v of Object.values(MixamoAimChildOverrides)) {
                expect(typeof v).toBe("string");
                expect(allJoints.has(v as string)).toBe(true);
            }
        });
    });
});

describe("WebXRBodyTracking - _ResolveMixamoRigMapping", () => {
    let engine: Engine;
    let scene: Scene;

    beforeEach(() => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256 });
        scene = new Scene(engine);
    });

    afterEach(() => {
        scene.dispose();
        engine.dispose();
    });

    const createMeshWithSkeleton = (boneNames: string[]): Mesh => {
        const mesh = new Mesh("mesh", scene);
        const skeleton = new Skeleton("skel", "skel", scene);
        for (const name of boneNames) {
            new Bone(name, skeleton, null, Matrix.Identity());
        }
        mesh.skeleton = skeleton;
        return mesh;
    };

    it("returns the default mapping when the mesh has no skeleton", () => {
        const mesh = new Mesh("mesh", scene);
        const resolved = _ResolveMixamoRigMapping(mesh);
        expect(resolved[WebXRBodyJoint.HIPS]).toBe("Hips");
        expect(resolved).toEqual(MixamoRigMapping);
    });

    it("returns the default mapping for un-prefixed Mixamo bones", () => {
        const mesh = createMeshWithSkeleton(["Hips", "Spine", "Head", "LeftHand"]);
        const resolved = _ResolveMixamoRigMapping(mesh);
        expect(resolved[WebXRBodyJoint.HIPS]).toBe("Hips");
        expect(resolved[WebXRBodyJoint.LEFT_HAND_WRIST]).toBe("LeftHand");
    });

    it("applies the mixamorig: prefix when bones are named mixamorig:Hips etc.", () => {
        const mesh = createMeshWithSkeleton(["mixamorig:Hips", "mixamorig:Spine", "mixamorig:Head", "mixamorig:LeftHand"]);
        const resolved = _ResolveMixamoRigMapping(mesh);
        expect(resolved[WebXRBodyJoint.HIPS]).toBe("mixamorig:Hips");
        expect(resolved[WebXRBodyJoint.LEFT_HAND_WRIST]).toBe("mixamorig:LeftHand");
    });

    it("auto-detects an arbitrary custom prefix from a bone matching *Hips", () => {
        const mesh = createMeshWithSkeleton(["ArmatureHips", "ArmatureSpine", "ArmatureHead"]);
        const resolved = _ResolveMixamoRigMapping(mesh);
        expect(resolved[WebXRBodyJoint.HIPS]).toBe("ArmatureHips");
        expect(resolved[WebXRBodyJoint.SPINE_LOWER]).toBe("ArmatureSpine");
    });

    it("falls through to a child mesh's skeleton when the root mesh has none", () => {
        const root = new Mesh("root", scene);
        const child = createMeshWithSkeleton(["mixamorig:Hips", "mixamorig:Head"]);
        child.parent = root;
        const resolved = _ResolveMixamoRigMapping(root);
        expect(resolved[WebXRBodyJoint.HIPS]).toBe("mixamorig:Hips");
    });
});

describe("WebXRBodyTracking - feature class", () => {
    let engine: Engine;
    let scene: Scene;
    let sessionManager: WebXRSessionManager;
    let originalXr: any;

    beforeEach(async () => {
        engine = new NullEngine({ renderHeight: 256, renderWidth: 256, textureSize: 256 });
        scene = new Scene(engine);
        // Stub navigator.xr so WebXRSessionManager can initialize and
        // `isNative` (used by `xrNativeFeatureName` setter) does not throw.
        originalXr = (navigator as any).xr;
        (navigator as any).xr = { isSessionSupported: vi.fn() };
        sessionManager = new WebXRSessionManager(scene);
        await sessionManager.initializeAsync();
    });

    afterEach(() => {
        sessionManager.dispose();
        scene.dispose();
        engine.dispose();
        if (originalXr === undefined) {
            delete (navigator as any).xr;
        } else {
            (navigator as any).xr = originalXr;
        }
    });

    it("exposes the expected static identity", () => {
        expect(WebXRBodyTracking.Name).toBe("xr-body-tracking");
        expect(WebXRBodyTracking.Name).toBe(WebXRFeatureName.BODY_TRACKING);
        expect(typeof WebXRBodyTracking.Version).toBe("number");
    });

    it("is registered with the WebXR features manager", () => {
        const latest = WebXRFeaturesManager.GetLatestVersionOfFeature(WebXRBodyTracking.Name);
        expect(latest).toBeGreaterThan(0);
        const ctor = WebXRFeaturesManager.ConstructFeature(WebXRBodyTracking.Name, latest, sessionManager);
        expect(ctor).toBeDefined();
        const instance = ctor();
        expect(instance).toBeInstanceOf(WebXRBodyTracking);
        (instance as WebXRBodyTracking).dispose();
    });

    it("constructs with default options and exposes the xr native feature name", () => {
        const feature = new WebXRBodyTracking(sessionManager);
        expect(feature.xrNativeFeatureName).toBe("body-tracking");
        expect(feature.trackedBody).toBeNull();
        expect(feature.isTracking).toBe(false);
        feature.dispose();
    });

    it("exposes observables that can be (un)subscribed without throwing", () => {
        const feature = new WebXRBodyTracking(sessionManager);
        const noop = () => {};
        const observers = [
            feature.onBodyTrackingStartedObservable.add(noop),
            feature.onBodyTrackingEndedObservable.add(noop),
            feature.onBodyTrackingFrameUpdateObservable.add(noop),
            feature.onBodyMeshSetObservable.add(noop),
        ];
        for (const o of observers) {
            expect(o).toBeTruthy();
        }
        feature.onBodyTrackingStartedObservable.remove(observers[0]);
        feature.onBodyTrackingEndedObservable.remove(observers[1]);
        feature.onBodyTrackingFrameUpdateObservable.remove(observers[2]);
        feature.onBodyMeshSetObservable.remove(observers[3]);
        feature.dispose();
    });

    it("setBodyMesh stores the mesh on options even before tracking starts", () => {
        const feature = new WebXRBodyTracking(sessionManager);
        const mesh = new Mesh("m", scene);
        feature.setBodyMesh(mesh);
        expect(feature.options.bodyMesh).toBe(mesh);
        feature.dispose();
    });
});
