using System.Collections.Generic;
using Microsoft.Build.Framework;

namespace BabylonExport.Core.Exporters.XNA
{
    class ErrorLogger : ILogger
    {
        public void Initialize(IEventSource eventSource)
        {
            if (eventSource != null)
            {
                eventSource.ErrorRaised += ErrorRaised;
            }
        }

        public void Shutdown()
        {
        }

        void ErrorRaised(object sender, BuildErrorEventArgs e)
        {
            errors.Add(e.Message);
        }

        public List<string> Errors
        {
            get { return errors; }
        }

        List<string> errors = new List<string>();


        string ILogger.Parameters
        {
            get { return parameters; }
            set { parameters = value; }
        }

        string parameters;

        LoggerVerbosity ILogger.Verbosity
        {
            get { return verbosity; }
            set { verbosity = value; }
        }

        LoggerVerbosity verbosity = LoggerVerbosity.Detailed;
    }
}
