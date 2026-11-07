let pending: ((uri: string) => void) | null = null;

/** Hands the selected gallery photo back to the screen that opened it. */
export function setPendingPhoto(handler: (uri: string) => void): void {
    pending = handler;
}

export function clearPendingPhoto(): void {
    pending = null;
}

export function deliverPhoto(uri: string): void {
    const handler = pending;
    pending = null;
    handler?.(uri);
}
