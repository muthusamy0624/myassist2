
import { GoogleGenAI } from "@google/genai";

// Safe initialization: The API key must be obtained exclusively from process.env.API_KEY.
// If missing, we initialize as null and fallback to local mode gracefully.
let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (e) {
  console.warn("Gemini API not initialized (Missing Key or Environment issue). App will run in Offline Mode.");
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Improved Smart Local Fallback
// This simulates a basic RAG (Retrieval Augmented Generation) system locally
const getLocalFallbackResponse = (question: string, resumeContext: string): string => {
  const lowerQuestion = question.toLowerCase();
  
  // 1. Greetings
  if (['hi', 'hello', 'hey', 'greetings', 'hola'].some(w => lowerQuestion === w || lowerQuestion.startsWith(w + ' '))) {
    return "Hello! I am Muthusamy's AI assistant.\n\nI can provide detailed information about his professional background, skills, and projects based on his resume.\n\nWhat would you like to know?";
  }

  // 2. Intro / Identity
  if (lowerQuestion.includes('intro') || lowerQuestion.includes('tell me about yourself') || lowerQuestion.includes('who are you') || lowerQuestion.includes('summary')) {
     return "### This is Muthusamy\n\nI am a dedicated **Software Engineer** with a strong foundation in Full Stack Development. My expertise spans building dynamic web applications using React and Node.js.\n\nI have a particular passion for integrating AI solutions into modern web interfaces. I have hands-on experience with technologies like Supabase and the Gemini API, and I love solving complex problems through code. My goal is to leverage these skills to create impactful digital solutions.";
  }

  // 3. Contact Info
  if (lowerQuestion.includes('email') || lowerQuestion.includes('contact') || lowerQuestion.includes('reach')) {
      const emailMatch = resumeContext.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      if (emailMatch) return `You can contact me directly via email at **${emailMatch[0]}**.\n\nMy other contact details are available in the sidebar menu on the left.`;
      return "My contact details are available in the sidebar.";
  }

  // 4. Skills
  if (lowerQuestion.includes('skill') || lowerQuestion.includes('stack') || lowerQuestion.includes('technology')) {
      // Heuristic to find skills section
      const skillsMatch = resumeContext.match(/Skills[:\-\s]+([\s\S]*?)(?=\n\n|\n[A-Z])/i);
      if (skillsMatch) {
        const rawSkills = skillsMatch[1].replace(/\n/g, ', ').trim();
        return `I have developed a diverse technical skillset:\n\n### Core Competencies\n\n${rawSkills}\n\nI am always eager to learn and apply new technologies to build efficient solutions.`;
      }
  }

  // 5. General Sentence Search (Simple Vector-like search)
  // Improved splitting: split by newlines OR periods to capture bullet points
  // This prevents retrieving giant chunks of text as a single match
  const sentences = resumeContext
    .split(/(?:\r\n|\r|\n|\. )+/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // Filter out short fragments/headers

  // Tokenize question
  const questionWords = lowerQuestion
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2 && !['what', 'where', 'when', 'how', 'who', 'does', 'this', 'have', 'with', 'show', 'give', 'can', 'you'].includes(w));

  if (questionWords.length === 0) {
      return "I'm ready to discuss my professional background in detail.\n\nPlease ask me about my:\n\n* Specific Projects\n* Work Experience\n* Technical Skills";
  }

  // Score sentences based on keyword overlap
  const scoredSentences = sentences.map(sentence => {
    const lowerSentence = sentence.toLowerCase();
    let score = 0;
    questionWords.forEach(word => {
      if (lowerSentence.includes(word)) score += 1;
    });
    // Bonus for containing exact phrases (optional simple check)
    if (lowerSentence.includes(questionWords.join(' '))) score += 2;
    
    return { sentence, score };
  });

  // Sort by score desc
  scoredSentences.sort((a, b) => b.score - a.score);

  const bestMatches = scoredSentences.filter(s => s.score > 0).slice(0, 3); // Get top 3 for more detail
  
  if (bestMatches.length > 0) {
    // Filter out URLs from fallback matches
    const cleanMatches = bestMatches
      .map(m => {
        const cleanText = m.sentence.replace(/https?:\/\/[^\s]+/g, 'the provided link');
        return `• ${cleanText}`;
      });
      
    return `Here is what I found regarding that:\n\n${cleanMatches.join('\n\n')}`;
  }

  // 6. Final Fallback
  return "I checked my resume but couldn't find a specific answer to that.\n\nHowever, I can tell you in detail about my **Skills**, **Experience**, or the **Projects** I've worked on.\n\nWhat would you prefer?";
};

export const generateAssistantResponse = async (
  question: string,
  resumeContext: string
): Promise<string> => {
  // Safety check: If AI client failed to init, use fallback immediately
  if (!ai) {
    return getLocalFallbackResponse(question, resumeContext);
  }

  const lowerQ = question.trim().toLowerCase();
  
  // 1. Strict Greeting Detection with Regex
  // Matches "hi", "hello", "hey", "greetings" alone or with punctuation/emojis
  const greetingRegex = /^(hi|hello|hey|greetings|hola|good\s*(morning|afternoon|evening))(\s*[!,.]\s*)?$/i;

  if (greetingRegex.test(lowerQ)) {
    return "Hello! I'm Muthusamy's AI Assistant. I'm here to share details about my projects, skills, and experience. What would you like to know?";
  }

  // Determine complexity for Model selection
  // We use "gemini-flash-lite-latest" for fast, simple queries
  // We use "gemini-3-pro-preview" with Thinking for complex queries
  const isComplex = /analyze|reason|plan|strategy|compare|complex|code|solution|think|explain|how|why|elaborate|tell|about|projects/i.test(question);
  
  const model = isComplex ? 'gemini-3-pro-preview' : 'gemini-flash-lite-latest';
    
  const systemInstruction = `
You are the AI persona of Muthusamy, a Software Engineer.
You are speaking directly to a visitor on your personal portfolio website.
Your knowledge is STRICTLY based on the provided resume context below.

IMPORTANT FORMATTING RULES:
1. **Formatting**: Use DOUBLE LINE BREAKS ("\\n\\n") between every paragraph. This is critical for the frontend renderer.
2. **Indentation**: Do not add manual spaces at the start of paragraphs. The frontend applies indentation automatically to paragraphs.
3. **No URLs**: **NEVER** output a raw URL, HTTP link, or website address (like https://...). Instead, describe the link (e.g., "You can view the code on my GitHub" instead of "View at github.com/...").
4. **Headings**: Use "### Title" for sections.
5. **Lists**: Use bullet points (* item).

Content Guidelines:
- **Be Elaborative**: Unless it is a simple greeting, provide detailed, multi-paragraph answers. Explain the 'Why' and 'How', not just the 'What'.
- **Identity**: If asked to "introduce yourself" or "play intro", START your response with exactly: "This is Muthusamy...". Then provide a narrative story about your background.
- **Professionalism**: Maintain a polished, confident tone suitable for a Software Engineer.

RESUME CONTEXT:
${resumeContext.slice(0, 30000)}
`;

  // Configuration
  const config: any = {
    systemInstruction: systemInstruction,
  };

  if (isComplex) {
    // Activate Thinking Mode for Pro model
    config.thinkingConfig = { thinkingBudget: 32768 };
  } else {
    // Optimize for speed on Lite model
    config.temperature = 0.7;
  }

  let attempts = 0;
  const maxAttempts = 2;

  while (attempts < maxAttempts) {
    try {
      if (attempts > 0) await delay(1000);

      const response = await ai.models.generateContent({
        model,
        contents: question,
        config
      });

      return response.text || "I'm sorry, I couldn't generate a response.";

    } catch (error: any) {
      // Check for Quota/RateLimit errors specifically or generic fetch errors (missing key)
      const isQuotaError = 
        error.status === 429 || 
        error.code === 429 ||
        (error.message && error.message.includes('429')) ||
        (error.message && error.message.includes('quota')) ||
        (error.message && error.message.includes('RESOURCE_EXHAUSTED'));
      
      const isKeyError = error.message && (error.message.includes('API key') || error.message.includes('403') || error.message.includes('400'));

      if (isQuotaError || isKeyError) {
         // Silent fallback to local logic
         return getLocalFallbackResponse(question, resumeContext);
      }

      attempts++;
    }
  }

  // Final fallback
  return getLocalFallbackResponse(question, resumeContext);
};
