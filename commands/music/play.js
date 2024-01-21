const { SlashCommandBuilder } = require("discord.js");
const fs = require("node:fs");

const songs = JSON.parse(fs.readFileSync("./songs.json"));
const choices = [];
Object.keys(songs).forEach((song) => {
  choices.push({
    name: song,
    value: song,
  });
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName("play")
    .setDescription("Add a song to the queue!")
    .addStringOption((option) =>
      option
        .setName("song")
        .setDescription("Select the song you would like")
        .setRequired(true)
        .addChoices(...choices)
    ),
  async execute(interaction) {
    //check if member is in a vc
    if (!interaction.member.voice.channelId) {
      interaction.reply({
        content: "You must be in a voice channel to play a song!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Added ${interaction.options.getString("song")} to queue!`,
        ephemeral: true,
      });
    }
  },
};
