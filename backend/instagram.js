const { IgApiClient } = require('instagram-private-api');

let client = null;

async function login(username, password) {
    client = new IgApiClient();
    client.state.generateDevice(username);
    try {
        await client.account.login(username, password);
    } catch (error) {
        throw new Error('Invalid credentials or login issue');
    }
}

async function getUserId(username) {
    const user = await client.user.searchExact(username);
    return user.pk;
}

async function getFollowers(userId) {
    const followersFeed = client.feed.accountFollowers(userId);
    return await followersFeed.items();
}

async function getFollowing(userId) {
    const followingFeed = client.feed.accountFollowing(userId);
    return await followingFeed.items();
}

async function sendDM(userId, message) {
    await client.direct.createThread({
        recipients: [userId.toString()],
        text: message,
    });
}

module.exports = { login, getUserId, getFollowers, getFollowing, sendDM };
