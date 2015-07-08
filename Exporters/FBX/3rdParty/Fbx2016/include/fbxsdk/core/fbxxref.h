/****************************************************************************************
 
   Copyright (C) 2015 Autodesk, Inc.
   All rights reserved.
 
   Use of this software is subject to the terms of the Autodesk license agreement
   provided at the time of installation or download, or which otherwise accompanies
   this software in either electronic or hard copy form.
 
****************************************************************************************/

//! \file fbxxref.h
#ifndef _FBXSDK_CORE_XREF_H_
#define _FBXSDK_CORE_XREF_H_

#include <fbxsdk/fbxsdk_def.h>

#include <fbxsdk/core/base/fbxarray.h>
#include <fbxsdk/core/base/fbxstring.h>

#include <fbxsdk/fbxsdk_nsbegin.h>

class FbxProperty;
class FbxDocument;
class FbxXRefManagerProject;

/** This class manages external references to files.
  * \nosubgrouping
  */
class FBXSDK_DLL FbxXRefManager
{
public:
    //! Default constructor.
    FbxXRefManager();

    //! Destructor.
    virtual ~FbxXRefManager();

    /**
      * \name Predefined Project Types
      */
    //@{

        //! This project represents an URL for storing temporary files.
        static const char* sTemporaryFileProject;

        //! This project represents an URL for configuration files.
        static const char* sConfigurationProject;

        //! This project represents an URL for storing localization files (that is not part of the asset library).
        static const char* sLocalizationProject;

        /** This project is used for creating the ".fbm" folders that are used for
          * storing embedded resources in FBX files.
          *  
          * When not set, or if the folder is not writable, the ".fbm"
          * folder is created alongside the FBX file.
          *  
          * If we cannot write in that folder, we look at the sTemporaryFileProject location.
          * If no folder is set in the sTemporaryFileProject location, or it is not
          * writable, the operating system's Temp folder becomes the location.
          */
        static const char* sEmbeddedFileProject;
    //@}

    /**
      * \name XRef URL properties
      */
    //@{
        /** Returns the number of URLs that are stored in a property.
		  * \param pProperty                The property. 
          * \return                         The URL count.
          */
        static int     GetUrlCount(FbxProperty const &pProperty);

        /** Returns the number of URLs that are stored in a string.
		  * \param pUrl                     The string.
		  * \return                         The URL count.
		  */
		 
        static int     GetUrlCount(FbxString const& pUrl);

        /** Checks whether the URL at the given index stored in the property is relative or not.
		  * \param pProperty                The property.
		  * \param pIndex                   The URL index.
          * \return                         \c True if the URL is relative, \c false if the URL is not relative.
          */
        static bool IsRelativeUrl  (FbxProperty const &pProperty,int pIndex);

        /** Returns the URL stored in the property at the given index.
		  * \param pProperty                The property.
		  * \param pIndex                   The URL index.
          * \return The URL
          */
        static FbxString GetUrl(FbxProperty const &pProperty,int pIndex);

        /** Tries to resolve the URL stored in the property at the given index.
		  * \param pProperty                The property.
		  * \param pIndex                   The URL index.
		  * \param pResolvedPath            Filled with the resolved path.
          * \return                         \c True if the URL is resolved, return \c false if the URL is not resolved.
          */
        bool GetResolvedUrl (FbxProperty const &pProperty,int pIndex,FbxString & pResolvedPath) const;
    
        /** Tries to resolve the specified URL.
		  * \param pUrl                     The specified URL.
		  * \param pDoc                     The document whose ".fbm" folder is used to resolve the URL.
		  * \param pResolvedPath            Filled with the resolved path.
          * \return                         \c True if the URL is resolved, return \c false if the URL is not resolved.
          */
        bool GetResolvedUrl (const char* pUrl, FbxDocument* pDoc, FbxString& pResolvedPath) const;
    //@}

        /** Looks for the first file that matches a specified "pattern",
          * which is built as:
          *
          * if pOptExt is given:         prefix*.ext
          * If pOptExt is NULL:          prefix*
          * if pOptExt is "" or ".":     prefix*.
          *
          * Returns the URL of the first matching files. This function cannot be
          * used to resolve folders, only files.
          *
          * If a document is given, we start by looking at the document's ".fbm" folder.
	      * \param pPrefix                  The prefix of the pattern.
	      * \param pOptExt                  The extension of the pattern.
	      * \param pDoc                     The given document.
	      * \param pResolvedPath            Filled with the first matching URL.
	      * \return                         \c True if one matching file is found, returns \c false if no matching file is found.
          */
        bool GetFirstMatchingUrl(const char* pPrefix, const char* pOptExt, const FbxDocument* pDoc, FbxString& pResolvedPath) const;

    /**
      * \name XRef Resolve URL and Projects
      */
    //@{

        /** Adds an XRef Project.
          * Note:Only one URL is associated with a project. Calling 
          * this on an existing project replaces the project's existing URL.
          * \param pName                    The name of the project
          * \param pUrl                     The URL to be associated with the project.
          * \return                         \c True if the project is added successfully, \c false if no project is added.
         */
        bool        AddXRefProject   (const char *pName,const char *pUrl);

        /** Adds an XRef Project.
          * Note:Only one URL is associated with a project. Calling 
          * this on an existing project replaces the project's existing URL.
          * \param pName                    The name of the project
		  * \param pExtension               The extension of the project.
          * \param pUrl                     The URL to be associated with the project.
          * \return                         \c True if the project is added successfully, returns \c false if no project is added.
         */
        bool        AddXRefProject   (const char *pName,const char *pExtension,const char *pUrl);

        /** Adds an XRef project based on the document's EmbeddedUrl 
          * property if set, if EmbeddedUrl is not set, based on its current URL property. 
          * \param pDoc                     The document used to name the project and to specify the URL.
          * \return                         \c True if the project is added successfully, returns \c false if no project is added.
          * \remarks                        The project name is set as the document name and the URL is set as EmbeddedUrl or URL of the document.
          */
        bool        AddXRefProject   (FbxDocument* pDoc);

		/** Removes an XRef Projects.
		  * \param pName                    The name of the project to be removed.
		  * \return                         \c True if the project is removed successfully, returns \c false if the project with the name does not exist.
		  */
        bool        RemoveXRefProject(const char *pName);

		/** Removes all XRef Projects. 
          * \return                         \c True always.
          */
        bool        RemoveAllXRefProjects();

        /** Returns the number of XRef Projects.
		  * \return                         The number of XRef Projects.
		  */
        int         GetXRefProjectCount() const;

		/** Returns the name of the XRef project at the specified index.
		  * \param pIndex                   The XRef project index.
		  * \return                         The XRef project name.
		  */
        const char *GetXRefProjectName(int pIndex) const;

        /** Returns the base URL for the given project.
          * \param pName                    The name of the given project
          * \return                         The base URL of the project or returns NULL if the project with the name is not found.
          */
        const char* GetXRefProjectUrl(const char* pName);   // FIXME: Should be const, will break AV.

        /** Returns the base URL for the given project.
          * \param pName                    The name of the given project
          * \return                         The base URL of the project or returns NULL if the project with the name is not found.
          */
        const char* GetXRefProjectUrl(const char* pName) const;

        /** Returns the base URL for the given project.
          * \param pIndex                   The index of the project.
          * \return                         The base URL of the project or NULL if the index is out of bounds.
          */
        const char* GetXRefProjectUrl(int pIndex) const;

        /** Checks if a project with the given name is defined in this manager.
		  * \param pName                    The name of the project.
		  * \return                         \c True if the project is defined in this manager, returns \c false if it isn't defined in this manager.
		  */
        inline bool HasXRefProject( const char* pName ) { return GetXRefProjectUrl(pName) != NULL; }

        /** Tries to resolve an relative URL
		  * \param pUrl                     The relative URL to be resolved.
		  * \param pResolvePath             Filled with the resolved path.
          * \return                         \c True if the URL is resolved, returns \c false if the URL is not resolved.
          */
        bool GetResolvedUrl (const char* pUrl,FbxString & pResolvePath) const;

    //@}
private:
    FbxArray<FbxXRefManagerProject*>    mProjects;

    static bool UrlExist(const char* pUrl);
};

#include <fbxsdk/fbxsdk_nsend.h>

#endif /* _FBXSDK_CORE_XREF_H_ */
