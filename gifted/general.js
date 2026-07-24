const { gmd, commands, monospace, formatBytes } = require("../gift"),
  fs = require("fs"),
  axios = require("axios"),
  BOT_START_TIME = Date.now(),
  { totalmem: totalMemoryBytes, freemem: freeMemoryBytes } = require("os"),
  moment = require("moment-timezone"),
  more = String.fromCharCode(8206),
  readmore = more.repeat(4001),
  ram = `${formatBytes(freeMemoryBytes)}/${formatBytes(totalMemoryBytes)}`;
const { sendButtons } = require("gifted-btns");

gmd(
  {
    pattern: "ping",
    aliases: ["pi", "p"],
    react: "⚡",
    category: "geral",
    description: "Verificar velocidade de resposta do bot",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      react,
      newsletterJid,
      newsletterUrl,
      botFooter,
      botName,
      botPrefix,
    } = conText;
    const startTime = process.hrtime();

    await new Promise((resolve) =>
      setTimeout(resolve, Math.floor(80 + Math.random() * 420)),
    );

    const elapsed = process.hrtime(startTime);
    const responseTime = Math.floor(elapsed[0] * 1000 + elapsed[1] / 1000000);

    await sendButtons(Gifted, from, {
      title: "Velocidade do Bot",
      text: `⚡ Pong: ${responseTime}ms`,
      footer: `> *${botFooter}*`,
      buttons: [
        { id: `${botPrefix}uptime`, text: "⏱️ Tempo Online" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Canal WhatsApp",
            url: newsletterUrl,
          }),
        },
      ],
    });

    /*await Gifted.sendMessage(from, {
      text: 
      contextInfo: {
        forwardingScore: 5,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: newsletterJid,
          newsletterName: botName,
          serverMessageId: 143
        }
      }
    }, { quoted: mek });*/
    await react("✅");
  },
);

gmd(
  {
    pattern: "report",
    aliases: ["request"],
    react: "💫",
    description: "Solicitar Novos Recursos.",
    category: "dono",
  },
  async (from, Gifted, conText) => {
    const { mek, q, sender, react, pushName, botPrefix, isSuperUser, reply } =
      conText;
    const reportedMessages = {};
    const devlopernumber = "923493114170";
    try {
      if (!isSuperUser) return reply("*Comando Apenas para Dono*");
      if (!q)
        return reply(
          `Exemplo: ${botPrefix}request Olá, os comandos de downloader estão sem funcionar`,
        );
      const messageId = mek.key.id;
      if (reportedMessages[messageId]) {
        return reply(
          "Este relatório já foi encaminhado ao dono. Aguarde uma resposta.",
        );
      }
      reportedMessages[messageId] = true;
      const textt = `*| SOLICITAÇÃO/RELATÓRIO |*`;
      const teks1 = `\n\n*Usuário*: @${sender.split("@")[0]}\n*Solicitação:* ${q}`;
      Gifted.sendMessage(
        devlopernumber + "@s.whatsapp.net",
        {
          text: textt + teks1,
          mentions: [sender],
        },
        {
          quoted: mek,
        },
      );
      reply(
        "Obrigado pelo seu relatório. Ele foi encaminhado ao dono. Por favor, aguarde uma resposta.",
      );
      await react("✅");
    } catch (e) {
      reply(e);
      console.log(e);
    }
  },
);

gmd(
  {
    pattern: "menus",
    aliases: ["mainmenu", "mainmens"],
    description: "Exibir Tempo Online, Data, Hora e Outras Estatísticas do Bot",
    react: "📜",
    category: "geral",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      botFooter,
      timeZone,
      botPrefix,
      newsletterJid,
      reply,
      ownerNumber,
    } = conText;
    try {
      function formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        seconds %= 24 * 60 * 60;
        const hours = Math.floor(seconds / (60 * 60));
        seconds %= 60 * 60;
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }

      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now);

      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      const uptime = formatUptime(process.uptime());
      const totalCommands = commands.filter(
        (command) => command.pattern && !command.dontAddCommandList,
      ).length;

      let menus = `
*🦄 Tᴇᴍᴘᴏ Oɴʟɪɴᴇ :* ${monospace(uptime)}
*🍁 Dᴀᴛᴀ Dᴇ Hᴏᴊᴇ:* ${monospace(date)}
*🎗 Hᴏʀᴀ Aɢᴏʀᴀ:* ${monospace(time)}

➮Fᴏɴᴅᴀᴅᴏʀ - 𝐌ᴀғɪᴀ 𝐈ᴍᴀᴅ
➮Usᴜáʀɪᴏ - ${monospace(pushName)}
➮Núᴍ - ${monospace(ownerNumber)} 
➮Mᴇ́ᴍᴏʀɪᴀ - ${monospace(ram)}

*🧑‍💻 :* ${monospace(botName)} Eѕтá Dіѕρо́νеɪ

╭──❰ *Tᴏᴅᴏs Os Mᴇɴús* ❱
│🏮 Lɪsᴛᴀ
│🏮 Cᴀᴛᴇɢᴏʀɪᴀ
│🏮 Aјᴜᴅᴀ
│🏮 Vɪᴠᴏ
│🏮 Tᴇᴍᴘᴏ Oɴʟɪɴᴇ
│🏮 Cʟɪᴍᴀ
│🏮 Lɪɴᴋ
│🏮 Cᴘᴜ
│🏮 Rᴇᴘᴏsɪ́ᴛᴏʀɪᴏ
╰─────────────⦁`;

      const giftedMess = {
        image: { url: botPic },
        caption: menus.trim(),
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      };
      await Gifted.sendMessage(from, giftedMess, { quoted: mek });
      await react("✅");
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

gmd(
  {
    pattern: "list",
    aliases: ["listmenu", "listmen"],
    description: "Mostrar Todos os Comandos e Seus Usos",
    react: "📜",
    category: "geral",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      botFooter,
      timeZone,
      botPrefix,
      newsletterJid,
      reply,
    } = conText;
    try {
      function formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        seconds %= 24 * 60 * 60;
        const hours = Math.floor(seconds / (60 * 60));
        seconds %= 60 * 60;
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }

      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now);

      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      const uptime = formatUptime(process.uptime());
      const totalCommands = commands.filter(
        (command) => command.pattern && !command.dontAddCommandList,
      ).length;

      let list = `
╭━━〔 *${monospace(botName)}* 〕━━╮
│ ✦ *Mᴏᴅᴏ* : ${monospace(botMode)}
│ ✦ *Pʀᴇғɪxᴏ* : [ ${monospace(botPrefix)} ]
│ ✦ *Usuáʀɪᴏ* : ${monospace(pushName)}
│ ✦ *Pʟᴜɢɪɴs* : ${monospace(totalCommands.toString())}
│ ✦ *Vᴇʀsãᴏ* : ${monospace(botVersion)}
│ ✦ *Tᴇᴍᴘᴏ Oɴʟɪɴᴇ* : ${monospace(uptime)}
│ ✦ *Hᴏʀᴀ Aɢᴏʀᴀ* : ${monospace(time)}
│ ✦ *Dᴀᴛᴀ Dᴇ Hᴏᴊᴇ* : ${monospace(date)}
│ ✦ *Zᴏɴᴀ Dᴇ Hᴏʀáʀɪᴏ* : ${monospace(timeZone)}
│ ✦ *RAM Dᴏ Sᴇʀᴠɪᴅᴏʀ* : ${monospace(ram)}
╰─────────────╯${readmore}\n`;

      commands.forEach((gmd, index) => {
        if (gmd.pattern && gmd.description) {
          list += `*${index + 1} ${monospace(gmd.pattern)}*\n  ${gmd.description}\n`;
        }
      });

      const giftedMess = {
        image: { url: botPic },
        caption: list.trim(),
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      };
      await Gifted.sendMessage(from, giftedMess, { quoted: mek });
      await react("✅");
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

gmd(
  {
    pattern: "menu",
    aliases: ["help", "men", "allmenu"],
    react: "🪀",
    category: "geral",
    description: "Obter menu principal do bot",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botMode,
      botVersion,
      botName,
      botFooter,
      timeZone,
      botPrefix,
      newsletterJid,
      reply,
    } = conText;
    try {
      function formatUptime(seconds) {
        const days = Math.floor(seconds / (24 * 60 * 60));
        seconds %= 24 * 60 * 60;
        const hours = Math.floor(seconds / (60 * 60));
        seconds %= 60 * 60;
        const minutes = Math.floor(seconds / 60);
        seconds = Math.floor(seconds % 60);
        return `${days}d ${hours}h ${minutes}m ${seconds}s`;
      }

      const now = new Date();
      const date = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      }).format(now);

      const time = new Intl.DateTimeFormat("en-GB", {
        timeZone: timeZone,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      }).format(now);

      const uptime = formatUptime(process.uptime());
      const regularCmds = commands.filter((c) => c.pattern && !c.on && !c.dontAddCommandList);
      const bodyCmds = commands.filter((c) => c.pattern && c.on === "body" && !c.dontAddCommandList);
      const totalCommands = regularCmds.length + bodyCmds.length;

      const categorized = commands.reduce((menu, gmd) => {
        if (gmd.pattern && !gmd.dontAddCommandList) {
          if (!menu[gmd.category]) menu[gmd.category] = [];
          menu[gmd.category].push({
            pattern: gmd.pattern,
            isBody: gmd.on === "body",
          });
        }
        return menu;
      }, {});

      const sortedCategories = Object.keys(categorized).sort((a, b) =>
        a.localeCompare(b),
      );
      for (const cat of sortedCategories) {
        categorized[cat].sort((a, b) => a.pattern.localeCompare(b.pattern));
      }

      let header = `╬══〘〘 *${monospace(botName)}* 〙〙═⊷
┃❍ *Mᴏᴅᴏ:*  ${monospace(botMode)}
┃❍ *Pʀᴇғɪxᴏ:*  [ ${monospace(botPrefix)} ]
┃❍ *Usuáʀɪᴏ:*  ${monospace(pushName)}
┃❍ *Pʟᴜɢɪɴs:*  ${monospace(totalCommands.toString())}
┃❍ *Vᴇʀsãᴏ:*  ${monospace(botVersion)}
┃❍ *Tᴇᴍᴘᴏ Oɴʟɪɴᴇ:*  ${monospace(uptime)}
┃❍ *Hᴏʀᴀ Aɢᴏʀᴀ:*  ${monospace(time)}
┃❍ *Dᴀᴛᴀ Dᴇ Hᴏᴊᴇ:*  ${monospace(date)}
┃❍ *Zᴏɴᴀ Dᴇ Hᴏʀáʀɪᴏ:*  ${monospace(timeZone)}
┃❍ *RAM Dᴏ Sᴇʀᴠɪᴅᴏʀ:*  ${monospace(ram)}
╰═════════════════⊷\n${readmore}\n`;

      const formatCategory = (category, gmds) => {
        const title = `╬━━━━❮ *${monospace(category.toUpperCase())}* ❯━⊷ \n`;
        const body = gmds
          .map((gmd) => {
            const prefix = gmd.isBody ? "" : botPrefix;
            return `┃◇ ${monospace(prefix + gmd.pattern)}`;
          })
          .join("\n");
        const footer = `╰━━━━━━━━━━━━━━━━━⊷\n`;
        return `${title}${body}\n${footer}\n`;
      };

      let menu = header;
      for (const category of sortedCategories) {
        menu += formatCategory(category, categorized[category]) + "\n";
      }

      const giftedMess = {
        image: { url: botPic },
        caption: `${menu.trim()}\n\n> *${botFooter}*`,
        contextInfo: {
          mentionedJid: [sender],
          forwardingScore: 5,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: newsletterJid,
            newsletterName: botName,
            serverMessageId: 0,
          },
        },
      };
      await Gifted.sendMessage(from, giftedMess, { quoted: mek });
      await react("✅");
    } catch (e) {
      console.error(e);
      reply(`${e}`);
    }
  },
);

gmd(
  {
    pattern: "return",
    aliases: ["details", "det", "ret"],
    react: "⚡",
    category: "dono",
    description:
      "Exibe a mensagem citada completa usando a estrutura Braille.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      reply,
      react,
      quotedMsg,
      isSuperUser,
      botName,
      botFooter,
      newsletterJid,
      newsletterUrl,
    } = conText;

    if (!isSuperUser) {
      return reply(`Comando Apenas para Dono!`);
    }

    if (!quotedMsg) {
      return reply(`Por favor, responda/cite uma mensagem.`);
    }

    try {
      const jsonString = JSON.stringify(quotedMsg, null, 2);
      const chunks = jsonString.match(/[\s\S]{1,100000}/g) || [];

      for (const chunk of chunks) {
        const formattedMessage = `\`\`\`\n${chunk}\n\`\`\``;

        await sendButtons(Gifted, from, {
          title: "",
          text: formattedMessage,
          footer: `> *${botFooter}*`,
          buttons: [
            {
              name: "cta_copy",
              buttonParamsJson: JSON.stringify({
                display_text: "Copiar",
                copy_code: formattedMessage,
              }),
            },
            {
              name: "cta_url",
              buttonParamsJson: JSON.stringify({
                display_text: "Canal WhatsApp",
                url: newsletterUrl,
              }),
            },
          ],
        });

        /* await Gifted.sendMessage(
        from,
        {
          text: formattedMessage,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 143
            },
          },
        },
        { quoted: mek }
      );*/
        await react("✅");
      }
    } catch (error) {
      console.error("Erro ao processar mensagem citada:", error);
      await reply(`❌ Ocorreu um erro ao processar a mensagem.`);
    }
  },
);

gmd(
  {
    pattern: "uptime",
    aliases: ["up"],
    react: "⏳",
    category: "geral",
    description: "Verificar status de tempo online do bot.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      react,
      newsletterJid,
      newsletterUrl,
      botFooter,
      botName,
      botPrefix,
    } = conText;

    const uptimeMs = Date.now() - BOT_START_TIME;

    const seconds = Math.floor((uptimeMs / 1000) % 60);
    const minutes = Math.floor((uptimeMs / (1000 * 60)) % 60);
    const hours = Math.floor((uptimeMs / (1000 * 60 * 60)) % 24);
    const days = Math.floor(uptimeMs / (1000 * 60 * 60 * 24));

    await sendButtons(Gifted, from, {
      title: "",
      text: `⏱️ Tempo Online: ${days}d ${hours}h ${minutes}m ${seconds}s`,
      footer: `> *${botFooter}*`,
      buttons: [
        { id: `${botPrefix}ping`, text: "⚡ Ping" },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Canal WhatsApp",
            url: newsletterUrl,
          }),
        },
      ],
    });
    await react("✅");
  },
);

gmd(
  {
    pattern: "repo",
    aliases: ["sc", "rep", "script"],
    react: "💜",
    category: "geral",
    description: "Obter script do bot.",
  },
  async (from, Gifted, conText) => {
    const {
      mek,
      sender,
      react,
      pushName,
      botPic,
      botName,
      botFooter,
      newsletterUrl,
      ownerName,
      newsletterJid,
      giftedRepo,
    } = conText;

    const response = await axios.get(
      `https://api.github.com/repos/${giftedRepo}`,
    );
    const repoData = response.data;
    const {
      full_name,
      name,
      forks_count,
      stargazers_count,
      created_at,
      updated_at,
      owner,
    } = repoData;
    const messageText = `Olá *_${pushName}_,*\nEste é o *${botName},* Um Bot WhatsApp Criado por *${ownerName},* Aprimorado com Incríveis Funcionalidades para Tornar Sua Experiência de Comunicação e Interação no WhatsApp Incrível\n\n*❲❒❳ Nᴏᴍᴇ:* ${name}\n*❲❒❳ Eѕᴛᴀʀs:* ${stargazers_count}\n*❲❒❳ Fᴏʀᴋs:* ${forks_count}\n*❲❒❳ Cʀɪᴀᴅᴏ ᴇᴍ:* ${new Date(created_at).toLocaleDateString()}\n*❲❒❳ Úʟᴛɪᴍᴀ ᴀᴄʜᴀᴅᴀ:* ${new Date(updated_at).toLocaleDateString()}`;

    const dateNow = Date.now();
    await sendButtons(Gifted, from, {
      title: "",
      text: messageText,
      footer: `> *${botFooter}*`,
      image: { url: botPic },
      buttons: [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "Copiar Link",
            copy_code: `https://github.com/${giftedRepo}`,
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "Visitar Repositório",
            url: `https://github.com/${giftedRepo}`,
          }),
        },
        {
          id: `repo_dl_${dateNow}`,
          text: "📥 Baixar Zip",
        },
      ],
    });

    const handleResponse = async (event) => {
      const messageData = event.messages[0];
      if (!messageData?.message) return;

      const templateButtonReply =
        messageData.message?.templateButtonReplyMessage;
      if (!templateButtonReply) return;

      const selectedButtonId = templateButtonReply.selectedId;
      if (!selectedButtonId?.includes(`repo_dl_${dateNow}`)) return;

      const isFromSameChat = messageData.key?.remoteJid === from;
      if (!isFromSameChat) return;

      try {
        const zipUrl = `https://github.com/${giftedRepo}/archive/refs/heads/main.zip`;
        await Gifted.sendMessage(
          from,
          {
            document: { url: zipUrl },
            fileName: `${name}.zip`,
            mimetype: "application/zip",
          },
          { quoted: messageData },
        );
        await react("✅");
      } catch (dlErr) {
        await Gifted.sendMessage(from, { text: "Falha ao baixar o zip do repositório: " + dlErr.message }, { quoted: messageData });
      }

      Gifted.ev.off("messages.upsert", handleResponse);
    };

    Gifted.ev.on("messages.upsert", handleResponse);
    setTimeout(
      () => Gifted.ev.off("messages.upsert", handleResponse),
      120000,
    );

    await react("✅");
  },
);

gmd(
  {
    pattern: "save",
    aliases: ["sv", "s", "sav", "."],
    react: "⚡",
    category: "dono",
    description:
      "Salvar mensagens (suporta imagens, vídeos, áudio, adesivos e texto).",
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, sender, isSuperUser, getMediaBuffer } = conText;

    if (!isSuperUser) {
      return reply(`❌ Comando Apenas para Dono!`);
    }

    const quotedMsg =
      mek.message?.extendedTextMessage?.contextInfo?.quotedMessage;

    if (!quotedMsg) {
      return reply(`⚠️ Por favor, responda/cite uma mensagem.`);
    }

    try {
      let mediaData;

      if (quotedMsg.imageMessage) {
        const buffer = await getMediaBuffer(quotedMsg.imageMessage, "image");
        mediaData = {
          image: buffer,
          caption: quotedMsg.imageMessage.caption || "",
        };
      } else if (quotedMsg.videoMessage) {
        const buffer = await getMediaBuffer(quotedMsg.videoMessage, "video");
        mediaData = {
          video: buffer,
          caption: quotedMsg.videoMessage.caption || "",
        };
      } else if (quotedMsg.audioMessage) {
        const buffer = await getMediaBuffer(quotedMsg.audioMessage, "audio");
        mediaData = {
          audio: buffer,
          mimetype: "audio/mp4",
        };
      } else if (quotedMsg.stickerMessage) {
        const buffer = await getMediaBuffer(
          quotedMsg.stickerMessage,
          "sticker",
        );
        mediaData = {
          sticker: buffer,
        };
      } else if (quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage?.message?.documentMessage) {
        const docMsg = quotedMsg.documentMessage || quotedMsg.documentWithCaptionMessage.message.documentMessage;
        const buffer = await getMediaBuffer(docMsg, "document");
        mediaData = {
          document: buffer,
          fileName: docMsg.fileName || "documento",
          mimetype: docMsg.mimetype || "application/octet-stream",
        };
      } else if (
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text
      ) {
        const text =
          quotedMsg.conversation || quotedMsg.extendedTextMessage.text;
        mediaData = {
          text: text,
        };
      } else if (quotedMsg.buttonsMessage || quotedMsg.templateMessage || quotedMsg.interactiveMessage || quotedMsg.listMessage || quotedMsg.buttonsResponseMessage || quotedMsg.templateButtonReplyMessage) {
        let text = "";
        if (quotedMsg.buttonsMessage) {
          text = quotedMsg.buttonsMessage.contentText || quotedMsg.buttonsMessage.text || "";
        } else if (quotedMsg.templateMessage?.hydratedTemplate) {
          text = quotedMsg.templateMessage.hydratedTemplate.hydratedContentText || "";
        } else if (quotedMsg.interactiveMessage?.body?.text) {
          text = quotedMsg.interactiveMessage.body.text;
        } else if (quotedMsg.listMessage) {
          text = quotedMsg.listMessage.description || quotedMsg.listMessage.title || "";
        } else if (quotedMsg.buttonsResponseMessage) {
          text = quotedMsg.buttonsResponseMessage.selectedDisplayText || "";
        } else if (quotedMsg.templateButtonReplyMessage) {
          text = quotedMsg.templateButtonReplyMessage.selectedDisplayText || "";
        }
        if (!text) {
          return reply(`❌ Não foi possível extrair texto da mensagem citada.`);
        }
        mediaData = {
          text: text,
        };
      } else {
        return reply(`❌ Tipo de mensagem não suportado.`);
      }

      await Gifted.sendMessage(sender, mediaData, { quoted: mek });
      await react("✅");
    } catch (error) {
      console.error("Erro ao salvar:", error);
      await reply(`❌ Falha ao salvar a mensagem. Erro: ${error.message}`);
    }
  },
);


gmd(
  {
    pattern: "chjid",
    aliases: [
      "channeljid",
      "chinfo",
      "channelinfo",
      "newsletterjid",
      "newsjid",
      "newsletterinfo",
    ],
    react: "📢",
    category: "geral",
    description: "Obter Informações do Canal/Newsletter do WhatsApp",
  },
  async (from, Gifted, conText) => {
    const { q, reply, react, botFooter, botPrefix, GiftedTechApi, GiftedApiKey } = conText;

    const input = q?.trim();
    if (!input) {
      await react("❌");
      return reply(
        `❌ Forneça um link do canal.\nUso: *${botPrefix}chjid* https://whatsapp.com/channel/KEY`,
      );
    }

    const channelMatch = input.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i);
    if (!channelMatch) {
      await react("❌");
      return reply(
        "❌ Link do canal inválido. Forneça um link válido do canal do WhatsApp.\nExemplo: https://whatsapp.com/channel/ABC123",
      );
    }

    await react("🔍");
    const inviteKey = channelMatch[1];
    const channelUrl = `https://whatsapp.com/channel/${inviteKey}`;

    try {
      const meta = await Gifted.newsletterMetadata("invite", inviteKey);

      if (!meta || !meta.id) {
        await react("❌");
        return reply(
          "❌ Não foi possível obter informações do canal. O link pode ser inválido ou o canal não existe mais.",
        );
      }

      const channelJid = meta.id;
      const tm = meta.thread_metadata || {};

      const name = tm.name?.text || "Canal Desconhecido";
      const rawDesc = tm.description?.text || "";
      const verification = tm.verification || "";
      const isVerified = verification === "VERIFIED";
      const stateType = meta.state?.type || "";
      const isActive = stateType === "ACTIVE";

      const subCount = parseInt(tm.subscribers_count || "0", 10);
      const followers =
        subCount >= 1_000_000
          ? `${(subCount / 1_000_000).toFixed(1)}M`
          : subCount >= 1_000
            ? `${(subCount / 1_000).toFixed(1)}K`
            : subCount > 0
              ? subCount.toLocaleString()
              : "N/A";

      let picUrl = null;
      try {
        const apiUrl = `${GiftedTechApi}/api/stalk/wachannel?apikey=${GiftedApiKey}&url=${encodeURIComponent(channelUrl)}`;
        const apiRes = await axios.get(apiUrl, { timeout: 10000 });
        picUrl = apiRes.data?.result?.img || null;
      } catch (apiErr) {
        console.error("Erro ao buscar imagem chjid:", apiErr.message);
      }

      const MAX_DESC = 200;
      let descSection = "";
      if (rawDesc) {
        const trimmed = rawDesc.trim();
        if (trimmed.length > MAX_DESC) {
          const visible = trimmed.slice(0, MAX_DESC);
          const hidden = trimmed.slice(MAX_DESC);
          descSection = `\n\n📄 *Descrição:*\n${visible}${readmore}${hidden}`;
        } else {
          descSection = `\n\n📄 *Descrição:*\n${trimmed}`;
        }
      }

      const text =
        `📢 *Informações do Canal*\n\n` +
        `🔖 *Nome:* ${name}\n` +
        `🟢 *Status:* ${isActive ? "Ativo" : stateType || "Desconhecido"}\n` +
        `${isVerified ? "✅ *Verificado:* Sim\n" : "❌ *Verificado:* Não\n"}` +
        `👥 *Seguidores:* ${followers}\n` +
        `🆔 *JID:* \`${channelJid}\`` +
        descSection;

      const buttons = [
        {
          name: "cta_copy",
          buttonParamsJson: JSON.stringify({
            display_text: "📋 Copiar JID",
            copy_code: channelJid,
          }),
        },
        {
          name: "cta_url",
          buttonParamsJson: JSON.stringify({
            display_text: "➕ Seguir Canal",
            url: channelUrl,
            merchant_url: channelUrl,
          }),
        },
      ];

      const sendOpts = {
        text,
        footer: botFooter,
        buttons,
      };

      if (picUrl) {
        sendOpts.image = { url: picUrl };
      }

      await sendButtons(Gifted, from, sendOpts);
      await react("✅");
    } catch (error) {
      console.error("Erro chjid:", error);
      await react("❌");
      await reply(`❌ Erro ao buscar informações do canal: ${error.message}`);
    }
  },
);
