import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { evaluate } from 'mathjs';

// Calculator Tool
export const calculatorTool = tool(
  async ({ expression }) => {
    try {
      // Safely evaluate math expression
      const result = evaluate(expression);
      return String(result);
    } catch (error) {
      return `Error evaluating expression: ${error.message}`;
    }
  },
  {
    name: "calculator",
    description: "Useful for performing mathematical calculations. Input should be a valid mathematical expression string (e.g. '2 + 2 * 5').",
    schema: z.object({
      expression: z.string().describe("The mathematical expression to evaluate"),
    }),
  }
);

// Weather Tool
export const weatherTool = tool(
  async ({ location }) => {
    const apiKey = process.env.WEATHER_API_KEY;
    if (!apiKey || apiKey === "your_weather_api_key_here") {
      // Mock Weather
      const mockWeathers = {
        "london": "18°C, Cloudy with light rain, Humidity: 80%, Wind: 12km/h",
        "new york": "28°C, Sunny and clear, Humidity: 45%, Wind: 8km/h",
        "tokyo": "24°C, Humid and partially cloudy, Humidity: 70%, Wind: 10km/h",
        "delhi": "36°C, Hot and dry, Humidity: 30%, Wind: 15km/h",
        "mumbai": "30°C, Heavy monsoon rain, Humidity: 90%, Wind: 20km/h"
      };
      const normalized = location.toLowerCase();
      const match = Object.keys(mockWeathers).find(k => normalized.includes(k)) || "london";
      return `[Mock Data] The weather in ${location} is currently ${mockWeathers[match]}.`;
    }

    try {
      const response = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=metric&appid=${apiKey}`);
      if (!response.ok) {
        throw new Error(`OpenWeather API error: ${response.statusText}`);
      }
      const data = await response.json();
      return `The current weather in ${data.name}, ${data.sys.country} is ${data.main.temp}°C, description: ${data.weather[0].description}. Humidity is ${data.main.humidity}% and wind speed is ${data.wind.speed} m/s.`;
    } catch (error) {
      return `Error fetching weather for ${location}: ${error.message}`;
    }
  },
  {
    name: "weather",
    description: "Useful for getting the current weather info for a specific city or location.",
    schema: z.object({
      location: z.string().describe("The city or location to get weather for"),
    }),
  }
);

// Web Search Tool (Tavily/Mock)
export const webSearchTool = tool(
  async ({ query }) => {
    const apiKey = process.env.TAVILY_API_KEY;
    if (!apiKey || apiKey === "your_tavily_api_key_here" || !apiKey) {
      return `[Mock Search] Searched for "${query}". Results:
1. WebSockets enable high-performance real-time messaging.
2. LangChain provides excellent orchestrations for LLMs and tools.
3. BullMQ allows running AI generations out-of-band to prevent HTTP blocking.`;
    }

    try {
      const response = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          api_key: apiKey,
          query: query,
          search_depth: "basic",
          max_results: 3
        })
      });
      if (!response.ok) {
        throw new Error(`Tavily API error: ${response.statusText}`);
      }
      const data = await response.json();
      const results = data.results.map((r, idx) => `${idx + 1}. [${r.title}](${r.url}): ${r.content}`).join("\n\n");
      return results || "No search results found.";
    } catch (error) {
      return `Error performing web search for "${query}": ${error.message}`;
    }
  },
  {
    name: "web_search",
    description: "Useful for performing general web searches to find up-to-date information on current events, news, or general knowledge questions.",
    schema: z.object({
      query: z.string().describe("The search query to execute"),
    }),
  }
);

// Export all tools
export const tools = [calculatorTool, weatherTool, webSearchTool];
