const version = '1.0.0  - nghe nhạc ytb okay'; // Đặt phiên bản tại đây

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
    // Thay thế YOUR_API_KEY bằng khóa API của bạn
    const apiKey = 'AIzaSyBpLiDptaBp9bFmnS1Jx6oWG8wu1LjzKKI';
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&q=${encodeURIComponent(query + ' music')}&key=${apiKey}`;
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
                        const player = document.createElement('iframe');
                        player.src = `https://www.youtube.com/embed/${videoId}?autoplay=1`;
                        results.innerHTML = '';
                        results.appendChild(player);
                    });
                });
            } else {
                results.innerHTML = '<p>No results found.</p>';
            }
        })
        .catch(error => console.error('Error:', error));
}
