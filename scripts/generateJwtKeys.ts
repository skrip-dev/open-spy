import childProcess from "node:child_process";
import fs from "node:fs";

childProcess.execSync("openssl genrsa -out private-key.pem 2048");
childProcess.execSync(
  "openssl rsa -in private-key.pem -pubout -out public-key.pem",
);

const privateKey = fs
  .readFileSync("private-key.pem")
  .toString()
  .replace(/\n/g, "\\\\n");
const publicKey = fs
  .readFileSync("public-key.pem")
  .toString()
  .replace(/\n/g, "\\\\n");

childProcess.execSync(`echo '' >> .env`);
childProcess.execSync(`echo 'JWT_PRIVATE_KEY=${privateKey}' >> .env`);
childProcess.execSync(`echo 'JWT_PUBLIC_KEY=${publicKey}' >> .env`);

Promise.all([
  fs.promises.unlink("private-key.pem"),
  fs.promises.unlink("public-key.pem"),
]);
