from __future__ import annotations


def build_transforms(input_size: int, *, train: bool):
    from torchvision import transforms as v2

    normalize = v2.Normalize(
        mean=(0.485, 0.456, 0.406),
        std=(0.229, 0.224, 0.225),
    )
    if train:
        return v2.Compose(
            [
                v2.RandomResizedCrop(input_size, scale=(0.6, 1.0), antialias=True),
                v2.RandomHorizontalFlip(),
                v2.RandAugment(num_ops=2, magnitude=9),
                v2.ToTensor(),
                normalize,
                v2.RandomErasing(p=0.1),
            ]
        )
    return v2.Compose(
        [
            v2.Resize(int(input_size * 1.14), antialias=True),
            v2.CenterCrop(input_size),
            v2.ToTensor(),
            normalize,
        ]
    )
