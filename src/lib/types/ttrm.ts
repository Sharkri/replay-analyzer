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
  hoisted: z.boolean().default(false),
});

const keyEvent = z.object({
  frame: z.number(),
  type: z.enum(["keydown", "keyup"]),
  data: keyDataSchema,
});

const igeDataSchema = z.discriminatedUnion("type", [
  z.object({
    frame: z.number(),
    type: z.literal("interaction"),
    data: z.object({
      gameid: z.number(),
      frame: z.number(),
      cid: z.number(),
      iid: z.number(),
      ackiid: z.number(),
      size: z.number(),
      type: z.literal("garbage"),
      x: z.number(),
      y: z.number(),
      amt: z.number(),
    }),
  }),
  z.object({
    frame: z.number(),
    type: z.literal("interaction_confirm"),
    data: z.object({
      gameid: z.number(),
      frame: z.number(),
      cid: z.number(),
      iid: z.number(),
      ackiid: z.number(),
      size: z.number(),
      type: z.literal("garbage"),
      x: z.number(),
      y: z.number(),
      amt: z.number(),
    }),
  }),
  z.object({
    frame: z.number(),
    type: z.literal("target"),
    data: z.object({ targets: z.array(z.number()) }),
  }),
  z.object({
    frame: z.number(),
    type: z.literal("allow_targeting"),
    data: z.object({ value: z.boolean() }),
  }),
  z.object({ frame: z.number(), type: z.literal("targeted"), data: z.any() }),
  z.object({ frame: z.number(), type: z.literal("kev"), data: z.any() }),
  z.object({ frame: z.number(), type: z.literal("custom"), data: z.any() }), // TODO: any type lol
]);

const igeEvent = z.object({
  frame: z.number(),
  type: z.literal("ige"),
  data: igeDataSchema,
});

const eventSchema = z.discriminatedUnion("type", [
  z.object({
    frame: z.number(),
    type: z.literal("start"),
    data: z.object({}),
  }),
  keyEvent,
  igeEvent,
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

export const handlingSchema = z.object({
  arr: z.number(),
  das: z.number(),
  dcd: z.number(),
  sdf: z.number(),
  safelock: z.boolean(),
  cancel: z.boolean(),
  may20g: z.boolean(),
});

export const optionsSchema = z.object({
  handling: handlingSchema,
  seed: z.number(),
  gameid: z.number(),
  openerphase: z.number().default(0),
  garbagespeed: z.number().default(20),
  spinbonuses: z.enum([
    "all-mini",
    "t-spins",
    "all-spin",
    "handheld",
    "stupid",
    "none",
    "all-mini+",
  ]),
  b2bcharging: z.boolean().default(false),
  b2bcharge_base: z.number().default(0),
  garbagecap: z.number().default(8),
  g: z.number().default(0.02),
  gincrease: z.number().default(0.002),
  gmargin: z.number().default(3600),
  allclear_b2b: z.number().default(0),
  allclear_garbage: z.number().default(10),
  combotable: z.enum(["multiplier", "none"]).default("multiplier"),
  garbagespecialbonus: z.boolean().default(false),
  locktime: z.number().default(30),
});

export const roundReplaySchema = z.object({
  events: z.array(eventSchema),
  frames: z.number(),
  options: optionsSchema,
  results: z.any(),
});

export const playerSchema = z.object({
  username: z.string(),
  stats: statsSchema,
  id: z.string(),
  replay: roundReplaySchema,
});

export const replaySchema = z.object({
  leaderboard: z.any(),
  rounds: z.array(z.tuple([playerSchema, playerSchema])),
});

export const TTRMSchema = z.object({
  replay: replaySchema,
});

export type Replay = z.infer<typeof replaySchema>;
export type ReplayEvent = z.infer<typeof eventSchema>;
export type Round = z.infer<typeof playerSchema>;
export type Handling = z.infer<typeof handlingSchema>;
export type GameOptions = z.infer<typeof optionsSchema>;
export type TTRM = z.infer<typeof TTRMSchema>;
export type GameCommand = z.infer<typeof keyEnum>;
export type KeyEvent = z.infer<typeof keyEvent>;
export type IGEEvent = z.infer<typeof igeEvent>;
