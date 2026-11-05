/**
 * Model contract shared with the ML export step.
 *
 * The app must refuse a model whose class hash does not match its bundled class
 * list. Keep this file dependency-free: it is imported by the inference layer
 * and by tooling.
 */

export type ModelTask = 'classification' | 'segmentation' | 'multitask';

export interface ModelInput {
  name: string;
  shape: [number, number, number, number];
  dtype: 'float32' | 'uint8';
  layout?: 'NCHW' | 'NHWC';
  preprocess?: 'imagenet' | 'none' | 'custom';
}

export interface ModelOutput {
  name: string;
  shape: number[];
  dtype: 'float32' | 'int64' | 'uint8';
}

export interface ModelFile {
  name: string;
  sha256: string;
  bytes: number;
}

export interface ModelContract {
  model_id: string;
  task: ModelTask;
  version: string;
  model_name?: string;
  input: ModelInput;
  output: ModelOutput;
  classes_sha256: string;
  class_count: number;
  class_ids: number[];
  calibration: {
    temperature: number;
    threshold: number;
  };
  quantization?: 'fp32' | 'fp16' | 'int8' | 'int8-dynamic';
  files: Record<string, { sha256: string; bytes: number }>;
}

const SHA256 = /^[a-f0-9]{64}$/;

function fail(message: string): never {
  throw new Error(`Invalid model contract: ${message}`);
}

export function validateModelContract(value: unknown): ModelContract {
  if (!value || typeof value !== 'object') fail('not an object');
  const contract = value as Partial<ModelContract>;

  if (!contract.model_id) fail('missing model_id');
  if (!contract.task) fail('missing task');
  if (!contract.input?.shape || contract.input.shape.length !== 4) fail('input.shape must be NCHW');
  if (contract.input.shape[1] !== 3) fail('input must have 3 channels');
  if (!contract.output?.name) fail('missing output.name');
  if (!contract.classes_sha256 || !SHA256.test(contract.classes_sha256)) {
    fail('classes_sha256 must be a SHA-256 hex string');
  }
  if (!Array.isArray(contract.class_ids) || contract.class_ids.length === 0) {
    fail('class_ids must be a non-empty array');
  }
  if (contract.class_count !== contract.class_ids.length) {
    fail('class_count does not match class_ids');
  }
  if (!contract.calibration || contract.calibration.temperature <= 0) {
    fail('calibration.temperature must be positive');
  }
  const files = contract.files ?? {};
  const names = Object.keys(files);
  if (names.length === 0) fail('files must contain at least one model file');
  for (const name of names) {
    if (!SHA256.test(files[name].sha256)) fail(`bad checksum for ${name}`);
    if (!Number.isInteger(files[name].bytes) || files[name].bytes <= 0) {
      fail(`bad size for ${name}`);
    }
  }
  return contract as ModelContract;
}

export function assertClassListMatches(
  contract: ModelContract,
  classListSha256: string,
  classIds: number[],
): void {
  if (contract.classes_sha256 !== classListSha256) {
    throw new Error('Model class hash does not match the bundled class list');
  }
  if (contract.class_ids.length !== classIds.length) {
    throw new Error('Model class count does not match the bundled class list');
  }
  for (let index = 0; index < classIds.length; index += 1) {
    if (contract.class_ids[index] !== classIds[index]) {
      throw new Error(`Model class id mismatch at index ${index}`);
    }
  }
}
