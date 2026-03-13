# YouTube embed plugin — lazy-loading thumbnail with click-to-play.
# Usage:  {% youtube VIDEO_ID %}
#
# Uses hqdefault.jpg (always available at 480×360) as the initial
# thumbnail, then attempts a JS upgrade to maxresdefault.jpg.
# YouTube returns a tiny 120×90 gray placeholder instead of a 404
# when maxresdefault doesn't exist, so the upgrade checks naturalWidth.

module Jekyll
  class YouTube < Liquid::Tag
    def initialize(tag_name, text, tokens)
      super
      @text = text.strip
    end

    def render(context)
      video_id = @text.split(' ')[0]
      <<~HTML
        <div class="yt-embed" data-video-id="#{video_id}">
          <img src="https://i.ytimg.com/vi/#{video_id}/hqdefault.jpg"
               alt="Video thumbnail" loading="lazy">
          <button class="yt-play" aria-label="Play video">
            <svg viewBox="0 0 68 48" width="68" height="48">
              <path d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.64 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z" fill="#212121" fill-opacity=".8"/>
              <path d="M45 24L27 14v20" fill="#fff"/>
            </svg>
          </button>
        </div>
        <script>
          (function() {
            var vid = '#{video_id}';
            var el = document.querySelector('.yt-embed[data-video-id="' + vid + '"]');
            if (!el) return;
            var img = el.querySelector('img');

            // Try upgrading to maxresdefault (1280×720) if it exists.
            // YouTube returns a 120×90 gray placeholder for missing thumbs.
            var hires = new Image();
            hires.onload = function() {
              if (hires.naturalWidth > 200) img.src = hires.src;
            };
            hires.src = 'https://i.ytimg.com/vi/' + vid + '/maxresdefault.jpg';

            // Click to play
            el.addEventListener('click', function() {
              var iframe = document.createElement('iframe');
              iframe.src = 'https://www.youtube-nocookie.com/embed/' + vid + '?autoplay=1';
              iframe.title = 'YouTube video player';
              iframe.frameBorder = '0';
              iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
              iframe.allowFullscreen = true;
              el.innerHTML = '';
              el.classList.add('yt-embed-active');
              el.appendChild(iframe);
            });
          })();
        </script>
      HTML
    end
  end
end

Liquid::Template.register_tag('youtube', Jekyll::YouTube)
