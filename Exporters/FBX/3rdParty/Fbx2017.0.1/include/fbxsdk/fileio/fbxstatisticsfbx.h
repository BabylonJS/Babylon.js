/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxstatisticsfbx.h
#ifndef _FBXSDK_FILEIO_STATISTICS_FBX_H_
#define _FBXSDK_FILEIO_STATISTICS_FBX_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/fileio/fbxstatistics.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS

class FbxStatisticsFbx : public FbxStatistics
{
public:
    virtual bool AddItem(FbxString& pItemName, int pItemCount)
    {
        mItemName.Add( FbxNew< FbxString >(pItemName) );
        mItemCount.Add( pItemCount);
        return true;
    };
};

#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_STATISTICS_FBX_H_ */
