require 'fileutils'
require 'set'

begin
  require 'mini_magick'
rescue LoadError
  Jekyll.logger.warn "Thumbnails:", "mini_magick gem not available; portraits will load original full-size images."
end

module Jekyll
  # Generates resized WebP variants of every member portrait at build time
  # and registers them as static files so Jekyll copies them into _site.
  #
  # Outputs land at /images/thumbs/<basename>-<width>.webp. The portrait
  # include serves these via <picture><source type="image/webp"> and falls
  # back to the original image for browsers that can't decode WebP (and as
  # a safety net if generation was skipped, e.g. ImageMagick not installed).
  class PortraitThumbnailGenerator < Generator
    safe true
    priority :low

    WIDTHS = [400, 800].freeze
    QUALITY = 78
    OUTPUT_PREFIX = File.join('images', 'thumbs').freeze
    CACHE_SUBDIR = File.join('.jekyll-cache', 'thumbs').freeze
    # site.config key listing every source image that has thumbs generated.
    # The Liquid filter consults this set so we don't emit <source> tags
    # pointing at files that were never produced.
    SITE_CONFIG_KEY = '_portrait_thumbs'.freeze

    def generate(site)
      site.config[SITE_CONFIG_KEY] = Set.new

      sources = sources_for(site)

      unless defined?(MiniMagick)
        report(site, sources, "the mini_magick gem is not available")
        return
      end

      cache_dir = File.join(site.source, CACHE_SUBDIR)
      FileUtils.mkdir_p(cache_dir)

      sources.each do |relative_source|
        absolute_source = File.join(site.source, relative_source)
        next unless File.file?(absolute_source)

        all_widths_ready = true
        WIDTHS.each do |width|
          variant_name = variant_filename(relative_source, width)
          cached_path = File.join(cache_dir, variant_name)

          if stale?(cached_path, absolute_source)
            generate_variant(absolute_source, cached_path, width)
          end

          if File.exist?(cached_path)
            site.static_files << ThumbnailFile.new(
              site, site.source, CACHE_SUBDIR, variant_name,
              File.join(OUTPUT_PREFIX, variant_name)
            )
          else
            all_widths_ready = false
          end
        end

        site.config[SITE_CONFIG_KEY].add(relative_source) if all_widths_ready
      end

      report(site, sources)
    end

    private

    # This generator used to fail silently: a missing ImageMagick binary makes
    # every variant raise, the rescue logs one line per image, and the build
    # carries on serving full-size originals. Summarize the outcome so that
    # state is legible at a glance instead of buried in per-image warnings.
    def report(site, sources, reason = "no variants could be generated")
      ready = site.config[SITE_CONFIG_KEY].size
      if sources.empty?
        Jekyll.logger.info "Thumbnails:", "No portraits to resize."
      elsif ready.zero?
        Jekyll.logger.error "Thumbnails:",
          "Generated 0 thumbnails for #{sources.size} portraits because " \
          "#{reason}. Every portrait will load at full size. ImageMagick " \
          "must be installed for this generator to work."
      else
        Jekyll.logger.info "Thumbnails:",
          "#{ready}/#{sources.size} portraits have generated thumbnails."
      end
    end

    # Every image referenced from a member document is a candidate. This keeps
    # the generator zero-config: contributors drop a new portrait into
    # images/people/ and reference it from their frontmatter as usual.
    def sources_for(site)
      members = site.collections['members']&.docs || []
      members.map { |m| m.data['image'] }.compact.uniq
    end

    def variant_filename(relative_source, width)
      "#{File.basename(relative_source, '.*')}-#{width}.webp"
    end

    def stale?(cached_path, source_path)
      !File.exist?(cached_path) || File.mtime(cached_path) < File.mtime(source_path)
    end

    def generate_variant(source, dest, width)
      Jekyll.logger.info "Thumbnails:", "Generating #{File.basename(dest)}"
      image = MiniMagick::Image.open(source)
      image.combine_options do |c|
        c.auto_orient
        c.strip
        c.resize "#{width}x>"
        c.quality QUALITY.to_s
      end
      image.format 'webp'
      image.write dest
    rescue => e
      Jekyll.logger.warn "Thumbnails:", "Failed for #{source}: #{e.message}"
    end
  end

  # StaticFile subclass that overrides the destination path so files in
  # .jekyll-cache/thumbs land at /images/thumbs/ in the built site.
  class ThumbnailFile < StaticFile
    def initialize(site, base, dir, name, output_path)
      super(site, base, dir, name)
      @output_path = output_path
    end

    def destination(dest)
      File.join(dest, @output_path)
    end
  end

  module ThumbnailFilters
    # Convert a source image path into the generated thumbnail path. Returns
    # an empty string if no thumbnail was generated for this image, so the
    # portrait include can skip the <source> tag and fall back to the
    # original <img>.
    def thumb_url(image_path, width)
      return '' unless image_path.is_a?(String) && !image_path.empty?
      site = @context.registers[:site]
      thumbs = site.config[PortraitThumbnailGenerator::SITE_CONFIG_KEY]
      return '' unless thumbs && thumbs.include?(image_path)
      basename = File.basename(image_path, '.*')
      "/#{PortraitThumbnailGenerator::OUTPUT_PREFIX}/#{basename}-#{width}.webp"
    end
  end
end

Liquid::Template.register_filter(Jekyll::ThumbnailFilters)
