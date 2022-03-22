const { Client, Intents } = require("discord.js");
const { generateDependencyReport, joinVoiceChannel, createAudioPlayer, createAudioResource, NoSubscriberBehavior, AudioPlayerStatus } = require("@discordjs/voice");
const { createMusicManager } = require("@kyometori/djsmusic");

const bot = {};

const token = process.env.DISCORD_TOKEN

const client = new Client({
	intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS, Intents.FLAGS.GUILD_VOICE_STATES]
});

const successMessages = {
	channel: ["To entrando", "Colando", "Ja chego", "Cheguei piranhas", "To on", "Quem cola", "Salve", "Opa bão"]
};
const errosMessages = {
	channel: ["Burrão tu ein, entra num canal de voz ai.", "ENTRA NUM CANAL DE VOZ!!!!!!!", "SE NUM TA NUM CANAL DE VOZ!", "Entra na call ae", "Entra que eu entro"]
};

const audios = ["eae_by_leleco.ogg", "bao_by_rafa.ogg", "eae.ogg"];

const getRandomMessage = (messages) => {
	return messages[Math.floor(Math.random() * messages.length)];
};

client.on("ready", () => {
	createMusicManager(client);
	console.log("ta rodando que é uma beleza");
});

client.on("messageCreate", async (message) => {
	const { content } = message;

	if (content === "EAE") {
		bot.player = createAudioPlayer();

		bot.player.on(AudioPlayerStatus.Playing, () => {
			console.log("Eae gordinho beleza");
		});

		bot.player.on("error", (err) => {
			console.log("Error playing audio", err);
		});

		bot.resource = createAudioResource(__dirname + "\\assets\\" +  getRandomMessage(audios));
		bot.player.play(bot.resource);

		const voiceChannel = message.member.voice.channel;
		if (!voiceChannel) return message.channel.send(getRandomMessage(errosMessages.channel));

		bot.connection = await joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guild.id,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator
		});

		if (!bot.connection) {
			message.reply("Deu ruim.");
		}
		message.reply(getRandomMessage(successMessages.channel));

		bot.subscription = bot.connection.subscribe(bot.player);
		if (bot.subscription) {
			setTimeout(() => bot.subscription.unsubscribe(), 15_000);
		}
	}
});

client.on("voiceStateUpdate", async (oldState, newState) => {
	if (oldState.member.user.bot) return;

	if (newState.channelId) {
		bot.resource = createAudioResource(__dirname + "\\assets\\" +  getRandomMessage(audios));
		bot.player.play(bot.resource);

		bot.subscription = bot.connection.subscribe(bot.player);
		if (bot.subscription) {
			setTimeout(() => bot.subscription.unsubscribe(), 15_000);
		}
	}
});

client.login(token);
