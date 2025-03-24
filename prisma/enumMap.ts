export const enumPageSpyType = ["FILE", "TEXT"] as const;
export type IEnumPageSpyTypeKeys = (typeof enumPageSpyType)[number];
export type IEnumPageSpyTypeTranslation = {
  [key in IEnumPageSpyTypeKeys]: string;
};
export const enumPageSpyTranslation: IEnumPageSpyTypeTranslation = {
  FILE: "Arquivo",
  TEXT: "Texto",
};
