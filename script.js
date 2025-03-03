import { database, ref, set, onValue } from './firebase-config.js';

const version = 't1'; // Đặt phiên bản tại đây
const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('version').textContent = `Version ${version}`;

    document.getElementById('search-button').addEventListener('click', handleSearch);
    document.getElementById('search-input').addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
            handleSearch();
        }
    });

    // Lắng nghe sự thay đổi từ Firebase
    const searchRef = ref(database, 'search');
    onValue(searchRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            searchYouTubeMusic(data.query, false);
        }
    });

    const playRef = ref(database, 'play');
    onValue(playRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            playVideo(data.videoId);
        }
    });
});

function handleSearch() {
    const query = document.getElementById('search-input').value;
    console.log('Search query:', query); // Kiểm tra giá trị của query
    searchYouTubeMusic(query, true);
}

function searchYouTubeMusic(query, broadcast = true) {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query + ' music')}&key=${apiKey}`;
    console.log('API URL:', url); // Kiểm tra giá trị của url

    fetch(url)
        .then(response => {
            console.log('Response status:', response.status); // Log response status
            return response.json();
        })
        .then(data => {
            console.log('API Response:', data); // Kiểm tra phản hồi từ API
            const results = document.getElementById('results');
            results.innerHTML = '';
            if (data.items && data.items.length > 0) {
                data.items.forEach(item => {
                    const videoId = item.id.videoId;
                    const title = item.snippet.title;
                    const videoElement = document.createElement('div');
                    videoElement.innerHTML = `<h3 class="video-title" data-video-id="${videoId}">${title}</h3>`;
                    results.appendChild(videoElement);
                });

                // Thêm sự kiện click vào tiêu đề để phát nhạc
                document.querySelectorAll('.video-title').forEach(element => {
                    element.addEventListener('click', function() {
                        const videoId = this.getAttribute('data-video-id');
                        playVideo(videoId);
                        if (broadcast) {
                            set(ref(database, 'play'), { videoId });
                        }
                    });
                });

                if (broadcast) {
                    set(ref(database, 'search'), { query });
                }
            } else {
                results.innerHTML = '<p>No results found.</p>';
            }
        })
        .catch(error => console.error('Error:', error));
}

function playVideo(videoId) {
    const results = document.getElementById('results');
    const player = document.createElement('iframe');
    player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
    results.innerHTML = '';
    results.appendChild(player);
}
