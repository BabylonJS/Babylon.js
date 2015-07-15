/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxproceduraltexture.h
#ifndef _FBXSDK_SCENE_SHADING_TEXTURE_PROCEDURAL_H_
#define _FBXSDK_SCENE_SHADING_TEXTURE_PROCEDURAL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxtexture.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Contains the information to generate a texture procedurally. Data information for the texture
  * generation is contained in a blob property.
  * \see FbxTexture
  * \nosubgrouping
  */
class FBXSDK_DLL FbxProceduralTexture : public FbxTexture
{
	FBXSDK_OBJECT_DECLARE(FbxProceduralTexture, FbxTexture);

	public:
	/**
	  * \name Procedural Texture Properties
	  */
	//@{

    /** This property handles the raw data for generating procedural texture.
      */
	FbxPropertyT<FbxBlob>			BlobProp;

	/** Resets the default procedural texture values.
	  */
	void Reset();

	//@}

	/**
	  * \name Property Access Methods
	  */
	//@{

	/** Sets the blob.
	  *	\param pBlob Blob containing information for the procedural texture
      */
	void SetBlob(FbxBlob& pBlob);

	/** Get the blob.
	  *	\return Blob containing information for the procedural texture
	  */
	FbxBlob GetBlob() const;

	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);

	bool operator==(FbxProceduralTexture const& pTexture) const;

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);

	void Init();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_TEXTURE_PROCEDURAL_H_ */
