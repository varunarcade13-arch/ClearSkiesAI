import {
  ChatMessage,
  ChatContext,
  ChatResponse,
  IGenAIProvider,
} from "@/infrastructure/ai/IGenAIProvider";
import { InputSanitizer } from "@/infrastructure/security/Sanitizer";

export interface ExecuteChatInput {
  messages: ChatMessage[];
  context: ChatContext;
}

export class ExecuteGeminiChatUseCase {
  constructor(private aiProvider: IGenAIProvider) {}

  async execute(input: ExecuteChatInput): Promise<ChatResponse> {
    if (!input.messages || input.messages.length === 0) {
      throw new Error("Chat request must include at least one message.");
    }

    // Sanitize user messages
    const sanitizedMessages: ChatMessage[] = input.messages.map((m) => ({
      role: m.role,
      content: InputSanitizer.sanitizeText(m.content, 1200),
    }));

    return this.aiProvider.generateChatResponse(sanitizedMessages, input.context);
  }
}
