
import { GoogleGenAI, GenerateContentResponse, Type, LatLng } from "@google/genai";

// FIX: Initialize the Google Gemini AI client with the API key from environment variables.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

// Helper function to convert a File object to a base64 string
const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};

// Helper function to convert a Blob object to a base64 string
const blobToGenerativePart = async (blob: Blob) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
    reader.readAsDataURL(blob);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: blob.type },
  };
};

/**
 * Analyzes an egg image to predict chick sex.
 */
// FIX: Updated return type because GenerateContentStreamResult is not an exported member.
export const analyzeEggImage = async (imageFile: File): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const imagePart = await fileToGenerativePart(imageFile);
  const prompt = `Based on established scientific research on egg morphology (shape index, ovality, etc.), analyze this egg image to predict the probable sex of the chick inside. Provide a detailed analysis explaining your reasoning and conclude with a clear prediction (Male or Female).`;

  // FIX: Use generateContentStream for a streaming response.
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
  });

  return stream;
};

/**
 * Asks a complex question with optional "thinking" time.
 */
// FIX: Updated return type because GenerateContentStreamResult is not an exported member.
export const askQuestion = async (prompt: string, useThinking: boolean): Promise<AsyncGenerator<GenerateContentResponse>> => {
  // FIX: Use generateContentStream and enable thinkingConfig for complex queries.
  const stream = await ai.models.generateContentStream({
    model: useThinking ? 'gemini-2.5-pro' : 'gemini-2.5-flash',
    contents: prompt,
    config: useThinking ? { thinkingConfig: { thinkingBudget: 8192 } } : {},
  });
  return stream;
};

/**
 * Analyzes a video concept.
 */
// FIX: Updated return type because GenerateContentStreamResult is not an exported member.
export const analyzeVideo = async (prompt: string): Promise<AsyncGenerator<GenerateContentResponse>> => {
  const fullPrompt = `You are a video analysis expert. A user has provided the title or topic of a video: "${prompt}". You have not actually seen the video. Based on this topic, provide a conceptual summary of what the video likely contains, its potential themes, and the key information a viewer might take away.`;
  // FIX: Use generateContentStream for a streaming text response.
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: fullPrompt,
  });
  return stream;
};

/**
 * Searches the web for information.
 */
export const searchWeb = async (prompt: string): Promise<GenerateContentResponse> => {
  // FIX: Use generateContent with the googleSearch tool for web grounding.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return response;
};

/**
 * Searches Google Maps for places.
 */
export const searchMaps = async (prompt: string, location: { latitude: number; longitude: number }): Promise<GenerateContentResponse> => {
  // FIX: Use generateContent with the googleMaps tool and provide location coordinates.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      tools: [{ googleMaps: {} }],
      toolConfig: {
        retrievalConfig: {
          latLng: location as LatLng,
        }
      }
    }
  });
  return response;
};

/**
 * Generates an image based on a text prompt.
 */
// FIX: Added missing generateImage function.
export const generateImage = async (prompt: string): Promise<string> => {
  const response = await ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/jpeg',
      aspectRatio: '1:1',
    },
  });

  const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
  const imageUrl = `data:image/jpeg;base64,${base64ImageBytes}`;
  return imageUrl;
};


export interface LiveAnalysisResult {
  prediction: 'Male' | 'Female' | 'Unknown';
  analysis_text: string;
}

/**
 * Analyzes a single frame from a live video stream for egg morphology.
 * It conceptually corrects the egg's orientation before analysis to improve accuracy.
 */
export const analyzeLiveFrame = async (imageBlob: Blob): Promise<LiveAnalysisResult> => {
  const imagePart = await blobToGenerativePart(imageBlob);
  const prompt = `You are an expert in poultry science and computer vision. Analyze this single image of a chicken egg. First, conceptually correct its orientation so the long axis is vertical and the broader end is at the top. Then, based on its morphology (shape index, ovality, roundness vs. pointiness of the narrow end), predict the probable sex of the chick inside. Provide a detailed analysis explaining your reasoning and conclude with a clear prediction. Return a JSON object containing your prediction ('Male' or 'Female') and the detailed analysis text.`;

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: { parts: [imagePart, { text: prompt }] },
    config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                prediction: {
                    type: Type.STRING,
                    description: "The predicted sex of the chick, either 'Male', 'Female', or 'Unknown'."
                },
                analysis_text: {
                    type: Type.STRING,
                    description: "A detailed explanation of the morphological analysis and reasoning for the prediction."
                }
            },
            required: ["prediction", "analysis_text"]
        }
    }
  });
  
  try {
    return JSON.parse(response.text);
  } catch(e) {
    console.error("Failed to parse JSON from live analysis:", response.text);
    throw new Error("Invalid response from analysis model.");
  }
};


interface EggMeasurements {
  mass: number;
  long_axis: number;
  short_axis: number;
}

/**
 * Predicts egg sex from structured measurement data.
 */
export const predictEggSexFromMeasurements = async (measurements: EggMeasurements): Promise<'male' | 'female' | 'unknown'> => {
  const prompt = `Given the following egg measurements: Mass=${measurements.mass}g, Long Axis=${measurements.long_axis}mm, Short Axis=${measurements.short_axis}mm. Predict the sex of the chick.`;

  // FIX: Use JSON mode with a response schema for structured output.
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          predicted_sex: {
            type: Type.STRING,
            description: "The predicted sex, either 'male' or 'female'."
          }
        },
        required: ["predicted_sex"]
      }
    }
  });

  try {
    const jsonResponse = JSON.parse(response.text);
    return jsonResponse.predicted_sex || 'unknown';
  } catch (e) {
    console.error("Failed to parse JSON response:", response.text);
    return 'unknown';
  }
};

interface FullEggMeasurements extends EggMeasurements {
  shape_index: number;
  ovality: number;
  surface_area: number;
  volume: number;
  density: number;
}

/**
 * Simulates a RUSBoost model prediction.
 */
export const simulateRusBoostPrediction = async (measurements: FullEggMeasurements): Promise<{ prediction: 'male' | 'female'; confidence: number }> => {
    const prompt = `Simulate a RUSBoosted Trees classifier prediction for chick sex based on these egg metrics:
- Mass: ${measurements.mass.toFixed(2)}g
- Long Axis: ${measurements.long_axis.toFixed(2)}mm
- Short Axis: ${measurements.short_axis.toFixed(2)}mm
- Shape Index: ${measurements.shape_index.toFixed(4)}
- Ovality: ${measurements.ovality.toFixed(4)}
- Surface Area: ${measurements.surface_area.toFixed(2)} cm²
- Volume: ${measurements.volume.toFixed(2)} cm³
- Density: ${measurements.density.toFixed(4)} g/cm³

Based on the typical patterns found in poultry science research where these metrics are used, output your prediction. Generally, rounder eggs (higher shape index) are associated with females.`;

    // FIX: Use JSON mode for a structured prediction and confidence score.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prediction: {
              type: Type.STRING,
              description: "The predicted sex, either 'male' or 'female'."
            },
            confidence: {
              type: Type.NUMBER,
              description: "A confidence score for the prediction, from 0.0 to 1.0."
            }
          },
          required: ["prediction", "confidence"]
        }
      }
    });

    try {
        const jsonResponse = JSON.parse(response.text);
        return jsonResponse;
    } catch (e) {
        console.error("Failed to parse JSON from simulated model:", response.text);
        // Fallback response
        return { prediction: 'female', confidence: 0.5 };
    }
};
