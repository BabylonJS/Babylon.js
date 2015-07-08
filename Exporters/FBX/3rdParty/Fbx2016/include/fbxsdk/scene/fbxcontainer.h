/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxcontainer.h
#ifndef _FBXSDK_SCENE_CONTAINER_H_
#define _FBXSDK_SCENE_CONTAINER_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/scene/fbxcontainertemplate.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Generic container for object grouping and encapsulation.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxContainer : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxContainer, FbxObject);

public:
	/**
	  * \name Container dynamic attributes
     */
    //@{
		/** Create a new property.
		  * \param pName Name of the property
		  * \param pType Type of the property
		  * \param pLabel Label of the property
		  * \return the newly created property
		 */
		FbxProperty CreateProperty(FbxString pName, FbxDataType & pType, FbxString pLabel);
	//@}

	/**
	  * \name Public and fast access Properties
	  */
	//@{
		/** This property contains the template name information of the container
		*
		* To access this property do: TemplateName.Get().
		* To set this property do: TemplateName.Set(FbxString).
		*
		* Default value is "".
		*/
		FbxPropertyT<FbxString> TemplateName;

		/** This property contains the template path information of the container
		*
		* To access this property do: TemplatePath.Get().
		* To set this property do: TemplatePath.Set(FbxString).
		*
		* Default value is "".
		*/
		FbxPropertyT<FbxString> TemplatePath;

		/** This property contains the template version information of the container
		*
		* To access this property do: TemplateVersion.Get().
		* To set this property do: TemplateVersion.Set(FbxString).
		*
		* Default value is "".
		*/
		FbxPropertyT<FbxString> TemplateVersion;

		/** This property contains the view name information of the container
		*
		* To access this property do: ViewName.Get().
		* To set this property do: ViewName.Set(FbxString).
		*
		* Default value is "".
		*/
		FbxPropertyT<FbxString> ViewName;
	//@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
    FbxContainerTemplate* mContainerTemplate;

protected:
	virtual void Construct(const FbxObject* pFrom);
	virtual void ConstructProperties(bool pForceSet);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_CONTAINER_H_ */
