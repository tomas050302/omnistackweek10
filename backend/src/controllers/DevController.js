const axios = require('axios');
const Dev = require('../models/Dev');
const parseStringAsArrayAndLowerCase = require('../utils/parseStringAsArrayAndLowerCase');
const { findConnections, sendMessage } = require('../websocket');


module.exports = {
  async index(request, response) {
    const devs = await Dev.find();

    return response.json(devs);
  },

  async store(request, response) {
    const { github_username, techs, longitude, latitude } = request.body;

    let dev = await Dev.findOne({ github_username });

    if (!dev) {
      const apiResponse = await axios.get(`https://api.github.com/users/${github_username}`);

      let { name = login, avatar_url, bio } = apiResponse.data;

      const techsArray = parseStringAsArrayAndLowerCase(techs);

      const location = {
        type: 'Point',
        coordinates: [longitude, latitude],
      };

      dev = await Dev.create({
        github_username,
        name,
        avatar_url,
        bio,
        techs: techsArray,
        location
      });

      const sendSocketMessageTo = findConnections({
        latitude,
        longitude
      },
        techsArray
      );

      sendMessage(sendSocketMessageTo, 'newDev', dev);
    }

    return response.json(dev);
  },

  async update(request, response) {
    const { github_username } = request.query;
    const { techs } = request.body;

    const techsArray = parseStringAsArrayAndLowerCase(techs);

    const updateInfo = await Dev.update(
      { github_username },
      { $set: { techs: techsArray } },
    );

    return response.json(updateInfo);
  },

  async destroy(request, response) {
    const { github_username } = request.body;

    await Dev.deleteOne({
      github_username,
    });

    const allDevs = await Dev.find();

    return response.json(allDevs);
  }
};
