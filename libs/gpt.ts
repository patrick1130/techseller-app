import axios from 'axios';

export const sendOpenAi = async (
  messages: any[],
  userId: number | string,
  max = 3000, // 放大 Token 限制以适应长文案
  temp = 0.7,
  model = "openai/gpt-4o-mini", // 👈 核心修改：接收动态模型参数，默认使用 mini
  customApiKey: string | null = null // 👈 核心修改：接收用户自带的 API Key
) => {

  let url = 'https://openrouter.ai/api/v1/chat/completions';

  if (process.env.OPENAI_BASE_URL && !process.env.OPENAI_BASE_URL.includes('openai.com')) {
    url = `${process.env.OPENAI_BASE_URL}/chat/completions`;
  }

  // 适配 OpenRouter 的模型命名规则：如果上层传的是 "gpt-4o" 且使用的是 OpenRouter，自动补全 "openai/"
  let finalModel = model;
  if (url.includes('openrouter.ai') && !finalModel.includes('/')) {
    finalModel = `openai/${finalModel}`;
  }

  console.log(`📡 Spawning GPT Request on: ${url} with model: ${finalModel}`);

  const body = {
    // 👈 核心修改：使用动态处理后的模型变量
    model: finalModel,
    messages,
    max_tokens: max,
    response_format: { type: "json_object" },
    temperature: temp,
    user: String(userId),
  };

  // 👈 核心修改：优先使用用户的 Key（BYOK 模式），否则回退到环境变量中的官方 Key
  const apiKey = customApiKey ? customApiKey : process.env.OPENAI_API_KEY;

  const options = {
    headers: {
      Authorization: `Bearer ${apiKey}`,
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