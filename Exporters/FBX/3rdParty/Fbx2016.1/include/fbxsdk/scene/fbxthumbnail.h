/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxthumbnail.h
#ifndef _FBXSDK_SCENE_THUMBNAIL_H_
#define _FBXSDK_SCENE_THUMBNAIL_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxThumbnailMembers;

/** Simple class to hold RGBA values of a thumbnail image.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxThumbnail : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxThumbnail, FbxObject);

public:
	/**
	  * \name Thumbnail properties
	  */
	//@{

	//! Pixel height of the thumbnail image
	FbxPropertyT<FbxInt> CustomHeight;

	//! Pixel width of the thumbnail image
	FbxPropertyT<FbxInt> CustomWidth;

	/** \enum EDataFormat Data format.
	  * - \e eRGB_24
	  * - \e eRGBA_32
	  */
	enum EDataFormat
	{
		eRGB_24, // 3 components
		eRGBA_32 // 4 components
	};

	/** Set the data format.
	  * \param pDataFormat Data format identifier.
	  */
	void SetDataFormat(EDataFormat pDataFormat);

	/** Get the data format.
	  * \return Data format identifier for the thumbnail.
	  */
	EDataFormat GetDataFormat() const;


	/** \enum EImageSize Image size.
	  * - \e eNotSet
	  * - \e e64x64
	  * - \e e128x128
	  * - \e eCustomSize
	  */
	enum EImageSize
	{
		eNotSet = 0,
		e64x64 = 64,
		e128x128 = 128,
		eCustomSize = -1
	};

	/** Set the thumbnail dimensions.
	  * \param pImageSize Image size identifier.
	  */
	void SetSize(EImageSize pImageSize);	

	/** Get the thumbnail dimensions.
	  * \return Image size identifier.
	  */
	EImageSize GetSize() const;

	/** Get the thumbnail dimensions in bytes.
	  * \return Thumbnail size in bytes.
	  */
	unsigned long GetSizeInBytes() const;


	//@}

	/**
	  * \name Thumbnail data access
	  */
	//@{

	/** Fill the thumbnail image.
	  * \param pImage Pointer to the image data. A copy
	  * of the image data will be made.
	  *	\remarks This pointer must point to a buffer region
	  * that is at least Width * Height * Component count
	  * bytes long. This pointer points to the upper left
	  * corner of the image.
	  * \remarks You must set the data format and the dimensions
	  * before calling this function. If the image size is set to eCustomSize
	  * the CustomHeight and CustomWidth properties must be set before calling
	  * this function.
	  * \return \c true if the thumbnail properties were set
	  * before calling this function. \c false otherwise.
	  */
	bool SetThumbnailImage(const FbxUChar* pImage);

	/** Get the thumbnail image.
	  * \return Pointer to the image data, or \c NULL if the
	  * thumbnail is empty.
	  */
	FbxUChar* GetThumbnailImage() const;

	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject&	Copy(const FbxObject& pObject);

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
	virtual void Destruct(bool pRecursive);

	FbxThumbnailMembers* mMembers;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_THUMBNAIL_H_ */
