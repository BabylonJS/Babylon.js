/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcluster.h
#ifndef _FBXSDK_SCENE_GEOMETRY_CLUSTER_H_
#define _FBXSDK_SCENE_GEOMETRY_CLUSTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxsubdeformer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Class for clusters (links). 
  * A cluster, or link, is an entity acting on a geometry (FbxGeometry).
  * More precisely, the cluster acts on a subset of the geometry's control points.
  * For each control point that the cluster acts on, the intensity of the cluster's
  * action is modulated by a weight. The link mode (ELinkMode) specifies how
  * the weights are taken into account.
  *
  * The cluster's link node specifies the node (FbxNode) that influences the
  * control points of the cluster. If the node is animated, the control points
  * will move accordingly.
  *
  * A cluster is usually part of a skin (\see FbxDeformer, FbxSkin). For example,
  * imagine a mesh representing a humanoid, and imagine a skeleton made of bones. 
  * Each bone is represented by a node in FBX.
  * To bind the geometry to the nodes, 
  * we create a skin (FbxSkin). The skin has many clusters, each one corresponding
  * to a bone.
  * Each node influences some control
  * points of the mesh. A node has a high influence on some of the points (high weight)
  * and lower influence on some other points (low weight). Some points of the mesh
  * are not affected at all by the bone, so they would not be part of the corresponding
  * cluster.
  *
  *\nosubgrouping
  */
class FBXSDK_DLL FbxCluster : public FbxSubDeformer
{
    FBXSDK_OBJECT_DECLARE(FbxCluster,FbxSubDeformer);

public:
    /**
      * \name General Functions
      */
    //@{
    /** Get the type of the sub deformer.
      * \return SubDeformer type identifier: eCluster.
      */
    EType GetSubDeformerType() const {return eCluster; };

    /** Restore the cluster to its initial state.
      * Calling this function will clear the following:
      * \li Pointer to linked node.
      * \li Pointer to associate model.
      * \li Control point indices and weights.
      * \li Transformation matrices.
      */
    void Reset();
    //@}
    /**
      * \name Link Mode, Link Node, Associate Model
      */
    //@{
    /** Link modes.
      * The link mode sets how the link influences the position of a control
      * point and the relationship between the weights assigned to a control
      * point. The weights assigned to a control point are distributed among
      * the set of links associated with an instance of class FbxGeometry.
      */
    enum ELinkMode
    {
		eNormalize,       /*!<	  In mode eNormalize, the sum of the weights assigned to a control point
		                          is normalized to 1.0. Setting the associate model in this mode is not
		                          relevant. The influence of the link is a function of the displacement of the
		                          link node relative to the node containing the control points.*/
        eAdditive,
		                  /*!<    In mode eAdditive, the sum of the weights assigned to a control point
		                          is kept as is. It is the only mode where setting the associate model is
		                          relevant. The influence of the link is a function of the displacement of
		                          the link node relative to the node containing the control points or,
		                          if set, the associate model. The weight gives the proportional displacement
		                          of a control point. For example, if the weight of a link over a control
		                          point is set to 2.0, a displacement of the link node of 1 unit in the X
		                          direction relative to the node containing the control points or, if set,
		                          the associate model, triggers a displacement of the control point of 2
		                          units in the same direction.*/
        eTotalOne   
		                  /*!<    Mode eTotalOne is identical to mode eNormalize except that the sum of the
		                          weights assigned to a control point is not normalized and must equal 1.0.*/
    };

    /** Set the link mode.
      * \param pMode     The link mode.
      * \remarks         All the links associated to an instance of class FbxGeometry must have the same link mode.
      */
    void SetLinkMode(ELinkMode pMode);

    /** Get the link mode.
      * \return     The link mode.
      */
    ELinkMode GetLinkMode() const;

    /** Set the link node. The link node is the node which influences the displacement
      * of the control points. Typically, the link node is the bone a skin is attached to.
      * \param pNode     The link node.     
      */
    void SetLink(const FbxNode* pNode);

    /** Get the link node. The link node is the node which influences the displacement
      * of the control points. Typically, the link node is the bone a skin is attached to.
      * \return      The link node or \c NULL if FbxCluster::SetLink() has not been called before.
      */
    FbxNode* GetLink();

    /** Get the link node (as const). The link node is the node which influences the displacement
      * of the control points. Typically, the link node is the bone a skin is attached to.
      * \return      The link node or \c NULL if FbxCluster::SetLink() has not been called before. 
      */
    const FbxNode* GetLink() const;

    /** Set the associate model.
      * The associate model is optional. It is only relevant if the link mode
      * is of type eAdditive. If set, the associate model is the node used as a reference to
      * measure the relative displacement of the link node. Otherwise, the displacement of 
      * the link node is measured relative to the node containing the control points. 
      * Typically, the associate model node is the parent of the bone a skin is attached to.
      * \param pNode     The associate model node.   
      */
    void SetAssociateModel(FbxNode* pNode);

    /** Get the associate model.
      * The associate model is optional. It is only relevant if the link mode is of type
      * eAdditive. If set, the associate model is the node used as a reference to
      * measure the relative displacement of the link node. Otherwise, the displacement of 
      * the link node is measured relative the the node containing the control points. 
      * Typically, the associate model node is the parent of the bone a skin is attached to.
      * \return      The associate model node or \c NULL if FbxCluster::SetAssociateModel() has not been called before. 
      */
    FbxNode* GetAssociateModel() const;
    //@}
    /**
      * \name Control Points
      * A link has an array of indices to control points and associated weights.
      * The indices refer to the control points in the instance of class FbxGeometry
      * owning the link. The weights are the influence of the link node over the
      * displacement of the indexed control points.
      */
    //@{

    /** Add an element in both arrays of control point indices and weights.
      * \param pIndex          The index of the control point.
      * \param pWeight         The link weight for this control point.
      */
    void AddControlPointIndex(int pIndex, double pWeight);

    /** Get the length of the arrays of control point indices and weights.
      * \return     Length of the arrays of control point indices and weights.
      *             Returns 0 if no control point indices have been added or the arrays have been reset.
      */
    int GetControlPointIndicesCount() const;

    /** Get the array of control point indices.
      * \return     Pointer to the array of control point indices.
      *             \c NULL if no control point indices have been added or the array has been reset.
      */
    int* GetControlPointIndices() const;

    /** Get the array of control point weights.
      * \return     Pointer to the array of control point weights.
      *             \c NULL if no control point indices have been added or the array has been reset.
      */
    double* GetControlPointWeights() const;

    //@}

    /** Set the array size for the three arrays: the array of control point indices, the array of weights
	  * and the array of blend weights.
      * \param pCount The new count.
      */
	void SetControlPointIWCount(int pCount);

    /**
      * \name Transformation matrices
      * A link has three transformation matrices:
      *      \li Transform refers to the global initial transform of the geometry node that contains the link node.
      *      \li TransformLink refers to global initial transform of the link node.
      *      \li TransformAssociateModel refers to the global initial transform of the associate model.
      *
	  * For example, given a mesh binding with several bones(links), Transform is the global transform 
	  * of the mesh at the binding moment, TransformLink is the global transform of the bone(link)
	  * at the binding moment, TransformAssociateModel is the global transform of the associate model 
	  * at the binding moment.
      */
    //@{

    /** Set matrix associated with the node containing the link.
      * \param pMatrix     Transformation matrix.
      */
    void SetTransformMatrix(const FbxAMatrix& pMatrix);

    /** Get matrix associated with the node containing the link.
      * \param pMatrix     Transformation matrix to be filled with appropriate data.
      * \return            Input parameter matrix filled with appropriate data.
      */
    FbxAMatrix& GetTransformMatrix(FbxAMatrix& pMatrix) const;

    /** Set matrix associated with the link node.
      * \param pMatrix     Transformation matrix.
      */
    void SetTransformLinkMatrix(const FbxAMatrix& pMatrix);

    /** Get matrix associated with the link node.
      * \param pMatrix     Transformation matrix to be filled with appropriate data..
      * \return            Input parameter matrix filled with appropriate data.
      */
    FbxAMatrix& GetTransformLinkMatrix(FbxAMatrix& pMatrix) const;

    /** Set matrix associated with the associate model.
      * \param pMatrix     Transformation matrix.
      */
    void SetTransformAssociateModelMatrix(const FbxAMatrix& pMatrix);

    /** Get matrix associated with the associate model.
      * \param pMatrix     Transformation matrix to be filled with appropriate data..
      * \return            Input parameter matrix filled with appropriate data.
      */
    FbxAMatrix& GetTransformAssociateModelMatrix(FbxAMatrix& pMatrix) const;

    /** Set matrix associated with the parent node.
      * \param pMatrix     Transformation matrix.
      */
    void SetTransformParentMatrix(const FbxAMatrix& pMatrix);

    /** Get matrix associated with the parent node.
      * \param pMatrix     Transformation matrix to be filled with appropriate data..
      * \return            Input parameter matrix filled with appropriate data.
      */
    FbxAMatrix& GetTransformParentMatrix(FbxAMatrix& pMatrix) const;

    /** Get the Transform Parent set flag value.
      * \return           \c true if transform matrix associated with parent node is set.
      */
    bool IsTransformParentSet() const { return mIsTransformParentSet; }

    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    void SetUserData(const char* pUserDataID, const char* pUserData);
    const char* GetUserDataID () const;
    const char* GetUserData () const;
    const char* GetUserData (const char* pUserDataID) const;

    // For pre version 6 support
    FbxString	mBeforeVersion6LinkName;
    FbxString	mBeforeVersion6AssociateModelName;


protected:
    virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);

    virtual FbxStringList GetTypeFlags() const;

    ELinkMode               mLinkMode;
    FbxString               mUserDataID;
    FbxString               mUserData;
    FbxArray<int>           mControlPointIndices;
    FbxArray<double>        mControlPointWeights;
    FbxMatrix              mTransform;
    FbxMatrix              mTransformLink;
    FbxMatrix              mTransformAssociate;
    FbxMatrix              mTransformParent;
    bool                    mIsTransformParentSet;

    FbxPropertyT<FbxReference> SrcModelReference;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_CLUSTER_H_ */
