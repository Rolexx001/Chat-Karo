import { z } from "zod";

export const messageSchema = z.object({
    chatId: z.string(),
    content: z.string().optional().nullable(),
    mediaUrl: z.string().optional().nullable(),
    replyTo: z.string().optional().nullable(),
}).refine((data) => Boolean(data.content || data.mediaUrl), {
    message: "Either content or mediaUrl is required"
});


