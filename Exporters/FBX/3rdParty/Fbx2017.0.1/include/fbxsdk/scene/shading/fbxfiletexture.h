/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxfiletexture.h
#ifndef _FBXSDK_SCENE_SHADING_TEXTURE_FILE_H_
#define _FBXSDK_SCENE_SHADING_TEXTURE_FILE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxtexture.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This class describes image mapping on top of geometry.
  * \note To apply a texture to geometry, first connect the 
  * geometry to a FbxSurfaceMaterial object (e.g. FbxSurfaceLambert)
  * and then connect one of its properties (e.g. Diffuse) to the 
  * FbxFileTexture object.
  * \see FbxSurfaceLambert
  * \see FbxSurfacePhong
  * \see FbxSurfaceMaterial
  * \note For some example code, see also the CreateTexture() function
  * in the ExportScene03 of FBX SDK examples.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxFileTexture : public FbxTexture
{
	FBXSDK_OBJECT_DECLARE(FbxFileTexture, FbxTexture);

public:
	/**
	  * \name Texture Properties
	  */
	//@{
        /** This property handles the material use.
          * Default value is false.
          */
		FbxPropertyT<FbxBool>				UseMaterial;

        /** This property handles the Mipmap use.
          * Default value is false.
          */
		FbxPropertyT<FbxBool>				UseMipMap;

	/** Resets the default texture values.
	  * \remarks            The texture file name is not reset.
	  */
	void Reset();

    /** Sets the associated texture file. 
      * \param pName        The absolute path of the texture file.   
      * \return             \c True if successful, returns \c false otherwise.
	  *	\remarks            The texture file name must be valid, you cannot leave the name empty.
      */
    bool SetFileName(const char* pName);

    /** Sets the associated texture file. 
      * \param pName        The relative path of the texture file.   
      * \return             \c True if successful, returns \c false otherwise.
	  *	\remarks            The texture file name must be valid.
      */
    bool SetRelativeFileName(const char* pName);

    /** Returns the absolute texture file path.
	  * \return             The absolute texture file path.
	  * \remarks            An empty string is returned if FbxFileTexture::SetFileName() has not been called before.
	  */
    const char* GetFileName () const;

    /** Returns the relative texture file path.
	  * \return             The relative texture file path.
	  * \remarks            An empty string is returned if FbxFileTexture::SetRelativeFileName() has not been called before.
	  */
    const char* GetRelativeFileName() const;

	/** \enum EMaterialUse      Specify if texture uses model material.
	  */
    enum EMaterialUse
    {
        eModelMaterial,		//! Texture uses model material.
        eDefaultMaterial	//! Texture does not use model material.
    };

    /** Sets the material use.
	  * \param pMaterialUse         Specify how texture uses model material.
	  */
    void SetMaterialUse(EMaterialUse pMaterialUse);

    /** Returns the material use.
	  * \return                     How the texture uses model material.
	  */
    EMaterialUse GetMaterialUse() const;


	//@}


/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);

	bool operator==(FbxFileTexture const& pTexture) const;

	FbxString& GetMediaName();
	void SetMediaName(const char* pMediaName);

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);

	void Init();
	void SyncVideoFileName(const char* pFileName);
	void SyncVideoRelativeFileName(const char* pFileName);

	FbxString mFileName;
	FbxString mRelativeFileName;
	FbxString mMediaName; // not a prop
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_TEXTURE_FILE_H_ */
