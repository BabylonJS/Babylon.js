/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxplugin.h
#ifndef _FBXSDK_CORE_PLUGIN_H_
#define _FBXSDK_CORE_PLUGIN_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/fbxmodule.h>
#include <fbxsdk/core/fbxlistener.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxManager;
class FbxPluginContainer;

//! Plug-in declaration macro that must to be used when defining new FbxPlugin objects.
#define FBXSDK_PLUGIN_DECLARE(Plugin)\
	FBXSDK_FRIEND_NEW();\
public:\
	static Plugin * Create(const FbxPluginDef& pDefinition, FbxModule pModuleHandle);\
	void Destroy();

//! Plug-in implementation macro that must be used when implementing new FbxPlugin objects.
#define FBXSDK_PLUGIN_IMPLEMENT(Plugin)\
	Plugin* Plugin::Create(const FbxPluginDef& pDefinition, FbxModule pModuleHandle){ return FbxNew<Plugin>(pDefinition, pModuleHandle); }\
	void Plugin::Destroy(){ FbxDelete(this); }

/** Structure used by plug-ins for identification purposes.
  * \note To avoid confusions in the system, it is recommended to choose an appropriate unique identifier string name when
  * defining your plug-in, as well as incrementing the version string to a correct value whenever something changes in the
  * implementation of the plug-in. Both of these string are used when comparing plug-ins for searches, as well as
  * identification in FBX files.
  */
struct FBXSDK_DLL FbxPluginDef
{
	//! Constructor
	FbxPluginDef() :
		mName("Unknown Name"),
		mVersion("Unknown Version")
	{
	}

	FbxString mName;		//!< The identifier name string of the plug-in. If the name is already used by another plug-in, the plug-in will still register.
	FbxString mVersion;	//!< The version string of the plug-in.
};

/** Data used to communicate information between an application and the plug-in.
  */
struct FBXSDK_DLL FbxPluginData
{
	//! Constructor
	FbxPluginData() :
		mQueryEmitter(NULL),
		mSDKManager(NULL),
		mPluginContainer(NULL)
	{
	}

	//! Copy Constructor
	explicit FbxPluginData(const FbxPluginData& pOther) :
		mQueryEmitter(pOther.mQueryEmitter),
		mSDKManager(pOther.mSDKManager),
		mPluginContainer(pOther.mPluginContainer)
	{
	}

	FbxEmitter*			mQueryEmitter;		//!< The emitter on which the plug-in can listen to receive events.
	FbxManager*			mSDKManager;		//!< The FBX SDK Manager on which the plug-in was instanced.
	FbxPluginContainer*	mPluginContainer;   //!< The container which will have the ownership of the plug-in.
};

/** The base class to inherit from when creating new plug-ins for the FBX SDK. Plug-ins for the FBX SDK are extremely flexible
  * allowing a wide-range of possibilities. For example, one can write his own plug-in to add new readers/writers to the current list
  * of supported I/O formats, or add new dynamic classes to instantiate custom objects that can later be stored in FBX files. We also use the same
  * interface for plug-ins written using the FBX Extension SDK, which allow additional callbacks for other various Autodesk products
  * enabling greater interoperability with multiple various SDKs.
  *
  * Here is typical implementation of an FBX SDK plug-in that doesn't do anything else than just registering itself:
  * \code
  * class MyPlugin : public FbxPlugin
  * {
  *     FBXSDK_PLUGIN_DECLARE(MyPlugin); //This macro is mandatory for any plug-in definition
  *
  * protected:
  *     explicit MyPlugin(const FbxPluginDef& pDefinition, FbxModule pModuleHandle) : FbxPlugin(pDefinition, pModuleHandle)
  *     {
  *     }
  *
  *     //Abstract functions that *must* be implemented
  *     virtual bool SpecificInitialize()
  *     {
  *         //For example, here we could register as many new I/O readers/writers as we would like, or classes, etc.
  *         return true;
  *     }
  *
  *     virtual bool SpecificTerminate()
  *     {
  *         //Here we would have to unregister whatever we registered to the FBX SDK
  *         return true;
  *     }
  * };
  *
  * FBXSDK_PLUGIN_IMPLEMENT(MyPlugin); //This macro is mandatory for any plug-in implementation
  *
  * //Standard C export needed for any new FBX SDK plug-in
  * extern "C"
  * {
  *     static MyPlugin* sMyPluginInstance = NULL; //The module is owner of the plug-in
  *
  *     //This function will be called when an application will request the plug-in
  * #ifdef FBXSDK_ENV_WIN
  *     __declspec(dllexport) void FBXPluginRegistration(FbxPluginContainer& pContainer, FbxModule pModuleHandle)
  * #else
  *     void FBXPluginRegistration(FbxPluginContainer& pContainer, FbxModule pModuleHandle)
  * #endif
  *     {
  *         if( sPlugin == NULL )
  *         {
  *             //Create the plug-in definition which contains the information about the plug-in
  *             FbxPluginDef sPluginDef;
  *             sPluginDef.mName = "My Plugin";
  *             sPluginDef.mVersion = "1.0";
  *
  *             //Create an instance of the plug-in
  *             sMyPluginInstance = MyPlugin::Create(sPluginDef, pLibHandle);
  *
  *             //Register the plug-in with the FBX SDK
  *             pContainer.Register(*sPlugin);
  *         }
  *     }
  * }
  * \endcode
  * \see FbxPluginDef, FbxPluginData
  */
class FBXSDK_DLL FbxPlugin : public FbxListener
{
	FBXSDK_INTRUSIVE_LIST_NODE(FbxPlugin, 1);

public:
	/** Abstract function called once at the end of the plug-in construction. At that moment, plug-in data have been properly initialized.
	  * This function must be implemented by anyone who writes a new plug-in for the FBX SDK.
	  */
	virtual bool SpecificInitialize()=0;

	/** Abstract function called once at the beginning of the plug-in destruction. At that moment, plug-in data is fully available.
	  * This function must be implemented by anyone who writes a new plug-in for the FBX SDK.
	  */
	virtual bool SpecificTerminate()=0;

	/** Virtual function called once when the FBX SDK is about to write an FBX file. Users can re-implement it in their plug-in if they need
	  * to perform tasks at that moment. The scene provided in parameter can be altered. If not re-implemented, this function does nothing.
	  * \param pScene The scene that is about to be written in the FBX file.
	  */
	virtual void WriteBegin(FbxScene& pScene);

	/** Virtual function called once when the FBX SDK is about to write plug-in's parameters. Users can re-implement it in their plug-in if they need
	  * to store properties in the FBX file for their own usage. The object in parameter is used to store those properties.
	  * If not re-implemented, this function does nothing.
	  * \param pParams An abstract object that can be used as a property container, to allow the plug-in to store properties about the plug-in.
	  */
	virtual void WriteParameters(FbxObject& pParams);

	/** Virtual function called once after the FBX SDK wrote an FBX file. Users can re-implement it in their plug-in if they need
	  * to perform tasks at that moment. The scene provided in parameter can be altered, but the changes will not appear in the FBX file.
	  * If not re-implemented, this function does nothing.
	  * \param pScene The scene that was written in the FBX file.
	  */
	virtual void WriteEnd(FbxScene& pScene);

	/** Virtual function called once when the FBX SDK is about to read an FBX file. Users can re-implement it in their plug-in if they need
	  * to perform tasks at that moment. The scene provided in parameter can be altered. If not re-implemented, this function does nothing.
	  * \param pScene The scene that is about to be read in the FBX file.
	  */
	virtual void ReadBegin(FbxScene& pScene);

	/** Virtual function called once after the FBX SDK reads the plug-in's parameters. Users can re-implement it in their plug-in if they need
	  * to retrieve properties for their own usage. The object in parameter is used to retrieve those properties.
	  * If not re-implemented, this function does nothing.
	  * \param pParams An abstract object that can be used as a property container, to allow the plug-in to read properties about the plug-in.
	  */
	virtual void ReadParameters(FbxObject& pParams);

	/** Virtual function called once after the FBX SDK read an FBX file. Users can re-implement it in their plug-in if they need
	  * to perform tasks at that moment. The scene provided in parameter can be altered. If not re-implemented, this function does nothing.
	  * \param pScene The scene that was read in the FBX file.
	  */
	virtual void ReadEnd(FbxScene& pScene);

	/** Accessor to the plug-in definition structure that contains basic information on the plug-in like its name or version. This is
	  * the only method available to differentiate plug-ins.
	  * \return The definition structure for this plug-in.
	  */
	const FbxPluginDef& GetDefinition() const;

	/** Retrieve the module address pointer for this plug-in. With this module instance handle, for example someone can query procedures addresses,
	  * allowing more complex interactions, as well as other operating system module specific functions.
	  */
	FbxModule GetModuleHdl();

protected:
	/** Use the Create() and Destroy() methods declared and implemented in the FBXSDK_PLUGIN_DECLARE and FBXSDK_PLUGIN_IMPLEMENT macros to construct and destroy FbxPlugin objects.
	  * \param pDefinition The definition associated with this plug-in. Each plug-in must have its own definition to differentiate it with other plug-ins.
	  * \param pModuleHandle A pointer to the plug-in module address.
	  */
	explicit FbxPlugin(const FbxPluginDef& pDefinition, FbxModule pModuleHandle);

	/** Accessor to the plug-in private data.
	  * \return The data for the current plug-in.
	  */
	FbxPluginData& GetData();

	/** Const accessor to the plug-in private data.
	  * \return The const data for the current plug-in.
	  */
	const FbxPluginData& GetData() const;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
public:
	inline FbxObject& GetPluginSettings() { return *mPluginSettings; }
	inline const FbxObject& GetPluginSettings() const { return *mPluginSettings; }
	template <typename EventType, typename ListernerType> inline FbxEventHandler* Bind(void (ListernerType::*pFunc)(const EventType*))
	{
		return FbxListener::Bind<EventType,ListernerType>(*(GetData().mQueryEmitter), pFunc );
	}
	virtual void Destroy() = 0;

protected:
	virtual ~FbxPlugin();

private:
	bool							Initialize(const FbxPluginData& pData);
	bool							Terminate();

	bool							mInitialized;
	FbxPluginData					mData;
	FbxPluginDef					mDefinition;
	FbxModule						mModuleHandle;
	FbxObject*						mPluginSettings;

	friend class FbxLoadingStrategy;
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_PLUGIN_H_ */
