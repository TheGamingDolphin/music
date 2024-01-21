const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stop")
    .setDescription("Stop all tracks and clear the queue"),
  async execute(interaction) {
    //check if member is in a vc
    if (!interaction.member.voice.channelId) {
      interaction.reply({
        content: "You must be in a voice channel to stop a song!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: `Stopped music`,
        ephemeral: true,
      });
    }
  },
};
