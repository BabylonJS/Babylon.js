# Audio import fixtures

These clips are synthesized 440 Hz sine tones, with no third-party recordings.
They were encoded with ffmpeg (libmp3lame, AAC, and libopus). `tap` is 0.1
seconds; `too-long.mp3` is 31 seconds to exercise the chooser's duration limit.
Tests preserve the encoded bytes and use the real browser decoder.
