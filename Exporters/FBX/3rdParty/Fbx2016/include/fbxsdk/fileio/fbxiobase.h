/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxiobase.h
#ifndef _FBXSDK_FILEIO_IO_BASE_H_
#define _FBXSDK_FILEIO_IO_BASE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/base/fbxstatus.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

#define FBXSDK_IO_END_NODE_STR "_End"

/** \brief Base class for FBX file importer and exporter.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxIOBase : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxIOBase, FbxObject);

public:
    /** Initializes the object.
      * \param pFileName     The name of the file to access.
      * \param pFileFormat   Unused in this class implementation.
      * \param pIOSettings   Unused in this class implementation.
      * \return              \c True if successful, returns \c False otherwise.
      * \remarks             To identify the error, inspect \e mStatus.
      */
    virtual bool Initialize(const char *pFileName, int pFileFormat=-1, FbxIOSettings* pIOSettings=NULL);

    /** Returns the file name.
       * \return     The file name or an empty string if no filename has been set.
       */
    virtual FbxString GetFileName();

    //! Get the status object containing the success or failure state.
    FbxStatus& GetStatus() { return mStatus; }

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);

    int DetectReaderFileFormat(const char *pFileName);
    int DetectWriterFileFormat(const char *pFileName);
    
    FbxStatus   mStatus;
    FbxString	mFilename;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_IO_BASE_H_ */
