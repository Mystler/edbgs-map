import { describe, expect, vi, test } from "vitest";
import { processPPJournalMessage } from "./EDDNListener";
import type { SpanshDumpPPData } from "$lib/SpanshAPI";
import { logSnipe } from "$lib/server/DB";

describe("EDDN Powerplay Data Processing", () => {
  vi.setSystemTime(new Date("2026-02-11T20:00:00Z"));
  vi.mock(import("$lib/server/ValkeyCache"), () => {
    const testCache: { [key: string]: string } = {};
    return {
      deleteCache: async (key) => {
        delete testCache[key];
      },
      setCache: async (key, value) => {
        testCache[key] = value;
      },
      getCache: async (key) => {
        return testCache[key];
      },
    };
  });
  vi.mock(import("$lib/server/DB"), () => {
    return {
      logSnipe: vi.fn(
        async (
          _system: string,
          _type: string,
          _power: string,
          _amount: number,
          _old_dump: SpanshDumpPPData | null,
          _new_dump: SpanshDumpPPData,
        ) => {
          /* NOOP */
        },
      ),
    };
  });

  test("Cache new system and discard outdated data", async () => {
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-11T10:00:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.5,
        PowerplayStateReinforcement: 10,
        PowerplayStateUndermining: 10,
      }),
    ).toBe(true);
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-11T09:00:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.5,
        PowerplayStateReinforcement: 10,
        PowerplayStateUndermining: 10,
      }),
    ).toBe(false);
  });
  test("Delta CP may not go down during cycle", async () => {
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-11T12:05:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.5,
        PowerplayStateReinforcement: 5,
        PowerplayStateUndermining: 5,
      }),
    ).toBe(false);
  });
  test("Delta CP may go up", async () => {
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-11T12:05:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.5,
        PowerplayStateReinforcement: 15,
        PowerplayStateUndermining: 10,
      }),
    ).toBe(true);
    expect(logSnipe).not.toHaveBeenCalled();
  });
  test("Delta CP may go down between cycles and log snipe", async () => {
    vi.setSystemTime(new Date("2026-02-18T20:00:00Z"));
    vi.mocked(logSnipe).mockClear();
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-18T12:05:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.2,
        PowerplayStateReinforcement: 0,
        PowerplayStateUndermining: 0,
      }),
    ).toBe(true);
    expect(logSnipe).toHaveBeenCalled();
  });
});
