./deps:
	mkdir -p deps

fetchdeps: essentia_build

essentia_clone: ./deps
	mkdir -p deps/essentia; \
	wget https://github.com/MTG/essentia/archive/refs/heads/master.zip -O deps/essentia.zip; \
	unzip deps/essentia.zip -d deps/essentia

essentia_build: essentia_clone
	cd deps/essentia ;\
	python3 waf configure --build-static --with-python --with-cpptests --with-examples --with-vamp --prefix=../install-prefix ;\
	python3 waf ;\
	python3 waf install