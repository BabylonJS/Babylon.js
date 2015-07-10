/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxprocessorshaderdependency.h
#ifndef _FBXSDK_UTILS_PROCESSOR_SHADER_DEPENDENCY_H_
#define _FBXSDK_UTILS_PROCESSOR_SHADER_DEPENDENCY_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxhashmap.h>
#include <fbxsdk/core/base/fbxdynamicarray.h>
#include <fbxsdk/scene/shading/fbxbindingtable.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Crawls CgFx and HLSL shader files, copies them, and all dependent
  * shader files into the location specified by RootProcessPath. 
  */
class FBXSDK_DLL FbxProcessorShaderDependency : public FbxProcessor
{
    FBXSDK_OBJECT_DECLARE(FbxProcessorShaderDependency, FbxProcessor);

public:
    FbxPropertyT<FbxString> RootProcessPath;

    FbxPropertyT<FbxBool> CleanupOnDestroy;

    FbxPropertyT<FbxString> AdditionalIncludePaths;

    void ClearProcessedFiles();

    /**
    * \name Overridable internal function    */
    //@{
protected:
    virtual bool internal_ProcessObject(FbxObject* pObject);
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
// Constructor / Destructor
protected:
    virtual void ConstructProperties(bool pForceSet);
    virtual void Destruct(bool pRecursive);

public:

    class StringHash
    {
    public:
        unsigned int operator()( const FbxString& pValue ) const
        {
            // from wikipedia.org
            // Jenkins One-at-a-time hash

            size_t lLen = pValue.GetLen();
            unsigned int lHashValue = 0;
            const char* lData = pValue.Buffer();
            for( size_t i = 0; i < lLen; ++i )
            {
                lHashValue += lData[i];
                lHashValue += (lHashValue << 10);
                lHashValue ^= (lHashValue >> 16);
            }
            lHashValue += (lHashValue << 3);
            lHashValue ^= (lHashValue >> 11);
            lHashValue += (lHashValue << 15);

            return lHashValue;
        }
    };

protected:

    class FileDeleter
    {
    public: 
        FileDeleter( const char* pFileUrl ) : mFileUrl( pFileUrl) {};
        ~FileDeleter()
        {
            if( !mFileUrl.IsEmpty() )
            {
                remove( mFileUrl );
            }
        };

        void Release() { mFileUrl = ""; }

    private: FbxString mFileUrl;
    };

    // first == string as it appears in the file
    // second == string URL
    struct FilePathData
    {
        FbxString mOriginalStr;
        FbxString mOriginalAbsUrl;

        FbxString mNewStr;
    };

    typedef FbxDynamicArray< FilePathData > FilePathList;

    virtual bool GetIncludePaths( FbxString& pFile, FilePathList& pPaths, FbxXRefManager& pManager ) const;
    virtual bool ReplaceUrls( const FbxString& pFileUrl, const FbxString& pNewFileUrl, 
                    const FilePathList& pPaths ) const;

private:
    struct Dependency
    {
        FbxString mNewUrl;
        FbxString mOriginalUrl;
    };

    typedef FbxHashMap< FbxString, Dependency, StringHash > DependMap;

    DependMap mDependMap;

    FbxString mRootPath;

    FbxXRefManager mResolver;
    int mSystemIndex;

    // magic number to limit the size of files we can parse =(
    static const int sMaxFileSize;

    bool ParseDependencies( const FbxBindingTable& pTable );
    bool AddDependency( FbxString& pFileUrl );
    bool AddSystemPaths();
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_UTILS_PROCESSOR_SHADER_DEPENDENCY_H_ */
