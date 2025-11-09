// FIX: Made uri and title optional to align with the @google/genai SDK's GroundingChunk type, resolving type errors in ResearchHub.tsx.
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
