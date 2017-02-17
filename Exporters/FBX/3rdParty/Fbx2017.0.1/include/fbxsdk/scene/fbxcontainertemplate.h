/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcontainertemplate.h
#ifndef _FBXSDK_SCENE_CONTAINER_TEMPLATE_H_
#define _FBXSDK_SCENE_CONTAINER_TEMPLATE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

//Container Template tokens
#define FBXSDK_CONTAINER_TEMPLATE_STR  "templates"
#define FBXSDK_TEMPLATE_STR            "template"
#define FBXSDK_EXTENDS_TEMPLATE_STR    "extends"

struct FbxContainerTemplate_internal;

/** Class for Container Template files.
* \nosubgrouping
*/
class FBXSDK_DLL FbxContainerTemplate : public FbxObject
{
    FBXSDK_OBJECT_DECLARE(FbxContainerTemplate, FbxObject);

public:
    /** Parse template file to get extend templates.
    * \param  pTemplateFilePath  The template file to be parsed.
    * \param  pExtendTemplateNames  Fill extend templates' names to this array.
    * \remark Call this function to get extend templates' names.
    */
    void ParseTemplateFile(const char* pTemplateFilePath, FbxArray<FbxString*>& pExtendTemplateNames);

    /** Add extend template path.
    * \param  pExtendTemplatePath  The template file path to be added.
    */
    void AddExtendTemplatePath(const char* pExtendTemplatePath);

    /** Get the (pIndex)th extend template path.
    * \param  pIndex  Index of the queried item.
    * \return The (pIndex)th extend template path.
    */
    char* GetExtendTemplatePathAt(FbxUInt pIndex) const;

    /** Get the count of extend template path.
    * \return The count of extend template path.
    */
    FbxUInt GetExtendTemplateCount() const;

    /** Clear the extend template path.
    */
    void ClearExtendTemplatePath();

    /** This property contains the template name.
    *
    * To access this property do: TemplateName.Get().
    * To set this property do: TemplateName.Set(FbxString).
    *
    * Default value is "".
    */
    FbxPropertyT<FbxString> ContainerTemplateName;

    /** This property contains the template path.
    *
    * To access this property do: TemplatePath.Get().
    * To set this property do: TemplatePath.Set(FbxString).
    *
    * Default value is "".
    */
    FbxPropertyT<FbxString> ContainerTemplatePath;

    /** This property contains the template package name.
    *
    * To access this property do: TemplatePackageName.Get().
    * To set this property do: TemplatePackageName.Set(FbxString).
    *
    * Default value is "".
    */
    FbxPropertyT<FbxString> ContainerTemplatePackageName;

    /** This property contains the template version information of the container
    *
    * To access this property do: TemplateVersion.Get().
    * To set this property do: TemplateVersion.Set(FbxString).
    *
    * Default value is "".
    */
    FbxPropertyT<FbxString> ContainerTemplateVersion;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void Construct(const FbxObject* pFrom);
    virtual void ConstructProperties(bool pForceSet);
    virtual void Destruct(bool pRecursive);
    
private:
	FbxContainerTemplate_internal*	mData;
    FbxArray<FbxString*>		mExtendTemplatePaths;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONTAINER_TEMPLATE_H_ */
