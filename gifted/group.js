const { gmd, getGroupMetadata, getLidMapping } = require("../gift");
const { getGroupSetting, setGroupSetting } = require("../gift/database/groupSettings");

gmd(
  {
    pattern: "unmute",
    react: "⏳",
    aliases: ["open", "groupopen", "gcopen", "adminonly", "adminsonly"],
    category: "grupo",
    description: "Abrir Chat de Grupo.",
  },
  async (from, Gifted, conText) => {
    const { reply, isAdmin, isSuperAdmin, isGroup, isBotAdmin, mek, sender } =
      conText;

    if (!isGroup) {
      return reply("Comando apenas para grupos!");
    }

    if (!isBotAdmin) {
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} Este bot não é administrador`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    }

    if (!isAdmin && !isSuperAdmin) {
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} você não é um administrador`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    }

    try {
      await Gifted.groupSettingUpdate(from, "not_announcement");
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} Grupo desbloqueado com sucesso conforme solicitado!`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    } catch (error) {
      console.error("Erro no desbloqueio:", error);
      return reply(`❌ Falha ao desbloquear grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "mute",
    react: "⏳",
    aliases: ["close", "groupmute", "gcmute", "gcclose"],
    category: "grupo",
    description: "Bloquear Chat de Grupo",
  },
  async (from, Gifted, conText) => {
    const { reply, isAdmin, isSuperAdmin, isGroup, isBotAdmin, mek, sender } =
      conText;

    if (!isGroup) {
      return reply("Comando apenas para grupos!");
    }

    if (!isBotAdmin) {
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} Este bot não é administrador`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    }

    if (!isAdmin && !isSuperAdmin) {
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} você não é um administrador`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    }

    try {
      await Gifted.groupSettingUpdate(from, "announcement");
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} Grupo bloqueado com sucesso conforme solicitado!`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    } catch (error) {
      console.error("Erro no bloqueio:", error);
      return reply(`❌ Falha ao bloquear grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "met",
    react: "⚡",
    category: "geral",
    description: "Verificar metadados do grupo",
  },
  async (from, Gifted, conText) => {
    const { mek, react, newsletterJid, botName } = conText;
    try {
      const gInfo = await getGroupMetadata(Gifted, from);

      const formatJid = (jid) => {
        if (!jid) return "N/A";
        const cleanJid = `@${jid.split("@")[0]}`;
        return cleanJid;
      };

      const superAdmins = [];
      const admins = [];
      const members = [];

      gInfo.participants.forEach((p) => {
        const formattedJid = formatJid(p.phoneNumber || p.pn || p.jid);
        if (p.admin === "superadmin") {
          superAdmins.push(`• ${formattedJid} - 👑 Super Admin`);
        } else if (p.admin === "admin") {
          admins.push(`• ${formattedJid} - 👮 Admin`);
        } else {
          members.push(`• ${formattedJid} - 👤 Membro`);
        }
      });

      const allParticipants = [...superAdmins, ...admins, ...members].join(
        "\n",
      );

      const allAdmins = [
        ...superAdmins.map((s) => s.replace(" - 👑 Super Admin", "")),
        ...admins.map((a) => a.replace(" - 👮 Admin", "")),
      ];

      const metadataText = `
📌 *METADADOS DO GRUPO* 📌

🔹 *ID:* ${gInfo.id}
🔹 *Assunto:* ${gInfo.subject || "Nenhum"}
🔹 *Dono do Assunto:* ${formatJid(gInfo.subjectOwnerPn || gInfo.subjectOwnerJid)}
🔹 *Assunto Alterado em:* ${new Date(gInfo.subjectTime * 1000).toLocaleString()}
🔹 *Proprietário:* ${formatJid(gInfo.ownerPn || gInfo.ownerJid)}
🔹 *Data de Criação:* ${new Date(gInfo.creation * 1000).toLocaleString()}
🔹 *Tamanho:* ${gInfo.size} participantes
🔹 *Descrição:* ${gInfo.desc || "Nenhuma"}
🔹 *Dono da Descrição:* ${formatJid(gInfo.descOwnerPn || gInfo.descOwnerJid)}
🔹 *Descrição Alterada em:* ${new Date(gInfo.descTime * 1000).toLocaleString()}

👑 *ADMINISTRADORES (${superAdmins.length + admins.length})*
${allAdmins.join("\n") || "Sem administradores"}

👥 *PARTICIPANTES (${gInfo.participants.length})*
${allParticipants}

ℹ️ *CONFIGURAÇÕES DO GRUPO*
• Restringir: ${gInfo.restrict ? "✅" : "❌"}
• Anunciar: ${gInfo.announce ? "✅" : "❌"}
• Aprovação de Entrada: ${gInfo.joinApprovalMode ? "✅" : "❌"}
• Adição de Membros: ${gInfo.memberAddMode ? "✅" : "❌"}
• Comunidade: ${gInfo.isCommunity ? "✅" : "❌"}
    `.trim();

      await Gifted.sendMessage(
        from,
        {
          text: metadataText,
          contextInfo: {
            forwardingScore: 5,
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
      console.error("Erro no comando de metadados:", error);
      await react("❌");
      await Gifted.sendMessage(
        from,
        { text: "Falha ao buscar metadados do grupo." },
        { quoted: mek },
      );
    }
  },
);

gmd(
  {
    pattern: "demote",
    react: "👑",
    category: "grupo",
    description: "Remover cargo de administrador de um usuário.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      quotedUser,
      superUser,
      isSuperAdmin,
      isAdmin,
      isGroup,
      isBotAdmin,
      q,
      mentionedJid,
      groupAdmins,
      groupMetadata,
    } = conText;
    const { getLidMapping } = require("../gift/connection/groupCache");

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    const convertLidToJid = async (lid) => {
      if (!lid || !lid.includes("@lid")) return lid;
      const cached = getLidMapping(lid);
      if (cached) return cached;
      try {
        const result = await Gifted.getJidFromLid(lid);
        if (result) return result;
      } catch (e) {}
      return lid;
    };

    let targetJid = null;

    if (mentionedJid && mentionedJid.length > 0) {
      targetJid = await convertLidToJid(mentionedJid[0]);
    } else if (quotedUser) {
      targetJid = await convertLidToJid(quotedUser);
    } else if (q) {
      const num = q.replace(/[^0-9]/g, "");
      if (num.length >= 10) {
        targetJid = num + "@s.whatsapp.net";
      }
    }

    if (!targetJid || targetJid.includes("@lid")) {
      if (
        targetJid &&
        targetJid.includes("@lid") &&
        groupMetadata?.participants
      ) {
        const lidNum = targetJid.split("@")[0];
        const found = groupMetadata.participants.find(
          (p) =>
            p.lid?.split("@")[0] === lidNum || p.id?.split("@")[0] === lidNum,
        );
        if (found?.id) targetJid = found.id;
        else if (found?.pn) targetJid = found.pn + "@s.whatsapp.net";
      }
    }

    if (!targetJid || targetJid.includes("@lid")) {
      await react("❌");
      return reply(
        "❌ Não foi possível identificar o usuário. Por favor, forneça o número diretamente.\nExemplo: .demote 254712345678",
      );
    }

    if (!targetJid.includes("@")) targetJid += "@s.whatsapp.net";

    const { isSuperUser } = require("../gift/database/sudo");
    const targetNum = targetJid.split("@")[0];
    const isTargetSuperUser = await isSuperUser(targetJid, Gifted);
    
    const standardizedSuperUsers = superUser.map((u) => u.split("@")[0]);
    if (isTargetSuperUser || standardizedSuperUsers.includes(targetNum)) {
      await react("❌");
      return reply("❌ Não posso remover cargo de um superusuário!");
    }

    const groupSuperAdmins = conText.groupSuperAdmins || [];
    const adminNums = groupAdmins.map((a) => a.split("@")[0]);
    const superAdminNums = groupSuperAdmins.map((a) => a.split("@")[0]);
    const allAdminNums = [...adminNums, ...superAdminNums];

    let isTargetAdmin = allAdminNums.includes(targetNum);
    let isSuperAdminTarget = superAdminNums.includes(targetNum);

    if (groupMetadata?.participants) {
      const participant = groupMetadata.participants.find((p) => {
        const pNum = (p.id || p.pn || p.phoneNumber || "").split("@")[0];
        const pPn = (p.pn || "").split("@")[0];
        return pNum === targetNum || pPn === targetNum;
      });
      if (participant?.admin) {
        isTargetAdmin = true;
        if (participant.admin === "superadmin") isSuperAdminTarget = true;
      }
    }

    if (!isTargetAdmin) {
      return reply(`❌ @${targetNum} não é administrador.`, {
        mentions: [targetJid],
        contextInfo: { mentionedJid: [targetJid] },
      });
    }

    if (isSuperAdminTarget) {
      return reply(
        `❌ @${targetNum} é o proprietário do grupo e não pode ser removido.`,
        {
          mentions: [targetJid],
          contextInfo: { mentionedJid: [targetJid] },
        },
      );
    }

    try {
      await Gifted.groupParticipantsUpdate(from, [targetJid], "demote");
      await react("✅");
      await reply(`👑 @${targetNum} não é mais administrador.`, {
        mentions: [targetJid],
        contextInfo: { mentionedJid: [targetJid] },
      });
    } catch (error) {
      await react("❌");
      if (
        error.message?.includes("403") ||
        error.message?.toLowerCase().includes("forbidden")
      ) {
        await reply(
          `❌ Não é possível remover @${targetNum}. Eles podem ser o proprietário do grupo ou ter privilégios superiores.`,
          {
            mentions: [targetJid],
          },
        );
      } else {
        await reply(`❌ Falha ao remover cargo: ${error.message}`);
      }
    }
  },
);

gmd(
  {
    pattern: "promote",
    aliases: ["toadmin"],
    react: "👑",
    category: "grupo",
    description: "Promover um usuário a administrador.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      quotedUser,
      isSuperAdmin,
      isAdmin,
      isGroup,
      isBotAdmin,
      q,
      mentionedJid,
      groupAdmins,
      groupSuperAdmins,
      groupMetadata,
    } = conText;
    const { getLidMapping } = require("../gift/connection/groupCache");

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    const convertLidToJid = async (lid) => {
      if (!lid || !lid.includes("@lid")) return lid;
      const cached = getLidMapping(lid);
      if (cached) return cached;
      try {
        const result = await Gifted.getJidFromLid(lid);
        if (result) return result;
      } catch (e) {}
      return lid;
    };

    let targetJid = null;

    if (mentionedJid && mentionedJid.length > 0) {
      targetJid = await convertLidToJid(mentionedJid[0]);
    } else if (quotedUser) {
      targetJid = await convertLidToJid(quotedUser);
    } else if (q) {
      const num = q.replace(/[^0-9]/g, "");
      if (num.length >= 10) {
        targetJid = num + "@s.whatsapp.net";
      }
    }

    if (!targetJid || targetJid.includes("@lid")) {
      if (
        targetJid &&
        targetJid.includes("@lid") &&
        groupMetadata?.participants
      ) {
        const lidNum = targetJid.split("@")[0];
        const found = groupMetadata.participants.find(
          (p) =>
            p.lid?.split("@")[0] === lidNum || p.id?.split("@")[0] === lidNum,
        );
        if (found?.id) targetJid = found.id;
        else if (found?.pn) targetJid = found.pn + "@s.whatsapp.net";
      }
    }

    if (!targetJid || targetJid.includes("@lid")) {
      await react("❌");
      return reply(
        "❌ Não foi possível identificar o usuário. Por favor, forneça o número diretamente.\nExemplo: .promote 254712345678",
      );
    }

    if (!targetJid.includes("@")) targetJid += "@s.whatsapp.net";

    const targetNum = targetJid.split("@")[0];
    const adminNums = groupAdmins
      ? groupAdmins.map((a) => a.split("@")[0])
      : [];
    const superAdminNums = groupSuperAdmins
      ? groupSuperAdmins.map((a) => a.split("@")[0])
      : [];
    const allAdminNums = [...adminNums, ...superAdminNums];

    let isAlreadyAdmin = allAdminNums.includes(targetNum);
    let isSuperAdminTarget = superAdminNums.includes(targetNum);

    if (groupMetadata?.participants) {
      const participant = groupMetadata.participants.find((p) => {
        const pNum = (p.id || p.pn || p.phoneNumber || "").split("@")[0];
        const pPn = (p.pn || "").split("@")[0];
        return pNum === targetNum || pPn === targetNum;
      });
      if (participant?.admin) {
        isAlreadyAdmin = true;
        if (participant.admin === "superadmin") isSuperAdminTarget = true;
      }
    }

    if (isSuperAdminTarget) {
      return reply(
        `❌ @${targetNum} é o proprietário do grupo e já é administrador.`,
        {
          mentions: [targetJid],
          contextInfo: { mentionedJid: [targetJid] },
        },
      );
    }

    if (isAlreadyAdmin) {
      return reply(`❌ @${targetNum} já é administrador.`, {
        mentions: [targetJid],
        contextInfo: { mentionedJid: [targetJid] },
      });
    }

    try {
      await Gifted.groupParticipantsUpdate(from, [targetJid], "promote");
      await react("✅");
      await reply(`👑 @${targetNum} agora é administrador.`, {
        mentions: [targetJid],
        contextInfo: { mentionedJid: [targetJid] },
      });
    } catch (error) {
      await react("❌");
      if (
        error.message?.includes("403") ||
        error.message?.toLowerCase().includes("forbidden")
      ) {
        await reply(
          `❌ Não é possível promover @${targetNum}. Eles podem não ser membros do grupo.`,
          {
            mentions: [targetJid],
          },
        );
      } else {
        await reply(`❌ Falha ao promover: ${error.message}`);
      }
    }
  },
);

gmd(
  {
    pattern: "kick",
    aliases: ["remove"],
    react: "🚫",
    category: "grupo",
    description: "Remover um usuário do grupo.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      quotedUser,
      superUser,
      isSuperAdmin,
      isAdmin,
      isGroup,
      isBotAdmin,
      q,
      mentionedJid,
      groupMetadata,
    } = conText;
    const { getLidMapping } = require("../gift/connection/groupCache");

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    const convertLidToJid = async (lid) => {
      if (!lid || !lid.includes("@lid")) return lid;
      const cached = getLidMapping(lid);
      if (cached) return cached;
      try {
        const result = await Gifted.getJidFromLid(lid);
        if (result) return result;
      } catch (e) {}
      return lid;
    };

    let targetJid = null;

    if (mentionedJid && mentionedJid.length > 0) {
      targetJid = await convertLidToJid(mentionedJid[0]);
    } else if (quotedUser) {
      targetJid = await convertLidToJid(quotedUser);
    } else if (q) {
      const num = q.replace(/[^0-9]/g, "");
      if (num.length >= 10) {
        targetJid = num + "@s.whatsapp.net";
      }
    }

    if (!targetJid || targetJid.includes("@lid")) {
      if (
        targetJid &&
        targetJid.includes("@lid") &&
        groupMetadata?.participants
      ) {
        const lidNum = targetJid.split("@")[0];
        const found = groupMetadata.participants.find(
          (p) =>
            p.lid?.split("@")[0] === lidNum || p.id?.split("@")[0] === lidNum,
        );
        if (found?.id) targetJid = found.id;
        else if (found?.pn) targetJid = found.pn + "@s.whatsapp.net";
      }
    }

    if (!targetJid || targetJid.includes("@lid")) {
      await react("❌");
      return reply(
        "❌ Não foi possível identificar o usuário. Por favor, forneça o número diretamente.\nExemplo: .kick 254712345678",
      );
    }

    if (!targetJid.includes("@")) targetJid += "@s.whatsapp.net";

    const targetNum = targetJid.split("@")[0];
    const standardizedSuperUsers = superUser.map((u) => u.split("@")[0]);
    if (standardizedSuperUsers.includes(targetNum)) {
      await react("❌");
      return reply("❌ Não posso expulsar meu criador!");
    }

    const botJid = Gifted.user?.id?.split(":")[0] + "@s.whatsapp.net";
    if (targetJid.toLowerCase() === botJid.toLowerCase()) {
      await react("❌");
      return reply("❌ Não posso me expulsar!");
    }

    const groupSuperAdmins = conText.groupSuperAdmins || [];
    const superAdminNums = groupSuperAdmins.map((a) => a.split("@")[0]);
    let isSuperAdminTarget = superAdminNums.includes(targetNum);

    if (groupMetadata?.participants) {
      const participant = groupMetadata.participants.find((p) => {
        const pNum = (p.id || p.pn || p.phoneNumber || "").split("@")[0];
        const pPn = (p.pn || "").split("@")[0];
        return pNum === targetNum || pPn === targetNum;
      });
      if (participant?.admin === "superadmin") isSuperAdminTarget = true;
    }

    if (isSuperAdminTarget) {
      await react("❌");
      return reply(
        `❌ @${targetNum} é o proprietário do grupo e não pode ser expulso.`,
        {
          mentions: [targetJid],
          contextInfo: { mentionedJid: [targetJid] },
        },
      );
    }

    try {
      await Gifted.groupParticipantsUpdate(from, [targetJid], "remove");
      await react("✅");
      await reply(`🚫 @${targetNum} foi removido do grupo.`, {
        mentions: [targetJid],
        contextInfo: { mentionedJid: [targetJid] },
      });
    } catch (error) {
      await react("❌");
      if (
        error.message?.includes("403") ||
        error.message?.toLowerCase().includes("forbidden")
      ) {
        await reply(
          `❌ Não é possível expulsar @${targetNum}. Eles podem ser um administrador ou não estar no grupo.`,
          {
            mentions: [targetJid],
          },
        );
      } else {
        await reply(`❌ Falha ao remover usuário: ${error.message}`);
      }
    }
  },
);

gmd(
  {
    pattern: "add",
    aliases: ["invite"],
    react: "➕",
    category: "grupo",
    description: "Adicionar um usuário ao grupo.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isSuperAdmin,
      isAdmin,
      isGroup,
      isBotAdmin,
      q,
      groupMetadata,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    if (!q) {
      await react("❌");
      return reply(
        "❌ Por favor, forneça o número a adicionar.\nExemplo: .add 254712345678",
      );
    }

    const num = q.replace(/[^0-9]/g, "");
    if (num.length < 10) {
      await react("❌");
      return reply(
        "❌ Formato de número inválido. Por favor, forneça um número de telefone válido.",
      );
    }

    const targetJid = num + "@s.whatsapp.net";

    try {
      const [result] = await Gifted.onWhatsApp(num);
      if (!result || !result.exists) {
        await react("❌");
        return reply(`❌ O número ${num} não está registrado no WhatsApp.`);
      }
    } catch (err) {
      await react("⚠️");
      return reply(
        `⚠️ Não foi possível verificar se ${num} está no WhatsApp. Por favor, tente novamente.`,
      );
    }

    if (groupMetadata?.participants) {
      const alreadyInGroup = groupMetadata.participants.find((p) => {
        const pNum = (p.id || p.pn || p.phoneNumber || "").split("@")[0];
        return pNum === num;
      });
      if (alreadyInGroup) {
        await react("❌");
        return reply(`❌ @${num} já está neste grupo.`, {
          mentions: [targetJid],
          contextInfo: { mentionedJid: [targetJid] },
        });
      }
    }

    try {
      const result = await Gifted.groupParticipantsUpdate(
        from,
        [targetJid],
        "add",
      );
      const status = result[0]?.status;

      if (status === "403") {
        const meta = await Gifted.groupMetadata(from);
        const groupName = meta.subject;
        const inviteCode = await Gifted.groupInviteCode(from);
        const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

        await Gifted.sendMessage(targetJid, {
          text: `👋 Olá! Você foi convidado para entrar no *${groupName}*\n\n🔗 *Link de Convite:* ${inviteLink}\n\n_Clique no link acima para entrar no grupo._`,
        });

        await react("⚠️");
        await reply(
          `⚠️ @${num} tem configurações de privacidade que impedem adicioná-lo diretamente. Um link de convite foi enviado na DM dele.`,
          {
            mentions: [targetJid],
            contextInfo: { mentionedJid: [targetJid] },
          },
        );
      } else if (status === "408") {
        await react("❌");
        await reply(
          `❌ @${num} saiu deste grupo recentemente e não pode ser adicionado ainda.`,
          {
            mentions: [targetJid],
            contextInfo: { mentionedJid: [targetJid] },
          },
        );
      } else if (status === "409") {
        await react("❌");
        await reply(`❌ @${num} já está neste grupo.`, {
          mentions: [targetJid],
          contextInfo: { mentionedJid: [targetJid] },
        });
      } else {
        await react("✅");
        await reply(`✅ @${num} foi adicionado ao grupo.`, {
          mentions: [targetJid],
          contextInfo: { mentionedJid: [targetJid] },
        });
      }
    } catch (error) {
      await react("❌");
      await reply(`❌ Falha ao adicionar usuário: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "link",
    aliases: ["gclink", "grouplink", "invitelink", "invite"],
    react: "🔗",
    category: "grupo",
    description: "Obter o link de convite do grupo.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isAdmin,
      isSuperAdmin,
      isGroup,
      isBotAdmin,
      mek,
      botName,
      newsletterJid,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      const meta = await Gifted.groupMetadata(from);
      const groupName = meta.subject;
      const participantCount = meta.participants.length;
      const adminCount = meta.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin",
      ).length;

      const inviteCode = await Gifted.groupInviteCode(from);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      const linkText =
        `*🔗 Link de Convite do Grupo*\n\n` +
        `*Grupo:* ${groupName}\n` +
        `*Participantes:* ${participantCount}\n` +
        `*Administradores:* ${adminCount}\n\n` +
        `*Link:* ${inviteLink}`;

      await Gifted.sendMessage(
        from,
        {
          text: linkText,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (error) {
      await react("❌");
      await reply(`❌ Falha ao obter link de convite: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "newgroup",
    aliases: ["newgc", "creategroup", "criargrupo"],
    react: "🆕",
    category: "grupo",
    description: "Criar um novo grupo com o bot como administrador.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isSuperUser,
      q,
      mek,
      botName,
      newsletterJid,
    } = conText;

    if (!isSuperUser) return reply("❌ Comando Apenas para Dono!");

    if (!q || !q.trim()) {
      await react("❌");
      return reply(
        "❌ Por favor, forneça um nome para o grupo.\nExemplo: .newgroup ATASSA MD",
      );
    }

    const groupName = q.trim();

    try {
      const group = await Gifted.groupCreate(groupName, [sender]);

      const inviteCode = await Gifted.groupInviteCode(group.id);
      const inviteLink = `https://chat.whatsapp.com/${inviteCode}`;

      const successText =
        `*🆕 Grupo Criado com Sucesso!*\n\n` +
        `*Nome do Grupo:* ${groupName}\n` +
        `*ID do Grupo:* ${group.id}\n\n` +
        `*Link de Convite:* ${inviteLink}`;

      await Gifted.sendMessage(
        from,
        {
          text: successText,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );

      await react("✅");
    } catch (error) {
      await react("❌");
      await reply(`❌ Falha ao criar grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "killgc",
    aliases: ["terminategc", "destroygc", "nukegc"],
    react: "💀",
    category: "grupo",
    description: "Encerrar grupo - remove todos os membros e o bot sai.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isSuperUser,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      mek,
      botName,
      newsletterJid,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isSuperUser) return reply("❌ Comando Apenas para Dono!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      await Gifted.sendMessage(
        from,
        {
          text: `⚠️ *AVISO* ⚠️\n\n💀 *Grupo será encerrado agora...*\n\n_Todos os membros serão removidos._\n\n⚠️ _Usar este comando com frequência pode levar a banimentos do WhatsApp._`,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );

      await new Promise((resolve) => setTimeout(resolve, 1000));

      const meta = await Gifted.groupMetadata(from);
      const participants = meta.participants;
      const botJid = Gifted.user?.id?.split(":")[0] + "@s.whatsapp.net";

      const membersToRemove = participants
        .filter((p) => p.id !== botJid && p.id !== sender)
        .map((p) => p.id);

      if (membersToRemove.length > 0) {
        await Gifted.groupParticipantsUpdate(from, membersToRemove, "remove");
      }

      await Gifted.groupLeave(from);
    } catch (error) {
      await react("❌");
      await reply(`❌ Falha ao encerrar grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "accept",
    aliases: ["approve"],
    react: "✅",
    category: "grupo",
    description: "Aceitar uma solicitação de entrada pendente. Uso: .accept 92301xxxx",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      args,
      botPrefix,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    if (!args[0])
      return reply(
        `❌ Por favor, forneça um número de telefone.\n\n*Uso:* ${botPrefix}accept 923xxxx`,
      );

    try {
      const number = args[0].replace(/[^0-9]/g, "");
      const userJid = `${number}@s.whatsapp.net`;

      await Gifted.groupRequestParticipantsUpdate(from, [userJid], "approve");

      await react("✅");
      return reply(`✅ Solicitação de entrada de @${number} aprovada com sucesso!`, {
        mentions: [userJid],
      });
    } catch (error) {
      await react("❌");
      if (
        error.message?.includes("not-found") ||
        error.message?.includes("item-not-found")
      ) {
        return reply("❌ Nenhuma solicitação de entrada pendente encontrada para este número.");
      }
      return reply(`❌ Falha ao aceitar solicitação: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "reject",
    aliases: ["decline"],
    react: "❌",
    category: "grupo",
    description: "Rejeitar uma solicitação de entrada pendente. Uso: .reject 92302xxxx",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      args,
      botPrefix,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    if (!args[0])
      return reply(
        `❌ Por favor, forneça um número de telefone.\n\n*Uso:* ${botPrefix}reject 923xxxx`,
      );

    try {
      const number = args[0].replace(/[^0-9]/g, "");
      const userJid = `${number}@s.whatsapp.net`;

      await Gifted.groupRequestParticipantsUpdate(from, [userJid], "reject");

      await react("✅");
      return reply(`✅ Solicitação de entrada de @${number} rejeitada com sucesso!`, {
        mentions: [userJid],
      });
    } catch (error) {
      await react("❌");
      if (
        error.message?.includes("not-found") ||
        error.message?.includes("item-not-found")
      ) {
        return reply("❌ Nenhuma solicitação de entrada pendente encontrada para este número.");
      }
      return reply(`❌ Falha ao rejeitar solicitação: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "acceptall",
    aliases: ["approveall"],
    react: "✅",
    category: "grupo",
    description: "Aceitar todas as solicitações de entrada pendentes no grupo.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, sender, isGroup, isBotAdmin, isAdmin, isSuperAdmin } =
      conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      const pendingRequests = await Gifted.groupRequestParticipantsList(from);

      if (!pendingRequests || pendingRequests.length === 0) {
        return reply("📭 Nenhuma solicitação de entrada pendente neste grupo.");
      }

      const jids = pendingRequests.map((r) => r.jid);
      await Gifted.groupRequestParticipantsUpdate(from, jids, "approve");

      await react("✅");
      return reply(
        `✅ *${jids.length}* solicitação(s) de entrada pendente(s) aprovada(s) com sucesso!`,
      );
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao aceitar todas as solicitações: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "rejectall",
    aliases: ["declineall"],
    react: "❌",
    category: "grupo",
    description: "Rejeitar todas as solicitações de entrada pendentes no grupo.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, sender, isGroup, isBotAdmin, isAdmin, isSuperAdmin } =
      conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      const pendingRequests = await Gifted.groupRequestParticipantsList(from);

      if (!pendingRequests || pendingRequests.length === 0) {
        return reply("📭 Nenhuma solicitação de entrada pendente neste grupo.");
      }

      const jids = pendingRequests.map((r) => r.jid);
      await Gifted.groupRequestParticipantsUpdate(from, jids, "reject");

      await react("✅");
      return reply(
        `✅ *${jids.length}* solicitação(s) de entrada pendente(s) rejeitada(s) com sucesso!`,
      );
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao rejeitar todas as solicitações: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "online",
    aliases: ["listonline", "whos online", "whosonline"],
    react: "🟢",
    category: "grupo",
    description: "Listar membros que estão atualmente online no grupo.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, sender, isGroup, mek, botName, newsletterJid } =
      conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");

    try {
      await reply("🔍 Verificando membros online... Aguarde...");

      const groupMeta = await Gifted.groupMetadata(from);
      const participants = groupMeta.participants;

      const onlineMembers = [];
      const presenceData = new Map();

      const presenceHandler = (update) => {
        const chatJid = update.id;
        if (update.presences) {
          for (const [jid, presence] of Object.entries(update.presences)) {
            presenceData.set(jid, presence);
            const numOnly = jid.split("@")[0];
            presenceData.set(numOnly, presence);
          }
        }
      };

      Gifted.ev.on("presence.update", presenceHandler);

      try {
        const batchSize = 5;
        for (let i = 0; i < participants.length; i += batchSize) {
          const batch = participants.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (p) => {
              const jid = p.id || p.jid;
              try {
                await Gifted.presenceSubscribe(jid);
              } catch (e) {}
            }),
          );
          await new Promise((r) => setTimeout(r, 500));
        }

        await new Promise((r) => setTimeout(r, 2000));

        for (const p of participants) {
          const participantId = p.id || p.jid;
          const numOnly = participantId.split("@")[0];

          let presence =
            presenceData.get(participantId) || presenceData.get(numOnly);

          if (!presence && p.pn) {
            presence =
              presenceData.get(p.pn) || presenceData.get(p.pn.split("@")[0]);
          }

          if (
            presence?.lastKnownPresence === "composing" ||
            presence?.lastKnownPresence === "recording" ||
            presence?.lastKnownPresence === "available"
          ) {
            let displayJid = participantId;
            if (participantId.endsWith("@lid")) {
              const cachedJid = getLidMapping(participantId);
              if (cachedJid) {
                displayJid = cachedJid;
              } else if (p.pn) {
                displayJid = p.pn;
              }
            }
            const number = displayJid.split("@")[0];
            const name = p.notify || p.name || number;
            onlineMembers.push({ jid: displayJid, name, number });
          }
        }
      } finally {
        Gifted.ev.off("presence.update", presenceHandler);
      }

      if (onlineMembers.length === 0) {
        await react("😴");
        return reply(
          "😴 Nenhum membro está digitando ou gravando ativamente.\n\n_Nota: Isso detecta apenas presença ativa de digitação/gravação._",
        );
      }

      const mentions = onlineMembers.map((m) => m.jid);
      const memberList = onlineMembers
        .map((m, i) => `${i + 1}. @${m.name}`)
        .join("\n");

      const message =
        `🟢 *MEMBROS ATIVOS (Digitando/Gravando)*\n\n` +
        `📊 *${onlineMembers.length}* de *${participants.length}* membros ativos\n\n` +
        `${memberList}\n\n` +
        `_Nota: Mostra apenas membros digitando ou gravando ativamente._`;

      await react("✅");
      await Gifted.sendMessage(
        from,
        {
          text: message,
          mentions: mentions,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao verificar membros online: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "resetlink",
    aliases: [
      "resetgclink",
      "revoke",
      "resetgrouplink",
      "revokelink",
      "newlink",
    ],
    react: "🔄",
    category: "grupo",
    description: "Redefinir o link de convite do grupo e obter um novo.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      mek,
      botName,
      newsletterJid,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      await Gifted.groupRevokeInvite(from);

      const newInviteCode = await Gifted.groupInviteCode(from);
      const newLink = `https://chat.whatsapp.com/${newInviteCode}`;

      const groupMeta = await Gifted.groupMetadata(from);
      const groupName = groupMeta.subject;
      const totalMembers = groupMeta.participants.length;
      const totalAdmins = groupMeta.participants.filter(
        (p) => p.admin === "admin" || p.admin === "superadmin",
      ).length;

      const message =
        `🔄 *LINK DO GRUPO REDEFINIDO*\n\n` +
        `📛 *Grupo:* ${groupName}\n` +
        `👥 *Total de Membros:* ${totalMembers}\n` +
        `👑 *Total de Administradores:* ${totalAdmins}\n\n` +
        `🔗 *Novo Link:*\n${newLink}\n\n` +
        `_O link de convite antigo foi revogado._`;

      await react("✅");
      await Gifted.sendMessage(
        from,
        {
          text: message,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao redefinir link do grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "left",
    aliases: ["leave", "exitgroup", "exitgc"],
    react: "👋",
    category: "grupo",
    description: "Bot deixa o grupo. Apenas dono.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isGroup,
      isSuperUser,
      mek,
      botName,
      newsletterJid,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isSuperUser) return reply("❌ Comando Apenas para Dono!");

    try {
      await Gifted.sendMessage(
        from,
        {
          text: `👋 *Adeus!*\n\n_${botName} está deixando este grupo..._`,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );

      await new Promise((r) => setTimeout(r, 1000));
      await Gifted.groupLeave(from);
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao sair do grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "listrequests",
    aliases: ["joinrequests", "listjoinrequests", "pendingrequests"],
    react: "📋",
    category: "grupo",
    description: "Listar todas as solicitações de entrada pendentes no grupo.",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      mek,
      botName,
      newsletterJid,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      const pendingRequests = await Gifted.groupRequestParticipantsList(from);

      if (!pendingRequests || pendingRequests.length === 0) {
        await react("📭");
        return reply("📭 Nenhuma solicitação de entrada pendente neste grupo.");
      }

      const resolvedJids = await Promise.all(
        pendingRequests.map(async (r) => {
          let jid = r.jid;
          if (jid.endsWith("@lid")) {
            const cachedJid = getLidMapping(jid);
            if (cachedJid) {
              jid = cachedJid;
            } else if (Gifted.getJidFromLid) {
              try {
                const resolved = await Gifted.getJidFromLid(jid);
                if (resolved) jid = resolved;
              } catch {}
            }
          }
          return jid;
        }),
      );

      const requestList = resolvedJids
        .map((jid, i) => {
          const number = jid.split("@")[0];
          return `${i + 1}. @${number}`;
        })
        .join("\n");

      const mentions = resolvedJids;

      const message =
        `📋 *SOLICITAÇÕES DE ENTRADA PENDENTES*\n\n` +
        `📊 Total: *${pendingRequests.length}* solicitação(s)\n\n` +
        `${requestList}\n\n` +
        `_Use .accept <numero> ou .acceptall para aprovar_\n` +
        `_Use .reject <numero> ou .rejectall para recusar_`;

      await react("✅");
      await Gifted.sendMessage(
        from,
        {
          text: message,
          mentions: mentions,
          contextInfo: {
            forwardingScore: 5,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: newsletterJid,
              newsletterName: botName,
              serverMessageId: 0,
            },
          },
        },
        { quoted: mek },
      );
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao listar solicitações: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "togroupstatus",
    aliases: ["groupstatus", "statusgroup", "togcstatus"],
    react: "📢",
    category: "grupo",
    description: "Enviar texto ou mídia citada para status do grupo. Apenas superusuário.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isSuperUser, isGroup, q, quoted, quotedMsg, mek, formatAudio, formatVideo, botPrefix } = conText;
    const { downloadMediaMessage } = require("gifted-baileys");

    if (!isGroup) return reply("❌ Comando apenas para grupo!");
    if (!isSuperUser) return reply("❌ Comando Apenas para Dono!");

    if (!q && !quotedMsg) {
      return reply(
        `📌 *Uso:*\n` +
          `• ${botPrefix}togroupstatus <texto>\n` +
          `• Responda a imagem/vídeo/áudio com ${botPrefix}togroupstatus <legenda>\n` +
          `• Ou apenas ${botPrefix}togroupstatus para encaminhar mídia citada`,
      );
    }

    try {
      let statusPayload = {};

      if (quotedMsg) {
        if (quoted?.imageMessage) {
          const caption = q || quoted.imageMessage.caption || "";
          const buffer = await downloadMediaMessage(
            { message: quotedMsg },
            "buffer",
            {},
          );
          statusPayload = { 
            image: buffer,
            mimetype: "image/jpeg"
          };
          if (caption) statusPayload.caption = caption;
        } else if (quoted?.videoMessage) {
          const caption = q || quoted.videoMessage.caption || "";
          let buffer = await downloadMediaMessage(
            { message: quotedMsg },
            "buffer",
            {},
          );
          buffer = await formatVideo(buffer);
          statusPayload = { 
            video: buffer,
            mimetype: "video/mp4"
          };
          if (caption) statusPayload.caption = caption;
        } else if (quoted?.audioMessage) {
          let buffer = await downloadMediaMessage(
            { message: quotedMsg },
            "buffer",
            {},
          );
          buffer = await formatAudio(buffer);
          statusPayload = { 
            audio: buffer,
            mimetype: "audio/mp4",
            ptt: true
          };
        } else if (quoted?.conversation || quoted?.extendedTextMessage?.text) {
          statusPayload.text = quoted.conversation || quoted.extendedTextMessage.text;
        } else {
          return reply("❌ Tipo de mídia não suportado para status do grupo.");
        }

        if (q && !statusPayload.caption && !statusPayload.text) {
          statusPayload.caption = q;
        }
      } else {
        statusPayload.text = q;
      }

      await Gifted.giftedStatus.sendGroupStatus(from, statusPayload);
      await react("✅");
    } catch (error) {
      console.error("Erro no togroupstatus:", error);
      await react("❌");
      return reply(`❌ Erro ao enviar status do grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "groupname",
    aliases: [
      "gcname",
      "setgcname",
      "setgroupname",
      "gcsubject",
      "setgcsubject",
    ],
    react: "✏️",
    category: "grupo",
    description: "Alterar nome/assunto do grupo. Uso: .groupname Novo Nome do Grupo",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      q,
      botPrefix,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    if (!q)
      return reply(
        `❌ Por favor, forneça um novo nome para o grupo.\n\n*Uso:* ${botPrefix}groupname Novo Nome do Grupo`,
      );

    try {
      await Gifted.groupUpdateSubject(from, q);
      await react("✅");
      return reply(`✅ Nome do grupo alterado para: *${q}*`);
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao alterar nome do grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "gcdesc",
    aliases: [
      "groupdesc",
      "setgcdesc",
      "setgroupdesc",
      "description",
      "setdescription",
    ],
    react: "📝",
    category: "grupo",
    description: "Alterar descrição do grupo. Uso: .gcdesc Nova Descrição",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      sender,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      q,
      botPrefix,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    if (!q)
      return reply(
        `❌ Por favor, forneça uma nova descrição para o grupo.\n\n*Uso:* ${botPrefix}gcdesc Nova Descrição Aqui`,
      );

    try {
      await Gifted.groupUpdateDescription(from, q);
      await react("✅");
      return reply(`✅ Descrição do grupo atualizada com sucesso!`);
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao alterar descrição do grupo: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "everyone",
    react: "📢",
    aliases: ["tag", "all", "mention"],
    category: "grupo",
    description: "Marcar todos no grupo com mensagem personalizada",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      isAdmin,
      isSuperAdmin,
      isGroup,
      mek,
      q,
      participants,
      sender,
      botName,
      newsletterJid,
    } = conText;

    if (!isGroup) {
      return reply("❌ Este comando só pode ser usado em grupos!");
    }

    if (!isAdmin && !isSuperAdmin) {
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} Apenas administradores do grupo podem usar este comando!`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    }

    const subject = q || "todos";
    const mentionedJids = participants
      .map((p) => {
        const jid =
          typeof p === "string"
            ? p
            : p.id || p.jid || p.pn || p.phoneNumber || "";
        if (!jid) return null;
        return jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
      })
      .filter(Boolean);

    try {
      await Gifted.sendMessage(
        from,
        {
          text: `@${from}`,
          contextInfo: {
            mentionedJid: mentionedJids,
            groupMentions: [
              {
                groupJid: from,
                groupSubject: subject,
              },
            ],
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
    } catch (error) {
      console.error("Erro ao marcar personalizado:", error);
      return reply(`❌ Falha ao marcar personalizado: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "hidetag",
    react: "📢",
    aliases: ["htag", "hidden", "hidtag"],
    category: "grupo",
    description: "Enviar uma mensagem que marca secretamente todos",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      isAdmin,
      isSuperAdmin,
      isGroup,
      mek,
      q,
      participants,
      sender,
      quotedMsg,
      botName,
      newsletterJid,
      botPrefix,
    } = conText;

    if (!isGroup) {
      return reply("❌ Este comando só pode ser usado em grupos!");
    }

    if (!isAdmin && !isSuperAdmin) {
      const userNumber = sender.split("@")[0];
      return reply(`@${userNumber} Apenas administradores do grupo podem usar este comando!`, {
        mentions: [`${userNumber}@s.whatsapp.net`],
      });
    }

    let text = q;
    if (!text && quotedMsg) {
      text =
        quotedMsg.conversation ||
        quotedMsg.extendedTextMessage?.text ||
        quotedMsg.imageMessage?.caption ||
        quotedMsg.videoMessage?.caption ||
        "";
    }

    if (!text) {
      return reply(
        `❌ Por favor, forneça uma mensagem ou responda a uma.\n\n*Uso:* ${botPrefix}hidtag Sua mensagem aqui`,
      );
    }

    const mentionedJids = participants
      .map((p) => {
        const jid =
          typeof p === "string"
            ? p
            : p.id || p.jid || p.pn || p.phoneNumber || "";
        if (!jid) return null;
        return jid.includes("@") ? jid : `${jid}@s.whatsapp.net`;
      })
      .filter(Boolean);

    try {
      await Gifted.sendMessage(
        from,
        {
          text: text,
          contextInfo: {
            mentionedJid: mentionedJids,
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
    } catch (error) {
      console.error("Erro no hidetag:", error);
      return reply(`❌ Falha ao enviar marcação oculta: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "antigroupmention",
    aliases: [
      "antigcmention",
      "antimentiongroup",
      "antigcstatusmention",
      "antistatusmention",
    ],
    react: "🛡️",
    category: "grupo",
    description:
      "Alternar proteção contra menção de grupo. Modos: on/warn (padrão), kick, off",
  },
  async (from, Gifted, conText) => {
    const {
      reply,
      react,
      isGroup,
      isBotAdmin,
      isAdmin,
      isSuperAdmin,
      q,
      mek,
      botName,
      botPrefix,
    } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      const currentSetting = await getGroupSetting(from, "ANTIGROUPMENTION");
      const arg = q?.toLowerCase()?.trim();

      if (!arg) {
        const status =
          currentSetting === "false" || currentSetting === "off"
            ? "DESLIGADO"
            : `LIGADO (${currentSetting})`;
        return reply(
          `🛡️ *Status de Anti-Menção de Grupo*\n\nAtual: *${status}*\n\n*Uso:*\n• ${botPrefix}antigroupmention on - Ativar com avisos\n• ${botPrefix}antigroupmention warn - Ativar com avisos\n• ${botPrefix}antigroupmention delete - Excluir mensagem apenas\n• ${botPrefix}antigroupmention kick - Expulsar imediatamente\n• ${botPrefix}antigroupmention off - Desativar`,
        );
      }

      let newValue;
      let message;

      if (arg === "on" || arg === "true" || arg === "warn") {
        newValue = "warn";
        message = `✅ Anti-Menção de Grupo *ATIVADO* com avisos!\n\nUsuários que mencionarem este grupo em seu status receberão um aviso e serão expulsos após atingir o limite de avisos.`;
      } else if (arg === "delete") {
        newValue = "delete";
        message = `✅ Anti-Menção de Grupo *ATIVADO* com exclusão!\n\nMensagens que mencionarem este grupo em seu status serão excluídas com um aviso. Sem ação de expulsão.`;
      } else if (arg === "kick") {
        newValue = "kick";
        message = `✅ Anti-Menção de Grupo *ATIVADO* com expulsão imediata!\n\nUsuários que mencionarem este grupo em seu status serão expulsos imediatamente.`;
      } else if (arg === "off" || arg === "false") {
        newValue = "false";
        message = `❌ Anti-Menção de Grupo *DESATIVADO*!`;
      } else {
        return reply(`❌ Opção inválida. Use: on, warn, delete, kick ou off`);
      }

      await setGroupSetting(from, "ANTIGROUPMENTION", newValue);
      await react("✅");
      return reply(message);
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao atualizar configuração: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "setantigcmentionwarnlimit",
    aliases: [
      "antigcmentionwarnlimit",
      "setantigroupmentionwarn",
      "antigroupmentionwarnlimit",
      "antigcwarnlimit2",
    ],
    react: "⚙️",
    category: "grupo",
    description: "Definir o limite de avisos para anti-menção de grupo antes da expulsão",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, q, mek, botPrefix } =
      conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin)
      return reply("❌ Você deve ser um administrador para usar este comando!");

    try {
      const currentLimit = await getGroupSetting(
        from,
        "ANTIGROUPMENTION_WARN_COUNT",
      );

      if (!q || !q.trim()) {
        return reply(
          `⚙️ *Limite de Avisos de Anti-Menção de Grupo*\n\nAtual: *${currentLimit || 3}* avisos\n\n*Uso:* ${botPrefix}setantigcmentionwarnlimit <numero>\n*Exemplo:* ${botPrefix}setantigcmentionwarnlimit 5`,
        );
      }

      const newLimit = parseInt(q.trim());
      if (isNaN(newLimit) || newLimit < 1 || newLimit > 50) {
        return reply(`❌ Por favor, forneça um número válido entre 1 e 50`);
      }

      await setGroupSetting(
        from,
        "ANTIGROUPMENTION_WARN_COUNT",
        String(newLimit),
      );
      await react("✅");
      return reply(
        `✅ Limite de avisos de Anti-Menção de Grupo definido para *${newLimit}*!\n\nUsuários serão expulsos após ${newLimit} avisos.`,
      );
    } catch (error) {
      await react("❌");
      return reply(`❌ Falha ao atualizar limite de avisos: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "tagall",
    react: "📢",
    aliases: ["mentionall"],
    category: "grupo",
    description: "Marcar todos os membros do grupo com mensagem opcional",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isAdmin, isSuperAdmin, isGroup, isSuperUser, mek, sender, q, botName } = conText;

    if (!isGroup) {
      return reply("❌ Este comando funciona apenas em grupos!");
    }

    if (!isAdmin && !isSuperAdmin && !isSuperUser) {
      return reply("❌ Comando Apenas para Admin/Dono!");
    }

    try {
      const meta = await Gifted.groupMetadata(from);
      const participants = meta.participants;

      const superAdmins = [];
      const admins = [];
      const members = [];

      for (let p of participants) {
        if (p.admin === "superadmin") {
          superAdmins.push(p.id);
        } else if (p.admin === "admin") {
          admins.push(p.id);
        } else {
          members.push(p.id);
        }
      }

      const sortedParticipants = [...superAdmins, ...admins, ...members];
      let mentions = sortedParticipants;

      let text = `*${botName} TAG TODOS*\n\n`;
      
      if (q && q.trim()) {
        text += `*Mensagem:* ${q.trim()}\n\n`;
      }
      
      text += `*Marcado Por:* @${sender.split('@')[0]}\n\n`;
      text += `*Membros Marcados:*\n`;

      for (let id of superAdmins) {
        text += `👑 @${id.split('@')[0]}\n`;
      }
      for (let id of admins) {
        text += `👮 @${id.split('@')[0]}\n`;
      }
      for (let id of members) {
        text += `👤 @${id.split('@')[0]}\n`;
      }

      mentions.push(sender);

      await Gifted.sendMessage(from, {
        text: text.trim(),
        mentions
      }, { quoted: mek });

      await react("✅");
    } catch (error) {
      console.error("Erro no tagall:", error);
      return reply(`❌ Falha ao marcar todos: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "tagadmins",
    react: "👮",
    aliases: ["taggcadmins", "taggroupadmins"],
    category: "grupo",
    description: "Marcar todos os administradores do grupo com mensagem opcional",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isAdmin, isSuperAdmin, isGroup, isSuperUser, mek, sender, q, botName } = conText;

    if (!isGroup) {
      return reply("❌ Este comando funciona apenas em grupos!");
    }

    if (!isAdmin && !isSuperAdmin && !isSuperUser) {
      return reply("❌ Comando Apenas para Admin/Dono!");
    }

    try {
      const meta = await Gifted.groupMetadata(from);
      const participants = meta.participants;

      const superAdmins = [];
      const admins = [];

      for (let p of participants) {
        if (p.admin === "superadmin") {
          superAdmins.push(p.id);
        } else if (p.admin === "admin") {
          admins.push(p.id);
        }
      }

      const allAdmins = [...superAdmins, ...admins];
      
      if (allAdmins.length === 0) {
        return reply("❌ Nenhum administrador encontrado neste grupo!");
      }

      let mentions = [...allAdmins, sender];

      let text = `*${botName} TAG ADMINS*\n\n`;
      
      if (q && q.trim()) {
        text += `*Mensagem:* ${q.trim()}\n\n`;
      }
      
      text += `*Marcado Por:* @${sender.split('@')[0]}\n\n`;
      text += `*Administradores Marcados:*\n`;

      for (let id of superAdmins) {
        text += `👑 @${id.split('@')[0]}\n`;
      }
      for (let id of admins) {
        text += `👮 @${id.split('@')[0]}\n`;
      }

      await Gifted.sendMessage(from, {
        text: text.trim(),
        mentions
      }, { quoted: mek });

      await react("✅");
    } catch (error) {
      console.error("Erro no tagadmins:", error);
      return reply(`❌ Falha ao marcar administradores: ${error.message}`);
    }
  },
);

gmd(
  {
    pattern: "antipromote",
    react: "🛡️",
    category: "grupo",
    description: "Alternar proteção contra promoção. Rebaixa tanto quem promove quanto quem é promovido.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, args, botPrefix } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin) return reply("❌ Você deve ser um administrador para usar este comando!");

    const action = args[0]?.toLowerCase();
    const rawCurrent = await getGroupSetting(from, "ANTIPROMOTE");
    const current = rawCurrent === "true" ? "true" : "false";
    
    if (!action || !["on", "off"].includes(action)) {
      return reply(`🛡️ *Proteção Anti-Promoção*\n\nAtual: ${current === "true" ? "LIGADO ✅" : "DESLIGADO ❌"}\n\n*Uso:*\n${botPrefix}antipromote on - Ativar\n${botPrefix}antipromote off - Desativar\n\n_Com ativado, se alguém promover outro usuário, ambos serão rebaixados._`);
    }

    const value = action === "on" ? "true" : "false";
    if (current === value) {
      return reply(`⚠️ Anti-Promoção já está ${action === "on" ? "LIGADO" : "DESLIGADO"}!`);
    }
    
    await setGroupSetting(from, "ANTIPROMOTE", value);
    await react("✅");
    return reply(`✅ Anti-Promoção agora está ${action === "on" ? "LIGADO" : "DESLIGADO"} para este grupo.`);
  },
);

gmd(
  {
    pattern: "antidemote",
    react: "🛡️",
    category: "grupo",
    description: "Alternar proteção contra rebaixamento. Rebaixa quem rebaixa e promove novamente quem foi rebaixado.",
  },
  async (from, Gifted, conText) => {
    const { reply, react, isGroup, isBotAdmin, isAdmin, isSuperAdmin, args, botPrefix } = conText;

    if (!isGroup) return reply("❌ Este comando funciona apenas em grupos!");
    if (!isBotAdmin) return reply("❌ Bot não é administrador neste grupo!");
    if (!isAdmin && !isSuperAdmin) return reply("❌ Você deve ser um administrador para usar este comando!");

    const action = args[0]?.toLowerCase();
    const rawCurrent = await getGroupSetting(from, "ANTIDEMOTE");
    const current = rawCurrent === "true" ? "true" : "false";
    
    if (!action || !["on", "off"].includes(action)) {
      return reply(`🛡️ *Proteção Anti-Rebaixamento*\n\nAtual: ${current === "true" ? "LIGADO ✅" : "DESLIGADO ❌"}\n\n*Uso:*\n${botPrefix}antidemote on - Ativar\n${botPrefix}antidemote off - Desativar\n\n_Com ativado, se alguém rebaixar um administrador, o rebaixador será rebaixado e o rebaixado será promovido novamente._`);
    }

    const value = action === "on" ? "true" : "false";
    if (current === value) {
      return reply(`⚠️ Anti-Rebaixamento já está ${action === "on" ? "LIGADO" : "DESLIGADO"}!`);
    }
    
    await setGroupSetting(from, "ANTIDEMOTE", value);
    await react("✅");
    return reply(`✅ Anti-Rebaixamento agora está ${action === "on" ? "LIGADO" : "DESLIGADO"} para este grupo.`);
  },
);
