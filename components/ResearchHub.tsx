
import React, { useState, useCallback } from 'react';
import { askQuestion, searchWeb, searchMaps, analyzeVideo } from '../services/geminiService';
import { BrainCircuitIcon, SearchIcon, MapPinIcon, VideoIcon } from './Icons';
import Spinner from './Spinner';
import { GroundingChunk } from '../types';

type ResearchTool = 'think' | 'web' | 'maps' | 'video';

interface GroundingResult {
  text: string;
  chunks: GroundingChunk[];
}

const ResearchHub: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ResearchTool>('think');
  const [prompt, setPrompt] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [groundingResult, setGroundingResult] = useState<GroundingResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const toolConfig = {
    think: {
      title: 'Complex Query',
      description: 'Ask complex questions about the research, ethics, or economic impact. The AI will use an advanced model with extended thinking time for a deeper analysis.',
      placeholder: 'e.g., Explain the statistical significance of the ROC curve in Figure 5.',
      icon: <BrainCircuitIcon className="w-6 h-6" />,
    },
    web: {
      title: 'Web Search',
      description: 'Get up-to-date information on chick sexing technologies, news, and recent studies using Google Search grounding.',
      placeholder: 'e.g., Latest advancements in in-ovo chick sexing technology.',
      icon: <SearchIcon className="w-6 h-6" />,
    },
    maps: {
      title: 'Find Local Farms',
      description: 'Find poultry farms or hatcheries near you using Google Maps grounding. Requires location permission.',
      placeholder: 'e.g., Poultry farms near me.',
      icon: <MapPinIcon className="w-6 h-6" />,
    },
    video: {
      title: 'Analyze Video Concept',
      description: 'Enter a topic for a video (e.g., a title or URL). The AI will provide a conceptual summary as if it had watched and analyzed the content.',
      placeholder: 'e.g., Documentary on ethical poultry farming.',
      icon: <VideoIcon className="w-6 h-6" />,
    },
  };

  const resetState = () => {
    setResult('');
    setGroundingResult(null);
    setError(null);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  }

  const handleSubmit = useCallback(async () => {
    if (!prompt) return;
    setIsLoading(true);
    resetState();

    try {
      switch (activeTool) {
        case 'think':
        case 'video':
          const isThinking = activeTool === 'think';
          const stream = isThinking ? await askQuestion(prompt, true) : await analyzeVideo(prompt);
          for await (const chunk of stream) {
            setResult((prev) => prev + chunk.text);
          }
          break;
        case 'web':
          const webRes = await searchWeb(prompt);
          setGroundingResult({
            text: webRes.text,
            chunks: webRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
          });
          break;
        case 'maps':
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              const mapsRes = await searchMaps(prompt, { latitude, longitude });
              setGroundingResult({
                text: mapsRes.text,
                chunks: mapsRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
              });
            },
            (err) => {
              setError('Location access denied. Please enable it in your browser settings.');
              console.error(err);
            }
          );
          break;
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [prompt, activeTool]);

  const currentTool = toolConfig[activeTool];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
         <h2 className="text-2xl font-bold text-gray-700">AI Research Hub</h2>
      </div>
     
      <div className="flex flex-wrap gap-2 p-2 bg-gray-100 rounded-lg">
        {(Object.keys(toolConfig) as ResearchTool[]).map(tool => (
           <button
            key={tool}
            onClick={() => { setActiveTool(tool); resetState(); setPrompt('') }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              activeTool === tool ? 'bg-amber-500 text-white shadow' : 'bg-white text-gray-600 hover:bg-amber-100'
            }`}
          >
            {toolConfig[tool].icon}
            <span className="capitalize hidden sm:inline">{tool}</span>
           </button>
        ))}
      </div>
      
      <div className="p-4 border border-gray-200 rounded-lg bg-white">
        <h3 className="text-lg font-semibold text-gray-800">{currentTool.title}</h3>
        <p className="text-sm text-gray-600 mt-1">{currentTool.description}</p>
        
        <div className="mt-4 space-y-4">
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder={currentTool.placeholder}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-shadow"
            rows={4}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt}
            className="flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-amber-600 disabled:bg-gray-300 transition-colors"
          >
            {isLoading ? <><Spinner /> Processing...</> : 'Submit'}
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700">Results</h3>
        <div className="w-full mt-2 bg-gray-50 rounded-lg p-4 min-h-[15rem] border border-gray-200">
            {isLoading && <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && !error && !result && !groundingResult && <p className="text-gray-500">Results will appear here.</p>}
            {result && <p className="text-gray-800 whitespace-pre-wrap">{result}</p>}
            {groundingResult && (
              <div className="space-y-4">
                <p className="text-gray-800 whitespace-pre-wrap">{groundingResult.text}</p>
                {groundingResult.chunks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-gray-600 mb-2">Sources:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {groundingResult.chunks.map((chunk, index) => (
                        <li key={index} className="text-sm">
                           <a href={chunk.web?.uri || chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                            {chunk.web?.title || chunk.maps?.title || 'Source link'}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default ResearchHub;
