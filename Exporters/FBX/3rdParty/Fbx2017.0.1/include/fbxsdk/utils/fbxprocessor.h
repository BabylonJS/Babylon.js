/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxprocessor.h
#ifndef _FBXSDK_UTILS_PROCESSOR_H_
#define _FBXSDK_UTILS_PROCESSOR_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxCollection;

/** The class and its derived classes(e.g. FbxProcessorXRefCopy, FbxProcessorXRefCopyUserLibrary, etc.) are used to process shader, library, asset, etc.
  * For example, you could update object property and its value via FbxProcessor::ProcessObject(), FbxProcessor::internal_ProcessObject(), etc.
  */
class FBXSDK_DLL FbxProcessor : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxProcessor, FbxObject);

public:
	/**
	* \name Processor management
	*/
	//@{
        /** Process the specified collection.
        * \param pCollection
        */
		bool					ProcessCollection(FbxCollection *pCollection=0);

        /** Process the specified object.
        * \param pCollection FbxObject to process
        */
		bool					ProcessObject	 (FbxObject *pCollection=0);
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
    virtual bool				internal_ProcessCollectionBegin (FbxCollection *pCollection);
    virtual bool				internal_ProcessCollectionEnd 	(FbxCollection *pCollection);
    virtual bool				internal_ProcessObject  		(FbxObject*	 pObject);
    virtual bool				internal_ProcessCollection		(FbxCollection* pCollection);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_PROCESSOR_H_ */
