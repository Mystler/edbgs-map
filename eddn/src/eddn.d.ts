interface EDDNMessage {
  $schemaRef: string;
  header: EDDNMessageHeader;
  message: unknown;
}

interface EDDNMessageHeader {
  uploaderId: string;
  softwareName: string;
  softwareVersion: string;
  gameversion?: string;
}

interface EDDNJournalMessage {
  timestamp: string;
  StarSystem: string;
  SystemAddress: number;
  ControllingPower?: string;
  Powers?: string[];
  PowerplayState?: string;
  PowerplayStateControlProgress?: number;
  PowerplayStateReinforcement?: number;
  PowerplayStateUndermining?: number;
  PowerplayConflictProgress?: { Power: string; ConflictProgress: number }[];
}

// Based on SpanshAPI type in parent that we will read stuff as
interface SpanshDumpPPData {
  name: string;
  id64: number;
  date: string;
  powerState?: string;
  powerStateControlProgress?: number;
  powerStateReinforcement?: number;
  powerStateUndermining?: number;
  controllingPower?: string;
  powers?: string[];
  powerConflictProgress?: { power: string; progress: number }[];
}
