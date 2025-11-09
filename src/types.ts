export interface GroundingChunk {
  web?: {
    uri?: string;
    title?: string;
  };
  maps?: {
    uri?: string;
    title?: string;
  };
}

export interface BatchResult {
  batchNumber: string;
  prediction: string;
  source: 'Image' | 'Live Scan';
  timestamp: string;
}