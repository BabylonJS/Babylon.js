/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxskin.h
#ifndef _FBXSDK_SCENE_GEOMETRY_SKIN_H_
#define _FBXSDK_SCENE_GEOMETRY_SKIN_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxdeformer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCluster;
class FbxGeometry;

/** Skin deformer class.
  *
  * A skin deformer contains clusters (FbxCluster). Each cluster acts on a subset of the geometry's
  * control points, with different weights. For example, a mesh of humanoid shape
  * can have a skin attached, that describes the way the humanoid mesh is deformed
  * by bones. When the bones are animated, the clusters act on the geometry to
  * animate it too.
  *
  * The corresponding deformer types are FbxDeformer::eSkin.
  * \nosubgrouping
  */

class FBXSDK_DLL FbxSkin : public FbxDeformer
{
    FBXSDK_OBJECT_DECLARE(FbxSkin, FbxDeformer);

public:
    /** Set deformation accuracy.
      * \remarks Use the Accuracy option to set the accuracy of skin deformations. 
      * 100% is full accuracy and 1% is a rough estimation of the envelope deformation. 
      * \param pDeformAccuracy         value for deformation accuracy.
      */
    void SetDeformAccuracy(double pDeformAccuracy);

    /** Get deformation accuracy.
      * \return                        deformation accuracy value.
      */
    double GetDeformAccuracy() const;

    /** Set the geometry affected by this skin deformer.
      * \param pGeometry               Pointer to the geometry object to set.
      * \return                        \c true on success, \c false otherwise.
      */
    bool SetGeometry(FbxGeometry* pGeometry);

    /** Get the geometry affected by this skin deformer.
      * \return                        a pointer to the geometry if set or NULL.
      */
    FbxGeometry* GetGeometry();

    /** Add a cluster.
      * \param pCluster                Pointer to the cluster object to add.
      * \return                        \c true on success, \c false otherwise.
      */
    bool AddCluster(FbxCluster* pCluster);

    /** Remove cluster at given index.
      * \param pCluster                Pointer to the cluster to remove from this skin deformer.
      * \return                        Pointer to cluster or \c NULL if pCluster is not owned by this skin deformer.
      */
    FbxCluster* RemoveCluster(FbxCluster* pCluster);

    /** Get the number of clusters.
      * \return                        Number of clusters that have been added to this object.
      */
    int GetClusterCount() const;

    /** Get cluster at given index.
      * \param pIndex                  Index of cluster.
      * \return                        Pointer to cluster or \c NULL if index is out of range.
      */
    FbxCluster* GetCluster(int pIndex);

    /** Get cluster at given index.
      * \param pIndex                  Index of cluster.
      * \return                        Pointer to cluster or \c NULL if index is out of range.
      */
    const FbxCluster* GetCluster(int pIndex) const;

    /** Get the type of the deformer.
      * \return                        Deformer type identifier.
      */
    EDeformerType GetDeformerType()  const {return eSkin; };

	/** \enum EType Skinning type.
	* The skinning type decides which method will be used to do the skinning.
	*      - \e eRigid                       Type eRigid means rigid skinning, which means only one joint can influence each control point.
	*      - \e eLinear                      Type eLinear means the classic linear smooth skinning.
	*      - \e eDualQuaternion              Type eDualQuaternion means the dual quaternion smooth skinning.
	*      - \e eBlend                       Type eBlend means to blend classic linear and dual quaternion smooth skinning according to blend weights.
	*/
	enum EType
	{
		eRigid,
		eLinear,
		eDualQuaternion,
		eBlend
	};

	/** Set the skinning type.
	* \param pType     The skinning type.
	*/
	void SetSkinningType(EType pType);

	/** Get the skinning type.
	* \return     The skinning type.
	*/
	EType GetSkinningType() const;

	/**
	* \name Control Points
	* A skin has an array of indices to control points and associated blend weights.
	* The indices refer to the control points in the instance of class FbxGeometry. 
	* The blend weights are the influence of the different skinning type over the
	* deformation effect of the indexed control points.
	*/
	//@{

	/** Add an element in both arrays of control point indices and blendWeights.
	* \param pIndex          The index of the control point.
	* \param pBlendWeight    The blend weight for this control point. The value should between 0 and 1. 
	*                        Any value that is less than 0 will be set to 0, any value that is greater than 1 will be set to 1.
	*                        0 means completely linear skinning, 1 means completely dual quaternion skinning,
	*                        a value between 0 and 1 means the weighted blending of the above two skinning methods.
	*/
	void AddControlPointIndex(int pIndex, double pBlendWeight = 0);

	/** Get the length of the arrays of control point indices and blend weights.
	* \return     Length of the arrays of control point indices and blend weights.
	*             Returns 0 if no control point indices have been added or the arrays have been reset.
	*/
	int GetControlPointIndicesCount() const;

	/** Get the array of control point indices.
	* \return     Pointer to the array of control point indices.
	*             \c NULL if no control point indices have been added or the array has been reset.
	*/
	int* GetControlPointIndices() const;

	/** Get the array of control point blend weights.
	* \return     Pointer to the array of control point blend weights.
	*             \c NULL if no control point indices have been added or the array has been reset.
	*/
	double* GetControlPointBlendWeights() const;

	/** Set the array size for the three arrays: the array of control point indices, the array of weights
	* and the array of blend weights.
	* \param pCount The new count.
	*/
	void SetControlPointIWCount(int pCount);

	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual void Compact();
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual FbxStringList GetTypeFlags() const;

    // Skin deformer
    double mDeformAccuracy;
	EType mSkinningType;

	//Control points
	FbxArray<int>     mControlPointIndices;
	FbxArray<double>  mControlPointBlendWeights;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_SKIN_H_ */
