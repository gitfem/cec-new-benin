const { createApp } = Vue;

const OLD = {
  hls: '',
  youtube: 'https://www.youtube.com/embed/live_stream?channel=UCLFScmpsKP4jlJXD8McBGgQ&autoplay=1&controls=1&modestbranding=1&rel=0',
  youtubePage: 'https://www.youtube.com/channel/UCLFScmpsKP4jlJXD8McBGgQ',
  status: 'oldwebsite/cache.php',
  attendancePost: 'bridge_live_login.php',
  liveNotices: 'bridge_live_notices.php',
  presence: 'bridge_live_presence.php',
  chatFeed: 'bridge_a73c9_messages.php',
  chatPost: 'oldwebsite/shoutbox.php',
  storyComment: 'bridge_story_comment.php',
  content: 'assets/data/content.json',
  oldMember: 'oldwebsite/member.php'
};

const DATA = {
  slides: [],
  ways: [],
  sermons: [],
  ministries: [],
  products: [],
  events: [],
  announcements: []
};

const HomePage = {
  inject:['cms'],
  data(){return {slide:0, heroTimer:null, DATA}},
  computed:{
    sections(){ return (this.cms && this.cms.home && this.cms.home.sections && this.cms.home.sections.length) ? this.cms.home.sections : []; },
    sectionMap(){ return this.sections.reduce((map, section)=>{ map[section.section_key]=section; return map; }, {}); },
    hero(){ return this.sectionMap.hero || {}; },
    heroPrimaryUrl(){ return this.activeSlide.link_url || this.hero.link_url || '#/visit'; },
    heroSecondary(){ return (this.cms && this.cms.home && this.cms.home.hero_secondary) ? this.cms.home.hero_secondary : {}; },
    showHeroSecondary(){
      const text = String(this.heroSecondary.text || '').trim();
      const url = String(this.heroSecondary.url || '').trim();
      return !!this.heroSecondary.show && text !== '' && url !== '' && url !== this.heroPrimaryUrl;
    },
    ways(){ return this.sectionMap.ways || {}; },
    story(){ return this.sectionMap.story || {}; },
    feature(){ return this.sectionMap.feature || {}; },
    watch(){ return this.sectionMap.watch || {}; },
    aboutSection(){
      const about = this.cms && this.cms.home && this.cms.home.about_section ? this.cms.home.about_section : {};
      return {
        eyebrow: about.eyebrow || this.feature.eyebrow || '',
        title: about.title || this.feature.title || '',
        subtitle: about.subtitle || this.feature.subtitle || '',
        image_url: about.hero_image || this.feature.image_url || '',
        link_url: '#/about',
        link_text: this.feature.link_text || 'Learn More'
      };
    },
    slides(){
      const adminSlides = this.cms && this.cms.home && Array.isArray(this.cms.home.slides) ? this.cms.home.slides : [];
      const normalized = adminSlides
        .filter(s => s && s.image)
        .map(s => ({
          title: s.title || '',
          subtitle: s.subtitle || '',
          link_url: s.link_url || this.hero.link_url || '#/visit',
          image: s.image,
          media_type: s.media_type || 'image'
        }));
      return normalized;
    },
    featureBanners(){
      const banners = this.cms && this.cms.home && Array.isArray(this.cms.home.feature_banners) ? this.cms.home.feature_banners : [];
      const defaultIcons = ['fa-solid fa-location-dot', 'fa-solid fa-calendar-days', 'fa-solid fa-hand-holding-heart', 'fa-solid fa-tower-broadcast'];
      const defaultAccents = ['gold', 'blue', 'green', 'rose'];
      return banners.map((b, idx) => ({
        id: b.id || String(idx + 1),
        title: b.title || '',
        text: b.text || '',
        href: b.href || '#/',
        icon: b.icon || defaultIcons[idx % defaultIcons.length],
        accent: b.accent || defaultAccents[idx % defaultAccents.length],
        link_text: b.link_text || 'Explore'
      }));
    },
    upcomingEvent(){
      const event = this.cms && this.cms.home && this.cms.home.upcoming_event ? this.cms.home.upcoming_event : {};
      return {
        eyebrow: event.eyebrow || this.watch.eyebrow || '',
        title: event.title || this.watch.title || '',
        subtitle: event.subtitle || this.watch.subtitle || '',
        event_date: event.event_date || '',
        image_url: event.image_url || this.watch.image_url || '',
        link_text: event.link_text || this.watch.link_text || 'View Details',
        link_url: event.link_url || this.watch.link_url || '#/events'
      };
    },
    featuredStory(){
      const item = this.cms && this.cms.home && this.cms.home.featured_story ? this.cms.home.featured_story : {};
      const mediaUrl = item.media_url ? this.cacheAsset(item.media_url, item.updated_ts) : '';
      const thumbUrl = item.thumb_url ? this.cacheAsset(item.thumb_url, item.updated_ts) : '';
      return {
        id: item.id || '',
        eyebrow: item.eyebrow || this.story.eyebrow || '',
        title: item.title || this.story.title || '',
        subtitle: this.textExcerpt(item.subtitle || item.body || this.story.subtitle || '', 155),
        body: item.body || '',
        media_url: mediaUrl || this.story.image_url || '',
        media_type: item.media_type || 'image',
        thumb_url: thumbUrl,
        link_text: item.link_text || this.story.link_text || 'Watch More Stories',
        link_url: item.id ? '#/stories/'+item.id : (item.link_url || this.story.link_url || '#/stories')
      };
    },
    storyItems(){
      const items = this.cms && this.cms.home && Array.isArray(this.cms.home.stories) ? this.cms.home.stories : [];
      const normalized = items
        .filter(item => item && (item.thumb_url || item.media_url))
        .map(item => ({
          id: item.id || '',
          title: item.title || '',
          thumb_url: this.cacheAsset(item.thumb_url || (item.media_type === 'image' ? item.media_url : ''), item.updated_ts),
          link_url: item.id ? '#/stories/'+item.id : (item.link_url || '#/stories')
        }));
      return normalized;
    },
    latestEvents(){
      const events = this.cms && this.cms.home && Array.isArray(this.cms.home.events) ? this.cms.home.events : [];
      const normalized = events
        .filter(event => event && event.id && event.image_url)
        .map(event => ({
          id: event.id,
          title: event.title || 'Event',
          image_url: this.cacheAsset(event.image_url, event.updated_ts),
          event_date: event.event_date || '',
          link_url: '#/events/' + event.id
        }));
      return normalized;
    },
    latestSermons(){
      const sermons = this.cms && this.cms.home && Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons : [];
      const normalized = this.normalizeSermons(sermons);
      return normalized;
    },
    activeSlide(){ return this.slides[this.slide] || this.slides[0] || {}; }
  },
  mounted(){ this.startHero(); },
  unmounted(){ clearInterval(this.heroTimer); },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    normalizeSermons(items){
      return items
        .filter(item => item && item.id)
        .map(item => {
          const media = item.media_url ? this.cacheAsset(item.media_url, item.updated_ts) : '';
          const poster = item.poster_url ? this.cacheAsset(item.poster_url, item.updated_ts) : '';
          return {
            id: item.id,
            eyebrow: item.eyebrow || 'Sermon',
            title: item.title || '',
            subtitle: item.subtitle || '',
            speaker: item.speaker || '',
            media_type: item.media_type || 'video',
            media_url: media,
            embed_url: item.embed_url || '',
            poster_url: poster || (item.media_type === 'image' ? media : ''),
            href: '#/watch/' + item.id
          };
        });
    },
    textExcerpt(value, limit){
      const text = String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      if(!text || text.length <= limit){ return text; }
      return text.slice(0, limit).replace(/\s+\S*$/, '') + '...';
    },
    startHero(){
      clearInterval(this.heroTimer);
      if(this.slides.length < 2){ return; }
      this.heroTimer = setInterval(()=>{ this.slide = (this.slide + 1) % this.slides.length; }, 6500);
    },
    setSlide(index){ this.slide = index; this.startHero(); }
  },
  watch:{
    slides(){ if(this.slide >= this.slides.length){ this.slide = 0; } this.startHero(); }
  },
  template:`
  <div>
    <section class="hero-home">
      <div v-for="(s,i) in slides" :key="s.image + i" class="hero-slide" :class="{active:slide===i}" :style="s.media_type === 'video' ? {} : {backgroundImage:'url('+s.image+')'}">
        <video v-if="s.media_type === 'video'" class="hero-video" :src="s.image" autoplay muted loop playsinline preload="metadata"></video>
      </div>
      <div class="hero-content reveal">
        <div class="eyebrow" v-if="hero.eyebrow">{{hero.eyebrow}}</div>
        <h1 v-if="activeSlide.title">{{ activeSlide.title }}</h1>
        <p class="text-lg home-hero-sub" v-if="activeSlide.subtitle">{{activeSlide.subtitle}}</p>
        <div class="hero-actions"><a :href="heroPrimaryUrl" class="btn-brand">{{hero.link_text || 'Plan a Visit'}}</a><a v-if="showHeroSecondary" :href="heroSecondary.url" class="btn-outline-brand">{{heroSecondary.text}}</a></div>
        <div class="hero-dots" v-if="slides.length > 1">
          <button v-for="(s,i) in slides" type="button" :class="{active:slide===i}" @click="setSlide(i)" :aria-label="'Show slide '+(i+1)"></button>
        </div>
      </div>
      <div class="ways-wrap">
        <div class="ways-title" v-if="ways.title">{{ways.title}}</div>
        <div class="ways-grid feature-icon-grid">
          <a v-for="w in featureBanners" :key="w.id || w.title" :href="w.href" class="way-card-portal" :class="'accent-' + w.accent">
            <div class="way-card-header">
              <div class="way-icon-bubble"><i :class="w.icon"></i></div>
            </div>
            <div class="way-card-body">
              <h3 class="way-card-title">{{w.title}}</h3>
              <p class="way-card-text" v-if="w.text">{{w.text}}</p>
            </div>
            <div class="way-card-footer">
              <span class="way-card-link">{{w.link_text || 'Explore'}}</span>
              <i class="fa-solid fa-arrow-right-long way-card-arrow"></i>
            </div>
          </a>
        </div>
      </div>
    </section>

    <a v-if="upcomingEvent.title || upcomingEvent.image_url" :href="upcomingEvent.link_url" class="current-series upcoming-event-band">
      <img v-if="upcomingEvent.image_url" :src="upcomingEvent.image_url" alt="upcoming event" @error="$event.target.style.display='none'" loading="lazy">
      <div class="series-copy"><div class="eyebrow">{{upcomingEvent.eyebrow}}</div><h2>{{upcomingEvent.title}}</h2><p v-if="upcomingEvent.subtitle">{{upcomingEvent.subtitle}}</p><div class="series-meta"><span v-if="upcomingEvent.event_date" class="event-chip">{{upcomingEvent.event_date}}</span><span v-if="upcomingEvent.link_text" class="series-link">{{upcomingEvent.link_text}} -></span></div></div>
    </a>

    <section class="story-section">
      <div class="container-wide">
        <h2 class="story-title">Our Stories</h2>
        <div class="story-grid">
          <div class="story-copy">
            <h6>{{featuredStory.eyebrow}}</h6>
            <blockquote>{{featuredStory.title}}</blockquote>
            <p class="text-lg" v-if="featuredStory.subtitle">{{featuredStory.subtitle}}</p>
            <a :href="featuredStory.link_url" class="btn-outline-brand">{{featuredStory.link_text}}</a>
          </div>
          <div class="video-poster">
            <img v-if="featuredStory.thumb_url" :src="featuredStory.thumb_url" alt="">
            <div v-else-if="featuredStory.media_type === 'embed'" class="story-embed-preview"><i class="fa-solid fa-play"></i></div>
            <video v-else-if="featuredStory.media_type === 'video'" class="story-media-video" :src="featuredStory.media_url" muted playsinline preload="metadata"></video>
            <img v-else :src="featuredStory.media_url" alt="">
            <a :href="featuredStory.link_url" class="play-chip"><span class="play-circle"><i class="fa-solid fa-play"></i></span> Watch Story</a>
          </div>
        </div>
        <div class="story-thumbs">
          <a v-for="item in storyItems.slice(0,3)" :href="item.link_url"><img :src="item.thumb_url" :alt="item.title"></a>
        </div>
      </div>
    </section>

    <section class="section"><div class="container-wide"><div class="mosaic">
      <div class="info-card"><div class="eyebrow">{{aboutSection.eyebrow}}</div><h3>{{aboutSection.title}}</h3><p class="text-lg">{{aboutSection.subtitle}}</p><a :href="aboutSection.link_url" class="btn-brand mt-3">{{aboutSection.link_text}}</a></div>
      <div class="mosaic-main" v-if="aboutSection.image_url"><img :src="aboutSection.image_url" alt="about"></div>
      <div class="mosaic-small"><a v-for="event in latestEvents.slice(0,2)" :href="event.link_url" class="tile"><img :src="event.image_url" :alt="event.title"><span class="tile-caption">{{event.title}}</span></a></div>
    </div></div></section>

    <section class="section dark-band"><div class="container-wide">
      <div class="split-heading"><div><div class="eyebrow">Watch</div><h2 class="title-mid">Latest videos and sermons.</h2></div><div class="text-lg-end"><a href="#/watch" class="btn-outline-brand">View All</a></div></div>
      <div v-if="latestSermons.length" class="media-grid"><a class="media-card text-dark sermon-card" v-for="s in latestSermons.slice(0,3)" :href="s.href">
        <div class="sermon-card-media">
          <img v-if="s.poster_url || s.media_type === 'image'" :src="s.poster_url || s.media_url" :alt="s.title">
          <video v-else-if="s.media_type === 'video'" :src="s.media_url" muted playsinline preload="metadata"></video>
          <div v-else-if="s.media_type === 'audio'" class="sermon-audio-preview"><i class="fa-solid fa-volume-high"></i></div>
          <div v-else-if="s.media_type === 'embed'" class="sermon-audio-preview"><i class="fa-solid fa-play"></i></div>
        </div>
        <div class="media-card-body"><span class="tag">{{s.eyebrow}}</span><h4>{{s.title}}</h4><p v-if="s.subtitle" class="muted">{{s.subtitle}}</p><small v-if="s.speaker">{{s.speaker}}</small></div>
      </a></div>
    </div></section>
  </div>`
};

const LivePage = {
  inject:['cms'],
  data(){
    return {
      name:'', email:'', phone:'', remember:true, error:'',
      category:'Church Member',
      categoryOptions:['Church Member','First-Time Visitor','Cell Leader','Teen/Youth','Visiting Minister'],
      viewingMode:'individual', groupName:'Christ Embassy Lagos Street', groupCount:1,
      groupOptions:['Christ Embassy Lagos Street','Christ Embassy Upper Mission 2','Christ Embassy Universal','Christ Embassy Lawani Model','Christ Embassy GRA','Christ Embassy Okhoro'],
      DATA, OLD, announcementOpen:true, activeStream:'player',
      isPlaying:false, muted:false, volume:0.85, progress:0,
      liveStatus:'checking', chat:[], chatText:'', chatError:'',
      liveNotice:null, liveViewers:0, presenceToken:localStorage.getItem('kh_live_presence_token') || '', dismissedNoticeId:localStorage.getItem('kh_live_notice_dismissed') || '', soundBlocked:false, videoJsPlayer:null,
      qualityMenuOpen:false, selectedLevel:-1, availableLevels:[], activePlayingResolution:'Auto',
      isFullscreen:false, overlayControlsVisible:false
    }
  },
  computed:{
    member(){return this.$root.member},
    formattedLevels(){
      const v = this.$refs.liveVideo;
      const currentH = (v && v.videoHeight) ? v.videoHeight : 720;
      if (Array.isArray(this.availableLevels) && this.availableLevels.length > 0) {
        return this.availableLevels.map((lvl, idx) => {
          const h = lvl.height || currentH;
          let title = `${h}p HD`;
          let badge = '';
          let subtitle = 'Studio broadcast quality';

          if (h >= 1080) {
            title = '1080p Full HD';
            badge = 'Full HD';
            subtitle = 'Crisp studio master stream • Best for high-speed Wi-Fi or Fibre';
          } else if (h >= 720) {
            title = '720p HD';
            badge = this.availableLevels.length === 1 ? 'Studio Source' : 'HD';
            subtitle = this.availableLevels.length === 1 ? 'Direct high-definition feed from church sanctuary' : 'High definition video with clear sanctuary audio';
          } else if (h >= 480) {
            title = '480p Standard';
            badge = 'SD';
            subtitle = 'Standard quality • Smooth playback with moderate data usage';
          } else {
            title = `${h}p Data Saver`;
            badge = 'Low Data';
            subtitle = 'Conserves mobile data • Best for slow or fluctuating connections';
          }

          return {
            id: 'lvl-' + idx,
            levelIndex: idx,
            height: h,
            title,
            badge,
            subtitle,
            bitrate: lvl.bitrate || ''
          };
        });
      }
      return [{
        id: 'lvl-0',
        levelIndex: 0,
        height: currentH,
        title: `${currentH}p HD (Source)`,
        badge: 'Studio Source',
        subtitle: 'Direct high-definition feed from church sanctuary',
        bitrate: ''
      }];
    },
    currentQualityLabel(){
      if (this.selectedLevel === -1) {
        return this.activePlayingResolution && this.activePlayingResolution !== 'Auto' ? `Auto (${this.activePlayingResolution})` : 'Auto';
      }
      const lvl = this.formattedLevels.find(l => l.levelIndex === this.selectedLevel);
      return lvl ? lvl.title.split(' ')[0] : 'Auto';
    },
    groupOptions(){
      if (this.cms && this.cms.live && Array.isArray(this.cms.live.service_groups) && this.cms.live.service_groups.length) {
        return this.cms.live.service_groups;
      }
      return [
        'Christ Embassy Lagos Street',
        'Christ Embassy Upper Mission 2',
        'Christ Embassy Universal',
        'Christ Embassy Lawani Model',
        'Christ Embassy GRA',
        'Christ Embassy Okhoro'
      ];
    },
    siteName(){ return (this.cms && this.cms.site && this.cms.site.name) ? this.cms.site.name : ''; },
    helpLine(){ return (this.cms && this.cms.site && this.cms.site.help && this.cms.site.help !== '[— To Be Supplied]') ? this.cms.site.help : ((this.cms && this.cms.site && this.cms.site.phone) ? this.cms.site.phone : '08024700454'); },
    liveSettings(){ return (this.cms && this.cms.live) ? this.cms.live : {}; },
    hlsUrl(){ return this.liveSettings.hls_url || OLD.hls; },
    youtubeChannelId(){
      const value = String(this.liveSettings.youtube_channel_id || '').trim();
      if(!value){ return 'UCLFScmpsKP4jlJXD8McBGgQ'; }
      const match = value.match(/(?:channel\/|channel=)([A-Za-z0-9_-]+)/);
      return match ? match[1] : value;
    },
    youtubeUrl(){ return 'https://www.youtube.com/embed/live_stream?channel=' + encodeURIComponent(this.youtubeChannelId) + '&autoplay=1&controls=1&modestbranding=1&rel=0'; },
    youtubePage(){ return 'https://www.youtube.com/channel/' + encodeURIComponent(this.youtubeChannelId); },
    isAudioStream(){ return /\.(mp3|m4a|aac|ogg|oga|wav)(\?.*)?$/i.test(this.hlsUrl); },
    announcementHtml(){
      const items = this.cms && this.cms.home && Array.isArray(this.cms.home.member_announcements) ? this.cms.home.member_announcements : [];
      const item = items.find(item => item && item.announcement);
      return item ? item.announcement : '';
    }
  },
  mounted(){
    this.loadStatus();
    this.loadChat();
    this.loadLiveNotice();
    this.chatTimer=setInterval(this.loadChat, 5000);
    this.statusTimer=setInterval(this.loadStatus, 30000);
    this.noticeTimer=setInterval(this.loadLiveNotice, 8000);
    this.presenceTimer=setInterval(()=>this.sendPresence(false), 15000);
    this.sendPresence(false);

    this._fsHandler = () => {
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      this.isFullscreen = !!(fsEl && (fsEl === this.$refs.playerBox || fsEl === this.$refs.liveVideo));
      if (this.isFullscreen) {
        this.onPlayerInteraction();
      }
    };
    document.addEventListener('fullscreenchange', this._fsHandler);
    document.addEventListener('webkitfullscreenchange', this._fsHandler);
    document.addEventListener('mozfullscreenchange', this._fsHandler);
    document.addEventListener('MSFullscreenChange', this._fsHandler);

    this._clickOutsideHandler = (e) => {
      if (!e.target.closest('.quality-selector-wrap')) {
        this.qualityMenuOpen = false;
      }
    };
    document.addEventListener('click', this._clickOutsideHandler);

    this._keyHandler = (e) => {
      if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
      if (e.key === 'f' || e.key === 'F') {
        if (this.activeStream === 'player') this.toggleFullscreen();
      } else if (e.key === 'Escape') {
        this.qualityMenuOpen = false;
      }
    };
    window.addEventListener('keydown', this._keyHandler);

    if(this.member){ this.$nextTick(()=>this.autoplayPlayer()); }
  },
  unmounted(){
    clearInterval(this.chatTimer);
    clearInterval(this.statusTimer);
    clearInterval(this.noticeTimer);
    clearInterval(this.presenceTimer);
    if (this._overlayTimer) clearTimeout(this._overlayTimer);
    document.removeEventListener('fullscreenchange', this._fsHandler);
    document.removeEventListener('webkitfullscreenchange', this._fsHandler);
    document.removeEventListener('mozfullscreenchange', this._fsHandler);
    document.removeEventListener('MSFullscreenChange', this._fsHandler);
    document.removeEventListener('click', this._clickOutsideHandler);
    window.removeEventListener('keydown', this._keyHandler);
    this.sendPresence(true);
    if(this.videoJsPlayer){ this.videoJsPlayer.dispose(); this.videoJsPlayer=null; }
    if(this.hls){ this.hls.destroy(); }
  },
  methods:{
    login(){
      if(!this.name.trim()){ this.error='Please enter your full name.'; return; }
      if(!this.phone.trim()){ this.error='Please enter your phone number.'; return; }
      if(!/^[0-9+\-\s()]{6,}$/.test(this.phone.trim())){ this.error='Please enter a valid phone number.'; return; }
      if(!this.groupName){ this.error='Please select your group.'; return; }
      const attendance = this.viewingMode === 'group' ? Math.max(1, parseInt(this.groupCount || 1, 10)) : 1;
      const serviceName = (this.liveSettings && this.liveSettings.title) ? this.liveSettings.title : 'Sunday Service of Excellence';
      const member = {name:this.name.trim(), email:this.email.trim(), phone:this.phone.trim(), group:this.groupName, category:this.category, viewingMode:this.viewingMode, attendance, service_name:serviceName};
      this.$root.member = member;
      if(this.remember){ localStorage.setItem('kh_member', JSON.stringify(member)); }
      this.error='';
      this.$nextTick(()=>{ this.loadChat(); this.loadLiveNotice(); this.autoplayPlayer(); this.sendPresence(false); });
      const body = new URLSearchParams({
        fullname:member.name,
        email:member.email,
        phone:member.phone,
        group:member.group,
        category:this.category || 'Church Member',
        service_name:serviceName,
        platform:'Desktop Web',
        attendance:String(attendance)
      });
      fetch(OLD.attendancePost,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(r=>r.json())
        .then(data=>{
          if(!data || !data.ok){ this.error=(data && data.error) ? data.error : 'Unable to sign in right now.'; return; }
          const savedMember = Object.assign({}, member, data.member || {});
          savedMember.viewingMode = this.viewingMode;
          this.$root.member = savedMember;
          if(this.remember){ localStorage.setItem('kh_member', JSON.stringify(savedMember)); }
          this.error='';
          this.$nextTick(()=>{ this.loadChat(); this.loadLiveNotice(); this.autoplayPlayer(); this.sendPresence(false); });
        })
        .catch(()=>{ this.error='Unable to sign in right now. Please try again.'; });
    },
    logout(){ this.sendPresence(true); localStorage.removeItem('kh_member'); this.$root.stopFloatingLive(); this.$root.member=null; this.activeStream='player'; },
    switchStream(type){ this.activeStream=type; if(type==='youtube'){ const v=this.$refs.liveVideo; if(v && !v.paused){ v.pause(); } this.isPlaying=false; this.loadStatus(); } else { this.liveStatus=this.isPlaying ? 'live' : 'checking'; this.$nextTick(()=>this.autoplayPlayer()); } },
    setupHls(){
      const v=this.$refs.liveVideo;
      if(!v || !this.hlsUrl){ this.liveStatus='offline'; return; }
      if(v.dataset.hlsReady === this.hlsUrl){ return; }
      if(this.hls){ this.hls.destroy(); this.hls=null; }
      if(this.isAudioStream){ v.src=this.hlsUrl; v.dataset.hlsReady=this.hlsUrl; v.load(); return; }
      if(v.canPlayType('application/vnd.apple.mpegurl')){ v.src=this.hlsUrl; v.dataset.hlsReady=this.hlsUrl; v.load(); return; }
      if(window.Hls && Hls.isSupported()){
        const hls=new Hls({
          lowLatencyMode:true,
          startLevel:-1,
          capLevelToPlayerSize:true,
          maxBufferLength:6,
          maxMaxBufferLength:20,
          liveSyncDurationCount:2,
          liveMaxLatencyDurationCount:5,
          manifestLoadingTimeOut:4000,
          levelLoadingTimeOut:4000,
          fragLoadingTimeOut:6000,
          startFragPrefetch:true,
          backBufferLength:30,
          maxLiveSyncPlaybackRate:1.5
        });
        hls.loadSource(this.hlsUrl);
        hls.attachMedia(v);
        hls.on(Hls.Events.ERROR, (event, data) => {
          if (data && data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS Network stall, attempting recovery...', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS Media decode stall, recovering media...', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal HLS error:', data);
                this.markStreamError();
                break;
            }
          }
        });
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          this.syncHlsLevels(hls);
        });
        hls.on(Hls.Events.LEVEL_UPDATED, () => {
          this.syncHlsLevels(hls);
        });
        hls.on(Hls.Events.LEVEL_SWITCHED, (event, data) => {
          const currentLvl = hls.levels[data.level];
          if (currentLvl) {
            const res = currentLvl.height ? `${currentLvl.height}p` : '';
            if (this.selectedLevel === -1) {
              this.activePlayingResolution = res ? `Auto (${res})` : 'Auto';
            } else {
              this.activePlayingResolution = res || `Level ${data.level + 1}`;
            }
          }
        });
        this.hls=hls;
        v.dataset.hlsReady=this.hlsUrl;
      }
    },
    syncHlsLevels(hls) {
      if (!hls || !Array.isArray(hls.levels)) return;
      const v = this.$refs.liveVideo;
      const fallbackH = (v && v.videoHeight) ? v.videoHeight : 720;
      this.availableLevels = hls.levels.map((lvl, idx) => {
        const h = lvl.height || fallbackH;
        return {
          index: idx,
          height: h,
          label: `${h}p HD`,
          bitrate: lvl.bitrate ? `${Math.round(lvl.bitrate / 1000)} kbps` : ''
        };
      });
    },
    selectQuality(lvlIdx){
      this.selectedLevel = lvlIdx;
      this.qualityMenuOpen = false;
      if(this.hls){
        this.hls.currentLevel = lvlIdx;
        if(lvlIdx === -1){
          this.activePlayingResolution = 'Auto';
        } else if(this.availableLevels[lvlIdx]){
          this.activePlayingResolution = this.availableLevels[lvlIdx].label;
        }
      }
      if (this.isFullscreen) {
        this.onPlayerInteraction();
      }
    },
    toggleQualityMenu(){
      this.qualityMenuOpen = !this.qualityMenuOpen;
      if (this.qualityMenuOpen) {
        this.overlayControlsVisible = true;
        if (this._overlayTimer) clearTimeout(this._overlayTimer);
      }
    },
    onPlayerInteraction(){
      this.overlayControlsVisible = true;
      if (this._overlayTimer) clearTimeout(this._overlayTimer);
      if (this.isFullscreen && !this.qualityMenuOpen) {
        this._overlayTimer = setTimeout(() => {
          this.overlayControlsVisible = false;
        }, 3500);
      }
    },
    toggleFullscreen(){
      const box = this.$refs.playerBox || this.$refs.liveVideo;
      if(!box) return;
      const isFs = !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement);
      if(!isFs){
        if(box.requestFullscreen){ box.requestFullscreen().catch(()=>{}); }
        else if(box.webkitRequestFullscreen){ box.webkitRequestFullscreen(); }
        else if(box.mozRequestFullScreen){ box.mozRequestFullScreen(); }
        else if(box.msRequestFullscreen){ box.msRequestFullscreen(); }
      } else {
        if(document.exitFullscreen){ document.exitFullscreen().catch(()=>{}); }
        else if(document.webkitExitFullscreen){ document.webkitExitFullscreen(); }
        else if(document.mozCancelFullScreen){ document.mozCancelFullScreen(); }
        else if(document.msExitFullscreen){ document.msExitFullscreen(); }
      }
    },
    autoplayPlayer(){
      this.activeStream='player';
      this.liveStatus='checking';
      this.soundBlocked=false;
      this.setupHls();
      const v=this.$refs.liveVideo;
      if(!v) return;
      v.autoplay=false;
      v.playsInline=true;
      v.preload='auto';
      v.defaultMuted=false;
      v.muted=false;
      v.volume=parseFloat(this.volume || this.$root.liveFloatVolume || 0.85);
      this.muted=false;
      this.$root.liveFloatMuted=false;
    },
    markStreamReady(){
      this.liveStatus='live';
      this.$root.enableFloatingLive(false);
      const v = this.$refs.liveVideo;
      if (v && v.videoHeight && this.hls) {
        this.syncHlsLevels(this.hls);
      }
    },
    markStreamError(){ if(this.activeStream==='player'){ this.liveStatus='offline'; this.isPlaying=false; } },
    togglePlay(){
      const v = this.$refs.liveVideo;
      if (!v) return;
      this.setupHls();
      if (v.paused) {
        v.muted = false;
        v.volume = parseFloat(this.volume || 0.85);
        const playPromise = v.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            this.isPlaying = true;
            this.soundBlocked = false;
            this.liveStatus = 'live';
          }).catch((err) => {
            console.warn('Playback with sound blocked by browser, trying muted:', err);
            v.muted = true;
            this.muted = true;
            this.soundBlocked = true;
            v.play().then(() => {
              this.isPlaying = true;
              this.liveStatus = 'live';
            }).catch(() => {
              this.isPlaying = false;
            });
          });
        }
      } else {
        v.pause();
        this.isPlaying = false;
        this.$root.stopFloatingLive();
      }
    },
    toggleMute(){ const v=this.$refs.liveVideo; if(!v) return; v.muted=!v.muted; this.muted=v.muted; this.$root.liveFloatMuted=v.muted; if(!v.muted){ this.soundBlocked=false; v.volume=parseFloat(this.volume || 0.85); } },
    setVolume(){ const v=this.$refs.liveVideo; if(!v) return; v.volume=parseFloat(this.volume); this.$root.liveFloatVolume=v.volume; if(v.volume>0){ v.muted=false; this.muted=false; this.soundBlocked=false; this.$root.liveFloatMuted=false; } },
    updateProgress(){ const v=this.$refs.liveVideo; if(!v || !v.duration) return; this.progress=(v.currentTime/v.duration)*100; },
    seekVideo(e){ const v=this.$refs.liveVideo; if(!v || !v.duration) return; const rect=e.currentTarget.getBoundingClientRect(); const pct=(e.clientX-rect.left)/rect.width; v.currentTime=Math.max(0, Math.min(v.duration*pct, v.duration)); },
    fullscreen(){ this.toggleFullscreen(); },
    loadStatus(){
      fetch(OLD.status).then(r=>r.json()).then(d=>{
        if(d.isLive){ this.liveStatus='live'; return; }
        this.liveStatus = this.activeStream === 'youtube' ? 'offline' : (this.liveStatus === 'live' ? 'live' : 'checking');
      }).catch(()=>{ if(this.activeStream === 'youtube'){ this.liveStatus='unknown'; } });
    },
    loadChat(){
      fetch(OLD.chatFeed + '?t=' + Date.now(), {cache:'no-store'}).then(r=>r.json()).then(rows=>{
        const list=this.$refs.chatList;
        const shouldStick=!list || (list.scrollHeight - list.scrollTop - list.clientHeight < 80);
        this.chat=Array.isArray(rows)?rows:[];
        this.$nextTick(()=>{ const nextList=this.$refs.chatList; if(nextList && shouldStick) nextList.scrollTop=nextList.scrollHeight; });
      }).catch(()=>{});
    },
    localChatDate(){
      const now = new Date();
      const pad = value => String(value).padStart(2, '0');
      let hour = now.getHours();
      const ampm = hour >= 12 ? 'pm' : 'am';
      hour = hour % 12 || 12;
      return now.getFullYear() + '/' + pad(now.getMonth() + 1) + '/' + pad(now.getDate()) + ' - ' + pad(hour) + ':' + pad(now.getMinutes()) + ':' + pad(now.getSeconds()) + ' ' + ampm;
    },
    ensurePresenceToken(){
      if(!this.presenceToken){
        this.presenceToken = 'web-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
        localStorage.setItem('kh_live_presence_token', this.presenceToken);
      }
      return this.presenceToken;
    },
    sendPresence(leaving){
      if(!this.member && !leaving){ return; }
      const body = new URLSearchParams({
        token:this.ensurePresenceToken(),
        action:leaving ? 'leave' : 'heartbeat',
        name:this.member ? (this.member.name || '') : '',
        phone:this.member ? (this.member.phone || '') : '',
        attendance:this.member ? String(this.member.attendance || 1) : '1'
      });
      fetch(OLD.presence,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(r=>r.json())
        .then(data=>{ if(data && data.ok){ this.liveViewers=parseInt(data.total || 0, 10); } })
        .catch(()=>{});
    },
    loadLiveNotice(){
      if(!this.member){ this.liveNotice=null; return; }
      fetch(OLD.liveNotices).then(r=>r.json()).then(data=>{
        const notice = data && data.notice ? data.notice : null;
        if(!notice || !notice.id){ this.liveNotice=null; return; }
        this.liveNotice = String(notice.id) === String(this.dismissedNoticeId) ? null : notice;
      }).catch(()=>{});
    },
    dismissLiveNotice(){
      if(this.liveNotice && this.liveNotice.id){
        this.dismissedNoticeId = String(this.liveNotice.id);
        localStorage.setItem('kh_live_notice_dismissed', this.dismissedNoticeId);
      }
      this.liveNotice = null;
    },
    postChat(){
      const text=this.chatText.trim();
      if(!text){return;}
      const memberName=(this.member && this.member.name) ? this.member.name : 'Guest';
      const localMessage={id:'local-' + Date.now(), name:memberName, shout:text, date:this.localChatDate()};
      this.chat=[...this.chat, localMessage];
      this.chatText='';
      this.chatError='';
      this.$nextTick(()=>{ const list=this.$refs.chatList; if(list) list.scrollTop=list.scrollHeight; });
      const body=new URLSearchParams({name:memberName, shout:text, date:new Date().toISOString().slice(0,19).replace('T',' ')});
      fetch(OLD.chatPost,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(()=>{ this.loadChat(); setTimeout(()=>this.loadChat(), 800); })
        .catch(()=>{ this.chatError='Unable to post right now. Please try again.'; });
    }
  },
  template:`
  <div>
    <section v-if="!member" class="live-login-page improved-login-page">
      <div class="live-login-bg"></div>
      <div class="login-shell">
        <div class="login-welcome-panel">
          <span class="login-live-pill"><i class="fa-solid fa-circle"></i> Live Service Access</span>
          <h1 class="title-serif">{{siteName ? 'Welcome to ' + siteName + ' Online.' : 'Welcome Online.'}}</h1>
          <p>Sign in to join the live service, choose the old-site HD player or YouTube stream, chat with members, and view service announcements.</p>
          <div class="login-mini-grid">
            <div><i class="fa-solid fa-video"></i><b>HD Player</b><span>Old stream URL</span></div>
            <div><i class="fa-brands fa-youtube"></i><b>YouTube</b><span>Live channel</span></div>
            <div><i class="fa-solid fa-message"></i><b>Live Chat</b><span>Old shouts table</span></div>
          </div>
        </div>

        <div class="live-login-card upgraded-signin-card">
          <div class="eyebrow">Member Sign In</div>
          <h2>Enter Live Service</h2>
          <p class="signin-help">Enter your details as an individual or as a group, just like the classic live-service access flow.</p>
          <div class="alert alert-danger" v-if="error">{{error}}</div>
          <div class="row g-3 mt-1">
            <div class="col-12"><label>Full Name</label><div class="input-icon"><i class="fa-solid fa-user"></i><input v-model="name" class="form-control form-control-lg" placeholder="e.g. Clarke Johnson" @keyup.enter="login"></div></div>
            <div class="col-md-6"><label>Phone Number</label><div class="input-icon"><i class="fa-solid fa-phone"></i><input v-model="phone" class="form-control form-control-lg" placeholder="080..." @keyup.enter="login"></div></div>
            <div class="col-md-6"><label>Email Address <span>optional</span></label><div class="input-icon"><i class="fa-solid fa-envelope"></i><input v-model="email" class="form-control form-control-lg" placeholder="name@email.com" @keyup.enter="login"></div></div>
            <div class="col-md-6"><label>Membership Status</label><div class="input-icon"><i class="fa-solid fa-id-badge"></i><select v-model="category" class="form-control form-control-lg"><option v-for="cat in categoryOptions" :value="cat">{{cat}}</option></select></div></div>
            <div class="col-md-6"><label>Select Your Group</label><div class="input-icon"><i class="fa-solid fa-users"></i><select v-model="groupName" class="form-control form-control-lg"><option value="">Select your group</option><option v-for="group in groupOptions" :value="group">{{group}}</option></select></div></div>
            <div class="col-12"><label>How will you be viewing this service?</label><div class="viewing-toggle"><button type="button" :class="{active:viewingMode==='individual'}" @click="viewingMode='individual'; groupCount=1">As an Individual</button><button type="button" :class="{active:viewingMode==='group'}" @click="viewingMode='group'">As a Group</button></div></div>
            <div class="col-md-6" v-if="viewingMode==='group'"><label>Number in Group</label><div class="input-icon"><i class="fa-solid fa-hashtag"></i><input v-model="groupCount" type="number" min="1" class="form-control form-control-lg"></div></div>
            <div class="col-12 d-flex justify-content-between align-items-center gap-3 flex-wrap"><label class="remember-line"><input type="checkbox" v-model="remember"> Remember me</label></div>
            <div class="col-12"><button class="btn-brand w-100" @click="login">Continue to Live Service <i class="fa-solid fa-arrow-right ms-2"></i></button></div>
          </div>
        </div>
      </div>
    </section>

    <section v-else class="member-area">
      <div class="member-topbar">
        <div><b>Welcome, {{member.name}}</b><span v-if="member.group"> / {{member.group}}</span> <button @click="logout" class="link-btn">Logout</button> <a :href="OLD.oldMember" class="link-btn">Classic member area</a></div>
        <div class="member-sound"><i class="fa-solid fa-signal"></i> <span v-if="liveViewers > 0">{{liveViewers}} online</span><span v-else>{{liveStatus==='live' ? 'Live now' : liveStatus==='offline' ? 'Offline' : 'Checking stream'}}</span></div>
      </div>
      <div v-if="liveNotice" class="live-notice-modal" role="dialog" aria-modal="true">
        <div class="live-notice-card">
          <button type="button" class="live-notice-close" @click="dismissLiveNotice" aria-label="Close notification"><i class="fa-solid fa-xmark"></i></button>
          <div class="live-notice-icon"><i class="fa-solid fa-bell"></i></div>
          <div>
            <span>Live Notice</span>
            <h3>{{liveNotice.title || 'Message from Admin'}}</h3>
            <p>{{liveNotice.message}}</p>
            <button type="button" class="btn-brand" @click="dismissLiveNotice">Got it</button>
          </div>
        </div>
      </div>
      <div class="member-layout">
        <div class="member-main">
          <div class="stream-bar-controls">
            <!-- Left: Stream switch tabs (Player / YouTube) -->
            <div class="stream-tabs-pills">
              <button type="button" class="btn-stream-tab" :class="{active: activeStream==='player'}" @click="switchStream('player')">
                <i class="fa-solid fa-play"></i> Player
              </button>
              <button type="button" class="btn-stream-tab tab-youtube" :class="{active: activeStream==='youtube'}" @click="switchStream('youtube')">
                <i class="fa-brands fa-youtube"></i> YouTube
              </button>
            </div>

            <!-- Right: Quality & Fullscreen -->
            <div v-if="activeStream==='player'" class="d-flex align-items-center gap-2">
              <div class="quality-selector-wrap">
                <button type="button" class="btn-quality-toggle" :class="{'active-open': qualityMenuOpen}" @click.stop="toggleQualityMenu" aria-label="Streaming quality selection">
                  <i class="fa-solid fa-gear text-gold"></i>
                  <span>Quality:</span>
                  <span class="quality-active-badge">{{ currentQualityLabel }}</span>
                  <i :class="qualityMenuOpen ? 'fa-solid fa-chevron-up ms-1' : 'fa-solid fa-chevron-down ms-1'" style="font-size: 0.7rem;"></i>
                </button>
                <div v-if="qualityMenuOpen" class="quality-dropdown-menu" @click.stop>
                  <div class="quality-menu-header">
                    <span><i class="fa-solid fa-sliders text-warning me-2"></i> Stream Quality</span>
                    <span class="badge-abr-pill"><i class="fa-solid fa-bolt me-1"></i> Auto ABR</span>
                  </div>
                  <!-- Auto Option -->
                  <button type="button" :class="['quality-item', {active: selectedLevel === -1}]" @click="selectQuality(-1)">
                    <div class="quality-item-text">
                      <div class="d-flex align-items-center gap-2">
                        <span class="quality-item-title">Auto (Adaptive)</span>
                        <span class="quality-pill-rec">Recommended</span>
                      </div>
                      <span class="quality-item-desc">Dynamically optimizes for the smoothest playback without buffering</span>
                    </div>
                    <i v-if="selectedLevel === -1" class="fa-solid fa-check quality-check-icon"></i>
                  </button>
                  <!-- Formatted Broadcast Levels -->
                  <button v-for="lvl in formattedLevels" :key="lvl.id" type="button" :class="['quality-item', {active: selectedLevel === lvl.levelIndex}]" @click="selectQuality(lvl.levelIndex)">
                    <div class="quality-item-text">
                      <div class="d-flex align-items-center gap-2">
                        <span class="quality-item-title">{{ lvl.title }}</span>
                        <span v-if="lvl.badge" class="quality-pill-sub">{{ lvl.badge }}</span>
                      </div>
                      <span class="quality-item-desc">{{ lvl.subtitle }}</span>
                    </div>
                    <i v-if="selectedLevel === lvl.levelIndex" class="fa-solid fa-check quality-check-icon"></i>
                  </button>
                </div>
              </div>

              <!-- Fullscreen button in top bar -->
              <button type="button" class="btn-topbar-fullscreen" @click="toggleFullscreen" :title="isFullscreen ? 'Exit Full Screen' : 'Full Screen'" aria-label="Toggle Full Screen">
                <i :class="isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'"></i>
              </button>
            </div>
          </div>

          <div v-if="activeStream==='player'"
               class="stream-player native-player"
               :class="{'is-fullscreen': isFullscreen}"
               ref="playerBox"
               @mousemove="onPlayerInteraction"
               @touchstart="onPlayerInteraction"
               @click="onPlayerInteraction">

            <video ref="liveVideo"
                   class="native-live-video"
                   preload="auto"
                   controls
                   controlsList="nodownload"
                   playsinline
                   @loadedmetadata="markStreamReady"
                   @canplay="markStreamReady"
                   @playing="markStreamReady"
                   @error="markStreamError"
                   @play="isPlaying=true"
                   @pause="isPlaying=false"
                   @dblclick="toggleFullscreen"></video>

            <!-- Big play button when paused -->
            <button v-if="!isPlaying" type="button" class="native-big-play" @click="togglePlay" aria-label="Play live stream"><i class="fa-solid fa-play"></i></button>

            <!-- Sound Unmute Badge -->
            <div v-if="soundBlocked" class="sound-unmute-badge" @click="toggleMute" style="position: absolute; top: 15px; right: 15px; background: rgba(0,0,0,0.85); color: #fbbf24; border: 1px solid #fbbf24; padding: 6px 14px; border-radius: 999px; font-size: 0.85rem; font-weight: 700; cursor: pointer; z-index: 20; display: flex; align-items: center; gap: 6px; box-shadow: 0 4px 15px rgba(0,0,0,0.5);">
              <i class="fa-solid fa-volume-xmark"></i> Tap for Sound
            </div>

            <!-- Fullscreen In-Player Overlay Bar (visible in Fullscreen and on hover) -->
            <div class="player-overlay-bar" :class="{'show-overlay': isFullscreen ? (overlayControlsVisible || qualityMenuOpen) : false}">
              <div class="player-overlay-left">
                <span class="player-live-badge"><span class="pulse-dot"></span> LIVE</span>
                <span class="player-quality-tag">{{ currentQualityLabel }}</span>
              </div>
              <div class="player-overlay-right d-flex align-items-center gap-2">
                <!-- Quality Selector Dropdown in Fullscreen -->
                <div class="quality-selector-wrap">
                  <button type="button" class="btn-quality-toggle" :class="{'active-open': qualityMenuOpen}" @click.stop="toggleQualityMenu" aria-label="Streaming quality selection in full screen">
                    <i class="fa-solid fa-gear text-gold"></i>
                    <span>Quality:</span>
                    <span class="quality-active-badge">{{ currentQualityLabel }}</span>
                    <i :class="qualityMenuOpen ? 'fa-solid fa-chevron-up ms-1' : 'fa-solid fa-chevron-down ms-1'" style="font-size: 0.7rem;"></i>
                  </button>
                  <div v-if="qualityMenuOpen" class="quality-dropdown-menu" @click.stop>
                    <div class="quality-menu-header">
                      <span><i class="fa-solid fa-sliders text-warning me-2"></i> Stream Quality</span>
                      <span class="badge-abr-pill"><i class="fa-solid fa-bolt me-1"></i> Auto ABR</span>
                    </div>
                    <!-- Auto Option -->
                    <button type="button" :class="['quality-item', {active: selectedLevel === -1}]" @click="selectQuality(-1)">
                      <div class="quality-item-text">
                        <div class="d-flex align-items-center gap-2">
                          <span class="quality-item-title">Auto (Adaptive)</span>
                          <span class="quality-pill-rec">Recommended</span>
                        </div>
                        <span class="quality-item-desc">Dynamically optimizes for the smoothest playback without buffering</span>
                      </div>
                      <i v-if="selectedLevel === -1" class="fa-solid fa-check quality-check-icon"></i>
                    </button>
                    <!-- Broadcast Levels -->
                    <button v-for="lvl in formattedLevels" :key="'fs-'+lvl.id" type="button" :class="['quality-item', {active: selectedLevel === lvl.levelIndex}]" @click="selectQuality(lvl.levelIndex)">
                      <div class="quality-item-text">
                        <div class="d-flex align-items-center gap-2">
                          <span class="quality-item-title">{{ lvl.title }}</span>
                          <span v-if="lvl.badge" class="quality-pill-sub">{{ lvl.badge }}</span>
                        </div>
                        <span class="quality-item-desc">{{ lvl.subtitle }}</span>
                      </div>
                      <i v-if="selectedLevel === lvl.levelIndex" class="fa-solid fa-check quality-check-icon"></i>
                    </button>
                  </div>
                </div>

                <!-- Exit Fullscreen Button -->
                <button type="button" class="btn-fs-exit" @click.stop="toggleFullscreen" title="Exit Full Screen (Esc)" aria-label="Exit Full Screen">
                  <i class="fa-solid fa-compress"></i>
                </button>
              </div>
            </div>
          </div>

          <div v-else class="youtube-panel">
            <div class="youtube-frame"><iframe :src="youtubeUrl" :title="siteName ? siteName + ' YouTube Live' : 'YouTube Live'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
            <div class="youtube-actions"><div><b>YouTube Live</b><span>Uses the selected YouTube channel ID.</span></div><a :href="youtubePage" target="_blank" rel="noopener" class="btn-brand">Open YouTube Page</a></div>
          </div>

          <div class="live-service-info mt-3 p-4 rounded" style="background: #ffffff; border: 1px solid #e2e8f0; box-shadow: 0 4px 20px rgba(0,0,0,0.05); border-radius: 14px;">
            <div class="d-flex justify-content-between align-items-start flex-wrap gap-3">
              <div>
                <span v-if="liveSettings.theme" class="badge mb-2" style="background: #fef3c7; color: #92400e; border: 1px solid #fde68a; font-size: 0.82rem; font-weight: 700;"><i class="fa-solid fa-scroll me-1"></i> {{liveSettings.theme}}</span>
                <h3 class="fw-bold mb-2" style="font-size: 1.5rem; color: #0f172a;">{{liveSettings.title || 'Live Service of Excellence'}}</h3>
                <p class="m-0" style="color: #334155; font-size: 1rem; line-height: 1.65;">{{liveSettings.description || 'Welcome to our live service with Pastor Joseph Atibi-Brown. Experience the supernatural power of God through worship and the ministered Word.'}}</p>
                <div v-if="liveSettings.minister" class="small mt-2" style="color: #b45309; font-weight: 600;"><i class="fa-solid fa-user-tie me-1"></i> Minister: <b style="color: #0f172a;">{{liveSettings.minister}}</b></div>
              </div>
              <a href="#/give" class="btn-brand flex-shrink-0"><i class="fa-solid fa-heart me-1"></i> Give Online</a>
            </div>
          </div>

          <div v-if="announcementHtml" class="announcement-box mt-3" :class="{collapsed:!announcementOpen}">
            <button class="announcement-head" type="button" @click="announcementOpen=!announcementOpen">Announcement <i :class="announcementOpen ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i></button>
            <div v-show="announcementOpen" class="announcement-content" v-html="announcementHtml"></div>
          </div>
        </div>
        <aside class="member-side">
          <div class="chat-box">
            <div class="chat-head"><i class="fa-solid fa-comments me-2"></i> Live Chat</div>
            <div class="chat-list" ref="chatList">
              <div class="chat-msg" v-for="c in chat" :key="c.id || c.name+c.date+c.shout"><div><b>{{c.name}}</b><span>{{c.date}}</span></div><p>{{c.shout}}</p></div>
            </div>
            <form class="chat-input" @submit.prevent="postChat"><small>{{chatText.length}}/500 characters</small><div><input v-model="chatText" maxlength="500" placeholder="Type your message..."><button>Send</button></div><small v-if="chatError">{{chatError}}</small></form>
          </div>
          <div class="help-card" v-if="helpLine"><h5>Need Help?</h5><p><b>Help-line:</b><br>{{helpLine}}</p></div>
        </aside>
      </div>
    </section>
  </div>`
};

const ListingPage = (cfg) => ({
  inject:['cms'],
  data(){return {DATA}},
  computed:{
    cmsSlug(){ return (cfg.slug || cfg.eyebrow || cfg.title).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); },
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages[this.cmsSlug]) ? this.cms.pages[this.cmsSlug] : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    pageEyebrow(){ return this.pageCms.eyebrow || cfg.eyebrow; },
    pageTitle(){ return this.pageCms.title || cfg.title; },
    pageSubtitle(){ return this.pageCms.subtitle || ''; }
  },
  template:`<div><section class="sub-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageEyebrow}}</div><h1 class="title-serif">{{pageTitle}}</h1><p v-if="pageSubtitle" class="text-lg cms-subtitle">{{pageSubtitle}}</p></div></section><section v-if="pageCms.body" class="section cms-body"><div class="container-wide" v-html="pageCms.body"></div></section>${cfg.body}</div>`
});
const WatchPage = {
  inject:['cms'],
  data(){
    return {
      visible: 9,
      searchQuery: '',
      activeCategory: 'All Messages',
      copiedKey: ''
    };
  },
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.watch) ? this.cms.pages.watch : {}; },
    heroImage(){ return (this.pageCms.hero) || 'assets/uploaded_media/watch_hero_banner.jpg'; },
    heroStyle(){
      return { backgroundImage: `url(${this.heroImage})` };
    },
    categories(){
      return this.pageCms.categories || [
        'All Messages',
        'Sunday Services',
        'Faith & Healing',
        'Leadership & Excellence',
        'Mid-Week Teachings',
        'Kingdom Prosperity',
        'Evangelism & Missions'
      ];
    },
    sermons(){
      const items = this.cms && this.cms.home && Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons : [];
      return this.normalizeSermons(items);
    },
    featuredSermon(){
      const targetId = this.pageCms.featured_sermon_id || '1';
      return this.sermons.find(s => String(s.id) === String(targetId)) || this.sermons[0] || {};
    },
    filteredSermons(){
      let list = this.sermons;
      if (this.activeCategory !== 'All Messages') {
        const cat = this.activeCategory.toLowerCase();
        list = list.filter(s => 
          (s.category && s.category.toLowerCase() === cat) ||
          (s.eyebrow && s.eyebrow.toLowerCase() === cat)
        );
      }
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        list = list.filter(s => 
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.speaker && s.speaker.toLowerCase().includes(q)) ||
          (s.subtitle && s.subtitle.toLowerCase().includes(q)) ||
          (s.scripture && s.scripture.toLowerCase().includes(q)) ||
          (s.category && s.category.toLowerCase().includes(q))
        );
      }
      return list;
    },
    visibleSermons(){ return this.filteredSermons.slice(0, this.visible); },
    hasMore(){ return this.visible < this.filteredSermons.length; }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    normalizeSermons(items){
      return items
        .filter(item => item && item.id)
        .map(item => {
          const media = item.media_url ? this.cacheAsset(item.media_url, item.updated_ts) : '';
          const poster = item.poster_url ? this.cacheAsset(item.poster_url, item.updated_ts) : '';
          return {
            id: item.id,
            eyebrow: item.eyebrow || 'Sermon',
            title: item.title || 'Sermon',
            subtitle: item.subtitle || '',
            speaker: item.speaker || 'Pastor Joseph Atibi-Brown',
            date: item.date || 'Sunday Service',
            duration: item.duration || '1h 10m',
            scripture: item.scripture || '',
            category: item.category || 'Sunday Services',
            body: item.body || '',
            media_type: item.media_type || 'video',
            media_url: media,
            embed_url: item.embed_url || '',
            poster_url: poster || (item.media_type === 'image' ? media : 'assets/uploaded_media/featured_sermon_spotlight.jpg'),
            href: '#/watch/' + item.id
          };
        });
    },
    loadMore(){ this.visible += 6; },
    setCategory(cat){ this.activeCategory = cat; },
    copyShareLink(href, key){
      const fullUrl = window.location.origin + window.location.pathname + href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(fullUrl).then(() => {
          this.copiedKey = key;
          setTimeout(() => { if (this.copiedKey === key) this.copiedKey = ''; }, 2500);
        });
      }
    }
  },
  template:`
  <div>
    <!-- Cinematic Broadcast Sub-Hero -->
    <section class="sub-hero watch-hero" :style="heroStyle">
      <div class="container-wide reveal">
        <div class="watch-hero-badge"><i class="fa-solid fa-play-circle me-2"></i> {{pageCms.eyebrow || 'Watch Online • Word & Spirit'}}</div>
        <h1 class="title-serif">{{pageCms.title || 'Latest Videos & Sermons'}}</h1>
        <p class="text-lg cms-subtitle">{{pageCms.subtitle || 'Immerse yourself in transformative teachings, prophetic revelations, and kingdom wisdom from Rev. Dr. Chris Oyakhilome D.Sc., D.D.'}}</p>
      </div>
    </section>

    <!-- Main Content Section: Bright and Clean -->
    <section class="watch-light-section">
      <div class="container-wide">

        <!-- Live Broadcast Quick Banner (Bright) -->
        <div class="watch-live-strip-bright">
          <div class="d-flex align-items-center gap-3">
            <span class="live-dot-pulse"></span>
            <div>
              <span class="badge" style="background:#fee2e2;color:#b91c1c;font-weight:800;font-size:0.75rem;letter-spacing:0.06em;padding:4px 10px;border-radius:9999px;">LIVE BROADCAST & SERVICES</span>
              <h3 style="font-size:1.15rem;font-weight:800;color:#0f172a;margin:4px 0 2px;">Pastor Chris Teaching & Sunday Service of Excellence</h3>
              <p style="font-size:0.86rem;color:#64748b;margin:0;">Sundays 7:30 AM & 9:30 AM • Wednesdays 6:00 PM (WAT)</p>
            </div>
          </div>
          <div>
            <a href="#/live" class="btn-brand" style="border-radius:9999px;padding:10px 24px;font-weight:700;"><i class="fa-solid fa-video me-1"></i> Join Live Stream</a>
          </div>
        </div>

        <!-- Featured Sermon Spotlight Showcase (Bright Card) -->
        <div v-if="featuredSermon.id && !searchQuery && activeCategory === 'All Messages'" class="watch-featured-bright-card">
          <div class="watch-featured-bright-inner">
            <div class="watch-featured-bright-media">
              <img :src="featuredSermon.poster_url" :alt="featuredSermon.title">
              <a :href="featuredSermon.href" class="featured-play-btn" aria-label="Watch Message">
                <i class="fa-solid fa-play"></i>
              </a>
              <div class="featured-media-badges">
                <span class="badge-featured-gold"><i class="fa-solid fa-star me-1"></i> FEATURED MESSAGE</span>
                <span class="badge-duration"><i class="fa-regular fa-clock me-1"></i> {{featuredSermon.duration}}</span>
              </div>
            </div>
            <div class="watch-featured-bright-body">
              <div class="d-flex align-items-center gap-2 mb-2">
                <span class="featured-cat-tag">{{featuredSermon.category || 'Sunday Service'}}</span>
                <span v-if="featuredSermon.scripture" class="featured-scripture-tag"><i class="fa-solid fa-book-bible me-1"></i> {{featuredSermon.scripture}}</span>
              </div>
              <h2 style="font-size:1.6rem;font-weight:800;color:#0f172a;line-height:1.28;margin-bottom:12px;">{{featuredSermon.title}}</h2>
              <p style="color:#475569;font-size:0.95rem;line-height:1.65;margin-bottom:20px;">{{featuredSermon.subtitle || 'Discover how to operate in the supernatural power of God and experience divine triumph in every area of life.'}}</p>
              
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:24px;padding:12px 16px;background:#f8fafc;border-radius:14px;border:1px solid #e2e8f0;">
                <div class="speaker-avatar-icon" style="background:#0f172a;color:#fbbf24;"><i class="fa-solid fa-user-tie"></i></div>
                <div>
                  <b class="d-block" style="color:#0f172a;font-size:0.92rem;">{{featuredSermon.speaker}}</b>
                  <small style="color:#64748b;">{{featuredSermon.date}}</small>
                </div>
              </div>

              <div class="d-flex align-items-center gap-3 flex-wrap">
                <a :href="featuredSermon.href" class="btn-brand" style="border-radius:9999px;padding:10px 24px;font-weight:700;"><i class="fa-solid fa-circle-play me-2"></i> Watch Full Message</a>
                <button type="button" class="btn-hero-share" style="background:#ffffff;border:1px solid #cbd5e1;color:#0f172a;" @click="copyShareLink(featuredSermon.href, 'feat_share')">
                  <i :class="copiedKey === 'feat_share' ? 'fa-solid fa-check text-success me-1' : 'fa-solid fa-share-nodes me-1'"></i>
                  {{copiedKey === 'feat_share' ? 'Link Copied!' : 'Share Message'}}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Category Filter Tabs & Search Bar -->
        <div class="sermon-controls-bar mb-4">
          <div class="category-pills-row">
            <button 
              type="button" 
              v-for="cat in categories" 
              :key="cat" 
              class="cat-filter-btn" 
              :class="{active: activeCategory === cat}"
              @click="setCategory(cat)"
            >
              {{cat}}
            </button>
          </div>

          <!-- Search Input -->
          <div class="sermon-search-box">
            <i class="fa-solid fa-magnifying-glass search-icon"></i>
            <input 
              type="text" 
              v-model="searchQuery" 
              placeholder="Search by title, speaker, scripture..." 
              class="sermon-search-input"
            >
            <span v-if="searchQuery" class="sermon-result-count">{{filteredSermons.length}} found</span>
            <button v-if="searchQuery" type="button" class="sermon-search-clear" @click="searchQuery = ''">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>

        <!-- Sermons Grid -->
        <div v-if="!filteredSermons.length" class="story-empty py-5 text-center" style="background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;padding:48px 24px;">
          <i class="fa-solid fa-film fs-1 text-muted mb-3 d-block"></i>
          <h2 class="title-mid" style="color:#0f172a;">No sermons matching your search.</h2>
          <p class="text-muted">Try clearing your search query or selecting a different category.</p>
          <button type="button" class="btn-outline-gold mt-3" @click="searchQuery = ''; activeCategory = 'All Messages'">Reset Filters</button>
        </div>

        <div v-else class="sermon-bright-grid">
          <article v-for="s in visibleSermons" :key="s.id" class="sermon-bright-card">
            <div class="sermon-thumb-bright-wrap">
              <img :src="s.poster_url" :alt="s.title">
              <a :href="s.href" class="sermon-play-overlay" aria-label="Play Sermon">
                <span class="sermon-play-circle"><i class="fa-solid fa-play"></i></span>
              </a>
              <span class="sermon-bright-cat-badge">{{s.category || s.eyebrow}}</span>
              <span class="sermon-bright-dur-badge"><i class="fa-regular fa-clock me-1"></i> {{s.duration}}</span>
            </div>

            <div class="sermon-bright-body">
              <div class="sermon-bright-meta">
                <i class="fa-regular fa-calendar"></i>
                <span>{{s.date}}</span>
              </div>

              <h3 class="sermon-bright-title">
                <a :href="s.href" style="color:inherit;text-decoration:none;">{{s.title}}</a>
              </h3>

              <div class="sermon-bright-speaker">
                <i class="fa-solid fa-user-tie me-1"></i> {{s.speaker}}
              </div>

              <div v-if="s.scripture" class="sermon-bright-scripture">
                <i class="fa-solid fa-book-bible me-1 text-teal"></i> {{s.scripture}}
              </div>

              <a :href="s.href" class="sermon-bright-cta">
                <span>Watch Message</span> <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </article>
        </div>

        <!-- Load More Button -->
        <div class="text-center mt-5" v-if="hasMore">
          <button type="button" class="btn-brand py-3 px-5" style="border-radius:9999px;font-weight:700;" @click="loadMore">
            <i class="fa-solid fa-spinner me-2"></i> Load More Messages
          </button>
        </div>

      </div>
    </section>
  </div>`
};
const ContentListPage = (cfg) => ({
  inject:['cms'],
  data(){return {visible:6, cfg, searchQuery:''}},
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages[cfg.slug]) ? this.cms.pages[cfg.slug] : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    items(){ return this.normalizeItems(this.cms && this.cms.home && Array.isArray(this.cms.home[cfg.key]) ? this.cms.home[cfg.key] : []); },
    filteredItems(){
      if(!this.searchQuery.trim()) return this.items;
      const q = this.searchQuery.trim().toLowerCase();
      return this.items.filter(i => (i.title && i.title.toLowerCase().includes(q)) || (i.subtitle && i.subtitle.toLowerCase().includes(q)) || (i.eyebrow && i.eyebrow.toLowerCase().includes(q)) || (i.meta_text && i.meta_text.toLowerCase().includes(q)));
    },
    visibleItems(){ return this.filteredItems.slice(0, this.visible); },
    hasMore(){ return this.visible < this.filteredItems.length; }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    normalizeItems(items){
      return items
        .filter(item => item && item.id)
        .map(item => ({
          id:item.id,
          eyebrow:item.eyebrow || cfg.eyebrow,
          title:item.title || cfg.single,
          subtitle:item.subtitle || '',
          body:item.body || '',
          image_url:this.cacheAsset(item.image_url, item.updated_ts),
          meta_text:item.meta_text || '',
          href: cfg.detail ? '#/'+cfg.slug+'/'+item.id : ''
        }));
    },
    loadMore(){ this.visible += 6; }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageCms.eyebrow || cfg.eyebrow}}</div><h1 class="title-serif">{{pageCms.title || cfg.title}}</h1><p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p></div></section>
    <section v-if="pageCms.body" class="section cms-body"><div class="container-wide" v-html="pageCms.body"></div></section>
    <section class="section content-list-section" :class="cfg.dark ? 'dark-band' : ''"><div class="container-wide">
      <div class="filter-search-bar"><div class="filter-inner"><i class="fa-solid fa-magnifying-glass"></i><input type="text" v-model="searchQuery" :placeholder="'Search ' + cfg.title.toLowerCase() + '...'" class="filter-input"><span v-if="searchQuery" class="filter-count">{{filteredItems.length}} result(s)</span><button v-if="searchQuery" type="button" @click="searchQuery=''" class="filter-clear"><i class="fa-solid fa-xmark"></i></button></div></div>
      <div v-if="!filteredItems.length" class="story-empty"><h2 class="title-mid">No {{cfg.title.toLowerCase()}} matching your search.</h2></div>
      <div v-else class="content-card-grid">
        <component :is="cfg.detail ? 'a' : 'article'" v-for="item in visibleItems" :href="item.href" class="content-list-card">
          <img :src="item.image_url" :alt="item.title">
          <div class="content-list-body"><span class="tag">{{item.eyebrow}}</span><h3>{{item.title}}</h3><p v-if="item.subtitle">{{item.subtitle}}</p><div v-if="item.meta_text" class="content-list-meta">{{item.meta_text}}</div><b v-if="cfg.detail">View Details -></b></div>
        </component>
      </div>
      <div class="text-center mt-5" v-if="hasMore"><button type="button" :class="cfg.dark ? 'btn-outline-brand' : 'btn-outline-darkbrand'" @click="loadMore">Load More</button></div>
    </div></section>
  </div>`
});

const ContentDetailPage = (cfg) => ({
  inject:['cms'],
  data(){return {cfg}},
  computed:{
    itemId(){ return (location.hash.replace('#/','').split('/')[1] || '').trim(); },
    items(){ return this.cms && this.cms.home && Array.isArray(this.cms.home[cfg.key]) ? this.cms.home[cfg.key] : []; },
    item(){
      const found = this.items.find(item => String(item.id) === String(this.itemId)) || {};
      return {
        id:found.id || '',
        eyebrow:found.eyebrow || cfg.eyebrow,
        title:found.title || (cfg.single + ' not found'),
        subtitle:found.subtitle || '',
        body:found.body || '',
        image_url:found.image_url || '',
        meta_text:found.meta_text || ''
      };
    }
  },
  template:`
  <div>
    <section class="sub-hero" :style="item.image_url ? {backgroundImage:'url('+item.image_url+')'} : {}"><div class="container-wide reveal"><div class="eyebrow">{{item.eyebrow}}</div><h1 class="title-serif">{{item.title}}</h1><p v-if="item.subtitle" class="text-lg cms-subtitle">{{item.subtitle}}</p></div></section>
    <section class="section event-detail-section"><div class="container-wide">
      <div class="event-detail-meta" v-if="item.meta_text"><span>{{item.meta_text}}</span></div>
      <article class="story-detail-body" v-if="item.body" v-html="item.body"></article>
      <article class="story-detail-body" v-else-if="item.subtitle"><p>{{item.subtitle}}</p></article>
      <a :href="'#/'+cfg.slug" class="btn-outline-darkbrand mt-4">Back to {{cfg.title}}</a>
    </div></section>
  </div>`
});

const MinistriesPage = {
  inject:['cms'],
  data(){
    return {
      selectedCategory: 'all',
      searchQuery: '',
      visible: 9,
      joinModalOpen: false,
      selectedMinistryForJoin: null,
      joinForm: {
        name: '',
        phone: '',
        email: '',
        ministryId: '',
        experience: '',
        submitting: false,
        submitted: false
      },
      categories: [
        { id: 'all', label: 'All Ministries', icon: 'fa-solid fa-layer-group' },
        { id: 'worship', label: 'Worship & Arts', icon: 'fa-solid fa-music' },
        { id: 'youth', label: 'Youth & Children', icon: 'fa-solid fa-child-reaching' },
        { id: 'discipleship', label: 'Discipleship & Cells', icon: 'fa-solid fa-users' },
        { id: 'service', label: 'Service & Protocol', icon: 'fa-solid fa-hand-holding-heart' }
      ]
    };
  },
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.ministries) ? this.cms.pages.ministries : {}; },
    heroStyle(){
      const image = this.pageCms.hero || 'assets/uploaded_media/ministries_hero_banner.jpg';
      return {
        backgroundImage: "linear-gradient(180deg, rgba(8, 12, 22, 0.72) 0%, rgba(6, 9, 18, 0.94) 100%), url('" + image + "')",
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      };
    },
    rawMinistries(){
      return (this.cms && this.cms.home && Array.isArray(this.cms.home.ministries)) ? this.cms.home.ministries : [];
    },
    ministries(){
      return this.rawMinistries
        .filter(m => m && (m.id || m.title))
        .map(m => ({
          id: String(m.id || ''),
          title: m.title || 'Church Ministry',
          eyebrow: m.eyebrow || 'Department',
          category: m.category || 'discipleship',
          category_name: m.category_name || m.eyebrow || 'Ministry',
          summary: m.summary || m.subtitle || 'Dedicated to serving the Lord and empowering lives through spiritual excellence.',
          schedule: m.schedule || 'Sundays & Midweek Services',
          location: m.location || 'Christ Embassy New Benin',
          leader: m.leader || 'Ministry Coordinator',
          image_url: m.image_url ? (m.image_url + (m.image_url.includes('?') ? '&' : '?') + 'v=' + (m.updated_ts || '1')) : 'assets/uploaded_media/WhatsApp_Image_2026-09-17_at_4.36.29_PM.jpeg',
          body: m.body || '',
          href: '#/ministries/' + (m.id || '1')
        }));
    },
    filteredMinistries(){
      return this.ministries.filter(item => {
        const matchesCat = this.selectedCategory === 'all' || item.category === this.selectedCategory;
        if (!matchesCat) return false;
        if (!this.searchQuery.trim()) return true;
        const q = this.searchQuery.trim().toLowerCase();
        return item.title.toLowerCase().includes(q) ||
               item.eyebrow.toLowerCase().includes(q) ||
               item.summary.toLowerCase().includes(q) ||
               (item.schedule && item.schedule.toLowerCase().includes(q)) ||
               (item.location && item.location.toLowerCase().includes(q));
      });
    },
    visibleMinistries(){
      return this.filteredMinistries.slice(0, this.visible);
    },
    hasMore(){
      return this.visible < this.filteredMinistries.length;
    }
  },
  methods:{
    setCategory(catId){
      this.selectedCategory = catId;
    },
    clearSearch(){
      this.searchQuery = '';
    },
    loadMore(){
      this.visible += 6;
    },
    openJoinModal(ministry){
      this.selectedMinistryForJoin = ministry || (this.ministries[0] || null);
      this.joinForm.ministryId = this.selectedMinistryForJoin ? this.selectedMinistryForJoin.id : '';
      this.joinForm.submitted = false;
      this.joinForm.submitting = false;
      this.joinModalOpen = true;
    },
    closeJoinModal(){
      this.joinModalOpen = false;
      this.joinForm.submitted = false;
    },
    submitJoinForm(){
      if (!this.joinForm.name.trim() || !this.joinForm.phone.trim()) {
        alert('Please provide your name and phone/WhatsApp number.');
        return;
      }
      this.joinForm.submitting = true;
      setTimeout(() => {
        this.joinForm.submitting = false;
        this.joinForm.submitted = true;
      }, 700);
    },
    scrollToCatalog(){
      const el = document.getElementById('ministries-catalog');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  },
  template: `
  <div class="ministries-page-wrapper">
    <!-- 1. Hero Section -->
    <section class="ministries-hero" :style="heroStyle">
      <div class="container-wide reveal">
        <div class="ministries-hero-eyebrow">
          <i class="fa-solid fa-crown"></i> {{ pageCms.eyebrow || 'Kingdom Service & Expressions' }}
        </div>
        <h1 class="ministries-hero-title">{{ pageCms.title || 'Our Vibrant Ministries' }}</h1>
        <p class="ministries-hero-subtitle">{{ pageCms.subtitle || 'Discover your divine place of service, grow in spiritual authority, and impact lives through our dynamic church ministries and activity groups.' }}</p>
        
        <div class="ministries-stats-bar">
          <div class="ministries-stat-pill"><i class="fa-solid fa-church"></i> 10+ Active Departments</div>
          <div class="ministries-stat-pill"><i class="fa-solid fa-graduation-cap"></i> Spiritual Mentorship</div>
          <div class="ministries-stat-pill"><i class="fa-solid fa-earth-africa"></i> Soul Winning & Impact</div>
          <div class="ministries-stat-pill"><i class="fa-solid fa-heart-circle-check"></i> Open to Every Member</div>
        </div>

        <div class="mt-4 pt-2 d-flex flex-wrap gap-3">
          <button type="button" @click="scrollToCatalog" class="btn-kingspay-gold py-2.5 px-4 font-bold rounded-pill text-dark shadow-sm border-0 d-inline-flex align-items-center gap-2">
            <span>Explore All Ministries</span>
            <i class="fa-solid fa-arrow-down"></i>
          </button>
          <button type="button" @click="openJoinModal(null)" class="btn-card-share py-2.5 px-4 font-bold rounded-pill text-light border d-inline-flex align-items-center gap-2">
            <i class="fa-solid fa-user-plus"></i>
            <span>Join a Ministry Now</span>
          </button>
        </div>
      </div>
    </section>

    <!-- 2. Controls & Filter Section -->
    <section id="ministries-catalog" class="ministries-filter-section">
      <div class="container-wide">
        <div class="ministries-controls-row">
          <div class="ministry-tabs-wrap">
            <button
              v-for="cat in categories"
              :key="cat.id"
              type="button"
              class="ministry-tab-btn"
              :class="{ active: selectedCategory === cat.id }"
              @click="setCategory(cat.id)"
            >
              <i :class="cat.icon"></i>
              <span>{{ cat.label }}</span>
            </button>
          </div>

          <div class="ministries-search-box">
            <i class="fa-solid fa-magnifying-glass ministries-search-icon"></i>
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search ministries, schedules, tags..."
              class="ministries-search-input"
            />
            <button v-if="searchQuery" type="button" @click="clearSearch" class="ministries-clear-icon" title="Clear search">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. Ministries Grid Section -->
    <section class="section py-5 bg-light">
      <div class="container-wide">
        <div v-if="searchQuery" class="mb-4 text-muted fw-bold d-flex align-items-center gap-2">
          <i class="fa-solid fa-filter text-warning"></i>
          <span>Found {{ filteredMinistries.length }} ministry department(s) matching "{{ searchQuery }}"</span>
          <button type="button" @click="clearSearch" class="btn btn-sm btn-link text-decoration-none p-0 ms-2 text-danger">Reset</button>
        </div>

        <div v-if="!filteredMinistries.length" class="text-center py-5">
          <div class="p-5 bg-white rounded-4 shadow-sm max-w-md mx-auto">
            <i class="fa-solid fa-magnifying-glass text-secondary fa-3x mb-3"></i>
            <h3 class="fw-bold text-dark">No Ministries Found</h3>
            <p class="text-muted">No department matches your current search or filter criteria.</p>
            <button type="button" @click="setCategory('all'); clearSearch();" class="btn-kingspay-gold px-4 py-2 rounded-pill mt-2">
              Show All Ministries
            </button>
          </div>
        </div>

        <div v-else class="ministry-cards-grid">
          <div
            v-for="item in visibleMinistries"
            :key="item.id"
            class="ministry-premium-card"
          >
            <div class="ministry-card-image-box">
              <img :src="item.image_url" :alt="item.title" loading="lazy">
              <div class="ministry-card-badge">{{ item.eyebrow }}</div>
              <div class="ministry-card-cat-tag">{{ item.category_name }}</div>
            </div>

            <div class="ministry-card-body">
              <h3 class="ministry-card-title">{{ item.title }}</h3>
              <p class="ministry-card-summary">{{ item.summary }}</p>

              <div class="ministry-meta-tags">
                <div class="ministry-meta-row" v-if="item.schedule">
                  <i class="fa-regular fa-clock"></i>
                  <span>{{ item.schedule }}</span>
                </div>
                <div class="ministry-meta-row" v-if="item.location">
                  <i class="fa-solid fa-location-dot"></i>
                  <span>{{ item.location }}</span>
                </div>
              </div>

              <div class="ministry-card-actions">
                <a :href="item.href" class="ministry-btn-detail">
                  <span>View Details</span>
                  <i class="fa-solid fa-arrow-right ms-1 text-muted"></i>
                </a>
                <button type="button" @click="openJoinModal(item)" class="ministry-btn-join">
                  <i class="fa-solid fa-user-plus me-1"></i>
                  <span>Join Unit</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="text-center mt-5">
          <button type="button" @click="loadMore" class="btn-kingspay-gold py-3 px-5 rounded-pill fw-bold text-dark border-0 shadow-sm">
            <i class="fa-solid fa-plus me-2"></i> Load More Ministries
          </button>
        </div>
      </div>
    </section>

    <!-- 4. Pathway Section -->
    <section class="ministries-pathway-section">
      <div class="container-wide">
        <div class="text-center max-w-2xl mx-auto mb-5">
          <span class="ministries-hero-eyebrow"><i class="fa-solid fa-stairs"></i> Pathway to Ministry</span>
          <h2 class="title-serif text-white display-5 mb-3">How to Serve with Excellence</h2>
          <p class="text-slate-300 fs-5">There is a designated place for you to belong, grow in spiritual authority, and express your heavenly gifts.</p>
        </div>

        <div class="pathway-grid">
          <div class="pathway-step-card">
            <div class="pathway-step-num">01</div>
            <div class="pathway-icon-circle"><i class="fa-solid fa-compass"></i></div>
            <h3>1. Discover Your Calling</h3>
            <p>Identify your spiritual gifts, artistic passion, or service burden. Whether in worship, media, administration, outreach, or hospitality, God has an assignment for you.</p>
          </div>

          <div class="pathway-step-card">
            <div class="pathway-step-num">02</div>
            <div class="pathway-icon-circle"><i class="fa-solid fa-book-bible"></i></div>
            <h3>2. Foundation School & Orientation</h3>
            <p>Complete our Foundation School discipleship curriculum to be grounded in core doctrine, the new creation in Christ, and our kingdom culture of distinction.</p>
          </div>

          <div class="pathway-step-card">
            <div class="pathway-step-num">03</div>
            <div class="pathway-icon-circle"><i class="fa-solid fa-award"></i></div>
            <h3>3. Deploy & Flourish</h3>
            <p>Be warmly welcomed into your ministry unit, receive hands-on training and spiritual mentorship, and actively demonstrate the supernatural character of the Spirit.</p>
          </div>
        </div>

        <div class="mt-5 pt-4 p-4 p-md-5 rounded-4 border border-warning border-opacity-25" style="background: linear-gradient(135deg, rgba(212,175,55,0.08) 0%, rgba(10,14,26,0.6) 100%);">
          <div class="row align-items-center g-4">
            <div class="col-lg-8">
              <p class="fs-4 text-white fst-italic mb-2 font-serif">"Every member of Christ Embassy is a minister of reconciliation, and every believer is an ambassador of glory. When you serve in God\'s house, you step into uncommon favor and honor."</p>
              <span class="text-warning fw-bold text-uppercase tracking-wider">— Pastor Joseph Atibi-Brown</span>
            </div>
            <div class="col-lg-4 text-lg-end">
              <button type="button" @click="openJoinModal(null)" class="btn-kingspay-gold py-3 px-4 rounded-pill fw-bold text-dark border-0 shadow">
                <i class="fa-solid fa-hand-holding-heart me-2"></i> Join a Ministry Today
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 5. Join Ministry Modal -->
    <div v-if="joinModalOpen" class="ministry-modal-backdrop" @click.self="closeJoinModal">
      <div class="ministry-modal-card">
        <div class="ministry-modal-header">
          <button type="button" class="ministry-modal-close" @click="closeJoinModal" aria-label="Close modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <span class="badge bg-warning text-dark fw-bold text-uppercase px-2.5 py-1 mb-2">Get Involved</span>
          <h3>Join a Church Ministry</h3>
          <p>Take your next step in Kingdom service at Christ Embassy New Benin.</p>
        </div>

        <div class="ministry-modal-body">
          <div v-if="joinForm.submitted" class="ministry-success-box">
            <div class="ministry-success-icon">
              <i class="fa-solid fa-check"></i>
            </div>
            <h3 class="fw-bold text-dark mb-2">Praise God! We Have Received Your Request</h3>
            <p class="text-muted mb-4">Thank you, <b>{{ joinForm.name }}</b>! A ministry coordinator or pastoral leader will contact you shortly via WhatsApp / Phone to welcome you and guide you through the next steps.</p>
            <button type="button" class="btn-kingspay-gold px-4 py-2.5 rounded-pill fw-bold" @click="closeJoinModal">
              Done
            </button>
          </div>

          <form v-else @submit.prevent="submitJoinForm">
            <div class="ministry-form-group">
              <label>Selected Ministry Unit</label>
              <select v-model="joinForm.ministryId" class="ministry-form-input">
                <option v-for="m in ministries" :key="m.id" :value="m.id">{{ m.title }} ({{ m.eyebrow }})</option>
              </select>
            </div>

            <div class="ministry-form-group">
              <label>Your Full Name *</label>
              <input type="text" v-model="joinForm.name" class="ministry-form-input" placeholder="e.g. Brother John Doe" required />
            </div>

            <div class="ministry-form-group">
              <label>WhatsApp / Phone Number *</label>
              <input type="tel" v-model="joinForm.phone" class="ministry-form-input" placeholder="e.g. +234 801 234 5678" required />
            </div>

            <div class="ministry-form-group">
              <label>Email Address</label>
              <input type="email" v-model="joinForm.email" class="ministry-form-input" placeholder="e.g. johndoe@gmail.com" />
            </div>

            <div class="ministry-form-group">
              <label>Experience / Area of Interest (Optional)</label>
              <textarea v-model="joinForm.experience" rows="2" class="ministry-form-input" placeholder="Tell us briefly why you would love to join or any past experience..."></textarea>
            </div>

            <button type="submit" class="ministry-modal-submit" :disabled="joinForm.submitting">
              <span v-if="joinForm.submitting"><i class="fa-solid fa-spinner fa-spin me-2"></i> Submitting...</span>
              <span v-else><i class="fa-solid fa-paper-plane me-2"></i> Submit Ministry Application</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>`
};

const MinistryDetailPage = {
  inject:['cms'],
  data(){
    return {
      joinModalOpen: false,
      joinForm: {
        name: '',
        phone: '',
        email: '',
        experience: '',
        submitting: false,
        submitted: false
      }
    };
  },
  computed:{
    ministryId(){
      return (location.hash.replace('#/','').split('/')[1] || '').trim();
    },
    rawMinistries(){
      return (this.cms && this.cms.home && Array.isArray(this.cms.home.ministries)) ? this.cms.home.ministries : [];
    },
    ministry(){
      const found = this.rawMinistries.find(m => String(m.id) === String(this.ministryId));
      if (found) {
        return {
          id: String(found.id),
          title: found.title || 'Church Ministry',
          eyebrow: found.eyebrow || 'Ministry',
          category: found.category || 'discipleship',
          category_name: found.category_name || found.eyebrow || 'Ministry',
          summary: found.summary || found.subtitle || 'Dedicated to serving the Lord and empowering lives through spiritual excellence.',
          schedule: found.schedule || 'Sundays & Midweek Services',
          location: found.location || 'Christ Embassy New Benin Main Sanctuary',
          leader: found.leader || 'Department Coordinator',
          image_url: found.image_url || 'assets/uploaded_media/WhatsApp_Image_2026-09-17_at_4.36.29_PM.jpeg',
          body: found.body || found.summary || 'Welcome to this vital department of Christ Embassy New Benin.'
        };
      }
      return {
        id: '',
        title: 'Ministry Department',
        eyebrow: 'Christ Embassy New Benin',
        category: 'discipleship',
        category_name: 'Church Ministry',
        summary: 'Department information is being updated.',
        schedule: 'Sundays & Midweek Services',
        location: 'Christ Embassy New Benin',
        leader: 'Pastoral Office',
        image_url: 'assets/uploaded_media/ministries_hero_banner.jpg',
        body: 'Welcome to the ministry departments of Christ Embassy New Benin.'
      };
    },
    heroStyle(){
      const img = this.ministry.image_url || 'assets/uploaded_media/ministries_hero_banner.jpg';
      return {
        backgroundImage: "linear-gradient(180deg, rgba(8, 12, 22, 0.72) 0%, rgba(6, 9, 18, 0.95) 100%), url('" + img + "')",
        backgroundSize: 'cover',
        backgroundPosition: 'center 20%'
      };
    },
    relatedMinistries(){
      return this.rawMinistries
        .filter(m => String(m.id) !== String(this.ministryId))
        .slice(0, 3)
        .map(m => ({
          id: String(m.id),
          title: m.title || 'Ministry',
          eyebrow: m.eyebrow || 'Department',
          image_url: m.image_url || 'assets/uploaded_media/WhatsApp_Image_2026-09-17_at_4.36.29_PM.jpeg',
          summary: m.summary || m.subtitle || '',
          href: '#/ministries/' + m.id
        }));
    }
  },
  methods:{
    openJoinModal(){
      this.joinForm.submitted = false;
      this.joinForm.submitting = false;
      this.joinModalOpen = true;
    },
    closeJoinModal(){
      this.joinModalOpen = false;
      this.joinForm.submitted = false;
    },
    submitJoinForm(){
      if (!this.joinForm.name.trim() || !this.joinForm.phone.trim()) {
        alert('Please provide your name and phone/WhatsApp number.');
        return;
      }
      this.joinForm.submitting = true;
      setTimeout(() => {
        this.joinForm.submitting = false;
        this.joinForm.submitted = true;
      }, 700);
    }
  },
  template: `
  <div class="ministry-detail-wrapper">
    <!-- Detail Hero -->
    <section class="ministry-detail-header" :style="heroStyle">
      <div class="container-wide reveal">
        <div class="ministry-breadcrumb">
          <a href="#/">Home</a>
          <i class="fa-solid fa-chevron-right fa-xs"></i>
          <a href="#/ministries">Ministries</a>
          <i class="fa-solid fa-chevron-right fa-xs"></i>
          <span class="text-white fw-bold">{{ ministry.title }}</span>
        </div>

        <div class="ministries-hero-eyebrow">
          <i class="fa-solid fa-star"></i> {{ ministry.eyebrow }}
        </div>
        <h1 class="ministries-hero-title">{{ ministry.title }}</h1>
        <p class="ministries-hero-subtitle">{{ ministry.summary }}</p>
      </div>
    </section>

    <!-- Detail Content Section -->
    <section class="ministry-detail-content">
      <div class="container-wide">
        <div class="row g-5">
          <!-- Main Description -->
          <div class="col-lg-8">
            <div class="pe-lg-4">
              <h2 class="title-serif text-dark fs-2 mb-4">About This Ministry</h2>
              <div class="lead text-secondary mb-4" style="line-height: 1.8;">
                {{ ministry.body || ministry.summary }}
              </div>

              <div class="p-4 rounded-4 bg-light border my-4">
                <h4 class="fw-bold text-dark mb-3"><i class="fa-solid fa-shield-halved text-warning me-2"></i> Ministry Vision & Core Focus</h4>
                <p class="text-muted mb-0">
                  At Christ Embassy New Benin, our <b>{{ ministry.title }}</b> serves to express the character of the Holy Spirit, build believers in righteousness, and take God's presence to every realm. Members are mentored to operate with spiritual authority, excellence, and dedication.
                </p>
              </div>

              <h3 class="title-serif text-dark fs-3 mt-5 mb-3">Key Responsibilities & Activities</h3>
              <ul class="list-unstyled d-flex flex-column gap-3 mb-5">
                <li class="d-flex align-items-start gap-3">
                  <i class="fa-solid fa-circle-check text-success fs-5 mt-1"></i>
                  <span class="text-dark">Participate in regular rehearsals, meetings, and team briefings.</span>
                </li>
                <li class="d-flex align-items-start gap-3">
                  <i class="fa-solid fa-circle-check text-success fs-5 mt-1"></i>
                  <span class="text-dark">Minister during Sunday Services of Excellence, Wednesday Midweek Services, and special conventions.</span>
                </li>
                <li class="d-flex align-items-start gap-3">
                  <i class="fa-solid fa-circle-check text-success fs-5 mt-1"></i>
                  <span class="text-dark">Engage in personal discipleship, Foundation School, and soul-winning outreaches.</span>
                </li>
                <li class="d-flex align-items-start gap-3">
                  <i class="fa-solid fa-circle-check text-success fs-5 mt-1"></i>
                  <span class="text-dark">Foster strong Christian bonding and mutual fellowship with fellow members.</span>
                </li>
              </ul>

              <div class="d-flex flex-wrap gap-3 align-items-center pt-3 border-top">
                <a href="#/ministries" class="btn btn-outline-secondary px-4 py-2.5 rounded-pill fw-bold">
                  <i class="fa-solid fa-arrow-left me-2"></i> All Church Ministries
                </a>
                <button type="button" @click="openJoinModal" class="btn-kingspay-gold px-4 py-2.5 rounded-pill fw-bold text-dark border-0 shadow">
                  <i class="fa-solid fa-user-plus me-2"></i> Apply to Join {{ ministry.title }}
                </button>
              </div>
            </div>
          </div>

          <!-- Sidebar Info Card -->
          <div class="col-lg-4">
            <div class="ministry-sidebar-card shadow-sm">
              <h4><i class="fa-solid fa-circle-info text-warning me-2"></i> Department Info</h4>
              <ul class="ministry-info-list">
                <li class="ministry-info-item">
                  <i class="fa-regular fa-calendar-check"></i>
                  <div>
                    <strong>Meeting Schedule</strong>
                    <span>{{ ministry.schedule }}</span>
                  </div>
                </li>
                <li class="ministry-info-item">
                  <i class="fa-solid fa-location-dot"></i>
                  <div>
                    <strong>Meeting Venue</strong>
                    <span>{{ ministry.location }}</span>
                  </div>
                </li>
                <li class="ministry-info-item">
                  <i class="fa-solid fa-user-tie"></i>
                  <div>
                    <strong>Department Leadership</strong>
                    <span>{{ ministry.leader }}</span>
                  </div>
                </li>
                <li class="ministry-info-item">
                  <i class="fa-solid fa-layer-group"></i>
                  <div>
                    <strong>Ministry Classification</strong>
                    <span>{{ ministry.category_name }}</span>
                  </div>
                </li>
              </ul>

              <div class="mt-4 pt-3 border-top">
                <button type="button" @click="openJoinModal" class="btn-kingspay-gold w-100 py-3 rounded-3 fw-bold text-dark border-0 shadow-sm">
                  <i class="fa-solid fa-hand-holding-heart me-2"></i> Join This Unit
                </button>
              </div>
            </div>

            <!-- Other Ministries Widget -->
            <div class="ministry-sidebar-card shadow-sm mt-4" v-if="relatedMinistries.length">
              <h4>Other Ministries</h4>
              <div class="d-flex flex-column gap-3">
                <a v-for="rel in relatedMinistries" :key="rel.id" :href="rel.href" class="text-decoration-none d-flex align-items-center gap-3 p-2 rounded-3 hover-bg-light transition">
                  <img :src="rel.image_url" :alt="rel.title" class="rounded-2" style="width: 55px; height: 55px; object-fit: cover; object-position: center 20%;" />
                  <div>
                    <h6 class="text-dark fw-bold mb-1 fs-6">{{ rel.title }}</h6>
                    <span class="badge bg-secondary-subtle text-secondary-emphasis" style="font-size: 0.7rem;">{{ rel.eyebrow }}</span>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Join Modal -->
    <div v-if="joinModalOpen" class="ministry-modal-backdrop" @click.self="closeJoinModal">
      <div class="ministry-modal-card">
        <div class="ministry-modal-header">
          <button type="button" class="ministry-modal-close" @click="closeJoinModal" aria-label="Close modal">
            <i class="fa-solid fa-xmark"></i>
          </button>
          <span class="badge bg-warning text-dark fw-bold text-uppercase px-2.5 py-1 mb-2">Join Unit</span>
          <h3>Join {{ ministry.title }}</h3>
          <p>Complete this brief application to join the team.</p>
        </div>

        <div class="ministry-modal-body">
          <div v-if="joinForm.submitted" class="ministry-success-box">
            <div class="ministry-success-icon">
              <i class="fa-solid fa-check"></i>
            </div>
            <h3 class="fw-bold text-dark mb-2">Application Received!</h3>
            <p class="text-muted mb-4">Thank you, <b>{{ joinForm.name }}</b>! Your interest in <b>{{ ministry.title }}</b> has been registered. Our leadership will contact you shortly.</p>
            <button type="button" class="btn-kingspay-gold px-4 py-2.5 rounded-pill fw-bold" @click="closeJoinModal">
              Done
            </button>
          </div>

          <form v-else @submit.prevent="submitJoinForm">
            <div class="ministry-form-group">
              <label>Your Full Name *</label>
              <input type="text" v-model="joinForm.name" class="ministry-form-input" placeholder="Brother / Sister Name" required />
            </div>

            <div class="ministry-form-group">
              <label>WhatsApp / Phone Number *</label>
              <input type="tel" v-model="joinForm.phone" class="ministry-form-input" placeholder="e.g. +234 801 234 5678" required />
            </div>

            <div class="ministry-form-group">
              <label>Email Address</label>
              <input type="email" v-model="joinForm.email" class="ministry-form-input" placeholder="yourname@domain.com" />
            </div>

            <div class="ministry-form-group">
              <label>Tell Us About Yourself</label>
              <textarea v-model="joinForm.experience" rows="2" class="ministry-form-input" placeholder="Why would you love to serve here? Any past ministry experience?"></textarea>
            </div>

            <button type="submit" class="ministry-modal-submit" :disabled="joinForm.submitting">
              <span v-if="joinForm.submitting"><i class="fa-solid fa-spinner fa-spin me-2"></i> Sending...</span>
              <span v-else><i class="fa-solid fa-paper-plane me-2"></i> Submit Application</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>`
};
const GroupsPage = ContentListPage({slug:'groups', key:'groups', eyebrow:'Groups', title:'Join a Group', single:'Group', detail:true, dark:false});
const GroupDetailPage = ContentDetailPage({slug:'groups', key:'groups', eyebrow:'Groups', title:'Join a Group', single:'Group'});
const LocationsPage = {
  inject: ['cms'],
  data() {
    return {
      searchQuery: '',
      activeCategory: 'all'
    };
  },
  computed: {
    pageCms() {
      return (this.cms && this.cms.pages && this.cms.pages.locations) ? this.cms.pages.locations : {};
    },
    heroImage() {
      return this.pageCms.hero || 'assets/uploaded_media/plan_visit_hero_banner.jpg';
    },
    allLocations() {
      const pageItems = Array.isArray(this.pageCms.items) && this.pageCms.items.length ? this.pageCms.items : [];
      const homeItems = (this.cms && this.cms.home && Array.isArray(this.cms.home.locations)) ? this.cms.home.locations : [];
      const raw = pageItems.length ? pageItems : homeItems;
      return raw.map((loc, idx) => ({
        id: loc.id || String(idx + 1),
        category: loc.category || (loc.is_central ? 'central' : 'satellite'),
        area: loc.area || 'Benin City',
        title: loc.title || 'Christ Embassy Church Center',
        subtitle: loc.subtitle || '',
        address: loc.address || loc.subtitle || 'Benin City, Edo State',
        landmark: loc.landmark || '',
        pastor: loc.pastor || 'Pastor Joseph Atibi-Brown',
        pastor_role: loc.pastor_role || (loc.is_central ? 'Zonal Pastor' : 'Centre Minister'),
        services: Array.isArray(loc.services) && loc.services.length ? loc.services : [
          { day: 'Sunday Service', time: '8:00 AM & 10:00 AM', name: 'Worship Service' },
          { day: 'Wednesday Midweek', time: '6:00 PM', name: 'Midweek Teaching' }
        ],
        phone: loc.phone || (this.cms && this.cms.site && this.cms.site.phone ? this.cms.site.phone : '08024700454'),
        email: loc.email || (this.cms && this.cms.site && this.cms.site.email ? this.cms.site.email : 'Christembassynewbenin@gmail.com'),
        maps_url: loc.maps_url || ('https://maps.google.com/?q=' + encodeURIComponent(loc.address || loc.title)),
        image_url: loc.image_url || 'assets/uploaded_media/WhatsApp_Image_2026-09-17_at_4.27.50_PM.jpeg',
        is_central: Boolean(loc.is_central || loc.category === 'central')
      }));
    },
    flagship() {
      return this.allLocations.find(l => l.is_central) || null;
    },
    filteredLocations() {
      const q = this.searchQuery.trim().toLowerCase();
      return this.allLocations.filter(loc => {
        const matchesCategory = (this.activeCategory === 'all') ||
          (this.activeCategory === 'central' && loc.is_central) ||
          (this.activeCategory === 'satellite' && !loc.is_central);
        const matchesQuery = !q ||
          loc.title.toLowerCase().includes(q) ||
          loc.area.toLowerCase().includes(q) ||
          loc.address.toLowerCase().includes(q) ||
          (loc.landmark && loc.landmark.toLowerCase().includes(q)) ||
          (loc.pastor && loc.pastor.toLowerCase().includes(q));
        return matchesCategory && matchesQuery;
      });
    },
    categories() {
      const total = this.allLocations.length;
      const centrals = this.allLocations.filter(l => l.is_central).length;
      const satellites = this.allLocations.filter(l => !l.is_central).length;
      if (centrals > 0) {
        return [
          { key: 'all', label: `All Sanctuaries (${total})`, icon: 'fa-solid fa-church' },
          { key: 'central', label: 'Central Church (HQ)', icon: 'fa-solid fa-star' },
          { key: 'satellite', label: `Satellite Centers (${satellites})`, icon: 'fa-solid fa-location-crosshairs' }
        ];
      }
      return [
        { key: 'all', label: `All Sanctuaries (${total})`, icon: 'fa-solid fa-church' }
      ];
    }
  },
  template: `
  <div class="locations-page">
    <!-- Sub-Hero Section -->
    <section class="locations-hero sub-hero" :style="{backgroundImage: 'url(' + heroImage + ')'}">
      <div class="container-wide">
        <div class="locations-hero-content">
          <span class="eyebrow-badge"><i class="fa-solid fa-location-dot me-2"></i>{{ pageCms.eyebrow || 'LoveWorld Nation • Sanctuaries & Centers' }}</span>
          <h1 class="locations-hero-title">{{ pageCms.title || 'Our Church Locations' }}</h1>
          <p class="locations-hero-sub">{{ pageCms.subtitle || 'Experience the tangible presence of God, life-transforming teachings, and a warm royal family near you.' }}</p>

          <!-- Interactive Search & Filter Bar -->
          <div class="location-controls-bar">
            <div class="location-search-wrap">
              <i class="fa-solid fa-magnifying-glass search-icon"></i>
              <input type="text" v-model="searchQuery" placeholder="Search by area, street, or landmark (e.g. Lagos Street, Upper Mission 2, GRA)..." class="location-search-input" />
              <button v-if="searchQuery" @click="searchQuery=''" class="search-clear-btn" aria-label="Clear search"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div v-if="categories.length > 1" class="location-filters-row">
              <button v-for="cat in categories" :key="cat.key" :class="['filter-pill', {active: activeCategory === cat.key}]" @click="activeCategory = cat.key">
                <i :class="cat.icon"></i>
                <span>{{ cat.label }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Locations Directory -->
    <section class="locations-directory-section section">
      <div class="container-wide">

        <!-- Flagship Central Church Showcase -->
        <div v-if="flagship && (activeCategory === 'all' || activeCategory === 'central') && !searchQuery" class="flagship-location-card">
          <div class="flagship-badge"><i class="fa-solid fa-award me-2"></i> Central Church & Zonal Headquarters</div>
          <div class="row g-0 align-items-stretch">
            <div class="col-lg-6 flagship-image-col">
              <div class="flagship-image-wrap">
                <img :src="flagship.image_url" :alt="flagship.title" class="flagship-image" loading="lazy" decoding="async" />
                <div class="flagship-image-overlay">
                  <div class="pastor-pill">
                    <i class="fa-solid fa-user-tie text-gold me-2"></i>
                    <span>{{ flagship.pastor }}</span>
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6 flagship-info-col">
              <div class="flagship-body">
                <span class="location-area-tag"><i class="fa-solid fa-map-pin me-1"></i> {{ flagship.area }}</span>
                <h2 class="flagship-title">{{ flagship.title }}</h2>
                <p class="flagship-address"><i class="fa-solid fa-location-dot me-2 text-teal"></i>{{ flagship.address }}</p>
                <p v-if="flagship.landmark" class="flagship-landmark"><i class="fa-solid fa-compass me-2 text-gold"></i><strong>Landmark:</strong> {{ flagship.landmark }}</p>

                <div class="flagship-services">
                  <h6 class="service-schedule-header"><i class="fa-regular fa-clock me-2"></i> Weekly Service Times</h6>
                  <div class="services-chips-grid">
                    <div v-for="(svc, sidx) in flagship.services" :key="sidx" class="service-chip">
                      <span class="chip-day">{{ svc.day }}</span>
                      <strong class="chip-time">{{ svc.time }}</strong>
                      <small class="chip-name">{{ svc.name }}</small>
                    </div>
                  </div>
                </div>

                <div class="flagship-actions">
                  <a href="#/visit" class="btn-flagship-primary"><i class="fa-solid fa-calendar-check me-2"></i> Plan a Visit</a>
                  <a :href="flagship.maps_url" target="_blank" rel="noopener" class="btn-flagship-secondary"><i class="fa-solid fa-diamond-turn-right me-2"></i> Get Directions</a>
                  <a href="#/live" class="btn-flagship-live"><i class="fa-solid fa-tower-broadcast me-2"></i> Watch Live</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Section Heading for Satellites / All -->
        <div class="locations-grid-header">
          <div class="d-flex justify-content-between align-items-center flex-wrap gap-3">
            <div>
              <h3 class="locations-subheading">
                <span v-if="activeCategory === 'central'">Central Church Location</span>
                <span v-else-if="activeCategory === 'satellite'">Satellite Fellowship Centers</span>
                <span v-else>All Church Locations & Fellowships</span>
              </h3>
              <p class="text-muted small m-0">Showing {{ filteredLocations.length }} sanctuary location{{ filteredLocations.length === 1 ? '' : 's' }}</p>
            </div>
            <div v-if="searchQuery" class="active-query-pill">
              <span>Results for "{{ searchQuery }}"</span>
              <button @click="searchQuery=''" class="btn-clear-query"><i class="fa-solid fa-xmark"></i></button>
            </div>
          </div>
        </div>

        <!-- Locations Grid -->
        <div v-if="filteredLocations.length" class="locations-grid">
          <div v-for="loc in filteredLocations" :key="loc.id" :class="['location-card', { 'is-central-card': loc.is_central }]">
            <div class="location-card-image-wrap">
              <img :src="loc.image_url" :alt="loc.title" class="location-card-image" loading="lazy" decoding="async" />
              <div class="location-card-badges">
                <span class="area-badge">{{ loc.area }}</span>
                <span v-if="loc.is_central" class="hq-badge"><i class="fa-solid fa-star"></i> HQ</span>
              </div>
            </div>

            <div class="location-card-body">
              <h4 class="location-card-title">{{ loc.title }}</h4>
              <p class="location-card-address"><i class="fa-solid fa-location-dot text-teal me-2"></i>{{ loc.address }}</p>
              <p v-if="loc.landmark" class="location-card-landmark"><i class="fa-solid fa-compass text-gold me-2"></i>{{ loc.landmark }}</p>

              <!-- Services List -->
              <div class="location-card-services">
                <div v-for="(svc, sidx) in loc.services" :key="sidx" class="service-row">
                  <span class="service-label">{{ svc.day }}:</span>
                  <span class="service-time">{{ svc.time }}</span>
                </div>
              </div>

              <!-- Minister in Charge -->
              <div class="location-card-pastor" v-if="loc.pastor">
                <i class="fa-solid fa-user-check text-gold me-2"></i>
                <div>
                  <strong class="pastor-name">{{ loc.pastor }}</strong>
                  <span class="pastor-role">{{ loc.pastor_role }}</span>
                </div>
              </div>
            </div>

            <!-- Card Actions Footer -->
            <div class="location-card-footer">
              <a :href="loc.maps_url" target="_blank" rel="noopener" class="btn-card-dir" title="Open in Google Maps">
                <i class="fa-solid fa-diamond-turn-right me-1"></i> Directions
              </a>
              <a :href="'tel:' + loc.phone" class="btn-card-call" title="Call Church">
                <i class="fa-solid fa-phone me-1"></i> Call
              </a>
              <a href="#/visit" class="btn-card-visit" title="Plan a Visit">
                Plan Visit
              </a>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-else class="locations-empty-state">
          <div class="empty-icon"><i class="fa-solid fa-map-location-dot"></i></div>
          <h4>No Locations Found</h4>
          <p class="text-muted">No church centers matched your search query "{{ searchQuery }}".</p>
          <button @click="searchQuery=''; activeCategory='all'" class="btn-brand btn-sm mt-2">View All Locations</button>
        </div>

        <!-- Cell Fellowship Support Callout Banner -->
        <div class="cell-support-banner mt-5">
          <div class="row align-items-center g-4">
            <div class="col-lg-8">
              <span class="badge-cell-group"><i class="fa-solid fa-people-roof me-2"></i> Home Cell Fellowship Network</span>
              <h3 class="cell-banner-title">Can\'t find a center on your street?</h3>
              <p class="cell-banner-text">We have hundreds of vibrant Cell Fellowship assemblies meeting in homes and communities across Benin City every week. Join a family near your residence for spiritual growth and fellowship.</p>
            </div>
            <div class="col-lg-4 text-lg-end">
              <div class="d-flex flex-column flex-sm-row gap-2 justify-content-lg-end">
                <a href="#/groups" class="btn-brand"><i class="fa-solid fa-users me-2"></i> Join a Cell Group</a>
                <a href="#/visit" class="btn-outline-brand"><i class="fa-solid fa-envelope me-2"></i> Contact Office</a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>`
};
const EventsPage = {
  inject:['cms'],
  data(){return {visible:8, searchQuery:'', activeCategory:'all'}},
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.events) ? this.cms.pages.events : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : (this.heroImage ? {backgroundImage:'url('+this.heroImage+')'} : {}); },
    events(){ return this.normalizeEvents(this.cms && this.cms.home && Array.isArray(this.cms.home.events) ? this.cms.home.events : []); },
    upcomingEvent(){ return (this.cms && this.cms.home && this.cms.home.upcoming_event) ? this.cms.home.upcoming_event : null; },
    categories(){
      const cats = [{key:'all', label:'All Events', icon:'fa-solid fa-calendar-days'}];
      const seen = new Set();
      this.events.forEach(e => {
        if(e.category && !seen.has(e.category)){
          seen.add(e.category);
          const labels = {weekly:'Weekly Services',special:'Special Gatherings',global:'Global Events'};
          const icons = {weekly:'fa-solid fa-repeat',special:'fa-solid fa-star',global:'fa-solid fa-globe'};
          cats.push({key:e.category, label:labels[e.category]||e.category, icon:icons[e.category]||'fa-solid fa-tag'});
        }
      });
      return cats;
    },
    filteredEvents(){
      let list = this.events;
      if(this.activeCategory !== 'all'){
        list = list.filter(e => e.category === this.activeCategory);
      }
      if(this.searchQuery.trim()){
        const q = this.searchQuery.trim().toLowerCase();
        list = list.filter(e => (e.title && e.title.toLowerCase().includes(q)) || (e.summary && e.summary.toLowerCase().includes(q)) || (e.event_date && e.event_date.toLowerCase().includes(q)) || (e.location && e.location.toLowerCase().includes(q)));
      }
      return list;
    },
    visibleEvents(){ return this.filteredEvents.slice(0, this.visible); },
    hasMore(){ return this.visible < this.filteredEvents.length; },
    heroImage(){ return (this.events[0] && this.events[0].image_url) || ''; },
    featuredEvent(){
      const special = this.events.find(e => e.category === 'special' || e.category === 'global');
      return special || this.events[0] || null;
    },
    serviceTimes(){
      return [
        {day:'Sunday', time:'1st Service: 7:30 AM  •  2nd Service: 9:30 AM', name:'Sunday Service of Excellence', icon:'fa-solid fa-sun'},
        {day:'Wednesday', time:'6:00 PM WAT', name:'Mid-Week Service & Faith Clinic', icon:'fa-solid fa-book-bible'},
        {day:'Friday', time:'5:00 PM WAT', name:'An Hour With God — Prayer Service', icon:'fa-solid fa-hands-praying'},
        {day:'Saturday', time:'10:00 AM WAT', name:'Unending Praise Sessions', icon:'fa-solid fa-music'}
      ];
    }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    normalizeEvents(items){
      return items
        .filter(item => item && item.id)
        .map(item => ({
          id: item.id,
          eyebrow: item.eyebrow || 'Event',
          title: item.title || 'Event',
          subtitle: item.subtitle || '',
          summary: item.summary || item.subtitle || '',
          body: item.body || '',
          event_date: item.event_date || '',
          time_text: item.time_text || '',
          date_badge: item.date_badge || 'EVENT',
          location: item.location || '',
          category: item.category || 'special',
          image_url: this.cacheAsset(item.image_url, item.updated_ts),
          href: '#/events/' + item.id
        }));
    },
    setCategory(key){ this.activeCategory = key; this.visible = 8; },
    loadMore(){ this.visible += 8; },
    getCategoryLabel(cat){
      const labels = {weekly:'Weekly',special:'Special',global:'Global'};
      return labels[cat] || cat;
    }
  },
  template:`
  <div>
    <!-- Hero -->
    <section class="events-hero" :style="heroStyle">
      <div class="container-wide">
        <div class="events-hero-eyebrow"><i class="fa-solid fa-calendar-star"></i> {{pageCms.eyebrow || 'Church Calendar & Gatherings'}}</div>
        <h1 class="events-hero-title">{{pageCms.title || 'Events & Services'}}</h1>
        <p class="events-hero-subtitle">{{pageCms.subtitle || 'Join us for Spirit-filled worship services, powerful prayer conferences, and joyful fellowship gatherings.'}}</p>
        <div style="display:flex;gap:12px;flex-wrap:wrap">
          <a href="#" @click.prevent="$el.querySelector('.events-filter-section') && $el.querySelector('.events-filter-section').scrollIntoView({behavior:'smooth'})" class="btn-brand" style="display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;background:linear-gradient(135deg,#177a87,#0e5f6b);color:#fff;font-weight:700;font-size:.95rem;text-decoration:none;box-shadow:0 6px 18px rgba(23,122,135,.35)"><i class="fa-solid fa-calendar-days"></i> Browse All Events</a>
          <a href="#/visit" class="btn-outline" style="display:inline-flex;align-items:center;gap:8px;padding:14px 28px;border-radius:12px;border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:700;font-size:.95rem;text-decoration:none;backdrop-filter:blur(6px)"><i class="fa-solid fa-map-location-dot"></i> Plan Your Visit</a>
        </div>
      </div>
    </section>

    <!-- Sticky Filter Bar -->
    <section class="events-filter-section">
      <div class="container-wide">
        <div class="events-controls-row">
          <div class="event-tabs-wrap">
            <button v-for="cat in categories" :key="cat.key" type="button" class="event-tab-btn" :class="{active: activeCategory===cat.key}" @click="setCategory(cat.key)"><i :class="cat.icon"></i> {{cat.label}}</button>
          </div>
          <div class="events-search-box">
            <i class="fa-solid fa-magnifying-glass events-search-icon"></i>
            <input type="text" v-model="searchQuery" placeholder="Search events..." class="events-search-input">
            <button v-if="searchQuery" type="button" @click="searchQuery=''" class="events-clear-icon"><i class="fa-solid fa-xmark"></i></button>
          </div>
        </div>
      </div>
    </section>

    <!-- Events Grid -->
    <section style="padding:60px 0 80px;background:#fff">
      <div class="container-wide">

        <!-- Featured Spotlight -->
        <div v-if="featuredEvent && activeCategory==='all' && !searchQuery" class="event-featured-spotlight">
          <div class="event-featured-inner">
            <div class="event-featured-image">
              <img :src="featuredEvent.image_url" :alt="featuredEvent.title">
            </div>
            <div class="event-featured-body">
              <div class="event-featured-badge"><i class="fa-solid fa-fire"></i> Featured Event</div>
              <h2>{{featuredEvent.title}}</h2>
              <p>{{featuredEvent.summary}}</p>
              <div class="event-featured-meta">
                <div class="event-featured-meta-row" v-if="featuredEvent.event_date"><i class="fa-regular fa-calendar"></i> {{featuredEvent.event_date}}</div>
                <div class="event-featured-meta-row" v-if="featuredEvent.time_text"><i class="fa-regular fa-clock"></i> {{featuredEvent.time_text}}</div>
                <div class="event-featured-meta-row" v-if="featuredEvent.location"><i class="fa-solid fa-location-dot"></i> {{featuredEvent.location}}</div>
              </div>
              <a :href="featuredEvent.href" class="event-card-cta" style="width:fit-content"><i class="fa-solid fa-arrow-right"></i> View Full Details</a>
            </div>
          </div>
        </div>

        <!-- Search Results Count -->
        <div v-if="searchQuery" style="margin-bottom:24px;font-size:.92rem;color:#64748b;font-weight:600"><span style="color:#177a87">{{filteredEvents.length}}</span> event(s) matching "{{searchQuery}}"</div>

        <!-- No Results -->
        <div v-if="!filteredEvents.length" style="text-align:center;padding:80px 20px">
          <i class="fa-solid fa-calendar-xmark" style="font-size:3rem;color:#cbd5e1;margin-bottom:20px;display:block"></i>
          <h3 style="font-size:1.5rem;color:#334155;margin-bottom:10px">No events found</h3>
          <p style="color:#64748b">Try adjusting your search or filter criteria.</p>
          <button type="button" @click="searchQuery='';activeCategory='all'" style="margin-top:18px;padding:10px 24px;border-radius:10px;background:#177a87;color:#fff;border:none;font-weight:700;cursor:pointer">Reset Filters</button>
        </div>

        <!-- Cards Grid -->
        <div v-else class="event-premium-grid">
          <div v-for="event in visibleEvents" :key="event.id" class="event-premium-card">
            <div class="event-card-img-wrap">
              <img :src="event.image_url" :alt="event.title">
              <div class="event-card-date-badge">{{event.date_badge}}</div>
              <div class="event-card-type-tag">{{getCategoryLabel(event.category)}}</div>
            </div>
            <div class="event-card-body">
              <div class="event-card-title">{{event.title}}</div>
              <div class="event-card-summary">{{event.summary}}</div>
              <div class="event-card-meta-strip">
                <div class="event-card-meta-row" v-if="event.event_date"><i class="fa-regular fa-calendar"></i> {{event.event_date}}</div>
                <div class="event-card-meta-row" v-if="event.time_text"><i class="fa-regular fa-clock"></i> {{event.time_text}}</div>
                <div class="event-card-meta-row" v-if="event.location"><i class="fa-solid fa-location-dot"></i> {{event.location}}</div>
              </div>
              <a :href="event.href" class="event-card-cta"><i class="fa-solid fa-arrow-right"></i> View Details</a>
            </div>
          </div>
        </div>

        <div class="text-center" style="margin-top:40px" v-if="hasMore"><button type="button" class="btn-outline-brand" @click="loadMore" style="padding:14px 36px;border-radius:12px;font-weight:700">Load More Events</button></div>
      </div>
    </section>

    <!-- Service Times Banner -->
    <section class="events-service-times-section">
      <div class="container-wide">
        <div style="text-align:center;margin-bottom:50px">
          <div class="events-hero-eyebrow" style="margin:0 auto 16px"><i class="fa-regular fa-clock"></i> Weekly Schedule</div>
          <h2 style="font-family:var(--title-font,'Cormorant Garamond',serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:700;color:#fff;margin-bottom:12px">Regular Service Times</h2>
          <p style="color:#94a3b8;max-width:600px;margin:0 auto;font-size:1rem">Join us throughout the week for worship, prayer, and fellowship.</p>
        </div>
        <div class="service-times-grid">
          <div v-for="st in serviceTimes" :key="st.day" class="service-time-block">
            <div class="service-time-day"><i :class="st.icon"></i> {{st.day}}</div>
            <h3 style="font-size:1.15rem;font-weight:800;color:#fff;margin:0 0 8px;line-height:1.3">{{st.name}}</h3>
            <p style="color:#94a3b8;font-size:.88rem;margin:0">{{st.time}}</p>
          </div>
        </div>
      </div>
    </section>
  </div>`
};

const StorePage = {
  inject:['cms'],
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.store) ? this.cms.pages.store : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    sermons(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons.slice(0, 3) : []; },
    events(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.events) ? this.cms.home.events.slice(0, 3) : []; }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageCms.eyebrow || 'Store'}}</div><h1 class="title-serif">{{pageCms.title || 'Store'}}</h1><p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p></div></section>
    <section class="section store-page-section"><div class="container-wide">
      <div class="split-heading"><div><div class="eyebrow">Resources</div><h2 class="title-mid">Church resources and featured content.</h2></div><div class="text-lg-end"><a href="#/give" class="btn-outline-darkbrand">Give Online</a></div></div>
      <div v-if="pageCms.body" class="cms-body store-body" v-html="pageCms.body"></div>
      <div class="content-card-grid mt-4">
        <a href="#/watch" class="content-list-card"><div class="content-list-body"><span class="tag">Watch</span><h3>Messages</h3><p>Catch up on the latest sermons and media from the church.</p><b>Open Watch -></b></div></a>
        <a href="#/events" class="content-list-card"><div class="content-list-body"><span class="tag">Events</span><h3>Upcoming Events</h3><p>See the next meetings, services, and special gatherings.</p><b>View Events -></b></div></a>
        <a href="#/give" class="content-list-card"><div class="content-list-body"><span class="tag">Giving</span><h3>Support the Work</h3><p>Give securely and support the mission of the church.</p><b>Give Now -></b></div></a>
      </div>
    </div></section>
  </div>`
};
const CURRENCIES = [
  { code: 'NGN', symbol: '₦', flag: '🇳🇬', label: 'NGN (₦)', name: 'Nigerian Naira', presets: [5000, 10000, 25000, 50000, 100000, 250000], defaultVal: 10000 },
  { code: 'USD', symbol: '$', flag: '🇺🇸', label: 'USD ($)', name: 'US Dollar', presets: [25, 50, 100, 250, 500, 1000], defaultVal: 50 },
  { code: 'GBP', symbol: '£', flag: '🇬🇧', label: 'GBP (£)', name: 'British Pound', presets: [20, 50, 100, 250, 500, 1000], defaultVal: 50 },
  { code: 'EUR', symbol: '€', flag: '🇪🇺', label: 'EUR (€)', name: 'Euro', presets: [25, 50, 100, 250, 500, 1000], defaultVal: 50 },
  { code: 'CAD', symbol: 'CA$', flag: '🇨🇦', label: 'CAD ($)', name: 'Canadian Dollar', presets: [25, 50, 100, 250, 500, 1000], defaultVal: 50 }
];

const GivePage = {
  inject:['cms'],
  data(){
    return {
      selectedCurrency: 'NGN',
      amount: 10000,
      customAmount: '',
      donorName: '',
      donorEmail: '',
      donorPhone: '',
      giveTowards: 'Tithe',
      frequency: 'One Time',
      paymentMethod: 'Bank Transfer',
      note: '',
      error: '',
      copiedKey: ''
    };
  },
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.give) ? this.cms.pages.give : {}; },
    heroStyle(){
      const hero = this.pageCms.hero || 'assets/uploaded_media/giving_hero_banner.jpg';
      return { backgroundImage: `linear-gradient(rgba(10, 14, 23, 0.75), rgba(10, 14, 23, 0.9)), url(${hero})` };
    },
    currencies(){ return CURRENCIES; },
    currentCurrency(){
      return CURRENCIES.find(c => c.code === this.selectedCurrency) || CURRENCIES[0];
    },
    currencyPresets(){
      return this.currentCurrency.presets;
    },
    selectedAmount(){
      const val = this.customAmount !== '' ? this.customAmount : this.amount;
      const parsed = parseFloat(val);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    },
    amountFormatted(){
      const sym = this.currentCurrency.symbol;
      if (this.selectedCurrency === 'NGN') {
        return sym + this.selectedAmount.toLocaleString('en-NG', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
      }
      return sym + this.selectedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    amountLabel(){
      return `${this.amountFormatted} ${this.selectedCurrency}`;
    },
    paypalRecipient(){
      return (this.cms && this.cms.site && this.cms.site.paypal_email) ? this.cms.site.paypal_email.trim() : (this.pageCms.paypal_email || '');
    },
    paypalMeUrl(){
      const value = this.paypalRecipient;
      return /paypal\.com\/paypalme\//i.test(value) || /paypal\.me\//i.test(value) ? value : '';
    },
    giveCategories(){
      return (this.pageCms && Array.isArray(this.pageCms.categories) && this.pageCms.categories.length)
        ? this.pageCms.categories
        : ['Tithe', 'Partnership Seed', 'General Offering', 'First Fruits', 'Church Building Seed', 'Thanksgiving Seed', 'Pastor\'s Seed', 'Healing School Seed', 'Rhapsody Outreach'];
    },
    allBanks(){
      return (this.pageCms && Array.isArray(this.pageCms.bank_details)) ? this.pageCms.bank_details : [];
    },
    relevantBanks(){
      const cur = this.selectedCurrency;
      const matched = this.allBanks.filter(b => b.currency === cur);
      if (matched.length) return matched;
      return this.allBanks;
    },
    kingspayCode(){
      return this.pageCms.kingspay_code || 'CENEWBENIN';
    },
    scriptures(){
      return (this.pageCms && Array.isArray(this.pageCms.scriptures) && this.pageCms.scriptures.length)
        ? this.pageCms.scriptures
        : [
            {
              reference: '2 Corinthians 9:7-8',
              text: 'Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver. And God is able to make all grace abound toward you...'
            },
            {
              reference: 'Luke 6:38',
              text: 'Give, and it shall be given unto you; good measure, pressed down, and shaken together, and running over, shall men give into your bosom.'
            },
            {
              reference: 'Philippians 4:19',
              text: 'But my God shall supply all your need according to his riches in glory by Christ Jesus.'
            }
          ];
    },
    partnershipArms(){
      return (this.pageCms && Array.isArray(this.pageCms.partnership_arms) && this.pageCms.partnership_arms.length)
        ? this.pageCms.partnership_arms
        : [
            { title: 'Rhapsody of Realities', tag: 'Global Reach', description: 'Sponsoring the translation and distribution of the Daily Devotional across all languages and nations.', icon: 'fa-solid fa-book-open-reader' },
            { title: 'Healing School', tag: 'Divine Health', description: 'Taking God\'s miraculous healing power to the sick and demonstrating divine life across the world.', icon: 'fa-solid fa-hand-holding-heart' },
            { title: 'InnerCity Mission', tag: 'Love in Action', description: 'Providing food, education, shelter, and hope to indigent children and vulnerable families.', icon: 'fa-solid fa-child-reaching' },
            { title: 'Sanctuary & Media Advancement', tag: 'Excellence', description: 'Expanding our church auditorium, live broadcast infrastructure, and digital soul-winning networks.', icon: 'fa-solid fa-tower-broadcast' }
          ];
    },
    impactBanner(){
      return this.pageCms.impact_banner || 'assets/uploaded_media/partnership_outreach_banner.jpg';
    }
  },
  methods:{
    selectCurrency(code){
      this.selectedCurrency = code;
      const c = CURRENCIES.find(item => item.code === code) || CURRENCIES[0];
      this.amount = c.defaultVal;
      this.customAmount = '';
      this.error = '';
      if (code === 'NGN') {
        if (this.paymentMethod === 'PayPal') this.paymentMethod = 'Bank Transfer';
      } else {
        if (this.paymentMethod === 'KingsPay') this.paymentMethod = 'PayPal';
      }
    },
    setAmount(value){
      this.amount = value;
      this.customAmount = '';
      this.error = '';
    },
    formatVal(num){
      const sym = this.currentCurrency.symbol;
      if (num >= 1000) {
        return sym + num.toLocaleString('en-US');
      }
      return sym + num;
    },
    copyText(text, key){
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.copiedKey = key;
          setTimeout(() => { if (this.copiedKey === key) this.copiedKey = ''; }, 2500);
        }).catch(() => {
          this.fallbackCopy(text, key);
        });
      } else {
        this.fallbackCopy(text, key);
      }
    },
    fallbackCopy(text, key){
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.copiedKey = key;
        setTimeout(() => { if (this.copiedKey === key) this.copiedKey = ''; }, 2500);
      } catch (e) {}
      document.body.removeChild(textarea);
    },
    paypalMePaymentUrl(){
      const base = this.paypalMeUrl.replace(/\/+$/, '');
      return base + '/' + this.selectedAmount.toFixed(2) + this.selectedCurrency;
    },
    submitGiving(){
      if (this.paymentMethod === 'PayPal') {
        if (!this.paypalRecipient) {
          this.error = 'PayPal recipient email/link has not been configured.';
          return;
        }
        if (this.selectedAmount < 1) {
          this.error = 'Please enter a giving amount of at least 1 ' + this.selectedCurrency;
          return;
        }
        this.error = '';
        if (this.paypalMeUrl) {
          window.location.href = this.paypalMePaymentUrl();
          return;
        }
        this.$refs.paypalForm.submit();
      } else if (this.paymentMethod === 'Bank Transfer') {
        const el = document.getElementById('bank-details-anchor');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (this.relevantBanks.length && this.relevantBanks[0].account_number) {
          this.copyText(this.relevantBanks[0].account_number, 'acc_0');
        }
      } else if (this.paymentMethod === 'KingsPay') {
        this.copyText(this.kingspayCode, 'kingspay_main');
      }
    }
  },
  template:`
  <div>
    <!-- Hero Section with Background Banner -->
    <section class="sub-hero give-hero" :style="heroStyle">
      <div class="container-wide reveal">
        <div class="give-hero-badge"><i class="fa-solid fa-hand-holding-heart me-2"></i> {{pageCms.eyebrow || 'Online Giving & Partnership'}}</div>
        <h1 class="title-serif">{{pageCms.title || 'Online Giving & Partnership'}}</h1>
        <p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p>
      </div>
    </section>

    <!-- Main Content Layout -->
    <section class="section give-page-section">
      <div class="container-wide">
        <div class="give-layout">

          <!-- Left Column: Visual Storytelling, Impact, Partnership Pillars, Scriptures -->
          <div class="give-content-column">

            <!-- Impact & Vision Feature Card with Quality Outreach Banner -->
            <div class="give-impact-card">
              <div class="give-impact-image-wrap">
                <img :src="impactBanner" alt="Partnership & Community Impact" class="give-impact-img">
                <div class="give-impact-overlay">
                  <span class="impact-badge"><i class="fa-solid fa-earth-africa me-1"></i> Propagating the Gospel Across Benin City & Nations</span>
                </div>
              </div>
              <div class="give-impact-body">
                <div class="eyebrow text-gold"><i class="fa-solid fa-seedling me-1"></i> Purpose of Your Giving</div>
                <h3 class="give-section-heading">Connecting Seeds to Transformed Lives</h3>
                <p class="give-intro-text">
                  {{pageCms.body || 'Your giving and partnership drive global soul-winning, community outreaches, free distribution of Rhapsody of Realities, and ministry advancement. Every seed sown produces a boundless harvest of righteousness in your life and eternal impact across nations.'}}
                </p>
              </div>
            </div>

            <!-- Partnership Arms Grid (4 Pillars) -->
            <div class="give-pillars-section mt-4">
              <div class="split-heading mb-3">
                <div>
                  <div class="eyebrow">Ministry Reach</div>
                  <h3 class="title-mid" style="font-size: 1.45rem;">Pillars of Our Partnership</h3>
                </div>
              </div>
              <div class="partnership-pillars-grid">
                <div v-for="arm in partnershipArms" :key="arm.title" class="pillar-card">
                  <div class="pillar-header">
                    <div class="pillar-icon-box"><i :class="arm.icon"></i></div>
                    <span class="pillar-tag">{{arm.tag}}</span>
                  </div>
                  <h4 class="pillar-title">{{arm.title}}</h4>
                  <p class="pillar-desc">{{arm.description}}</p>
                </div>
              </div>
            </div>

            <!-- Scriptural Promises & Covenant On Giving -->
            <div class="scriptures-section mt-5">
              <div class="eyebrow"><i class="fa-solid fa-book-bible me-1"></i> God's Word on Giving</div>
              <h3 class="title-mid mb-3" style="font-size: 1.45rem;">Scriptural Foundations & Blessings</h3>
              <div class="scripture-cards-stack">
                <div v-for="sc in scriptures" :key="sc.reference" class="scripture-card">
                  <div class="scripture-icon"><i class="fa-solid fa-quote-left"></i></div>
                  <div class="scripture-body">
                    <p class="scripture-quote">"{{sc.text}}"</p>
                    <cite class="scripture-ref">— {{sc.reference}}</cite>
                  </div>
                </div>
              </div>
            </div>

            <!-- KingsPay Spotlight Card -->
            <div class="kingspay-promo-card mt-5">
              <div class="kingspay-promo-inner">
                <div class="kingspay-logo-col">
                  <div class="kingspay-emblem"><i class="fa-solid fa-crown"></i></div>
                  <div>
                    <h4 class="m-0 fw-bold text-white">KingsPay Digital Giving</h4>
                    <small class="text-warning">Official LoveWorld Payment Portal</small>
                  </div>
                </div>
                <div class="kingspay-code-row">
                  <div class="code-box">
                    <span class="code-label">RECIPIENT CODE:</span>
                    <strong class="code-value">{{kingspayCode}}</strong>
                  </div>
                  <button type="button" class="btn-copy-code" @click="copyText(kingspayCode, 'kp_card_code')">
                    <i :class="copiedKey === 'kp_card_code' ? 'fa-solid fa-check text-success' : 'fa-solid fa-copy'"></i>
                    {{copiedKey === 'kp_card_code' ? 'Copied!' : 'Copy Code'}}
                  </button>
                </div>
              </div>
              <p class="kingspay-hint">Pay directly inside the KingsPay app or via kingspayweb.com using recipient code <b>{{kingspayCode}}</b>.</p>
            </div>

          </div>

          <!-- Right Column: Interactive Multi-Currency Giving Console -->
          <div class="give-panel-column">
            <div class="give-panel paypal-give-panel">

              <!-- Panel Header -->
              <div class="panel-header-badge">
                <div class="d-flex align-items-center justify-content-between">
                  <span class="portal-badge"><i class="fa-solid fa-shield-halved"></i> SECURE GIVING PORTAL</span>
                  <span class="currency-tag-indicator">{{currentCurrency.name}}</span>
                </div>
                <h3 class="give-panel-title mt-2">Give Online</h3>
                <p class="give-panel-sub">Select your preferred currency and payment method below.</p>
              </div>

              <!-- Currency Selector Pills -->
              <div class="currency-selector-wrap">
                <label class="give-label">1. Select Currency</label>
                <div class="currency-pill-grid">
                  <button 
                    type="button" 
                    v-for="c in currencies" 
                    :key="c.code" 
                    class="currency-pill-btn" 
                    :class="{active: selectedCurrency === c.code}"
                    @click="selectCurrency(c.code)"
                  >
                    <span class="currency-flag">{{c.flag}}</span>
                    <span class="currency-code">{{c.code}}</span>
                    <span class="currency-sym">({{c.symbol}})</span>
                  </button>
                </div>
              </div>

              <!-- Preset Amounts Grid -->
              <div class="amount-presets-wrap">
                <label class="give-label">2. Select Amount ({{selectedCurrency}})</label>
                <div class="amount-grid">
                  <button 
                    type="button" 
                    v-for="val in currencyPresets" 
                    :key="val" 
                    :class="{active: customAmount === '' && amount === val}" 
                    @click="setAmount(val)"
                  >
                    {{formatVal(val)}}
                  </button>
                </div>
              </div>

              <!-- Custom Amount Input -->
              <div class="custom-amount-wrap">
                <label class="give-label">Or Enter Custom Amount ({{selectedCurrency}})</label>
                <div class="input-with-symbol">
                  <span class="currency-prefix">{{currentCurrency.symbol}}</span>
                  <input 
                    v-model="customAmount" 
                    type="number" 
                    min="1" 
                    step="any" 
                    :placeholder="'Enter ' + selectedCurrency + ' amount'"
                    class="custom-amount-input"
                  >
                </div>
              </div>

              <!-- Purpose & Frequency -->
              <div class="give-form-row">
                <div>
                  <label class="give-label">3. Give Towards</label>
                  <select v-model="giveTowards" class="give-select">
                    <option v-for="cat in giveCategories" :key="cat">{{cat}}</option>
                  </select>
                </div>
                <div>
                  <label class="give-label">Frequency</label>
                  <select v-model="frequency" class="give-select">
                    <option>One Time</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              <!-- Donor Details -->
              <div class="give-form-row">
                <div>
                  <label class="give-label">Your Name</label>
                  <input v-model="donorName" type="text" placeholder="Full name" class="give-input">
                </div>
                <div>
                  <label class="give-label">Phone Number</label>
                  <input v-model="donorPhone" type="tel" placeholder="e.g. +234..." class="give-input">
                </div>
              </div>

              <label class="give-label">Email Address (for receipt)</label>
              <input v-model="donorEmail" type="email" placeholder="you@example.com" class="give-input">

              <!-- Payment Method Selector -->
              <label class="give-label">4. Payment Method</label>
              <div class="payment-methods">
                <button 
                  type="button" 
                  :class="{active: paymentMethod === 'Bank Transfer'}" 
                  @click="paymentMethod = 'Bank Transfer'; error = ''"
                >
                  <i class="fa-solid fa-building-columns me-1"></i> Bank Transfer
                </button>
                <button 
                  type="button" 
                  :class="{active: paymentMethod === 'KingsPay'}" 
                  @click="paymentMethod = 'KingsPay'; error = ''"
                >
                  <i class="fa-solid fa-crown me-1"></i> KingsPay
                </button>
                <button 
                  type="button" 
                  :class="{active: paymentMethod === 'PayPal'}" 
                  @click="paymentMethod = 'PayPal'; error = ''"
                >
                  <i class="fa-brands fa-paypal me-1"></i> PayPal / Card
                </button>
              </div>

              <label class="give-label">Optional Note / Prayer Request</label>
              <input v-model="note" type="text" placeholder="Add note or testimony" class="give-input">

              <!-- Total Giving Summary Card -->
              <div class="give-total-card">
                <div class="total-label-col">
                  <span>Total Contribution</span>
                  <small>{{giveTowards}} • {{frequency}}</small>
                </div>
                <div class="total-amount-val">{{amountLabel}}</div>
              </div>

              <div v-if="error" class="alert alert-danger mt-3">{{error}}</div>

              <!-- Dynamic Bank Transfer Section -->
              <div v-if="paymentMethod === 'Bank Transfer'" id="bank-details-anchor" class="bank-accounts-panel mt-3">
                <div class="bank-panel-head">
                  <i class="fa-solid fa-building-columns text-warning me-2"></i>
                  <b>{{selectedCurrency}} Designated Bank Accounts</b>
                </div>
                <div class="bank-cards-list">
                  <div v-for="(b, idx) in relevantBanks" :key="idx" class="bank-account-card">
                    <div class="bank-card-top">
                      <div>
                        <span class="bank-label-tag">{{b.label || b.currency + ' Account'}}</span>
                        <h4 class="bank-name">{{b.bank_name}}</h4>
                      </div>
                      <span class="bank-cur-badge">{{b.currency}}</span>
                    </div>
                    <div class="bank-card-body">
                      <div class="account-name-line">
                        <span class="meta-label">Account Name:</span>
                        <strong class="meta-value">{{b.account_name}}</strong>
                      </div>
                      <div class="account-num-line">
                        <div class="num-box">
                          <span class="meta-label">Account Number:</span>
                          <span class="meta-num">{{b.account_number}}</span>
                        </div>
                        <button 
                          type="button" 
                          class="btn-copy-sm" 
                          @click="copyText(b.account_number, 'acc_' + idx)"
                          title="Copy account number"
                        >
                          <i :class="copiedKey === ('acc_' + idx) ? 'fa-solid fa-check text-success' : 'fa-solid fa-copy'"></i>
                          {{copiedKey === ('acc_' + idx) ? 'Copied' : 'Copy'}}
                        </button>
                      </div>
                      <div v-if="b.swift" class="account-num-line mt-1">
                        <div class="num-box">
                          <span class="meta-label">SWIFT / BIC:</span>
                          <span class="meta-num" style="font-size: 0.92rem;">{{b.swift}}</span>
                        </div>
                        <button 
                          type="button" 
                          class="btn-copy-sm" 
                          @click="copyText(b.swift, 'swift_' + idx)"
                          title="Copy SWIFT code"
                        >
                          <i :class="copiedKey === ('swift_' + idx) ? 'fa-solid fa-check text-success' : 'fa-solid fa-copy'"></i>
                          {{copiedKey === ('swift_' + idx) ? 'Copied' : 'Copy'}}
                        </button>
                      </div>
                      <div v-if="b.purpose" class="account-purpose-note">
                        <i class="fa-solid fa-tag me-1 text-gold"></i> {{b.purpose}}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <!-- KingsPay Details -->
              <div v-if="paymentMethod === 'KingsPay'" class="kingspay-details-box mt-3">
                <div class="kp-box-head">
                  <i class="fa-solid fa-crown text-warning me-2"></i>
                  <b>Pay With KingsPay App</b>
                </div>
                <p class="kp-box-desc">
                  Open your KingsPay mobile app (iOS or Android), tap <b>Pay</b>, and enter our church recipient code:
                </p>
                <div class="kp-code-display">
                  <span class="kp-code-text">{{kingspayCode}}</span>
                  <button type="button" class="btn-copy-code" @click="copyText(kingspayCode, 'kp_btn_code')">
                    <i :class="copiedKey === 'kp_btn_code' ? 'fa-solid fa-check text-success' : 'fa-solid fa-copy'"></i>
                    {{copiedKey === 'kp_btn_code' ? 'Copied Code!' : 'Copy Code'}}
                  </button>
                </div>
                <small class="text-muted d-block mt-2">
                  Reference: <b>{{giveTowards}}</b> | Sower: <b>{{donorName || 'Member'}}</b>
                </small>
              </div>

              <!-- PayPal Form -->
              <form ref="paypalForm" method="post" action="https://www.paypal.com/cgi-bin/webscr">
                <input type="hidden" name="cmd" value="_xclick">
                <input type="hidden" name="business" :value="paypalRecipient">
                <input type="hidden" name="currency_code" :value="selectedCurrency">
                <input type="hidden" name="amount" :value="selectedAmount.toFixed(2)">
                <input type="hidden" name="item_name" :value="(cms.site && cms.site.name ? cms.site.name : 'Christ Embassy New Benin') + ' - ' + giveTowards + ' (' + frequency + ')'">
                <input type="hidden" name="no_shipping" value="1">
                <input type="hidden" name="no_note" value="0">
                <input type="hidden" name="payer_email" :value="donorEmail">
              </form>

              <!-- Main CTA Button -->
              <div class="mt-4">
                <button 
                  v-if="paymentMethod === 'PayPal'" 
                  type="button" 
                  class="btn-brand w-100 py-3 fw-bold" 
                  @click="submitGiving"
                >
                  <i class="fa-brands fa-paypal me-2"></i> Continue to PayPal ({{amountLabel}})
                </button>
                <button 
                  v-else-if="paymentMethod === 'KingsPay'" 
                  type="button" 
                  class="btn-brand w-100 py-3 fw-bold btn-kingspay-gold" 
                  @click="submitGiving"
                >
                  <i class="fa-solid fa-crown me-2"></i> {{copiedKey === 'kingspay_main' ? 'KingsPay Code Copied!' : 'Copy KingsPay Code (' + kingspayCode + ')'}}
                </button>
                <button 
                  v-else 
                  type="button" 
                  class="btn-brand w-100 py-3 fw-bold" 
                  @click="submitGiving"
                >
                  <i class="fa-solid fa-copy me-2"></i> Copy Account Number
                </button>
              </div>

              <p class="paypal-note mt-3">
                <i class="fa-solid fa-lock text-success me-1"></i> All transactions and seeds are processed securely. God bless you abundantly for your giving.
              </p>

            </div>
          </div>

        </div>
      </div>
    </section>
  </div>`
};
const VisitPage = {
  inject:['cms'],
  data(){
    return {
      regForm: {
        name: '',
        phone: '',
        email: '',
        serviceDate: 'This Sunday',
        guests: '1 Person',
        hasKids: 'No',
        transportNeeded: 'No',
        note: '',
        submitted: false,
        submitting: false,
        error: ''
      },
      copiedKey: '',
      activeFaq: 0
    };
  },
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.visit) ? this.cms.pages.visit : {}; },
    heroStyle(){
      const hero = this.pageCms.hero || 'assets/uploaded_media/plan_visit_hero_banner.jpg';
      return { backgroundImage: `linear-gradient(rgba(10, 14, 23, 0.72), rgba(10, 14, 23, 0.88)), url(${hero})` };
    },
    foyerImage(){
      return this.pageCms.foyer_image || 'assets/uploaded_media/plan_visit_welcome_foyer.jpg';
    },
    site(){ return this.cms && this.cms.site ? this.cms.site : {}; },
    services(){
      return (this.pageCms && Array.isArray(this.pageCms.services) && this.pageCms.services.length)
        ? this.pageCms.services
        : [
            { name: 'Sunday Service of Excellence (1st Service)', time: 'Sunday 7:30 AM', description: 'Early morning prophetic communion, uplifting worship, and foundational revelations.' },
            { name: 'Sunday Service of Excellence (2nd Service)', time: 'Sunday 9:30 AM', description: 'Grand celebration service, supernatural miracles, testimonies, and transformative Word.' },
            { name: 'Mid-Week Service & Faith Clinic', time: 'Wednesday 6:00 PM', description: 'In-depth revelatory Bible study and prayer session to fortify your spirit mid-week.' }
          ];
    },
    whatToExpect(){
      return (this.pageCms && Array.isArray(this.pageCms.what_to_expect) && this.pageCms.what_to_expect.length)
        ? this.pageCms.what_to_expect
        : [
            { title: 'Warm & Royal Hospitality', tag: 'Welcome', icon: 'fa-solid fa-hands-holding-child', desc: 'From the moment you drive in, our courteous protocol and hospitality team will receive you with a warm smile, guide you to comfortable seating, and ensure you feel honoured.' },
            { title: 'Anointed & Miraculous Worship', tag: 'Atmosphere', icon: 'fa-solid fa-music', desc: 'Immerse yourself in high-energy praise and deep, reverent worship led by our choir. The atmosphere is saturated with the presence and power of the Holy Spirit.' },
            { title: 'The Revelatory Word of God', tag: 'The Word', icon: 'fa-solid fa-book-bible', desc: 'Pastor Joseph Atibi-Brown teaches God\'s Word with supernatural clarity, insight, and power, equipping you with faith to overcome challenges and reign in life.' },
            { title: 'Vibrant Children & Teens Ministry', tag: 'Families', icon: 'fa-solid fa-child-reaching', desc: 'Bring your whole family! We have safe, energetic, and Bible-centered classrooms where infants, children, and teenagers are nurtured and built in righteousness.' }
          ];
    },
    faqs(){
      return (this.pageCms && Array.isArray(this.pageCms.faqs) && this.pageCms.faqs.length)
        ? this.pageCms.faqs
        : [
            { q: 'What time should I arrive?', a: 'We recommend arriving 10–15 minutes before the service starts so our ushers can greet you and seat you comfortably.' },
            { q: 'What should I wear?', a: 'Come dressed comfortably in your Sunday best or smart casual attire. There is no rigid dress code—you are celebrated here just as you are.' },
            { q: 'Is there parking available?', a: 'Yes! We have secure on-site parking with dedicated traffic marshals and security personnel to guide and safeguard your vehicle.' },
            { q: 'What happens to my children during service?', a: 'Your children will love our Children\'s Church! They enjoy safe, age-appropriate Bible lessons, music, games, and snacks supervised by trained teachers.' }
          ];
    }
  },
  methods:{
    submitPreReg(){
      if(!this.regForm.name.trim()){ this.regForm.error = 'Please enter your name.'; return; }
      if(!this.regForm.phone.trim()){ this.regForm.error = 'Please enter your phone number.'; return; }
      this.regForm.submitting = true;
      this.regForm.error = '';
      setTimeout(() => {
        this.regForm.submitting = false;
        this.regForm.submitted = true;
      }, 600);
    },
    toggleFaq(index){
      this.activeFaq = this.activeFaq === index ? -1 : index;
    },
    copyText(text, key){
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.copiedKey = key;
          setTimeout(() => { if (this.copiedKey === key) this.copiedKey = ''; }, 2500);
        }).catch(() => {
          this.fallbackCopy(text, key);
        });
      } else {
        this.fallbackCopy(text, key);
      }
    },
    fallbackCopy(text, key){
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        this.copiedKey = key;
        setTimeout(() => { if (this.copiedKey === key) this.copiedKey = ''; }, 2500);
      } catch (e) {}
      document.body.removeChild(textarea);
    }
  },
  template:`
  <div>
    <!-- Hero Banner with Modern Sanctuary Exterior Background -->
    <section class="sub-hero visit-hero" :style="heroStyle">
      <div class="container-wide reveal">
        <div class="visit-hero-badge"><i class="fa-solid fa-church me-2"></i> {{pageCms.eyebrow || 'Plan a Visit • Church of Excellence'}}</div>
        <h1 class="title-serif">{{pageCms.title || 'Plan Your Visit'}}</h1>
        <p class="text-lg cms-subtitle">{{pageCms.subtitle || 'A warm, royal welcome awaits you at Christ Embassy New Benin.'}}</p>
      </div>
    </section>

    <!-- Main Content Section -->
    <section class="section visit-page-section">
      <div class="container-wide">
        <div class="visit-page-grid">

          <!-- Left Column: Welcome Feature, Pillars, Schedules, Pre-Reg Form, FAQs -->
          <div class="visit-primary-col">

            <!-- Foyer & Hospitality Welcome Showcase Card -->
            <div class="visit-welcome-card">
              <div class="visit-foyer-img-wrap">
                <img :src="foyerImage" alt="Welcome to Christ Embassy Foyer" class="visit-foyer-img">
                <div class="visit-foyer-overlay">
                  <span class="foyer-badge"><i class="fa-solid fa-heart me-1"></i> First-Time Guest Experience • A Place You Can Call Home</span>
                </div>
              </div>
              <div class="visit-welcome-body">
                <div class="eyebrow text-gold"><i class="fa-solid fa-sparkles me-1"></i> Church of Excellence</div>
                <h2 class="visit-headline">{{pageCms.welcome_heading || 'We Would Love to Welcome You This Week'}}</h2>
                <p class="visit-intro-p">
                  {{pageCms.welcome_text || 'Whether you are seeking a spiritual home, visiting Benin City, or longing for an encounter with God, you are celebrated here. Under the leadership of Pastor Joseph Atibi-Brown, you will experience the supernatural presence of the Holy Spirit, unconditional love, and the revelatory Word that will transform your life forever.'}}
                </p>
              </div>
            </div>

            <!-- What to Expect as Our Honored Guest (4 Pillars) -->
            <div class="what-to-expect-block mt-5">
              <div class="split-heading mb-3">
                <div>
                  <div class="eyebrow">Your Experience</div>
                  <h3 class="title-mid" style="font-size: 1.45rem;">What to Expect as Our Honored Guest</h3>
                </div>
              </div>
              <div class="expect-pillars-grid">
                <div v-for="item in whatToExpect" :key="item.title" class="expect-card">
                  <div class="expect-card-head">
                    <div class="expect-icon-bubble"><i :class="item.icon"></i></div>
                    <span class="expect-tag">{{item.tag}}</span>
                  </div>
                  <h4 class="expect-title">{{item.title}}</h4>
                  <p class="expect-desc">{{item.desc}}</p>
                </div>
              </div>
            </div>

            <!-- Weekly Services Schedule -->
            <div class="services-schedule-block mt-5">
              <div class="split-heading mb-3">
                <div>
                  <div class="eyebrow">Weekly Gatherings</div>
                  <h3 class="title-mid" style="font-size: 1.45rem;">Service Days & Meeting Times</h3>
                </div>
              </div>
              <div class="service-cards-stack">
                <div v-for="(srv, i) in services" :key="i" class="service-schedule-tile">
                  <div class="service-tile-top">
                    <div class="service-tile-name-row">
                      <i class="fa-solid fa-calendar-check text-warning me-2 fs-5"></i>
                      <h4 class="m-0 fw-bold text-dark">{{srv.name}}</h4>
                    </div>
                    <span class="service-time-pill"><i class="fa-regular fa-clock me-1"></i> {{srv.time}}</span>
                  </div>
                  <p class="service-tile-desc">{{srv.description}}</p>
                </div>
              </div>
            </div>

            <!-- Pre-Register / "Let Us Know You're Coming" Form -->
            <div class="visit-prereg-card mt-5">
              <div class="prereg-header">
                <div class="prereg-icon"><i class="fa-solid fa-clipboard-user"></i></div>
                <div>
                  <h3 class="prereg-title">Let Us Know You're Coming</h3>
                  <p class="prereg-sub">Fill this quick form so our hospitality ministers can prepare a special welcome gift pack for you!</p>
                </div>
              </div>

              <div v-if="regForm.submitted" class="prereg-success-box">
                <i class="fa-solid fa-circle-check fs-1 text-success mb-2"></i>
                <h4 class="fw-bold text-success mb-2">You Are Warmly Expected!</h4>
                <p class="mb-0 text-muted">Thank you, <b>{{regForm.name}}</b>. Our Protocol and Welcome Ministers have reserved a VIP welcome reception and gift pack for you on <b>{{regForm.serviceDate}}</b>.</p>
              </div>

              <form v-else @submit.prevent="submitPreReg" class="prereg-form">
                <div v-if="regForm.error" class="alert alert-danger py-2">{{regForm.error}}</div>
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="give-label">Your Full Name *</label>
                    <input v-model="regForm.name" type="text" placeholder="e.g. Brother Emmanuel" class="form-control" required>
                  </div>
                  <div class="col-md-6">
                    <label class="give-label">Phone / WhatsApp Number *</label>
                    <input v-model="regForm.phone" type="tel" placeholder="e.g. +234..." class="form-control" required>
                  </div>
                  <div class="col-md-6">
                    <label class="give-label">Email Address (Optional)</label>
                    <input v-model="regForm.email" type="email" placeholder="you@example.com" class="form-control">
                  </div>
                  <div class="col-md-6">
                    <label class="give-label">When Are You Visiting?</label>
                    <select v-model="regForm.serviceDate" class="form-select">
                      <option>This Sunday Morning (1st Service 7:30 AM)</option>
                      <option>This Sunday Morning (2nd Service 9:30 AM)</option>
                      <option>Upcoming Wednesday Service (6:00 PM)</option>
                      <option>Other Date / Special Service</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="give-label">Number in Your Party</label>
                    <select v-model="regForm.guests" class="form-select">
                      <option>1 Person (Just me)</option>
                      <option>2 People</option>
                      <option>Family (3 to 5 People)</option>
                      <option>Group (6+ People)</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="give-label">Coming With Children?</label>
                    <select v-model="regForm.hasKids" class="form-select">
                      <option>No</option>
                      <option>Yes (Toddlers / Children)</option>
                      <option>Yes (Teens)</option>
                    </select>
                  </div>
                  <div class="col-md-4">
                    <label class="give-label">Need Directions?</label>
                    <select v-model="regForm.transportNeeded" class="form-select">
                      <option>No, I know the location</option>
                      <option>Yes, please send directions</option>
                    </select>
                  </div>
                  <div class="col-12">
                    <label class="give-label">Special Note / Prayer Request</label>
                    <input v-model="regForm.note" type="text" placeholder="Anything we can prepare for you?" class="form-control">
                  </div>
                  <div class="col-12 mt-3">
                    <button type="submit" class="btn-brand w-100 py-3 fw-bold" :disabled="regForm.submitting">
                      <i class="fa-solid" :class="regForm.submitting ? 'fa-spinner fa-spin' : 'fa-paper-plane me-1'"></i>
                      {{regForm.submitting ? 'Registering...' : 'Complete My Visit Registration'}}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <!-- Frequently Asked Questions Accordion -->
            <div class="visit-faqs-block mt-5">
              <div class="eyebrow"><i class="fa-solid fa-circle-question me-1"></i> Guest Inquiries</div>
              <h3 class="title-mid mb-3" style="font-size: 1.45rem;">Frequently Asked Questions</h3>
              <div class="faq-accordion-list">
                <div v-for="(faq, idx) in faqs" :key="idx" class="faq-item-card" :class="{open: activeFaq === idx}">
                  <div class="faq-question-row" @click="toggleFaq(idx)">
                    <span class="faq-q-text">{{faq.q}}</span>
                    <i class="fa-solid" :class="activeFaq === idx ? 'fa-chevron-up text-warning' : 'fa-chevron-down text-muted'"></i>
                  </div>
                  <div v-if="activeFaq === idx" class="faq-answer-body">
                    <p class="m-0">{{faq.a}}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Sanctuary Location, VIP Guest Experience, Family Care & Transport -->
          <div class="visit-side-col">

            <!-- Sanctuary Location & Driving Directions Card -->
            <div class="visit-location-card">
              <div class="loc-card-badge"><i class="fa-solid fa-map-location-dot me-1"></i> Sanctuary & Campus</div>
              <h4 class="visit-loc-title mt-2">Christ Embassy New Benin</h4>
              <p class="text-muted small mb-3">Where Heaven Touches Earth • Church of Excellence</p>
              
              <div class="visit-loc-item mb-3">
                <div class="d-flex align-items-center justify-content-between mb-1">
                  <b><i class="fa-solid fa-location-dot text-warning me-1"></i> Sanctuary Address</b>
                  <button v-if="site.address" type="button" class="btn-copy-sm" @click="copyText(site.address, 'loc_addr')">
                    <i :class="copiedKey === 'loc_addr' ? 'fa-solid fa-check text-success' : 'fa-solid fa-copy'"></i>
                    {{copiedKey === 'loc_addr' ? 'Copied' : 'Copy'}}
                  </button>
                </div>
                <span>{{site.address || '23 Ivbiye Street, off New Lagos Road, New Benin, Benin City'}}</span>
              </div>

              <div v-if="site.office_hours" class="visit-loc-item mb-3">
                <b><i class="fa-regular fa-clock text-warning me-1"></i> Office & Visiting Hours</b>
                <div>{{site.office_hours}}</div>
              </div>

              <div v-if="site.phone || site.email" class="visit-loc-item mb-3">
                <b><i class="fa-solid fa-phone text-warning me-1"></i> Direct Helplines & Enquiries</b>
                <div v-if="site.phone"><a :href="'tel:' + site.phone" class="text-decoration-none text-light"><i class="fa-solid fa-phone text-warning me-1"></i> {{site.phone}}</a></div>
                <div v-if="site.email"><a :href="'mailto:' + site.email" class="text-decoration-none text-light small d-block mt-1"><i class="fa-solid fa-envelope text-warning me-1"></i> {{site.email}}</a></div>
                <div v-if="site.email_alt"><a :href="'mailto:' + site.email_alt" class="text-decoration-none text-light small d-block mt-1"><i class="fa-solid fa-envelope text-warning me-1"></i> {{site.email_alt}}</a></div>
              </div>

              <div class="d-flex flex-column gap-2 mt-4">
                <a :href="'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(site.address || '23 Ivbiye Street, off New Lagos Road, New Benin, Benin City')" target="_blank" rel="noopener" class="btn-brand text-center py-2">
                  <i class="fa-solid fa-diamond-turn-right me-1"></i> Get Driving Directions
                </a>
                <a href="#/live" class="btn-outline-gold text-center py-2">
                  <i class="fa-solid fa-video me-1"></i> Watch Live Stream
                </a>
              </div>
            </div>

            <!-- VIP First-Timer Guest Experience Highlights -->
            <div class="visit-vip-card">
              <div class="vip-badge-row">
                <span class="portal-badge"><i class="fa-solid fa-crown text-warning"></i> VIP EXPERIENCE</span>
              </div>
              <h4 class="fw-bold mt-2" style="font-size: 1.2rem; color: #fff;">What to Expect as Our Guest</h4>
              <p class="text-muted small mb-3">We treat every visitor like royalty. Here is what we have prepared for you:</p>

              <div class="vip-benefit-list">
                <div class="vip-benefit-item">
                  <div class="vip-icon"><i class="fa-solid fa-gift"></i></div>
                  <div>
                    <b>Exclusive Welcome Gift Pack</b>
                    <p class="mb-0 text-muted small">Receive a dedicated copy of Rhapsody of Realities, inspiring audio message, and special gifts from Pastor Chris & Pastor Joseph.</p>
                  </div>
                </div>

                <div class="vip-benefit-item">
                  <div class="vip-icon"><i class="fa-solid fa-couch"></i></div>
                  <div>
                    <b>VIP First-Timers Reception</b>
                    <p class="mb-0 text-muted small">Immediately following service, join our welcome pastors in the VIP Lounge for light refreshments, personal blessings, and prayer.</p>
                  </div>
                </div>

                <div class="vip-benefit-item">
                  <div class="vip-icon"><i class="fa-solid fa-chair"></i></div>
                  <div>
                    <b>Reserved Priority Seating</b>
                    <p class="mb-0 text-muted small">When you pre-register, our hospitality team reserves great seats for you and your family so you never have to search for a place.</p>
                  </div>
                </div>

                <div class="vip-benefit-item">
                  <div class="vip-icon"><i class="fa-solid fa-user-shield"></i></div>
                  <div>
                    <b>Dedicated Host & Guide</b>
                    <p class="mb-0 text-muted small">A caring member of our protocol team will be available to answer questions, guide your kids to their classrooms, and ensure total comfort.</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Coming with Children / Family Card -->
            <div class="visit-family-card">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-children text-warning fs-5"></i>
                <h4 class="m-0 fw-bold" style="font-size: 1.15rem; color: #fff;">Bringing Children or Teens?</h4>
              </div>
              <p class="text-muted small mb-3">We have age-graded, safe, and fun-filled classrooms designed to help every child flourish in God's love:</p>

              <ul class="family-check-list list-unstyled mb-3">
                <li><i class="fa-solid fa-circle-check text-warning me-2"></i><b>Nursery & Toddlers (0–3 yrs):</b> Loving, secure, and sanitized care.</li>
                <li><i class="fa-solid fa-circle-check text-warning me-2"></i><b>Children's Church (4–12 yrs):</b> Dynamic praise, Bible drama, and creativity.</li>
                <li><i class="fa-solid fa-circle-check text-warning me-2"></i><b>Teens Church (13–19 yrs):</b> Inspiring leadership, music, and peer fellowship.</li>
                <li><i class="fa-solid fa-circle-check text-warning me-2"></i><b>Secure Check-In:</b> Strict safety protocols to guarantee your peace of mind.</li>
              </ul>
              
              <div class="p-2 rounded bg-dark border border-secondary text-muted small">
                <i class="fa-solid fa-shield-halved text-success me-1"></i> All teachers and caregivers are thoroughly vetted and trained in child safety.
              </div>
            </div>

            <!-- Transport & Accessibility Assistance -->
            <div class="visit-transport-card">
              <div class="d-flex align-items-center gap-2 mb-2">
                <i class="fa-solid fa-car-side text-warning fs-5"></i>
                <h4 class="m-0 fw-bold" style="font-size: 1.1rem; color: #fff;">Parking & Transportation</h4>
              </div>
              <p class="text-muted small mb-2">Free, spacious, and secure on-site parking is available. Courteous traffic stewards will guide you to a spot upon arrival.</p>
              <div v-if="site.phone" class="text-muted small">
                Need transportation assistance or a bus stop guide? Call our Protocol Desk: <b>{{site.phone}}</b>
              </div>
            </div>

          </div>

        </div>
      </div>
    </section>
  </div>`
};

const AboutPage = {
  inject:['cms'],
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.about) ? this.cms.pages.about : {}; },
    heroStyle(){
      const image = this.pageCms.hero || this.pageCms.hero_image || 'assets/uploaded_media/about_hero_banner.jpg';
      return {
        backgroundImage: "url('" + image + "')"
      };
    },
    pastorImage(){ return this.pageCms.pastor_image || 'assets/uploaded_media/WhatsApp_Image_2026-09-17_at_4.27.50_PM.jpeg'; },
    pastorChrisImage(){ return this.pageCms.global_leadership_image || 'assets/uploaded_media/sermon_pastor_chris_higher_life.jpg'; },
    pillars(){
      if (this.pageCms && Array.isArray(this.pageCms.pillars) && this.pageCms.pillars.length) {
        return this.pageCms.pillars;
      }
      return [
        { icon: 'fa-solid fa-book-bible', title: 'The Infallible Word', desc: "We are founded on the integrity and authority of God's Word, teaching believers how to live triumphantly through faith and revelation." },
        { icon: 'fa-solid fa-fire-flame-curved', title: 'Spirit-Led Worship & Prayer', desc: 'Experiencing the tangible presence of the Holy Spirit through fervent prayer, inspired worship, and prophetic ministrations.' },
        { icon: 'fa-solid fa-medal', title: 'Culture of Excellence', desc: 'Excellence is our divine nature in Christ. We express the character of the Spirit with diligence, order, and distinction.' },
        { icon: 'fa-solid fa-earth-americas', title: 'Global Soul Winning & Outreach', desc: 'Taking the gospel to every soul in Benin City and beyond through active evangelism, cell ministry, and Christian benevolence.' }
      ];
    },
    beliefs(){
      if (this.pageCms && Array.isArray(this.pageCms.beliefs) && this.pageCms.beliefs.length) {
        return this.pageCms.beliefs;
      }
      return [
        { title: 'The Infallible Scriptures', desc: 'The Holy Bible is the inspired, living Word of God, our supreme authority and manual for faith, conduct, and victory.' },
        { title: 'The New Creation in Christ', desc: 'Whoever is born again is a brand new creation, sharing the very nature, righteousness, and eternal life of God.' },
        { title: 'The Ministry of the Holy Spirit', desc: 'The Holy Spirit indwells, teaches, empowers, and guides the believer into all truth and supernatural dominion.' },
        { title: 'Divine Health & Prosperity', desc: 'Health, wholeness, peace, and abundance are the covenant inheritance purchased for every child of God through Christ.' },
        { title: 'The Great Commission', desc: "We are committed to taking the gospel to every creature, winning souls, planting cells, and preparing the Church for Christ's return." }
      ];
    },
    serviceTimes(){
      return (this.pageCms && Array.isArray(this.pageCms.service_times) && this.pageCms.service_times.length) ? this.pageCms.service_times : [
        { day: 'Every Sunday Morning', service: 'Sunday Service of Excellence', time: '7:30 AM & 9:30 AM (WAT)', badge: 'Main Worship' },
        { day: 'Every Wednesday Evening', service: 'Mid-Week Faith Clinic & Bible Study', time: '6:00 PM (WAT)', badge: 'Faith Clinic' }
      ];
    },
    ministries(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.ministries) ? this.cms.home.ministries.slice(0, 4) : []; }
  },
  template:`
  <div>
    <!-- Sub Hero -->
    <section class="about-hero" :style="heroStyle">
      <div class="container-wide reveal text-center">
        <div class="about-hero-badge">
          <i class="fa-solid fa-church me-2"></i> {{pageCms.eyebrow || 'Welcome to Church of Excellence'}}
        </div>
        <h1 class="title-serif text-white">{{pageCms.title || 'About Christ Embassy New Benin'}}</h1>
        <p class="about-hero-subtitle">{{pageCms.subtitle || 'Church of Excellence — Living the Higher Life in Christ'}}</p>
        <div class="about-hero-actions">
          <a href="#about-vision" class="btn-brand" style="border-radius:9999px;padding:12px 28px">
            <i class="fa-solid fa-compass me-1"></i> Our Vision & Faith
          </a>
          <a href="#/visit" class="btn-hero-share">
            <i class="fa-solid fa-location-dot me-1"></i> Plan a Visit
          </a>
        </div>
      </div>
    </section>
    
    <!-- Main About Content Section: Bright and Clean Layout -->
    <section class="about-light-section" id="about-vision">
      <div class="container-wide">

        <!-- Who We Are: Highlight Card -->
        <div class="about-spotlight-card mb-5">
          <div class="d-flex justify-content-center mb-3">
            <span class="about-badge-gold"><i class="fa-solid fa-sparkles me-1"></i> WHO WE ARE</span>
          </div>
          <h2>A Beacon of Divine Presence, Light & Supernatural Victory</h2>
          <p>
            {{pageCms.intro || 'Christ Embassy New Benin is a vibrant, visionary congregation of LoveWorld Inc., dedicated to raising champions, fulfilling the Great Commission, and demonstrating the character of the Spirit with unmatched excellence.'}}
          </p>

          <div class="about-metrics-row">
            <div class="about-metric-pill">
              <i class="fa-solid fa-star"></i>
              <span>Church of Excellence</span>
            </div>
            <div class="about-metric-pill">
              <i class="fa-solid fa-earth-africa"></i>
              <span>Benin Zone 1</span>
            </div>
            <div class="about-metric-pill">
              <i class="fa-solid fa-crown"></i>
              <span>LoveWorld Nation</span>
            </div>
            <div class="about-metric-pill">
              <i class="fa-solid fa-fire"></i>
              <span>Word & Spirit</span>
            </div>
          </div>
        </div>

        <!-- Dual Leadership Showcase: Global & Local in Bright Cards -->
        <div class="mb-5">
          <div class="text-center mb-4">
            <span class="badge" style="background:rgba(23,122,135,0.12);color:#177a87;font-weight:800;font-size:0.75rem;letter-spacing:0.08em;padding:5px 14px;border-radius:9999px;">MINISTRY LEADERSHIP</span>
            <h2 class="title-mid" style="color:#0f172a;margin-top:8px;">Shepherded by Vision, Word & Spirit</h2>
          </div>

          <div class="row g-4">
            <!-- Global Leader: Pastor Chris Oyakhilome -->
            <div class="col-lg-6">
              <div class="about-leader-bright-card">
                <div class="leader-bright-photo-wrap">
                  <img :src="pastorChrisImage" alt="Rev. Dr. Chris Oyakhilome D.Sc., D.D." class="leader-bright-photo">
                  <span class="leader-bright-badge">GLOBAL PRESIDENT</span>
                </div>
                <div class="leader-bright-body">
                  <div class="leader-bright-org">
                    <i class="fa-solid fa-crown me-1"></i> LoveWorld Inc. Worldwide
                  </div>
                  <h3 class="leader-bright-name">{{pageCms.global_leadership || 'Rev. Dr. Chris Oyakhilome D.Sc., D.D.'}}</h3>
                  <div class="leader-bright-title">{{pageCms.global_leadership_role || 'President, LoveWorld Inc. / Christ Embassy'}}</div>
                  <p class="leader-bright-bio">
                    {{pageCms.global_leadership_bio || 'Rev. Dr. Chris Oyakhilome is the spiritual father, teacher, and visionary president of LoveWorld Inc., whose ministry, worldwide broadcasts, and humanitarian initiatives have brought the divine presence of God to billions of souls globally.'}}
                  </p>
                  <div class="leader-bright-footer">
                    <i class="fa-solid fa-globe text-teal"></i> Inspiring global faith & transformation across nations
                  </div>
                </div>
              </div>
            </div>

            <!-- Local Pastor: Pastor Joseph Atibi-Brown -->
            <div class="col-lg-6">
              <div class="about-leader-bright-card">
                <div class="leader-bright-photo-wrap">
                  <img :src="pastorImage" alt="Pastor Joseph Atibi-Brown" class="leader-bright-photo">
                  <span class="leader-bright-badge teal">SENIOR PASTOR</span>
                </div>
                <div class="leader-bright-body">
                  <div class="leader-bright-org">
                    <i class="fa-solid fa-church me-1"></i> Church of Excellence
                  </div>
                  <h3 class="leader-bright-name">{{pageCms.pastor_name || 'Pastor Joseph Atibi-Brown'}}</h3>
                  <div class="leader-bright-title">{{pageCms.pastor_title || 'Pastor, Christ Embassy New Benin'}}</div>
                  <p class="leader-bright-bio">
                    {{pageCms.pastor_bio || "Pastor Joseph Atibi-Brown is a passionate, visionary minister of the gospel whose dynamic teaching of God's Word brings clarity, faith, and supernatural results. Under his spiritual leadership, Christ Embassy New Benin continues to flourish as a beacon of light, excellence, and salvation."}}
                  </p>
                  <div class="leader-bright-footer">
                    <i class="fa-solid fa-location-dot text-gold"></i> Ministering in Benin City, Edo State
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Global Vision & Local Expression Grid (Bright) -->
        <div class="row g-4 mb-5">
          <div class="col-lg-6">
            <div class="about-vision-bright-card">
              <div class="vision-bright-icon">
                <i class="fa-solid fa-earth-americas"></i>
              </div>
              <span class="eyebrow" style="color:#b45309;font-size:0.75rem;font-weight:800;letter-spacing:0.08em;margin-bottom:6px;">{{pageCms.global_vision_title || 'OUR GLOBAL VISION'}}</span>
              <h3 style="color:#0f172a;font-size:1.45rem;font-weight:800;margin-bottom:12px;">To Take God's Divine Presence to the Nations</h3>
              <blockquote class="vision-bright-quote">
                "{{pageCms.global_vision_statement || 'To take the divine presence of God to the nations and peoples of the world; and to demonstrate the character of the Spirit.'}}"
              </blockquote>
              <p style="color:#64748b;font-size:0.88rem;margin-top:auto;margin-bottom:0;">
                <i class="fa-solid fa-check-double text-teal me-1"></i> The unaltered divine mandate given to LoveWorld by God.
              </p>
            </div>
          </div>

          <div class="col-lg-6">
            <div class="about-vision-bright-card">
              <div class="vision-bright-icon" style="background:rgba(217,173,98,0.15);color:#b45309;">
                <i class="fa-solid fa-fire"></i>
              </div>
              <span class="eyebrow" style="color:#b45309;font-size:0.75rem;font-weight:800;letter-spacing:0.08em;margin-bottom:6px;">{{pageCms.local_expression_title || 'OUR LOCAL EXPRESSION'}}</span>
              <h3 style="color:#0f172a;font-size:1.45rem;font-weight:800;margin-bottom:12px;">Church of Excellence in Action</h3>
              <p style="color:#475569;font-size:0.96rem;line-height:1.75;margin-bottom:16px;">
                {{pageCms.local_expression_body || 'At Christ Embassy New Benin (Church of Excellence), under the leadership of Pastor Joseph Atibi-Brown, we actively translate this divine mandate into vibrant local action. We demonstrate the character of the Holy Spirit across Benin City and beyond through life-transforming services, discipleship, and community outreach.'}}
              </p>
              <p style="color:#64748b;font-size:0.88rem;margin-top:auto;margin-bottom:0;">
                <i class="fa-solid fa-sparkles text-gold me-1"></i> Transforming lives and raising leaders across Edo State.
              </p>
            </div>
          </div>
        </div>

        <!-- 4 Foundational Pillars of Excellence (Bright Cards) -->
        <div class="mb-5">
          <div class="text-center mb-4">
            <span class="badge" style="background:rgba(23,122,135,0.12);color:#177a87;font-weight:800;font-size:0.75rem;letter-spacing:0.08em;padding:5px 14px;border-radius:9999px;">FOUNDATIONS</span>
            <h2 class="title-mid" style="color:#0f172a;margin-top:8px;">Four Pillars of the Church of Excellence</h2>
            <p class="text-muted mx-auto" style="max-width: 600px;">Core spiritual convictions that define our worship, culture, and community impact.</p>
          </div>

          <div class="row g-4">
            <div v-for="(pillar, idx) in pillars" :key="idx" class="col-md-6 col-lg-3">
              <div class="about-pillar-bright-card">
                <div class="pillar-bright-icon">
                  <i :class="pillar.icon || 'fa-solid fa-star'"></i>
                </div>
                <h4 style="font-size:1.15rem;font-weight:800;color:#0f172a;margin-bottom:10px;">{{pillar.title}}</h4>
                <p style="color:#64748b;font-size:0.88rem;line-height:1.65;margin:0;">{{pillar.desc}}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- What We Believe / Statement of Faith (Bright) -->
        <div class="mb-5">
          <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;padding:clamp(24px,4vw,48px);box-shadow:0 8px 30px rgba(0,0,0,0.03);">
            <div class="text-center mb-4">
              <span class="about-badge-gold">STATEMENT OF FAITH</span>
              <h2 class="title-mid" style="color:#0f172a;margin-top:8px;">What We Believe</h2>
              <p class="text-muted mx-auto" style="max-width: 650px;">Grounded firmly upon the unalterable truths of God's holy Word.</p>
            </div>

            <div class="row g-3">
              <div v-for="(belief, bIdx) in beliefs" :key="bIdx" class="col-md-6 col-lg-4">
                <div class="belief-bright-card">
                  <div class="d-flex align-items-center gap-2 mb-2">
                    <span style="background:rgba(217,173,98,0.18);color:#b45309;font-weight:800;font-size:0.8rem;padding:3px 10px;border-radius:6px;font-family:monospace;">0{{bIdx + 1}}</span>
                    <h5 style="color:#0f172a;margin:0;font-weight:800;font-size:1.02rem;">{{belief.title}}</h5>
                  </div>
                  <p style="color:#475569;font-size:0.88rem;line-height:1.65;margin:0;">{{belief.desc}}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Weekly Services Schedule & Visit Invitation (Bright & Contrast) -->
        <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:24px;padding:clamp(24px,4vw,48px);box-shadow:0 8px 30px rgba(0,0,0,0.03);" class="mb-5">
          <div class="row g-4 align-items-center">
            <div class="col-lg-7">
              <span class="about-badge-gold">SERVICE TIMES</span>
              <h2 class="title-mid" style="color:#0f172a;margin-top:8px;margin-bottom:8px;">Join Us This Week in the Sanctuary</h2>
              <p style="color:#475569;margin-bottom:24px;">Experience glorious worship, deep revelation from God's Word, and the miraculous move of the Holy Spirit.</p>
              
              <div class="d-flex flex-column gap-3">
                <div v-for="(st, stIdx) in serviceTimes" :key="stIdx" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:16px 20px;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:12px;">
                  <div>
                    <span class="badge" style="background:#0f172a;color:#fbbf24;font-size:0.75rem;font-weight:700;padding:4px 10px;border-radius:9999px;margin-right:8px;">{{st.badge}}</span>
                    <b style="color:#0f172a;font-size:0.95rem;">{{st.service}}</b>
                  </div>
                  <div style="color:#177a87;font-weight:800;font-size:0.88rem;">
                    <i class="fa-regular fa-clock me-1"></i> {{st.time}} • {{st.day}}
                  </div>
                </div>
              </div>
            </div>

            <div class="col-lg-5 text-center text-lg-end">
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:20px;padding:32px 24px;text-align:center;">
                <div style="width:60px;height:60px;border-radius:50%;background:rgba(23,122,135,0.1);color:#177a87;display:grid;place-items:center;font-size:1.6rem;margin:0 auto 16px;">
                  <i class="fa-solid fa-church"></i>
                </div>
                <h4 style="color:#0f172a;font-weight:800;margin-bottom:8px;">You Are Warmly Welcomed</h4>
                <p style="color:#64748b;font-size:0.88rem;margin-bottom:20px;">Located in the heart of Benin City, Edo State. We have a reserved seat waiting for you and your family.</p>
                <div class="d-flex flex-column gap-2">
                  <a href="#/visit" class="btn-brand" style="border-radius:9999px;padding:10px 24px;font-weight:700;"><i class="fa-solid fa-map-location-dot me-2"></i> Plan Your Visit</a>
                  <a href="#/live" class="btn-hero-share" style="background:#ffffff;border:1px solid #cbd5e1;color:#0f172a;"><i class="fa-solid fa-tower-broadcast me-2"></i> Watch Live Online</a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Departments / Active Ministries Section -->
        <div v-if="ministries.length">
          <div class="split-heading mb-4">
            <div>
              <div class="eyebrow" style="color:#177a87;">DEPARTMENTS</div>
              <h2 class="title-mid" style="color:#0f172a;">Active Church Ministries</h2>
            </div>
            <div class="text-lg-end">
              <a href="#/ministries" class="btn-brand" style="border-radius:9999px;padding:8px 20px;font-size:0.88rem;">View All Ministries</a>
            </div>
          </div>
          <div class="content-card-grid">
            <a v-for="item in ministries" :key="item.id" :href="'#/ministries/' + item.id" class="content-list-card">
              <img v-if="item.image_url" :src="item.image_url" :alt="item.title">
              <div class="content-list-body">
                <span class="tag">{{item.eyebrow || 'Ministry'}}</span>
                <h3>{{item.title}}</h3>
                <p v-if="item.summary">{{item.summary}}</p>
                <b style="color:#177a87;">Explore Ministry -></b>
              </div>
            </a>
          </div>
        </div>

      </div>
    </section>
  </div>`
};

const StoriesPage = {
  inject:['cms'],
  data(){
    return {
      activeCategory: 'all',
      searchQuery: '',
      visible: 6,
      showModal: false,
      testimonyForm: {
        name: '',
        contact: '',
        category: 'healing',
        title: '',
        details: '',
        submitted: false,
        submitting: false
      }
    };
  },
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.stories) ? this.cms.pages.stories : {}; },
    heroImage(){ return this.pageCms.hero || 'assets/uploaded_media/partnership_outreach_banner.jpg'; },
    heroEyebrow(){ return this.pageCms.eyebrow || 'Stories of Grace & Victory'; },
    heroTitle(){ return this.pageCms.title || 'Testimonies & Stories of Faith'; },
    heroSubtitle(){ return this.pageCms.subtitle || 'Discover inspiring real-life encounters of miraculous healing, supernatural breakthrough, transformed lives, and kingdom advancement at Christ Embassy New Benin.'; },
    rawStories(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.stories) ? this.cms.home.stories : []; },
    stories(){
      return this.rawStories.map(s => {
        const catMap = {
          healing: 'Healing & Miracles',
          breakthrough: 'Breakthrough & Favor',
          family: 'Salvation & Family',
          impact: 'Impact & Missions'
        };
        return {
          id: String(s.id),
          title: s.title || 'Untitled Testimony',
          eyebrow: s.eyebrow || 'Testimony',
          category: s.category || 'healing',
          category_name: s.category_name || catMap[s.category] || 'Testimony',
          author: s.author || 'Church Member',
          date: s.date || '2026',
          read_time: s.read_time || '3 min read',
          summary: s.summary || s.subtitle || '',
          quote: s.quote || '',
          scripture: s.scripture || '',
          body: s.body || '',
          image: this.cacheAsset(s.thumb_url || s.media_url || 'assets/uploaded_media/partnership_outreach_banner.jpg', s.updated_ts),
          is_featured: s.is_featured === '1' || s.is_featured === 1,
          href: '#/stories/' + s.id
        };
      });
    },
    categoryCounts(){
      const counts = { all: this.stories.length, healing: 0, breakthrough: 0, family: 0, impact: 0 };
      this.stories.forEach(s => {
        if(counts[s.category] !== undefined){ counts[s.category]++; }
      });
      return counts;
    },
    featuredStory(){
      const f = this.stories.find(s => s.is_featured);
      return f || this.stories[0] || null;
    },
    filteredStories(){
      let items = this.stories;
      if(this.activeCategory !== 'all'){
        items = items.filter(s => s.category === this.activeCategory);
      }
      if(this.searchQuery.trim()){
        const q = this.searchQuery.trim().toLowerCase();
        items = items.filter(s =>
          (s.title && s.title.toLowerCase().includes(q)) ||
          (s.summary && s.summary.toLowerCase().includes(q)) ||
          (s.author && s.author.toLowerCase().includes(q)) ||
          (s.quote && s.quote.toLowerCase().includes(q)) ||
          (s.scripture && s.scripture.toLowerCase().includes(q)) ||
          (s.category_name && s.category_name.toLowerCase().includes(q))
        );
      }
      return items;
    },
    visibleStories(){
      return this.filteredStories.slice(0, this.visible);
    },
    hasMore(){
      return this.visible < this.filteredStories.length;
    }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    setCategory(cat){
      this.activeCategory = cat;
      this.visible = 6;
    },
    loadMore(){
      this.visible += 6;
    },
    submitTestimony(){
      this.testimonyForm.submitting = true;
      setTimeout(() => {
        this.testimonyForm.submitting = false;
        this.testimonyForm.submitted = true;
      }, 700);
    },
    closeModal(){
      this.showModal = false;
      this.testimonyForm = {
        name: '',
        contact: '',
        category: 'healing',
        title: '',
        details: '',
        submitted: false,
        submitting: false
      };
    }
  },
  template:`
  <div>
    <!-- Cinematic Hero -->
    <section class="stories-hero" :style="{backgroundImage: 'url(' + heroImage + ')'}">
      <div class="container-wide reveal">
        <div class="stories-hero-eyebrow">
          <i class="fa-solid fa-fire-flame-curved"></i> {{heroEyebrow}}
        </div>
        <h1 class="stories-hero-title">{{heroTitle}}</h1>
        <p class="stories-hero-subtitle">{{heroSubtitle}}</p>
        <div class="stories-hero-actions">
          <a href="#stories-feed" class="btn-brand" style="border-radius:9999px;padding:12px 28px">
            <i class="fa-solid fa-book-open"></i> Browse Testimonies
          </a>
          <button type="button" @click="showModal = true" class="btn-hero-share">
            <i class="fa-solid fa-pen-to-square"></i> Share Your Story
          </button>
        </div>
      </div>
    </section>

    <!-- Sticky Filter & Live Search Bar -->
    <section class="stories-filter-section" id="stories-feed">
      <div class="container-wide">
        <div class="stories-controls-row">
          <div class="story-tabs">
            <button type="button" class="story-tab-btn" :class="{active: activeCategory === 'all'}" @click="setCategory('all')">
              All Stories <span class="tab-count">{{categoryCounts.all}}</span>
            </button>
            <button type="button" class="story-tab-btn" :class="{active: activeCategory === 'healing'}" @click="setCategory('healing')">
              <i class="fa-solid fa-heart-pulse"></i> Healing & Miracles <span class="tab-count">{{categoryCounts.healing}}</span>
            </button>
            <button type="button" class="story-tab-btn" :class="{active: activeCategory === 'breakthrough'}" @click="setCategory('breakthrough')">
              <i class="fa-solid fa-chart-line"></i> Breakthrough & Favor <span class="tab-count">{{categoryCounts.breakthrough}}</span>
            </button>
            <button type="button" class="story-tab-btn" :class="{active: activeCategory === 'family'}" @click="setCategory('family')">
              <i class="fa-solid fa-people-roof"></i> Salvation & Family <span class="tab-count">{{categoryCounts.family}}</span>
            </button>
            <button type="button" class="story-tab-btn" :class="{active: activeCategory === 'impact'}" @click="setCategory('impact')">
              <i class="fa-solid fa-hand-holding-hand"></i> Impact & Missions <span class="tab-count">{{categoryCounts.impact}}</span>
            </button>
          </div>

          <div class="stories-search-box">
            <i class="fa-solid fa-magnifying-glass"></i>
            <input type="text" v-model="searchQuery" placeholder="Search testimonies by title, author, keyword..." class="stories-search-input">
            <button v-if="searchQuery" type="button" @click="searchQuery = ''" class="stories-search-clear">
              <i class="fa-solid fa-xmark"></i>
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- Main Content Section -->
    <section class="section" style="padding: 70px 0; background: #fff">
      <div class="container-wide">

        <!-- Featured Spotlight Card (shown if no search and All or matching category) -->
        <div v-if="featuredStory && !searchQuery.trim() && (activeCategory === 'all' || activeCategory === featuredStory.category)" class="story-featured-spotlight">
          <div class="story-featured-inner">
            <div class="story-featured-media">
              <img :src="featuredStory.image" :alt="featuredStory.title">
            </div>
            <div class="story-featured-body">
              <span class="story-featured-badge">
                <i class="fa-solid fa-star"></i> Featured Testimony
              </span>
              <h2 class="story-featured-title">{{featuredStory.title}}</h2>
              <div v-if="featuredStory.quote" class="story-featured-quote">
                "{{featuredStory.quote}}"
              </div>
              <div class="story-featured-meta">
                <span><i class="fa-solid fa-user-circle text-gold"></i> {{featuredStory.author}}</span>
                <span><i class="fa-regular fa-calendar"></i> {{featuredStory.date}}</span>
                <span><i class="fa-regular fa-clock"></i> {{featuredStory.read_time}}</span>
              </div>
              <a :href="featuredStory.href" class="story-featured-cta">
                Read Full Testimony <i class="fa-solid fa-arrow-right"></i>
              </a>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="!filteredStories.length" style="text-align:center;padding:80px 20px;background:#f8fafc;border-radius:24px;border:1px dashed #cbd5e1">
          <i class="fa-regular fa-folder-open" style="font-size:3rem;color:#94a3b8;margin-bottom:16px"></i>
          <h3 style="font-size:1.5rem;font-weight:700;color:#0f172a;margin-bottom:8px">No testimonies found</h3>
          <p style="color:#64748b;max-width:460px;margin:0 auto 20px">We could not find any stories matching your search criteria. Try a different keyword or view all categories.</p>
          <button type="button" class="btn-brand" @click="activeCategory='all'; searchQuery=''" style="border-radius:9999px;padding:10px 24px">
            Reset Filters
          </button>
        </div>

        <!-- Premium Stories Grid -->
        <div v-else class="story-premium-grid">
          <a v-for="story in visibleStories" :key="story.id" :href="story.href" class="story-premium-card">
            <div class="story-card-img-wrap">
              <img :src="story.image" :alt="story.title">
              <span class="story-card-cat-badge">{{story.category_name}}</span>
              <span class="story-card-read-badge"><i class="fa-regular fa-clock"></i> {{story.read_time}}</span>
            </div>
            <div class="story-card-body">
              <div class="story-card-meta">
                <i class="fa-solid fa-circle-user"></i>
                <span>{{story.author}}</span>
                <span>•</span>
                <span>{{story.date}}</span>
              </div>
              <h3 class="story-card-title">{{story.title}}</h3>
              <p class="story-card-excerpt">{{story.summary}}</p>
              <div class="story-card-cta">
                <span>Read Story</span>
                <i class="fa-solid fa-arrow-right"></i>
              </div>
            </div>
          </a>
        </div>

        <!-- Load More Button -->
        <div v-if="hasMore" style="text-align:center;margin-top:20px">
          <button type="button" class="btn-outline-brand" @click="loadMore" style="padding:14px 36px;border-radius:12px;font-weight:700;border-color:#177a87;color:#177a87">
            Load More Stories
          </button>
        </div>

      </div>
    </section>

    <!-- Testimony CTA Banner -->
    <section class="testimony-cta-section">
      <div class="container-wide">
        <div class="testimony-cta-inner">
          <div class="events-hero-eyebrow" style="margin:0 auto 16px;background:rgba(217,173,98,.2);border-color:rgba(217,173,98,.4);color:#fbbf24">
            <i class="fa-solid fa-award"></i> The Power of Testimony
          </div>
          <div class="testimony-cta-scripture">
            "And they overcame him by the blood of the Lamb, and by the word of their testimony..." — Revelation 12:11
          </div>
          <h2 style="font-family:var(--title-font,'Cormorant Garamond',serif);font-size:clamp(2rem,3.5vw,3rem);font-weight:700;color:#fff;margin-bottom:14px">
            Has God Done Something Wonderful in Your Life?
          </h2>
          <p style="color:#94a3b8;font-size:1.05rem;line-height:1.7;margin-bottom:30px">
            Your testimony is a weapon of victory and an inspiration of faith to thousands across our church family and city. Share what the Lord has done!
          </p>
          <button type="button" @click="showModal = true" class="btn-brand" style="border-radius:9999px;padding:14px 36px;font-size:1rem">
            <i class="fa-solid fa-pen-nib"></i> Submit Your Testimony
          </button>
        </div>
      </div>
    </section>

    <!-- Testimony Submission Modal -->
    <div v-if="showModal" class="testimony-modal-backdrop" @click.self="closeModal">
      <div class="testimony-modal-card">
        <button type="button" class="testimony-modal-close" @click="closeModal">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div v-if="testimonyForm.submitted" style="text-align:center;padding:24px 0">
          <div style="width:68px;height:68px;border-radius:50%;background:#dcfce7;color:#15803d;display:grid;place-items:center;margin:0 auto 20px;font-size:1.8rem">
            <i class="fa-solid fa-check"></i>
          </div>
          <h3 style="font-size:1.6rem;font-weight:800;color:#0f172a;margin-bottom:10px">Glory to God!</h3>
          <p style="color:#64748b;line-height:1.6;margin-bottom:24px">
            Thank you for sharing your wonderful testimony. Our pastoral team will review it, and it may be featured in our church services and publications!
          </p>
          <button type="button" class="btn-brand" @click="closeModal" style="border-radius:9999px;padding:12px 32px">
            Done
          </button>
        </div>

        <div v-else>
          <div style="margin-bottom:24px">
            <div style="font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#177a87;margin-bottom:6px">
              Share Your Miracle
            </div>
            <h3 style="font-size:1.6rem;font-weight:800;color:#0f172a;margin:0">Submit Your Testimony</h3>
            <p style="color:#64748b;font-size:.9rem;margin-top:6px">Let the world know of God's miraculous goodness and praise His holy Name.</p>
          </div>

          <form @submit.prevent="submitTestimony">
            <div class="testimony-form-group">
              <label class="testimony-form-label">Full Name *</label>
              <input type="text" v-model="testimonyForm.name" required placeholder="e.g. Sister Blessing Idahosa" class="testimony-form-input">
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Phone Number or Email *</label>
              <input type="text" v-model="testimonyForm.contact" required placeholder="For verification by our pastoral team" class="testimony-form-input">
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Testimony Category *</label>
              <select v-model="testimonyForm.category" required class="testimony-form-select">
                <option value="healing">Divine Healing & Health</option>
                <option value="breakthrough">Financial & Career Breakthrough</option>
                <option value="family">Family, Children & Salvation</option>
                <option value="impact">Soul Winning & Ministry Impact</option>
                <option value="other">Other Supernatural Encounters</option>
              </select>
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Testimony Title *</label>
              <input type="text" v-model="testimonyForm.title" required placeholder="e.g. Healed from 5 Years of Spinal Pain" class="testimony-form-input">
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Detailed Story *</label>
              <textarea v-model="testimonyForm.details" required rows="5" placeholder="Share what the situation was, what God did, and the scriptures that anchored your faith..." class="testimony-form-textarea"></textarea>
            </div>

            <button type="submit" class="btn-brand" style="width:100%;border-radius:12px;padding:14px;font-size:.95rem;font-weight:700" :disabled="testimonyForm.submitting">
              {{testimonyForm.submitting ? 'Submitting Testimony...' : 'Send Testimony to Pastoral Team'}}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>`
};

const StoryDetailPage = {
  inject:['cms'],
  data(){
    return {
      commentForm:{display_name:'', comment:'', message:'', error:'', posting:false},
      showModal: false,
      testimonyForm: {
        name: '',
        contact: '',
        category: 'healing',
        title: '',
        details: '',
        submitted: false,
        submitting: false
      },
      copied: false
    };
  },
  computed:{
    storyId(){ return (location.hash.replace('#/','').split('/')[1] || '').trim(); },
    stories(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.stories) ? this.cms.home.stories : []; },
    story(){
      const found = this.stories.find(item => String(item.id) === String(this.storyId)) || {};
      const catMap = {
        healing: 'Healing & Miracles',
        breakthrough: 'Breakthrough & Favor',
        family: 'Salvation & Family',
        impact: 'Impact & Missions'
      };
      return {
        id: found.id || '',
        eyebrow: found.eyebrow || 'Testimony',
        title: found.title || 'Story not found',
        subtitle: found.subtitle || '',
        category: found.category || 'healing',
        category_name: found.category_name || catMap[found.category] || 'Testimony',
        author: found.author || 'Church Member',
        date: found.date || '2026',
        read_time: found.read_time || '3 min read',
        quote: found.quote || '',
        scripture: found.scripture || '',
        summary: found.summary || found.subtitle || '',
        body: found.body || '',
        image: this.cacheAsset(found.thumb_url || found.media_url || 'assets/uploaded_media/partnership_outreach_banner.jpg', found.updated_ts),
        media_url: found.media_url ? this.cacheAsset(found.media_url, found.updated_ts) : '',
        thumb_url: found.thumb_url ? this.cacheAsset(found.thumb_url, found.updated_ts) : '',
        media_type: found.media_type || 'image',
        comments: Array.isArray(found.comments) ? found.comments : []
      };
    },
    otherStories(){
      return this.stories
        .filter(item => String(item.id) !== String(this.storyId))
        .slice(0, 3)
        .map(s => ({
          id: s.id,
          title: s.title,
          category_name: s.category_name || 'Testimony',
          author: s.author || 'Church Member',
          image: this.cacheAsset(s.thumb_url || s.media_url || '', s.updated_ts),
          href: '#/stories/' + s.id
        }));
    }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    submitComment(){
      const comment = this.commentForm.comment.trim();
      if(!this.story.id || !comment){ this.commentForm.error='Enter a comment before posting.'; return; }
      this.commentForm.posting=true;
      this.commentForm.error='';
      this.commentForm.message='';
      const body = new URLSearchParams({
        story_id:this.story.id,
        display_name:this.commentForm.display_name.trim() || 'Anonymous',
        comment
      });
      fetch(OLD.storyComment,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(response=>response.json())
        .then(data=>{
          if(!data || !data.ok){ this.commentForm.error=(data && data.error) ? data.error : 'Unable to post comment.'; return; }
          this.commentForm.comment='';
          this.commentForm.display_name='';
          this.commentForm.message=data.message || 'Thanks. Your celebration note is waiting for approval.';
        })
        .catch(()=>{ this.commentForm.error='Unable to post right now.'; })
        .finally(()=>{ this.commentForm.posting=false; });
    },
    shareWhatsApp(){
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent('Read this inspiring testimony from Christ Embassy New Benin: ' + this.story.title);
      window.open('https://api.whatsapp.com/send?text=' + text + '%20' + url, '_blank');
    },
    shareFacebook(){
      const url = encodeURIComponent(window.location.href);
      window.open('https://www.facebook.com/sharer/sharer.php?u=' + url, '_blank');
    },
    shareTwitter(){
      const url = encodeURIComponent(window.location.href);
      const text = encodeURIComponent(this.story.title + ' | Christ Embassy New Benin');
      window.open('https://twitter.com/intent/tweet?url=' + url + '&text=' + text, '_blank');
    },
    copyShareLink(){
      if(navigator.clipboard){
        navigator.clipboard.writeText(window.location.href);
        this.copied = true;
        setTimeout(() => { this.copied = false; }, 2000);
      }
    },
    submitTestimony(){
      this.testimonyForm.submitting = true;
      setTimeout(() => {
        this.testimonyForm.submitting = false;
        this.testimonyForm.submitted = true;
      }, 700);
    },
    closeModal(){
      this.showModal = false;
      this.testimonyForm = {
        name: '',
        contact: '',
        category: 'healing',
        title: '',
        details: '',
        submitted: false,
        submitting: false
      };
    }
  },
  template:`
  <div>
    <!-- Cinematic Header with Breadcrumbs -->
    <section class="story-detail-hero" :style="{backgroundImage: 'url(' + (story.image || 'assets/uploaded_media/partnership_outreach_banner.jpg') + ')'}">
      <div class="container-wide reveal">
        <nav class="story-breadcrumb">
          <a href="#/">Home</a>
          <i class="fa-solid fa-chevron-right" style="font-size:.68rem"></i>
          <a href="#/stories">Stories & Testimonies</a>
          <i class="fa-solid fa-chevron-right" style="font-size:.68rem"></i>
          <span style="color:#5eead4">{{story.title}}</span>
        </nav>
        <div class="stories-hero-eyebrow">
          <i class="fa-solid fa-fire-flame-curved"></i> {{story.category_name}}
        </div>
        <h1 class="stories-hero-title" style="max-width:900px">{{story.title}}</h1>
        <div style="display:flex;align-items:center;gap:18px;color:#cbd5e1;font-size:.9rem;flex-wrap:wrap">
          <span><i class="fa-solid fa-circle-user text-gold"></i> By {{story.author}}</span>
          <span>•</span>
          <span><i class="fa-regular fa-calendar"></i> {{story.date}}</span>
          <span>•</span>
          <span><i class="fa-regular fa-clock"></i> {{story.read_time}}</span>
        </div>
      </div>
    </section>

    <!-- Main Content Section -->
    <section class="section" style="padding: 70px 0; background: #fff">
      <div class="container-wide">
        <div class="story-detail-grid">

          <!-- Main Column -->
          <div>
            <!-- Featured Visual -->
            <div v-if="story.image" style="border-radius:20px;overflow:hidden;margin-bottom:36px;box-shadow:0 8px 30px rgba(0,0,0,.08)">
              <img :src="story.image" :alt="story.title" style="width:100%;display:block;object-fit:cover;max-height:480px;object-position:center 20%">
            </div>

            <!-- Video / Embed if available -->
            <div class="story-detail-media" v-if="story.media_type === 'video'" style="margin-bottom:36px;border-radius:16px;overflow:hidden">
              <video :src="story.media_url" :poster="story.thumb_url" controls playsinline preload="metadata" style="width:100%;display:block"></video>
            </div>
            <div class="story-detail-media" v-else-if="story.media_type === 'embed'" style="margin-bottom:36px;border-radius:16px;overflow:hidden">
              <iframe :src="story.media_url" :title="story.title" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen style="width:100%;height:400px;border:none"></iframe>
            </div>

            <!-- Pull Quote if available -->
            <div v-if="story.quote" class="story-pull-quote">
              <i class="fa-solid fa-quote-left" style="font-size:1.3rem;color:#177a87;margin-right:8px"></i>
              "{{story.quote}}"
            </div>

            <!-- Scripture Anchor Box -->
            <div v-if="story.scripture" class="story-scripture-box">
              <div style="font-weight:800;text-transform:uppercase;font-size:.78rem;letter-spacing:.1em;margin-bottom:4px">
                <i class="fa-solid fa-book-bible me-1"></i> Scripture Anchor
              </div>
              <div>{{story.scripture}}</div>
            </div>

            <!-- Rich Story Narrative -->
            <article class="story-detail-body" v-if="story.body" v-html="story.body"></article>
            <article class="story-detail-body" v-else-if="story.summary"><p>{{story.summary}}</p></article>

            <!-- Social Share Bar -->
            <div style="margin-top:40px;padding:24px 30px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:20px;flex-wrap:wrap">
              <div style="font-weight:700;color:#0f172a;font-size:.92rem">Share this testimony:</div>
              <div style="display:flex;gap:10px;flex-wrap:wrap">
                <button type="button" @click="shareWhatsApp" style="padding:8px 16px;border-radius:8px;background:#25d366;color:#fff;border:none;font-size:.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                  <i class="fa-brands fa-whatsapp"></i> WhatsApp
                </button>
                <button type="button" @click="shareFacebook" style="padding:8px 16px;border-radius:8px;background:#1877f2;color:#fff;border:none;font-size:.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                  <i class="fa-brands fa-facebook-f"></i> Facebook
                </button>
                <button type="button" @click="shareTwitter" style="padding:8px 16px;border-radius:8px;background:#0f172a;color:#fff;border:none;font-size:.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                  <i class="fa-brands fa-x-twitter"></i> X (Twitter)
                </button>
                <button type="button" @click="copyShareLink" style="padding:8px 16px;border-radius:8px;background:#e2e8f0;color:#0f172a;border:none;font-size:.85rem;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:6px">
                  <i class="fa-regular fa-copy"></i> {{copied ? 'Copied!' : 'Copy Link'}}
                </button>
              </div>
            </div>

            <!-- Comments & Rejoicing Notes -->
            <section class="story-comments-panel" style="margin-top:50px;padding-top:40px;border-top:1px solid #e2e8f0">
              <div style="margin-bottom:28px">
                <div class="eyebrow" style="margin-bottom:6px">Rejoice With Us</div>
                <h3 style="font-family:var(--title-font,'Cormorant Garamond',serif);font-size:1.9rem;font-weight:700;color:#0f172a;margin:0">
                  Leave a Note of Celebration
                </h3>
              </div>

              <div class="story-comment-list" v-if="story.comments.length">
                <article v-for="comment in story.comments" class="story-comment" style="background:#f8fafc;border-radius:14px;padding:18px;margin-bottom:14px">
                  <div style="display:flex;justify-content:space-between;margin-bottom:6px">
                    <b style="color:#0f172a">{{comment.display_name || 'Anonymous'}}</b>
                    <span style="color:#94a3b8;font-size:.8rem">{{comment.date_label}}</span>
                  </div>
                  <p style="color:#475569;margin:0;font-size:.92rem">{{comment.comment}}</p>
                </article>
              </div>
              <p v-else style="color:#94a3b8;font-size:.92rem;margin-bottom:24px">Be the first to rejoice and celebrate God's faithfulness in this testimony!</p>

              <form class="story-comment-form" @submit.prevent="submitComment">
                <div style="display:grid;gap:12px;margin-bottom:16px">
                  <input v-model="commentForm.display_name" maxlength="120" placeholder="Your name (optional)" class="testimony-form-input">
                  <textarea v-model="commentForm.comment" maxlength="800" rows="3" placeholder="Praise God for this miracle..." required class="testimony-form-textarea"></textarea>
                </div>
                <small v-if="commentForm.message" style="color:#15803d;display:block;margin-bottom:10px;font-weight:700">{{commentForm.message}}</small>
                <small v-if="commentForm.error" style="color:#dc2626;display:block;margin-bottom:10px">{{commentForm.error}}</small>
                <button type="submit" class="btn-brand" :disabled="commentForm.posting" style="border-radius:9999px;padding:10px 28px">
                  {{commentForm.posting ? 'Posting...' : 'Post Celebration'}}
                </button>
              </form>
            </section>
          </div>

          <!-- Right Sidebar -->
          <div>
            <!-- Overview Card -->
            <div class="story-sidebar-card">
              <h4>About This Testimony</h4>
              <div style="display:grid;gap:16px;font-size:.9rem">
                <div>
                  <div style="color:#64748b;font-size:.78rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Category</div>
                  <div style="font-weight:700;color:#0f172a">{{story.category_name}}</div>
                </div>
                <div>
                  <div style="color:#64748b;font-size:.78rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Testifier</div>
                  <div style="font-weight:700;color:#0f172a">{{story.author}}</div>
                </div>
                <div>
                  <div style="color:#64748b;font-size:.78rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Date Recorded</div>
                  <div style="font-weight:700;color:#0f172a">{{story.date}}</div>
                </div>
                <div>
                  <div style="color:#64748b;font-size:.78rem;font-weight:700;text-transform:uppercase;margin-bottom:3px">Location</div>
                  <div style="font-weight:700;color:#0f172a">Christ Embassy New Benin Main Church</div>
                </div>
              </div>
            </div>

            <!-- Submit Testimony Card -->
            <div style="background:linear-gradient(135deg,#090e1a,#111b2e);color:#fff;border-radius:20px;padding:28px;margin-bottom:30px">
              <div style="color:#fbbf24;font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">
                Your Turn to Testify
              </div>
              <h4 style="font-size:1.2rem;font-weight:800;color:#fff;margin-bottom:10px">Have a Testimony?</h4>
              <p style="color:#94a3b8;font-size:.88rem;line-height:1.6;margin-bottom:20px">
                Tell us what the Lord has done for you and encourage others to believe God for their own miracle.
              </p>
              <button type="button" @click="showModal = true" class="btn-brand" style="width:100%;border-radius:9999px;padding:12px;font-size:.88rem">
                <i class="fa-solid fa-pen-nib"></i> Share Your Story
              </button>
            </div>

            <!-- More Stories Widget -->
            <div class="story-sidebar-card" v-if="otherStories.length">
              <h4>More Testimonies</h4>
              <div style="display:grid;gap:18px">
                <a v-for="rel in otherStories" :key="rel.id" :href="rel.href" style="display:flex;gap:14px;text-decoration:none;align-items:center">
                  <img v-if="rel.image" :src="rel.image" :alt="rel.title" style="width:72px;height:62px;border-radius:10px;object-fit:cover;flex-shrink:0">
                  <div style="min-width:0">
                    <span style="font-size:.72rem;font-weight:800;color:#177a87;text-transform:uppercase;display:block">{{rel.category_name}}</span>
                    <h5 style="font-size:.88rem;font-weight:700;color:#0f172a;margin:2px 0;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{rel.title}}</h5>
                    <small style="color:#64748b;font-size:.78rem">{{rel.author}}</small>
                  </div>
                </a>
              </div>
              <div style="margin-top:20px;padding-top:16px;border-top:1px solid #e2e8f0;text-align:center">
                <a href="#/stories" style="color:#177a87;font-size:.85rem;font-weight:700;text-decoration:none">
                  View All Testimonies →
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- Testimony Submission Modal -->
    <div v-if="showModal" class="testimony-modal-backdrop" @click.self="closeModal">
      <div class="testimony-modal-card">
        <button type="button" class="testimony-modal-close" @click="closeModal">
          <i class="fa-solid fa-xmark"></i>
        </button>

        <div v-if="testimonyForm.submitted" style="text-align:center;padding:24px 0">
          <div style="width:68px;height:68px;border-radius:50%;background:#dcfce7;color:#15803d;display:grid;place-items:center;margin:0 auto 20px;font-size:1.8rem">
            <i class="fa-solid fa-check"></i>
          </div>
          <h3 style="font-size:1.6rem;font-weight:800;color:#0f172a;margin-bottom:10px">Glory to God!</h3>
          <p style="color:#64748b;line-height:1.6;margin-bottom:24px">
            Thank you for sharing your wonderful testimony. Our pastoral team will review it, and it may be featured in our church services and publications!
          </p>
          <button type="button" class="btn-brand" @click="closeModal" style="border-radius:9999px;padding:12px 32px">
            Done
          </button>
        </div>

        <div v-else>
          <div style="margin-bottom:24px">
            <div style="font-size:.78rem;font-weight:800;text-transform:uppercase;letter-spacing:.12em;color:#177a87;margin-bottom:6px">
              Share Your Miracle
            </div>
            <h3 style="font-size:1.6rem;font-weight:800;color:#0f172a;margin:0">Submit Your Testimony</h3>
            <p style="color:#64748b;font-size:.9rem;margin-top:6px">Let the world know of God's miraculous goodness and praise His holy Name.</p>
          </div>

          <form @submit.prevent="submitTestimony">
            <div class="testimony-form-group">
              <label class="testimony-form-label">Full Name *</label>
              <input type="text" v-model="testimonyForm.name" required placeholder="e.g. Sister Blessing Idahosa" class="testimony-form-input">
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Phone Number or Email *</label>
              <input type="text" v-model="testimonyForm.contact" required placeholder="For verification by our pastoral team" class="testimony-form-input">
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Testimony Category *</label>
              <select v-model="testimonyForm.category" required class="testimony-form-select">
                <option value="healing">Divine Healing & Health</option>
                <option value="breakthrough">Financial & Career Breakthrough</option>
                <option value="family">Family, Children & Salvation</option>
                <option value="impact">Soul Winning & Ministry Impact</option>
                <option value="other">Other Supernatural Encounters</option>
              </select>
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Testimony Title *</label>
              <input type="text" v-model="testimonyForm.title" required placeholder="e.g. Healed from 5 Years of Spinal Pain" class="testimony-form-input">
            </div>

            <div class="testimony-form-group">
              <label class="testimony-form-label">Detailed Story *</label>
              <textarea v-model="testimonyForm.details" required rows="5" placeholder="Share what the situation was, what God did, and the scriptures that anchored your faith..." class="testimony-form-textarea"></textarea>
            </div>

            <button type="submit" class="btn-brand" style="width:100%;border-radius:12px;padding:14px;font-size:.95rem;font-weight:700" :disabled="testimonyForm.submitting">
              {{testimonyForm.submitting ? 'Submitting Testimony...' : 'Send Testimony to Pastoral Team'}}
            </button>
          </form>
        </div>
      </div>
    </div>
  </div>`
};

const EventDetailPage = {
  inject:['cms'],
  computed:{
    eventId(){ return ((this.$root.routeParts && this.$root.routeParts[1]) || location.hash.replace('#/','').split('/')[1] || '').trim(); },
    events(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.events) ? this.cms.home.events : []; },
    event(){
      const found = this.events.find(item => String(item.id) === String(this.eventId)) || {};
      const image = found.image_url ? this.cacheAsset(found.image_url, found.updated_ts) : '';
      return {
        id: found.id || '',
        eyebrow: found.eyebrow || 'Event',
        title: found.title || 'Event not found',
        subtitle: found.subtitle || '',
        summary: found.summary || found.subtitle || '',
        body: found.body || '',
        event_date: found.event_date || '',
        time_text: found.time_text || '',
        date_badge: found.date_badge || 'EVENT',
        location: found.location || '',
        category: found.category || '',
        image_url: image
      };
    },
    otherEvents(){
      return this.events
        .filter(e => String(e.id) !== String(this.eventId))
        .slice(0, 3)
        .map(e => ({
          id: e.id,
          title: e.title,
          eyebrow: e.eyebrow || 'Event',
          date_badge: e.date_badge || 'EVENT',
          image_url: this.cacheAsset(e.image_url, e.updated_ts),
          href: '#/events/' + e.id
        }));
    },
    categoryLabel(){
      const labels = {weekly:'Weekly Service',special:'Special Gathering',global:'Global Event'};
      return labels[this.event.category] || 'Church Event';
    }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    }
  },
  template:`
  <div>
    <!-- Detail Hero -->
    <section class="event-detail-hero" :style="event.image_url ? {backgroundImage:'url('+event.image_url+')'} : {}">
      <div class="container-wide">
        <div class="event-breadcrumb">
          <a href="#/"><i class="fa-solid fa-house"></i> Home</a>
          <i class="fa-solid fa-chevron-right" style="font-size:.65rem"></i>
          <a href="#/events">Events</a>
          <i class="fa-solid fa-chevron-right" style="font-size:.65rem"></i>
          <span style="color:#5eead4">{{event.title}}</span>
        </div>
        <div class="events-hero-eyebrow"><i class="fa-solid fa-calendar-check"></i> {{event.eyebrow}}</div>
        <h1 class="events-hero-title">{{event.title}}</h1>
        <p v-if="event.summary" class="events-hero-subtitle" style="margin-bottom:0">{{event.summary}}</p>
      </div>
    </section>

    <!-- Content -->
    <section class="event-detail-content-section">
      <div class="container-wide">
        <div class="event-detail-grid">
          <!-- Main Content -->
          <div>
            <div v-if="event.image_url" style="border-radius:20px;overflow:hidden;margin-bottom:36px;box-shadow:0 8px 30px rgba(0,0,0,.08)">
              <img :src="event.image_url" :alt="event.title" style="width:100%;display:block;object-fit:cover;max-height:480px;object-position:center 20%">
            </div>

            <h2 style="font-family:var(--title-font,'Cormorant Garamond',serif);font-size:2rem;font-weight:700;color:#0f172a;margin-bottom:18px">About This Event</h2>
            <article class="story-detail-body" v-if="event.body" v-html="event.body"></article>
            <article class="story-detail-body" v-else-if="event.summary"><p>{{event.summary}}</p></article>

            <!-- Share CTA -->
            <div style="margin-top:40px;padding:30px;background:#f8fafc;border-radius:16px;border:1px solid #e2e8f0;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
              <div style="flex:1;min-width:200px">
                <h4 style="font-size:1.1rem;font-weight:800;color:#0f172a;margin:0 0 6px">Invite Someone</h4>
                <p style="color:#64748b;font-size:.88rem;margin:0">Share this event with your friends and family.</p>
              </div>
              <div style="display:flex;gap:10px">
                <a :href="'https://wa.me/?text='+encodeURIComponent(event.title+' — '+location.href)" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;background:#25d366;color:#fff;font-size:1.1rem;text-decoration:none"><i class="fa-brands fa-whatsapp"></i></a>
                <a :href="'https://www.facebook.com/sharer/sharer.php?u='+encodeURIComponent(location.href)" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;background:#1877f2;color:#fff;font-size:1.1rem;text-decoration:none"><i class="fa-brands fa-facebook-f"></i></a>
                <a :href="'https://twitter.com/intent/tweet?text='+encodeURIComponent(event.title)+' &url='+encodeURIComponent(location.href)" target="_blank" style="display:inline-flex;align-items:center;justify-content:center;width:42px;height:42px;border-radius:10px;background:#0f172a;color:#fff;font-size:1.1rem;text-decoration:none"><i class="fa-brands fa-x-twitter"></i></a>
              </div>
            </div>
          </div>

          <!-- Sidebar -->
          <div>
            <div class="event-sidebar-card">
              <h4><i class="fa-solid fa-info-circle" style="color:#177a87;margin-right:8px"></i> Event Details</h4>
              <div style="display:flex;flex-direction:column;gap:16px">
                <div style="display:flex;align-items:flex-start;gap:12px" v-if="event.date_badge">
                  <div style="width:40px;height:40px;border-radius:10px;background:rgba(23,122,135,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-tag" style="color:#177a87"></i></div>
                  <div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Type</div><div style="font-weight:700;color:#0f172a">{{categoryLabel}}</div></div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px" v-if="event.event_date">
                  <div style="width:40px;height:40px;border-radius:10px;background:rgba(23,122,135,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-regular fa-calendar" style="color:#177a87"></i></div>
                  <div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Date</div><div style="font-weight:700;color:#0f172a">{{event.event_date}}</div></div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px" v-if="event.time_text">
                  <div style="width:40px;height:40px;border-radius:10px;background:rgba(23,122,135,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-regular fa-clock" style="color:#177a87"></i></div>
                  <div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Time</div><div style="font-weight:700;color:#0f172a">{{event.time_text}}</div></div>
                </div>
                <div style="display:flex;align-items:flex-start;gap:12px" v-if="event.location">
                  <div style="width:40px;height:40px;border-radius:10px;background:rgba(23,122,135,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0"><i class="fa-solid fa-location-dot" style="color:#177a87"></i></div>
                  <div><div style="font-size:.75rem;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94a3b8">Venue</div><div style="font-weight:700;color:#0f172a">{{event.location}}</div></div>
                </div>
              </div>
            </div>

            <div class="event-sidebar-card" style="background:linear-gradient(135deg,#0e1628,#080d19);border-color:rgba(23,122,135,.3)">
              <h4 style="color:#fff;border-bottom-color:rgba(255,255,255,.1)"><i class="fa-solid fa-map-location-dot" style="color:#5eead4;margin-right:8px"></i> Plan Your Visit</h4>
              <p style="color:#94a3b8;font-size:.9rem;line-height:1.6;margin-bottom:18px">First time? We'd love to welcome you. Get directions and know what to expect.</p>
              <a href="#/visit" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px 20px;border-radius:10px;background:linear-gradient(135deg,#177a87,#0e5f6b);color:#fff;font-weight:700;font-size:.88rem;text-decoration:none;box-shadow:0 4px 12px rgba(23,122,135,.3)"><i class="fa-solid fa-arrow-right"></i> Plan Your Visit</a>
            </div>

            <!-- Other Events -->
            <div v-if="otherEvents.length" class="event-sidebar-card">
              <h4><i class="fa-solid fa-calendar-days" style="color:#177a87;margin-right:8px"></i> Other Events</h4>
              <div style="display:flex;flex-direction:column;gap:14px">
                <a v-for="oe in otherEvents" :key="oe.id" :href="oe.href" style="display:flex;gap:14px;align-items:center;text-decoration:none;padding:10px;border-radius:12px;border:1px solid #e2e8f0;transition:border-color .2s" onmouseover="this.style.borderColor='#177a87'" onmouseout="this.style.borderColor='#e2e8f0'">
                  <img :src="oe.image_url" :alt="oe.title" style="width:60px;height:60px;border-radius:10px;object-fit:cover;flex-shrink:0">
                  <div>
                    <div style="font-size:.72rem;font-weight:700;color:#177a87;text-transform:uppercase;letter-spacing:.06em">{{oe.date_badge}}</div>
                    <div style="font-size:.92rem;font-weight:700;color:#0f172a;line-height:1.3">{{oe.title}}</div>
                  </div>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:40px"><a href="#/events" style="display:inline-flex;align-items:center;gap:8px;padding:12px 28px;border-radius:10px;border:1px solid #cbd5e1;color:#334155;font-weight:700;font-size:.9rem;text-decoration:none;transition:all .2s" onmouseover="this.style.borderColor='#177a87';this.style.color='#177a87'" onmouseout="this.style.borderColor='#cbd5e1';this.style.color='#334155'"><i class="fa-solid fa-arrow-left"></i> Back to All Events</a></div>
      </div>
    </section>
  </div>`
};


const SermonDetailPage = {
  inject:['cms'],
  data(){
    return {
      copiedShare: false
    };
  },
  computed:{
    sermonId(){ return (location.hash.replace('#/','').split('/')[1] || '').trim(); },
    sermons(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons : []; },
    sermon(){
      const found = this.sermons.find(item => String(item.id) === String(this.sermonId)) || this.sermons[0] || {};
      const media = found.media_url ? this.cacheAsset(found.media_url, found.updated_ts) : '';
      const poster = found.poster_url ? this.cacheAsset(found.poster_url, found.updated_ts) : '';
      return {
        id: found.id || '',
        eyebrow: found.eyebrow || 'Message & Teaching',
        category: found.category || 'Sunday Service',
        title: found.title || 'Sermon Message',
        subtitle: found.subtitle || '',
        body: found.body || '',
        speaker: found.speaker || 'Rev. Dr. Chris Oyakhilome D.Sc., D.D.',
        date: found.date || '',
        duration: found.duration || '',
        scripture: found.scripture || '',
        media_type: found.media_type || (found.embed_url ? 'embed' : 'video'),
        media_url: media,
        embed_url: found.embed_url || '',
        poster_url: poster || (found.media_type === 'image' ? media : 'assets/uploaded_media/sermons_hero_banner.jpg')
      };
    },
    heroBackground(){
      const image = this.sermon.poster_url || 'assets/uploaded_media/sermons_hero_banner.jpg';
      return "linear-gradient(180deg, rgba(10, 14, 26, 0.82) 0%, rgba(10, 14, 26, 0.96) 100%), url('" + image + "')";
    },
    relatedSermons(){
      return this.sermons
        .filter(s => String(s.id) !== String(this.sermon.id))
        .slice(0, 3)
        .map(item => ({
          ...item,
          poster_url: this.cacheAsset(item.poster_url, item.updated_ts) || 'assets/uploaded_media/sermons_hero_banner.jpg',
          href: '#/watch/' + item.id
        }));
    }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    copyShare(){
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).then(() => {
          this.copiedShare = true;
          setTimeout(() => { this.copiedShare = false; }, 2500);
        });
      }
    }
  },
  template:`
  <div>
    <!-- Sub Hero -->
    <section class="sub-hero sermon-detail-hero" :style="{backgroundImage:heroBackground, backgroundSize:'cover', backgroundPosition:'center'}">
      <div class="container-wide reveal">
        <div class="d-flex align-items-center gap-2 mb-3">
          <a href="#/watch" class="sermon-back-link"><i class="fa-solid fa-arrow-left me-1"></i> All Messages</a>
          <span class="text-muted">•</span>
          <span class="badge bg-gold text-dark fw-bold text-uppercase px-2 py-1">{{sermon.category}}</span>
        </div>
        <h1 class="title-serif text-white">{{sermon.title}}</h1>
        <p v-if="sermon.subtitle" class="text-lg cms-subtitle text-light">{{sermon.subtitle}}</p>
      </div>
    </section>

    <!-- Main Detail Content -->
    <section class="section dark-band sermon-detail-section">
      <div class="container-wide">
        <!-- Cinema Player Area -->
        <div class="sermon-cinema-wrapper mb-5">
          <div class="cinema-player">
            <iframe v-if="sermon.embed_url" :src="sermon.embed_url" :title="sermon.title" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
            <video v-else-if="sermon.media_url" :src="sermon.media_url" :poster="sermon.poster_url" controls playsinline preload="metadata"></video>
            <div v-else class="cinema-poster-standby">
              <img :src="sermon.poster_url" :alt="sermon.title" class="w-100 h-100 object-fit-cover">
              <div class="poster-overlay-play">
                <a :href="'https://www.youtube.com/results?search_query=Christ+Embassy+New+Benin+' + encodeURIComponent(sermon.title)" target="_blank" rel="noopener" class="btn-gold btn-lg">
                  <i class="fa-solid fa-play me-2"></i> Stream on YouTube
                </a>
              </div>
            </div>
          </div>

          <!-- Sermon Quick Meta Bar -->
          <div class="sermon-player-bar">
            <div class="d-flex flex-wrap align-items-center justify-content-between gap-3">
              <div class="d-flex flex-wrap align-items-center gap-3">
                <div class="sermon-speaker-avatar">
                  <i class="fa-solid fa-user-tie"></i>
                </div>
                <div>
                  <h4 class="text-white m-0 fw-bold">{{sermon.speaker}}</h4>
                  <div class="text-muted small d-flex align-items-center gap-2 mt-1">
                    <span v-if="sermon.date"><i class="fa-regular fa-calendar me-1"></i> {{sermon.date}}</span>
                    <span v-if="sermon.duration"><i class="fa-regular fa-clock me-1"></i> {{sermon.duration}}</span>
                    <span v-if="sermon.scripture" class="text-gold"><i class="fa-solid fa-book-bible me-1"></i> {{sermon.scripture}}</span>
                  </div>
                </div>
              </div>

              <div class="d-flex align-items-center gap-2">
                <button type="button" class="btn-outline-gold btn-sm" @click="copyShare">
                  <i :class="copiedShare ? 'fa-solid fa-check text-success me-1' : 'fa-solid fa-share-nodes me-1'"></i>
                  {{copiedShare ? 'Link Copied!' : 'Share Message'}}
                </button>
                <a href="#/watch" class="btn-outline-darkbrand btn-sm">
                  <i class="fa-solid fa-layer-group me-1"></i> Library
                </a>
              </div>
            </div>
          </div>
        </div>

        <!-- Two Column Layout: Message Notes & Study Material + Related Messages -->
        <div class="row g-4">
          <div class="col-lg-8">
            <!-- Study Notes Card -->
            <div class="sermon-notes-card p-4 p-md-5 mb-4">
              <div class="d-flex align-items-center justify-content-between pb-3 mb-4 border-bottom border-secondary border-opacity-25">
                <div class="d-flex align-items-center gap-2">
                  <span class="notes-icon-wrap"><i class="fa-solid fa-feather-pointed text-gold"></i></span>
                  <h3 class="text-white m-0">Teaching Notes & Outline</h3>
                </div>
                <span v-if="sermon.scripture" class="badge-scripture-highlight">{{sermon.scripture}}</span>
              </div>

              <article class="sermon-body-text text-light" v-if="sermon.body" v-html="sermon.body"></article>
              <article class="sermon-body-text text-light" v-else>
                <p class="lead text-gold mb-3">{{sermon.subtitle || 'Discover how to live triumphantly in Christ.'}}</p>
                <p>In this inspiring teaching, Pastor Chris unfolds the dynamic reality of God\\'s Word at work in the believer. You will receive practical revelation on walking in dominion, releasing faith, and aligning your confession with divine truth.</p>
                <div class="study-points p-4 my-4 rounded-3">
                  <h5 class="text-gold mb-3"><i class="fa-solid fa-lightbulb me-2"></i> Key Takeaways & Meditation</h5>
                  <ul class="mb-0 text-light list-unstyled d-flex flex-column gap-2">
                    <li><i class="fa-solid fa-check text-gold me-2"></i> <strong>Renew your mind:</strong> Your consciousness of God\\'s Word determines the scope of your victory.</li>
                    <li><i class="fa-solid fa-check text-gold me-2"></i> <strong>Consistent proclamation:</strong> Speak the Word over your health, finances, family, and purpose daily.</li>
                    <li><i class="fa-solid fa-check text-gold me-2"></i> <strong>Supernatural walk:</strong> You are seated with Christ in the heavenly realms, far above all principalities.</li>
                  </ul>
                </div>
              </article>

              <div class="mt-4 pt-3 border-top border-secondary border-opacity-25 d-flex flex-wrap gap-3 align-items-center justify-content-between">
                <div class="text-muted small">
                  <i class="fa-solid fa-church me-1"></i> Christ Embassy New Benin Church of Excellence
                </div>
                <a href="#/visit" class="btn-gold btn-sm">
                  <i class="fa-solid fa-location-dot me-1"></i> Join Us This Sunday
                </a>
              </div>
            </div>
          </div>

          <!-- Sidebar: Related Messages -->
          <div class="col-lg-4">
            <div class="related-sermons-sidebar">
              <h4 class="text-white mb-3 d-flex align-items-center gap-2">
                <i class="fa-solid fa-clapperboard text-gold"></i> More Messages from Pastor Chris
              </h4>
              <div class="d-flex flex-column gap-3">
                <a v-for="rel in relatedSermons" :key="rel.id" :href="rel.href" class="related-sermon-card text-decoration-none">
                  <div class="related-thumb-wrap">
                    <img :src="rel.poster_url" :alt="rel.title" class="related-thumb">
                    <span v-if="rel.duration" class="related-duration">{{rel.duration}}</span>
                  </div>
                  <div class="related-info">
                    <span class="badge-cat-sm">{{rel.category || 'Message'}}</span>
                    <h5 class="related-title text-white mb-1">{{rel.title}}</h5>
                    <small class="text-muted d-block">{{rel.speaker || 'Rev. Dr. Chris Oyakhilome D.Sc., D.D.'}}</small>
                    <small v-if="rel.scripture" class="text-gold-light mt-1 d-block"><i class="fa-solid fa-bible me-1"></i> {{rel.scripture}}</small>
                  </div>
                </a>
              </div>

              <!-- Live broadcast callout in sidebar -->
              <div class="live-callout-card mt-4 p-3 rounded-3 text-center">
                <span class="live-dot-pulse mx-auto mb-2"></span>
                <h5 class="text-white mb-1">Catch Us Live</h5>
                <p class="text-muted small mb-3">Join our worldwide live stream every Sunday 7:30 AM & 9:30 AM (WAT).</p>
                <a href="#/live" class="btn-gold btn-sm w-100">
                  <i class="fa-solid fa-tower-broadcast me-1"></i> Go to Live Sanctuary
                </a>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  </div>`
};

createApp({
  components:{HomePage,LivePage,WatchPage,SermonDetailPage,MinistriesPage,MinistryDetailPage,GroupsPage,GroupDetailPage,LocationsPage,EventsPage,EventDetailPage,StorePage,GivePage,VisitPage,AboutPage,StoriesPage,StoryDetailPage},
  provide(){ return {cms:this.cms}; },
  data(){return {ready:false, route:'home', routeParts:['home'], mobileMenu:false, scrolled:false, member:null, liveFloatEnabled:false, liveFloatClosed:false, liveFloatMuted:false, liveFloatVolume:0.85, liveFloatPlaying:false, miniHls:null, miniHlsReady:'', cms:{site:{},home:{},pages:{}}, navItems:[{label:'Home',href:'#/'},{label:'Locations',href:'#/locations'},{label:'Watch',href:'#/watch'},{label:'Live Service',href:'#/live'},{label:'Join a Group',href:'#/groups'},{label:'Plan a Visit',href:'#/visit'},{label:'Ministries',href:'#/ministries'},{label:'Events',href:'#/events'},{label:'Store',href:'#/store'},{label:'Give',href:'#/give'},{label:'Stories',href:'#/stories'},{label:'About',href:'#/about'}] }},
  computed:{
    currentPage(){return this.route === 'stories' && this.routeParts[1] ? 'StoryDetailPage' : this.route === 'events' && this.routeParts[1] ? 'EventDetailPage' : (this.route === 'watch' || this.route === 'sermons') && this.routeParts[1] ? 'SermonDetailPage' : this.route === 'ministries' && this.routeParts[1] ? 'MinistryDetailPage' : this.route === 'groups' && this.routeParts[1] ? 'GroupDetailPage' : ({home:'HomePage',live:'LivePage',watch:'WatchPage',sermons:'WatchPage',ministries:'MinistriesPage',events:'EventsPage',store:'StorePage',give:'GivePage',visit:'VisitPage',contact:'VisitPage',about:'AboutPage',locations:'LocationsPage',groups:'GroupsPage',stories:'StoriesPage'}[this.route] || 'HomePage')},
    siteName(){ return (this.cms.site && this.cms.site.name) ? this.cms.site.name : ''; },
    siteLogo(){ return (this.cms.site && this.cms.site.logo) ? this.cms.site.logo : ''; },
    brandInitial(){ return this.siteName.trim().charAt(0).toUpperCase() || ''; },
    brandParts(){
      const words = this.siteName.trim().split(/\s+/).filter(Boolean);
      if(words.length < 2){ return [this.siteName, '']; }
      return [words.slice(0, -1).join(' '), words[words.length - 1]];
    },
    brandMain(){ return this.brandParts[0] || this.siteName; },
    brandSuffix(){ return this.brandParts[1] || ''; },
    routeKey(){ return this.routeParts.join('/'); },
    visibleNav(){
      const links = Array.isArray(this.cms.nav) && this.cms.nav.length ? this.cms.nav : this.navItems;
      return links.map(item => ({label:item.label, href:item.href || '#/', placement:item.placement || 'both', footer_group:item.footer_group || ''}));
    },
    mobileNav(){
      const nav = [];
      const seen = {};
      const add = item => {
        const href = item && item.href ? item.href : '#/';
        if(seen[href]){ return; }
        seen[href] = true;
        nav.push({label:item.label || 'Home', href, placement:item.placement || 'both', footer_group:item.footer_group || ''});
      };
      this.visibleNav.forEach(add);
      this.navItems.forEach(add);
      return nav;
    },
    headerNav(){ return this.visibleNav.filter(item => item.href !== '#/' && item.placement !== 'footer').slice(0, 10); },
    footerNav(){ return this.visibleNav.filter(item => item.placement !== 'header'); },
    footerExploreNav(){ return this.footerNav.filter(item => (item.footer_group || (['#/visit','#/groups','#/locations','#/give'].includes(item.href) ? 'next' : 'explore')) === 'explore').slice(0, 14); },
    footerNextNav(){ return this.footerNav.filter(item => (item.footer_group || (['#/visit','#/groups','#/locations','#/give'].includes(item.href) ? 'next' : 'explore')) === 'next').slice(0, 14); },
    socialLinks(){
      const site = (this.cms && this.cms.site) ? this.cms.site : {};
      const links = Array.isArray(site.social_links) ? site.social_links : [];
      
      const kc = links.find(l => l.key === 'kingchat') || {};
      const yt = links.find(l => l.key === 'youtube') || {};
      const fb = links.find(l => l.key === 'facebook') || {};
      const ig = links.find(l => l.key === 'instagram') || {};
      const tw = links.find(l => l.key === 'twitter') || {};

      const list = [
        {
          label: 'KingsChat',
          feedLabel: 'KingsChat Feed',
          key: 'kingchat',
          icon: '',
          url: site.kingchat || kc.url || 'https://kingschat.online/user/cenewbenin',
          handle: kc.handle || '@cenewbenin'
        },
        {
          label: 'YouTube',
          feedLabel: 'YouTube Channel',
          key: 'youtube',
          icon: 'fa-brands fa-youtube',
          url: site.youtube || yt.url || 'https://youtube.com/@christembassy',
          handle: yt.handle || 'Christ Embassy'
        },
        {
          label: 'Facebook',
          feedLabel: 'Facebook Page',
          key: 'facebook',
          icon: 'fa-brands fa-facebook-f',
          url: site.facebook || fb.url || 'https://facebook.com/christembassy',
          handle: fb.handle || 'CE New Benin'
        }
      ];

      if (site.instagram || (ig && ig.url)) {
        list.push({
          label: 'Instagram',
          feedLabel: 'Instagram',
          key: 'instagram',
          icon: 'fa-brands fa-instagram',
          url: site.instagram || ig.url,
          handle: ig.handle || ''
        });
      }
      if (site.twitter || (tw && tw.url)) {
        list.push({
          label: 'Twitter / X',
          feedLabel: 'X',
          key: 'twitter',
          icon: 'fa-brands fa-x-twitter',
          url: site.twitter || tw.url,
          handle: tw.handle || ''
        });
      }

      return list.filter(item => item.url && item.url !== '#');
    },
    rootLiveSettings(){ return (this.cms && this.cms.live) ? this.cms.live : {}; },
    rootHlsUrl(){ return this.rootLiveSettings.hls_url || OLD.hls; },
    rootIsAudioStream(){ return /\.(mp3|m4a|aac|ogg|oga|wav)(\?.*)?$/i.test(this.rootHlsUrl); },
    miniLiveMounted(){ return this.member && this.liveFloatEnabled && !this.liveFloatClosed; },
    showMiniLive(){ return this.miniLiveMounted && this.route !== 'live'; }
  },
  methods:{
    syncRoute(){
      this.routeParts=(location.hash.replace('#/','')||'home').split('/');
      this.route=this.routeParts[0];
      window.scrollTo(0,0);
      this.mobileMenu=false;
      this.$nextTick(()=>this.syncFloatingLive());
      this.$nextTick(()=>this.unmuteFloatingLive());
    },
    enableFloatingLive(closed){
      this.liveFloatEnabled=true;
      if(closed === false){ this.liveFloatClosed=false; }
      this.$nextTick(()=>this.syncFloatingLive());
    },
    syncFloatingLive(){
      if(!this.miniLiveMounted){ this.cleanupMiniLive(); return; }
      const v=this.$refs.miniLiveVideo;
      if(!v || !this.rootHlsUrl){ return; }
      if(this.miniHlsReady !== this.rootHlsUrl){
        if(this.miniHls){ this.miniHls.destroy(); this.miniHls=null; }
        v.removeAttribute('src');
        if(this.rootIsAudioStream){
          v.src=this.rootHlsUrl;
          v.load();
        } else if(v.canPlayType('application/vnd.apple.mpegurl')){
          v.src=this.rootHlsUrl;
          v.load();
        } else if(window.Hls && Hls.isSupported()){
          const hls=new Hls({
            lowLatencyMode:true,
            startLevel:-1,
            capLevelToPlayerSize:true,
            maxBufferLength:6,
            maxMaxBufferLength:20,
            liveSyncDurationCount:2,
            liveMaxLatencyDurationCount:5,
            manifestLoadingTimeOut:6000,
            levelLoadingTimeOut:6000,
            fragLoadingTimeOut:8000
          });
          hls.loadSource(this.rootHlsUrl);
          hls.attachMedia(v);
          this.miniHls=hls;
        }
        this.miniHlsReady=this.rootHlsUrl;
      }
      v.muted=this.route === 'live' ? true : this.liveFloatMuted;
      v.volume=parseFloat(this.liveFloatVolume || 0.85);
      const playPromise=v.play();
      if(playPromise && playPromise.catch){
        playPromise.catch(()=>{
          v.muted=true;
          this.liveFloatMuted=true;
          const mutedPlay=v.play();
          if(mutedPlay && mutedPlay.catch){ mutedPlay.catch(()=>{}); }
        });
      }
    },
    cleanupMiniLive(){
      const v=this.$refs.miniLiveVideo;
      if(v){ v.pause(); v.removeAttribute('src'); v.load(); }
      if(this.miniHls){ this.miniHls.destroy(); this.miniHls=null; }
      this.miniHlsReady='';
    },
    markMiniReady(){ this.liveFloatPlaying=true; },
    markMiniError(){ this.liveFloatPlaying=false; },
    unmuteFloatingLive(){
      const v=this.$refs.miniLiveVideo;
      if(!v || !this.showMiniLive){ return; }
      v.muted=this.liveFloatMuted;
      v.volume=parseFloat(this.liveFloatVolume || 0.85);
    },
    toggleMiniMute(){
      const v=this.$refs.miniLiveVideo;
      this.liveFloatMuted=!this.liveFloatMuted;
      if(v){ v.muted=this.liveFloatMuted; if(!v.muted){ v.volume=parseFloat(this.liveFloatVolume || 0.85); } }
    },
    stopFloatingLive(){
      this.liveFloatEnabled=false;
      this.liveFloatPlaying=false;
      this.cleanupMiniLive();
    },
    closeFloatingLive(){
      this.liveFloatClosed=true;
      this.stopFloatingLive();
    },
    loadContent(){
      fetch(OLD.content + '?t=' + Date.now(), {cache:'no-store'})
        .then(r=>r.json())
        .then(data=>{
          Object.assign(this.cms, data);
          if(data.site && data.site.name){ document.title=data.site.name; }
        })
        .catch(()=>{})
        .finally(()=>{this.ready=true;});
    }
  },
  mounted(){
    try{this.member=JSON.parse(localStorage.getItem('kh_member')||'null')}catch(e){}
    this.loadContent();
    this.syncRoute();
    window.addEventListener('hashchange',this.syncRoute);
    window.addEventListener('scroll',()=>this.scrolled=window.scrollY>40);
    window.addEventListener('focus', ()=>this.loadContent());
    setInterval(()=>this.loadContent(), 20000);
  }
}).mount('#app');
