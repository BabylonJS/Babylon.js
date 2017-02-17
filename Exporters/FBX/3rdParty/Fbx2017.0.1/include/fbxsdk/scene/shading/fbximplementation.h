/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbximplementation.h
#ifndef _FBXSDK_SCENE_SHADING_IMPLEMENTATION_H_
#define _FBXSDK_SCENE_SHADING_IMPLEMENTATION_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/fbxobject.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxBindingOperator;
class FbxBindingTable;

/** This object represents the shading node implementation.
  * It defines basic information about the shader and the binding table(FbxBindingTable).
  * For example, you can create a new FbxImplementation like this:
  * \code
  * FbxImplementation* lImpl = FbxImplementation::Create( &pMyScene, "MyImplementation" );
  * pMyObject.AddImplementation( lImpl );
  * pMyObject.SetDefaultImplementation( lImpl );
  * lImpl->RenderAPI = FBXSDK_RENDERING_API_DIRECTX; //FBXSDK_RENDERING_API_DIRECTX, FBXSDK_RENDERING_API_OPENGL, FBXSDK_RENDERING_API_MENTALRAY or FBXSDK_RENDERING_API_PREVIEW
  * lImpl->RenderAPIVersion = "9.0"; //API Version
  *
  * lImpl->Language = FBXSDK_SHADING_LANGUAGE_HLSL; //FBXSDK_SHADING_LANGUAGE_HLSL, FBXSDK_SHADING_LANGUAGE_GLSL, FBXSDK_SHADING_LANGUAGE_CGFX or FBXSDK_SHADING_LANGUAGE_MRSL
  * lImpl->LanguageVersion = "1.0";  //Language Version
  * \endcode
  *
  * After the new FbxImplementation is created, you can access FbxBindingTable like this:
  * \code
  * FbxBindingTable* lTable = lImpl->GetTableByTargetName("root");
  * \endcode
  * Also, you can access the exist FbxImplementation in FbxObject by this:
  * \code
  * const FbxImplementation* lImpl = GetImplementation( pMyObject, FBXSDK_IMPLEMENTATION_CGFX ); // FBXSDK_IMPLEMENTATION_PREVIEW, FBXSDK_IMPLEMENTATION_MENTALRAY, FBXSDK_IMPLEMENTATION_CGFX, FBXSDK_IMPLEMENTATION_HLSL, FBXSDK_IMPLEMENTATION_OGS or FBXSDK_IMPLEMENTATION_NONE
  * \endcode
  * \nosubgrouping
  * \see FbxImplementationFilter
  */
class FBXSDK_DLL FbxImplementation : public FbxObject
{
	FBXSDK_OBJECT_DECLARE(FbxImplementation, FbxObject);

public:
    /**
      * \name Target Name.
      */
    //@{
	FbxString									RenderName;
    //@}

    /**
      * \name Shader Language and API descriptions.
      */
    //@{

	/** Shader Language.
      * \see FBXSDK_SHADING_LANGUAGE_HLSL, FBXSDK_SHADING_LANGUAGE_GLSL, FBXSDK_SHADING_LANGUAGE_CGFX and FBXSDK_SHADING_LANGUAGE_MRSL in conventions.h
      */
	FbxPropertyT<FbxString>			Language;

	//! Shader Language version.
	FbxPropertyT<FbxString>			LanguageVersion;

	/** Render API.
      * \see FBXSDK_SHADING_LANGUAGE_HLSL, FBXSDK_SHADING_LANGUAGE_GLSL, FBXSDK_SHADING_LANGUAGE_CGFX and FBXSDK_SHADING_LANGUAGE_MRSL in conventions.h
      */
	FbxPropertyT<FbxString>			RenderAPI;

	//! Render API version.
	FbxPropertyT<FbxString>			RenderAPIVersion;
    //@}


    /**
      * \name Binding description
      */
    //@{

	//! Name of root binding table.
	FbxPropertyT<FbxString>			RootBindingName;

	//! Property to store the shader parameters(constants) values in this implementation.
	FbxProperty GetConstants() const;

	/** Add a new binding table to the table list.
	  * \param pTargetName The target name for the binding table.
	  * \param pTargetType The target type for the binding table.
	  * \return the new binding table.
	  */ 
	FbxBindingTable* AddNewTable( const char* pTargetName, const char* pTargetType );

    /** Retrieves a handle on the root binding table.
    * \return A const pointer to the root table or NULL if it does not exist.
    */ 
    const FbxBindingTable* GetRootTable() const;
    
	/** Retrieves a handle on the root binding table.
	* \return A pointer to the root table or NULL if it does not exist.
	*/
	FbxBindingTable* GetRootTable();
    
    /** Gets the number of binding tables.
	  * \return the number of binding tables.
	  */ 
	int GetTableCount() const;

	/** Retrieves a handle on the (pIndex)th binding table.
	  * \param pIndex The index of the table to retrieve. Valid values are [ 0, GetTableCount() ).
	  * \return A const pointer to the pIndex-th table or NULL if pIndex is out of range.
	  */ 
	const FbxBindingTable* GetTable( int pIndex ) const;
    /** Retrieves a handle on the (pIndex)th binding table.
	  * \param pIndex The index of the table to retrieve. Valid values are [ 0, GetTableCount() ).
	  * \return A const pointer to the pIndex-th table or NULL if pIndex is out of range.
	  */ 
	FbxBindingTable* GetTable( int pIndex );

	/** Returns the binding table that has the given target name.
	* \param pName The target name of the table to look for.
	* \return A const pointer to the binding table with the given target name, or NULL if there is no such binding table.
	*/ 
	const FbxBindingTable* GetTableByTargetName( const char* pName ) const;
	
	/** Returns the binding table that has the given target name.
	* \param pName The target name of the table to look for.
	* \return A pointer to the binding table with the given target name, or NULL if there is no such binding table.
	*/ 
	FbxBindingTable* GetTableByTargetName( const char* pName );

  	/** Returns the binding table that has the given target type.
	* \param pTargetName The target type to look for.
	* \return A const pointer to the binding table with the given target type, or NULL if there is no such binding table.
	*/
	const FbxBindingTable* GetTableByTargetType( const char* pTargetName ) const;
	
	/** Returns the binding table that has the given target type.
	* \param pTargetName The target type to look for.
	* \return A pointer to the binding table with the given target type, or NULL if there is no such binding table.
	*/
	FbxBindingTable* GetTableByTargetType( const char* pTargetName );

	
	/** Add a new binding operator to the operator list.
	* \param pTargetName The target name for the binding operator.
	* \param pFunctionName The function name for the binding operator.
	* \return The new operator.
	*/ 
	FbxBindingOperator* AddNewBindingOperator( const char* pTargetName, const char* pFunctionName );

	/** Gets the number of binding operators.
	  * \return the number of binding operators.
	  */ 
	int GetBindingOperatorCount() const;

	/** Returns the binding operator that has the given name.
	* \param pTargetName The target name of the binding operator to look for.
	* \return A const pointer to the binding operator with the given name, or NULL if there is no such binding table.
	*/
	const FbxBindingOperator* GetOperatorByTargetName( const char* pTargetName ) const;
    //@}


    /**
      * \name Static values
      */
    //@{

	// property names

	/** Shader Language name.
      * \see Language
      */
	static const char* sLanguage;

	/** Shader Language version.
      * \see LanguageVersion
      */
	static const char* sLanguageVersion;

	/** Shader render API.
      * \see RenderAPI
      */
	static const char* sRenderAPI;

	/** Shader render API version.
      * \see RenderAPIVersion
      */
	static const char* sRenderAPIVersion;

	/** Name of root binding table.
      * \see RootBindingName
      */
	static const char* sRootBindingName;

	/** Name of property to store the shader parameters(constants) values in this implementation.
      * \see GetConstants
      */
	static const char* sConstants;

    //! default value for implementation type.
	static const char* sDefaultType;

    //! default value for shader language.
	static const char* sDefaultLanguage;

    //! default value for shader language version.
	static const char* sDefaultLanguageVersion;

    //! default value for shader render API.
	static const char* sDefaultRenderAPI;

    //! default value for shader render API version.
	static const char* sDefaultRenderAPIVersion;

    //! default value for root binding table name.
	static const char* sDefaultRootBindingName;
    //@}

/*****************************************************************************************************************************
** WARNING! Anything beyond these lines is for internal use, may not be documented and is subject to change without notice! **
*****************************************************************************************************************************/
#ifndef DOXYGEN_SHOULD_SKIP_THIS
protected:
	virtual void ConstructProperties(bool pForceSet);
#endif /* !DOXYGEN_SHOULD_SKIP_THIS *****************************************************************************************/
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_SCENE_SHADING_IMPLEMENTATION_H_ */
