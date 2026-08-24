const INITIAL_BACKOFF_MS = 500;
const MAX_BACKOFF_MS = 30_000;

export async function processUpdateBatch({ updates, offset, handleUpdate, onError = () => {} }) {
  let nextOffset = offset;
  for (const update of updates) {
    try {
      await handleUpdate(update);
      nextOffset = update.update_id + 1;
    } catch (error) {
      onError(error, update);
      // Telegram updates are delivered at-least-once. Keeping a poisoned
      // update unacknowledged blocks every later update, including /menu.
      // Handlers own their bounded provider/delivery retries; polling must
      // acknowledge the failed update and continue with the batch.
      nextOffset = update.update_id + 1;
    }
  }
  return nextOffset;
}

export async function runPolling({
  telegram,
  handleUpdate,
  initialOffset = 0,
  signal,
  sleepFn = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  onError = () => {}
}) {
  let offset = initialOffset;
  let backoffMs = INITIAL_BACKOFF_MS;

  while (!signal?.aborted) {
    try {
      const updates = await telegram.getUpdates(offset);
      const previousOffset = offset;
      offset = await processUpdateBatch({ updates, offset, handleUpdate, onError });

      if (updates.length > 0 && offset === previousOffset) {
        await sleepFn(backoffMs);
        backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
      } else {
        backoffMs = INITIAL_BACKOFF_MS;
      }
    } catch (error) {
      if (signal?.aborted) break;
      onError(error);
      await sleepFn(backoffMs);
      backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
    }
  }

  return offset;
}
