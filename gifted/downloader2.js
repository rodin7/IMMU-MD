const {
        gmd,
        MAX_MEDIA_SIZE,
        getFileSize,
        getMimeCategory,
        getMimeFromUrl,
    } = require("../gift"),
    GIFTED_DLS = require("gifted-dls"),
    giftedDls = new GIFTED_DLS(),
    axios = require("axios"),
    { sendButtons } = require("gifted-btns");

function extractButtonId(msg) {
    if (!msg) return null;
    if (msg.templateButtonReplyMessage?.selectedId)
        return msg.templateButtonReplyMessage.selectedId;
    if (msg.buttonsResponseMessage?.selectedButtonId)
        return msg.buttonsResponseMessage.selectedButtonId;
    if (msg.listResponseMessage?.singleSelectReply?.selectedRowId)
        return msg.listResponseMessage.singleSelectReply.selectedRowId;
    if (msg.interactiveResponseMessage) {
        const nf = msg.interactiveResponseMessage.nativeFlowResponseMessage;
        if (nf?.paramsJson) {
            try { const p = JSON.parse(nf.paramsJson); if (p.id) return p.id; } catch {}
        }
        return msg.interactiveResponseMessage.buttonId || null;
    }
    return null;
}

gmd(
    {
        pattern: "spotify",
        category: "downloader",
        react: "🎧",
        aliases: ["spotifydl", "spotidl", "spoti"],
        description: "Baixar faixas do Spotify por URL ou nome da música",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            newsletterJid,
            gmdBuffer,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply(
                "Por favor, forneça uma URL do Spotify ou o nome da música\n\n*Exemplos:*\n.spotify https://open.spotify.com/track/...\n.spotify The Spectre Alan Walker",
            );
        }

        const truncate = (str, len) =>
            str && str.length > len ? str.substring(0, len - 2) + ".." : str;

        const downloadAndSend = async (trackUrl, quotedMsg) => {
            const endpoints = ["spotifydl", "spotifydlv2"];

            const t0 = Date.now();
            const result = await Promise.any(
                endpoints.map(endpoint => {
                    const apiUrl = `${GiftedTechApi}/api/download/${endpoint}?apikey=${GiftedApiKey}&url=${encodeURIComponent(trackUrl)}`;
                    return axios.get(apiUrl, { timeout: 20000 }).then(res => {
                        if (res.data?.success && res.data?.result?.download_url) {
                            return res.data.result;
                        }
                        throw new Error(`${endpoint}: sem download_url`);
                    });
                })
            ).catch(() => null);

            if (!result || !result.download_url) {
                await react("❌");
                return reply(
                    "Falha ao buscar a faixa. Tente novamente.",
                    quotedMsg,
                );
            }

            const { title, thumbnail, download_url } = result;

            const audioBuffer = await gmdBuffer(download_url);
            const formattedAudio = await formatAudio(audioBuffer);
            const fileSize = formattedAudio.length;

            if (fileSize > MAX_MEDIA_SIZE) {
                await Gifted.sendMessage(
                    from,
                    {
                        document: formattedAudio,
                        fileName: `${(title || "faixa_spotify").replace(/[^\w\s.-]/gi, "")}.mp3`,
                        mimetype: "audio/mpeg",
                    },
                    { quoted: quotedMsg },
                );
            } else {
                await Gifted.sendMessage(
                    from,
                    {
                        audio: formattedAudio,
                        mimetype: "audio/mpeg",
                    },
                    { quoted: quotedMsg },
                );
            }

            await react("✅");
        };

        try {
            if (q.includes("spotify.com")) {
                await downloadAndSend(q, mek);
                return;
            }

            const searchUrl = `${GiftedTechApi}/api/search/spotifysearch?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`;
            const searchResponse = await axios.get(searchUrl, {
                timeout: 30000,
            });
            const data = searchResponse.data;

            if (!data?.success || !data?.results) {
                await react("❌");
                return reply(
                    "Busca falhou. Por favor, tente com uma URL direta do Spotify.",
                );
            }

            const results = data.results;

            if (results?.status === false) {
                await react("❌");
                return reply(
                    "Serviço de busca temporariamente indisponível. Tente com uma URL direta do Spotify.",
                );
            }

            let tracks = [];
            if (Array.isArray(results)) {
                tracks = results.slice(0, 3);
            } else if (results?.tracks && Array.isArray(results.tracks)) {
                tracks = results.tracks.slice(0, 3);
            } else if (
                typeof results === "object" &&
                (results.url || results.link)
            ) {
                tracks = [results];
            }

            if (tracks.length === 0) {
                await react("❌");
                return reply(
                    "Nenhuma faixa do Spotify encontrada. Tente uma consulta diferente ou forneça uma URL direta do Spotify.",
                );
            }

            const dateNow = Date.now();
            const buttons = tracks.map((track, index) => {
                const title = track.title || track.name || "Faixa Desconhecida";
                const artist = track.artist || track.artists?.join(", ") || "";
                const displayName = artist ? `${title} - ${artist}` : title;
                return {
                    id: `sp_${index}_${dateNow}`,
                    text: truncate(displayName, 20),
                };
            });

            const trackList = tracks
                .map((track, i) => {
                    const title = track.title || track.name || "Desconhecido";
                    const artist =
                        track.artist || track.artists?.join(", ") || "Desconhecido";
                    return `${i + 1}. ${title} - ${artist}`;
                })
                .join("\n");

            // Fixed: Get thumbnail from the first track
            const thumbnailUrl = tracks[0]?.thumbnail || tracks[0]?.image || tracks[0]?.album?.images?.[0]?.url || '';

            await sendButtons(Gifted, from, {
                title: `${botName} SPOTIFY`,
                text: `*Resultados da Busca:*\n\n${trackList}\n\n*Selecione uma faixa:*`,
                footer: botFooter,
                image: { url: thumbnailUrl },
                buttons: buttons,
            });

            const handleResponse = async (event) => {
                const messageData = event.messages[0];
                if (!messageData.message) return;

                const selectedButtonId = extractButtonId(messageData.message);
                if (!selectedButtonId) return;
                if (!selectedButtonId.includes(`_${dateNow}`)) return;

                const isFromSameChat = messageData.key?.remoteJid === from;
                if (!isFromSameChat) return;

                await react("⬇️");

                try {
                    const index = parseInt(selectedButtonId.split("_")[1]);
                    const selectedTrack = tracks[index];
                    const trackUrl =
                        selectedTrack?.url ||
                        selectedTrack?.link ||
                        selectedTrack?.external_urls?.spotify ||
                        selectedTrack?.spotify_url;

                    if (!trackUrl) {
                        await react("❌");
                        return reply("URL da faixa não disponível.", messageData);
                    }

                    await downloadAndSend(trackUrl, messageData);
                } catch (error) {
                    console.error("Erro no download do Spotify:", error);
                    await react("❌");
                    await reply(
                        "Falha no download. Tente novamente.",
                        messageData,
                    );
                }
            };

            Gifted.ev.on("messages.upsert", handleResponse);
            setTimeout(
                () => Gifted.ev.off("messages.upsert", handleResponse),
                300000,
            );
        } catch (error) {
            console.error("Erro na API do Spotify:", error);
            await react("❌");
            return reply("Ocorreu um erro. Tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "gdrive",
        category: "downloader",
        react: "📁",
        aliases: ["googledrive", "drive", "gdrivedl"],
        description: "Baixar do Google Drive",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            newsletterJid,
            gmdBuffer,
            formatAudio,
            formatVideo,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do Google Drive");
        }

        if (!q.includes("drive.google.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do Google Drive");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/gdrivedl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar o arquivo. Verifique a URL e certifique-se de que o arquivo é publicamente acessível.",
                );
            }

            const { name, download_url } = response.data.result;

            if (!download_url) {
                await react("❌");
                return reply("Nenhuma URL de download disponível.");
            }

            let mimetype = getMimeFromUrl(name || "");
            let mimeCategory = getMimeCategory(mimetype);

            try {
                const headResponse = await axios.head(download_url, {
                    timeout: 15000,
                });
                const contentType = headResponse.headers["content-type"];
                if (contentType && !contentType.includes("text/html")) {
                    mimetype = contentType.split(";")[0].trim();
                    mimeCategory = getMimeCategory(mimetype);
                }
            } catch (headErr) {
                if (headErr.response?.status === 404) {
                    await react("❌");
                    return reply(
                        "Arquivo não encontrado. O arquivo pode ter sido excluído ou não é publicamente acessível.",
                    );
                }
            }

            let fileBuffer;
            try {
                fileBuffer = await gmdBuffer(download_url);
            } catch (dlErr) {
                if (
                    dlErr.response?.status === 404 ||
                    dlErr.message?.includes("404")
                ) {
                    await react("❌");
                    return reply(
                        "Arquivo não encontrado. O arquivo pode ter sido excluído ou não é publicamente acessível.",
                    );
                }
                throw dlErr;
            }

            const fileSize = fileBuffer.length;
            const sendAsDoc =
                fileSize > MAX_MEDIA_SIZE || mimeCategory === "document";

            if (mimeCategory === "audio" && !sendAsDoc) {
                const formattedAudio = await formatAudio(fileBuffer);

                await Gifted.sendMessage(
                    from,
                    {
                        audio: formattedAudio,
                        mimetype: "audio/mpeg",
                    },
                    { quoted: mek },
                );
            } else if (mimeCategory === "video" && !sendAsDoc) {
                const formattedVideo = await formatVideo(fileBuffer);
                await Gifted.sendMessage(
                    from,
                    {
                        video: formattedVideo,
                        mimetype: "video/mp4",
                        caption: `*${name || "Arquivo do Google Drive"}*`,
                    },
                    { quoted: mek },
                );
            } else if (mimeCategory === "image" && !sendAsDoc) {
                await Gifted.sendMessage(
                    from,
                    {
                        image: fileBuffer,
                        caption: `*${name || "Arquivo do Google Drive"}*`,
                    },
                    { quoted: mek },
                );
            } else {
                await Gifted.sendMessage(
                    from,
                    {
                        document: fileBuffer,
                        fileName: name || "arquivo_gdrive",
                        mimetype: mimetype || "application/octet-stream",
                    },
                    { quoted: mek },
                );
            }

            await react("✅");
        } catch (error) {
            console.error("Erro na API do Google Drive:", error);
            await react("❌");
            if (
                error.response?.status === 404 ||
                error.message?.includes("404")
            ) {
                return reply(
                    "Arquivo não encontrado. O arquivo pode ter sido excluído ou não é publicamente acessível.",
                );
            }
            return reply("Ocorreu um erro. Tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "mediafire",
        category: "downloader",
        react: "🔥",
        aliases: ["mfire", "mediafiredl", "mfiredl"],
        description: "Baixar do MediaFire",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            newsletterJid,
            gmdBuffer,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do MediaFire");
        }

        if (!q.includes("mediafire.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do MediaFire");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/mediafire?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar o arquivo. Verifique a URL e tente novamente.",
                );
            }

            const { fileName, fileSize, fileType, mimeType, downloadUrl } =
                response.data.result;

            if (!downloadUrl) {
                await react("❌");
                return reply("Nenhuma URL de download disponível.");
            }

            const mimetype = mimeType || getMimeFromUrl(downloadUrl);
            const mimeCategory = getMimeCategory(mimetype);

            const sizeMatch = fileSize?.match(/([\d.]+)\s*(KB|MB|GB)/i);
            let sizeBytes = 0;
            if (sizeMatch) {
                const size = parseFloat(sizeMatch[1]);
                const unit = sizeMatch[2].toUpperCase();
                if (unit === "KB") sizeBytes = size * 1024;
                else if (unit === "MB") sizeBytes = size * 1024 * 1024;
                else if (unit === "GB") sizeBytes = size * 1024 * 1024 * 1024;
            }

            const sendAsDoc =
                sizeBytes > MAX_MEDIA_SIZE || mimeCategory === "document";

            const caption =
                `*${fileName || "Arquivo MediaFire"}*\n\n` +
                `*Tamanho:* ${fileSize || "Desconhecido"}\n` +
                `*Tipo:* ${fileType || "Desconhecido"}`;

            if (mimeCategory === "audio" && !sendAsDoc) {
                const audioBuffer = await gmdBuffer(downloadUrl);
                const formattedAudio = await formatAudio(audioBuffer);

                await Gifted.sendMessage(
                    from,
                    {
                        audio: formattedAudio,
                        mimetype: "audio/mpeg",
                    },
                    { quoted: mek },
                );
            } else if (mimeCategory === "video" && !sendAsDoc) {
                await Gifted.sendMessage(
                    from,
                    {
                        video: { url: downloadUrl },
                        mimetype: mimetype,
                        caption: caption,
                    },
                    { quoted: mek },
                );
            } else if (mimeCategory === "image" && !sendAsDoc) {
                await Gifted.sendMessage(
                    from,
                    {
                        image: { url: downloadUrl },
                        caption: caption,
                    },
                    { quoted: mek },
                );
            } else {
                await Gifted.sendMessage(
                    from,
                    {
                        document: { url: downloadUrl },
                        fileName: fileName || "arquivo_mediafire",
                        mimetype: mimetype,
                        caption: caption,
                    },
                    { quoted: mek },
                );
            }

            await react("✅");
        } catch (error) {
            console.error("Erro na API do MediaFire:", error);
            await react("❌");
            return reply("Ocorreu um erro. Tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "apk",
        category: "downloader",
        react: "📱",
        aliases: ["app", "apkdl", "appdownload"],
        description: "Baixar arquivos APK do Android",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            newsletterJid,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply(
                "Por favor, forneça o nome do aplicativo\n\n*Exemplo:* .apk WhatsApp",
            );
        }

        try {
         //   await reply(`Buscando APK para *${q}*...`);

            const apiUrl = `${GiftedTechApi}/api/download/apkdl?apikey=${GiftedApiKey}&appName=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply("Aplicativo não encontrado. Tente um nome diferente.");
            }

            const { appname, appicon, developer, mimetype, download_url } =
                response.data.result;

            if (!download_url) {
                await react("❌");
                return reply("Nenhuma URL de download disponível para este aplicativo.");
            }

            const caption =
                `*BAIXADOR DE APKS DO ${botName}*\n\n` +
                `*App:* ${appname || q}\n` +
                `*Desenvolvedor:* ${developer || "Desconhecido"}\n\n` +
                `_Baixando APK..._`;

            await Gifted.sendMessage(
                from,
                {
                    image: { url: appicon },
                    caption: caption,
                },
                { quoted: mek },
            );

            await Gifted.sendMessage(
                from,
                {
                    document: { url: download_url },
                    fileName: `${(appname || q).replace(/[^\w\s.-]/gi, "")}.apk`,
                    mimetype:
                        mimetype || "application/vnd.android.package-archive",
                },
                { quoted: mek },
            );

            await react("✅");
        } catch (error) {
            console.error("Erro no download do APK:", error);
            await react("❌");
            return reply("Ocorreu um erro. Tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "pastebin",
        category: "downloader",
        react: "📋",
        aliases: ["getpaste", "getpastebin", "pastedl", "pastebindl", "paste"],
        description: "Buscar conteúdo do Pastebin",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            botName,
            botFooter,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply(
                "Por favor, forneça uma URL do Pastebin\n\n*Exemplo:* .pastebin https://pastebin.com/xxxxxx",
            );
        }

        if (!q.includes("pastebin.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do Pastebin");
        }

        try {
            await reply("Buscando conteúdo do paste...");

            const apiUrl = `${GiftedTechApi}/api/download/pastebin?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 30000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar o paste. Verifique a URL e tente novamente.",
                );
            }

            let content = response.data.result;

            content = content
                .replace(/\\r\\n/g, "\n")
                .replace(/\\n/g, "\n")
                .replace(/\\t/g, "\t");
            content = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

            const pasteId = q.split("/").pop().split("?")[0];

            const header =
                `*VISOR DE PASTEBIN DO ${botName}*\n` +
                `*ID do Paste:* ${pasteId}\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n`;

            const fullMessage = header + content;

            if (fullMessage.length > 65000) {
                const textBuffer = Buffer.from(content, "utf-8");
                await Gifted.sendMessage(
                    from,
                    {
                        document: textBuffer,
                        fileName: `pastebin_${pasteId}.txt`,
                        mimetype: "text/plain",
                        caption: `*ID do Paste:* ${pasteId}\n_Content muito longo, enviado como arquivo_`,
                    },
                    { quoted: mek },
                );
            } else {
                await Gifted.sendMessage(
                    from,
                    {
                        text: fullMessage,
                    },
                    { quoted: mek },
                );
            }

            await react("✅");
        } catch (error) {
            console.error("Erro na API do Pastebin:", error);
            await react("❌");
            return reply("Ocorreu um erro. Tente novamente.");
        }
    },
);

/*
gmd(
    {
        pattern: "ytv",
        category: "downloader",
        react: "📽",
        description: "Baixar vídeo do YouTube",
    },
    async (from, Gifted, conText) => {
        const {
            q,
            mek,
            reply,
            react,
            sender,
            botPic,
            botName,
            botFooter,
            newsletterUrl,
            newsletterJid,
            gmdJson,
            gmdBuffer,
            formatVideo,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do YouTube");
        }

        if (
            !q.startsWith("https://youtu.be/") &&
            !q.startsWith("https://www.youtube.com/") &&
            !q.startsWith("https://youtube.com/")
        ) {
            return reply("Por favor, forneça uma URL válida do YouTube!");
        }

        try {
            const searchResponse = await gmdJson(
                `${GiftedTechApi}/search/yts?apikey=${GiftedApiKey}&query=${encodeURIComponent(q)}`,
            );
            const videoInfo = searchResponse.results[0];
            const infoMessage = {
                image: { url: videoInfo.thumbnail || botPic },
                caption:
                    `> *BAIXADOR DE VÍDEOS DO ${botName}*\n\n` +
                    `*Título:* ${videoInfo.title}\n` +
                    `*Duração:* ${videoInfo.timestamp}\n` +
                    `*Visualizações:* ${videoInfo.views}\n` +
                    `*Publicado em:* ${videoInfo.ago}\n` +
                    `*Artista:* ${videoInfo.author.name}\n\n` +
                    `*Responda Com:*\n` +
                    `1 - Baixar 360p\n` +
                    `2 - Baixar 720p\n` +
                    `3 - Baixar 1080p`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 5,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: newsletterJid,
                        newsletterName: botName,
                        serverMessageId: 143,
                    },
                },
            };
            const sentMessage = await Gifted.sendMessage(from, infoMessage, {
                quoted: mek,
            });
            const messageId = sentMessage.key.id;
            const handleResponse = async (event) => {
                const messageData = event.messages[0];
                if (!messageData.message) return;

                const isReplyToPrompt =
                    messageData.message.extendedTextMessage?.contextInfo
                        ?.stanzaId === messageId;
                if (!isReplyToPrompt) return;

                const userChoice =
                    messageData.message.conversation ||
                    messageData.message.extendedTextMessage?.text;

                await react("⬇️");

                try {
                    let quality;
                    switch (userChoice.trim()) {
                        case "1":
                            quality = 360;
                            break;
                        case "2":
                            quality = 720;
                            break;
                        case "3":
                            quality = 1080;
                            break;
                        default:
                            return reply(
                                "Opção inválida. Por favor, responda com: 1, 2 ou 3",
                                messageData,
                            );
                    }

                    const downloadResult = await giftedDls.ytmp4(q, quality);
                    const downloadUrl = downloadResult.result.download_url;
                    const videoBuffer = await gmdBuffer(downloadUrl);

                    if (videoBuffer instanceof Error) {
                        await react("❌");
                        return reply(
                            "Falha ao baixar o vídeo.",
                            messageData,
                        );
                    }

                    const fileSize = videoBuffer.length;
                    const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                    if (sendAsDoc) {
                        await Gifted.sendMessage(
                            from,
                            {
                                document: videoBuffer,
                                fileName: `${videoInfo.title.replace(/[^\w\s.-]/gi, "")}.mp4`,
                                mimetype: "video/mp4",
                            },
                            { quoted: messageData },
                        );
                    } else {
                        const formattedVideo = await formatVideo(videoBuffer);
                        await Gifted.sendMessage(
                            from,
                            {
                                video: formattedVideo,
                                mimetype: "video/mp4",
                            },
                            { quoted: messageData },
                        );
                    }

                    await react("✅");
                    Gifted.ev.off("messages.upsert", handleResponse);
                } catch (error) {
                    console.error("Erro ao processar vídeo:", error);
                    await react("❌");
                    await reply(
                        "Falha ao processar o vídeo. Tente novamente.",
                        messageData,
                    );
                    Gifted.ev.off("messages.upsert", handleResponse);
                }
            };

            Gifted.ev.on("messages.upsert", handleResponse);

            setTimeout(() => {
                Gifted.ev.off("messages.upsert", handleResponse);
            }, 300000);
        } catch (error) {
            console.error("Erro no download do YouTube:", error);
            await react("❌");
            return reply(
                "Ocorreu um erro ao processar sua solicitação. Tente novamente.",
            );
        }
    },
);
*/
