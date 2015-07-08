/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxblendshape.h
#ifndef _FBXSDK_SCENE_GEOMETRY_BLEND_SHAPE_H_
#define _FBXSDK_SCENE_GEOMETRY_BLEND_SHAPE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxdeformer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxGeometry;
class FbxBlendShapeChannel;

/** Class for blend shape deformer.
  * A blend shape deformer takes a base shape (polygonal surface, curve, or surface) 
  * and blends it with other target shapes based on weight values.
  * Blend shape deformer organize all target shapes via blend shape channel.
  * One blend shape deformer can contains multiple blend shape channels, then each  
  * channel can organize multiple target shapes, \see FbxBlendShapeChannel, FbxShape.
  * \remarks The blend effect of each blend shape channel is additive, so the final blend 
  *          effect of a blend shape deformer is the sum of blend effect of all blend shape
  *          channels it contains, the blend effect of each blend shape channel is controlled
  *          by the property DeformPercent of blend shape channel.
  * \see FbxGeometry, FbxGeometryBase.
  * \nosubgrouping
  */

class FBXSDK_DLL FbxBlendShape : public FbxDeformer
{
    FBXSDK_OBJECT_DECLARE(FbxBlendShape, FbxDeformer);

public:
    /** Set the geometry affected by this blend shape deformer.
      * \param pGeometry    Pointer to the geometry object to set.
      * \return             \c true on success, \c false otherwise.
	  * \remarks            One blend shape deformer can only be used on one base geometry. 
	  *                     So when SetGeometry is called, the pGeometry will replace the
	  *                     current base geometry connected to this blend shape deformer. 
      */
    bool SetGeometry(FbxGeometry* pGeometry);

    /** Get the geometry affected by this blend shape deformer.
      * \return             A pointer to the geometry if it is set or \c NULL if not set yet.
      */
    FbxGeometry* GetGeometry();

    /** Add a blend shape channel.
      * \param pBlendShapeChannel      Pointer to the blend shape channel object to add.
      * \return                        \c true on success, \c false otherwise.
      */
    bool AddBlendShapeChannel(FbxBlendShapeChannel* pBlendShapeChannel);

    /** Remove the given blend shape.
      * \param pBlendShapeChannel      Pointer to the blend shape channel to remove from this blend shape deformer.
      * \return                        Pointer to the blend shape channel or \c NULL if pBlendShapeChannel is not owned by this blend shape deformer.
      */
    FbxBlendShapeChannel* RemoveBlendShapeChannel(FbxBlendShapeChannel* pBlendShapeChannel);

    /** Get the number of blend shape channels.
      * \return                        Number of blend shape channels that have been added to this object.
      */
    int GetBlendShapeChannelCount() const;

    /** Get blend shape channel at given index.
      * \param pIndex                  Index of the blend shape channel.
      * \return                        Pointer to the blend shape channel or \c NULL if index is out of range.
      */
    FbxBlendShapeChannel* GetBlendShapeChannel(int pIndex);

    /** Get the blend shape channel at given index.
      * \param pIndex                  Index of the blend shape channel.
      * \return                        Pointer to the blend shape channel or \c NULL if index is out of range.
      */
    const FbxBlendShapeChannel* GetBlendShapeChannel(int pIndex) const;

    /** Get the type of the deformer.
      * \return                         The deformer type identifier of blend shape deformer.
      */
    EDeformerType GetDeformerType()  const {return eBlendShape; };

	/** Restore the blend shape deformer to the initial state.
	* Calling this function will do the following:
	* \li Clear the pointer to base geometry.
	* \li Remove all the blend shape channels.
	*/
	void Reset();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;
    
protected:
    virtual FbxStringList GetTypeFlags() const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_BLEND_SHAPE_H_ */
