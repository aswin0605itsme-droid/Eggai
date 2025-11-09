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
      description: 'Ask complex questions. The AI will use an advanced model with extended thinking time for a deeper analysis.',
      placeholder: 'e.g., Explain the statistical significance of the ROC curve in Figure 5 of a typical poultry science paper.',
      icon: <BrainCircuitIcon className="w-5 h-5" />,
    },
    web: {
      title: 'Web Search',
      description: 'Get up-to-date information on chick sexing technologies, news, and recent studies.',
      placeholder: 'e.g., Latest advancements in in-ovo chick sexing technology.',
      icon: <SearchIcon className="w-5 h-5" />,
    },
    maps: {
      title: 'Find Places',
      description: 'Find poultry farms or hatcheries near you. Requires location permission.',
      placeholder: 'e.g., Poultry farms near me.',
      icon: <MapPinIcon className="w-5 h-5" />,
    },
    video: {
      title: 'Video Concept',
      description: 'Enter a video topic. The AI will provide a conceptual summary of the content.',
      placeholder: 'e.g., Documentary on ethical poultry farming.',
      icon: <VideoIcon className="w-5 h-5" />,
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
              try {
                const { latitude, longitude } = position.coords;
                const mapsRes = await searchMaps(prompt, { latitude, longitude });
                setGroundingResult({
                  text: mapsRes.text,
                  chunks: mapsRes.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
                });
              } catch(err) {
                 setError('Could not retrieve map data. Please try again.');
                 console.error(err);
              }
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
    <div className="space-y-6 animate-fade-in">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-slate-800">AI Research Hub</h2>
        <p className="text-slate-600 mt-2 max-w-2xl mx-auto">
            Leverage AI-powered tools for deep research, web searches, and content analysis.
        </p>
      </div>
     
      <div className="flex flex-wrap gap-2 p-2 bg-slate-200/50 rounded-xl">
        {(Object.keys(toolConfig) as ResearchTool[]).map(tool => (
           <button
            key={tool}
            onClick={() => { setActiveTool(tool); resetState(); setPrompt('') }}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 ${
              activeTool === tool ? 'bg-white text-amber-600 shadow-sm' : 'bg-transparent text-slate-600 hover:bg-white/50'
            }`}
          >
            {toolConfig[tool].icon}
            <span className="capitalize">{tool}</span>
           </button>
        ))}
      </div>
      
      <div className="p-6 bg-white rounded-xl border border-slate-200">
        <h3 className="text-lg font-semibold text-slate-800">{currentTool.title}</h3>
        <p className="text-sm text-slate-600 mt-1">{currentTool.description}</p>
        
        <div className="mt-4 space-y-4">
          <textarea
            value={prompt}
            onChange={handlePromptChange}
            placeholder={currentTool.placeholder}
            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 transition"
            rows={4}
          />
          <button
            onClick={handleSubmit}
            disabled={isLoading || !prompt}
            className="w-auto flex items-center justify-center gap-2 bg-amber-500 text-white font-bold py-2 px-5 rounded-lg hover:bg-amber-600 disabled:bg-slate-300 transition-colors"
          >
            {isLoading ? <><Spinner /> Processing...</> : 'Submit'}
          </button>
        </div>
      </div>
      
      <div className="mt-6">
        <h3 className="text-lg font-semibold text-slate-700">Results</h3>
        <div className="w-full mt-2 bg-white rounded-xl p-4 min-h-[15rem] border border-slate-200 shadow-sm">
            {isLoading && <div className="flex justify-center items-center h-full"><Spinner size="lg" /></div>}
            {error && <p className="text-red-500">{error}</p>}
            {!isLoading && !error && !result && !groundingResult && <p className="text-slate-500">Results will appear here.</p>}
            {result && <div className="text-slate-800 whitespace-pre-wrap prose prose-sm">{result}</div>}
            {groundingResult && (
              <div className="space-y-4 prose prose-sm max-w-none">
                <p className="text-slate-800 whitespace-pre-wrap">{groundingResult.text}</p>
                {groundingResult.chunks.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-sm text-slate-600 mb-2">Sources:</h4>
                    <ul className="list-disc list-inside space-y-1">
                      {groundingResult.chunks.map((chunk, index) => (
                        (chunk.web?.uri || chunk.maps?.uri) && (
                          <li key={index} className="text-sm">
                            <a href={chunk.web?.uri || chunk.maps?.uri} target="_blank" rel="noopener noreferrer" className="text-amber-600 hover:underline">
                              {chunk.web?.title || chunk.maps?.title || 'Source link'}
                            </a>
                          </li>
                        )
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
