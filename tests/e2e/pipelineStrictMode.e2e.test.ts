import express from "express";
import { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import request from "supertest";
import { buildContentIntelligenceApp } from "../../src/uow-2-content-intelligence/api/app";
import { buildMediaCompositionApp } from "../../src/uow-3-media-composition/api/app";
import { buildPlatformPackagingApp } from "../../src/uow-4-platform-packaging/api/app";

let serverBaseUrl = "";
let closeServer: (() => Promise<void>) | undefined;

async function startMockProviderServer(): Promise<{ baseUrl: string; close: () => Promise<void> }> {
  const app = express();
  app.use(express.json());

  app.post("/api/generate", (_req, res) => {
    res.status(200).json({ response: "Hook line\nBeat one\nCTA" });
  });

  app.get("/v1/search", (req, res) => {
    const topic = String(req.query.query ?? "topic");
    res.status(200).json({
      photos: [
        {
          id: 101,
          alt: `${topic} frame`,
          url: `${serverBaseUrl}/pexels/frame/101`,
          src: {
            medium: `${serverBaseUrl}/media/101-medium.jpg`,
            large: `${serverBaseUrl}/media/101-large.jpg`
          }
        },
        {
          id: 102,
          alt: `${topic} frame 2`,
          url: `${serverBaseUrl}/pexels/frame/102`,
          src: {
            medium: `${serverBaseUrl}/media/102-medium.jpg`,
            large: `${serverBaseUrl}/media/102-large.jpg`
          }
        }
      ]
    });
  });

  app.head(/\/prompt\/.+/, (_req, res) => {
    res.status(200).end();
  });

  app.post("/api/packages/resolve", (req, res) => {
    const files = (req.body.files ?? []).map((file: { fileName: string; fileType: string; uri: string }) => ({
      ...file,
      uri: `${serverBaseUrl}/resolved/${file.fileName}`
    }));
    res.status(200).json({ files });
  });

  const listener = await new Promise<import("node:http").Server>((resolve) => {
    const srv = app.listen(0, () => resolve(srv));
  });

  const address = listener.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  serverBaseUrl = baseUrl;

  return {
    baseUrl,
    close: async () => {
      await new Promise<void>((resolve, reject) => {
        listener.close((err) => (err ? reject(err) : resolve()));
      });
    }
  };
}

beforeAll(async () => {
  process.env.UOW5_ENABLE_RUNTIME_HOOKS = "false";
  const started = await startMockProviderServer();
  serverBaseUrl = started.baseUrl;
  closeServer = started.close;
});

afterAll(async () => {
  delete process.env.UOW5_ENABLE_RUNTIME_HOOKS;
  if (closeServer) {
    await closeServer();
  }
});

describe("strict mode pipeline integration", () => {
  it("executes UOW-2 to UOW-4 APIs with strict real providers", async () => {
    const uow2 = buildContentIntelligenceApp({
      requireRealProvider: true,
      providerConfig: {
        ollamaBaseUrl: serverBaseUrl,
        ollamaModel: "llama3"
      }
    });

    const uow2Response = await request(uow2).post("/v1/scripts/generate").send({
      runId: "run-e2e-1",
      input: {
        topic: "future robotics",
        platformProfile: "tiktok"
      }
    });

    expect(uow2Response.status).toBe(202);
    expect(uow2Response.body.script).toBeDefined();

    const uow3 = buildMediaCompositionApp({
      requireRealProvider: true,
      providerConfig: {
        pexelsApiKey: "pexels-key",
        pexelsBaseUrl: serverBaseUrl,
        pollinationsBaseUrl: serverBaseUrl
      }
    });

    const discoverResponse = await request(uow3).post("/v1/media/discover").send({
      runId: "run-e2e-1",
      scriptId: uow2Response.body.script.scriptId,
      topic: "future robotics",
      platformProfile: "tiktok",
      visualStyle: "cinematic"
    });

    expect(discoverResponse.status).toBe(202);
    expect(discoverResponse.body.selectedAssets.length).toBeGreaterThan(0);

    const timelineResponse = await request(uow3).post("/v1/media/timeline").send({
      runId: "run-e2e-1",
      platformProfile: "tiktok",
      scriptContent: uow2Response.body.script.content
    });

    expect(timelineResponse.status).toBe(202);
    expect(timelineResponse.body.timelineId).toBeDefined();

    const uow4 = buildPlatformPackagingApp({
      requireRealProvider: true,
      providerConfig: {
        localArtifactBaseUrl: serverBaseUrl
      }
    });

    const packageResponse = await request(uow4).post("/v1/packages/build-multi").send({
      runId: "run-e2e-1",
      timelineId: timelineResponse.body.timelineId,
      title: "Future Robotics",
      hashtags: ["ai", "robotics"],
      platforms: ["tiktok", "youtube-shorts", "instagram-reels"]
    });

    expect(packageResponse.status).toBe(202);
    expect(packageResponse.body.packages).toHaveLength(3);
    expect(packageResponse.body.packages[0].files[0].uri).toContain("/resolved/");
  });
});
