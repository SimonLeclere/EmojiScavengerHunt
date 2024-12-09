import { NextResponse } from 'next/server';
import { Mistral } from '@mistralai/mistralai';

const apiKey = process.env.MISTRAL_API_KEY;

const client = new Mistral({ apiKey });

export async function POST(req) {
    try {
        const base64Image = await req.text();

        if (!base64Image) {
            return NextResponse.json({ error: "Missing base64Image" }, { status: 400 });
        }
        
        const chatResponse = await client.chat.complete({
          model: "pixtral-12b",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: `You are an image analysis assistant. Given an image, identify the main object and return the most relevant emoji.\n\n**Instructions:**\n- Focus on the primary object.\n- The user is probably in front of the camera, focus on what he is presenting to the camera or holding in his hand.\n- Return only the emoji in plain text without any other information. Never answer with text or multiple characters.\n- If multiple objects are present, choose the most prominent one.\n- If the object is not clear, return "?".` },
                {
                  type: "image_url",
                  imageUrl: base64Image.trim(),
                },
              ],
            },
          ],
        });

        return NextResponse.json({ result: chatResponse.choices[0].message.content });
    } catch (error) {
        return NextResponse.json({ error: "Server error", details: error.message }, { status: 500 });
    }
}
