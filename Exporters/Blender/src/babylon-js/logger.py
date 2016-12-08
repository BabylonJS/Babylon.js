from .package_level import format_f, format_exporter_version

from bpy import app
from io import open
from math import floor
from time import time
from sys import exc_info
from traceback import format_tb

class Logger:
    instance = None

    def __init__(self, filename):
        self.start_time = time()
        self.nWarnings = 0

        self.log_handler = open(filename, 'w', encoding='utf8')
        self.log_handler.write('Exporter version: ' + format_exporter_version() + ', Blender version: ' + app.version_string + '\n')

        # allow the static methods to log, so instance does not need to be passed everywhere
        Logger.instance = self

    def log_error_stack(self):
        ex = exc_info()
        Logger.log('========= An error was encountered =========', 0)
        stack = format_tb(ex[2])
        for line in stack:
           self.log_handler.write(line) # avoid tabs & extra newlines by not calling log() inside catch

        self.log_handler.write('ERROR:  ' + str(ex[1]) + '\n')

    def close(self):
        Logger.log('========= end of processing =========', 0)
        elapsed_time = time() - self.start_time
        minutes = floor(elapsed_time / 60)
        seconds = elapsed_time - (minutes * 60)
        Logger.log('elapsed time:  ' + str(minutes) + ' min, ' + format_f(seconds) + ' secs', 0)

        self.log_handler.close()
        Logger.instance = None

    @staticmethod
    def warn(msg, numTabIndent = 1, noNewLine = False):
        Logger.log('WARNING: ' + msg, numTabIndent, noNewLine)
        Logger.instance.nWarnings += 1

    @staticmethod
    def log(msg, numTabIndent = 1, noNewLine = False):
        # allow code that calls Logger run successfully when not logging
        if Logger.instance is None: return

        for i in range(numTabIndent):
            Logger.instance.log_handler.write('\t')

        Logger.instance.log_handler.write(msg)
        if not noNewLine: Logger.instance.log_handler.write('\n')