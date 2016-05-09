/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxdocumentinfo.h
#ifndef _FBXSDK_SCENE_DOCUMENT_INFO_H_
#define _FBXSDK_SCENE_DOCUMENT_INFO_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxThumbnail;

/** This class contains scene thumbnails and user-defined summary data.
  */
class FBXSDK_DLL FbxDocumentInfo : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxDocumentInfo, FbxObject);

public:
	/**
	* \name Public properties
	*/
	//@{
		/** This property contains the last saved URL.
		  *
		  * To retrieve the value of this property, use LastSavedUrl.Get().
		  * To set the value of this property, use LastSavedUrl.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> LastSavedUrl;

		/** This property contains the URL.
		  *
		  * To retrieve the value of this property, use Url.Get().
		  * To set the value of this property, use Url.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> Url;

		/** Parent property for all properties related to creation. These properties
		  * should be set once when the file is created, and you should not change them
		  * during subsequent save or reload operations.            
		  * The default properties are listed below, but application vendors can add new
		  * properties under this parent property.
		  */
		FbxProperty Original;

		/** This property contains the name of the original application vendor.
		  *
		  * To retrieve the value of this property, use Original_ApplicationVendor.Get().
		  * To set the value of this property, use Original_ApplicationVendor.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> Original_ApplicationVendor;

		/** This property contains the original application name.
		  *
		  * To retrieve the value of this property, use Original_ApplicationName.Get().
		  * To set the value of this property, use Original_ApplicationName.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> Original_ApplicationName;

		/** This property contains the version of the original application.
		  *
		  * To retrieve the value of this property, use Original_ApplicationVersion.Get().
		  * To set the value of this property, use Original_ApplicationVersion.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> Original_ApplicationVersion;

		/** This property contains the original file name.
		  *
		  * To retrieve the value of this property, use Original_FileName.Get().
		  * To set the value of this property, use Original_FileName.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> Original_FileName;

		/** This property contains the original date and time.
		  *
		  * To retrieve the value of this property, use Original_DateTime_GMT.Get().
		  * To set the value of this property, use Original_DateTime_GMT.Set(FbxString).
		  *
		  * The default value is 0.
		  * \remarks                The date/time should use GMT time format. 
		  */
		FbxPropertyT<FbxDateTime> Original_DateTime_GMT;

		/** The parent property for all last saved-related properties.
		  * These properties update every time a file is saved.               
		  * The default properties are below, but application vendors can add new
		  * properties under this parent property.             
		  * The file creator must set both the original and last saved properties.
		  */
		FbxProperty LastSaved;

		/** This property contains the last saved application vendor.
		  *
		  * To retrieve the value of this property, use LastSaved_ApplicationVendor.Get().
		  * To set the value of this property, use LastSaved_ApplicationVendor.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> LastSaved_ApplicationVendor;

		/** This property contains the last saved application name.
		  *
		  * To retrieve the value of this property, use LastSaved_ApplicationName.Get().
		  * To set the value of this property, use LastSaved_ApplicationName.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> LastSaved_ApplicationName;

		/** This property contains the last saved application version.
		  *
		  * To retrieve the value of this property, use LastSaved_ApplicationVersion.Get().
		  * To set the value of this property, use LastSaved_ApplicationVersion.Set(FbxString).
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> LastSaved_ApplicationVersion;

		/** This property contains the last saved date and time.
		  *
		  * To retrieve the value of this property, use LastSaved_DateTime_GMT.Get().
		  * To set the value of this property, use LastSaved_DateTime_GMT.Set(FbxString).
		  *
		  * The default value is 0.
		  *
		  * \remarks The date/time should use GMT time format.
		  */
		FbxPropertyT<FbxDateTime> LastSaved_DateTime_GMT;

		/** This property points at the ".fbm" folder that is created when 
		  * reading a FBX file that has embedded data. The embedded data 
		  * is not saved in the FBX file. 
		  *
		  * The default value is empty.
		  */
		FbxPropertyT<FbxString> EmbeddedUrl;
	//@}

	/** \name User-defined summary data.
	  * These are user-completed fields that identify or classify the files.
	  */
	//@{
		FbxString mTitle;		//! Title.
		FbxString mSubject;		//! Subject.
		FbxString mAuthor;		//! Author
		FbxString mKeywords;	//! Keywords.
		FbxString mRevision;	//! Revision.
		FbxString mComment;		//! Comment.
	//@}

	/**
	  * \name Scene Thumbnail.
	  */
	//@{
		/** Returns the thumbnail for the scene.
		  * \return                 Pointer to the thumbnail.
		  */
		FbxThumbnail* GetSceneThumbnail();

		/** Sets the thumbnail for the scene.
		  * \param pSceneThumbnail  Pointer to the thumbnail.
		  */
		void SetSceneThumbnail(FbxThumbnail* pSceneThumbnail);
	//@}

	/** Clears the content.
	  * Resets all the strings to an empty string and clears 
	  * the pointer to the thumbnail.
	  */
	void Clear();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	virtual FbxObject& Copy(const FbxObject& pObject);

protected:
	virtual void Destruct(bool pRecursive);
	virtual void ConstructProperties(bool pForceSet);

    FbxPropertyT<FbxReference> SceneThumbnail;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_DOCUMENT_INFO_H_ */
