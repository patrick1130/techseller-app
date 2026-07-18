import axios from 'axios';

export const sendOpenAi = async (
  messages: any[],
  userId: number | string,
  max = 3000, // 放大 Token 限制以适应长文案
  temp = 0.7
) => {

  let url = 'https://openrouter.ai/api/v1/chat/completions';

  if (process.env.OPENAI_BASE_URL && !process.env.OPENAI_BASE_URL.includes('openai.com')) {
    url = `${process.env.OPENAI_BASE_URL}/chat/completions`;
  }

  console.log('📡 Spawning GPT Request on:', url);

  const body = {
    model: "openai/gpt-4o-mini",
    //meta-llama/llama-3.1-8b-instruct,deepseek/deepseek-chat
    messages,
    max_tokens: max,
    response_format: { type: "json_object" },
    temperature: temp,
    user: String(userId),
  };

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://techseller.pritihk.tech', // 换成你的线上主域名
      'X-Title': 'TechSeller Tool',
    },
  };

  try {
    const res = await axios.post(url, body, options);
    const choice = res.data?.choices?.[0];
    const answer = choice?.message?.content || choice?.text || null;

    if (!answer) {
      console.warn('⚠️ 未能从 API 返回中提取到有效的文本内容！');
    }

    return answer;
  } catch (e: any) {
    console.error('GPT Error: ' + e?.response?.status, e?.response?.data || e?.message);
    return null;
  }
};