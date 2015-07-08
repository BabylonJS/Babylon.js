/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxlayercontainer.h
#ifndef _FBXSDK_SCENE_GEOMETRY_LAYER_CONTAINER_H_
#define _FBXSDK_SCENE_GEOMETRY_LAYER_CONTAINER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxnodeattribute.h>
#include <fbxsdk/scene/geometry/fbxlayer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** \brief Contains a collection of FbxLayer objects. 
  * This class is used for managing layers construction, destruction and access.
  * See FbxLayerElement for more details.
  * \nosubgrouping
  * \see FbxLayer
  */
class FBXSDK_DLL FbxLayerContainer : public FbxNodeAttribute
{
	FBXSDK_OBJECT_DECLARE(FbxLayerContainer,FbxNodeAttribute);
public:

	/** Returns the type of node attribute.
	  */
	virtual FbxNodeAttribute::EType GetAttributeType() const;

	/**
	  * \name Layer Management 
	  */
	//@{

	/** Creates a new layer on top of existing layers.
	  * \return     Index of created layer or -1 if an error occurs.
	  */
	int CreateLayer();

	//! Deletes all layers.
    void ClearLayers();

	/** Returns the number of layers.
	 * \return     The number of layers.
	 */
	int GetLayerCount() const;

	/** Returns the number of layers that contain the specified layer element type.
	  * \param pType     The specified Layer Element type.
      * \param pUVCount  When \c true, requests the UV layer element corresponding to the specified texture type.
	  * \return          The number of layers containing the specified layer element type.
	  */
	int GetLayerCount(FbxLayerElement::EType pType,  bool pUVCount=false) const;

	/** Returns the layer at the specified index.
	  *	\param pIndex     Layer index.
	  * \return           Pointer to the layer, or \c NULL if pIndex is out of range.
	  */
	FbxLayer* GetLayer(int pIndex);

	/** Returns the layer at the specified index.
	  *	\param pIndex     Layer index.
	  * \return           Pointer to the layer, or \c NULL if pIndex is out of range.
	  */
	const FbxLayer* GetLayer(int pIndex) const;

	/** Returns the n'th layer as specified by pIndex that contains the specified layer element type. 
      * If the pType is FbxLayerElement::eUV, this method will return the n'th layer as specified by pIndex that contains the diffuse UV.
      * For example, GetLayer(int pIndex, FbxLayerElement::eUV) is same as GetLayer(int pIndex, FbxLayerElement::eTextureDiffuse, true).
	  *	\param pIndex     Layer index.
	  * \param pType      The specified layer element type.
      * \param pIsUV      When \c true, requests the UV layer element that corresponds with the specified texture type.
	  * \return           Pointer to the layer, or \c NULL if pIndex is out of range.
	  */
	FbxLayer* GetLayer(int pIndex, FbxLayerElement::EType pType, bool pIsUV=false);

	/** Returns the n'th layer as specified by pIndex that contains the specified layer element type.
      * If the pType is FbxLayerElement::eUV, this method will return the n'th layer as specified by pIndex that contains the diffuse UV.
      * For example, GetLayer(int pIndex, FbxLayerElement::eUV) is same as GetLayer(int pIndex, FbxLayerElement::eTextureDiffuse, true).
	  *	\param pIndex     Layer index.
	  * \param pType      The specified layer element type.
      * \param pIsUV      When \c true, requests the UV layer element that corresponds with the specified texture type.
	  * \return           Pointer to the layer, or \c NULL if pIndex is out of range.
	  */
	const FbxLayer* GetLayer(int pIndex, FbxLayerElement::EType pType, bool pIsUV=false) const;

	/**	Returns the global index of the n'th layer as specified by pIndex that contains the specified layer element type.
	  * \param pIndex     Layer index of the specified type.
	  * \param pType      The specified layer element type.
      * \param pIsUV      When \c true, requests the UV layer element that corresponds with the specified texture type.
	  * \return           Global index of the n'th layer as specified by pIndex that contains the specified layer element type, or -1 if the layer is not found.
	  * \remarks          The returned index is the position of the layer in the global array of layers.
	  *                   You can use the returned index to call GetLayer(int pIndex).
	  */
	int GetLayerIndex(int pIndex, FbxLayerElement::EType pType, bool pIsUV=false) const;

	/** Converts the layer's global index to a type-specific index.
	  * \param pGlobalIndex     The index of the layer in the global array of layers.
	  * \param pType            The type upon which the type-specific index will be returned.
      * \param pIsUV            When \c true, requests the UV layer element that corresponds with the specified texture type.
	  * \return                 Layer index of the specified layer element type, or -1 if the layer element type is not found on the layer.
	  */
	int GetLayerTypedIndex(int pGlobalIndex, FbxLayerElement::EType pType, bool pIsUV=false) const;
	//@}

	/** Converts the reference mode from eDirect to eIndexToDirect.
	  * \param pLayer     The Layer to convert.
	  * \return           \c True if conversion is successful, or \c false otherwise.
      * \remarks          For the time being, this method only applies to the LayerLementType eMaterial
	  */
	bool ConvertDirectToIndexToDirect(int pLayer);

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);

	int  GTC(FbxUInt i, int j);
	void* GT (int  i,    FbxUInt l, int j); 
	int  AT (void* t,    FbxUInt l, int j);
	int  GTI(const char* n, FbxUInt l, int j);
	int  GMC(FbxUInt i, void* n = NULL);
	void* GM (int  i,    FbxUInt l, void* n = NULL);
	int  AM (void* m,    FbxUInt l, void* n = NULL, bool b = false);
	int  GMI(const char* n, FbxUInt l, void* d = NULL);

	int AddToLayerElementsList(FbxLayerElement* pLEl);
	void RemoveFromLayerElementsList(FbxLayerElement* pLEl);

protected:
	virtual void Destruct(bool pRecursive);

	void CopyLayers(const FbxLayerContainer* pLayerContainer);

	virtual void SetDocument(FbxDocument* pDocument);
	virtual	bool ConnectNotify (FbxConnectEvent const &pEvent);

	FbxArray<FbxLayer*> mLayerArray;
	FbxArray<FbxLayerElement*> mLayerElementsList;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_GEOMETRY_LAYER_CONTAINER_H_ */
