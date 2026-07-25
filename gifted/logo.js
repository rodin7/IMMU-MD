const { gmd, gmdBuffer } = require("../gift");
const axios = require("axios");

const logoEndpoints = [
  {
    pattern: "glossysilver",
    aliases: ["glossy", "silverlogo"],
    description: "Logotipo Prateado Brilhante",
    endpoint: "glossysilver",
  },
  {
    pattern: "writetext",
    aliases: ["textwrite", "baby", "writtentext"],
    description: "Texto Escrito",
    endpoint: "writetext",
  },
  {
    pattern: "blackpinklogo",
    aliases: ["bplogo", "pinkblack"],
    description: "Logo Black Pink",
    endpoint: "blackpinklogo",
  },
  {
    pattern: "glitchtext",
    aliases: ["glitch", "textglitch"],
    description: "Texto Glitch",
    endpoint: "glitchtext",
  },
  {
    pattern: "advancedglow",
    aliases: ["advglow", "glowadvanced"],
    description: "Brilho Avançado",
    endpoint: "advancedglow",
  },
  {
    pattern: "typographytext",
    aliases: ["typography", "typo"],
    description: "Texto Tipográfico",
    endpoint: "typographytext",
  },
  {
    pattern: "pixelglitch",
    aliases: ["pixelg", "glitchpixel"],
    description: "Glitch Pixelado",
    endpoint: "pixelglitch",
  },
  {
    pattern: "neonglitch",
    aliases: ["neong", "glitchneon"],
    description: "Glitch Neon",
    endpoint: "neonglitch",
  },
  {
    pattern: "nigerianflag",
    aliases: ["ngflag", "nigeria"],
    description: "Bandeira da Nigéria",
    endpoint: "nigerianflag",
  },
  {
    pattern: "americanflag",
    aliases: ["usflag", "usaflag", "america"],
    description: "Bandeira Americana",
    endpoint: "americanflag",
  },
  {
    pattern: "deletingtext",
    aliases: ["deltext", "textdelete"],
    description: "Texto Apagando",
    endpoint: "deletingtext",
  },
  {
    pattern: "blackpinkstyle",
    aliases: ["bpstyle", "pinkblackstyle"],
    description: "Estilo Blackpink",
    endpoint: "blackpinkstyle",
  },
  {
    pattern: "glowingtext",
    aliases: ["glowtxt", "textglow"],
    description: "Texto Brilhante",
    endpoint: "glowingtext",
  },
  {
    pattern: "underwater",
    aliases: ["underw", "waterlogo"],
    description: "Submerso na Água",
    endpoint: "underwater",
  },
  {
    pattern: "logomaker",
    aliases: ["makelogo", "logomake"],
    description: "Criador de Logos",
    endpoint: "logomaker",
  },
  {
    pattern: "cartoonstyle",
    aliases: ["cartoon", "toonlogo"],
    description: "Estilo Desenho Animado",
    endpoint: "cartoonstyle",
  },
  {
    pattern: "papercut",
    aliases: ["cutpaper", "papercutlogo"],
    description: "Recorte de Papel",
    endpoint: "papercut",
  },
  {
    pattern: "effectclouds",
    aliases: ["cloudeffect", "clouds"],
    description: "Efeito Nuvens",
    endpoint: "effectclouds",
  },
  {
    pattern: "gradienttext",
    aliases: ["gradient", "textgradient"],
    description: "Texto Degradê",
    endpoint: "gradienttext",
  },
  {
    pattern: "summerbeach",
    aliases: ["beachsummer", "beach"],
    description: "Praia de Verão",
    endpoint: "summerbeach",
  },
  {
    pattern: "sandsummer",
    aliases: ["summersand", "sand", "sandlogo"],
    description: "Areia de Verão",
    endpoint: "sandsummer",
  },
  {
    pattern: "luxurygold",
    aliases: ["goldluxury", "luxgold"],
    description: "Ouro de Luxo",
    endpoint: "luxurygold",
  },
  {
    pattern: "galaxy",
    aliases: ["galaxylogo", "space"],
    description: "Galáxia",
    endpoint: "galaxy",
  },
  {
    pattern: "logo1917",
    aliases: ["1917", "1917logo"],
    description: "Estilo 1917",
    endpoint: "1917",
  },
  {
    pattern: "makingneon",
    aliases: ["neonmake", "neonlogo"],
    description: "Neon Criativo",
    endpoint: "makingneon",
  },
  {
    pattern: "texteffect",
    aliases: ["effecttext", "fxtext"],
    description: "Efeito de Texto",
    endpoint: "texteffect",
  },
  {
    pattern: "galaxystyle",
    aliases: ["stylegalaxy", "galstyle"],
    description: "Estilo Galáxia",
    endpoint: "galaxystyle",
  },
  {
    pattern: "lighteffect",
    aliases: ["effectlight", "lightlogo"],
    description: "Efeito de Luz",
    endpoint: "lighteffect",
  },
];

async function createLogoCommand(config) {
  gmd(
    {
      pattern: config.pattern,
      aliases: config.aliases,
      category: "logo",
      react: "🎨",
      description: `Criar ${config.description}`,
    },
    async (from, Gifted, conText) => {
      const {
        q,
        mek,
        reply,
        react,
        GiftedTechApi,
        GiftedApiKey,
        pushname,
        botCaption,
      } = conText;

      if (!q) {
        await react("❌");
        return reply(
          `Por favor, forneça um texto para o logotipo.\n\nUso: .${config.pattern} <texto>\nExemplo: .${config.pattern} ${pushname || "Immu Tech"}`,
        );
      }

      try {
        await react("⏳");

        const apiUrl = `${GiftedTechApi}/api/ephoto360/${config.endpoint}?apikey=${GiftedApiKey}&text=${encodeURIComponent(q)}`;
        const res = await axios.get(apiUrl, { timeout: 60000 });

        if (!res.data || !res.data.success || !res.data.result?.image_url) {
          await react("❌");
          return reply("Falha ao gerar o logotipo. Tente novamente.");
        }

        const imageUrl = res.data.result.image_url;
        const imageBuffer = await gmdBuffer(imageUrl);

        if (!imageBuffer || !Buffer.isBuffer(imageBuffer)) {
          await react("❌");
          return reply("Falha ao baixar o logotipo gerado.");
        }

        await Gifted.sendMessage(
          from,
          {
            image: imageBuffer,
            caption: `✨ *${config.description}*\n\n📝 *Texto:* ${q}\n\n> ${botCaption}`,
          },
          { quoted: mek },
        );

        await react("✅");
      } catch (e) {
        console.error(`Erro no comando ${config.pattern}:`, e.message);
        await react("❌");
        await reply("Falha ao gerar o logotipo. Tente novamente mais tarde.");
      }
    },
  );
}

logoEndpoints.forEach((config) => createLogoCommand(config));

gmd(
  {
    pattern: "logolist",
    aliases: ["logos", "logo", "logohelp", "logomenu"],
    category: "logo",
    react: "📜",
    description: "Mostrar todos os comandos de logo disponíveis",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, botCaption, botName, botPrefix } = conText;

    const logoList = logoEndpoints
      .map((l, i) => `${i + 1}. *.${l.pattern}* - ${l.description}`)
      .join("\n");

    await reply(
      `🎨 *${botName} CRIADOR DE LOGOS*\n\n${logoList}\n\n📝 *Uso:* ${botPrefix}nomedo_comando <seu texto>\n📌 *Exemplo:* ${botPrefix}glossysilver Immu Tech\n\n> ${botCaption}`,
    );
    await react("✅");
  },
);
