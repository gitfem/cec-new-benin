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
      const normalized = banners
        .filter(b => b && b.image_url)
        .map(b => ({
          title: b.title || '',
          text: b.text || '',
          href: b.href || '#/',
          img: b.image_url,
          link_text: b.link_text || 'Explore'
        }));
      return normalized;
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
        <div class="ways-grid feature-image-grid">
          <a v-for="w in featureBanners" :href="w.href" class="way-card way-card-image">
            <img :src="w.img" :alt="w.title">
            <div class="way-card-overlay"><h3 v-if="w.title">{{w.title}}</h3><p v-if="w.text">{{w.text}}</p><span v-if="w.link_text">{{w.link_text}} -></span></div>
          </a>
        </div>
      </div>
    </section>

    <a v-if="upcomingEvent.title || upcomingEvent.image_url" :href="upcomingEvent.link_url" class="current-series upcoming-event-band">
      <img v-if="upcomingEvent.image_url" :src="upcomingEvent.image_url" alt="upcoming event">
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
      viewingMode:'individual', groupName:'Erediauwa', groupCount:1,
      groupOptions:['LW City','Missions 1','Missions 2','Missions 3','Missions 4','Missions 5','Missions 6','Missions 7','Missions 8','Central Missions 1','Central Missions 2','Service Centre Group','Teens & Youth Church','Erediauwa','Central Church','Ogbewase Sub group','Sapele road Sub Group','Higher Life Sub Group','Higher Grace Sub Group','Garrick Sub Group','Others'],
      DATA, OLD, announcementOpen:true, activeStream:'player',
      isPlaying:false, muted:false, volume:0.85, progress:0,
      liveStatus:'checking', chat:[], chatText:'', chatError:'',
      liveNotice:null, liveViewers:0, presenceToken:localStorage.getItem('kh_live_presence_token') || '', dismissedNoticeId:localStorage.getItem('kh_live_notice_dismissed') || '', soundBlocked:false, videoJsPlayer:null
    }
  },
  computed:{
    member(){return this.$root.member},
    siteName(){ return (this.cms && this.cms.site && this.cms.site.name) ? this.cms.site.name : ''; },
    helpLine(){ return (this.cms && this.cms.site && this.cms.site.help) ? this.cms.site.help : ''; },
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
  mounted(){this.loadStatus(); this.loadChat(); this.loadLiveNotice(); this.chatTimer=setInterval(this.loadChat, 5000); this.statusTimer=setInterval(this.loadStatus, 30000); this.noticeTimer=setInterval(this.loadLiveNotice, 8000); this.presenceTimer=setInterval(()=>this.sendPresence(false), 15000); this.sendPresence(false); if(this.member){ this.$nextTick(()=>this.autoplayPlayer()); }},
  unmounted(){clearInterval(this.chatTimer); clearInterval(this.statusTimer); clearInterval(this.noticeTimer); clearInterval(this.presenceTimer); this.sendPresence(true); if(this.videoJsPlayer){ this.videoJsPlayer.dispose(); this.videoJsPlayer=null; } if(this.hls){ this.hls.destroy(); }},
  methods:{
    login(){
      if(!this.name.trim()){ this.error='Please enter your full name.'; return; }
      if(!this.phone.trim()){ this.error='Please enter your phone number.'; return; }
      if(!/^[0-9+\-\s()]{6,}$/.test(this.phone.trim())){ this.error='Please enter a valid phone number.'; return; }
      if(!this.groupName){ this.error='Please select your group.'; return; }
      const attendance = this.viewingMode === 'group' ? Math.max(1, parseInt(this.groupCount || 1, 10)) : 1;
      const member = {name:this.name.trim(), email:this.email.trim(), phone:this.phone.trim(), group:this.groupName, viewingMode:this.viewingMode, attendance};
      this.$root.member = member;
      if(this.remember){ localStorage.setItem('kh_member', JSON.stringify(member)); }
      this.error='';
      this.$nextTick(()=>{ this.loadChat(); this.loadLiveNotice(); this.autoplayPlayer(); this.sendPresence(false); });
      const body = new URLSearchParams({fullname:member.name, email:member.email, phone:member.phone, group:member.group, attendance:String(attendance)});
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
        this.hls=hls;
        v.dataset.hlsReady=this.hlsUrl;
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
    markStreamReady(){ this.liveStatus='live'; this.$root.enableFloatingLive(false); },
    markStreamError(){ if(this.activeStream==='player'){ this.liveStatus='offline'; this.isPlaying=false; } },
    togglePlay(){
      const v=this.$refs.liveVideo;
      if(!v) return;
      this.setupHls();
      if(v.muted){
        v.muted=false;
        this.muted=false;
        this.soundBlocked=false;
        this.$root.liveFloatMuted=false;
        v.volume=parseFloat(this.volume || 0.85);
        if(v.paused){
          const playPromise = v.play();
          if(playPromise && playPromise.catch){ playPromise.catch(()=>{ this.isPlaying=false; this.soundBlocked=true; }); }
        }
        return;
      }
      if(v.paused){
        const playPromise = v.play();
        if(playPromise && playPromise.catch){ playPromise.catch(()=>{ this.isPlaying=false; this.soundBlocked=true; }); }
        this.isPlaying=true;
        this.$root.enableFloatingLive(false);
      } else {
        v.pause();
        this.isPlaying=false;
        this.$root.stopFloatingLive();
      }
    },
    toggleMute(){ const v=this.$refs.liveVideo; if(!v) return; v.muted=!v.muted; this.muted=v.muted; this.$root.liveFloatMuted=v.muted; if(!v.muted){ this.soundBlocked=false; v.volume=parseFloat(this.volume || 0.85); } },
    setVolume(){ const v=this.$refs.liveVideo; if(!v) return; v.volume=parseFloat(this.volume); this.$root.liveFloatVolume=v.volume; if(v.volume>0){ v.muted=false; this.muted=false; this.soundBlocked=false; this.$root.liveFloatMuted=false; } },
    updateProgress(){ const v=this.$refs.liveVideo; if(!v || !v.duration) return; this.progress=(v.currentTime/v.duration)*100; },
    seekVideo(e){ const v=this.$refs.liveVideo; if(!v || !v.duration) return; const rect=e.currentTarget.getBoundingClientRect(); const pct=(e.clientX-rect.left)/rect.width; v.currentTime=Math.max(0, Math.min(v.duration*pct, v.duration)); },
    fullscreen(){
      const el=this.$refs.playerBox || this.$refs.liveVideo;
      if(!el) return;
      if(document.fullscreenElement){ document.exitFullscreen(); return; }
      if(el.requestFullscreen){ el.requestFullscreen(); }
      else if(el.webkitRequestFullscreen){ el.webkitRequestFullscreen(); }
    },
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
            <div class="col-12"><label>Select Your Group</label><div class="input-icon"><i class="fa-solid fa-users"></i><select v-model="groupName" class="form-control form-control-lg"><option value="">Select your group</option><option v-for="group in groupOptions" :value="group">{{group}}</option></select></div></div>
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
          <div class="stream-tabs stream-tabs-links">
            <a href="#/live/player" :class="{active:activeStream==='player'}" @click.prevent="switchStream('player')"><i class="fa-solid fa-play me-2"></i> Player</a>
            <a href="#/live/youtube" :class="{active:activeStream==='youtube'}" @click.prevent="switchStream('youtube')"><i class="fa-brands fa-youtube me-2"></i> YouTube</a>
          </div>

          <div v-if="activeStream==='player'" class="stream-player native-player" ref="playerBox">
            <video ref="liveVideo" class="native-live-video" preload="auto" controls playsinline @loadedmetadata="markStreamReady" @canplay="markStreamReady" @playing="markStreamReady" @error="markStreamError" @play="isPlaying=true" @pause="isPlaying=false"></video>
            <button v-if="!isPlaying" type="button" class="native-big-play" @click="togglePlay" aria-label="Play live stream"><i class="fa-solid fa-play"></i></button>
          </div>

          <div v-else class="youtube-panel">
            <div class="youtube-frame"><iframe :src="youtubeUrl" :title="siteName ? siteName + ' YouTube Live' : 'YouTube Live'" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
            <div class="youtube-actions"><div><b>YouTube Live</b><span>Uses the selected YouTube channel ID.</span></div><a :href="youtubePage" target="_blank" rel="noopener" class="btn-brand">Open YouTube Page</a></div>
          </div>

          <div v-if="announcementHtml" class="announcement-box" :class="{collapsed:!announcementOpen}">
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
  data(){return {visible:6, DATA}},
  computed:{
    sermons(){
      const items = this.cms && this.cms.home && Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons : [];
      const normalized = this.normalizeSermons(items);
      return normalized;
    },
    visibleSermons(){ return this.sermons.slice(0, this.visible); },
    hasMore(){ return this.visible < this.sermons.length; },
    heroImage(){ return (this.sermons[0] && (this.sermons[0].poster_url || this.sermons[0].media_url)) || ''; }
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
          return {id:item.id, eyebrow:item.eyebrow || 'Sermon', title:item.title || 'Sermon', subtitle:item.subtitle || '', speaker:item.speaker || '', body:item.body || '', media_type:item.media_type || 'video', media_url:media, embed_url:item.embed_url || '', poster_url:poster || (item.media_type === 'image' ? media : ''), href:'#/watch/'+item.id};
        });
    },
    loadMore(){ this.visible += 6; }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroImage ? {backgroundImage:'url('+heroImage+')'} : {}"><div class="container-wide reveal"><div class="eyebrow">Watch Online</div><h1 class="title-serif">Latest videos and sermons.</h1></div></section>
    <section class="section dark-band watch-page-section"><div class="container-wide">
      <a href="#/live" class="video-poster mb-5 d-block"><div class="play-chip"><span class="play-circle"><i class="fa-solid fa-play"></i></span> Join Live Stream</div></a>
      <div v-if="!sermons.length" class="story-empty"><h2 class="title-mid">No sermons posted yet.</h2></div>
      <div v-else class="media-grid">
        <a class="media-card text-dark sermon-card" v-for="s in visibleSermons" :href="s.href">
          <div class="sermon-card-media">
            <img v-if="s.poster_url || s.media_type === 'image'" :src="s.poster_url || s.media_url" :alt="s.title">
            <video v-else-if="s.media_type === 'video'" :src="s.media_url" muted playsinline preload="metadata"></video>
            <div v-else-if="s.media_type === 'audio'" class="sermon-audio-preview"><i class="fa-solid fa-volume-high"></i></div>
            <div v-else-if="s.media_type === 'embed'" class="sermon-audio-preview"><i class="fa-solid fa-play"></i></div>
          </div>
          <div class="media-card-body"><span class="tag">{{s.eyebrow}}</span><h4>{{s.title}}</h4><p v-if="s.subtitle" class="muted">{{s.subtitle}}</p><small v-if="s.speaker">{{s.speaker}}</small><b>Watch Details -></b></div>
        </a>
      </div>
      <div class="text-center mt-5" v-if="hasMore"><button type="button" class="btn-outline-brand" @click="loadMore">Load More</button></div>
    </div></section>
  </div>`
};
const ContentListPage = (cfg) => ({
  inject:['cms'],
  data(){return {visible:6, cfg}},
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages[cfg.slug]) ? this.cms.pages[cfg.slug] : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    items(){ return this.normalizeItems(this.cms && this.cms.home && Array.isArray(this.cms.home[cfg.key]) ? this.cms.home[cfg.key] : []); },
    visibleItems(){ return this.items.slice(0, this.visible); },
    hasMore(){ return this.visible < this.items.length; }
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
      <div v-if="!items.length" class="story-empty"><h2 class="title-mid">No {{cfg.title.toLowerCase()}} posted yet.</h2></div>
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

const MinistriesPage = ContentListPage({slug:'ministries', key:'ministries', eyebrow:'Ministries', title:'Ministries', single:'Ministry', detail:true, dark:false});
const MinistryDetailPage = ContentDetailPage({slug:'ministries', key:'ministries', eyebrow:'Ministries', title:'Ministries', single:'Ministry'});
const GroupsPage = ContentListPage({slug:'groups', key:'groups', eyebrow:'Groups', title:'Join a Group', single:'Group', detail:true, dark:false});
const GroupDetailPage = ContentDetailPage({slug:'groups', key:'groups', eyebrow:'Groups', title:'Join a Group', single:'Group'});
const LocationsPage = ContentListPage({slug:'locations', key:'locations', eyebrow:'Locations', title:'Locations', single:'Location', detail:false, dark:false});
const EventsPage = {
  inject:['cms'],
  data(){return {visible:6}},
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.events) ? this.cms.pages.events : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : (this.heroImage ? {backgroundImage:'url('+this.heroImage+')'} : {}); },
    events(){ return this.normalizeEvents(this.cms && this.cms.home && Array.isArray(this.cms.home.events) ? this.cms.home.events : []); },
    visibleEvents(){ return this.events.slice(0, this.visible); },
    hasMore(){ return this.visible < this.events.length; },
    heroImage(){ return (this.events[0] && this.events[0].image_url) || ''; }
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
          event_date: item.event_date || '',
          location: item.location || '',
          image_url: this.cacheAsset(item.image_url, item.updated_ts),
          href: '#/events/' + item.id
        }));
    },
    loadMore(){ this.visible += 6; }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageCms.eyebrow || 'Events'}}</div><h1 class="title-serif">{{pageCms.title || 'Events'}}</h1><p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p></div></section>
    <section v-if="pageCms.body" class="section cms-body"><div class="container-wide" v-html="pageCms.body"></div></section>
    <section class="section dark-band events-page-section"><div class="container-wide">
      <div v-if="!events.length" class="story-empty"><h2 class="title-mid">No events posted yet.</h2></div>
      <div v-else class="event-list-grid">
        <a v-for="event in visibleEvents" :href="event.href" class="event-list-card">
          <img :src="event.image_url" :alt="event.title">
          <div class="event-list-body"><span class="tag">{{event.eyebrow}}</span><h3>{{event.title}}</h3><p v-if="event.subtitle">{{event.subtitle}}</p><div class="event-list-meta"><span v-if="event.event_date">{{event.event_date}}</span><span v-if="event.location">{{event.location}}</span></div><b>View Details -></b></div>
        </a>
      </div>
      <div class="text-center mt-5" v-if="hasMore"><button type="button" class="btn-outline-brand" @click="loadMore">Load More</button></div>
    </div></section>
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
const GivePage = {
  inject:['cms'],
  data(){return {amount:50, customAmount:'', donorName:'', donorEmail:'', donorPhone:'', giveTowards:'General Offering', frequency:'One Time', paymentMethod:'PayPal', note:'', error:''}},
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.give) ? this.cms.pages.give : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    paypalRecipient(){ return (this.cms && this.cms.site && this.cms.site.paypal_email) ? this.cms.site.paypal_email.trim() : ''; },
    paypalMeUrl(){
      const value = this.paypalRecipient;
      return /paypal\.com\/paypalme\//i.test(value) || /paypal\.me\//i.test(value) ? value : '';
    },
    selectedAmount(){
      const value = this.customAmount !== '' ? this.customAmount : this.amount;
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    },
    amountLabel(){ return '$' + this.selectedAmount.toFixed(2); },
    paymentHelp(){
      if(this.paymentMethod === 'Bank Transfer'){
        return (this.cms && this.cms.site && this.cms.site.bank_transfer_details) ? this.cms.site.bank_transfer_details : 'Bank transfer details have not been added yet.';
      }
      return 'Payments are completed securely on PayPal in USD.';
    }
  },
  methods:{
    setAmount(value){ this.amount=value; this.customAmount=''; this.error=''; },
    paypalMePaymentUrl(){
      const base = this.paypalMeUrl.replace(/\/+$/, '');
      return base + '/' + this.selectedAmount.toFixed(2) + 'USD';
    },
    submitPaypal(){
      if(this.paymentMethod === 'Bank Transfer'){ this.error=''; return; }
      if(!this.paypalRecipient){ this.error='PayPal payment link or email has not been set yet.'; return; }
      if(this.selectedAmount < 1){ this.error='Enter an amount of at least $1.'; return; }
      this.error='';
      if(this.paypalMeUrl){
        window.location.href = this.paypalMePaymentUrl();
        return;
      }
      this.$refs.paypalForm.submit();
    }
  },
  template:`
  <div>
    <section class="sub-hero give-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageCms.eyebrow || 'Giving'}}</div><h1 class="title-serif">{{pageCms.title || 'Giving'}}</h1><p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p></div></section>
    <section class="section give-page-section"><div class="container-wide">
      <div class="give-layout">
        <div class="give-copy">
          <div class="eyebrow">Give Online</div>
          <h2 class="title-mid">Make a secure gift in dollars.</h2>
          <div v-if="pageCms.body" class="cms-body" v-html="pageCms.body"></div>
          <p v-else class="text-lg">Choose an amount and continue to PayPal to complete your giving securely.</p>
        </div>
        <div class="give-panel paypal-give-panel">
          <h3>Give Today</h3>
          <div class="give-secure-line"><i class="fa-solid fa-shield-halved"></i> Secure giving form</div>
          <div class="amount-grid">
            <button type="button" v-for="value in [25,50,100,250]" :class="{active:customAmount==='' && amount===value}" @click="setAmount(value)">{{'$' + value}}</button>
          </div>
          <label class="give-label">Custom Amount (USD)</label>
          <input v-model="customAmount" type="number" min="1" step="0.01" placeholder="Enter amount">
          <div class="give-form-row">
            <div><label class="give-label">Give Towards</label><select v-model="giveTowards"><option>General Offering</option><option>Tithe</option><option>Building Fund</option><option>Missions</option><option>First Fruits</option><option>Partnership</option></select></div>
            <div><label class="give-label">Frequency</label><select v-model="frequency"><option>One Time</option><option>Weekly</option><option>Monthly</option></select></div>
          </div>
          <div class="give-form-row">
            <div><label class="give-label">Name</label><input v-model="donorName" type="text" placeholder="Your name"></div>
            <div><label class="give-label">Phone</label><input v-model="donorPhone" type="tel" placeholder="Phone number"></div>
          </div>
          <label class="give-label">Email</label>
          <input v-model="donorEmail" type="email" placeholder="you@example.com">
          <label class="give-label">Payment Method</label>
          <div class="payment-methods">
            <button type="button" :class="{active:paymentMethod==='PayPal'}" @click="paymentMethod='PayPal'; error=''"><i class="fa-brands fa-paypal"></i> PayPal</button>
            <button type="button" :class="{active:paymentMethod==='Bank Transfer'}" @click="paymentMethod='Bank Transfer'; error=''"><i class="fa-solid fa-building-columns"></i> Bank Transfer</button>
          </div>
          <label class="give-label">Note</label>
          <input v-model="note" type="text" placeholder="Optional note">
          <div class="give-total"><span>Total</span><b>{{amountLabel}} USD</b></div>
          <div v-if="error" class="alert alert-danger">{{error}}</div>
          <div v-if="paymentMethod === 'Bank Transfer'" class="bank-transfer-box" v-html="paymentHelp"></div>
          <form ref="paypalForm" method="post" action="https://www.paypal.com/cgi-bin/webscr">
            <input type="hidden" name="cmd" value="_xclick">
            <input type="hidden" name="business" :value="paypalRecipient">
            <input type="hidden" name="currency_code" value="USD">
            <input type="hidden" name="amount" :value="selectedAmount.toFixed(2)">
            <input type="hidden" name="item_name" :value="(cms.site && cms.site.name ? cms.site.name : 'Church') + ' - ' + giveTowards + ' - ' + frequency">
            <input type="hidden" name="no_shipping" value="1">
            <input type="hidden" name="no_note" value="0">
            <input type="hidden" name="payer_email" :value="donorEmail">
          </form>
          <button type="button" class="btn-brand w-100" @click="submitPaypal"><i :class="paymentMethod === 'PayPal' ? 'fa-brands fa-paypal' : 'fa-solid fa-heart'"></i> {{paymentMethod === 'PayPal' ? 'Continue to PayPal' : 'View Transfer Details'}}</button>
          <p class="paypal-note" v-html="paymentHelp"></p>
        </div>
      </div>
    </div></section>
  </div>`
};
const VisitPage = {
  inject:['cms'],
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.visit) ? this.cms.pages.visit : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    site(){ return this.cms && this.cms.site ? this.cms.site : {}; },
    locations(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.locations) ? this.cms.home.locations.slice(0, 3) : []; }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageCms.eyebrow || 'Plan a Visit'}}</div><h1 class="title-serif">{{pageCms.title || 'Plan a Visit'}}</h1><p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p></div></section>
    <section class="section visit-page-section"><div class="container-wide">
      <div class="visit-layout">
        <div>
          <div class="eyebrow">Welcome</div>
          <h2 class="title-mid">We would love to see you.</h2>
          <div v-if="pageCms.body" class="cms-body" v-html="pageCms.body"></div>
          <p v-else class="text-lg">Join us for service, worship with us, and connect with a community where you can grow.</p>
        </div>
        <div class="visit-info-panel">
          <h3>Service Info</h3>
          <p v-if="site.address"><b>Address</b><br>{{site.address}}</p>
          <p v-if="site.office_hours"><b>Office / Service Hours</b><br>{{site.office_hours}}</p>
          <p v-if="site.phone || site.email"><b>Contact</b><br><span v-if="site.phone">{{site.phone}}<br></span><span v-if="site.email">{{site.email}}</span></p>
          <a href="#/locations" class="btn-brand w-100">View Locations</a>
        </div>
      </div>
      <div v-if="locations.length" class="content-card-grid mt-5">
        <article v-for="item in locations" class="content-list-card">
          <img v-if="item.image_url" :src="item.image_url" :alt="item.title">
          <div class="content-list-body"><span class="tag">{{item.eyebrow || 'Location'}}</span><h3>{{item.title}}</h3><p v-if="item.subtitle">{{item.subtitle}}</p><div v-if="item.meta_text" class="content-list-meta">{{item.meta_text}}</div></div>
        </article>
      </div>
    </div></section>
  </div>`
};
const AboutPage = {
  inject:['cms'],
  computed:{
    pageCms(){ return (this.cms && this.cms.pages && this.cms.pages.about) ? this.cms.pages.about : {}; },
    heroStyle(){ return this.pageCms.hero ? {backgroundImage:'url('+this.pageCms.hero+')'} : {}; },
    ministries(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.ministries) ? this.cms.home.ministries.slice(0, 3) : []; }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroStyle"><div class="container-wide reveal"><div class="eyebrow">{{pageCms.eyebrow || 'About Us'}}</div><h1 class="title-serif">{{pageCms.title || 'About Us'}}</h1><p v-if="pageCms.subtitle" class="text-lg cms-subtitle">{{pageCms.subtitle}}</p></div></section>
    <section class="section about-page-section"><div class="container-wide">
      <div class="split-heading"><div><div class="eyebrow">Our Church</div><h2 class="title-mid">{{pageCms.title || 'A people of worship, word, prayer, community, and mission.'}}</h2></div><div class="text-lg-end"><a href="#/visit" class="btn-outline-darkbrand">Plan a Visit</a></div></div>
      <div v-if="pageCms.body" class="cms-body about-body" v-html="pageCms.body"></div>
      <p v-else class="text-lg">We are a family church inspiring people to follow Jesus, discover purpose, and transform their world.</p>
      <div v-if="ministries.length" class="content-card-grid mt-5">
        <a v-for="item in ministries" :href="'#/ministries/' + item.id" class="content-list-card">
          <img v-if="item.image_url" :src="item.image_url" :alt="item.title">
          <div class="content-list-body"><span class="tag">{{item.eyebrow || 'Ministry'}}</span><h3>{{item.title}}</h3><p v-if="item.subtitle">{{item.subtitle}}</p><b>View Ministry -></b></div>
        </a>
      </div>
    </div></section>
  </div>`
};

const StoriesPage = {
  inject:['cms'],
  data(){return {visible:6}},
  computed:{
    stories(){ return this.normalizeStories(this.cms && this.cms.home && Array.isArray(this.cms.home.stories) ? this.cms.home.stories : []); },
    visibleStories(){ return this.stories.slice(0, this.visible); },
    hasMore(){ return this.visible < this.stories.length; },
    heroImage(){ return (this.stories[0] && this.stories[0].image) || ''; }
  },
  methods:{
    cacheAsset(url, version){
      if(!url || !version || /^https?:\/\//i.test(url)){ return url; }
      return url + (url.includes('?') ? '&' : '?') + 'v=' + version;
    },
    normalizeStories(items){
      return items
        .filter(item => item && item.id)
        .map(item => ({
          id: item.id,
          eyebrow: item.eyebrow || 'Stories',
          title: item.title || 'Story',
          subtitle: item.subtitle || '',
          image: this.cacheAsset(item.thumb_url || (item.media_type === 'embed' ? '' : item.media_url), item.updated_ts),
          media_type: item.media_type || 'image',
          href: '#/stories/' + item.id
        }));
    },
    loadMore(){ this.visible += 6; }
  },
  template:`
  <div>
    <section class="sub-hero" :style="heroImage ? {backgroundImage:'url('+heroImage+')'} : {}"><div class="container-wide reveal"><div class="eyebrow">Stories</div><h1 class="title-serif">Stories</h1></div></section>
    <section class="section stories-page-section"><div class="container-wide">
      <div v-if="!stories.length" class="story-empty"><h2 class="title-mid">No stories posted yet.</h2></div>
      <div v-else class="story-list-grid">
        <a v-for="story in visibleStories" :href="story.href" class="story-list-card">
          <img :src="story.image" :alt="story.title">
          <div class="story-list-body"><span class="tag">{{story.eyebrow}}</span><h3>{{story.title}}</h3><p v-if="story.subtitle">{{story.subtitle}}</p><b>Read Story -></b></div>
        </a>
      </div>
      <div class="text-center mt-5" v-if="hasMore"><button type="button" class="btn-outline-darkbrand" @click="loadMore">Load More</button></div>
    </div></section>
  </div>`
};

const StoryDetailPage = {
  inject:['cms'],
  data(){return {commentForm:{display_name:'', comment:'', message:'', error:'', posting:false}}},
  computed:{
    storyId(){ return (location.hash.replace('#/','').split('/')[1] || '').trim(); },
    stories(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.stories) ? this.cms.home.stories : []; },
    story(){
      const found = this.stories.find(item => String(item.id) === String(this.storyId)) || {};
      const media = found.media_url ? this.cacheAsset(found.media_url, found.updated_ts) : '';
      const thumb = found.thumb_url ? this.cacheAsset(found.thumb_url, found.updated_ts) : '';
      return {
        id: found.id || '',
        eyebrow: found.eyebrow || 'Stories',
        title: found.title || 'Story not found',
        subtitle: found.subtitle || '',
        body: found.body || '',
        media_url: media,
        thumb_url: thumb,
        media_type: found.media_type || 'image',
        comments: Array.isArray(found.comments) ? found.comments : []
      };
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
          this.commentForm.message=data.message || 'Thanks. Your comment is waiting for approval.';
        })
        .catch(()=>{ this.commentForm.error='Unable to post comment right now.'; })
        .finally(()=>{ this.commentForm.posting=false; });
    }
  },
  template:`
  <div>
    <section class="sub-hero" :style="{backgroundImage: story.media_type === 'image' ? 'url('+story.media_url+')' : story.thumb_url ? 'url('+story.thumb_url+')' : 'linear-gradient(135deg,#050505,#356ca8)'}"><div class="container-wide reveal"><div class="eyebrow">{{story.eyebrow}}</div><h1 class="title-serif">{{story.title}}</h1><p v-if="story.subtitle" class="text-lg cms-subtitle">{{story.subtitle}}</p></div></section>
    <section class="section story-detail-section"><div class="container-wide">
      <div class="story-detail-media" v-if="story.media_type === 'video'"><video :src="story.media_url" :poster="story.thumb_url" controls playsinline preload="metadata"></video></div>
      <div class="story-detail-media" v-else-if="story.media_type === 'embed'"><iframe :src="story.media_url" :title="story.title" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>
      <article class="story-detail-body" v-if="story.body" v-html="story.body"></article>
      <article class="story-detail-body" v-else-if="story.subtitle"><p>{{story.subtitle}}</p></article>
      <section class="story-comments-panel">
        <div class="split-heading story-comments-heading"><div><div class="eyebrow">Comments</div><h2 class="title-mid">Join the conversation.</h2></div></div>
        <div class="story-comment-list" v-if="story.comments.length">
          <article v-for="comment in story.comments" class="story-comment">
            <div><b>{{comment.display_name || 'Anonymous'}}</b><span>{{comment.date_label}}</span></div>
            <p>{{comment.comment}}</p>
          </article>
        </div>
        <p v-else class="story-comment-empty">No approved comments yet.</p>
        <form class="story-comment-form" @submit.prevent="submitComment">
          <div class="story-comment-fields">
            <input v-model="commentForm.display_name" maxlength="120" placeholder="Name optional">
            <textarea v-model="commentForm.comment" maxlength="800" rows="4" placeholder="Write an anonymous comment..." required></textarea>
          </div>
          <small v-if="commentForm.message" class="story-comment-success">{{commentForm.message}}</small>
          <small v-if="commentForm.error" class="story-comment-error">{{commentForm.error}}</small>
          <button type="submit" class="btn-brand" :disabled="commentForm.posting">{{commentForm.posting ? 'Posting...' : 'Post Comment'}}</button>
        </form>
      </section>
      <a href="#/stories" class="btn-outline-darkbrand mt-4">Back to Stories</a>
    </div></section>
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
        body: found.body || '',
        event_date: found.event_date || '',
        location: found.location || '',
        image_url: image
      };
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
    <section class="sub-hero" :style="event.image_url ? {backgroundImage:'url('+event.image_url+')'} : {}"><div class="container-wide reveal"><div class="eyebrow">{{event.eyebrow}}</div><h1 class="title-serif">{{event.title}}</h1><p v-if="event.subtitle" class="text-lg cms-subtitle">{{event.subtitle}}</p></div></section>
    <section class="section event-detail-section"><div class="container-wide">
      <div v-if="event.image_url" class="event-detail-image"><img :src="event.image_url" :alt="event.title"></div>
      <div class="event-detail-meta"><span v-if="event.event_date">{{event.event_date}}</span><span v-if="event.location">{{event.location}}</span></div>
      <article class="story-detail-body" v-if="event.body" v-html="event.body"></article>
      <article class="story-detail-body" v-else-if="event.subtitle"><p>{{event.subtitle}}</p></article>
      <a href="#/events" class="btn-outline-darkbrand mt-4">Back to Events</a>
    </div></section>
  </div>`
};

const SermonDetailPage = {
  inject:['cms'],
  computed:{
    sermonId(){ return (location.hash.replace('#/','').split('/')[1] || '').trim(); },
    sermons(){ return this.cms && this.cms.home && Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons : []; },
    sermon(){
      const found = this.sermons.find(item => String(item.id) === String(this.sermonId)) || {};
      const media = found.media_url ? this.cacheAsset(found.media_url, found.updated_ts) : '';
      const poster = found.poster_url ? this.cacheAsset(found.poster_url, found.updated_ts) : '';
      return {
        id: found.id || '',
        eyebrow: found.eyebrow || 'Sermon',
        title: found.title || 'Sermon not found',
        subtitle: found.subtitle || '',
        body: found.body || '',
        speaker: found.speaker || '',
        media_type: found.media_type || 'video',
        media_url: media,
        embed_url: found.embed_url || '',
        poster_url: poster || (found.media_type === 'image' ? media : '')
      };
    },
    heroBackground(){
      const image = this.sermon.poster_url || (this.sermon.media_type === 'image' ? this.sermon.media_url : '');
      return image ? 'url('+image+')' : 'linear-gradient(135deg,#050505,#177a87)';
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
    <section class="sub-hero" :style="{backgroundImage:heroBackground}"><div class="container-wide reveal"><div class="eyebrow">{{sermon.eyebrow}}</div><h1 class="title-serif">{{sermon.title}}</h1><p v-if="sermon.subtitle" class="text-lg cms-subtitle">{{sermon.subtitle}}</p></div></section>
    <section class="section sermon-detail-section"><div class="container-wide">
      <div class="sermon-detail-media">
        <iframe v-if="sermon.media_type === 'embed' && sermon.embed_url" :src="sermon.embed_url" :title="sermon.title" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>
        <video v-else-if="sermon.media_type === 'video'" :src="sermon.media_url" :poster="sermon.poster_url" controls playsinline preload="metadata"></video>
        <audio v-else-if="sermon.media_type === 'audio'" :src="sermon.media_url" controls preload="metadata"></audio>
        <img v-else-if="sermon.media_url || sermon.poster_url" :src="sermon.media_url || sermon.poster_url" :alt="sermon.title">
      </div>
      <div class="event-detail-meta"><span v-if="sermon.speaker">{{sermon.speaker}}</span><span>{{sermon.eyebrow}}</span></div>
      <article class="story-detail-body" v-if="sermon.body" v-html="sermon.body"></article>
      <article class="story-detail-body" v-else-if="sermon.subtitle"><p>{{sermon.subtitle}}</p></article>
      <a href="#/watch" class="btn-outline-darkbrand mt-4">Back to Watch</a>
    </div></section>
  </div>`
};

createApp({
  components:{HomePage,LivePage,WatchPage,SermonDetailPage,MinistriesPage,MinistryDetailPage,GroupsPage,GroupDetailPage,LocationsPage,EventsPage,EventDetailPage,StorePage,GivePage,VisitPage,AboutPage,StoriesPage,StoryDetailPage},
  provide(){ return {cms:this.cms}; },
  data(){return {ready:false, route:'home', routeParts:['home'], mobileMenu:false, scrolled:false, member:null, liveFloatEnabled:false, liveFloatClosed:false, liveFloatMuted:false, liveFloatVolume:0.85, liveFloatPlaying:false, miniHls:null, miniHlsReady:'', cms:{site:{},home:{},pages:{}}, navItems:[{label:'Home',href:'#/'},{label:'Locations',href:'#/locations'},{label:'Watch',href:'#/watch'},{label:'Live Service',href:'#/live'},{label:'Join a Group',href:'#/groups'},{label:'Plan a Visit',href:'#/visit'},{label:'Ministries',href:'#/ministries'},{label:'Events',href:'#/events'},{label:'Store',href:'#/store'},{label:'Give',href:'#/give'},{label:'Stories',href:'#/stories'},{label:'About',href:'#/about'}] }},
  computed:{
    currentPage(){return this.route === 'stories' && this.routeParts[1] ? 'StoryDetailPage' : this.route === 'events' && this.routeParts[1] ? 'EventDetailPage' : this.route === 'watch' && this.routeParts[1] ? 'SermonDetailPage' : this.route === 'ministries' && this.routeParts[1] ? 'MinistryDetailPage' : this.route === 'groups' && this.routeParts[1] ? 'GroupDetailPage' : ({home:'HomePage',live:'LivePage',watch:'WatchPage',ministries:'MinistriesPage',events:'EventsPage',store:'StorePage',give:'GivePage',visit:'VisitPage',about:'AboutPage',locations:'LocationsPage',groups:'GroupsPage',stories:'StoriesPage'}[this.route] || 'HomePage')},
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
    headerNav(){ return this.visibleNav.filter(item => item.href !== '#/' && item.placement !== 'footer').slice(0, 6); },
    footerNav(){ return this.visibleNav.filter(item => item.placement !== 'header'); },
    footerExploreNav(){ return this.footerNav.filter(item => (item.footer_group || (['#/visit','#/groups','#/locations','#/give'].includes(item.href) ? 'next' : 'explore')) === 'explore').slice(0, 7); },
    footerNextNav(){ return this.footerNav.filter(item => (item.footer_group || (['#/visit','#/groups','#/locations','#/give'].includes(item.href) ? 'next' : 'explore')) === 'next').slice(0, 7); },
    socialLinks(){
      const links = this.cms.site && Array.isArray(this.cms.site.social_links) ? this.cms.site.social_links : [];
      if(links.length){ return links; }
      const fallback = [
        {label:'Facebook', key:'facebook', icon:'fa-brands fa-facebook-f', url:this.cms.site && this.cms.site.facebook},
        {label:'Twitter', key:'twitter', icon:'fa-brands fa-x-twitter', url:this.cms.site && this.cms.site.twitter},
        {label:'Instagram', key:'instagram', icon:'fa-brands fa-instagram', url:this.cms.site && this.cms.site.instagram},
        {label:'YouTube', key:'youtube', icon:'fa-brands fa-youtube', url:this.cms.site && this.cms.site.youtube},
        {label:'KingChat', key:'kingchat', icon:'', url:this.cms.site && this.cms.site.kingchat}
      ];
      return fallback.filter(item => item.url && item.url !== '#');
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
    }
  },
  mounted(){try{this.member=JSON.parse(localStorage.getItem('kh_member')||'null')}catch(e){} fetch(OLD.content,{cache:'no-store'}).then(r=>r.json()).then(data=>{ Object.assign(this.cms,data); if(data.site && data.site.name){ document.title=data.site.name; } }).catch(()=>{}).finally(()=>{this.ready=true;}); this.syncRoute(); window.addEventListener('hashchange',this.syncRoute); window.addEventListener('scroll',()=>this.scrolled=window.scrollY>40)}
}).mount('#app');
