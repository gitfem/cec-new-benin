const { createApp } = Vue;

const API_URL = '../assets/data/content.json';
const STORY_COMMENT_URL = '../bridge_story_comment.php';
const LIVE = {
  hls:'',
  youtubeChannel:'UCLFScmpsKP4jlJXD8McBGgQ',
  status:'../oldwebsite/cache.php',
  attendancePost:'../bridge_live_login.php',
  liveNotices:'../bridge_live_notices.php',
  presence:'../bridge_live_presence.php',
  chatFeed:'../bridge_a73c9_messages.php',
  chatPost:'../oldwebsite/shoutbox.php'
};

createApp({
  data(){
    return {
      ready:false,
      menuOpen:false,
      route:'home',
      routeParts:['home'],
      member:null,
      activeStream:'player',
      isPlaying:false,
      muted:false,
      liveStatus:'checking',
      liveViewers:0,
      presenceToken:localStorage.getItem('kh_live_presence_token') || '',
      hls:null,
      hlsReadyPromise:null,
      videoJsPlayer:null,
      miniHls:null,
      miniHlsReady:'',
      miniLiveEnabled:false,
      miniLiveClosed:false,
      miniLiveMuted:true,
      chat:[],
      chatText:'',
      chatError:'',
      liveNotice:null,
      dismissedNoticeId:localStorage.getItem('kh_live_notice_dismissed') || '',
      announcementOpen:true,
      liveError:'',
      storyCommentForm:{display_name:'', comment:'', message:'', error:'', posting:false},
      liveForm:{name:'', phone:'', email:'', group:'Erediauwa', mode:'individual', count:1, remember:true},
      giveForm:{amount:50, customAmount:'', name:'', phone:'', email:'', towards:'General Offering', frequency:'One Time', method:'PayPal', note:'', error:''},
      groupOptions:['LW City','Missions 1','Missions 2','Missions 3','Missions 4','Missions 5','Missions 6','Missions 7','Missions 8','Central Missions 1','Central Missions 2','Service Centre Group','Teens & Youth Church','Erediauwa','Central Church','Ogbewase Sub group','Sapele road Sub Group','Higher Life Sub Group','Higher Grace Sub Group','Garrick Sub Group','Others'],
      cms:{site:{}, home:{slides:[], feature_banners:[], sermons:[], events:[], sections:[]}, nav:[], pages:{}},
      fallbackNav:[
        {label:'Home', href:'#/'},
        {label:'Live Service', href:'#/live'},
        {label:'Watch', href:'#/watch'},
        {label:'Events', href:'#/events'},
        {label:'Give', href:'#/give'},
        {label:'Stories', href:'#/stories'}
      ]
    };
  },
  computed:{
    siteName(){ return this.cms.site.name || 'Church'; },
    siteLogo(){ return this.cms.site.logo || ''; },
    brandInitial(){ return this.siteName.trim().charAt(0).toUpperCase() || 'C'; },
    brandParts(){
      const words = this.siteName.trim().split(/\s+/).filter(Boolean);
      return words.length > 1 ? [words.slice(0,-1).join(' '), words[words.length-1]] : [this.siteName, ''];
    },
    brandMain(){ return this.brandParts[0]; },
    brandSuffix(){ return this.brandParts[1]; },
    sections(){ return Array.isArray(this.cms.home.sections) ? this.cms.home.sections : []; },
    hero(){ return this.sections.find(item => item.section_key === 'hero') || {}; },
    slides(){
      return Array.isArray(this.cms.home.slides) ? this.cms.home.slides.filter(item => item.image).map(item => Object.assign({}, item, {
        title:this.cleanSlideText(item.title),
        subtitle:this.cleanSlideText(item.subtitle)
      })) : [];
    },
    activeSlide(){ return this.slides[0] || {}; },
    activeSlideMedia(){
      return this.activeSlide.image ? this.asset(this.activeSlide.image) : '';
    },
    isHeroVideo(){
      return this.activeSlideMedia && this.activeSlide.media_type === 'video';
    },
    upcomingEvent(){ return (this.cms.home && this.cms.home.upcoming_event) ? this.cms.home.upcoming_event : {}; },
    heroImage(){
      const image = this.isHeroVideo ? this.asset(this.hero.image_url || '') : this.asset(this.activeSlide.image || this.hero.image_url || '');
      return image ? `url("${image}")` : 'linear-gradient(135deg,#050505,#177a87)';
    },
    featureBanners(){ return Array.isArray(this.cms.home.feature_banners) ? this.cms.home.feature_banners : []; },
    latestSermons(){ return Array.isArray(this.cms.home.sermons) ? this.cms.home.sermons : []; },
    stories(){
      return Array.isArray(this.cms.home.stories) ? this.cms.home.stories.filter(item => item && item.id).map(item => {
        const media = this.cacheAsset(item.media_url || '', item.updated_ts);
        const thumb = this.cacheAsset(item.thumb_url || (item.media_type === 'image' ? item.media_url : ''), item.updated_ts);
        return Object.assign({}, item, {
          media_url:media,
          thumb_url:thumb,
          image_url:thumb || (item.media_type === 'image' ? media : ''),
          comments:Array.isArray(item.comments) ? item.comments : []
        });
      }) : [];
    },
    storyDetail(){
      const id = this.routeParts[1] || '';
      return this.stories.find(item => String(item.id) === String(id)) || {
        eyebrow:'Stories',
        title:'Story not found',
        subtitle:'',
        body:'',
        media_url:'',
        thumb_url:'',
        image_url:'',
        media_type:'image',
        comments:[]
      };
    },
    contentConfig(){
      const configs = {
        locations:{slug:'locations', key:'locations', eyebrow:'Locations', title:'Locations', single:'Location', detail:true},
        groups:{slug:'groups', key:'groups', eyebrow:'Groups', title:'Join a Group', single:'Group', detail:true},
        ministries:{slug:'ministries', key:'ministries', eyebrow:'Ministries', title:'Ministries', single:'Ministry', detail:true}
      };
      return configs[this.route] || null;
    },
    contentItems(){
      if(!this.contentConfig || !this.cms.home || !Array.isArray(this.cms.home[this.contentConfig.key])){ return []; }
      return this.cms.home[this.contentConfig.key].filter(item => item && item.id).map(item => ({
        id:item.id,
        eyebrow:item.eyebrow || this.contentConfig.eyebrow,
        title:item.title || this.contentConfig.single,
        subtitle:item.subtitle || '',
        body:item.body || '',
        image_url:this.cacheAsset(item.image_url || '', item.updated_ts),
        meta_text:item.meta_text || '',
        href:'#/' + this.contentConfig.slug + '/' + item.id
      }));
    },
    contentDetail(){
      const id = this.routeParts[1] || '';
      const found = this.contentItems.find(item => String(item.id) === String(id)) || {};
      const cfg = this.contentConfig || {};
      return Object.assign({
        eyebrow:cfg.eyebrow || '',
        title:(cfg.single || 'Page') + ' not found',
        subtitle:'',
        body:'',
        image_url:'',
        meta_text:''
      }, found);
    },
    visitPage(){ return this.page('visit'); },
    visitLocations(){ return Array.isArray(this.cms.home.locations) ? this.cms.home.locations.slice(0, 3).map(item => Object.assign({}, item, {image_url:this.cacheAsset(item.image_url || '', item.updated_ts)})) : []; },
    genericPage(){ return this.page(this.route); },
    hasGenericPage(){
      const page = this.genericPage;
      const handled = ['home','live','watch','events','give','locations','groups','ministries','visit','menu'];
      return handled.indexOf(this.route) === -1 && !!(page && (page.title || page.body || page.subtitle || page.hero));
    },
    sermonDetail(){
      const id = this.routeParts[1] || '';
      const found = this.latestSermons.find(item => String(item.id) === String(id)) || {};
      return Object.assign({}, found, {
        media_url:this.asset(found.media_url || ''),
        poster_url:this.asset(found.poster_url || ''),
        image_url:this.asset(found.poster_url || (found.media_type === 'image' ? found.media_url : '') || '')
      });
    },
    events(){ return Array.isArray(this.cms.home.events) ? this.cms.home.events : []; },
    eventDetail(){
      const id = this.routeParts[1] || '';
      const found = this.events.find(item => String(item.id) === String(id)) || {};
      return Object.assign({}, found, {image_url:this.asset(found.image_url || '')});
    },
    navItems(){
      const links = Array.isArray(this.cms.nav) && this.cms.nav.length ? this.cms.nav : this.fallbackNav;
      return links.map(item => ({label:item.label, href:item.href || '#/'}));
    },
    socialLinks(){ return (this.cms.site && Array.isArray(this.cms.site.social_links)) ? this.cms.site.social_links : []; },
    hlsUrl(){ return String((this.cms.live && this.cms.live.hls_url) || LIVE.hls || '').trim(); },
    liveFeedUrl(){ return /\.ts(\?.*)?$/i.test(this.hlsUrl) ? '' : this.hlsUrl; },
    isHlsStream(){ return /\.m3u8(\?.*)?$/i.test(this.hlsUrl); },
    isAudioStream(){ return /\.(mp3|m4a|aac|ogg|oga|wav)(\?.*)?$/i.test(this.hlsUrl); },
    isIOSNativeHls(){ return this.isHlsStream && /iPad|iPhone|iPod/.test(navigator.userAgent || ''); },
    streamMimeType(){
      if(this.isHlsStream){ return 'application/vnd.apple.mpegurl'; }
      if(/\.mp4(\?.*)?$/i.test(this.hlsUrl)){ return 'video/mp4'; }
      if(/\.mp3(\?.*)?$/i.test(this.hlsUrl)){ return 'audio/mpeg'; }
      if(/\.m4a(\?.*)?$/i.test(this.hlsUrl)){ return 'audio/mp4'; }
      if(/\.aac(\?.*)?$/i.test(this.hlsUrl)){ return 'audio/aac'; }
      if(/\.ogg|\.oga(\?.*)?$/i.test(this.hlsUrl)){ return 'audio/ogg'; }
      if(/\.wav(\?.*)?$/i.test(this.hlsUrl)){ return 'audio/wav'; }
      return '';
    },
    announcementHtml(){
      const items = this.cms.home && Array.isArray(this.cms.home.member_announcements) ? this.cms.home.member_announcements : [];
      const item = items.find(row => row && row.announcement);
      return item ? item.announcement : '';
    },
    youtubeChannelId(){
      const value = String((this.cms.live && this.cms.live.youtube_channel_id) || '').trim();
      if(!value){ return LIVE.youtubeChannel; }
      const match = value.match(/(?:channel\/|channel=)([A-Za-z0-9_-]+)/);
      return match ? match[1] : value;
    },
    youtubeUrl(){ return 'https://www.youtube.com/embed/live_stream?channel=' + encodeURIComponent(this.youtubeChannelId) + '&autoplay=1&controls=1&modestbranding=1&rel=0'; },
    youtubePage(){ return 'https://www.youtube.com/channel/' + encodeURIComponent(this.youtubeChannelId); },
    showMiniLive(){ return this.member && this.miniLiveEnabled && !this.miniLiveClosed && this.route !== 'live'; },
    paypalRecipient(){ return (this.cms.site && this.cms.site.paypal_email) ? this.cms.site.paypal_email.trim() : ''; },
    paypalMeUrl(){
      const value = this.paypalRecipient;
      return /paypal\.com\/paypalme\//i.test(value) || /paypal\.me\//i.test(value) ? value : '';
    },
    selectedGiveAmount(){
      const value = this.giveForm.customAmount !== '' ? this.giveForm.customAmount : this.giveForm.amount;
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    },
    giveAmountLabel(){ return '$' + this.selectedGiveAmount.toFixed(2); },
    giveHelp(){
      if(this.giveForm.method === 'Bank Transfer'){
        return (this.cms.site && this.cms.site.bank_transfer_details) ? this.cms.site.bank_transfer_details : 'Bank transfer details have not been added yet.';
      }
      return 'Payments are completed securely on PayPal in USD.';
    }
  },
  methods:{
    asset(url){
      if(!url || /^https?:\/\//i.test(url) || /^data:/i.test(url)){ return url || ''; }
      if(url.startsWith('../') || url.startsWith('./')){ return url; }
      return '../' + url.replace(/^\/+/, '');
    },
    cleanSlideText(value){
      const text = String(value || '').trim();
      return text === 'Sunday Service Live Now' ? '' : text;
    },
    cacheAsset(url, version){
      const value = this.asset(url);
      if(!value || !version || /^https?:\/\//i.test(value) || /^data:/i.test(value)){ return value; }
      return value + (value.includes('?') ? '&' : '?') + 'v=' + version;
    },
    pageHeroStyle(slug){
      const page = this.page(slug);
      const image = this.asset(page.hero || '');
      return image ? {backgroundImage:'linear-gradient(to bottom, rgba(0,0,0,.28), rgba(0,0,0,.86)), url(' + image + ')'} : {};
    },
    page(slug){ return (this.cms.pages && this.cms.pages[slug]) ? this.cms.pages[slug] : {}; },
    setGiveAmount(value){
      this.giveForm.amount=value;
      this.giveForm.customAmount='';
      this.giveForm.error='';
    },
    paypalMePaymentUrl(){
      const base = this.paypalMeUrl.replace(/\/+$/, '');
      return base + '/' + this.selectedGiveAmount.toFixed(2) + 'USD';
    },
    submitGive(){
      if(this.giveForm.method === 'Bank Transfer'){
        this.giveForm.error='';
        return;
      }
      if(!this.paypalRecipient){ this.giveForm.error='PayPal payment link or email has not been set yet.'; return; }
      if(this.selectedGiveAmount < 1){ this.giveForm.error='Enter an amount of at least $1.'; return; }
      this.giveForm.error='';
      if(this.paypalMeUrl){
        window.location.href = this.paypalMePaymentUrl();
        return;
      }
      if(this.$refs.mobilePaypalForm){ this.$refs.mobilePaypalForm.submit(); }
    },
    submitStoryComment(){
      const comment = this.storyCommentForm.comment.trim();
      if(!this.storyDetail.id || !comment){ this.storyCommentForm.error='Enter a comment before posting.'; return; }
      this.storyCommentForm.posting=true;
      this.storyCommentForm.error='';
      this.storyCommentForm.message='';
      const body = new URLSearchParams({
        story_id:this.storyDetail.id,
        display_name:this.storyCommentForm.display_name.trim() || 'Anonymous',
        comment
      });
      fetch(STORY_COMMENT_URL,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(response=>response.json())
        .then(data=>{
          if(!data || !data.ok){ this.storyCommentForm.error=(data && data.error) ? data.error : 'Unable to post comment.'; return; }
          this.storyCommentForm.comment='';
          this.storyCommentForm.display_name='';
          this.storyCommentForm.message=data.message || 'Thanks. Your comment is waiting for approval.';
        })
        .catch(()=>{ this.storyCommentForm.error='Unable to post comment right now.'; })
        .finally(()=>{ this.storyCommentForm.posting=false; });
    },
    syncRoute(){
      const value = location.hash.replace(/^#\/?/, '') || 'home';
      const parts = value.split('/');
      const previousRoute = this.route;
      this.routeParts = parts;
      this.route = parts[0] || 'home';
      if(this.route === 'live' && (parts[1] === 'youtube' || parts[1] === 'player')){
        this.activeStream = parts[1];
      }
      if(previousRoute === 'live' && this.route !== 'live'){
        this.stopLivePlayer();
      }
      this.menuOpen = false;
      this.storyCommentForm.message='';
      this.storyCommentForm.error='';
      window.scrollTo(0,0);
      this.$nextTick(()=>{ if(this.route === 'live' && this.member && this.activeStream === 'player'){ this.setupLivePlayer(true); } });
      this.$nextTick(()=>this.syncMiniLive());
    },
    async loadCms(){
      try{
        const response = await fetch(API_URL + '?t=' + Date.now(), {cache:'no-store'});
        const data = await response.json();
        Object.assign(this.cms, data);
        if(data.site && data.site.name){ document.title = data.site.name + ' Mobile'; }
      }catch(error){}
      this.ready = true;
      this.$nextTick(()=>{ if(this.route === 'live' && this.member && this.activeStream === 'player'){ this.setupLivePlayer(true); } });
      this.$nextTick(()=>this.syncMiniLive());
    },
    loginLive(){
      if(!this.liveForm.name.trim()){ this.liveError='Please enter your full name.'; return; }
      if(!/^[0-9+\-\s()]{6,}$/.test(this.liveForm.phone.trim())){ this.liveError='Please enter a valid phone number.'; return; }
      if(!this.liveForm.group){ this.liveError='Please select your group.'; return; }
      const attendance = this.liveForm.mode === 'group' ? Math.max(1, parseInt(this.liveForm.count || 1, 10)) : 1;
      const member = {name:this.liveForm.name.trim(), email:this.liveForm.email.trim(), phone:this.liveForm.phone.trim(), group:this.liveForm.group, viewingMode:this.liveForm.mode, attendance};
      this.member = member;
      if(this.liveForm.remember){ localStorage.setItem('kh_member', JSON.stringify(this.member)); }
      this.liveError='';
      this.loadChat();
      this.loadLiveNotice();
      this.$nextTick(()=>{ this.setupLivePlayer(false); this.sendPresence(false); });
      const body = new URLSearchParams({fullname:member.name, email:member.email, phone:member.phone, group:member.group, attendance:String(attendance)});
      fetch(LIVE.attendancePost,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(response => response.json())
        .then(data => {
          if(!data || !data.ok){ this.liveError=(data && data.error) ? data.error : 'Unable to sign in right now.'; return; }
          this.member = Object.assign({}, member, data.member || {});
          if(this.liveForm.remember){ localStorage.setItem('kh_member', JSON.stringify(this.member)); }
          this.liveError='';
          this.loadChat();
          this.loadLiveNotice();
          this.$nextTick(()=>{ this.setupLivePlayer(true); this.sendPresence(false); });
        })
        .catch(()=>{ this.liveError='Unable to sign in right now. Please try again.'; });
    },
    logoutLive(){
      this.sendPresence(true);
      localStorage.removeItem('kh_member');
      this.member=null;
      this.stopLivePlayer();
    },
    switchStream(type){
      this.activeStream=type;
      if(type === 'youtube'){ this.stopLivePlayer(false); this.loadStatus(); return; }
      this.$nextTick(()=>{ this.setupLivePlayer(true); this.sendPresence(false); });
    },
    setupLivePlayer(autoplay){
      const video=this.$refs.liveVideo;
      if(!video || !this.hlsUrl){ this.liveStatus='offline'; return Promise.resolve(false); }
      if(!this.liveFeedUrl){ this.liveStatus='invalid stream'; return Promise.resolve(false); }
      this.liveStatus='checking';
      if(this.hls){ this.hls.destroy(); this.hls=null; }
      this.hlsReadyPromise=null;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('x-webkit-airplay', 'allow');
      video.preload='auto';
      if(this.isHlsStream && !video.canPlayType('application/vnd.apple.mpegurl') && !video.canPlayType('application/x-mpegURL')){
        this.liveStatus='unsupported';
        return Promise.resolve(false);
      }
      if(video.dataset.hlsReady !== this.liveFeedUrl){
        video.removeAttribute('src');
        video.src=this.liveFeedUrl;
        video.load();
        video.dataset.hlsReady=this.liveFeedUrl;
      }
      return Promise.resolve(true);
    },
    playLiveVideo(allowMutedRetry){
      const video=this.$refs.liveVideo;
      if(!video){ return; }
      const playPromise=video.play();
      if(playPromise && playPromise.catch){
        playPromise.catch(() => {
          if(!allowMutedRetry){ return; }
          video.muted=true;
          this.muted=true;
          video.play().then(()=>{ this.liveStatus='tap for sound'; }).catch(()=>{ this.liveStatus='tap play'; });
        });
      }
    },
    stopLivePlayer(clearSource=true){
      const video=this.$refs.liveVideo;
      if(this.videoJsPlayer){ this.videoJsPlayer.pause(); }
      if(video){ video.pause(); if(clearSource){ video.removeAttribute('src'); video.load(); } }
      if(this.hls){ this.hls.destroy(); this.hls=null; }
      this.hlsReadyPromise=null;
      this.isPlaying=false;
    },
    markStreamReady(){ this.liveStatus='live'; this.miniLiveEnabled=true; this.miniLiveClosed=false; this.$nextTick(()=>this.syncMiniLive()); },
    markStreamError(){ this.liveStatus='offline'; this.isPlaying=false; },
    liveEdgeTime(video){
      if(this.hls && Number.isFinite(this.hls.liveSyncPosition)){ return this.hls.liveSyncPosition; }
      if(video && video.seekable && video.seekable.length){ return video.seekable.end(video.seekable.length - 1) - 1; }
      return 0;
    },
    recoverLivePlayback(force){
      const video=this.$refs.liveVideo;
      if(!video || this.activeStream !== 'player' || this.isIOSNativeHls){ return; }
      const edge=this.liveEdgeTime(video);
      if(!edge || !Number.isFinite(edge)){ return; }
      const drift=edge - video.currentTime;
      if(force || drift > 30 || video.ended){
        try{ video.currentTime=Math.max(0, edge - 2); }catch(error){}
      }
      if((force || video.ended) && this.isPlaying){ this.playLiveVideo(true); }
    },
    checkLiveDrift(){
      const video=this.$refs.liveVideo;
      if(!video || video.paused || this.isIOSNativeHls){ return; }
      this.recoverLivePlayback(false);
    },
    handleLiveStall(){
      const video=this.$refs.liveVideo;
      if(!video || this.activeStream !== 'player'){ return; }
      if(video.ended || video.error){
        this.liveStatus='reconnecting';
        if(this.liveFeedUrl){
          video.src=this.liveFeedUrl;
          video.load();
          if(this.isPlaying){ setTimeout(()=>this.playLiveVideo(true), 350); }
        }
        return;
      }
      this.liveStatus='buffering';
    },
    toggleLivePlay(){
      const video=this.$refs.liveVideo;
      if(!video){ return; }
      this.setupLivePlayer(false);
      if(video.muted){
        this.unmuteLive();
        return;
      }
      if(video.paused){ this.playLiveVideo(true); } else { video.pause(); }
    },
    unmuteLive(){
      const video=this.$refs.liveVideo;
      if(!video){ return; }
      if(video.muted){
        video.muted=false;
        this.muted=false;
      }
      video.volume=1;
      if(video.paused){ this.playLiveVideo(false); }
      this.liveStatus='live';
    },
    toggleLiveMute(){
      const video=this.$refs.liveVideo;
      if(!video){ return; }
      video.muted=!video.muted;
      this.muted=video.muted;
      this.liveStatus=video.muted ? 'tap for sound' : 'live';
    },
    fullscreenLive(){
      const video=this.$refs.liveVideo;
      if(!video){ return; }
      if(document.fullscreenElement){ document.exitFullscreen(); }
      else if(video.requestFullscreen){ video.requestFullscreen(); }
      else if(video.webkitRequestFullscreen){ video.webkitRequestFullscreen(); }
    },
    loadStatus(){
      fetch(LIVE.status).then(response=>response.json()).then(data=>{
        if(data && data.isLive){ this.liveStatus='live'; }
        else if(this.activeStream === 'youtube'){ this.liveStatus='offline'; }
      }).catch(()=>{ if(this.activeStream === 'youtube'){ this.liveStatus='unknown'; } });
    },
    loadChat(){
      fetch(LIVE.chatFeed + '?t=' + Date.now(), {cache:'no-store'}).then(response=>response.json()).then(rows=>{
        const list=this.$refs.chatList;
        const shouldStick=!list || (list.scrollHeight - list.scrollTop - list.clientHeight < 80);
        this.chat=Array.isArray(rows) ? rows : [];
        this.$nextTick(()=>{ const nextList=this.$refs.chatList; if(nextList && shouldStick){ nextList.scrollTop=nextList.scrollHeight; } });
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
    postChat(){
      const text=this.chatText.trim();
      if(!text){ return; }
      const memberName=(this.member && this.member.name) || 'Guest';
      const localMessage={id:'local-' + Date.now(), name:memberName, shout:text, date:this.localChatDate()};
      this.chat=[...this.chat, localMessage];
      this.chatText='';
      this.chatError='';
      this.$nextTick(()=>{ const list=this.$refs.chatList; if(list){ list.scrollTop=list.scrollHeight; } });
      const body=new URLSearchParams({name:memberName, shout:text, date:new Date().toISOString().slice(0,19).replace('T',' ')});
      fetch(LIVE.chatPost,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(()=>{ this.loadChat(); setTimeout(()=>this.loadChat(), 800); })
        .catch(()=>{ this.chatError='Unable to post right now.'; });
    },
    ensurePresenceToken(){
      if(!this.presenceToken){
        this.presenceToken = 'mobile-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
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
      fetch(LIVE.presence,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(response=>response.json())
        .then(data=>{ if(data && data.ok){ this.liveViewers=parseInt(data.total || 0, 10); } })
        .catch(()=>{});
    },
    loadLiveNotice(){
      if(!this.member){ this.liveNotice=null; return; }
      fetch(LIVE.liveNotices).then(response=>response.json()).then(data=>{
        const notice = data && data.notice ? data.notice : null;
        if(!notice || !notice.id){ this.liveNotice=null; return; }
        this.liveNotice = String(notice.id) === String(this.dismissedNoticeId) ? null : notice;
      }).catch(()=>{});
    },
    syncMiniLive(){
      if(!this.showMiniLive){ this.cleanupMiniLive(false); return; }
      const video=this.$refs.miniLiveVideo;
      if(!video || !this.liveFeedUrl){ return; }
      if(this.miniHlsReady !== this.liveFeedUrl){
        this.cleanupMiniLive(false);
        video.src=this.liveFeedUrl;
        video.load();
        this.miniHlsReady=this.liveFeedUrl;
      }
      video.muted=this.miniLiveMuted;
      const playPromise=video.play();
      if(playPromise && playPromise.catch){ playPromise.catch(()=>{}); }
    },
    cleanupMiniLive(clearSource=true){
      const video=this.$refs.miniLiveVideo;
      if(video){ video.pause(); if(clearSource){ video.removeAttribute('src'); video.load(); } }
      if(this.miniHls){ this.miniHls.destroy(); this.miniHls=null; }
      this.miniHlsReady='';
    },
    toggleMiniLiveMute(){
      this.miniLiveMuted=!this.miniLiveMuted;
      const video=this.$refs.miniLiveVideo;
      if(video){ video.muted=this.miniLiveMuted; }
    },
    closeMiniLive(){
      this.miniLiveClosed=true;
      this.cleanupMiniLive();
    },
    dismissLiveNotice(){
      if(this.liveNotice && this.liveNotice.id){
        this.dismissedNoticeId=String(this.liveNotice.id);
        localStorage.setItem('kh_live_notice_dismissed', this.dismissedNoticeId);
      }
      this.liveNotice=null;
    }
  },
  mounted(){
    try{ this.member=JSON.parse(localStorage.getItem('kh_member') || 'null'); }catch(error){}
    this.syncRoute();
    this.loadCms();
    window.addEventListener('hashchange', this.syncRoute);
    window.addEventListener('focus', () => this.loadCms());
    this.cmsRefreshTimer = setInterval(() => this.loadCms(), 20000);
    this.chatTimer=setInterval(()=>{ if(this.member){ this.loadChat(); } }, 5000);
    this.statusTimer=setInterval(()=>{ if(this.route === 'live'){ this.loadStatus(); } }, 30000);
    this.noticeTimer=setInterval(()=>{ if(this.member){ this.loadLiveNotice(); } }, 8000);
    this.presenceTimer=setInterval(()=>this.sendPresence(false), 15000);
    this.sendPresence(false);
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  }
}).mount('#app');
