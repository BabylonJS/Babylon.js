/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxsdk.h
#ifndef _FBXSDK_H_
#define _FBXSDK_H_

/**
  * \mainpage FBX SDK Reference
  * <p>
  * \section welcome Welcome to the FBX SDK Reference
  * The FBX SDK Reference contains reference information on every header file, 
  * namespace, class, method, enum, typedef, variable, and other C++ elements 
  * that comprise the FBX software development kit (SDK).
  * <p>
  * The FBX SDK Reference is organized into the following sections:
  * <ul><li>Class List: an alphabetical list of FBX SDK classes
  *     <li>Class Hierarchy: a textual representation of the FBX SDK class structure
  *     <li>Graphical Class Hierarchy: a graphical representation of the FBX SDK class structure
  *     <li>File List: an alphabetical list of all documented header files</ul>
  * <p>
  * \section otherdocumentation Other Documentation
  * Apart from this reference guide, an FBX SDK Programming Guide and many FBX 
  * SDK examples are also provided.
  * <p>
  * \section aboutFBXSDK About the FBX SDK
  * The FBX SDK is a C++ software development kit (SDK) that lets you import 
  * and export 3D scenes using the Autodesk FBX file format. The FBX SDK 
  * reads FBX files created with FiLMBOX version 2.5 and later and writes FBX 
  * files compatible with MotionBuilder version 6.0 and up. 
  */

#pragma pack(push, 8)	//FBXSDK is compiled with default value (8)

#include <fbxsdk/fbxsdk_def.h>

#ifndef FBXSDK_NAMESPACE_USING
	#define FBXSDK_NAMESPACE_USING 1
#endif

//---------------------------------------------------------------------------------------
//Core Base Includes
#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxbitset.h>
#include <fbxsdk/core/base/fbxcharptrset.h>
#include <fbxsdk/core/base/fbxcontainerallocators.h>
#include <fbxsdk/core/base/fbxdynamicarray.h>
#include <fbxsdk/core/base/fbxstatus.h>
#include <fbxsdk/core/base/fbxfile.h>
#ifndef FBXSDK_ENV_WINSTORE
	#include <fbxsdk/core/base/fbxfolder.h>
#endif
#include <fbxsdk/core/base/fbxhashmap.h>
#include <fbxsdk/core/base/fbxintrusivelist.h>
#include <fbxsdk/core/base/fbxmap.h>
#include <fbxsdk/core/base/fbxmemorypool.h>
#include <fbxsdk/core/base/fbxpair.h>
#include <fbxsdk/core/base/fbxset.h>
#include <fbxsdk/core/base/fbxstring.h>
#include <fbxsdk/core/base/fbxstringlist.h>
#include <fbxsdk/core/base/fbxtime.h>
#include <fbxsdk/core/base/fbxtimecode.h>
#include <fbxsdk/core/base/fbxutils.h>

//---------------------------------------------------------------------------------------
//Core Math Includes
#include <fbxsdk/core/math/fbxmath.h>
#include <fbxsdk/core/math/fbxdualquaternion.h>
#include <fbxsdk/core/math/fbxmatrix.h>
#include <fbxsdk/core/math/fbxquaternion.h>
#include <fbxsdk/core/math/fbxvector2.h>
#include <fbxsdk/core/math/fbxvector4.h>

//---------------------------------------------------------------------------------------
//Core Sync Includes
#ifndef FBXSDK_ENV_WINSTORE
	#include <fbxsdk/core/sync/fbxatomic.h>
	#include <fbxsdk/core/sync/fbxclock.h>
	#include <fbxsdk/core/sync/fbxsync.h>
	#include <fbxsdk/core/sync/fbxthread.h>
#endif /* !FBXSDK_ENV_WINSTORE */

//---------------------------------------------------------------------------------------
//Core Includes
#include <fbxsdk/core/fbxclassid.h>
#include <fbxsdk/core/fbxconnectionpoint.h>
#include <fbxsdk/core/fbxdatatypes.h>
#ifndef FBXSDK_ENV_WINSTORE
	#include <fbxsdk/core/fbxmodule.h>
	#include <fbxsdk/core/fbxloadingstrategy.h>
#endif /* !FBXSDK_ENV_WINSTORE */
#include <fbxsdk/core/fbxmanager.h>
#include <fbxsdk/core/fbxobject.h>
#include <fbxsdk/core/fbxperipheral.h>
#ifndef FBXSDK_ENV_WINSTORE
	#include <fbxsdk/core/fbxplugin.h>
	#include <fbxsdk/core/fbxplugincontainer.h>
#endif /* !FBXSDK_ENV_WINSTORE */
#include <fbxsdk/core/fbxproperty.h>
#include <fbxsdk/core/fbxpropertydef.h>
#include <fbxsdk/core/fbxpropertyhandle.h>
#include <fbxsdk/core/fbxpropertypage.h>
#include <fbxsdk/core/fbxpropertytypes.h>
#include <fbxsdk/core/fbxquery.h>
#include <fbxsdk/core/fbxqueryevent.h>
#ifndef FBXSDK_ENV_WINSTORE
	#include <fbxsdk/core/fbxscopedloadingdirectory.h>
	#include <fbxsdk/core/fbxscopedloadingfilename.h>
#endif /* !FBXSDK_ENV_WINSTORE */
#include <fbxsdk/core/fbxxref.h>

//---------------------------------------------------------------------------------------
//File I/O Includes
#include <fbxsdk/fileio/fbxexporter.h>
#include <fbxsdk/fileio/fbxexternaldocreflistener.h>
#include <fbxsdk/fileio/fbxfiletokens.h>
#include <fbxsdk/fileio/fbxglobalcamerasettings.h>
#include <fbxsdk/fileio/fbxgloballightsettings.h>
#include <fbxsdk/fileio/fbxgobo.h>
#include <fbxsdk/fileio/fbximporter.h>
#include <fbxsdk/fileio/fbxiobase.h>
#include <fbxsdk/fileio/fbxiopluginregistry.h>
#include <fbxsdk/fileio/fbxiosettings.h>
#include <fbxsdk/fileio/fbxstatisticsfbx.h>
#include <fbxsdk/fileio/fbxstatistics.h>

//---------------------------------------------------------------------------------------
//Scene Includes
#include <fbxsdk/scene/fbxcollection.h>
#include <fbxsdk/scene/fbxcollectionexclusive.h>
#include <fbxsdk/scene/fbxcontainer.h>
#include <fbxsdk/scene/fbxcontainertemplate.h>
#include <fbxsdk/scene/fbxdisplaylayer.h>
#include <fbxsdk/scene/fbxdocument.h>
#include <fbxsdk/scene/fbxdocumentinfo.h>
#include <fbxsdk/scene/fbxenvironment.h>
#include <fbxsdk/scene/fbxgroupname.h>
#include <fbxsdk/scene/fbxlibrary.h>
#include <fbxsdk/scene/fbxobjectmetadata.h>
#include <fbxsdk/scene/fbxpose.h>
#include <fbxsdk/scene/fbxreference.h>
#include <fbxsdk/scene/fbxscene.h>
#include <fbxsdk/scene/fbxselectionset.h>
#include <fbxsdk/scene/fbxselectionnode.h>
#include <fbxsdk/scene/fbxtakeinfo.h>
#include <fbxsdk/scene/fbxthumbnail.h>
#include <fbxsdk/scene/fbxvideo.h>

//---------------------------------------------------------------------------------------
//Scene Animation Includes
#include <fbxsdk/scene/animation/fbxanimcurve.h>
#include <fbxsdk/scene/animation/fbxanimcurvebase.h>
#include <fbxsdk/scene/animation/fbxanimcurvefilters.h>
#include <fbxsdk/scene/animation/fbxanimcurvenode.h>
#include <fbxsdk/scene/animation/fbxanimevalclassic.h>
#include <fbxsdk/scene/animation/fbxanimevalstate.h>
#include <fbxsdk/scene/animation/fbxanimevaluator.h>
#include <fbxsdk/scene/animation/fbxanimlayer.h>
#include <fbxsdk/scene/animation/fbxanimstack.h>
#include <fbxsdk/scene/animation/fbxanimutilities.h>

//---------------------------------------------------------------------------------------
//Scene Constraint Includes
#include <fbxsdk/scene/constraint/fbxcharacternodename.h>
#include <fbxsdk/scene/constraint/fbxcharacter.h>
#include <fbxsdk/scene/constraint/fbxcharacterpose.h>
#include <fbxsdk/scene/constraint/fbxconstraint.h>
#include <fbxsdk/scene/constraint/fbxconstraintaim.h>
#include <fbxsdk/scene/constraint/fbxconstraintcustom.h>
#include <fbxsdk/scene/constraint/fbxconstraintparent.h>
#include <fbxsdk/scene/constraint/fbxconstraintposition.h>
#include <fbxsdk/scene/constraint/fbxconstraintrotation.h>
#include <fbxsdk/scene/constraint/fbxconstraintscale.h>
#include <fbxsdk/scene/constraint/fbxconstraintsinglechainik.h>
#include <fbxsdk/scene/constraint/fbxconstraintutils.h>
#include <fbxsdk/scene/constraint/fbxcontrolset.h>
#include <fbxsdk/scene/constraint/fbxhik2fbxcharacter.h>

//---------------------------------------------------------------------------------------
//Scene Geometry Includes
#include <fbxsdk/scene/geometry/fbxblendshape.h>
#include <fbxsdk/scene/geometry/fbxblendshapechannel.h>
#include <fbxsdk/scene/geometry/fbxcache.h>
#include <fbxsdk/scene/geometry/fbxcachedeffect.h>
#include <fbxsdk/scene/geometry/fbxcamera.h>
#include <fbxsdk/scene/geometry/fbxcamerastereo.h>
#include <fbxsdk/scene/geometry/fbxcameraswitcher.h>
#include <fbxsdk/scene/geometry/fbxcluster.h>
#include <fbxsdk/scene/geometry/fbxdeformer.h>
#include <fbxsdk/scene/geometry/fbxgenericnode.h>
#include <fbxsdk/scene/geometry/fbxgeometry.h>
#include <fbxsdk/scene/geometry/fbxgeometrybase.h>
#include <fbxsdk/scene/geometry/fbxgeometryweightedmap.h>
#include <fbxsdk/scene/geometry/fbxlight.h>
#include <fbxsdk/scene/geometry/fbxlimitsutilities.h>
#include <fbxsdk/scene/geometry/fbxline.h>
#include <fbxsdk/scene/geometry/fbxlodgroup.h>
#include <fbxsdk/scene/geometry/fbxmarker.h>
#include <fbxsdk/scene/geometry/fbxmesh.h>
#include <fbxsdk/scene/geometry/fbxnode.h>
#include <fbxsdk/scene/geometry/fbxnodeattribute.h>
#include <fbxsdk/scene/geometry/fbxnull.h>
#include <fbxsdk/scene/geometry/fbxnurbs.h>
#include <fbxsdk/scene/geometry/fbxnurbscurve.h>
#include <fbxsdk/scene/geometry/fbxnurbssurface.h>
#include <fbxsdk/scene/geometry/fbxopticalreference.h>
#include <fbxsdk/scene/geometry/fbxpatch.h>
#include <fbxsdk/scene/geometry/fbxproceduralgeometry.h>
#include <fbxsdk/scene/geometry/fbxshape.h>
#include <fbxsdk/scene/geometry/fbxskeleton.h>
#include <fbxsdk/scene/geometry/fbxskin.h>
#include <fbxsdk/scene/geometry/fbxsubdeformer.h>
#include <fbxsdk/scene/geometry/fbxsubdiv.h>
#include <fbxsdk/scene/geometry/fbxtrimnurbssurface.h>
#include <fbxsdk/scene/geometry/fbxvertexcachedeformer.h>
#include <fbxsdk/scene/geometry/fbxweightedmapping.h>

//---------------------------------------------------------------------------------------
//Scene Shading Includes
#include <fbxsdk/scene/shading/fbxshadingconventions.h>
#include <fbxsdk/scene/shading/fbxbindingsentryview.h>
#include <fbxsdk/scene/shading/fbxbindingtable.h>
#include <fbxsdk/scene/shading/fbxbindingtableentry.h>
#include <fbxsdk/scene/shading/fbxbindingoperator.h>
#include <fbxsdk/scene/shading/fbxconstantentryview.h>
#include <fbxsdk/scene/shading/fbxentryview.h>
#include <fbxsdk/scene/shading/fbxfiletexture.h>
#include <fbxsdk/scene/shading/fbximplementation.h>
#include <fbxsdk/scene/shading/fbximplementationfilter.h>
#include <fbxsdk/scene/shading/fbximplementationutils.h>
#include <fbxsdk/scene/shading/fbxlayeredtexture.h>
#include <fbxsdk/scene/shading/fbxoperatorentryview.h>
#include <fbxsdk/scene/shading/fbxproceduraltexture.h>
#include <fbxsdk/scene/shading/fbxpropertyentryview.h>
#include <fbxsdk/scene/shading/fbxsemanticentryview.h>
#include <fbxsdk/scene/shading/fbxsurfacelambert.h>
#include <fbxsdk/scene/shading/fbxsurfacematerial.h>
#include <fbxsdk/scene/shading/fbxsurfacephong.h>
#include <fbxsdk/scene/shading/fbxtexture.h>

//---------------------------------------------------------------------------------------
//Utilities Includes
#include <fbxsdk/utils/fbxdeformationsevaluator.h>
#include <fbxsdk/utils/fbxprocessor.h>
#include <fbxsdk/utils/fbxprocessorxref.h>
#include <fbxsdk/utils/fbxprocessorxrefuserlib.h>
#include <fbxsdk/utils/fbxprocessorshaderdependency.h>
#include <fbxsdk/utils/fbxclonemanager.h>
#include <fbxsdk/utils/fbxgeometryconverter.h>
#include <fbxsdk/utils/fbxmanipulators.h>
#include <fbxsdk/utils/fbxmaterialconverter.h>
#include <fbxsdk/utils/fbxrenamingstrategyfbx5.h>
#include <fbxsdk/utils/fbxrenamingstrategyfbx6.h>
#include <fbxsdk/utils/fbxrenamingstrategyutilities.h>
#include <fbxsdk/utils/fbxrootnodeutility.h>
#include <fbxsdk/utils/fbxusernotification.h>

//---------------------------------------------------------------------------------------
#if defined(FBXSDK_NAMESPACE) && (FBXSDK_NAMESPACE_USING == 1)
	using namespace FBXSDK_NAMESPACE;
#endif

#pragma pack(pop)

#endif /* _FBXSDK_H_ */
