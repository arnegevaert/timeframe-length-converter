# Timeframe length converter
Application to convert LOD files containing time intervals to different interval lengths

Usage:
```
node timeframe-length-converter.js LENGTH SOURCE DEST
```

Arguments:
- LENGTH: Desired length of interval in minutes
- SOURCE: Source directory containing current files
- DEST: Output directory to write to

Files in SOURCE have no naming restrictions, but they must contain all
measurements chronologically when sorted alphabetically. It is recommended
to name the files using the UNIX timestamp of the first measurement they contain,
guaranteeing this property holds.
