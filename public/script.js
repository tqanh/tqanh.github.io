const version = '1.0.0'; // Đặt phiên bản tại đây

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('version').textContent = `Version ${version}`;
});

document.getElementById('search-button').addEventListener('click', function() {
    const query = document.getElementById('search-input').value;
    console.log('Search query:', query); // Kiểm tra giá trị của query
    searchYouTubeMusic(query);
});

document.getElementById('search-input').addEventListener('keypress', function(event) {
    if (event.key === 'Enter') {
        const query = document.getElementById('search-input').value;
        console.log('Search query:', query); // Kiểm tra giá trị của query
        searchYouTubeMusic(query);
    }
});

function searchYouTubeMusic(query) {
    const url = `/search?q=${encodeURIComponent(query)}`;
    console.log('API URL:', url); // Kiểm tra giá trị của url

    fetch(url)
        .then(response => response.json())
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
                        const playerDiv = document.createElement('div');
                        playerDiv.id = 'player';
                        results.innerHTML = '';
                        results.appendChild(playerDiv);

                        // Sử dụng YouTube Player API để phát nhạc
                        const player = new YT.Player('player', {
                            height: '0',
                            width: '0',
                            videoId: videoId,
                            playerVars: {
                                'autoplay': 1,
                                'controls': 0,
                                'mute': 0
                            },
                            events: {
                                'onReady': function(event) {
                                    event.target.playVideo();
                                },
                                'onError': function(event) {
                                    console.error('YouTube Player Error:', event.data);
                                }
                            }
                        });
                    });
                });
            } else {
                results.innerHTML = '<p>No results found.</p>';
            }
        })
        .catch(error => console.error('Error:', error));
}

// Load YouTube IFrame Player API
const tag = document.createElement('script');
tag.src = "https://www.youtube.com/iframe_api";
const firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
