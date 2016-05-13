/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxshape.h
#ifndef _FBXSDK_SCENE_GEOMETRY_SHAPE_H_
#define _FBXSDK_SCENE_GEOMETRY_SHAPE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometrybase.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxBlendShapeChannel;
class FbxGeometry;

/** A shape describes the deformation on a set of control points, which is similar to the cluster deformer in Maya.
  * For example, we can add a shape to a created geometry. And the shape and the geometry have the same
  * topological information but different position of the control points.
  * With varying amounts of influence, the geometry performs a deformation effect.
  * \nosubgrouping
  * \see FbxGeometry
  */
class FBXSDK_DLL FbxShape : public FbxGeometryBase
{
    FBXSDK_OBJECT_DECLARE(FbxShape, FbxGeometryBase);

public:
	/** Set the blend shape channel that contains this target shape.
	* \param pBlendShapeChannel      Pointer to the blend shape channel to set.
	* \return                        \c true on success, \c false otherwise.
	*/
	bool SetBlendShapeChannel(FbxBlendShapeChannel* pBlendShapeChannel);

	/** Get the blend shape channel that contains this target shape.
	* \return                        a pointer to the blend shape channel if set or NULL.
	*/
	FbxBlendShapeChannel* GetBlendShapeChannel() const;

	/** Get the base geometry of this target shape.
	* \return                        a pointer to the base geometry if set or NULL.
	* \remarks Since target shape can only connected to its base geometry through
	*          blend shape channel and blend shape deformer.
	*          So only when this target shape is connected to a blend shape channel,
	*          and the blend shape channel is connected to a blend shape deformer,
	*          and the blend shape deformer is used on a base geometry, then to get 
    *          base geometry will success.
	*/
	FbxGeometry* GetBaseGeometry();

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


	/** Set the array size for the control point indices
	* \param pCount The new count.
	*/
	void SetControlPointIndicesCount(int pCount);

	/** Add a control point index to the control point indices array
	* \param pIndex The control point index to add.
	*/	
	void AddControlPointIndex(int pIndex);

	/** Restore the shape to its initial state.
	* Calling this function will clear the following:
	* \li Pointer to blend shape channel.
	* \li Control point indices.
	*/
	void Reset();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual void Compact();
	virtual FbxObject& Copy(const FbxObject& pObject);
    virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;
    
protected:
    virtual FbxNodeAttribute::EType GetAttributeType() const;
	virtual FbxStringList GetTypeFlags() const;

	FbxArray<int> mControlPointIndices;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_SHAPE_H_ */
