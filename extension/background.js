const MODEL = 'claude-haiku-4-5-20251001';
const API_URL = 'https://api.anthropic.com/v1/messages';

async function getApiKey() {
  const result = await chrome.storage.local.get(['anthropicApiKey']);
  return result.anthropicApiKey;
}

function buildThreadText(thread) {
  const lines = [
    `Subject: ${thread.subject}`,
    '',
    `Total messages in thread: ${thread.messages.length}`,
    ''
  ];
  thread.messages.forEach((m, idx) => {
    lines.push(`========== MESSAGE ${idx + 1} of ${thread.messages.length} ==========`);
    lines.push(`From: ${m.sender}`);
    lines.push(`Date: ${m.date}`);
    lines.push('Body:');
    lines.push(m.body);
    lines.push('');
  });
  return lines.join('\n');
}

async function summarizeEmail(thread) {
  const apiKey = await getApiKey();
  if (!apiKey) {
    return { error: 'No API key set. Click the extension icon -> Open Settings.' };
  }

  const isThread = thread.messages.length > 1;
  const threadText = buildThreadText(thread);
  const n = thread.messages.length;

  const prompt = `You are an email assistant. Below is ${isThread ? `an EMAIL THREAD containing ${n} messages in chronological order (Message 1 is the earliest, Message ${n} is the most recent)` : 'an email'}. Produce a thorough, structured summary covering ${isThread ? 'the ENTIRE thread from start to finish' : 'the email'}.

Use EXACTLY this format. Section headers go on their own line in ALL CAPS, exactly as written below. Under each header, put bullet lines starting with "- " (dash space).

OVERVIEW
- 1 to 2 bullets explaining what the ${isThread ? 'thread' : 'email'} is about overall, who the participants are, and the core subject. Do not include dates here.

CONVERSATION FLOW
${isThread ? `- This section is the most important. Walk through every single message in the thread sequentially, from the first message to the last (all ${n} messages). 
- For each message, write 1 to 3 bullets describing what that person said, asked, agreed to, or pushed back on.
- Use this exact format for the lead bullet of each message: "- [Sender name]: [what they said or did, in detail]"
- DO NOT include dates, days, times, or message numbers in the bullets. No "Message 1", no "(Apr 27)", no "(3:35 PM)", no "yesterday", no "the next day". Just sender name and content.
- For follow-ups on the same message, indent with sub-bullets if there are sub-points worth capturing (multiple feedback items, multiple questions, etc.).
- The order of bullets must match the chronological order of the messages, but the bullets themselves should read as a continuous narrative of who said what and how the other person responded.
- Cover all ${n} messages. Do not skip any.` : '- One bullet describing what this single message communicates.'}

KEY POINTS
- 4 to 7 bullets capturing the most important substantive content from across ${isThread ? 'the entire thread' : 'the email'}. Pull out concrete details: numbers, names, products, requirements, feedback, decisions. Avoid date/time stamps unless a date itself is the substantive point.

ACTION ITEMS
- List every action that has been requested or that the recipient should take, considering the LATEST state of the conversation (later messages may resolve or supersede earlier asks).
- For each action, state what to do.
- If genuinely none, write a single bullet: "- None required."

DEADLINES & DATES
- This is the only section where dates belong.
- Every date or deadline mentioned anywhere in the ${isThread ? 'thread' : 'email'}, with what it refers to.
- If none, write a single bullet: "- None mentioned."

LINKS & NEXT STEPS
- Any links, meeting invites, buttons, attachments, or specific next steps mentioned across ${isThread ? 'the thread' : 'the email'}.
- If none, write a single bullet: "- None."

CONCLUSION
- 2 to 4 bullets synthesizing where things currently stand based on the LAST message and the overall trajectory of the conversation.
- State the final outcome or current status clearly: what was decided, what is agreed, what is still pending or unresolved, and what the recipient should expect next.
- This is the "if I only read one section, what do I need to know" summary.

TONE & PRIORITY
- One bullet on the overall tone of the ${isThread ? 'conversation' : 'email'}.
- One bullet on priority for the recipient (high / medium / low) with a brief reason.

Strict formatting rules:
- DO NOT use markdown. No asterisks, no double asterisks, no underscores, no backticks, no markdown headers (#).
- DO NOT bold or italicize anything.
- Section headers stay in ALL CAPS as shown.
- DO NOT include dates, days of the week, or times anywhere except in the DEADLINES & DATES section.
- Be specific and concrete. Avoid vague phrases like "discussed details" - say what the details were.
- Do not invent information not present in the ${isThread ? 'thread' : 'email'}.

${isThread ? 'Email thread' : 'Email'} to summarize:

${threadText}`;

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      return { error: `API error ${response.status}: ${errText.slice(0, 250)}` };
    }

    const data = await response.json();
    let summary = data.content[0].text;
    summary = summary
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/^#+\s+/gm, '');
    return { summary };
  } catch (e) {
    return { error: 'Network error: ' + e.message };
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SUMMARIZE') {
    summarizeEmail(message.payload).then(sendResponse);
    return true;
  }
});
