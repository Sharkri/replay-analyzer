import { Handling, IGEEvent, KeyEvent } from "@/lib/types/ttrm";
import { Command } from "@/lib/engine/game";
import { GameRNG } from "./rng";

export type HeldKey = { frame: number; order: number } | null;
export type HeldKeys = Record<"moveLeft" | "moveRight" | "softDrop", HeldKey>;

const isHeldKey = (key: string): key is keyof HeldKeys => {
  return key === "moveLeft" || key === "moveRight" || key === "softDrop";
};

export const processKeyDown = (event: KeyEvent, heldKeys: HeldKeys) => {
  const { frame, data } = event;
  const currFrame = frame + data.subframe;

  if (data.key === "moveLeft" && heldKeys.moveRight) {
    heldKeys.moveRight = { frame: currFrame, order: 0 };
  } else if (data.key === "moveRight" && heldKeys.moveLeft) {
    heldKeys.moveLeft = { frame: currFrame, order: 0 };
  }

  (Object.keys(heldKeys) as (keyof HeldKeys)[]).forEach((key) => {
    if (heldKeys[key]) heldKeys[key].order += 1;
  });

  if (isHeldKey(data.key)) heldKeys[data.key] = { frame: currFrame, order: 0 };

  console.log(`Key pressed: ${data.key} at frame ${frame}`);
  return data.key;
};

export const handleKeyUp = (event: KeyEvent, heldKeys: HeldKeys) => {
  const { data } = event;
  if (isHeldKey(data.key)) heldKeys[data.key] = null;
  console.log(`Key released: ${data.key}`);
};

export const getHeldKeyCommands = (
  event: KeyEvent,
  heldKeys: HeldKeys,
  handling: Handling
) => {
  const { das, arr } = handling;
  const currentFrame = event.frame + event.data.subframe;
  const commands: Command[] = [];

  // order doesnt seem to do anything but idk
  const keys = Object.entries(heldKeys).sort(([, a], [, b]) =>
    a && b ? b.order - a.order : 0
  );

  keys.forEach(([key, pressTime]) => {
    if (pressTime == null) return;

    if (key === "softDrop") {
      commands.push(key);
    } else if (key === "moveLeft" || key === "moveRight") {
      const framesHeld = currentFrame - pressTime.frame;
      if (framesHeld >= das) {
        const arrFrames = framesHeld - das;
        if (arr === 0 || arrFrames % arr === 0)
          commands.push(key === "moveLeft" ? "dasLeft" : "dasRight");
      }
    }
  });

  return commands;
};

export const handleIGEEvent = (event: IGEEvent, rng: GameRNG) => {
  console.log(`Processing IGE event:`, event);

  const { data } = event;
  switch (data.type) {
    case "custom":
      break;
    case "interaction":
      break;
    case "interaction_confirm":
      if (data.data.type === "garbage") {
        const { amt, frame } = data.data;
        const column = Math.floor(rng.nextFloat() * 10);

        return { amt, column, cancelFrame: frame, frame: event.frame };
      }
      break;

    case "allow_targeting":
      break;
    case "target":
      break;
    case "targeted":
      break;
    case "kev":
      break;

    default:
      console.log("Unknown event:", event);
  }

  return null;
};
