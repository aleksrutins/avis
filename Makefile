./deps:
	mkdir -p deps

fetchdeps: essentia_build

essentia_clone: ./deps
	wget https://github.com/MTG/essentia/archive/refs/heads/master.zip -O deps/essentia.zip ;\
	unzip -f deps/essentia.zip -d deps ;\
	rm -rf deps/essentia ;\
	mv -f deps/essentia-master deps/essentia

essentia_build: essentia_clone
	cd deps/essentia ;\
	python3 waf configure --build-static --with-python --with-cpptests --with-examples --with-vamp --prefix=../install-prefix ;\
	python3 waf ;\
	python3 waf install