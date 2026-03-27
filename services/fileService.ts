
import { Persona, ResearchTopic } from "../types";

export const exportPersona = (persona: Persona) => {
    const data = {
        format: 'storyspark-persona-file',
        version: '1.0',
        persona
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${persona.name.replace(/\s+/g, '_')}.sspf`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importPersona = async (file: File): Promise<Persona> => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.format !== 'storyspark-persona-file') throw new Error('Invalid persona file');
    return data.persona;
};

export const exportResearchTopic = (topic: ResearchTopic) => {
    const data = {
        format: 'storyspark-research-topic',
        version: '1.0',
        topic
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${topic.title.replace(/\s+/g, '_')}.ssrf`;
    a.click();
    URL.revokeObjectURL(url);
};

export const importResearchTopic = async (file: File): Promise<ResearchTopic> => {
    const text = await file.text();
    const data = JSON.parse(text);
    if (data.format !== 'storyspark-research-topic') throw new Error('Invalid research file');
    return data.topic;
};
