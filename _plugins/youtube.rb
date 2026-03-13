# YouTube embed plugin — lazy-loading thumbnail with click-to-play.
# Usage:  {% youtube VIDEO_ID %}

module Jekyll
  class YouTube < Liquid::Tag
    def initialize(tag_name, text, tokens)
      super
      @text = text.strip
    end

    def render(context)
      parts = @text.split(' ')
      video_id = parts[0]
      <<~HTML
        <div class="yt-embed" data-video-id="#{video_id}">
          <img
            src="https://i.ytimg.com/vi/#{video_id}/maxresdefault.jpg"
            alt="Video thumbnail"
            loading="lazy"
            onerror="this.src='https://i.ytimg.com/vi/#{video_id}/hqdefault.jpg'; this.onerror=null;"
          >
          <button class="yt-play" aria-label="Play video">
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#212121" fill-opacity=".8"/>
              <path d="M45 24L27 14v20" fill="#fff"/>
            </svg>
          </button>
        </div>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            var el = document.querySelector('.yt-embed[data-video-id="#{video_id}"]');
            if (!el) return;
            el.addEventListener('click', function() {
              var iframe = document.createElement('iframe');
              iframe.src = 'https://www.youtube-nocookie.com/embed/#{video_id}?autoplay=1';
              iframe.title = 'YouTube video player';
              iframe.frameBorder = '0';
              iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
              iframe.allowFullscreen = true;
              el.innerHTML = '';
              el.classList.add('yt-embed-active');
              el.appendChild(iframe);
            });
          });
        </script>
      HTML
    end
  end
end

Liquid::Template.register_tag('youtube', Jekyll::YouTube)
