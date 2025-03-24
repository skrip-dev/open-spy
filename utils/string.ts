export function extractTimestampFromUUIDv7(uuid: string): Date {
  const parts = uuid.split("-");
  const highBitsHex = parts[0] + parts[1].slice(0, 4);
  const timestampInMilliseconds = parseInt(highBitsHex, 16);
  const date = new Date(timestampInMilliseconds);
  return date;
}
