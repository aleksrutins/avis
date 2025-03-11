{
    "targets": [
        {
            "target_name": "visualize",
            "sources": [ "visualize.cc" ],
            "include_dirs": [ "<!@(pkg-config ./deps/install-prefix/lib/pkgconfig/essentia.pc --cflags-only-I | sed s/-I//g)" ],
            "cflags_cc": [ "<!@(pkg-config ./deps/install-prefix/lib/pkgconfig/essentia.pc --cflags-only-other)", "-fexceptions", "-frtti" ],
            "libraries": [ "<!@(pkg-config ./deps/install-prefix/lib/pkgconfig/essentia.pc --libs)" ]
        }
    ]
}