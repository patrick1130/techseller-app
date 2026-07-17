import axios from 'axios';

// Use this if you want to make a call to OpenAI GPT-4 for instance. userId is used to identify the user on openAI side.
export const sendOpenAi = async (
  messages: any[], // TODO: type this
  userId: number | string, // 扩展类型兼容
  max = 1000, // 💡 优化：对于写文案，max_tokens 建议设大一点（比如 1000），100 太短了容易吐出一半 JSON 报错
  temp = 1
) => {

  // 🛠️ 核心防御：如果变量不存在，或者变量里包含了 openai.com 官方域名，我们强制 fallback 到 OpenRouter
  let url = 'https://openrouter.ai/api/v1/chat/completions';

  if (process.env.OPENAI_BASE_URL && !process.env.OPENAI_BASE_URL.includes('openai.com')) {
    url = `${process.env.OPENAI_BASE_URL}/chat/completions`;
  }

  console.log('📡 Spawning GPT Request on:', url);
  console.log('Ask GPT >>>');
  messages.map((m) =>
    console.log(' - ' + m.role.toUpperCase() + ': ' + m.content)
  );

  const body = {
    model: "meta-llama/llama-3.1-70b-instruct"
    // 或者
    // model: "deepseek/deepseek-chat"
    messages,
    max_tokens: max,
    temperature: temp,
    user: String(userId),
  };

  const options = {
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
      // 💡 OpenRouter 规范：建议加上这两个 Header 方便统计或在 OpenRouter 页面上辨识你的 App
      'HTTP-Referer': 'https://localhost:3000',
      'X-Title': 'TechSeller Tool',
    },
  };

  try {
    const res = await axios.post(url, body, options);

    // 调试：打印接口返回的所有数据，方便排查
    console.log('API Raw Response:', JSON.stringify(res.data));

    const choice = res.data?.choices?.[0];
    const answer = choice?.message?.content || choice?.text || null;

    if (!answer) {
      console.warn('⚠️ 未能从 API 返回中提取到有效的文本内容！');
    }

    const usage = res?.data?.usage;

    console.log('>>> ' + answer);
    console.log(
      'TOKENS USED: ' +
      usage?.total_tokens +
      ' (prompt: ' +
      usage?.prompt_tokens +
      ' / response: ' +
      usage?.completion_tokens +
      ')'
    );
    console.log('\n');

    return answer;
  } catch (e: any) {
    console.error('GPT Error: ' + e?.response?.status, e?.response?.data || e?.message);
    return null;
  }
};