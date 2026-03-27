
import { Book, BookType, ChapterImportance, BookLength, AdventureBookRequest } from '../types';

// Helper to select context for Infinite mode
const getContextForInfiniteMode = (chapters: Book['chapters']): string => {
  if (chapters.length === 0) return '';

  // 1. Always include the last 30 chapters (The "Fresh" Context)
  const recentThreshold = 30;
  const recentChapters = chapters.slice(-recentThreshold);
  const olderChapters = chapters.slice(0, -recentThreshold);

  let contextString = '';

  // 2. Process Older Chapters (The "Deep" Context)
  if (olderChapters.length > 0) {
    // Add summary/content of important older chapters
    contextString += `*** SUMMARIZED HISTORY (Chapters 1 to ${olderChapters.length}) ***\n\n`;
    
    olderChapters.forEach((ch, idx) => {
      const chapterNum = idx + 1;
      // Always keep High importance.
      // Keep Medium importance if it's relatively recent (e.g., within last 50 chapters total)
      // Drop Low importance.
      const isMediumAndRecent = ch.importance === ChapterImportance.Medium && (chapters.length - idx) < 50;
      
      if (ch.importance === ChapterImportance.High || isMediumAndRecent) {
        // If we have a summary, use it to save tokens. If not, use content (fallback).
        const contentToUse = ch.summary ? `[Summary]: ${ch.summary}` : `[Content excerpt]: ${ch.content.substring(0, 500)}...`;
        contextString += `Chapter ${chapterNum} (${ch.importance || 'Unknown Importance'}): ${contentToUse}\n\n`;
      }
    });
    contextString += `*** END OF SUMMARIZED HISTORY ***\n\n`;
  }

  // 3. Add Recent Chapters (Full Context)
  contextString += recentChapters.map((c, i) => {
    const absIndex = (chapters.length - recentChapters.length) + i + 1;
    return `--- START OF CHAPTER ${absIndex} ---\n${c.content}\n--- END OF CHAPTER ${absIndex} ---`;
  }).join('\n\n');

  return contextString;
};

// Helper to select standard context (Optimized for token usage)
const getStandardContext = (chapters: Book['chapters']): string => {
  // Limit to last 30 chapters to avoid hitting 1M token limits on standard books with high word counts
  const maxContextChapters = 30;
  const chaptersToInclude = chapters.slice(-maxContextChapters);
  
  return chaptersToInclude.map((c, i) => {
      const actualIndex = (chapters.length - chaptersToInclude.length) + i + 1;
      return `--- START OF CHAPTER ${actualIndex} ---\n${c.content}\n--- END OF CHAPTER ${actualIndex} ---`;
  }).join('\n\n');
}


export const buildChapterPrompt = (
  book: Book, 
  nextChapterPrompt: string | null = null,
  isRegeneration: boolean = false,
  regenerationData?: { chapterIndex: number; instructions: string; }
): string => {
  const { request, chapters, promptHistory, researchSummary, userNotes } = book;
  const chapterNumber = chapters.length + 1;
  const isInfinite = request.bookLength === BookLength.Infinite;
  const isAdventure = request.type === BookType.Adventure;
  
  // Determine pacing based on Book Length
  let pacingInstruction = "";
  switch(request.bookLength) {
    case BookLength.Small:
      pacingInstruction = isAdventure ? "This is a short adventure. Move rapidly towards a conclusion." : "This is a short story (5-10 chapters). Move the plot rapidly towards a conclusion.";
      break;
    case BookLength.Medium:
      pacingInstruction = "Maintain a steady pace.";
      break;
    case BookLength.Long:
      pacingInstruction = "Allow time for detailed exploration and interactions.";
      break;
    case BookLength.Infinite:
      pacingInstruction = "This is an infinite/ongoing journey. Do not rush to a conclusion. Focus on the immediate situation and world interaction.";
      break;
    default:
       pacingInstruction = "Maintain a steady pace.";
  }

  const analysisInstruction = isInfinite ? `
**MANDATORY OUTPUT FORMAT (INFINITE MODE):**
Write the content in standard Markdown.
IMMEDIATELY after the story ends, you MUST append this separator and analysis line:
___ANALYSIS_START___|IMP: <HIGH/MEDIUM/LOW>|SUM: <One sentence summary>
` : '';

  // Crossover Logic
  const crossovers = request.crossovers && request.crossovers.length > 0 
    ? `\n**CROSSOVER / INSPIRATION:** Integrate elements, characters, lore, or style from the following franchises: ${request.crossovers.join(', ')}.\nBlend these elements naturally into the world.`
    : '';

  // Base directives
  let systemDirectives = `
**CRITICAL WRITING INSTRUCTIONS:**
1. **Avoid Repetition:** Do NOT repeat the resolution of conflicts from previous segments. Advance the plot immediately.
2. **Memory & Consistency:** Pay close attention to the context.
3. **Show, Don't Tell:** Prioritize sensory details and action.
4. **Pacing:** This is Part ${chapterNumber}. ${pacingInstruction}
${crossovers}
${analysisInstruction}
5. **Illustration:** IMMEDIATELY after the text ends (and the analysis line if present), append this separator and a visual description:
___IMAGE_PROMPT___|A detailed visual description of the current scene...
`;

  // --- ADVENTURE MODE SPECIFIC LOGIC ---
  if (isAdventure) {
      const advRequest = request as AdventureBookRequest;
      const { persona } = advRequest;
      
      systemDirectives = `
**MODE: INTERACTIVE ADVENTURE (Game Master)**
1. **Perspective:** YOU MUST WRITE IN THE **SECOND PERSON** ("You see...", "You feel..."). The user IS the main character.
2. **STRICT RULE:** **NEVER** write dialogue or actions for the user's character (${persona.name}). Stop writing IMMEDIATELY when it is time for the user to respond.
3. **Short Segments:** Keep segments concise (200-500 words) to allow frequent user input. Do NOT write long chapters.
4. **Consistency:** The user is ${persona.name} (Age: ${persona.age}, Gender: ${persona.gender}). 
   Appearance: ${persona.appearance || 'Not specified'}. 
   Description: ${persona.description || 'Not specified'}.
${systemDirectives}
`;
  } else {
       // Standard Novel Mode Logic
       systemDirectives = `
**MODE: NOVEL WRITER**
1. **Perspective:** Write in the Third Person (or First Person if established).
2. **Consistency:** Ensure pronouns match established characters.
${systemDirectives}
`;
  }

  let seriesDetails = '';
  if (request.type === BookType.Continuation) {
      seriesDetails = `**Book Type:** Fan-fiction continuing: **${request.series}**.\n${researchSummary ? `**Canon Info:**\n${researchSummary}\n` : ''}`;
  } else if (isAdventure && (request as AdventureBookRequest).storyType === 'CONTINUATION') {
      const advReq = request as AdventureBookRequest;
      seriesDetails = `**Setting:** Fan-fiction adventure set in: **${advReq.series}**.\n${researchSummary ? `**Canon Info:**\n${researchSummary}\n` : ''}`;
  }

  const userNotesSection = userNotes && userNotes.trim() 
    ? `\n**GLOBAL USER NOTES (Always remember this):**\n${userNotes}\n` 
    : '';

  // --- REGENERATION LOGIC ---
  if (isRegeneration && regenerationData) {
    const { chapterIndex, instructions } = regenerationData;
    const context = getStandardContext(chapters.slice(0, chapterIndex).slice(-30));
    const originalContent = chapters[chapterIndex].content;

    return `You are rewriting ${isAdventure ? 'a segment' : 'Chapter ' + (chapterIndex + 1)}.
${systemDirectives}

${seriesDetails}
${userNotesSection}
**Premise:** ${request.plot}

**Context:**
${context || 'Start of story.'}

**Original Content:**
${originalContent}

**User Instructions for Revision:**
${instructions}

Rewrite strictly following the mode rules.`;
  }

  // --- NEW CHAPTER LOGIC ---
  if (chapters.length === 0) { 
    // First Chapter / Segment
    const preamble = isAdventure 
        ? `You are narrating an interactive story. Introduce the setting and place the user (${(request as AdventureBookRequest).persona.name}) in the scene based on the premise.` 
        : `Write the first chapter of a novel. Begin with a book title and chapter title.`;
    
    let details = '';
    if (isAdventure) {
        const advReq = request as AdventureBookRequest;
        details = `**Genre/Setting:** ${advReq.storyType === 'ORIGINAL' ? advReq.genre : advReq.series}\n**Starting Premise:** ${advReq.plot}`;
    } else if (request.type === BookType.Original) {
       details = `**Genre:** ${request.genre}\n**Premise:** ${request.plot}`;
    } else {
       details = `**Premise:** ${request.plot}`;
    }

    return `${preamble}
${systemDirectives}
${details}
${userNotesSection}

Begin.`;

  } else {
    // Continuation
    const preamble = isAdventure
        ? `Continue the narration based on the user's action. Remember to use "You" and stop before the user's next turn.`
        : `Write the next chapter (Chapter ${chapterNumber}).`;
    
    const context = isInfinite && chapters.length > 50 
        ? getContextForInfiniteMode(chapters) 
        : getStandardContext(chapters);

    const userGuidance = nextChapterPrompt && nextChapterPrompt.trim()
      ? (isAdventure ? `**USER ACTION:** ${nextChapterPrompt}` : `**User Guidance:** ${nextChapterPrompt}`)
      : (isAdventure ? `**USER ACTION:** (The user waits to see what happens)` : "Continue the story naturally.");

    return `${preamble}
${systemDirectives}

${seriesDetails}
${userNotesSection}
**Premise:** ${request.plot}

**Story Context:**
${context}

${userGuidance}

Write the next segment.`;
  }
};
