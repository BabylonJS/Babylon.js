/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxhik2fbxcharacter.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_HIK_TO_FBXCHARACTER_H_
#define _FBXSDK_SCENE_CONSTRAINT_HIK_TO_FBXCHARACTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/constraint/fbxcharacter.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCharacterPropertyInfo
{
public:
	const char*					mHIKPropertyName;
	const char*					mFbxCharacterPropertyModeName;
	const char*					mFbxCharacterPropertyName;
	int							mIndex;
	FbxCharacter::EPropertyUnit	mUnit;
};

static const FbxCharacterPropertyInfo gHIK2FbxCharacterPropertyBridge[] = 
{
	{ "PullIterationCount" ,NULL,"PullIterationCount",0,FbxCharacter::ePropertyReal},
	{ "Posture" ,NULL,"Posture",0,FbxCharacter::ePropertyEnum},
	{ "ForceActorSpace" ,"ForceActorSpace",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "ScaleCompensation" ,"ScaleCompensationMode","ScaleCompensation",0,FbxCharacter::ePropertyReal},
	{ "HipsHeightCompensation" ,"HipsHeightCompensationMode","HipsHeightCompensation",0,FbxCharacter::ePropertyCentimeter},
	{ "AnkleHeightCompensation" ,"AnkleHeightCompensationMode","AnkleHeightCompensation",0,FbxCharacter::ePropertyCentimeter},
	{ "AnkleProximityCompensation" ,"AnkleProximityCompensationMode","AnkleProximityCompensation",0,FbxCharacter::ePropertyCentimeter},
	{ "MassCenterCompensation" ,NULL,"MassCenterCompensation",0,FbxCharacter::ePropertyReal},
	{ "ApplyLimits" ,"ApplyLimits",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "ChestReduction" ,NULL,"ChestReduction",0,FbxCharacter::ePropertyPercent},
	{ "CollarReduction" ,NULL,"CollarReduction",0,FbxCharacter::ePropertyPercent},
	{ "NeckReduction" ,NULL,"NeckReduction",0,FbxCharacter::ePropertyPercent},
	{ "HeadReduction" ,NULL,"HeadReduction",0,FbxCharacter::ePropertyPercent},
	{ "ParamFootContactStiffness" ,NULL,"FootContactStiffness",0,FbxCharacter::ePropertyPercent},
	{ "ParamHandContactStiffness" ,NULL,"HandContactStiffness",0,FbxCharacter::ePropertyPercent},
	{ "ParamFootFingerContactRollStiffness" ,NULL,"FootFingerContactRollStiffness",0,FbxCharacter::ePropertyPercent},
	{ "ParamHandFingerContactRollStiffness" ,NULL,"HandFingerContactRollStiffness",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftAnkle" ,NULL,"ReachActorLeftAnkle",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightAnkle" ,NULL,"ReachActorRightAnkle",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftKnee" ,NULL,"ReachActorLeftKnee",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightKnee" ,NULL,"ReachActorRightKnee",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorChest" ,NULL,"ReachActorChest",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorHead" ,NULL,"ReachActorHead",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftWrist" ,NULL,"ReachActorLeftWrist",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightWrist" ,NULL,"ReachActorRightWrist",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftElbow" ,NULL,"ReachActorLeftElbow",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightElbow" ,NULL,"ReachActorRightElbow",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightFingerBase" ,NULL,"ReachActorRightFingerBase",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftFingerBase" ,NULL,"ReachActorLeftFingerBase",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightToesBase" ,NULL,"ReachActorRightToesBase",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftToesBase" ,NULL,"ReachActorLeftToesBase",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightFingerBaseRotation" ,NULL,"ReachActorRightFingerBaseRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftFingerBaseRotation" ,NULL,"ReachActorLeftFingerBaseRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightToesBaseRotation" ,NULL,"ReachActorRightToesBaseRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftToesBaseRotation" ,NULL,"ReachActorLeftToesBaseRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftAnkleRotationRotation" ,NULL,"ReachActorLeftAnkleRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightAnkleRotation" ,NULL,"ReachActorRightAnkleRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorHeadRotation" ,NULL,"ReachActorHeadRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLeftWristRotation" ,NULL,"ReachActorLeftWristRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorRightWristRotation" ,NULL,"ReachActorRightWristRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorChestRotation" ,NULL,"ReachActorChestRotation",0,FbxCharacter::ePropertyPercent},
	{ "ReachActorLowerChestRotation" ,NULL,"ReachActorLowerChestRotation",0,FbxCharacter::ePropertyPercent},
	{ "HipsTOffsetX" ,NULL,"HipsTOffset",0,FbxCharacter::ePropertyCentimeter},
	{ "HipsTOffsetY" ,NULL,"HipsTOffset",1,FbxCharacter::ePropertyCentimeter},
	{ "HipsTOffsetZ" ,NULL,"HipsTOffset",2,FbxCharacter::ePropertyCentimeter},
	{ "ChestTOffsetX" ,NULL,"ChestTOffset",0,FbxCharacter::ePropertyCentimeter},
	{ "ChestTOffsetY" ,NULL,"ChestTOffset",1,FbxCharacter::ePropertyCentimeter},
	{ "ChestTOffsetZ" ,NULL,"ChestTOffset",2,FbxCharacter::ePropertyCentimeter},
	{ "LeftUpLegRollEx" ,"LeftUpLegRollExMode","LeftUpLegRollEx",0,FbxCharacter::ePropertyPercent}, 
	{ "LeftLegRollEx" ,"LeftLegRollExMode","LeftLegRollEx",0,FbxCharacter::ePropertyPercent},
	{ "RightUpLegRollEx" ,"RightUpLegRollExMode","RightUpLegRollEx",0,FbxCharacter::ePropertyPercent},
	{ "RightLegRollEx" ,"RightLegRollExMode","RightLegRollEx",0,FbxCharacter::ePropertyPercent},
	{ "LeftArmRollEx" ,"LeftArmRollExMode","LeftArmRollEx",0,FbxCharacter::ePropertyPercent},
	{ "LeftForeArmRollEx" ,"LeftForeArmRollExMode","LeftForeArmRollEx",0,FbxCharacter::ePropertyPercent},
	{ "RightArmRollEx" ,"RightArmRollExMode","RightArmRollEx",0,FbxCharacter::ePropertyPercent},
	{ "RightForeArmRollEx" ,"RightForeArmRollExMode","RightForeArmRollEx",0,FbxCharacter::ePropertyPercent},
	{ "LeftUpLegRoll" ,"LeftUpLegRollMode","LeftUpLegRoll",0,FbxCharacter::ePropertyPercent},
	{ "LeftLegRoll" ,"LeftLegRollMode","LeftLegRoll",0,FbxCharacter::ePropertyPercent},
	{ "RightUpLegRoll" ,"RightUpLegRollMode","RightUpLegRoll",0,FbxCharacter::ePropertyPercent},
	{ "RightLegRoll" ,"RightLegRollMode","RightLegRoll",0,FbxCharacter::ePropertyPercent},
	{ "LeftArmRoll" ,"LeftArmRollMode","LeftArmRoll",0,FbxCharacter::ePropertyPercent},
	{ "LeftForeArmRoll" ,"LeftForeArmRollMode","LeftForeArmRoll",0,FbxCharacter::ePropertyPercent},
	{ "RightArmRoll" ,"RightArmRollMode","RightArmRoll",0,FbxCharacter::ePropertyPercent},
	{ "RightForeArmRoll" ,"RightForeArmRollMode","RightForeArmRoll",0,FbxCharacter::ePropertyPercent},
	{ "FloorContact" ,"FootFloorContact","FootFloorContact",0,FbxCharacter::ePropertyNoUnit},
	{ "AutomaticToes" ,"FootAutomaticToes",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "RollExtractionMode" ,NULL,"RollExtractionMode",0,FbxCharacter::ePropertyEnum},
	{ "FloorPivot" ,NULL,"FootFloorPivot",0,FbxCharacter::ePropertyEnum},
	{ "FootBottomToAnkle" ,NULL,"FootBottomToAnkle",0,FbxCharacter::ePropertyCentimeter},
	{ "FootBackToAnkle" ,NULL,"FootBackToAnkle",0,FbxCharacter::ePropertyCentimeter},
	{ "FootMiddleToAnkle" ,NULL,"FootMiddleToAnkle",0,FbxCharacter::ePropertyCentimeter},
	{ "FootFrontToMiddle" ,NULL,"FootFrontToMiddle",0,FbxCharacter::ePropertyCentimeter},
	{ "FootInToAnkle" ,NULL,"FootInToAnkle",0,FbxCharacter::ePropertyCentimeter},
	{ "FootOutToAnkle" ,NULL,"FootOutToAnkle",0,FbxCharacter::ePropertyCentimeter},
	{ "ContactSize" ,NULL,"FootContactSize",0,FbxCharacter::ePropertyReal},
	{ "HandFloorContact" ,"HandFloorContact","HandFloorContact",0,FbxCharacter::ePropertyNoUnit},
	{ "AutomaticFingers" ,"HandAutomaticFingers",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "HandFloorPivot" ,NULL,"HandFloorPivot",0,FbxCharacter::ePropertyEnum},
	{ "HandBottomToWrist" ,NULL,"HandBottomToWrist",0,FbxCharacter::ePropertyCentimeter},
	{ "HandBackToWrist" ,NULL,"HandBackToWrist",0,FbxCharacter::ePropertyCentimeter},
	{ "HandMiddleToWrist" ,NULL,"HandMiddleToWrist",0,FbxCharacter::ePropertyCentimeter},
	{ "HandFrontToMiddle" ,NULL,"HandFrontToMiddle",0,FbxCharacter::ePropertyCentimeter},
	{ "HandInToWrist" ,NULL,"HandInToWrist",0,FbxCharacter::ePropertyCentimeter},
	{ "HandOutToWrist" ,NULL,"HandOutToWrist",0,FbxCharacter::ePropertyCentimeter},
	{ "HandContactSize" ,NULL,"HandContactSize",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftHandThumbTip" ,NULL,"LeftHandThumbTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftHandIndexTip" ,NULL,"LeftHandIndexTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftHandMiddleTip" ,NULL,"LeftHandMiddleTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftHandRingTip" ,NULL,"LeftHandRingTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftHandPinkyTip" ,NULL,"LeftHandPinkyTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftHandExtraFingerTip" ,NULL,"LeftHandExtraFingerTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightHandThumbTip" ,NULL,"RightHandThumbTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightHandIndexTip" ,NULL,"RightHandIndexTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightHandMiddleTip" ,NULL,"RightHandMiddleTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightHandRingTip" ,NULL,"RightHandRingTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightHandPinkyTip" ,NULL,"RightHandPinkyTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightHandExtraFingerTip" ,NULL,"RightHandExtraFingerTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftFootThumbTip" ,NULL,"LeftFootThumbTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftFootIndexTip" ,NULL,"LeftFootIndexTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftFootMiddleTip" ,NULL,"LeftFootMiddleTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftFootRingTip" ,NULL,"LeftFootRingTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftFootPinkyTip" ,NULL,"LeftFootPinkyTip",0,FbxCharacter::ePropertyCentimeter},
	{ "LeftFootExtraFingerTip" ,NULL,"LeftFootExtraFingerTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightFootThumbTip" ,NULL,"RightFootThumbTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightFootIndexTip" ,NULL,"RightFootIndexTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightFootMiddleTip" ,NULL,"RightFootMiddleTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightFootRingTip" ,NULL,"RightFootRingTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightFootPinkyTip" ,NULL,"RightFootPinkyTip",0,FbxCharacter::ePropertyCentimeter},
	{ "RightFootExtraFingerTip" ,NULL,"RightFootExtraFingerTip",0,FbxCharacter::ePropertyCentimeter},
	{ "FingerSolving" ,"FingerSolving",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "FootFingerContact" ,"FootFingerContact","FootFingerContact",0,FbxCharacter::ePropertyNoUnit},
	{ "FootContactType" ,NULL,"FootContactType",0,FbxCharacter::ePropertyEnum},
	{ "FootFingerContactMode" ,NULL,"FootFingerContactMode",0,FbxCharacter::ePropertyEnum},
	{ "HandFingerContact" ,"HandFingerContact","HandFingerContact",0,FbxCharacter::ePropertyNoUnit},
	{ "HandContactType" ,NULL,"HandContactType",0,FbxCharacter::ePropertyEnum},
	{ "HandFingerContactMode" ,NULL,"HandFingerContactMode",0,FbxCharacter::ePropertyEnum},
	{ "CtrlPullLeftToeBase" ,NULL,"CtrlPullLeftToeBase",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullLeftFoot" ,NULL,"CtrlPullLeftFoot",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullLeftKnee" ,NULL,"CtrlPullLeftKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullRightToeBase" ,NULL,"CtrlPullRightToeBase",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullRightFoot" ,NULL,"CtrlPullRightFoot",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullRightKnee" ,NULL,"CtrlPullRightKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullLeftFingerBase" ,NULL,"CtrlPullLeftFingerBase",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullLeftHand" ,NULL,"CtrlPullLeftHand",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullLeftElbow" ,NULL,"CtrlPullLeftElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullRightFingerBase" ,NULL,"CtrlPullRightFingerBase",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullRightHand" ,NULL,"CtrlPullRightHand",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullRightElbow" ,NULL,"CtrlPullRightElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlChestPullLeftHand" ,NULL,"CtrlChestPullLeftHand",0,FbxCharacter::ePropertyPercent},
	{ "CtrlChestPullRightHand" ,NULL,"CtrlChestPullRightHand",0,FbxCharacter::ePropertyPercent},
	{ "CtrlPullHead" ,NULL,"CtrlPullHead",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistHipsPosition" ,NULL,"CtrlResistHipsPosition",0,FbxCharacter::ePropertyPercent},
	{ "CtrlEnforceGravity" ,NULL,"CtrlEnforceGravity",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistHipsOrientation" ,NULL,"CtrlResistHipsOrientation",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistChestPosition" ,NULL,"CtrlResistChestPosition",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistChestOrientation" ,NULL,"CtrlResistChestOrientation",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistLeftCollar" ,NULL,"CtrlResistLeftCollar",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistRightCollar" ,NULL,"CtrlResistRightCollar",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistLeftKnee" ,NULL,"CtrlResistLeftKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistMaximumExtensionLeftKnee" ,NULL,"CtrlResistMaximumExtensionLeftKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistCompressionFactorLeftKnee" ,NULL,"CtrlResistCompressionFactorLeftKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistRightKnee" ,NULL,"CtrlResistRightKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistMaximumExtensionRightKnee" ,NULL,"CtrlResistMaximumExtensionRightKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistCompressionFactorRightKnee" ,NULL,"CtrlResistCompressionFactorRightKnee",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistLeftElbow" ,NULL,"CtrlResistLeftElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistMaximumExtensionLeftElbow" ,NULL,"CtrlResistMaximumExtensionLeftElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistCompressionFactorLeftElbow" ,NULL,"CtrlResistCompressionFactorLeftElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistRightElbow" ,NULL,"CtrlResistRightElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistMaximumExtensionRightElbow" ,NULL,"CtrlResistMaximumExtensionRightElbow",0,FbxCharacter::ePropertyPercent},
	{ "CtrlResistCompressionFactorRightElbow" ,NULL,"CtrlResistCompressionFactorRightElbow",0,FbxCharacter::ePropertyPercent},
	{ "ParamCtrlSpineStiffness" ,NULL,"CtrlSpineStiffness",0,FbxCharacter::ePropertyPercent},
	{ "ParamCtrlNeckStiffness" ,NULL,"CtrlNeckStiffness",0,FbxCharacter::ePropertyPercent},
	{ "Mirror" ,"MirrorMode",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "ShoulderCorrection" ,NULL,"ShoulderCorrection",0,FbxCharacter::ePropertyPercent},
	{ "LeftKneeKillPitch" ,"LeftKneeKillPitch",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "RightKneeKillPitch" ,"RightKneeKillPitch",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "LeftElbowKillPitch" ,"LeftElbowKillPitch",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "RightElbowKillPitch" ,"RightElbowKillPitch",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "HipsTranslationMode" ,NULL,"HipsTranslationMode",0,FbxCharacter::ePropertyEnum},
	{ "WriteReference" ,"WriteReference",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "SyncMode" ,"SyncMode",NULL,0,FbxCharacter::ePropertyNoUnit},
	{ "Damping" ,NULL,"Damping",0,FbxCharacter::ePropertyReal},
	{ "Orientation" ,"OrientationDampingMode","OrientationDamping",0,FbxCharacter::ePropertySecond},
	{ "Displacement" ,"DisplacementDampingMode","DisplacementDamping",0,FbxCharacter::ePropertyReal},
	{ "DisplacementMemory" ,"DisplacementMemoryMode","DisplacementMemory",0,FbxCharacter::ePropertySecond},
	{ "HipsDisplacementDamping" ,"HipsDisplacementDampingMode","HipsDisplacementDamping",0,FbxCharacter::ePropertyReal},
	{ "AnkleDisplacementDamping" ,"AnkleDisplacementDampingMode","AnkleDisplacementDamping",0,FbxCharacter::ePropertyReal},
	{ "WristDisplacementDamping" ,"WristDisplacementDampingMode","WristDisplacementDamping",0,FbxCharacter::ePropertyReal},
	{ "Stabilization" ,NULL,"Stabilization",0,FbxCharacter::ePropertyReal},
	{ "AnkleStabilizationTime" ,"AnkleStabilizationTimeMode","AnkleStabilizationTime",0,FbxCharacter::ePropertySecond},
	{ "AnkleStabilizationPerimeter" ,"AnkleStabilizationPerimeterMode","AnkleStabilizationPerimeter",0,FbxCharacter::ePropertyCentimeter},
	{ "AnkleStabilizationAngularPerimeter" ,"AnkleStabilizationAngularPerimeterMode","AnkleStabilizationAngularPerimeter",0,FbxCharacter::ePropertyDegree},
	{ "AnkleStabilizationFloorProximity" ,"AnkleStabilizationFloorProximityMode","AnkleStabilizationFloorProximity",0,FbxCharacter::ePropertyCentimeter},
	{ "AnkleStabilizationDamping" ,"AnkleStabilizationDampingMode","AnkleStabilizationDamping",0,FbxCharacter::ePropertySecond},
	{ "AnkleStabilizationRecoveryTime" ,"AnkleStabilizationRecoveryTimeMode","AnkleStabilizationRecoveryTime",0,FbxCharacter::ePropertySecond},
    { "ContactBehaviour" ,NULL,"ContactBehaviour",0},
    { "ShoulderCorrection", NULL, "RealisticShoulder",0,FbxCharacter::ePropertyReal},
    { "CollarStiffnessX", NULL, "CollarStiffnessX",0,FbxCharacter::ePropertyReal},
    { "CollarStiffnessY", NULL, "CollarStiffnessY",0,FbxCharacter::ePropertyReal}, 
    { "CollarStiffnessZ", NULL, "CollarStiffnessZ",0,FbxCharacter::ePropertyReal}, 
    { "ExtraCollarRatio", NULL, "ExtraCollarRatio",0,FbxCharacter::ePropertyPercent},
    { "LeftLegMaxExtensionAngle", NULL, "LeftLegMaxExtensionAngle",0,FbxCharacter::ePropertyReal},
    { "RightLegMaxExtensionAngle", NULL, "RightLegMaxExtensionAngle",0,FbxCharacter::ePropertyReal}, 
    { "LeftArmMaxExtensionAngle", NULL, "LeftArmMaxExtensionAngle",0,FbxCharacter::ePropertyReal},
    { "RightArmMaxExtensionAngle", NULL, "RightArmMaxExtensionAngle",0,FbxCharacter::ePropertyReal}, 
    { "StretchStartArmsAndLegs", NULL, "StretchStartArmsAndLegs",0,FbxCharacter::ePropertyReal},
    { "StretchStopArmsAndLegs", NULL, "StretchStopArmsAndLegs",0,FbxCharacter::ePropertyReal},
    { "SnSScaleArmsAndLegs", NULL, "SnSScaleArmsAndLegs",0,FbxCharacter::ePropertyPercent},
    { "SnSReachLeftWrist", NULL, "SnSReachLeftWrist",0,FbxCharacter::ePropertyPercent},
    { "SnSReachRightWrist", NULL, "SnSReachRightWrist",0,FbxCharacter::ePropertyPercent}, 
    { "SnSReachLeftAnkle", NULL, "SnSReachLeftAnkle",0,FbxCharacter::ePropertyPercent},
    { "SnSReachRightAnkle", NULL, "SnSReachRightAnkle",0,FbxCharacter::ePropertyPercent}, 
    { "SnSScaleSpine", NULL, "SnSScaleSpine",0,FbxCharacter::ePropertyPercent},
    { "SnSScaleSpineChildren", NULL, "SnSScaleSpineChildren",0,FbxCharacter::ePropertyPercent},
    { "SnSSpineFreedom", NULL, "SnSSpineFreedom",0,FbxCharacter::ePropertyPercent},
    { "SnSReachChestEnd", NULL, "SnSReachChestEnd",0,FbxCharacter::ePropertyPercent},
    { "SnSScaleNeck", NULL, "SnSScaleNeck",0,FbxCharacter::ePropertyPercent},
    { "SnSNeckFreedom", NULL, "SnSNeckFreedom",0,FbxCharacter::ePropertyPercent},
    { "SnSReachHead", NULL, "SnSReachHead",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftUpLegRoll1" ,"LeafLeftUpLegRoll1Mode","LeafLeftUpLegRoll1",0,FbxCharacter::ePropertyPercent}, 
    { "LeafLeftLegRoll1" ,"LeafLeftLegRoll1Mode","LeafLeftLegRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafRightUpLegRoll1" ,"LeafRightUpLegRoll1Mode","LeafRightUpLegRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafRightLegRoll1" ,"LeafRightLegRoll1Mode","LeafRightLegRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftArmRoll1" ,"LeafLeftArmRoll1Mode","LeafLeftArmRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftForeArmRoll1" ,"LeafLeftForeArmRoll1Mode","LeafLeftForeArmRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafRightArmRoll1" ,"LeafRightArmRoll1Mode","LeafRightArmRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafRightForeArmRoll1" ,"LeafRightForeArmRoll1Mode","LeafRightForeArmRoll1",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftUpLegRoll2" ,"LeafLeftUpLegRoll2Mode","LeafLeftUpLegRoll2",0,FbxCharacter::ePropertyPercent}, 
    { "LeafLeftLegRoll2" ,"LeafLeftLegRoll2Mode","LeafLeftLegRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafRightUpLegRoll2" ,"LeafRightUpLegRoll2Mode","LeafRightUpLegRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafRightLegRoll2" ,"LeafRightLegRoll2Mode","LeafRightLegRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftArmRoll2" ,"LeafLeftArmRoll2Mode","LeafLeftArmRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftForeArmRoll2" ,"LeafLeftForeArmRoll2Mode","LeafLeftForeArmRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafRightArmRoll2" ,"LeafRightArmRoll2Mode","LeafRightArmRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafRightForeArmRoll2" ,"LeafRightForeArmRoll2Mode","LeafRightForeArmRoll2",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftUpLegRoll3" ,"LeafLeftUpLegRoll3Mode","LeafLeftUpLegRoll3",0,FbxCharacter::ePropertyPercent}, 
    { "LeafLeftLegRoll3" ,"LeafLeftLegRoll3Mode","LeafLeftLegRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafRightUpLegRoll3" ,"LeafRightUpLegRoll3Mode","LeafRightUpLegRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafRightLegRoll3" ,"LeafRightLegRoll3Mode","LeafRightLegRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftArmRoll3" ,"LeafLeftArmRoll3Mode","LeafLeftArmRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftForeArmRoll3" ,"LeafLeftForeArmRoll3Mode","LeafLeftForeArmRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafRightArmRoll3" ,"LeafRightArmRoll3Mode","LeafRightArmRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafRightForeArmRoll3" ,"LeafRightForeArmRoll3Mode","LeafRightForeArmRoll3",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftUpLegRoll4" ,"LeafLeftUpLegRoll4Mode","LeafLeftUpLegRoll4",0,FbxCharacter::ePropertyPercent}, 
    { "LeafLeftLegRoll4" ,"LeafLeftLegRoll4Mode","LeafLeftLegRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafRightUpLegRoll4" ,"LeafRightUpLegRoll4Mode","LeafRightUpLegRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafRightLegRoll4" ,"LeafRightLegRoll4Mode","LeafRightLegRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftArmRoll4" ,"LeafLeftArmRoll4Mode","LeafLeftArmRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftForeArmRoll4" ,"LeafLeftForeArmRoll4Mode","LeafLeftForeArmRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafRightArmRoll4" ,"LeafRightArmRoll4Mode","LeafRightArmRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafRightForeArmRoll4" ,"LeafRightForeArmRoll4Mode","LeafRightForeArmRoll4",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftUpLegRoll5" ,"LeafLeftUpLegRoll5Mode","LeafLeftUpLegRoll5",0,FbxCharacter::ePropertyPercent}, 
    { "LeafLeftLegRoll5" ,"LeafLeftLegRoll5Mode","LeafLeftLegRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeafRightUpLegRoll5" ,"LeafRightUpLegRoll5Mode","LeafRightUpLegRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeafRightLegRoll5" ,"LeafRightLegRoll5Mode","LeafRightLegRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftArmRoll5" ,"LeafLeftArmRoll5Mode","LeafLeftArmRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeafLeftForeArmRoll5" ,"LeafLeftForeArmRoll5Mode","LeafLeftForeArmRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeafRightArmRoll5" ,"LeafRightArmRoll5Mode","LeafRightArmRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeafRightForeArmRoll5" ,"LeafRightForeArmRoll5Mode","LeafRightForeArmRoll5",0,FbxCharacter::ePropertyPercent},
    { "LeftLegFullRollExtraction" ,NULL,"LeftLegFullRollExtraction",0,FbxCharacter::ePropertyPercent},
    { "RightLegFullRollExtraction" ,NULL,"RightLegFullRollExtraction",0,FbxCharacter::ePropertyPercent},
    { "LeftArmFullRollExtraction" ,NULL,"LeftArmFullRollExtraction",0,FbxCharacter::ePropertyPercent},
    { "RightArmFullRollExtraction" ,NULL,"RightArmFullRollExtraction",0,FbxCharacter::ePropertyPercent}
};

class HIK2FbxCharacterPropertyBridge
{
public:
	enum
	{
		mParamCount = sizeof(gHIK2FbxCharacterPropertyBridge) / sizeof(FbxCharacterPropertyInfo)
	};
	static inline const FbxCharacterPropertyInfo& GetAt(int i) { return gHIK2FbxCharacterPropertyBridge[i] ;}
	
	static inline const FbxCharacterPropertyInfo* GetPropertyInfoFromFbxCharacterProperty(const char* pCharacterPropertyName)
	{
		int lCounter = 0;
		for( lCounter = 0 ; lCounter < mParamCount; lCounter++ )
		{
			if(GetAt(lCounter).mFbxCharacterPropertyName && !strcmp(GetAt(lCounter).mFbxCharacterPropertyName, pCharacterPropertyName))
			{
				return &GetAt(lCounter);
			}
		}
		return NULL;
	}

	static inline const FbxCharacterPropertyInfo* GetPropertyInfoFromHIKProperty(const char* pHIKPropertyName)
	{
		int lCounter = 0;
		for( lCounter = 0 ; lCounter < mParamCount; lCounter++ )
		{
			if(!strcmp(GetAt(lCounter).mHIKPropertyName, pHIKPropertyName))
			{
				return &GetAt(lCounter);
			}
		}
		return NULL;
	}
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_HIK_TO_FBXCHARACTER_H_ */
