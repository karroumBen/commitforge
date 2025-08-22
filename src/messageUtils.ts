export async function generateAIMessage(
  fileName: string,
  diff: string
): Promise<string> {
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: `Summarize these changes in ${fileName}: ${diff}`,
        },
      ],
    }),
  });
  const data: any = await res.json();
  return data.choices[0].message.content;
}
