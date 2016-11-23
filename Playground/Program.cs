using System.IO;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.FileProviders;
using Microsoft.Extensions.Logging;

namespace TestTestTest
{
    public class Startup
    {
        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit http://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IHostingEnvironment env, ILoggerFactory loggerFactory)
        {
            loggerFactory.AddConsole();

            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
            }

            var path = Path.Combine(env.ContentRootPath); 
            var provider = new PhysicalFileProvider(path);
            provider.Watch("*.*");

            // Set up custom content types -associating file extension to MIME type
            var contentTypeProvider = new FileExtensionContentTypeProvider();
            // Add new mappings
            contentTypeProvider.Mappings[".hdr"] = "application/octet-stream";
            contentTypeProvider.Mappings[".babylon"] = "application/json";
            contentTypeProvider.Mappings[".fx"] = "text/plain";
            contentTypeProvider.Mappings[".map"] = "text/plain";

            var options = new StaticFileOptions()
            {
                RequestPath = "",
                FileProvider = provider,
                ContentTypeProvider = contentTypeProvider
            };
            app.UseStaticFiles(options);
        }
    }

    public class Program
    {
        public static void Main(string[] args)
        {
            // PG
            var currentDirectory = Directory.GetCurrentDirectory();
            // BJS
            var babylonjsDirectory = new DirectoryInfo(currentDirectory).Parent.FullName;

            var host = new WebHostBuilder()
                .UseKestrel()
                .UseContentRoot(babylonjsDirectory)
                .UseIISIntegration()
                .UseStartup<Startup>()
                .Build();

            host.Run();
        }
    }
}
