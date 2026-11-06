from __future__ import annotations


def build_classifier(
    model_name: str,
    num_classes: int,
    *,
    pretrained: bool = True,
    drop_rate: float = 0.0,
    drop_path_rate: float = 0.0,
):
    import timm

    kwargs = {
        "pretrained": pretrained,
        "num_classes": num_classes,
        "drop_rate": drop_rate,
        "drop_path_rate": drop_path_rate,
    }

    # Some timm families (EfficientViT, RepViT) do not accept the dropout
    # keyword arguments. Retry without them instead of failing the run.
    for dropped in (None, "drop_path_rate", "drop_rate"):
        if dropped:
            kwargs.pop(dropped, None)
        try:
            return timm.create_model(model_name, **kwargs)
        except TypeError as error:
            if "unexpected keyword argument" not in str(error):
                raise
    raise RuntimeError(f"could not build {model_name}")


def count_parameters(model) -> int:
    return sum(parameter.numel() for parameter in model.parameters() if parameter.requires_grad)
