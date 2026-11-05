# FloraLens training image.
#
# Build from the repository root so shared/ is available:
#   docker build -f ml/Dockerfile -t <registry>/floralens-ml:0.1 .
FROM pytorch/pytorch:2.5.1-cuda12.4-cudnn9-runtime

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

RUN apt-get update && apt-get install -y --no-install-recommends \
    git curl libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir uv

WORKDIR /workspace

COPY ml/pyproject.toml ml/uv.lock* /workspace/ml/
RUN cd /workspace/ml && uv sync --extra train --extra eval --extra dedupe --no-install-project

COPY ml/src /workspace/ml/src
COPY ml/configs /workspace/ml/configs
COPY ml/tests /workspace/ml/tests
COPY shared /workspace/shared

ENV PATH="/workspace/ml/.venv/bin:${PATH}" \
    PYTHONPATH="/workspace/ml/src"

CMD ["bash"]
