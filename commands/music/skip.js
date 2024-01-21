const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("skip")
    .setDescription("Skip the current track"),
  async execute(interaction) {
    //check if member is in a vc
    if (!interaction.member.voice.channelId) {
      interaction.reply({
        content: "You must be in a voice channel to skip a song!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Skipped current track`,
        ephemeral: true,
      });
    }
  },
};
