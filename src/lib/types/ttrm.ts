import { z } from "zod";

export const statsSchema = z.object({
  apm: z.number(),
  btb: z.number(),
  garbagereceived: z.number(),
  garbagesent: z.number(),
  kills: z.number(),
  pps: z.number(),
  rank: z.number(),
  vsscore: z.number(),
});

export const framesSchema = z.object({});

export const replayEventsSchema = z.object({
  events: z.any(),
  frames: z.number(),
});

export const roundSchema = z.object({
  username: z.string(),
  stats: statsSchema,
  id: z.string(),
  replay: z.any(),
});

export const replaySchema = z.object({
  leaderboard: z.any(),
  rounds: z.array(z.tuple([roundSchema, roundSchema])),
});

export const TTRMSchema = z.object({
  replay: replaySchema,
});

export type TTRM = z.infer<typeof TTRMSchema>;
