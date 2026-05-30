import { buildContentIntelligenceApp } from "./app";

const port = Number(process.env.UOW2_PORT ?? process.env.PORT ?? "3001");

const app = buildContentIntelligenceApp();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`UOW-2 content intelligence API running on port ${port}`);
});
