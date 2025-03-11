./deps:
	mkdir -p deps

fetchdeps: essentia_build

essentia_clone: ./deps
	wget https://github.com/MTG/essentia/archive/refs/heads/master.zip -O deps/essentia.zip ;\
	unzip -o deps/essentia.zip -d deps

essentia_build: essentia_clone
	cd deps/essentia-master ;\
	python3 waf configure --build-static --with-python --with-cpptests --with-examples --with-vamp --prefix=../install-prefix ;\
	python3 waf ;\
	python3 waf install