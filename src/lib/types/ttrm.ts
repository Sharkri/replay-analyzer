import { z } from "zod";

// TODO: add types for z.any()
const keyEnum = z.enum([
  "hardDrop",
  "moveLeft",
  "moveRight",
  "rotateCW",
  "rotateCCW",
  "rotate180",
  "softDrop",
  "hold",
]);

const keyDataSchema = z.object({
  key: keyEnum,
  subframe: z.number(),
});

const keyEvent = z.object({
  frame: z.number(),
  type: z.enum(["keydown", "keyup"]),
  data: keyDataSchema,
});

const eventSchema = z.discriminatedUnion("type", [
  z.object({
    frame: z.number(),
    type: z.literal("start"),
    data: z.object({}),
  }),
  keyEvent,
  z.object({
    frame: z.number(),
    type: z.literal("ige"),
    data: z.object({
      id: z.number(),
      type: z.string(),
      frame: z.number(),
      data: z.any(),
    }),
  }),
  z.object({
    frame: z.number(),
    type: z.literal("end"),
    data: z.object({}),
  }),
]);

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

export const optionsSchema = z.object({
  handling: z.object({
    arr: z.number(),
    das: z.number(),
    dcd: z.number(),
    sdf: z.number(),
    safelock: z.boolean(),
    cancel: z.boolean(),
    may20g: z.boolean(),
  }),
  seed: z.number(),
});

export const roundReplaySchema = z.object({
  events: z.array(eventSchema),
  frames: z.number(),
  options: optionsSchema,
  results: z.any(),
});

export const roundSchema = z.object({
  username: z.string(),
  stats: statsSchema,
  id: z.string(),
  replay: roundReplaySchema,
});

export const replaySchema = z.object({
  leaderboard: z.any(),
  rounds: z.array(z.tuple([roundSchema, roundSchema])),
});

export const TTRMSchema = z.object({
  replay: replaySchema,
});

export type Replay = z.infer<typeof replaySchema>;
export type ReplayEvent = z.infer<typeof eventSchema>;
export type Round = z.infer<typeof roundSchema>;
export type TTRM = z.infer<typeof TTRMSchema>;
export type GameCommand = z.infer<typeof keyEnum>;
export type KeyEvent = z.infer<typeof keyEvent>;
