/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxpose.h
#ifndef _FBXSDK_SCENE_POSE_H_
#define _FBXSDK_SCENE_POSE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/math/fbxmatrix.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;
class FbxPose;
class FbxNode;
class FbxUserNotification;

/** This structure contains the description of a named pose.
  * FbxPose contains one FbxPoseInfo array to store all of FBX nodes and their transform matrix info.
  */
struct FbxPoseInfo
{
    FbxMatrix	mMatrix;		//!< Transform matrix of the node.
    bool		mMatrixIsLocal;	//!< If true, the transform matrix above is defined in local coordinates.
    FbxNode*	mNode;			//!< FBX node, which may be skeleton or geometry (skinned) node.
};

typedef FbxArray<FbxNode*> NodeList;
typedef FbxArray<FbxPose*> PoseList;
typedef FbxArray<FbxPoseInfo*> PoseInfoList;

/** This class contains the description of a Pose and provide some methods to access Pose info in one FBX scene.
  * \nosubgrouping
  * The FbxPose object can be setup to hold "Bind Pose" data or "Rest Pose" data.
  *
  * The Bind Pose holds the transformation (translation, rotation and scaling)
  * matrix of all the nodes implied in a link deformation. This includes the geometry
  * being deformed, the links deforming the geometry, and recursively all the
  * ancestors nodes of the link. The Bind Pose gives you the transformation of the nodes
  * at the moment of the binding operation when no deformation occurs.
  *
  * The Rest Pose is a snapshot of a node transformation. A Rest Pose can be used
  * to store the position of every node of a character at a certain point in
  * time. This pose can then be used as a reference position for animation tasks,
  * like editing walk cycles.
  *
  * One difference between the two modes is in the validation performed before
  * adding an item and the kind of matrix stored.
  *
  * In "Bind Pose" mode, the matrix is assumed to be defined in the global space,
  * while in "Rest Pose" the type of the matrix may be specified by the caller. So
  * local system matrices can be used. Actually, because there is one such flag for
  * each entry (FbxPoseInfo), it is possible to have mixed types in a FbxPose elements.
  * It is therefore the responsibility of the caller to check for the type of the retrieved
  * matrix and to do the appropriate conversions if required.
  *
  * The validation of the data to be added consists of the following steps:
  *
  *     \li If this FbxPose object stores "Bind Poses", then
  *        add a FbxPoseInfo only if the node is not already
  *        associated to another "Bind Pose". This check is done
  *        by visiting ALL the FbxPose objects in the system.
  *
  *        The above test is only performed for the "Bind Pose" type. While
  *        the next one is always performed, no matter what kind of poses this
  *        FbxPose object is setup to hold.
  *
  *     \li If a node is already inserted in the FbxPose internal list,
  *        then the passed matrix MUST be equal to the one already stored.
  *        If this is not the case, the Add method will return -1, indicating
  *        that no new FbxPoseInfo has been created.
  *
  * If the Add method succeeds, it will return the index of the FbxPoseInfo
  * structure that as been created and held by the FbxPose object.
  *
  * To ensure data integrity, the stored information can only be
  * accessed using the provided methods (read-only). If an entry needs to be
  * modified, the caller has to remove the FbxPoseInfo item by calling Remove(i)
  * and then Add a new one.
  *
  * The internal list is not ordered and the search inside this list is linear
  * (from the first element to ... the first match or the end of the list).
  *
  */
class FBXSDK_DLL FbxPose : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxPose,FbxObject);

public:
	/** Set the type of pose.
	  * \param pIsBindPose If true, type will be bind pose, else rest pose.
	  */
	void SetIsBindPose(bool pIsBindPose);

	/** Pose identifier flag.
	  * \return \c true if this object holds BindPose data.
	  */
	bool IsBindPose() const { return mType == 'b'; }

	/** Pose identifier flag.
	  * \return \c true if this object holds RestPose data.
	  */
	bool IsRestPose() const { return mType == 'r'; }

	/** Get number of stored items.
	  * \return The number of items stored.
	  */
	int GetCount() const { return mPoseInfo.GetCount(); }

	/** Stores the pose transformation for the given node.
	  * \param pNode pointer to the node for which the pose is stored.
	  * \param pMatrix Pose transform of the node.
	  * \param pLocalMatrix Flag to indicate if pMatrix is defined in Local or Global space.
	  * \param pMultipleBindPose Flag to indicate if multiple bind pose exist. If this is false, all matrix for one node should be same in different bind pose.
	  * \return -1 if the function failed or the index of the stored item.
	  */
	int Add(FbxNode* pNode, const FbxMatrix& pMatrix, bool pLocalMatrix = false, bool pMultipleBindPose = true);

	/** Remove the pIndexth item from the Pose object.
	  * \param pIndex Index of the item to be removed.
	  */
	void Remove(int pIndex);

	/** Get the node name.
	  * \param pIndex Index of the queried item.
	  * \return The node initial and current names.
	  * \remarks If the index is invalid an empty FbxNameHandler is returned.
	  */
	FbxNameHandler GetNodeName(int pIndex) const;

	/** Get the node.
	  * \param pIndex Index of the queried item.
	  * \return A pointer to the node referenced.
	  * \remarks If the index is invalid or no pointer to a node is set, returns NULL.
	  *  The returned pointer will become undefined if the FbxPose object is destroyed.
	  */
	FbxNode* GetNode(int pIndex) const;

	/** Get the transform matrix.
	  * \param pIndex Index of the queried item.
	  * \return A reference to the pose matrix.
	  * \remarks If the index is invalid a reference to an identity matrix is returned.
	  *  The reference will become undefined if the FbxPose object is destroyed.
	  */
	const FbxMatrix& GetMatrix(int pIndex)       const;

	/** Get the type of the matrix.
	  * \param pIndex Index of the queried item.
	  * \return \c true if the matrix is defined in the Local coordinate space and false otherwise.
	  * \remarks If the FbxPose object is configured to hold BindPose data, this method will always return \c false.
	  */
	bool IsLocalMatrix(int pIndex) const;

	/**
	  * \name Search Section
	  */
	//@{
		/** This structure defines the strategy of comparing FBX node name.
		  * FBX node has an initial name and a current name (refer to FbxNameHandler). The structure defines which name to use when compare two nodes.
		  */
		enum ENameComponent
		{
			eInitialNameComponent = 1,	//! use initial name when compare two nodes
			eCurrentNameComponent = 2,	//! use current name when compare two nodes
			eAllNameComponents = 3		//! use both initial and current name when compare two nodes, it's true if one or both matched
		};

		/** Look in the FbxPose object for the given node name.
		  * \param pNodeName Name of the node we are looking for.
		  * \param pCompareWhat Bitwise or of the following flags: INTIALNAME_COMPONENT, eCurrentNameComponent
		  * \return -1 if the node is not in the list. Otherwise, the index of the corresponding FbxPoseInfo element.
		  */
		int Find(const FbxNameHandler& pNodeName, char pCompareWhat = eAllNameComponents) const;

		/** Look in the FbxPose object for the given node.
		  * \param pNode the node we are looking for.
		  * \return -1 if the node is not in the list. Otherwise, the index of the corresponding FbxPoseInfo element.
		  */
		int Find(const FbxNode* pNode) const;
	//@}

	/**
	  * \name Utility Section
	  */
	//@{
		/** Get the list of Poses objects that contain the node with name pNodeName.
		  * This method will look in all the poses of all the scenes.
		  * \param pManager    The manager owning the poses and scenes.
		  * \param pNode       The node being explored.
		  * \param pPoseList   List of BindPoses/RestPoses that have the node.
		  * \param pIndex      List of indices of the nodes in the corresponding poses lists.
		  * \return \c true if the node belongs to at least one Pose (either a BindPose or a RestPose).
		  * \remarks The pPoseList and pIndex are filled by this method.
		  *  The elements of the returned list must not be deleted since they still belong to the scene.
		  */
		static bool GetPosesContaining(FbxManager& pManager, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

		/** Get the list of Poses objects that contain the node with name pNodeName.
		  * \param pScene     Scene owning the poses.
		  * \param pNode      The node being explored.
		  * \param pPoseList  List of BindPoses/RestPoses that have the node.
		  * \param pIndex     List of indices of the nodes in the corresponding poses lists.
		  * \return \c true if the node belongs to at least one Pose (either a BindPose or a RestPose).
		  * \remarks The pPoseList and pIndex are filled by this method.
		  *  The elements of the returned list must not be deleted since they still belong to the scene.
		  */
		static bool GetPosesContaining(FbxScene* pScene, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

		/** Get the list of BindPose objects that contain the node with name pNodeName.
		  * This method will look in all the bind poses of all the scenes.
		  * \param pManager     The manager owning the poses.
		  * \param pNode        The node being explored.
		  * \param pPoseList    List of BindPoses that have the node.
		  * \param pIndex       List of indices of the nodes in the corresponding bind poses lists.
		  * \return \c true if the node belongs to at least one BindPose.
		  * \remarks The pPoseList and pIndex are filled by this method.
		  *  The elements of the returned list must not be deleted since they still belong to the scene.
		  */
		static bool GetBindPoseContaining(FbxManager& pManager, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

		/** Get the list of BindPose objects that contain the node with name pNodeName.
		  * \param pScene       The scene owning the poses.
		  * \param pNode        The node being explored.
		  * \param pPoseList    List of BindPoses that have the node.
		  * \param pIndex       List of indices of the nodes in the corresponding bind poses lists.
		  * \return \c true if the node belongs to at least one BindPose.
		  * \remarks The pPoseList and pIndex are filled by this method.
		  *  The elements of the returned list must not be deleted since they still belong to the scene.
		  */
		static bool GetBindPoseContaining(FbxScene* pScene, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

		/** Get the list of RestPose objects that contain the node with name pNodeName.
		  * This method will look in all the bind poses of all the scenes.
		  * \param pManager     The manager owning the poses.
		  * \param pNode        The node being explored.
		  * \param pPoseList    List of RestPoses that have the node.
		  * \param pIndex       List of indices of the nodes in the corresponding rest poses lists.
		  * \return \c true if the node belongs to at least one RestPose.
		  * \remarks The pPoseList and pIndex are filled by this method.
		  *  The elements of the returned list must not be deleted since they still belong to the scene.
		  */
		static bool GetRestPoseContaining(FbxManager& pManager, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

		/** Get the list of RestPose objects that contain the node with name pNodeName.
		  * \param pScene       The scene owning the poses.
		  * \param pNode        The node being explored.
		  * \param pPoseList    List of RestPoses that have the node.
		  * \param pIndex       List of indices of the nodes in the corresponding rest poses lists.
		  * \return \c true if the node belongs to at least one RestPose.
		  * \remarks The pPoseList and pIndex are filled by this method.
		  *  The elements of the returned list must not be deleted since they still belong to the scene.
		  */
		static bool GetRestPoseContaining(FbxScene* pScene, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

		/** Check this BindPose and report an error if all the conditions to a valid bind pose are not
		  * met. The conditions are:
		  *
		  * \li a) We are a BindPose.
		  * \li b) For every node in the bind pose, all their parent node are part of the bind pose.
		  * \li c) All the deforming nodes are part of the bind pose.
		  * \li d) All the parents of the deforming nodes are part of the bind pose.
		  * \li e) Each deformer relative matrix correspond to the deformer Inv(bindMatrix) * deformed Geometry bindMatrix.
		  *
		  * \param pRoot This node is used as the stop point when visiting the parents (cannot be NULL).		           
		  * \param pMatrixCmpTolerance Tolerance value when comparing the matrices.
          * \param pStatus The FbxStatus object to hold error codes.
		  * \return true if all the above conditions are met and false otherwise.
		  * \remarks 
		  * a) If pRoot node is not defined in the BindPose it must not have a Geometry or Skeleton attribute and its
		  * transform must be an Identity.
		  * \remarks
		  * b) If the returned value is false, querying for the error will return the reason of the failure.
		  * As soon as one of the above conditions is not met, this method return ignoring any subsequent errors.
		  * Run the IsBindPoseVerbose if more details are needed.
		  */
		bool IsValidBindPose(FbxNode* pRoot, double pMatrixCmpTolerance=0.0001, FbxStatus* pStatus = NULL);

		/** Same as IsValidBindPose() but slower because it will not stop as soon as a failure occurs. Instead,
		  * keeps running to accumulate the faulty nodes (stored in the appropriate array). It is then up to the
		  * caller to fill the UserNotification if desired.
		  *
		  * \param pRoot This node is used as the stop point when visiting the parents (cannot be NULL).
		  * \param pMissingAncestors Each ancestor missing from the BindPose is added to this list.
		  * \param pMissingDeformers Each deformer missing from the BindPose is added to this list.
		  * \param pMissingDeformersAncestors Each deformer ancestors missing from the BindPose is added to this list.
		  * \param pWrongMatrices Nodes that yield to a wrong matrix comparisons are added to this list.
		  * \param pMatrixCmpTolerance Tolerance value when comparing the matrices.
          * \param pStatus The FbxStatus object to hold error codes.
		  * \remarks If pRoot node is not defined in the BindPose it must not have a Geometry or Skeleton attribute and its
		  *          transform must be an Identity.		  
		  */
		bool IsValidBindPoseVerbose(FbxNode* pRoot, NodeList& pMissingAncestors, NodeList& pMissingDeformers, NodeList& pMissingDeformersAncestors, NodeList& pWrongMatrices, double pMatrixCmpTolerance=0.0001, FbxStatus* pStatus = NULL);

		/** Same as IsValidBindPose() but slower because it will not stop as soon as a failure occurs. Instead,
		  * keeps running to accumulate the faulty nodes and send them directly to the UserNotification.
		  *
		  * \param pRoot This node is used as the stop point when visiting the parents (cannot be NULL).
		  * \param pUserNotification Pointer to the user notification where the messages will be accumulated.
		  * \param pMatrixCmpTolerance Tolerance value when comparing the matrices.
          * \param pStatus The FbxStatus object to hold error codes.
		  * \remarks If the pUserNotification parameter is NULL, this method will call IsValidBindPose().
		  * \remarks If pRoot node is not defined in the BindPose it must not have a Geometry or Skeleton attribute and its
		  *          transform must be an Identity.		  
		  */
		bool IsValidBindPoseVerbose(FbxNode* pRoot, FbxUserNotification* pUserNotification, double pMatrixCmpTolerance=0.0001, FbxStatus* pStatus = NULL);

	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);
    virtual void ConstructProperties(bool pForceSet);

	virtual FbxObject&	Copy(const FbxObject& pObject);
    virtual const char*	GetTypeName() const;

    //Returns false if pNode is already inserted in the list and the current matrix is different from the stored one. Also, if this pose is a rest pose, check if
    //pNode belongs to other BindPoses (accessed through the scene pointer). pPos will contains the index of the FbxPoseInfo if the parameters are already stored in this object.
    bool				ValidateParams(const FbxNode* pNode, const FbxMatrix& pMatrix, int& pPos);

    bool				LocalValidateParams(const FbxNode* pNode, const FbxMatrix& pMatrix, int& pPos);
    static bool			GetSpecificPoseContaining(int poseType, FbxScene* pScene, FbxNode* pNode, PoseList& pPoseList, FbxArray<int>& pIndex);

private:
    FbxPoseInfo*		GetItem(int pIndex) const;
    void                UpdatePosInfoList();
    bool				IsValidBindPoseCommon(FbxNode* pRoot, NodeList* pMissingAncestors, NodeList* pMissingDeformers, NodeList* pMissingDeformersAncestors, NodeList* pWrongMatrices, FbxStatus* pStatus, double pMatrixCmpTolerance=0.0001);

    char				        mType;
    PoseInfoList		        mPoseInfo;
    bool                        mPoseInfoIsDirty;
    FbxPropertyT<FbxReference>  Nodes;

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_POSE_H_ */
