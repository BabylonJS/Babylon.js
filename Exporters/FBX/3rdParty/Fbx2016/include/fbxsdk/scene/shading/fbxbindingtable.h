/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxbindingtable.h
#ifndef _FBXSDK_SCENE_SHADING_BINDING_TABLE_H_
#define _FBXSDK_SCENE_SHADING_BINDING_TABLE_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/scene/shading/fbxbindingtablebase.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

/** A binding table represents a collection of bindings
  * from source types such as FbxObject, or FbxLayerElements
  * to corresponding destinations, usually a third party shader parameters.
  * Binding represents a link between internal object(e.g. FbxObject) and 
  * external object(e.g. HLSL shader parameters).
  * \nosubgrouping
  * \see FbxBindingOperator, FbxBindingTableBase
  */
class FBXSDK_DLL FbxBindingTable : public FbxBindingTableBase
{
    FBXSDK_OBJECT_DECLARE(FbxBindingTable, FbxBindingTableBase);

public:
    /** This property stores the name of target.
      *
      * Default value is "".
      */
    FbxPropertyT<FbxString>            TargetName;

    /** This property stores the type of target.
      *
      * Default value is "".
      */
    FbxPropertyT<FbxString>            TargetType;

    /** Relative URL of file containing the shader implementation description. 
      * e.g.: ./shader.mi
      * Default value is "".
      */
    FbxPropertyT<FbxString>            DescRelativeURL;

    /** Absolute URL of file containing the shader implementation description.
      * e.g.: file:///usr/tmp/shader.mi
      * Default value is "".
      */
    FbxPropertyT<FbxString>            DescAbsoluteURL;

    /** Identify the shader to use in previous description's URL.
      * e.g.: MyOwnShader
      * Default value is "".
      */
    FbxPropertyT<FbxString>            DescTAG;        

    /** Relative URL of file containing the shader implementation code.
      * e.g.: ./bin/shader.dll
      * Default value is "".
      */
    FbxPropertyT<FbxString>            CodeRelativeURL;

    /** Absolute URL of file containing the shader implementation code.
      * e.g.: file:///usr/tmp/bin/shader.dll
      * Default value is "".
      */
    FbxPropertyT<FbxString>            CodeAbsoluteURL;

    /** Identify the shader function entry to use in previous code's URL.
      * e.g.: MyOwnShaderFunc
      * Default value is "".
      */
    FbxPropertyT<FbxString>            CodeTAG;

    //////////////////////////////////////////////////////////////////////////
    // Static values
    //////////////////////////////////////////////////////////////////////////

    //! Target name.
    static const char* sTargetName;

    //! Target type.
    static const char* sTargetType;

    //! Relative URL for shader description. 
    static const char* sDescRelativeURL;

    //! Absolute URL for shader description.
    static const char* sDescAbsoluteURL;

    //! Identify the shader to use in previous description's URL.
    static const char* sDescTAG;

    //! Relative URL for shader code. 
    static const char* sCodeRelativeURL;

    //! Absolute URL for shader code.
    static const char* sCodeAbsoluteURL;

    //! Identify the shader function entry to use in previous code's URL.
    static const char* sCodeTAG;


    //! Default value for  target name.
    static const char* sDefaultTargetName;

    //! Default value for  target type.
    static const char* sDefaultTargetType;

    //! Default value for relative URL for shader description. 
    static const char* sDefaultDescRelativeURL;

    //! Default value for absolute URL for shader description. 
    static const char* sDefaultDescAbsoluteURL;

    //! Default value for identifying the shader to use in previous description's URL.
    static const char* sDefaultDescTAG;

    //! Default value for relative URL for shader code.
    static const char* sDefaultCodeRelativeURL;

    //! Default value for absolute URL for shader code. 
    static const char* sDefaultCodeAbsoluteURL;

    //! Default value for identifying the shader function entry to use in previous code's URL.
    static const char* sDefaultCodeTAG;

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
private:
    virtual void ConstructProperties(bool pForceSet);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_BINDING_TABLE_H_ */
