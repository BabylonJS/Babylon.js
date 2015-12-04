using System;
using System.IO;
using System.Diagnostics;
using System.Collections.Generic;
using Microsoft.Build.Construction;
using Microsoft.Build.Evaluation;
using Microsoft.Build.Execution;
using Microsoft.Build.Framework;
using System.Windows.Forms;

namespace BabylonExport.Core.Exporters.XNA
{
    class ContentBuilder : IDisposable
    {
        const string xnaVersion = ", Version=4.0.0.0, PublicKeyToken=842cf8be1de50553";

        static readonly string[] pipelineAssemblies =
        {
            "Microsoft.Xna.Framework.Content.Pipeline.XImporter" + xnaVersion,
            "Microsoft.Xna.Framework.Content.Pipeline.TextureImporter" + xnaVersion,
            "Microsoft.Xna.Framework.Content.Pipeline.EffectImporter" + xnaVersion,
            "SkinnedModelPipeline"
        };

        Project buildProject;
        ProjectRootElement projectRootElement;
        BuildParameters buildParameters;
        readonly List<ProjectItem> projectItems = new List<ProjectItem>();
        ErrorLogger errorLogger;

        string buildDirectory;
        string processDirectory;
        string baseDirectory;

        static int directorySalt;

        public string OutputDirectory
        {
            get { return Path.Combine(buildDirectory, "bin"); }
        }

        public ContentBuilder(IEnumerable<string> extraPipelineAssemblies = null)
        {
            CreateTempDirectory();
            CreateBuildProject(extraPipelineAssemblies);
        }

        public void Dispose()
        {
            DeleteTempDirectory();
        }

        void CreateBuildProject(IEnumerable<string> extraPipelineAssemblies = null)
        {
            string projectPath = Path.Combine(buildDirectory, "content.contentproj");
            string outputPath = Path.Combine(buildDirectory, "bin");

            // Create the build project.
            projectRootElement = ProjectRootElement.Create(projectPath);

            // Include the standard targets file that defines how to build XNA Framework content.
            projectRootElement.AddImport(Application.StartupPath + "\\Exporters\\ThroughXNA\\XNA\\XNA Game Studio\\" +
                                         "v4.0\\Microsoft.Xna.GameStudio.ContentPipeline.targets");

            buildProject = new Project(projectRootElement);

            buildProject.SetProperty("XnaPlatform", "Windows");
            buildProject.SetProperty("XnaProfile", "Reach");
            buildProject.SetProperty("XnaFrameworkVersion", "v4.0");
            buildProject.SetProperty("Configuration", "Release");
            buildProject.SetProperty("OutputPath", outputPath);
            buildProject.SetProperty("ContentRootDirectory", ".");
            buildProject.SetProperty("ReferencePath", Application.StartupPath);

            // Register any custom importers or processors.
            foreach (string pipelineAssembly in pipelineAssemblies)
            {
                buildProject.AddItem("Reference", pipelineAssembly);
            }
            if (extraPipelineAssemblies != null)
            {
                foreach (string pipelineAssembly in extraPipelineAssemblies)
                {
                    buildProject.AddItem("Reference", pipelineAssembly);
                }
            }

            // Hook up our custom error logger.
            errorLogger = new ErrorLogger();

            buildParameters = new BuildParameters(ProjectCollection.GlobalProjectCollection)
                                  {Loggers = new ILogger[] {errorLogger}};
        }

        public void Add(string filename, string name, string importer, string processor)
        {
            ProjectItem item = buildProject.AddItem("Compile", filename)[0];

            item.SetMetadataValue("Link", Path.GetFileName(filename));
            item.SetMetadataValue("Name", name);

            if (!string.IsNullOrEmpty(importer))
                item.SetMetadataValue("Importer", importer);

            if (!string.IsNullOrEmpty(processor))
                item.SetMetadataValue("Processor", processor);

            projectItems.Add(item);
        }

        public void Clear()
        {
            buildProject.RemoveItems(projectItems);

            projectItems.Clear();
        }

        public string Build()
        {
            // Clear any previous errors.
            errorLogger.Errors.Clear();

            // Create and submit a new asynchronous build request.
            BuildManager.DefaultBuildManager.BeginBuild(buildParameters);
            
            var request = new BuildRequestData(buildProject.CreateProjectInstance(), new string[0]);
            BuildSubmission submission = BuildManager.DefaultBuildManager.PendBuildRequest(request);

            submission.ExecuteAsync(null, null);

            // Wait for the build to finish.
            submission.WaitHandle.WaitOne();

            BuildManager.DefaultBuildManager.EndBuild();

            // If the build failed, return an error string.
            if (submission.BuildResult.OverallResult == BuildResultCode.Failure)
            {
                return string.Join("\n", errorLogger.Errors.ToArray());
            }

            return null;
        }

        void CreateTempDirectory()
        {
            baseDirectory = Path.Combine(Path.GetTempPath(), GetType().FullName);
            int processId = Process.GetCurrentProcess().Id;

            processDirectory = Path.Combine(baseDirectory, processId.ToString());
            directorySalt++;

            buildDirectory = Path.Combine(processDirectory, directorySalt.ToString());

            Directory.CreateDirectory(buildDirectory);

            PurgeStaleTempDirectories();
        }

        void DeleteTempDirectory()
        {
            Directory.Delete(buildDirectory, true);

            if (Directory.GetDirectories(processDirectory).Length == 0)
            {
                Directory.Delete(processDirectory);

                if (Directory.GetDirectories(baseDirectory).Length == 0)
                {
                    Directory.Delete(baseDirectory);
                }
            }
        }


        void PurgeStaleTempDirectories()
        {
            // Check all subdirectories of our base location.
            foreach (string directory in Directory.GetDirectories(baseDirectory))
            {
                // The subdirectory name is the ID of the process which created it.
                int processId;

                if (int.TryParse(Path.GetFileName(directory), out processId))
                {
                    try
                    {
                        // Is the creator process still running?
                        Process.GetProcessById(processId);
                    }
                    catch (ArgumentException)
                    {
                        // If the process is gone, we can delete its temp directory.
                        Directory.Delete(directory, true);
                    }
                }
            }
        }
    }
}
