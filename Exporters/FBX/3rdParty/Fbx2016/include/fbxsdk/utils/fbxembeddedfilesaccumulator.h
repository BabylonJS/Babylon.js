/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxembeddedfilesaccumulator.h
#ifndef _FBXSDK_UTILS_EMBEDDED_FILES_ACCUMULATOR_H_
#define _FBXSDK_UTILS_EMBEDDED_FILES_ACCUMULATOR_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/utils/fbxprocessor.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** This processor is used to accumulate the list of file dependencies (embedded files) in a hierarchy of objects.
  * It retrieves information of embedded files from objects and accumulates them to its class member mEmbeddedFiles.
  * \see FbxProcessor::ProcessCollection(FbxCollection *)
  * \nosubgrouping
  */
class FBXSDK_DLL FbxEmbeddedFilesAccumulator : public FbxProcessor
{
public:
    /**
    * Map the object to the property's hierarchical name.
    * An object may use the same file on multiple properties, hence the
    * set.
    * Each property may have multiple URLs, separate by |.
    * We thus need to store the index along with the property.
    */
    //@{
    struct PropertyUrlIndex
    {
        FbxString mPropName;
        int     mIndex;

        PropertyUrlIndex() : mIndex(0)
        {
        }

        PropertyUrlIndex(const FbxString& pUrl, int pIndex)
            : mPropName(pUrl)
            , mIndex(pIndex)
        {
        }
    };

    //! Comparer for PropertyUrlIndexSet, which outputs consistent partial orders for PropertyUrlIndex pairs
    struct FbxPropertyUrlIndexCompare
    {
        inline int operator()(const PropertyUrlIndex& pKeyA, const PropertyUrlIndex& pKeyB) const
        {
            if( pKeyA.mPropName < pKeyB.mPropName ) return -1;
            if( pKeyB.mPropName < pKeyA.mPropName ) return 1;
            if( pKeyA.mIndex < pKeyB.mIndex ) return -1;
            if( pKeyB.mIndex < pKeyA.mIndex ) return 1;
            return 0;                
        }
    };

    typedef FbxSet<PropertyUrlIndex, FbxPropertyUrlIndexCompare> PropertyUrlIndexSet;

    typedef FbxMap<FbxObject*, PropertyUrlIndexSet> ObjectPropertyMap;

    struct EmbeddedFileInfo
    {
        FbxString                 mOriginalPropertyUrl;
        ObjectPropertyMap   mConsumers;
    };
    //@}

    /**
    * Map the (absolute filename) to which object/properties use this file.
    * To simply get the list of file dependencies, iterate through this map and query
    * all the keys.
    */
    //@{
    typedef FbxMap<FbxString, EmbeddedFileInfo>     EmbeddedFilesMap;

    EmbeddedFilesMap   mEmbeddedFiles;
    //@}

public:
    
    /** Constructor.
    * The name is not important.
    * The property filter is a list of strings, property names, which are automatically ignored when
    * encountered. Property names must be the full hierarchical property name (ie: parent|child|child).
    *
    * \param pManager           Reference to the SDK manager.
    * \param pName              Name of this object.
    * \param pPropertyFilter    Reference to the property filter.
    */
    FbxEmbeddedFilesAccumulator(FbxManager& pManager, const char* pName, FbxSet<FbxString>& pPropertyFilter);
    virtual ~FbxEmbeddedFilesAccumulator();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    virtual bool internal_ProcessObject(FbxObject* pObject);
    FbxSet<FbxString>   mPropertyFilter;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_EMBEDDED_FILES_ACCUMULATOR_H_ */
