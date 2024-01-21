const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("playall")
    .setDescription("Add all songs to the queue!")
    .addBooleanOption((option) =>
      option
        .setName("shuffle")
        .setDescription("Whether the songs should be shuffled or not")
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
        content: `Added all songs to queue!`,
        ephemeral: true,
      });
    }
  },
};
