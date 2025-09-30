import bcryptjs from "bcryptjs";

export const bcryptHashProvider = {
  generateHash: async (payload: string) => {
    return bcryptjs.hash(payload, 12);
  },
  compareHash: async (payload: string, hashed: string) => {
    return bcryptjs.compare(payload, hashed);
  },
};
