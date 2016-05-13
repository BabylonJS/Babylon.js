/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcharacterpose.h
#ifndef _FBXSDK_SCENE_CONSTRAINT_CHARACTER_POSE_H_
#define _FBXSDK_SCENE_CONSTRAINT_CHARACTER_POSE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/constraint/fbxcharacter.h>
#include <fbxsdk/scene/geometry/fbxnode.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \class FbxCharacterPose
  * \nosubgrouping
  * \brief A character pose is a character and an associated hierarchy of nodes.
  *
  * Only the default position of the nodes is considered, the animation data is ignored.
  *
  * You can access the content of a character pose, using the functions FbxCharacterPose::GetOffset(),
  * FbxCharacterPose::GetLocalPosition(), and FbxCharacterPose::GetGlobalPosition().
  * Their source code is provided inline as examples on how to access the character pose data.
  *
  * To create a character pose, You must first create a hierarchy of nodes under the root
  * node provided by function FbxCharacterPose::GetRootNode(). Then, feed this hierarchy
  * of nodes into the character returned by function FbxCharacterPose::GetCharacter().
  * Offsets are set in the character links. Local positions are set using
  * FbxNode::SetDefaultT(), FbxNode::SetDefaultR(), and FbxNode::SetDefaultS().
  *
  * To set local positions from global positions:
  *     -# Declare lCharacterPose as a valid pointer to a FbxCharacterPose;
  *     -# Call lCharacterPose->GetRootNode()->SetLocalStateId(0, true);
  *     -# Call lCharacterPose->GetRootNode()->SetGlobalStateId(1, true);
  *     -# Call FbxNode::SetGlobalState() for all nodes found in the hierarchy under lCharacterPose->GetRootNode();
  *     -# Call lCharacterPose->GetRootNode()->ComputeLocalState(1, true);
  *     -# Call lCharacterPose->GetRootNode()->SetCurrentTakeFromLocalState(FBXSDK_TIME_ZERO, true).
  */
class FBXSDK_DLL FbxCharacterPose : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxCharacterPose,FbxObject);

public:
    //! Reset to an empty character pose.
    void Reset();

    /** Get the root node.
      * \return     Pointer to the root node.
      */
    FbxNode* GetRootNode() const;

    /** Get the character.
      * \return     Pointer to the character.
      */
    FbxCharacter* GetCharacter() const;

    /** Get offset matrix for a given character node.
      * \param pCharacterNodeId     Character Node ID.
      * \param pOffset              Receives offset matrix.
      * \return                     \c true if successful, \c false otherwise.
      */
    bool GetOffset(FbxCharacter::ENodeId pCharacterNodeId, FbxAMatrix& pOffset) const;

    /** Get local position for a given character node.
      * \param pCharacterNodeId     Character Node ID.
      * \param pLocalT              Receives local translation vector.
      * \param pLocalR              Receives local rotation vector.
      * \param pLocalS              Receives local scaling vector.
      * \return                     \c true if successful, \c false otherwise.
      */
    bool GetLocalPosition(FbxCharacter::ENodeId pCharacterNodeId, FbxVector4& pLocalT, FbxVector4& pLocalR, FbxVector4& pLocalS) const;

    /** Get global position for a given character node.
      * \param pCharacterNodeId     Character Node ID.
      * \param pGlobalPosition      Receives global position.
      * \return                     \c true if successful, \c false otherwise.
      */
    bool GetGlobalPosition(FbxCharacter::ENodeId pCharacterNodeId, FbxAMatrix& pGlobalPosition) const;

	/** Retrieve the pose scene used by this character pose
	* \return The pose's scene (this is a different scene than the scene the character pose is in). */
	FbxScene* GetPoseScene() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual FbxObject* Clone(                          FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;    
            void       Clone(FbxScene* pPoseScene,     FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL);

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);

private:
    FbxScene* mPoseScene;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONSTRAINT_CHARACTER_POSE_H_ */
