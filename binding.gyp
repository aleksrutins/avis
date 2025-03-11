{
    "variables": {
        'pcpath': '$PKG_CONFIG_PATH:./deps/install-prefix/lib/pkgconfig'
    },
    "targets": [
        {
            "target_name": "visualize",
            "sources": [ "visualize.cc" ],
            "include_dirs": [ "<!@(PKG_CONFIG_PATH=<(pcpath) pkg-config essentia --cflags-only-I | sed s/-I//g)" ],
            "cflags_cc": [ "<!@(PKG_CONFIG_PATH=<(pcpath) pkg-config essentia --cflags-only-other)", "-fexceptions", "-frtti" ],
            "libraries": [ "<!@(PKG_CONFIG_PATH=<(pcpath) pkg-config essentia --libs)" ]
        }
    ]
}