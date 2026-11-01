// Servidor dos testes E2E (MDI-D029): build de produção apontando para o
// Supabase LOCAL. Recusa qualquer endereço que não seja local; os valores não
// são impressos.
import { execSync, spawn } from "node:child_process";

const output = execSync("npx supabase status -o json", {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "ignore"],
});
const status = JSON.parse(
  output.slice(output.indexOf("{"), output.lastIndexOf("}") + 1),
);

if (!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(status.API_URL ?? "")) {
  throw new Error("Os testes E2E só rodam contra o Supabase local.");
}

const env = {
  ...process.env,
  NEXT_PUBLIC_SUPABASE_URL: status.API_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: status.PUBLISHABLE_KEY,
};
const port = process.env.E2E_PORT ?? "3100";

execSync("npx next build", { env, stdio: ["ignore", "ignore", "inherit"] });

const server = spawn("npx", ["next", "start", "-p", port], {
  env,
  stdio: "inherit",
  shell: true,
});
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    server.kill(signal);
    process.exit(0);
  });
}
server.on("exit", (code) => process.exit(code ?? 0));
