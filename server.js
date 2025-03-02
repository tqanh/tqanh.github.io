require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const port = process.env.PORT || 3000;

const apiKey = process.env.YOUTUBE_API_KEY; // Đặt API key trong biến môi trường

app.use(express.static('public'));

app.get('/search', async (req, res) => {
    const query = req.query.q;
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query + ' music')}&key=${apiKey}`;
    try {
        const response = await fetch(url);
        const data = await response.json();
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch data from YouTube API' });
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
