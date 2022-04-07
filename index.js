const { Client, Intents } = require("discord.js");
const { generateDependencyReport, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");
const fs = require("fs");
const { users } = require("./users.json");

console.log("users", users);

const bot = {};

const token = process.env.DISCORD_TOKEN;

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES]
});

const successMessages = {
	channel: ["To entrando", "Colando", "Ja chego", "Cheguei piranhas", "To on", "Quem cola", "Salve", "Opa bão"]
};

const errosMessages = {
	channel: ["Burrão tu ein, entra num canal de voz ai.", "ENTRA NUM CANAL DE VOZ!!!!!!!", "SE NUM TA NUM CANAL DE VOZ!", "Entra na call ae", "Entra que eu entro"],
	require: ["PRIMEIRO SE ME CUMPRIMENTA", "Cade a educação", "Dormiu comigo?", "EAE?", "Cade aquele eae maroto", "MANDA O BRABO"],
	not_found: ["Sei la do que se ta falando", "Achei isso ai nao", "Que isso ai?", "Nao entendi", "É pra advinha?", "Não leio mentes não amigão"]
};

fs.readdir("assets", (err, files) => {
	bot.audios = files;
});

const getRandomMessage = (messages) => {
	return messages[Math.floor(Math.random() * messages.length)];
};

const playAudio = (audio = getRandomMessage(bot.audios)) => {
	const path = __dirname + "/assets/" + audio;
	console.log(path);
	bot.resource = createAudioResource(path);
	bot.player.play(bot.resource);

	bot.subscription = bot.connection.subscribe(bot.player);
	if (bot.subscription) {
		setTimeout(() => bot.subscription.unsubscribe(), 15_000);
	}
};

const matchAudioWithUser = (id) => {
	let audio = getRandomMessage(bot.audios);
	const user = users.find((user) => user.id === id);

	if (user) {
		console.log(user.name, user.audio)
		audio = user.audio;
	}

	return audio;
};

const verifySessionId = (id, sessionId) => {
	const user = users.find((user) => user.id === id);
	if (user) {
		return user.sessionId === sessionId;
	}
	return false;
};

const setSessionId = (id, sessionId) => {
	const user = users.find((user) => user.id === id);
	if (user) {
		user.sessionId = sessionId;
	}
};

client.on("ready", () => {
	bot.player = createAudioPlayer();

	bot.player.on(AudioPlayerStatus.Playing, () => {
		console.log("Solta o som");
	});

	bot.player.on("error", (err) => {
		console.log("Vish", err);
	});

	console.log("ta rodando que é uma beleza");
});

client.on("messageCreate", async (message) => {
	const { content } = message;

	if (content === "EAE") {
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) return message.channel.send(getRandomMessage(errosMessages.channel));

		bot.connection = await joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator
		});

		if (!bot.connection) {
			return message.channel.send("Ih rapaz");
		}

		message.reply(getRandomMessage(successMessages.channel));

		playAudio(matchAudioWithUser(message.author.id));
	} else if (content.search("PLAY") > -1) {
		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) return message.channel.send(getRandomMessage(errosMessages.channel));

		if (!bot.connection) {
			return message.channel.send(getRandomMessage(errosMessages.require));
		}

		const audio = content.split(" ");
		if (audio.length > 1) {
			if (!bot.audios.includes(audio[1] + ".ogg")) return message.channel.send(getRandomMessage(errosMessages.not_found));
			return playAudio(audio[1] + ".ogg");
		}

		return message.channel.send(getRandomMessage(errosMessages.not_found));
	} else if (content === "AJUDA!!!") {
		message.channel.send("Ta tendo isso aqui: ");
		let list = "";
		bot.audios.forEach((audio) => {
			list += audio.replace(".ogg", "") + "\n";
		});

		message.channel.send(list);
	}
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	if (oldState.member.user.bot) return;

	if (newState.channelId) {
		console.log("sessionId", newState.sessionId);
		if (!newState.streaming && !newState.selfMute && !newState.selfDeaf && !newState.suppress) {
			setSessionId(newState.member.user.id, newState.sessionId);
			playAudio(matchAudioWithUser(newState.id));
		} else if (!newState.selfMute && !newState.selfDeaf) {
			playAudio();
		}
	}
});

client.login(token);
