/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxplugincontainer.h
#ifndef _FBXSDK_CORE_PLUGIN_CONTAINER_H_
#define _FBXSDK_CORE_PLUGIN_CONTAINER_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/core/fbxplugin.h>
#include <fbxsdk/core/fbxemitter.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** Manages registration and ownership of FBX SDK plug-ins (FbxPlugin). 
  * The FBX SDK will provide a pointer to FbxPluginContainer as an argument
  * to the FBXPluginRegistration() function exported from a plug-in's DLL.
  * A plug-in must register itself explicitly with the FbxPluginContainer
  * by calling FbxPluginContainer::Register() after it is constructed. 
  * For an example of this process see the code example in the FbxPlugin 
  * class documentation.
  * \see FbxPlugin
  */
class FBXSDK_DLL FbxPluginContainer : public FbxEmitter
{
public:
	//! Definition of a plug-in list.
	typedef FbxIntrusiveList<FbxPlugin> PluginList;

	/** The registration function that must be called when the module containing the plug-in is loaded.
	  * \param pPlugin The plug-in to register.
	  */
	void Register(FbxPlugin& pPlugin);

	/** The unregistration function that must be called when the module containing the plug-in is unloaded.
	  * \param pPlugin The plug-in to unregister.
	  */
	void Unregister(FbxPlugin& pPlugin);

	/** Const accessor to the list of plug-ins owned by the container.
	  * \return A list of plug-in registered to this container.
	  */
	const PluginList& GetPlugins() const;

	/** Accessor to the list of plug-ins owned by the container.
	  * \return A list of plug-in registered to this container.
	  */
	PluginList& GetPlugins();

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual ~FbxPluginContainer();
	PluginList mPlugins;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_PLUGIN_CONTAINER_H_ */
