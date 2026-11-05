from __future__ import annotations


def build_segmentation(
    architecture: str,
    encoder: str,
    num_classes: int,
    *,
    encoder_weights: str | None = "imagenet",
):
    import segmentation_models_pytorch as smp

    factories = {
        "unet": smp.Unet,
        "deeplabv3plus": smp.DeepLabV3Plus,
        "fpn": smp.FPN,
        "segformer": smp.Segformer,
    }
    if architecture not in factories:
        raise ValueError(f"unknown segmentation architecture {architecture!r}")
    return factories[architecture](
        encoder_name=encoder,
        encoder_weights=encoder_weights,
        in_channels=3,
        classes=num_classes,
    )
