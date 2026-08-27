export type DeviceConnectionPhase =
  | 'idle'
  | 'permission-required'
  | 'opening'
  | 'verifying'
  | 'initializing'
  | 'ready'
  | 'reconnecting'
  | 'failed';

export interface CubeLinkDeviceInfo {
  deviceId: string;
  vendorId: number;
  productId: number;
  productName?: string;
}

export interface CubeLinkTransport {
  discover(): Promise<CubeLinkDeviceInfo[]>;
  requestPermission(device: CubeLinkDeviceInfo): Promise<boolean>;
  open(device: CubeLinkDeviceInfo, baudRate: number): Promise<void>;
  write(data: Uint8Array): Promise<void>;
  close(): Promise<void>;
  onData(listener: (data: Uint8Array) => void): () => void;
  onDisconnect(listener: () => void): () => void;
}

// Android USB, browser test doubles and any later transport implement this
// boundary. Protocol verification and safety initialization live above it.
