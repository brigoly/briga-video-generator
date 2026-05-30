import { buildMediaCompositionApp } from "./app";

const port = Number(process.env.UOW3_PORT ?? process.env.PORT ?? "3002");

const app = buildMediaCompositionApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`UOW-3 media composition API running on port ${port}`);
});
