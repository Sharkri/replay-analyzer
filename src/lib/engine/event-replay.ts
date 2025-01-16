import { Handling, IGEEvent, KeyEvent } from "@/lib/types/ttrm";
import { Command } from "@/lib/engine/game";

export type HeldKey = { frame: number; order: number; hoisted: boolean } | null;
export type HeldKeys = Record<"moveLeft" | "moveRight" | "softDrop", HeldKey>;

const isHeldKey = (key: string): key is keyof HeldKeys => {
  return key === "moveLeft" || key === "moveRight" || key === "softDrop";
};

export const processKeyDown = (event: KeyEvent, heldKeys: HeldKeys) => {
  const { frame, data } = event;
  const currFrame = frame + data.subframe;

  // Cancel das if other direction is pressed
  if (data.key === "moveLeft" && heldKeys.moveRight) {
    heldKeys.moveRight = { frame: currFrame, order: 0, hoisted: false };
  } else if (data.key === "moveRight" && heldKeys.moveLeft) {
    heldKeys.moveLeft = { frame: currFrame, order: 0, hoisted: false };
  }

  (Object.keys(heldKeys) as (keyof HeldKeys)[]).forEach((key) => {
    if (heldKeys[key]) heldKeys[key].order += 1;
  });

  if (isHeldKey(data.key)) {
    heldKeys[data.key] = { frame: currFrame, order: 0, hoisted: data.hoisted };
  }

  console.log(`Key pressed: ${data.key} at frame ${frame}`);
  return { key: data.key, heldKeys };
};

export const handleKeyUp = (event: KeyEvent, heldKeys: HeldKeys) => {
  const { data } = event;
  if (isHeldKey(data.key)) heldKeys[data.key] = null;
  console.log(`Key released: ${data.key} ${event.frame}`);
};

export const getHeldKeyCommands = (
  event: KeyEvent,
  heldKeys: HeldKeys,
  handling: Handling
) => {
  const { das, arr, may20g } = handling;
  const currentFrame = event.frame + event.data.subframe;
  const commands: Command[] = [];

  const keys = Object.entries(heldKeys).sort(([, a], [, b]) =>
    a && b ? b.order - a.order : 0
  );

  const is20G = heldKeys.softDrop != null && may20g;

  for (const [key, data] of keys) {
    if (data == null) continue;
    if (key === "softDrop") {
      commands.push(key);
      continue;
    }

    const framesHeld = currentFrame - data.frame;
    const arrFrames = framesHeld - das;
    const canDas = framesHeld >= das && (arr === 0 || arrFrames % arr === 0);

    if (!canDas && !data.hoisted) continue;

    if (is20G) {
      // Soft drop precedent over any movement. Manual das really inefficient lol
      for (let i = 0; i < 9; i++) commands.push("softDrop", key as Command);
    } else {
      commands.push(key === "moveLeft" ? "dasLeft" : "dasRight");
    }
  }

  return commands;
};

export const handleIGEEvent = (event: IGEEvent) => {
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

        return { amt, cancelFrame: frame, frame: event.frame };
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
