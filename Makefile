build-essentia:
	cd deps/essentia ;\
	python3 waf configure --build-static --with-python --with-cpptests --with-examples --with-vamp --prefix=../install-prefix ;\
	python3 waf ;\
	python3 waf install