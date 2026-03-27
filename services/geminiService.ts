import { GoogleGenAI, Type } from "@google/genai";
import { Book, Chapter, ChapterImportance, BookType, AdventureBookRequest, ChapterLength, Milestone, GeminiModel, ContinuationBookRequest } from "../types";
import { DEFAULT_RESEARCH_PROMPT, DEFAULT_WRITING_TEMPLATE, DEFAULT_REGENERATE_TEMPLATE } from "../constants";
import { downloadDevLog } from "./exportService";

const getDevSetting = (key: string) => localStorage.getItem(key) === 'true';
const getInstruction = (key: string, defaultVal: string) => localStorage.getItem(key) || defaultVal;
const getSelectedModel = (): string => (localStorage.getItem('storyspark-gemini-model') || 'gemini-3-flash-preview');

const fillTemplate = (template: string, data: Record<string, string>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || '';
    });
};

const getAI = () => {
    const customKey = localStorage.getItem('storyspark-custom-gemini-key');
    const logSdkDetails = localStorage.getItem('storyspark-dev-log-gemini-sdk') === 'true';
    
    // Fallback logic: Use custom key if it exists and isn't empty string, else system key
    const finalKey = (customKey && customKey.trim().length > 0) ? customKey.trim() : process.env.API_KEY;

    if (logSdkDetails) {
        const source = (customKey && customKey.trim().length > 0) ? "USER_CUSTOM" : "SYSTEM_DEFAULT";
        const maskedKey = finalKey ? `${finalKey.substring(0, 6)}...${finalKey.substring(finalKey.length - 4)}` : "UNDEFINED";
        console.group("%c[Gemini SDK Diagnostic]", "color: #3b82f6; font-weight: bold;");
        console.log(`Source Type: ${source}`);
        console.log(`Active Model: ${getSelectedModel()}`);
        console.log(`Final API Key (Masked): ${maskedKey}`);
        console.log(`Is Custom Key Present in LocalStorage: ${!!customKey}`);
        console.log(`Is System Key Present in Environment: ${!!process.env.API_KEY}`);
        console.groupEnd();
    }

    return new GoogleGenAI({ apiKey: finalKey });
};

const handleDevOutput = (prompt: string, response: string) => {
    if (getDevSetting('storyspark-dev-log-console')) {
        console.group("StorySpark AI Request (Gemini)");
        console.log("%cModel:", "color: #f59e0b; font-weight: bold;", getSelectedModel());
        console.log("%cPrompt:", "color: #f59e0b; font-weight: bold;", prompt);
        console.log("%cResponse:", "color: #10b981; font-weight: bold;", response);
        console.groupEnd();
    }
    if (getDevSetting('storyspark-dev-download')) {
        downloadDevLog(prompt, response, 'Gemini');
    }
};

export async function* generateResearchSummaryStream(series: string, plot: string, crossovers: string[]) {
  const ai = getAI();
  const baseInstruction = getInstruction('storyspark-sys-prompt-research', DEFAULT_RESEARCH_PROMPT);
  
  const prompt = `${baseInstruction}
  
  Primary Subject: "${series}"
  Crossover Subjects: ${crossovers.join(', ') || 'None'}
  User's Story Context: "${plot}"`;

  const result = await ai.models.generateContentStream({
    model: getSelectedModel(),
    contents: prompt,
  });

  let fullResponse = '';
  for await (const chunk of result) {
    if (chunk.text) {
        fullResponse += chunk.text;
        yield chunk.text;
    }
  }
  handleDevOutput(prompt, fullResponse);
}

export async function* writeChapterStream(book: Book, userPrompt: string) {
  const ai = getAI();
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
  
  // Refined Logic: If Custom Author is provided (common in FanFic), it overrides generic presets
  if (book.request.customAuthor?.trim()) {
      styleInstruction = `CRITICAL STYLE RULE: You must aggressively mimic the writing style, vocabulary, dialogue rhythm, and prose quirks of ${book.request.customAuthor.trim()}. Do not write in a generic AI tone. Write exactly like ${book.request.customAuthor.trim()}.`;
  } else {
      if (style === 'aperture') styleInstruction = "Adopt the 'Aperture Science' voice: snarky, clinical, darkly humorous, passive-aggressive, and scientific. Use technical jargon.";
      else if (style === 'epic_fantasy') styleInstruction = "Adopt an 'Epic Fantasy' voice: elevated, descriptive, formal, and legendary. Focus on world-building and myth.";
      else if (style === 'noir') styleInstruction = "Adopt a 'Hardboiled Noir' voice: cynical, gritty, world-weary. Use short, punchy sentences and heavy atmosphere.";
      else if (style === 'literary') styleInstruction = "Adopt a 'Literary' voice: poetic, metaphor-heavy, focus on internal states and complex monologues.";
      else if (style === 'action') styleInstruction = "Adopt a 'Cinematic Action' voice: fast-paced, visceral, present-tense focused, and punchy.";
  }

  // Fan Fiction Specific Instructions
  let fanFicContext = "";
  let mediaType = "Original Work";
  
  if (isFanFic) {
      const fanReq = book.request as ContinuationBookRequest;
      fanFicContext = fanReq.fanFicContext || "Sequel";
      mediaType = fanReq.mediaType || "Book";
      
      // Strengthen the instruction for FanFic authenticity
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

  const result = await ai.models.generateContentStream({
    model: getSelectedModel(),
    contents: prompt,
    config: { 
      systemInstruction,
      temperature: 0.9,
      thinkingConfig: { thinkingBudget: 4096 }
    }
  });

  let fullResponse = '';
  for await (const chunk of result) {
    if (chunk.text) {
        fullResponse += chunk.text;
        yield chunk.text;
    }
  }
  
  const fullLog = `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nUSER PROMPT:\n${prompt}`;
  handleDevOutput(fullLog, fullResponse);
}

export async function* regenerateChapterStream(book: Book, chapterIndex: number, instructions: string) {
  const ai = getAI();
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

  const result = await ai.models.generateContentStream({
    model: getSelectedModel(),
    contents: prompt,
    config: { 
      systemInstruction,
      thinkingConfig: { thinkingBudget: 4096 } 
    }
  });

  let fullResponse = '';
  for await (const chunk of result) {
    if (chunk.text) {
        fullResponse += chunk.text;
        yield chunk.text;
    }
  }
  
  const fullLog = `SYSTEM INSTRUCTION:\n${systemInstruction}\n\nUSER PROMPT:\n${prompt}`;
  handleDevOutput(fullLog, fullResponse);
}

export async function refactorChapters(book: Book, instruction: string): Promise<{ index: number, content: string }[]> {
    const ai = getAI();
    const chaptersToRefactor = book.chapters.slice(-10);
    const startIndex = book.chapters.length - chaptersToRefactor.length;

    const chapterList = chaptersToRefactor.map((c, i) => `--- START CHAPTER ID: ${startIndex + i} ---\n${c.content}\n--- END CHAPTER ID: ${startIndex + i} ---`).join('\n\n');

    const prompt = `You are a high-speed Story Continuity Editor. 
    
    TASK: Review exactly 10 chapters and apply this update: "${instruction}".
    
    RULES:
    1. ONLY return chapters that absolutely REQUIRE changes.
    2. If a chapter does not need changing, DO NOT include it in your response.
    3. If NO chapters need changing, return an empty array: {"updates": []}.
    4. Maintain the exact tone and style of the original.
    5. Return valid JSON only.
    
    CHAPTER DATA:
    ${chapterList}`;

    const response = await ai.models.generateContent({
        model: getSelectedModel(), 
        contents: prompt,
        config: { 
            temperature: 0, // Zero temperature for precise surgical editing
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

    const jsonStr = response.text || '{"updates": []}';
    const result = JSON.parse(jsonStr);
    handleDevOutput(prompt, jsonStr);
    return result.updates || [];
}

export async function generateBookTitle(plot: string, chapterContent: string): Promise<string> {
    const ai = getAI();
    const prompt = `Based on the following plot summary and the content of the first chapter, generate a short, creative, and professional book title. Do not add quotes or prefixes. Return ONLY the title text.
    
    Plot: ${plot}
    
    Chapter Excerpt: ${chapterContent.substring(0, 1000)}...`;

    const response = await ai.models.generateContent({
        model: getSelectedModel(),
        contents: prompt
    });

    const title = response.text?.trim() || "Untitled Story";
    handleDevOutput(prompt, title);
    return title.replace(/^["']|["']$/g, '');
}

export async function generateIllustration(prompt: string): Promise<string | undefined> {
  const imageAi = getAI();
  const fullPrompt = `High-detail cinematic concept art, storytelling illustration: ${prompt}.`;
  
  const imageResponse = await imageAi.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: fullPrompt }] },
      config: { imageConfig: { aspectRatio: "1:1" } }
  });
  
  if (getDevSetting('storyspark-dev-log-console')) {
      console.log("StorySpark Image Gen (Gemini):", fullPrompt);
  }

  for (const part of imageResponse.candidates[0].content.parts) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }
  return undefined;
}

export async function analyzeChapter(content: string) {
    const ai = getAI();
    const prompt = `Analyze importance and summary for this turn. Return JSON {importance: "HIGH/MEDIUM/LOW", summary: "string"}.
        
        Text: ${content}`;
        
    const response = await ai.models.generateContent({
        model: getSelectedModel(),
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });
    
    handleDevOutput(prompt, response.text || '');
    return JSON.parse(response.text || '{}');
}

export async function analyzeBookChapters(chapters: Chapter[]) {
    return chapters.map(c => ({ id: c.id, importance: ChapterImportance.Medium, summary: "Game Turn" }));
}