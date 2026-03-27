export const APP_VERSION = '6.2.0';

export const CHANGELOG = [
    {
        version: '6.2.0',
        title: 'StorySpark Desktop',
        changes: [
            'Desktop App (Exclusive): Launch StorySpark as a native desktop application.',
            'Perchance Integration (Exclusive): Seamlessly use forked and enhanced Perchance Story, AI Chat, and Classic RPG generators.',
            'System Performance: New "Close Tab" technology for Perchance modes to reclaim CPU/RAM when not in use.',
            'Offline Laboratory: Native file support for .ssrf and .sspf imports directly from the OS.',
            'Stylized Title Bar: Modern, integrated window controls and a custom File menu.'
        ]
    },
    {
        version: '6.1.4',
        title: 'Gemini Unlocked',
        changes: [
            'Public Gemini API: Gemini is now the recommended provider for all users.',
            'Setup Guide: Integrated instructions for obtaining a free Google API key.',
            'Quota Transparency: Added information about the 20-response daily limit on free keys.'
        ]
    },
    {
        version: '6.1.3',
        title: 'The Architect\'s Choice',
        changes: [
            'Gemini Model Selection: Choose between Pro, Flash, and Lite models.',
            'Environment Detection: Added warnings and restrictions for Pro models based on API key usage.',
            'Enhanced Logic: Standardized Gemini model IDs for better performance.'
        ]
    }
];

export const GOOGLE_AI_STUDIO_URL = 'https://aistudio.google.com/app/apikey';

export const STYLE_PRESETS = [
    { id: 'default', name: 'Standard (StorySpark)', description: 'Balanced, professional prose.' },
    { id: 'aperture', name: 'Aperture (Clinical/Snarky)', description: 'Dry, passive-aggressive, scientific. Perfect for Portal.' },
    { id: 'epic_fantasy', name: 'Epic Fantasy (Tolkienesque)', description: 'High-flown, descriptive, and legendary tone.' },
    { id: 'noir', name: 'Hardboiled Noir', description: 'Gritty, cynical, short sentences, atmospheric.' },
    { id: 'literary', name: 'Poetic/Literary', description: 'Flowery, internal monologues, metaphor-heavy.' },
    { id: 'action', name: 'Cinematic Action', description: 'Fast-paced, visceral, present-tense focus.' }
];

export const FRANCHISES: string[] = [
  'Portal / Portal 2',
  'Half-Life',
  'The Wingfeather Saga (Andrew Peterson)',
  'The Chronicles of Narnia (C.S Lewis)',
  'Harry Potter (J.K. Rowling)',
  'Lord of the Rings (J.R.R Tolkien)',
  'The Hunger Games (Suzanne Collins)',
  'Percy Jackson & the Olympians (Rick Riordan)',
  'Warriors (Erin Hunter)',
  'Dune (Frank Herbert)',
  'A Song of Ice and Fire (Game of Thrones)',
  'The Wheel of Time (Robert Jordan)',
  'Mistborn (Brandon Sanderson)',
  'The Stormlight Archive (Brandon Sanderson)',
  'His Dark Materials (Philip Pullman)',
  'Redwall (Brian Jacques)',
  'Star Wars',
  'Marvel Cinematic Universe (MCU)',
  'DC Universe',
  'Doctor Who',
  'Star Trek',
  'Stranger Things',
  'Avatar: The Last Airbender',
  'Fallout',
  'The Elder Scrolls (Skyrim/Oblivion)',
  'Cyberpunk 2077',
  'Naruto',
  'Other'
];

export const BOOK_SERIES = FRANCHISES;

export const GENRES: string[] = [
  'Fantasy',
  'Science Fiction',
  'Mystery',
  'Thriller',
  'Romance',
  'Horror',
  'Historical Fiction',
  'Adventure',
  'Young Adult',
  'Humor/Comedy',
  'Cyberpunk',
  'Steampunk',
  'Dystopian',
  'Let the AI Decide',
];

export const PUTER_TEXT_MODELS = [
    { id: 'google/gemini-3-pro-preview', name: 'Gemini 3 Pro', note: 'Best model, but highest Puter.js usage.' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', note: 'Balanced high-tier performance.' },
    { id: 'openai/gpt-5', name: 'GPT-5', note: 'Extreme Puter.js usage—will consume AI tokens the fastest.' },
    { id: 'openai/gpt-5-nano', name: 'GPT-5 Nano', note: 'Relatively low AI token usage.' },
    { id: 'google/gemini-3-flash-preview', name: 'Gemini 3 Flash', note: 'Higher AI token usage.' },
    { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro', note: 'Very high token usage.' },
    { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash', note: 'Medium token usage.' },
    { id: 'google/gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash-lite', note: 'Low usage. Expect lower quality and more regens.' },
    { id: 'google/gemini-2.0-flash', name: 'Gemini 2.0 Flash', note: 'Lower token usage.' },
    { id: 'google/gemini-2.0-flash-lite', name: 'Gemini 2.0 Flash-lite', note: 'Very low usage. Expect low quality.' },
];

export const GEMINI_TEXT_MODELS = [
    { id: 'gemini-3.1', name: 'Gemini 3.1', isPro: true, note: 'Next-gen reasoning. Latest state-of-the-art.' },
    { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', isPro: true, note: 'Deep reasoning. Works ONLY in the Google AI Studio dev environment.' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', isPro: true, note: 'High intelligence. Works ONLY in the Google AI Studio dev environment.' },
    { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash', isPro: false, note: 'Fast, modern, and reliable.' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', isPro: false, note: 'Stable and well-balanced performance.' },
    { id: 'gemini-flash-lite-latest', name: 'Gemini 2.5 Flash-lite', isPro: false, note: 'Lowest latency, lower token cost.' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash-lite', isPro: false, note: 'High speed. Gets 500 daily requests as of now. Check official sources for most up-to-date limits.' },
    { id: 'gemma-3-27b-it', name: 'Gemma 3 27B', isPro: false, note: 'Open model. Gets 14.4K requests a day, but not as good as Gemini.' },
    { id: 'gemma-3-12b-it', name: 'Gemma 3 12B', isPro: false, note: 'Lightweight & Fast. Gets 14.4K requests a day.' },
    { id: 'gemma-3-4b-it', name: 'Gemma 3 4B', isPro: false, note: 'Ultra fast. Gets 14.4K requests a day.' },
    { id: 'gemma-3-1b-it', name: 'Gemma 3 1B', isPro: false, note: 'Tiny & efficient. Gets 14.4K requests a day.' },
];

export const OPENROUTER_TEXT_MODELS = [
    { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash (Free)', note: 'Fast and free model via OpenRouter.' },
    { id: 'deepseek/deepseek-chat', name: 'DeepSeek-V3 (Free)', note: 'State-of-the-art chat model.' },
    { id: 'mistralai/mistral-7b-instruct:free', name: 'Mistral 7B (Free)', note: 'Reliable open-source model.' },
    { id: 'google/gemini-pro-1.5', name: 'Gemini 1.5 Pro', note: 'High intelligence.' },
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', note: 'Exceptional reasoning and style.' },
    { id: 'openai/gpt-4o', name: 'GPT-4o', note: 'Standard high-tier model.' },
];

export const ANTHROPIC_TEXT_MODELS = [
    { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', note: 'Anthropic API keys are expensive and do not offer a free tier.' },
    { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', note: 'Fastest Claude model.' },
    { id: 'claude-3-opus-latest', name: 'Claude 3 Opus', note: 'Deepest intelligence.' },
];

export const OPENAI_TEXT_MODELS = [
    { id: 'gpt-4o', name: 'GPT-4o', note: 'OpenAI does not have a free tier. Pay-as-you-go required.' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', note: 'Fast and cost-efficient.' },
    { id: 'o1-preview', name: 'o1 Preview', note: 'Deep reasoning capabilities.' },
];

export const DEEPSEEK_TEXT_MODELS = [
    { id: 'deepseek-chat', name: 'DeepSeek Chat', note: 'Affordable and powerful model.' },
    { id: 'deepseek-reasoner', name: 'DeepSeek Reasoner', note: 'Optimized for complex tasks.' },
];

export const GROQ_TEXT_MODELS = [
    { id: 'llama3-70b-8192', name: 'Llama 3 70B', note: 'Incredibly fast performance.' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B', note: 'Excellent open-source model.' },
    { id: 'gemma2-9b-it', name: 'Gemma 2 9B', note: 'Fast and efficient.' },
];

export const CEREBRAS_TEXT_MODELS = [
    { id: 'zai-glm-4.7', name: 'ZAI GLM 4.7', note: '100 free requests a day.' },
    { id: 'gpt-oss-120b', name: 'GPT OSS 120B', note: '14.4k free requests a day.' },
    { id: 'llama3.1-8b', name: 'Llama 3.1 8B', note: '14.4k free requests a day.' },
    { id: 'qwen-3-235b-a22b-instruct-2507', name: 'Qwen 3 235B', note: '14.4k free requests a day.' },
];

export const GROK_TEXT_MODELS = [
    { id: 'grok-beta', name: 'Grok Beta', note: 'xAI flagship model.' },
];

export const MISTRAL_TEXT_MODELS = [
    { id: 'mistral-large-latest', name: 'Mistral Large', note: 'Top-tier European AI.' },
    { id: 'mistral-small-latest', name: 'Mistral Small', note: 'Fast and reliable.' },
    { id: 'pixtral-12b-2409', name: 'Pixtral 12B', note: 'Multimodal capabilities.' },
];

export const DEFAULT_RESEARCH_PROMPT = `Task: Expert Fan Fiction & Lore Research.
Instructions: Analyze the source material deeply. Your goal is to provide a comprehensive guide that ensures the AI writes an AUTHENTIC narrative that fits seamlessy (or deliberately diverges) from the canon.

Format as structured Markdown:
# [Subject Name]

## Stylistic Analysis (CRITICAL)
* **Voice & Tone:** Describe exactly how the original media feels (e.g., "Whimsical but dark," "Hard-sci-fi with political thriller elements," "First-person sassy").
* **Vocabulary & Jargon:** List unique terms, slang, or naming conventions specific to this world.
* **Pacing:** Is it fast and action-heavy, or slow and contemplative?

## Hard Rules (Magic/Tech)
* **Systems:** Explain how magic, technology, or supernatural elements work. What are the *limitations*? (e.g., "You cannot conjure food," "Warp drive requires cooldown").
* **Common Misconceptions:** What do amateur writers often get wrong about this world?

## Canon Story Summary
* **Major Arcs:** Summarize key events relevant to the user's plot.
* **Timeline Context:** If the user specified a time period (Prequel/Sequel), describe the state of the world at that specific time.

## Key Characters
* **[Name]:** Description, personality, speech patterns (catchphrases), and motivations.

Format each item as substantial bullet points.`;

export const DEFAULT_WRITING_TEMPLATE = `You are a Ghostwriter for the {{title}} franchise.
Your goal is to write a {{fanFicContext}} that feels indistinguishable from the original source material ({{mediaType}}).

STRICT CONTINUITY INSTRUCTION:
This is Segment {{chapterIndex}}. 

{{milestoneInstruction}}
{{upcomingMilestones}}

CRITICAL - DO NOT REPEAT:
1. START IMMEDIATELY: Begin exactly where the last sentence of the PREVIOUS CONTEXT ended.
2. NO RE-INTRODUCTIONS: Do NOT re-describe established characters or items.
3. NO DIALOGUE REPETITION: Move the conversation forward.

PROSE STYLE & AUTHENTICITY:
{{styleInstruction}}
- Mimic the sentence structure, vocabulary, and dialogue rhythm of the original creator.
- Show, Don't Tell. Write {{targetLength}}.

INITIAL PLOT SEED:
"{{plot}}"

{{modeInstruction}}

CORE LORE & RULES:
{{researchSummary}}
- **STRICTLY ADHERE** to the "Hard Rules" defined in the Lore. Do not invent new magic/tech rules that contradict canon unless this is an AU.
- Use the specific vocabulary/jargon listed in the research.

LONG TERM PLOT GOALS:
{{longTermGoals}}

USER NOTES:
{{userNotes}}

CRITICAL FORMATTING:
End your response with "___ANALYSIS_START___" followed by:
IMP: [HIGH/MEDIUM/LOW] | SUM: [1-sentence summary]`;

export const DEFAULT_REGENERATE_TEMPLATE = `You are a meticulous Editor for the {{title}} universe. Rewrite Segment {{chapterIndex}}.
STRICTLY follow the Lore: {{researchSummary}}.
- Maintain the authentic voice of the original source material.
- Fix any logic errors regarding magic/technology usage based on the Lore rules.
- Respect the user's specific request for this segment: "{{plot}}".

End with "___ANALYSIS_START___" IMP: [HIGH/MEDIUM/LOW] | SUM: [Summary]`;
