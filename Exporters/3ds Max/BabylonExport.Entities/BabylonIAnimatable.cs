namespace BabylonExport.Entities
{
    public interface BabylonIAnimatable
    {
        BabylonAnimation[] animations { get; set; }
        bool autoAnimate { get; set; }

        int autoAnimateFrom { get; set; }

        int autoAnimateTo { get; set; }

        bool autoAnimateLoop { get; set; }
    }
}
