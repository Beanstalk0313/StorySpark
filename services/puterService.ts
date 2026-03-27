import { Book, Chapter, ChapterImportance, BookType, AdventureBookRequest, ChapterLength, Milestone, PuterModel, ContinuationBookRequest } from "../types";
import { DEFAULT_RESEARCH_PROMPT, DEFAULT_WRITING_TEMPLATE, DEFAULT_REGENERATE_TEMPLATE } from "../constants";
import { downloadDevLog } from "./exportService";

declare const puter: any;

const getDevSetting = (key: string) => localStorage.getItem(key) === 'true';
const getInstruction = (key: string, defaultVal: string) => localStorage.getItem(key) || defaultVal;
const getPuterModel = () => (localStorage.getItem('storyspark-puter-model') as PuterModel) || PuterModel.Gemini3Pro;

const fillTemplate = (template: string, data: Record<string, string>) => {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return data[key] || '';
    });
};

const handleDevOutput = (prompt: string, response: string) => {
    if (getDevSetting('storyspark-dev-log-console')) {
        console.group("StorySpark AI Request (Puter)");
        console.log("%cModel:", "color: #8b5cf6; font-weight: bold;", getPuterModel());
        console.log("%cPrompt:", "color: #8b5cf6; font-weight: bold;", prompt);
        console.log("%cResponse:", "color: #10b981; font-weight: bold;", response);
        console.groupEnd();
    }
    if (getDevSetting('storyspark-dev-download')) {
        downloadDevLog(prompt, response, 'Puter');
    }
};

export async function* generateResearchSummaryStream(series: string, plot: string, crossovers: string[]) {
    const baseInstruction = getInstruction('storyspark-sys-prompt-research', DEFAULT_RESEARCH_PROMPT);
    const prompt = `${baseInstruction}
    Subject: ${series}. Crossovers: ${crossovers.join(', ') || 'None'}.
    User Context: ${plot}.`;
    
    const response = await puter.ai.chat(prompt, { model: getPuterModel(), stream: true });
    let fullResponse = '';
    for await (const chunk of response) {
        fullResponse += chunk.text;
        yield chunk.text;
    }
    handleDevOutput(prompt, fullResponse);
}

export async function* writeChapterStream(book: Book, userPrompt: string) {
    const currentChapterIndex = book.chapters.length;
    const isAdventure = book.request.type === BookType.Adventure;
    const isFanFic = book.request.type === BookType.Continuation;
    
    const lengthMap = {
        [ChapterLength.Short]: "concise (~400 words)",
        [ChapterLength.Medium]: "standard (~1000 words)",
        [ChapterLength.Long]: "descriptive (~2000 words)",
        [ChapterLength.ExtraLong]: "extremely long and detailed (~3500 words)"
    };
    const targetLength = lengthMap[book.request.chapterLength] || lengthMap[ChapterLength.Medium];
    const currentMilestone = book.milestones?.find(m => m.chapterIndex === currentChapterIndex + 1);
    const upcomingMilestones = book.milestones?.filter(m => m.chapterIndex > currentChapterIndex + 1).slice(0, 2);

    const persona = isAdventure ? (book.request as AdventureBookRequest).persona : null;
    const traits = persona?.activeTraits?.join(', ') || 'Standard Protagonist';
    const memories = persona?.unlockedMemories?.join('\n- ') || 'None yet';

    const style = book.request.stylePreset || 'default';
    let styleInstruction = "Maintain a professional, engaging narrative tone.";
    
    // Incorporate Author Mimicry if provided
    if (book.request.customAuthor?.trim()) {
        styleInstruction = `CRITICAL: Aggressively mimic the writing style, vocabulary, and dialogue rhythm of ${book.request.customAuthor.trim()}. Do not write generic prose.`;
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
        
        if (!book.request.customAuthor?.trim()) {
            styleInstruction += `\n- Adopt the specific tone and atmosphere of the source material (${mediaType}).`;
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
        researchSummary: book.researchSummary || 'Standard logic.',
        userNotes: book.userNotes || 'No specific style notes.',
        longTermGoals: book.longTermGoals || 'No long term goals specified.',
        fanFicContext,
        mediaType
    };

    const systemInstruction = fillTemplate(template, variables);

    const lastChapters = book.chapters.slice(-3);
    const context = lastChapters.map((c, i) => `[STORY TURN ${book.chapters.length - lastChapters.length + i + 1}]:\n${c.content}`).join('\n\n');

    const prompt = `INSTRUCTIONS:
${systemInstruction}

STRICT RULE: This is Segment ${currentChapterIndex + 1}. START AT THE VERY NEXT SECOND OF THE STORY. DO NOT REPEAT DESCRIPTIONS. DO NOT RE-STATE DIALOGUE FROM PREVIOUS TURNS.

User Input/Action: ${userPrompt || 'Continue naturally.'}

PREVIOUS NARRATIVE (Memory):
${context || 'This is the very first segment.'}`;

    const response = await puter.ai.chat(prompt, { model: getPuterModel(), stream: true });
    let fullResponse = '';
    for await (const chunk of response) {
        fullResponse += chunk.text;
        yield chunk.text;
    }
    handleDevOutput(prompt, fullResponse);
}

export async function* regenerateChapterStream(book: Book, index: number, instructions: string) {
    const chapter = book.chapters[index];
    const template = getInstruction('storyspark-sys-template-regenerate', DEFAULT_REGENERATE_TEMPLATE);
    const variables: Record<string, string> = {
        chapterIndex: (index + 1).toString(),
        researchSummary: book.researchSummary || 'Standard logic.',
        plot: book.request.plot
    };
    const systemInstruction = fillTemplate(template, variables);

    const prompt = `SYSTEM: ${systemInstruction}\n\nTask: Rewrite Chapter ${index + 1} based on: "${instructions}".\nOriginal Turn Content: "${chapter.content}"`;

    const response = await puter.ai.chat(prompt, { model: getPuterModel(), stream: true });
    let fullResponse = '';
    for await (const chunk of response) {
        fullResponse += chunk.text;
        yield chunk.text;
    }
    handleDevOutput(prompt, fullResponse);
}

export async function refactorChapters(book: Book, instruction: string): Promise<{ index: number, content: string }[]> {
    const chaptersToRefactor = book.chapters.slice(-10);
    const startIndex = book.chapters.length - chaptersToRefactor.length;

    const chapterList = chaptersToRefactor.map((c, i) => `[ID ${startIndex + i}]:\n${c.content}`).join('\n\n---\n\n');

    const prompt = `TASK: Review the following 10 chapters and apply changes: "${instruction}".
    
    INSTRUCTIONS: 
    1. Only return modified chapters.
    2. Use JSON format exactly as requested. No conversational text before or after.
    
    FORMAT: {"updates": [{"index": Number, "content": String}]}
    
    STORY:
    ${chapterList}`;

    const response = await puter.ai.chat(prompt, { model: getPuterModel() });
    const text = response.text || '{"updates": []}';
    
    try {
        const match = text.match(/\{[\s\S]*\}/);
        const json = JSON.parse(match ? match[0] : text);
        handleDevOutput(prompt, text);
        return json.updates || [];
    } catch (e) {
        console.error("Puter Refactor Parse Error:", e);
        return [];
    }
}

export async function generateBookTitle(plot: string, chapterContent: string): Promise<string> {
    const prompt = `Generate a short, creative book title based on this plot: "${plot.substring(0, 300)}...". Return ONLY the title text.`;
    const response = await puter.ai.chat(prompt, { model: getPuterModel() });
    const title = response.text?.trim()?.replace(/^["']|["']$/g, '') || "Untitled Story";
    handleDevOutput(prompt, title);
    return title;
}

export async function generateIllustration(prompt: string): Promise<string> {
    const fullPrompt = `RPG game art, cinematic fantasy/sci-fi: ${prompt}.`;
    const image = await puter.ai.txt2img(fullPrompt);
    if (getDevSetting('storyspark-dev-log-console')) {
        console.log("StorySpark Image Gen (Puter):", fullPrompt);
    }
    return image.src;
}

export async function analyzeChapter(chapterContent: string) {
    const prompt = `Analyze turn importance and summary for: ${chapterContent}. Return JSON {importance, summary}.`;
    const response = await puter.ai.chat(prompt, { model: getPuterModel() });
    handleDevOutput(prompt, response.text || '');
    try {
        const match = response.text.match(/\{[\s\S]*\}/);
        return JSON.parse(match ? match[0] : response.text);
    } catch (e) {
        return {};
    }
}

export async function analyzeBookChapters(chapters: Chapter[]) {
    return chapters.map(c => ({ id: c.id, importance: ChapterImportance.Medium, summary: "Game Turn" }));
}