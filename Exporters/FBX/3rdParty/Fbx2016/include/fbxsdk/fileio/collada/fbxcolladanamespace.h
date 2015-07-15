/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcolladanamespace.h
#ifndef _FBXSDK_FILEIO_COLLADA_NAMESPACE_H_
#define _FBXSDK_FILEIO_COLLADA_NAMESPACE_H_

#include <fbxsdk.h>

#include <components/libxml2-2.7.8/include/libxml/globals.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Containing the valid parameter definition and modification in local scope.
  */
struct FbxColladaNamespace
{
public:
    /** Push the newparam and setparam elements found in this element.
      * Call this method at the beginning of importing an element.
      * \param pElement The specific element.
      */
    void Push(xmlNode * pElement);

    /** Pop the newparam and setparam elements found in this element.
      * Call this method at the end of importing an element.
      */
    void Pop();

    /** Find the specific newparam element with given SID.
      * \param pSID The given SID.
      * \return Return the found element or NULL if fail.
      */
    xmlNode * FindParamDefinition(const char * pSID) const;

    /** Find the specific setparam element with given SID.
      * \param pSID The given SID.
      * \return Return the found element or NULL if fail.
      */
    xmlNode * FindParamModification(const char * pSID) const;

    /** Get the count of all the setparam elements in local scope.
      * \return The count.
      */
    int GetParamModificationCount() const;

    /** Get the setparam element with given index.
      * \param pIndex The given index.
      * \return The element.
      */
    xmlNode * GetParamModification(int pIndex) const;

private:
    FbxArray<xmlNode*> mParamDefinition;
    FbxArray<int> mParamDefinitionCount;

    FbxArray<xmlNode*> mParamModification;
    FbxArray<int> mParamModificationCount;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_FILEIO_COLLADA_NAMESPACE_H_ */
