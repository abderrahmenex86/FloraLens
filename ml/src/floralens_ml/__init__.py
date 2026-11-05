"""FloraLens ML pipeline.

The package is deliberately import-light: heavy dependencies (torch, timm,
onnxruntime) are imported lazily inside the modules that need them so the
taxonomy, manifest, splitting and rules code can run on a laptop without a GPU
stack installed.
"""

__version__ = "0.1.0"
