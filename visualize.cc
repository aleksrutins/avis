#include <node.h>
#include <essentia.h>

#include <cstdlib>

namespace visualize {

	using v8::FunctionCallbackInfo;
	using v8::Value;
	using v8::Local;
	using v8::Object;
	using v8::Isolate;
	using v8::String;

	void GenerateSpectrograph(const FunctionCallbackInfo<Value>& args) {
		Isolate* isolate = args.GetIsolate();

		args.GetReturnValue().Set(String::NewFromUtf8Literal(isolate, "hello"));

	}

	void Initialize(Local<Object> exports) {
		NODE_SET_METHOD(exports, "generateSpectrograph", GenerateSpectrograph);
	}

	NODE_MODULE(NODE_GYP_MODULE_NAME, Initialize)
}