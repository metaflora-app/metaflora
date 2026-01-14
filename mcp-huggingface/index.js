const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");
const { CallToolRequestSchema, ListToolsRequestSchema } = require("@modelcontextprotocol/sdk/types.js");
const fetch = require("node-fetch");

const HF_TOKEN = "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";
const MODEL_ID = "Qwen/Qwen2.5-Coder-32B-Instruct"; // Оптимальная модель для API

const server = new Server(
  {
    name: "huggingface-qwen-coder",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: "ask_qwen_coder",
        description: "Задать вопрос Qwen 2.5 Coder (специалист по коду) через Hugging Face API",
        inputSchema: {
          type: "object",
          properties: {
            prompt: {
              type: "string",
              description: "Текст вашего запроса или описание задачи по коду",
            },
          },
          required: ["prompt"],
        },
      },
    ],
  };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name === "ask_qwen_coder") {
    const prompt = request.params.arguments.prompt;

    try {
      const response = await fetch(
        `https://api-inference.huggingface.co/models/${MODEL_ID}`,
        {
          headers: {
            Authorization: `Bearer ${HF_TOKEN}`,
            "Content-Type": "application/json",
          },
          method: "POST",
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 2000,
              return_full_text: false,
            },
          }),
        }
      );

      const result = await response.json();
      
      if (result.error) {
        return {
          content: [
            {
              type: "text",
              text: `Ошибка HF API: ${result.error}`,
            },
          ],
          isError: true,
        };
      }

      return {
        content: [
          {
            type: "text",
            text: Array.isArray(result) ? result[0].generated_text : result.generated_text,
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Ошибка при вызове Qwen: ${error.message}`,
          },
        ],
        isError: true,
      };
    }
  }

  throw new Error("Tool not found");
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Hugging Face Qwen MCP Server running!");
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
