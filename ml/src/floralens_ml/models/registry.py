from __future__ import annotations

# Candidate backbones for the lightweight-model screen.
# Keep this list in sync with ml/configs/study/classifiers.yaml.
CLASSIFIER_CANDIDATES = [
    "mobilenetv3_large_100.ra_in1k",          # current FloraLens baseline
    "mobilenetv4_conv_small.e2400_r224_in1k",
    "mobilenetv4_conv_medium.e500_r224_in1k",
    "efficientnet_b0.ra_in1k",
    "efficientvit_m2.r224_in1k",
    "fastvit_t8.apple_in1k",
    "repvit_m1.dist_in1k",
    "mobilevit_xxs.cvnets_in1k",
    "edgenext_small.usi_in1k",
]

SEGMENTATION_CANDIDATES = [
    {"architecture": "deeplabv3plus", "encoder": "mobilenetv3_large_100"},
    {"architecture": "unet", "encoder": "mobilenetv3_large_100"},
    {"architecture": "segformer", "encoder": "mit_b0"},
    {"architecture": "fpn", "encoder": "mobilenetv3_large_100"},
]
