/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxfolder.h
#ifndef _FBXSDK_CORE_BASE_FOLDER_H_
#define _FBXSDK_CORE_BASE_FOLDER_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Class for iterating into file system folders and the items contained. */
class FBXSDK_DLL FbxFolder
{
public:
	//! The different entry type that can be found in folders.
	enum EEntryType
	{
		eRegularEntry,	//!< Regular entry, such as file.
		eFolderEntry	//!< Folder entry that potentially contain more files.
	};

	/** Open the specified folder for browsing its content.
	* \param pFolderPath_UTF8 The folder path to open.
	* \return True if the folder path was successfully open, false otherwise. */
	bool Open(const char* pFolderPath_UTF8);

	/** Get the next item in the folder.
	* \return True if another item was found after the current one. */
	bool Next();

	/** Get the type of the current entry in the folder.
	* \return The entry type. */
	EEntryType GetEntryType() const;

	/** Retrieve the name of the current entry in the folder.
	* \return The name of the current entry. */
	FbxString GetEntryName() const;

	/** Retrieve the extension name of the current entry.
	* \return The extension name of the current entry. */
	char* GetEntryExtension() const;

	/** Close the folder when done browsing its content. */
	void Close();

	/** Find out if the folder was successfully opened the last time Open was called.
	* \return True if the folder is currently open. */
	bool IsOpen() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
	FbxFolder();
	~FbxFolder();

private:
	struct FolderImpl;
	FolderImpl* mImpl;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_BASE_FOLDER_H_ */
