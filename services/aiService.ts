import { GoogleGenAI, Type } from "@google/genai";
import { Book, Chapter, ChapterImportance, BookType, AdventureBookRequest, ChapterLength, Milestone, GeminiModel, ContinuationBookRequest, AIProvider, PuterModel } from "../types";
import { 
    DEFAULT_RESEARCH_PROMPT, 
    DEFAULT_WRITING_TEMPLATE, 
    DEFAULT_REGENERATE_TEMPLATE,
    GEMINI_TEXT_MODELS,
    OPENROUTER_TEXT_MODELS,
    ANTHROPIC_TEXT_MODELS,
    OPENAI_TEXT_MODELS,
    DEEPSEEK_TEXT_MODELS,
    GROQ_TEXT_MODELS,
    GROK_TEXT_MODELS,
    MISTRAL_TEXT_MODELS
} from "../constants";
import { downloadDevLog } from "./exportService";

declare const puter: any;

const getDevSetting = (key: string) => localStorage.getItem(key) === 'true';
const getInstruction = (key: string, defaultVal: string) => localStorage.getItem(key) || defaultVal;

const getProvider = (): AIProvider => (localStorage.getItem('storyspark-ai-provider') as AIProvider) || AIProvider.Puter;

const getSelectedModel = (provider: AIProvider): string => {
    switch (provider) {
        case AIProvider.Gemini: return localStorage.getItem('storyspark-gemini-model') || 'gemini-3-flash-preview';
        case AIProvider.Puter: return localStorage.getItem('storyspark-puter-model') || 'google/gemini-3-pro-preview';
        case AIProvider.OpenRouter: return localStorage.getItem('storyspark-openrouter-model') || 'google/gemini-2.0-flash-001';
        case AIProvider.Anthropic: return localStorage.getItem('storyspark-anthropic-model') || 'claude-3-5-sonnet-latest';
        case AIProvider.OpenAI: return localStorage.getItem('storyspark-openai-model') || 'gpt-4o';
        case AIProvider.DeepSeek: return localStorage.getItem('storyspark-deepseek-model') || 'deepseek-chat';
        case AIProvider.Groq: return localStorage.getItem('storyspark-groq-model') || 'llama3-70b-8192';
        case AIProvider.Cerebras: return localStorage.getItem('storyspark-cerebras-model') || 'llama3.1-8b';
        case AIProvider.Grok: return localStorage.getItem('storyspark-grok-model') || 'grok-beta';
        case AIProvider.Mistral: return localStorage.getItem('storyspark-mistral-model') || 'mistral-large-latest';
        case AIProvider.Custom: return localStorage.getItem('storyspark-custom-ai-model') || '';
        default: return '';
    }
};

const getApiKey = (provider: AIProvider): string => {
    switch (provider) {
        case AIProvider.Gemini: return localStorage.getItem('storyspark-custom-gemini-key') || '';
        case AIProvider.OpenRouter: return localStorage.getItem('storyspark-openrouter-key') || '';
        case AIProvider.Anthropic: return localStorage.getItem('storyspark-anthropic-key') || '';
        case AIProvider.OpenAI: return localStorage.getItem('storyspark-openai-key') || '';
        case AIProvider.DeepSeek: return localStorage.getItem('storyspark-deepseek-key') || '';
        case AIProvider.Groq: return localStorage.getItem('storyspark-groq-key') || '';
        case AIProvider.Cerebras: return localStorage.getItem('storyspark-cerebras-key') || '';
        case AIProvider.Grok: return localStorage.getItem('storyspark-grok-key') || '';
        case AIProvider.Mistral: return localStorage.getItem('storyspark-mistral-key') || '';
        case AIProvider.Custom: return localStorage.getItem('storyspark-custom-ai-key') || '';
        default: return '';
    }
};

const getBaseUrl = (provider: AIProvider): string => {
    switch (provider) {
        case AIProvider.OpenRouter: return 'https://openrouter.ai/api/v1';
        case AIProvider.Anthropic: return 'https://api.anthropic.com/v1';
        case AIProvider.OpenAI: return 'https://api.openai.com/v1';
        case AIProvider.DeepSeek: return 'https://api.deepseek.com';
        case AIProvider.Groq: return 'https://api.groq.com/openai/v1';
        case AIProvider.Cerebras: return 'https://api.cerebras.ai/v1';
        case AIProvider.Grok: return 'https://api.x.ai/v1';
        case AIProvider.Mistral: return 'https://api.mistral.ai/v1';
        case AIProvider.Custom: return localStorage.getItem('storyspark-custom-ai-endpoint') || '';
        default: return '';
    }
};

const fillTemplate = (template: string, data: Record<string, string>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || '';
    });
};

const handleDevOutput = (prompt: string, response: string, providerName: string) => {
    if (getDevSetting('storyspark-dev-log-console')) {
        console.group(`StorySpark AI Request (${providerName})`);
        console.log("%cModel:", "color: #f59e0b; font-weight: bold;", getSelectedModel(getProvider()));
        console.log("%cPrompt:", "color: #f59e0b; font-weight: bold;", prompt);
        console.log("%cResponse:", "color: #10b981; font-weight: bold;", response);
        console.groupEnd();
    }
    if (getDevSetting('storyspark-dev-download')) {
        downloadDevLog(prompt, response, providerName);
    }
};

async function* streamOpenAI(baseUrl: string, apiKey: string, model: string, systemPrompt: string, userPrompt: string, providerName: string) {
    const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://storyspark.ai', // For OpenRouter
            'X-Title': 'StorySpark', // For OpenRouter
        },
        body: JSON.stringify({
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt }
            ],
            stream: true,
            temperature: 0.9,
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`AI Provider Error: ${response.status} ${err}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) throw new Error("Failed to get reader from response body");

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                const data = line.slice(6);
                if (data === '[DONE]') break;
                try {
                    const json = JSON.parse(data);
                    const text = json.choices[0]?.delta?.content || '';
                    if (text) {
                        fullResponse += text;
                        yield text;
                    }
                } catch (e) {
                    // Ignore parse errors for partial chunks
                }
            }
        }
    }
    handleDevOutput(`SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}`, fullResponse, providerName);
}

async function* streamAnthropic(apiKey: string, model: string, systemPrompt: string, userPrompt: string) {
    // Anthropic usually needs a proxy or specific headers that might fail in browser due to CORS
    // Many users use Anthropic via OpenRouter to avoid this.
    // But let's try a direct implementation if possible.
    const response = await fetch(`https://api.anthropic.com/v1/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true' // Required for browser
        },
        body: JSON.stringify({
            model: model,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
            stream: true,
            max_tokens: 4096,
            temperature: 0.9,
        })
    });

    if (!response.ok) {
        const err = await response.text();
        throw new Error(`Anthropic Error: ${response.status} ${err}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let fullResponse = '';

    if (!reader) throw new Error("Failed to get reader from response body");

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
            if (line.startsWith('data: ')) {
                try {
                    const json = JSON.parse(line.slice(6));
                    if (json.type === 'content_block_delta') {
                        const text = json.delta.text;
                        fullResponse += text;
                        yield text;
                    }
                } catch (e) {}
            }
        }
    }
    handleDevOutput(`SYSTEM: ${systemPrompt}\n\nUSER: ${userPrompt}`, fullResponse, 'Anthropic');
}

export async function* generateResearchSummaryStream(series: string, plot: string, crossovers: string[]) {
    const provider = getProvider();
    const model = getSelectedModel(provider);
    const apiKey = getApiKey(provider);
    const baseInstruction = getInstruction('storyspark-sys-prompt-research', DEFAULT_RESEARCH_PROMPT);
    
    const systemPrompt = baseInstruction;
    const userPrompt = `Primary Subject: "${series}"
    Crossover Subjects: ${crossovers.join(', ') || 'None'}
    User's Story Context: "${plot}"`;

    if (provider === AIProvider.Gemini) {
        const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
        const result = await genAI.getGenerativeModel({ model }).generateContentStream({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
        });
        let fullResponse = '';
        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            yield text;
        }
        handleDevOutput(userPrompt, fullResponse, 'Gemini');
    } else if (provider === AIProvider.Puter) {
        const response = await puter.ai.chat(`${systemPrompt}\n\n${userPrompt}`, { model, stream: true });
        let fullResponse = '';
        for await (const chunk of response) {
            fullResponse += chunk.text;
            yield chunk.text;
        }
        handleDevOutput(userPrompt, fullResponse, 'Puter');
    } else if (provider === AIProvider.Anthropic) {
        yield* streamAnthropic(apiKey, model, systemPrompt, userPrompt);
    } else {
        yield* streamOpenAI(getBaseUrl(provider), apiKey, model, systemPrompt, userPrompt, provider);
    }
}

export async function* writeChapterStream(book: Book, userPrompt: string) {
    const provider = getProvider();
    const model = getSelectedModel(provider);
    const apiKey = getApiKey(provider);
    
    const currentChapterIndex = book.chapters.length;
    const lastChapters = book.chapters.slice(-3);
    const context = lastChapters.map((c, i) => `[TURN ${book.chapters.length - lastChapters.length + i + 1} CONTENT]:\n${c.content}`).join('\n\n');
    const isAdventure = book.request.type === BookType.Adventure;
    const isFanFic = book.request.type === BookType.Continuation;
    
    const lengthMap = {
        [ChapterLength.Short]: "concisely (~300-500 words)",
        [ChapterLength.Medium]: "with standard detail (~800-1200 words)",
        [ChapterLength.Long]: "with deep descriptive detail (~1500-2500 words)",
        [ChapterLength.ExtraLong]: "with extreme immersive detail and internal monologues (~3000+ words)"
    };
    const targetLength = lengthMap[book.request.chapterLength] || lengthMap[ChapterLength.Medium];

    const currentMilestone = book.milestones?.find(m => m.chapterIndex === currentChapterIndex + 1);
    const upcomingMilestones = book.milestones?.filter(m => m.chapterIndex > currentChapterIndex + 1).slice(0, 2);

    const persona = isAdventure ? (book.request as AdventureBookRequest).persona : null;
    const traits = persona?.activeTraits?.join(', ') || 'Standard Protagonist';
    const memories = persona?.unlockedMemories?.join('\n- ') || 'None yet';

    const style = book.request.stylePreset || 'default';
    let styleInstruction = "Maintain a professional, engaging narrative tone.";
    
    if (book.request.customAuthor?.trim()) {
        styleInstruction = `CRITICAL STYLE RULE: You must aggressively mimic the writing style, vocabulary, dialogue rhythm, and prose quirks of ${book.request.customAuthor.trim()}. Do not write in a generic AI tone. Write exactly like ${book.request.customAuthor.trim()}.`;
    } else {
        if (style === 'aperture') styleInstruction = "Adopt the 'Aperture Science' voice: snarky, clinical, darkly humorous, passive-aggressive, and scientific. Use technical jargon.";
        else if (style === 'epic_fantasy') styleInstruction = "Adopt an 'Epic Fantasy' voice: elevated, descriptive, formal, and legendary. Focus on world-building and myth.";
        else if (style === 'noir') styleInstruction = "Adopt a 'Hardboiled Noir' voice: cynical, gritty, world-weary. Use short, punchy sentences and heavy atmosphere.";
        else if (style === 'literary') styleInstruction = "Adopt a 'Literary' voice: poetic, metaphor-heavy, focus on internal states and complex monologues.";
        else if (style === 'action') styleInstruction = "Adopt a 'Cinematic Action' voice: fast-paced, visceral, present-tense focused, and punchy.";
    }

    let fanFicContext = "";
    let mediaType = "Original Work";
    
    if (isFanFic) {
        const fanReq = book.request as ContinuationBookRequest;
        fanFicContext = fanReq.fanFicContext || "Sequel";
        mediaType = fanReq.mediaType || "Book";
        if (!book.request.customAuthor?.trim()) {
            styleInstruction += `\n- As this is a fan fiction based on a ${mediaType}, adopt the specific tone and atmosphere of the original source material.`;
        }
    }

    const modeInstruction = isAdventure ? `
    RPG MODE:
    - PERSPECTIVE: Always use Second Person ("You").
    - PLAYER CHARACTER: ${persona?.name} (Traits: ${traits}).
    - UNLOCKED MEMORIES:
    ${memories}
    - CURRENT STATS: ${book.gameState ? `HP: ${book.gameState.hp}/${book.gameState.maxHp}, Location: ${book.gameState.location}, Items: ${book.gameState.inventory.join(', ')}` : 'Default Stats'}
    - GM RULE: NEVER speak or act for "You". End with "What do you do?"
    ` : `
    NOVELIST MODE:
    - PERSPECTIVE: Third Person Limited.
    `;

    const template = getInstruction('storyspark-sys-template-writing', DEFAULT_WRITING_TEMPLATE);
    const variables: Record<string, string> = {
        title: book.title || 'Untitled',
        chapterIndex: (currentChapterIndex + 1).toString(),
        milestoneInstruction: currentMilestone ? `!!! MANDATORY MILESTONE FOR THIS CHAPTER: ${currentMilestone.description} !!!` : '',
        upcomingMilestones: upcomingMilestones && upcomingMilestones.length > 0 ? `LOOKING AHEAD (Do not spoil, but begin foreshadowing these if logical): ${upcomingMilestones.map(m => `Ch ${m.chapterIndex}: ${m.description}`).join('; ')}` : '',
        styleInstruction,
        targetLength,
        plot: book.request.plot,
        modeInstruction,
        researchSummary: book.researchSummary || 'Original universe logic applies.',
        userNotes: book.userNotes || 'No specific style notes.',
        longTermGoals: book.longTermGoals || 'No long term goals specified.',
        fanFicContext,
        mediaType
    };

    const systemInstruction = fillTemplate(template, variables);

    const prompt = `WRITER INPUT: ${userPrompt || 'Continue the scene.'}

TASK: Write Segment ${currentChapterIndex + 1}. 
FOLLOW-UP RULE: Start IMMEDIATELY from the last line of the PREVIOUS CONTEXT. Do NOT re-describe anything that was established. Do NOT repeat dialogue. Move forward in time.

PREVIOUS CONTEXT (Narrative Stream):
${context || 'This is the start of the book.'}`;

    if (provider === AIProvider.Gemini) {
        const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
        const result = await genAI.getGenerativeModel({ model }).generateContentStream({
            systemInstruction,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9 }
        });
        let fullResponse = '';
        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            yield text;
        }
        handleDevOutput(`SYSTEM: ${systemInstruction}\n\nUSER: ${prompt}`, fullResponse, 'Gemini');
    } else if (provider === AIProvider.Puter) {
        const fullPrompt = `SYSTEM: ${systemInstruction}\n\n${prompt}`;
        const response = await puter.ai.chat(fullPrompt, { model, stream: true });
        let fullResponse = '';
        for await (const chunk of response) {
            fullResponse += chunk.text;
            yield chunk.text;
        }
        handleDevOutput(fullPrompt, fullResponse, 'Puter');
    } else if (provider === AIProvider.Anthropic) {
        yield* streamAnthropic(apiKey, model, systemInstruction, prompt);
    } else {
        yield* streamOpenAI(getBaseUrl(provider), apiKey, model, systemInstruction, prompt, provider);
    }
}

export async function* regenerateChapterStream(book: Book, chapterIndex: number, instructions: string) {
    const provider = getProvider();
    const model = getSelectedModel(provider);
    const apiKey = getApiKey(provider);

    const chapter = book.chapters[chapterIndex];
    const contextBefore = book.chapters.slice(0, chapterIndex).map(c => c.content).join('\n\n');
    
    const template = getInstruction('storyspark-sys-template-regenerate', DEFAULT_REGENERATE_TEMPLATE);
    const variables: Record<string, string> = {
        chapterIndex: (chapterIndex + 1).toString(),
        researchSummary: book.researchSummary || 'N/A',
        plot: book.request.plot
    };

    const systemInstruction = fillTemplate(template, variables);

    const prompt = `Target Segment Content:
    ${chapter.content}
    
    Correction Instructions: ${instructions}
    
    Context leading up to this:
    ${contextBefore || 'No context (Chapter 1)'}`;

    if (provider === AIProvider.Gemini) {
        const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
        const result = await genAI.getGenerativeModel({ model }).generateContentStream({
            systemInstruction,
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.9 }
        });
        let fullResponse = '';
        for await (const chunk of result.stream) {
            const text = chunk.text();
            fullResponse += text;
            yield text;
        }
        handleDevOutput(`SYSTEM: ${systemInstruction}\n\nUSER: ${prompt}`, fullResponse, 'Gemini');
    } else if (provider === AIProvider.Puter) {
        const fullPrompt = `SYSTEM: ${systemInstruction}\n\n${prompt}`;
        const response = await puter.ai.chat(fullPrompt, { model, stream: true });
        let fullResponse = '';
        for await (const chunk of response) {
            fullResponse += chunk.text;
            yield chunk.text;
        }
        handleDevOutput(fullPrompt, fullResponse, 'Puter');
    } else if (provider === AIProvider.Anthropic) {
        yield* streamAnthropic(apiKey, model, systemInstruction, prompt);
    } else {
        yield* streamOpenAI(getBaseUrl(provider), apiKey, model, systemInstruction, prompt, provider);
    }
}

export async function refactorChapters(book: Book, instruction: string): Promise<{ index: number, content: string }[]> {
    const provider = getProvider();
    const model = getSelectedModel(provider);
    const apiKey = getApiKey(provider);

    const chaptersToRefactor = book.chapters.slice(-10);
    const startIndex = book.chapters.length - chaptersToRefactor.length;

    const chapterList = chaptersToRefactor.map((c, i) => `--- START CHAPTER ID: ${startIndex + i} ---\n${c.content}\n--- END CHAPTER ID: ${startIndex + i} ---`).join('\n\n');

    const systemPrompt = `You are a high-speed Story Continuity Editor. 
    TASK: Review exactly 10 chapters and apply this update: "${instruction}".
    RULES:
    1. ONLY return chapters that absolutely REQUIRE changes.
    2. If a chapter does not need changing, DO NOT include it in your response.
    3. If NO chapters need changing, return an empty array: {"updates": []}.
    4. Maintain the exact tone and style of the original.
    5. Return valid JSON only in this format: {"updates": [{"index": number, "content": "string"}]}`;
    
    const userPrompt = `CHAPTER DATA:\n${chapterList}`;

    if (provider === AIProvider.Gemini) {
        const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
        const response = await genAI.getGenerativeModel({ model }).generateContent({
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            generationConfig: { 
                temperature: 0, 
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        updates: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    index: { type: Type.NUMBER },
                                    content: { type: Type.STRING }
                                },
                                required: ["index", "content"]
                            }
                        }
                    }
                }
            }
        });
        const jsonStr = response.response.text() || '{"updates": []}';
        const result = JSON.parse(jsonStr);
        handleDevOutput(userPrompt, jsonStr, 'Gemini');
        return result.updates || [];
    } else {
        // Fallback for others (non-streaming for JSON)
        const baseUrl = getBaseUrl(provider);
        const url = provider === AIProvider.Puter ? '' : `${baseUrl}/chat/completions`;
        
        let responseText = '';
        if (provider === AIProvider.Puter) {
            const resp = await puter.ai.chat(`${systemPrompt}\n\n${userPrompt}`, { model });
            responseText = resp.text;
        } else {
            const resp = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    temperature: 0,
                    response_format: { type: 'json_object' }
                })
            });
            const json = await resp.json();
            responseText = json.choices[0].message.content;
        }

        try {
            const match = responseText.match(/\{[\s\S]*\}/);
            const result = JSON.parse(match ? match[0] : responseText);
            handleDevOutput(userPrompt, responseText, provider);
            return result.updates || [];
        } catch (e) {
            console.error("Refactor Parse Error:", e);
            return [];
        }
    }
}

export async function generateBookTitle(plot: string, chapterContent: string): Promise<string> {
    const provider = getProvider();
    const model = getSelectedModel(provider);
    const apiKey = getApiKey(provider);

    const prompt = `Based on the following plot summary and the content of the first chapter, generate a short, creative, and professional book title. Do not add quotes or prefixes. Return ONLY the title text.
    
    Plot: ${plot}
    
    Chapter Excerpt: ${chapterContent.substring(0, 1000)}...`;

    let title = "Untitled Story";
    if (provider === AIProvider.Gemini) {
        const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
        const response = await genAI.getGenerativeModel({ model }).generateContent(prompt);
        title = response.response.text()?.trim() || title;
    } else if (provider === AIProvider.Puter) {
        const response = await puter.ai.chat(prompt, { model });
        title = response.text?.trim() || title;
    } else {
        const baseUrl = getBaseUrl(provider);
        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7
            })
        });
        const json = await resp.json();
        title = json.choices[0].message.content.trim();
    }

    handleDevOutput(prompt, title, provider);
    return title.replace(/^["']|["']$/g, '');
}

export async function generateIllustration(prompt: string): Promise<string | undefined> {
  const provider = getProvider();
  const model = getSelectedModel(provider);
  const apiKey = getApiKey(provider);

  if (provider === AIProvider.Gemini) {
      const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
      const fullPrompt = `High-detail cinematic concept art, storytelling illustration: ${prompt}.`;
      const result = await genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image' }).generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: { responseMimeType: "image/png" as any } // Hypothetical or check SDK
      });
      // Gemini Image Gen is still experimental in SDK, usually returns inlineData
      const part = (result.response.candidates as any)?.[0].content.parts[0];
      if (part?.inlineData) return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
  } else if (provider === AIProvider.Puter) {
      const fullPrompt = `RPG game art, cinematic fantasy/sci-fi: ${prompt}.`;
      const image = await puter.ai.txt2img(fullPrompt);
      return image.src;
  }
  return undefined;
}

export async function analyzeChapter(content: string) {
    const provider = getProvider();
    const model = getSelectedModel(provider);
    const apiKey = getApiKey(provider);

    const prompt = `Analyze importance and summary for this turn. Return JSON {importance: "HIGH/MEDIUM/LOW", summary: "string"}.
        Text: ${content}`;
        
    let responseText = '{}';
    if (provider === AIProvider.Gemini) {
        const genAI = new GoogleGenAI({ apiKey: apiKey || (process.env.API_KEY as string) });
        const response = await genAI.getGenerativeModel({ model }).generateContent({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        });
        responseText = response.response.text();
    } else if (provider === AIProvider.Puter) {
        const response = await puter.ai.chat(prompt, { model });
        responseText = response.text;
    } else {
        const baseUrl = getBaseUrl(provider);
        const resp = await fetch(`${baseUrl}/chat/completions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
            body: JSON.stringify({
                model,
                messages: [{ role: 'user', content: prompt }],
                response_format: { type: 'json_object' }
            })
        });
        const json = await resp.json();
        responseText = json.choices[0].message.content;
    }
    
    try {
        const match = responseText.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : responseText);
    } catch (e) {
        return {};
    }
}

export async function analyzeBookChapters(chapters: Chapter[]) {
    return chapters.map(c => ({ id: c.id, importance: ChapterImportance.Medium, summary: "Game Turn" }));
}
