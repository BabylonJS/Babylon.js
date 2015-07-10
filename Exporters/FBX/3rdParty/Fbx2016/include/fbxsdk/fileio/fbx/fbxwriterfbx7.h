/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxwriterfbx7.h
#ifndef _FBXSDK_FILEIO_FBX_WRITER_FBX7_H_
#define _FBXSDK_FILEIO_FBX_WRITER_FBX7_H_

#include <fbxsdk.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

struct FbxWriterFbx7_Impl;

class FbxWriterFbx7 : public FbxWriter
{
public:
    typedef enum
    {
        eASCII,
        eBINARY,
        eENCRYPTED
    } EExportMode;

    FbxWriterFbx7(FbxManager& pManager, FbxExporter& pExporter, int pID, FbxStatus& pStatus);
    FbxWriterFbx7(FbxManager& pManager, FbxExporter& pExporter, EExportMode pMode, int pID, FbxStatus& pStatus);
    virtual ~FbxWriterFbx7();

    virtual bool FileCreate(char* pFileName);
    virtual bool FileCreate(FbxStream* pStream, void* pStreamData);
    virtual bool FileClose();
    virtual bool IsFileOpen();

    virtual void GetWriteOptions();
    virtual bool Write(FbxDocument* pDocument);
    virtual bool PreprocessScene(FbxScene &pScene);
    virtual bool PostprocessScene(FbxScene &pScene);
    virtual bool Write(FbxDocument* pDocument, FbxIO* pFbx);
	virtual void PluginWriteParameters(FbxObject& pParams);
    virtual void SetProgressHandler(FbxProgress *pProgress);

    void SetExportMode(EExportMode pMode);

	virtual bool SupportsStreams() const		{ return true; }

private:
    // Declared, not defined.
    FbxWriterFbx7(const FbxWriterFbx7&);
    FbxWriterFbx7& operator=(const FbxWriterFbx7&);

    struct ModifiedPropertyInfo{ FbxObject* mObj; FbxString mPropName; };
    FbxArray<ModifiedPropertyInfo*> mModifiedProperties;
	void StoreUnsupportedProperty(FbxObject* pObject, FbxProperty& pProperty);

private:
    FbxWriterFbx7_Impl* mImpl;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_FBX_WRITER_FBX7_H_ */
