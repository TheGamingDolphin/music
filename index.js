const dotenv = require("dotenv");
const {
  Client,
  Collection,
  Events,
  GatewayIntentBits,
  ActivityType,
} = require("discord.js");
const path = require("node:path");
const fs = require("node:fs");

const { DisTube, RepeatMode } = require("distube");

let repeatMode = RepeatMode.DISABLED; // Initialize repeat mode as disabled

// create client with necessary intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

dotenv.config();

client.on("ready", () => {
  console.log("Bot online!");
  client.user.setPresence({
    activities: [
      {
        name: "James Marriott",
        type: ActivityType.Listening,
      },
    ],
  });
});

client.DisTube = new DisTube(client, {
  leaveOnStop: false,
  emitNewSongOnly: true,
  emitAddSongWhenCreatingQueue: false,
  emitAddListWhenCreatingQueue: false,
});

client.on("voiceStateUpdate", (_, newState) => {
  const botMember = newState.guild.members.cache.get(client.user.id);

  if (botMember && botMember.voice.channel) {
    const membersInBotChannel = botMember.voice.channel.members.size;

    console.log(
      `There are ${membersInBotChannel} members in the bot's voice channel.`
    );

    // Check if there's only one member (the bot) in the channel and leave
    if (membersInBotChannel === 1) {
      botMember.voice.disconnect();
      console.log("Bot left the voice channel.");
    }
  }
});

const songs = JSON.parse(fs.readFileSync("./songs.json"));
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;
  if (interaction.commandName === "play") {
    const url = songs[interaction.options.getString("song")];
    try {
      client.DisTube.play(interaction.member.voice.channel, url, {
        member: interaction.member,
        textChannel: interaction.channel,
        interaction,
      });
    } catch (error) {
      console.log(error);
    }
  } else if (interaction.commandName === "playall") {
    const shuffleOption = interaction.options.getBoolean("shuffle") || false;
    // Queue all songs from the JSON file
    const voiceChannel = interaction.member.voice.channel;
    try {
      const songList = shuffleOption
        ? shuffle(Object.keys(songs))
        : Object.keys(songs);

      for (const songName of songList) {
        const url = songs[songName];
        await client.DisTube.play(voiceChannel, url, {
          member: interaction.member,
          textChannel: interaction.channel,
          interaction,
        });
      }
    } catch (error) {
      console.log(error);
    }
  } else if (interaction.commandName === "skip") {
    const voiceChannel = interaction.member.voice.channel;
    const queue = client.DisTube.getQueue(interaction.guildId);

    if (!queue || !queue.songs.length) {
      return interaction.reply("There are no songs in the queue to skip.");
    }

    try {
      client.DisTube.skip(voiceChannel);
      interaction.channel.send(
        `${interaction.user.displayName} skipped the current track`
      );
    } catch (error) {
      console.log(error);
    }
  } else if (interaction.commandName === "stop") {
    const botMember = interaction.guild.members.cache.get(client.user.id);
    try {
      client.DisTube.stop(interaction.guildId); // Stop playback and clear the queue for the current guild
      botMember.voice.disconnect(); // Leave the voice channel after stopping the playback and clearing the queue
      interaction.channel.send(
        `${interaction.user.displayName} stopped the music.`
      );
    } catch (error) {
      console.log(error);
    }
  } else if (interaction.commandName === "loop") {
    const queue = client.DisTube.getQueue(interaction.guildId);
    if (!queue || !queue.songs.length) {
      return interaction.reply("There are no songs in the queue to loop.");
    }

    try {
      // Toggle repeat mode
      repeatMode =
        repeatMode === RepeatMode.DISABLED
          ? RepeatMode.SONG
          : RepeatMode.DISABLED;
      queue.setRepeatMode(repeatMode); // Set the repeat mode for the queue

      interaction.channel.send(
        `Loop mode was ${
          repeatMode === RepeatMode.SONG ? "enabled" : "disabled"
        } by ${interaction.user.displayName}`
      );
    } catch (error) {
      console.log(error);
    }
  }
});
client.DisTube.on("playSong", (queue, song) => {
  const songName = Object.keys(songs).find((key) => songs[key] === song.url);
  const queuedBy = queue.songs[0].user.displayName;
  queue.textChannel.send(`Now playing: ${songName}\nQueued by: ${queuedBy}`);
});

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

//crash prevention
process.on("unhandledRejection", async (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason", reason);
});
process.on("uncaughtException", (err) => {
  console.log("Uncaught Exception:", err);
});
process.on("uncaughtExceptionMonitor", (err, origin) => {
  console.log("Uncaught Exception Monitor", err, origin);
});

//set commands
client.commands = new Collection();
const foldersPath = path.join(__dirname, "commands");
const commandFolders = fs.readdirSync(foldersPath);

//checks the commands folder for js files
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    // Set a new item in the Collection with the key as the command name and the value as the exported module
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
}

//tries to run the command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.TOKEN);
