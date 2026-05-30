import { buildPlatformPackagingApp } from "./app";

const port = Number(process.env.UOW4_PORT ?? process.env.PORT ?? "3003");

const app = buildPlatformPackagingApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`UOW-4 platform packaging API running on port ${port}`);
});
