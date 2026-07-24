const { gmd } = require("../gift");
const {
    createGame,
    joinGame,
    getActiveGame,
    getWaitingGame,
    makeMove,
    endGame,
    initGamesDB,
} = require("../gift/database/games");

const {
    createWcgGame,
    joinWcgGame,
    startWcgGame,
    getActiveWcgGame,
    getWaitingWcgGame,
    submitWord,
    eliminatePlayer,
    endWcgGame,
    initWcgDB,
} = require("../gift/database/wcgGame");

const {
    createDiceGame,
    joinDiceGame,
    getActiveDiceGame,
    getWaitingDiceGame,
    playerRoll,
    endDiceGame,
    initDiceDB,
} = require("../gift/database/diceGame");

const { 
    clearGameTimeout, 
    setMoveTimeout, 
    setWcgTurnTimeout,
    setDiceTurnTimeout,
    clearDiceTimeout,
    renderBoard, 
    getPlayerName,
    handleAiTttMove,
    handleAiWcgMove,
    handleAiDiceRoll,
    gameTimeouts,
    diceTimeouts,
} = require("../gift/gameHandler");

const {
    wcgTimeouts,
    clearWcgTimeout,
    clearWcgJoinTimeout,
    setWcgJoinTimeout,
    formatScores,
    getDiceEmoji,
} = require("../gift/wcg");


const {
    findWcgWord,
    rollDice: aiRollDice,
    findBestTttMove,
    BOT_JID,
} = require("../gift/gameAI");

initGamesDB();
initWcgDB();
initDiceDB();

gmd({
    pattern: "games",
    aliases: ["game", "playgame", "playgames", "gamelist"],
    react: "🎮",
    category: "game",
    description: "Mostrar todos os jogos e comandos disponíveis",
}, async (from, Gifted, conText) => {
    const helpText = `🎮 *MENU DE JOGOS*

╭━━━━━━━━━━━━━━━━━╮
│ ❌⭕ *TIC TAC TOE (Jogo da Velha)*
├━━━━━━━━━━━━━━━━━┤
│ .ttt - Iniciar jogo (vs jogador)
│ .tttai - Jogar contra IA 🤖
│ .tttend - Encerrar jogo atual
│ _Digite *join* para entrar em um jogo_
│ _Digite *1-9* para fazer uma jogada_
╰━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━╮
│ 🔤 *JOGO DA CADEIA DE PALAVRAS*
├━━━━━━━━━━━━━━━━━┤
│ .wcg - Iniciar jogo (multijogador)
│ .wcgai - Jogar contra IA 🤖
│ .wcgbegin - Iniciar o jogo (anfitrião)
│ .wcgend - Encerrar jogo atual
│ .wcgscores - Ver pontuações
│ _Digite *join* para entrar em um jogo_
│ _Apenas digite sua palavra!_
╰━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━╮
│ 🎲 *JOGO DE DADOS*
├━━━━━━━━━━━━━━━━━┤
│ .dice [rodadas] - Iniciar jogo
│ .diceai [rodadas] - Jogar contra IA 🤖
│ .diceend - Encerrar jogo atual
│ _Digite *join* para entrar em um jogo_
│ _Digite *roll* para rolar os dados_
╰━━━━━━━━━━━━━━━━━╯

_Modos de IA permitem jogar sozinho contra o bot!_
_Nenhum prefixo de comando necessário durante a jogada!_`;
    
    return await Gifted.sendMessage(from, {
        text: helpText,
    });
});

const setJoinTimeout = (chatJid, Gifted, player1) => {
    clearGameTimeout(chatJid);
    const timeout = setTimeout(async () => {
        const waiting = await getWaitingGame(chatJid);
        if (waiting) {
            await endGame(chatJid);
            await Gifted.sendMessage(chatJid, {
                text: `⏰ *TIC TAC TOE - TEMPO ESGOTADO*\n\nNinguém entrou em 30 segundos.\nJogo cancelado!\n\n@${getPlayerName(player1)} pode iniciar um novo jogo com *.ttt*`,
    
                mentions: [player1],
            });
        }
        gameTimeouts.delete(chatJid);
    }, 30000);
    gameTimeouts.set(chatJid, timeout);
};

gmd({
    pattern: "tictactoe",
    aliases: ["ttt", "tttstart"],
    react: "🎮",
    category: "game",
    description: "Iniciar um jogo de TicTacToe. Outro jogador deve digitar 'join' dentro de 30 segundos.",
}, async (from, Gifted, conText) => {
    const { mek, sender, botName } = conText;
    
    const existingActive = await getActiveGame(from);
    if (existingActive) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo ativo neste chat!\nUse *.tttend* para encerrar primeiro.",

        });
    }
    
    const existingWaiting = await getWaitingGame(from);
    if (existingWaiting) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo aguardando um jogador!\nDigite *join* para entrar, ou use *.tttend* para cancelar.",

        });
    }
    
    const sentMsg = await Gifted.sendMessage(from, {
        text: `🎮 *TIC TAC TOE*\n\n@${getPlayerName(sender)} quer jogar!\n\n*Digite "join" dentro de 30 segundos para participar!*\n\nJogador 1: @${getPlayerName(sender)} (❌)\nJogador 2: Aguardando...\n\n${renderBoard([1, 2, 3, 4, 5, 6, 7, 8, 9])}\n\n⏰ _Cancela automaticamente em 30 segundos se ninguém entrar_`,
        mentions: [sender],
    });
    
    await createGame(from, sender, sentMsg.key);
    setJoinTimeout(from, Gifted, sender);
});

gmd({
    pattern: "tttend",
    aliases: ["endttt", "tttcancel", "ttstop", "tictactoestop", "tictactoeend", "stopttt", "cancelttt"],
    react: "🛑",
    category: "game",
    description: "Encerrar o jogo atual de TicTacToe",
}, async (from, Gifted, conText) => {
    const { sender, isSuperUser } = conText;
    
    const activeGame = await getActiveGame(from);
    const waitingGame = await getWaitingGame(from);
    const game = activeGame || waitingGame;
    
    if (!game) {
        return await Gifted.sendMessage(from, {
            text: "❌ Não há jogo de TicTacToe para encerrar!",
        });
    }
    
    const isPlayer = game.player1 === sender || game.player2 === sender;
    if (!isPlayer && !isSuperUser) {
        return await Gifted.sendMessage(from, {
            text: "❌ Apenas jogadores ou administradores podem encerrar o jogo!",
        });
    }
    
    clearGameTimeout(from);
    await endGame(from);
    await Gifted.sendMessage(from, {
        text: `🛑 Jogo de TicTacToe encerrado por @${getPlayerName(sender)}!`,
        mentions: [sender],
    });
});

gmd({
    pattern: "tttjoin",
    aliases: ["jointtt"],
    react: "✅",
    category: "game",
    description: "Entrar em um jogo de TicTacToe aguardando",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const result = await joinGame(from, sender);
    
    if (!result) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo aguardando jogadores! Inicie um com *.ttt*",

        });
    }
    
    if (result.error === "same_player") {
        return await Gifted.sendMessage(from, {
            text: "❌ Você não pode jogar contra si mesmo!",

        });
    }
    
    clearGameTimeout(from);
    
    const board = JSON.parse(result.board);
    await Gifted.sendMessage(from, {
        text: `🎮 *TIC TAC TOE - JOGO INICIADO!*\n\nJogador 1: @${getPlayerName(result.player1)} (❌)\nJogador 2: @${getPlayerName(result.player2)} (⭕)\n\n${renderBoard(board)}\n\nVez de @${getPlayerName(result.currentTurn)} (❌)\n\n*Responda com um número (1-9) para mover!*\n⏰ _30 segundos por jogada_`,
        mentions: [result.player1, result.player2, result.currentTurn],
    });
    
    setMoveTimeout(from, Gifted, result.currentTurn, result.player2, result.player1);
});

gmd({
    pattern: "tttboard",
    aliases: ["board", "tttshow"],
    react: "📋",
    category: "game",
    description: "Mostrar o tabuleiro atual do TicTacToe",
}, async (from, Gifted, conText) => {
    const game = await getActiveGame(from);
    
    if (!game) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo ativo! Inicie um com *.ttt*",

        });
    }
    
    const board = JSON.parse(game.board);
    const currentSymbol = game.currentTurn === game.player1 ? "❌" : "⭕";
    
    await Gifted.sendMessage(from, {
        text: `🎮 *TIC TAC TOE*\n\nJogador 1: @${getPlayerName(game.player1)} (❌)\nJogador 2: @${getPlayerName(game.player2)} (⭕)\n\n${renderBoard(board)}\n\nVez de @${getPlayerName(game.currentTurn)} (${currentSymbol})`,
        mentions: [game.player1, game.player2, game.currentTurn],
    });
});

gmd({
    pattern: "wcg",
    aliases: ["wordchain", "wcgstart", "wordgame"],
    react: "🔤",
    category: "game",
    description: "Iniciar um Jogo da Cadeia de Palavras",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const existingActive = await getActiveWcgGame(from);
    if (existingActive) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo de Cadeia de Palavras ativo!\nUse *.wcgend* para encerrar primeiro.",

        });
    }
    
    const existingWaiting = await getWaitingWcgGame(from);
    if (existingWaiting) {
        return await Gifted.sendMessage(from, {
            text: "❌ Um jogo está aguardando jogadores!\nUse *.wcgjoin* para entrar ou *.wcgend* para cancelar.",

        });
    }
    
    await createWcgGame(from, sender);
    
    await Gifted.sendMessage(from, {
        text: `🔤 *JOGO DA CADEIA DE PALAVRAS*\n\n@${getPlayerName(sender)} quer jogar!\n\n📜 *Regras:*\n• Cada palavra deve começar com a última letra da palavra anterior\n• Sem repetir palavras\n• Mínimo de 2 letras por palavra\n• 30 segundos por vez\n\n👥 *Jogadores:*\n1. @${getPlayerName(sender)}\n\n⏰ *30 segundos para entrar!*\n*Digite .wcgjoin para entrar!*\n*O anfitrião digita .wcgbegin para iniciar antes*`,
        mentions: [sender],
    });
    
    setWcgJoinTimeout(from, async () => {
        const waitingGame = await getWaitingWcgGame(from);
        if (!waitingGame) return;
        
        const players = JSON.parse(waitingGame.players);
        if (players.length < 2) {
            await endWcgGame(from);
            await Gifted.sendMessage(from, {
                text: "⏰ *Fim do tempo!*\n\nNinguém entrou no jogo. Jogo cancelado.",
            });
            return;
        }
        
        const result = await startWcgGame(from);
        if (result.error) return;
        
        const playerList = result.players.map((p, i) => `${i + 1}. @${getPlayerName(p)}`).join('\n');
        
        await Gifted.sendMessage(from, {
            text: `⏰ *Fim do tempo! Iniciando jogo!*\n\n🚀 *CADEIA DE PALAVRAS INICIADA!*\n\n👥 *Jogadores:*\n${playerList}\n\n🔄 Vez de @${getPlayerName(result.currentTurn)}!\n*Diga qualquer palavra para começar!*\n\n⏰ _30 segundos por vez_`,
            mentions: [...result.players, result.currentTurn],
        });
        
        setWcgTurnTimeout(from, Gifted, result.currentTurn, result.game);
    });
});

gmd({
    pattern: "wcgjoin",
    aliases: ["joinwcg", "joinwordchain"],
    react: "✅",
    category: "game",
    description: "Entrar em um Jogo da Cadeia de Palavras",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const result = await joinWcgGame(from, sender);
    
    if (result.error === 'no_game') {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo aguardando! Inicie um com *.wcg*",
        });
    }
    
    if (result.error === 'cant_join_own_game') {
        return await Gifted.sendMessage(from, {
            text: "❌ Você não pode jogar contra si mesmo! Aguarde alguém else entrar.",
        });
    }
    
    if (result.error === 'already_joined') {
        return await Gifted.sendMessage(from, {
            text: "❌ Você já entrou neste jogo!",
        });
    }
    
    const playerList = result.players.map((p, i) => `${i + 1}. @${getPlayerName(p)}`).join('\n');
    const mentions = result.players;
    
    await Gifted.sendMessage(from, {
        text: `✅ @${getPlayerName(sender)} entrou!\n\n👥 *Jogadores (${result.players.length}):*\n${playerList}\n\n*Mais podem entrar com .wcgjoin*\n*O anfitrião digita .wcgbegin quando estiver pronto*`,
        mentions,
    });
});

gmd({
    pattern: "wcgbegin",
    aliases: ["startwcg", "wcggo"],
    react: "🚀",
    category: "game",
    description: "Iniciar o Jogo da Cadeia de Palavras (apenas anfitrião)",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const waitingGame = await getWaitingWcgGame(from);
    if (!waitingGame) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo aguardando para iniciar!",

        });
    }
    
    const players = JSON.parse(waitingGame.players);
    if (players[0] !== sender) {
        return await Gifted.sendMessage(from, {
            text: "❌ Apenas o anfitrião pode iniciar o jogo!",

        });
    }
    
    clearWcgJoinTimeout(from);
    
    const result = await startWcgGame(from);
    
    if (result.error === 'not_enough_players') {
        return await Gifted.sendMessage(from, {
            text: "❌ São necessários pelo menos 2 jogadores para iniciar!",

        });
    }
    
    const playerList = result.players.map((p, i) => `${i + 1}. @${getPlayerName(p)}`).join('\n');
    
    await Gifted.sendMessage(from, {
        text: `🚀 *CADEIA DE PALAVRAS INICIADA!*\n\n👥 *Jogadores:*\n${playerList}\n\n🔄 Vez de @${getPlayerName(result.currentTurn)}!\n*Diga qualquer palavra para começar!*\n\n⏰ _30 segundos por vez_`,
        mentions: [...result.players, result.currentTurn],
    });
    
    setWcgTurnTimeout(from, Gifted, result.currentTurn, result.game);
});

gmd({
    pattern: "wcgend",
    aliases: ["endwcg", "wcgstop", "stopwcg", "wcgcancel"],
    react: "🛑",
    category: "game",
    description: "Encerrar o Jogo da Cadeia de Palavras",
}, async (from, Gifted, conText) => {
    const { sender, isSuperUser } = conText;
    
    const game = await getActiveWcgGame(from) || await getWaitingWcgGame(from);
    
    if (!game) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo de Cadeia de Palavras para encerrar!",
        });
    }
    
    const players = JSON.parse(game.players);
    const isPlayer = players.includes(sender);
    if (!isPlayer && !isSuperUser) {
        return await Gifted.sendMessage(from, {
            text: "❌ Apenas jogadores ou administradores podem encerrar o jogo!",
        });
    }
    
    clearWcgTimeout(from);
    clearWcgJoinTimeout(from);
    const scores = await endWcgGame(from);
    
    let text = `🛑 Cadeia de Palavras encerrada por @${getPlayerName(sender)}!`;
    if (scores && Object.keys(scores).length > 0) {
        text += `\n\n📊 *Pontuações Finais:*\n${formatScores(scores)}`;
    }
    
    await Gifted.sendMessage(from, {
        text,
        mentions: [sender],
    });
});

gmd({
    pattern: "wcgscores",
    aliases: ["wcgscore", "wordchainscore"],
    react: "📊",
    category: "game",
    description: "Mostrar pontuações da Cadeia de Palavras",
}, async (from, Gifted, conText) => {
    const game = await getActiveWcgGame(from);
    
    if (!game) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo de Cadeia de Palavras ativo!",

        });
    }
    
    const scores = JSON.parse(game.scores);
    const players = JSON.parse(game.players);
    const usedWords = JSON.parse(game.usedWords);
    
    await Gifted.sendMessage(from, {
        text: `📊 *PONTUAÇÕES DA CADEIA DE PALAVRAS*\n\n${formatScores(scores)}\n\n📝 Palavras usadas: ${usedWords.length}\n🔄 Vez atual: @${getPlayerName(game.currentTurn)}\n${game.lastWord ? `Última palavra: *${game.lastWord}*` : ''}`,
        mentions: [...players, game.currentTurn],
    });
});

gmd({
    pattern: "w",
    aliases: ["word", "wcgword", "say"],
    react: "🔤",
    category: "game",
    description: "Enviar uma palavra no Jogo da Cadeia de Palavras",
}, async (from, Gifted, conText) => {
    const { sender, q, botPrefix } = conText;
    
    const game = await getActiveWcgGame(from);
    if (!game) {
        return;
    }
    
    if (!q || q.trim() === '') {
        return await Gifted.sendMessage(from, {
            text: `❌ Forneça uma palavra!\n\nUso: ${botPrefix}w <palavra>`,

        });
    }
    
    const word = q.trim().split(/\s+/)[0];
    const result = await submitWord(from, sender, word);
    
    if (result.error === 'not_your_turn') {
        return await Gifted.sendMessage(from, {
            text: "❌ Não é a sua vez!",

        });
    }
    
    if (result.error === 'word_used') {
        return await Gifted.sendMessage(from, {
            text: `❌ "${word}" já foi usada!`,

        });
    }
    
    if (result.error === 'wrong_letter') {
        return await Gifted.sendMessage(from, {
            text: `❌ A palavra deve começar com *${result.expected.toUpperCase()}*!`,

        });
    }
    
    if (result.error === 'too_short') {
        return await Gifted.sendMessage(from, {
            text: "❌ A palavra deve ter pelo menos 2 letras!",

        });
    }
    
    clearWcgTimeout(from);
    
    const nextLetter = result.word.slice(-1).toUpperCase();
    
    const updatedGame = await getActiveWcgGame(from);
    if (updatedGame && updatedGame.isAiGame && result.nextPlayer === BOT_JID) {
        await Gifted.sendMessage(from, {
            text: `✅ *${result.word}* (+${result.word.length} pts)\n\n🤖 IA está pensando...`,

        });
        await handleAiWcgMoveInternal(from, Gifted, updatedGame);
        return;
    }
    
    await Gifted.sendMessage(from, {
        text: `✅ *${result.word}* (+${result.word.length} pts)\n\n🔄 Vez de @${getPlayerName(result.nextPlayer)}\nPróxima palavra começa com: *${nextLetter}*\n\n📊 Palavras: ${result.wordCount} | ⏰ 30s`,
        mentions: [result.nextPlayer],
    });
    
    setWcgTurnTimeout(from, Gifted, result.nextPlayer, result.game);
});

async function handleAiWcgMoveInternal(from, Gifted, game) {
    const lastWord = game.lastWord;
    const usedWords = JSON.parse(game.usedWords);
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const aiWord = findWcgWord(lastWord, usedWords);
    
    if (!aiWord) {
        const scores = JSON.parse(game.scores);
        await endWcgGame(from);
        await Gifted.sendMessage(from, {
            text: `🎉 *VOCÊ VENCEU!*\n\n🤖 IA não encontrou uma palavra começando com *${lastWord.slice(-1).toUpperCase()}*!\n\n📊 *Pontuações Finais:*\n${formatScores(scores)}`,

        });
        return;
    }
    
    const result = await submitWord(from, BOT_JID, aiWord);
    
    if (result.error) {
        const scores = JSON.parse(game.scores);
        await endWcgGame(from);
        await Gifted.sendMessage(from, {
            text: `🎉 *VOCÊ VENCEU!*\n\n🤖 IA cometeu um erro!\n\n📊 *Pontuações Finais:*\n${formatScores(scores)}`,

        });
        return;
    }
    
    const nextLetter = result.word.slice(-1).toUpperCase();
    await Gifted.sendMessage(from, {
        text: `🤖 IA diz: *${result.word}* (+${result.word.length} pts)\n\n🔄 Vez de @${getPlayerName(result.nextPlayer)}\nPróxima palavra começa com: *${nextLetter}*\n\n📊 Palavras: ${result.wordCount} | ⏰ 30s`,
        mentions: [result.nextPlayer],
    });
    
    setWcgTurnTimeout(from, Gifted, result.nextPlayer, result.game);
}

gmd({
    pattern: "dice",
    aliases: ["dicestart", "dicegame", "rolldice"],
    react: "🎲",
    category: "game",
    description: "Iniciar um Jogo de Dados",
}, async (from, Gifted, conText) => {
    const { sender, q } = conText;
    
    const existingActive = await getActiveDiceGame(from);
    if (existingActive) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo de Dados ativo!\nUse *.diceend* para encerrar primeiro.",

        });
    }
    
    const existingWaiting = await getWaitingDiceGame(from);
    if (existingWaiting) {
        return await Gifted.sendMessage(from, {
            text: "❌ Um jogo está aguardando um oponente!\nUse *.dicejoin* para entrar ou *.diceend* para cancelar.",

        });
    }
    
    const rounds = parseInt(q) || 3;
    await createDiceGame(from, sender, rounds);
    
    await Gifted.sendMessage(from, {
        text: `🎲 *JOGO DE DADOS*\n\n@${getPlayerName(sender)} quer jogar!\n\n📜 *Regras:*\n• ${rounds} rodadas\n• Cada jogador rola uma vez por rodada\n• Quem tirar o maior valor ganha a rodada\n• Quem ganhar mais rodadas é o vencedor!\n\n*Digite .dicejoin para jogar!*\n⏰ _30 segundos para entrar_`,
        mentions: [sender],
    });
    
    const timeout = setTimeout(async () => {
        const waiting = await getWaitingDiceGame(from);
        if (waiting) {
            await endDiceGame(from);
            await Gifted.sendMessage(from, {
                text: `⏰ *JOGO DE DADOS - TEMPO ESGOTADO*\n\nNinguém entrou em 30 segundos.\nJogo cancelado!`,
    
            });
        }
    }, 30000);
    diceTimeouts.set(from + '_join', timeout);
});

gmd({
    pattern: "dicejoin",
    aliases: ["joindice"],
    react: "✅",
    category: "game",
    description: "Entrar em um Jogo de Dados",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    if (diceTimeouts.has(from + '_join')) {
        clearTimeout(diceTimeouts.get(from + '_join'));
        diceTimeouts.delete(from + '_join');
    }
    
    const result = await joinDiceGame(from, sender);
    
    if (result.error === 'no_game') {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo aguardando! Inicie um com *.dice*",

        });
    }
    
    if (result.error === 'same_player') {
        return await Gifted.sendMessage(from, {
            text: "❌ Você não pode jogar contra si mesmo!",

        });
    }
    
    await Gifted.sendMessage(from, {
        text: `🎲 *JOGO DE DADOS INICIADO!*\n\n👤 @${getPlayerName(result.player1)} vs @${getPlayerName(result.player2)}\n🎯 Melhor de ${result.rounds} rodadas\n\n*Rodada 1*\n@${getPlayerName(result.player1)}, digite *.roll* para rolar!\n\n⏰ _30 segundos por vez_`,
        mentions: [result.player1, result.player2],
    });
    
    setDiceTurnTimeout(from, Gifted, result.player1, result.game);
});

gmd({
    pattern: "roll",
    aliases: ["diceroll", "throwdice"],
    react: "🎲",
    category: "game",
    description: "Rolar os dados em um jogo ativo",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const game = await getActiveDiceGame(from);
    if (!game) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo de Dados ativo! Inicie um com *.dice*",

        });
    }
    
    clearDiceTimeout(from);
    const result = await playerRoll(from, sender);
    
    if (result.error === 'not_your_turn') {
        return await Gifted.sendMessage(from, {
            text: "❌ Não é a sua vez!",

        });
    }
    
    if (result.roundComplete || result.gameFinished) {
        let text = `🎲 *Resultados da Rodada ${result.currentRound}*\n\n`;
        text += `${getDiceEmoji(result.player1Roll)} @${getPlayerName(result.player1)}: ${result.player1Roll}\n`;
        text += `${getDiceEmoji(result.player2Roll)} @${getPlayerName(result.player2)}: ${result.player2Roll}\n\n`;
        
        if (result.roundWinner) {
            text += `🏆 @${getPlayerName(result.roundWinner)} venceu esta rodada!\n`;
        } else {
            text += `🤝 Empate!\n`;
        }
        
        text += `\n📊 *Placar:* ${result.player1Score} - ${result.player2Score}`;
        
        if (result.gameFinished) {
            text += `\n\n🎮 *FIM DE JOGO!*\n`;
            if (result.gameWinner) {
                text += `🏆 *VENCEDOR:* @${getPlayerName(result.gameWinner)}!`;
            } else {
                text += `🤝 *Empate!*`;
            }
            await endDiceGame(from);
        } else {
            text += `\n\n*Rodada ${result.nextRound}*\n@${getPlayerName(result.player1)}, digite *.roll*!`;
            setDiceTurnTimeout(from, Gifted, result.player1, game);
        }
        
        await Gifted.sendMessage(from, {
            text,
            mentions: [result.player1, result.player2, result.roundWinner, result.gameWinner].filter(Boolean),
        });
    } else {
        if (game.isAiGame && result.waitingFor === BOT_JID) {
            clearDiceTimeout(from);
            await Gifted.sendMessage(from, {
                text: `🎲 @${getPlayerName(sender)} rolou: ${getDiceEmoji(result.roll)} *${result.roll}*\n\n🤖 IA está rolando...`,
                mentions: [sender],
            });
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const aiResult = await playerRoll(from, BOT_JID);
            
            if (aiResult.error) {
                await Gifted.sendMessage(from, {
                    text: `❌ Erro na jogada da IA. Jogo encerrado.`,
                });
                await endDiceGame(from);
                return;
            }
            
            let text = `🎲 *Resultados da Rodada ${aiResult.currentRound}*\n\n`;
            text += `${getDiceEmoji(aiResult.player1Roll)} @${getPlayerName(aiResult.player1)}: ${aiResult.player1Roll}\n`;
            text += `${getDiceEmoji(aiResult.player2Roll)} 🤖 IA: ${aiResult.player2Roll}\n\n`;
            
            if (aiResult.roundWinner) {
                const winnerName = aiResult.roundWinner === BOT_JID ? '🤖 IA' : `@${getPlayerName(aiResult.roundWinner)}`;
                text += `🏆 ${winnerName} venceu esta rodada!\n`;
            } else {
                text += `🤝 Empate!\n`;
            }
            
            text += `\n📊 *Placar:* ${aiResult.player1Score} - ${aiResult.player2Score}`;
            
            if (aiResult.gameFinished) {
                text += `\n\n🎮 *FIM DE JOGO!*\n`;
                if (aiResult.gameWinner) {
                    const winnerName = aiResult.gameWinner === BOT_JID ? '🤖 IA venceu!' : `🏆 @${getPlayerName(aiResult.gameWinner)} venceu!`;
                    text += winnerName;
                } else {
                    text += `🤝 *Empate!*`;
                }
                await endDiceGame(from);
            } else {
                text += `\n\n*Rodada ${aiResult.nextRound}*\n@${getPlayerName(aiResult.player1)}, digite *.roll*!`;
                const freshGame = await getActiveDiceGame(from);
                setDiceTurnTimeout(from, Gifted, aiResult.player1, freshGame);
            }
            
            await Gifted.sendMessage(from, {
                text,
                mentions: [aiResult.player1],
            });
            return;
        }
        
        await Gifted.sendMessage(from, {
            text: `🎲 @${getPlayerName(sender)} rolou: ${getDiceEmoji(result.roll)} *${result.roll}*\n\n@${getPlayerName(result.waitingFor)}, digite *.roll*!`,
            mentions: [sender, result.waitingFor],
        });
        setDiceTurnTimeout(from, Gifted, result.waitingFor, game);
    }
});

gmd({
    pattern: "diceend",
    aliases: ["enddice", "dicestop", "stopdice", "dicecancel"],
    react: "🛑",
    category: "game",
    description: "Encerrar o Jogo de Dados",
}, async (from, Gifted, conText) => {
    const { sender, isSuperUser } = conText;
    
    const game = await getActiveDiceGame(from) || await getWaitingDiceGame(from);
    
    if (!game) {
        return await Gifted.sendMessage(from, {
            text: "❌ Nenhum jogo de Dados para encerrar!",
        });
    }
    
    const isPlayer = game.player1 === sender || game.player2 === sender;
    if (!isPlayer && !isSuperUser) {
        return await Gifted.sendMessage(from, {
            text: "❌ Apenas jogadores ou administradores podem encerrar o jogo!",
        });
    }
    
    clearDiceTimeout(from);
    if (diceTimeouts.has(from + '_join')) {
        clearTimeout(diceTimeouts.get(from + '_join'));
        diceTimeouts.delete(from + '_join');
    }
    await endDiceGame(from);
    
    await Gifted.sendMessage(from, {
        text: `🛑 Jogo de Dados encerrado por @${getPlayerName(sender)}!`,
        mentions: [sender],
    });
});

gmd({
    pattern: "tttai",
    aliases: ["tttbot", "tictactoeai", "aitt"],
    react: "🤖",
    category: "game",
    description: "Jogar TicTacToe contra a IA",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const existingActive = await getActiveGame(from);
    if (existingActive) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo ativo neste chat!\nUse *.tttend* para encerrar primeiro.",

        });
    }
    
    const existingWaiting = await getWaitingGame(from);
    if (existingWaiting) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo aguardando!\nUse *.tttend* para cancelar.",

        });
    }
    
    const sentMsg = await Gifted.sendMessage(from, {
        text: `🤖 *TIC TAC TOE vs IA*\n\nJogador: @${getPlayerName(sender)} (❌)\nIA: 🤖 (⭕)\n\n${renderBoard([1, 2, 3, 4, 5, 6, 7, 8, 9])}\n\nVez de @${getPlayerName(sender)} (❌)\n*Responda com um número (1-9) para mover!*`,
        mentions: [sender],
    });
    
    await createGame(from, sender, sentMsg.key, true);
});

gmd({
    pattern: "wcgai",
    aliases: ["wcgbot", "wordchainai", "aiwcg"],
    react: "🤖",
    category: "game",
    description: "Jogar Cadeia de Palavras contra a IA",
}, async (from, Gifted, conText) => {
    const { sender } = conText;
    
    const existingActive = await getActiveWcgGame(from);
    if (existingActive) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo de Cadeia de Palavras ativo!\nUse *.wcgend* para encerrar primeiro.",

        });
    }
    
    const existingWaiting = await getWaitingWcgGame(from);
    if (existingWaiting) {
        return await Gifted.sendMessage(from, {
            text: "❌ Um jogo está aguardando jogadores!\nUse *.wcgend* para cancelar.",

        });
    }
    
    const { WcgDB } = require("../gift/database/wcgGame");
    await WcgDB.destroy({ where: { chatJid: from } });
    
    const scores = {};
    scores[sender] = 0;
    scores[BOT_JID] = 0;
    
    await WcgDB.create({
        chatJid: from,
        players: JSON.stringify([sender, BOT_JID]),
        currentTurn: sender,
        lastWord: null,
        usedWords: '[]',
        scores: JSON.stringify(scores),
        status: 'active',
        isAiGame: true,
    });
    
    await Gifted.sendMessage(from, {
        text: `🤖 *CADEIA DE PALAVRAS vs IA*\n\n📜 *Regras:*\n• Cada palavra deve começar com a última letra da palavra anterior\n• Sem repetir palavras\n• Mínimo de 2 letras por palavra\n• 30 segundos por vez\n\n👤 @${getPlayerName(sender)} vs 🤖 IA\n\nVez de @${getPlayerName(sender)} - diga qualquer palavra para começar!\n\n⏰ _30 segundos por vez_`,
        mentions: [sender],
    });
    
    setWcgTurnTimeout(from, Gifted, sender, null);
});

gmd({
    pattern: "diceai",
    aliases: ["dicebot", "aidice", "rolldiceai"],
    react: "🤖",
    category: "game",
    description: "Jogar Dados contra a IA",
}, async (from, Gifted, conText) => {
    const { sender, q } = conText;
    
    const existingActive = await getActiveDiceGame(from);
    if (existingActive) {
        return await Gifted.sendMessage(from, {
            text: "❌ Já há um jogo de Dados ativo!\nUse *.diceend* para encerrar primeiro.",

        });
    }
    
    const existingWaiting = await getWaitingDiceGame(from);
    if (existingWaiting) {
        return await Gifted.sendMessage(from, {
            text: "❌ Um jogo está aguardando!\nUse *.diceend* para cancelar.",

        });
    }
    
    const rounds = parseInt(q) || 3;
    const { DiceDB } = require("../gift/database/diceGame");
    await DiceDB.destroy({ where: { chatJid: from } });
    
    await DiceDB.create({
        chatJid: from,
        player1: sender,
        player2: BOT_JID,
        player1Roll: null,
        player2Roll: null,
        currentTurn: sender,
        rounds: Math.min(Math.max(rounds, 1), 10),
        currentRound: 1,
        player1Score: 0,
        player2Score: 0,
        status: 'active',
        isAiGame: true,
    });
    
    await Gifted.sendMessage(from, {
        text: `🤖 *JOGO DE DADOS vs IA*\n\n👤 @${getPlayerName(sender)} vs 🤖 IA\n🎯 Melhor de ${rounds} rodadas\n\n*Rodada 1*\n@${getPlayerName(sender)}, digite *.roll* para rolar!\n\n⏰ _30 segundos por vez_`,
        mentions: [sender],
    });
    
    setDiceTurnTimeout(from, Gifted, sender, null);
});

module.exports = {};
