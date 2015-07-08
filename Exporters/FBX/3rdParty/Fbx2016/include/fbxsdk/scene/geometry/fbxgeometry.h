/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxgeometry.h
#ifndef _FBXSDK_SCENE_GEOMETRY_H_
#define _FBXSDK_SCENE_GEOMETRY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxgeometrybase.h>
#include <fbxsdk/scene/geometry/fbxdeformer.h>
#include <fbxsdk/scene/geometry/fbxshape.h>
#include <fbxsdk/scene/geometry/fbxblendshape.h>
#include <fbxsdk/scene/geometry/fbxblendshapechannel.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxStatus;
class FbxGeometryWeightedMap;

/** The base class of geometric objects that support control point deformations (e.g. FbxMesh, FbxNurbs, 
* and FbxPatch). The FbxGeometry provides support for the following kinds of deformations.
*
* \li Skin deformation deformers
* \li Vertex cache deformers 
* \li Geometry weighted maps
* \li Shapes
* 
* Most of the methods of FbxGeometry are wrappers to simplify the access/manipulation of the connections 
* to the deformers. For example, calling the GetDeformerCount() method is the same 
* thing as calling: 
*
* \code
* geometry.GetSrcObjectCount(FbxDeformer::ClassId)
* \endcode
*/
class FBXSDK_DLL FbxGeometry : public FbxGeometryBase
{
    FBXSDK_OBJECT_DECLARE(FbxGeometry,FbxGeometryBase);

public:
    /** Returns the node attribute type.
      * This method is derived in the more high level classes (FbxMesh, FbxNurbs, etc...) and returns the
      * actual type of the geometry object. 
      *
      * \return \e eUnknown
      */
    virtual FbxNodeAttribute::EType GetAttributeType() const;

    /**
      * \name Deformer Management
      */
    //@{

    /** Adds a deformer to this geometry (as mentioned in the description of this class, adding a deformer is a synonym
      * for "connect a deformer").
      * \param pDeformer     Pointer to the deformer to be added.
      * \return              Index of the added deformer.
      */
    int AddDeformer(FbxDeformer* pDeformer);

	/** Remove a deformer.
	* \param pIndex  Index of deformer to remove.
    * \param pStatus The FbxStatus object to hold error codes.
	* \return Pointer to the removed deformer (or \c NULL if pIndex is out of range).
	*/
	FbxDeformer* RemoveDeformer(int pIndex, FbxStatus* pStatus = NULL);

    /** Returns the number of deformers.
      * \return     The number of deformers that are connected to this geometry.
      */
    int GetDeformerCount() const;

    /** Returns the deformer at the specified index.
      * \param pIndex     The specified deformer index.
      * \param pStatus    The FbxStatus object to hold error codes.
      * \return           Pointer to the deformer (or \c NULL if pIndex is out of range).
      */
    FbxDeformer* GetDeformer(int pIndex, FbxStatus* pStatus = NULL) const;

    /** Returns the number of deformers of a specified type.
      * \param pType     The specified deformer type.
      * \return          The number of deformers of the specified type.
      */
    int GetDeformerCount(FbxDeformer::EDeformerType pType) const;

    /** Returns the deformer of a specified type at the specified index.
      * \param pIndex     The specified deformer index.
      * \param pType      The specified deformer type.
      * \param pStatus    The FbxStatus object to hold error codes.
      * \return           Pointer to the deformer (or \c NULL if pIndex is out of range).
      */
    FbxDeformer* GetDeformer(int pIndex, FbxDeformer::EDeformerType pType, FbxStatus* pStatus = NULL) const;

    //@}

    /**
      * \name Geometry Weighted Maps Management
      */
    //@{

    /** Returns the source geometry weighted map that is connected to this geometry.
      * \return     Pointer to the source geometry weighted map that is connected to this geometry if any.
      */
    FbxGeometryWeightedMap* GetSourceGeometryWeightedMap();

    /** Returns the number of destination geometry weighted map(s) that are connected to this geometry.
      * \return     The number of destination geometry weighted map(s) that are connected to this geometry.
      */
    int GetDestinationGeometryWeightedMapCount() const;

    /** Returns the destination geometry weighted map at a specified index.
      * \param pIndex     The specified index.
      * \return           Pointer to the destination geometry weighted map at the specified index (if any).
      */
    FbxGeometryWeightedMap* GetDestinationGeometryWeightedMap(int pIndex);

    //@}

	/**
	* \name Shape Management
	*/
	//@{

	/** Add a shape to the specified blend shape deformer and blend shape channel of this geometry.
	* \param pBlendShapeIndex           The blend shape deformer index.
	* \param pBlendShapeChannelIndex    The blend shape channel index.
	* \param pShape                     Pointer to the shape object to be added.
	* \param pPercent                   The full deform percentage of this shape.
    * \param pStatus                    The FbxStatus object to hold error codes.
	* \return  \c true if success, \c false otherwise.
	*/
	bool AddShape(int pBlendShapeIndex, int pBlendShapeChannelIndex, FbxShape* pShape, double pPercent = 100, FbxStatus* pStatus = NULL);

	/** Removes all the shapes without destroying them.
	* If shapes aren't explicitly destroyed before calling this function, they will be
	* destroyed along with the SDK manager that created them.
	*/
	void ClearShape();

	/** Returns the number of shapes.
	* \return     The number of shapes that have been added to this geometry.
	*/
	int GetShapeCount() const;

	/** Returns the number of shapes.
	* \param pBlendShapeIndex              The blend shape deformer index.
	* \param pBlendShapeChannelIndex       The blend shape channel index.
    * \param pStatus                       The FbxStatus object to hold error codes.
	* \return     The number of shapes that have been added to this blend shape channel of this blend shape deformer.
	*/
	int GetShapeCount(int pBlendShapeIndex, int pBlendShapeChannelIndex, FbxStatus* pStatus = NULL) const;

	/** Returns the shape found at the specified index on a blend shape channel of a blend shape deformer.
	* \param pBlendShapeIndex              The blend shape deformer index.
	* \param pBlendShapeChannelIndex       The blend shape channel index.
	* \param pShapeIndex                   The specified shape index.
    * \param pStatus                       The FbxStatus object to hold error codes.
	* \return                              Pointer to the shape (or \c NULL if pIndex is out of range). 
	*/
	FbxShape* GetShape(int pBlendShapeIndex, int pBlendShapeChannelIndex, int pShapeIndex, FbxStatus* pStatus = NULL);

	/** Returns the shape found at the specified index on a blend shape channel of a blend shape deformer.
	* \param pBlendShapeIndex              The blend shape deformer index.
	* \param pBlendShapeChannelIndex       The blend shape channel index.
	* \param pShapeIndex                   The specified shape index.
    * \param pStatus                       The FbxStatus object to hold error codes.
	* \return                              Pointer to the shape (or \c NULL if pIndex is out of range).
	*/
	const FbxShape* GetShape(int pBlendShapeIndex, int pBlendShapeChannelIndex, int pShapeIndex, FbxStatus* pStatus = NULL) const;

	/** Get the shape animation curve.
	* The shape channel is an animatable property with a value range from 0 to 100 (with 100 being full shape deformation).
	* The default value is 0.
	* \param pBlendShapeIndex              The blend shape deformer index.
	* \param pBlendShapeChannelIndex       The blend shape channel index.
	* \param pLayer                        The animation layer from which we want to get the requested animation curve.
	* \param pCreateAsNeeded               If \c true, creates the animation curve if it is not already present.
    * \param pStatus                       The FbxStatus object to hold error codes.
	* \return Animation curve (or NULL if an error occurred).
	* \remarks If pLayer is left at NULL, the method will use the first layer of the Animation stack.
	*/
	FbxAnimCurve* GetShapeChannel(int pBlendShapeIndex, int pBlendShapeChannelIndex, FbxAnimLayer* pLayer, bool pCreateAsNeeded = false, FbxStatus* pStatus = NULL);
	//@}

    /** NURBS and Patches surface modes.
      * This information is never directly used inside the FBX SDK. Applications can use these values if they wish to 
	  * carry the "rendering" details of the NURBS and Patches. The FBX SDK guarantee that the value (member of the FbxNurbs,
	  * FbxNurbsSurface and FbxPatch classes) is stored to FBX files and retrieved from them.
	  * \remarks The enum has been defined in this class to avoid symbols duplication.
      */
    enum ESurfaceMode
    {
        eRaw,			//! Raw.
        eLowNoNormals,	//! Low and no normals.
        eLow,			//! Low.
		eHighNoNormals,	//! High and no normals.
        eHigh			//! High.
    };

    /**
      * \name Pivot Management
      * The geometry pivot is used to specify additional translation, rotation,
      * and scaling information applied to all control points when the model is
      * exported.
      */
    //@{

    /** Returns the pivot matrix.
      * \param pXMatrix     Placeholder for the returned matrix.
      * \return             Reference to the passed argument.
      */
    FbxAMatrix& GetPivot(FbxAMatrix& pXMatrix) const;

    /** Sets the pivot matrix.
      * \param pXMatrix     The transformation matrix that is assigned to the pivot matrix.
      */
    void SetPivot(FbxAMatrix& pXMatrix);

    /** Applies the pivot matrix to all vertices/normals of the geometry.
      */
    void ApplyPivot();

    //@}

	/**
	* \name Default Animation Values
	* These functions provides direct access to default animation values that are specific to a geometry.
	* These functions only work if the geometry has been associated with a node.
	*/
	//@{

	/** Sets the default deformation for a specified shape.
	* The default shape property has a value range from 0 to 100 (with 100 being full shape deformation).
	* The default value is 0.
	* \param pBlendShapeIndex              The blend shape deformer index.
	* \param pBlendShapeChannelIndex       The blend shape channel index.
	* \param pPercent                      Deformation percentage (on a scale ranging from 0 to 100).
	* \remarks                             This function has no effect if pIndex is out of range.
	*/
	void SetDefaultShape(int pBlendShapeIndex, int pBlendShapeChannelIndex, double pPercent);

	/** Sets the default deformation for a specified channel.
	* The default shape property has a value range from 0 to 100 (with 100 being full shape deformation).
	* The default value is 0.
	* \param pBlendShapeChannel       The blend shape channel.
	* \param pPercent                 Deformation percentage (on a scale ranging from 0 to 100).
	* \remarks                        This function has no effect if pShapeName is invalid.
	*/
	void SetDefaultShape(FbxBlendShapeChannel* pBlendShapeChannel,  double pPercent);

	/** Returns the default deformation value for the specified shape.
	* The default shape property has a value range from 0 to 100 (with 100 being full shape deformation).
	* The default value is 0.
	* \param pBlendShapeIndex              The blend shape deformer index.
	* \param pBlendShapeChannelIndex       The blend shape channel index.
	* \return           The deformation value for the specified shape, or 0 if pIndex is out of range.
	*/
	double GetDefaultShape(int pBlendShapeIndex, int pBlendShapeChannelIndex) const;

	/** Returns the default deformation value for the specified channel.
	* The default shape property has a value range from 0 to 100 (with 100 being full shape deformation).
	* The default value is 0.
	* \param pBlendShapeChannel       The blend shape channel.
	* \return                         The deformation value for the specified shape, or 0 if pShapeName is invalid.
	*/
	double GetDefaultShape(FbxBlendShapeChannel* pBlendShapeChannel) const;

	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    virtual FbxObject& Copy(const FbxObject& pObject);
    virtual FbxObject* Clone(FbxObject::ECloneType pCloneType=eDeepClone, FbxObject* pContainer=NULL, void* pSet = NULL) const;

    void CleanShapeChannels(FbxAnimLayer* pAnimLayer);
    void CleanShapeChannel(FbxAnimLayer* pAnimLayer, int pShapeIndex);
	void CreateShapeChannelProperties(FbxString& pShapeName);
    void ConvertShapeNamesToV5Format(FbxString pTakeNodeName);
    void ConvertShapeNamesToV5Format(FbxString pTakeNodeName, int pShapeIndex);
    void RevertShapeNamesToV6Format(FbxString pTakeNodeName);
    void RevertShapeNamesToV6Format(FbxString pTakeNodeName, int pShapeIndex);
    void ClearTemporaryShapeNames();

protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void Destruct(bool pRecursive);
    virtual void SetDocument(FbxDocument* pDocument);

    FbxString CreateShapeChannelName(int pShapeIndex);
    FbxString CreateShapeChannelName(FbxString pShapeName);

    void CopyDeformers(const FbxGeometry* pGeometry);
    void CopyPivot(const FbxGeometry* pSource);

    // Used during FBX v5 file store
    FbxArray<FbxString*> mShapeNameArrayV6;
    FbxArray<FbxString*> mShapeNameArrayV5;
    FbxArray<FbxString*> mShapeChannelNameArrayV5;

    FbxAMatrix* mPivot;

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_H_ */
