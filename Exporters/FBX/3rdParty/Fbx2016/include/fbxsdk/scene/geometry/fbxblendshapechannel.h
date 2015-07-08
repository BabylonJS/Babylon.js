/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxblendshapechannel.h
#ifndef _FBXSDK_SCENE_GEOMETRY_BLEND_SHAPE_CHANNEL_H_
#define _FBXSDK_SCENE_GEOMETRY_BLEND_SHAPE_CHANNEL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxsubdeformer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxShape;
class FbxBlendShape;

/** Class for blend shape channels. 
  * A blend shape channel is a sub-deformer to help blend shape deformer to organize the target shapes.
  * One blend shape deformer can have multiple blend shape channels in parallel, and each of them can 
  * control one or multiple target shapes. If there are multiple target shapes connected to one channel,
  * each target shape could have its own full deformation percentage. For example, given a channel that 
  * has 3 target shapes, whose full deform percentage are 30, to 80 to 100 separately, then when the percent 
  * changes from 0 to 100, the base geometry will deform from the first target shape to the last one. 
  * This is called in-between blend shapes or progressive morph.
  * The property DeformPercent of blend shape channel will control the deform level of each target shape or 
  * in-between blend shape on it.
  *\nosubgrouping
  */
class FBXSDK_DLL FbxBlendShapeChannel : public FbxSubDeformer
{
    FBXSDK_OBJECT_DECLARE(FbxBlendShapeChannel, FbxSubDeformer);

public:
	/** This property stores deform percent of this channel.
	* The default value of this property is 0.0.
	*
	* \remark Although not enforced, it is strongly suggested to limit the value of this property 
	*         in the range from 0.0 to 100.0 because graphic applications may handle values outside of this 
	*         interval differently, therefore producing unexpected results. 
	*/
	FbxPropertyT<FbxDouble>        DeformPercent;

	/** Set the blend shape deformer that contains this blend shape channel.
	* \param pBlendShape             Pointer to the blend shape deformer to set.
	* \return                        \c true on success, \c false otherwise.
	*/
	bool SetBlendShapeDeformer(FbxBlendShape* pBlendShape);

	/** Get the blend shape deformer that contains this blend shape channel.
	* \return                        A pointer to the blend shape deformer if set or NULL.
	*/
	FbxBlendShape* GetBlendShapeDeformer();

	/** Add a target shape.
	* \param pShape                  Pointer to the target shape to add.
	* \param pFullDeformPercent      The full deform percentage for the target shape.
	* \return                        \c true on success, \c false otherwise.
	*/
	bool AddTargetShape(FbxShape* pShape, double pFullDeformPercent = 100);

	/** Remove the given target shape.
	* \param pShape                  Pointer to the target shape to remove from this blend shape channel.
	* \return                        Pointer to the target shape or \c NULL if pShape is not owned by this blend shape channel.
	*/
	FbxShape* RemoveTargetShape(FbxShape* pShape);

	/** Get the number of target shapes.
	* \return                        Number of target shapes that have been added to this blend shape channel.
	*/
	int GetTargetShapeCount() const;

	/** Get the target shape at given index.
	* \param pIndex                  Index of the target shape.
	* \return                        Pointer to the target shape or \c NULL if index is out of range.
	*/
	FbxShape* GetTargetShape(int pIndex);

	/** Get the target shape at given index.
	* \param pIndex                  Index of the target shape.
	* \return                        Pointer to the target shape or \c NULL if index is out of range.
	*/
	const FbxShape* GetTargetShape(int pIndex) const;

	/** Get the index of the given target shape.
	* \param pShape                  The given target shape to find index.
	* \return                        The index of the target shape.
	*/
	int GetTargetShapeIndex( FbxShape* pShape);

	/** Get the full weight values of target shape.
	* To access each value iterate in the array up to GetTargetShapeCount().
	* \return                        The array of full weight values of target shape.
	*/
	double* GetTargetShapeFullWeights();

	/** Set the array size for the fully deform weights.
    * This functions pre-allocate the array to pCount size.
	* \param pCount The new array size to set.
	*/
	void SetFullWeightsCount(int pCount);

    /**
      * \name General Functions
      */
    //@{
    /** Get the type of the sub deformer.
      * \return      The sub deformer type identifier of blend shape channel.
      */
    EType GetSubDeformerType() const {return eBlendShapeChannel; };

    /** Restore the blend shape channel to the initial state.
      * Calling this function will do the following:
      * \li Set the DeformPercent to 0.
      * \li Remove all target shapes.
      * \li Clear the array for fully deform weights of in-between target shapes.
      */
    void Reset();


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;
    
protected:
    virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);

    virtual FbxStringList GetTypeFlags() const;

    //The full weights array of each shapes on this blend shape channel
	FbxArray<double> mShapeFullWeightArray;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_BLEND_SHAPE_CHANNEL_H_ */
