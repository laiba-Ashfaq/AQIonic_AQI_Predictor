import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  User, 
  Sparkles, 
  Wind, 
  Thermometer, 
  Droplets, 
  ShieldCheck, 
  AlertTriangle, 
  MapPin, 
  RefreshCw,
  Copy,
  Check,
  Search,
  MessageSquare
} from 'lucide-react';
import { CityLocation, FetchResult } from '../types/aqi';
import { SAMPLE_CITIES } from '../data/sampleCities';
import { fetchLiveCityAQI, searchCities, getCategoryInfo } from '../services/airQualityService';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  cityData?: FetchResult;
  comparisonData?: FetchResult[];
  quickPrompt?: string;
}

interface AICopilotProps {
  onSelectCity?: (city: CityLocation) => void;
}

export const AICopilot: React.FC<AICopilotProps> = ({ onSelectCity }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: "Hello! I am **AQIonic AI Copilot**, your real-time atmospheric intelligence & AQI assistant. Ask me anything like: \n• *'What is the weather in Lahore?'*\n• *'What is the AQI value of Karachi?'*\n• *'Is air quality safe in Islamabad today?'*\n• *'Compare weather in Lahore and Multan'*",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    "What is the weather in Lahore?",
    "What is the AQI value of Karachi?",
    "Is AQI bad in Islamabad right now?",
    "Compare weather in Lahore and Karachi",
    "What is the weather and PM2.5 in Multan?",
    "Can I exercise outdoors in Lahore today?",
    "What is the AQI value of London?"
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  // Helper to extract city names from user prompt
  const findMentionedCities = async (prompt: string): Promise<CityLocation[]> => {
    const lower = prompt.toLowerCase();
    const found: CityLocation[] = [];

    // Check predefined sample cities first
    for (const city of SAMPLE_CITIES) {
      if (lower.includes(city.name.toLowerCase()) || lower.includes(city.id)) {
        found.push(city);
      }
    }

    // If no sample city found, use Open-Meteo geocoding search for dynamic queries
    if (found.length === 0) {
      // Remove common words to isolate potential city names
      const words = prompt.replace(/[^\w\s]/gi, '').split(/\s+/).filter(w => w.length > 2);
      for (const word of words) {
        if (['what', 'weather', 'aqi', 'city', 'value', 'today', 'lahore', 'karachi', 'compare', 'safe', 'good', 'bad'].includes(word.toLowerCase())) continue;
        const searchResults = await searchCities(word);
        if (searchResults.length > 0) {
          found.push(searchResults[0]);
          break;
        }
      }
    }

    return found;
  };

  const handleSendQuery = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isProcessing) return;

    const userMsgId = `user-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    if (!queryText) setInputQuery('');
    setIsProcessing(true);

    try {
      // Detect cities mentioned in prompt
      const detectedCities = await findMentionedCities(textToSend);
      const isComparison = textToSend.toLowerCase().includes('compare') || detectedCities.length > 1;

      if (detectedCities.length > 0) {
        if (isComparison && detectedCities.length >= 2) {
          // Fetch data for multiple cities
          const results = await Promise.all(detectedCities.slice(0, 3).map(c => fetchLiveCityAQI(c)));
          const replyText = generateComparisonResponse(textToSend, results);
          
          setMessages(prev => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              comparisonData: results
            }
          ]);
        } else {
          // Fetch data for single detected city
          const targetCity = detectedCities[0];
          const cityData = await fetchLiveCityAQI(targetCity);
          const replyText = generateSingleCityResponse(textToSend, cityData);

          setMessages(prev => [
            ...prev,
            {
              id: `asst-${Date.now()}`,
              sender: 'assistant',
              text: replyText,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              cityData
            }
          ]);
        }
      } else {
        // Fallback for general AQI / atmospheric questions
        const fallbackText = generateGeneralResponse(textToSend);
        setMessages(prev => [
          ...prev,
          {
            id: `asst-${Date.now()}`,
            sender: 'assistant',
            text: fallbackText,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
    } catch (error) {
      console.error('Copilot processing error:', error);
      setMessages(prev => [
        ...prev,
        {
          id: `asst-err-${Date.now()}`,
          sender: 'assistant',
          text: "I encountered a minor network issue fetching live telemetry. Please try asking again or check your connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSingleCityResponse = (prompt: string, data: FetchResult): string => {
    const { city, currentAQI, weather, pollutants } = data;
    const catInfo = getCategoryInfo(currentAQI);
    const pm25 = pollutants.find(p => p.code === 'PM2.5')?.value || 25;
    const lower = prompt.toLowerCase();

    if (lower.includes('weather')) {
      return `Here is the current weather & atmospheric report for **${city.name}, ${city.country}**:\n\n` +
        `• **Temperature:** ${weather.temperature}°C\n` +
        `• **Humidity:** ${weather.humidity}%\n` +
        `• **Wind Speed:** ${weather.windSpeed} km/h\n` +
        `• **AQI Level:** ${currentAQI} (${catInfo.name})\n` +
        `• **PM2.5 Concentration:** ${pm25} µg/m³\n\n` +
        `*Atmospheric Summary:* ${catInfo.description}`;
    }

    if (lower.includes('exercise') || lower.includes('jog') || lower.includes('safe') || lower.includes('outdoor')) {
      const isSafe = currentAQI <= 100;
      return `**Health & Outdoor Safety Advisory for ${city.name}:**\n\n` +
        `Current AQI is **${currentAQI}** (*${catInfo.name}*).\n\n` +
        `${isSafe ? '✅ **Safe for outdoor activities!** Air pollution levels are acceptable.' : '⚠️ **Caution Recommended:** Air quality is currently elevated.'}\n\n` +
        `• **PM2.5 Level:** ${pm25} µg/m³\n` +
        `• **Recommendation:** ${catInfo.healthImplications}\n` +
        `• **Key Caution:** ${catInfo.cautionaryStatement}`;
    }

    return `The current AQI value for **${city.name}, ${city.country}** is **${currentAQI}** (*${catInfo.name}*).\n\n` +
      `**Live Telemetry Overview:**\n` +
      `• **PM2.5:** ${pm25} µg/m³\n` +
      `• **Temperature:** ${weather.temperature}°C\n` +
      `• **Humidity:** ${weather.humidity}%\n` +
      `• **Wind Velocity:** ${weather.windSpeed} km/h\n\n` +
      `*Health Advice:* ${catInfo.description}`;
  };

  const generateComparisonResponse = (prompt: string, list: FetchResult[]): string => {
    let text = `Here is the live atmospheric comparison between **${list.map(l => l.city.name).join(' & ')}**:\n\n`;
    list.forEach(item => {
      const cat = getCategoryInfo(item.currentAQI);
      text += `📍 **${item.city.name}:** AQI **${item.currentAQI}** (${cat.name}) | Temp: ${item.weather.temperature}°C | PM2.5: ${item.pollutants.find(p => p.code==='PM2.5')?.value} µg/m³\n`;
    });

    const cleanest = [...list].sort((a, b) => a.currentAQI - b.currentAQI)[0];
    const highest = [...list].sort((a, b) => b.currentAQI - a.currentAQI)[0];

    text += `\n🏆 **Cleanest Air:** ${cleanest.city.name} (${cleanest.currentAQI} AQI)\n` +
      `⚠️ **Highest AQI:** ${highest.city.name} (${highest.currentAQI} AQI)`;

    return text;
  };

  const generateGeneralResponse = (prompt: string): string => {
    return `I can help you analyze AQI levels, PM2.5 concentrations, and weather forecasts for **Lahore, Karachi, Islamabad, Multan, Faisalabad**, or any city worldwide!\n\n` +
      `Try asking:\n` +
      `• *"What is weather in Lahore?"*\n` +
      `• *"What is AQI of Karachi?"*\n` +
      `• *"Is AQI bad in Islamabad today?"*`;
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-6">
      
      {/* Header Banner */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#1D4B59] text-white flex items-center justify-center shadow-xs">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-[#102B33] uppercase tracking-tight flex items-center gap-2">
                AQIonic AI Copilot Chatbot
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300">
                  <Sparkles className="w-3 h-3 text-sky-600" />
                  Instant Q&A Engine
                </span>
              </h2>
              <p className="text-xs text-slate-600 mt-0.5">
                Ask instant questions about weather in Lahore, AQI values in Karachi, Islamabad, or any city worldwide.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Suggested Quick Prompt Chips */}
      <div className="bg-white border border-[#CFDDE7] rounded-2xl p-4 shadow-xs">
        <div className="text-xs font-bold text-[#102B33] mb-2.5 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-[#1D4B59]" />
          Suggested Quick Questions (Click to Ask):
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendQuery(prompt)}
              disabled={isProcessing}
              className="px-3.5 py-1.5 rounded-xl bg-[#F0F5F8] hover:bg-[#E3EFF4] border border-[#CFDDE7] text-xs font-semibold text-[#102B33] hover:text-[#1D4B59] transition-all disabled:opacity-50 text-left shadow-2xs"
            >
              💬 {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Main Chat Interface Container */}
      <div className="bg-white border border-[#CFDDE7] rounded-[28px] shadow-sm flex flex-col h-[560px] overflow-hidden">
        
        {/* Chat Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-5 bg-[#F8FAFC]">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-3xl ${isUser ? 'ml-auto flex-row-reverse' : ''}`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 text-white font-bold text-xs shadow-xs ${
                    isUser ? 'bg-[#102B33]' : 'bg-[#1D4B59]'
                  }`}
                >
                  {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Bubble */}
                <div className={`space-y-2 max-w-xl ${isUser ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-4 rounded-2xl text-xs leading-relaxed shadow-xs transition-all ${
                      isUser
                        ? 'bg-[#1D4B59] text-white font-medium rounded-tr-xs'
                        : 'bg-white border border-[#CFDDE7] text-[#102B33] rounded-tl-xs'
                    }`}
                  >
                    {/* Rendered Text */}
                    <div className="whitespace-pre-line">
                      {msg.text.split('\n').map((line, lIdx) => {
                        // Highlight bold formatting
                        if (line.includes('**')) {
                          const parts = line.split('**');
                          return (
                            <div key={lIdx} className="my-0.5">
                              {parts.map((p, pIdx) =>
                                pIdx % 2 === 1 ? (
                                  <strong key={pIdx} className={isUser ? 'text-sky-200' : 'text-[#1D4B59] font-bold'}>{p}</strong>
                                ) : (
                                  p
                                )
                              )}
                            </div>
                          );
                        }
                        return <div key={lIdx} className="my-0.5">{line}</div>;
                      })}
                    </div>

                    {/* Single City Telemetry Badge Card inside Assistant Message */}
                    {msg.cityData && (
                      <div className="mt-3.5 pt-3 border-t border-[#E2ECF2] bg-[#F0F5F8] p-3 rounded-xl space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#102B33] flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#1D4B59]" />
                            {msg.cityData.city.name}, {msg.cityData.city.country}
                          </span>
                          <span
                            className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: getCategoryInfo(msg.cityData.currentAQI).color }}
                          >
                            AQI {msg.cityData.currentAQI} • {getCategoryInfo(msg.cityData.currentAQI).name}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-[11px] font-medium text-slate-700">
                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">Temp</span>
                            <span className="font-bold text-[#102B33]">{msg.cityData.weather.temperature}°C</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">Humidity</span>
                            <span className="font-bold text-[#102B33]">{msg.cityData.weather.humidity}%</span>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200 text-center">
                            <span className="text-[10px] text-slate-500 block">Wind</span>
                            <span className="font-bold text-[#102B33]">{msg.cityData.weather.windSpeed} km/h</span>
                          </div>
                        </div>

                        {onSelectCity && (
                          <button
                            onClick={() => onSelectCity(msg.cityData!.city)}
                            className="w-full mt-1.5 py-1.5 bg-[#1D4B59] hover:bg-[#163C47] text-white text-[11px] font-bold rounded-lg transition-colors flex items-center justify-center gap-1"
                          >
                            <Search className="w-3 h-3" />
                            Open Full Dashboard for {msg.cityData.city.name}
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Message Timestamp & Actions */}
                  <div className={`flex items-center gap-2 text-[10px] text-slate-400 font-medium ${isUser ? 'justify-end' : ''}`}>
                    <span>{msg.timestamp}</span>
                    {!isUser && (
                      <button
                        onClick={() => handleCopy(msg.text, msg.id)}
                        className="hover:text-slate-600 flex items-center gap-1 transition-colors"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-600 font-bold">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Loading Indicator */}
          {isProcessing && (
            <div className="flex gap-3 max-w-xl">
              <div className="w-9 h-9 rounded-2xl bg-[#1D4B59] text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-white border border-[#CFDDE7] p-4 rounded-2xl rounded-tl-xs text-xs text-slate-600 flex items-center gap-2.5 shadow-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-[#1D4B59]" />
                <span className="font-semibold text-[#102B33]">Analyzing atmospheric telemetry & live weather...</span>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-white border-t border-[#CFDDE7]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendQuery();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Ask anything (e.g. 'what is weather in lahore', 'aqi value of karachi')..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              disabled={isProcessing}
              className="flex-1 px-4 py-3 bg-[#F0F5F8] border border-[#CFDDE7] rounded-2xl text-xs font-medium text-[#102B33] placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1D4B59] transition-all"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isProcessing}
              className="px-5 py-3 bg-[#1D4B59] hover:bg-[#163C47] text-white rounded-2xl font-bold text-xs flex items-center gap-2 transition-all disabled:opacity-50 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Ask Copilot</span>
            </button>
          </form>
        </div>

      </div>

    </div>
  );
};
