export const enumPageSpyType = ["IMAGE", "TEXT"] as const;
export type IEnumPageSpyTypeKeys = (typeof enumPageSpyType)[number];
export type IEnumPageSpyTypeTranslation = {
  [key in IEnumPageSpyTypeKeys]: string;
};
export const enumPageSpyTranslation: IEnumPageSpyTypeTranslation = {
  IMAGE: "Imagem",
  TEXT: "Texto",
};
