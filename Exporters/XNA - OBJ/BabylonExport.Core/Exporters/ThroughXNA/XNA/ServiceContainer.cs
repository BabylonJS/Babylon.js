using System;
using System.Collections.Generic;

namespace BabylonExport.Core.Exporters.XNA
{
    public class ServiceContainer : IServiceProvider
    {
        Dictionary<Type, object> services = new Dictionary<Type, object>();

        /// <summary>
        /// Adds a new service to the collection.
        /// </summary>
        public void AddService<T>(T service)
        {
            services.Add(typeof(T), service);
        }

        /// <summary>
        /// Looks up the specified service.
        /// </summary>
        public object GetService(Type serviceType)
        {
            object service;

            services.TryGetValue(serviceType, out service);

            return service;
        }
    }
}
