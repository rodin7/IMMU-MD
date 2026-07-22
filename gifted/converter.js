const { gmd, toAudio, toVideo, toPtt, stickerToImage, gmdFancy, gmdRandom, getSetting, runFFmpeg, getVideoDuration, gmdSticker } = require("../gift");
const fs = require("fs").promises;
const { StickerTypes } = require("wa-sticker-formatter");

gmd({
    pattern: "sticker",
    aliases: ["st", "take"],
    category: "converter",
    react: "🔄️",
    description: "Converter imagem/vídeo/adesivo em adesivo.",
}, async (from, Gifted, conText) => {
    const { q, mek, reply, react, quoted, packName, packAuthor } = conText;

    try {
        if (!quoted) {
            await react("❌");
            return reply("Por favor, responda/cite uma imagem, vídeo ou adesivo.");
        }

        const quotedImg = quoted?.imageMessage || quoted?.message?.imageMessage;
        const quotedSticker = quoted?.stickerMessage || quoted?.message?.stickerMessage;
        const quotedVideo = quoted?.videoMessage || quoted?.message?.videoMessage;

        if (!quotedImg && !quotedSticker && !quotedVideo) {
            await react("❌");
            return reply("A mensagem citada não é uma imagem, vídeo ou adesivo.");
        }

        let tempFilePath;
        try {
            if (quotedImg || quotedVideo) {
                tempFilePath = await Gifted.downloadAndSaveMediaMessage(
                    quotedImg || quotedVideo,
                    "temp_media"
                );

                let fileExt = quotedImg ? ".jpg" : ".mp4";
                let mediaFile = gmdRandom(fileExt);
                const data = await fs.readFile(tempFilePath);
                await fs.writeFile(mediaFile, data);

                // 🔥 Se for vídeo → converter para webp
                if (quotedVideo) {
                    const compressedFile = gmdRandom(".webp");
                    let duration = 8; // duração padrão
                    
                    try {
                        duration = await getVideoDuration(mediaFile);
                        if (duration > 10) duration = 10; // recortar para os primeiros 10 segundos
                    } catch (e) {
                        console.error("Usando duração padrão devido ao erro:", e);
                    }
                    
                    await runFFmpeg(mediaFile, compressedFile, 320, 15, duration);
                    await fs.unlink(mediaFile).catch(() => {});
                    mediaFile = compressedFile;
                }

                const stickerBuffer = await gmdSticker(mediaFile, {
                    pack: packName || "𝐈ᴍᴍυ Mᴅ", 
                    author: packAuthor || "𝐌ᴀғɪᴀ 𝐈ᴍᴀᴅ",
                    type: q.includes("--crop") || q.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: "12345",
                    quality: 75,
                    background: "transparent"
                });

                await fs.unlink(mediaFile).catch(() => {});
                await react("✅");
                return Gifted.sendMessage(from, { sticker: stickerBuffer }, { quoted: mek });

            } else if (quotedSticker) {
                // Adesivo → Adesivo (recomprimir se estiver muito grande)
                tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedSticker, "temp_media");
                const stickerData = await fs.readFile(tempFilePath);
                const stickerFile = gmdRandom(".webp");
                await fs.writeFile(stickerFile, stickerData);

                const newStickerBuffer = await gmdSticker(stickerFile, {
                    pack: packName || "𝐈ᴍᴍυ Mᴅ", 
                    author: packAuthor || "𝐈ᴍᴍυ Mᴅ",
                    type: q.includes("--crop") || q.includes("-c") ? StickerTypes.CROPPED : StickerTypes.FULL,
                    categories: ["🤩", "🎉"],
                    id: "12345",
                    quality: 75,
                    background: "transparent"
                });

                await fs.unlink(stickerFile).catch(() => {});
                await react("✅");
                return Gifted.sendMessage(from, { sticker: newStickerBuffer }, { quoted: mek });
            }
        } finally {
            if (tempFilePath) await fs.unlink(tempFilePath).catch(() => {});
        }
    } catch (e) {
        console.error("Erro no comando sticker:", e);
        await react("❌");
        await reply("Falha na conversão para adesivo.");
    }
});


gmd({
    pattern: "toimg",
    aliases: ["s2img"],
    category: "converter",
    react: "🔄️",
    description: "Converter adesivo em imagem.",
}, async (from, Gifted, conText) => {
    const { mek, reply, sender, botName, react, quoted, botFooter, quotedMsg, newsletterJid } = conText;

    try {
        if (!quotedMsg) {
            await react("❌");
            return reply("Por favor, responda/cite um adesivo.");
        }
        
        const quotedSticker = quoted?.stickerMessage || quoted?.message?.stickerMessage;
        if (!quotedSticker) {
            await react("❌");
            return reply("A mensagem citada não é um adesivo.");
        }
        
        let tempFilePath;
        try {
            tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedSticker, 'temp_media');
            const stickerBuffer = await fs.readFile(tempFilePath);
            const imageBuffer = await stickerToImage(stickerBuffer);  
            
            await Gifted.sendMessage(
                from,
                {
                  image: imageBuffer,
                  caption: `*Aqui está sua imagem*\n\n> *${botFooter}*`,
                  contextInfo: {
                    mentionedJid: [sender],
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
              );
            await react("✅");
        } finally {
            if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
        }
    } catch (e) {
        console.error("Erro no comando toimg:", e);
        await react("❌");
        await reply("Falha na conversão de adesivo para imagem.");
    }
});


gmd({
    pattern: "toaudio",
    aliases: ['tomp3'],
    category: "converter",
    react: "🔄️",
    description: "Converter vídeo em áudio"
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, botPic, quoted, quotedMsg, newsletterUrl } = conText;

    if (!quotedMsg) {
      await react("❌");
      return reply("Por favor, responda a uma mensagem de vídeo.");
    }

    const quotedVideo = quoted?.videoMessage || quoted?.message?.videoMessage || quoted?.pvtMessage || quoted?.message?.pvtMessage;
    
    if (!quotedVideo) {
      await react("❌");
      return reply("A mensagem citada não contém nenhum vídeo.");
    }

    let tempFilePath;
    try {
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedVideo, 'temp_media');
      const buffer = await fs.readFile(tempFilePath);
      const convertedBuffer = await toAudio(buffer);
      
      await Gifted.sendMessage(from, {
        audio: convertedBuffer,
        mimetype: "audio/mpeg",
        externalAdReply: {
          title: 'Áudio Convertido',
          body: 'Vídeo para Áudio',
          mediaType: 1,
          thumbnailUrl: botPic,
          sourceUrl: newsletterUrl,
          renderLargerThumbnail: false,
          showAdAttribution: true,
        }
      }, { quoted: mek });
      
      await react("✅");
    } catch (e) {
      console.error("Erro no comando toaudio:", e);
      await react("❌");
      const errMsg = e.message || String(e);
      if (errMsg.includes('no audio')) {
        await reply("Este vídeo não possui trilha de áudio para extrair.");
      } else {
        await reply("Falha na conversão de vídeo para áudio.");
      }
    } finally {
      if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
    }
  }
);


gmd({
    pattern: "toptt",
    aliases: ['tovoice', 'tovn', 'tovoicenote'],
    category: "converter",
    react: "🎙️",
    description: "Converter áudio em nota de voz do WhatsApp"
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, botPic, quoted, quotedMsg } = conText;

    if (!quotedMsg) {
      await react("❌");
      return reply("Por favor, responda a uma mensagem de áudio.");
    }

    const quotedAudio = quoted?.audioMessage || quoted?.message?.audioMessage;
    
    if (!quotedAudio) {
      await react("❌");
      return reply("A mensagem citada não contém nenhum áudio.");
    }

    let tempFilePath;
    try {
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedAudio, 'temp_media');
      const buffer = await fs.readFile(tempFilePath);
      const convertedBuffer = await toPtt(buffer);
      
      await Gifted.sendMessage(from, {
        audio: convertedBuffer,
        mimetype: "audio/ogg; codecs=opus",
        ptt: true,
      }, { quoted: mek });
      
      await react("✅");
    } catch (e) {
      console.error("Erro no comando toptt:", e);
      await react("❌");
      await reply("Falha na conversão para nota de voz.");
    } finally {
      if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
    }
  }
);


gmd({
    pattern: "tovideo",
    aliases: ['tomp4', 'tovid', 'toblackscreen', 'blackscreen'],
    category: "converter",
    react: "🎥",
    description: "Converter áudio em vídeo com tela preta"
  },
  async (from, Gifted, conText) => {
    const { mek, reply, react, botPic, quoted, quotedMsg } = conText;

    if (!quotedMsg) {
      await react("❌");
      return reply("Por favor, responda a uma mensagem de áudio.");
    }

    const quotedAudio = quoted?.audioMessage || quoted?.message?.audioMessage;
    
    if (!quotedAudio) {
      await react("❌");
      return reply("A mensagem citada não contém nenhum áudio.");
    }

    let tempFilePath;
    try {
      tempFilePath = await Gifted.downloadAndSaveMediaMessage(quotedAudio, 'temp_media');
      const buffer = await fs.readFile(tempFilePath);
      const convertedBuffer = await toVideo(buffer);
      
      await Gifted.sendMessage(from, {
        video: convertedBuffer,
        mimetype: "video/mp4",
        caption: 'Vídeo Convertido',
      }, { quoted: mek });
      
      await react("✅");
    } catch (e) {
      console.error("Erro no comando tovideo:", e);
      await react("❌");
      await reply("Falha na conversão de áudio para vídeo.");
    } finally {
      if (tempFilePath) await fs.unlink(tempFilePath).catch(console.error);
    }
  }
);
