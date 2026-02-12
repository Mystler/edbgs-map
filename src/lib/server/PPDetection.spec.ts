import { describe, expect, vi, test, beforeEach } from "vitest";
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

  beforeEach(() => {
    vi.mocked(logSnipe).mockClear();
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
  test("Miniscule same tier EOC snipe not logged", async () => {
    vi.setSystemTime(new Date("2026-02-25T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-25T12:05:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.195,
        PowerplayStateReinforcement: 0,
        PowerplayStateUndermining: 0,
      }),
    ).toBe(true);
    expect(logSnipe).not.toHaveBeenCalled();
  });
  test("Mid-cycle UM snipe logged", async () => {
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-25T13:05:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: -0.1,
        PowerplayStateReinforcement: 0,
        PowerplayStateUndermining: 50000,
      }),
    ).toBe(true);
    expect(logSnipe).toHaveBeenCalled();
  });
  test("EOC drop logged", async () => {
    vi.setSystemTime(new Date("2026-02-26T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-26T13:05:00Z",
        PowerplayState: "Unoccupied",
        PowerplayConflictProgress: [],
      }),
    ).toBe(true);
    expect(logSnipe).toHaveBeenCalled();
  });
  test("Previous control cache discarded", async () => {
    vi.setSystemTime(new Date("2026-02-26T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-26T13:10:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: -0.1,
        PowerplayStateReinforcement: 0,
        PowerplayStateUndermining: 50000,
      }),
    ).toBe(false);
  });
  test("Mid-cycle Acq snipe logged", async () => {
    vi.setSystemTime(new Date("2026-02-27T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-02-27T13:05:00Z",
        PowerplayState: "Unoccupied",
        PowerplayConflictProgress: [{ Power: "Aisling Duval", ConflictProgress: 1.11 }],
      }),
    ).toBe(true);
    expect(logSnipe).toHaveBeenCalled();
  });
  test("Acq cache bug logged if first", async () => {
    vi.setSystemTime(new Date("2026-03-06T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-03-06T13:05:00Z",
        PowerplayState: "Unoccupied",
        PowerplayConflictProgress: [{ Power: "Aisling Duval", ConflictProgress: 1.12 }],
      }),
    ).toBe(true);
  });
  test("Acquired control logged", async () => {
    vi.setSystemTime(new Date("2026-03-06T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-03-06T13:05:00Z",
        PowerplayState: "Exploited",
        ControllingPower: "Aisling Duval",
        PowerplayStateControlProgress: 0.06,
        PowerplayStateReinforcement: 0,
        PowerplayStateUndermining: 0,
      }),
    ).toBe(true);
    expect(logSnipe).not.toHaveBeenCalled();
  });
  test("Acq cache bug discarded after control", async () => {
    vi.setSystemTime(new Date("2026-03-06T20:00:00Z"));
    expect(
      await processPPJournalMessage({
        event: "FSDJump",
        StarSystem: "PPDataTest",
        SystemAddress: 1,
        timestamp: "2026-03-06T13:10:00Z",
        PowerplayState: "Unoccupied",
        PowerplayConflictProgress: [{ Power: "Aisling Duval", ConflictProgress: 0 }],
      }),
    ).toBe(false);
  });
});
