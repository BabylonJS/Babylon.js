/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcharacter.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_CHARACTER_H_
#define _FBXSDK_SCENE_CONSTRAINT_CHARACTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/math/fbxtransforms.h>
#include <fbxsdk/scene/constraint/fbxconstraint.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxControlSet;

/** \class FbxCharacterLink
  *
  * \brief This class represents a link between a given FBX node and the associated node in the character hierarchy. It also contains
  *  the transform matrix (offset) for the linked character's node.
  */
class FBXSDK_DLL FbxCharacterLink
{
public:
	/** \enum EType Character link type */
	enum EType
	{
		eCharacterLink,
		eControlSetLink,
		eControlSetEffector,
		eControlSetEffectorAux
	};

	/** Default Constructor. */
	FbxCharacterLink();

	/** Copy Constructor. */
	FbxCharacterLink(const FbxCharacterLink& pCharacterLink);

	/** Assignment operation
	  * \param pCharacterLink Another FbxCharacterLink object assigned to this one.
	  */
	FbxCharacterLink& operator=(const FbxCharacterLink& pCharacterLink);

	/** Reset to default values. */
	void Reset();

	FbxNode*	mNode;			//! The character's node in hierarchy linked to this character link.
	FbxString	mTemplateName;	//! A template name is a naming convention that is used to automatically map the nodes of other skeletons that use the same naming convention.
	FbxVector4	mOffsetT;		//! Get offset position of this character link.
	FbxVector4	mOffsetR;		//! Get offset rotation of this character link.
	FbxVector4	mOffsetS;		//! Get offset scale of this character link.
	FbxVector4	mParentROffset;	//! Get the parent offset rotation of this character link
	bool		mHasRotSpace;	//! \c true if this character link has a defined rotation space
	FbxLimits	mRLimits;		//! Get the rotation limits of this character link
	FbxVector4	mPreRotation;	//! Get the PreRotation of this character link
	FbxVector4	mPostRotation;	//! Get the PostRotation of this character link
	int			mRotOrder;		//! Get the rotation order of this character link
	double		mAxisLen;		//! Get the axis length of this character link

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxProperty mPropertyLink;
	FbxProperty mPropertyOffsetT;
	FbxProperty mPropertyOffsetR;
	FbxProperty mPropertyOffsetS;
	FbxProperty mPropertyParentOffsetR;
	FbxProperty mPropertyTemplateName;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

/** A Character is a person or animal with pre-defined skeleton system. The skeleton system is composed of multiple named node (skeleton).
  * This class contains all methods to setup an exported character or query information on an imported character.
  * This class also contains some methods for manipulating the FbxCharacterLink, FbxControlSet
  * 
  * The most important part of a FbxCharacter is the FbxCharacterLink. There is one FbxCharacterLink for each characterized node.
  * For more information see FbxCharacterLink class documentation.
  *
  * \see FbxCharacterLink, FbxControlSet
  */
class FBXSDK_DLL FbxCharacter : public FbxConstraint
{
	FBXSDK_OBJECT_DECLARE(FbxCharacter, FbxConstraint);

public:
	/** \enum EInputType Character input type.
	  * - \e eInputActor		Not supported.
	  * - \e eInputCharacter	The character's input is another character.
	  * - \e eInputMarkerSet	The character's input is a control rig.
	  * - \e eOutputMarkerSet	Not supported.
	  * - \e eInputStancePose	The character's input is the stance pose.
	  */
	enum EInputType
	{ 
		eInputActor, 
		eInputCharacter,
		eInputMarkerSet,
		eOutputMarkerSet,
		eInputStancePose
	};

	/** \enum EGroupId Define ID for character groups that contains multiple character nodes. */
	enum EGroupId
	{
		eGroupBase,
		eGroupAuxiliary,
		eGroupSpine,
		eGroupRoll,
		eGroupSpecial,
		eGroupLeftHand,
		eGroupRightHand,
		eGroupProps,
		eGroupGameModeParent,
		eGroupNeck,
		eGroupLeftFoot,
		eGroupRightFoot,
		eGroupFloorContact,
		eGroupIdCount
	};

	/** \enum ENodeId Define ID for each character node.
	 */
	enum ENodeId
	{       
		eHips,
		eLeftHip,
		eLeftKnee,
		eLeftAnkle,
		eLeftFoot,
		eRightHip,
		eRightKnee,
		eRightAnkle,
		eRightFoot,
		eWaist,
		eChest,
		eLeftCollar,
		eLeftShoulder,
		eLeftElbow,
		eLeftWrist,
		eRightCollar,
		eRightShoulder,
		eRightElbow,
		eRightWrist,
		eNeck,
		eHead,
		eLeftHipRoll,
		eLeftKneeRoll,
		eRightHipRoll,
		eRightKneeRoll,
		eLeftShoulderRoll,
		eLeftElbowRoll,
		eRightShoulderRoll,
		eRightElbowRoll,
		eSpine2,
		eSpine3,
		eSpine4,
		eSpine5,
		eSpine6,
		eSpine7,
		eSpine8,
		eSpine9,
		eLeftThumbA,
		eLeftThumbB,
		eLeftThumbC,
		eLeftIndexA,
		eLeftIndexB,
		eLeftIndexC,
		eLeftMiddleA,
		eLeftMiddleB,
		eLeftMiddleC,
		eLeftRingA,
		eLeftRingB,
		eLeftRingC,
		eLeftPinkyA,
		eLeftPinkyB,
		eLeftPinkyC,
		eRightThumbA,
		eRightThumbB,
		eRightThumbC,
		eRightIndexA,
		eRightIndexB,
		eRightIndexC,
		eRightMiddleA,
		eRightMiddleB,
		eRightMiddleC,
		eRightRingA,
		eRightRingB,
		eRightRingC,
		eRightPinkyA,
		eRightPinkyB,
		eRightPinkyC,
		eReference,
		eLeftFloor,
		eRightFloor,
		eHipsTranslation,
		eProps0,
		eProps1,
		eProps2,
		eProps3,
		eProps4,
		eGameModeParentLeftHipRoll,
		eGameModeParentLeftKnee,
		eGameModeParentLeftKneeRoll,
		eGameModeParentRightHipRoll,
		eGameModeParentRightKnee,
		eGameModeParentRightKneeRoll,
		eGameModeParentLeftShoulderRoll,       
		eGameModeParentLeftElbow,      
		eGameModeParentLeftElbowRoll,  
		eGameModeParentRightShoulderRoll,
		eGameModeParentRightElbow,             
		eGameModeParentRightElbowRoll, 
		eLeftUpLegRoll,
		eLeftLegRoll,
		eRightUpLegRoll,
		eRightLegRoll,
		eLeftArmRoll,
		eLeftForeArmRoll,
		eRightArmRoll,
		eRightForeArmRoll,
		eLeftHandFloor,
		eRightHandFloor,
		eLeftHand,
		eRightHand,
		eNeck1,
		eNeck2,
		eNeck3,
		eNeck4,
		eNeck5,
		eNeck6,
		eNeck7,
		eNeck8,
		eNeck9,
		eLeftInHandThumb,
		eLeftThumbD,
		eLeftInHandIndex,
		eLeftIndexD,
		eLeftInHandMiddle,
		eLeftMiddleD,
		eLeftInHandRing,
		eLeftRingD,
		eLeftInHandPinky,
		eLeftPinkyD,
		eLeftInHandExtraFinger,
		eLeftExtraFingerA,
		eLeftExtraFingerB,
		eLeftExtraFingerC,
		eLeftExtraFingerD,
		eRightInHandThumb,
		eRightThumbD,
		eRightInHandIndex,
		eRightIndexD,
		eRightInHandMiddle,
		eRightMiddleD,
		eRightInHandRing,
		eRightRingD,
		eRightInHandPinky,
		eRightPinkyD,
		eRightInHandExtraFinger,
		eRightExtraFingerA,
		eRightExtraFingerB,
		eRightExtraFingerC,
		eRightExtraFingerD,
		eLeftInFootThumb,
		eLeftFootThumbA,
		eLeftFootThumbB,
		eLeftFootThumbC,
		eLeftFootThumbD,
		eLeftInFootIndex,
		eLeftFootIndexA,
		eLeftFootIndexB,
		eLeftFootIndexC,
		eLeftFootIndexD,
		eLeftInFootMiddle,
		eLeftFootMiddleA,
		eLeftFootMiddleB,
		eLeftFootMiddleC,
		eLeftFootMiddleD,
		eLeftInFootRing,
		eLeftFootRingA,
		eLeftFootRingB,
		eLeftFootRingC,
		eLeftFootRingD,
		eLeftInFootPinky,
		eLeftFootPinkyA,
		eLeftFootPinkyB,
		eLeftFootPinkyC,
		eLeftFootPinkyD,
		eLeftInFootExtraFinger,
		eLeftFootExtraFingerA,
		eLeftFootExtraFingerB,
		eLeftFootExtraFingerC,
		eLeftFootExtraFingerD,
		eRightInFootThumb,
		eRightFootThumbA,
		eRightFootThumbB,
		eRightFootThumbC,
		eRightFootThumbD,
		eRightInFootIndex,
		eRightFootIndexA,
		eRightFootIndexB,
		eRightFootIndexC,
		eRightFootIndexD,
		eRightInFootMiddle,
		eRightFootMiddleA,
		eRightFootMiddleB,
		eRightFootMiddleC,
		eRightFootMiddleD,
		eRightInFootRing,
		eRightFootRingA,
		eRightFootRingB,
		eRightFootRingC,
		eRightFootRingD,
		eRightInFootPinky,
		eRightFootPinkyA,
		eRightFootPinkyB,
		eRightFootPinkyC,
		eRightFootPinkyD,
		eRightInFootExtraFinger,
		eRightFootExtraFingerA,
		eRightFootExtraFingerB,
		eRightFootExtraFingerC,
		eRightFootExtraFingerD,
		eLeftCollarExtra,
		eRightCollarExtra,
		eNodeIdCount,
		eNodeIdInvalid=-1
	};

	enum EOffAutoUser
	{
		eParamModeOff,
		eParamModeAuto,
		eParamModeUser
	};

	enum EAutoUser
	{
		eParamModeAuto2,
		eParamModeUser2
	};

	enum EPostureMode
	{
		ePostureBiped,
		ePostureQuadriped,
		ePostureCount
	};

	enum EFloorPivot
	{
		eFloorPivotAuto,
		eFloorPivotAnkle,
		eFloorPivotToes,
		eFloorPivotCount
	};

	enum ERollExtractionMode
	{
		eRelativeRollExtraction,
		eAbsoluteRollExtraction,
		eRollExtractionTypeCount
	};

	enum EHipsTranslationMode
	{
		eHipsTranslationWorldRigid,
		eHipsTranslationBodyRigid,
		eHipsTranslationTypeCount
	};

	enum EFootContactType
	{
		eFootTypeNormal,
		eFootTypeAnkle,
		eFootTypeToeBase,
		eFootTypeHoof,
		eFootContactModeCount
	};

	enum EHandContactType
	{
		eHandTypeNormal,
		eHandTypeWrist,
		eHandTypeFingerBase,
		eHandTypeHoof,
		eHandContactModeCount
	};

	enum EFingerContactMode
	{
		eFingerContactModeSticky,
		eFingerContactModeSpread,
		eFingerContactModeStickySpread,
		eFingerContactModeCount
	};

	enum EContactBehaviour
	{
		eContactNeverSync,
		eContactSyncOnKey,
		eContactAlwaysSync,
		eContactBehaviorCount
	};

	enum EPropertyUnit
	{
		ePropertyNoUnit,
		ePropertyPercent,
		ePropertySecond,
		ePropertyCentimeter,
		ePropertyDegree,
		ePropertyEnum,
		ePropertyReal
	};

	enum EErrorCode
	{
		eInternalError,
		eErrorCount
	}; 

	/** Reset to default values. 
	 *     - Input type will be set to eInputStancePose.
	 *     - Input object will be set to NULL.
	 *     - Each Character link will be reset.
	 *     - The control set will be reset.
	 */
	void Reset();

	/** Set input type and index.
	  * \param pInputType       Input type.
	  * \param pInputObject     Pointer to input character if input type equals eInputCharacter, otherwise \c NULL.
	  */
	void SetInput(EInputType pInputType, FbxObject* pInputObject = NULL);

	//! Get input type.
	EInputType GetInputType() const;

	/** Get input actor or character.
	  * \return     Pointer or \c Null, depending on the input type.
	  *                  - If the input type is set to eInputCharacter. The returned pointer can be casted to a pointer of type FbxCharacter.
	  *                  - \c Null pointer if the input object has not been set, or if the input type is not set to eInputCharacter.
	  */
	FbxObject* GetInputObject() const;

	/** Associate a character link to a given character node ID. If a character link already exists for this character node ID,
	  * the character link will be removed.
	  * \param pCharacterNodeId      Character node ID.
	  * \param pCharacterLink        Character link.
	  * \param pUpdateObjectList     Set to \c true to update the object list (default value).
	  * \return                      \c true if successful, \c false otherwise.
	  */
	bool SetCharacterLink(ENodeId pCharacterNodeId, const FbxCharacterLink& pCharacterLink, bool pUpdateObjectList = true);

	/** Get a character link associated with a given character node ID.
	  * \param pCharacterNodeId     ID of character node requested.
	  * \param pCharacterLink       Optional pointer to receive the character link if function succeeds.
	  * \return                     \c true if successful, \c false otherwise.
	  */
	bool GetCharacterLink(ENodeId pCharacterNodeId, FbxCharacterLink* pCharacterLink = NULL) const;

	/** Get control set associated with the character.
	 * \return     Return the control set associated with the character.
	 */
	FbxControlSet& GetControlSet() const;

	/** Get number of elements in a given character group.
	  * \param pCharacterGroupId     Character group ID.
	  * \return                      The number of elements in the pCharacterGroupId character group.
	  */
	static int GetCharacterGroupCount(EGroupId pCharacterGroupId);

	/** Get character node ID of an element in a given character group.
	  * \param pCharacterGroupId     Character group ID.
	  * \param pIndex                Character index ID.
	  * \return                      Character node ID.
	  */
	static ENodeId GetCharacterGroupElementByIndex(EGroupId pCharacterGroupId, int pIndex);


	/** Get character node name of an element in a given character group.
	  * \param pCharacterGroupId     Character group ID.
	  * \param pIndex                Character index ID.
	  * \return                      Character node name.
	  */
	static char* GetCharacterGroupNameByIndex(EGroupId pCharacterGroupId, int pIndex);

	/** Get character node version of an element in a given character group.
	  * \param pCharacterGroupId     Character group ID.
	  * \param pIndex                Character index ID.
	  * \return                      Character node version.
	  */
	static int GetCharacterGroupVersionByIndex(EGroupId pCharacterGroupId, int pIndex);

	/** Find the character group index associated with a given character node name.
	  * \param pName                 Character node name.
	  * \param pForceGroupId         Set to \c true to force the character group ID.
	  * \param pCharacterGroupId     Receives character group ID.
	  * \param pIndex                Receives character index ID.
	  * \return                      \c true if successful, otherwise \c false.
	  */
	static bool FindCharacterGroupIndexByName(const char* pName, bool pForceGroupId, EGroupId& pCharacterGroupId, int& pIndex);

	/** Get character node group and index of a given character node ID.
	  * \param pCharacterNodeId     Character node ID.
	  * \param pCharacterGroupId    if the Character node ID is found, the method returns the group ID through this parameter
	  * \param pIndex               if the Character node ID is found, the method returns the index through this parameter
	  * \remarks                    Only works for a character node ID that is part of a group.
	  * \return                     \c true if successful, \c false otherwise.
	  */
	static bool GetCharacterGroupIndexByElement(ENodeId pCharacterNodeId, EGroupId& pCharacterGroupId, int& pIndex);

	/** Get character node version of a given character node ID.
	  * \param pCharacterNodeId     Character node ID to get version.
	  * \param pVersion             if the node ID is found, the method returns the version through this parameter
	  * \remarks                    Only works for a character node ID is part of a group.
	  * \return                     \c true if successful, \c false otherwise.
	  */
	static bool GetCharacterGroupVersionByElement(ENodeId pCharacterNodeId, int& pVersion);

	/** Get character node name associated with a given character node ID.
	  * \param pCharacterNodeId     Character node ID to get name.
	  * \param pName                if the node ID is found, the method returns the node name through this parameter
	  *                             Since the Pointer points to internal data, it is not necessary to allocate a string buffer 
	  *                             before calling this function.
	  * \return                     \c true if a name exists for the given node ID.
	  */
	static bool GetCharacterNodeNameFromNodeId(ENodeId pCharacterNodeId, char*& pName);

	/** Get the character node ID associated with a given character node name.
	  * \param pName                Character node name to get node ID.
	  * \param pCharacterNodeId     if the node name is found, this method returns the node ID through this parameter
	  * \return                     \c true if a node ID exists for the given node name.
	  */
	static bool GetCharacterNodeIdFromNodeName(const char* pName, ENodeId& pCharacterNodeId);
        
	// FbxCharacter Properties
	FbxPropertyT<FbxInt>				PullIterationCount;
	FbxPropertyT<EPostureMode>			Posture;
	FbxPropertyT<FbxBool>				ForceActorSpace;
	FbxPropertyT<FbxDouble>				ScaleCompensation;
	FbxPropertyT<EOffAutoUser>			ScaleCompensationMode;
	FbxPropertyT<FbxDouble>				HipsHeightCompensation;
	FbxPropertyT<EOffAutoUser>			HipsHeightCompensationMode;
	FbxPropertyT<FbxDouble>				AnkleHeightCompensation;
	FbxPropertyT<EOffAutoUser>			AnkleHeightCompensationMode;
	FbxPropertyT<FbxDouble>				AnkleProximityCompensation;
	FbxPropertyT<EOffAutoUser>			AnkleProximityCompensationMode;
	FbxPropertyT<FbxDouble>				MassCenterCompensation;
	FbxPropertyT<FbxBool>				ApplyLimits;
	FbxPropertyT<FbxDouble>				ChestReduction;
	FbxPropertyT<FbxDouble>				CollarReduction;
	FbxPropertyT<FbxDouble>				NeckReduction;
	FbxPropertyT<FbxDouble>				HeadReduction;
	FbxPropertyT<FbxDouble>				ReachActorLeftAnkle;
	FbxPropertyT<FbxDouble>				ReachActorRightAnkle;
	FbxPropertyT<FbxDouble>				ReachActorLeftKnee;
	FbxPropertyT<FbxDouble>				ReachActorRightKnee;
	FbxPropertyT<FbxDouble>				ReachActorChest;
	FbxPropertyT<FbxDouble>				ReachActorHead;
	FbxPropertyT<FbxDouble>				ReachActorLeftWrist;
	FbxPropertyT<FbxDouble>				ReachActorRightWrist;
	FbxPropertyT<FbxDouble>				ReachActorLeftElbow;
	FbxPropertyT<FbxDouble>				ReachActorRightElbow;
	FbxPropertyT<FbxDouble>				ReachActorLeftFingerBase;
	FbxPropertyT<FbxDouble>				ReachActorRightFingerBase;
	FbxPropertyT<FbxDouble>				ReachActorLeftToesBase;
	FbxPropertyT<FbxDouble>				ReachActorRightToesBase;
	FbxPropertyT<FbxDouble>				ReachActorLeftFingerBaseRotation;
	FbxPropertyT<FbxDouble>				ReachActorRightFingerBaseRotation;
	FbxPropertyT<FbxDouble>				ReachActorLeftToesBaseRotation;
	FbxPropertyT<FbxDouble>				ReachActorRightToesBaseRotation;
	FbxPropertyT<FbxDouble>				ReachActorLeftAnkleRotation;
	FbxPropertyT<FbxDouble>				ReachActorRightAnkleRotation;
	FbxPropertyT<FbxDouble>				ReachActorHeadRotation;
	FbxPropertyT<FbxDouble>				ReachActorLeftWristRotation;
	FbxPropertyT<FbxDouble>				ReachActorRightWristRotation;
	FbxPropertyT<FbxDouble>				ReachActorChestRotation;
	FbxPropertyT<FbxDouble>				ReachActorLowerChestRotation;
	FbxPropertyT<FbxDouble3>			HipsTOffset;
	FbxPropertyT<FbxDouble3>			ChestTOffset;
	FbxPropertyT<ERollExtractionMode>	RollExtractionMode;
	FbxPropertyT<FbxDouble>				LeftUpLegRoll;
	FbxPropertyT<FbxBool>				LeftUpLegRollMode;
	FbxPropertyT<FbxDouble>				LeftLegRoll;
	FbxPropertyT<FbxBool>				LeftLegRollMode;
	FbxPropertyT<FbxDouble>				RightUpLegRoll;
	FbxPropertyT<FbxBool>				RightUpLegRollMode;
	FbxPropertyT<FbxDouble>				RightLegRoll;
	FbxPropertyT<FbxBool>				RightLegRollMode;
	FbxPropertyT<FbxDouble>				LeftArmRoll;
	FbxPropertyT<FbxBool>				LeftArmRollMode;
	FbxPropertyT<FbxDouble>				LeftForeArmRoll;
	FbxPropertyT<FbxBool>				LeftForeArmRollMode;
	FbxPropertyT<FbxDouble>				RightArmRoll;
	FbxPropertyT<FbxBool>				RightArmRollMode;
	FbxPropertyT<FbxDouble>				RightForeArmRoll;
	FbxPropertyT<FbxBool>				RightForeArmRollMode;
	FbxPropertyT<FbxDouble>				LeftUpLegRollEx;
	FbxPropertyT<FbxBool>				LeftUpLegRollExMode;
	FbxPropertyT<FbxDouble>				LeftLegRollEx;
	FbxPropertyT<FbxBool>				LeftLegRollExMode;
	FbxPropertyT<FbxDouble>				RightUpLegRollEx;
	FbxPropertyT<FbxBool>				RightUpLegRollExMode;
	FbxPropertyT<FbxDouble>				RightLegRollEx;
	FbxPropertyT<FbxBool>				RightLegRollExMode;
	FbxPropertyT<FbxDouble>				LeftArmRollEx;
	FbxPropertyT<FbxBool>				LeftArmRollExMode;
	FbxPropertyT<FbxDouble>				LeftForeArmRollEx;
	FbxPropertyT<FbxBool>				LeftForeArmRollExMode;
	FbxPropertyT<FbxDouble>				RightArmRollEx;
	FbxPropertyT<FbxBool>				RightArmRollExMode;
	FbxPropertyT<FbxDouble>				RightForeArmExRoll;
	FbxPropertyT<FbxBool>				RightForeArmRollExMode;
	FbxPropertyT<EContactBehaviour>		ContactBehaviour;
	FbxPropertyT<FbxBool>				FootFloorContact;
	FbxPropertyT<FbxBool>				FootAutomaticToes;
	FbxPropertyT<EFloorPivot>			FootFloorPivot;
	FbxPropertyT<FbxDouble>				FootBottomToAnkle;
	FbxPropertyT<FbxDouble>				FootBackToAnkle;
	FbxPropertyT<FbxDouble>				FootMiddleToAnkle;
	FbxPropertyT<FbxDouble>				FootFrontToMiddle;
	FbxPropertyT<FbxDouble>				FootInToAnkle;
	FbxPropertyT<FbxDouble>				FootOutToAnkle;
	FbxPropertyT<FbxDouble>				FootContactSize;
	FbxPropertyT<FbxBool>				FootFingerContact;
	FbxPropertyT<EFootContactType>		FootContactType;
	FbxPropertyT<EFingerContactMode>	FootFingerContactMode;
	FbxPropertyT<FbxDouble>				FootContactStiffness;
	FbxPropertyT<FbxDouble>				FootFingerContactRollStiffness;
	FbxPropertyT<FbxBool>				HandFloorContact;
	FbxPropertyT<FbxBool>				HandAutomaticFingers;
	FbxPropertyT<EFloorPivot>			HandFloorPivot;
	FbxPropertyT<FbxDouble>				HandBottomToWrist;
	FbxPropertyT<FbxDouble>				HandBackToWrist;
	FbxPropertyT<FbxDouble>				HandMiddleToWrist;
	FbxPropertyT<FbxDouble>				HandFrontToMiddle;
	FbxPropertyT<FbxDouble>				HandInToWrist;
	FbxPropertyT<FbxDouble>				HandOutToWrist;
	FbxPropertyT<FbxDouble>				HandContactSize;
	FbxPropertyT<FbxBool>				HandFingerContact;
	FbxPropertyT<EHandContactType>		HandContactType;
	FbxPropertyT<EFingerContactMode>	HandFingerContactMode;
	FbxPropertyT<FbxDouble>				HandContactStiffness;
	FbxPropertyT<FbxDouble>				HandFingerContactRollStiffness;
	FbxPropertyT<FbxDouble>				LeftHandThumbTip;
	FbxPropertyT<FbxDouble>				LeftHandIndexTip;
	FbxPropertyT<FbxDouble>				LeftHandMiddleTip;
	FbxPropertyT<FbxDouble>				LeftHandRingTip;
	FbxPropertyT<FbxDouble>				LeftHandPinkyTip;
	FbxPropertyT<FbxDouble>				LeftHandExtraFingerTip;
	FbxPropertyT<FbxDouble>				RightHandThumbTip;
	FbxPropertyT<FbxDouble>				RightHandIndexTip;
	FbxPropertyT<FbxDouble>				RightHandMiddleTip;
	FbxPropertyT<FbxDouble>				RightHandRingTip;
	FbxPropertyT<FbxDouble>				RightHandPinkyTip;
	FbxPropertyT<FbxDouble>				RightHandExtraFingerTip;
	FbxPropertyT<FbxDouble>				LeftFootThumbTip;
	FbxPropertyT<FbxDouble>				LeftFootIndexTip;
	FbxPropertyT<FbxDouble>				LeftFootMiddleTip;
	FbxPropertyT<FbxDouble>				LeftFootRingTip;
	FbxPropertyT<FbxDouble>				LeftFootPinkyTip;
	FbxPropertyT<FbxDouble>				LeftFootExtraFingerTip;
	FbxPropertyT<FbxDouble>				RightFootThumbTip;
	FbxPropertyT<FbxDouble>				RightFootIndexTip;
	FbxPropertyT<FbxDouble>				RightFootMiddleTip;
	FbxPropertyT<FbxDouble>				RightFootRingTip;
	FbxPropertyT<FbxDouble>				RightFootPinkyTip;
	FbxPropertyT<FbxDouble>				RightFootExtraFingerTip;
	FbxPropertyT<FbxBool>				FingerSolving;
	FbxPropertyT<FbxDouble>				CtrlPullLeftToeBase;
	FbxPropertyT<FbxDouble>				CtrlPullLeftFoot;
	FbxPropertyT<FbxDouble>				CtrlPullLeftKnee;
	FbxPropertyT<FbxDouble>				CtrlPullRightToeBase;
	FbxPropertyT<FbxDouble>				CtrlPullRightFoot;
	FbxPropertyT<FbxDouble>				CtrlPullRightKnee;
	FbxPropertyT<FbxDouble>				CtrlPullLeftFingerBase;
	FbxPropertyT<FbxDouble>				CtrlPullLeftHand;
	FbxPropertyT<FbxDouble>				CtrlPullLeftElbow;
	FbxPropertyT<FbxDouble>				CtrlPullRightFingerBase;
	FbxPropertyT<FbxDouble>				CtrlPullRightHand;
	FbxPropertyT<FbxDouble>				CtrlPullRightElbow;
	FbxPropertyT<FbxDouble>				CtrlChestPullLeftHand;
	FbxPropertyT<FbxDouble>				CtrlChestPullRightHand;
	FbxPropertyT<FbxDouble>				CtrlPullHead;
	FbxPropertyT<FbxDouble>				CtrlResistHipsPosition;
	FbxPropertyT<FbxDouble>				CtrlEnforceGravity;
	FbxPropertyT<FbxDouble>				CtrlResistHipsOrientation;
	FbxPropertyT<FbxDouble>				CtrlResistChestPosition;
	FbxPropertyT<FbxDouble>				CtrlResistChestOrientation;
	FbxPropertyT<FbxDouble>				CtrlResistLeftCollar;
	FbxPropertyT<FbxDouble>				CtrlResistRightCollar;
	FbxPropertyT<FbxDouble>				CtrlResistLeftKnee;
	FbxPropertyT<FbxDouble>				CtrlResistMaximumExtensionLeftKnee;
	FbxPropertyT<FbxDouble>				CtrlResistCompressionFactorLeftKnee;
	FbxPropertyT<FbxDouble>				CtrlResistRightKnee;
	FbxPropertyT<FbxDouble>				CtrlResistMaximumExtensionRightKnee;
	FbxPropertyT<FbxDouble>				CtrlResistCompressionFactorRightKnee;
	FbxPropertyT<FbxDouble>				CtrlResistLeftElbow;
	FbxPropertyT<FbxDouble>				CtrlResistMaximumExtensionLeftElbow;
	FbxPropertyT<FbxDouble>				CtrlResistCompressionFactorLeftElbow;
	FbxPropertyT<FbxDouble>				CtrlResistRightElbow;
	FbxPropertyT<FbxDouble>				CtrlResistMaximumExtensionRightElbow;
	FbxPropertyT<FbxDouble>				CtrlResistCompressionFactorRightElbow;
	FbxPropertyT<FbxDouble>				CtrlSpineStiffness;
	FbxPropertyT<FbxDouble>				CtrlNeckStiffness;
	FbxPropertyT<FbxBool>				MirrorMode;
	FbxPropertyT<FbxDouble>				ShoulderCorrection;
	FbxPropertyT<FbxBool>				LeftKneeKillPitch;
	FbxPropertyT<FbxBool>				RightKneeKillPitch;
	FbxPropertyT<FbxBool>				LeftElbowKillPitch;
	FbxPropertyT<FbxBool>				RightElbowKillPitch;
	FbxPropertyT<EHipsTranslationMode>	HipsTranslationMode;
	FbxPropertyT<FbxBool>				WriteReference;
	FbxPropertyT<FbxBool>				SyncMode;
	FbxPropertyT<FbxDouble>				Damping;
	FbxPropertyT<FbxDouble>				OrientationDamping;
	FbxPropertyT<EOffAutoUser>			OrientationDampingMode;
	FbxPropertyT<FbxDouble>				DisplacementDamping;
	FbxPropertyT<EOffAutoUser>			DisplacementDampingMode;
	FbxPropertyT<FbxDouble>				DisplacementMemory;
	FbxPropertyT<EAutoUser>				DisplacementMemoryMode;
	FbxPropertyT<FbxDouble>				HipsDisplacementDamping;
	FbxPropertyT<EAutoUser>				HipsDisplacementDampingMode;
	FbxPropertyT<FbxDouble>				AnkleDisplacementDamping;
	FbxPropertyT<EAutoUser>				AnkleDisplacementDampingMode;
	FbxPropertyT<FbxDouble>				WristDisplacementDamping;
	FbxPropertyT<EAutoUser>				WristDisplacementDampingMode;
	FbxPropertyT<FbxDouble>				Stabilization;
	FbxPropertyT<FbxDouble>				AnkleStabilizationTime;
	FbxPropertyT<EAutoUser>				AnkleStabilizationTimeMode;
	FbxPropertyT<FbxDouble>				AnkleStabilizationPerimeter;
	FbxPropertyT<EAutoUser>				AnkleStabilizationPerimeterMode;
	FbxPropertyT<FbxDouble>				AnkleStabilizationAngularPerimeter;
	FbxPropertyT<EOffAutoUser>			AnkleStabilizationAngularPerimeterMode;
	FbxPropertyT<FbxDouble>				AnkleStabilizationFloorProximity;
	FbxPropertyT<EOffAutoUser>			AnkleStabilizationFloorProximityMode;
	FbxPropertyT<FbxDouble>				AnkleStabilizationDamping;
	FbxPropertyT<EOffAutoUser>			AnkleStabilizationDampingMode;
	FbxPropertyT<FbxDouble>				AnkleStabilizationRecoveryTime;
	FbxPropertyT<EOffAutoUser>			AnkleStabilizationRecoveryTimeMode;
	FbxPropertyT<FbxReference>			SourceObject;
	FbxPropertyT<FbxReference>			DestinationObject;
	FbxPropertyT<FbxReference>			Actor;
	FbxPropertyT<FbxReference>			Character;
	FbxPropertyT<FbxReference>			ControlSet;
	FbxPropertyT<FbxDouble>				HikVersion;
	FbxPropertyT<FbxBool>				Characterize;
	FbxPropertyT<FbxBool>				LockXForm;
	FbxPropertyT<FbxBool>				LockPick;

    // HIK 4.6 new properties
    FbxPropertyT<FbxDouble>             RealisticShoulder;
    FbxPropertyT<FbxDouble>             CollarStiffnessX;
    FbxPropertyT<FbxDouble>             CollarStiffnessY; 
    FbxPropertyT<FbxDouble>             CollarStiffnessZ; 
    FbxPropertyT<FbxDouble>             ExtraCollarRatio;

    FbxPropertyT<FbxDouble>             LeftLegMaxExtensionAngle;
    FbxPropertyT<FbxDouble>             RightLegMaxExtensionAngle; 
    FbxPropertyT<FbxDouble>             LeftArmMaxExtensionAngle;
    FbxPropertyT<FbxDouble>             RightArmMaxExtensionAngle; 
                                        
    FbxPropertyT<FbxDouble>             StretchStartArmsAndLegs;
    FbxPropertyT<FbxDouble>             StretchStopArmsAndLegs;
    FbxPropertyT<FbxDouble>             SnSScaleArmsAndLegs;
    FbxPropertyT<FbxDouble>             SnSReachLeftWrist;
    FbxPropertyT<FbxDouble>             SnSReachRightWrist; 
    FbxPropertyT<FbxDouble>             SnSReachLeftAnkle;
    FbxPropertyT<FbxDouble>             SnSReachRightAnkle; 
    FbxPropertyT<FbxDouble>             SnSScaleSpine;
    FbxPropertyT<FbxDouble>             SnSScaleSpineChildren;
    FbxPropertyT<FbxDouble>             SnSSpineFreedom;
    FbxPropertyT<FbxDouble>             SnSReachChestEnd;
    FbxPropertyT<FbxDouble>             SnSScaleNeck;
    FbxPropertyT<FbxDouble>             SnSNeckFreedom;
    FbxPropertyT<FbxDouble>             SnSReachHead;
    
/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	void	SetVersion(int pVersion){ mCharacterVersion = pVersion; }
	int		Version(){ return mCharacterVersion; }
	void	SetValuesFromLegacyLoad();
	void	SetValuesForLegacySave(int pVersion);
	void	RestoreValuesFromLegacySave();
	bool	IsLegacy();

	int		GetPropertyInfoCount();
	void	GetPropertyInfo(char* &pCharacterPropertyName, char* &pCharacterPropertyModeName, EPropertyUnit &pUnit, int &pPropertyIndex, char* &pHIKPropertyName, char* &pHIKPropertyModeName, int pIndex) const;
	void	GetFbxCharacterPropertyFromHIKProperty(char* &pCharacterPropertyName, char* &pCharacterPropertyModeName, EPropertyUnit &pUnit, int &pPropertyIndex, const char* pHIKPropertyName) const;
    
    FbxCharacterLink*	GetCharacterLinkPtr(ENodeId pCharacterNodeId);

    virtual FbxObject*	Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;    

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);

	virtual FbxObject&		Copy(const FbxObject& pObject);
	virtual EType			GetConstraintType() const;
	virtual FbxStringList	GetTypeFlags() const;
	virtual bool			ConnectNotify (FbxConnectEvent const &pEvent);

private:
	bool					InverseProperty(FbxProperty& pProp);

	int						mCharacterVersion;
	FbxCharacterLink		mCharacterLink[eNodeIdCount];
	FbxControlSet*			mControlSet;

	friend class FbxNode;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

inline EFbxType FbxTypeOf(const FbxCharacter::EOffAutoUser&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EAutoUser&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EPostureMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EFloorPivot&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::ERollExtractionMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EHipsTranslationMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EFootContactType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EHandContactType&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EFingerContactMode&){ return eFbxEnum; }
inline EFbxType FbxTypeOf(const FbxCharacter::EContactBehaviour&){ return eFbxEnum; }

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_CHARACTER_H_ */
