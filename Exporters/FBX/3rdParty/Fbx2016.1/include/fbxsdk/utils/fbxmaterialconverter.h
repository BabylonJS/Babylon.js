/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxmaterialconverter.h
#ifndef _FBXSDK_UTILS_MATERIAL_CONVERTER_H_
#define _FBXSDK_UTILS_MATERIAL_CONVERTER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/geometry/fbxlayer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class LayerConfig;
class FbxMaterialConverter_Impl;

/** 
  * \brief This class provides functions to restructure the material and textures
  * applied to geometries from FBX v5 material system to v6-and-up or the other way around.
  * \nosubgrouping
  * \see FbxSurfaceMaterial, FbxTexture
  */
class FBXSDK_DLL FbxMaterialConverter
{
public:
	FbxMaterialConverter( FbxManager& mManager, FbxSurfaceMaterial* pDefaultMaterial = NULL);
	~FbxMaterialConverter();

	/** Moves textures in texture layer elements to connections
	  * on the corresponding material's color properties, for all geometries
	  * in the scene.(Convert scene from FBX v5 material system to v6-and-up)
	  * \param pScene The scene whose geometries should be converted.
	  * \return true on success, false otherwise
	  */
	bool ConnectTexturesToMaterials( FbxScene& pScene );

	/** Moves textures in texture layer elements to connections
	* on the corresponding material's color properties, for the given geometry
	* in the scene.(Convert scene from FBX v5 material system to v6-and-up)
	* \param pNode The geometry node to be converted.
	* \return true on success, false otherwise
	*/
	bool ConnectTexturesToMaterials( FbxNode* pNode );

	/** This is the reverse operation of ConnectTexturesToMaterials()
	  * Textures connected to Materials' color properties are stored
	  * in layer elements, and their connections to the color properties
	  * are broken.(Convert scene from FBX v6-and-up material system to v5)
	  * \param pScene The scene whose geometries should be converted.
	  * \return true if all geometries were converted, false otherwise
	  */
	bool AssignTexturesToLayerElements( FbxScene& pScene );

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
	typedef FbxPair<FbxTexture*, FbxLayerElementTexture::EBlendMode> TexData;

	FbxMaterialConverter& operator=(const FbxMaterialConverter&);

	FbxManager& mManager;
	FbxSurfaceMaterial* mDefaultMaterial;
    FbxMaterialConverter_Impl* mImpl;


	void GetTextures( int pComponent, FbxLayer* pLayer, LayerConfig& pLayerConfig ) const;
	FbxSurfaceMaterial* GetMaterial( int pComponent, FbxLayer* pLayer, FbxNode* pNode, bool pLookOnNode );
	int                  GetMaterialOrder( int pComponent, FbxLayer* pLayer, FbxNode* pNode, bool pLookOnNode );

	bool HasGoodMappingModes( FbxNode* pNode, FbxGeometry* pGeom ) const;
	void ConnectTextures( FbxSurfaceMaterial* pMat, FbxObject* pTexture, int pTextureType ) const;
	bool HasPerFaceMaterialMapping( FbxGeometry* pGeom ) const;
	void SetTextureUVSets( FbxGeometry* pGeom ) const;
	bool HasTextures( FbxGeometry* pGeom ) const;

	void GetTextureList( FbxArray<TexData>& pTextures, FbxLayeredTexture* pTex ) const;

	FbxLayer* FindLayerForTexture( FbxTexture* pTex, 
								  FbxLayerElement::EType pTexType, 
                                  FbxLayerElementTexture::EBlendMode pTexBlendMode, 
								  FbxGeometry* pGeom, 
								  int lComponentIndex, 
								  int lStartIndex = 0 ) const;

	void InitTextureElement( FbxLayerElementTexture* pTexElm, int pComponentCount,
        FbxLayerElementTexture::EBlendMode pMode) const;

	bool AssignTexturesToLayerElements( FbxNode* pNode); 

	bool HasTextureLayerElements( FbxGeometry& pGeom ) const;

	void ConvertToPerFaceMapping( FbxMesh* pGeom ) const;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_MATERIAL_CONVERTER_H_ */
