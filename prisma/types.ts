import type { IEnumPageSpyTypeKeys } from "./enumMap";

declare global {
  namespace PrismaJson {
    type PrismaPageSpyType = IEnumPageSpyTypeKeys;
  }
}
