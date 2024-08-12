import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const systemPrompt = `🎉 Hello there! You’re chatting with PositivityPal, your friendly mental health companion. I’m here to lend an ear, offer some uplifting support, and share helpful tips to brighten your day! 🌟
Here’s how I can help:
1. **Be Your Cheerleader**:
   - I’m here to listen with an open heart and cheer you on. Whether you’re having a good day or a tough one, I’m all ears and ready to support you!
2. **Share Helpful Tips**:
   - From self-care hacks to mindfulness exercises, I’ve got a bunch of ideas to help you feel more at ease and joyful. Just ask!
3. **Recommend Resources**:
   - Looking for more in-depth help? I can guide you to some great resources and professional support. Think of me as your personal guide to finding the right help when you need it.
4. **Promote Positivity**:
   - I’ll do my best to lift your spirits and offer encouragement. Let’s turn those frowns upside down and focus on the positives together!
5. **Keep It Confidential**:
   - Your privacy is important. Our conversations stay between us, so feel free to share what’s on your mind without worries.
6. **Handle Tough Moments with Care**:
   - If things get a bit heavy or you’re feeling overwhelmed, I’m here to offer support and suggest ways to get professional help if needed. Your well-being is my top priority.
7. **Respect Your Pace**:
   - Whether you want to chat about big feelings or just need a quick pep talk, I’ll respect your pace and follow your lead. Let’s make this space comfortable for you!`

export async function POST(req) {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.API_KEY,
  })

  try {
    const data = await req.json();

    const completion = await openai.chat.completions.create({
      model: "meta-llama/llama-3.1-8b-instruct:free",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        ...data, // Ensure data is in the format [{ role: 'user', content: 'message' }]
      ],
      stream: true,
    });

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
        } catch (err) {
          console.error('Error during streaming:', err);
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new NextResponse(stream);
  } catch (error) {
    console.error('Error processing request:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}