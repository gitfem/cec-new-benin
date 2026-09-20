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
  chatPost:'../bridge_a73c9_messages.php'
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
      searchSermons:'',
      searchEvents:'',
      searchStories:'',
      liveForm:{name:'', phone:'', email:'', group:'Christ Embassy Lagos Street', category:'Church Member', mode:'individual', count:1, remember:true},
      categoryOptions:['Church Member','First-Time Visitor','Cell Leader','Teen/Youth','Visiting Minister'],
      currencies: [
        { code: 'NGN', symbol: '₦', flag: '🇳🇬', label: 'NGN (₦)', name: 'Naira', presets: [5000, 10000, 25000, 50000, 100000], defaultVal: 10000 },
        { code: 'USD', symbol: '$', flag: '🇺🇸', label: 'USD ($)', name: 'Dollar', presets: [25, 50, 100, 250, 500], defaultVal: 50 },
        { code: 'GBP', symbol: '£', flag: '🇬🇧', label: 'GBP (£)', name: 'Pounds', presets: [20, 50, 100, 250, 500], defaultVal: 50 },
        { code: 'EUR', symbol: '€', flag: '🇪🇺', label: 'EUR (€)', name: 'Euros', presets: [25, 50, 100, 250, 500], defaultVal: 50 },
        { code: 'CAD', symbol: 'CA$', flag: '🇨🇦', label: 'CAD ($)', name: 'CAD', presets: [25, 50, 100, 250, 500], defaultVal: 50 }
      ],
      giveForm:{currency:'NGN', amount:10000, customAmount:'', name:'', phone:'', email:'', towards:'Tithe', frequency:'One Time', method:'Bank Transfer', note:'', error:'', copiedKey:''},
      visitPreReg:{name:'', phone:'', email:'', date:'', guests:1, submitted:false, submitting:false, error:''},
      openVisitFaq:null,
      groupOptions:['Christ Embassy Lagos Street','Christ Embassy Upper Mission 2','Christ Embassy Universal','Christ Embassy Lawani Model','Christ Embassy GRA','Christ Embassy Okhoro'],
      activeSermonCategory:'All Messages',
      sermonCategories:['All Messages', 'Sunday Services', 'Faith & Healing', 'Leadership & Excellence', 'Mid-Week Teachings', 'Kingdom Prosperity', 'Evangelism & Missions'],
      sermonShareCopied:false,
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
    siteLogo(){ return this.cms.site.logo || ''; },
    brandInitial(){ return this.siteName.trim().charAt(0).toUpperCase() || 'C'; },
    brandParts(){
      const name = this.siteName.trim();
      if(/^ce\s+new\s+benin$/i.test(name) || /^christ\s+embassy\s+new\s+benin$/i.test(name)){
        return ['CE', 'New Benin'];
      }
      const words = name.split(/\s+/).filter(Boolean);
      return words.length > 1 ? [words.slice(0,-1).join(' '), words[words.length-1]] : [name, ''];
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
    featureBanners(){
      const banners = (this.cms && this.cms.home && Array.isArray(this.cms.home.feature_banners)) ? this.cms.home.feature_banners : [];
      const defaultIcons = ['fa-solid fa-location-dot', 'fa-solid fa-calendar-days', 'fa-solid fa-hand-holding-heart', 'fa-solid fa-tower-broadcast'];
      const defaultAccents = ['gold', 'blue', 'green', 'rose'];
      return banners.map((item, idx) => ({
        ...item,
        icon: item.icon || defaultIcons[idx % defaultIcons.length],
        accent: item.accent || defaultAccents[idx % defaultAccents.length]
      }));
    },
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
        subtitle:item.subtitle || item.summary || '',
        body:item.body || item.summary || '',
        image_url:this.cacheAsset(item.image_url || '', item.updated_ts),
        meta_text:item.meta_text || item.schedule || '',
        schedule:item.schedule || '',
        location:item.location || '',
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
    aboutPage(){ return this.page('about'); },
    aboutPillars(){
      const page = this.aboutPage;
      if (Array.isArray(page.pillars) && page.pillars.length) return page.pillars;
      return [
        { icon: 'fa-solid fa-book-bible', title: 'The Infallible Word', desc: "Founded on the integrity and authority of God's Word, living triumphantly through faith." },
        { icon: 'fa-solid fa-fire-flame-curved', title: 'Spirit-Led Worship & Prayer', desc: "Experiencing the tangible presence of the Holy Spirit through prayer and worship." },
        { icon: 'fa-solid fa-medal', title: 'Culture of Excellence', desc: "Excellence is our divine nature in Christ, expressed with diligence and distinction." },
        { icon: 'fa-solid fa-earth-americas', title: 'Global Soul Winning & Outreach', desc: "Taking the gospel to every soul in Benin City and beyond with fervent passion." }
      ];
    },
    aboutBeliefs(){
      const page = this.aboutPage;
      if (Array.isArray(page.beliefs) && page.beliefs.length) return page.beliefs;
      return [
        { title: 'The Infallible Scriptures', desc: 'The Bible is the inspired, living Word of God and our supreme authority.' },
        { title: 'The New Creation in Christ', desc: 'Born again into divine nature, righteousness, and eternal victory.' },
        { title: 'The Ministry of the Holy Spirit', desc: 'Empowered, guided, and taught by the Spirit of God.' },
        { title: 'Divine Health & Prosperity', desc: 'Health, peace, and abundance are our covenant inheritance in Christ.' },
        { title: 'The Great Commission', desc: 'Taking the gospel to all nations and preparing the Church for His return.' }
      ];
    },
    aboutServiceTimes(){
      const page = this.aboutPage;
      if (Array.isArray(page.service_times) && page.service_times.length) return page.service_times;
      return [
        { day: 'Every Sunday Morning', service: 'Sunday Service of Excellence', time: '7:30 AM & 9:30 AM (WAT)', badge: 'Main Worship' },
        { day: 'Every Wednesday Evening', service: 'Mid-Week Faith Clinic', time: '6:00 PM (WAT)', badge: 'Faith Clinic' }
      ];
    },
    visitExpectations(){
      const page = this.visitPage;
      if (Array.isArray(page.what_to_expect) && page.what_to_expect.length) return page.what_to_expect;
      return [
        { icon: 'fa-solid fa-heart-circle-check', title: 'Warm & Royal Welcome', desc: 'From our car park stewards to our smiling foyer ushers, you will receive VIP care and seamless guidance.' },
        { icon: 'fa-solid fa-music', title: 'Anointed Worship', desc: 'Experience uplifting, spirit-filled music and high praise that will transport your spirit into God\'s presence.' },
        { icon: 'fa-solid fa-book-bible', title: 'Life-Transforming Word', desc: 'Receive unadulterated divine revelations of God\'s Word designed to cause you to triumph in every area of life.' },
        { icon: 'fa-solid fa-children', title: 'Vibrant Kids & Teens Church', desc: 'A safe, inspiring, fun-filled learning environment tailored for babies, kids, and energetic teenagers.' }
      ];
    },
    visitFaqs(){
      const page = this.visitPage;
      if (Array.isArray(page.faqs) && page.faqs.length) return page.faqs;
      return [
        { q: 'What should I wear to church?', a: 'Come dressed comfortably! Whether traditional, formal suit, or smart-casual, you will be warmly received in royal love.' },
        { q: 'What about my children?', a: 'We have dedicated, secure Children’s Church with qualified teachers providing age-appropriate ministry.' },
        { q: 'How long do services usually last?', a: 'Our Sunday Services run for approximately 2 hours, packed with dynamic praise, worship, communion, and the Word.' },
        { q: 'Is parking available at the church?', a: 'Yes, our secure parking lot with courteous traffic stewards is readily available to assist you.' }
      ];
    },
    visitLocations(){ return Array.isArray(this.cms.home.locations) ? this.cms.home.locations.slice(0, 3).map(item => Object.assign({}, item, {image_url:this.cacheAsset(item.image_url || '', item.updated_ts)})) : []; },
    genericPage(){ return this.page(this.route); },
    hasGenericPage(){
      const page = this.genericPage;
      const handled = ['home','live','watch','events','give','locations','groups','ministries','visit','menu'];
      return handled.indexOf(this.route) === -1 && !!(page && (page.title || page.body || page.subtitle || page.hero));
    },
    watchHeroImage(){
      const watchPage = this.cms && this.cms.pages && this.cms.pages.watch;
      return (watchPage && watchPage.hero) ? this.asset(watchPage.hero) : 'assets/uploaded_media/watch_hero_banner.jpg';
    },
    mobileFeaturedSermon(){
      const featId = this.cms && this.cms.pages && this.cms.pages.watch && this.cms.pages.watch.featured_sermon_id;
      const found = (featId && this.latestSermons.find(s => String(s.id) === String(featId))) || this.latestSermons[0] || {};
      return Object.assign({}, found, {
        poster_url: this.asset(found.poster_url || 'assets/uploaded_media/featured_sermon_spotlight.jpg'),
        href: '#/watch/' + (found.id || '1')
      });
    },
    sermonDetail(){
      const id = this.routeParts[1] || '';
      const found = this.latestSermons.find(item => String(item.id) === String(id)) || this.latestSermons[0] || {};
      return Object.assign({}, found, {
        category: found.category || 'Sunday Service',
        speaker: found.speaker || 'Rev. Dr. Chris Oyakhilome D.Sc., D.D.',
        duration: found.duration || '',
        scripture: found.scripture || '',
        date: found.date || '',
        media_type: found.media_type || (found.embed_url ? 'embed' : 'video'),
        media_url: this.asset(found.media_url || ''),
        poster_url: this.asset(found.poster_url || 'assets/uploaded_media/sermons_hero_banner.jpg'),
        image_url: this.asset(found.poster_url || (found.media_type === 'image' ? found.media_url : '') || 'assets/uploaded_media/sermons_hero_banner.jpg')
      });
    },
    events(){ return Array.isArray(this.cms.home.events) ? this.cms.home.events : []; },
    filteredMobileSermons(){
      let items = this.latestSermons;
      if (this.activeSermonCategory && this.activeSermonCategory !== 'All Messages') {
        items = items.filter(s => (s.category || '').toLowerCase() === this.activeSermonCategory.toLowerCase());
      }
      if(!this.searchSermons.trim()) return items;
      const q = this.searchSermons.trim().toLowerCase();
      return items.filter(s => (s.title && s.title.toLowerCase().includes(q)) || (s.speaker && s.speaker.toLowerCase().includes(q)) || (s.subtitle && s.subtitle.toLowerCase().includes(q)) || (s.scripture && s.scripture.toLowerCase().includes(q)));
    },
    filteredMobileEvents(){
      if(!this.searchEvents.trim()) return this.events;
      const q = this.searchEvents.trim().toLowerCase();
      return this.events.filter(e => (e.title && e.title.toLowerCase().includes(q)) || (e.subtitle && e.subtitle.toLowerCase().includes(q)) || (e.summary && e.summary.toLowerCase().includes(q)) || (e.event_date && e.event_date.toLowerCase().includes(q)) || (e.location && e.location.toLowerCase().includes(q)) || (e.category && e.category.toLowerCase().includes(q)));
    },
    filteredMobileStories(){
      if(!this.searchStories.trim()) return this.stories;
      const q = this.searchStories.trim().toLowerCase();
      return this.stories.filter(s => (s.title && s.title.toLowerCase().includes(q)) || (s.subtitle && s.subtitle.toLowerCase().includes(q)) || (s.summary && s.summary.toLowerCase().includes(q)) || (s.author && s.author.toLowerCase().includes(q)) || (s.eyebrow && s.eyebrow.toLowerCase().includes(q)) || (s.category && s.category.toLowerCase().includes(q)));
    },
    eventDetail(){
      const id = this.routeParts[1] || '';
      const found = this.events.find(item => String(item.id) === String(id)) || {};
      return Object.assign({}, found, {image_url:this.asset(found.image_url || '')});
    },
    navItems(){
      const links = Array.isArray(this.cms.nav) && this.cms.nav.length ? this.cms.nav : this.fallbackNav;
      return links.map(item => ({label:item.label, href:item.href || '#/'}));
    },
    socialLinks(){
      const site = (this.cms && this.cms.site) ? this.cms.site : {};
      const links = Array.isArray(site.social_links) ? site.social_links : [];
      const kc = links.find(l => l.key === 'kingchat') || {};
      const yt = links.find(l => l.key === 'youtube') || {};
      const fb = links.find(l => l.key === 'facebook') || {};
      const ig = links.find(l => l.key === 'instagram') || {};
      const tw = links.find(l => l.key === 'twitter') || {};

      const list = [
        { label: 'KingsChat', feedLabel: 'KingsChat Feed', key: 'kingchat', icon: '', url: site.kingchat || kc.url || 'https://kingschat.online/user/cenewbenin', handle: kc.handle || '@cenewbenin' },
        { label: 'YouTube', feedLabel: 'YouTube Channel', key: 'youtube', icon: 'fa-brands fa-youtube', url: site.youtube || yt.url || 'https://youtube.com/@christembassy', handle: yt.handle || 'Christ Embassy' },
        { label: 'Facebook', feedLabel: 'Facebook Page', key: 'facebook', icon: 'fa-brands fa-facebook-f', url: site.facebook || fb.url || 'https://facebook.com/christembassy', handle: fb.handle || 'CE New Benin' }
      ];
      if (site.instagram || (ig && ig.url)) { list.push({ label: 'Instagram', feedLabel: 'Instagram', key: 'instagram', icon: 'fa-brands fa-instagram', url: site.instagram || ig.url, handle: ig.handle || '' }); }
      if (site.twitter || (tw && tw.url)) { list.push({ label: 'Twitter / X', feedLabel: 'X', key: 'twitter', icon: 'fa-brands fa-x-twitter', url: site.twitter || tw.url, handle: tw.handle || '' }); }
      return list.filter(item => item.url && item.url !== '#');
    },
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
      const valid = items.filter(row => row && (row.announcement || row.title));
      if(!valid.length) return '';
      return valid.map(item => {
        let h = '';
        if(item.title) h += '<h4 style="color:#1e3a8a; font-weight:700; margin-bottom:6px; font-size:1.05rem;">' + item.title + '</h4>';
        if(item.announcement) h += '<div style="color:#0f172a; line-height:1.6; font-size:0.92rem;">' + item.announcement + '</div>';
        return '<div class="announcement-item mb-3 pb-3" style="border-bottom:1px solid #e2e8f0;">' + h + '</div>';
      }).join('');
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
    currentMobileCurrency(){
      return this.currencies.find(c => c.code === this.giveForm.currency) || this.currencies[0];
    },
    mobileCurrencyPresets(){
      return this.currentMobileCurrency.presets;
    },
    selectedGiveAmount(){
      const value = this.giveForm.customAmount !== '' ? this.giveForm.customAmount : this.giveForm.amount;
      const parsed = parseFloat(value);
      return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
    },
    giveAmountLabel(){
      const sym = this.currentMobileCurrency.symbol;
      if (this.giveForm.currency === 'NGN') {
        return sym + this.selectedGiveAmount.toLocaleString('en-NG') + ' ' + this.giveForm.currency;
      }
      return sym + this.selectedGiveAmount.toFixed(2) + ' ' + this.giveForm.currency;
    },
    giveCategories(){
      const p = (this.cms && this.cms.pages && this.cms.pages.give) || {};
      return Array.isArray(p.categories) && p.categories.length ? p.categories : ['Tithe', 'Partnership Seed', 'General Offering', 'First Fruits', 'Church Building Seed', 'Thanksgiving Seed'];
    },
    mobileBanks(){
      const p = (this.cms && this.cms.pages && this.cms.pages.give) || {};
      const all = Array.isArray(p.bank_details) ? p.bank_details : [];
      const cur = this.giveForm.currency;
      const matched = all.filter(b => b.currency === cur);
      return matched.length ? matched : all;
    },
    mobileKingsPayCode(){
      const p = (this.cms && this.cms.pages && this.cms.pages.give) || {};
      return p.kingspay_code || 'CENEWBENIN';
    },
    giveHelp(){
      if(this.giveForm.method === 'Bank Transfer'){
        return (this.cms.site && this.cms.site.bank_transfer_details) ? this.cms.site.bank_transfer_details : 'Select bank account below to copy details.';
      }
      return 'Payments are completed securely.';
    }
  },
  methods:{
    copySermonShare(href){
      const url = href ? (window.location.origin + window.location.pathname + href) : window.location.href;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).then(() => {
          this.sermonShareCopied = true;
          setTimeout(() => { this.sermonShareCopied = false; }, 2500);
        });
      }
    },
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
      return image ? {backgroundImage:'linear-gradient(to bottom, rgba(0,0,0,.35), rgba(0,0,0,.88)), url(' + image + ')'} : {};
    },
    page(slug){ return (this.cms.pages && this.cms.pages[slug]) ? this.cms.pages[slug] : {}; },
    toggleVisitFaq(idx){
      this.openVisitFaq = this.openVisitFaq === idx ? null : idx;
    },
    submitVisitPreReg(){
      if (!this.visitPreReg.name || !this.visitPreReg.phone) {
        this.visitPreReg.error = 'Please enter your name and phone number.';
        return;
      }
      this.visitPreReg.submitting = true;
      this.visitPreReg.error = '';
      setTimeout(() => {
        this.visitPreReg.submitting = false;
        this.visitPreReg.submitted = true;
      }, 350);
    },
    selectMobileCurrency(code){
      this.giveForm.currency = code;
      const c = this.currencies.find(item => item.code === code) || this.currencies[0];
      this.giveForm.amount = c.defaultVal;
      this.giveForm.customAmount = '';
      this.giveForm.error = '';
      if (code === 'NGN') {
        if (this.giveForm.method === 'PayPal') this.giveForm.method = 'Bank Transfer';
      } else {
        if (this.giveForm.method === 'KingsPay') this.giveForm.method = 'PayPal';
      }
    },
    setGiveAmount(value){
      this.giveForm.amount=value;
      this.giveForm.customAmount='';
      this.giveForm.error='';
    },
    copyMobileText(text, key){
      if (!text) return;
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          this.giveForm.copiedKey = key;
          setTimeout(() => { if (this.giveForm.copiedKey === key) this.giveForm.copiedKey = ''; }, 2500);
        });
      } else {
        const t = document.createElement('textarea');
        t.value = text;
        document.body.appendChild(t);
        t.select();
        try { document.execCommand('copy'); this.giveForm.copiedKey = key; setTimeout(() => { if (this.giveForm.copiedKey === key) this.giveForm.copiedKey = ''; }, 2500); } catch(e){}
        document.body.removeChild(t);
      }
    },
    paypalMePaymentUrl(){
      const base = this.paypalMeUrl.replace(/\/+$/, '');
      return base + '/' + this.selectedGiveAmount.toFixed(2) + this.giveForm.currency;
    },
    submitGive(){
      if(this.giveForm.method === 'PayPal'){
        if(!this.paypalRecipient){ this.giveForm.error='PayPal payment link or email has not been set yet.'; return; }
        if(this.selectedGiveAmount < 1){ this.giveForm.error='Enter an amount of at least 1 ' + this.giveForm.currency; return; }
        this.giveForm.error='';
        if(this.paypalMeUrl){
          window.location.href = this.paypalMePaymentUrl();
          return;
        }
        if(this.$refs.mobilePaypalForm){ this.$refs.mobilePaypalForm.submit(); }
      } else if(this.giveForm.method === 'Bank Transfer'){
        if(this.mobileBanks.length && this.mobileBanks[0].account_number){
          this.copyMobileText(this.mobileBanks[0].account_number, 'mb_acc_0');
        }
      } else if(this.giveForm.method === 'KingsPay'){
        this.copyMobileText(this.mobileKingsPayCode, 'mb_kp');
      }
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
      if(this.route === 'live' && this.member){
        this.ensureAttendanceCaptured();
      }
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
      this.$nextTick(()=>{
        if(this.route === 'live' && this.member && this.activeStream === 'player'){
          const video = this.$refs.liveVideo;
          if(!video || video.dataset.hlsReady !== this.liveFeedUrl){
            this.setupLivePlayer(true);
          }
        }
      });
      this.$nextTick(()=>this.syncMiniLive());
    },
    ensureAttendanceCaptured(){
      if(!this.member || !this.member.name){ return; }
      const today = new Date().toISOString().slice(0, 10);
      const sessionKey = 'kh_att_session_' + today;
      if(sessionStorage.getItem(sessionKey) === 'logged'){ return; }
      const serviceName = (this.cms && this.cms.live && this.cms.live.title) ? this.cms.live.title : 'Sunday Service of Excellence';
      const attendance = this.member.attendance || (this.member.viewingMode === 'group' ? Math.max(1, parseInt(this.member.groupCount || 1, 10)) : 1);
      const body = new URLSearchParams({
        fullname: this.member.name,
        email: this.member.email || '',
        phone: this.member.phone || '',
        group: this.member.group || 'Christ Embassy Lagos Street',
        category: this.member.category || 'Church Member',
        service_name: serviceName,
        platform: 'Mobile Web App',
        attendance: String(attendance),
        viewing_mode: this.member.viewingMode || 'individual'
      });
      fetch(LIVE.attendancePost, {method:'POST', headers:{'Content-Type':'application/x-www-form-urlencoded'}, body})
        .then(response => response.json())
        .then(res => {
          if(res && res.ok){ sessionStorage.setItem(sessionKey, 'logged'); }
        }).catch(()=>{});
    },
    loginLive(){
      if(!this.liveForm.name.trim()){ this.liveError='Please enter your full name.'; return; }
      if(!/^[0-9+\-\s()]{6,}$/.test(this.liveForm.phone.trim())){ this.liveError='Please enter a valid phone number.'; return; }
      if(!this.liveForm.group){ this.liveError='Please select your group.'; return; }
      const attendance = this.liveForm.mode === 'group' ? Math.max(1, parseInt(this.liveForm.count || 1, 10)) : 1;
      const serviceName = (this.cms && this.cms.live && this.cms.live.title) ? this.cms.live.title : 'Sunday Service of Excellence';
      const member = {name:this.liveForm.name.trim(), email:this.liveForm.email.trim(), phone:this.liveForm.phone.trim(), group:this.liveForm.group, category:this.liveForm.category || 'Church Member', viewingMode:this.liveForm.mode, attendance, service_name:serviceName};
      this.member = member;
      if(this.liveForm.remember){ localStorage.setItem('kh_member', JSON.stringify(this.member)); }
      this.liveError='';
      this.loadChat();
      this.loadLiveNotice();
      this.$nextTick(()=>{ this.setupLivePlayer(false); this.sendPresence(false); });
      const body = new URLSearchParams({
        fullname:member.name,
        email:member.email,
        phone:member.phone,
        group:member.group,
        category:member.category,
        service_name:serviceName,
        platform:'Mobile Web App',
        attendance:String(attendance)
      });
      fetch(LIVE.attendancePost,{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body})
        .then(response => response.json())
        .then(data => {
          if(!data || !data.ok){ this.liveError=(data && data.error) ? data.error : 'Unable to sign in right now.'; return; }
          this.member = Object.assign({}, member, data.member || {});
          if(this.liveForm.remember){ localStorage.setItem('kh_member', JSON.stringify(this.member)); }
          sessionStorage.setItem('kh_att_session_' + new Date().toISOString().slice(0, 10), 'logged');
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
    acquireWakeLock(){
      try {
        if ('wakeLock' in navigator && !this._wakeLock) {
          navigator.wakeLock.request('screen').then(lock => {
            this._wakeLock = lock;
            lock.addEventListener('release', () => { this._wakeLock = null; });
          }).catch(()=>{});
        }
      } catch(e){}
    },
    releaseWakeLock(){
      try {
        if (this._wakeLock) {
          this._wakeLock.release().catch(()=>{});
          this._wakeLock = null;
        }
      } catch(e){}
    },
    setupLivePlayer(autoplay){
      const video=this.$refs.liveVideo;
      if(!video || !this.hlsUrl){ this.liveStatus='offline'; return Promise.resolve(false); }
      if(!this.liveFeedUrl){ this.liveStatus='invalid stream'; return Promise.resolve(false); }

      // If player is already initialized for this exact feed URL, do not destroy or restart it
      if(video.dataset.hlsReady === this.liveFeedUrl && (this.hls || video.src)){
        if(autoplay && video.paused && !this._userManuallyPaused){
          this.playLiveVideo(true);
        }
        return Promise.resolve(true);
      }

      this.liveStatus='checking';
      if(this.hls){ this.hls.destroy(); this.hls=null; }
      video.dataset.hlsReady='';
      this.hlsReadyPromise=null;
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.setAttribute('x-webkit-airplay', 'allow');
      video.preload='auto';

      if(!video._stallRecoveryAttached){
        video._stallRecoveryAttached = true;
        let stallTimer = null;

        const tryResume = () => {
          if(!this._userManuallyPaused && this.activeStream === 'player' && this.route === 'live'){
            if(video.buffered && video.buffered.length > 0){
              for(let i = 0; i < video.buffered.length; i++){
                const bStart = video.buffered.start(i);
                const bEnd = video.buffered.end(i);
                if(video.currentTime >= bStart && video.currentTime < bEnd - 0.25){
                  video.currentTime = Math.min(video.currentTime + 0.2, bEnd - 0.05);
                  break;
                } else if(video.currentTime < bStart && bStart - video.currentTime < 1.0){
                  video.currentTime = bStart + 0.05;
                  break;
                }
              }
            }
            if(this.hls){
              this.hls.startLoad();
            }
            if(video.paused){
              video.play().then(() => {
                this.liveStatus = 'live';
                this.isPlaying = true;
              }).catch(()=>{});
            } else {
              this.liveStatus = 'live';
            }
          }
        };

        video.addEventListener('waiting', () => {
          this.liveStatus = 'buffering';
          clearTimeout(stallTimer);
          stallTimer = setTimeout(tryResume, 1000);
        });

        video.addEventListener('stalled', () => {
          this.liveStatus = 'buffering';
          clearTimeout(stallTimer);
          stallTimer = setTimeout(tryResume, 1200);
        });

        video.addEventListener('pause', () => {
          if(this.isPlaying && !this._userManuallyPaused){
            setTimeout(() => {
              if(this.isPlaying && !this._userManuallyPaused && video.paused){
                video.play().catch(()=>{});
              }
            }, 400);
          }
        });

        video.addEventListener('playing', () => {
          clearTimeout(stallTimer);
          this.liveStatus = 'live';
          this.isPlaying = true;
          this.acquireWakeLock();
        });

        video.addEventListener('seeking', () => {
          if (video.buffered && video.buffered.length > 0) {
            const bStart = video.buffered.start(0);
            const bEnd = video.buffered.end(video.buffered.length - 1);
            if (video.currentTime > bEnd || video.currentTime < bStart) {
              video.currentTime = Math.max(bStart, bEnd - 1.5);
            }
          }
        });

        video.addEventListener('timeupdate', () => {
          if (video.buffered && video.buffered.length > 0) {
            const bStart = video.buffered.start(0);
            const bEnd = video.buffered.end(video.buffered.length - 1);
            if (video.currentTime > bEnd) {
              video.currentTime = Math.max(bStart, bEnd - 1.5);
            }
          }
        });

        video.addEventListener('ended', () => {
          if(this.isPlaying && !this._userManuallyPaused){
            tryResume();
          }
        });
      }

      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
      if(this.isHlsStream && !isIOS && window.Hls && Hls.isSupported()){
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          maxBufferLength: 8,
          maxMaxBufferLength: 14,
          liveSyncDurationCount: 2,
          liveMaxLatencyDurationCount: 4,
          maxLiveSyncPlaybackRate: 1.0,
          maxBufferHole: 0.5,
          maxFragLookUpTolerance: 0.25,
          liveDurationInfinity: true,
          manifestLoadingTimeOut: 15000,
          manifestLoadingMaxRetry: 6,
          levelLoadingTimeOut: 15000,
          levelLoadingMaxRetry: 6,
          fragLoadingTimeOut: 20000,
          fragLoadingMaxRetry: 8,
          startFragPrefetch: true,
          backBufferLength: 3,
          nudgeOffset: 0.1,
          nudgeMaxRetry: 6
        });

        Object.defineProperty(hls, 'liveSyncPosition', {
          get: function() {
            if (video.buffered && video.buffered.length > 0) {
              const bEnd = video.buffered.end(video.buffered.length - 1);
              const bStart = video.buffered.start(0);
              if (video.currentTime >= bStart && video.currentTime <= bEnd) {
                return video.currentTime;
              }
              return Math.max(bStart, bEnd - 1.5);
            }
            return 0;
          },
          configurable: true
        });

        hls.loadSource(this.liveFeedUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.ERROR, (event, data) => {
          if(!data) return;
          if(data.details === Hls.ErrorDetails.BUFFER_STALLED_ERROR || data.details === Hls.ErrorDetails.BUFFER_NUDGE_ON_STALL){
            if(video && !this._userManuallyPaused){
              if(video.buffered && video.buffered.length > 0){
                for(let i = 0; i < video.buffered.length; i++){
                  const bStart = video.buffered.start(i);
                  const bEnd = video.buffered.end(i);
                  if(video.currentTime >= bStart && video.currentTime < bEnd - 0.25){
                    video.currentTime = Math.min(video.currentTime + 0.2, bEnd - 0.05);
                    break;
                  } else if(video.currentTime < bStart && bStart - video.currentTime < 1.0){
                    video.currentTime = bStart + 0.05;
                    break;
                  }
                }
              }
              if(hls){
                hls.startLoad();
              }
              if(video.paused && !this._userManuallyPaused){
                video.play().catch(()=>{});
              }
            }
            return;
          }
          if(data.fatal){
            switch(data.type){
              case Hls.ErrorTypes.NETWORK_ERROR:
                console.warn('HLS Network stall, attempting recovery...', data);
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                console.warn('HLS Media decode stall, recovering media...', data);
                hls.recoverMediaError();
                break;
              default:
                console.error('Fatal HLS error, re-initializing...', data);
                hls.destroy();
                this.hls = null;
                video.dataset.hlsReady = '';
                setTimeout(() => {
                  if(!this._userManuallyPaused && this.activeStream === 'player' && this.route === 'live'){
                    this.setupLivePlayer(true);
                  }
                }, 1000);
                break;
            }
          }
        });
        this.hls = hls;
        video.dataset.hlsReady = this.liveFeedUrl;
        if(autoplay){
          this.playLiveVideo(true);
        }
        return Promise.resolve(true);
      }

      video.removeAttribute('src');
      video.src=this.liveFeedUrl;
      video.load();
      video.dataset.hlsReady=this.liveFeedUrl;
      if(autoplay){
        this.playLiveVideo(true);
      }
      return Promise.resolve(true);
    },
    playLiveVideo(allowMutedRetry){
      const video=this.$refs.liveVideo;
      if(!video){ return; }
      this._userManuallyPaused = false;
      this.acquireWakeLock();
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
      this._userManuallyPaused = true;
      this.releaseWakeLock();
      if(this.videoJsPlayer){ this.videoJsPlayer.pause(); }
      if(video){ video.pause(); if(clearSource){ video.removeAttribute('src'); video.load(); } }
      if(this.hls){ this.hls.destroy(); this.hls=null; }
      this.hlsReadyPromise=null;
      this.isPlaying=false;
    },
    markStreamReady(){ this.liveStatus='live'; this.miniLiveEnabled=true; this.miniLiveClosed=false; this.$nextTick(()=>this.syncMiniLive()); },
    markStreamError(){ this.liveStatus='offline'; this.isPlaying=false; },
    handleLiveStall(){
      const video=this.$refs.liveVideo;
      if(!video || this.activeStream !== 'player'){ return; }
      this.liveStatus='buffering';
      clearTimeout(this._stallRecoveryTimer);
      this._stallRecoveryTimer = setTimeout(() => {
        if(video && !this._userManuallyPaused && this.activeStream === 'player'){
          if(video.buffered && video.buffered.length > 0){
            for(let i = 0; i < video.buffered.length; i++){
              const bStart = video.buffered.start(i);
              const bEnd = video.buffered.end(i);
              if(video.currentTime >= bStart && video.currentTime < bEnd - 0.25){
                video.currentTime = Math.min(video.currentTime + 0.2, bEnd - 0.05);
                break;
              } else if(video.currentTime < bStart && bStart - video.currentTime < 1.0){
                video.currentTime = bStart + 0.05;
                break;
              }
            }
          }
          if(this.hls){
            this.hls.startLoad();
          }
          if(video.paused && !this._userManuallyPaused){
            video.play().then(() => {
              this.liveStatus = 'live';
              this.isPlaying = true;
            }).catch(() => {});
          } else if(!video.paused){
            this.liveStatus = 'live';
          }
        }
      }, 1000);
      if(video.error && this.hls){
        this.hls.recoverMediaError();
      }
    },
    onVideoPlay(){
      this.isPlaying = true;
      this.liveStatus = 'live';
      this.acquireWakeLock();
    },
    onVideoPause(){
      if(this._userManuallyPaused){
        this.isPlaying = false;
        this.releaseWakeLock();
      } else {
        setTimeout(() => {
          const video = this.$refs.liveVideo;
          if(video && video.paused && !this._userManuallyPaused && this.activeStream === 'player' && this.route === 'live'){
            video.play().then(() => {
              this.isPlaying = true;
              this.liveStatus = 'live';
            }).catch(() => {
              this.isPlaying = false;
            });
          }
        }, 300);
      }
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
      fetch(LIVE.liveNotices + '?t=' + Date.now(), {cache:'no-store'}).then(response=>response.json()).then(data=>{
        const notice = data && data.notice ? data.notice : null;
        if(!notice || !notice.id || !notice.message){ this.liveNotice=null; return; }
        const key = 'kh_live_notice_seen_' + notice.id;
        const seenMessage = localStorage.getItem(key);
        this.liveNotice = (seenMessage === String(notice.message)) ? null : notice;
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
        localStorage.setItem('kh_live_notice_seen_' + this.liveNotice.id, String(this.liveNotice.message || ''));
      }
      this.liveNotice=null;
    }
  },
  mounted(){
    try{ this.member=JSON.parse(localStorage.getItem('kh_member') || 'null'); }catch(error){}
    this.syncRoute();
    this.loadCms();
    window.addEventListener('hashchange', this.syncRoute);
    window.addEventListener('focus', () => {
      if(this.route === 'live' && this.member && this.activeStream === 'player'){
        const video = this.$refs.liveVideo;
        if(video && !this._userManuallyPaused && video.paused){
          video.play().catch(()=>{});
        }
        this.acquireWakeLock();
      }
      this.loadCms();
    });
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'visible'){
        if(this.route === 'live' && this.member && this.activeStream === 'player'){
          const video = this.$refs.liveVideo;
          if(video && !this._userManuallyPaused && video.paused){
            video.play().catch(()=>{});
          }
          this.acquireWakeLock();
        }
      }
    });
    this.cmsRefreshTimer = setInterval(() => this.loadCms(), 20000);
    this.chatTimer=setInterval(()=>{ if(this.member){ this.loadChat(); } }, 4000);
    this.statusTimer=setInterval(()=>{ if(this.route === 'live'){ this.loadStatus(); } }, 30000);
    this.noticeTimer=setInterval(()=>{ if(this.member){ this.loadLiveNotice(); } }, 6000);
    this.presenceTimer=setInterval(()=>this.sendPresence(false), 15000);
    this.sendPresence(false);
    if(this.member){
      this.ensureAttendanceCaptured();
    }
    if('serviceWorker' in navigator){
      navigator.serviceWorker.register('sw.js').catch(()=>{});
    }
  }
}).mount('#app');
