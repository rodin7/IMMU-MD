const {
        gmd,
        gitRepoRegex,
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
        pattern: "gitclone",
        category: "downloader",
        react: "📦",
        aliases: ["gitdl", "github", "git", "repodl", "clone"],
        description: "Baixar repositório GitHub como arquivo zip",
    },
    async (from, Gifted, conText) => {
        const { q, mek, reply, react, sender, botName, newsletterJid } =
            conText;

        if (!q) {
            await react("❌");
            return reply(
                `Por favor, forneça um link de repositório GitHub.\n\n*Uso:* .gitclone https://github.com/user/repo`,
            );
        }

        if (!gitRepoRegex.test(q)) {
            await react("❌");
            return reply(
                "Formato de link GitHub inválido. Por favor, forneça uma URL de repositório GitHub válida.",
            );
        }

        try {
            let [, user, repo] = q.match(gitRepoRegex) || [];
            repo = repo.replace(/\.git$/, "").split("/")[0];

            const apiUrl = `https://api.github.com/repos/${user}/${repo}`;
            const zipUrl = `https://api.github.com/repos/${user}/${repo}/zipball`;

            await reply(`Buscando repositório *${user}/${repo}*...`);

            const repoResponse = await axios.get(apiUrl);
            if (!repoResponse.data) {
                await react("❌");
                return reply(
                    "Repositório não encontrado ou acesso negado. Certifique-se de que o repositório é público.",
                );
            }

            const repoData = repoResponse.data;
            const defaultBranch = repoData.default_branch || "main";
            const filename = `${user}-${repo}-${defaultBranch}.zip`;

            await Gifted.sendMessage(
                from,
                {
                    document: { url: zipUrl },
                    fileName: filename,
                    mimetype: "application/zip",
                    contextInfo: {
                        forwardingScore: 1,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: newsletterJid,
                            newsletterName: botName,
                            serverMessageId: 143,
                        },
                    },
                },
                { quoted: mek },
            );

            await react("✅");
        } catch (error) {
            console.error("GitClone error:", error);
            await react("❌");

            if (error.message?.includes("404")) {
                return reply("Repositório não encontrado.");
            } else if (error.message?.includes("rate limit")) {
                return reply(
                    "Limite de taxa da API GitHub excedido. Tente novamente mais tarde.",
                );
            } else {
                return reply(`Falha ao baixar repositório: ${error.message}`);
            }
        }
    },
);

gmd(
    {
        pattern: "fb",
        category: "downloader",
        react: "📘",
        aliases: ["fbdl", "facebookdl", "facebook"],
        description: "Baixar vídeos do Facebook",
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
            toAudio,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL de vídeo do Facebook");
        }

        if (!q.includes("facebook.com") && !q.includes("fb.watch")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do Facebook");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/facebook?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar vídeo. Por favor, verifique a URL e tente novamente.",
                );
            }

            const { title, duration, thumbnail, hd_video, sd_video } =
                response.data.result;
            const dateNow = Date.now();
            const videoUrl = hd_video || sd_video;

            const buttons = [];
            if (hd_video)
                buttons.push({ id: `fb_hd_${dateNow}`, text: "Qualidade HD" });
            if (sd_video)
                buttons.push({ id: `fb_sd_${dateNow}`, text: "Qualidade SD" });
            buttons.push({ id: `fb_audio_${dateNow}`, text: "Som Apenas" });

            await sendButtons(Gifted, from, {
                title: `${botName} BAIXADOR FACEBOOK`,
                text: `*Título:* ${title || "Vídeo do Facebook"}\n*Duração:* ${duration || "Desconhecido"}\n\n*Selecione o tipo de download:*`,
                footer: botFooter,
                image: { url: thumbnail },
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
                    if (selectedButtonId.startsWith("fb_audio")) {
                        const sourceVideo = hd_video || sd_video;
                        if (!sourceVideo) {
                            await react("❌");
                            return reply(
                                "Nenhum vídeo disponível para extração de áudio.",
                                messageData,
                            );
                        }

                        const videoBuffer = await gmdBuffer(sourceVideo);
                        if (!videoBuffer || videoBuffer instanceof Error || !Buffer.isBuffer(videoBuffer)) {
                            await react("❌");
                            return reply(
                                "Falha ao baixar vídeo para extração de áudio. Tente novamente.",
                                messageData,
                            );
                        }
                        let audioBuffer;
                        try {
                            audioBuffer = await toAudio(videoBuffer);
                        } catch (audioErr) {
                            await react("❌");
                            const errMsg = audioErr.message || String(audioErr);
                            if (errMsg.includes('no audio')) {
                                return reply("Este vídeo não possui trilha de áudio para extrair.", messageData);
                            }
                            return reply("Falha ao converter vídeo para áudio: " + errMsg, messageData);
                        }
                        if (!audioBuffer || !Buffer.isBuffer(audioBuffer)) {
                            await react("❌");
                            return reply(
                                "Falha ao converter vídeo para áudio. O formato do vídeo pode não ser suportado.",
                                messageData,
                            );
                        }
                        const fileSize = audioBuffer.length;

                        if (fileSize > MAX_MEDIA_SIZE) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: audioBuffer,
                                    fileName: `${(title || "facebook_audio").replace(/[^\w\s.-]/gi, "")}.mp3`,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    audio: audioBuffer,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        }
                    } else {
                        const selectedVideoUrl = selectedButtonId.startsWith(
                            "fb_hd",
                        )
                            ? hd_video
                            : sd_video;

                        if (!selectedVideoUrl) {
                            await react("❌");
                            return reply(
                                "Qualidade selecionada não disponível.",
                                messageData,
                            );
                        }

                        const fileSize = await getFileSize(selectedVideoUrl);
                        const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                        if (sendAsDoc) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: { url: selectedVideoUrl },
                                    fileName: `${(title || "facebook_video").replace(/[^\w\s.-]/gi, "")}.mp4`,
                                    mimetype: "video/mp4",
                                    caption: `*${title || "Vídeo do Facebook"}*`,
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    video: { url: selectedVideoUrl },
                                    mimetype: "video/mp4",
                                    caption: `*${title || "Vídeo do Facebook"}*`,
                                },
                                { quoted: messageData },
                            );
                        }
                    }

                    await react("✅");
                } catch (error) {
                    console.error("Facebook download error:", error);
                    await react("❌");
                    await reply(
                        "Falha no download. Por favor, tente novamente.",
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
            console.error("Facebook API error:", error);
            await react("❌");
            return reply("Ocorreu um erro. Por favor, tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "tiktok",
        category: "downloader",
        react: "🎵",
        aliases: ["tiktokdl", "ttdl", "tt"],
        description: "Baixar vídeos do TikTok",
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
            toAudio,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do TikTok");
        }

        if (!q.includes("tiktok.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do TikTok");
        }

        try {
            const endpoints = [
                "tiktok",
                "tiktokdlv2",
                "tiktokdlv3",
                "tiktokdlv4",
            ];

            const t0 = Date.now();
            const result = await Promise.any(
                endpoints.map(endpoint => {
                    const apiUrl = `${GiftedTechApi}/api/download/${endpoint}?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
                    return axios.get(apiUrl, { timeout: 20000 }).then(res => {
                        if (res.data?.success && res.data?.result) {
                            return res.data.result;
                        }
                        throw new Error(`${endpoint}: sem resultado`);
                    });
                })
            ).catch(() => null);

            if (!result) {
                await react("❌");
                return reply(
                    "Falha ao buscar vídeo do TikTok. Tente novamente mais tarde.",
                );
            }

            const { title, video, music, cover, author } = result;
            const dateNow = Date.now();

            const buttons = [
                { id: `tt_video_${dateNow}`, text: "Vídeo" },
                { id: `tt_audio_${dateNow}`, text: "Som Apenas" },
            ];

            await sendButtons(Gifted, from, {
                title: `${botName} BAIXADOR TIKTOK`,
                text: `*Título:* ${title || "Vídeo do TikTok"}\n*Autor:* ${author?.name || "Desconhecido"}\n\n*Selecione o tipo de download:*`,
                footer: botFooter,
                image: { url: cover },
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
                    if (selectedButtonId.startsWith("tt_video")) {
                        const fileSize = await getFileSize(video);
                        const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                        if (sendAsDoc) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: { url: video },
                                    fileName: `${(title || "tiktok_video").replace(/[^\w\s.-]/gi, "")}.mp4`,
                                    mimetype: "video/mp4",
                                    caption: `*${title || "Vídeo do TikTok"}*`,
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    video: { url: video },
                                    mimetype: "video/mp4",
                                    caption: `*${title || "Vídeo do TikTok"}*`,
                                },
                                { quoted: messageData },
                            );
                        }
                    } else if (selectedButtonId.startsWith("tt_audio")) {
                        let audioBuffer;

                        if (music) {
                            audioBuffer = await gmdBuffer(music);
                            audioBuffer = await formatAudio(audioBuffer);
                        } else {
                            const videoBuffer = await gmdBuffer(video);
                            audioBuffer = await toAudio(videoBuffer);
                        }

                        const fileSize = audioBuffer.length;

                        if (fileSize > MAX_MEDIA_SIZE) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: audioBuffer,
                                    fileName: `${(title || "tiktok_audio").replace(/[^\w\s.-]/gi, "")}.mp3`,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    audio: audioBuffer,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        }
                    }

                    await react("✅");
                } catch (error) {
                    console.error("TikTok download error:", error);
                    await react("❌");
                    await reply(
                        "Falha no download. Por favor, tente novamente.",
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
            console.error("TikTok API error:", error);
            await react("❌");
            return reply("Ocorreu um erro. Por favor, tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "twitter",
        category: "downloader",
        react: "🐦",
        aliases: ["twitterdl", "xdl", "xdownloader", "twitterdownloader", "x"],
        description: "Baixar vídeos do Twitter/X",
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
            toAudio,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do Twitter/X");
        }

        if (!q.includes("twitter.com") && !q.includes("x.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do Twitter/X");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/twitter?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar vídeo. Por favor, verifique a URL e tente novamente.",
                );
            }

            const { thumbnail, videoUrls } = response.data.result;

            if (!videoUrls || videoUrls.length === 0) {
                await react("❌");
                return reply("Nenhum vídeo encontrado neste tweet.");
            }

            const dateNow = Date.now();
            const buttons = videoUrls.map((v, index) => ({
                id: `tw_${index}_${dateNow}`,
                text: `Qualidade ${v.quality}`,
            }));
            buttons.push({ id: `tw_audio_${dateNow}`, text: "Som Apenas" });

            await sendButtons(Gifted, from, {
                title: `${botName} BAIXADOR TWITTER`,
                text: `*Qualidades disponíveis:* ${videoUrls.map((v) => v.quality).join(", ")}\n\n*Selecione o tipo de download:*`,
                footer: botFooter,
                image: { url: thumbnail },
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
                    if (selectedButtonId.startsWith("tw_audio")) {
                        const bestVideo = videoUrls[0]?.url;
                        if (!bestVideo) {
                            await react("❌");
                            return reply(
                                "Nenhum vídeo disponível para extração de áudio.",
                                messageData,
                            );
                        }

                        const videoBuffer = await gmdBuffer(bestVideo);
                        const audioBuffer = await toAudio(videoBuffer);
                        const fileSize = audioBuffer.length;

                        if (fileSize > MAX_MEDIA_SIZE) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: audioBuffer,
                                    fileName: "twitter_audio.mp3",
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    audio: audioBuffer,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        }
                    } else {
                        const index = parseInt(selectedButtonId.split("_")[1]);
                        const videoUrl = videoUrls[index]?.url;

                        if (!videoUrl) {
                            await react("❌");
                            return reply(
                                "Qualidade selecionada não disponível.",
                                messageData,
                            );
                        }

                        const fileSize = await getFileSize(videoUrl);
                        const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                        if (sendAsDoc) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: { url: videoUrl },
                                    fileName: `twitter_video_${videoUrls[index].quality}.mp4`,
                                    mimetype: "video/mp4",
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    video: { url: videoUrl },
                                    mimetype: "video/mp4",
                                },
                                { quoted: messageData },
                            );
                        }
                    }

                    await react("✅");
                } catch (error) {
                    console.error("Twitter download error:", error);
                    await react("❌");
                    await reply(
                        "Falha no download. Por favor, tente novamente.",
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
            console.error("Twitter API error:", error);
            await react("❌");
            return reply("Ocorreu um erro. Por favor, tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "ig",
        category: "downloader",
        react: "📸",
        aliases: ["insta", "instadl", "igdl", "instagram"],
        description: "Baixar reels/vídeos do Instagram",
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
            toAudio,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do Instagram");
        }

        if (!q.includes("instagram.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do Instagram");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/instadl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar conteúdo. Por favor, verifique a URL e tente novamente.",
                );
            }

            const { thumbnail, download_url } = response.data.result;

            if (!download_url) {
                await react("❌");
                return reply("Nenhum conteúdo encontrável para download.");
            }

            const dateNow = Date.now();

            await sendButtons(Gifted, from, {
                title: `${botName} BAIXADOR INSTAGRAM`,
                text: `*Selecione o tipo de download:*`,
                footer: botFooter,
                image: { url: thumbnail },
                buttons: [
                    { id: `ig_video_${dateNow}`, text: "Vídeo" },
                    { id: `ig_audio_${dateNow}`, text: "Som Apenas" },
                ],
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
                    if (selectedButtonId.startsWith("ig_audio")) {
                        const videoBuffer = await gmdBuffer(download_url);
                        const audioBuffer = await toAudio(videoBuffer);
                        const fileSize = audioBuffer.length;

                        if (fileSize > MAX_MEDIA_SIZE) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: audioBuffer,
                                    fileName: "instagram_audio.mp3",
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    audio: audioBuffer,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        }
                    } else {
                        const fileSize = await getFileSize(download_url);
                        const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                        if (sendAsDoc) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: { url: download_url },
                                    fileName: "instagram_video.mp4",
                                    mimetype: "video/mp4",
                                    caption: `*Baixado via ${botName}*`,
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    video: { url: download_url },
                                    mimetype: "video/mp4",
                                    caption: `*Baixado via ${botName}*`,
                                },
                                { quoted: messageData },
                            );
                        }
                    }

                    await react("✅");
                } catch (error) {
                    console.error("Instagram download error:", error);
                    await react("❌");
                    await reply(
                        "Falha no download. Por favor, tente novamente.",
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
            console.error("Instagram API error:", error);
            await react("❌");
            return reply("Ocorreu um erro. Por favor, tente novamente.");
        }
    },
);

gmd(
    {
        pattern: "snack",
        category: "downloader",
        react: "🍿",
        aliases: ["snackdl", "snackvideo"],
        description: "Baixar Vídeo Snack",
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
            toAudio,
            formatAudio,
            GiftedTechApi,
            GiftedApiKey,
        } = conText;

        if (!q) {
            await react("❌");
            return reply("Por favor, forneça uma URL do Vídeo Snack");
        }

        if (!q.includes("snackvideo.com")) {
            await react("❌");
            return reply("Por favor, forneça uma URL válida do Vídeo Snack");
        }

        try {
            const apiUrl = `${GiftedTechApi}/api/download/snackdl?apikey=${GiftedApiKey}&url=${encodeURIComponent(q)}`;
            const response = await axios.get(apiUrl, { timeout: 60000 });

            if (!response.data?.success || !response.data?.result) {
                await react("❌");
                return reply(
                    "Falha ao buscar vídeo. Por favor, verifique a URL e tente novamente.",
                );
            }

            const { title, media, thumbnail, author, like, comment, share } =
                response.data.result;

            if (!media) {
                await react("❌");
                return reply("Nenhum vídeo encontrado.");
            }

            const dateNow = Date.now();

            await sendButtons(Gifted, from, {
                title: `${botName} VÍDEO SNACK`,
                text: `*Título:* ${title || "Vídeo Snack"}\n*Autor:* ${author || "Desconhecido"}\n*Curtidas:* ${like || "0"}\n\n*Selecione o tipo de download:*`,
                footer: botFooter,
                image: { url: thumbnail },
                buttons: [
                    { id: `sn_video_${dateNow}`, text: "Vídeo" },
                    { id: `sn_audio_${dateNow}`, text: "Som Apenas" },
                ],
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
                    if (selectedButtonId.startsWith("sn_video")) {
                        const fileSize = await getFileSize(media);
                        const sendAsDoc = fileSize > MAX_MEDIA_SIZE;

                        if (sendAsDoc) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: { url: media },
                                    fileName: `${(title || "snack_video").replace(/[^\w\s.-]/gi, "")}.mp4`,
                                    mimetype: "video/mp4",
                                    caption: `*${title || "Vídeo Snack"}*`,
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    video: { url: media },
                                    mimetype: "video/mp4",
                                    caption: `*${title || "Vídeo Snack"}*`,
                                },
                                { quoted: messageData },
                            );
                        }
                    } else if (selectedButtonId.startsWith("sn_audio")) {
                        const videoBuffer = await gmdBuffer(media);
                        const audioBuffer = await toAudio(videoBuffer);
                        const fileSize = audioBuffer.length;

                        if (fileSize > MAX_MEDIA_SIZE) {
                            await Gifted.sendMessage(
                                from,
                                {
                                    document: audioBuffer,
                                    fileName: `${(title || "snack_audio").replace(/[^\w\s.-]/gi, "")}.mp3`,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        } else {
                            await Gifted.sendMessage(
                                from,
                                {
                                    audio: audioBuffer,
                                    mimetype: "audio/mpeg",
                                },
                                { quoted: messageData },
                            );
                        }
                    }

                    await react("✅");
                } catch (error) {
                    console.error("Snack Video download error:", error);
                    await react("❌");
                    await reply(
                        "Falha no download. Por favor, tente novamente.",
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
            console.error("Snack Video API error:", error);
            await react("❌");
            return reply("Ocorreu um erro. Por favor, tente novamente.");
        }
    },
);
