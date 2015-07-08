/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxloadingstrategy.h
#ifndef _FBXSDK_CORE_LOADING_STRATEGY_H_
#define _FBXSDK_CORE_LOADING_STRATEGY_H_

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_ENV_WINSTORE

#include <fbxsdk/core/fbxplugin.h>
#include <fbxsdk/core/fbxplugincontainer.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** 
 * Abstract class used to implemented some plug-in loading strategy.
 * A loading strategy dictate how some plug-ins will be loaded for instance.
 * We could have a simple strategy that loads only a single dll on PC. 
 * We could also implement a strategy that load multiple dlls from a directory.
 */
class FBXSDK_DLL FbxLoadingStrategy : public FbxPluginContainer
{
public:
    /** Result state of loading plug-in.
     */
    enum EState
	{
        eAllLoaded,     //!< All plug-in are loaded.
        eNoneLoaded,    //!< No plug-in is loaded, i.e., there is not plug-in to load. 
        eAllFailed,     //!< All plug-in are failed to load.
        eSomeFailed     //!< Some plug-ins are loaded but some are failed.
    };

    /**
    *\name Public interface
    */
    //@{
		/** Execute the operation of loading the plug-in(s). The way it is executed is determined by the specific implementations.
		* \param pData  Plug in data that can be access inside the plug-ins.
		* \return If the plugin loading is successful return \c true, otherwise return \c false.
		*/
		EState Load(FbxPluginData& pData);

		/** Execute the operation of unloading the plug-in(s). The way it is executed is determined by the specific implementations.
		*/
		void Unload();
    //@}

protected:
    /**
    *\name User implementation
    */
    //@{
		/** Called by the Load method, it contains the specific user implementation strategy to load the desired plug-in(s).
		* \param pData  Plug in data that can be access inside the plug-ins.
		* \return If the plugin loading is successful return \c true, otherwise return \c false
		*/
		virtual bool SpecificLoad(FbxPluginData& pData) = 0;

		/** Called by the Unload method, it contains the specific user implementation strategy to unload the desired plug-in(s).
		*/
		virtual void SpecificUnload(FbxPluginData& pData) = 0;
    //@}

    //! Whether the plugin is loaded or not.
    EState mPluginsLoadedState;

private:
    FbxPluginData mData;
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* !FBXSDK_ENV_WINSTORE */

#endif /* _FBXSDK_CORE_LOADING_STRATEGY_H_ */
